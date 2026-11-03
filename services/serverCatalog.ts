// Pure server catalog without JSX or image imports for clean Node / esbuild compilation

export interface ServerVoiceOption {
  id: string;
  name: string;
  voiceName: string;
  accent: string;
  gender: 'Female' | 'Male';
  description: string;
  sampleText: string;
  badge?: string;
  isVixoraVoice?: boolean;
}

export const SERVER_VOICE_OPTIONS: ServerVoiceOption[] = [
  {
    id: 'vixora_studio_voice',
    name: 'Vixora (Signature Nigerian Voice)',
    voiceName: 'Kore',
    accent: 'Vixora Signature Nigerian Female (High-Energy & Charismatic Lagos Tone)',
    gender: 'Female',
    description: 'The official signature Vixora Studio AI voice. Authentic energetic Nigerian female tone with vibrant delivery, warm inflection, and viral retention cadence.',
    sampleText: 'How far my creator! Welcome to Vixora Studio. I am your signature Nigerian AI voice, ready to bring your viral scripts and reels to life!',
    badge: 'OFFICIAL NIGERIAN SIGNATURE',
    isVixoraVoice: true
  },
  {
    id: 'ngozi_lagos_vibrant',
    name: 'Ngozi (Lagos Storyteller & Reels)',
    voiceName: 'Kore_Ngozi',
    accent: 'Warm & Vibrant Nigerian Female Accent',
    gender: 'Female',
    description: 'Rich, melodic, and engaging Nigerian woman voice engineered for storytime videos, cultural breakdowns, TikTok trends, and motivation.',
    sampleText: 'Listen closely my people! Today I want to share the number one mindset shift that transformed everything for me.',
    badge: 'VIBRANT NAIJA ACCENT'
  },
  {
    id: 'chidinma_nigerian_pro',
    name: 'Chidinma (Nigerian Corporate & Pro)',
    voiceName: 'Kore_Chidinma',
    accent: 'Polished Nigerian Professional English',
    gender: 'Female',
    description: 'Sophisticated, articulate, and trustworthy Nigerian female executive voice for tech presentations, business tips, finance, and explainer videos.',
    sampleText: 'Welcome to this strategic breakdown. Let us explore the top financial opportunities and how to scale your vision effectively.',
    badge: 'PRO NIGERIAN ENGLISH'
  },
  {
    id: 'aoede_warm',
    name: 'Aoede (Warm Global Storyteller)',
    voiceName: 'Aoede',
    accent: 'Warm & Engaging Global Tone',
    gender: 'Female',
    description: 'Gentle, engaging female narrator tone for documentary, storytelling, and lifestyle shorts.',
    sampleText: 'Empower your content with high-retention storytelling, crystal clarity, and authentic pacing.',
    badge: 'GLOBAL STORYTELLER'
  },
  {
    id: 'puck_high_energy',
    name: 'Puck (Viral High Energy)',
    voiceName: 'Puck',
    accent: 'Fast-Paced High Energy Male',
    gender: 'Male',
    description: 'Upbeat, fast-paced viral male voice ideal for TikTok and YouTube Shorts hooks.',
    sampleText: 'Stop scrolling right now! Here are three secrets top creators use to scale their audience fast.',
    badge: 'HIGH ENERGY MALE'
  },
  {
    id: 'charon_dramatic',
    name: 'Charon (Deep Cinematic)',
    voiceName: 'Charon',
    accent: 'Deep Authoritative Cinema Tone',
    gender: 'Male',
    description: 'Authoritative deep cinematic tone for mysteries, history, finance, and dramatic breakdowns.',
    sampleText: 'In a world driven by continuous change, one fundamental truth remains untouched.',
    badge: 'CINEMATIC MALE'
  },
  {
    id: 'fenrir_bold',
    name: 'Fenrir (Bold & Direct)',
    voiceName: 'Fenrir',
    accent: 'Confident Direct Tech Tone',
    gender: 'Male',
    description: 'Strong, articulate male tone for tech reviews, business breakdowns, and sharp commentaries.',
    sampleText: 'Welcome back! Today we are dissecting the biggest AI breakthrough and how you can profit from it.',
    badge: 'TECH & DIRECT'
  },
  {
    id: 'zephyr_smooth',
    name: 'Zephyr (Smooth Studio Narrator)',
    voiceName: 'Zephyr',
    accent: 'Balanced Studio Female Tone',
    gender: 'Female',
    description: 'Smooth, polished, and balanced tone for educational tutorials, podcasts, and calm product showcases.',
    sampleText: 'Let us dive into the details and guide you step by step through this complete workflow.',
    badge: 'SMOOTH STUDIO'
  }
];

export interface ServerMusicTrack {
  id: string;
  name: string;
  url: string;
  mood: string;
  description: string;
}

export const SERVER_MUSIC_TRACKS: ServerMusicTrack[] = [
  { id: 'motivational', name: 'Motivational Rise', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', mood: 'motivational', description: 'Energetic building rhythm' },
  { id: 'epic', name: 'Epic Cinema', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', mood: 'dramatic', description: 'Orchestral deep crescendo' },
  { id: 'calm', name: 'Chill Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', mood: 'calm', description: 'Restful, soothing focus pad' },
  { id: 'upbeat', name: 'Bright Pop', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', mood: 'upbeat', description: 'Cheerful uplifting acoustic guitar' },
  { id: 'corporate', name: 'Clean Corporate', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', mood: 'corporate', description: 'Smart, professional presentation' },
  { id: 'future', name: 'Future Cyber', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', mood: 'tech', description: 'Cyberpunk cinematic electronic' },
  { id: 'sunset-lounge', name: 'Sunset Lounge', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', mood: 'calm', description: 'Smooth atmospheric jazz and warm deep bass' },
  { id: 'neon-horizon', name: 'Neon Horizon', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', mood: 'tech', description: 'Driving synthwave highway explorer beat' },
  { id: 'productive-flow', name: 'Productive Flow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3', mood: 'corporate', description: 'Inspirational electronic pulse for deep focus' },
  { id: 'cinematic-velocity', name: 'Cinematic Velocity', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3', mood: 'dramatic', description: 'Staccato orchestration with powerful cinematic action' },
  { id: 'acoustic-sunshine', name: 'Acoustic Sunshine', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3', mood: 'upbeat', description: 'Happy handclaps with vibrant acoustic lead strumming' },
  { id: 'dreamy-lofi', name: 'Dreamy Lofi', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3', mood: 'calm', description: 'Relaxing vintage dusty vinyl textures and bells' }
];
