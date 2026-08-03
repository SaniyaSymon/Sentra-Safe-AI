import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { tr } from '../data/translations';

const AppContext = createContext(null);

const STORAGE_KEY = 'sentrasafe_profile_v1';
const OFFLINE_QUEUE_KEY = 'sentrasafe_offline_queue_v1';

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try { const v = localStorage.getItem(STORAGE_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
  });
  const [language, setLanguage] = useState(() => profile?.preferred_language || 'en');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const onOn = () => setIsOnline(true);
    const onOff = () => setIsOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); };
  }, []);

  useEffect(() => {
    if (profile) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); } catch (_) { void 0; }
      setLanguage(profile.preferred_language || 'en');
    }
  }, [profile]);

  const logout = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { void 0; }
    setProfile(null);
  }, []);

  const t = useCallback((key) => tr(language, key), [language]);

  const enqueueOffline = useCallback((action) => {
    try {
      const q = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]');
      q.push({ ...action, queued_at: new Date().toISOString() });
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
    } catch (_) { void 0; }
  }, []);

  const getOfflineQueue = useCallback(() => {
    try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
  }, []);

  const clearOfflineQueue = useCallback(() => {
    try { localStorage.removeItem(OFFLINE_QUEUE_KEY); } catch (_) { void 0; }
  }, []);

  const speak = useCallback((text) => {
    if (!voiceEnabled) return;
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const codeMap = { en: 'en-IN', ta: 'ta-IN', ml: 'ml-IN' };
      u.lang = codeMap[language] || 'en-IN';
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (_) { void 0; }
  }, [voiceEnabled, language]);

  const stopSpeaking = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch (_) { void 0; }
  }, []);

  return (
    <AppContext.Provider value={{
      profile, setProfile, logout,
      language, setLanguage, t,
      isOnline, voiceEnabled, setVoiceEnabled, soundEnabled, setSoundEnabled,
      speak, stopSpeaking,
      enqueueOffline, getOfflineQueue, clearOfflineQueue,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
