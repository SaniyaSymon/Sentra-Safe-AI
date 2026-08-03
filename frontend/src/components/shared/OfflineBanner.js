import React from 'react';
import { useApp } from '../../context/AppContext';
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OfflineBanner() {
  const { isOnline, t, pendingCount, syncing, justSynced, replayQueue } = useApp();
  if (isOnline && pendingCount === 0 && !justSynced) return null;
  if (justSynced) {
    return (
      <div className="w-full bg-emerald-100 border-b border-emerald-300 text-emerald-900 px-4 py-2 text-sm flex items-center justify-center gap-2" data-testid="synced-banner">
        <CheckCircle2 className="w-4 h-4" /> All queued actions synced
      </div>
    );
  }
  if (!isOnline) {
    return (
      <div className="w-full bg-amber-100 border-b border-amber-300 text-amber-900 px-4 py-2 text-sm flex items-center justify-center gap-2" data-testid="offline-banner">
        <WifiOff className="w-4 h-4" />
        <span>{t('offline')} — Actions will queue and sync when connection returns{pendingCount > 0 ? ` (${pendingCount} pending)` : ''}</span>
      </div>
    );
  }
  // online but pending queue exists
  return (
    <div className="w-full bg-orange-50 border-b border-orange-200 text-orange-900 px-4 py-2 text-sm flex items-center justify-center gap-2" data-testid="pending-banner">
      <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
      <span>{syncing ? 'Syncing queued actions…' : `${pendingCount} action${pendingCount === 1 ? '' : 's'} waiting to sync`}</span>
      {!syncing && (
        <button className="ml-2 px-2 py-0.5 rounded bg-orange-600 text-white text-xs font-semibold" onClick={replayQueue} data-testid="retry-sync">Retry now</button>
      )}
    </div>
  );
}

export function ConnectionBadge() {
  const { isOnline, t, pendingCount, syncing } = useApp();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOnline ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`} data-testid="connection-badge">
      {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {isOnline ? t('online') : t('offline')}
      {pendingCount > 0 && <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-bold" data-testid="pending-badge">{pendingCount}</span>}
    </span>
  );
}
