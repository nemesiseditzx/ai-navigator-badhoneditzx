# Implementation status (verified scope)

## Present in source
- React Native MapLibre application shell with a light UI.
- Current-location request flow for foreground location.
- Photon place-search client.
- Valhalla route-request client and precision-6 polyline decoder.
- Deterministic assistant personality messages and simple local command parsing.
- Geometric route-progress utility for candidate off-route/wrong-way signals (not wired to live tracking).
- Browser preview with MapLibre GL, browser geolocation, Photon search, Valhalla route display, personality selection, speech synthesis and optional browser speech recognition.
- Cloudflare Worker health/config endpoints and initial D1 schema.
- Docker Compose template for self-hosted routing, geocoding and vector tiles.
- Architecture, privacy, licensing and setup documentation.

## Not yet implemented
- Generated native Android/iOS projects, permission configuration and successful device builds.
- Continuous background GPS tracking, route map-matching, reliable off-route detection and automatic rerouting.
- Wrong-way detection with confidence filtering and driver-safe prompts.
- Offline map downloads, region package manager, offline routing graph activation and offline POI search.
- Native llama.cpp runtime/model selection and safe tool calling.
- Native whisper.cpp speech-to-text and Piper text-to-speech.
- Production regional OSM data pipeline, tile style and validated service deployment.
- Authentication, profile sync, production community reports and moderation.
- Automated unit/integration tests, performance tests and real-road validation.

## Validation status
- JSON configuration files and the D1 SQL migration were syntax-checked in the preparation environment.
- ZIP archive integrity was checked.
- npm dependency installation timed out in the current environment; therefore Vite build, TypeScript project build and native Android/iOS builds have **not** been verified.
- No live map/routing service was provisioned or called as a production endpoint.

Do not describe this scaffold as production-ready or fully offline until the relevant features are implemented and tested on real devices.
