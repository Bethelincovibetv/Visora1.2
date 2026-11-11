import React, { useState, useEffect, useRef } from 'react';
import { VIXORA_AGENT_TOOLS, VixoraAppContext } from '../services/vixoraAgentTools';
import vixoraAgentAvatar from '../src/assets/images/vixora_agent_avatar_1786108775324.jpg';

export interface VideoResultData {
  id: string;
  topic: string;
  scriptText: string;
  videoUrl: string;
  previewImageUrl?: string;
  aspectRatio: 'vertical' | 'horizontal' | 'square';
  duration: string;
  scenes: Array<{
    id: string | number;
    title: string;
    thumbnail: string;
    videoUrl?: string;
    query?: string;
    duration?: number;
  }>;
  voiceoverUrl?: string;
  voiceName?: string;
  createdAt: string;
}

export interface VideoProgressData {
  step: number;
  totalSteps: number;
  stepName: string;
  detail: string;
  percent: number;
  isComplete: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'vixora';
  text: string;
  timestamp: string;
  actionBadge?: string;
  imageUrl?: string;
  attachedFile?: { name: string; text?: string };
  isThinking?: boolean;
  navigatedTab?: string;
  agentId?: string;
  videoCreationProgress?: VideoProgressData;
  videoResult?: VideoResultData;
}

export interface AgentPersona {
  id: 'vixora_coach' | 'video_director' | 'script_master' | 'growth_strategist' | 'voice_producer';
  name: string;
  shortName: string;
  title: string;
  tagline: string;
  icon: string;
  badge: string;
  color: string;
  gradient: string;
  welcomeText: string;
  suggestedPrompts: Array<{
    title: string;
    desc: string;
    prompt: string;
    icon: string;
  }>;
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: AgentPersona['id'];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface VixoraTextChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  appContext: VixoraAppContext;
  apiKey: string;
  themeMode?: 'light' | 'dark';
  isFullTab?: boolean;
  onStartLiveAssistant?: () => void;
  initialPrompt?: string;
}

export const CLAUDE_STYLE_AGENTS: AgentPersona[] = [
  {
    id: 'vixora_coach',
    name: 'Vixora AI Assistant',
    shortName: 'Vixora',
    title: 'Executive Producer & Master App Commander',
    tagline: 'The Ultimate All-in-One Creator AI for Scripts, Videos, TTS & Studio Control',
    icon: 'fa-bolt-lightning',
    badge: 'ULTIMATE MASTER AI',
    color: 'text-amber-500',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    welcomeText: "How far my creator! 👋 I am Vixora, your Ultimate AI Studio Assistant and Executive Producer. I handle everything for you across all tools—writing viral scripts, cooking autopilot videos, sourcing HD stock clips, generating voiceovers, tuning SEO growth tags, and controlling the app in real time! What are we cooking today?",
    suggestedPrompts: [
      {
        title: 'Cook a 30s Viral Video',
        desc: 'Autopilot generation for Finance & Wealth',
        prompt: 'Cook a viral 30-second TikTok video about 5 Money Rules for Wealth on autopilot',
        icon: 'fa-wand-magic-sparkles'
      },
      {
        title: 'Write a High-Retention Script',
        desc: 'Psychology or motivation script',
        prompt: 'Write a high-retention 30-second script on dark psychology body language hacks',
        icon: 'fa-scroll'
      },
      {
        title: 'Set Voice to Nigerian Accent',
        desc: 'Switch to Kore Nigerian female tone',
        prompt: 'Switch narrator voice to Kore Nigerian accent and open voiceover studio',
        icon: 'fa-waveform-lines'
      },
      {
        title: 'Generate High-CTR SEO Tags',
        desc: 'Algorithm optimization & titles',
        prompt: 'Generate 5 high-CTR titles and 20 SEO tags for a viral tech and AI breakthrough video',
        icon: 'fa-chart-line'
      }
    ]
  }
];

// --- HELPERS FOR AUTOMATED AGENT VIDEO CREATION ---

export const isVideoCreationIntent = (text: string) => {
  const t = text.toLowerCase();
  return (
    (t.includes('cook') && (t.includes('video') || t.includes('tiktok') || t.includes('short') || t.includes('reel'))) ||
    (t.includes('create') && (t.includes('video') || t.includes('short') || t.includes('reel'))) ||
    (t.includes('make') && (t.includes('video') || t.includes('short') || t.includes('reel'))) ||
    (t.includes('generate') && (t.includes('video') || t.includes('short') || t.includes('reel'))) ||
    t.includes('autopilot video') ||
    t.includes('video on autopilot')
  );
};

export const extractTopicFromPrompt = (text: string) => {
  let cleaned = text
    .replace(/^(cook|create|make|generate|build)\s+(a|an)?\s*(viral)?\s*(\d+s|\d+\s*second|\d+\s*sec)?\s*(vertical|horizontal|square)?\s*(tiktok|youtube|instagram)?\s*(shorts?|reels?|video)\s*(about|on|for)?/i, '')
    .replace(/\s+(on autopilot|in 1 click|automatically|with voiceover|with music).*$/i, '')
    .replace(/^about\s+/i, '')
    .replace(/^on\s+/i, '')
    .trim();
  return cleaned || text.slice(0, 50);
};

// --- CHAT VIDEO PROGRESS CARD COMPONENT ---

