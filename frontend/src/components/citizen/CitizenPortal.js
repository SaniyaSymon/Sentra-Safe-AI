import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useDistrictResources } from '../../hooks/useRealtimeData';
import { getDistrictCenter, STATES_DISTRICTS } from '../../data/districts';
import { api } from '../../lib/api';
import Header from '../shared/Header';
import LiveMap from '../shared/LiveMap';
import OfflineBanner from '../shared/OfflineBanner';
import StatusBadge from '../shared/StatusBadge';
import VoiceAssistant from '../shared/VoiceAssistant';
import MobileBottomNav from '../shared/MobileBottomNav';
import DamageAssessCard from '../shared/DamageAssessCard';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from 'sonner';
import { Home, Boxes, Map, Siren, BellRing, Settings, Building2, Cross, GraduationCap, Phone, Navigation, Waves, Mountain, Activity, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

function CallButton({ phone, testid, critical = false, label }) {
  const dial = () => { if (phone) window.location.href = `tel:${phone.replace(/\s+/g,'')}`; };
  if (!critical) {
    return (
      <Button size="sm" variant="outline" className="flex-1" onClick={dial} data-testid={testid}>
        <Phone className="w-3.5 h-3.5 mr-1.5" /> {label || phone}
      </Button>
    );
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1" data-testid={testid}>
          <Phone className="w-3.5 h-3.5 mr-1.5" /> {label || phone}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Emergency Call</AlertDialogTitle>
          <AlertDialogDescription>You are about to place an emergency call to <b>{phone}</b>. Continue?</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid={`${testid}-cancel`}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={dial} className="bg-red-600 hover:bg-red-700 text-white" data-testid={`${testid}-confirm`}>Call now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ResourceCard({ icon: Icon, title, subtitle, badges = [], phone, address, onNavigate, testid, critical = false }) {
  return (
    <Card className="p-5 bg-white border border-slate-200 hover:border-orange-300 transition-colors" data-testid={testid}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-orange-600" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-bold text-slate-900 truncate">{title}</div>
            <div className="text-xs text-slate-500 truncate">{subtitle}</div>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {badges.map((b, i) => <StatusBadge key={i} status={b.status} label={b.label} />)}
      </div>
      <div className="mt-3 text-xs text-slate-600 line-clamp-2">{address}</div>
      <div className="mt-4 flex items-center gap-2">
        <CallButton phone={phone} testid={`${testid}-call`} critical={critical} />
        <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" onClick={onNavigate} data-testid={`${testid}-nav`}>
          <Navigation className="w-3.5 h-3.5 mr-1.5" /> Route
        </Button>
      </div>
    </Card>
  );
}

function SOSButton({ onFire, disabled }) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const { t } = useApp();

  useEffect(() => {
    if (!holding) { setProgress(0); return; }
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 2000) * 100);
      setProgress(p);
      if (p >= 100) { clearInterval(id); setHolding(false); onFire(); }
    }, 40);
    return () => clearInterval(id);
  }, [holding, onFire]);

  return (
    <div className="flex flex-col items-center justify-center py-6" data-testid="sos-holder">
      <button
        disabled={disabled}
        onMouseDown={() => setHolding(true)} onMouseUp={() => setHolding(false)} onMouseLeave={() => setHolding(false)}
        onTouchStart={() => setHolding(true)} onTouchEnd={() => setHolding(false)}
        className={`relative w-52 h-52 rounded-full text-white font-display font-black text-2xl flex flex-col items-center justify-center select-none transition-transform active:scale-95 ${disabled ? 'bg-slate-300 cursor-not-allowed' : 'bg-red-600 sos-pulse hover:bg-red-700'}`}
        data-testid="sos-trigger-btn"
      >
        <Siren className="w-10 h-10 mb-2" />
        SOS
        <div className="text-xs font-semibold mt-1 opacity-90 px-4 text-center">{t('hold_to_activate')}</div>
      </button>
      <div className="w-52 mt-4">
        <Progress value={progress} className="h-2" />
      </div>
    </div>
  );
}

