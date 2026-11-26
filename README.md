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
See [`apps/mobile/README.md`](apps/mobile/README.md). The mobile source now includes foreground GPS rerouting, approximate maneuver prompts, native system TTS, English/Bangla speech-recognition locale selection and an optional LAN-hosted llama.cpp conversational assistant. Speech-recognition privacy/offline behavior depends on the OS provider; local Piper/whisper.cpp are not integrated. This repository still does not contain generated `android/` or `ios/` native projects. Android requires Android Studio/SDK. iOS builds require macOS and Xcode. Native permissions and MapLibre setup must be completed before device builds.

## Self-hosted map services
See [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) and [`infrastructure/docker/compose.yaml`](infrastructure/docker/compose.yaml). The compose file is a service template only. You must prepare a region-sized OSM extract and generate the corresponding Valhalla graph, Photon index and vector MBTiles. It is not a one-command worldwide map install.

## Cloud backend
Cloudflare Worker + D1 is optional and currently only exposes health/config placeholders. The D1 migration creates profile, saved-place, trip-summary and road-report tables. No user authentication, production sync or live community-report moderation is implemented. The `database_id` in `services/api/wrangler.toml` is a placeholder.

## Current status
Read [`docs/IMPLEMENTATION_STATUS.md`](docs/IMPLEMENTATION_STATUS.md) before treating any feature as complete. Background turn-by-turn tracking, automatic rerouting, offline map packs, native offline speech and local LLM runtime still need implementation and testing.

## Deploy the browser preview to Netlify

The repository includes a root `netlify.toml` configured for the web app in `apps/web-preview`:
- Base directory: `apps/web-preview`
- Build command: `npm run build`
- Publish directory: `dist` (relative to the base directory)
- Node.js: 20

Connect the GitHub repository in Netlify and select the `initial/ai-navigator-foundation` branch while this foundation is under review. If Netlify asks for build settings manually, use the values above. Do not set the publish directory to the repository root.

For a working deployed map, add these Netlify environment variables before triggering a fresh deploy:
- `VITE_MAP_STYLE_URL`: public HTTPS URL to your hosted MapLibre style JSON.
- `VITE_PHOTON_URL`: public HTTPS base URL for your self-hosted Photon service.
- `VITE_VALHALLA_URL`: public HTTPS base URL for your self-hosted Valhalla service.

These are service URLs, not API secrets. The three services must be reachable from the public internet over HTTPS and configured with appropriate CORS. Do not use `localhost` in Netlify variables: it refers to each visitor's own device. The app now shows an explicit configuration message instead of silently trying localhost when a URL is missing. Netlify deploys the static browser preview only; it does not deploy the map, Photon or Valhalla services.