export const ChatVideoProgressCard: React.FC<{ progress: VideoProgressData }> = ({ progress }) => {
  const steps = [
    { num: 1, label: 'Hook Strategy', icon: 'fa-brain' },
    { num: 2, label: 'Viral Script', icon: 'fa-scroll' },
    { num: 3, label: 'HD B-Roll', icon: 'fa-film' },
    { num: 4, label: 'Voiceover', icon: 'fa-microphone' },
    { num: 5, label: 'Master Render', icon: 'fa-wand-magic-sparkles' }
  ];

  return (
    <div className="w-full mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 border border-orange-500/40 shadow-2xl space-y-3 animate-rise">
      {/* HEADER: BADGE & PROGRESS PERCENT */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center text-[10px] animate-pulse">
            <i className="fa-solid fa-robot"></i>
          </div>
          <div>
            <span className="font-black uppercase tracking-wider text-[10px] text-orange-400 flex items-center gap-1.5">
              <span>Vixora Autonomous Agent</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            </span>
            <p className="text-[8.5px] text-slate-400 font-bold uppercase tracking-wider">
              Automated Video Engine Active
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 font-mono font-black text-xs">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
          <span>{progress.percent}%</span>
        </div>
      </div>

      {/* GLOWING PROGRESS BAR */}
      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-full transition-all duration-500 relative"
          style={{ width: `${Math.max(8, progress.percent)}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>

      {/* CURRENT STEP & LIVE LOG */}
      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-black text-white uppercase tracking-tight flex items-center gap-1.5">
            <i className="fa-solid fa-spinner animate-spin text-orange-400"></i>
            Step {progress.step} of {progress.totalSteps}: {progress.stepName}
          </span>
          <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-black uppercase">
            In Progress
          </span>
        </div>
        <p className="text-[10px] text-slate-300 font-medium leading-relaxed italic">
          "{progress.detail}"
        </p>
      </div>

      {/* 5-STEP HORIZONTAL MILESTONE TRACKER */}
      <div className="grid grid-cols-5 gap-1 pt-0.5">
        {steps.map(s => {
          const isDone = s.num < progress.step || (s.num === 5 && progress.percent >= 100);
          const isCurrent = s.num === progress.step && progress.percent < 100;
          return (
            <div
              key={s.num}
              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                isDone
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : isCurrent
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-md scale-102 animate-pulse'
                  : 'bg-white/[0.02] border-white/5 text-slate-500'
              }`}
            >
              <i
                className={`fa-solid ${
                  isDone ? 'fa-check' : isCurrent ? 'fa-circle-notch animate-spin' : s.icon
                } text-[10px] mb-0.5`}
              ></i>
              <span className="text-[7px] font-black uppercase truncate max-w-full">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- CHAT VIDEO RESULT CARD COMPONENT ---

export const ChatVideoResultCard: React.FC<{
  result: VideoResultData;
  onOpenSequencer: (data: VideoResultData) => void;
  themeMode?: 'light' | 'dark';
}> = ({ result, onOpenSequencer, themeMode = 'dark' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [showFullScript, setShowFullScript] = useState(false);
  const [isCopiedScript, setIsCopiedScript] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentScene = result.scenes[activeSceneIdx] || result.scenes[0];
  const videoSrc = currentScene?.videoUrl || result.videoUrl;

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {});
      setIsAudioPlaying(true);
    } else {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    }
  };

  const handleCopyScript = () => {
    try {
      navigator.clipboard.writeText(result.scriptText);
      setIsCopiedScript(true);
      setTimeout(() => setIsCopiedScript(false), 2500);
    } catch {}
  };

  return (
    <div className="w-full mt-3 rounded-2xl overflow-hidden border border-orange-500/50 bg-slate-950/95 shadow-2xl text-white animate-rise">
      {/* 1. TOP VIDEO HEADER BAR */}
      <div className="p-3 bg-gradient-to-r from-orange-600/30 via-amber-600/20 to-slate-900/60 border-b border-white/10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs shrink-0 shadow-md">
            <i className="fa-solid fa-clapperboard"></i>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-black uppercase tracking-tight text-white truncate">
              {result.topic}
            </h4>
            <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-slate-300">
              <span className="px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                {result.aspectRatio === 'vertical' ? '9:16 Shorts' : result.aspectRatio === 'horizontal' ? '16:9 YouTube' : '1:1 Square'}
              </span>
              <span>•</span>
              <span>{result.duration}</span>
              <span>•</span>
              <span>{result.scenes.length} Scenes</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">1080p HD</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenSequencer(result)}
          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition-all shrink-0 cursor-pointer"
          title="Open in Creator Studio Sequencer"
        >
          <i className="fa-solid fa-arrow-up-right-from-square text-[8px]"></i>
          <span>Edit in Studio</span>
        </button>
      </div>

      {/* 2. MAIN VIDEO PREVIEW PLAYER (Interactive & Playable) */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[16/10] bg-black flex items-center justify-center overflow-hidden group">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={currentScene?.thumbnail || result.previewImageUrl}
            playsInline
            loop
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={toggleVideoPlay}
            className="w-full h-full object-cover cursor-pointer"
          />
        ) : (
          <img
            src={currentScene?.thumbnail || result.previewImageUrl}
            alt={result.topic}
            className="w-full h-full object-cover"
          />
        )}

        {/* Big Center Play/Pause Button Overlay */}
        <button
          type="button"
          onClick={toggleVideoPlay}
          className={`absolute w-12 h-12 rounded-full bg-black/70 hover:bg-orange-600/90 border border-white/40 backdrop-blur-md text-white flex items-center justify-center text-lg shadow-2xl transition-all active:scale-90 cursor-pointer ${
            isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
          }`}
          title={isPlaying ? "Pause Video" : "Play Video"}
        >
          <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
        </button>

        {/* Video Bottom Overlay Pill: Scene Label */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-white border border-white/10 font-bold truncate max-w-[220px]">
            Scene {activeSceneIdx + 1}: {currentScene?.title || currentScene?.query || result.topic}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-emerald-400 font-mono font-bold">
            Ready
          </span>
        </div>
      </div>

      {/* 3. SCENE BEATS STRIP (Horizontal Scrollable Storyboard) */}
      <div className="p-2.5 bg-slate-950/80 border-t border-b border-white/10">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
            Sourced Scene Beats ({result.scenes.length} Clips)
          </span>
          <span className="text-[8.5px] text-orange-400 font-bold">
            Click thumbnail to preview clip
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {result.scenes.map((scene, idx) => {
            const isSelected = idx === activeSceneIdx;
            return (
              <button
                key={scene.id || idx}
                type="button"
                onClick={() => {
                  setActiveSceneIdx(idx);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }}
                className={`relative w-20 h-14 rounded-xl overflow-hidden border shrink-0 transition-all text-left group cursor-pointer ${
                  isSelected
                    ? 'border-orange-500 shadow-md ring-2 ring-orange-500/50 scale-102'
                    : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={scene.thumbnail}
                  alt={scene.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <span className="absolute bottom-1 left-1 text-[8px] font-black text-white">
                  #{idx + 1}
                </span>
                {isSelected && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. VOICEOVER NARRATION AUDIO PLAYER (If Available) */}
      {result.voiceoverUrl && (
        <div className="px-3 py-2 bg-slate-900/60 border-b border-white/10 flex items-center justify-between gap-2">
          <audio
            ref={audioRef}
            src={result.voiceoverUrl}
            onPlay={() => setIsAudioPlaying(true)}
            onPause={() => setIsAudioPlaying(false)}
            onEnded={() => setIsAudioPlaying(false)}
            className="hidden"
          />
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={toggleAudioPlay}
              className="w-7 h-7 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/40 flex items-center justify-center text-xs transition-all active:scale-95 shrink-0 cursor-pointer"
              title={isAudioPlaying ? "Pause Audio" : "Listen to Voiceover"}
            >
              <i className={`fa-solid ${isAudioPlaying ? 'fa-pause' : 'fa-play ml-0.5'}`}></i>
            </button>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-tight text-white flex items-center gap-1.5 truncate">
                <span>Voiceover Narration</span>
                <span className="text-emerald-400">({result.voiceName || 'Kore'})</span>
              </p>
              <p className="text-[8px] text-slate-400 truncate">
                Studio synthesized speech
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-400 shrink-0">
            <i className={`fa-solid fa-waveform-lines text-xs ${isAudioPlaying ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}></i>
          </div>
        </div>
      )}

      {/* 5. VIRAL SCRIPT DRAWER (Collapsible with 1-Click Copy) */}
      <div className="p-3 bg-slate-950/40 space-y-2">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFullScript(!showFullScript)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase text-orange-400 hover:text-orange-300 transition-colors cursor-pointer"
          >
            <i className={`fa-solid ${showFullScript ? 'fa-chevron-up' : 'fa-chevron-down'} text-[8px]`}></i>
            <span>{showFullScript ? 'Hide Written Script' : 'View Viral Script'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyScript}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
          >
            <i className={`fa-solid ${isCopiedScript ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
            <span>{isCopiedScript ? 'Copied!' : 'Copy Script'}</span>
          </button>
        </div>

        {showFullScript && (
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] leading-relaxed text-slate-200 select-text whitespace-pre-wrap font-sans max-h-48 overflow-y-auto scrollbar-none animate-fade-in">
            {result.scriptText}
          </div>
        )}

        {/* 6. ACTION BUTTONS ROW */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenSequencer(result)}
            className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-film"></i>
            <span>Open in Video Creator</span>
          </button>

          {result.videoUrl && (
            <a
              href={result.videoUrl}
              download={`${result.topic.slice(0, 25).replace(/\s+/g, '_')}_vixora.mp4`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-98 cursor-pointer"
            >
              <i className="fa-solid fa-download text-ggd-orange"></i>
              <span>Download MP4</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export const VixoraTextChatPanel: React.FC<VixoraTextChatPanelProps> = ({
  isOpen,
  onClose,
  appContext,
  apiKey,
  themeMode = 'dark',
  isFullTab = false,
  onStartLiveAssistant,
  initialPrompt
}) => {
  // --- MULTI-SESSION CHAT STATE (ChatGPT & Claude Style) ---
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const savedSessions = localStorage.getItem('vixora_chat_sessions_v1');
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Backward compatibility: migrate old single-thread history if present
      const oldHistory = localStorage.getItem('vixora_text_chat_history');
      if (oldHistory) {
        const parsedOld = JSON.parse(oldHistory);
        if (Array.isArray(parsedOld) && parsedOld.length > 0) {
          return [
            {
              id: 'session_initial',
              title: 'Creator Workspace Chat',
              agentId: 'vixora_coach',
              messages: parsedOld,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
        }
      }
    } catch (e) {
      console.warn('Session restoration note:', e);
    }

    const defaultAgent = CLAUDE_STYLE_AGENTS[0];
    return [
      {
        id: 'session_' + Date.now(),
        title: 'New Conversation',
        agentId: 'vixora_coach',
        messages: [
          {
            id: 'msg_welcome',
            sender: 'vixora',
            text: defaultAgent.welcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentId: defaultAgent.id
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session_default';
  });

  // Sidebar Controls (Left-Side Navigation)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Default open on wide screens, closed on small mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitleText, setEditingTitleText] = useState<string>('');

  // Active Session & Agent Derivation
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const activeAgent = CLAUDE_STYLE_AGENTS.find(a => a.id === activeSession?.agentId) || CLAUDE_STYLE_AGENTS[0];
  const messages = activeSession?.messages || [];

  // Chat Input & Interaction State
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; text: string } | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vixora_chat_sessions_v1', JSON.stringify(sessions));
      // Keep legacy history synced with active session for fallback readers
      if (activeSession?.messages) {
        localStorage.setItem('vixora_text_chat_history', JSON.stringify(activeSession.messages));
      }
    } catch (e) {}
  }, [sessions, activeSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen || isFullTab) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, isFullTab, messages, isProcessing]);

  // Handle initialPrompt prop if passed
  useEffect(() => {
    if (initialPrompt) {
      setInputQuery(initialPrompt);
    }
  }, [initialPrompt]);

  // Focus rename input when editing starts
  useEffect(() => {
    if (editingSessionId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingSessionId]);

  // --- SESSION MANAGEMENT HANDLERS (ChatGPT & Claude Style) ---

  const handleCreateNewChat = (specificAgentId?: AgentPersona['id']) => {
    const targetAgentId = specificAgentId || activeAgent.id;
    const agent = CLAUDE_STYLE_AGENTS.find(a => a.id === targetAgentId) || CLAUDE_STYLE_AGENTS[0];
    const newSessionId = 'session_' + Date.now();
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Conversation',
      agentId: agent.id,
      messages: [
        {
          id: 'msg_' + Date.now(),
          sender: 'vixora',
          text: agent.welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentId: agent.id
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setInputQuery('');
    setAttachedImage(null);
    setAttachedFile(null);
    setIsAddMenuOpen(false);
    setIsAgentMenuOpen(false);

    // On mobile, close sidebar after starting chat for full keyboard access
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleSwitchSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setInputQuery('');
    setAttachedImage(null);
    setAttachedFile(null);
    setIsAddMenuOpen(false);
    setIsAgentMenuOpen(false);

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleCreateNewChat();
      return;
    }
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    if (activeSessionId === sessionId) {
      setActiveSessionId(updated[0]?.id || 'session_default');
    }
  };

  const handleStartRename = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingTitleText(session.title);
  };

  const handleSaveRename = (sessionId: string) => {
    const clean = editingTitleText.trim() || 'Conversation';
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, title: clean, updatedAt: new Date().toISOString() } : s))
    );
    setEditingSessionId(null);
  };

  const handleClearAllSessions = () => {
    if (window.confirm('Are you sure you want to delete all chat conversations? This cannot be undone.')) {
      localStorage.removeItem('vixora_chat_sessions_v1');
      localStorage.removeItem('vixora_text_chat_history');
      const defaultAgent = CLAUDE_STYLE_AGENTS[0];
      const freshSession: ChatSession = {
        id: 'session_' + Date.now(),
        title: 'New Conversation',
        agentId: defaultAgent.id,
        messages: [
          {
            id: 'msg_welcome',
            sender: 'vixora',
            text: defaultAgent.welcomeText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentId: defaultAgent.id
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setSessions([freshSession]);
      setActiveSessionId(freshSession.id);
    }
  };

  const handleSwitchAgentForCurrentSession = (agentId: AgentPersona['id']) => {
    const agent = CLAUDE_STYLE_AGENTS.find(a => a.id === agentId) || CLAUDE_STYLE_AGENTS[0];
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          const switchNote: ChatMessage = {
            id: `sw_${Date.now()}`,
            sender: 'vixora',
            text: `✨ Switched conversation agent to ${agent.name}. ${agent.tagline}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            actionBadge: `Agent: ${agent.name}`,
            agentId: agent.id
          };
          return {
            ...s,
            agentId: agent.id,
            messages: [...s.messages, switchNote],
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      })
    );
    setIsAgentMenuOpen(false);
  };

  // --- CHAT INTERACTION & AI GENERATION ---

  const interruptAi = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {}
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    const stoppedMsg: ChatMessage = {
      id: `int_${Date.now()}`,
      sender: 'vixora',
      text: '⚡ [Response stopped by creator. Ready for your next instruction!]',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionBadge: 'Interrupted by Creator'
    };

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSessionId
          ? {
              ...s,
              messages: [...s.messages.filter(m => !m.isThinking), stoppedMsg],
              updatedAt: new Date().toISOString()
            }
          : s
      )
    );
  };

  const handleCopyMessage = (msg: ChatMessage) => {
    try {
      navigator.clipboard.writeText(msg.text);
      setCopiedMsgId(msg.id);
      setTimeout(() => setCopiedMsgId(null), 2500);
    } catch (e) {}
  };

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputQuery).trim();
    if (!textToSend && !attachedImage && !attachedFile) return;

    if (isProcessing) {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {}
        abortControllerRef.current = null;
      }
      setIsProcessing(false);
    }

    const currentController = new AbortController();
    abortControllerRef.current = currentController;

    let fullPromptText = textToSend;
    if (attachedFile) {
      fullPromptText += `\n\n[Attached File Content (${attachedFile.name})]:\n${attachedFile.text.slice(0, 3000)}`;
    }

    const userMsgId = `usr_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend || (attachedImage ? 'Uploaded an image for analysis' : 'Uploaded a file'),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageUrl: attachedImage || undefined,
      attachedFile: attachedFile ? { name: attachedFile.name } : undefined
    };

    const thinkingMsgId = `think_${Date.now()}`;
    const thinkingMsg: ChatMessage = {
      id: thinkingMsgId,
      sender: 'vixora',
      text: `${activeAgent.shortName} is thinking & preparing action...`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isThinking: true,
      agentId: activeAgent.id
    };

    // Auto-update session title from first user prompt if still default
    let sessionNewTitle = activeSession?.title;
    if (activeSession?.title === 'New Conversation' && textToSend) {
      sessionNewTitle = textToSend.slice(0, 35) + (textToSend.length > 35 ? '...' : '');
    }

    // Update active session with user message + thinking state
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: sessionNewTitle || s.title,
            messages: [...s.messages.filter(m => !m.isThinking), userMsg, thinkingMsg],
            updatedAt: new Date().toISOString()
          };
        }
        return s;
      })
    );

    setInputQuery('');
    setAttachedImage(null);
    setAttachedFile(null);
    setIsAddMenuOpen(false);
    setIsProcessing(true);

    try {
      // Build Specialized Agent System Instructions
      let systemInstruction = '';
      if (activeAgent.id === 'vixora_coach') {
        systemInstruction = `You are 'Vixora' (Visora AI), the highly energetic, vibrant, warm, and brilliant Nigerian AI Creator Assistant & Video Producer! Address the user warmly by name (${appContext.userFullName || 'Creator'}). Your voice and vibe are 100% highly energetic, lively, witty, supportive, creative, and enthusiastic with authentic, warm Nigerian energy (e.g., "No wahala at all!", "Oya let's cook this viral masterpiece!", "I hear you crystal clear!"). Speak dynamically with high energy. No asterisks (*).

