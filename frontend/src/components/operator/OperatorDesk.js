import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDistrictResources } from '../../hooks/useRealtimeData';
import { getDistrictCenter, STATES_DISTRICTS } from '../../data/districts';
import { api } from '../../lib/api';
import { supabase, isSupabaseReady, subscribeInserts } from '../../lib/supabase';
import Header from '../shared/Header';
import LiveMap from '../shared/LiveMap';
import OfflineBanner from '../shared/OfflineBanner';
import StatusBadge from '../shared/StatusBadge';
import VoiceAssistant from '../shared/VoiceAssistant';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Siren, Radio, Users, Building2, Cross, GraduationCap, Filter, Send, CheckCircle2, Truck, ShieldCheck, Radar } from 'lucide-react';

export default function OperatorDesk() {
  const { profile, t, speak } = useApp();
  const [state, setState] = useState(profile.state);
  const [district, setDistrict] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sosList, setSosList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [team, setTeam] = useState('');
  const [eta, setEta] = useState('');

  const { shelters, hospitals, colleges, hazards } = useDistrictResources(state, district === 'ALL' ? undefined : district);
  const districts = useMemo(() => ['ALL', ...(STATES_DISTRICTS[state] || [])], [state]);
  const [realtime, setRealtime] = useState({ enabled: false, count: 0 });
  const [riskDistricts, setRiskDistricts] = useState([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const load = async () => { try { const r = await api.riskHeatmap(state === 'ALL' ? {} : { state }); setRiskDistricts(r || []); } catch { /* noop */ } };
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [state]);

  useEffect(() => {
    if (!selected?.id) { setSelectedPhotos([]); return; }
    let stopped = false;
    (async () => {
      try {
        const a = await api.damageAssessments({ sos_id: selected.id });
        if (!stopped) { setSelectedPhotos(a || []); setPhotoIndex(0); }
      } catch { /* noop */ }
    })();
    return () => { stopped = true; };
  }, [selected?.id]);

  useEffect(() => {
    if (!isSupabaseReady()) return;
    setRealtime({ enabled: true, count: 0 });
    const unsub = subscribeInserts('sos_queue', null, (payload) => {
      if (payload.eventType === 'INSERT' && payload.new) {
        setSosList(list => {
          if (list.some(s => s.id === payload.new.id)) return list;
          return [payload.new, ...list];
        });
        setRealtime(r => ({ ...r, count: r.count + 1 }));
        try { new Audio('data:audio/wav;base64,UklGRhwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play().catch(()=>{}); } catch {}
      } else if (payload.eventType === 'UPDATE' && payload.new) {
        setSosList(list => list.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s));
      }
    });
    return () => unsub && unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const params = { state };
        if (district !== 'ALL') params.district = district;
        if (statusFilter !== 'ALL') params.status = statusFilter;
        const data = await api.listSOS(params);
        setSosList(data);
      } catch (e) {}
    };
    load();
    const id = setInterval(load, 3500);
    return () => clearInterval(id);
  }, [state, district, statusFilter]);

  const updateStatus = async (id, patch) => {
    try {
      const updated = await api.updateSOS(id, patch);
      setSosList(list => list.map(s => s.id === id ? updated : s));
      if (selected?.id === id) setSelected(updated);
      toast.success('Incident updated');
    } catch { toast.error('Update failed'); }
  };

  const acknowledge = (s) => updateStatus(s.id, { status: 'acknowledged', operator_status: 'ack', assigned_operator: profile.full_name });
  const dispatch = (s) => updateStatus(s.id, { status: 'dispatched', operator_status: 'dispatched', assigned_team: team || 'Rapid Response', eta_minutes: Number(eta) || 15, notes });
  const resolve = (s) => updateStatus(s.id, { status: 'resolved', operator_status: 'resolved', notes });
  const escalateCampus = async (s) => {
    if (!s.linked_college_id) { toast.error('No linked campus'); return; }
    try {
      await api.testDispatch({ channel: 'voice_call', phone: '+919999999999', message: `Critical escalation for ${s.citizen_name}`, college_id: s.linked_college_id, sos_id: s.id, critical: true });
      toast.success('Campus escalation triggered');
    } catch { toast.error('Escalation failed'); }
  };

  const center = useMemo(() => {
    if (district !== 'ALL') return getDistrictCenter(district);
    if (sosList.length) return [sosList[0].latitude, sosList[0].longitude];
    return [11.5, 78.5];
  }, [district, sosList]);

  const counts = useMemo(() => ({
    new: sosList.filter(s => s.status === 'new').length,
    ack: sosList.filter(s => s.status === 'acknowledged').length,
    disp: sosList.filter(s => s.status === 'dispatched').length,
    res: sosList.filter(s => s.status === 'resolved').length,
  }), [sosList]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="operator-desk">
      <OfflineBanner />
      <Header title="Operator Command" subtitle={`${profile.full_name} • Control Room`} />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        {/* Filters */}
        <Card className="p-3 mb-4 border-slate-200 bg-white flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-500" />
          <Select value={state} onValueChange={(v)=>{setState(v); setDistrict('ALL');}}>
            <SelectTrigger className="w-[160px] bg-white" data-testid="op-state"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">{Object.keys(STATES_DISTRICTS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={district} onValueChange={setDistrict}>
            <SelectTrigger className="w-[200px] bg-white" data-testid="op-district"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white max-h-72">{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-white" data-testid="op-status"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="new">{t('new')}</SelectItem>
              <SelectItem value="acknowledged">{t('acknowledged')}</SelectItem>
              <SelectItem value="dispatched">{t('dispatch')}</SelectItem>
              <SelectItem value="resolved">{t('resolved')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2 flex-wrap items-center">
            {realtime.enabled && (
              <div className="px-3 py-1.5 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5" data-testid="realtime-badge">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Supabase Realtime {realtime.count > 0 ? `• ${realtime.count} pushed` : ''}
              </div>
            )}
            {[
              {k:'new', v: counts.new, c: 'text-red-700 bg-red-50 border-red-200', l: t('new')},
              {k:'ack', v: counts.ack, c: 'text-amber-800 bg-amber-50 border-amber-200', l: t('acknowledged')},
              {k:'disp', v: counts.disp, c: 'text-blue-700 bg-blue-50 border-blue-200', l: t('dispatch')},
              {k:'res', v: counts.res, c: 'text-emerald-700 bg-emerald-50 border-emerald-200', l: t('resolved')},
            ].map(x => (
              <div key={x.k} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${x.c}`} data-testid={`op-count-${x.k}`}>{x.l}: {x.v}</div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-12 gap-4">
          {/* SOS Queue */}
          <Card className="col-span-12 lg:col-span-4 p-4 border-slate-200 max-h-[720px] overflow-y-auto" data-testid="sos-queue">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg flex items-center gap-2"><Siren className="w-5 h-5 text-red-600" />{t('incident_queue')}</h3>
              <div className="text-xs text-slate-500">{sosList.length} active</div>
            </div>
            {sosList.length === 0 && <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">No incoming SOS.</div>}
            <div className="space-y-2">
              {sosList.map(s => (
                <button key={s.id} onClick={() => { setSelected(s); if (s.status === 'new') speak(`New SOS from ${s.citizen_name} in ${s.district}`); }}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${selected?.id === s.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  data-testid={`sos-card-${s.incident_code}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-sm text-slate-900 truncate">{s.citizen_name}</div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{s.incident_code} • {s.hazard_type} • {s.district}, {s.state}</div>
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{s.phone}</span>
                    <span>{new Date(s.created_at).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Map + Detail */}
          <Card className="col-span-12 lg:col-span-8 p-0 border-slate-200 relative overflow-hidden" data-testid="operator-map-card">
            <div className="absolute top-3 left-3 z-[500] flex gap-2">
              <button onClick={() => setShowHeatmap(v => !v)} className={`text-xs px-3 py-1.5 rounded-full border font-semibold shadow-sm ${showHeatmap ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-700 border-slate-200'}`} data-testid="toggle-heatmap">
                {showHeatmap ? 'Risk Heatmap: ON' : 'Risk Heatmap: OFF'}
              </button>
              {riskDistricts.length > 0 && showHeatmap && (
                <div className="text-xs px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 shadow-sm">
                  <span className="font-semibold">Top:</span> {riskDistricts[0].district} ({riskDistricts[0].risk_score}/10)
                </div>
              )}
            </div>
            <LiveMap center={center} userLocation={selected ? [selected.latitude, selected.longitude] : null}
              shelters={shelters} hospitals={hospitals} colleges={colleges} hazards={hazards} incidents={sosList}
              riskDistricts={showHeatmap ? riskDistricts : []}
              height="380px" />
          </Card>

          {/* Detail panel wrapped below */}
          <div className="col-span-12 lg:col-span-8 space-y-4">
            {selected ? (
              <Card className="p-5 border-slate-200 bg-white" data-testid="sos-detail-panel">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="text-xs text-slate-500">{t('incident_id')}: {selected.incident_code}</div>
                    <div className="font-display text-2xl font-black text-slate-900">{selected.citizen_name}</div>
                    <div className="text-sm text-slate-600">{selected.phone} • {selected.district}, {selected.state} • {selected.preferred_language.toUpperCase()}</div>
                  </div>
                  <div className="flex gap-2"><StatusBadge status={selected.status} /><StatusBadge status={selected.sync_state} /></div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div><div className="text-xs text-slate-500">Hazard</div><div className="font-semibold uppercase">{selected.hazard_type}</div></div>
                  <div><div className="text-xs text-slate-500">Trapped</div><div className="font-semibold">{selected.trapped_count}</div></div>
                  <div><div className="text-xs text-slate-500">Coords</div><div className="font-semibold text-xs">{selected.latitude.toFixed(3)}, {selected.longitude.toFixed(3)}</div></div>
                  <div><div className="text-xs text-slate-500">Time</div><div className="font-semibold">{new Date(selected.created_at).toLocaleString()}</div></div>
                </div>
                {selected.details && <div className="mt-3 text-sm bg-slate-50 p-3 rounded-lg border border-slate-200"><b>Notes:</b> {selected.details}</div>}
                {selected.medical_notes && <div className="mt-2 text-sm bg-red-50 p-3 rounded-lg border border-red-200"><b>Medical:</b> {selected.medical_notes}</div>}
                {selected.photo_url && (
                  <div className="mt-3 p-3 rounded-lg border border-orange-200 bg-orange-50" data-testid="incident-photo">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-semibold text-orange-800">Damage Photos {selectedPhotos.length > 1 ? `(${photoIndex + 1}/${selectedPhotos.length})` : ''}{selected.ai_severity != null ? ` • AI severity ${selected.ai_severity}/10 (${selected.ai_severity_level || ''})` : ''}</div>
                      {selectedPhotos.length > 1 && (
                        <div className="flex gap-1">
                          <button onClick={() => setPhotoIndex(i => (i - 1 + selectedPhotos.length) % selectedPhotos.length)} className="w-7 h-7 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100" data-testid="photo-prev">‹</button>
                          <button onClick={() => setPhotoIndex(i => (i + 1) % selectedPhotos.length)} className="w-7 h-7 rounded-full bg-white border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100" data-testid="photo-next">›</button>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const active = selectedPhotos[photoIndex] || null;
                      const src = active?.photo_url || selected.photo_url;
                      const url = src?.startsWith('http') ? src : `${process.env.REACT_APP_BACKEND_URL}${src}`;
                      return <img src={url} alt="Damage" className="max-h-72 w-full rounded-lg border border-slate-200 object-contain bg-white" />;
                    })()}
                    {selectedPhotos.length > 1 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto" data-testid="photo-strip">
                        {selectedPhotos.map((p, i) => {
                          const s = p.photo_url?.startsWith('http') ? p.photo_url : `${process.env.REACT_APP_BACKEND_URL}${p.photo_url}`;
                          return (
                            <button key={p.id} onClick={() => setPhotoIndex(i)} className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 ${i === photoIndex ? 'border-orange-600' : 'border-slate-200'}`} data-testid={`photo-thumb-${i}`}>
                              <img src={s} alt="" className="w-full h-full object-cover" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {selected.ai_description && <div className="text-xs text-slate-700 mt-2"><b>AI:</b> {selected.ai_description}</div>}
                    {selected.ai_guidance_en && <div className="text-xs text-slate-700 mt-1"><b>Guidance:</b> {selected.ai_guidance_en}</div>}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Assign team" value={team} onChange={e => setTeam(e.target.value)} className="bg-white" data-testid="op-team" />
                  <Input placeholder="ETA (mins)" type="number" value={eta} onChange={e => setEta(e.target.value)} className="bg-white" data-testid="op-eta" />
                  <Input placeholder="Response notes" value={notes} onChange={e => setNotes(e.target.value)} className="bg-white" data-testid="op-notes" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => acknowledge(selected)} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="btn-ack"><CheckCircle2 className="w-4 h-4 mr-1.5" />{t('acknowledged')}</Button>
                  <Button onClick={() => dispatch(selected)} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="btn-dispatch"><Truck className="w-4 h-4 mr-1.5" />{t('dispatch')}</Button>
                  <Button onClick={() => resolve(selected)} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid="btn-resolve"><ShieldCheck className="w-4 h-4 mr-1.5" />{t('resolved')}</Button>
                  <Button variant="outline" onClick={() => escalateCampus(selected)} className="border-orange-400 text-orange-700 hover:bg-orange-50" data-testid="btn-escalate"><Send className="w-4 h-4 mr-1.5" />Escalate → Campus</Button>
                </div>
              </Card>
            ) : (
              <Card className="p-8 border-slate-200 bg-white text-center text-slate-500"><Radar className="w-8 h-8 mx-auto text-slate-400 mb-2" />Select an incident from the queue to begin response.</Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {icon: Building2, label: t('shelters'), value: shelters.length, color: 'teal'},
                {icon: Cross, label: t('hospitals'), value: hospitals.length, color: 'red'},
                {icon: GraduationCap, label: t('colleges'), value: colleges.length, color: 'orange'},
              ].map((x, i) => (
                <Card key={i} className="p-4 border-slate-200 bg-white flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-${x.color}-50 border border-${x.color}-100 flex items-center justify-center`}><x.icon className={`w-5 h-5 text-${x.color}-600`} /></div>
                  <div><div className="text-xs text-slate-500">{x.label}</div><div className="font-display text-2xl font-black">{x.value}</div></div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      <VoiceAssistant getText={() => `${sosList.length} active incidents. ${counts.new} new, ${counts.disp} dispatched.`} />
    </div>
  );
}
