# AI Navigator mobile app

React Native application targeting Android and iOS. MapLibre renders maps; Photon search and Valhalla routing are self-hosted services.

## Implemented in source
- MapLibre Native map view and foreground current-location flow.
- Photon place search and Valhalla route request/rendering.
- Assistant personality selection with deterministic messages.
- Native system text-to-speech for route start, upcoming maneuvers, wrong-way warnings and reroute announcements.
- Native speech-recognition button for short voice commands; supports `repeat`, `mute` and `unmute` command parsing in English/Bangla. Actual recognition quality and locale availability depend on the operating system provider.
- Speech output switches between `en-US` and `bn-BD` with the language selector when a compatible system TTS voice is installed.
- Personality-based spoken delivery rate/pitch adjustments and explicit unsupported-command responses (not a general-purpose conversational LLM).
- Foreground GPS watch while a route is active.
- Three consecutive geometric off-route candidates trigger a Valhalla reroute request with a 30-second cooldown; repeated wrong-way candidates display a warning.

## Local conversational AI
The mobile assistant handles `repeat`, `mute` and `unmute` locally, and uses an optional OpenAI-compatible `llama.cpp` server on your own computer/network. Set `assistantURL` in `src/config.ts` to that server's `/v1/chat/completions` endpoint. Android emulator defaults to `10.0.2.2:8081`; a physical phone must use the computer's LAN IP. Example server command (after building llama.cpp and placing a compatible GGUF model locally):

```bash
llama-server -m /absolute/path/to/model.gguf --host 0.0.0.0 --port 8081 --ctx-size 4096
```

No model is bundled and no external AI provider is called. Keep the server behind your trusted LAN/firewall; do not expose an unauthenticated inference server to the public internet. If it is unavailable, the app reports that rather than silently switching to a paid/cloud model.

## Native permissions and voice behavior
Merge the Android permissions/query snippet from `native-config/AndroidManifest.permissions.xml` into the generated Android manifest. Merge the usage-description keys from `native-config/Info.plist.permissions.xml` into the iOS plist. React Native autolinking handles the TTS and voice packages after a clean native build/pod install.

TTS uses the device's installed system speech engine; offline availability and Bengali voice availability depend on the device's installed voices. Speech recognition uses the operating system recognition provider and may send audio to an external provider depending on device settings; it is not guaranteed to be on-device/offline. The language selector requests `en-US` or `bn-BD` for recognition and TTS. Do not describe it as private/offline speech recognition.

## Native build status and Android APK
The repository keeps the React Native application source under `apps/mobile`; generated native projects are not committed. The GitHub Actions workflow `.github/workflows/mobile-logic-tests.yml` generates a clean React Native 0.81.5 Android project, overlays this app source, installs native dependencies, and runs `assembleDebug`. Run it manually from the Actions tab with **Mobile logic tests** → **Run workflow**, or let it run on a pull request/push that changes `apps/mobile/**` or this workflow. A successful run uploads `ai-navigator-debug-apk` as a 14-day workflow artifact. An APK is not available until that workflow completes successfully.

The workflow adds location and microphone permissions. Cleartext HTTP is enabled only in the Android debug manifest so the emulator can reach local development services; do not use that debug build as a production release. Production endpoints must use HTTPS. iOS still requires native project generation, permission merging, CocoaPods and a macOS/Xcode build.

Run `npm install`, then `npm run typecheck` and `npm test` in this directory for source checks. Android emulator endpoints use `10.0.2.2`; physical devices need the host computer's LAN IP. Set self-hosted service URLs in `src/config.ts`.

## Safety limitations
The route-progress estimator is geometric, not road-network map matching. A forward progress corridor and crossing tests reduce some position jumps, but GPS drift can still create false positives or missed maneuvers. Background navigation, lane guidance, traffic and offline routing are not implemented. Do not use this scaffold as a sole navigation aid on real roads.
