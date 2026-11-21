import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getGemini } from './serverVideoEngine';

const execAsync = promisify(exec);

// Runtime GitHub token cache (server-side only, never exposed to browser)
let runtimeGitHubToken: string = '';

const WORKSPACE_ROOT = process.cwd();
const ENV_LOCAL_PATH = path.join(WORKSPACE_ROOT, '.env.local');

const BLOCKED_PATH_SEGMENTS = [
  '.git',
  'node_modules',
  'dist',
  'dist-ssr',
  'bun.lock',
  '.env',
  '.env.local',
  '.env.production',
  'firebase-applet-config.json',
];

function isBlockedFileOrDir(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!normalized || normalized.includes('..')) return true;
  const parts = normalized.split('/');
  for (const part of parts) {
    if (
      BLOCKED_PATH_SEGMENTS.includes(part) ||
      part.endsWith('.local') ||
      part.startsWith('.env') ||
      part.startsWith('temp_video_job_')
    ) {
      return true;
    }
  }
  return false;
}

export function resolveSafeWorkspacePath(relPath: string): string {
  const cleanRel = relPath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (isBlockedFileOrDir(cleanRel)) {
    throw new Error(`Access to restricted path "${relPath}" is not permitted.`);
  }
  const abs = path.resolve(WORKSPACE_ROOT, cleanRel);
  if (!abs.startsWith(WORKSPACE_ROOT + path.sep) && abs !== WORKSPACE_ROOT) {
    throw new Error(`Path traversal outside workspace root is not permitted: "${relPath}"`);
  }
  return abs;
}

function readTokenFromEnvLocal(): string {
  try {
    if (!fs.existsSync(ENV_LOCAL_PATH)) return '';
    const content = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (trimmed.startsWith('GITHUB_TOKEN=')) {
        return trimmed.slice('GITHUB_TOKEN='.length).trim().replace(/^["']|["']$/g, '');
      }
      if (trimmed.startsWith('GITHUB_PAT=')) {
        return trimmed.slice('GITHUB_PAT='.length).trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // ignore read errors
  }
  return '';
}

export function getGitHubToken(): string {
  if (runtimeGitHubToken) return runtimeGitHubToken;
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim();
  if (process.env.GITHUB_PAT) return process.env.GITHUB_PAT.trim();
  const localToken = readTokenFromEnvLocal();
  if (localToken) {
    runtimeGitHubToken = localToken;
    return localToken;
  }
  return '';
}

export function setGitHubToken(token: string): void {
  const clean = token.trim();
  runtimeGitHubToken = clean;
  try {
    let existing = '';
    if (fs.existsSync(ENV_LOCAL_PATH)) {
      existing = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
    }
    const lines = existing
      .split(/\r?\n/)
      .filter((l) => !l.trim().startsWith('GITHUB_TOKEN=') && !l.trim().startsWith('GITHUB_PAT='));
    if (clean) {
      lines.push(`GITHUB_TOKEN=${clean}`);
    }
    const nextContent = lines.filter((l, idx) => l.length > 0 || idx === 0).join('\n') + '\n';
    fs.writeFileSync(ENV_LOCAL_PATH, nextContent, 'utf8');
  } catch (err) {
    console.warn('[GitHubService] Could not persist token to .env.local:', err);
  }
}

export function clearGitHubToken(): void {
  setGitHubToken('');
}

async function githubFetch<T = any>(
  endpoint: string,
  options: RequestInit & { tokenOverride?: string } = {}
): Promise<T> {
  const token = (options.tokenOverride || getGitHubToken()).trim();
  if (!token) {
    throw new Error('GitHub token is not configured. Connect your GitHub Personal Access Token first.');
  }

  const url = endpoint.startsWith('http') ? endpoint : `https://api.github.com${endpoint}`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Vixora-Coding-Agent',
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
    const msg = json?.message || `GitHub API error (${res.status})`;
    throw new Error(`GitHub API (${res.status}): ${msg}`);
  }

  return json as T;
}

// ============================================================================
// GITHUB USER & REPOSITORY MANAGEMENT
// ============================================================================

export async function getGitHubAuthStatus(tokenOverride?: string) {
  const token = (tokenOverride || getGitHubToken()).trim();
  if (!token) {
    return { connected: false, user: null };
  }
  try {
    const user = await githubFetch('/user', { tokenOverride: token });
    return {
      connected: true,
      user: {
        login: user.login,
        name: user.name || user.login,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        public_repos: user.public_repos ?? 0,
        total_private_repos: user.total_private_repos ?? 0,
      },
    };
  } catch (err: any) {
    return {
      connected: false,
      user: null,
      error: err?.message || 'GitHub authentication failed',
    };
  }
}

export async function listGitHubRepos(perPage = 40) {
  const repos = await githubFetch<any[]>(`/user/repos?sort=updated&affiliation=owner,collaborator&per_page=${perPage}`);
  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    owner: r.owner?.login,
    private: !!r.private,
    description: r.description || '',
    html_url: r.html_url,
    default_branch: r.default_branch || 'main',
    language: r.language || 'Unknown',
    updated_at: r.updated_at,
    has_pages: !!r.has_pages,
    is_vixora_repo:
      String(r.name || '').toLowerCase().includes('vixora') ||
      String(r.description || '').toLowerCase().includes('vixora'),
  }));
}

