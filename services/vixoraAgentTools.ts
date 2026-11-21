import { Type } from "@google/genai";

export interface CodingProgressData {
  step: number;
  totalSteps: number;
  stepName: string;
  detail: string;
  percent: number;
  isComplete: boolean;
  mode?: 'build' | 'modify' | 'self-heal' | 'repo' | 'vercel';
}

export interface CodingResultData {
  kind: 'build' | 'modify' | 'self-heal' | 'repos' | 'sync' | 'vercel';
  title: string;
  summary: string;
  fullName?: string;
  repoUrl?: string;
  branch?: string;
  commitSha?: string;
  commitUrl?: string;
  pagesUrl?: string;
  liveUrl?: string;
  deploymentUrl?: string;
  inspectorUrl?: string;
  deploymentId?: string;
  readyState?: string;
  vercelProjects?: Array<{
    id: string;
    name: string;
    framework?: string | null;
    latestUrl?: string;
    readyState?: string;
    updatedAt?: number;
  }>;
  files?: Array<{ path: string; content: string; reason?: string }>;
  previewHtml?: string;
  repos?: Array<{
    name: string;
    full_name: string;
    private: boolean;
    description: string;
    html_url: string;
    language: string;
    default_branch: string;
    is_vixora_repo?: boolean;
  }>;
  diagnostics?: {
    ok: boolean;
    errors: string[];
    rawOutput: string;
    checkedAt: string;
  };
  applied?: boolean;
  rolledBack?: boolean;
  diagnosis?: string;
}

export interface VixoraAppContext {
  setActiveTab: (tab: string) => void;
  handleAutopilotVideoGeneration: (topic: string, ratio?: 'vertical' | 'horizontal' | 'square', duration?: string, webSearch?: boolean) => void;
  setSelectedVoice: (voice: string) => void;
  setVideoRatio: (ratio: 'vertical' | 'horizontal' | 'square') => void;
  setTargetVideoDuration: (dur: string) => void;
  saveCustomLearnedSkill: (name: string, desc: string, pref?: string, cat?: 'format' | 'voice' | 'style' | 'custom') => void;
  setGeneratedScript: (script: string) => void;
  setScriptTopic: (topic: string) => void;
  setVideoScriptInput: (script: string) => void;
  handleSourceVideos?: (script: string, duration?: string) => Promise<any> | void;
  setGlobalMusicVolume?: (vol: number) => void;
  setGlobalExtractedMood?: (mood: string) => void;
  setCaptionTemplate?: (tpl: string) => void;
  handleDirectVideo?: (style?: any) => Promise<void>;
  addCreatedAsset?: (asset: { id: string; title: string; imageUrl: string; date: string; type: 'flyer' | 'video' }) => void;
  createAutomatedVideoWithAgent?: (options: {
    topic: string;
    aspectRatio?: 'vertical' | 'horizontal' | 'square';
    duration?: string;
    useWebSearchTrends?: boolean;
    onProgress?: (progress: {
      step: number;
      totalSteps: number;
      stepName: string;
      detail: string;
      percent: number;
      isComplete: boolean;
    }) => void;
  }) => Promise<{
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
  }>;
  loadVideoIntoSequencer?: (videoData: any) => void;
  onCodingProgress?: (progress: CodingProgressData) => void;
  userFullName?: string;
  currentScriptText?: string;
  currentTopic?: string;
}

export interface VixoraToolResult {
  success: boolean;
  message: string;
  executedActionName: string;
  data?: any;
}

export interface VixoraToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: Type;
    properties: Record<string, {
      type: Type;
      description: string;
      enum?: string[];
    }>;
    required?: string[];
  };
  execute: (args: any, ctx: VixoraAppContext) => Promise<VixoraToolResult>;
}

// Helper to generate a crisp promotional flyer using HTML5 Canvas
const createPromotionalFlyerCanvas = (headline: string, subheadline?: string, themeColor?: string, niche?: string): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350; // Instagram Portrait / Flyer ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
  if (themeColor === 'gold' || themeColor === 'amber') {
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.5, '#31103f');
    grad.addColorStop(1, '#f59e0b');
  } else if (themeColor === 'green' || themeColor === 'emerald') {
    grad.addColorStop(0, '#022c22');
    grad.addColorStop(0.5, '#064e3b');
    grad.addColorStop(1, '#10b981');
  } else if (themeColor === 'purple' || themeColor === 'cyber') {
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.5, '#4c1d95');
    grad.addColorStop(1, '#ec4899');
  } else { // Default Vixora Orange / Dark Navy
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.6, '#1e1b4b');
    grad.addColorStop(1, '#f97316');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1350);

  // Decorative Accent Shapes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.beginPath();
  ctx.arc(900, 200, 350, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(100, 1150, 400, 0, Math.PI * 2);
  ctx.fill();

  // Top Badge Header
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.roundRect(80, 90, 320, 50, 25);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px sans-serif';
  ctx.fillText('⚡ VIXORA AI STUDIO', 110, 123);

  // Niche / Category Pill
  if (niche) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.roundRect(420, 90, 280, 50, 25);
    ctx.fill();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 20px sans-serif';
    ctx.fillText(niche.toUpperCase(), 445, 122);
  }

  // Main Headline Text Wrapping
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 68px sans-serif';
  const words = headline.split(' ');
  let line = '';
  let y = 380;
  const maxWidth = 920;
  const lineHeight = 82;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), 80, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), 80, y);

  // Subheadline
  if (subheadline) {
    y += 40;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 36px sans-serif';
    const subWords = subheadline.split(' ');
    let subLine = '';
    for (let s = 0; s < subWords.length; s++) {
      const testSub = subLine + subWords[s] + ' ';
      if (ctx.measureText(testSub).width > maxWidth && s > 0) {
        ctx.fillText(subLine.trim(), 80, y);
        subLine = subWords[s] + ' ';
        y += 50;
      } else {
        subLine = testSub;
      }
    }
    ctx.fillText(subLine.trim(), 80, y);
  }

  // Center Feature Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
  ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(80, y + 60, 920, 280, 32);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 32px sans-serif';
  ctx.fillText('🎬 CREATED WITH VIXORA AI AUTOPILOT', 120, y + 140);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 26px sans-serif';
  ctx.fillText('• 100% Auto Scripting & HD Stock Video Sync', 120, y + 195);
  ctx.fillText('• CapCut Subtitle Styling & Neural Speech', 120, y + 240);

  // Footer Branding
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 24px sans-serif';
  ctx.fillText('VIXORA STUDIO • AUTOMATED VIDEO ENGINE 2026', 80, 1260);

  return canvas.toDataURL('image/png');
};

