import React, { useState } from 'react';
import { 
  DirectorPlan, 
  DirectorStyle, 
  DIRECTOR_STYLE_DEFINITIONS, 
  COLOR_GRADE_PRESETS,
  ColorGradePreset,
  CameraMotionType,
  TransitionType
} from '../services/aiDirectorService';

interface AiDirectorConsoleProps {
  directorPlan: DirectorPlan | null;
  isDirecting: boolean;
  onRunAiDirector: (preferredStyle?: DirectorStyle) => void;
  onUpdatePlan: (updatedPlan: DirectorPlan) => void;
  themeMode?: 'light' | 'dark';
  sourcedClipsCount: number;
}

export const AiDirectorConsole: React.FC<AiDirectorConsoleProps> = ({
  directorPlan,
  isDirecting,
  onRunAiDirector,
  onUpdatePlan,
  themeMode = 'dark',
  sourcedClipsCount
}) => {
  const [selectedSceneIdx, setSelectedSceneIdx] = useState<number>(0);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);

  if (!directorPlan) {
    return (
      <div className={`p-6 rounded-3xl border shadow-2xl text-center space-y-4 animate-fade-in ${
        themeMode === 'light' ? 'bg-white border-orange-200' : 'bg-slate-900/90 border-orange-500/30'
      }`}>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white mx-auto flex items-center justify-center text-2xl shadow-xl shadow-orange-500/20">
          <i className="fa-solid fa-clapperboard"></i>
        </div>
        <div className="space-y-1">
          <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
            Phase 4 Engine
          </span>
          <h3 className={`text-lg font-black uppercase tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
            AI Director: Intelligent Editing & Motion Graphics
          </h3>
          <p className={`text-xs max-w-md mx-auto ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
            Analyze your {sourcedClipsCount} stock footage clips, script hooks, and cadence. Apply professional camera motion, 2D vector overlays, lower thirds, and cinematic transitions.
          </p>
        </div>
        <button
          onClick={() => onRunAiDirector()}
          disabled={isDirecting}
          className="btn-3d btn-3d-orange px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 mx-auto shadow-xl cursor-pointer"
        >
          <i className={`fa-solid ${isDirecting ? 'fa-spinner animate-spin' : 'fa-wand-magic-sparkles'}`}></i>
          <span>{isDirecting ? 'Directing & Editing Footage...' : 'Launch AI Director Engine'}</span>
        </button>
      </div>
    );
  }

  const currentStyleDef = DIRECTOR_STYLE_DEFINITIONS[directorPlan.detectedStyle] || DIRECTOR_STYLE_DEFINITIONS.viral_social;
  const currentColorGrade = COLOR_GRADE_PRESETS[directorPlan.colorGrade] || COLOR_GRADE_PRESETS.cinematic_teal_orange;
  const activeScene = directorPlan.scenes[selectedSceneIdx] || directorPlan.scenes[0];

  const handleToggle = (key: 'enableMotionGraphics' | 'enableCameraMotion' | 'enableColorGrade' | 'enableTransitions') => {
    onUpdatePlan({
      ...directorPlan,
      [key]: !directorPlan[key]
    });
  };

  const handleStyleChange = (style: DirectorStyle) => {
    setIsStyleDropdownOpen(false);
    onRunAiDirector(style);
  };

  const handleCycleCameraMotion = (sceneIdx: number) => {
    const cameraTypes: CameraMotionType[] = [
      'zoom_in_slow', 'punch_in_beat', 'pan_left', 'zoom_out_reveal', 'pan_right', 'camera_shake', 'static_focus'
    ];
    const targetScene = directorPlan.scenes[sceneIdx];
    const currIdx = cameraTypes.indexOf(targetScene.cameraMotion);
    const nextMotion = cameraTypes[(currIdx + 1) % cameraTypes.length];

    const updatedScenes = [...directorPlan.scenes];
    updatedScenes[sceneIdx] = {
      ...targetScene,
      cameraMotion: nextMotion
    };
    onUpdatePlan({
      ...directorPlan,
      scenes: updatedScenes
    });
  };

  const handleCycleTransition = (sceneIdx: number) => {
    const transitions: TransitionType[] = ['flash_zoom', 'whip_pan', 'crossfade', 'glitch_cut', 'light_leak', 'hard_cut'];
    const targetScene = directorPlan.scenes[sceneIdx];
    const currIdx = transitions.indexOf(targetScene.transitionOut);
    const nextTransition = transitions[(currIdx + 1) % transitions.length];

    const updatedScenes = [...directorPlan.scenes];
    updatedScenes[sceneIdx] = {
      ...targetScene,
      transitionOut: nextTransition
    };
    onUpdatePlan({
      ...directorPlan,
      scenes: updatedScenes
    });
  };

  return (
    <div className={`p-4 sm:p-6 rounded-3xl border shadow-2xl space-y-5 animate-fade-in ${
      themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/95 border-orange-500/20'
    }`}>
      {/* 1. HEADER & DIRECTORIAL SUMMARY */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 p-0.5 shadow-lg shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-orange-400 text-lg">
              <i className="fa-solid fa-clapperboard"></i>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                Phase 4 AI Director
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {directorPlan.scenes.length} Directed Scenes
              </span>
            </div>
            <h3 className={`text-base font-black uppercase tracking-tight mt-0.5 ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Intelligent Video Editing & Motion Graphics
            </h3>
          </div>
        </div>

        {/* RE-RUN DIRECTOR ENGINE */}
        <button
          onClick={() => onRunAiDirector(directorPlan.detectedStyle)}
          disabled={isDirecting}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <i className={`fa-solid ${isDirecting ? 'fa-spinner animate-spin' : 'fa-arrows-rotate'}`}></i>
          <span>{isDirecting ? 'Re-Directing...' : 'Re-Direct with AI'}</span>
        </button>
      </div>

      {/* 2. STYLE BADGES & CONTEXTUAL RATIONALE CARD */}
      <div className={`p-4 rounded-2xl border space-y-3 ${
        themeMode === 'light' ? 'bg-orange-50/40 border-orange-200' : 'bg-white/5 border-white/10'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Active Style Pill with dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border transition-all cursor-pointer ${
                themeMode === 'light' 
                  ? 'bg-white border-orange-300 text-orange-700 shadow-sm' 
                  : 'bg-orange-500/20 border-orange-500/40 text-orange-300'
              }`}
            >
              <i className={`fa-solid ${currentStyleDef.icon}`}></i>
              <span>{currentStyleDef.label}</span>
              <i className="fa-solid fa-chevron-down text-[10px] ml-1"></i>
            </button>

            {isStyleDropdownOpen && (
              <div className={`absolute top-full left-0 mt-2 w-64 p-1.5 rounded-2xl border shadow-2xl z-50 space-y-1 ${
                themeMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-white/15 text-white'
              }`}>
                {(Object.keys(DIRECTOR_STYLE_DEFINITIONS) as DirectorStyle[]).map(styleKey => {
                  const item = DIRECTOR_STYLE_DEFINITIONS[styleKey];
                  const isCurrent = directorPlan.detectedStyle === styleKey;
                  return (
                    <button
                      key={styleKey}
                      onClick={() => handleStyleChange(styleKey)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-orange-500 text-white font-bold' 
                          : themeMode === 'light' ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <i className={`fa-solid ${item.icon} text-xs mt-0.5 shrink-0`}></i>
                      <div>
                        <p className="text-[11px] font-black uppercase">{item.label}</p>
                        <p className={`text-[8.5px] leading-tight ${isCurrent ? 'text-white/80' : 'text-slate-400'}`}>
                          {item.badge}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color Grade & Pacing Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-palette text-amber-400"></i>
              <span>Grade: {currentColorGrade.name}</span>
            </span>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <i className="fa-solid fa-gauge-high text-cyan-400"></i>
              <span>Pacing: {directorPlan.pacingRhythm.replace(/_/g, ' ')}</span>
            </span>
          </div>
        </div>

        {/* AI Director Rationale Quote */}
        <p className={`text-xs italic leading-relaxed ${themeMode === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
          <i className="fa-solid fa-quote-left text-orange-500/60 mr-1.5"></i>
          {directorPlan.overallDirectorRationale}
        </p>
      </div>

      {/* 3. DIRECTOR MASTER FEATURE TOGGLES */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { key: 'enableMotionGraphics', label: '2D Motion Graphics', icon: 'fa-shapes', active: directorPlan.enableMotionGraphics },
          { key: 'enableCameraMotion', label: 'Camera Zooms & Pans', icon: 'fa-video', active: directorPlan.enableCameraMotion },
          { key: 'enableColorGrade', label: 'Cinematic Color LUT', icon: 'fa-sliders', active: directorPlan.enableColorGrade },
          { key: 'enableTransitions', label: 'Dynamic Transitions', icon: 'fa-shuffle', active: directorPlan.enableTransitions },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => handleToggle(item.key as any)}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              item.active 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : themeMode === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/5 text-slate-500'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <i className={`fa-solid ${item.icon} text-xs ${item.active ? 'text-emerald-400' : 'text-slate-400'}`}></i>
              <span className="text-[10px] font-black uppercase tracking-tight truncate">{item.label}</span>
            </div>
            <i className={`fa-solid ${item.active ? 'fa-circle-check text-emerald-400' : 'fa-circle text-slate-600'} text-xs ml-1 shrink-0`}></i>
          </button>
        ))}
      </div>

      {/* 4. SCENE-BY-SCENE DIRECTOR TIMELINE BOARD */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <i className="fa-solid fa-table-columns text-orange-500"></i>
            <span>Scene-by-Scene Director Board ({directorPlan.scenes.length} Cuts)</span>
          </h4>
          <span className="text-[9px] text-slate-500 font-bold uppercase">Click scene to inspect</span>
        </div>

        {/* Horizontal Scene Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {directorPlan.scenes.map((scene, idx) => {
            const isSelected = selectedSceneIdx === idx;
            return (
              <div
                key={scene.sceneIndex}
                onClick={() => setSelectedSceneIdx(idx)}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-gradient-to-br from-orange-500/20 via-slate-900 to-slate-950 border-orange-500 shadow-lg scale-[1.02]' 
                    : themeMode === 'light' ? 'bg-slate-50 border-slate-200 hover:bg-slate-100' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {/* Thumbnail Preview */}
                <div className="w-full h-20 rounded-xl overflow-hidden relative mb-2 bg-slate-800">
                  <img
                    src={scene.sourceThumbnail}
                    alt={scene.clipTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/80 text-[8px] font-black uppercase text-white">
                    Scene #{idx + 1}
                  </div>
                  <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-orange-600/90 text-[8px] font-black text-white">
                    {scene.duration.toFixed(1)}s
                  </div>
                </div>

                {/* Camera & Transition Badges */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span 
                      onClick={(e) => { e.stopPropagation(); handleCycleCameraMotion(idx); }}
                      title="Click to cycle camera motion"
                      className="px-1.5 py-0.5 rounded-md bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[8px] font-black uppercase truncate cursor-pointer hover:bg-orange-500/25"
                    >
                      <i className="fa-solid fa-video mr-1"></i>
                      {scene.cameraMotion.replace(/_/g, ' ')}
                    </span>
                    <span 
                      onClick={(e) => { e.stopPropagation(); handleCycleTransition(idx); }}
                      title="Click to cycle transition"
                      className="px-1.5 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[8px] font-black uppercase truncate cursor-pointer hover:bg-purple-500/25"
                    >
                      <i className="fa-solid fa-shuffle mr-1"></i>
                      {scene.transitionOut.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Motion graphics badge count */}
                  {scene.motionGraphics.length > 0 && (
                    <div className="text-[8px] font-bold text-emerald-400 flex items-center gap-1 truncate">
                      <i className="fa-solid fa-sparkles text-[7px]"></i>
                      <span>{scene.motionGraphics[0]?.title || 'Motion Graphic'}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. ACTIVE SCENE INSPECTOR DRAWER */}
      {activeScene && (
        <div className={`p-4 rounded-2xl border space-y-3 ${
          themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-white/10'
        }`}>
          <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-orange-500 text-white text-xs font-black flex items-center justify-center">
                {activeScene.sceneIndex + 1}
              </span>
              <h5 className="text-xs font-black uppercase tracking-tight">
                Scene #{activeScene.sceneIndex + 1} Director Cue
              </h5>
            </div>
            <span className="text-[9px] font-black uppercase text-orange-400">
              {activeScene.startTime.toFixed(1)}s → {activeScene.endTime.toFixed(1)}s ({activeScene.duration.toFixed(1)}s)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {/* Script Excerpt */}
            <div className="sm:col-span-2 space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-400">Script Spoken Beat</p>
              <p className={`text-xs font-medium italic ${themeMode === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                "{activeScene.scriptExcerpt}"
              </p>
              <p className="text-[9px] text-slate-500 font-medium">
                {activeScene.directorNotes}
              </p>
            </div>

            {/* Editing Parameters */}
            <div className="space-y-1.5 p-2.5 rounded-xl bg-slate-900 border border-white/5 text-[9px] font-bold">
              <div className="flex justify-between text-slate-300">
                <span>Camera Motion:</span>
                <span className="text-orange-400 font-black">{activeScene.cameraMotion.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Speed Pacing:</span>
                <span className="text-cyan-400 font-black">{activeScene.speed}x</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Transition Out:</span>
                <span className="text-purple-400 font-black">{activeScene.transitionOut.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Motion Graphics:</span>
                <span className="text-emerald-400 font-black">{activeScene.motionGraphics.length} Active Layer</span>
              </div>
            </div>
          </div>

          {/* Active Motion Graphics preview tags */}
          {activeScene.motionGraphics.length > 0 && (
            <div className="pt-2 border-t border-white/5 flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-black uppercase text-slate-400">Overlaid Graphics:</span>
              {activeScene.motionGraphics.map(mg => (
                <span 
                  key={mg.id}
                  className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold flex items-center gap-1"
                >
                  <i className="fa-solid fa-shapes text-[8px]"></i>
                  <span>[{mg.type.replace(/_/g, ' ')}]: {mg.title}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
