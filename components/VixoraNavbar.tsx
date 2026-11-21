import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export interface VixoraNavbarProps {
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenAccessibility: () => void;
  onOpenGlobalApi: () => void;
  onOpenExportModal: () => void;
  isLiveActive?: boolean;
}

export const MAIN_NAV_ITEMS = [
  { path: '/studio', label: 'Studio', icon: 'fa-microphone-lines', badge: 'Live AI', color: 'from-amber-500 to-orange-500' },
  { path: '/chat', label: 'AI Chat', icon: 'fa-comments', badge: 'Claude Agents', color: 'from-orange-500 to-amber-500' },
  { path: '/videos', label: 'Video Creator', icon: 'fa-film', badge: 'HD Sourcing', color: 'from-orange-500 to-red-500' },
  { path: '/flyer-ad', label: 'Flyer Ad Studio', icon: 'fa-wand-magic-sparkles', badge: 'Flyer-to-Ad', color: 'from-fuchsia-500 to-pink-500' },
  { path: '/scripts', label: 'AI Scripts', icon: 'fa-scroll', badge: 'Viral SEO', color: 'from-purple-500 to-indigo-500' },
  { path: '/autopilot', label: 'Autopilot', icon: 'fa-wand-magic-sparkles', badge: '1-Click', color: 'from-rose-500 to-pink-600' },
  { path: '/voiceover', label: 'Voiceover', icon: 'fa-waveform-lines', badge: 'TTS HD', color: 'from-cyan-500 to-teal-500' },
  { path: '/bgmusic', label: 'Music HQ', icon: 'fa-music', badge: 'Tracks', color: 'from-amber-400 to-yellow-500' },
  { path: '/growth', label: 'Growth SEO', icon: 'fa-bolt-lightning', badge: 'Tags & Hooks', color: 'from-emerald-500 to-teal-600' },
  { path: '/tools', label: 'All Tools', icon: 'fa-shapes', badge: '12+ Tools', color: 'from-blue-500 to-indigo-600' },
  { path: '/developer', label: 'Dev API', icon: 'fa-code', badge: 'v1 REST', color: 'from-violet-500 to-purple-600' },
  { path: '/profile', label: 'Profile', icon: 'fa-user-gear', badge: 'Settings', color: 'from-slate-500 to-slate-700' },
  { path: '/contact', label: 'Contact', icon: 'fa-headset', badge: 'Support', color: 'from-green-500 to-emerald-600' },
];

export const VixoraNavbar: React.FC<VixoraNavbarProps> = ({
  themeMode,
  onToggleTheme,
  onOpenAccessibility,
  onOpenGlobalApi,
  onOpenExportModal,
  isLiveActive = false,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const currentPath = location.pathname.toLowerCase().replace(/\/$/, '') || '/studio';

  const isCurrentActive = (path: string) => {
    if (path === '/studio' && (currentPath === '/' || currentPath === '/studio')) return true;
    return currentPath === path;
  };

  const activeItem = MAIN_NAV_ITEMS.find(item => isCurrentActive(item.path)) || MAIN_NAV_ITEMS[0];

  return (
    <header className="w-full mb-4 z-40 sticky top-2">
      <div className={`w-full rounded-2xl border backdrop-blur-xl transition-all shadow-xl p-2.5 sm:p-3 ${themeMode === 'light' ? 'bg-white/90 border-slate-200/90 text-slate-900' : 'bg-slate-900/85 border-white/10 text-white'}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <NavLink to="/studio" className="flex items-center gap-2 group shrink-0 outline-none">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center"><i className="fa-solid fa-play text-orange-500 text-sm ml-0.5"></i></div>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-black uppercase text-orange-500">Vixora</p>
              </div>
            </NavLink>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <i className={`fa-solid ${activeItem.icon} text-orange-500 text-xs`}></i>
              <span className="text-[10px] font-black uppercase text-orange-500">{activeItem.label}</span>
            </div>
          </div>
          <button onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} className="p-2 rounded-xl bg-white/5 border border-white/10">
            <i className="fa-solid fa-bars text-sm"></i>
          </button>
        </div>
      </div>
    </header>
  );
};