/**
 * EXTENSIBLE AGENT TOOLS REGISTRY
 * Each tool is documented with name, description, required parameters schema, and executable action handler.
 */
export const VIXORA_AGENT_TOOLS: VixoraToolDefinition[] = [
  {
    name: 'configureAndCreateAutopilotVideo',
    description: 'Generates and cooks a complete video automatically on autopilot with explicit user settings for topic, aspect ratio, duration, and search web trends.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        topic: { type: Type.STRING, description: 'The subject, title, or concept for the video.' },
        aspectRatio: { type: Type.STRING, enum: ['vertical', 'horizontal', 'square'], description: 'Video frame ratio: "vertical" (9:16 Shorts/TikTok), "horizontal" (16:9 YouTube), "square" (1:1 Instagram).' },
        duration: { type: Type.STRING, description: 'Target video length e.g. "15s", "30s", "60s", or "2min".' },
        useWebSearchTrends: { type: Type.BOOLEAN, description: 'Whether to search live Google web trends for fresh breaking facts.' }
      },
      required: ['topic']
    },
    execute: async (args, ctx) => {
      const topic = args.topic;
      const ratio = args.aspectRatio || 'vertical';
      const duration = args.duration || '30s';
      const searchWeb = args.useWebSearchTrends !== undefined ? args.useWebSearchTrends : true;

      if (ctx.createAutomatedVideoWithAgent) {
        const videoResult = await ctx.createAutomatedVideoWithAgent({
          topic,
          aspectRatio: ratio,
          duration,
          useWebSearchTrends: searchWeb
        });
        return {
          success: true,
          executedActionName: 'configureAndCreateAutopilotVideo',
          message: `Oya! Successfully created video "${topic}" (${ratio}, ${duration}) with complete viral script, voiceover narration, and HD stock scenes.`,
          data: { videoResult }
        };
      }

      ctx.setActiveTab('autopilot');
      ctx.handleAutopilotVideoGeneration(topic, ratio, duration, searchWeb);

      return {
        success: true,
        executedActionName: 'configureAndCreateAutopilotVideo',
        message: `Triggered Autopilot Video Creation for "${topic}" (${ratio} ratio, ${duration} length, Web Trends: ${searchWeb ? 'ON' : 'OFF'}). Navigated to Autopilot Studio.`
      };
    }
  },
  {
    name: 'navigateToTab',
    description: 'Switches or navigates to a specific screen/tab inside Vixora AI Studio app (e.g. profile, settings, api keys, studio, autopilot, videos, scripts, voiceover, coach, tools, developer, contact).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        tab: { 
          type: Type.STRING, 
          description: 'The target tab name to open e.g. "profile", "studio", "autopilot", "videos", "scripts", "voiceover", "coach", "tools", "developer", "contact", "settings".' 
        }
      },
      required: ['tab']
    },
    execute: async (args, ctx) => {
      const raw = (args.tab || '').toLowerCase().trim();
      const tabMap: Record<string, string> = {
        'profile': 'profile',
        'account': 'profile',
        'settings': 'profile',
        'api keys': 'profile',
        'keys': 'profile',
        'api': 'profile',
        'autopilot': 'autopilot',
        'videos': 'videos',
        'video': 'videos',
        'creator': 'videos',
        'manual': 'videos',
        'studio': 'studio',
        'live': 'studio',
        'scripts': 'scripts',
        'script': 'scripts',
        'genius': 'scripts',
        'voiceover': 'voiceover',
        'voice overs': 'voiceover',
        'voice': 'voiceover',
        'tts': 'voiceover',
        'music': 'bgmusic',
        'bgmusic': 'bgmusic',
        'background music': 'bgmusic',
        'coach': 'scripts',
        'sister': 'scripts',
        'chat': 'chat',
        'tools': 'tools',
        'developer': 'developer',
        'contact': 'contact'
      };
      const mapped = tabMap[raw] || (raw in tabMap ? raw : 'profile');
      ctx.setActiveTab(mapped);

      return {
        success: true,
        executedActionName: 'navigateToTab',
        message: `Navigated to the ${mapped.toUpperCase()} page.`
      };
    }
  },
  {
    name: 'changeVoiceoverSettings',
    description: 'Changes the AI narrator voice model actor used for voiceovers in Vixora AI Studio.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        voiceName: { 
          type: Type.STRING, 
          description: 'The narrator voice name e.g. "Kore" (Vixora Signature Nigerian Voice), "Kore_Ngozi" / "Ngozi" (Lagos Vibrant Nigerian Female), "Kore_Chidinma" / "Chidinma" (Pro Nigerian English), "Aoede" (Warm Global Female), "Puck" (Viral High Energy Male), "Charon" (Deep Cinematic Male), "Fenrir" (Bold Tech Male), "Zephyr" (Smooth Studio Female).' 
        }
      },
      required: ['voiceName']
    },
    execute: async (args, ctx) => {
      ctx.setSelectedVoice(args.voiceName);
      return {
        success: true,
        executedActionName: 'changeVoiceoverSettings',
        message: `Switched AI voice narrator to "${args.voiceName}".`
      };
    }
  },
  {
    name: 'changeCaptionStyle',
    description: 'Changes the CapCut subtitle font style, color palette, or preset caption template for the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        templateId: { 
          type: Type.STRING, 
          enum: ['bold-yellow', 'toktok-neon', 'darkbox', 'cyber-future', 'karaoke-grad'],
          description: 'Caption template ID: "bold-yellow" (CapCut Classic), "toktok-neon" (TikTok Pop Green), "darkbox" (Minimal Dark), "cyber-future" (Cyberpunk Neon Pink), "karaoke-grad" (Karaoke Glow).' 
        }
      },
      required: ['templateId']
    },
    execute: async (args, ctx) => {
      if (ctx.setCaptionTemplate) {
        ctx.setCaptionTemplate(args.templateId);
      }
      return {
        success: true,
        executedActionName: 'changeCaptionStyle',
        message: `Updated video subtitle caption template to "${args.templateId}".`
      };
    }
  },
  {
    name: 'editVideoScript',
    description: 'Updates, rewrites, or sets the current video script or topic in the studio workspace.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        newScript: { type: Type.STRING, description: 'The updated full script text.' },
        topic: { type: Type.STRING, description: 'The video topic or headline.' }
      }
    },
    execute: async (args, ctx) => {
      if (args.newScript) {
        ctx.setGeneratedScript(args.newScript);
        ctx.setVideoScriptInput(args.newScript);
      }
      if (args.topic) {
        ctx.setScriptTopic(args.topic);
      }
      return {
        success: true,
        executedActionName: 'editVideoScript',
        message: 'Updated script and topic in video workspace.'
      };
    }
  },
  {
    name: 'generateFlyerImage',
    description: 'Generates a branded promotional flyer graphic image for a channel, video announcement, or topic, and adds it to project assets.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: 'Main prominent headline text on the flyer.' },
        subheadline: { type: Type.STRING, description: 'Secondary descriptive text or call to action.' },
        themeColor: { type: Type.STRING, enum: ['orange', 'gold', 'green', 'purple'], description: 'Color palette accent for the flyer design.' },
        niche: { type: Type.STRING, description: 'Content category e.g. "Finance", "Motivation", "Tech".' }
      },
      required: ['headline']
    },
    execute: async (args, ctx) => {
      const dataUrl = createPromotionalFlyerCanvas(args.headline, args.subheadline, args.themeColor, args.niche);
      
      if (ctx.addCreatedAsset) {
        ctx.addCreatedAsset({
          id: `flyer_${Date.now()}`,
          title: args.headline,
          imageUrl: dataUrl,
          date: new Date().toLocaleDateString(),
          type: 'flyer'
        });
      }

      return {
        success: true,
        executedActionName: 'generateFlyerImage',
        data: { imageUrl: dataUrl, headline: args.headline },
        message: `Successfully generated promotional flyer graphic for "${args.headline}". Added to project assets gallery!`
      };
    }
  },
  {
    name: 'learnUserCustomSkill',
    description: 'Saves a new custom workflow rule, brand requirement, or formatting preference learned from the user into Vixora AI skill memory.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        skillName: { type: Type.STRING, description: 'Name of the rule or skill learned e.g. "Finance Shorts 15s"' },
        skillDescription: { type: Type.STRING, description: 'Detailed explanation of what the user wants.' },
        category: { type: Type.STRING, enum: ['format', 'voice', 'style', 'custom'], description: 'Category of the skill.' }
      },
      required: ['skillName', 'skillDescription']
    },
    execute: async (args, ctx) => {
      ctx.saveCustomLearnedSkill(args.skillName, args.skillDescription, undefined, args.category || 'custom');
      return {
        success: true,
        executedActionName: 'learnUserCustomSkill',
        message: `Saved custom rule "${args.skillName}" into Vixora AI skill memory.`
      };
    }
  },
  {
    name: 'setVideoPreferences',
    description: 'Updates global video creation settings like aspect ratio frame shape and target duration.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        aspectRatio: { type: Type.STRING, enum: ['vertical', 'horizontal', 'square'], description: 'Aspect ratio' },
        duration: { type: Type.STRING, description: 'Video duration e.g. "15s", "30s", "60s"' }
      }
    },
    execute: async (args, ctx) => {
      if (args.aspectRatio) ctx.setVideoRatio(args.aspectRatio);
      if (args.duration) ctx.setTargetVideoDuration(args.duration);
      return {
        success: true,
        executedActionName: 'setVideoPreferences',
        message: `Updated video layout preferences (Ratio: ${args.aspectRatio || 'unchanged'}, Duration: ${args.duration || 'unchanged'}).`
      };
    }
  },
  {
    name: 'changeMusicSettings',
    description: 'Adjusts background music track volume or extracted mood genre.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        volume: { type: Type.NUMBER, description: 'Volume level from 0.0 to 1.0 e.g. 0.15' },
        mood: { type: Type.STRING, description: 'Extracted mood e.g. "motivational", "chill", "epic", "cinematic"' }
      }
    },
    execute: async (args, ctx) => {
      if (args.volume !== undefined && ctx.setGlobalMusicVolume) {
        ctx.setGlobalMusicVolume(args.volume);
      }
      if (args.mood && ctx.setGlobalExtractedMood) {
        ctx.setGlobalExtractedMood(args.mood);
      }
      return {
        success: true,
        executedActionName: 'changeMusicSettings',
        message: 'Updated background music settings.'
      };
    }
  },
  {
    name: 'directVideoMotionGraphics',
    description: 'Runs or reconfigures Phase 4 AI Director to apply cinematic camera motion, 2D motion graphics, animated badges, lower-thirds, color grading, and dynamic transitions to the video.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        directorStyle: {
          type: Type.STRING,
          enum: ['viral_social', 'cinematic_motivational', 'commercial_brand', 'educational_explainer', 'narrative_story'],
          description: 'The directorial editing style: "viral_social", "cinematic_motivational", "commercial_brand", "educational_explainer", or "narrative_story".'
        }
      }
    },
    execute: async (args, ctx) => {
      if (ctx.handleDirectVideo) {
        await ctx.handleDirectVideo(args.directorStyle);
        return {
          success: true,
          executedActionName: 'directVideoMotionGraphics',
          message: `AI Director successfully applied "${args.directorStyle || 'viral_social'}" motion graphics, camera moves, and color grading to your footage!`
        };
      }
      return {
        success: false,
        executedActionName: 'directVideoMotionGraphics',
        message: 'AI Director is ready once video clips are sourced.'
      };
    }
  },
  {
    name: 'manageGitHubRepositories',
    description: 'Connects to the user\'s GitHub account to check connection status, list all repositories (including Vixora repos), inspect a repository\'s file tree, read a file, or create a new repository.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['status', 'list', 'tree', 'read_file', 'create'],
          description: 'Action to perform: "status", "list" (all repos), "tree" (inspect files in owner/repo), "read_file", or "create" (new repo).'
        },
        fullName: { type: Type.STRING, description: 'Repository full name like "owner/repo" (required for tree and read_file).' },
        filePath: { type: Type.STRING, description: 'File path inside repo for read_file e.g. "src/App.tsx".' },
        repoName: { type: Type.STRING, description: 'New repository name for "create" action.' },
        description: { type: Type.STRING, description: 'Repository description for "create".' },
        isPrivate: { type: Type.BOOLEAN, description: 'Whether the newly created repo should be private.' }
      },
      required: ['action']
    },
    execute: async (args, ctx) => {
      const action = args.action || 'list';
      ctx.onCodingProgress?.({
        step: 1,
        totalSteps: 3,
        stepName: 'Connecting to GitHub API',
        detail: `Executing GitHub repository action "${action}"...`,
        percent: 35,
        isComplete: false,
        mode: 'repo'
      });

      if (action === 'status') {
        const res = await fetch('/api/github/status');
        const data = await res.json();
        if (!data.connected) {
          return {
            success: false,
            executedActionName: 'manageGitHubRepositories',
            message: 'GitHub is not connected yet. Click the GitHub badge in the chat header to connect your Personal Access Token.'
          };
        }
        return {
          success: true,
          executedActionName: 'manageGitHubRepositories',
          message: `Connected to GitHub as @${data.user.login} (${data.user.public_repos} public, ${data.user.total_private_repos} private repos).`
        };
      }

      if (action === 'list') {
        const res = await fetch('/api/github/repos');
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'manageGitHubRepositories',
            message: data.error || 'Could not list GitHub repositories. Make sure GitHub is connected.'
          };
        }
        ctx.onCodingProgress?.({
          step: 3,
          totalSteps: 3,
          stepName: 'Repositories Loaded',
          detail: `Retrieved ${data.count} GitHub repositories.`,
          percent: 100,
          isComplete: true,
          mode: 'repo'
        });
        const codingResult: CodingResultData = {
          kind: 'repos',
          title: `GitHub Repositories (${data.count})`,
          summary: `Found ${data.count} repositories in your GitHub account.`,
          repos: data.repos
        };
        return {
          success: true,
          executedActionName: 'manageGitHubRepositories',
          message: `Listed ${data.count} GitHub repositories: ${(data.repos || []).slice(0, 6).map((r: any) => r.full_name).join(', ')}`,
          data: { codingResult }
        };
      }

      if (action === 'create') {
        const res = await fetch('/api/github/repos/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: args.repoName || `vixora-project-${Date.now().toString().slice(-4)}`,
            description: args.description,
            isPrivate: args.isPrivate
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return { success: false, executedActionName: 'manageGitHubRepositories', message: data.error || 'Failed to create repository.' };
        }
        const codingResult: CodingResultData = {
          kind: 'repos',
          title: `Created ${data.repo.full_name}`,
          summary: `Repository ${data.repo.full_name} is ready on GitHub.`,
          fullName: data.repo.full_name,
          repoUrl: data.repo.html_url,
          branch: data.repo.default_branch,
          repos: [{ ...data.repo, language: 'New' }]
        };
        return {
          success: true,
          executedActionName: 'manageGitHubRepositories',
          message: `Created GitHub repository ${data.repo.full_name} (${data.repo.html_url}).`,
          data: { codingResult }
        };
      }

      if (action === 'tree' && args.fullName) {
        const res = await fetch(`/api/github/repos/tree?full_name=${encodeURIComponent(args.fullName)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return { success: false, executedActionName: 'manageGitHubRepositories', message: data.error || 'Failed to read repository tree.' };
        }
        const fileList = (data.files || []).slice(0, 50).map((f: any) => f.path).join('\n');
        return {
          success: true,
          executedActionName: 'manageGitHubRepositories',
          message: `Files in ${args.fullName} (${data.default_branch}):\n${fileList}`
        };
      }

      if (action === 'read_file' && args.fullName && args.filePath) {
        const res = await fetch(`/api/github/repos/file?full_name=${encodeURIComponent(args.fullName)}&path=${encodeURIComponent(args.filePath)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return { success: false, executedActionName: 'manageGitHubRepositories', message: data.error || 'Failed to read file.' };
        }
        const codingResult: CodingResultData = {
          kind: 'modify',
          title: `${args.fullName} — ${args.filePath}`,
          summary: `Inspected ${args.filePath} (${data.size} bytes).`,
          fullName: args.fullName,
          repoUrl: `https://github.com/${args.fullName}`,
          files: [{ path: data.path, content: data.content }]
        };
        return {
          success: true,
          executedActionName: 'manageGitHubRepositories',
          message: `Read ${args.filePath} from ${args.fullName}.`,
          data: { codingResult }
        };
      }

      return { success: false, executedActionName: 'manageGitHubRepositories', message: 'Missing required parameters for GitHub repository action.' };
    }
  },
  {
    name: 'buildWebsiteOrAppOnGitHub',
    description: 'Autonomously designs, codes, builds, and commits a complete responsive website or web application into a new or existing GitHub repository, with live interactive preview in chat.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        prompt: { type: Type.STRING, description: 'Detailed description of the website or web app to create.' },
        repoName: { type: Type.STRING, description: 'Desired new GitHub repository name (slug e.g. "acme-agency-site").' },
        existingRepoFullName: { type: Type.STRING, description: 'Optional existing "owner/repo" to push the built app into.' },
        appType: {
          type: Type.STRING,
          enum: ['website', 'webapp', 'landing', 'dashboard', 'portfolio', 'ecommerce'],
          description: 'Category of app or website to architect.'
        },
        isPrivate: { type: Type.BOOLEAN, description: 'Create as private repository if true (default false).' },
        deployPages: { type: Type.BOOLEAN, description: 'Enable GitHub Pages automatically if public (default true).' }
      },
      required: ['prompt']
    },
    execute: async (args, ctx) => {
      ctx.onCodingProgress?.({
        step: 1,
        totalSteps: 5,
        stepName: 'Analyzing Requirements & Repo Setup',
        detail: `Preparing GitHub repository and architecture plan for "${args.repoName || 'your app'}"...`,
        percent: 20,
        isComplete: false,
        mode: 'build'
      });

      const timer = setTimeout(() => {
        ctx.onCodingProgress?.({
          step: 3,
          totalSteps: 5,
          stepName: 'Writing Production Code & UI Components',
          detail: 'Synthesizing responsive HTML, modern CSS, interactive JS logic, and documentation...',
          percent: 62,
          isComplete: false,
          mode: 'build'
        });
      }, 2200);

      try {
        const res = await fetch('/api/github/build-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: args.prompt,
            repoName: args.repoName,
            existingRepoFullName: args.existingRepoFullName,
            appType: args.appType || 'webapp',
            isPrivate: args.isPrivate ?? false,
            deployPages: args.deployPages ?? true
          })
        });
        clearTimeout(timer);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'buildWebsiteOrAppOnGitHub',
            message: data.error || 'Failed to build website/app on GitHub.'
          };
        }

        ctx.onCodingProgress?.({
          step: 5,
          totalSteps: 5,
          stepName: 'Committed to GitHub & Preview Ready',
          detail: `Pushed ${data.result.files?.length || 0} files to ${data.result.fullName} (${data.result.branch}).`,
          percent: 100,
          isComplete: true,
          mode: 'build'
        });

        const r = data.result;
        const codingResult: CodingResultData = {
          kind: 'build',
          title: r.appTitle || r.fullName,
          summary: r.summary,
          fullName: r.fullName,
          repoUrl: r.repoUrl,
          branch: r.branch,
          commitSha: r.commitSha,
          commitUrl: r.commitUrl,
          pagesUrl: r.pagesUrl,
          files: r.files,
          previewHtml: r.previewHtml
        };

        return {
          success: true,
          executedActionName: 'buildWebsiteOrAppOnGitHub',
          message: `Built "${r.appTitle}" and committed ${r.files?.length || 0} files to GitHub repo ${r.fullName} (${r.repoUrl}).`,
          data: { codingResult }
        };
      } catch (err: any) {
        clearTimeout(timer);
        return {
          success: false,
          executedActionName: 'buildWebsiteOrAppOnGitHub',
          message: err?.message || 'Unexpected error while building app on GitHub.'
        };
      }
    }
  },
  {
    name: 'modifyGitHubRepository',
    description: 'Reads an existing GitHub repository (including Vixora repos or any user project), applies AI code modifications/bug fixes/new features, and commits the updated files directly to GitHub.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING, description: 'Target GitHub repository in "owner/repo" format.' },
        instruction: { type: Type.STRING, description: 'Exact changes, features, or fixes to implement in the repository.' },
        branch: { type: Type.STRING, description: 'Optional branch name (defaults to repo default branch).' },
        targetFilePaths: { type: Type.STRING, description: 'Optional comma-separated relative file paths to focus on.' }
      },
      required: ['fullName', 'instruction']
    },
    execute: async (args, ctx) => {
      ctx.onCodingProgress?.({
        step: 1,
        totalSteps: 4,
        stepName: 'Fetching Repository Codebase',
        detail: `Reading file tree and source files from ${args.fullName}...`,
        percent: 28,
        isComplete: false,
        mode: 'modify'
      });

      const timer = setTimeout(() => {
        ctx.onCodingProgress?.({
          step: 3,
          totalSteps: 4,
          stepName: 'Generating Code Modifications & Commit',
          detail: `Applying requested updates to ${args.fullName}...`,
          percent: 72,
          isComplete: false,
          mode: 'modify'
        });
      }, 2000);

      try {
        const targetFilePaths = typeof args.targetFilePaths === 'string' && args.targetFilePaths.trim()
          ? args.targetFilePaths.split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined;

        const res = await fetch('/api/github/modify-repo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: args.fullName,
            instruction: args.instruction,
            branch: args.branch,
            targetFilePaths
          })
        });
        clearTimeout(timer);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'modifyGitHubRepository',
            message: data.error || `Failed to modify ${args.fullName}.`
          };
        }

        ctx.onCodingProgress?.({
          step: 4,
          totalSteps: 4,
          stepName: 'Committed Updates to GitHub',
          detail: `Updated ${data.result.files?.length || 0} files on ${data.result.fullName}.`,
          percent: 100,
          isComplete: true,
          mode: 'modify'
        });

        const r = data.result;
        const codingResult: CodingResultData = {
          kind: 'modify',
          title: `Updated ${r.fullName}`,
          summary: r.summary,
          fullName: r.fullName,
          repoUrl: r.repoUrl,
          branch: r.branch,
          commitSha: r.commitSha,
          commitUrl: r.commitUrl,
          files: r.files,
          previewHtml: r.previewHtml
        };

        return {
          success: true,
          executedActionName: 'modifyGitHubRepository',
          message: `Successfully modified ${r.fullName} (${r.files?.length || 0} files updated, commit ${String(r.commitSha || '').slice(0, 7)}).`,
          data: { codingResult }
        };
      } catch (err: any) {
        clearTimeout(timer);
        return {
          success: false,
          executedActionName: 'modifyGitHubRepository',
          message: err?.message || 'Unexpected error modifying GitHub repository.'
        };
      }
    }
  },
  {
    name: 'selfDiagnoseAndUpdateVixora',
    description: 'Runs self-diagnostics (TypeScript compiler check & workspace scan) on Vixora itself, automatically repairs bugs or applies requested self-updates to Vixora source files with automatic rollback protection, and optionally pushes the verified Vixora codebase to GitHub.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        issueDescription: { type: Type.STRING, description: 'Description of the bug/problem to fix or self-update improvement to apply to Vixora.' },
        targetFiles: { type: Type.STRING, description: 'Optional comma-separated file paths inside Vixora workspace to inspect.' },
        autoApply: { type: Type.BOOLEAN, description: 'Whether to apply and verify the fix automatically (default true).' },
        pushToGitHubRepo: { type: Type.STRING, description: 'Optional "owner/repo" (e.g. a Vixora GitHub repo) to push verified updates to.' },
        syncFullWorkspace: { type: Type.BOOLEAN, description: 'If true, pushes the complete Vixora codebase cleanly to pushToGitHubRepo or a new vixora-studio repo.' }
      }
    },
    execute: async (args, ctx) => {
      if (args.syncFullWorkspace) {
        ctx.onCodingProgress?.({
          step: 2,
          totalSteps: 4,
          stepName: 'Packaging Vixora Workspace Source',
          detail: 'Collecting clean Vixora files (excluding secrets & build artifacts) and syncing to GitHub...',
          percent: 55,
          isComplete: false,
          mode: 'self-heal'
        });
        const syncRes = await fetch('/api/github/sync-vixora', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: args.pushToGitHubRepo,
            commitMessage: args.issueDescription || 'chore: sync Vixora AI Studio codebase'
          })
        });
        const syncData = await syncRes.json();
        if (!syncRes.ok || !syncData.ok) {
          return {
            success: false,
            executedActionName: 'selfDiagnoseAndUpdateVixora',
            message: syncData.error || 'Failed to sync Vixora codebase to GitHub.'
          };
        }
        const r = syncData.result;
        const codingResult: CodingResultData = {
          kind: 'sync',
          title: `Synced Vixora → ${r.fullName}`,
          summary: r.summary,
          fullName: r.fullName,
          repoUrl: r.repoUrl,
          branch: r.branch,
          commitSha: r.commitSha,
          commitUrl: r.commitUrl,
          files: r.files
        };
        return {
          success: true,
          executedActionName: 'selfDiagnoseAndUpdateVixora',
          message: `Synced Vixora codebase to GitHub repository ${r.fullName} (${r.repoUrl}).`,
          data: { codingResult }
        };
      }

      ctx.onCodingProgress?.({
        step: 1,
        totalSteps: 4,
        stepName: 'Running Vixora Self-Diagnostics',
        detail: 'Scanning workspace files and running TypeScript compiler verification...',
        percent: 25,
        isComplete: false,
        mode: 'self-heal'
      });

      const timer = setTimeout(() => {
        ctx.onCodingProgress?.({
          step: 3,
          totalSteps: 4,
          stepName: 'Synthesizing & Verifying Self-Update',
          detail: 'Generating safe patches, verifying compilation, and checking rollback guardrails...',
          percent: 70,
          isComplete: false,
          mode: 'self-heal'
        });
      }, 2200);

      try {
        const targetFiles = typeof args.targetFiles === 'string' && args.targetFiles.trim()
          ? args.targetFiles.split(',').map((s: string) => s.trim()).filter(Boolean)
          : undefined;

        const res = await fetch('/api/coder/self-heal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            issueDescription: args.issueDescription,
            targetFiles,
            autoApply: args.autoApply !== undefined ? args.autoApply : true,
            pushToGitHubRepo: args.pushToGitHubRepo
          })
        });
        clearTimeout(timer);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'selfDiagnoseAndUpdateVixora',
            message: data.error || 'Self-diagnosis failed.'
          };
        }

        const r = data.result;
        ctx.onCodingProgress?.({
          step: 4,
          totalSteps: 4,
          stepName: r.applied ? 'Self-Update Verified & Applied' : 'Self-Diagnostic Complete',
          detail: r.summary,
          percent: 100,
          isComplete: true,
          mode: 'self-heal'
        });

        const codingResult: CodingResultData = {
          kind: 'self-heal',
          title: r.applied ? 'Vixora Self-Update Applied' : r.rolledBack ? 'Patch Rolled Back Safely' : 'Vixora Diagnostics Report',
          summary: r.summary,
          diagnosis: r.diagnosis,
          diagnostics: r.diagnosticsAfter || r.diagnosticsBefore,
          applied: r.applied,
          rolledBack: r.rolledBack,
          files: r.files,
          fullName: r.repoSync?.full_name,
          repoUrl: r.repoSync?.repoUrl,
          commitSha: r.repoSync?.commitSha,
          commitUrl: r.repoSync?.commitUrl
        };

        return {
          success: true,
          executedActionName: 'selfDiagnoseAndUpdateVixora',
          message: r.summary,
          data: { codingResult }
        };
      } catch (err: any) {
        clearTimeout(timer);
        return {
          success: false,
          executedActionName: 'selfDiagnoseAndUpdateVixora',
          message: err?.message || 'Unexpected error during Vixora self-diagnosis.'
        };
      }
    }
  },
  {
    name: 'deployToVercel',
    description: 'Deploys websites and web applications live to Vercel using the server-side VERCEL_TOKEN secret. Can: (1) check Vercel connection status, (2) list Vercel projects, (3) build a brand-new website/app from a prompt and deploy it straight to Vercel (with optional GitHub repo push), (4) deploy an existing GitHub repository to Vercel, (5) deploy Vixora Studio workspace to Vercel, or (6) check deployment status.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        action: {
          type: Type.STRING,
          enum: ['status', 'list_projects', 'build_and_deploy', 'deploy_github_repo', 'deploy_vixora', 'check_deployment'],
          description: 'Vercel action: "status", "list_projects", "build_and_deploy" (build app from prompt & deploy), "deploy_github_repo", "deploy_vixora", or "check_deployment".'
        },
        prompt: { type: Type.STRING, description: 'Website/app prompt when action is "build_and_deploy".' },
        projectName: { type: Type.STRING, description: 'Vercel project slug name (lowercase letters, digits, hyphens).' },
        appType: {
          type: Type.STRING,
          enum: ['website', 'webapp', 'landing', 'dashboard', 'portfolio', 'ecommerce'],
          description: 'Category of website/app for "build_and_deploy".'
        },
        fullName: { type: Type.STRING, description: 'GitHub repository "owner/repo" when action is "deploy_github_repo".' },
        branch: { type: Type.STRING, description: 'Optional GitHub branch when deploying a GitHub repo.' },
        deploymentId: { type: Type.STRING, description: 'Vercel deployment ID (dpl_...) for "check_deployment".' },
        alsoPushToGitHub: { type: Type.BOOLEAN, description: 'If true during build_and_deploy, also creates/commits a GitHub repository.' },
        target: { type: Type.STRING, enum: ['production', 'preview'], description: 'Deployment target environment (default production).' }
      },
      required: ['action']
    },
    execute: async (args, ctx) => {
      const action = args.action || 'build_and_deploy';

      if (action === 'status') {
        const res = await fetch('/api/vercel/status');
        const data = await res.json();
        if (!data.connected) {
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: data.error || 'Vercel secret token (VERCEL_TOKEN) is not configured in server secrets yet.'
          };
        }
        return {
          success: true,
          executedActionName: 'deployToVercel',
          message: `Vercel is connected as ${data.user?.name || data.user?.username} (@${data.user?.username}) via server secret.`
        };
      }

      if (action === 'list_projects') {
        ctx.onCodingProgress?.({
          step: 1,
          totalSteps: 2,
          stepName: 'Fetching Vercel Projects',
          detail: 'Reading deployed Vercel projects from your account...',
          percent: 45,
          isComplete: false,
          mode: 'vercel'
        });
        const res = await fetch('/api/vercel/projects');
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: data.error || 'Failed to fetch Vercel projects.'
          };
        }
        ctx.onCodingProgress?.({
          step: 2,
          totalSteps: 2,
          stepName: 'Vercel Projects Loaded',
          detail: `Found ${data.count} Vercel projects.`,
          percent: 100,
          isComplete: true,
          mode: 'vercel'
        });
        const codingResult: CodingResultData = {
          kind: 'vercel',
          title: `Vercel Projects (${data.count})`,
          summary: `Retrieved ${data.count} projects from your Vercel account.`,
          vercelProjects: data.projects
        };
        return {
          success: true,
          executedActionName: 'deployToVercel',
          message: `Listed ${data.count} Vercel projects: ${(data.projects || []).slice(0, 6).map((p: any) => p.name).join(', ')}`,
          data: { codingResult }
        };
      }

      if (action === 'check_deployment' && args.deploymentId) {
        const res = await fetch(`/api/vercel/deployment/${encodeURIComponent(args.deploymentId)}`);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: data.error || 'Failed to check Vercel deployment.'
          };
        }
        const d = data.deployment;
        const codingResult: CodingResultData = {
          kind: 'vercel',
          title: `Vercel: ${d.projectName}`,
          summary: `Deployment ${d.deploymentId} state is ${d.readyState}.`,
          liveUrl: d.liveUrl,
          deploymentUrl: d.deploymentUrl,
          inspectorUrl: d.inspectorUrl,
          deploymentId: d.deploymentId,
          readyState: d.readyState
        };
        return {
          success: true,
          executedActionName: 'deployToVercel',
          message: `Vercel deployment ${d.projectName} is ${d.readyState}${d.liveUrl ? ` at ${d.liveUrl}` : ''}.`,
          data: { codingResult }
        };
      }

      if (action === 'deploy_github_repo') {
        if (!args.fullName) {
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: 'Please provide the GitHub repository in "owner/repo" format to deploy to Vercel.'
          };
        }
        ctx.onCodingProgress?.({
          step: 1,
          totalSteps: 4,
          stepName: 'Pulling GitHub Repository Files',
          detail: `Reading source tree from ${args.fullName} for Vercel deployment...`,
          percent: 25,
          isComplete: false,
          mode: 'vercel'
        });
        const timer = setTimeout(() => {
          ctx.onCodingProgress?.({
            step: 3,
            totalSteps: 4,
            stepName: 'Uploading & Building on Vercel',
            detail: `Deploying ${args.fullName} to Vercel production edge network...`,
            percent: 72,
            isComplete: false,
            mode: 'vercel'
          });
        }, 2000);
        try {
          const res = await fetch('/api/vercel/deploy-repo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fullName: args.fullName,
              projectName: args.projectName,
              branch: args.branch,
              target: args.target || 'production'
            })
          });
          clearTimeout(timer);
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return {
              success: false,
              executedActionName: 'deployToVercel',
              message: data.error || `Failed to deploy ${args.fullName} to Vercel.`
            };
          }
          const r = data.result;
          ctx.onCodingProgress?.({
            step: 4,
            totalSteps: 4,
            stepName: `Vercel ${r.readyState}`,
            detail: r.liveUrl ? `Live URL: ${r.liveUrl}` : `Deployment ID: ${r.deploymentId}`,
            percent: 100,
            isComplete: true,
            mode: 'vercel'
          });
          const codingResult: CodingResultData = {
            kind: 'vercel',
            title: r.appTitle || `${args.fullName} on Vercel`,
            summary: r.summary,
            fullName: r.fullName,
            repoUrl: r.repoUrl,
            branch: r.branch,
            liveUrl: r.liveUrl,
            deploymentUrl: r.deploymentUrl,
            inspectorUrl: r.inspectorUrl,
            deploymentId: r.deploymentId,
            readyState: r.readyState
          };
          return {
            success: true,
            executedActionName: 'deployToVercel',
            message: `Deployed ${args.fullName} to Vercel (${r.readyState})${r.liveUrl ? ` — Live URL: ${r.liveUrl}` : ''}.`,
            data: { codingResult }
          };
        } catch (err: any) {
          clearTimeout(timer);
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: err?.message || 'Unexpected error deploying GitHub repo to Vercel.'
          };
        }
      }

      if (action === 'deploy_vixora') {
        ctx.onCodingProgress?.({
          step: 1,
          totalSteps: 3,
          stepName: 'Packaging Vixora Studio for Vercel',
          detail: 'Collecting clean Vixora workspace source files (excluding secrets)...',
          percent: 35,
          isComplete: false,
          mode: 'vercel'
        });
        try {
          const res = await fetch('/api/vercel/deploy-vixora', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectName: args.projectName || 'vixora-studio',
              target: args.target || 'production'
            })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return {
              success: false,
              executedActionName: 'deployToVercel',
              message: data.error || 'Failed to deploy Vixora Studio to Vercel.'
            };
          }
          const r = data.result;
          ctx.onCodingProgress?.({
            step: 3,
            totalSteps: 3,
            stepName: `Vercel ${r.readyState}`,
            detail: r.liveUrl ? `Live URL: ${r.liveUrl}` : `Deployment ID: ${r.deploymentId}`,
            percent: 100,
            isComplete: true,
            mode: 'vercel'
          });
          const codingResult: CodingResultData = {
            kind: 'vercel',
            title: r.appTitle || 'Vixora Studio on Vercel',
            summary: r.summary,
            liveUrl: r.liveUrl,
            deploymentUrl: r.deploymentUrl,
            inspectorUrl: r.inspectorUrl,
            deploymentId: r.deploymentId,
            readyState: r.readyState
          };
          return {
            success: true,
            executedActionName: 'deployToVercel',
            message: `Deployed Vixora Studio to Vercel (${r.readyState})${r.liveUrl ? ` — Live URL: ${r.liveUrl}` : ''}.`,
            data: { codingResult }
          };
        } catch (err: any) {
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: err?.message || 'Unexpected error deploying Vixora Studio to Vercel.'
          };
        }
      }

      // Default: build_and_deploy
      if (!args.prompt) {
        return {
          success: false,
          executedActionName: 'deployToVercel',
          message: 'Please describe the website or web app you want me to build and deploy on Vercel.'
        };
      }

      ctx.onCodingProgress?.({
        step: 1,
        totalSteps: 4,
        stepName: 'Architecting Website & Vercel Bundle',
        detail: `Designing responsive UI and production files for "${args.projectName || 'your site'}"...`,
        percent: 25,
        isComplete: false,
        mode: 'vercel'
      });

      const timer = setTimeout(() => {
        ctx.onCodingProgress?.({
          step: 3,
          totalSteps: 4,
          stepName: 'Deploying to Vercel Edge Network',
          detail: 'Uploading production bundle to Vercel and waiting for live URL...',
          percent: 75,
          isComplete: false,
          mode: 'vercel'
        });
      }, 2400);

      try {
        const res = await fetch('/api/vercel/deploy-app', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: args.prompt,
            projectName: args.projectName,
            appType: args.appType || 'website',
            target: args.target || 'production',
            alsoPushToGitHub: args.alsoPushToGitHub ?? false
          })
        });
        clearTimeout(timer);
        const data = await res.json();
        if (!res.ok || !data.ok) {
          return {
            success: false,
            executedActionName: 'deployToVercel',
            message: data.error || 'Failed to build and deploy website to Vercel.'
          };
        }

        const r = data.result;
        ctx.onCodingProgress?.({
          step: 4,
          totalSteps: 4,
          stepName: `Deployed (${r.readyState})`,
          detail: r.liveUrl ? `Live on Vercel: ${r.liveUrl}` : `Deployment ID: ${r.deploymentId}`,
          percent: 100,
          isComplete: true,
          mode: 'vercel'
        });

        const codingResult: CodingResultData = {
          kind: 'vercel',
          title: r.appTitle || r.projectName,
          summary: r.summary,
          fullName: r.github?.fullName,
          repoUrl: r.github?.repoUrl,
          commitSha: r.github?.commitSha,
          commitUrl: r.github?.commitUrl,
          liveUrl: r.liveUrl,
          deploymentUrl: r.deploymentUrl,
          inspectorUrl: r.inspectorUrl,
          deploymentId: r.deploymentId,
          readyState: r.readyState,
          files: r.files,
          previewHtml: r.previewHtml
        };

        return {
          success: true,
          executedActionName: 'deployToVercel',
          message: `Built "${r.appTitle}" and deployed to Vercel (${r.readyState})${r.liveUrl ? ` — Live URL: ${r.liveUrl}` : ''}.`,
          data: { codingResult }
        };
      } catch (err: any) {
        clearTimeout(timer);
        return {
          success: false,
          executedActionName: 'deployToVercel',
          message: err?.message || 'Unexpected error during Vercel deployment.'
        };
      }
    }
  }
];
