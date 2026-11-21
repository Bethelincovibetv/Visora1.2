import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CodingResultData } from '../services/vixoraAgentTools';

export interface DeveloperPreviewProject {
  id: string;
  timestamp: string;
  result: CodingResultData;
}

export interface ConsoleLogEntry {
  id: string;
  level: 'log' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export interface LovableDeveloperPreviewProps {
  projects: DeveloperPreviewProject[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
  onAskAi: (prompt: string) => void;
  previewReloadSignal?: number;
  themeMode?: 'light' | 'dark';
}

type PreviewViewTab = 'preview' | 'split' | 'code' | 'console';
type DeviceViewport = 'desktop' | 'tablet' | 'mobile';
type PreviewSourceMode = 'sandbox' | 'live' | 'vixora';

const CONSOLE_BRIDGE_SCRIPT = (previewId: string) => `
<script data-vixora-console-bridge="true">
(function() {
  if (window.__vixoraConsoleHooked) return;
  window.__vixoraConsoleHooked = true;
  var PID = ${JSON.stringify(previewId)};
  function serialize(args) {
    try {
      return Array.prototype.slice.call(args).map(function(item) {
        if (typeof item === 'string') return item;
        if (item instanceof Error) return item.stack || item.message;
        try { return JSON.stringify(item); } catch (e) { return String(item); }
      }).join(' ');
    } catch (e) {
      return 'Unserializable console argument';
    }
  }
  function emit(level, msg) {
    try {
      window.parent.postMessage({
        source: 'vixora-dev-console',
        previewId: PID,
        level: level,
        message: String(msg || ''),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }, '*');
    } catch (e) {}
  }
  ['log', 'info', 'warn', 'error'].forEach(function(lvl) {
    var orig = console[lvl];
    console[lvl] = function() {
      emit(lvl, serialize(arguments));
      if (orig) return orig.apply(console, arguments);
    };
  });
  window.addEventListener('error', function(evt) {
    var loc = evt.filename ? ' (' + evt.filename + ':' + evt.lineno + ')' : '';
    emit('error', (evt.message || 'Runtime Error') + loc);
  });
  window.addEventListener('unhandledrejection', function(evt) {
    var reason = evt.reason && (evt.reason.message || String(evt.reason)) || 'Unhandled Promise Rejection';
    emit('error', reason);
  });
})();
</script>`;

function injectConsoleBridge(html: string, previewId: string): string {
  const bridge = CONSOLE_BRIDGE_SCRIPT(previewId);
  if (!html) return '';
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, match => `${match}\n${bridge}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html[^>]*>/i, match => `${match}\n<head>${bridge}</head>`);
  }
  return `<!DOCTYPE html><html><head>${bridge}</head><body>${html}</body></html>`;
}

function buildLiveHtmlFromFiles(
  baseHtml: string | undefined,
  files: Array<{ path: string; content: string }>,
  edits: Record<string, string>,
  projectId: string
): string {
  const resolveContent = (file: { path: string; content: string }) => {
    const key = `${projectId}:${file.path}`;
    return Object.prototype.hasOwnProperty.call(edits, key) ? edits[key] : file.content;
  };

  const hasEdits = files.some(f => Object.prototype.hasOwnProperty.call(edits, `${projectId}:${f.path}`));
  if (baseHtml && !hasEdits) {
    return baseHtml;
  }

  const htmlFile =
    files.find(f => /(^|\/)index\.html$/i.test(f.path)) ||
    files.find(f => /\.html?$/i.test(f.path));

  let html = htmlFile ? resolveContent(htmlFile) : baseHtml || '';
  if (!html) {
    return '';
  }

  const cssFiles = files.filter(f => /\.css$/i.test(f.path));
  const jsFiles = files.filter(f => /\.(js|mjs)$/i.test(f.path) && !/config/i.test(f.path));

  if (cssFiles.length > 0 && hasEdits) {
    const combinedCss = cssFiles.map(resolveContent).join('\n\n');
    const styleBlock = `<style data-vixora-live-css="true">\n${combinedCss}\n</style>`;
    if (/<link[^>]+rel=["']stylesheet["'][^>]*>/i.test(html)) {
      html = html.replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '');
    }
    if (/<style[^>]*>[\s\S]*?<\/style>/i.test(html)) {
      html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/i, styleBlock);
    } else if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${styleBlock}\n</head>`);
    } else {
      html = `${styleBlock}\n${html}`;
    }
  }

  if (jsFiles.length > 0 && hasEdits) {
    const combinedJs = jsFiles.map(resolveContent).join('\n\n');
    const scriptBlock = `<script data-vixora-live-js="true">\n${combinedJs}\n</script>`;
    let replacedScript = false;
    html = html.replace(/<script([^>]+)src=["'][^"']+["']([^>]*)>\s*<\/script>/gi, (full, before, after) => {
      if (/https?:\/\//i.test(full)) return full;
      if (!replacedScript) {
        replacedScript = true;
        return scriptBlock;
      }
      return '';
    });
    if (!replacedScript) {
      if (/<body[^>]*>[\s\S]*<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/i.test(html)) {
        html = html.replace(
          /<script(?![^>]*src=)[^>]*>[\s\S]*?<\/script>/i,
          scriptBlock
        );
      } else if (/<\/body>/i.test(html)) {
        html = html.replace(/<\/body>/i, `${scriptBlock}\n</body>`);
      } else {
        html = `${html}\n${scriptBlock}`;
      }
    }
  }

  return html;
}

