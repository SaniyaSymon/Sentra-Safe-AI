import React from 'react';

const VARIANTS = {
  new: 'bg-red-50 text-red-700 border-red-200',
  acknowledged: 'bg-amber-50 text-amber-800 border-amber-200',
  dispatched: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  synced: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  sent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  queued_offline: 'bg-amber-50 text-amber-800 border-amber-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  operational: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  severe: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-800 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function StatusBadge({ status, label }) {
  const v = VARIANTS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${v}`} data-testid={`status-badge-${status}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {(label || status || '').toString().toUpperCase()}
    </span>
  );
}
