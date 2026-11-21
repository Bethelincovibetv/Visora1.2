import fs from 'fs';
import path from 'path';
import {
  getGitHubAuthStatus,
  getGitHubRepoTree,
  getGitHubFileRawBase64,
  createGitHubRepo,
  commitFilesToGitHubRepo,
  listWorkspaceFiles,
  resolveSafeWorkspacePath,
  runGeminiCodeGen,
  parseJsonSafe,
} from './githubCodingService';

const WORKSPACE_ROOT = process.cwd();
const VERCEL_API_BASE = 'https://api.vercel.com';

const VERCEL_ENV_KEYS = [
  'VERCEL_TOKEN',
  'VERCEL_API_TOKEN',
  'VERCEL_ACCESS_TOKEN',
  'VERCEL_AUTH_TOKEN',
  'VERCEL_SECRET',
];

function readEnvFileVar(fileName: string, keys: string[]): string {
  try {
    const filePath = path.join(WORKSPACE_ROOT, fileName);
    if (!fs.existsSync(filePath)) return '';
    const content = fs.readFileSync(filePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      for (const k of keys) {
        if (trimmed.startsWith(`${k}=`)) {
          return trimmed.slice(k.length + 1).trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  } catch {
    // ignore read errors
  }
  return '';
}

export function getVercelToken(): string {
  for (const key of VERCEL_ENV_KEYS) {
    const val = process.env[key];
    if (val && val.trim()) return val.trim();
  }
  // Support secret named "VERCEL" only when it looks like an actual token (not Vercel's "1" flag)
  if (process.env.VERCEL && process.env.VERCEL.trim().length > 10) {
    return process.env.VERCEL.trim();
  }
  const fromLocal = readEnvFileVar('.env.local', [...VERCEL_ENV_KEYS, 'VERCEL']);
  if (fromLocal && fromLocal.length > 10) return fromLocal;
  const fromEnv = readEnvFileVar('.env', [...VERCEL_ENV_KEYS, 'VERCEL']);
  if (fromEnv && fromEnv.length > 10) return fromEnv;
  return '';
}

export function getVercelTeamId(explicitTeamId?: string): string | undefined {
  if (explicitTeamId && explicitTeamId.trim()) return explicitTeamId.trim();
  if (process.env.VERCEL_TEAM_ID && process.env.VERCEL_TEAM_ID.trim()) {
    return process.env.VERCEL_TEAM_ID.trim();
  }
  const fromLocal = readEnvFileVar('.env.local', ['VERCEL_TEAM_ID']);
  return fromLocal || undefined;
}

function appendTeamQuery(endpoint: string, teamId?: string): string {
  const effectiveTeamId = getVercelTeamId(teamId);
  if (!effectiveTeamId) return endpoint;
  const sep = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${sep}teamId=${encodeURIComponent(effectiveTeamId)}`;
}

async function vercelFetch<T = any>(
  endpoint: string,
  options: RequestInit & { teamId?: string } = {}
): Promise<T> {
  const token = getVercelToken();
  if (!token) {
    throw new Error(
      'Vercel token is not configured in server secrets. Add VERCEL_TOKEN to your project Secrets to enable Vercel deployments.'
    );
  }

  const url = `${VERCEL_API_BASE}${appendTeamQuery(endpoint, options.teamId)}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(options.headers as Record<string, string> || {}),
  };
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { message: text };
  }

  if (!res.ok) {
    const errMsg = json?.error?.message || json?.message || `Vercel API error (${res.status})`;
    throw new Error(`Vercel API (${res.status}): ${errMsg}`);
  }

  return json as T;
}

export function sanitizeVercelProjectName(rawName: string): string {
  const clean = rawName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[-._]+|[-._]+$/g, '')
    .slice(0, 64);

  return clean || `vixora-app-${Date.now().toString().slice(-5)}`;
}

// ============================================================================
// VERCEL ACCOUNT, PROJECTS & DEPLOYMENT STATUS
// ============================================================================

export async function getVercelAuthStatus() {
  const token = getVercelToken();
  if (!token) {
    return {
      configured: false,
      connected: false,
      user: null,
      error: 'VERCEL_TOKEN secret is not set.',
    };
  }

  try {
    const data = await vercelFetch<{ user: any }>('/v2/user');
    const u = data.user || data;
    return {
      configured: true,
      connected: true,
      user: {
        id: u.id,
        username: u.username,
        name: u.name || u.username,
        email: u.email || '',
        avatar: u.avatar ? `https://vercel.com/api/www/avatar/${u.avatar}?s=80` : undefined,
      },
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      user: null,
      error: err?.message || 'Failed to authenticate with Vercel secret token.',
    };
  }
}

