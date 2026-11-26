# AI Navigator mobile app

React Native application targeting Android and iOS. MapLibre renders maps; Photon search and Valhalla routing are self-hosted services.

## Implemented in source
- MapLibre Native map view and foreground current-location flow.
- Photon place search and Valhalla route request/rendering.
- Assistant personality selection with deterministic messages.
- Native system text-to-speech for route start, upcoming maneuvers, wrong-way warnings and reroute announcements.
- Native speech-recognition button for short voice commands; currently supports `repeat` and `mute` in English, plus text command parsing for Bangla phrases.
- Personality-based spoken delivery rate/pitch adjustments and explicit unsupported-command responses (not a general-purpose conversational LLM).
- Foreground GPS watch while a route is active.
- Three consecutive geometric off-route candidates trigger a Valhalla reroute request with a 30-second cooldown; repeated wrong-way candidates display a warning.

## Local conversational AI
The mobile assistant uses an optional OpenAI-compatible `llama.cpp` server on your own computer/network. Set `assistantURL` in `src/config.ts` to that server's `/v1/chat/completions` endpoint. Android emulator defaults to `10.0.2.2:8081`; a physical phone must use the computer's LAN IP. Example server command (after building llama.cpp and placing a compatible GGUF model locally):

```bash
llama-server -m /absolute/path/to/model.gguf --host 0.0.0.0 --port 8081 --ctx-size 4096
```

No model is bundled and no external AI provider is called. Keep the server behind your trusted LAN/firewall; do not expose an unauthenticated inference server to the public internet. If it is unavailable, the app reports that rather than silently switching to a paid/cloud model.

## Native permissions and voice behavior
Merge the Android permissions/query snippet from `native-config/AndroidManifest.permissions.xml` into the generated Android manifest. Merge the usage-description keys from `native-config/Info.plist.permissions.xml` into the iOS plist. React Native autolinking handles the TTS and voice packages after a clean native build/pod install.

TTS uses the device's installed system speech engine; offline availability and Bengali voice availability depend on the device's installed voices. Speech recognition uses the operating system recognition provider and may send audio to an external provider depending on device settings; it is not guaranteed to be on-device/offline. This build defaults to English (`en-US`) recognition. Do not describe it as private/offline speech recognition.

## Native setup still required
This source does not include generated `android/` and `ios/` native project folders. Generate/merge them with the React Native Community CLI for React Native 0.81.5, then install native dependencies and pods. iOS builds require macOS and Xcode.

Add Android `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` permissions to `AndroidManifest.xml`. Add `NSLocationWhenInUseUsageDescription` to iOS `Info.plist`. Configure cleartext HTTP only for local development; production self-hosted endpoints should use HTTPS.

Run `npm install`, then `npm run typecheck` and `npm test` for TypeScript checking and route-progress regression tests. Use `npm run android` or `npm run ios` after native project generation. Set service URLs in `src/config.ts`. Android emulator uses `10.0.2.2`; physical devices need the host computer's LAN IP.

## Safety limitations
The route-progress estimator is geometric, not road-network map matching. GPS drift can create false positives. Background navigation, lane guidance, traffic and offline routing are not implemented. Do not use this scaffold as a sole navigation aid on real roads.
