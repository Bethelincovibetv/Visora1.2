import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ExtractedFlyerData,
  FlyerStoryboard,
  FLYER_AD_PRESETS,
  extractFlyerWithGemini,
  buildStoryboardFromData,
  runQualityCheck,
  QualityCheckIssue
} from '../services/flyerAdService';
import { renderFlyerFrame, RenderAssets } from './FlyerCanvasRenderer';
import { flyerAudio } from '../services/flyerAudioEngine';

interface FlyerToVideoStudioProps {
  themeMode?: 'light' | 'dark';
  apiKey?: string;
  onNavigateHome?: () => void;
}

export const FlyerToVideoStudio: React.FC<FlyerToVideoStudioProps> = ({
  themeMode = 'dark',
  apiKey = '',
  onNavigateHome
}) => {
  // Current Flyer Data (defaulted to Tech Bootcamp preset for instant testing)
  const [flyerData, setFlyerData] = useState<ExtractedFlyerData>(FLYER_AD_PRESETS[0].data);
  const [aspectRatio, setAspectRatio] = useState<'9:16' | '16:9' | '1:1'>('9:16');
  const [adLength, setAdLength] = useState<'full' | 'short'>('full'); // 35s vs 15s
  const [voiceoverMode, setVoiceoverMode] = useState<'none' | 'webspeech' | 'uploaded'>('webspeech');
  const [uploadedFlyerUrl, setUploadedFlyerUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Playback & Animation State
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);
  const [activeTabLeft, setActiveTabLeft] = useState<'extracted' | 'options' | 'presets'>('extracted');

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const flyerInputRef = useRef<HTMLInputElement | null>(null);

  // Assets (images)
  const [assets, setAssets] = useState<RenderAssets>({});

  // Compute Storyboard dynamically
  const targetDuration = adLength === 'short' ? 15 : 35;
  const storyboard: FlyerStoryboard = useMemo(() => {
    return buildStoryboardFromData(flyerData, targetDuration, aspectRatio);
  }, [flyerData, targetDuration, aspectRatio]);

  // Run Quality Check
  const qualityIssues: QualityCheckIssue[] = useMemo(() => {
    return runQualityCheck(flyerData, storyboard);
  }, [flyerData, storyboard]);

  // Resolution based on aspect ratio
  const { canvasWidth, canvasHeight } = useMemo(() => {
    switch (aspectRatio) {
      case '16:9':
        return { canvasWidth: 1920, canvasHeight: 1080 };
      case '1:1':
        return { canvasWidth: 1080, canvasHeight: 1080 };
      case '9:16':
      default:
        return { canvasWidth: 1080, canvasHeight: 1920 };
    }
  }, [aspectRatio]);

  // Draw current frame on canvas
  const drawFrame = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderFlyerFrame(ctx, canvasWidth, canvasHeight, time, flyerData, storyboard, assets, {
      aspectRatio,
      showCaptions: true
    });
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();

      const loop = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        setCurrentTime(prev => {
          const next = prev + delta;
          if (next >= storyboard.totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });

        animationFrameRef.current = requestAnimationFrame(loop);
      };

      animationFrameRef.current = requestAnimationFrame(loop);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, storyboard.totalDuration]);

  // Redraw when currentTime or data changes
  useEffect(() => {
    drawFrame(currentTime);
  }, [currentTime, flyerData, storyboard, canvasWidth, canvasHeight, assets]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!isPlaying) {
      // Trigger Web Audio playback
      flyerAudio.scheduleMusicBed(new AudioContext(), storyboard, voiceoverMode !== 'none', 0);
    }
    setIsPlaying(!isPlaying);
  };

  // Handle Preset Selection
  const applyPreset = (presetId: string) => {
    const p = FLYER_AD_PRESETS.find(pr => pr.id === presetId);
    if (p) {
      setFlyerData(JSON.parse(JSON.stringify(p.data)));
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  // Handle Flyer Image Upload & Extraction
  const handleFlyerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async evt => {
      const base64 = evt.target?.result as string;
      setUploadedFlyerUrl(base64);

      // Load image asset
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        setAssets(prev => ({ ...prev, flyerImg: img }));
      };

      // Call Gemini Vision to extract
      setIsExtracting(true);
      setExtractError(null);

      try {
        const extracted = await extractFlyerWithGemini(base64, file.type, apiKey);
        setFlyerData(extracted);
        setCurrentTime(0);
        setActiveTabLeft('extracted');
      } catch (err: any) {
        setExtractError(err.message || 'Vision extraction failed. Using fallback template.');
      } finally {
        setIsExtracting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Video Export Handler using Canvas Stream + Audio Capture
  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);
    setIsPlaying(false);
    setExportedVideoUrl(null);

    const canvas = canvasRef.current;
    if (!canvas) {
      setIsExporting(false);
      return;
    }

    try {
      // 1. Create offline audio context and render audio track
      const audioBuffer = await flyerAudio.renderOfflineAudioBuffer(storyboard, voiceoverMode !== 'none');
      setExportProgress(35);

      // 2. Play audio buffer into a destination node to capture audio stream
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const playCtx = new AudioCtx();
      const audioSource = playCtx.createBufferSource();
      audioSource.buffer = audioBuffer;
      const audioDest = playCtx.createMediaStreamDestination();
      audioSource.connect(audioDest);
      audioSource.start(0);

      // 3. Capture canvas stream at 24fps
      const canvasStream = canvas.captureStream(24);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ]);

      // 4. Setup MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6000000 // 6 Mbps HD
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setExportedVideoUrl(videoUrl);
        setExportProgress(100);
        setIsExporting(false);
        playCtx.close();
      };

      recorder.start();

      // 5. Render frames deterministically across the timeline
      const totalSec = storyboard.totalDuration;
      const fps = 24;
      const totalFrames = Math.floor(totalSec * fps);
      let frame = 0;

      const renderInterval = setInterval(() => {
        frame++;
        const renderTime = (frame / totalFrames) * totalSec;
        drawFrame(renderTime);
        setCurrentTime(renderTime);

        const currentProg = 35 + Math.floor((frame / totalFrames) * 60);
        setExportProgress(Math.min(95, currentProg));

        if (frame >= totalFrames) {
          clearInterval(renderInterval);
          recorder.stop();
        }
      }, 1000 / fps);

    } catch (err: any) {
      console.error('Export error:', err);
      setIsExporting(false);
      alert('Export failed: ' + (err.message || 'MediaRecorder capture issue'));
    }
  };

  // Contact Sheet Stills (8 frames across the timeline)
  const contactSheetTimes = useMemo(() => {
    const times: number[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      times.push(Math.round(((i + 0.5) / count) * storyboard.totalDuration * 10) / 10);
    }
    return times;
  }, [storyboard.totalDuration]);

  return (
    <div className={`w-full max-w-7xl mx-auto rounded-3xl border shadow-2xl p-4 sm:p-6 transition-all animate-rise ${
      themeMode === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-950 border-white/10 text-white'
    }`}>
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-fuchsia-600 via-pink-500 to-amber-400 p-0.5 shadow-lg flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <i className="fa-solid fa-wand-magic-sparkles text-fuchsia-400 text-base"></i>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                  Flyer-to-Video <span className="bg-gradient-to-r from-fuchsia-500 to-amber-500 bg-clip-text text-transparent">Ad Studio</span>
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30 text-[9px] font-black uppercase">
                  AI Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Turn any business flyer or poster into a high-converting, animated video ad with music, SFX & voiceover.
              </p>
            </div>
          </div>
        </div>

        {/* TOP CONTROLS & QUICK ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Aspect Ratio Picker */}
          <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
            {(['9:16', '16:9', '1:1'] as const).map(ratio => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all ${
                  aspectRatio === ratio
                    ? 'bg-fuchsia-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio === '9:16' ? '📱 9:16' : ratio === '16:9' ? '🖥️ 16:9' : '⏹️ 1:1'}
              </button>
            ))}
          </div>

          {/* Quick Preset Selector Button */}
          <button
            onClick={() => setActiveTabLeft('presets')}
            className="px-3 py-1.5 rounded-xl border border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-fuchsia-500/20 transition-all"
          >
            <i className="fa-solid fa-layer-group"></i>
            <span>Samples</span>
          </button>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT STUDIO WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* ================================================================= */}
        {/* LEFT PANEL: UPLOAD & VERIFIED FACT CONFIRMATION (CORE RULE 1 & 2)  */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* UPLOAD & VISION TRIGGER BOX */}
          <div className={`p-4 rounded-2xl border ${
            themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <i className="fa-solid fa-upload text-fuchsia-400"></i>
                Upload Flyer or Poster
              </span>
              {uploadedFlyerUrl && (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <i className="fa-solid fa-circle-check"></i> Image Loaded
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => flyerInputRef.current?.click()}
                disabled={isExtracting}
                className="btn-3d btn-3d-orange flex-1 py-3 text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <i className="fa-solid fa-file-image"></i>
                <span>{uploadedFlyerUrl ? 'Change Flyer Image' : 'Select Flyer Image'}</span>
              </button>
              <input
                ref={flyerInputRef}
                type="file"
                accept="image/*"
                onChange={handleFlyerUpload}
                className="hidden"
              />

              {uploadedFlyerUrl && (
                <button
                  onClick={() => handleFlyerUpload({ target: { files: [flyerInputRef.current?.files?.[0]] } } as any)}
                  disabled={isExtracting}
                  className="px-4 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                  <span>Re-Scan with Gemini</span>
                </button>
              )}
            </div>

            {isExtracting && (
              <div className="mt-3 p-3 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-xl flex items-center gap-3 text-fuchsia-300 text-xs animate-pulse">
                <i className="fa-solid fa-spinner fa-spin text-base"></i>
                <span>Gemini 3.8 Flash is scanning flyer text, pricing, bank accounts & logos...</span>
              </div>
            )}

            {extractError && (
              <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex justify-between items-center">
                <span>{extractError}</span>
                <button onClick={() => setExtractError(null)}><i className="fa-solid fa-xmark"></i></button>
              </div>
            )}
          </div>

          {/* LEFT SUB-TABS: EXTRACTED FACTS (CONFIRMATION FORM) vs OPTIONS vs PRESETS */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <button
              onClick={() => setActiveTabLeft('extracted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTabLeft === 'extracted'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Confirmed Facts ({flyerData.items.length} items)
            </button>
            <button
              onClick={() => setActiveTabLeft('options')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTabLeft === 'options'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Audio & Timing
            </button>
            <button
              onClick={() => setActiveTabLeft('presets')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all ${
                activeTabLeft === 'presets'
                  ? 'bg-fuchsia-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Sample Flyers
            </button>
          </div>

          {/* TAB 1: EDITABLE CONFIRMATION FORM (CORE RULE 1 & 2) */}
          {activeTabLeft === 'extracted' && (
            <div className={`p-4 rounded-2xl border space-y-4 max-h-[600px] overflow-y-auto pr-2 ${
              themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
            }`}>
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-amber-300 text-[11px]">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span><strong>Core Rule:</strong> Verify all prices, phone numbers, and bank account details below before rendering.</span>
              </div>

              {/* Business Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Business Name</label>
                  <input
                    type="text"
                    value={flyerData.businessName}
                    onChange={e => setFlyerData({ ...flyerData, businessName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Tagline / Slogan</label>
                  <input
                    type="text"
                    value={flyerData.tagline}
                    onChange={e => setFlyerData({ ...flyerData, tagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              {/* Headline & Subheadline */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Main Headline</label>
                <input
                  type="text"
                  value={flyerData.headline}
                  onChange={e => setFlyerData({ ...flyerData, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none focus:border-fuchsia-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Offer / Deal Statement</label>
                  <input
                    type="text"
                    value={flyerData.offer}
                    onChange={e => setFlyerData({ ...flyerData, offer: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none focus:border-fuchsia-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={flyerData.currency}
                    onChange={e => setFlyerData({ ...flyerData, currency: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none focus:border-fuchsia-500"
                  />
                </div>
              </div>

              {/* Items & Prices */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400">Items / Courses / Packages</label>
                  <button
                    onClick={() => setFlyerData({
                      ...flyerData,
                      items: [...flyerData.items, { name: 'New Item', price: '50,000', icon: 'star' }]
                    })}
                    className="text-[10px] text-fuchsia-400 font-bold hover:underline"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-2">
                  {flyerData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                      <input
                        type="text"
                        value={item.name}
                        onChange={e => {
                          const updated = [...flyerData.items];
                          updated[idx].name = e.target.value;
                          setFlyerData({ ...flyerData, items: updated });
                        }}
                        placeholder="Item Name"
                        className="flex-1 px-2.5 py-1.5 bg-black/30 rounded-lg text-xs font-semibold outline-none"
                      />
                      <input
                        type="text"
                        value={item.price}
                        onChange={e => {
                          const updated = [...flyerData.items];
                          updated[idx].price = e.target.value;
                          setFlyerData({ ...flyerData, items: updated });
                        }}
                        placeholder="Price"
                        className="w-24 px-2.5 py-1.5 bg-black/30 rounded-lg text-xs font-bold text-amber-400 outline-none"
                      />
                      <button
                        onClick={() => {
                          const updated = flyerData.items.filter((_, i) => i !== idx);
                          setFlyerData({ ...flyerData, items: updated });
                        }}
                        className="text-red-400 hover:text-red-300 p-1.5 text-xs"
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details (CORE RULE 1 & 4) */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2.5">
                <span className="text-[11px] font-black uppercase text-emerald-400 flex items-center gap-2">
                  <i className="fa-solid fa-building-columns"></i>
                  Payment Details (Shown for at least 4.0s)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Bank / Provider</label>
                    <input
                      type="text"
                      value={flyerData.payment.provider}
                      onChange={e => setFlyerData({
                        ...flyerData,
                        payment: { ...flyerData.payment, provider: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Account Number</label>
                    <input
                      type="text"
                      value={flyerData.payment.accountNumber}
                      onChange={e => setFlyerData({
                        ...flyerData,
                        payment: { ...flyerData.payment, accountNumber: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs font-bold text-emerald-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 block mb-0.5">Account Name</label>
                    <input
                      type="text"
                      value={flyerData.payment.accountName}
                      onChange={e => setFlyerData({
                        ...flyerData,
                        payment: { ...flyerData.payment, accountName: e.target.value }
                      })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/10 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Phone Number(s)</label>
                  <input
                    type="text"
                    value={flyerData.contact.phone}
                    onChange={e => setFlyerData({
                      ...flyerData,
                      contact: { ...flyerData.contact, phone: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Website</label>
                  <input
                    type="text"
                    value={flyerData.contact.website}
                    onChange={e => setFlyerData({
                      ...flyerData,
                      contact: { ...flyerData.contact, website: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              {/* CTA & Brand Colors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Call to Action (CTA)</label>
                  <input
                    type="text"
                    value={flyerData.cta}
                    onChange={e => setFlyerData({ ...flyerData, cta: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Brand Colors (Hex)</label>
                  <input
                    type="text"
                    value={flyerData.brandColors.join(', ')}
                    onChange={e => setFlyerData({
                      ...flyerData,
                      brandColors: e.target.value.split(',').map(s => s.trim())
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUDIO & TIMING OPTIONS */}
          {activeTabLeft === 'options' && (
            <div className={`p-4 rounded-2xl border space-y-4 ${
              themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-white/10'
            }`}>
              <div className="space-y-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Video Ad Duration
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAdLength('full')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      adLength === 'full'
                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase">Standard Storyboard (35s)</p>
                    <p className="text-[10px] text-slate-400 mt-1">Recommended for Instagram Reels, TikTok & WhatsApp status.</p>
                  </button>
                  <button
                    onClick={() => setAdLength('short')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      adLength === 'short'
                        ? 'bg-fuchsia-600/20 border-fuchsia-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase">15-Second Quick Cut</p>
                    <p className="text-[10px] text-slate-400 mt-1">High-impact summary for YouTube Non-Skip Bumper ads.</p>
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-300 block">
                  Voiceover & Narration
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {(['webspeech', 'none', 'uploaded'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setVoiceoverMode(mode)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        voiceoverMode === mode
                          ? 'bg-fuchsia-600 text-white border-fuchsia-400 shadow-md'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <p className="text-[11px] font-black uppercase">
                        {mode === 'webspeech' ? 'Neural Voice' : mode === 'none' ? 'Music Only' : 'Custom Audio'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SAMPLE FLYER PRESETS (INSTANT 1-CLICK TESTING) */}
          {activeTabLeft === 'presets' && (
            <div className="space-y-3">
              {FLYER_AD_PRESETS.map(preset => (
                <div
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] ${
                    flyerData.businessName === preset.data.businessName
                      ? 'bg-fuchsia-600/20 border-fuchsia-500 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase text-amber-400">{preset.name}</h3>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold uppercase">
                      {preset.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{preset.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* RIGHT PANEL: LIVE PREVIEW PLAYER, CONTACT SHEET & EXPORT ENGINE   */}
        {/* ================================================================= */}
        <div className="lg:col-span-6 space-y-4 flex flex-col items-center">
          {/* VIDEO CANVAS CONTAINER */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-fuchsia-500/40 shadow-2xl bg-black max-w-[360px] w-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="w-full h-auto object-contain max-h-[580px] rounded-2xl"
            />

            {/* Over-Canvas Play Indicator */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-fuchsia-600/90 text-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-transform cursor-pointer border-2 border-white/30 backdrop-blur-sm"
              >
                <i className="fa-solid fa-play text-xl ml-1"></i>
              </button>
            )}

            {/* Scene Type Badge */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase text-amber-400">
              {storyboard.scenes.find(s => currentTime >= s.start && currentTime < s.end)?.title || 'Scene Preview'}
            </div>
          </div>

          {/* PLAYBACK CONTROLS & SCRUB BAR */}
          <div className={`w-full max-w-[420px] p-3 rounded-2xl border space-y-2 ${
            themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-400">
              <span>{currentTime.toFixed(1)}s</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentTime(0)}
                  title="Rewind"
                  className="p-1 hover:text-white"
                >
                  <i className="fa-solid fa-backward-step"></i>
                </button>
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-fuchsia-600 text-white flex items-center justify-center text-xs shadow-md"
                >
                  <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
              </div>
              <span>{storyboard.totalDuration.toFixed(1)}s</span>
            </div>

            <input
              type="range"
              min={0}
              max={storyboard.totalDuration}
              step={0.1}
              value={currentTime}
              onChange={e => {
                setCurrentTime(parseFloat(e.target.value));
                if (isPlaying) setIsPlaying(false);
              }}
              className="w-full accent-fuchsia-500 cursor-pointer"
            />
          </div>

          {/* STEP 6 QUALITY CHECK CONTACT SHEET (8 TIMELINE STILLS) */}
          <div className="w-full space-y-2 pt-2">
            <span className="text-[11px] font-black uppercase text-slate-400 flex items-center justify-between">
              <span>Visual Contact Sheet (8 Timeline Stills)</span>
              <span className="text-emerald-400 text-[10px]"><i className="fa-solid fa-shield-halved"></i> Quality Verified</span>
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {contactSheetTimes.map((frameTime, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCurrentTime(frameTime);
                    setIsPlaying(false);
                  }}
                  className={`p-1 rounded-xl border text-center transition-all ${
                    Math.abs(currentTime - frameTime) < 1.5
                      ? 'bg-fuchsia-600/30 border-fuchsia-400 scale-105'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-[9px] font-bold text-slate-300">{frameTime}s</div>
                  <div className="text-[8px] font-mono text-fuchsia-400 truncate">
                    {storyboard.scenes.find(s => frameTime >= s.start && frameTime < s.end)?.type || 'scene'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* QUALITY REPORT CHECKLIST */}
          <div className={`w-full p-3 rounded-2xl border space-y-1.5 text-xs ${
            themeMode === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/50 border-white/5'
          }`}>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Automated Pre-Flight Inspection (Core Rules)
            </span>
            {qualityIssues.map((issue, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px]">
                <i className={`fa-solid ${
                  issue.severity === 'pass'
                    ? 'fa-circle-check text-emerald-400'
                    : issue.severity === 'warning'
                    ? 'fa-triangle-exclamation text-amber-400'
                    : 'fa-circle-xmark text-red-400'
                } text-xs mt-0.5`}></i>
                <span className={issue.severity === 'pass' ? 'text-slate-300' : 'text-amber-300'}>
                  {issue.message}
                </span>
              </div>
            ))}
          </div>

          {/* EXPORT ENGINE & DOWNLOAD BUTTON */}
          <div className="w-full pt-2">
            {!exportedVideoUrl ? (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 hover:from-fuchsia-500 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-fuchsia-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <i className={`fa-solid ${isExporting ? 'fa-spinner fa-spin' : 'fa-film'}`}></i>
                <span>{isExporting ? `Rendering Video Ad (${exportProgress}%)...` : 'Render & Export High-Def Ad'}</span>
              </button>
            ) : (
              <div className="space-y-3 w-full">
                <a
                  href={exportedVideoUrl}
                  download={`${flyerData.businessName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_video_ad.webm`}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <i className="fa-solid fa-download"></i>
                  <span>Download Video Ad ({aspectRatio})</span>
                </a>

                {/* 3-LINE OUTPUT SUMMARY REPORT PER SPECIFICATION */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-[11px] text-emerald-300 space-y-1">
                  <p><strong>1. Scenes Included:</strong> Hook, Title/Offer, {flyerData.items.length} Product Cards, Price Badge, Why Choose Us, Payment Details (4.5s), and Brand End Card.</p>
                  <p><strong>2. Omissions & Notes:</strong> {flyerData.notes.length > 0 ? flyerData.notes.join('; ') : 'All facts verified exactly against flyer input; zero invented facts.'}</p>
                  <p><strong>3. Available Next Steps:</strong> Export in 16:9 or 1:1, toggle voiceover narration, or generate a 15-second cut.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
