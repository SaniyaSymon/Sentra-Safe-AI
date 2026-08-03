# SentraSafe AI — PRD

## Problem Statement (Original)
Build a complete production-ready multilingual emergency response platform called **SentraSafe AI** with 3 fully integrated desks (Citizen Portal, Operator Desk, Campus Desk) covering Kerala & Tamil Nadu with EN/TA/ML support, realtime SOS, live map, offline queue, risk analyzer, and campus SMS/call test flow. Logo attached.

## Tech Stack (chosen)
- Backend: FastAPI + MongoDB (Motor)
- Frontend: React 19 (JS) + Tailwind + Shadcn UI + Lucide + react-leaflet
- Voice: Browser SpeechSynthesis (EN/TA/ML)
- Map: Leaflet + OpenStreetMap (no key required)
- SMS/Voice call: mocked provider architecture (Twilio-ready)
- Realtime: HTTP polling (3.5–6s cadence)

## Architecture
- `backend/server.py` — all 11 collections (user_profiles, hazard_zones, shelters, hospitals, colleges, campus_contacts, incidents, sos_queue, notifications, emergency_dispatch, app_settings). Startup auto-seeds fallback data for Chennai/Coimbatore/Nilgiris/Wayanad/Idukki/Thrissur/Kollam/TVM.
- `frontend/src/context/AppContext.js` — global profile, language, online/offline, voice, offline-queue helpers.
- `frontend/src/data/districts.js` — full Kerala (14) + Tamil Nadu (38) districts + centers.
- `frontend/src/data/translations.js` — EN/TA/ML dictionaries.
- `frontend/src/components/{auth,citizen,operator,campus,shared,ui}` — desks + shared components.

## Personas
1. **Citizen** — reports SOS, finds shelters/hospitals/colleges, sees hazard risk.
2. **Operator** — control-room; live queue; acknowledge → dispatch → resolve; campus escalation.
3. **Campus** — professor/NCC/security/coordinator; receives linked SOS; test SMS/critical call.

## Implemented (v1 — 2026-07-30)
- Login/onboarding (role + state + district + language + linked-campus)
- Citizen Portal: dashboard, resources (shelters+hospitals+colleges concurrently), live map with routing, hold-to-activate SOS, risk analyzer, alerts, settings, voice assistant
- Operator Desk: live SOS queue (polling), map with all incidents, dispatch workflow (new/ack/dispatched/resolved), campus escalation
- Campus Desk: linked campus profile, contact roster, SOS alerts, test SMS/critical call, delivery log, map
- Realtime via polling; offline queue for SOS and dispatch
- Fallback data seeded (shelters, hospitals, colleges, hazards, campus contacts)
- Mocked SMS/voice-call dispatch endpoint `/api/dispatch/test`

## Backlog (P1/P2)
- P1: Wire real Twilio integration when keys provided
- P1: Turn-by-turn route instructions (currently straight-line route)
- P2: Server-side realtime via WebSocket / SSE (currently polling)
- P2: Auth (Emergent Google Auth) for operator/campus role gating
- P2: Analytics dashboard, incident export
- P2: Supabase migration path (keys provided but not used)

## v1.1 Update (2026-07-30)
- Added Nandha College of Technology + Nandha Engineering College + Kongu Engineering College to Erode district
- Expanded college seed to 30 campuses across Kerala + Tamil Nadu (data-driven, idempotent upsert by name)
- Added `medical` and `admin` campus contact roles; all colleges now have 6 roles each (180 contacts total)
- Real tap-to-call (`tel:` links) with confirmation dialog for critical/emergency calls
- Mobile-first PWA: manifest.json, apple-touch-icon, theme-color orange, standalone display
- Mobile bottom navigation for Citizen portal (5 tabs, floating SOS)
- Updated index.html meta (title "SentraSafe AI — Intelligent Response. Safer Tomorrow.")

## Supabase Migration (Deferred — needs new session)
User requested full Supabase migration (Auth + RLS + Realtime + Storage + Edge Functions). The current app is already fully database-connected via **MongoDB** (not static arrays) with every screen reading/writing from the backend. A full Supabase rewrite touches ~15 files and needs a dedicated session with:
- Supabase project provisioning + `create table` SQL for 11 tables
- RLS policies per role
- Replacing `axios → supabase-js`, hooks, realtime channels
- Migration script for existing MongoDB data
Ready when you want to trigger it — I have your Supabase URL & anon key on file.

