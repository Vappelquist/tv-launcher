# TV Launcher: design

Custom Home screen for a Strong LEAP-S3+ (Amlogic S905Y4, 2 GB RAM, Android TV 11 / API 30).

## Goal

Replace the stock Google TV home with a web-based home screen that Vilgot designs and can restyle without touching Kotlin:

- Wallpaper is the main focus of the screen.
- "Liquid glass" panels for everything else.
- App grid / shortcuts.
- Custom widgets.
- When Spotify is playing on the box, the album art is shown.

Success: pressing Home on the remote opens the launcher, apps launch with the D-pad, UI stays smooth on this chip, and the stock launcher can be restored in one adb command.

## Decisions (agreed)

| Topic | Decision |
|---|---|
| Launcher type | Thin Android app registered as Home + full-screen WebView; UI is bundled HTML/CSS/JS |
| UI source | Bundled in the APK (no hosting, works offline) |
| Spotify | Local only: read the Spotify app's MediaSession on the box. No Web API, no login. Phone playback must be sent to the box (Spotify Connect) |
| Build | GitHub Actions builds a debug APK, installed with `adb install` |
| Out of scope | Spotify Web API, weather (can be added later as a widget), Play Store publishing |

## Architecture

```
app/
  src/main/AndroidManifest.xml      Home + LEANBACK_LAUNCHER intent filters
  src/main/kotlin/.../
    MainActivity.kt                 full-screen WebView, key handling, Back handling
    Bridge.kt                       @JavascriptInterface: getApps(), launch(pkg), openSettings()
    AppRepository.kt                installed apps (LEANBACK_LAUNCHER, fallback LAUNCHER)
    MediaListener.kt                NotificationListenerService, needed to read MediaSessions
    NowPlaying.kt                   Spotify session -> title / artist / album art
  src/main/assets/www/
    index.html, css/, js/
    widgets/                        one small module per widget (clock, now-playing, ...)
    wallpapers/                     bundled wallpaper(s)
.github/workflows/build.yml         assembleDebug, uploads the APK as an artifact
```

Units and interfaces:

- **Bridge** (Kotlin to JS): `getApps()` returns JSON `[{pkg,label}]`; icons are served through an intercepted `app-icon://<pkg>` URL; `launch(pkg)`; `openSettings()`. Depends only on `PackageManager`.
- **NowPlaying** (Kotlin to JS): pushes `{playing,title,artist,artUrl}` to `window.onNowPlaying(...)` on every Spotify metadata or playback-state change. Filters on the Spotify TV package. Depends on `MediaSessionManager` plus the notification-listener permission.
- **UI** (JS): reads the bridge only through one small `native.js` wrapper. When `window.Android` is absent, the wrapper returns mock data so the UI can be previewed and screenshot in a normal browser.

## UI

- **Wallpaper layer:** full-bleed image behind everything. With music playing, the album art becomes the background (blurred and enlarged) with the sharp cover shown on a glass card.
- **Glass panels:** `backdrop-filter: blur(var(--blur)) saturate(...)`, translucent gradient fill, thin inner highlight border, soft shadow. `--blur` and a "performance mode" flag live in one config file. Performance mode drops the blur and uses solid translucent fills.
- **App grid:** row of icons on a glass bar, with a clear focus ring/scale on the selected one.
- **Widgets:** a simple widget contract (module exports `mount(el)` and an optional `onNowPlaying`). Ships with clock and now-playing.
- **Navigation:** D-pad via arrow-key spatial focus, Enter to launch, Back never exits the launcher.
- **Escape hatch:** a "Stock launcher" tile that starts the Google TV launcher, so Home is never a dead end.

## Setup on the box (after install)

1. `adb install -r app-debug.apk`
2. Grant the media listener (Android TV has no obvious UI for this):
   `adb shell cmd notification allow_listener <pkg>/<pkg>.MediaListener`
3. Make it the Home app: `adb shell cmd package set-home-activity <pkg>/.MainActivity`
4. Verify with `adb shell cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.HOME`, then press Home.

Recovery: `adb shell pm enable com.google.android.apps.tv.launcherx` brings the stock home back.

## Risks

- **Home may still resolve to the stock launcher.** Google TV can steer Home to its own launcher. We verify with the resolve-activity output in step 4 before anything is disabled. Last time, with Projectivy, disabling the stock launcher gave a blank screen, so we do not disable it until our launcher is confirmed as the Home resolver.
- **Blur performance:** a Cortex-A35 with 2 GB RAM may stutter on large blurred areas. Mitigation: adjustable blur radius, performance mode, small blurred regions only.
- **Spotify on the box:** the Spotify app must be installed and playing on the box. Phone-only playback will not show.
- **Debug-signed APK:** fine for sideloading with adb; re-install with `-r` to update.

## Testing

- UI is previewed in a desktop browser with mock bridge data and screenshotted to check layout and states (idle, playing, focus).
- The APK is built by CI; real behavior (Home resolution, app launching, Spotify art, smoothness) is verified on the box.
