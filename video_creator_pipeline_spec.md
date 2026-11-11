# Vixora AI Video Creator & Agent Studio: End-to-End Technical Pipeline Specification

This document defines the complete system architecture, data flow, API integrations, and agent tool-calling pipeline for **Vixora AI Studio**, designed to give AI models (such as ChatGPT, Claude, and Gemini) full technical comprehension of how the video generator, scriptwriter, neural text-to-speech (TTS), and automated UI-control agents operate.

---

## 1. High-Level Architecture Overview

Vixora AI Studio is built as a **React 18 + Vite Single Page Application (SPA)** with TypeScript and Tailwind CSS, backed by client-side browser storage (`localStorage`), Firebase Firestore (for multi-device sync), Supabase (for optional user authentication), and direct server-side proxy routes interfacing with Google Gemini generative models.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VIXORA MULTI-AGENT CHAT                         │
│   (ChatGPT & Claude-style UI with 5 specialized creator personas)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ User Prompt / Intent
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        VIXORA AGENT TOOL ENGINE                        │
│   (Parses intent, executes app commands, controls UI, triggers jobs)   │
└──────────────────────────────────┬─────────────────────────────────────┘
         ┌─────────────────────────┴─────────────────────────┐
         ▼                                                   ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│   GEMINI TEXT & SCRIPT PIPELINE   │ │  STOCK VIDEO SOURCING PIPELINE   │
│   - Structured 3-Act Hook Loops   │ │  - Intelligent Stock B-Roll      │
│   - CapCut-style punchline split  │ │  - Fallback Unsplash HD Clips    │
└────────────────┬──────────────────┘ └────────────────┬─────────────────┘
                 │                                     │
                 ▼                                     ▼
