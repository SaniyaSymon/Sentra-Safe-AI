import React, { useRef, useState } from 'react';
import { apiClient } from '../../lib/api';
import { supabase, isSupabaseReady } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { Camera, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import StatusBadge from './StatusBadge';

const SEVERITY_MAP = {
  minimal: { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  moderate: { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  severe: { color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  critical: { color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

export default function DamageAssessCard({ sosId, state, district, hazardType, language }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg|jpg|webp)$/i.test(file.type)) { toast.error('PNG, JPEG or WEBP only'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      setPreview(dataUrl);
      setLoading(true); setResult(null);
      // Best-effort parallel upload to Supabase Storage (mirror)
      let mirrorUrl = null;
      if (isSupabaseReady()) {
        try {
          const path = `${sosId || 'anon'}/${Date.now()}-${(file.name || 'photo').replace(/\s+/g, '_')}`;
          const { data: up, error } = await supabase.storage.from('damage-photos').upload(path, file, { upsert: false });
          if (!error && up) {
            const { data: pub } = supabase.storage.from('damage-photos').getPublicUrl(up.path);
            mirrorUrl = pub?.publicUrl || null;
          }
        } catch { /* bucket might not exist yet — ignore */ }
      }
      try {
        const { data } = await apiClient.post('/damage-assess', {
          image_base64: dataUrl, sos_id: sosId, state, district, hazard_type: hazardType, language,
          mirror_url: mirrorUrl,
        }, { timeout: 60000 });
        setResult({ ...data, mirror_url: mirrorUrl });
        toast.success(`AI: ${data.severity_level || 'assessed'}${mirrorUrl ? ' • mirrored to Supabase' : ''}`);
      } catch (err) {
        toast.error(err?.response?.data?.detail || 'Assessment failed');
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const guidance = result && (result[`guidance_${language}`] || result.guidance_en);
  const sev = result && SEVERITY_MAP[result.severity_level] || {};

  return (
    <Card className="p-5 border-slate-200 bg-white" data-testid="damage-assess-card">
      <div className="flex items-center gap-2 mb-3"><Sparkles className="w-5 h-5 text-orange-600" /><h3 className="font-display font-bold">AI Damage Assessment</h3></div>
      <p className="text-xs text-slate-500 mb-3">Attach a photo of the scene — Claude Sonnet 4.5 will score severity and suggest safety steps in your language.</p>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} data-testid="damage-file-input" />
      <div className="flex items-center gap-3">
        <Button onClick={pick} className="bg-slate-900 hover:bg-slate-800 text-white" data-testid="damage-pick-btn" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Camera className="w-4 h-4 mr-1.5" />}
          {loading ? 'Assessing…' : 'Attach damage photo'}
        </Button>
        {preview && <img src={preview} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />}
      </div>

      {result && (
        <div className={`mt-4 p-4 border rounded-xl ${sev.bg || 'bg-slate-50 border-slate-200'}`} data-testid="damage-result">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2"><AlertTriangle className={`w-4 h-4 ${sev.color || 'text-slate-600'}`} /><span className={`font-display font-black text-lg uppercase ${sev.color || 'text-slate-800'}`}>{result.severity_level || '—'}</span></div>
            <div className="text-sm font-semibold">Score: <span className={sev.color || 'text-slate-800'}>{result.severity_score ?? '—'}/10</span></div>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <StatusBadge status="synced" label={result.hazard_type || 'general'} />
          </div>
          <div className="text-sm text-slate-800 mb-2"><b>Assessment:</b> {result.damage_description}</div>
          {guidance && <div className="text-sm text-slate-700 bg-white/60 p-2 rounded border border-slate-200"><b>Guidance:</b> {guidance}</div>}
        </div>
      )}
    </Card>
  );
}
