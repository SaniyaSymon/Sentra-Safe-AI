import React from 'react';
import { Home, Boxes, Siren, BellRing, Settings } from 'lucide-react';

export default function MobileBottomNav({ active, onChange, t }) {
  const items = [
    { key: 'dashboard', label: t('dashboard'), icon: Home },
    { key: 'resources', label: t('resources'), icon: Boxes },
    { key: 'sos', label: t('sos'), icon: Siren, primary: true },
    { key: 'alerts', label: t('alerts'), icon: BellRing },
    { key: 'settings', label: t('settings'), icon: Settings },
  ];
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 pb-safe" data-testid="mobile-bottom-nav">
      <div className="grid grid-cols-5">
        {items.map(it => {
          const Icon = it.icon;
          const isActive = active === it.key;
          if (it.primary) {
            return (
              <button key={it.key} onClick={() => onChange(it.key)} className="flex flex-col items-center justify-center py-2" data-testid={`bn-${it.key}`}>
                <div className={`w-12 h-12 -mt-6 rounded-full ${isActive ? 'bg-red-600' : 'bg-orange-600'} text-white flex items-center justify-center shadow-lg sos-pulse`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-semibold text-slate-700 mt-1">{it.label}</span>
              </button>
            );
          }
          return (
            <button key={it.key} onClick={() => onChange(it.key)} className={`flex flex-col items-center justify-center py-2.5 ${isActive ? 'text-orange-600' : 'text-slate-500'}`} data-testid={`bn-${it.key}`}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-orange-600' : 'text-slate-500'}`} />
              <span className="text-[10px] font-semibold mt-0.5">{it.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
