// Vixora AI Director — Intelligent Video Editing & Motion Graphics Engine
// Analyzes scripts, narration, and stock B-roll to orchestrate camera movements,
// trimming, pacing, 2D motion graphics overlays, and cinematic transitions.

import { GoogleGenAI, Type } from "@google/genai";
import { SourcedVideo } from '../components/VideoSequencer';

export type DirectorStyle = 
  | 'viral_social' 
  | 'cinematic_motivational' 
  | 'clean_commercial' 
  | 'educational_explainer' 
  | 'narrative_storytelling';

export type CameraMotionType = 
  | 'zoom_in_slow' 
  | 'zoom_out_reveal' 
  | 'punch_in_beat' 
  | 'pan_left' 
  | 'pan_right' 
  | 'camera_shake' 
  | 'static_focus';

export type TransitionType = 
  | 'flash_zoom' 
  | 'whip_pan' 
  | 'crossfade' 
  | 'glitch_cut' 
  | 'light_leak' 
  | 'hard_cut';

export type ColorGradePreset = 
  | 'cinematic_teal_orange' 
  | 'warm_gold_luxury' 
  | 'cyber_neon' 
  | 'vibrant_viral' 
  | 'clean_commercial' 
  | 'noir_dramatic' 
  | 'papercut_warm' 
  | 'natural_raw';

export interface MotionGraphicsLayer {
  id: string;
  type: 'lower_third' | 'kinetic_badge' | 'stat_counter' | 'animated_icon' | 'papercut_frame' | 'progress_bar' | 'callout_card';
  title: string;
  subtitle?: string;
  metricValue?: string;
  icon?: string;
  accentColor: string;
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center' | 'top_bar' | 'bottom_bar';
  enterTime: number; // relative to scene (seconds)
  exitTime: number;  // relative to scene (seconds)
  animation: 'slide_up' | 'pop_in' | 'fade_scale' | 'bounce' | 'stamp';
}

export interface EditedSceneInstruction {
  sceneIndex: number;
  sourceClipId: string | number;
  clipTitle: string;
  sourceClipUrl: string;
  sourceThumbnail: string;
  mediaType: 'video' | 'photo';
  scriptExcerpt: string;
  startTime: number;
  endTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  speed: number;
  cameraMotion: CameraMotionType;
  colorGrade: ColorGradePreset;
  transitionIn: TransitionType;
  transitionOut: TransitionType;
  motionGraphics: MotionGraphicsLayer[];
  directorNotes: string;
}

export interface DirectorPlan {
  videoTitle: string;
  detectedStyle: DirectorStyle;
  targetAudience: string;
  coreEmotion: string;
  pacingRhythm: 'fast_viral' | 'cinematic_steady' | 'dynamic_rhythmic';
  colorGrade: ColorGradePreset;
  enableMotionGraphics: boolean;
  enableCameraMotion: boolean;
  enableColorGrade: boolean;
  enableTransitions: boolean;
  scenes: EditedSceneInstruction[];
  overallDirectorRationale: string;
  generatedAt: string;
}

export const DIRECTOR_STYLE_DEFINITIONS: Record<DirectorStyle, {
  label: string;
  icon: string;
  badge: string;
  description: string;
  defaultColorGrade: ColorGradePreset;
  accentGradient: string;
}> = {
  viral_social: {
    label: 'Viral Social Media',
    icon: 'fa-bolt',
    badge: 'TIKTOK & REELS',
    description: 'Rapid scroll-stopping punch-ins, kinetic badge stamps, energetic camera pans, and vibrant neon grading.',
    defaultColorGrade: 'vibrant_viral',
    accentGradient: 'from-rose-500 to-orange-500'
  },
  cinematic_motivational: {
    label: 'Cinematic & Motivational',
    icon: 'fa-film',
    badge: 'HOLLYWOOD GRADING',
    description: 'Dramatic slow zooms, warm golden luxury lighting, powerful topic callouts, and emotional pacing.',
    defaultColorGrade: 'warm_gold_luxury',
    accentGradient: 'from-amber-500 to-yellow-600'
  },
  clean_commercial: {
    label: 'Commercial & Brand',
    icon: 'fa-briefcase',
    badge: 'STUDIO POLISH',
    description: 'Polished Apple/Stripe-tier minimal lower thirds, steady corporate pans, high-contrast clarity, and progress indicators.',
    defaultColorGrade: 'clean_commercial',
    accentGradient: 'from-blue-500 to-indigo-600'
  },
  educational_explainer: {
    label: 'Educational & Explainer',
    icon: 'fa-graduation-cap',
    badge: 'INFO-GRAPHICS',
    description: 'Step-by-step vector badges, infographic metrics, diagram callouts, and clear analytical framing.',
    defaultColorGrade: 'cinematic_teal_orange',
    accentGradient: 'from-emerald-500 to-teal-600'
  },
  narrative_storytelling: {
    label: 'Narrative & Storytelling',
    icon: 'fa-book-open',
    badge: 'FILMIC COLLAGE',
    description: 'Subtle paper-cut textured borders, golden light streaks, crossfades, and deeply immersive narrative pacing.',
    defaultColorGrade: 'papercut_warm',
    accentGradient: 'from-purple-500 to-pink-600'
  }
};

