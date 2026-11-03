import React, { useState } from 'react';
import { VOICE_AVATAR_OPTIONS, VoiceOption } from '../constants';
import { VoiceSelectorModal } from './VoiceSelectorModal';
import { synthesizeGoogleVoice } from '../services/googleVoiceService';

interface VoiceSelectorFieldProps {
  selectedVoice: string;
  onSelectVoice: (voiceName: string) => void;
  themeMode?: 'light' | 'dark';
}

export const VoiceSelectorField: React.FC<VoiceSelectorFieldProps> = ({
  selectedVoice,
  onSelectVoice,
  themeMode = 'dark'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlayingQuick, setIsPlayingQuick] = useState(false);
  const [isLoadingQuick, setIsLoadingQuick] = useState(false);

  // Find active voice object or default to Kore (Vixora Nigerian Signature)
  const currentVoice: VoiceOption = 
    VOICE_AVATAR_OPTIONS.find(v => v.voiceName === selectedVoice || v.id === selectedVoice) || 
    VOICE_AVATAR_OPTIONS[0];

  const handleQuickPreview = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlayingQuick) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingQuick(false);
      return;
    }

    setIsLoadingQuick(true);
    try {
      const res = await synthesizeGoogleVoice({
        text: currentVoice.sampleText,
        voiceName: currentVoice.voiceName,
        format: 'mp3',
        speed: 1.0
      });

      if (res.ok && res.audioUrl) {
        const audio = new Audio(res.audioUrl);
        audio.onended = () => setIsPlayingQuick(false);
        audio.onerror = () => setIsPlayingQuick(false);
        audio.play();
        setIsPlayingQuick(true);
      } else {
        // Fallback Web Speech
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(currentVoice.sampleText);
          const synthVoices = window.speechSynthesis.getVoices();
          const nigerianVoice = synthVoices.find(v => v.lang.includes('en-NG') || v.name.toLowerCase().includes('nigeria') || v.name.includes('Female'));
          if (nigerianVoice) utterance.voice = nigerianVoice;
          utterance.pitch = currentVoice.gender === 'Female' ? 1.2 : 0.95;
          utterance.onstart = () => setIsPlayingQuick(true);
          utterance.onend = () => setIsPlayingQuick(false);
          utterance.onerror = () => setIsPlayingQuick(false);
          window.speechSynthesis.speak(utterance);
        }
      }
    } catch (e) {
      console.warn('Quick preview notice:', e);
    } finally {
      setIsLoadingQuick(false);
    }
  };

  return (
    <>
      <div 
        className={`p-3 rounded-2xl border flex flex-col justify-between gap-2 transition-all cursor-pointer group ${
          themeMode === 'light' 
            ? 'bg-slate-50 hover:bg-white border-slate-200 hover:border-orange-400' 
            : 'bg-slate-950/80 hover:bg-slate-900 border-white/10 hover:border-orange-500/50'
        }`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black uppercase text-purple-400 flex items-center gap-1">
            <i className="fa-solid fa-microphone"></i> Voiceover Accent & Tone
          </span>
          <span className="text-[8px] font-black uppercase text-orange-400 group-hover:underline flex items-center gap-0.5">
            <span>Change Voice</span>
            <i className="fa-solid fa-chevron-right text-[7px]"></i>
          </span>
        </div>

        {/* ACTIVE VOICE CARD ROW */}
        <div className="flex items-center gap-2.5">
          {/* AVATAR */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/20 shadow-md bg-slate-900">
            <img
              src={currentVoice.avatar}
              alt={currentVoice.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {currentVoice.flag && (
              <span className="absolute bottom-0.5 right-0.5 text-[9px]">
                {currentVoice.flag}
              </span>
            )}
          </div>

          {/* NAME & ACCENT */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <p className={`text-[10.5px] font-black truncate ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {currentVoice.name}
              </p>
              {currentVoice.badge && (
                <span className="px-1 py-0.2 rounded bg-orange-500/20 text-orange-400 text-[7px] font-black uppercase border border-orange-500/30 shrink-0">
                  {currentVoice.isVixoraVoice ? '🇳🇬 NAIJA' : 'VOICE'}
                </span>
              )}
            </div>
            <p className="text-[8.5px] text-slate-400 font-medium truncate">
              {currentVoice.accent}
            </p>
          </div>

          {/* QUICK AUDIO PREVIEW BUTTON */}
          <button
            type="button"
            onClick={handleQuickPreview}
            title="Listen to voice sample"
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              isPlayingQuick
                ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                : themeMode === 'light'
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
            }`}
          >
            {isLoadingQuick ? (
              <i className="fa-solid fa-spinner animate-spin text-[10px]"></i>
            ) : isPlayingQuick ? (
              <i className="fa-solid fa-square text-[10px]"></i>
            ) : (
              <i className="fa-solid fa-play text-[10px] text-orange-400"></i>
            )}
          </button>
        </div>
      </div>

      {/* FULL VOICE SELECTION & PREVIEW MODAL */}
      <VoiceSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={onSelectVoice}
        themeMode={themeMode}
      />
    </>
  );
};
