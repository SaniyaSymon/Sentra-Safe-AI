# SentraSafe AI — Supabase Setup Guide

The app can run in two modes:
1. **FastAPI + MongoDB** (current default) — fully working out of the box.
2. **Supabase** (hybrid, opt-in) — set the two env vars below and the frontend will start using Supabase for realtime SOS + optional damage photo storage. All schema is provided.

## 1. Environment Variables

Add these to `/app/frontend/.env` (Create-React-App requires the `REACT_APP_` prefix; the `VITE_` names you shared are the same values):

```bash
REACT_APP_SUPABASE_URL=https://nxqehlquuckmkzfjzrko.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_3VcUVaMsw-mOEQYEVjJZDQ_1fMHwyn1
```

Restart the frontend after editing (`sudo supervisorctl restart frontend`).

## 2. Run the SQL

In your Supabase Dashboard → **SQL Editor** → new query, paste and run in order:

1. `supabase/schema.sql` — creates all 12 tables, indexes, and RLS policies.
2. `supabase/seed.sql` — seeds Kerala + Tamil Nadu districts, colleges (incl. Nandha), shelters, hospitals, hazards, and 6-role campus contacts per college.

## 3. Enable Realtime

Dashboard → **Database → Replication → `supabase_realtime`** publication → add these tables:
- `sos_queue`
- `notifications`
- `campus_contacts`

(Or run in SQL editor:
```sql
alter publication supabase_realtime add table public.sos_queue;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.campus_contacts;
```)

## 4. Create Storage bucket (for AI damage photos)

Dashboard → **Storage → New bucket** → name `damage-photos`, set to **public** (read).
Then in **Policies → damage-photos → New policy** allow `INSERT` for the `anon` role.

## 5. Verify

- Open the app → sign up as owner `symonsaniya@gmail.com` via Supabase Auth (Dashboard → Authentication → Users → invite).
- Trigger an SOS from the Citizen portal.
- Operator Desk should receive the new row in <1 s via the Supabase Realtime channel.

## Owner / Super-admin

`symonsaniya@gmail.com` is seeded as `campus_role = 'admin'` and linked to **Nandha College of Technology, Erode**. Owner has full write access to every table via RLS `owner full …` policies keyed off the JWT email claim.
