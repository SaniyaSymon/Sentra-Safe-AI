import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { STATES_DISTRICTS } from '../../data/districts';
import { LANGUAGES } from '../../data/translations';
import { api, apiClient } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card } from '../ui/card';
import { Users, Radio, GraduationCap, ShieldCheck, ArrowRight, CloudRain, MapPin, Siren } from 'lucide-react';

const ROLES = [
  { key: 'citizen', icon: Users, tKey: 'role_citizen', desc: 'Report emergencies, find shelters, hospitals & colleges near you.' },
  { key: 'operator', icon: Radio, tKey: 'role_operator', desc: 'Control-room desk: live SOS queue, dispatch & incident management.' },
  { key: 'campus', icon: GraduationCap, tKey: 'role_campus', desc: 'Campus crisis coordination — professors, NCC & security teams.' },
];

export default function LoginPage() {
  const { setProfile, language, setLanguage, t } = useApp();
  const [role, setRole] = useState('citizen');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('Chennai');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [familySize, setFamilySize] = useState(2);
  const [linkedCollegeId, setLinkedCollegeId] = useState('');
  const [campusRole, setCampusRole] = useState('coordinator');
  const [colleges, setColleges] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const districts = useMemo(() => STATES_DISTRICTS[state] || [], [state]);

  useEffect(() => {
    if (!districts.includes(district)) setDistrict(districts[0] || '');
  }, [state, districts, district]);

  useEffect(() => {
    if (role === 'campus' && state && district) {
      api.listColleges({ state, district }).then(setColleges).catch(() => setColleges([]));
    }
  }, [role, state, district]);

  const canSubmit = fullName.trim() && phone.trim() && state && district && (role !== 'campus' || linkedCollegeId);

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const profile = {
      id: crypto.randomUUID(),
      role, full_name: fullName.trim(), phone: phone.trim(),
      email: email.trim() || (role === 'campus' ? 'symonsaniya@gmail.com' : ''),
      state, district, preferred_language: language,
      family_size: role === 'citizen' ? Number(familySize) : 1,
      linked_campus_id: role === 'campus' ? linkedCollegeId : null,
      campus_role: role === 'campus' ? campusRole : null,
      created_at: new Date().toISOString(),
    };
    try { await apiClient.post('/profiles', profile); } catch (_) { void 0; }
    setProfile(profile);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-white topo-pattern" data-testid="login-page">
      {/* Hero */}
      <div className="lg:w-1/2 relative flex flex-col justify-between p-8 lg:p-14 overflow-hidden bg-gradient-to-br from-white via-orange-50/40 to-teal-50/40">
        <div className="flex items-center gap-3">
          <img src="/assets/sentrasafe-logo.jpeg" alt="SentraSafe AI" className="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm" />
          <div>
            <div className="font-display font-bold text-2xl text-slate-900">SentraSafe <span className="text-orange-600">AI</span></div>
            <div className="text-sm text-slate-500">{t('tagline')}</div>
          </div>
        </div>
        <div className="max-w-lg mt-12">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05]">
            {t('welcome_back')}<br/>
            <span className="text-orange-600">SentraSafe AI</span>
          </h1>
          <p className="mt-6 text-slate-600 text-lg leading-relaxed">{t('onboard_sub')}</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[{icon: CloudRain, label: t('predict'), c:'text-teal-600 bg-teal-50 border-teal-200'},{icon: ShieldCheck, label: t('protect'), c:'text-slate-700 bg-slate-50 border-slate-200'},{icon: Siren, label: t('respond'), c:'text-orange-600 bg-orange-50 border-orange-200'}].map((x, i)=>(
              <div key={i} className={`rounded-xl border p-4 ${x.c}`}>
                <x.icon className="w-5 h-5 mb-2" />
                <div className="text-sm font-semibold">{x.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-3.5 h-3.5" /> Kerala • Tamil Nadu — Multilingual (EN / தமிழ் / മലയാളം)
        </div>
      </div>

      {/* Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-xl p-8 bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-slate-900">{t('select_role')}</h2>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-[120px] bg-white" data-testid="onboarding-lang"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-white">
                {LANGUAGES.map(l => <SelectItem key={l.code} value={l.code}>{l.native}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {ROLES.map(r => {
              const active = role === r.key;
              const Icon = r.icon;
              return (
                <button key={r.key} onClick={() => setRole(r.key)}
                  className={`text-left p-4 rounded-xl border transition-colors ${active ? 'bg-orange-50 border-orange-500 text-orange-900' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}`}
                  data-testid={`role-${r.key}`}>
                  <Icon className={`w-5 h-5 mb-2 ${active ? 'text-orange-600' : 'text-slate-500'}`} />
                  <div className="font-semibold text-sm">{t(r.tKey)}</div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mb-6 -mt-3">{ROLES.find(r => r.key === role)?.desc}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{t('full_name')}</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Ravi Kumar" data-testid="input-name" className="bg-white" />
            </div>
            <div>
              <Label>{t('phone')}</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98400 00000" data-testid="input-phone" className="bg-white" />
            </div>
            <div>
              <Label>{t('state')}</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger data-testid="select-state" className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white">
                  {Object.keys(STATES_DISTRICTS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('district')}</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger data-testid="select-district" className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-white max-h-72">
                  {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {role === 'citizen' && (
              <div>
                <Label>{t('family_size')}</Label>
                <Input type="number" min={1} value={familySize} onChange={e => setFamilySize(e.target.value)} data-testid="input-family" className="bg-white" />
              </div>
            )}
            {role === 'campus' && (
              <div className="col-span-2">
                <Label>{t('linked_campus')}</Label>
                <Select value={linkedCollegeId} onValueChange={setLinkedCollegeId}>
                  <SelectTrigger data-testid="select-campus" className="bg-white"><SelectValue placeholder="Select campus" /></SelectTrigger>
                  <SelectContent className="bg-white max-h-72">
                    {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.college_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {role === 'campus' && (
              <>
                <div className="col-span-2">
                  <Label>Campus Role</Label>
                  <Select value={campusRole} onValueChange={setCampusRole}>
                    <SelectTrigger data-testid="select-campus-role" className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="ncc">NCC Cadet</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="coordinator">Coordinator (Admin CRUD)</SelectItem>
                      <SelectItem value="admin">Campus Admin (Full CRUD)</SelectItem>
                      <SelectItem value="medical">Medical Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@campus.edu" data-testid="input-email" className="bg-white" />
                </div>
              </>
            )}
          </div>

          <Button onClick={submit} disabled={!canSubmit || submitting}
            className="w-full mt-6 h-12 bg-orange-600 hover:bg-orange-700 text-white text-base font-semibold rounded-xl"
            data-testid="onboarding-submit">
            {t('continue')} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    </div>
  );
}