export async function listVercelProjects(limit = 25, teamId?: string) {
  const data = await vercelFetch<{ projects: any[] }>(`/v9/projects?limit=${limit}`, { teamId });
  return (data.projects || []).map((p) => {
    const latest = Array.isArray(p.latestDeployments) ? p.latestDeployments[0] : null;
    const aliasHost = latest?.alias?.[0] || latest?.url;
    return {
      id: p.id,
      name: p.name,
      framework: p.framework || null,
      updatedAt: p.updatedAt,
      latestUrl: aliasHost ? `https://${aliasHost}` : undefined,
      readyState: latest?.readyState,
    };
  });
}

export async function listVercelDeployments(projectId?: string, limit = 20, teamId?: string) {
  const q = new URLSearchParams({ limit: String(limit) });
  if (projectId) q.set('projectId', projectId);
  const data = await vercelFetch<{ deployments: any[] }>(`/v6/deployments?${q.toString()}`, { teamId });
  return (data.deployments || []).map((d) => ({
    id: d.uid || d.id,
    name: d.name,
    url: d.url ? `https://${d.url}` : undefined,
    state: d.readyState || d.state,
    target: d.target,
    inspectorUrl: d.inspectorUrl,
    createdAt: d.createdAt,
  }));
}

export async function getVercelDeploymentStatus(deploymentId: string, teamId?: string) {
  const d = await vercelFetch<any>(`/v13/deployments/${encodeURIComponent(deploymentId)}`, { teamId });
  const aliasArr: string[] = Array.isArray(d.alias) ? d.alias : [];
  const primaryHost = aliasArr[0] || d.url;
  return {
    deploymentId: d.id,
    projectId: d.projectId,
    projectName: d.name,
    readyState: d.readyState,
    liveUrl: primaryHost ? `https://${primaryHost}` : undefined,
    deploymentUrl: d.url ? `https://${d.url}` : undefined,
    inspectorUrl: d.inspectorUrl,
    alias: aliasArr.map((a) => `https://${a}`),
    errorMessage: d.errorMessage || d.errorCode || undefined,
  };
}

// ============================================================================
// CORE DEPLOYMENT ENGINE (INLINE FILES -> PRODUCTION VERCEL DEPLOYMENT)
// ============================================================================

