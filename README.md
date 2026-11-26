# AI Navigator

AI Navigator is a local-first navigation companion concept: map and route guidance remain deterministic, while a conversational assistant adds voice interaction and selectable personalities. This repository is an actively developed scaffold, **not a production-ready replacement for Google Maps or Apple Maps yet**.

## Non-negotiable product rules
- No paid map, routing, geocoding, speech, or AI APIs.
- No silent fallback to billable services.
- Core navigation must work without the AI model or cloud account.
- GPS stays on-device by default; trip sharing must be explicit and revocable.
- OpenStreetMap attribution and ODbL requirements must be met for derived data.
- Do not commit API secrets, model weights, or regional map datasets.

## Repository structure
- `apps/mobile`: React Native Android/iOS source using MapLibre Native.
- `apps/web-preview`: browser preview using MapLibre GL.
- `services/api`: optional Cloudflare Worker + D1 foundation (not required for navigation).
- `infrastructure/docker`: self-hosted Valhalla, Photon and vector-tile service template.
- `packages/shared`: shared TypeScript contracts.
- `docs`: setup, architecture, licensing and honest implementation status.

## Browser preview
Requires Node.js 20+ and network access to install npm packages.

```bash
cd apps/web-preview
cp .env.example .env
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The preview requires a valid MapLibre style URL plus self-hosted Photon and Valhalla endpoints. Without those services the interface loads but map tiles/search/routing will not work.

## Mobile setup
See [`apps/mobile/README.md`](apps/mobile/README.md). This repository contains React Native application source but does not yet contain generated `android/` or `ios/` native projects. Android requires Android Studio/SDK. iOS builds require macOS and Xcode. Native permissions and MapLibre setup must be completed before device builds.

## Self-hosted map services
See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) and [`infrastructure/docker/compose.yaml`](infrastructure/docker/compose.yaml). The compose file is a service template only. You must prepare a region-sized OSM extract and generate the corresponding Valhalla graph, Photon index and vector MBTiles. It is not a one-command worldwide map install.

## Cloud backend
Cloudflare Worker + D1 is optional and currently only exposes health/config placeholders. The D1 migration creates profile, saved-place, trip-summary and road-report tables. No user authentication, production sync or live community-report moderation is implemented. The `database_id` in `services/api/wrangler.toml` is a placeholder.

## Current status
Read [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) before treating any feature as complete. Background turn-by-turn tracking, automatic rerouting, offline map packs, native offline speech and local LLM runtime still need implementation and testing.
