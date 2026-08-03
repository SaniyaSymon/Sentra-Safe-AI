import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Mic, MicOff, Volume2 } from 'lucide-react';

export default function VoiceAssistant({ getText }) {
  const { voiceEnabled, setVoiceEnabled, speak, stopSpeaking, t } = useApp();
  const [active, setActive] = useState(false);

  const trigger = () => {
    if (!voiceEnabled) { setVoiceEnabled(true); }
    const text = typeof getText === 'function' ? getText() : (getText || `${t('app_name')}. ${t('tagline')}`);
    setActive(true);
    speak(text);
    setTimeout(() => setActive(false), Math.min(20000, text.length * 100));
  };

  const stop = () => { stopSpeaking(); setActive(false); };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3" data-testid="voice-assistant">
      {active && (
        <button onClick={stop} className="px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm shadow-md" data-testid="voice-stop-btn">
          {t('stop')}
        </button>
      )}
      <button
        onClick={active ? stop : trigger}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${active ? 'bg-orange-600 va-pulse' : 'bg-slate-900'}`}
        data-testid="voice-trigger-btn"
        aria-label="Voice assistant"
      >
        {active ? <Volume2 className="w-6 h-6" /> : voiceEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
      </button>
    </div>
  );
}
