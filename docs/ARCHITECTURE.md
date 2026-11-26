# Architecture decisions

## Safety boundary
Navigation is deterministic. AI is a conversational layer and cannot invent route geometry, speed limits, traffic state, GPS position or legal maneuvers. The app validates every model-requested tool call. Core route guidance must work if AI/cloud services fail.

## Execution split
- Device: GPS, map rendering, route progress, downloaded map packages, local POI search, local speech and local LLM.
- Self-hosted services: regional Valhalla routing, Photon search and vector tile distribution.
- Optional Cloudflare: account/profile sync and community reports only.

## Wrong turns
Use map-matched route progress and multiple location observations. Distinguish off-route from wrong-way. A single noisy GPS point must not trigger yelling or automatic route changes. Rerouting comes from the routing engine. Never tell a driver to make an abrupt or illegal maneuver.

## Privacy
Raw GPS breadcrumbs are not stored by default. Trip sharing is opt-in, time-limited and revocable. Conversation audio is not retained by default.