export const COLOR_GRADE_PRESETS: Record<ColorGradePreset, {
  name: string;
  cssFilter: string;
  canvasOverlay?: { color: string; blendMode: GlobalCompositeOperation };
  description: string;
}> = {
  cinematic_teal_orange: {
    name: 'Teal & Orange',
    cssFilter: 'contrast(1.15) saturate(1.2) brightness(0.98)',
    canvasOverlay: { color: 'rgba(14, 116, 144, 0.12)', blendMode: 'overlay' },
    description: 'Hollywood blockbuster style with warm highlights and teal shadows.'
  },
  warm_gold_luxury: {
    name: 'Warm Gold & Wealth',
    cssFilter: 'contrast(1.12) saturate(1.18) sepia(0.12) brightness(1.02)',
    canvasOverlay: { color: 'rgba(245, 158, 11, 0.10)', blendMode: 'soft-light' },
    description: 'Luxurious amber warmth engineered for finance, real estate, and motivation.'
  },
  cyber_neon: {
    name: 'Cyberpunk Neon',
    cssFilter: 'contrast(1.25) saturate(1.35) hue-rotate(5deg) brightness(0.96)',
    canvasOverlay: { color: 'rgba(236, 72, 153, 0.10)', blendMode: 'color-dodge' },
    description: 'High-contrast futuristic neon tones for tech, crypto, and AI topics.'
  },
  vibrant_viral: {
    name: 'Vibrant Viral Pop',
    cssFilter: 'contrast(1.18) saturate(1.3) brightness(1.04)',
    canvasOverlay: { color: 'rgba(255, 102, 0, 0.08)', blendMode: 'screen' },
    description: 'Punchy vivid colors that maximize retention on mobile social feeds.'
  },
  clean_commercial: {
    name: 'Studio Commercial',
    cssFilter: 'contrast(1.08) saturate(1.08) brightness(1.0)',
    canvasOverlay: { color: 'rgba(255, 255, 255, 0.04)', blendMode: 'overlay' },
    description: 'Balanced, high-clarity commercial look suitable for products and businesses.'
  },
  noir_dramatic: {
    name: 'Dark Noir & Mystery',
    cssFilter: 'grayscale(0.85) contrast(1.35) brightness(0.92)',
    canvasOverlay: { color: 'rgba(15, 23, 42, 0.15)', blendMode: 'multiply' },
    description: 'High-contrast monochrome suspense for psychology, history, and crime stories.'
  },
  papercut_warm: {
    name: 'Paper-Cut Filmic',
    cssFilter: 'sepia(0.2) contrast(1.1) brightness(0.98)',
    canvasOverlay: { color: 'rgba(217, 119, 6, 0.08)', blendMode: 'multiply' },
    description: 'Earthy organic warmth reminiscent of classic editorial documentaries.'
  },
  natural_raw: {
    name: 'Natural / Raw Stock',
    cssFilter: 'none',
    description: 'Preserves the original camera colors and stock footage grading directly.'
  }
};

/**
 * Heuristic fallback plan generator when Gemini API is unavailable or offline.
 * Produces contextually tailored camera movements, motion graphics, and trims.
 */
