import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDistrictResources } from '../../hooks/useRealtimeData';
import { getDistrictCenter } from '../../data/districts';
import { api } from '../../lib/api';
import Header from '../shared/Header';
import LiveMap from '../shared/LiveMap';
import OfflineBanner from '../shared/OfflineBanner';
import StatusBadge from '../shared/StatusBadge';
import VoiceAssistant from '../shared/VoiceAssistant';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from 'sonner';
import { GraduationCap, Users, Phone, MessageSquare, PhoneCall, Siren, ShieldAlert, UserCircle2 } from 'lucide-react';
import CampusContactManager from './CampusContactManager';

const ROLE_META = {
  professor: { label: 'Professor', color: 'text-slate-700' },
  ncc: { label: 'NCC Cadet', color: 'text-emerald-700' },
  security: { label: 'Security', color: 'text-slate-700' },
  coordinator: { label: 'Coordinator', color: 'text-orange-700' },
  medical: { label: 'Medical Support', color: 'text-red-700' },
  admin: { label: 'Campus Admin', color: 'text-blue-700' },
};

function DirectCallBtn({ phone, testid, label }) {
  const dial = () => { if (phone) window.location.href = `tel:${phone.replace(/\s+/g,'')}`; };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white" data-testid={testid}>
          <PhoneCall className="w-3.5 h-3.5 mr-1" />{label || 'Call'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle>Place emergency call?</AlertDialogTitle>
          <AlertDialogDescription>Confirm to dial <b>{phone}</b> from this device.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={dial} className="bg-red-600 hover:bg-red-700 text-white">Call now</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function CampusDesk() {
  const { profile, t, speak, enqueueOffline, isOnline } = useApp();
  const [college, setCollege] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [sosList, setSosList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [testPhone, setTestPhone] = useState('+91-9999999999');
  const [testMsg, setTestMsg] = useState('SentraSafe AI — Campus safety test alert.');

  const { shelters, hospitals, hazards } = useDistrictResources(profile.state, profile.district);
  const center = useMemo(() => getDistrictCenter(profile.district), [profile.district]);

  const loadAll = async () => {
    try {
      const [cols, cc, sos, notifs] = await Promise.all([
        api.listColleges({ state: profile.state, district: profile.district }),
        profile.linked_campus_id ? api.listCampusContacts({ college_id: profile.linked_campus_id }) : Promise.resolve([]),
        profile.linked_campus_id ? api.listSOS({ college_id: profile.linked_campus_id }) : Promise.resolve([]),
        api.listNotifications({ target_role: 'campus', target_entity_id: profile.linked_campus_id }),
      ]);
      setCollege(cols.find(c => c.id === profile.linked_campus_id) || cols[0] || null);
      setContacts(cc);
      setSosList(sos);
      setNotifications(notifs);
    } catch (_) { void 0; }
  };

  useEffect(() => {
    loadAll();
    const id = setInterval(loadAll, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.linked_campus_id, profile.state, profile.district]);

  const sendTest = async (channel, critical = false, phone = null) => {
    const payload = { channel, phone: phone || testPhone, message: testMsg, college_id: profile.linked_campus_id, critical };
    if (!isOnline) {
      enqueueOffline({ type: 'dispatch', payload });
      toast.warning('Queued offline. Will send when online.');
      return;
    }
    try {
      const res = await api.testDispatch(payload);
      toast.success(`${channel === 'sms' ? 'SMS' : 'Call'} → ${res.delivery_status}`);
      speak(critical ? 'Critical campus escalation dispatched.' : 'Test message sent.');
    } catch { toast.error('Dispatch failed. Queued.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="campus-desk">
      <OfflineBanner />
      <Header title="Campus Desk" subtitle={`${college?.college_name || 'Loading...'} • ${profile.district}, ${profile.state}`} />
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 grid grid-cols-12 gap-4">
        {/* Left: campus profile + contacts */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card className="p-5 border-slate-200 bg-white" data-testid="campus-profile">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-orange-600" /></div>
              <div>
                <div className="font-display font-bold text-lg text-slate-900">{college?.college_name || '—'}</div>
                <div className="text-xs text-slate-500">{college?.college_type} • {college?.district}, {college?.state}</div>
              </div>
            </div>
            <div className="text-sm text-slate-600">{college?.address}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {college?.can_be_relief_center && <StatusBadge status="synced" label="Relief Center" />}
              <StatusBadge status={college?.current_status || 'operational'} />
            </div>
          </Card>

          <Card className="p-5 border-slate-200 bg-white" data-testid="contact-roster">
            <div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5 text-slate-700" /><h3 className="font-display font-bold">{t('contact_roster')}</h3></div>
            {contacts.length === 0 && <div className="text-sm text-slate-500">No contacts configured.</div>}
            <div className="space-y-2">
              {contacts.map(c => (
                <div key={c.id} className="p-3 border border-slate-200 rounded-lg" data-testid={`contact-${c.id}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCircle2 className="w-4 h-4 text-slate-500" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{c.contact_name}</div>
                        <div className={`text-xs ${ROLE_META[c.role_type]?.color || 'text-slate-500'}`}>{ROLE_META[c.role_type]?.label || c.role_type}</div>
                      </div>
                    </div>
                    {c.is_primary && <StatusBadge status="synced" label="Primary" />}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" onClick={() => sendTest('sms', false, c.phone)} data-testid={`sms-${c.id}`}><MessageSquare className="w-3.5 h-3.5 mr-1" />SMS</Button>
                    <DirectCallBtn phone={c.phone} testid={`call-${c.id}`} />
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</div>
                </div>
              ))}
            </div>
          </Card>

          <CampusContactManager collegeId={profile.linked_campus_id} contacts={contacts} onChanged={loadAll} />

          <Card className="p-5 border-slate-200 bg-white" data-testid="test-panel">
            <div className="flex items-center gap-2 mb-3"><ShieldAlert className="w-5 h-5 text-orange-600" /><h3 className="font-display font-bold">Test & Escalate</h3></div>
            <div className="space-y-2">
              <div><Label>Test Phone</Label><Input value={testPhone} onChange={e => setTestPhone(e.target.value)} className="bg-white" data-testid="test-phone" /></div>
              <div><Label>Message</Label><Input value={testMsg} onChange={e => setTestMsg(e.target.value)} className="bg-white" data-testid="test-msg" /></div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" onClick={() => sendTest('sms', false)} data-testid="btn-test-sms"><MessageSquare className="w-4 h-4 mr-1.5" />{t('send_test_sms')}</Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => sendTest('voice_call', true)} data-testid="btn-critical-call"><PhoneCall className="w-4 h-4 mr-1.5" />{t('trigger_critical_call')}</Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: alerts + map + local incidents */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <Card className="p-5 border-slate-200 bg-white" data-testid="campus-alerts">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2"><Siren className="w-5 h-5 text-red-600" /><h3 className="font-display font-bold text-lg">{t('campus_alerts')}</h3></div>
              <div className="text-xs text-slate-500">{sosList.length} linked</div>
            </div>
            {sosList.length === 0 && <div className="text-sm text-slate-500 p-4 bg-slate-50 rounded-lg">No campus-linked alerts.</div>}
            <div className="space-y-2">
              {sosList.map(s => (
                <div key={s.id} className="p-3 border border-red-200 bg-red-50 rounded-lg" data-testid={`campus-alert-${s.incident_code}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-slate-900">{s.citizen_name}</div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="text-xs text-slate-600">{s.incident_code} • {s.hazard_type} • {s.district}, {s.state} • {s.phone}</div>
                  {s.details && <div className="text-xs text-slate-700 mt-1">{s.details}</div>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0 overflow-hidden border-slate-200">
            <LiveMap center={center} shelters={shelters} hospitals={hospitals} colleges={college ? [college] : []} hazards={hazards} incidents={sosList} height="360px" />
          </Card>

          <Card className="p-5 border-slate-200 bg-white">
            <h3 className="font-display font-bold text-lg mb-3">Delivery Log</h3>
            {notifications.length === 0 ? (
              <div className="text-sm text-slate-500">No dispatches yet.</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.slice(0, 15).map(n => (
                  <div key={n.id} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg text-sm">
                    <div>
                      <div className="font-semibold text-slate-800">{n.message_title}</div>
                      <div className="text-xs text-slate-500">{n.delivery_channel} • {new Date(n.created_at).toLocaleTimeString()}</div>
                    </div>
                    <StatusBadge status={n.delivery_status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
      <VoiceAssistant getText={() => `Campus desk. ${sosList.length} linked incidents.`} />
    </div>
  );
}
