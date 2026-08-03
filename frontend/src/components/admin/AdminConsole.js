import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../lib/api';
import Header from '../shared/Header';
import OfflineBanner from '../shared/OfflineBanner';
import StatusBadge from '../shared/StatusBadge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Crown, GraduationCap, Users, Siren, Camera, Search, ArrowLeft } from 'lucide-react';

export default function AdminConsole({ onBack }) {
  const { profile } = useApp();
  const [data, setData] = useState({ stats: {}, colleges: [], contacts: [], sos: [], assessments: [] });
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await apiClient.get('/admin/overview', { headers: { 'X-Owner-Email': profile?.email || '' } });
      setData(res.data);
    } catch (e) { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); const id = setInterval(load, 8000); return () => clearInterval(id); /* eslint-disable-next-line */ }, []);

  const filt = (arr, keys) => arr.filter(x =>
    (stateFilter === 'ALL' || x.state === stateFilter) &&
    (!q || keys.some(k => (x[k] || '').toString().toLowerCase().includes(q.toLowerCase())))
  );

  const colleges = useMemo(() => filt(data.colleges, ['college_name', 'district', 'college_type']), [data.colleges, q, stateFilter]);
  const contactMap = useMemo(() => {
    const map = {};
    for (const c of data.contacts) { (map[c.college_id] ||= []).push(c); }
    return map;
  }, [data.contacts]);
  const sos = useMemo(() => filt(data.sos, ['citizen_name', 'incident_code', 'district', 'hazard_type']), [data.sos, q, stateFilter]);

  return (
    <div className="min-h-screen bg-slate-50" data-testid="admin-console">
      <OfflineBanner />
      <Header title="Owner Admin Console" subtitle={`${profile?.email || ''} • Global oversight`} />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="outline" size="sm" onClick={onBack} data-testid="admin-back"><ArrowLeft className="w-4 h-4 mr-1.5" />Back to my desk</Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-sm font-semibold"><Crown className="w-4 h-4" />Owner mode</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {[
            { icon: GraduationCap, label: 'Colleges', value: data.stats.total_colleges || 0, color: 'text-orange-600 bg-orange-50 border-orange-100' },
            { icon: Users, label: 'Contacts', value: data.stats.total_contacts || 0, color: 'text-teal-600 bg-teal-50 border-teal-100' },
            { icon: Siren, label: 'Total SOS', value: data.stats.total_sos || 0, color: 'text-slate-700 bg-slate-50 border-slate-200' },
            { icon: Siren, label: 'Active SOS', value: data.stats.active_sos || 0, color: 'text-red-600 bg-red-50 border-red-100' },
            { icon: Camera, label: 'AI Assessments', value: data.stats.assessments || 0, color: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
          ].map((s, i) => (
            <Card key={i} className={`p-4 border ${s.color}`} data-testid={`admin-stat-${s.label}`}>
              <s.icon className="w-4 h-4 mb-2" />
              <div className="font-display text-2xl font-black">{s.value}</div>
              <div className="text-[11px] font-semibold uppercase mt-1 opacity-70">{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="p-3 mb-4 bg-white border-slate-200 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search colleges, contacts, incidents…" className="bg-white pl-9" data-testid="admin-search" />
          </div>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-[180px] bg-white" data-testid="admin-state-filter"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="ALL">All States</SelectItem>
              <SelectItem value="Kerala">Kerala</SelectItem>
              <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Tabs defaultValue="colleges">
          <TabsList className="bg-white border border-slate-200 p-1 rounded-xl grid grid-cols-3 max-w-lg">
            <TabsTrigger value="colleges" data-testid="admin-tab-colleges">Colleges ({colleges.length})</TabsTrigger>
            <TabsTrigger value="sos" data-testid="admin-tab-sos">Incidents ({sos.length})</TabsTrigger>
            <TabsTrigger value="assessments" data-testid="admin-tab-ai">AI ({(data.assessments || []).length})</TabsTrigger>
          </TabsList>

          <TabsContent value="colleges" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {colleges.map(c => {
                const cc = (contactMap[c.id] || []);
                const primary = cc.find(x => x.is_primary) || cc[0];
                return (
                  <Card key={c.id} className="p-4 border-slate-200 bg-white" data-testid={`admin-college-${c.id}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-display font-bold text-slate-900 truncate">{c.college_name}</div>
                        <div className="text-xs text-slate-500 truncate">{c.college_type} • {c.district}, {c.state}</div>
                        <div className="text-xs text-slate-500 truncate mt-1">📞 {c.contact_phone}</div>
                      </div>
                      <StatusBadge status={c.current_status || 'operational'} />
                    </div>
                    <div className="mt-2 text-xs">
                      <span className="text-slate-500">Contacts:</span> <b>{cc.length}</b> {primary && <>• Primary: <b>{primary.contact_name}</b> ({primary.role_type})</>}
                    </div>
                    {cc.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cc.slice(0, 6).map(x => (
                          <span key={x.id} className={`text-[10px] px-2 py-0.5 rounded-full border ${x.is_active === false ? 'bg-slate-100 border-slate-200 text-slate-500 line-through' : 'bg-white border-slate-200 text-slate-700'}`}>{x.role_type}</span>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
              {colleges.length === 0 && !loading && <div className="text-sm text-slate-500 p-4 bg-white border border-dashed border-slate-200 rounded-xl">No colleges match filters.</div>}
            </div>
          </TabsContent>

          <TabsContent value="sos" className="mt-4">
            <Card className="p-3 border-slate-200 bg-white">
              <div className="space-y-2 max-h-[640px] overflow-y-auto">
                {sos.length === 0 && <div className="text-sm text-slate-500 p-3">No incidents.</div>}
                {sos.map(s => (
                  <div key={s.id} className="p-3 border border-slate-200 rounded-lg flex items-center gap-3" data-testid={`admin-sos-${s.incident_code}`}>
                    {s.photo_url && <img src={`${process.env.REACT_APP_BACKEND_URL}${s.photo_url}`} alt="incident" className="w-14 h-14 rounded-lg object-cover border border-slate-200" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm truncate">{s.citizen_name} <span className="text-[11px] text-slate-500 ml-1">{s.incident_code}</span></div>
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="text-xs text-slate-500">{s.hazard_type} • {s.district}, {s.state} • {new Date(s.created_at).toLocaleString()}</div>
                      {s.ai_severity != null && <div className="text-xs text-orange-700 mt-1">AI: {s.ai_severity_level || `severity ${s.ai_severity}`} — {s.ai_description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(data.assessments || []).map(a => (
                <Card key={a.id} className="p-3 border-slate-200 bg-white" data-testid={`admin-ai-${a.id}`}>
                  {a.photo_url && <img src={a.photo_url.startsWith('http') ? a.photo_url : `${process.env.REACT_APP_BACKEND_URL}${a.photo_url}`} alt="damage" className="w-full h-40 rounded-lg object-cover border border-slate-200 mb-2" />}
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-display font-bold text-slate-900">{(a.severity_level || 'assessed').toUpperCase()}</div>
                    <div className="text-sm font-semibold">{a.severity_score ?? '—'}/10</div>
                  </div>
                  <div className="text-xs text-slate-500 mb-1">{a.state} • {a.district} • {a.hazard_type}</div>
                  <div className="text-xs text-slate-700 line-clamp-3 mb-2">{a.damage_description}</div>
                  <div className="space-y-1 text-[11px] border-t border-slate-100 pt-2">
                    {a.guidance_en && <div><span className="font-bold text-slate-600">EN:</span> <span className="text-slate-700">{a.guidance_en}</span></div>}
                    {a.guidance_ta && <div><span className="font-bold text-orange-700">TA:</span> <span className="text-slate-700">{a.guidance_ta}</span></div>}
                    {a.guidance_ml && <div><span className="font-bold text-teal-700">ML:</span> <span className="text-slate-700">{a.guidance_ml}</span></div>}
                  </div>
                </Card>
              ))}
              {(data.assessments || []).length === 0 && <div className="text-sm text-slate-500 p-4 bg-white border border-dashed border-slate-200 rounded-xl">No AI assessments yet.</div>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
