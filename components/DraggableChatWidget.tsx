import React, { useState, useEffect, useRef } from 'react';
import vixoraAgentAvatar from '../src/assets/images/vixora_agent_avatar_1786108775324.jpg';

interface DraggableChatWidgetProps {
  onOpenChat: () => void;
  onStartVoiceCall?: () => void;
  themeMode?: 'light' | 'dark';
  isLiveActive?: boolean;
}

export const DraggableChatWidget: React.FC<DraggableChatWidgetProps> = ({ onOpenChat, onStartVoiceCall, themeMode = 'dark', isLiveActive = false }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const widgetRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={widgetRef} className="fixed z-[280] bottom-6 right-6">
      <button onClick={onOpenChat} className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 shadow-2xl flex items-center justify-center border-4 border-white/20">
         <img src={vixoraAgentAvatar} className="w-full h-full rounded-full object-cover" />
      </button>
    </div>
  );
};