export async function createGitHubRepo(params: {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
}) {
  const sanitizedName = params.name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '');

  if (!sanitizedName) {
    throw new Error('A valid repository name is required.');
  }

  const repo = await githubFetch('/user/repos', {
    method: 'POST',
    body: JSON.stringify({
      name: sanitizedName,
      description: params.description || 'Created by Vixora Coding Agent',
      private: params.isPrivate ?? false,
      auto_init: params.autoInit ?? true,
    }),
  });

  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    owner: repo.owner?.login,
    private: !!repo.private,
    description: repo.description || '',
    html_url: repo.html_url,
    default_branch: repo.default_branch || 'main',
  };
}

export async function getGitHubRepoTree(fullName: string, branch?: string) {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error('Repository must be formatted as "owner/repo".');

  const repoInfo = await githubFetch(`/repos/${owner}/${repo}`);
  const targetBranch = branch || repoInfo.default_branch || 'main';

  try {
    const refData = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${targetBranch}`);
    const commitSha = refData.object?.sha;
    const treeData = await githubFetch(`/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`);
    const items = (treeData.tree || [])
      .filter((item: any) => item.type === 'blob' || item.type === 'tree')
      .map((item: any) => ({
        path: item.path,
        type: item.type,
        size: item.size || 0,
      }));
    return {
      full_name: repoInfo.full_name,
      default_branch: targetBranch,
      html_url: repoInfo.html_url,
      files: items,
    };
  } catch {
    return {
      full_name: repoInfo.full_name,
      default_branch: targetBranch,
      html_url: repoInfo.html_url,
      files: [],
    };
  }
}

export async function getGitHubFileContent(fullName: string, filePath: string, ref?: string) {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error('Repository must be formatted as "owner/repo".');

  const cleanPath = filePath.replace(/^\/+/, '');
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const data = await githubFetch(`/repos/${owner}/${repo}/contents/${cleanPath}${query}`);

  if (Array.isArray(data)) {
    return {
      isDirectory: true,
      path: cleanPath,
      entries: data.map((d: any) => ({ name: d.name, path: d.path, type: d.type })),
      content: '',
    };
  }

  const decoded = data.content
    ? Buffer.from(data.content, 'base64').toString('utf8')
    : '';

  return {
    isDirectory: false,
    path: data.path,
    sha: data.sha,
    size: data.size,
    html_url: data.html_url,
    content: decoded,
  };
}

export async function getGitHubFileRawBase64(fullName: string, filePath: string, ref?: string) {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error('Repository must be formatted as "owner/repo".');

  const cleanPath = filePath.replace(/^\/+/, '');
  const query = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const data = await githubFetch(`/repos/${owner}/${repo}/contents/${cleanPath}${query}`);

  if (Array.isArray(data)) {
    return { isDirectory: true, path: cleanPath, base64: '', size: 0 };
  }

  return {
    isDirectory: false,
    path: data.path,
    size: data.size || 0,
    base64: String(data.content || '').replace(/\n/g, ''),
  };
}

export interface CommitFileSpec {
  path: string;
  content: string;
  encoding?: 'utf-8' | 'base64';
}

export async function commitFilesToGitHubRepo(params: {
  fullName: string;
  branch?: string;
  message: string;
  files: CommitFileSpec[];
}) {
  const [owner, repo] = params.fullName.split('/');
  if (!owner || !repo) throw new Error('Repository must be formatted as "owner/repo".');
  if (!params.files || params.files.length === 0) {
    throw new Error('At least one file is required to commit.');
  }

  const repoInfo = await githubFetch(`/repos/${owner}/${repo}`);
  const branch = params.branch || repoInfo.default_branch || 'main';

  // Check if branch exists yet (empty repo check)
  let baseCommitSha: string | null = null;
  let baseTreeSha: string | null = null;

  try {
    const refData = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    baseCommitSha = refData.object?.sha;
    if (baseCommitSha) {
      const commitData = await githubFetch(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
      baseTreeSha = commitData.tree?.sha || null;
    }
  } catch {
    baseCommitSha = null;
  }

  // If repository is completely empty, bootstrap first file via Contents API
  if (!baseCommitSha) {
    const firstFile = params.files[0];
    const encodedContent =
      firstFile.encoding === 'base64'
        ? firstFile.content
        : Buffer.from(firstFile.content, 'utf8').toString('base64');

    await githubFetch(`/repos/${owner}/${repo}/contents/${firstFile.path.replace(/^\/+/, '')}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: params.files.length === 1 ? params.message : `Initial commit: ${firstFile.path}`,
        content: encodedContent,
        branch,
      }),
    });

    if (params.files.length === 1) {
      const refAfter = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
      const commitSha = refAfter.object?.sha;
      return {
        full_name: params.fullName,
        branch,
        commitSha,
        commitUrl: `https://github.com/${params.fullName}/commit/${commitSha}`,
        repoUrl: `https://github.com/${params.fullName}`,
        filesCommitted: [firstFile.path],
      };
    }

    const refData = await githubFetch(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    baseCommitSha = refData.object?.sha;
    const commitData = await githubFetch(`/repos/${owner}/${repo}/git/commits/${baseCommitSha}`);
    baseTreeSha = commitData.tree?.sha || null;
  }

  // Create blobs for all files cleanly
  const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = [];
  for (const file of params.files) {
    const cleanPath = file.path.replace(/^\/+/, '');
    const blob = await githubFetch(`/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: file.content,
        encoding: file.encoding === 'base64' ? 'base64' : 'utf-8',
      }),
    });
    treeEntries.push({
      path: cleanPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha,
    });
  }

  const newTree = await githubFetch(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      ...(baseTreeSha ? { base_tree: baseTreeSha } : {}),
      tree: treeEntries,
    }),
  });

  const newCommit = await githubFetch(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: params.message,
      tree: newTree.sha,
      parents: baseCommitSha ? [baseCommitSha] : [],
    }),
  });

  await githubFetch(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false,
    }),
  });

  return {
    full_name: params.fullName,
    branch,
    commitSha: newCommit.sha,
    commitUrl: `https://github.com/${params.fullName}/commit/${newCommit.sha}`,
    repoUrl: `https://github.com/${params.fullName}`,
    filesCommitted: params.files.map((f) => f.path.replace(/^\/+/, '')),
  };
}

