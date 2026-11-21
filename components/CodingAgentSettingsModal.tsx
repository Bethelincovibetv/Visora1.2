import React, { useState, useEffect } from 'react';
import {
  CODING_AGENT_MODELS,
  CodingAgentSettings,
  DEFAULT_CODING_AGENT_SETTINGS,
  DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION
} from '../services/codingAgentConfig';

export interface CodingAgentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CodingAgentSettings;
  onSave: (next: CodingAgentSettings) => void;
  themeMode?: 'light' | 'dark';
}

export const CodingAgentSettingsModal: React.FC<CodingAgentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  themeMode = 'dark'
}) => {
  const [draftModel, setDraftModel] = useState(settings.model);
  const [draftTemp, setDraftTemp] = useState(settings.temperature);
  const [draftInstruction, setDraftInstruction] = useState(settings.systemInstruction);

  useEffect(() => {
    if (isOpen) {
      setDraftModel(settings.model);
      setDraftTemp(settings.temperature);
      setDraftInstruction(settings.systemInstruction);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const isLight = themeMode === 'light';
  const selectedModelMeta = CODING_AGENT_MODELS.find(m => m.id === draftModel);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      model: draftModel,
      temperature: Number(draftTemp),
      systemInstruction: draftInstruction.trim() || DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[320] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <form
        onSubmit={handleSave}
        onClick={e => e.stopPropagation()}
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-slate-900 border-white/15 text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-white/10'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center text-sm">
              <i className="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Coding Agent Settings</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Configure model, temperature, and agent system instruction
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
            title="Close settings"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Model Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold">Model</label>
            <select
              value={draftModel}
              onChange={e => setDraftModel(e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-medium outline-none cursor-pointer ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-orange-500'
                  : 'bg-slate-950 border-white/15 text-white focus:border-orange-500'
              }`}
            >
              {CODING_AGENT_MODELS.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {selectedModelMeta && (
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {selectedModelMeta.description}
              </p>
            )}
          </div>

          {/* Temperature Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold">Temperature</label>
              <span className="text-xs font-mono font-bold text-orange-400 tabular-nums">
                {draftTemp.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={draftTemp}
              onChange={e => setDraftTemp(parseFloat(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className={`flex justify-between text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>0.0 (Deterministic)</span>
              <span>Default: 0.3</span>
              <span>1.0 (Creative)</span>
            </div>
            {selectedModelMeta && !selectedModelMeta.supportsTemperature && (
              <p className="text-[11px] text-amber-400">
                Note: Gemini 4 models use adaptive reasoning temperature; your 0.3 preference applies automatically whenever using Gemini 3.1 models.
              </p>
            )}
          </div>

          {/* System Instruction */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-bold">System Instruction</label>
              <button
                type="button"
                onClick={() => setDraftInstruction(DEFAULT_CODING_AGENT_SYSTEM_INSTRUCTION)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                Reset Default
              </button>
            </div>
            <textarea
              value={draftInstruction}
              onChange={e => setDraftInstruction(e.target.value)}
              rows={10}
              className={`w-full p-3 rounded-xl border font-mono text-xs leading-relaxed outline-none resize-y ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:border-orange-500'
                  : 'bg-slate-950 border-white/15 text-slate-100 focus:border-orange-500'
              }`}
            />
          </div>

          <div
            className={`px-3.5 py-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-600'
                : 'bg-white/[0.03] border-white/10 text-slate-300'
            }`}
          >
            <i className="fa-solid fa-shield-halved text-emerald-400 shrink-0"></i>
            <span>API keys are managed strictly on the server and never stored in browser settings.</span>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-white/10'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setDraftModel(DEFAULT_CODING_AGENT_SETTINGS.model);
              setDraftTemp(DEFAULT_CODING_AGENT_SETTINGS.temperature);
              setDraftInstruction(DEFAULT_CODING_AGENT_SETTINGS.systemInstruction);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
            }`}
          >
            Restore All Defaults
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              Save Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
