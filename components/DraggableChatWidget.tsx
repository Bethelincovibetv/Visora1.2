import React, { useState, useEffect, useRef } from 'react';
import vixoraAgentAvatar from '../src/assets/images/vixora_agent_avatar_1786108775324.jpg';

interface DraggableChatWidgetProps {
  onOpenChat: () => void;
  onStartVoiceCall?: () => void;
  themeMode?: 'light' | 'dark';
  isLiveActive?: boolean;
}

export const DraggableChatWidget: React.FC<DraggableChatWidgetProps> = ({
  onOpenChat,
  onStartVoiceCall,
  themeMode = 'dark',
  isLiveActive = false
}) => {
  // Default position: bottom-right with margin
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('vixora_chat_btn_pos_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Verify it's within viewport bounds
          const maxX = typeof window !== 'undefined' ? window.innerWidth - 80 : 500;
          const maxY = typeof window !== 'undefined' ? window.innerHeight - 80 : 800;
          return {
            x: Math.min(Math.max(16, parsed.x), maxX),
            y: Math.min(Math.max(16, parsed.y), maxY)
          };
        }
      }
    } catch (e) {}

    // Initial safe bottom-right default
    const initX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 170) : 300;
    const initY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 85) : 600;
    return { x: initX, y: initY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initPosX: number; initPosY: number; hasMoved: boolean }>({
    startX: 0,
    startY: 0,
    initPosX: 0,
    initPosY: 0,
    hasMoved: false
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Keep inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        const maxX = window.innerWidth - 80;
        const maxY = window.innerHeight - 80;
        return {
          x: Math.min(Math.max(16, prev.x), maxX),
          y: Math.min(Math.max(16, prev.y), maxY)
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save position when drag ends
  const savePosition = (x: number, y: number) => {
    try {
      localStorage.setItem('vixora_chat_btn_pos_v2', JSON.stringify({ x, y }));
    } catch (e) {}
  };

  // Mouse & Touch Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag with primary pointer
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: position.x,
      initPosY: position.y,
      hasMoved: false
    };

    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      dragStartRef.current.hasMoved = true;
    }

    const newX = dragStartRef.current.initPosX + dx;
    const newY = dragStartRef.current.initPosY + dy;

    // Viewport constraints
    const widgetWidth = widgetRef.current?.offsetWidth || 150;
    const widgetHeight = widgetRef.current?.offsetHeight || 50;
    const maxX = window.innerWidth - widgetWidth - 10;
    const maxY = window.innerHeight - widgetHeight - 10;

    const clampedX = Math.min(Math.max(10, newX), maxX);
    const clampedY = Math.min(Math.max(10, newY), maxY);

    setPosition({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    savePosition(position.x, position.y);

    // If it was just a tap/click without significant dragging, trigger click action
    if (!dragStartRef.current.hasMoved) {
      onOpenChat();
    }
  };

  const snapToCorner = (corner: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left') => {
    const width = widgetRef.current?.offsetWidth || 150;
    const height = widgetRef.current?.offsetHeight || 50;
    let newX = 20;
    let newY = 20;

    if (corner === 'bottom-right') {
      newX = window.innerWidth - width - 20;
      newY = window.innerHeight - height - 25;
    } else if (corner === 'bottom-left') {
      newX = 20;
      newY = window.innerHeight - height - 25;
    } else if (corner === 'top-right') {
      newX = window.innerWidth - width - 20;
      newY = 80;
    } else if (corner === 'top-left') {
      newX = 20;
      newY = 80;
    }

    setPosition({ x: newX, y: newY });
    savePosition(newX, newY);
    setShowQuickMenu(false);
  };

  return (
    <div
      ref={widgetRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none'
      }}
      className={`fixed top-0 left-0 z-[280] select-none transition-shadow ${
        isDragging ? 'cursor-grabbing scale-105 opacity-95' : 'cursor-grab'
      }`}
    >
      {/* QUICK POSITIONING MENU POPUP */}
      {showQuickMenu && (
        <div 
          className={`absolute bottom-full mb-2 right-0 p-3 rounded-2xl border shadow-2xl space-y-2 backdrop-blur-xl animate-rise min-w-[200px] ${
            themeMode === 'light' ? 'bg-white/95 border-slate-200 text-slate-900' : 'bg-slate-900/95 border-white/10 text-white'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <span className="text-[10px] font-black uppercase text-orange-400">Draggable Chat Controls</span>
            <button 
              onClick={() => setShowQuickMenu(false)}
              className="text-slate-400 hover:text-white text-xs p-1"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>

          <p className="text-[9px] text-slate-400 leading-snug">
            Drag the button freely to any spot on your screen so it never blocks your workspace.
          </p>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={() => snapToCorner('bottom-right')}
              className={`p-1.5 rounded-lg border text-[8.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                themeMode === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <i className="fa-solid fa-arrow-down-right"></i> Bottom-R
            </button>
            <button
              onClick={() => snapToCorner('bottom-left')}
              className={`p-1.5 rounded-lg border text-[8.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                themeMode === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <i className="fa-solid fa-arrow-down-left"></i> Bottom-L
            </button>
            <button
              onClick={() => snapToCorner('top-right')}
              className={`p-1.5 rounded-lg border text-[8.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                themeMode === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <i className="fa-solid fa-arrow-up-right"></i> Top-R
            </button>
            <button
              onClick={() => snapToCorner('top-left')}
              className={`p-1.5 rounded-lg border text-[8.5px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                themeMode === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300' : 'bg-white/5 hover:bg-white/10 border-white/10'
              }`}
            >
              <i className="fa-solid fa-arrow-up-left"></i> Top-L
            </button>
          </div>

          {onStartVoiceCall && (
            <button
              onClick={() => {
                setShowQuickMenu(false);
                onStartVoiceCall();
              }}
              className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
            >
              <i className="fa-solid fa-phone"></i> Launch Live Voice Call
            </button>
          )}
        </div>
      )}

      {/* DRAGGABLE MAIN BUTTON PILL */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Drag anywhere or click to chat with Vixora AI Agent"
        className="group relative flex items-center gap-2 p-1.5 pr-3.5 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white rounded-full shadow-[0_10px_30px_rgba(249,115,22,0.5)] border-2 border-orange-300/60 active:scale-95 transition-transform"
      >
        {/* DRAG HANDLE GRIP ICON */}
        <div 
          className="w-5 h-8 flex items-center justify-center text-orange-200/80 hover:text-white cursor-grab active:cursor-grabbing pl-1"
          title="Drag to reposition"
        >
          <i className="fa-solid fa-grip-vertical text-[11px]"></i>
        </div>

        {/* AVATAR WITH LIVE STATUS PULSE */}
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/40 shadow-inner shrink-0 bg-slate-950">
          <img
            src={vixoraAgentAvatar}
            alt="Vixora AI"
            className="w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-slate-900 shadow-sm ${
            isLiveActive ? 'bg-purple-400 animate-ping' : 'bg-emerald-400 animate-pulse'
          }`}></span>
        </div>

        {/* TEXT LABEL & STATUS */}
        <div className="flex flex-col text-left pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-white drop-shadow-sm">
              Vixora AI
            </span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[7.5px] font-extrabold text-orange-200 uppercase border border-orange-300/30">
              🇳🇬 Naija
            </span>
          </div>
          <span className="text-[8px] font-bold text-orange-100/90 tracking-tight flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
            Drag or Tap to Chat
          </span>
        </div>

        {/* REPOSITION QUICK GEAR BUTTON */}
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            setShowQuickMenu(prev => !prev);
          }}
          title="Position options"
          className="w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 text-orange-100 hover:text-white flex items-center justify-center text-[9px] transition-colors ml-0.5"
        >
          <i className="fa-solid fa-arrows-up-down-left-right"></i>
        </button>
      </div>
    </div>
  );
};