export interface VercelDeployFileInput {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

function detectVercelProjectSettings(files: VercelDeployFileInput[]) {
  const pkgFile = files.find((f) => f.path.replace(/^\/+/, '').toLowerCase() === 'package.json');
  if (!pkgFile) {
    return { framework: null as string | null };
  }
  try {
    const raw =
      pkgFile.encoding === 'base64'
        ? Buffer.from(pkgFile.content, 'base64').toString('utf8')
        : pkgFile.content;
    const pkg = JSON.parse(raw);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (deps.next) return { framework: 'nextjs' };
    if (deps.vite) return { framework: 'vite' };
    return undefined;
  } catch {
    return undefined;
  }
}

export async function deployFilesToVercel(params: {
  projectName: string;
  files: VercelDeployFileInput[];
  target?: 'production' | 'preview';
  teamId?: string;
  waitForReadyMs?: number;
}) {
  if (!params.files || params.files.length === 0) {
    throw new Error('At least one file is required to deploy to Vercel.');
  }

  const safeName = sanitizeVercelProjectName(params.projectName);
  const projectSettings = detectVercelProjectSettings(params.files);

  const vercelFiles = params.files.map((f) => ({
    file: f.path.replace(/^\/+/, ''),
    data: f.content,
    encoding: f.encoding === 'base64' ? 'base64' : 'utf-8',
  }));

  const body: any = {
    name: safeName,
    files: vercelFiles,
    target: params.target || 'production',
  };
  if (projectSettings !== undefined) {
    body.projectSettings = projectSettings;
  }

  const created = await vercelFetch<any>('/v13/deployments?skipAutoDetectionConfirmation=1', {
    method: 'POST',
    body: JSON.stringify(body),
    teamId: params.teamId,
  });

  const deploymentId = created.id;
  let latestStatus = {
    deploymentId,
    projectId: created.projectId,
    projectName: created.name || safeName,
    readyState: created.readyState || 'QUEUED',
    liveUrl:
      Array.isArray(created.alias) && created.alias[0]
        ? `https://${created.alias[0]}`
        : created.url
        ? `https://${created.url}`
        : undefined,
    deploymentUrl: created.url ? `https://${created.url}` : undefined,
    inspectorUrl: created.inspectorUrl,
    alias: Array.isArray(created.alias) ? created.alias.map((a: string) => `https://${a}`) : [],
    errorMessage: undefined as string | undefined,
  };

  // Poll briefly so static sites & fast builds return READY right inside the response
  const deadline = Date.now() + (params.waitForReadyMs ?? 18000);
  while (
    Date.now() < deadline &&
    latestStatus.readyState !== 'READY' &&
    latestStatus.readyState !== 'ERROR' &&
    latestStatus.readyState !== 'CANCELED'
  ) {
    await new Promise((r) => setTimeout(r, 1500));
    try {
      latestStatus = await getVercelDeploymentStatus(deploymentId, params.teamId);
    } catch {
      break;
    }
  }

  return latestStatus;
}

// ============================================================================
// HIGH-LEVEL AGENT DEPLOYMENT WORKFLOWS
// ============================================================================

export async function deployWebsiteOrAppToVercel(params: {
  prompt: string;
  projectName?: string;
  appType?: 'website' | 'webapp' | 'landing' | 'dashboard' | 'portfolio' | 'ecommerce';
  target?: 'production' | 'preview';
  alsoPushToGitHub?: boolean;
  githubRepoName?: string;
  isPrivate?: boolean;
  teamId?: string;
}) {
  // Verify Vercel token first before spending tokens generating code
  const vercelAuth = await getVercelAuthStatus();
  if (!vercelAuth.connected) {
    throw new Error(vercelAuth.error || 'Vercel secret token is not configured.');
  }

  const slugFromPrompt = params.prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');

  const safeProjectName = sanitizeVercelProjectName(
    params.projectName || params.githubRepoName || slugFromPrompt || `vixora-web-${Date.now().toString().slice(-4)}`
  );

  const architectPrompt = `You are an elite Principal Product Designer and Full-Stack Web Architect.
Build a complete, responsive, production-ready ${params.appType || 'website / web application'} ready to deploy immediately on Vercel for the user's request:
"${params.prompt}"

REQUIREMENTS:
1. Produce clean, well-structured static/client web files ready for instant Vercel production hosting (index.html, styles.css, app.js, vercel.json if helpful, README.md). Use relative paths (./styles.css, ./app.js) so every asset loads cleanly on Vercel.
2. Also produce a "previewHtml" field containing a self-contained single-file HTML document (inline CSS & JS or Tailwind CDN) that renders the exact interactive app inside a sandboxed preview iframe.
3. Design must look world-class (Stripe / Linear / Apple quality): clean typography, responsive mobile & desktop layout, rich interactive controls, realistic copy, zero placeholder TODOs.
4. Return ONLY valid JSON:
{
  "appTitle": "Short Project Title",
  "summary": "2-sentence overview of architecture and features built",
  "commitMessage": "feat: ...",
  "files": [
    { "path": "index.html", "content": "..." },
    { "path": "styles.css", "content": "..." },
    { "path": "app.js", "content": "..." },
    { "path": "README.md", "content": "..." }
  ],
  "previewHtml": "<!DOCTYPE html><html>...</html>"
}`;

  const rawJson = await runGeminiCodeGen(architectPrompt);
  const generated = parseJsonSafe<{
    appTitle: string;
    summary: string;
    commitMessage?: string;
    files: Array<{ path: string; content: string }>;
    previewHtml?: string;
  }>(rawJson);

  if (!generated.files || generated.files.length === 0) {
    throw new Error('Code generator returned no files.');
  }

  // Deploy directly to Vercel
  const deployment = await deployFilesToVercel({
    projectName: safeProjectName,
    files: generated.files.map((f) => ({ path: f.path, content: f.content, encoding: 'utf-8' })),
    target: params.target || 'production',
    teamId: params.teamId,
  });

  // Optionally mirror source code to GitHub if requested and GitHub is connected
  let githubInfo: {
    fullName?: string;
    repoUrl?: string;
    commitSha?: string;
    commitUrl?: string;
    error?: string;
  } | null = null;

  if (params.alsoPushToGitHub) {
    try {
      const ghAuth = await getGitHubAuthStatus();
      if (ghAuth.connected && ghAuth.user) {
        const repoSlug = (params.githubRepoName || safeProjectName).replace(/[^a-zA-Z0-9._-]/g, '-');
        const createdRepo = await createGitHubRepo({
          name: repoSlug,
          description: `${generated.appTitle || safeProjectName} deployed to Vercel by Vixora Agent`,
          isPrivate: params.isPrivate ?? false,
          autoInit: true,
        });
        const commitRes = await commitFilesToGitHubRepo({
          fullName: createdRepo.full_name,
          branch: createdRepo.default_branch,
          message: generated.commitMessage || `feat: build & deploy ${generated.appTitle || safeProjectName}`,
          files: generated.files,
        });
        githubInfo = {
          fullName: createdRepo.full_name,
          repoUrl: commitRes.repoUrl,
          commitSha: commitRes.commitSha,
          commitUrl: commitRes.commitUrl,
        };
      }
    } catch (ghErr: any) {
      githubInfo = { error: ghErr?.message || 'GitHub mirror skipped' };
    }
  }

  const indexFile = generated.files.find((f) => f.path.toLowerCase() === 'index.html');
  const previewHtml = generated.previewHtml || indexFile?.content || '';

  return {
    appTitle: generated.appTitle || safeProjectName,
    summary:
      generated.summary ||
      `Built ${generated.files.length} files and deployed "${safeProjectName}" to Vercel (${deployment.readyState}).`,
    projectName: deployment.projectName,
    deploymentId: deployment.deploymentId,
    readyState: deployment.readyState,
    liveUrl: deployment.liveUrl,
    deploymentUrl: deployment.deploymentUrl,
    inspectorUrl: deployment.inspectorUrl,
    errorMessage: deployment.errorMessage,
    files: generated.files,
    previewHtml,
    github: githubInfo,
  };
}

export async function deployGitHubRepoToVercel(params: {
  fullName: string;
  projectName?: string;
  branch?: string;
  target?: 'production' | 'preview';
  teamId?: string;
}) {
  const vercelAuth = await getVercelAuthStatus();
  if (!vercelAuth.connected) {
    throw new Error(vercelAuth.error || 'Vercel secret token is not configured.');
  }

  const treeRes = await getGitHubRepoTree(params.fullName, params.branch);
  const branch = treeRes.default_branch;

  const eligibleBlobs = treeRes.files
    .filter((f: any) => {
      if (f.type !== 'blob') return false;
      const p = String(f.path || '');
      if (
        p.startsWith('.git/') ||
        p.includes('node_modules/') ||
        p.startsWith('dist/') ||
        p.startsWith('.env') ||
        p.endsWith('.local') ||
        (f.size || 0) > 1_500_000
      ) {
        return false;
      }
      return true;
    })
    .slice(0, 80);

  if (eligibleBlobs.length === 0) {
    throw new Error(`No deployable files found in GitHub repository "${params.fullName}".`);
  }

  const deployFiles: VercelDeployFileInput[] = [];
  for (const blob of eligibleBlobs) {
    try {
      const fileData = await getGitHubFileRawBase64(params.fullName, blob.path, branch);
      if (!fileData.isDirectory && fileData.base64) {
        deployFiles.push({
          path: fileData.path,
          content: fileData.base64,
          encoding: 'base64',
        });
      }
    } catch {
      // skip unreadable files
    }
  }

  const repoShortName = params.fullName.split('/')[1] || params.fullName;
  const targetName = sanitizeVercelProjectName(params.projectName || repoShortName);

  const deployment = await deployFilesToVercel({
    projectName: targetName,
    files: deployFiles,
    target: params.target || 'production',
    teamId: params.teamId,
  });

  return {
    appTitle: `${params.fullName} → Vercel`,
    summary: `Deployed ${deployFiles.length} files from GitHub repo ${params.fullName} (${branch}) to Vercel (${deployment.readyState}).`,
    fullName: params.fullName,
    repoUrl: treeRes.html_url,
    branch,
    projectName: deployment.projectName,
    deploymentId: deployment.deploymentId,
    readyState: deployment.readyState,
    liveUrl: deployment.liveUrl,
    deploymentUrl: deployment.deploymentUrl,
    inspectorUrl: deployment.inspectorUrl,
    errorMessage: deployment.errorMessage,
    fileCount: deployFiles.length,
  };
}

export async function deployVixoraWorkspaceToVercel(params?: {
  projectName?: string;
  target?: 'production' | 'preview';
  teamId?: string;
}) {
  const vercelAuth = await getVercelAuthStatus();
  if (!vercelAuth.connected) {
    throw new Error(vercelAuth.error || 'Vercel secret token is not configured.');
  }

  const allPaths = listWorkspaceFiles();
  const deployFiles: VercelDeployFileInput[] = [];

  for (const relPath of allPaths) {
    try {
      const abs = resolveSafeWorkspacePath(relPath);
      const stat = fs.statSync(abs);
      if (stat.size > 2_000_000) continue;
      const buf = fs.readFileSync(abs);
      deployFiles.push({
        path: relPath,
        content: buf.toString('base64'),
        encoding: 'base64',
      });
    } catch {
      // skip restricted or unreadable files
    }
  }

  const targetName = sanitizeVercelProjectName(params?.projectName || 'vixora-studio');
  const deployment = await deployFilesToVercel({
    projectName: targetName,
    files: deployFiles,
    target: params?.target || 'production',
    teamId: params?.teamId,
  });

  return {
    appTitle: 'Vixora Studio → Vercel',
    summary: `Deployed ${deployFiles.length} Vixora workspace files to Vercel (${deployment.readyState}).`,
    projectName: deployment.projectName,
    deploymentId: deployment.deploymentId,
    readyState: deployment.readyState,
    liveUrl: deployment.liveUrl,
    deploymentUrl: deployment.deploymentUrl,
    inspectorUrl: deployment.inspectorUrl,
    errorMessage: deployment.errorMessage,
    fileCount: deployFiles.length,
  };
}