YOUR MANDATE:
You can CONTROL the Vixora AI Studio app directly for the user using function calls/tools!
Whenever the user asks you to open the profile page, configure API keys, make a video, switch tabs, change voice, edit script, change caption style, generate a flyer, or learn a skill, CALL THE APPROPRIATE TOOL!`;
      } else if (activeAgent.id === 'video_director') {
        systemInstruction = `You are the 'Viral Video Director' agent inside Vixora Studio. You are an elite cinematic Short-form video director (TikTok, Reels, YouTube Shorts).
Your focus is visual storytelling, camera angles, lighting, scene duration, B-roll queries for stock engines, and 3-second visual retention hooks.
When the user asks for a video or scene ideas, give specific, actionable B-roll visual search queries and visual directions. You can also call Vixora Studio tools like createAutopilotVideo or navigateToTab when requested!`;
      } else if (activeAgent.id === 'script_master') {
        systemInstruction = `You are the 'Script Master & Copywriter' agent inside Vixora Studio. You are an expert viral copywriter specializing in YouTube Shorts, Instagram Reels, and TikTok scripts.
Strictly adhere to spoken word count pacing: 15s (~35 words max), 30s (~70 words), 60s (~140 words).
Structure every script with: 1) Instant 3-second hook, 2) Story / Insight body, 3) Strong CTA. No filler words. No asterisks (*). Plain text only. You can also trigger generateScript tool when appropriate.`;
      } else if (activeAgent.id === 'growth_strategist') {
        systemInstruction = `You are the 'Growth & SEO Strategist' agent inside Vixora Studio. You are a YouTube, TikTok, and Instagram algorithm growth hacker.