function getFileIconClass(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'fa-brands fa-html5 text-orange-400';
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'fa-brands fa-css3-alt text-sky-400';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'fa-solid fa-code text-blue-400';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'fa-brands fa-js text-amber-400';
  if (lower.endsWith('.json')) return 'fa-solid fa-brackets-curly text-emerald-400';
  return 'fa-regular fa-file-code text-slate-400';
}

export const LovableDeveloperPreview: React.FC<LovableDeveloperPreviewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  isFullscreen,
  onToggleFullscreen,
  onClose,
  onAskAi,
  previewReloadSignal = 0,
  themeMode = 'dark'
}) => {
  const activeProject = useMemo(() => {
    if (projects.length === 0) return null;
    if (selectedProjectId) {
      const found = projects.find(p => p.id === selectedProjectId);
      if (found) return found;
    }
    return projects[projects.length - 1];
  }, [projects, selectedProjectId]);

  const result = activeProject?.result;
  const projectFiles = result?.files || [];
  const liveExternalUrl = result?.liveUrl || result?.pagesUrl || '';

  const [viewTab, setViewTab] = useState<PreviewViewTab>('preview');
  const [device, setDevice] = useState<DeviceViewport>('desktop');
  const [sourceMode, setSourceMode] = useState<PreviewSourceMode>(() => {
    if (result?.previewHtml) return 'sandbox';
    if (liveExternalUrl) return 'live';
    return 'vixora';
  });
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [editedFiles, setEditedFiles] = useState<Record<string, string>>({});
  const [iframeRefreshKey, setIframeRefreshKey] = useState(0);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLogEntry[]>([]);
  const [consoleFilter, setConsoleFilter] = useState<'all' | 'error' | 'warn'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [aiQuickEditPrompt, setAiQuickEditPrompt] = useState('');
  const [isDeployingEdits, setIsDeployingEdits] = useState(false);
  const [deployFeedback, setDeployFeedback] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const [vixoraAppPath, setVixoraAppPath] = useState<string>('/studio');

  const blobUrlRef = useRef<string | null>(null);
  const [blobPreviewUrl, setBlobPreviewUrl] = useState<string>('');

  // Auto-reload preview iframe whenever coding agent writes workspace files
  useEffect(() => {
    if (previewReloadSignal > 0) {
      setSourceMode('vixora');
      setIframeRefreshKey(k => k + 1);
    }
  }, [previewReloadSignal]);

  // Keep source mode synchronized when switching projects
  useEffect(() => {
    setSelectedFileIndex(0);
    setDeployFeedback(null);
    setConsoleLogs([]);
    if (!activeProject) {
      setSourceMode('vixora');
      return;
    }
    if (activeProject.result.previewHtml || (activeProject.result.files && activeProject.result.files.length > 0)) {
      setSourceMode('sandbox');
    } else if (activeProject.result.liveUrl || activeProject.result.pagesUrl) {
      setSourceMode('live');
    } else {
      setSourceMode('vixora');
    }
  }, [activeProject?.id]);

  const compiledHtml = useMemo(() => {
    if (!activeProject) return '';
    return buildLiveHtmlFromFiles(
      activeProject.result.previewHtml,
      projectFiles,
      editedFiles,
      activeProject.id
    );
  }, [activeProject, projectFiles, editedFiles]);

  const instrumentedSrcDoc = useMemo(() => {
    if (!compiledHtml || !activeProject) return '';
    return injectConsoleBridge(compiledHtml, activeProject.id);
  }, [compiledHtml, activeProject]);

  // Create clean Blob URL for "Open in New Tab" & HTML download without using window.open
  useEffect(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (compiledHtml) {
      const blob = new Blob([compiledHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setBlobPreviewUrl(url);
    } else {
      setBlobPreviewUrl('');
    }
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [compiledHtml]);

  // Capture real console output and errors from preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.source !== 'vixora-dev-console') return;
      if (activeProject && data.previewId && data.previewId !== activeProject.id) return;

      const entry: ConsoleLogEntry = {
        id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        level: data.level === 'error' || data.level === 'warn' || data.level === 'info' ? data.level : 'log',
        message: String(data.message || ''),
        timestamp: String(data.timestamp || new Date().toLocaleTimeString())
      };
      setConsoleLogs(prev => [...prev.slice(-149), entry]);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeProject?.id]);

  // Clear logs on explicit iframe reload
  const handleReloadPreview = () => {
    setConsoleLogs([]);
    setIframeRefreshKey(k => k + 1);
  };

  const activeFile = projectFiles[selectedFileIndex] || projectFiles[0];
  const activeFileEditKey = activeProject && activeFile ? `${activeProject.id}:${activeFile.path}` : '';
  const activeFileContent = activeFile
    ? Object.prototype.hasOwnProperty.call(editedFiles, activeFileEditKey)
      ? editedFiles[activeFileEditKey]
      : activeFile.content
    : '';

  const hasUnsavedFileEdits = useMemo(() => {
    if (!activeProject) return false;
    return projectFiles.some(f => Object.prototype.hasOwnProperty.call(editedFiles, `${activeProject.id}:${f.path}`));
  }, [activeProject, projectFiles, editedFiles]);

  const errorCount = consoleLogs.filter(l => l.level === 'error').length;
  const warnCount = consoleLogs.filter(l => l.level === 'warn').length;

  const filteredConsoleLogs = useMemo(() => {
    if (consoleFilter === 'all') return consoleLogs;
    return consoleLogs.filter(l => l.level === consoleFilter);
  }, [consoleLogs, consoleFilter]);

  const handleCopyActiveFile = () => {
    if (!activeFileContent) return;
    try {
      navigator.clipboard.writeText(activeFileContent);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {}
  };

  const handleResetEdits = () => {
    if (!activeProject) return;
    setEditedFiles(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${activeProject.id}:`)) {
          delete next[k];
        }
      });
      return next;
    });
    setConsoleLogs([]);
    setIframeRefreshKey(k => k + 1);
  };

  const handleDeployToVercelFromPreview = async () => {
    if (!activeProject || !result) return;
    const filesToDeploy =
      projectFiles.length > 0
        ? projectFiles.map(f => ({
            path: f.path,
            content: Object.prototype.hasOwnProperty.call(editedFiles, `${activeProject.id}:${f.path}`)
              ? editedFiles[`${activeProject.id}:${f.path}`]
              : f.content
          }))
        : compiledHtml
        ? [{ path: 'index.html', content: compiledHtml }]
        : [];

    if (filesToDeploy.length === 0) return;

    const projectSlug = (result.title || 'vixora-preview-app')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'vixora-app';

    setIsDeployingEdits(true);
    setDeployFeedback(null);
    try {
      const res = await fetch('/api/vercel/deploy-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: projectSlug,
          files: filesToDeploy,
          target: 'production'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Vercel deployment failed');
      }
      const deployedUrl = data.result?.liveUrl || data.result?.deploymentUrl;
      setDeployFeedback({
        ok: true,
        text: deployedUrl ? 'Deployed live to Vercel!' : 'Deployment queued on Vercel.',
        url: deployedUrl
      });
    } catch (err: any) {
      setDeployFeedback({
        ok: false,
        text: err?.message || 'Unable to deploy to Vercel'
      });
    } finally {
      setIsDeployingEdits(false);
    }
  };

  const handleQuickEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = aiQuickEditPrompt.trim();
    if (!trimmed) return;
    const contextPrefix = result?.title ? `Update the "${result.title}" app preview: ` : '';
    onAskAi(`${contextPrefix}${trimmed}`);
    setAiQuickEditPrompt('');
  };

  const handleFixRuntimeErrors = () => {
    const errors = consoleLogs
      .filter(l => l.level === 'error')
      .slice(0, 5)
      .map(e => e.message)
      .join('\n');
    if (!errors) return;
    onAskAi(
      `Fix these runtime console errors in "${result?.title || 'the current app'}":\n${errors}`
    );
  };

  const vixoraOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeAddressLabel =
    sourceMode === 'live' && liveExternalUrl
      ? liveExternalUrl
      : sourceMode === 'vixora'
      ? `${vixoraOrigin}${vixoraAppPath}`
      : `preview://${(result?.title || 'app-sandbox').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;

  const openInTabHref =
    sourceMode === 'live' && liveExternalUrl
      ? liveExternalUrl
      : sourceMode === 'vixora'
      ? `${vixoraOrigin}${vixoraAppPath}`
      : blobPreviewUrl || '#';

  const isLight = themeMode === 'light';
  const surfaceBg = isLight ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-slate-950 text-slate-100 border-white/10';
  const chromeBg = isLight ? 'bg-white border-slate-200' : 'bg-slate-900/95 border-white/10';

  const renderViewportFrame = () => {
    const showLiveUrl = sourceMode === 'live' && Boolean(liveExternalUrl);
    const showVixoraEmbed = sourceMode === 'vixora';
    const hasSandboxHtml = Boolean(instrumentedSrcDoc);

    if (!showLiveUrl && !showVixoraEmbed && !hasSandboxHtml) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-6 text-center ${isLight ? 'bg-slate-100' : 'bg-slate-950'}`}>
          <div className={`max-w-lg w-full rounded-2xl border p-6 space-y-5 ${chromeBg}`}>
            <div className="w-12 h-12 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center justify-center text-lg mx-auto">
              <i className="fa-solid fa-window-maximize"></i>
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold tracking-tight">Developer Preview Workbench</h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Build a web app or website with Vixora AI in chat to inspect it at full size, switch between Desktop, Tablet, and Mobile viewports, edit source files live, and check runtime console logs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left">
              {[
                {
                  title: 'SaaS Landing Page',
                  desc: 'Pricing, interactive demo & signup',
                  prompt: 'Build a complete modern SaaS landing website for an AI Creator Analytics platform with interactive pricing calculator and live preview'
                },
                {
                  title: 'Analytics Dashboard',
                  desc: 'Charts, KPIs & dark mode workspace',
                  prompt: 'Build an interactive Creator Revenue & Analytics web app dashboard with filterable charts and live preview'
                },
                {
                  title: 'Digital Storefront',
                  desc: 'Product grid, cart drawer & checkout',
                  prompt: 'Build an interactive modern e-commerce storefront web app with working shopping cart drawer and live preview'
                },
                {
                  title: 'Preview Vixora Studio',
                  desc: 'Load live Vixora app inside frame',
                  action: () => setSourceMode('vixora')
                }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => (item.action ? item.action() : item.prompt && onAskAi(item.prompt))}
                  className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 hover:bg-orange-50 border-slate-200 hover:border-orange-300'
                      : 'bg-white/[0.03] hover:bg-orange-500/10 border-white/10 hover:border-orange-500/40'
                  }`}
                >
                  <p className="text-xs font-bold">{item.title}</p>
                  <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const frameMaxWidth =
      device === 'mobile' ? '390px' : device === 'tablet' ? '768px' : '100%';
    const frameHeightClass =
      device === 'desktop' ? 'h-full w-full' : 'h-full max-h-[844px] shadow-2xl rounded-2xl border border-white/15';

    return (
      <div
        className={`w-full h-full flex flex-col items-center justify-center overflow-auto ${
          device === 'desktop'
            ? isLight
              ? 'bg-white'
              : 'bg-slate-950'
            : isLight
            ? 'bg-slate-200/80 p-3 sm:p-5'
            : 'bg-[#070b14] p-3 sm:p-5'
        }`}
      >
        {device !== 'desktop' && (
          <div className="mb-2 flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
            <span>{device === 'mobile' ? 'Mobile Viewport' : 'Tablet Viewport'}</span>
            <span>·</span>
            <span>{device === 'mobile' ? '390px' : '768px'} wide</span>
          </div>
        )}

        <div
          className={`bg-white overflow-hidden transition-all duration-200 ${frameHeightClass}`}
          style={{ width: frameMaxWidth, maxWidth: '100%' }}
        >
          {showLiveUrl ? (
            <iframe
              key={`live-${activeProject?.id}-${iframeRefreshKey}-${liveExternalUrl}`}
              title={`${result?.title || 'Live App'} Preview`}
              src={liveExternalUrl}
              allow="camera; microphone; display-capture; clipboard-write;"
              className="w-full h-full border-0 bg-white"
            />
          ) : showVixoraEmbed ? (
            <iframe
              key={`vixora-${iframeRefreshKey}-${vixoraAppPath}`}
              title="Vixora Studio App Preview"
              src={`${vixoraOrigin}${vixoraAppPath}`}
              allow="camera; microphone; display-capture; clipboard-write;"
              className="w-full h-full border-0 bg-slate-950"
            />
          ) : (
            <iframe
              key={`sandbox-${activeProject?.id}-${iframeRefreshKey}-${hasUnsavedFileEdits ? 'edited' : 'base'}`}
              title={`${result?.title || 'App'} Sandbox Preview`}
              srcDoc={instrumentedSrcDoc}
              sandbox="allow-scripts allow-forms allow-modals allow-popups"
              className="w-full h-full border-0 bg-white"
            />
          )}
        </div>
      </div>
    );
  };

  const renderCodeEditor = () => {
    if (projectFiles.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <i className="fa-solid fa-folder-open text-2xl mb-2 opacity-60"></i>
          <p className="text-xs font-semibold">No source files attached to this preview yet.</p>
          <p className="text-[11px] mt-1 max-w-xs">
            Ask Vixora in chat to build a website or inspect a repository to edit its source files here.
          </p>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col sm:flex-row min-h-0 overflow-hidden bg-slate-950 text-slate-100">
        {/* File Explorer */}
        <div className="w-full sm:w-48 lg:w-52 shrink-0 border-b sm:border-b-0 sm:border-r border-white/10 bg-slate-900/70 flex sm:flex-col overflow-x-auto sm:overflow-y-auto p-2 gap-1">
          <div className="hidden sm:flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400">
            <span>Files ({projectFiles.length})</span>
            {hasUnsavedFileEdits && (
              <button
                type="button"
                onClick={handleResetEdits}
                className="text-orange-400 hover:text-orange-300 cursor-pointer whitespace-nowrap shrink-0"
                title="Reset local edits"
              >
                Reset
              </button>
            )}
          </div>
          {projectFiles.map((file, idx) => {
            const isSelected = idx === selectedFileIndex;
            const isEdited = activeProject
              ? Object.prototype.hasOwnProperty.call(editedFiles, `${activeProject.id}:${file.path}`)
              : false;
            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFileIndex(idx)}
                className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-mono flex items-center gap-2 transition-colors cursor-pointer shrink-0 sm:shrink ${
                  isSelected
                    ? 'bg-orange-500/15 text-orange-300 border border-orange-500/40 font-semibold'
                    : 'text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <i className={`${getFileIconClass(file.path)} text-xs shrink-0`}></i>
                <span className="truncate">{file.path}</span>
                {isEdited && <span className="ml-auto text-[10px] text-amber-400">*</span>}
              </button>
            );
          })}
        </div>

        {/* Editable Source Code Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <div className="px-3 py-2 border-b border-white/10 bg-slate-900/50 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-slate-200 truncate">{activeFile?.path}</span>
              {activeFile?.reason && (
                <span className="hidden md:inline text-[11px] text-slate-400 truncate">
                  — {activeFile.reason}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasUnsavedFileEdits && (
                <button
                  type="button"
                  onClick={handleResetEdits}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-300 cursor-pointer whitespace-nowrap shrink-0"
                >
                  Revert Edits
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyActiveFile}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-slate-200 cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
              >
                <i className={`fa-solid ${copiedCode ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={activeFileContent}
            onChange={e => {
              if (!activeFileEditKey) return;
              const nextVal = e.target.value;
              setEditedFiles(prev => ({
                ...prev,
                [activeFileEditKey]: nextVal
              }));
            }}
            spellCheck={false}
            aria-label={`Edit ${activeFile?.path || 'code file'}`}
            className="flex-1 w-full p-3.5 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed outline-none resize-none selection:bg-orange-500/30"
          />
        </div>
      </div>
    );
  };

  const renderConsolePanel = () => (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 min-h-0">
      <div className="px-3 py-2 border-b border-white/10 bg-slate-900/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5">
          {(['all', 'error', 'warn'] as const).map(filterKey => (
            <button
              key={filterKey}
              type="button"
              onClick={() => setConsoleFilter(filterKey)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                consoleFilter === filterKey
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {filterKey === 'all'
                ? `All (${consoleLogs.length})`
                : filterKey === 'error'
                ? `Errors (${errorCount})`
                : `Warnings (${warnCount})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <button
              type="button"
              onClick={handleFixRuntimeErrors}
              className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>Fix Errors with AI</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setConsoleLogs([])}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-slate-300 cursor-pointer whitespace-nowrap shrink-0"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-1.5">
        {filteredConsoleLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
            <i className="fa-solid fa-terminal text-xl mb-2 opacity-60"></i>
            <p className="text-xs">No console output captured yet for this preview.</p>
          </div>
        ) : (
          filteredConsoleLogs.map(entry => (
            <div
              key={entry.id}
              className={`px-2.5 py-1.5 rounded-lg border flex items-start gap-2.5 ${
                entry.level === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-200'
                  : entry.level === 'warn'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : 'bg-white/[0.02] border-white/5 text-slate-200'
              }`}
            >
              <span className="text-[10px] text-slate-500 tabular-nums shrink-0 mt-0.5">
                {entry.timestamp}
              </span>
              <span
                className={`text-[10px] font-bold uppercase shrink-0 mt-0.5 ${
                  entry.level === 'error'
                    ? 'text-red-400'
                    : entry.level === 'warn'
                    ? 'text-amber-400'
                    : 'text-cyan-400'
                }`}
              >
                {entry.level}
              </span>
              <pre className="whitespace-pre-wrap break-words flex-1 font-mono text-[11px] leading-snug">
                {entry.message}
              </pre>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <section
      aria-label="Full Developer Preview"
      className={
        isFullscreen
          ? `fixed inset-0 z-[280] flex flex-col overflow-hidden ${surfaceBg}`
          : `w-full h-full flex flex-col overflow-hidden border-l ${surfaceBg}`
      }
    >
      {/* 1. TOP LOVABLE-STYLE WORKBENCH CHROME */}
      <div className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${chromeBg}`}>
        {/* Left: View Switcher Tabs + Project Selector */}
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <div className={`inline-flex items-center p-0.5 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-white/10'}`}>
            {([
              { id: 'preview', label: 'Preview', icon: 'fa-eye' },
              { id: 'split', label: 'Split', icon: 'fa-table-columns' },
              { id: 'code', label: 'Code', icon: 'fa-code' },
              { id: 'console', label: errorCount > 0 ? `Console (${errorCount})` : 'Console', icon: 'fa-terminal' }
            ] as const).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewTab(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  viewTab === tab.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : tab.id === 'console' && errorCount > 0
                    ? 'text-red-400 hover:bg-red-500/10'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <i className={`fa-solid ${tab.icon} text-[10px]`}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {projects.length > 1 && (
            <select
              value={activeProject?.id || ''}
              onChange={e => onSelectProject(e.target.value)}
              aria-label="Select app build preview"
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold outline-none max-w-[180px] truncate cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-white/15 text-slate-200'
              }`}
            >
              {projects.map((p, i) => (
                <option key={p.id} value={p.id}>
                  #{i + 1} · {p.result.title}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Center: Device Switcher */}
        <div className="flex items-center gap-1.5">
          {(viewTab === 'preview' || viewTab === 'split') && (
            <div className={`inline-flex items-center p-0.5 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-white/10'}`}>
              {([
                { id: 'desktop', label: 'Desktop', icon: 'fa-desktop' },
                { id: 'tablet', label: 'Tablet', icon: 'fa-tablet-screen-button' },
                { id: 'mobile', label: 'Mobile', icon: 'fa-mobile-screen-button' }
              ] as const).map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDevice(d.id)}
                  title={`${d.label} Viewport`}
                  className={`px-2 py-1 rounded-lg text-[11px] flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    device === d.id
                      ? isLight
                        ? 'bg-white text-slate-900 shadow-sm font-semibold'
                        : 'bg-white/15 text-white font-semibold'
                      : isLight
                      ? 'text-slate-500 hover:text-slate-900'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${d.icon} text-[11px]`}></i>
                  <span className="hidden xl:inline">{d.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Deploy, Fullscreen & Close Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(compiledHtml || projectFiles.length > 0) && (
            <button
              type="button"
              onClick={handleDeployToVercelFromPreview}
              disabled={isDeployingEdits}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
              title="Deploy current preview build live to Vercel"
            >
              <i className={`fa-solid ${isDeployingEdits ? 'fa-circle-notch animate-spin' : 'fa-rocket'} text-[10px]`}></i>
              <span>{isDeployingEdits ? 'Deploying...' : hasUnsavedFileEdits ? 'Publish Edits' : 'Publish'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen Preview' : 'Expand Fullscreen Preview'}
            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              isFullscreen
                ? 'bg-orange-500 text-white border-orange-500'
                : isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
            }`}
          >
            <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-[10px]`}></i>
            <span className="hidden sm:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Close Developer Preview"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-600'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      {/* 2. BROWSER ADDRESS BAR & SOURCE SWITCHER */}
      <div className={`px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${isLight ? 'bg-slate-100/80 border-slate-200' : 'bg-slate-950/90 border-white/10'}`}>
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          <button
            type="button"
            onClick={handleReloadPreview}
            title="Reload Preview"
            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] transition-colors cursor-pointer shrink-0 ${
              isLight
                ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
          >
            <i className="fa-solid fa-rotate-right"></i>
          </button>

          <div
            className={`flex-1 min-w-0 px-2.5 py-1 rounded-lg border flex items-center justify-between gap-2 text-[11px] font-mono ${
              isLight
                ? 'bg-white border-slate-300 text-slate-700'
                : 'bg-slate-900 border-white/10 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <i
                className={`fa-solid ${
                  sourceMode === 'live' ? 'fa-globe text-emerald-400' : 'fa-shield-halved text-cyan-400'
                } text-[10px] shrink-0`}
              ></i>
              <span className="truncate">{activeAddressLabel}</span>
            </div>
            {hasUnsavedFileEdits && (
              <span className="text-[10px] font-sans font-semibold text-amber-400 shrink-0">
                Edited locally
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Source Switcher when live URL or sandbox exists */}
          {(compiledHtml || liveExternalUrl) && (
            <div className={`inline-flex items-center p-0.5 rounded-lg border text-[10px] ${isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-white/10'}`}>
              {compiledHtml && (
                <button
                  type="button"
                  onClick={() => setSourceMode('sandbox')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    sourceMode === 'sandbox'
                      ? isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-300'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Sandbox
                </button>
              )}
              {liveExternalUrl && (
                <button
                  type="button"
                  onClick={() => setSourceMode('live')}
                  className={`px-2 py-0.5 rounded font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                    sourceMode === 'live'
                      ? isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-300'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Live URL
                </button>
              )}
              <button
                type="button"
                onClick={() => setSourceMode('vixora')}
                className={`px-2 py-0.5 rounded font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                  sourceMode === 'vixora'
                    ? isLight ? 'bg-orange-100 text-orange-800' : 'bg-orange-500/20 text-orange-300'
                    : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                }`}
              >
                Vixora App
              </button>
            </div>
          )}

          {sourceMode === 'vixora' && (
            <select
              value={vixoraAppPath}
              onChange={e => setVixoraAppPath(e.target.value)}
              aria-label="Select current app route"
              className={`px-2 py-1 rounded-lg border text-[11px] font-medium outline-none cursor-pointer ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-white/10 text-slate-200'
              }`}
            >
              <option value="/studio">Current App · Studio Home</option>
              <option value="/videos">Current App · Video Creator</option>
              <option value="/flyer-ad">Current App · Flyer Ad Studio</option>
              <option value="/scripts">Current App · AI Scripts</option>
              <option value="/developer">Current App · Developer API</option>
              <option value="/?embed=creator">Embed · Video Studio</option>
              <option value="/?embed=scripts">Embed · AI Script Studio</option>
              <option value="/?embed=voiceover">Embed · Voiceover Studio</option>
            </select>
          )}

          {compiledHtml && blobPreviewUrl && (
            <a
              href={blobPreviewUrl}
              download={`${(result?.title || 'vixora-app').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.html`}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
              }`}
              title="Download standalone HTML file"
            >
              <i className="fa-solid fa-download text-[10px]"></i>
              <span className="hidden sm:inline">HTML</span>
            </a>
          )}

          {openInTabHref !== '#' && (
            <a
              href={openInTabHref}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
              }`}
              title="Open preview in a new browser tab"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
              <span className="hidden sm:inline">Open Tab</span>
            </a>
          )}
        </div>
      </div>

      {/* Deploy status feedback bar if user clicked Publish */}
      {deployFeedback && (
        <div
          className={`px-3 py-1.5 border-b text-xs flex items-center justify-between gap-2 shrink-0 ${
            deployFeedback.ok
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <i className={`fa-solid ${deployFeedback.ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
            <span className="truncate">{deployFeedback.text}</span>
            {deployFeedback.url && (
              <a
                href={deployFeedback.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-mono text-[11px] truncate"
              >
                {deployFeedback.url}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setDeployFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer shrink-0"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      )}

      {/* 3. MAIN WORKSPACE CONTENT AREA */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {viewTab === 'preview' && renderViewportFrame()}
        {viewTab === 'code' && renderCodeEditor()}
        {viewTab === 'console' && renderConsolePanel()}
        {viewTab === 'split' && (
          <div className="w-full h-full grid grid-cols-1 xl:grid-cols-2 min-h-0 overflow-hidden">
            <div className="h-full min-h-[260px] border-b xl:border-b-0 xl:border-r border-white/10 overflow-hidden">
              {renderCodeEditor()}
            </div>
            <div className="h-full min-h-[300px] overflow-hidden">
              {renderViewportFrame()}
            </div>
          </div>
        )}
      </div>

      {/* 4. QUICK AI ITERATION BAR (Direct Prompt from Preview) */}
      <form
        onSubmit={handleQuickEditSubmit}
        className={`px-3 py-2 border-t flex items-center gap-2 shrink-0 ${chromeBg}`}
      >
        <i className="fa-solid fa-wand-magic-sparkles text-orange-400 text-xs shrink-0"></i>
        <input
          type="text"
          value={aiQuickEditPrompt}
          onChange={e => setAiQuickEditPrompt(e.target.value)}
          placeholder={
            result?.title
              ? `Ask Vixora to edit "${result.title}" (e.g., change colors, add pricing section, fix mobile layout)...`
              : 'Ask Vixora to build a website or web app into this live preview...'
          }
          className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
            isLight
              ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-orange-500'
              : 'bg-slate-950 border-white/10 text-white focus:border-orange-500'
          }`}
        />
        <button
          type="submit"
          disabled={!aiQuickEditPrompt.trim()}
          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          Apply Edit
        </button>
      </form>
    </section>
  );
};
