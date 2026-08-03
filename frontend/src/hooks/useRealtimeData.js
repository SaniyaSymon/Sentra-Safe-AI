import { useEffect, useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';

// Poll-based realtime hook (fetches on interval and merges by id)
export function usePolling(fetcher, deps = [], intervalMs = 5000) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const run = useCallback(async () => {
    try {
      const res = await fetcher();
      if (!mounted.current) return;
      setData(res || []);
      setError(null);
    } catch (e) {
      if (mounted.current) setError(e);
    } finally {
      if (mounted.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mounted.current = true;
    run();
    const id = setInterval(run, intervalMs);
    return () => { mounted.current = false; clearInterval(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, intervalMs]);

  return { data, loading, error, refresh: run };
}

export function useDistrictResources(state, district) {
  const [shelters, setShelters] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!state || !district) return;
    setLoading(true);
    try {
      const [s, h, c, hz] = await Promise.all([
        api.listShelters({ state, district }),
        api.listHospitals({ state, district }),
        api.listColleges({ state, district }),
        api.listHazards({ state, district }),
      ]);
      setShelters(s || []);
      setHospitals(h || []);
      setColleges(c || []);
      setHazards(hz || []);
      // Cache offline
      try { localStorage.setItem(`ss_cache_${state}_${district}`, JSON.stringify({ s, h, c, hz, ts: Date.now() })); } catch (_) { void 0; }
    } catch (e) {
      // Try cache
      try {
        const cached = JSON.parse(localStorage.getItem(`ss_cache_${state}_${district}`) || '{}');
        if (cached.s) { setShelters(cached.s); setHospitals(cached.h); setColleges(cached.c); setHazards(cached.hz); }
      } catch (_) { void 0; }
    } finally {
      setLoading(false);
    }
  }, [state, district]);

  useEffect(() => { load(); }, [load]);

  return { shelters, hospitals, colleges, hazards, loading, refresh: load };
}
