import React from 'react';
import { AgentActivityItem, AgentTaskItem } from '../services/codingAgentConfig';

export interface CodingAgentRunState {
  isRunning: boolean;
  phase?: 'planning' | 'coding' | 'verifying' | 'reviewing';
  currentStatus: string;
  tasks: AgentTaskItem[];
  activities: AgentActivityItem[];
  modifiedFiles: Array<{ path: string; reason?: string }>;
  checksRun: Array<{ command: string; ok: boolean; output: string }>;
  aborted?: boolean;
  error?: string;
}

export interface CodingAgentProgressCardProps {
  run: CodingAgentRunState;
  onStop?: () => void;
  onOpenPreview?: () => void;
  themeMode?: 'light' | 'dark';
}

export const CodingAgentProgressCard: React.FC<CodingAgentProgressCardProps> = ({
  run,
  onStop,
  onOpenPreview,
  themeMode = 'dark'
}) => {
  const isLight = themeMode === 'light';
  const doneCount = run.tasks.filter(t => t.status === 'done').length;

  return (
    <div
      className={`w-full mt-2.5 rounded-2xl border overflow-hidden shadow-lg ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-900'
          : 'bg-slate-950/90 border-white/10 text-slate-100'
      }`}
    >
      {/* Top Status & Stop Header */}
      <div
        className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-white/10'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
              run.isRunning
                ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                : run.error
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : run.aborted
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            <i
              className={`fa-solid ${
                run.isRunning
                  ? 'fa-circle-notch animate-spin'
                  : run.error
                  ? 'fa-triangle-exclamation'
                  : run.aborted
                  ? 'fa-hand'
                  : 'fa-check'
              }`}
            ></i>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">
              {run.currentStatus || (run.isRunning ? 'Working...' : 'Completed')}
            </p>
            <p className={`text-[11px] tabular-nums ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {run.isRunning
                ? `${run.phase === 'reviewing' ? 'Skeptical review' : 'Autonomous loop'} · ${doneCount}/${run.tasks.length} tasks`
                : run.aborted
                ? 'Stopped by user'
                : `${doneCount}/${run.tasks.length} tasks complete`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800'
                  : 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-200'
              }`}
            >
              <i className="fa-solid fa-window-maximize text-[10px]"></i>
              <span>Preview</span>
            </button>
          )}
          {run.isRunning && onStop && (
            <button
              type="button"
              onClick={onStop}
              className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <i className="fa-solid fa-stop text-[10px]"></i>
              <span>Stop</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Task Checklist */}
      {run.tasks.length > 0 && (
        <div className={`px-3.5 py-2.5 border-b space-y-1.5 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
          <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Task Plan
          </p>
          <ul className="space-y-1">
            {run.tasks.map(task => (
              <li key={task.id} className="flex items-center gap-2 text-xs">
                {task.status === 'done' ? (
                  <i className="fa-solid fa-circle-check text-emerald-400 text-[12px] shrink-0"></i>
                ) : task.status === 'in_progress' ? (
                  <i className="fa-solid fa-circle-notch animate-spin text-orange-400 text-[12px] shrink-0"></i>
                ) : (
                  <i className="fa-regular fa-circle text-slate-500 text-[12px] shrink-0"></i>
                )}
                <span
                  className={
                    task.status === 'done'
                      ? isLight
                        ? 'text-slate-600'
                        : 'text-slate-300'
                      : task.status === 'in_progress'
                      ? isLight
                        ? 'text-slate-950 font-semibold'
                        : 'text-white font-semibold'
                      : isLight
                      ? 'text-slate-500'
                      : 'text-slate-400'
                  }
                >
                  {task.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live Activity Feed */}
      {run.activities.length > 0 && (
        <div className="px-3.5 py-2.5 space-y-1.5">
          <p className={`text-[11px] font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Live Activity
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
            {run.activities.slice(-12).map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between gap-2 text-[11px] px-2 py-1 rounded-lg ${
                  isLight ? 'bg-white border border-slate-200/80' : 'bg-white/[0.03] border border-white/5'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <i
                    className={`fa-solid text-[10px] shrink-0 ${
                      item.state === 'failed'
                        ? 'fa-xmark text-red-400'
                        : item.state === 'running'
                        ? 'fa-circle-notch animate-spin text-orange-400'
                        : 'fa-check text-emerald-400'
                    }`}
                  ></i>
                  <span className="truncate">{item.message}</span>
                </div>
                {item.tool && (
                  <span
                    className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                      isLight ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {item.tool}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modified Files & Verification Badges */}
      {(run.modifiedFiles.length > 0 || run.checksRun.length > 0) && (
        <div
          className={`px-3.5 py-2 border-t flex flex-wrap items-center gap-1.5 text-[11px] ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
          }`}
        >
          {run.modifiedFiles.map(f => (
            <span
              key={f.path}
              className={`px-2 py-0.5 rounded-md font-mono border ${
                isLight
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-orange-500/10 border-orange-500/30 text-orange-300'
              }`}
            >
              {f.path}
            </span>
          ))}
          {run.checksRun.slice(-2).map((c, idx) => (
            <span
              key={`${c.command}-${idx}`}
              className={`px-2 py-0.5 rounded-md font-mono border ${
                c.ok
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isLight
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {c.ok ? 'PASS' : 'FAIL'}: {c.command}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