export async function enableGitHubPages(fullName: string, branch = 'main') {
  const [owner, repo] = fullName.split('/');
  if (!owner || !repo) throw new Error('Invalid repository name.');
  try {
    const res = await githubFetch(`/repos/${owner}/${repo}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        source: { branch, path: '/' },
      }),
    });
    return {
      enabled: true,
      pagesUrl: res.html_url || `https://${owner}.github.io/${repo}/`,
    };
  } catch (err: any) {
    return {
      enabled: false,
      pagesUrl: `https://${owner}.github.io/${repo}/`,
      note: err?.message,
    };
  }
}

// ============================================================================
// AI SOFTWARE ARCHITECT: BUILD WEBSITES / APPS & MODIFY GITHUB REPOS
// ============================================================================

export async function runGeminiCodeGen(prompt: string): Promise<string> {
  const ai = getGemini();
  const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash'];
  let lastErr: any = null;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });
      if (response.text) return response.text;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Gemini code generation failed.');
}

export function parseJsonSafe<T = any>(raw: string): T {
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

export async function buildWebsiteOrAppOnGitHub(params: {
  prompt: string;
  repoName?: string;
  existingRepoFullName?: string;
  appType?: 'website' | 'webapp' | 'landing' | 'dashboard' | 'portfolio' | 'ecommerce';
  isPrivate?: boolean;
  deployPages?: boolean;
}) {
  const auth = await getGitHubAuthStatus();
  if (!auth.connected || !auth.user) {
    throw new Error(auth.error || 'GitHub is not connected.');
  }

  const slugFromPrompt = params.prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 4)
    .join('-');

  const desiredRepoName = (params.repoName || slugFromPrompt || `vixora-app-${Date.now().toString().slice(-4)}`)
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(0, 50);

  let targetFullName = params.existingRepoFullName?.trim() || '';
  let targetBranch = 'main';
  let repoUrl = '';
  let wasCreated = false;

  if (!targetFullName) {
    // Check if repo already exists under this user or create a fresh one
    try {
      const existing = await githubFetch(`/repos/${auth.user.login}/${desiredRepoName}`);
      targetFullName = existing.full_name;
      targetBranch = existing.default_branch || 'main';
      repoUrl = existing.html_url;
    } catch {
      const created = await createGitHubRepo({
        name: desiredRepoName,
        description: `${params.appType || 'Web App'} built autonomously by Vixora Coding Agent: ${params.prompt.slice(0, 120)}`,
        isPrivate: params.isPrivate ?? false,
        autoInit: true,
      });
      targetFullName = created.full_name;
      targetBranch = created.default_branch || 'main';
      repoUrl = created.html_url;
      wasCreated = true;
    }
  } else {
    const info = await githubFetch(`/repos/${targetFullName}`);
    targetBranch = info.default_branch || 'main';
    repoUrl = info.html_url;
  }

  const architectPrompt = `You are an elite Principal Product Designer and Full-Stack Software Engineer.
Build a complete, visually stunning, responsive, production-ready ${params.appType || 'web application / website'} for the user's request:
"${params.prompt}"

REQUIREMENTS:
1. Produce clean, well-structured project files ready to run directly in any browser or GitHub Pages (index.html, styles.css, app.js, README.md, plus any supporting files if needed).
2. Also produce a "previewHtml" field containing a self-contained single-file HTML document (inline CSS & JS or Tailwind CDN) that renders the complete interactive website/app immediately inside a sandboxed preview iframe with zero broken local imports.
3. Design must look world-class (Stripe / Linear / Apple quality): clean typography, responsive layout, smooth interactions, realistic sample copy, working interactive UI state (forms, filters, modals, calculators, or tabs as appropriate), and zero placeholder TODOs.
4. Return ONLY valid JSON in this exact schema:
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
    commitMessage: string;
    files: Array<{ path: string; content: string }>;
    previewHtml?: string;
  }>(rawJson);

  if (!generated.files || generated.files.length === 0) {
    throw new Error('Code generator returned no files.');
  }

  const commitRes = await commitFilesToGitHubRepo({
    fullName: targetFullName,
    branch: targetBranch,
    message: generated.commitMessage || `feat: build ${generated.appTitle || desiredRepoName}`,
    files: generated.files,
  });

  let pagesInfo: { enabled: boolean; pagesUrl?: string } | null = null;
  if (params.deployPages && !(params.isPrivate ?? false)) {
    pagesInfo = await enableGitHubPages(targetFullName, targetBranch);
  }

  const indexFile = generated.files.find((f) => f.path.toLowerCase() === 'index.html');
  const previewHtml = generated.previewHtml || indexFile?.content || '';

  return {
    appTitle: generated.appTitle || desiredRepoName,
    summary: generated.summary || `Built and pushed ${generated.files.length} files to ${targetFullName}.`,
    fullName: targetFullName,
    repoUrl: repoUrl || commitRes.repoUrl,
    branch: targetBranch,
    commitSha: commitRes.commitSha,
    commitUrl: commitRes.commitUrl,
    wasCreated,
    pagesUrl: pagesInfo?.enabled ? pagesInfo.pagesUrl : undefined,
    files: generated.files,
    previewHtml,
  };
}

export async function modifyGitHubRepo(params: {
  fullName: string;
  instruction: string;
  branch?: string;
  targetFilePaths?: string[];
}) {
  const treeResult = await getGitHubRepoTree(params.fullName, params.branch);
  const branch = treeResult.default_branch;

  const candidatePaths =
    params.targetFilePaths && params.targetFilePaths.length > 0
      ? params.targetFilePaths
      : treeResult.files
          .filter(
            (f: any) =>
              f.type === 'blob' &&
              /\.(tsx?|jsx?|html|css|json|md|py|js)$/i.test(f.path) &&
              !f.path.includes('lock') &&
              (f.size || 0) < 60000
          )
          .slice(0, 12)
          .map((f: any) => f.path);

  const fileSnapshots: Array<{ path: string; content: string }> = [];
  for (const filePath of candidatePaths) {
    try {
      const fileData = await getGitHubFileContent(params.fullName, filePath, branch);
      if (!fileData.isDirectory && fileData.content.length < 45000) {
        fileSnapshots.push({ path: filePath, content: fileData.content });
      }
    } catch {
      // skip unreadable files
    }
  }

  const treeSummary = treeResult.files
    .slice(0, 80)
    .map((f: any) => `${f.type === 'tree' ? '[DIR]' : '[FILE]'} ${f.path}`)
    .join('\n');

  const filesContext = fileSnapshots
    .map((f) => `--- FILE: ${f.path} ---\n${f.content}\n`)
    .join('\n');

  const editPrompt = `You are an elite Senior Software Engineer modifying GitHub repository "${params.fullName}" (branch: ${branch}).

USER REQUEST:
"${params.instruction}"

REPOSITORY STRUCTURE:
${treeSummary}

INSPECTED FILES:
${filesContext}

TASK:
Implement the requested changes cleanly, safely, and completely.
Only return files you are creating or modifying, with complete updated file contents (never truncated or using "..." placeholders).
If an index.html or web UI exists/was updated, optionally include a standalone "previewHtml" if helpful.
Return ONLY valid JSON:
{
  "summary": "Clear summary of changes implemented",
  "commitMessage": "feat/fix: concise commit message",
  "files": [
    { "path": "relative/path.ext", "content": "complete updated file content" }
  ],
  "previewHtml": ""
}`;

  const rawJson = await runGeminiCodeGen(editPrompt);
  const plan = parseJsonSafe<{
    summary: string;
    commitMessage: string;
    files: Array<{ path: string; content: string }>;
    previewHtml?: string;
  }>(rawJson);

  if (!plan.files || plan.files.length === 0) {
    throw new Error('No file modifications were generated.');
  }

  const commitRes = await commitFilesToGitHubRepo({
    fullName: params.fullName,
    branch,
    message: plan.commitMessage || `chore: update ${params.fullName} via Vixora Coding Agent`,
    files: plan.files,
  });

  return {
    appTitle: params.fullName,
    summary: plan.summary,
    fullName: params.fullName,
    repoUrl: treeResult.html_url,
    branch,
    commitSha: commitRes.commitSha,
    commitUrl: commitRes.commitUrl,
    files: plan.files,
    previewHtml: plan.previewHtml || '',
  };
}

// ============================================================================
// SELF-UPDATE & SELF-HEAL ENGINE FOR LOCAL VIXORA WORKSPACE + GITHUB SYNC
// ============================================================================

export function listWorkspaceFiles(dir = WORKSPACE_ROOT, baseRel = ''): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const rel = baseRel ? `${baseRel}/${entry.name}` : entry.name;
    if (isBlockedFileOrDir(rel)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listWorkspaceFiles(abs, rel));
    } else if (entry.isFile()) {
      results.push(rel);
    }
  }
  return results.sort();
}

export function readWorkspaceFile(relPath: string): { path: string; content: string; size: number } {
  const abs = resolveSafeWorkspacePath(relPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`File "${relPath}" does not exist in workspace.`);
  }
  const content = fs.readFileSync(abs, 'utf8');
  return {
    path: relPath.replace(/^\/+/, ''),
    content,
    size: Buffer.byteLength(content, 'utf8'),
  };
}

export async function runWorkspaceDiagnostics(): Promise<{
  ok: boolean;
  errors: string[];
  rawOutput: string;
  checkedAt: string;
}> {
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
      cwd: WORKSPACE_ROOT,
      timeout: 45000,
    });
    const combined = `${stdout || ''}\n${stderr || ''}`.trim();
    return {
      ok: true,
      errors: [],
      rawOutput: combined || 'TypeScript check passed with 0 errors.',
      checkedAt: new Date().toISOString(),
    };
  } catch (err: any) {
    const out = `${err?.stdout || ''}\n${err?.stderr || ''}\n${err?.message || ''}`.trim();
    const errorLines = out
      .split(/\r?\n/)
      .filter((l) => /error TS\d+|SyntaxError|Cannot find|TypeError/i.test(l));
    return {
      ok: false,
      errors: errorLines.length > 0 ? errorLines : [out.slice(0, 1200)],
      rawOutput: out.slice(0, 4000),
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function pushWorkspaceToGitHub(params: {
  fullName?: string;
  newRepoName?: string;
  commitMessage?: string;
  isPrivate?: boolean;
}) {
  const auth = await getGitHubAuthStatus();
  if (!auth.connected || !auth.user) {
    throw new Error(auth.error || 'GitHub is not connected.');
  }

  let targetFullName = params.fullName?.trim() || '';
  let targetBranch = 'main';
  let repoUrl = '';

  if (!targetFullName) {
    const repoName = (params.newRepoName || 'vixora-studio').replace(/[^a-zA-Z0-9._-]/g, '-');
    try {
      const existing = await githubFetch(`/repos/${auth.user.login}/${repoName}`);
      targetFullName = existing.full_name;
      targetBranch = existing.default_branch || 'main';
      repoUrl = existing.html_url;
    } catch {
      const created = await createGitHubRepo({
        name: repoName,
        description: 'Vixora AI Studio — Automated Video & Coding Agent Platform',
        isPrivate: params.isPrivate ?? true,
        autoInit: true,
      });
      targetFullName = created.full_name;
      targetBranch = created.default_branch || 'main';
      repoUrl = created.html_url;
    }
  } else {
    const info = await githubFetch(`/repos/${targetFullName}`);
    targetBranch = info.default_branch || 'main';
    repoUrl = info.html_url;
  }

  const allFiles = listWorkspaceFiles();
  const sourceFiles = allFiles.filter(
    (f) =>
      /\.(ts|tsx|js|jsx|json|html|css|md|rules|example)$/i.test(f) ||
      f === 'Dockerfile'
  );

  const commitFiles: CommitFileSpec[] = [];
  for (const rel of sourceFiles.slice(0, 80)) {
    try {
      const abs = resolveSafeWorkspacePath(rel);
      const stat = fs.statSync(abs);
      if (stat.size > 400000) continue; // skip oversized blobs
      const content = fs.readFileSync(abs, 'utf8');
      commitFiles.push({ path: rel, content });
    } catch {
      // skip blocked or unreadable files
    }
  }

  const commitRes = await commitFilesToGitHubRepo({
    fullName: targetFullName,
    branch: targetBranch,
    message: params.commitMessage || 'chore: sync Vixora Studio source via Vixora Coding Agent',
    files: commitFiles,
  });

  return {
    appTitle: targetFullName,
    summary: `Synced ${commitFiles.length} Vixora workspace source files to ${targetFullName} (secrets & .env files excluded).`,
    fullName: targetFullName,
    repoUrl: repoUrl || commitRes.repoUrl,
    branch: targetBranch,
    commitSha: commitRes.commitSha,
    commitUrl: commitRes.commitUrl,
    files: commitFiles.map((f) => ({ path: f.path, content: f.content.slice(0, 2500) })),
  };
}

export async function selfDiagnoseAndUpdateVixora(params: {
  issueDescription?: string;
  targetFiles?: string[];
  autoApply?: boolean;
  pushToGitHubRepo?: string;
}) {
  const initialDiag = await runWorkspaceDiagnostics();
  const allWorkspaceFiles = listWorkspaceFiles();

  // Pick relevant files from TypeScript error output, explicit targetFiles, or core app modules
  const errorFileMatches = new Set<string>();
  for (const line of initialDiag.errors) {
    const match = line.match(/^([^\s(]+\.(?:tsx?|jsx?))\(/);
    if (match && match[1]) {
      errorFileMatches.add(match[1].replace(/^\.\//, ''));
    }
  }

  const explicitMatches = (params.targetFiles || []).map((f) => f.replace(/^\/+/, ''));
  const combinedTargets = Array.from(new Set([...explicitMatches, ...errorFileMatches]));

  // If no explicit file or tsc error pointed to a file, inspect key smaller modules or match keywords from issueDescription
  if (combinedTargets.length === 0 && params.issueDescription) {
    const q = params.issueDescription.toLowerCase();
    for (const f of allWorkspaceFiles) {
      if (
        (q.includes('chat') && f.includes('VixoraTextChatPanel')) ||
        (q.includes('navbar') && f.includes('VixoraNavbar')) ||
        (q.includes('tool') && f.includes('vixoraAgentTools')) ||
        (q.includes('server') && f.includes('server.ts')) ||
        (q.includes('github') && f.includes('githubCodingService')) ||
        (q.includes('flyer') && f.includes('Flyer')) ||
        (q.includes('video') && f.includes('serverVideoEngine'))
      ) {
        combinedTargets.push(f);
      }
    }
  }

  if (combinedTargets.length === 0) {
    // Healthy workspace diagnostic report
    if (initialDiag.ok && !params.issueDescription) {
      return {
        status: 'healthy',
        diagnosticsBefore: initialDiag,
        diagnosticsAfter: initialDiag,
        applied: false,
        rolledBack: false,
        summary: 'Vixora self-diagnostic check completed: TypeScript compiler passed with 0 errors across the workspace.',
        files: [] as Array<{ path: string; content: string; reason?: string }>,
        repoSync: null as any,
      };
    }
  }

  const inspected: Array<{ path: string; content: string }> = [];
  for (const rel of combinedTargets.slice(0, 6)) {
    try {
      const data = readWorkspaceFile(rel);
      if (data.content.length <= 120000) {
        inspected.push({ path: data.path, content: data.content });
      }
    } catch {
      // skip inaccessible
    }
  }

  const fileListText = allWorkspaceFiles.slice(0, 60).join('\n');
  const inspectedText = inspected
    .map((f) => `--- FILE: ${f.path} ---\n${f.content}\n`)
    .join('\n');

  const repairPrompt = `You are Vixora's Self-Healing Software Engineering Core.
TASK: Diagnose problems or implement requested upgrades in the Vixora codebase safely without breaking existing functionality.

WORKSPACE DIAGNOSTICS (tsc --noEmit):
OK: ${initialDiag.ok}
ERRORS:
${initialDiag.errors.length > 0 ? initialDiag.errors.join('\n') : 'None detected by tsc'}

USER REQUEST / REPORTED PROBLEM:
${params.issueDescription || 'Fix all detected TypeScript or runtime problems.'}

WORKSPACE FILES:
${fileListText}

INSPECTED FILE CONTENTS:
${inspectedText}

INSTRUCTIONS:
1. If there are TypeScript/code problems OR the user requested a concrete update that can be cleanly applied to one of the inspected files (or a new modular helper file), provide the exact complete file contents for each modified/created file.
2. NEVER delete existing features or introduce placeholder TODOs.
3. NEVER write secrets or touch .env files.
4. If everything is already healthy and no code change is needed, return "files": [].
5. Return ONLY valid JSON:
{
  "diagnosis": "Root cause analysis or architectural plan",
  "summary": "Concise summary of fixes or verification",
  "files": [
    { "path": "relative/path.ts", "reason": "Why changed", "content": "COMPLETE updated file content" }
  ]
}`;

  const rawJson = await runGeminiCodeGen(repairPrompt);
  const repairPlan = parseJsonSafe<{
    diagnosis: string;
    summary: string;
    files: Array<{ path: string; reason?: string; content: string }>;
  }>(rawJson);

  const proposedFiles = repairPlan.files || [];
  let applied = false;
  let rolledBack = false;
  let diagnosticsAfter = initialDiag;

  if ((params.autoApply ?? true) && proposedFiles.length > 0) {
    const backups: Array<{ path: string; existed: boolean; content: string }> = [];

    try {
      for (const pf of proposedFiles) {
        const abs = resolveSafeWorkspacePath(pf.path);
        const existed = fs.existsSync(abs);
        const prevContent = existed ? fs.readFileSync(abs, 'utf8') : '';
        backups.push({ path: pf.path, existed, content: prevContent });

        const dir = path.dirname(abs);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(abs, pf.content, 'utf8');
      }

      diagnosticsAfter = await runWorkspaceDiagnostics();
      if (!diagnosticsAfter.ok) {
        // Roll back automatically if our patch broke compilation
        for (const b of backups) {
          const abs = resolveSafeWorkspacePath(b.path);
          if (b.existed) {
            fs.writeFileSync(abs, b.content, 'utf8');
          } else if (fs.existsSync(abs)) {
            fs.unlinkSync(abs);
          }
        }
        rolledBack = true;
        applied = false;
      } else {
        applied = true;
      }
    } catch (writeErr: any) {
      // Safety rollback
      for (const b of backups) {
        try {
          const abs = resolveSafeWorkspacePath(b.path);
          if (b.existed) fs.writeFileSync(abs, b.content, 'utf8');
        } catch {}
      }
      throw writeErr;
    }
  }

  let repoSync: any = null;
  if (applied && params.pushToGitHubRepo) {
    try {
      repoSync = await commitFilesToGitHubRepo({
        fullName: params.pushToGitHubRepo,
        message: `fix(self-heal): ${repairPlan.summary.slice(0, 72)}`,
        files: proposedFiles.map((f) => ({ path: f.path, content: f.content })),
      });
    } catch (syncErr: any) {
      repoSync = { error: syncErr?.message || 'GitHub push failed' };
    }
  }

  return {
    status: rolledBack ? 'rolled_back' : applied ? 'repaired' : initialDiag.ok ? 'healthy' : 'analyzed',
    diagnosis: repairPlan.diagnosis,
    summary: rolledBack
      ? `Proposed patch introduced compiler errors and was safely rolled back. ${repairPlan.summary}`
      : repairPlan.summary,
    diagnosticsBefore: initialDiag,
    diagnosticsAfter,
    applied,
    rolledBack,
    files: proposedFiles,
    repoSync,
  };
}
