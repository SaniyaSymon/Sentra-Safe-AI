import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { tr } from '../data/translations';
import { apiClient } from '../lib/api';

const AppContext = createContext(null);

const STORAGE_KEY = 'sentrasafe_profile_v1';
const OFFLINE_QUEUE_KEY = 'sentrasafe_offline_queue_v1';

const readQ = () => {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]'); } catch { return []; }
};
const writeQ = (q) => {
  try { localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q)); } catch (_) { void 0; }
};

export function AppProvider({ children }) {
  const [profile, setProfile] = useState(() => {
    try { const v = localStorage.getItem(STORAGE_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
  });
  const [language, setLanguage] = useState(() => profile?.preferred_language || 'en');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pendingCount, setPendingCount] = useState(() => readQ().length);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const syncingRef = useRef(false);

  const refreshPending = useCallback(() => setPendingCount(readQ().length), []);

  const replayQueue = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true; setSyncing(true);
    const remaining = [];
    const q = readQ();
    for (const action of q) {
      try {
        if (action.type === 'sos_create') {
          await apiClient.post('/sos', action.payload);
        } else if (action.type === 'dispatch') {
          await apiClient.post('/dispatch/test', action.payload);
        } else if (action.type === 'contact_create') {
          await apiClient.post('/campus-contacts', action.payload, { headers: { 'x-campus-role': action.role || 'coordinator' } });
        } else if (action.type === 'contact_update') {
          await apiClient.patch(`/campus-contacts/${action.id}`, action.payload, { headers: { 'x-campus-role': action.role || 'coordinator' } });
        } else if (action.type === 'sos_update') {
          await apiClient.patch(`/sos/${action.id}`, action.payload);
        }
      } catch {
        remaining.push(action);
      }
    }
    writeQ(remaining);
    setPendingCount(remaining.length);
    setSyncing(false); syncingRef.current = false;
    if (remaining.length === 0 && q.length > 0) {
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    }
  }, []);

  useEffect(() => {
    const onOn = () => { setIsOnline(true); replayQueue(); };
    const onOff = () => setIsOnline(false);
    window.addEventListener('online', onOn);
    window.addEventListener('offline', onOff);
    // Attempt initial replay
    if (navigator.onLine) replayQueue();
    return () => { window.removeEventListener('online', onOn); window.removeEventListener('offline', onOff); };
  }, [replayQueue]);

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
    const q = readQ();
    q.push({ ...action, queued_at: new Date().toISOString() });
    writeQ(q);
    setPendingCount(q.length);
  }, []);

  const getOfflineQueue = useCallback(() => readQ(), []);
  const clearOfflineQueue = useCallback(() => { writeQ([]); setPendingCount(0); }, []);

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
      enqueueOffline, getOfflineQueue, clearOfflineQueue, refreshPending,
      pendingCount, syncing, justSynced, replayQueue,
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
