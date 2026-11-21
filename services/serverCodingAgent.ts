import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FunctionDeclaration, Type } from '@google/genai';
import {
  AgentStreamEvent,
  AgentTaskItem,
  DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION,
  SKEPTICAL_REVIEWER_SYSTEM_INSTRUCTION,
  normalizeTaskListWithFinalCheck
} from './codingAgentConfig';
import { listWorkspaceFiles, resolveSafeWorkspacePath } from './githubCodingService';
import { buildResilientModelList, getGemini } from './serverVideoEngine';

const execAsync = promisify(exec);
const WORKSPACE_ROOT = process.cwd();

export interface RunCodingAgentParams {
  prompt: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  model?: string;
  temperature?: number;
  systemInstruction?: string;
  signal?: AbortSignal;
  emit: (event: AgentStreamEvent) => void;
}

const CODING_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'update_tasks',
    description:
      'Updates the live 3-8 item task checklist shown to the user. The final item is always "Check the work". Call this early to share your plan and update task statuses (pending, in_progress, done) as you progress.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tasks: {
          type: Type.ARRAY,
          description: 'List of 3 to 8 concise task items.',
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Short task identifier' },
              label: { type: Type.STRING, description: 'Short plain-text task description' },
              status: {
                type: Type.STRING,
                enum: ['pending', 'in_progress', 'done'],
                description: 'Current status of the task'
              }
            },
            required: ['label', 'status']
          }
        }
      },
      required: ['tasks']
    }
  },
  {
    name: 'list_files',
    description:
      'Lists workspace files in the current project so you can detect the tech stack and locate relevant modules. Automatically excludes .git, node_modules, dist, and .env files.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        directory: {
          type: Type.STRING,
          description: 'Optional relative subdirectory path (e.g. "components" or "services"). Leave empty for project root.'
        },
        pattern: {
          type: Type.STRING,
          description: 'Optional case-insensitive substring filter on file path.'
        }
      }
    }
  },
  {
    name: 'read_file',
    description:
      'Reads a file in the current workspace with line numbers. Always call read_file before modifying an existing file with write_file.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative workspace path (e.g. "App.tsx" or "components/MyComp.tsx").' },
        startLine: { type: Type.INTEGER, description: 'Optional 1-indexed start line.' },
        endLine: { type: Type.INTEGER, description: 'Optional 1-indexed end line.' }
      },
      required: ['path']
    }
  },
  {
    name: 'search_project',
    description:
      'Searches source files in the current workspace for a text query or pattern and returns matching file paths, line numbers, and snippets.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING, description: 'Text or pattern to search for.' },
        directory: { type: Type.STRING, description: 'Optional subdirectory to restrict search.' },
        isRegex: { type: Type.BOOLEAN, description: 'Interpret query as regular expression (default false).' }
      },
      required: ['query']
    }
  },
  {
    name: 'write_file',
    description:
      'Creates a new file or updates an existing file in the current workspace. You MUST call read_file on existing files before writing them. Never commit, push, deploy, or write secrets.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        path: { type: Type.STRING, description: 'Relative workspace path to write.' },
        content: { type: Type.STRING, description: 'Complete file content to write.' },
        reason: { type: Type.STRING, description: 'Brief 1-sentence reason for this change.' }
      },
      required: ['path', 'content']
    }
  },
  {
    name: 'run_command',
    description:
      'Runs a sandboxed verification or inspection command inside the workspace root (e.g. "npx tsc --noEmit", "npm run lint", "npm run build", "npm test", "node --check <file>"). Commit, push, deploy, and destructive shell commands are blocked.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        command: { type: Type.STRING, description: 'Single sandboxed command to execute in workspace root.' }
      },
      required: ['command']
    }
  }
];

