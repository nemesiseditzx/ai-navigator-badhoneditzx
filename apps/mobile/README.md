# AI Navigator mobile app

React Native application targeting Android and iOS. MapLibre renders maps; Photon search and Valhalla routing are self-hosted services.

## Implemented in source
- MapLibre Native map view and foreground current-location flow.
- Photon place search and Valhalla route request/rendering.
- Assistant personality selection with deterministic messages.
- Foreground GPS watch while a route is active.
- Three consecutive geometric off-route candidates trigger a Valhalla reroute request with a 30-second cooldown; repeated wrong-way candidates display a warning.

## Native setup still required
This source does not include generated `android/` and `ios/` native project folders. Generate/merge them with the React Native Community CLI for React Native 0.81.5, then install native dependencies and pods. iOS builds require macOS and Xcode.

Add Android `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions to `AndroidManifest.xml`. Add `NSLocationWhenInUseUsageDescription` to iOS `Info.plist`. Configure cleartext HTTP only for local development; production self-hosted endpoints should use HTTPS.

Run `npm install`, then `npm run typecheck` and `npm test` for TypeScript checking and route-progress regression tests. Use `npm run android` or `npm run ios` after native project generation. Set service URLs in `src/config.ts`. Android emulator uses `10.0.2.2`; physical devices need the host computer's LAN IP.

## Safety limitations
The route-progress estimator is geometric, not road-network map matching. GPS drift can create false positives. Background navigation, lane guidance, traffic and offline routing are not implemented. Do not use this scaffold as a sole navigation aid on real roads.
