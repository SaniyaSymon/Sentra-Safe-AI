import React from 'react';
import { useApp } from '../../context/AppContext';
import LanguageSwitcher from './LanguageSwitcher';
import { ConnectionBadge } from './OfflineBanner';
import { LogOut, ShieldAlert, Crown } from 'lucide-react';
import { Button } from '../ui/button';

export default function Header({ title, subtitle }) {
  const { profile, logout, t } = useApp();
  const isOwner = (profile?.email || '').toLowerCase() === 'symonsaniya@gmail.com';
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200" data-testid="app-header">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/assets/sentrasafe-logo.jpeg" alt="SentraSafe AI" className="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-sm" />
          <div className="min-w-0">
            <div className="font-display text-lg sm:text-xl font-bold text-slate-900 truncate">{title || t('app_name')}</div>
            <div className="text-xs text-slate-500 truncate">{subtitle || t('tagline')}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <div className="hidden sm:block"><LanguageSwitcher compact /></div>
          {isOwner && (
            <Button size="sm" onClick={() => { window.location.hash = '#/admin'; }} className="hidden sm:inline-flex bg-orange-600 hover:bg-orange-700 text-white" data-testid="owner-admin-link">
              <Crown className="w-4 h-4 mr-1.5" />Admin
            </Button>
          )}
          {profile && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm">
              <ShieldAlert className="w-4 h-4 text-orange-600" />
              <span className="font-semibold text-slate-800">{profile.full_name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 capitalize">{profile.role}</span>
            </div>
          )}
          {profile && (
            <Button variant="ghost" size="sm" onClick={logout} data-testid="logout-btn" className="text-slate-600 hover:text-slate-900">
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
