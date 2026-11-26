# AI Navigator mobile app

React Native application targeting Android and iOS. MapLibre renders maps; Photon search and Valhalla routing are self-hosted services.

## Current implementation
- Premium light navigation shell.
- MapLibre map integration and current-location control.
- Photon place search.
- Valhalla route request and precision-6 polyline rendering.
- Selectable assistant personalities and deterministic safety-conscious route messages.

## Native setup still required
This source scaffold does not include generated `android/` and `ios/` native project folders. Generate/merge them with the React Native Community CLI for the selected React Native version, then install native dependencies and pods. On iOS, add `NSLocationWhenInUseUsageDescription` to `Info.plist`. On Android, add `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` to `AndroidManifest.xml`. Configure cleartext HTTP only for local development; production self-hosted endpoints should use HTTPS.

Install dependencies, then run `npm run typecheck`, `npm run android`, or `npm run ios` after native project generation. iOS builds require macOS and Xcode.

Set service URLs in `src/config.ts`. Android emulator uses `10.0.2.2` to reach host services; physical devices need the host computer's LAN IP. Do not expose development HTTP endpoints to the public internet.