function validateSandboxedCommand(rawCommand: string): { ok: true; command: string } | { ok: false; error: string } {
  const cmd = String(rawCommand || '').trim();
  if (!cmd) {
    return { ok: false, error: 'Command cannot be empty.' };
  }

  // Block shell chaining, command substitution, piping, and output redirection
  if (/[;&|`$<>]/.test(cmd) || /\r|\n/.test(cmd)) {
    return {
      ok: false,
      error: 'Shell chaining, pipes, redirection, and subshells are not permitted in the sandboxed command runner. Run a single command directly.'
    };
  }

  const lower = cmd.toLowerCase();
  const forbiddenPatterns = [
    /\bgit\s+(commit|push|reset|clean|checkout|rebase|merge|tag|remote)\b/,
    /\b(vercel|netlify|heroku|fly|firebase)\b/,
    /\b(rm|rmdir|unlink|shred|mv|cp|chmod|chown|sudo|su|kill|pkill|killall|curl|wget|ssh|scp|nc|netcat|printenv|env)\b/,
    /\bnpm\s+(publish|login|adduser|token|uninstall)\b/,
    /\.env/
  ];

  for (const pat of forbiddenPatterns) {
    if (pat.test(lower)) {
      return {
        ok: false,
        error: `Command "${cmd}" is blocked by sandbox policy (no commit/push/deploy, destructive file operations, network downloads, or secret inspection).`
      };
    }
  }

  const allowedPrefixes = [
    'npx tsc',
    'npx vite build',
    'npx eslint',
    'npx prettier',
    'npx vitest',
    'npx jest',
    'npm run build',
    'npm run lint',
    'npm run test',
    'npm test',
    'npm run dev -- --help',
    'node --check',
    'node -c',
    'python3 -m py_compile',
    'python -m py_compile',
    'pytest',
    'ls',
    'pwd'
  ];

  const isAllowed = allowedPrefixes.some(prefix => lower === prefix || lower.startsWith(`${prefix} `));
  if (!isAllowed) {
    return {
      ok: false,
      error: `Command "${cmd}" is not in the sandboxed verification allowlist. Allowed commands: npx tsc --noEmit, npm run lint, npm run build, npm test, npx vite build, npx vitest/jest, node --check, python3 -m py_compile, pytest, ls.`
    };
  }

  return { ok: true, command: cmd };
}

function containsPotentialSecret(content: string, relPath: string): string | null {
  const lowerPath = relPath.toLowerCase();
  const isFrontendOrCode = /\.(tsx?|jsx?|html|css|vue|svelte|mjs|cjs)$/i.test(lowerPath);
  if (/(AIza[0-9A-Za-z_-]{25,}|github_pat_[0-9A-Za-z_]{20,}|ghp_[0-9A-Za-z]{20,}|sk-[0-9A-Za-z]{20,})/.test(content)) {
    return 'Hardcoded API keys or access tokens are not allowed in source files.';
  }
  if (isFrontendOrCode && !lowerPath.includes('server') && /process\.env\.(GEMINI_API_KEY|VERCEL_TOKEN|GITHUB_TOKEN)/i.test(content)) {
    // Allow existing App.tsx patterns only if not introducing a new frontend secret reference; warn strictly on new writes referencing VERCEL_TOKEN/GITHUB_TOKEN
    if (/process\.env\.(VERCEL_TOKEN|GITHUB_TOKEN)/i.test(content)) {
      return 'Server secret references (VERCEL_TOKEN / GITHUB_TOKEN) are not permitted in frontend code.';
    }
  }
  return null;
}

function formatToolStatusLine(tool: string, args: Record<string, any>): string {
  switch (tool) {
    case 'list_files':
      return args?.directory ? `Listing files in ${args.directory}` : 'Inspecting project structure';
    case 'read_file': {
      const base = args?.path ? path.basename(String(args.path)) : 'file';
      return `Reading ${base}`;
    }
    case 'search_project':
      return `Searching for "${String(args?.query || '').slice(0, 32)}"`;
    case 'write_file': {
      const base = args?.path ? path.basename(String(args.path)) : 'file';
      return `Editing ${base}`;
    }
    case 'run_command':
      return `Running ${String(args?.command || 'command').slice(0, 40)}`;
    case 'update_tasks':
      return 'Updating task plan';
    default:
      return `Running ${tool}`;
  }
}

async function callGeminiWithResilience(options: {
  requestedModel: string;
  temperature: number;
  contents: any[];
  systemInstruction: string;
  tools?: any[];
  signal?: AbortSignal;
}) {
  const ai = getGemini();
  const candidates = buildResilientModelList(options.requestedModel);
  let lastError: any = null;

  for (const modelName of candidates) {
    if (options.signal?.aborted) {
      throw new Error('Aborted by user');
    }

    const supportsTemp = !modelName.startsWith('gemini-4-');
    const config: Record<string, any> = {
      systemInstruction: options.systemInstruction
    };
    if (options.tools && options.tools.length > 0) {
      config.tools = options.tools;
    }
    if (supportsTemp && typeof options.temperature === 'number' && !Number.isNaN(options.temperature)) {
      config.temperature = Math.min(1, Math.max(0, options.temperature));
    }

    for (let attempt = 0; attempt < 2; attempt++) {
      if (options.signal?.aborted) {
        throw new Error('Aborted by user');
      }
      try {
        return await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config
        });
      } catch (err: any) {
        lastError = err;
        const msg = String(err?.message || err || '');
        const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('high demand');
        const isQuota = msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota');
        const isNotFound = msg.includes('404') || msg.includes('NOT_FOUND') || msg.includes('not found');

        if (isTransient && attempt === 0) {
          await new Promise(r => setTimeout(r, 600));
          continue;
        }
        if (isQuota || isNotFound || isTransient) {
          break;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error('Gemini model invocation failed.');
}

export async function runAutonomousCodingAgentLoop(params: RunCodingAgentParams): Promise<void> {
  const {
    prompt,
    history = [],
    model = 'gemini-4-hydrogen',
    temperature = 0.3,
    systemInstruction = DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION,
    signal,
    emit
  } = params;

  const readFilesSet = new Set<string>();
  const modifiedFilesMap = new Map<string, { path: string; content: string; reason?: string }>();
  const checksRun: Array<{ command: string; ok: boolean; output: string }> = [];
  const failureCounts = new Map<string, number>();

  let currentTasks: AgentTaskItem[] = normalizeTaskListWithFinalCheck([
    { id: 'task_1', label: 'Read project structure and relevant files', status: 'in_progress' },
    { id: 'task_2', label: 'Implement requested code changes', status: 'pending' },
    { id: 'check_work', label: 'Check the work', status: 'pending' }
  ]);
  emit({ type: 'task_list', tasks: currentTasks });
  emit({ type: 'status', message: 'Planning and inspecting workspace...', phase: 'planning' });

  const executeTool = async (
    name: string,
    rawArgs: Record<string, any>
  ): Promise<{ ok: boolean; result: any; error?: string }> => {
    const args = rawArgs || {};
    const toolCallId = `tc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const statusLine = formatToolStatusLine(name, args);

    if (name !== 'update_tasks') {
      emit({ type: 'status', message: statusLine, phase: name === 'run_command' ? 'verifying' : 'coding' });
      emit({
        type: 'tool_call',
        id: toolCallId,
        tool: name as any,
        summary: statusLine,
        state: 'running'
      });
    }

    const failKey = `${name}:${String(args.path || args.command || args.query || '')}`;

    try {
      if (signal?.aborted) {
        throw new Error('Cancelled by user');
      }

      if (name === 'update_tasks') {
        currentTasks = normalizeTaskListWithFinalCheck(args.tasks || []);
        emit({ type: 'task_list', tasks: currentTasks });
        return { ok: true, result: { tasks: currentTasks } };
      }

      if (name === 'list_files') {
        const subDir = args.directory ? String(args.directory).replace(/^\/+/, '').replace(/\/+$/, '') : '';
        if (subDir) {
          resolveSafeWorkspacePath(subDir);
        }
        let files = listWorkspaceFiles();
        if (subDir) {
          files = files.filter(f => f === subDir || f.startsWith(`${subDir}/`));
        }
        if (args.pattern) {
          const pat = String(args.pattern).toLowerCase();
          files = files.filter(f => f.toLowerCase().includes(pat));
        }
        const total = files.length;
        const limited = files.slice(0, 200);
        emit({
          type: 'tool_call',
          id: toolCallId,
          tool: 'list_files',
          summary: statusLine,
          state: 'completed',
          ok: true,
          detail: `${total} files found`
        });
        return { ok: true, result: { total, files: limited, truncated: total > 200 } };
      }

      if (name === 'read_file') {
        const relPath = String(args.path || '').replace(/^\/+/, '');
        if (!relPath) throw new Error('Argument "path" is required.');
        const abs = resolveSafeWorkspacePath(relPath);
        if (!fs.existsSync(abs)) {
          throw new Error(`File "${relPath}" does not exist.`);
        }
        const stat = fs.statSync(abs);
        if (stat.isDirectory()) {
          throw new Error(`"${relPath}" is a directory. Use list_files instead.`);
        }
        const raw = fs.readFileSync(abs, 'utf8');
        readFilesSet.add(relPath);

        const allLines = raw.split(/\r?\n/);
        const start = Math.max(1, Number(args.startLine) || 1);
        const defaultEnd = allLines.length > 450 && !args.endLine ? Math.min(allLines.length, start + 349) : allLines.length;
        const end = Math.min(allLines.length, Number(args.endLine) || defaultEnd);

        const sliced = allLines
          .slice(start - 1, end)
          .map((line, idx) => `${start + idx}: ${line}`)
          .join('\n');

        emit({
          type: 'tool_call',
          id: toolCallId,
          tool: 'read_file',
          summary: statusLine,
          state: 'completed',
          ok: true,
          detail: `Lines ${start}-${end} of ${allLines.length}`
        });

        return {
          ok: true,
          result: {
            path: relPath,
            totalLines: allLines.length,
            startLine: start,
            endLine: end,
            truncated: end < allLines.length,
            content: sliced.slice(0, 60000)
          }
        };
      }

      if (name === 'search_project') {
        const query = String(args.query || '');
        if (!query) throw new Error('Argument "query" is required.');
        const subDir = args.directory ? String(args.directory).replace(/^\/+/, '').replace(/\/+$/, '') : '';
        if (subDir) resolveSafeWorkspacePath(subDir);

        let files = listWorkspaceFiles().filter(f =>
          /\.(tsx?|jsx?|mjs|cjs|json|css|scss|html|md|py|sql|rules|yml|yaml|txt)$/i.test(f)
        );
        if (subDir) {
          files = files.filter(f => f === subDir || f.startsWith(`${subDir}/`));
        }

        const regex = args.isRegex ? new RegExp(query, 'i') : null;
        const lowerQuery = query.toLowerCase();
        const matches: Array<{ path: string; line: number; text: string }> = [];

        for (const rel of files) {
          if (matches.length >= 60) break;
          try {
            const abs = resolveSafeWorkspacePath(rel);
            const stat = fs.statSync(abs);
            if (stat.size > 350000) continue;
            const lines = fs.readFileSync(abs, 'utf8').split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
              const lineText = lines[i];
              const hit = regex ? regex.test(lineText) : lineText.toLowerCase().includes(lowerQuery);
              if (hit) {
                matches.push({ path: rel, line: i + 1, text: lineText.trim().slice(0, 200) });
                if (matches.length >= 60) break;
              }
            }
          } catch {
            // skip unreadable files
          }
        }

        emit({
          type: 'tool_call',
          id: toolCallId,
          tool: 'search_project',
          summary: statusLine,
          state: 'completed',
          ok: true,
          detail: `${matches.length} matches`
        });

        return { ok: true, result: { query, count: matches.length, matches } };
      }

      if (name === 'write_file') {
        const relPath = String(args.path || '').replace(/^\/+/, '');
        if (!relPath) throw new Error('Argument "path" is required.');
        const content = typeof args.content === 'string' ? args.content : '';
        const reason = args.reason ? String(args.reason) : undefined;

        const abs = resolveSafeWorkspacePath(relPath);
        const exists = fs.existsSync(abs);

        if (exists && !readFilesSet.has(relPath)) {
          throw new Error(
            `Safety rule: "${relPath}" already exists. You must call read_file on "${relPath}" before editing it.`
          );
        }

        const secretWarning = containsPotentialSecret(content, relPath);
        if (secretWarning) {
          throw new Error(secretWarning);
        }

        const dir = path.dirname(abs);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(abs, content, 'utf8');
        readFilesSet.add(relPath);
        modifiedFilesMap.set(relPath, { path: relPath, content, reason });

        emit({
          type: 'tool_call',
          id: toolCallId,
          tool: 'write_file',
          summary: statusLine,
          state: 'completed',
          ok: true,
          detail: `${exists ? 'Updated' : 'Created'} ${relPath}`
        });

        emit({
          type: 'preview_ready',
          modifiedFiles: Array.from(modifiedFilesMap.values()).map(f => ({ path: f.path, reason: f.reason })),
          reason: `${exists ? 'Updated' : 'Created'} ${relPath}`
        });

        return {
          ok: true,
          result: { path: relPath, action: exists ? 'updated' : 'created', bytes: Buffer.byteLength(content, 'utf8') }
        };
      }

      if (name === 'run_command') {
        const check = validateSandboxedCommand(String(args.command || ''));
        if (!check.ok) {
          throw new Error((check as { ok: false; error: string }).error);
        }

        const validCmd = check.command;
        try {
          const { stdout, stderr } = await execAsync(validCmd, {
            cwd: WORKSPACE_ROOT,
            timeout: 45000,
            maxBuffer: 512 * 1024,
            signal
          });
          const output = `${stdout || ''}\n${stderr || ''}`.trim().slice(0, 6000) || 'Command exited with status 0.';
          checksRun.push({ command: validCmd, ok: true, output });

          emit({
            type: 'tool_call',
            id: toolCallId,
            tool: 'run_command',
            summary: statusLine,
            state: 'completed',
            ok: true,
            detail: 'Passed (exit 0)'
          });

          return { ok: true, result: { command: validCmd, exitCode: 0, output } };
        } catch (cmdErr: any) {
          if (signal?.aborted) throw new Error('Cancelled by user');
          const out = `${cmdErr?.stdout || ''}\n${cmdErr?.stderr || ''}\n${cmdErr?.message || ''}`.trim().slice(0, 6000);
          checksRun.push({ command: validCmd, ok: false, output: out });
          throw new Error(`Command "${validCmd}" failed:\n${out}`);
        }
      }

      throw new Error(`Unknown tool "${name}". Available tools: list_files, read_file, search_project, write_file, run_command, update_tasks.`);
    } catch (err: any) {
      const errMsg = String(err?.message || err || 'Tool execution failed');
      const count = (failureCounts.get(failKey) || 0) + 1;
      failureCounts.set(failKey, count);

      if (name !== 'update_tasks') {
        emit({
          type: 'tool_call',
          id: toolCallId,
          tool: name as any,
          summary: statusLine,
          state: 'failed',
          ok: false,
          detail: errMsg.slice(0, 180)
        });
      }

      const retryHint =
        count >= 2
          ? ' Retry limit reached for this operation. Do not repeat the exact same failing call; inspect the root cause or report the failure honestly.'
          : ' Read the error carefully, fix the root cause, and retry once.';

      return { ok: false, result: null, error: `${errMsg}${retryHint}` };
    }
  };

  const runLoop = async (
    initialContents: any[],
    instruction: string,
    maxTurns: number
  ): Promise<string> => {
    const contents = [...initialContents];
    let finalText = '';

    for (let turn = 0; turn < maxTurns; turn++) {
      if (signal?.aborted) {
        return finalText;
      }

      const response = await callGeminiWithResilience({
        requestedModel: model,
        temperature,
        contents,
        systemInstruction: instruction,
        tools: [{ functionDeclarations: CODING_TOOL_DECLARATIONS }],
        signal
      });

      const candidateParts = response.candidates?.[0]?.content?.parts || [];
      const functionCalls = candidateParts
        .filter((p: any) => p.functionCall)
        .map((p: any) => p.functionCall);

      if (response.text) {
        finalText = response.text;
      }

      if (!functionCalls || functionCalls.length === 0) {
        break;
      }

      // Append model turn containing function calls
      contents.push({
        role: 'model',
        parts: candidateParts
      });

      // Execute each tool call and feed results back to model
      const responseParts: any[] = [];
      for (const fc of functionCalls) {
        if (signal?.aborted) break;
        const execOutcome = await executeTool(String(fc.name), (fc.args as Record<string, any>) || {});
        responseParts.push({
          functionResponse: {
            name: fc.name,
            response: execOutcome.ok ? { ok: true, result: execOutcome.result } : { ok: false, error: execOutcome.error }
          }
        });
      }

      contents.push({
        role: 'user',
        parts: responseParts
      });
    }

    return finalText;
  };

  try {
    // ========================================================================
    // PASS 1: PRIMARY CODING AGENT LOOP
    // ========================================================================
    const conversationContents: any[] = history
      .filter(h => h.text && h.text.trim())
      .slice(-6)
      .map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));

    conversationContents.push({
      role: 'user',
      parts: [
        {
          text: `${prompt}

Remember:
- First call list_files / search_project / read_file to inspect the existing project and detect the stack.
- Call update_tasks with a concise 3-8 item plan (whose final item is always "Check the work").
- Read before writing. Make the smallest clean change that solves the task.
- Never commit, push, or deploy.
- After editing, run verification (e.g. npx tsc --noEmit or npm run lint / npm run build).`
        }
      ]
    });

    const pass1Text = await runLoop(conversationContents, systemInstruction, 14);

    if (signal?.aborted) {
      emit({
        type: 'done',
        summary: 'Coding agent run was stopped by the user.',
        modifiedFiles: Array.from(modifiedFilesMap.values()),
        readFiles: Array.from(readFilesSet),
        checksRun,
        aborted: true
      });
      return;
    }

    // ========================================================================
    // PASS 2: SKEPTICAL REVIEWER SELF-IMPROVEMENT PASS
    // ========================================================================
    currentTasks = normalizeTaskListWithFinalCheck(
      currentTasks.map(t =>
        t.label.toLowerCase() === 'check the work'
          ? { ...t, status: 'in_progress' }
          : { ...t, status: 'done' }
      )
    );
    emit({ type: 'task_list', tasks: currentTasks });
    emit({ type: 'status', message: 'Running skeptical review pass...', phase: 'reviewing' });

    const modifiedList = Array.from(modifiedFilesMap.values());
    const reviewPrompt = `USER REQUEST:
"${prompt}"

FILES READ SO FAR:
${Array.from(readFilesSet).join(', ') || 'None'}

FILES MODIFIED/CREATED IN PASS 1:
${modifiedList.map(f => `- ${f.path}${f.reason ? ` (${f.reason})` : ''}`).join('\n') || 'None'}

CHECKS ALREADY RUN:
${checksRun.map(c => `- ${c.command}: ${c.ok ? 'PASSED' : 'FAILED'}`).join('\n') || 'None yet'}

PRIMARY AGENT OUTPUT:
${pass1Text || '(No text output yet)'}

Now perform your skeptical review:
1. Read the modified files (or relevant target files if none were modified) with read_file.
2. Run build/typecheck verification with run_command if edits were made or no check ran after the last edit.
3. Fix any bugs, missing imports, type issues, missing error/loading/empty states, or security concerns with write_file and re-verify.
4. Do NOT commit, push, or deploy.
5. Present the final brief, honest summary: what changed, which files, what you checked vs what you couldn't test, and one suggested next improvement.`;

    const pass2Text = await runLoop(
      [{ role: 'user', parts: [{ text: reviewPrompt }] }],
      SKEPTICAL_REVIEWER_SYSTEM_INSTRUCTION,
      8
    );

    if (signal?.aborted) {
      emit({
        type: 'done',
        summary: 'Coding agent run was stopped during review.',
        modifiedFiles: Array.from(modifiedFilesMap.values()),
        readFiles: Array.from(readFilesSet),
        checksRun,
        aborted: true
      });
      return;
    }

    currentTasks = normalizeTaskListWithFinalCheck(
      currentTasks.map(t => ({ ...t, status: 'done' }))
    );
    emit({ type: 'task_list', tasks: currentTasks });
    emit({ type: 'status', message: 'Check complete', phase: 'verifying' });

    emit({
      type: 'done',
      summary: pass2Text || pass1Text || 'Coding run finished.',
      modifiedFiles: Array.from(modifiedFilesMap.values()),
      readFiles: Array.from(readFilesSet),
      checksRun
    });
  } catch (err: any) {
    if (signal?.aborted) {
      emit({
        type: 'done',
        summary: 'Coding agent run stopped by user.',
        modifiedFiles: Array.from(modifiedFilesMap.values()),
        readFiles: Array.from(readFilesSet),
        checksRun,
        aborted: true
      });
      return;
    }
    const errMsg = String(err?.message || err || 'Coding agent loop failed.');
    emit({ type: 'status', message: `Error: ${errMsg.slice(0, 120)}`, phase: 'verifying' });
    emit({
      type: 'done',
      summary: `I ran into an error while executing the coding loop: ${errMsg}`,
      modifiedFiles: Array.from(modifiedFilesMap.values()),
      readFiles: Array.from(readFilesSet),
      checksRun,
      error: errMsg
    });
  }
}
