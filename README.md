# AI Navigator

Free-to-use, offline-first navigation companion. This repository contains an implementation scaffold and a runnable browser preview. It is not yet a production navigation product.

## Product constraints
- No paid mapping, routing, geocoding, speech, or AI API dependency.
- Navigation must continue when AI or cloud services are unavailable.
- Local-first GPS, routing, speech and AI; optional self-hosted services for sync and richer processing.
- OpenStreetMap attribution and ODbL obligations must be respected.
- Never silently fall back to a paid provider or create billable infrastructure.

## Project layout
- `apps/mobile`: React Native Android/iOS source using MapLibre Native, Photon and Valhalla clients.
- `apps/web-preview`: browser preview using MapLibre GL, Photon, Valhalla and browser location/speech capabilities.
- `services/api`: optional Cloudflare Worker and D1 schema.
- `infrastructure/docker`: optional self-hosted map/routing/geocoding services.
- `packages/shared`: shared contracts.
- `docs`: architecture, licensing, setup, implementation status and roadmap.

## Quick start: browser preview
1. Install Node.js 20+.
2. Configure `apps/web-preview/.env` from `.env.example`.
3. Start your own MapLibre-compatible tile style server, Photon and Valhalla services.
4. Run `cd apps/web-preview && npm install && npm run dev`.
5. Open `http://localhost:4173`.

The browser preview needs self-hosted services. It does not use the public OSM tile server as an unlimited production backend. Browser speech support varies by browser and may use browser-vendor services; it is a preview convenience, not the offline voice implementation.

## Mobile app
See `apps/mobile/README.md`. React Native native project folders (`android/` and `ios/`) still need to be generated/merged for the selected React Native version. iOS builds require macOS and Xcode. MapLibre Native and location permissions require native setup.

## Self-hosted services
See `infrastructure/docker/compose.yaml` and `docs/DEVELOPMENT.md`. Regional OSM-derived data must be prepared and mounted before services are useful. Do not download planet-scale data automatically.

## Current status
See `docs/IMPLEMENTATION_STATUS.md`. The source includes app screens and service clients, but does not yet include verified device builds, full offline packs, native local AI, or production turn-by-turn tracking.
