import { createClient } from '@supabase/supabase-js';

const url = process.env.REACT_APP_SUPABASE_URL;
const anon = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = url && anon
  ? createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      realtime: { params: { eventsPerSecond: 10 } },
    })
  : null;

export const isSupabaseReady = () => !!supabase;

// Realtime helper: subscribe to a table's INSERT events
export function subscribeInserts(table, filter, callback) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`rt-${table}-${Math.random().toString(36).slice(2, 8)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table, filter }, (payload) => {
      try { callback(payload); } catch (_) { void 0; }
    })
    .subscribe();
  return () => { try { supabase.removeChannel(channel); } catch (_) { void 0; } };
}

// Storage helper for damage photos
export async function uploadDamagePhoto(file, sosId) {
  if (!supabase) return null;
  const path = `${sosId || 'anon'}/${Date.now()}-${(file.name || 'photo').replace(/\s+/g, '_')}`;
  const { data, error } = await supabase.storage.from('damage-photos').upload(path, file, { upsert: false });
  if (error) return null;
  const { data: pub } = supabase.storage.from('damage-photos').getPublicUrl(data.path);
  return pub?.publicUrl || null;
}
