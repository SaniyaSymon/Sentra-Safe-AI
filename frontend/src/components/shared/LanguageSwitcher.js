import React from 'react';
import { LANGUAGES } from '../../data/translations';
import { useApp } from '../../context/AppContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage } = useApp();
  return (
    <div className="flex items-center gap-2" data-testid="lang-switcher">
      <Globe className="w-4 h-4 text-slate-500" />
      <Select value={language} onValueChange={(v) => setLanguage(v)}>
        <SelectTrigger className="w-[130px] bg-white border-slate-200" data-testid="lang-trigger">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {LANGUAGES.map(l => (
            <SelectItem key={l.code} value={l.code} data-testid={`lang-opt-${l.code}`}>
              {compact ? l.code.toUpperCase() : l.native}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
