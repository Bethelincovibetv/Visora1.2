export const DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION = `You are an expert senior software engineer and autonomous coding agent.
- Work inside the user's existing project. Never create a new repo, project or app unless the user explicitly asks.
- Never commit, push or deploy automatically. Make changes, show what changed, and wait until the user says to commit.
- Make the smallest change that solves the problem. Don't rewrite files or swap frameworks unless asked.
- Before destructive actions (deleting files, overwriting work, changing secrets), ask for confirmation.
- Read the relevant files and detect the stack before coding. Follow its conventions. Work in any stack (React, Next.js, Vue, Node, Python, Supabase, etc.).
- For non-trivial work, plan first in 3-6 bullets, then build.
- Find root causes. Don't patch symptoms.
- Write complete, runnable code with error, loading and empty states. Never put secrets in frontend code.
- After building, review your own work for bugs, missing imports, type errors and security issues. Fix them, then present a summary: what changed, which files, what you couldn't test, and one suggested next improvement.
- Be honest. Never claim something works unless you checked it.
- Be brief and direct.`;

export const SKEPTICAL_REVIEWER_SYSTEM_INSTRUCTION = `You are a skeptical senior staff engineer conducting a strict code review on changes just made in this repository.
- Inspect every modified file with read_file and verify the build or typecheck with run_command.
- Look specifically for: bugs, missing imports, TypeScript/type errors, broken UI states (error, loading, empty), regressions to existing features, and security issues (exposed secrets, unsafe paths, unsanitized input).
- If you find any real issue, fix it with write_file (read before write) and re-run verification with run_command.
- Never commit, push, or deploy.
- Be brief, direct, and honest. In your final response, report:
  1. What changed
  2. Which files were modified or created
  3. What you verified vs what you couldn't test
  4. One suggested next improvement`;

export interface CodingAgentModelOption {
  id: string;
  label: string;
  description: string;
  supportsTemperature: boolean;
}

export const CODING_AGENT_MODELS: CodingAgentModelOption[] = [
  {
    id: 'gemini-4-hydrogen',
    label: 'Gemini 4 Hydrogen (Default)',
    description: 'Fast, agentic reasoning for full-stack code & tool loops',
    supportsTemperature: false
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite',
    description: 'Low-latency coding & rapid file edits (supports temperature)',
    supportsTemperature: true
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro Preview',
    description: 'High-accuracy multi-file reasoning (supports temperature)',
    supportsTemperature: true
  },
  {
    id: 'gemini-4-neon',
    label: 'Gemini 4 Neon',
    description: 'Advanced coding, STEM & architecture (requires paid key)',
    supportsTemperature: false
  },
  {
    id: 'gemini-4-carbon',
    label: 'Gemini 4 Carbon',
    description: 'Deep root-cause debugging & security audits (requires paid key)',
    supportsTemperature: false
  }
];

export interface CodingAgentSettings {
  model: string;
  temperature: number;
  systemInstruction: string;
}

export const DEFAULT_CODING_AGENT_SETTINGS: CodingAgentSettings = {
  model: 'gemini-4-hydrogen',
  temperature: 0.3,
  systemInstruction: DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION
};

export const CODING_AGENT_SETTINGS_STORAGE_KEY = 'vixora_coding_agent_settings_v1';

export type AgentTaskStatus = 'pending' | 'in_progress' | 'done';

export interface AgentTaskItem {
  id: string;
  label: string;
  status: AgentTaskStatus;
}

export interface AgentActivityItem {
  id: string;
  message: string;
  timestamp: string;
  tool?: string;
  state?: 'running' | 'completed' | 'failed';
}

export type AgentStreamEvent =
  | { type: 'task_list'; tasks: AgentTaskItem[] }
  | { type: 'status'; message: string; phase?: 'planning' | 'coding' | 'verifying' | 'reviewing' }
  | {
      type: 'tool_call';
      id: string;
      tool: 'read_file' | 'write_file' | 'list_files' | 'run_command' | 'search_project' | 'update_tasks';
      summary: string;
      state: 'running' | 'completed' | 'failed';
      ok?: boolean;
      detail?: string;
    }
  | {
      type: 'preview_ready';
      modifiedFiles: Array<{ path: string; reason?: string }>;
      reason: string;
    }
  | {
      type: 'done';
      summary: string;
      modifiedFiles: Array<{ path: string; content: string; reason?: string }>;
      readFiles: string[];
      checksRun: Array<{ command: string; ok: boolean; output: string }>;
      aborted?: boolean;
      error?: string;
    };

export const CODING_AGENT_TOOL_NAMES = [
  'read_file',
  'write_file',
  'list_files',
  'run_command',
  'search_project'
] as const;

export function normalizeTaskListWithFinalCheck(tasks: AgentTaskItem[]): AgentTaskItem[] {
  const cleaned = (Array.isArray(tasks) ? tasks : [])
    .filter(t => t && typeof t.label === 'string' && t.label.trim().length > 0)
    .map((t, idx) => ({
      id: t.id || `task_${idx + 1}`,
      label: t.label.trim(),
      status: (t.status === 'in_progress' || t.status === 'done' ? t.status : 'pending') as AgentTaskStatus
    }))
    .filter(t => t.label.toLowerCase() !== 'check the work');

  const trimmed = cleaned.slice(0, 7);
  while (trimmed.length < 2) {
    trimmed.push(
      trimmed.length === 0
        ? { id: 'task_inspect', label: 'Inspect relevant project files', status: 'pending' }
        : { id: 'task_implement', label: 'Implement minimal safe changes', status: 'pending' }
    );
  }

  const existingFinal = (Array.isArray(tasks) ? tasks : []).find(
    t => t && typeof t.label === 'string' && t.label.trim().toLowerCase() === 'check the work'
  );

  trimmed.push({
    id: existingFinal?.id || 'check_work',
    label: 'Check the work',
    status: existingFinal?.status === 'in_progress' || existingFinal?.status === 'done' ? existingFinal.status : 'pending'
  });

  return trimmed.slice(0, 8);
}
