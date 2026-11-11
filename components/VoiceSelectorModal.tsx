import React, { useState, useEffect, useRef } from 'react';
import { VOICE_AVATAR_OPTIONS, VoiceOption } from '../constants';
import { synthesizeGoogleVoice } from '../services/googleVoiceService';

interface VoiceSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (voiceName: string) => void;
  themeMode?: 'light' | 'dark';
}

export const VoiceSelectorModal: React.FC<VoiceSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  themeMode = 'dark'
}) => {
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

  // Stop playback when modal closes
  useEffect(() => {
    if (!isOpen) {
      stopPreview();
    }
  }, [isOpen]);

  const stopPreview = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (e) {}
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setPlayingVoiceId(null);
    setIsLoadingAudio(null);
  };

  const handlePlayPreview = async (voice: VoiceOption) => {
    // If already playing this voice, stop it
    if (playingVoiceId === voice.id) {
      stopPreview();
      return;
    }

    stopPreview();
    setIsLoadingAudio(voice.id);

    // 1. Check audio URL cache
    if (audioCacheRef.current.has(voice.id)) {
      const cachedUrl = audioCacheRef.current.get(voice.id)!;
      playAudioUrl(cachedUrl, voice.id);
      setIsLoadingAudio(null);
      return;
    }

    // 2. Synthesize audio preview
    try {
      const res = await synthesizeGoogleVoice({
        text: voice.sampleText,
        voiceName: voice.voiceName,
        format: 'mp3',
        speed: 1.0
      });

      if (res.ok && res.audioUrl) {
        audioCacheRef.current.set(voice.id, res.audioUrl);
        playAudioUrl(res.audioUrl, voice.id);
      } else {
        // Web speech browser fallback
        playBrowserSpeechFallback(voice);
      }
    } catch (err) {
      console.warn('Preview synthesis fallback:', err);
      playBrowserSpeechFallback(voice);
    } finally {
      setIsLoadingAudio(null);
    }
  };

  const playAudioUrl = (url: string, voiceId: string) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      audioRef.current.src = url;
      audioRef.current.onended = () => setPlayingVoiceId(null);
      audioRef.current.onerror = () => setPlayingVoiceId(null);
      audioRef.current.play().then(() => {
        setPlayingVoiceId(voiceId);
      }).catch((err) => {
        if (err?.name !== 'AbortError' && !err?.message?.includes('interrupted')) {
          console.warn('Audio play note:', err);
        }
        setPlayingVoiceId(null);
      });
    } catch (err) {
      console.warn('Audio play error:', err);
      setPlayingVoiceId(null);
    }
  };

  const playBrowserSpeechFallback = (voice: VoiceOption) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setPlayingVoiceId(null);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voice.sampleText);
      const synthVoices = window.speechSynthesis.getVoices();

      // Look for Nigerian or best matching English voices
      const nigerianOrAfrican = synthVoices.find(v => 
        v.lang.includes('en-NG') || 
        v.name.toLowerCase().includes('nigeria') ||
        (voice.gender === 'Female' && (v.name.includes('Female') || v.name.includes('Zira') || v.lang.includes('en-GB')))
      );

      if (nigerianOrAfrican) utterance.voice = nigerianOrAfrican;
      utterance.pitch = voice.gender === 'Female' ? 1.18 : 0.95;
      utterance.rate = 1.02;

      utterance.onstart = () => setPlayingVoiceId(voice.id);
      utterance.onend = () => setPlayingVoiceId(null);
      utterance.onerror = () => setPlayingVoiceId(null);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      setPlayingVoiceId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-rise">
      <div 
        className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden relative ${
          themeMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-white/10 text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-gradient-to-r from-orange-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-lg">
              <i className="fa-solid fa-microphone-lines"></i>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-tight">AI Voiceover & Accent Studio</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[8.5px] font-extrabold uppercase border border-emerald-500/30">
                  🇳🇬 Nigerian Voices Included
                </span>
              </div>
              <p className={`text-xs mt-0.5 font-medium ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                Listen to voice samples and choose the ideal narration tone for your video.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
              themeMode === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'
            }`}
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* VOICE CARDS LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {VOICE_AVATAR_OPTIONS.map((voice) => {
            const isSelected = selectedVoice === voice.voiceName || selectedVoice === voice.id;
            const isPlaying = playingVoiceId === voice.id;
            const isLoading = isLoadingAudio === voice.id;

            return (
              <div
                key={voice.id}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)]'
                    : themeMode === 'light'
                    ? 'border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-white'
                    : 'border-white/5 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05]'
                }`}
              >
                {/* LEFT: AVATAR & METADATA */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  {/* ARTIST AVATAR */}
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-white/20 shadow-md bg-slate-950">
                    <img
                      src={voice.avatar}
                      alt={voice.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {voice.flag && (
                      <span className="absolute bottom-1 right-1 text-xs drop-shadow-md">
                        {voice.flag}
                      </span>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
                        <span className={themeMode === 'light' ? 'text-slate-900' : 'text-white'}>
                          {voice.name}
                        </span>
                      </h4>
                      {voice.badge && (
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider border ${
                          voice.isVixoraVoice 
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' 
                            : 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        }`}>
                          {voice.badge}
                        </span>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        themeMode === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-white/10 text-slate-300'
                      }`}>
                        {voice.gender}
                      </span>
                    </div>

                    <p className={`text-[11px] font-semibold truncate ${themeMode === 'light' ? 'text-orange-600' : 'text-orange-400'}`}>
                      {voice.accent}
                    </p>

                    <p className={`text-[10px] leading-relaxed line-clamp-2 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
                      {voice.description}
                    </p>
                  </div>
                </div>

                {/* RIGHT: PREVIEW BUTTON & SELECT ACTION */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10 justify-end">
                  {/* AUDIO PREVIEW BUTTON */}
                  <button
                    type="button"
                    onClick={() => handlePlayPreview(voice)}
                    disabled={isLoading}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all cursor-pointer border ${
                      isPlaying
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 shadow-lg animate-pulse'
                        : themeMode === 'light'
                        ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border-white/15'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <i className="fa-solid fa-spinner animate-spin text-xs"></i>
                        <span className="text-[10px]">Loading...</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <i className="fa-solid fa-square text-xs"></i>
                        <span className="text-[10px]">Stop Audio</span>
                        {/* ANIMATED EQUALIZER BARS */}
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-1 bg-white rounded-full animate-bounce h-3"></span>
                          <span className="w-1 bg-white rounded-full animate-bounce h-2" style={{ animationDelay: '0.15s' }}></span>
                          <span className="w-1 bg-white rounded-full animate-bounce h-3.5" style={{ animationDelay: '0.3s' }}></span>
                        </div>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-play text-xs text-orange-400"></i>
                        <span className="text-[10px]">Voice Sample</span>
                      </>
                    )}
                  </button>

                  {/* SELECT BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      stopPreview();
                      onSelectVoice(voice.voiceName);
                      onClose();
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-orange-500 text-white shadow-lg cursor-default'
                        : themeMode === 'light'
                        ? 'bg-slate-200 hover:bg-orange-500 hover:text-white text-slate-800'
                        : 'bg-white/10 hover:bg-orange-500 hover:text-white text-slate-200'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <i className="fa-solid fa-circle-check text-xs"></i>
                        <span className="text-[10px]">Active</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px]">Select</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL FOOTER */}
        <div className={`p-4 border-t flex items-center justify-between text-xs shrink-0 ${
          themeMode === 'light' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/80 border-white/10 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-wand-magic-sparkles text-orange-400"></i>
            <span className="text-[10px] font-bold">
              Powered by Google Gemini TTS & Vixora Voice Engine
            </span>
          </div>

          <button
            onClick={() => {
              stopPreview();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-black text-[10px] uppercase tracking-wider shadow-md cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