## v1.2 Update (2026-08-03)
- **Campus Admin CRUD** — coordinator/admin roles can add/edit/deactivate/delete campus contacts via `/api/campus-contacts` (POST/PATCH/DELETE) gated by `x-campus-role` header; UI panel `Manage Contacts` on Campus Desk.
- **AI Damage Assessment** — `POST /api/damage-assess` with base64 image → Claude Sonnet 4.5 vision returns `{severity_score 0-10, severity_level, hazard_type, damage_description, guidance_en/ta/ml}`. Auto-links to active SOS. UI: photo upload card in Citizen → SOS tab.
- **Supabase Full-Migration Bundle** shipped in `/app/supabase/`:
  - `schema.sql` — 12 tables + indexes + RLS policies + owner (`symonsaniya@gmail.com`) super-admin policy
  - `seed.sql` — districts, colleges (incl. Nandha CoT & Nandha Engg Erode), shelters, hospitals, hazards, 6-role contact roster per college
  - `README.md` — step-by-step setup
  - `frontend/src/lib/supabase.js` — supabase-js client + realtime `subscribeInserts()` + storage `uploadDamagePhoto()` helpers
- **LoginPage** — new campus-role selector (professor/ncc/security/coordinator/admin/medical) + email field; owner default `symonsaniya@gmail.com`.
- **Frontend .env** — `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` wired.

## Supabase Migration Status
- Deliverables: SQL schema + seed + supabase-js client + README (all committed under `/app/supabase/`).
- Runtime: FastAPI + MongoDB remains the primary backend. Once user runs the SQL in Supabase Dashboard and enables realtime, the frontend can subscribe to `sos_queue` INSERTs via `subscribeInserts('sos_queue', null, cb)` in Operator Desk (see `/app/frontend/src/lib/supabase.js`). Full runtime cut-over from MongoDB to Supabase is a follow-up (touches 15+ files).

## Twilio
- Deferred (no credentials shared). Backend `/api/dispatch/test` remains mocked. Swap to Twilio requires adding `TWILIO_*` env vars and replacing the mock in `test_dispatch()`.

## v1.3 Update (2026-08-03)
- **Supabase Realtime cutover**: OperatorDesk now subscribes to `sos_queue` INSERT/UPDATE via `subscribeInserts` in `lib/supabase.js`. When Supabase env vars are set + SQL is run, new SOS pop instantly with a `Supabase Realtime` badge and push counter. Polling remains a fallback so both modes co-exist.
- **Owner Admin Console** (`#/admin`): hidden route for `symonsaniya@gmail.com`. Owner button appears in header only when email matches. Console shows global stats (colleges, contacts, total/active SOS, AI assessments), searchable list of every college with per-contact role chips, all incidents (with damage photo thumb), and all AI assessments. Backend endpoint `GET /api/admin/overview` gated by `X-Owner-Email` header.
- **Photo Attachment on Alerts**: `POST /api/damage-assess` now stores photo bytes + mime, exposes `GET /api/damage-photo/{id}` (5-6 KB JPEG), and back-fills `sos_queue.photo_url + ai_severity + ai_severity_level + ai_description + ai_guidance_en`. Operator incident detail renders the photo + AI summary. If Supabase env is live, the frontend uploads to `damage-photos` bucket in parallel and prefers the mirror URL.

## v1.4 Update (2026-08-03)
- **Predictive Risk Heatmap**: `GET /api/risk-heatmap?state=` fuses hazard-zone rainfall + slope + risk_level + 48-hour SOS density → per-district `risk_score (0-10)` + `risk_level`. Operator Desk map now renders scaled colored circles (green/amber/orange/red) at each district center, plus a toggle button (`Risk Heatmap: ON`) and a "Top: <district> (score)" pill. Test: Wayanad = 7.0/high, Nilgiris = severe.
- **Incident Photo Gallery**: Operator detail panel loads `/api/damage-assessments?sos_id=X` and shows ‹/› arrows, thumbnail strip, and swappable main image. Multiple citizen updates on the same SOS build the gallery.
- **Trilingual Admin Console**: Assessments tab now shows EN/TA/ML guidance blocks color-tagged for each AI assessment.
- **Twilio deferred (no credentials)** — mocked dispatcher remains.

## v1.5 Update (2026-08-03) — Offline Mode
- **Auto-sync on reconnect**: AppContext now replays every queued action (`sos_create`, `dispatch`, `contact_create`, `contact_update`, `sos_update`) whenever `navigator.onLine` fires. Failed replays stay in queue for retry.
- **Pending queue UX**: `ConnectionBadge` shows a bright orange counter with the queue length. `OfflineBanner` swaps between three states: offline (amber), pending-sync (orange with "Retry now" button), and just-synced (emerald flash).
- **PWA service worker**: `/service-worker.js` registered from `index.js` for full offline app-shell caching. Read-heavy `/api/shelters|hospitals|colleges|hazards|campus-contacts|stats|risk-heatmap|damage-assessments|health` are network-first with cache fallback. Map tiles + logo are cache-first. Non-GET requests are never cached (mutations remain the source of truth).
- **Serverless replay**: campus test dispatches, citizen SOS, and campus-contact CRUD all continue to work offline (queued) and self-heal on reconnect.