┌───────────────────────────────────┐ ┌──────────────────────────────────┐
│     NEURAL TTS & AUDIO PIPELINE   │ │    VIDEO TIMELINE COMPILER     │
│   - Web Speech API HD / Fish Audio│ │  - HTML5 Canvas & WebCodecs      │
│   - Procedural Sound Effects (SFX)│ │  - CapCut-style Kinetic Captions │
└───────────────────────────────────┘ └──────────────────────────────────┘
```

---

## 2. Core Modules & Component Breakdown

1. **`App.tsx`**: Main application orchestrator managing tab routing (`/studio`, `/chat`, `/videos`, `/scripts`, `/autopilot`, `/voiceover`, `/bgmusic`, `/growth`, `/tools`, `/developer`, `/profile`, `/contact`), global project state, user preferences, and theme modes.
2. **`VixoraTextChatPanel.tsx`**: The Claude & ChatGPT-style AI chat interface featuring a collapsible left-side navigation sidebar, multi-thread conversation history (`localStorage` synced), inline thread renaming, deletion, and 5 specialized agent personas.
3. **`vixoraAgentTools.ts`**: The agent tool execution engine (`VIXORA_AGENT_TOOLS`) enabling AI models to directly control the app (e.g., generating scripts, switching tabs, launching autopilot video compilation, changing TTS voice profiles).
4. **`VideoSequencer.tsx`**: The core video compilation engine that merges sourced stock B-roll clips, synthesized voiceovers, background music tracks, and kinetic CapCut-style animated captions into a playable/downloadable MP4 timeline.
5. **`stockSourcingService.ts` & `fishAudioService.ts`**: External API integrations for sourcing high-definition stock video feeds and generating expressive neural text-to-speech voiceovers.

---

## 3. Step-by-Step Video Generation Pipeline

When a user requests a video (either manually in the Video Creator or via AI Autopilot / Agent Chat), the pipeline executes in 5 sequential phases:

### Phase 1: Script Generation & Hook Structuring
- **Input**: Topic / Niche (e.g., *"5 Money Rules for Wealth"*, *"Unbreakable Discipline"*).
- **AI Processing**: Gemini model generates a high-retention script structured into 3 distinct beats:
  - **The Hook (0–3s)**: High-impact scroll-stopping statement.
  - **The Core Value (3–25s)**: Actionable insights, pacing loops, and storytelling.
  - **The CTA (25–30s)**: Engagement prompt (*"Save this video and follow for daily wealth secrets"*).
- **Output**: Clean script text divided into time-stamped caption segments.

### Phase 2: Neural Text-to-Speech (TTS) Voiceover Synthesis
- **Input**: Script text and selected voice profile (e.g., *Kore Nigerian Female*, *Deep English Male*, *Energetic Coach*).
- **Processing**:
  - Primary engine: `Fish Audio` neural voice synthesis API.
  - Fallback engine: Browser `SpeechSynthesis` API with optimized pitch and rate modulation.
- **Output**: Base64 audio buffer converted into an `audio/mpeg` or `audio/wav` blob (`voiceoverUrl`).

### Phase 3: Intelligent Stock B-Roll Sourcing
- **Input**: Script keywords and niche category.
- **Processing**:
  - Queries curated HD stock video repositories and fallback dynamic Unsplash video URLs matching keywords like `luxury finance`, `cyber tech`, `ancient history`, `focused mindset`.
  - Assigns unique stock clip objects (`SourcedVideo`) with duration, resolution, and thumbnail previews.
- **Output**: Array of 3–5 sourced video clips ready for sequencing.

### Phase 4: AI Director — Intelligent Video Editing & Motion Graphics Engine (NEW)
- **Input**: Complete video script, voiceover audio timing, sourced stock clips, and target duration/aspect ratio.
- **AI Processing (Gemini 2.5 Flash)**:
  - **AI Video Understanding**: Analyzes script tone, emotional arc, audience, and narrative purpose.
  - **Intelligent Trimming & Continuity**: Determines precise trim points (`trimInSec`, `trimOutSec`) and arranges sequence flow.
  - **Cinematic Camera Moves**: Computes dynamic camera trajectories per scene (`zoom_in_slow`, `zoom_out_slow`, `punch_in_beat`, `pan_left`, `pan_right`, `camera_shake`, `dynamic_whip`, `tilt_up`, `tilt_down`).
  - **2D Motion Graphics & Animation**: Generates context-aware overlays per beat:
    - 2D animated badge tags & key takeaways
    - Sleek lower-third cards & speaker/concept identifiers
    - Infographic callout cards & dynamic stat counters
    - Papercut styled border outlines & kinetic framing
    - Parallax floating particles & depth lighting
  - **Cinematic Color Grading**: Selects and burns stylistic LUTs (Teal & Orange, Moody Monochrome, Vibrant Gold, Cyber Neon, Clean Warm) directly into the canvas.
  - **Context-Aware Dynamic Transitions**: Schedules whip pans, flash zooms, light leak sweeps, glitch cuts, and crossfades.
- **Output**: `DirectorPlan` containing scene-by-scene instructions executed directly by HTML5 Canvas & WebCodecs rendering.

### Phase 5: Master Timeline, Soundtrack, Kinetic Captions & MP4 Export
- **Input**: Edited footage, `DirectorPlan` metadata, voiceover audio blob, background music, and word-level timestamps.
- **Processing**:
  - `VideoSequencer` mounts clips onto an HTML5 `<video>` / `<canvas>` rendering pipeline.
  - Executes AI Director camera matrices (`ctx.translate`, `ctx.scale`) on every frame for both video and photography.
  - Renders 2D motion graphics and color grading blend overlays.
  - Overlays animated kinetic captions word-by-word with elastic bounce physics and high-contrast text outlines (CapCut aesthetic).
  - Mixes background soundtrack audio and procedural SFX (whooshes, pops, sparkles).
  - Captures master canvas stream via `canvas.captureStream(30)` or MediaRecorder into a broadcast-quality MP4/WebM video.
- **Output**: Fully rendered video file (`.mp4`) with all motion graphics, camera moves, and transitions burned in.

---

## 4. AI Agent Tool-Calling Protocol

The AI assistant understands and executes actions using the following JSON tool schema (`VIXORA_AGENT_TOOLS`):

```json
{
  "name": "directVideoMotionGraphics",
  "description": "Runs or reconfigures Phase 4 AI Director to apply cinematic camera motion, 2D motion graphics, animated badges, lower-thirds, color grading, and dynamic transitions.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "directorStyle": { 
        "type": "STRING", 
        "enum": ["viral_social", "cinematic_motivational", "commercial_brand", "educational_explainer", "narrative_story"],
        "description": "Directorial editing style to apply."
      }
    }
  }
}
```

Available agent tools include:
- `directVideoMotionGraphics` (Phase 4 AI Director & Motion Graphics)
- `generateViralScript`
- `launchAutopilotVideo`
- `switchNarratorVoice`
- `setVideoPreferences`
- `changeMusicSettings`
- `learnUserCustomSkill`
- `generateFlyerImage`
- `navigateToTab` (switches app views instantly)
- `searchStockClips`

---

*This specification provides complete architectural clarity for ChatGPT, Claude, and other LLMs interacting with Vixora AI Studio.*
