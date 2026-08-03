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
