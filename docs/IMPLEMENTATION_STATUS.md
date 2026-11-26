# Implementation status (verified scope)

## Present in source
- React Native MapLibre application shell with a light UI.
- Foreground location request and active-route GPS watch.
- Photon place-search client and Valhalla route-request client.
- Precision-6 route polyline decoder.
- Geometric route-progress utility; three consecutive off-route candidates request a Valhalla reroute with a cooldown, and repeated wrong-way candidates display a conservative warning.
- Persistent Node test cases for route-progress and assistant-command edge cases (on-route, off-route, heading reversal, stationary movement, degenerate routes, repeat/mute parsing and safety wording). Run with `npm test` in `apps/mobile` after installing dependencies.
- Deterministic assistant personality messages and repeat/mute command handling.
- Native system TTS calls for route start, upcoming maneuvers (250 m geometric approach threshold), wrong-way alerts and reroutes; system speech recognition input for short English commands.
- Android/iOS permission merge snippets for location, microphone and speech recognition. System speech recognition may use external OS providers and is not guaranteed offline; local whisper.cpp/Piper are still not integrated.
- Browser preview with MapLibre GL, browser geolocation, Photon search, Valhalla route display, personality selection and browser speech preview.
- Cloudflare Worker health/config endpoints and initial D1 schema.
- Docker Compose template for self-hosted routing, geocoding and vector tiles.
- Architecture, privacy, licensing and setup documentation.

## Not yet implemented
- Generated native Android/iOS projects, permission configuration and successful device builds.
- Background GPS tracking, road-network map matching, robust GPS-drift handling and production-grade off-route detection.
- Road-network map matching, robust GPS-drift handling, lane guidance, traffic and speed-limit data; maneuver prompts currently use geometric route progress and need real-road validation.
- Offline map downloads, region package manager, offline routing graph activation and offline POI search.
- Native llama.cpp runtime/model selection and safe tool calling.
- Native whisper.cpp speech-to-text and Piper text-to-speech (the current system speech bridge is not the offline model stack).
- Production regional OSM data pipeline, tile style and validated service deployment.
- Authentication, profile sync, production community reports and moderation.
- Automated app integration tests, performance tests and supervised real-road validation.

## Validation status
- JSON configuration files and D1 SQL migration were syntax-checked.
- Route-progress, assistant-command and polyline utilities passed isolated TypeScript compilation; 11 targeted smoke assertions passed in this environment.
- ZIP archive integrity was checked.
- npm dependency installation timed out; Vite build, full app TypeScript build and Android/iOS builds are not verified.
- No live production map/routing service was provisioned.

Do not describe this scaffold as production-ready or fully offline until the outstanding work is implemented and tested on real devices.
