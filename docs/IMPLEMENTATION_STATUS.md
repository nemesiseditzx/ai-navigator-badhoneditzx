# Implementation status

Implemented in the source scaffold: React Native MapLibre app shell, location permission/request flow, Photon place search client, Valhalla route client, precision-6 polyline decoder, deterministic assistant personalities, browser preview with MapLibre GL/geolocation/search/routing, optional browser speech where supported, self-hosted service templates, initial D1 schema and Worker health/config endpoints.

Not implemented or verified: generated Android/iOS native projects and device builds; local llama.cpp runtime; whisper.cpp/Piper native voice; continuous background turn-by-turn tracking; map matching and automatic off-route rerouting; offline map/routing packages and POI search; production OSM tile/data pipeline; authentication and production sync; real-device road tests.

Browser speech may depend on browser-vendor services and is not the final offline voice stack. Do not claim production-ready navigation or offline capability until implemented and tested.