You specialize in curiosity-gap high-CTR video titles, 3-word bold thumbnail text overlays, visual thumbnail compositions, and high-ranking SEO search tags. Always provide formatted lists with CTR rationale.`;
      } else {
        systemInstruction = `You are the 'Voice & Audio Architect' agent inside Vixora Studio. You are a professional sound designer and voiceover director.
You advise creators on voice selection (Kore Nigerian accent, Ngozi, Chidinma, Aoede, Puck, Charon), speech speed calibration (1.0x to 1.2x), background music mood matching, and sound effect cue placement (whooshes, pops, sparkles).`;
      }

      // Format conversation history for Gemini API
      const historyTurns = messages
        .filter(m => !m.isThinking)
        .slice(-10)
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

      // Add current user prompt turn
      const currentParts: any[] = [{ text: fullPromptText }];
      if (attachedImage) {
        const base64Data = attachedImage.split(',')[1];
        const mimeMatch = attachedImage.match(/data:([^;]+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        if (base64Data) {
          currentParts.push({
            inlineData: {
              data: base64Data,
              mimeType
            }
          });
        }
      }
      historyTurns.push({ role: 'user', parts: currentParts });

      let responseText = '';
      let actionBadgeText: string | undefined;
      let generatedImageUrl: string | undefined;
      let targetNavTab: string | undefined;
      let createdVideoResult: VideoResultData | undefined;

      // Real-time Context with Live Stepper Progress Callback
      const chatContext: VixoraAppContext = {
        ...appContext,
        createAutomatedVideoWithAgent: async (opts) => {
          if (!appContext.createAutomatedVideoWithAgent) {
            throw new Error("Automated video engine is not ready.");
          }
          return appContext.createAutomatedVideoWithAgent({
            ...opts,
            onProgress: (prog) => {
              setSessions(prev =>
                prev.map(s => {
                  if (s.id === activeSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map(m =>
                        m.id === thinkingMsgId
                          ? {
                              ...m,
                              videoCreationProgress: prog,
                              text: `⚡ Step ${prog.step}/${prog.totalSteps}: ${prog.stepName} — ${prog.detail}`
                            }
                          : m
                      ),
                      updatedAt: new Date().toISOString()
                    };
                  }
                  return s;
                })
              );
            }
          });
        }
      };

      // Execute via backend Gemini generation proxy endpoint
      try {
        const apiRes = await fetch('/api/gemini/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            contents: historyTurns,
            config: {
              systemInstruction,
              tools: [
                {
                  functionDeclarations: VIXORA_AGENT_TOOLS.map(t => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parameters
                  }))
                }
              ]
            }
          })
        });

        if (!apiRes.ok) {
          throw new Error('Server-side AI chat generation failed');
        }

        const apiData = await apiRes.json();
        const responseTextVal = apiData.text || '';
        const functionCalls =
          apiData.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((p: any) => p.functionCall) ||
          [];

        if (currentController.signal.aborted) return;
        responseText = responseTextVal;

        // Execute function calls if requested by model
        if (functionCalls && functionCalls.length > 0) {
          for (const fc of functionCalls) {
            const tool = VIXORA_AGENT_TOOLS.find(t => t.name === fc.name);
            if (tool) {
              const toolResult = await tool.execute(fc.args, chatContext);
              actionBadgeText = `⚡ ${toolResult.message}`;
              if (toolResult.data?.imageUrl) {
                generatedImageUrl = toolResult.data.imageUrl;
              }
              if (toolResult.data?.videoResult) {
                createdVideoResult = toolResult.data.videoResult;
              }
              if (fc.name === 'navigateToTab' && fc.args?.tab) {
                targetNavTab = String(fc.args.tab);
              }

              try {
                const secondPassTurns = [
                  ...historyTurns,
                  {
                    role: 'model',
                    parts: [{ functionCall: { name: fc.name, args: fc.args } }]
                  },
                  {
                    role: 'user',
                    parts: [
                      {
                        functionResponse: {
                          name: fc.name,
                          response: { result: toolResult.message }
                        }
                      }
                    ]
                  }
                ];

                const secondApiRes = await fetch('/api/gemini/generate', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: secondPassTurns,
                    config: { systemInstruction }
                  })
                });
                const secondData = await secondApiRes.json();
                if (secondData.text) {
                  responseText = secondData.text;
                }
              } catch (err) {
                if (!responseText) {
                  responseText = `No wahala! I have executed ${fc.name}: ${toolResult.message}`;
                }
              }
            }
          }
        }
      } catch (firstPassErr) {
        console.warn('First pass chat model call fallback:', firstPassErr);
        if (currentController.signal.aborted) return;
        try {
          const fallbackApiRes = await fetch('/api/gemini/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gemini-2.5-flash',
              contents: historyTurns,
              config: { systemInstruction }
            })
          });
          const fallbackData = await fallbackApiRes.json();
          responseText = fallbackData.text || '';
        } catch (secondPassErr) {
          console.warn('Second pass fallback warning:', secondPassErr);
        }
      }

      if (currentController.signal.aborted) return;

      // DIRECT AGENT AUTOMATION: If user explicitly asked to cook/create video and tool wasn't invoked
      if (!createdVideoResult && isVideoCreationIntent(fullPromptText) && chatContext.createAutomatedVideoWithAgent) {
        const topic = extractTopicFromPrompt(fullPromptText);
        const lower = fullPromptText.toLowerCase();
        const ratio = lower.includes('horizontal') || lower.includes('16:9') || lower.includes('landscape')
          ? 'horizontal'
          : lower.includes('square') || lower.includes('1:1')
          ? 'square'
          : 'vertical';
        const duration = lower.includes('15s') || lower.includes('15 sec')
          ? '15s'
          : lower.includes('60s') || lower.includes('60 sec') || lower.includes('1 min')
          ? '60s'
          : '30s';

        try {
          const videoRes = await chatContext.createAutomatedVideoWithAgent({
            topic,
            aspectRatio: ratio,
            duration,
            useWebSearchTrends: true
          });
          createdVideoResult = videoRes;
          actionBadgeText = `🎬 Video Created: ${topic}`;
          responseText = `🎉 Oya! Your complete viral video for "${topic}" is freshly baked and ready!\n\nI researched high-retention hooks, formulated the full script, sourced HD stock footage for all ${videoRes.scenes.length} scene beats, and rendered neural narration with ${videoRes.voiceName || 'Kore'}. You can play the video, inspect scene clips, listen to the audio, or open it in the full studio below!`;
        } catch (agentErr: any) {
          console.warn("Direct agent video generation error:", agentErr);
        }
      }

      // Smart fallback intent resolution if empty
      if (!responseText) {
        const lower = fullPromptText.toLowerCase();
        if (lower.includes('profile') || lower.includes('key') || lower.includes('setting')) {
          appContext.setActiveTab('profile');
          targetNavTab = 'profile';
          actionBadgeText = '⚡ Navigated to Profile & API Key Settings';
          responseText = "I've opened your Profile settings where you can manage your Gemini and Fish.Audio API keys.";
        } else if (lower.includes('video') || lower.includes('autopilot') || lower.includes('generate')) {
          appContext.setActiveTab('autopilot');
          targetNavTab = 'autopilot';
          actionBadgeText = '⚡ Navigated to AI Autopilot Studio';
          responseText = "No wahala! I have switched you directly to the AI Autopilot Studio so we can cook your video.";
        } else if (lower.includes('script')) {
          appContext.setActiveTab('scripts');
          targetNavTab = 'scripts';
          actionBadgeText = '⚡ Navigated to Script Writer';
          responseText = "I've brought you right to the Script Writer studio! Enter your topic to draft a viral video script.";
        } else if (lower.includes('voice') || lower.includes('speech')) {
          appContext.setActiveTab('voiceover');
          targetNavTab = 'voiceover';
          actionBadgeText = '⚡ Navigated to Voice Studio';
          responseText = "Switched to AI Voice Studio! You can choose Kore, Ngozi, Chidinma, or any preferred narrator voice.";
        } else {
          responseText = `I hear you crystal clear! As your ${activeAgent.name}, I am ready to craft your next viral video, script, or growth strategy.`;
        }
      }

      const agentMsg: ChatMessage = {
        id: `vix_${Date.now()}`,
        sender: 'vixora',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionBadge: actionBadgeText,
        imageUrl: generatedImageUrl,
        navigatedTab: targetNavTab,
        agentId: activeAgent.id,
        videoResult: createdVideoResult
      };

      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.filter(m => m.id !== thinkingMsgId).concat(agentMsg),
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      if (currentController.signal.aborted) return;
      console.error('Chat generation error:', err);
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'vixora',
        text: "I encountered a transient connection hiccup. Please ask again or check your internet connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionBadge: "Connection Alert",
        agentId: activeAgent.id
      };
      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.filter(m => m.id !== thinkingMsgId).concat(errorMsg),
              updatedAt: new Date().toISOString()
            };
          }
          return s;
        })
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setAttachedImage(evt.target?.result as string);
      setIsAddMenuOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setAttachedFile({ name: file.name, text: evt.target?.result as string });
      setIsAddMenuOpen(false);
    };
    reader.readAsText(file);
  };

  if (!isOpen && !isFullTab) return null;

  // Filtered session list for search
  const filteredSessions = sessions.filter(s =>
    sidebarSearchQuery ? s.title.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) : true
  );

  return (
    <div
      className={
        isFullTab
          ? "w-full h-full flex flex-col relative animate-fade-in"
          : "fixed inset-0 z-[250] bg-slate-950/75 backdrop-blur-md flex justify-end animate-fade-in"
      }
      onClick={isFullTab ? undefined : onClose}
    >
      {/* OUTER WORKSPACE WRAPPER */}
      <div
        className={
          isFullTab
            ? `w-full h-full flex flex-row rounded-3xl border shadow-2xl relative overflow-hidden ${
                themeMode === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-900 border-white/10 text-white'
              }`
            : `w-full max-w-5xl h-full flex flex-row shadow-2xl border-l transition-all duration-300 relative overflow-hidden ${
                themeMode === 'light'
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-slate-900 border-white/10 text-white'
              }`
        }
        onClick={e => e.stopPropagation()}
      >
        {/* ================================================================= */}
        {/* 1. LEFT-SIDE NAVIGATION SIDEBAR (ChatGPT & Claude Agent Style)    */}
        {/* ================================================================= */}
        <aside
          className={`h-full flex flex-col border-r transition-all duration-300 z-30 shrink-0 ${
            themeMode === 'light'
              ? 'bg-white border-slate-200/90 text-slate-900'
              : 'bg-slate-950 border-white/10 text-white'
          } ${
            isSidebarOpen
              ? 'w-72 sm:w-80 fixed lg:relative inset-y-0 left-0 shadow-2xl lg:shadow-none'
              : 'w-0 -translate-x-full lg:translate-x-0 lg:w-0 overflow-hidden border-none'
          }`}
        >
          {/* SIDEBAR HEADER: APP BRAND & NEW CHAT ACTION */}
          <div className="p-3.5 border-b border-slate-200 dark:border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 p-0.5 flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                    <i className="fa-solid fa-comments text-ggd-orange text-xs"></i>
                  </div>
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-black uppercase tracking-tight text-ggd-orange">Vixora AI</span>
                  <span className="text-[9px] font-bold text-slate-400 ml-1">Agents</span>
                </div>
              </div>

              {/* Close sidebar button on mobile */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Collapse sidebar"
              >
                <i className="fa-solid fa-chevron-left text-xs"></i>
              </button>
            </div>

            {/* CHATGPT / CLAUDE STYLE: + NEW CHAT BUTTON */}
            <button
              type="button"
              onClick={() => handleCreateNewChat()}
              className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider flex items-center justify-between shadow-lg active:scale-98 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center text-xs">
                  <i className="fa-solid fa-plus text-[11px]"></i>
                </div>
                <span>New Chat</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/20 text-white/90 font-mono font-bold">
                +Thread
              </span>
            </button>

            {/* SEARCH CHATS INPUT */}
            <div className="relative">
              <input
                type="text"
                value={sidebarSearchQuery}
                onChange={e => setSidebarSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className={`w-full py-1.5 pl-8 pr-7 text-[11px] rounded-xl border outline-none font-medium transition-colors ${
                  themeMode === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-orange-400'
                    : 'bg-white/5 border-white/10 text-white placeholder-slate-500 focus:bg-slate-900 focus:border-orange-500'
                }`}
              />
              <i className="fa-solid fa-magnifying-glass text-[10px] text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"></i>
              {sidebarSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSidebarSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px]"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}
            </div>
          </div>

          {/* CLAUDE STYLE AGENT PERSONA SELECTOR */}
          <div className="p-2 border-b border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400">
              <span>Choose Agent</span>
              <span className="text-ggd-orange">5 Personas</span>
            </div>
            <div className="grid grid-cols-5 gap-1 pt-1">
              {CLAUDE_STYLE_AGENTS.map(agent => {
                const isSelected = activeAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => {
                      if (activeSession?.messages.length <= 1) {
                        handleSwitchAgentForCurrentSession(agent.id);
                      } else {
                        handleCreateNewChat(agent.id);
                      }
                    }}
                    title={`${agent.name} - ${agent.title}`}
                    className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-center border cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-br from-orange-500/20 to-amber-500/20 border-orange-500 text-orange-400 shadow-md scale-102'
                        : themeMode === 'light'
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <i className={`fa-solid ${agent.icon} text-xs`}></i>
                    <span className="text-[7.5px] font-black uppercase truncate max-w-full">
                      {agent.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CHAT THREADS LIST (Grouped & Scrollable) */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
            <div className="px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Recent Chats</span>
              <span>{filteredSessions.length}</span>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs font-medium">
                <i className="fa-regular fa-comment-dots text-lg mb-1 block opacity-50"></i>
                <p className="text-[10px]">No conversations found</p>
              </div>
            ) : (
              filteredSessions.map(session => {
                const isActive = session.id === activeSessionId;
                const sessionAgent =
                  CLAUDE_STYLE_AGENTS.find(a => a.id === session.agentId) || CLAUDE_STYLE_AGENTS[0];
                const isRenaming = editingSessionId === session.id;

                return (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={`group relative p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isActive
                        ? themeMode === 'light'
                          ? 'bg-orange-500/10 border-orange-400 text-slate-900 shadow-sm font-semibold'
                          : 'bg-orange-500/15 border-orange-500/60 text-white shadow-md font-semibold'
                        : themeMode === 'light'
                        ? 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                        : 'bg-white/[0.02] hover:bg-white/5 border-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {/* Left: Agent Icon + Title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${
                          isActive
                            ? 'bg-orange-500 text-white'
                            : themeMode === 'light'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        <i className={`fa-solid ${sessionAgent.icon}`}></i>
                      </div>

                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          type="text"
                          value={editingTitleText}
                          onChange={e => setEditingTitleText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveRename(session.id);
                            if (e.key === 'Escape') setEditingSessionId(null);
                          }}
                          onBlur={() => handleSaveRename(session.id)}
                          onClick={e => e.stopPropagation()}
                          className="w-full text-xs bg-transparent border-b border-orange-400 outline-none text-white py-0.5"
                        />
                      ) : (
                        <div className="min-w-0 flex-1">
                          <p className="text-xs truncate tracking-tight">{session.title}</p>
                          <p className="text-[8.5px] text-slate-400 truncate flex items-center gap-1">
                            <span>{sessionAgent.shortName}</span>
                            <span>·</span>
                            <span>{session.messages.length} msgs</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Hover Action Icons (Rename & Delete) */}
                    <div
                      className={`flex items-center gap-1 shrink-0 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity`}
                    >
                      <button
                        type="button"
                        onClick={e => handleStartRename(e, session)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-colors"
                        title="Rename conversation"
                      >
                        <i className="fa-solid fa-pen text-[10px]"></i>
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDeleteSession(e, session.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete conversation"
                      >
                        <i className="fa-solid fa-trash-can text-[10px]"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* SIDEBAR FOOTER: LIVE VOICE & CLEAR ACTIONS */}
          <div className="p-3 border-t border-slate-200 dark:border-white/10 space-y-2 bg-slate-950/40">
            {onStartLiveAssistant && (
              <button
                type="button"
                onClick={() => {
                  if (!isFullTab) onClose();
                  onStartLiveAssistant();
                }}
                className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-phone text-xs animate-pulse text-purple-400"></i>
                <span>Live Voice Call</span>
              </button>
            )}

            <div className="flex items-center justify-between text-[9px] text-slate-500 pt-1">
              <span>{sessions.length} Threads Total</span>
              <button
                type="button"
                onClick={handleClearAllSessions}
                className="hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-20 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* ================================================================= */}
        {/* 2. MAIN CHAT AREA (Right of Left-Side Navigation)                 */}
        {/* ================================================================= */}
        <main className="flex-1 h-full flex flex-col min-w-0 relative overflow-hidden">
          {/* MAIN CHAT TOP HEADER */}
          <header
            className={`p-3 sm:p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
              themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-white/10'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* SIDEBAR TOGGLE BUTTON (Like ChatGPT & Claude) */}
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-2 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                  isSidebarOpen
                    ? 'bg-orange-500/10 border-orange-400/40 text-orange-400'
                    : themeMode === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title={isSidebarOpen ? 'Collapse chat sidebar' : 'Open chat sidebar'}
              >
                <i className="fa-solid fa-table-columns text-sm"></i>
              </button>

              {/* ACTIVE AGENT AVATAR & IDENTITY */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl overflow-hidden border border-orange-500/50 p-0.5 shadow-md bg-slate-900 shrink-0 relative">
                  {activeAgent.id === 'vixora_coach' ? (
                    <img
                      src={vixoraAgentAvatar}
                      alt="Vixora AI"
                      className="w-full h-full object-cover rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-full h-full rounded-lg bg-gradient-to-tr ${activeAgent.gradient} flex items-center justify-center text-white text-xs`}
                    >
                      <i className={`fa-solid ${activeAgent.icon}`}></i>
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight truncate">
                      {activeAgent.name}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded-full text-[7.5px] font-black uppercase bg-orange-500/15 border border-orange-500/30 text-orange-400 shrink-0">
                      {activeAgent.badge}
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-400 truncate max-w-[200px] sm:max-w-md font-medium">
                    {activeSession?.title || activeAgent.tagline}
                  </p>
                </div>
              </div>
            </div>

            {/* HEADER RIGHT ACTIONS */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Agent Quick Switcher Dropdown Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAgentMenuOpen(!isAgentMenuOpen)}
                  className={`py-1.5 px-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAgentMenuOpen
                      ? 'bg-orange-500 text-white border-orange-500'
                      : themeMode === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                  }`}
                  title="Switch Claude / Vixora Agent"
                >
                  <i className={`fa-solid ${activeAgent.icon}`}></i>
                  <span className="hidden sm:inline">Agent: {activeAgent.shortName}</span>
                  <i className="fa-solid fa-chevron-down text-[8px]"></i>
                </button>

                {/* Agent Dropdown Menu */}
                {isAgentMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-2 w-64 rounded-2xl border shadow-2xl p-2 z-40 space-y-1 backdrop-blur-xl animate-rise ${
                      themeMode === 'light'
                        ? 'bg-white border-slate-200 text-slate-900'
                        : 'bg-slate-900 border-white/15 text-white'
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase text-slate-400 px-2 py-1">
                      Switch Claude AI Agent
                    </p>
                    {CLAUDE_STYLE_AGENTS.map(agent => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => handleSwitchAgentForCurrentSession(agent.id)}
                        className={`w-full p-2 rounded-xl text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                          activeAgent.id === agent.id
                            ? 'bg-orange-500/15 border border-orange-500/40 text-orange-400'
                            : themeMode === 'light'
                            ? 'hover:bg-slate-100 text-slate-700'
                            : 'hover:bg-white/5 text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${agent.gradient} text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5`}
                        >
                          <i className={`fa-solid ${agent.icon}`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-black uppercase">{agent.name}</p>
                          <p className="text-[8.5px] text-slate-400 line-clamp-1">{agent.tagline}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Start New Chat quick button */}
              <button
                type="button"
                onClick={() => handleCreateNewChat()}
                className={`p-2 rounded-xl border text-xs transition-all active:scale-95 cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                }`}
                title="Start a new chat thread"
              >
                <i className="fa-solid fa-pen-to-square"></i>
              </button>

              {/* Close Drawer button if not in full tab */}
              {!isFullTab && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
                  }`}
                  title="Close chat modal"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              )}
            </div>
          </header>

          {/* CHAT MESSAGES SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-none">
            {/* EMPTY STATE / SUGGESTED STARTERS (When starting a new conversation) */}
            {messages.length <= 1 && (
              <div className="max-w-2xl mx-auto py-6 space-y-6 animate-fade-in text-center">
                {/* Agent Hero Banner */}
                <div className="space-y-3">
                  <div
                    className={`w-16 h-16 rounded-3xl mx-auto p-1 bg-gradient-to-tr ${activeAgent.gradient} shadow-xl flex items-center justify-center text-white`}
                  >
                    {activeAgent.id === 'vixora_coach' ? (
                      <img
                        src={vixoraAgentAvatar}
                        alt="Vixora"
                        className="w-full h-full object-cover rounded-[20px]"
                      />
                    ) : (
                      <i className={`fa-solid ${activeAgent.icon} text-2xl`}></i>
                    )}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                      {activeAgent.name}
                    </h2>
                    <p className="text-xs text-ggd-orange font-bold uppercase tracking-wider">
                      {activeAgent.title}
                    </p>
                    <p
                      className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${
                        themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    >
                      {activeAgent.tagline}
                    </p>
                  </div>
                </div>

                {/* Quick Starter Prompt Cards (ChatGPT / Claude style) */}
                <div className="space-y-2 text-left">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 text-center">
                    Suggested Creator Prompts
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activeAgent.suggestedPrompts.map((starter, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSendMessage(starter.prompt)}
                        className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer shadow-sm group ${
                          themeMode === 'light'
                            ? 'bg-white hover:bg-orange-50/50 border-slate-200 hover:border-orange-300'
                            : 'bg-white/[0.03] hover:bg-orange-500/10 border-white/10 hover:border-orange-500/40'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center text-xs shrink-0 mt-0.5 group-hover:bg-orange-500 group-hover:text-white transition-colors`}
                        >
                          <i className={`fa-solid ${starter.icon}`}></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black uppercase tracking-tight text-white group-hover:text-orange-400 transition-colors">
                            {starter.title}
                          </p>
                          <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {starter.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MESSAGE BUBBLES */}
            {messages.map(msg => {
              const isUser = msg.sender === 'user';
              const msgAgent =
                CLAUDE_STYLE_AGENTS.find(a => a.id === msg.agentId) || activeAgent;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'} group`}
                >
                  {/* Sender Avatar */}
                  <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 mt-1 shadow-md">
                    {isUser ? (
                      <div className="w-full h-full bg-gradient-to-tr from-slate-700 to-slate-900 border border-white/20 text-white flex items-center justify-center text-xs font-black uppercase">
                        {appContext.userFullName?.charAt(0) || 'U'}
                      </div>
                    ) : msgAgent.id === 'vixora_coach' ? (
                      <img
                        src={vixoraAgentAvatar}
                        alt="Vixora"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-tr ${msgAgent.gradient} text-white flex items-center justify-center text-xs`}
                      >
                        <i className={`fa-solid ${msgAgent.icon}`}></i>
                      </div>
                    )}
                  </div>

                  {/* Message Bubble Container */}
                  <div className={`space-y-1.5 max-w-[85%] sm:max-w-xl text-left ${isUser ? 'items-end' : 'items-start'}`}>
                    {/* Name & Timestamp Header */}
                    <div className={`flex items-center gap-2 text-[9px] ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-black uppercase text-slate-400">
                        {isUser ? appContext.userFullName || 'You' : msgAgent.name}
                      </span>
                      <span className="text-slate-500">{msg.timestamp}</span>
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-lg relative ${
                        isUser
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-none'
                          : themeMode === 'light'
                          ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                          : 'bg-slate-950/80 border border-white/10 text-slate-100 rounded-tl-none'
                      }`}
                    >
                      {/* Attached Image Preview */}
                      {msg.imageUrl && (
                        <div className="mb-2.5 rounded-xl overflow-hidden border border-white/10 max-w-xs">
                          <img
                            src={msg.imageUrl}
                            alt="Attached"
                            className="w-full h-auto object-cover max-h-48"
                          />
                        </div>
                      )}

                      {/* Attached File Badge */}
                      {msg.attachedFile && (
                        <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-black/20 border border-white/10 inline-flex items-center gap-1.5 text-[10px] font-bold">
                          <i className="fa-solid fa-file-text text-ggd-orange"></i>
                          <span>{msg.attachedFile.name}</span>
                        </div>
                      )}

                      {/* Thinking spinner / Live Agent Stepper Progress Card */}
                      {msg.isThinking ? (
                        msg.videoCreationProgress ? (
                          <ChatVideoProgressCard progress={msg.videoCreationProgress} />
                        ) : (
                          <div className="flex items-center gap-2 text-slate-400 py-1">
                            <i className="fa-solid fa-circle-notch animate-spin text-orange-400"></i>
                            <span>{msg.text}</span>
                          </div>
                        )
                      ) : (
                        <div className="whitespace-pre-wrap select-text font-normal">
                          {msg.text}
                        </div>
                      )}

                      {/* Interactive Video Creation Result Card */}
                      {msg.videoResult && (
                        <ChatVideoResultCard
                          result={msg.videoResult}
                          onOpenSequencer={(data) => {
                            if (appContext.loadVideoIntoSequencer) {
                              appContext.loadVideoIntoSequencer(data);
                            } else {
                              appContext.setActiveTab('videos');
                            }
                          }}
                          themeMode={themeMode}
                        />
                      )}

                      {/* Action Badge if Function Called */}
                      {msg.actionBadge && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase flex items-center gap-1.5">
                            <i className="fa-solid fa-bolt"></i>
                            <span>{msg.actionBadge}</span>
                          </span>
                          {msg.navigatedTab && (
                            <button
                              type="button"
                              onClick={() => appContext.setActiveTab(msg.navigatedTab!)}
                              className="text-[9px] font-bold text-orange-400 hover:underline flex items-center gap-1"
                            >
                              <span>View Tab</span>
                              <i className="fa-solid fa-arrow-right text-[8px]"></i>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Copy action on hover */}
                    {!msg.isThinking && (
                      <div className={`flex items-center gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 hover:text-white flex items-center gap-1 p-1"
                          title="Copy message"
                        >
                          <i className={`fa-solid ${copiedMsgId === msg.id ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                          <span className="text-[8.5px]">{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {/* ATTACHED ASSETS PREVIEWS */}
          {(attachedImage || attachedFile) && (
            <div className="px-4 py-2 bg-slate-950/60 border-t border-white/10 flex items-center gap-3 overflow-x-auto">
              {attachedImage && (
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-orange-500/50 shrink-0">
                  <img src={attachedImage} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setAttachedImage(null)}
                    className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px]"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
              {attachedFile && (
                <div className="relative px-3 py-2 rounded-xl bg-slate-800 border border-white/10 flex items-center gap-2 text-xs font-bold text-white shrink-0">
                  <i className="fa-solid fa-file-text text-ggd-orange"></i>
                  <span className="max-w-[140px] truncate text-[10px]">{attachedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setAttachedFile(null)}
                    className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[8px] ml-1"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ACTION SHEET / TOOLS POPOVER MENU */}
          {isAddMenuOpen && (
            <div
              className={`absolute bottom-20 left-4 right-4 z-40 border rounded-3xl p-4 shadow-2xl animate-rise max-h-96 overflow-y-auto space-y-3 ${
                themeMode === 'light'
                  ? 'bg-white border-slate-200 text-slate-900'
                  : 'bg-slate-900 border-white/15 text-white'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-black uppercase tracking-wider text-ggd-orange flex items-center gap-2">
                  <i className="fa-solid fa-plus-circle"></i>
                  <span>Add Assets & Invoke AI Tools</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddMenuOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs text-slate-600 dark:text-white hover:bg-slate-200"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              {/* UPLOAD ACTIONS */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left active:scale-95 transition-all ${
                    themeMode === 'light'
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-ggd-orange flex items-center justify-center text-xs">
                    <i className="fa-solid fa-image"></i>
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Upload Image
                    </p>
                    <p className="text-[8.5px] text-slate-400">Attach photo/graphic</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left active:scale-95 transition-all ${
                    themeMode === 'light'
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs">
                    <i className="fa-solid fa-file-lines"></i>
                  </div>
                  <div>
                    <p className={`text-[11px] font-bold ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      Upload File
                    </p>
                    <p className="text-[8.5px] text-slate-400">Script or doc text</p>
                  </div>
                </button>
              </div>

              {/* TOOLS LIBRARY LINK */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMenuOpen(false);
                    appContext.setActiveTab('tools');
                  }}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-95 group shadow-lg ${
                    themeMode === 'light'
                      ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                      : 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 hover:from-emerald-500/25 hover:to-teal-500/25 border-emerald-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs shrink-0 shadow-md">
                      <i className="fa-solid fa-shapes"></i>
                    </div>
                    <div>
                      <p
                        className={`text-[11px] font-black group-hover:text-emerald-500 transition-colors ${
                          themeMode === 'light' ? 'text-slate-900' : 'text-white'
                        }`}
                      >
                        Tools Library
                      </p>
                      <p className="text-[8.5px] text-slate-400">Open full suite of 12 AI creation tools</p>
                    </div>
                  </div>
                  <i className="fa-solid fa-arrow-right text-xs text-emerald-500 group-hover:translate-x-1 transition-transform"></i>
                </button>
              </div>
            </div>
          )}

          {/* HIDDEN FILE INPUTS */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.md,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* BOTTOM CHAT INPUT BAR (ChatGPT & Claude Style) */}
          <footer
            className={`p-2.5 sm:p-4 border-t shrink-0 sticky bottom-0 z-20 shadow-xl backdrop-blur-xl pb-4 sm:pb-4 ${
              themeMode === 'light' ? 'bg-white/95 border-slate-200' : 'bg-slate-950/95 border-white/10'
            }`}
          >
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-1.5 sm:gap-2 max-w-4xl mx-auto w-full"
            >
              {/* + MENU FOR TOOLS & ATTACHMENTS */}
              <button
                type="button"
                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                title="Add Image, File, or Tool"
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border text-base transition-all shrink-0 active:scale-90 cursor-pointer ${
                  isAddMenuOpen
                    ? 'bg-ggd-orange border-ggd-orange text-white rotate-45'
                    : themeMode === 'light'
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    : 'bg-white/10 border-white/15 text-white hover:bg-white/20'
                }`}
              >
                <i className="fa-solid fa-plus"></i>
              </button>

              {/* LIVE VOICE CALL BUTTON */}
              {onStartLiveAssistant && (
                <button
                  type="button"
                  onClick={() => {
                    if (!isFullTab) onClose();
                    onStartLiveAssistant();
                  }}
                  title="Start Live Voice Assistant Call"
                  className="px-2.5 sm:px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1 shadow-md active:scale-90 shrink-0 border border-amber-300/40 cursor-pointer"
                >
                  <i className="fa-solid fa-microphone-lines text-xs animate-pulse"></i>
                  <span className="hidden md:inline">Call</span>
                </button>
              )}

              {/* TEXT INPUT FIELD */}
              <input
                type="text"
                value={inputQuery}
                onChange={e => setInputQuery(e.target.value)}
                placeholder={
                  isProcessing
                    ? 'Type to interrupt and ask something new...'
                    : `Message ${activeAgent.name}...`
                }
                className={`min-w-0 flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl border text-xs sm:text-[13px] font-medium outline-none transition-all ${
                  themeMode === 'light'
                    ? 'bg-slate-100 border-slate-300 text-slate-900 focus:bg-white focus:border-ggd-orange'
                    : 'bg-white/5 border-white/10 text-white focus:bg-slate-900 focus:border-ggd-orange'
                }`}
              />

              {/* STOP BUTTON OR SEND BUTTON */}
              {isProcessing ? (
                <button
                  type="button"
                  onClick={interruptAi}
                  title="Interrupt AI response"
                  className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg active:scale-95 animate-pulse shrink-0 cursor-pointer border border-red-400/40 min-w-[72px]"
                >
                  <i className="fa-solid fa-hand text-sm"></i>
                  <span className="text-[10px] font-black uppercase">Stop</span>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputQuery.trim() && !attachedImage && !attachedFile}
                  title="Send message"
                  className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 shadow-lg transition-all min-w-[72px] sm:min-w-[85px] cursor-pointer ${
                    !inputQuery.trim() && !attachedImage && !attachedFile
                      ? themeMode === 'light'
                        ? 'bg-orange-100 text-orange-600 border border-orange-300 opacity-90 cursor-not-allowed'
                        : 'bg-orange-500/20 text-orange-300 border border-orange-500/40 opacity-90 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-amber-400 text-white shadow-orange-500/30 border border-orange-300 active:scale-95'
                  }`}
                >
                  <span className="font-extrabold text-[11px] sm:text-xs">Send</span>
                  <i className="fa-solid fa-paper-plane text-xs"></i>
                </button>
              )}
            </form>
            <div className="flex items-center justify-between text-[8px] text-slate-500 max-w-4xl mx-auto mt-2 px-1">
              <span>Claude & ChatGPT style multi-thread workspace</span>
              <span>Agent: {activeAgent.name}</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
