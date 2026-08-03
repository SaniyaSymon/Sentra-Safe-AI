import React from 'react';
import { useApp } from '../../context/AppContext';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, t } = useApp();
  if (isOnline) return null;
  return (
    <div className="w-full bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm flex items-center justify-center gap-2" data-testid="offline-banner">
      <WifiOff className="w-4 h-4" />
      <span>{t('offline')} — Actions will queue and sync when connection returns</span>
    </div>
  );
}

export function ConnectionBadge() {
  const { isOnline, t } = useApp();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`} data-testid="connection-badge">
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isOnline ? t('online') : t('offline')}
    </span>
  );
}