export function generateHeuristicDirectorPlan(
  scriptText: string,
  sourcedClips: SourcedVideo[],
  totalDuration: number,
  preferredStyle?: DirectorStyle
): DirectorPlan {
  const cleanScript = scriptText.trim();
  const lowerScript = cleanScript.toLowerCase();

  // 1. Detect Directorial Style from Script Context
  let style: DirectorStyle = preferredStyle || 'viral_social';
  if (!preferredStyle) {
    if (lowerScript.includes('invest') || lowerScript.includes('business') || lowerScript.includes('revenue') || lowerScript.includes('profit') || lowerScript.includes('company')) {
      style = 'clean_commercial';
    } else if (lowerScript.includes('wealth') || lowerScript.includes('mindset') || lowerScript.includes('discipline') || lowerScript.includes('success') || lowerScript.includes('habit')) {
      style = 'cinematic_motivational';
    } else if (lowerScript.includes('step') || lowerScript.includes('how to') || lowerScript.includes('learn') || lowerScript.includes('guide') || lowerScript.includes('tutorial') || lowerScript.includes('system')) {
      style = 'educational_explainer';
    } else if (lowerScript.includes('ancient') || lowerScript.includes('history') || lowerScript.includes('story') || lowerScript.includes('myth') || lowerScript.includes('war')) {
      style = 'narrative_storytelling';
    } else {
      style = 'viral_social';
    }
  }

  const styleDef = DIRECTOR_STYLE_DEFINITIONS[style];
  const numScenes = Math.max(1, sourcedClips.length);
  const avgSceneDuration = totalDuration / numScenes;

  // Split script into sentence chunks for scene excerpts
  const sentences = cleanScript
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0);

  const cameraSequence: CameraMotionType[] = [
    'punch_in_beat',
    'zoom_in_slow',
    'pan_left',
    'zoom_out_reveal',
    'pan_right',
    'camera_shake',
    'static_focus'
  ];

  const transitionSequence: TransitionType[] = [
    style === 'viral_social' ? 'flash_zoom' : 'crossfade',
    style === 'viral_social' ? 'whip_pan' : 'light_leak',
    'crossfade',
    'flash_zoom',
    'whip_pan'
  ];

  const scenes: EditedSceneInstruction[] = sourcedClips.map((clip, idx) => {
    const startTime = idx * avgSceneDuration;
    const endTime = idx === numScenes - 1 ? totalDuration : (idx + 1) * avgSceneDuration;
    const duration = endTime - startTime;
    const sentence = sentences[idx % sentences.length] || cleanScript.slice(0, 40);

    // Camera motion tailored to scene role (Scene 0 is the hook)
    let cameraMotion: CameraMotionType = cameraSequence[idx % cameraSequence.length];
    if (idx === 0) {
      cameraMotion = style === 'viral_social' ? 'punch_in_beat' : 'zoom_in_slow';
    }

    // Motion Graphics Layers tailored to style & beat
    const motionGraphics: MotionGraphicsLayer[] = [];

    // Layer 1: Hook / Lower Third
    if (idx === 0) {
      motionGraphics.push({
        id: `mg_hook_${idx}`,
        type: 'kinetic_badge',
        title: style === 'viral_social' ? 'STOP SCROLLING ⚠️' : 'KEY INSIGHT 💡',
        subtitle: 'Watch Until The End',
        accentColor: '#f97316',
        position: 'top_left',
        enterTime: 0.1,
        exitTime: Math.min(3.0, duration),
        animation: 'pop_in'
      });
    } else if (idx === 1 && (style === 'educational_explainer' || style === 'clean_commercial')) {
      motionGraphics.push({
        id: `mg_stat_${idx}`,
        type: 'stat_counter',
        title: 'PROVEN SUCCESS RATE',
        metricValue: '94.8%',
        accentColor: '#10b981',
        position: 'top_right',
        enterTime: 0.3,
        exitTime: Math.min(3.5, duration),
        animation: 'slide_up'
      });
    } else if (idx === 2 && style === 'cinematic_motivational') {
      motionGraphics.push({
        id: `mg_badge_${idx}`,
        type: 'callout_card',
        title: 'THE GOLDEN RULE',
        subtitle: 'Discipline Beats Motivation',
        accentColor: '#f59e0b',
        position: 'bottom_left',
        enterTime: 0.2,
        exitTime: Math.min(3.8, duration),
        animation: 'fade_scale'
      });
    } else {
      motionGraphics.push({
        id: `mg_callout_${idx}`,
        type: 'lower_third',
        title: `BEAT ${idx + 1}: ${sentence.slice(0, 24).toUpperCase()}`,
        subtitle: 'Vixora Studio Master Cut',
        accentColor: '#ea580c',
        position: 'bottom_left',
        enterTime: 0.2,
        exitTime: Math.min(3.2, duration),
        animation: 'slide_up'
      });
    }

    // Add progress bar to top of screen
    motionGraphics.push({
      id: `mg_prog_${idx}`,
      type: 'progress_bar',
      title: 'Timeline Progress',
      accentColor: '#f97316',
      position: 'top_bar',
      enterTime: 0,
      exitTime: duration,
      animation: 'slide_up'
    });

    const trimStart = 0.5; // trim initial half-second of stock footage
    const trimEnd = trimStart + duration;

    return {
      sceneIndex: idx,
      sourceClipId: clip.id,
      clipTitle: clip.title || `Scene Clip #${idx + 1}`,
      sourceClipUrl: clip.video_files?.find(f => f.quality === 'hd')?.link || clip.video_files?.[0]?.link || clip.url,
      sourceThumbnail: clip.image,
      mediaType: clip.mediaType || 'video',
      scriptExcerpt: sentence,
      startTime: Number(startTime.toFixed(2)),
      endTime: Number(endTime.toFixed(2)),
      duration: Number(duration.toFixed(2)),
      trimStart: Number(trimStart.toFixed(2)),
      trimEnd: Number(trimEnd.toFixed(2)),
      speed: idx === 0 ? 1.08 : 1.0,
      cameraMotion,
      colorGrade: styleDef.defaultColorGrade,
      transitionIn: idx === 0 ? 'hard_cut' : transitionSequence[(idx - 1) % transitionSequence.length],
      transitionOut: transitionSequence[idx % transitionSequence.length],
      motionGraphics,
      directorNotes: `Directorial vision: Applied ${cameraMotion.replace(/_/g, ' ')} with ${styleDef.defaultColorGrade.replace(/_/g, ' ')} grade to maximize viewer retention.`
    };
  });

  return {
    videoTitle: cleanScript.slice(0, 36) || 'Untitled Video Creation',
    detectedStyle: style,
    targetAudience: style === 'clean_commercial' ? 'Business & Enterprise Leaders' : 'High-Retention Short-Form Audience (Reels / TikTok)',
    coreEmotion: style === 'cinematic_motivational' ? 'Deep Inspiration & Urgency' : 'High Energy & Curiosity',
    pacingRhythm: style === 'viral_social' ? 'fast_viral' : 'dynamic_rhythmic',
    colorGrade: styleDef.defaultColorGrade,
    enableMotionGraphics: true,
    enableCameraMotion: true,
    enableColorGrade: true,
    enableTransitions: true,
    scenes,
    overallDirectorRationale: `Engineered using ${styleDef.label} standards. Sequenced ${scenes.length} B-roll scenes with kinetic camera movements, color grading, and dynamic 2D vector lower thirds to achieve maximum retention.`,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Intelligent AI Director Engine: Calls Gemini 2.5 Flash with structured schema
 * to analyze script, voiceover duration, and stock footage, outputting an executive director plan.
 */
export async function analyzeAndDirectVideo(
  scriptText: string,
  sourcedClips: SourcedVideo[],
  totalDuration: number = 30,
  preferredStyle?: DirectorStyle,
  apiKey?: string
): Promise<DirectorPlan> {
  const activeKey = apiKey || (window as any).__GEMINI_API_KEY__ || process.env.GEMINI_API_KEY || '';

  // Fallback cleanly to deterministic heuristic director plan if key missing or clips empty
  if (!activeKey || !sourcedClips || sourcedClips.length === 0) {
    console.log('[AI_DIRECTOR] Using high-fidelity heuristic director plan.');
    return generateHeuristicDirectorPlan(scriptText, sourcedClips, totalDuration, preferredStyle);
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: activeKey,
      httpOptions: {
        headers: { 'User-Agent': 'vixora-ai-director' }
      }
    });

    const clipSummaries = sourcedClips.map((c, i) => ({
      index: i,
      id: c.id,
      title: c.title || `Clip ${i + 1}`,
      duration: c.duration,
      mediaType: c.mediaType || 'video',
      searchQuery: c.searchQuery || ''
    }));

    const prompt = `You are the Lead Creative Video Director, Motion Graphics Designer, and Senior Video Editor at Vixora AI Studios.
Analyze the script, narration length (${totalDuration.toFixed(1)}s), and the ${sourcedClips.length} sourced B-roll stock clips below.
Determine the most effective directorial approach, pacing, camera movements, color grading, and 2D motion graphics overlays.

Script: "${scriptText.replace(/"/g, '\\"')}"

Clips Provided:
${JSON.stringify(clipSummaries, null, 2)}

Preferred Style (if specified): ${preferredStyle || 'auto-detect'}

Requirements:
1. Select the most appropriate DirectorStyle: "viral_social", "cinematic_motivational", "clean_commercial", "educational_explainer", or "narrative_storytelling".
2. Choose the best ColorGradePreset: "cinematic_teal_orange", "warm_gold_luxury", "cyber_neon", "vibrant_viral", "clean_commercial", "noir_dramatic", "papercut_warm", or "natural_raw".
3. For each scene (corresponding to the clips provided), produce exact timing (startTime, endTime), trim timestamps, playback speed (0.9 to 1.25), cameraMotion ("zoom_in_slow", "zoom_out_reveal", "punch_in_beat", "pan_left", "pan_right", "camera_shake", "static_focus"), transitions ("flash_zoom", "whip_pan", "crossfade", "glitch_cut", "light_leak", "hard_cut"), and high-impact motionGraphics layers (lower thirds, kinetic badges, stat counters, animated icons).
4. Ensure the total duration of all scenes equals ${totalDuration.toFixed(1)} seconds.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            videoTitle: { type: Type.STRING },
            detectedStyle: { 
              type: Type.STRING, 
              enum: ['viral_social', 'cinematic_motivational', 'clean_commercial', 'educational_explainer', 'narrative_storytelling'] 
            },
            targetAudience: { type: Type.STRING },
            coreEmotion: { type: Type.STRING },
            pacingRhythm: { type: Type.STRING, enum: ['fast_viral', 'cinematic_steady', 'dynamic_rhythmic'] },
            colorGrade: { 
              type: Type.STRING, 
              enum: ['cinematic_teal_orange', 'warm_gold_luxury', 'cyber_neon', 'vibrant_viral', 'clean_commercial', 'noir_dramatic', 'papercut_warm', 'natural_raw'] 
            },
            overallDirectorRationale: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneIndex: { type: Type.INTEGER },
                  scriptExcerpt: { type: Type.STRING },
                  startTime: { type: Type.NUMBER },
                  endTime: { type: Type.NUMBER },
                  duration: { type: Type.NUMBER },
                  trimStart: { type: Type.NUMBER },
                  trimEnd: { type: Type.NUMBER },
                  speed: { type: Type.NUMBER },
                  cameraMotion: { 
                    type: Type.STRING, 
                    enum: ['zoom_in_slow', 'zoom_out_reveal', 'punch_in_beat', 'pan_left', 'pan_right', 'camera_shake', 'static_focus'] 
                  },
                  colorGrade: { type: Type.STRING },
                  transitionIn: { type: Type.STRING, enum: ['flash_zoom', 'whip_pan', 'crossfade', 'glitch_cut', 'light_leak', 'hard_cut'] },
                  transitionOut: { type: Type.STRING, enum: ['flash_zoom', 'whip_pan', 'crossfade', 'glitch_cut', 'light_leak', 'hard_cut'] },
                  directorNotes: { type: Type.STRING },
                  motionGraphics: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, enum: ['lower_third', 'kinetic_badge', 'stat_counter', 'animated_icon', 'papercut_frame', 'progress_bar', 'callout_card'] },
                        title: { type: Type.STRING },
                        subtitle: { type: Type.STRING },
                        metricValue: { type: Type.STRING },
                        accentColor: { type: Type.STRING },
                        position: { type: Type.STRING, enum: ['top_left', 'top_right', 'bottom_left', 'bottom_right', 'center', 'top_bar', 'bottom_bar'] },
                        enterTime: { type: Type.NUMBER },
                        exitTime: { type: Type.NUMBER },
                        animation: { type: Type.STRING, enum: ['slide_up', 'pop_in', 'fade_scale', 'bounce', 'stamp'] }
                      },
                      required: ['type', 'title', 'accentColor', 'position', 'enterTime', 'exitTime', 'animation']
                    }
                  }
                },
                required: ['sceneIndex', 'scriptExcerpt', 'startTime', 'endTime', 'duration', 'cameraMotion', 'transitionIn', 'transitionOut', 'directorNotes']
              }
            }
          },
          required: ['videoTitle', 'detectedStyle', 'targetAudience', 'coreEmotion', 'pacingRhythm', 'colorGrade', 'overallDirectorRationale', 'scenes']
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    if (!parsed || !parsed.scenes || parsed.scenes.length === 0) {
      throw new Error("AI Director did not return valid scenes structure");
    }

    // Merge parsed scenes with actual sourced clip metadata
    const enrichedScenes: EditedSceneInstruction[] = parsed.scenes.map((rawScene: any, i: number) => {
      const clip = sourcedClips[i % sourcedClips.length];
      const dur = rawScene.duration || Math.max(0.5, rawScene.endTime - rawScene.startTime);
      return {
        sceneIndex: i,
        sourceClipId: clip.id,
        clipTitle: clip.title || `Scene Clip #${i + 1}`,
        sourceClipUrl: clip.video_files?.find(f => f.quality === 'hd')?.link || clip.video_files?.[0]?.link || clip.url,
        sourceThumbnail: clip.image,
        mediaType: clip.mediaType || 'video',
        scriptExcerpt: rawScene.scriptExcerpt || `Scene ${i + 1}`,
        startTime: Number(rawScene.startTime.toFixed(2)),
        endTime: Number(rawScene.endTime.toFixed(2)),
        duration: Number(dur.toFixed(2)),
        trimStart: Number((rawScene.trimStart || 0).toFixed(2)),
        trimEnd: Number((rawScene.trimEnd || dur).toFixed(2)),
        speed: Number(rawScene.speed || 1.0),
        cameraMotion: rawScene.cameraMotion || 'zoom_in_slow',
        colorGrade: (rawScene.colorGrade as ColorGradePreset) || (parsed.colorGrade as ColorGradePreset) || 'cinematic_teal_orange',
        transitionIn: rawScene.transitionIn || 'crossfade',
        transitionOut: rawScene.transitionOut || 'crossfade',
        motionGraphics: (rawScene.motionGraphics || []).map((mg: any, idx: number) => ({
          ...mg,
          id: `mg_${i}_${idx}`
        })),
        directorNotes: rawScene.directorNotes || 'Directorial cut matched to narrative cadence.'
      };
    });

    return {
      videoTitle: parsed.videoTitle || scriptText.slice(0, 36),
      detectedStyle: (parsed.detectedStyle as DirectorStyle) || 'viral_social',
      targetAudience: parsed.targetAudience || 'Short-form video audience',
      coreEmotion: parsed.coreEmotion || 'High Engagement',
      pacingRhythm: parsed.pacingRhythm || 'dynamic_rhythmic',
      colorGrade: (parsed.colorGrade as ColorGradePreset) || 'cinematic_teal_orange',
      enableMotionGraphics: true,
      enableCameraMotion: true,
      enableColorGrade: true,
      enableTransitions: true,
      scenes: enrichedScenes,
      overallDirectorRationale: parsed.overallDirectorRationale || 'AI Director optimized pacing and visual interest.',
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('[AI_DIRECTOR] Gemini API direction failed, using high-fidelity fallback heuristics:', error);
    return generateHeuristicDirectorPlan(scriptText, sourcedClips, totalDuration, preferredStyle);
  }
}
