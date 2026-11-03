import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { ContentRoadmap, RoadmapItem, VideoTemplate } from '../types';
import { 
  syncFirebaseSaveRoadmap, 
  syncFirebaseFetchRoadmaps, 
  syncFirebaseSaveTemplate, 
  syncFirebaseFetchTemplates 
} from '../services/firebaseService';
import vixoraAgentAvatar from '../src/assets/images/vixora_agent_avatar_1786108775324.jpg';

interface VixoraContentMasterProps {
  themeMode?: 'light' | 'dark';
  onUseTemplateInStudio?: (template: VideoTemplate) => void;
  onGenerateScriptForStudio?: (script: string, topic: string) => void;
  onCookAutopilotVideo?: (topic: string, platform?: string) => void;
}

interface CoachMessage {
  id: string;
  sender: 'sister_vixora' | 'user';
  text: string;
  timestamp: string;
  roadmap?: ContentRoadmap;
  generatedTemplate?: VideoTemplate;
  category?: string;
}

export const VixoraContentMaster: React.FC<VixoraContentMasterProps> = ({
  themeMode = 'dark',
  onUseTemplateInStudio,
  onGenerateScriptForStudio,
  onCookAutopilotVideo
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'roadmaps' | 'templates'>('chat');
  const [niche, setNiche] = useState<string>('Faith & Purpose');
  const [goal, setGoal] = useState<string>('Grow an impactful viral audience & monetize with divine purpose');
  
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'sister_vixora',
      text: "God bless you richly my dear creator! 🙏✨ I am Sister Vixora — your AI Content Master & Divine Purpose Coach.\n\nI am here to guide your social media growth, design viral 4-week roadmaps for TikTok, Facebook Reels & WhatsApp status, craft high-retention video templates, and help you monetize your gifts with complete faith and integrity.\n\nChoose a quick strategy below or ask me anything about your niche!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputQuery, setInputQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceEnergy, setVoiceEnergy] = useState<'high' | 'gentle'>('high');
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.05);

  // Firebase persisted collections
  const [savedRoadmaps, setSavedRoadmaps] = useState<ContentRoadmap[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<VideoTemplate[]>([]);
  const [isFetchingData, setIsFetchingData] = useState<boolean>(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat smoothly
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, activeTab]);

  // Load Firestore saved items
  useEffect(() => {
    const loadFirebaseData = async () => {
      setIsFetchingData(true);
      try {
        const [roadmaps, templates] = await Promise.all([
          syncFirebaseFetchRoadmaps(),
          syncFirebaseFetchTemplates()
        ]);
        setSavedRoadmaps(roadmaps);
        setSavedTemplates(templates);
      } catch (err) {
        console.warn("Failed loading Sister Vixora Firebase records:", err);
      } finally {
        setIsFetchingData(false);
      }
    };
    loadFirebaseData();
  }, []);

  // Voice Synthesis (Authentic Nigerian sister voice styling with Web Speech API)
  const speakVoiceResponse = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Stop active speech

    // Clean markdown tags and code blocks for crisp, clear audio
    const cleanText = text
      .replace(/[*#_`]/g, '')
      .replace(/\[.*?\]/g, '')
      .substring(0, 500);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Look for Nigerian/African or female voices
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.lang.includes('en-NG') || 
      v.name.includes('Nigeria') || 
      v.name.includes('Female') || 
      v.name.includes('Zira') || 
      v.name.includes('Google UK English Female') ||
      v.name.includes('Google US English') ||
      v.lang.includes('en-GB')
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.pitch = voiceEnergy === 'high' ? 1.25 : 1.05;
    utterance.rate = voiceSpeed;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopVoice = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const copyMessageText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  // Main Gemini Coach Engine
  const handleSendMessage = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || inputQuery).trim();
    if (!promptToUse || isLoading) return;

    const userMsgId = 'usr_' + Date.now();
    const userMsg: CoachMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptToUse,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customPrompt) setInputQuery('');
    setIsLoading(true);

    try {
      const activeApiKey = (window as any).__GEMINI_API_KEY__ || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      
      const systemInstruction = `You are "Sister Vixora Content Master", an elite AI Content Coach, Viral Media Strategist, and Faith-Aligned Mentor.
Your persona is an articulate, warm, highly intelligent Nigerian sister with spiritual wisdom, business savvy, and deep social media algorithms mastery.

CORE DIRECTIVES:
1. Address the creator with immense warmth, encouragement, and authority ("My dear creator", "God bless your creativity", "Let us structure this for maximum viral impact").
2. ALWAYS structure your guidance into clear, readable sections:
   - 🎯 VIRAL HOOK (First 3 seconds attention grabber)
   - 💡 RETENTION BEATS (Story flow & pacing)
   - 📈 SOCIAL PLATFORM STRATEGY (WhatsApp, TikTok, Facebook Reels, YouTube Shorts)
   - 💰 MONETIZATION & VALUE (How to profit honestly with integrity)
   - 🕊️ WISDOM NUGGET (Biblical / inspirational takeaway)
3. FORMATTING RULE: NEVER use asterisks (* or **) anywhere in your text. Do not use asterisks for bold or bullets. Use clean line breaks, emojis, and standard bullet symbols (•).
4. If asked for a roadmap or strategy, provide actionable week-by-week breakdowns.
5. If the user asks to create a video template, generate JSON format inside your response containing:
   [TEMPLATE_JSON]
   {
     "title": "Title",
     "description": "Desc",
     "niche": "${niche}",
     "aspectRatio": "vertical",
     "targetDuration": "30s",
     "captionTemplate": "bold-yellow",
     "sfxEnabled": true,
     "scriptStyle": "Inspiring & High-Retention"
   }
   [/TEMPLATE_JSON]`;

      const ai = new GoogleGenAI({
        apiKey: activeApiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Creator Niche: ${niche}\nCreator Growth Goal: ${goal}\nCreator Question/Request: ${promptToUse}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7
        }
      });

      const responseText = response.text || "Praise God my dear creator! I am reviewing your request. How else can I guide your viral content journey today?";

      // Check for embedded Template JSON
      let generatedTemplate: VideoTemplate | undefined = undefined;
      if (responseText.includes('[TEMPLATE_JSON]')) {
        try {
          const jsonMatch = responseText.match(/\[TEMPLATE_JSON\]([\s\S]*?)\[\/TEMPLATE_JSON\]/);
          if (jsonMatch && jsonMatch[1]) {
            const raw = JSON.parse(jsonMatch[1].trim());
            generatedTemplate = {
              id: 'tpl_' + Date.now(),
              title: raw.title || `${niche} Viral Template`,
              description: raw.description || 'Custom generated video template by Sister Vixora',
              niche: raw.niche || niche,
              aspectRatio: raw.aspectRatio || 'vertical',
              targetDuration: raw.targetDuration || '30s',
              captionTemplate: raw.captionTemplate || 'bold-yellow',
              sfxEnabled: raw.sfxEnabled ?? true,
              scriptStyle: raw.scriptStyle || 'Inspiring',
              createdAt: new Date().toISOString()
            };
            // Automatically save to Firebase
            await syncFirebaseSaveTemplate(generatedTemplate);
            setSavedTemplates(prev => [generatedTemplate!, ...prev]);
          }
        } catch (e) {
          console.warn("Template JSON parse error:", e);
        }
      }

      const cleanOutput = responseText
        .replace(/\[TEMPLATE_JSON\][\s\S]*?\[\/TEMPLATE_JSON\]/g, '')
        .replace(/\*/g, '')
        .trim();

      const coachMsg: CoachMessage = {
        id: 'vx_' + Date.now(),
        sender: 'sister_vixora',
        text: cleanOutput,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        generatedTemplate
      };

      setMessages(prev => [...prev, coachMsg]);
      speakVoiceResponse(cleanOutput);

    } catch (err: any) {
      console.error("Sister Vixora AI Coach error:", err);
      const errMsg: CoachMessage = {
        id: 'err_' + Date.now(),
        sender: 'sister_vixora',
        text: "My dear creator, I experienced a minor network flicker. Please try asking me again, and we shall build your viral strategy together!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Structured 4-Week Roadmap Generator
  const handleGenerateRoadmap = async () => {
    setIsLoading(true);
    try {
      const activeApiKey = (window as any).__GEMINI_API_KEY__ || process.env.GEMINI_API_KEY || process.env.API_KEY || '';
      const ai = new GoogleGenAI({
        apiKey: activeApiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const prompt = `Create a structured 4-Week Viral Content Roadmap for the niche "${niche}" with goal "${goal}".
Return strictly valid JSON without markdown wrapping in this exact format:
{
  "title": "4-Week ${niche} Viral Content Mastery",
  "niche": "${niche}",
  "platform": "Multi-Platform (WhatsApp, Facebook Reels, TikTok)",
  "goal": "${goal}",
  "faithAlignment": "Honoring God with truthful, uplifting, and high-value content",
  "roadmapItems": [
    {
      "week": "Week 1",
      "topic": "The High-Impact Origin Hook",
      "hook": "Why 90% of creators in ${niche} fail to reach their true audience...",
      "platform": "TikTok & Facebook Reels",
      "monetizationAngle": "Build trust and introduce free community link"
    },
    {
      "week": "Week 2",
      "topic": "Debunking Common Myths",
      "hook": "Stop doing this if you want breakthrough in ${niche}!",
      "platform": "WhatsApp Status & Instagram Stories",
      "monetizationAngle": "Direct 1-on-1 WhatsApp consultations"
    },
    {
      "week": "Week 3",
      "topic": "Transformational Testimony & Value Breakdown",
      "hook": "Here is the exact framework God gave me to master ${niche}...",
      "platform": "YouTube Shorts & Facebook Page",
      "monetizationAngle": "Digital downloadable guide / masterclass"
    },
    {
      "week": "Week 4",
      "topic": "Community Call to Action & Scaling",
      "hook": "Ready to take your ${niche} journey to the next level?",
      "platform": "WhatsApp Broadcast & All Channels",
      "monetizationAngle": "Premium inner circle membership"
    }
  ]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const rawText = res.text || '{}';
      const cleanJson = rawText.substring(rawText.indexOf('{'), rawText.lastIndexOf('}') + 1);
      const parsed = JSON.parse(cleanJson);

      const newRoadmap: ContentRoadmap = {
        id: 'rdmp_' + Date.now(),
        title: parsed.title || `4-Week ${niche} Roadmap`,
        niche: parsed.niche || niche,
        platform: parsed.platform || 'Multi-Platform',
        goal: parsed.goal || goal,
        faithAlignment: parsed.faithAlignment || 'Faith & Integrity First',
        roadmapItems: parsed.roadmapItems || [],
        createdAt: new Date().toISOString()
      };

      // Save to Firebase
      await syncFirebaseSaveRoadmap(newRoadmap);
      setSavedRoadmaps(prev => [newRoadmap, ...prev]);

      const coachMsg: CoachMessage = {
        id: 'vx_rdmp_' + Date.now(),
        sender: 'sister_vixora',
        text: `Hallelujah! I have generated your personalized 4-Week Content Roadmap for "${niche}". It has been saved securely to Firebase. You can send any hook directly into your Video Studio below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        roadmap: newRoadmap
      };

      setMessages(prev => [...prev, coachMsg]);
      speakVoiceResponse("Praise God! I have generated your customized 4-Week Content Roadmap and saved it to your account.");

    } catch (err) {
      console.error("Roadmap generation error:", err);
      handleSendMessage("Generate a 4-week content roadmap for my niche");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-full rounded-3xl border text-left relative overflow-hidden shadow-2xl space-y-4 p-4 sm:p-6 box-border ${
      themeMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900/90 border-white/10 text-white'
    }`} id="vixora-content-master">
      
      {/* 1. SISTER VIXORA HERO HEADER BANNER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <img 
              src={vixoraAgentAvatar} 
              alt="Sister Vixora" 
              className="w-12 h-12 rounded-2xl border-2 border-ggd-orange object-cover shadow-lg"
            />
            {isSpeaking && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white text-[7px] text-white font-bold items-center justify-center">
                  <i className="fa-solid fa-volume-high"></i>
                </span>
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className={`text-base sm:text-lg font-black uppercase tracking-tight ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Sister Vixora
              </h2>
              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-ggd-orange border border-ggd-orange/30 text-[8px] font-black uppercase rounded-lg tracking-wider">
                Divine Purpose & Content Master
              </span>
            </div>
            <p className={`text-[10px] font-bold uppercase mt-0.5 flex items-center gap-1.5 ${themeMode === 'light' ? 'text-slate-600' : 'text-slate-400'}`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Faith-Aligned Viral Strategy • Nigerian Sister Voice</span>
            </p>
          </div>
        </div>

        {/* VOICE CONTROLS & TEST AUDIO */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setVoiceEnergy(voiceEnergy === 'high' ? 'gentle' : 'high')}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
              voiceEnergy === 'high' 
                ? 'bg-amber-500/20 border-amber-500 text-amber-400' 
                : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
            }`}
            title="Toggle between High Energy Nigerian Lady cadence & Gentle Cadence"
          >
            <i className="fa-solid fa-bolt"></i>
            <span>{voiceEnergy === 'high' ? 'High Energy ⚡' : 'Gentle 🕊️'}</span>
          </button>

          {isSpeaking ? (
            <button
              onClick={stopVoice}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[9px] font-black uppercase rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <i className="fa-solid fa-volume-xmark"></i>
              <span>Stop Voice</span>
            </button>
          ) : (
            <button
              onClick={() => speakVoiceResponse("God bless you richly my dear creator! Sister Vixora is ready to guide your viral journey today!")}
              className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[9px] font-black uppercase rounded-xl hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <i className="fa-solid fa-volume-high"></i>
              <span>Test Voice</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center justify-between gap-1.5 bg-slate-100 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-2 px-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'chat' 
              ? 'bg-ggd-orange text-white shadow-md' 
              : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-comments"></i>
          <span>Live Coach Chat</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmaps')}
          className={`flex-1 py-2 px-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'roadmaps' 
              ? 'bg-ggd-orange text-white shadow-md' 
              : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-map-location-dot"></i>
          <span>Roadmaps ({savedRoadmaps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 py-2 px-3 text-[10px] font-black uppercase rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'templates' 
              ? 'bg-ggd-orange text-white shadow-md' 
              : themeMode === 'light' ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fa-solid fa-clapperboard"></i>
          <span>Templates ({savedTemplates.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: LIVE COACH CHAT */}
      {activeTab === 'chat' && (
        <div className="space-y-3.5 pb-28 sm:pb-6">
          {/* NICHE & GOAL SELECTION CARD */}
          <div className={`p-3 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-2.5 ${
            themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'
          }`}>
            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Your Creator Niche
              </label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-ggd-orange ${
                  themeMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-white/10 text-white'
                }`}
              >
                <option value="Faith & Purpose">Faith & Purpose (Christian Content)</option>
                <option value="Business & Wealth">Business, Tech & Wealth Creation</option>
                <option value="Lifestyle & Vlog">Lifestyle, Relationship & Family</option>
                <option value="Education & AI">Education, AI & Career Growth</option>
                <option value="Health & Fitness">Health, Wellness & Mindset</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                Primary Growth & Monetization Goal
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Monetize WhatsApp group and grow 10k TikTok followers"
                className={`w-full p-2.5 rounded-xl border text-xs font-medium focus:outline-none focus:border-ggd-orange ${
                  themeMode === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-white/10 text-white'
                }`}
              />
            </div>
          </div>

          {/* QUICK TOPIC PROMPTS (CHIPS) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { label: '⚡ 4-Week Roadmap', action: () => handleGenerateRoadmap() },
              { label: '🔥 5 Viral Hooks for ' + niche, action: () => handleSendMessage(`Give me 5 viral opening hooks for ${niche} with 3-second retention tricks`) },
              { label: '💰 Monetize WhatsApp Status', action: () => handleSendMessage(`How do I monetize my ${niche} audience on WhatsApp status without looking salesy?`) },
              { label: '📱 Facebook & TikTok Script', action: () => handleSendMessage(`Write a high-converting 30s video script for ${niche} that drives community signups`) },
              { label: '🎨 Design Video Template', action: () => handleSendMessage(`Create a viral video template with caption and hook ideas for ${niche}`) },
              { label: '🕊️ Faith + Purpose Strategy', action: () => handleSendMessage(`How do I balance viral social growth with biblical truth and integrity in ${niche}?`) }
            ].map((item, idx) => (
              <button
                key={idx}
                disabled={isLoading}
                onClick={item.action}
                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap transition-all active:scale-95 shrink-0 cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-sm'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* MESSAGES FEED */}
          <div className={`p-3.5 sm:p-4 rounded-2xl border space-y-3.5 max-h-[48vh] sm:max-h-[58vh] overflow-y-auto scrollbar-none ${
            themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-black/30 border-white/5'
          }`}>
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.sender === 'sister_vixora' && (
                  <div className="w-8 h-8 rounded-xl border border-ggd-orange overflow-hidden shrink-0 mt-0.5 shadow-sm bg-slate-900">
                    <img 
                      src={vixoraAgentAvatar} 
                      alt="Sister Vixora" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className={`max-w-[90%] sm:max-w-[85%] space-y-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {/* MESSAGE BUBBLE */}
                  <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed break-words shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white border-orange-500 rounded-tr-none font-medium'
                      : themeMode === 'light'
                        ? 'bg-white border-slate-200 text-slate-900 rounded-tl-none'
                        : 'bg-slate-900 border-white/10 text-slate-100 rounded-tl-none'
                  }`}>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/10 dark:border-white/10 text-[8px] font-mono opacity-80">
                      <span>{msg.timestamp}</span>

                      {msg.sender === 'sister_vixora' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakVoiceResponse(msg.text)}
                            className="text-ggd-orange hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            title="Listen to Sister Vixora voice"
                          >
                            <i className="fa-solid fa-volume-high"></i>
                            <span>Listen</span>
                          </button>
                          <button
                            onClick={() => copyMessageText(msg.id, msg.text)}
                            className="text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
                            title="Copy message"
                          >
                            <i className={`fa-solid ${copiedMsgId === msg.id ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                            <span>{copiedMsgId === msg.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* EMBEDDED ROADMAP CARD */}
                  {msg.roadmap && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left space-y-2.5 animate-rise">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black uppercase text-amber-500 flex items-center gap-1.5">
                          <i className="fa-solid fa-map-location-dot"></i>
                          <span>{msg.roadmap.title}</span>
                        </h4>
                        <span className="text-[8px] font-black px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-md uppercase">
                          Saved to Cloud
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-300 italic">" {msg.roadmap.faithAlignment} "</p>

                      <div className="space-y-2">
                        {msg.roadmap.roadmapItems.map((item: RoadmapItem, idx: number) => {
                          const itemHook = item.hook || item.contentHook || '';
                          const itemTopic = item.topic || item.postTitle || '';
                          const itemWeek = item.week || item.day || idx + 1;
                          const itemMonetization = item.monetizationAngle || item.monetizationTip || '';
                          return (
                            <div key={idx} className="p-2.5 bg-black/40 rounded-xl border border-white/5 space-y-1">
                              <div className="flex justify-between items-center text-[9px] font-bold text-ggd-orange">
                                <span>Week {itemWeek}: {itemTopic}</span>
                                <span className="text-slate-400">{item.platform}</span>
                              </div>
                              <p className="text-[9.5px] text-white font-medium">Hook: "{itemHook}"</p>
                              {itemMonetization && (
                                <p className="text-[8px] text-emerald-400 font-bold">Monetization: {itemMonetization}</p>
                              )}
                              {onGenerateScriptForStudio && (
                                <button
                                  onClick={() => onGenerateScriptForStudio(itemHook, itemTopic)}
                                  className="mt-1 px-2.5 py-1 bg-ggd-orange/20 hover:bg-ggd-orange text-ggd-orange hover:text-white rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <i className="fa-solid fa-clapperboard"></i>
                                  <span>Send Hook to Video Studio 🎬</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* EMBEDDED TEMPLATE CARD */}
                  {msg.generatedTemplate && (
                    <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-left space-y-2 animate-rise">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-black uppercase text-indigo-400 flex items-center gap-1.5">
                          <i className="fa-solid fa-clapperboard"></i>
                          <span>{msg.generatedTemplate.title}</span>
                        </p>
                        <span className="text-[8px] font-bold text-emerald-400">Saved to Firestore</span>
                      </div>
                      <p className="text-[9.5px] text-slate-300">{msg.generatedTemplate.description}</p>
                      {onUseTemplateInStudio && (
                        <button
                          onClick={() => onUseTemplateInStudio(msg.generatedTemplate!)}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <i className="fa-solid fa-rocket"></i>
                          <span>Use Template in Video Studio</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-slate-400 text-xs italic animate-pulse">
                <div className="w-6 h-6 rounded-lg overflow-hidden border border-ggd-orange">
                  <img src={vixoraAgentAvatar} alt="Sister Vixora" className="w-full h-full object-cover" />
                </div>
                <span>Sister Vixora is discerning your viral strategy...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* CHAT INPUT BAR */}
          <div className="sticky bottom-16 sm:bottom-0 z-30 pt-2 pb-1 bg-slate-950/90 sm:bg-transparent backdrop-blur-md">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask Sister Vixora anything about viral hooks, biblical alignment, or monetization..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                className={`flex-1 p-3.5 rounded-2xl border text-xs font-medium focus:outline-none focus:border-ggd-orange shadow-lg ${
                  themeMode === 'light' ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900/90 border-white/15 text-white'
                }`}
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading}
                className="btn-3d btn-3d-orange px-4 sm:px-6 py-3.5 text-xs font-black uppercase rounded-2xl shadow-xl disabled:opacity-50 active:scale-95 transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
              >
                <span className="hidden sm:inline">Ask Coach</span>
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. TAB 2: SAVED CONTENT ROADMAPS */}
      {activeTab === 'roadmaps' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-xs font-black uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Saved Content Roadmaps ({savedRoadmaps.length})
            </h3>
            <button
              onClick={handleGenerateRoadmap}
              disabled={isLoading}
              className="px-3 py-1.5 bg-ggd-orange hover:bg-orange-600 text-white text-[9px] font-black uppercase rounded-xl shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              <span>+ Generate New Roadmap</span>
            </button>
          </div>

          {savedRoadmaps.length === 0 ? (
            <div className={`p-8 border rounded-2xl text-center space-y-2 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <i className="fa-solid fa-map-location-dot text-3xl text-slate-500"></i>
              <p className="text-xs font-bold text-slate-400">No content roadmaps generated yet.</p>
              <p className="text-[10px] text-slate-500">Click "+ Generate New Roadmap" or ask Sister Vixora in Live Chat!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-none">
              {savedRoadmaps.map((rd) => (
                <div key={rd.id} className={`p-4 rounded-2xl border space-y-3 ${
                  themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-black uppercase text-ggd-orange">{rd.title}</h4>
                      <p className="text-[9px] text-slate-400">{rd.niche} • {rd.platform}</p>
                    </div>
                    <span className="text-[8px] font-mono text-slate-500">
                      {new Date(rd.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {rd.roadmapItems?.map((item, idx) => {
                      const itemHook = item.hook || item.contentHook || '';
                      const itemTopic = item.topic || item.postTitle || '';
                      const itemWeek = item.week || item.day || idx + 1;
                      const itemMonetization = item.monetizationAngle || item.monetizationTip || '';
                      return (
                        <div key={idx} className="p-2.5 bg-black/30 rounded-xl border border-white/5 space-y-1">
                          <div className="flex justify-between items-center text-[9px] font-bold text-amber-400">
                            <span>Week {itemWeek}: {itemTopic}</span>
                            <span className="text-slate-400">{item.platform}</span>
                          </div>
                          <p className="text-[9.5px] text-slate-200">Hook: "{itemHook}"</p>
                          {itemMonetization && (
                            <p className="text-[8px] text-emerald-400 font-bold">Monetization: {itemMonetization}</p>
                          )}
                          {onGenerateScriptForStudio && (
                            <button
                              onClick={() => onGenerateScriptForStudio(itemHook, itemTopic)}
                              className="mt-1 px-2.5 py-1 bg-ggd-orange text-white rounded-lg text-[8px] font-black uppercase active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <i className="fa-solid fa-clapperboard"></i>
                              <span>Send to Video Studio 🎬</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: SAVED VIDEO TEMPLATES */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-xs font-black uppercase tracking-wider ${themeMode === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Saved Video Templates ({savedTemplates.length})
            </h3>
          </div>

          {savedTemplates.length === 0 ? (
            <div className={`p-8 border rounded-2xl text-center space-y-2 ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/5'}`}>
              <i className="fa-solid fa-clapperboard text-3xl text-slate-500"></i>
              <p className="text-xs font-bold text-slate-400">No video templates saved yet.</p>
              <p className="text-[10px] text-slate-500">Ask Sister Vixora to design one in Live Chat!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1 scrollbar-none">
              {savedTemplates.map((tpl) => (
                <div key={tpl.id} className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${
                  themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10'
                }`}>
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-black uppercase text-indigo-400">{tpl.title}</h4>
                      <span className="text-[8px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md">
                        {tpl.aspectRatio}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-slate-400 mt-1">{tpl.description}</p>
                    <div className="mt-2 text-[8px] space-y-0.5 text-slate-500 font-mono">
                      <p>Target Duration: {tpl.targetDuration}</p>
                      <p>Caption Style: {tpl.captionTemplate}</p>
                      <p>SFX Enabled: {tpl.sfxEnabled ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {onUseTemplateInStudio && (
                    <button
                      onClick={() => onUseTemplateInStudio(tpl)}
                      className="w-full py-2 bg-ggd-orange hover:bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase shadow-md active:scale-95 transition-all mt-3 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <i className="fa-solid fa-rocket"></i>
                      <span>Apply Template in Studio</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
