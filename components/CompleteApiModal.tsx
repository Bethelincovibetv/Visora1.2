import React, { useState } from 'react';

interface CompleteApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode?: 'dark' | 'light';
  baseUrl: string;
}

export const CompleteApiModal: React.FC<CompleteApiModalProps> = ({
  isOpen,
  onClose,
  themeMode = 'dark',
  baseUrl,
}) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'prompt' | 'code' | 'api' | 'sync'>('all');
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isOpen) return null;

  const studioAiPrompt = `### AI STUDIO / WEB DEVELOPER INTEGRATION INSTRUCTION PROMPT
Act as an elite frontend and full-stack software engineer. Integrate the Vixora AI Studio features (Video Creation, AI Script Generation, Voiceover Audio Synthesis, Sound Effects, Music Library, Stock Media, and Seamless Cloud Database Auth Sync) directly into my website as a native, embedded suite (not using an iframe).

TARGET API BASE URL:
${baseUrl}

SHARED DATABASE & CLOUD ENVIRONMENT VARIABLES (FOR SEAMLESS SSO & AUTO-SYNC):
Add these environment variables to your website's .env file so users share the exact same projects and never have to sign in twice:
VITE_SUPABASE_URL=https://yyejcbbcqirsigphzxxo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_bgmE8p2LPYQn2eVWBUEdMw_6R4GplVZ
GEMINI_API_KEY=your_gemini_api_key_here

COMPLETE REST API ENDPOINTS SPECIFICATION:
1. CREATE VIDEO JOB:
   - POST ${baseUrl}/api/public/v1/videos/create
   - Headers: { "Content-Type": "application/json" }
   - Body: { "topic": "...", "script": "...", "duration": "15s"|"30s"|"60s", "aspect_ratio": "vertical"|"square"|"horizontal", "voice": "Aoede"|"Kore"|"Charon"|"Fenrir"|"Puck", "project_id": "..." }
   - Response: { "ok": true, "job_id": "job_xxx", "status": "queued", "progress": 5 }

2. POLL VIDEO PROGRESS & STATUS:
   - GET ${baseUrl}/api/public/v1/videos/status?job_id={JOB_ID}
   - Response: { "ok": true, "job_id": "job_xxx", "status": "queued"|"processing"|"ready"|"failed", "progress": 0-100, "current_step": "...", "video_url": "...", "thumbnail_url": "..." }

3. AI VIRAL SCRIPT & BEATS GENERATOR:
   - POST ${baseUrl}/api/public/v1/scripts/generate
   - Body: { "topic": "Topic Name", "duration": "30s", "niche": "finance", "tone": "energetic" }
   - Response: { "ok": true, "script": "...", "beats": [{ "text": "...", "visual_search_query": "...", "sfx_cue": "whoosh" }], "suggested_music_mood": "motivational" }

4. AI VOICEOVER (TTS) & VOICES:
   - POST ${baseUrl}/api/public/v1/audio/tts -> { "text": "...", "voice": "Kore" }
   - GET ${baseUrl}/api/public/v1/audio/voices -> Lists all voice options (Kore - Energetic Nigerian Voice, Aoede, Puck, Charon, Fenrir)

5. SOUND EFFECTS (SFX) & BACKGROUND MUSIC CATALOG:
   - GET ${baseUrl}/api/public/v1/audio/sfx -> Lists SFX (whoosh, pop, shutter, sub bass drop, sparkle)
   - GET ${baseUrl}/api/public/v1/audio/music -> Lists background music tracks with streaming URLs

6. STOCK MEDIA SEARCH:
   - POST ${baseUrl}/api/public/v1/assets/search -> { "query": "business", "orientation": "vertical" }

7. UNIFIED AUTH & SINGLE SIGN-ON SYNC (NO DOUBLE SIGN-IN):
   - POST ${baseUrl}/api/public/v1/auth/sync
   - Body: { "user_id": "...", "email": "user@example.com", "full_name": "...", "access_token": "..." }
   - Response: { "ok": true, "authenticated": true, "session_token": "..." }

8. DIRECT VIDEO STREAM & FILE DOWNLOAD:
   - GET ${baseUrl}/api/public/v1/assets/download/{asset_filename}.mp4

FRONTEND INTEGRATION REQUIREMENTS:
1. Build a sleek UI matching my site's branding with Video Creator, Script Generator, Voice Selector, and Music Player tabs.
2. Ensure user sessions auto-sync with POST /api/public/v1/auth/sync on page load.
3. When video is generated, display real-time progress bar (0%-100%) and render a native HTML5 <video controls playsinline> player once ready.`;

  const copyableFullBundle = `================================================================================
VIXORA AI STUDIO — COMPLETE UNIVERSAL API & INTEGRATION DOCUMENTATION
================================================================================
API Live Base URL: ${baseUrl}
Status: LIVE, ACTIVE & OPERATIONAL
Supported Formats: MP4 (H.264 / AAC)
Aspect Ratios: Vertical 9:16 (1080x1920), Square 1:1 (1080x1080), Horizontal 16:9 (1920x1080)
Voices: Kore (Flagship Energetic Nigerian Voice), Aoede, Charon, Fenrir, Puck

--------------------------------------------------------------------------------
1. DIRECT DATABASE & CLOUD ENVIRONMENT VARIABLES (SHARED AUTO-SYNC)
--------------------------------------------------------------------------------
Add these to your website's .env configuration to connect to the exact same cloud database so users never need to log in twice:

VITE_SUPABASE_URL=https://yyejcbbcqirsigphzxxo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_bgmE8p2LPYQn2eVWBUEdMw_6R4GplVZ
GEMINI_API_KEY=your_gemini_api_key_here

--------------------------------------------------------------------------------
2. PROMPT / INSTRUCTIONS TO GIVE TO AI STUDIO / YOUR WEB DEVELOPER
--------------------------------------------------------------------------------
${studioAiPrompt}

--------------------------------------------------------------------------------
3. READY-TO-USE JAVASCRIPT / TYPESCRIPT UNIVERSAL CLIENT SERVICE
--------------------------------------------------------------------------------
/**
 * Vixora Universal Studio API Client
 * Save this file to your website project (e.g. services/vixoraClient.js)
 */
export class VixoraClient {
  constructor(baseUrl = '${baseUrl}') {
    this.baseUrl = baseUrl;
  }

  // 1. Sync User Session (Single Sign-On)
  async syncUserSession({ userId, email, fullName, accessToken }) {
    const res = await fetch(\`\${this.baseUrl}/api/public/v1/auth/sync\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, email, full_name: fullName, access_token: accessToken })
    });
    return res.json();
  }

  // 2. Generate Viral Script with Scene Beats
  async generateScript({ topic, duration = '30s', niche = 'general', tone = 'engaging' }) {
    const res = await fetch(\`\${this.baseUrl}/api/public/v1/scripts/generate\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, duration, niche, tone })
    });
    return res.json();
  }

  // 3. Synthesize Voiceover Audio
  async synthesizeVoiceover({ text, voice = 'Aoede', speed = 1.0 }) {
    const res = await fetch(\`\${this.baseUrl}/api/public/v1/audio/tts\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed })
    });
    return res.json();
  }

  // 4. Fetch Sound Effects (SFX) Catalog
  async getSfxCatalog(category) {
    const query = category ? \`?category=\${category}\` : '';
    const res = await fetch(\`\${this.baseUrl}/api/public/v1/audio/sfx\${query}\`);
    return res.json();
  }

  // 5. Fetch Background Music Library
  async getMusicTracks(mood) {
    const query = mood ? \`?mood=\${mood}\` : '';
    const res = await fetch(\`\${this.baseUrl}/api/public/v1/audio/music\${query}\`);
    return res.json();
  }

  // 6. Search Stock Media
  async searchStockMedia(query, orientation = 'vertical') {
    const res = await fetch(\`\${this.baseUrl}/api/public/v1/assets/search\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, orientation })
    });
    return res.json();
  }

  // 7. Full Video Render Pipeline
  async createAndRenderVideo({ topic, script, duration = '15s', aspectRatio = 'vertical', voice = 'Aoede', onProgress }) {
    const createRes = await fetch(\`\${this.baseUrl}/api/public/v1/videos/create\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, script, duration, aspect_ratio: aspectRatio, voice }),
    });

    const createData = await createRes.json();
    if (!createData.ok || !createData.job_id) {
      throw new Error(createData.error || 'Failed to submit video generation job');
    }

    const jobId = createData.job_id;

    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(\`\${this.baseUrl}/api/public/v1/videos/status?job_id=\${jobId}\`);
          const statusData = await statusRes.json();

          if (onProgress) {
            onProgress({
              progress: statusData.progress || 0,
              step: statusData.current_step || 'Processing...',
              status: statusData.status,
              logs: statusData.logs || [],
            });
          }

          if (statusData.status === 'ready') {
            clearInterval(interval);
            const fullVideoUrl = statusData.video_url.startsWith('http')
              ? statusData.video_url
              : \`\${this.baseUrl}\${statusData.video_url}\`;

            resolve({
              jobId: statusData.job_id,
              assetId: statusData.asset_id,
              videoUrl: fullVideoUrl,
              thumbnailUrl: statusData.thumbnail_url,
            });
          } else if (statusData.status === 'failed') {
            clearInterval(interval);
            reject(new Error(statusData.error || 'Video rendering failed on server'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 2000);
    });
  }
}

export const vixora = new VixoraClient();
`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  // IF MINIMIZED: Show Floating Dock Bar at bottom
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[350] animate-rise">
        <div className={`p-3 sm:px-4 sm:py-2.5 rounded-2xl border shadow-2xl flex items-center justify-between gap-3 backdrop-blur-xl ${
          themeMode === 'light'
            ? 'bg-white/95 border-orange-200 text-slate-900 shadow-orange-500/10'
            : 'bg-slate-900/95 border-orange-500/30 text-white shadow-black/80'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white text-xs shadow-md shrink-0">
              <i className="fa-solid fa-code"></i>
            </div>
            <div className="text-left">
              <p className="text-xs font-black uppercase tracking-tight leading-tight">
                API Docs (Minimized)
              </p>
              <p className="text-[9px] text-slate-400 font-medium">Ready for integration</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsMinimized(false)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Expand API Documentation"
            >
              <i className="fa-solid fa-up-right-and-down-left-from-center text-[9px]"></i>
              <span>Expand</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-all cursor-pointer"
              title="Close API Documentation"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden relative ${
        themeMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-white/10 text-white'
      }`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden mr-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shrink-0">
              <i className="fa-solid fa-code text-base"></i>
            </div>
            <div className="text-left overflow-hidden">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight text-white truncate">
                  Universal API & Integration Bundle
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase border border-emerald-500/30">
                  Live & Active
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">
                Video, Script, Voiceover, SFX, Music, and Cloud Database Sync.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyToClipboard(copyableFullBundle)}
              className="hidden md:flex px-3.5 py-2 rounded-xl bg-ggd-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider items-center gap-1.5 shadow-lg transition-all cursor-pointer"
            >
              <i className={`fa-solid ${copiedAll ? 'fa-check' : 'fa-copy'}`}></i>
              <span>{copiedAll ? 'Copied Everything!' : 'Copy Entire Docs'}</span>
            </button>

            {/* MINIMIZE BUTTON */}
            <button
              onClick={() => setIsMinimized(true)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center gap-1 text-xs font-bold transition-all cursor-pointer"
              title="Minimize API Modal to bottom bar"
            >
              <i className="fa-solid fa-window-minimize text-[10px]"></i>
              <span className="hidden sm:inline text-[10px] uppercase">Minimize</span>
            </button>

            {/* CLOSE / CANCEL BUTTON */}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-red-500/30 text-white hover:text-red-300 flex items-center justify-center transition-all cursor-pointer"
              title="Close / Cancel"
            >
              <i className="fa-solid fa-xmark text-sm"></i>
            </button>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 border-b border-white/10 bg-slate-900/40 overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'all', label: 'Complete Bundle' },
            { id: 'prompt', label: 'AI Studio Prompt' },
            { id: 'sync', label: 'Database & SSO Sync' },
            { id: 'code', label: 'Client & React Code' },
            { id: 'api', label: 'All API Endpoints' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-950 shadow-md'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body with Scrollable Code */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs text-slate-300 leading-relaxed bg-black/40 text-left">
          {activeTab === 'all' && (
            <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 overflow-x-auto text-emerald-400 whitespace-pre-wrap">
              {copyableFullBundle}
            </pre>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-sans font-bold">
                <span>Copy this prompt and paste it directly to your AI Studio / Web Developer:</span>
                <button
                  onClick={() => copyToClipboard(studioAiPrompt)}
                  className="text-ggd-orange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-copy"></i> Copy Prompt
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 overflow-x-auto text-amber-300 whitespace-pre-wrap">
                {studioAiPrompt}
              </pre>
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-3 font-sans">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-relaxed">
                <h4 className="font-black text-sm uppercase text-emerald-400 mb-1">
                  Direct Database Integration & No Double Sign-In
                </h4>
                <p>
                  To allow users to access the same projects, assets, and profiles without having to sign in again, configure these environment variables on your website:
                </p>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 overflow-x-auto text-cyan-300 font-mono text-xs whitespace-pre-wrap">
{`# Shared Cloud Database & AI Keys
VITE_SUPABASE_URL=https://yyejcbbcqirsigphzxxo.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_bgmE8p2LPYQn2eVWBUEdMw_6R4GplVZ
GEMINI_API_KEY=your_gemini_api_key_here`}
              </pre>

              <button
                onClick={() => copyToClipboard(`VITE_SUPABASE_URL=https://yyejcbbcqirsigphzxxo.supabase.co\nVITE_SUPABASE_ANON_KEY=sb_publishable_bgmE8p2LPYQn2eVWBUEdMw_6R4GplVZ\nGEMINI_API_KEY=your_gemini_api_key_here`)}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <i className="fa-solid fa-copy"></i> Copy Environment Variables
              </button>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-sans font-bold">
                <span>Production JS Universal Client & React Embed Component:</span>
                <button
                  onClick={() => copyToClipboard(copyableFullBundle)}
                  className="text-ggd-orange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-copy"></i> Copy Client Code
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 overflow-x-auto text-cyan-300 whitespace-pre-wrap">
                {copyableFullBundle.slice(copyableFullBundle.indexOf('3. READY-TO-USE JAVASCRIPT'), copyableFullBundle.length - 85)}
              </pre>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-sans font-bold">
                <span>All Live Endpoints & Specifications:</span>
                <button
                  onClick={() => copyToClipboard(copyableFullBundle)}
                  className="text-ggd-orange hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <i className="fa-solid fa-copy"></i> Copy Spec
                </button>
              </div>
              <pre className="p-4 rounded-2xl bg-slate-950 border border-white/10 overflow-x-auto text-emerald-400 whitespace-pre-wrap">
                {copyableFullBundle.slice(0, copyableFullBundle.indexOf('3. READY-TO-USE JAVASCRIPT'))}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer with Cancel & Minimize */}
        <div className="p-4 bg-slate-900/90 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <i className="fa-solid fa-shield-halved text-emerald-400"></i>
            <span>CORS Enabled & Direct Database Sync Configured</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* CANCEL / DISMISS BUTTON */}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Cancel / Close
            </button>

            {/* MINIMIZE BUTTON */}
            <button
              onClick={() => setIsMinimized(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-window-minimize text-[10px]"></i>
              <span>Minimize</span>
            </button>

            {/* COPY ALL BUTTON */}
            <button
              onClick={() => copyToClipboard(copyableFullBundle)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <i className={`fa-solid ${copiedAll ? 'fa-check' : 'fa-copy'}`}></i>
              <span>{copiedAll ? 'Copied!' : 'Copy Docs'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
