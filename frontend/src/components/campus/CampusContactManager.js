import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Power, Trash2, ShieldCheck } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'professor', label: 'Professor' },
  { value: 'ncc', label: 'NCC Cadet' },
  { value: 'security', label: 'Security' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'medical', label: 'Medical Support' },
  { value: 'admin', label: 'Campus Admin' },
];

export default function CampusContactManager({ collegeId, contacts, onChanged }) {
  const { profile } = useApp();
  const canEdit = profile?.campus_role === 'coordinator' || profile?.campus_role === 'admin';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ contact_name: '', role_type: 'professor', phone: '', is_primary: false });

  useEffect(() => {
    if (editing) {
      setForm({ contact_name: editing.contact_name, role_type: editing.role_type, phone: editing.phone, is_primary: !!editing.is_primary });
    } else {
      setForm({ contact_name: '', role_type: 'professor', phone: '', is_primary: false });
    }
  }, [editing, open]);

  if (!canEdit) return null;

  const headers = { 'x-campus-role': profile.campus_role };

  const save = async () => {
    if (!form.contact_name.trim() || !form.phone.trim()) { toast.error('Name and phone required'); return; }
    const normalized = form.phone.trim().startsWith('+') ? form.phone.trim() : `+91${form.phone.trim().replace(/\D/g,'').slice(-10)}`;
    const payload = { ...form, phone: normalized, college_id: collegeId };
    try {
      if (editing) {
        await apiClient.patch(`/campus-contacts/${editing.id}`, { contact_name: payload.contact_name, role_type: payload.role_type, phone: payload.phone, is_primary: payload.is_primary }, { headers });
        toast.success('Contact updated');
      } else {
        await apiClient.post('/campus-contacts', payload, { headers });
        toast.success('Contact added');
      }
      setOpen(false); setEditing(null); onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Save failed');
    }
  };

  const toggleActive = async (c) => {
    try {
      await apiClient.patch(`/campus-contacts/${c.id}`, { is_active: !c.is_active }, { headers });
      toast.success(c.is_active ? 'Deactivated' : 'Reactivated');
      onChanged?.();
    } catch { toast.error('Update failed'); }
  };

  const remove = async (c) => {
    try { await apiClient.delete(`/campus-contacts/${c.id}?hard=true`, { headers }); toast.success('Deleted'); onChanged?.(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <Card className="p-4 border-orange-200 bg-orange-50/40" data-testid="campus-crud">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-orange-600" /><h4 className="font-display font-bold">Manage Contacts</h4></div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" data-testid="crud-add-btn"><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader><DialogTitle>{editing ? 'Edit Contact' : 'Add Emergency Contact'}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={form.contact_name} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))} className="bg-white" data-testid="crud-name" /></div>
              <div><Label>Role</Label>
                <Select value={form.role_type} onValueChange={v => setForm(f => ({...f, role_type: v}))}>
                  <SelectTrigger className="bg-white" data-testid="crud-role"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white">
                    {ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Phone (+91… or 10 digits)</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="bg-white" data-testid="crud-phone" /></div>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.is_primary} onChange={e => setForm(f => ({...f, is_primary: e.target.checked}))} data-testid="crud-primary" />Primary contact</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={save} data-testid="crud-save">{editing ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-1.5 max-h-64 overflow-y-auto">
        {contacts.length === 0 && <div className="text-xs text-slate-500">No contacts yet.</div>}
        {contacts.map(c => (
          <div key={c.id} className={`flex items-center justify-between p-2 rounded border ${c.is_active === false ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200'}`}>
            <div className="text-xs min-w-0">
              <div className="font-semibold text-slate-800 truncate">{c.contact_name} <span className="text-[10px] text-slate-500 uppercase ml-1">{c.role_type}</span></div>
              <div className="text-[11px] text-slate-500">{c.phone}</div>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditing(c); setOpen(true); }} data-testid={`edit-${c.id}`}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleActive(c)} data-testid={`toggle-${c.id}`}><Power className={`w-3.5 h-3.5 ${c.is_active === false ? 'text-slate-400' : 'text-emerald-600'}`} /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" data-testid={`del-${c.id}`}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white">
                  <AlertDialogHeader><AlertDialogTitle>Delete contact?</AlertDialogTitle><AlertDialogDescription>This permanently removes <b>{c.contact_name}</b>.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700 text-white" onClick={() => remove(c)}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