export default function CitizenPortal() {
  const { profile, t, language, speak, enqueueOffline, isOnline } = useApp();
  const [district, setDistrict] = useState(profile.district);
  const [state, setState] = useState(profile.state);
  const [routeTo, setRouteTo] = useState(null);
  const [userLocation, setUserLocation] = useState(getDistrictCenter(profile.district));
  const [activeSOS, setActiveSOS] = useState(() => { try { return JSON.parse(localStorage.getItem('ss_active_sos')||'null'); } catch { return null; }});
  const [sosDetails, setSosDetails] = useState({ trapped_count: profile.family_size || 1, medical_notes: '', details: '', hazard_type: 'flood' });
  const [notifications, setNotifications] = useState([]);

  const [activeTab, setActiveTab] = useState('dashboard');
  const { shelters, hospitals, colleges, hazards, loading, refresh } = useDistrictResources(state, district);
  const districts = useMemo(() => STATES_DISTRICTS[state] || [], [state]);
  const center = useMemo(() => getDistrictCenter(district), [district]);

  useEffect(() => { setUserLocation(center); }, [center]);

  useEffect(() => {
    if (!activeSOS?.id) return;
    const id = setInterval(async () => {
      try { const s = await api.getSOS(activeSOS.id); setActiveSOS(s); localStorage.setItem('ss_active_sos', JSON.stringify(s)); } catch (_) { void 0; }
    }, 4000);
    return () => clearInterval(id);
  }, [activeSOS?.id]);

  useEffect(() => {
    const load = async () => {
      try { const n = await api.listNotifications({ target_role: 'citizen' }); setNotifications(n); } catch (_) { void 0; }
    };
    load();
    const id = setInterval(load, 6000);
    return () => clearInterval(id);
  }, []);

  const fireSOS = async () => {
    const payload = {
      citizen_name: profile.full_name, phone: profile.phone,
      latitude: userLocation[0], longitude: userLocation[1],
      hazard_type: sosDetails.hazard_type, details: sosDetails.details,
      district, state, preferred_language: language,
      linked_college_id: profile.linked_campus_id || null,
      trapped_count: Number(sosDetails.trapped_count) || 1,
      medical_notes: sosDetails.medical_notes,
    };
    if (!isOnline) {
      enqueueOffline({ type: 'sos_create', payload });
      const local = { ...payload, id: 'local-' + Date.now(), incident_code: 'LOCAL-' + Date.now(), status: 'new', sync_state: 'queued_offline', created_at: new Date().toISOString() };
      setActiveSOS(local); localStorage.setItem('ss_active_sos', JSON.stringify(local));
      toast.warning('SOS queued offline. Will sync when online.');
      speak(t('sos_sent'));
      return;
    }
    try {
      const sos = await api.createSOS(payload);
      setActiveSOS(sos); localStorage.setItem('ss_active_sos', JSON.stringify(sos));
      toast.success(t('sos_sent'));
      speak(t('sos_sent'));
    } catch (e) {
      toast.error('Failed. Queued locally.');
      enqueueOffline({ type: 'sos_create', payload });
    }
  };

  const resetSOS = () => { setActiveSOS(null); localStorage.removeItem('ss_active_sos'); };

  const riskLevel = useMemo(() => {
    if (!hazards.length) return { level: 'stable', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' };
    const worst = hazards.reduce((a, b) => (['severe','high','medium','low'].indexOf(a.risk_level) < ['severe','high','medium','low'].indexOf(b.risk_level) ? a : b));
    const map = { severe: {level:'escalated',color:'text-red-700',bg:'bg-red-50 border-red-200'}, high: {level:'escalated',color:'text-orange-700',bg:'bg-orange-50 border-orange-200'}, medium: {level:'early_warning',color:'text-amber-700',bg:'bg-amber-50 border-amber-200'}, low: {level:'stable',color:'text-emerald-700',bg:'bg-emerald-50 border-emerald-200'} };
    return { ...map[worst.risk_level], zone: worst };
  }, [hazards]);

  const speakSummary = () => {
    const text = `${t('app_name')}. ${district}, ${state}. ${shelters.length} ${t('shelters')}, ${hospitals.length} ${t('hospitals')}, ${colleges.length} ${t('colleges')}. Risk: ${t(riskLevel.level)}.`;
    speak(text);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="citizen-portal">
      <OfflineBanner />
      <Header title={t('app_name')} subtitle={`${profile.full_name} • ${district}, ${state}`} />

      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {activeSOS && (
          <div className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 flex items-center justify-between gap-4" data-testid="active-sos-banner">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-red-600 flex items-center justify-center sos-pulse"><Siren className="w-5 h-5 text-white" /></div>
              <div>
                <div className="font-display font-bold text-red-800">{t('active_sos_banner')}</div>
                <div className="text-xs text-red-700">{t('incident_id')}: {activeSOS.incident_code} • Status: <b className="uppercase">{activeSOS.status}</b> • Sync: {activeSOS.sync_state}</div>
              </div>
            </div>
            <Button variant="outline" onClick={resetSOS} className="border-red-300 text-red-700 hover:bg-red-100" data-testid="reset-sos-btn">{t('reset_sos')}</Button>
          </div>
        )}

        {/* District selector */}
        <Card className="p-4 mb-4 bg-white border border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 mr-2"><Activity className="w-4 h-4 text-orange-600" /> Live Context</div>
          <Select value={state} onValueChange={(v)=>{setState(v); const d=(STATES_DISTRICTS[v]||[])[0]; if(d) setDistrict(d);}}>
            <SelectTrigger className="w-[160px] bg-white" data-testid="citizen-state"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">{Object.keys(STATES_DISTRICTS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-[200px] bg-white" data-testid="citizen-district"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white max-h-72">{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refresh} data-testid="refresh-btn"><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Refresh</Button>
          <div className={`ml-auto text-sm px-3 py-1.5 rounded-full border ${riskLevel.bg}`}>
            <span className="font-semibold">Risk:</span> <span className={`font-bold ${riskLevel.color}`}>{t(riskLevel.level).toUpperCase()}</span>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="hidden lg:grid bg-white border border-slate-200 p-1 rounded-xl grid-cols-6 max-w-3xl">
            <TabsTrigger value="dashboard" data-testid="tab-dashboard"><Home className="w-4 h-4 mr-1.5" />{t('dashboard')}</TabsTrigger>
            <TabsTrigger value="resources" data-testid="tab-resources"><Boxes className="w-4 h-4 mr-1.5" />{t('resources')}</TabsTrigger>
            <TabsTrigger value="map" data-testid="tab-map"><Map className="w-4 h-4 mr-1.5" />{t('map')}</TabsTrigger>
            <TabsTrigger value="sos" data-testid="tab-sos"><Siren className="w-4 h-4 mr-1.5" />{t('sos')}</TabsTrigger>
            <TabsTrigger value="alerts" data-testid="tab-alerts"><BellRing className="w-4 h-4 mr-1.5" />{t('alerts')}</TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings"><Settings className="w-4 h-4 mr-1.5" />{t('settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {label: t('shelters'), value: shelters.length, icon: Building2, color: 'teal'},
                {label: t('hospitals'), value: hospitals.length, icon: Cross, color: 'red'},
                {label: t('colleges'), value: colleges.length, icon: GraduationCap, color: 'orange'},
                {label: 'Hazards', value: hazards.length, icon: AlertTriangle, color: 'amber'},
              ].map((c, i) => (
                <Card key={i} className="p-5 bg-white border border-slate-200" data-testid={`stat-${c.label}`}>
                  <div className={`w-10 h-10 rounded-lg bg-${c.color}-50 border border-${c.color}-100 flex items-center justify-center mb-3`}>
                    <c.icon className={`w-5 h-5 text-${c.color}-600`} />
                  </div>
                  <div className="font-display text-3xl font-black text-slate-900">{c.value}</div>
                  <div className="text-sm text-slate-500 mt-1">{c.label} in {district}</div>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
              <Card className="lg:col-span-2 p-0 overflow-hidden border-slate-200">
                <LiveMap center={center} userLocation={userLocation} shelters={shelters} hospitals={hospitals} colleges={colleges} hazards={hazards} routeTo={routeTo} onSelectResource={(r)=>setRouteTo(r)} height="420px" />
              </Card>
              <Card className={`p-6 border ${riskLevel.bg}`} data-testid="risk-panel">
                <div className="flex items-center gap-2 mb-2"><Mountain className="w-5 h-5" /><span className="font-semibold">{t('risk_analyzer')}</span></div>
                <div className={`font-display text-3xl font-black ${riskLevel.color}`}>{t(riskLevel.level).toUpperCase()}</div>
                <div className="text-xs text-slate-600 mt-1">{riskLevel.zone ? `${riskLevel.zone.name} • ${riskLevel.zone.hazard_type}` : 'No active hazard zones detected'}</div>
                <div className="mt-4 space-y-2">
                  {hazards.slice(0, 3).map(h => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">{h.hazard_type === 'flood' ? <Waves className="w-4 h-4 text-blue-600" /> : <Mountain className="w-4 h-4 text-amber-700" />}<span className="truncate">{h.name}</span></div>
                      <StatusBadge status={h.risk_level} />
                    </div>
                  ))}
                </div>
                <Button className="mt-4 w-full bg-slate-900 text-white hover:bg-slate-800" onClick={speakSummary} data-testid="speak-summary-btn">
                  {t('voice_read_summary')}
                </Button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="resources" className="mt-4 space-y-6">
            {[
              { title: t('shelters'), icon: Building2, items: shelters, testid: 'shelter', render: (s) => (
                <ResourceCard key={s.id} icon={Building2} testid={`shelter-${s.id}`} title={s.shelter_name} subtitle={`${s.state} • ${s.district}`} address={s.address} phone={s.contact_phone}
                  badges={[{status: s.status||'active'}, {status: 'operational', label: `${s.max_capacity - s.occupied_spots}/${s.max_capacity} avail`}]}
                  onNavigate={() => setRouteTo(s)} />
              )},
              { title: t('hospitals'), icon: Cross, items: hospitals, testid: 'hospital', render: (h) => (
                <ResourceCard key={h.id} icon={Cross} testid={`hospital-${h.id}`} title={h.hospital_name} subtitle={`${h.hospital_type} • ${h.district}`} address={h.address} phone={h.contact_phone}
                  badges={[{status: h.status||'operational'}, {status: 'operational', label: `${h.available_beds} beds`}]}
                  onNavigate={() => setRouteTo(h)} critical />
              )},
              { title: t('colleges'), icon: GraduationCap, items: colleges, testid: 'college', render: (c) => (
                <ResourceCard key={c.id} icon={GraduationCap} testid={`college-${c.id}`} title={c.college_name} subtitle={`${c.college_type} • ${c.district}`} address={c.address} phone={c.contact_phone}
                  badges={[{status: c.current_status||'operational'}, c.can_be_relief_center ? {status: 'synced', label: 'Relief Center'} : null].filter(Boolean)}
                  onNavigate={() => setRouteTo(c)} />
              )},
            ].map((grp, gi) => (
              <div key={gi}>
                <div className="flex items-center gap-2 mb-3"><grp.icon className="w-5 h-5 text-orange-600" /><h3 className="font-display font-bold text-lg text-slate-900">{grp.title} ({grp.items.length})</h3></div>
                {grp.items.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-testid={`${grp.testid}-grid`}>{grp.items.map(grp.render)}</div>
                ) : (
                  <div className="text-sm text-slate-500 p-4 bg-white border border-dashed border-slate-200 rounded-xl">No {grp.title.toLowerCase()} in this district yet.</div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="map" className="mt-4">
            <Card className="p-0 overflow-hidden border-slate-200">
              <LiveMap center={center} userLocation={userLocation} shelters={shelters} hospitals={hospitals} colleges={colleges} hazards={hazards} routeTo={routeTo} onSelectResource={(r)=>setRouteTo(r)} height="640px" />
            </Card>
            {routeTo && (
              <Card className="mt-3 p-4 border-orange-200 bg-orange-50">
                <div className="flex items-center gap-2 text-orange-900"><Navigation className="w-4 h-4" /><span className="font-semibold">Route active to: {routeTo.shelter_name || routeTo.hospital_name || routeTo.college_name}</span></div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sos" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="p-6 border-slate-200">
                <SOSButton onFire={fireSOS} disabled={!!activeSOS} />
                {activeSOS && <div className="text-center text-sm text-emerald-700 font-semibold">{t('sos_sent')}</div>}
              </Card>
              <Card className="p-6 border-slate-200">
                <h3 className="font-display font-bold text-lg mb-3">{t('situation_notes')}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Hazard Type</Label>
                    <Select value={sosDetails.hazard_type} onValueChange={v => setSosDetails(s => ({...s, hazard_type: v}))}>
                      <SelectTrigger className="bg-white" data-testid="sos-hazard"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="flood">{t('flood')}</SelectItem>
                        <SelectItem value="landslide">{t('landslide')}</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('trapped_count')}</Label>
                    <Input type="number" min={1} value={sosDetails.trapped_count} onChange={e => setSosDetails(s => ({...s, trapped_count: e.target.value}))} className="bg-white" data-testid="sos-trapped" />
                  </div>
                  <div className="col-span-2">
                    <Label>{t('medical_notes')}</Label>
                    <Textarea rows={2} value={sosDetails.medical_notes} onChange={e => setSosDetails(s => ({...s, medical_notes: e.target.value}))} className="bg-white" data-testid="sos-medical" />
                  </div>
                  <div className="col-span-2">
                    <Label>{t('situation_notes')}</Label>
                    <Textarea rows={3} value={sosDetails.details} onChange={e => setSosDetails(s => ({...s, details: e.target.value}))} className="bg-white" data-testid="sos-details" />
                  </div>
                </div>
              </Card>
            </div>
            <div className="mt-4">
              <DamageAssessCard sosId={activeSOS?.id} state={state} district={district} hazardType={sosDetails.hazard_type} language={language} />
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="mt-4">
            <Card className="p-4 border-slate-200">
              <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><BellRing className="w-5 h-5 text-orange-600" />{t('alerts')}</h3>
              {notifications.length === 0 ? (
                <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">No alerts yet.</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <div key={n.id} className="p-3 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm text-slate-900">{n.message_title}</div>
                        <div className="text-xs text-slate-500">{n.message_body}</div>
                      </div>
                      <StatusBadge status={n.delivery_status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-4">
            <Card className="p-6 border-slate-200 max-w-lg">
              <h3 className="font-display font-bold text-lg mb-4">{t('settings')}</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">{t('full_name')}</span><span className="font-semibold">{profile.full_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('phone')}</span><span className="font-semibold">{profile.phone}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('state')}</span><span className="font-semibold">{state}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('district')}</span><span className="font-semibold">{district}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('language')}</span><span className="font-semibold">{language.toUpperCase()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('family_size')}</span><span className="font-semibold">{profile.family_size}</span></div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <VoiceAssistant getText={() => `${district}, ${state}. ${shelters.length} shelters, ${hospitals.length} hospitals, ${colleges.length} colleges. Risk ${riskLevel.level}.`} />
      <MobileBottomNav active={activeTab} onChange={setActiveTab} t={t} />
      <div className="lg:hidden h-20" />
    </div>
  );
}
