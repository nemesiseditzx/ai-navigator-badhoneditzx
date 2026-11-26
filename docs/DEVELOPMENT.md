# Development and deployment guide

## Requirements
- Node.js 20+ and npm.
- Android Studio + Android SDK for Android builds.
- macOS + Xcode for iOS builds.
- Docker Engine + Compose for self-hosted map services.
- A region-sized OpenStreetMap extract and storage/compute for generated datasets.

## Browser preview
```bash
cd apps/web-preview
cp .env.example .env
npm install
npm run dev
```
Set `VITE_MAP_STYLE_URL`, `VITE_PHOTON_URL` and `VITE_VALHALLA_URL` to services you control. A style URL must return valid MapLibre Style JSON. Photon is queried at `/api/`; Valhalla routing is queried at `/route`.

## Mobile
```bash
cd apps/mobile
npm install
npm run typecheck
```
The source does not include generated native `android/` and `ios/` folders. Generate/merge native projects with the React Native Community CLI matching React Native 0.81.5. Configure MapLibre Native according to its current v10 setup guide. Add Android `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions. Add `NSLocationWhenInUseUsageDescription` to iOS `Info.plist`. Android emulator reaches host services through `10.0.2.2`; a physical device needs the development computer's LAN IP. Production endpoints should use HTTPS.

## Regional OSM data pipeline
1. Choose a small pilot region and estimate disk/RAM before downloading data.
2. Obtain an OSM extract from a provider such as Geofabrik and retain required attribution/license notices.
3. Build Valhalla routing tiles using the image's documented import process and verify `/route` with a known origin/destination pair.
4. Import the same region into Photon and verify `/api/?q=...`.
5. Generate vector MBTiles and a valid style JSON for TileServer GL; verify style and tile requests from a browser.
6. Record dataset date, source, region, checksums, size and license metadata.

The compose file is a service template only; exact import commands and resource requirements depend on the chosen region and image version. Do not automatically download planet-scale data.

## Optional Cloudflare backend
- Create a D1 database yourself, then replace the placeholder `database_id` in `services/api/wrangler.toml`.
- Run `npx wrangler d1 migrations apply ai_navigator_db --local` for local schema testing.
- Use `--remote` only after explicitly creating and reviewing the remote database.
- `npx wrangler dev` runs the Worker locally.
- `npx wrangler deploy` publishes to your Cloudflare account and may consume account resources. Do not deploy without reviewing current limits/pricing and explicit approval.
- Worker endpoints are placeholders; authentication and data endpoints are not production-ready.

## Planned offline AI and voice
The target stack is llama.cpp (local LLM), whisper.cpp (speech recognition) and Piper (speech synthesis), subject to model/runtime licensing and Android/iOS integration. No model weights are bundled. Verify license, size, quantization, attribution and redistribution terms before packaging.
