# TV Launcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A sideloadable Android TV Home app whose UI is a bundled web page: wallpaper-first, liquid-glass panels, app grid, widgets, and Spotify album art read locally from the box.

**Architecture:** Thin Kotlin app (Home activity + full-screen WebView + JS bridge + media-session listener) hosting static HTML/CSS/JS from `assets/www`. All UI logic is JS behind one `native.js` wrapper that falls back to mock data in a normal browser, so the UI can be tested and screenshotted in the cloud. GitHub Actions compiles the APK.

**Tech Stack:** Kotlin 1.9.24, AGP 8.5.2, Gradle 8.7 (no wrapper, CI installs it), JDK 17, Android compileSdk 34 / minSdk 30 / targetSdk 30, vanilla JS (ES modules), Node `node:test`, Playwright (preview screenshots).

**Spec:** `docs/superpowers/specs/2026-11-03-tv-launcher-design.md`

## Global Constraints

- Application id / namespace: `com.vilgot.tvlauncher`; launcher activity `com.vilgot.tvlauncher.MainActivity`; listener `com.vilgot.tvlauncher.MediaListener`.
- Target device: Android TV 11 (API 30), Amlogic S905Y4, 2 GB RAM. No Google Play Services APIs.
- UI is bundled in the APK; no network needed. No hosted UI.
- Spotify is read only through `MediaSessionManager` on the box; no Web API, no login.
- Blur strength is one value in `www/config.js` (`blurPx`), plus `performanceMode` (no blur, solid translucent fills).
- Back never exits the launcher. A "Stock launcher" tile starts `com.google.android.apps.tv.launcherx`.
- Debug-signed APK is fine. CI artifact name: `tv-launcher-debug-apk`.
- Cloud environment cannot build Android; Kotlin is verified by CI (Actions tab) and the box.

## Review Focus

- No installed app has a leanback launch intent: grid falls back to normal launcher apps, and an empty list shows a message instead of a blank screen.
- Spotify reports metadata without album art (null bitmap): wallpaper stays, text still shows.
- Spotify paused or stopped: art and card go away after pause and the wallpaper returns.
- Notification-listener access not granted: launcher still works, no crash, now-playing simply absent.
- Large album art on a 2 GB device: bitmap is downscaled to at most 640 px before it is sent to JS.
- Apps installed or removed while the launcher is running: list refreshes on resume.
- D-pad at grid edges and Back key: focus never lands outside the grid, Back does nothing.

---

## File Structure

```
settings.gradle.kts, build.gradle.kts, gradle.properties
app/build.gradle.kts, app/src/main/AndroidManifest.xml
app/src/main/kotlin/com/vilgot/tvlauncher/
  MainActivity.kt      WebView host, key + back handling, pushes now-playing to JS
  Bridge.kt            @JavascriptInterface surface for JS
  AppRepository.kt     lists launchable apps, builds launch intents, serves icons
  MediaListener.kt     empty NotificationListenerService (permission anchor)
  NowPlayingMonitor.kt watches Spotify MediaSessions, emits NowPlaying
app/src/main/assets/www/
  index.html, config.js
  css/theme.css, css/glass.css
  js/native.js, js/nav.js, js/apps.js, js/main.js
  widgets/clock.js, widgets/nowplaying.js
  wallpapers/default.svg
app/src/test/kotlin/com/vilgot/tvlauncher/NowPlayingFilterTest.kt
tests/web/nav.test.mjs, tests/web/nowplaying.test.mjs
scripts/preview.mjs    Playwright screenshots of idle / playing / focus states
.github/workflows/build.yml
README.md              install + adb setup + recovery
```

---

### Task 1: Project skeleton and CI that produces an APK

**Files:**
- Create: `settings.gradle.kts`, `build.gradle.kts`, `gradle.properties`, `app/build.gradle.kts`, `app/src/main/AndroidManifest.xml`, `app/src/main/kotlin/com/vilgot/tvlauncher/MainActivity.kt`, `app/src/main/assets/www/index.html` (placeholder text "tv-launcher"), `.github/workflows/build.yml`, `.gitignore`

**Interfaces:**
- Produces: `MainActivity` (exported, Home + `LEANBACK_LAUNCHER` + `DEFAULT` intent filters, `launchMode=singleTask`, fullscreen theme) loading `file:///android_asset/www/index.html` in a `WebView` with JS and DOM storage enabled; `<queries>` entries for `MAIN`/`LEANBACK_LAUNCHER` and `MAIN`/`LAUNCHER` so app listing works at targetSdk 30; `<uses-feature android:name="android.software.leanback" required="false"/>` and touchscreen not required.

- [ ] **Step 1: Write the Gradle files and manifest** with the versions from the header, `namespace = "com.vilgot.tvlauncher"`, and `testImplementation("junit:junit:4.13.2")`.
- [ ] **Step 2: Write `MainActivity`** (WebView fills the screen, hardware accelerated, `onBackPressed` does nothing, immersive sticky flags).
- [ ] **Step 3: Write `build.yml`**: on push and `workflow_dispatch`; `actions/checkout@v4`, `actions/setup-java@v4` (temurin 17), `gradle/actions/setup-gradle@v4` with `gradle-version: 8.7`, run `gradle testDebugUnitTest assembleDebug`, then `actions/upload-artifact@v4` named `tv-launcher-debug-apk` from `app/build/outputs/apk/debug/*.apk`.
- [ ] **Step 4: Commit and push to `main`**, then check the Actions tab (Vilgot reports the result; the cloud environment cannot read it). Expected: green run, artifact `tv-launcher-debug-apk` present.
- [ ] **Step 5: Commit** `feat: android project skeleton and CI build`.

### Task 2: Web UI core (wallpaper, glass, app grid, D-pad)

**Files:**
- Create: everything under `www/` except `widgets/`, plus `tests/web/nav.test.mjs`, `scripts/preview.mjs`, `package.json` (dev deps: `playwright`)

**Interfaces:**
- Produces `js/native.js`: `getApps(): Promise<{pkg:string,label:string}[]>`, `launch(pkg:string): void`, `iconUrl(pkg:string): string` (`app-icon://<pkg>` on device, an inline SVG data URL in mock mode), `onNowPlaying(cb:(np:NowPlaying)=>void): void` where `NowPlaying = {playing:boolean,title:string,artist:string,artUrl:string|null}`. Uses `window.Android` when present, mock data otherwise.
- Produces `js/nav.js`: `nextFocus(rects:{id:string,x:number,y:number,w:number,h:number}[], currentId:string, dir:"left"|"right"|"up"|"down"): string` pure function; returns `currentId` when nothing lies in that direction.
- Produces `config.js`: `export default { blurPx: 24, performanceMode: false, wallpaper: "wallpapers/default.svg" }`.

- [ ] **Step 1: Write failing tests** in `nav.test.mjs`: `nextFocus` moves right to the nearest item in the same row; left from the first item returns the same id (edge); down from the grid with no row below returns the same id; ties pick the smaller vertical offset.
- [ ] **Step 2: Run** `node --test tests/web/` — expected FAIL (module missing).
- [ ] **Step 3: Implement `nav.js`**, then run again — expected PASS.
- [ ] **Step 4: Build the UI**: wallpaper layer; `.glass` class using `backdrop-filter: blur(var(--blur)) saturate(140%)`, translucent gradient fill, 1px inner highlight border, soft shadow; `performanceMode` sets `--blur:0px` and a solid translucent fill; app row on a glass bar with scale + glow on focus; arrow keys call `nextFocus` on measured rects; Enter calls `launch`; Back is swallowed. Empty app list shows "No apps found".
- [ ] **Step 5: Write `scripts/preview.mjs`** (Playwright, 1920x1080) saving `preview-idle.png` and `preview-focus.png`; run it, open the screenshots, and fix any layout or contrast problems.
- [ ] **Step 6: Commit** `feat: web UI core with glass theme, app grid and D-pad nav`.

### Task 3: Widgets and album-art takeover

**Files:**
- Create: `www/widgets/clock.js`, `www/widgets/nowplaying.js`, `tests/web/nowplaying.test.mjs`
- Modify: `www/js/main.js`, `www/css/theme.css`

**Interfaces:**
- Consumes: `onNowPlaying` and the `NowPlaying` shape from `native.js`.
- Produces: widget contract `export function mount(el: HTMLElement): { onNowPlaying?(np: NowPlaying): void }`; `nowplaying.js` also exports `viewState(np: NowPlaying): {mode:"idle"|"playing", showArt:boolean, title:string, artist:string}` (pure).

- [ ] **Step 1: Write failing tests** for `viewState`: playing with art gives `mode:"playing", showArt:true`; playing with `artUrl:null` gives `mode:"playing", showArt:false` and keeps title/artist; `playing:false` gives `mode:"idle", showArt:false`.
- [ ] **Step 2: Run** `node --test tests/web/` — expected FAIL, then implement `viewState` and the two widgets (clock updates each second; now-playing card shows cover, title, artist), run again — expected PASS.
- [ ] **Step 3: Album-art takeover:** when `mode:"playing"` and `showArt`, set the blurred, enlarged art as the background layer with a cross-fade; on idle, fade back to the wallpaper.
- [ ] **Step 4: Extend `preview.mjs`** with a `?mock=playing` state and capture `preview-playing.png`; view it and fix problems.
- [ ] **Step 5: Commit** `feat: clock and now-playing widgets with album-art background`.

### Task 4: Native app list, launching and icons

**Files:**
- Create: `Bridge.kt`, `AppRepository.kt`
- Modify: `MainActivity.kt`

**Interfaces:**
- Produces `AppRepository(context)`: `fun launchableApps(): List<AppEntry>` (`data class AppEntry(val pkg: String, val label: String)`; leanback intent first, normal launcher intent as fallback, excluding our own package, sorted by label); `fun launchIntent(pkg: String): Intent?`; `fun iconPng(pkg: String): ByteArray?`.
- Produces `Bridge` with `@JavascriptInterface fun getApps(): String` (JSON array of `{pkg,label}`), `fun launch(pkg: String)`; exposed to the page as `Android`. `native.js` `getApps` parses the JSON.
- `MainActivity` intercepts `app-icon://<pkg>` in `WebViewClient.shouldInterceptRequest` and answers with `iconPng`; `onResume` tells JS to re-fetch apps by calling `window.refreshApps()`.
- Stock-launcher tile: `getApps` always appends `{pkg:"com.google.android.apps.tv.launcherx",label:"Stock launcher"}` when that package exists.

- [ ] **Step 1: Implement the three pieces above.**
- [ ] **Step 2: Wire `window.refreshApps` in `js/main.js`** (re-runs `getApps` and re-renders, keeping focus on the same pkg when it still exists).
- [ ] **Step 3: Push and check CI** (Actions tab) — expected green.
- [ ] **Step 4: Commit** `feat: native app list, launching and icon serving`.

### Task 5: Spotify now-playing from the box

**Files:**
- Create: `MediaListener.kt`, `NowPlayingMonitor.kt`, `app/src/test/kotlin/com/vilgot/tvlauncher/NowPlayingFilterTest.kt`
- Modify: `AndroidManifest.xml` (declare the listener service with `BIND_NOTIFICATION_LISTENER_SERVICE`), `MainActivity.kt`

**Interfaces:**
- Produces in `NowPlayingMonitor.kt`: `val SPOTIFY_PACKAGES = setOf("com.spotify.tv.android", "com.spotify.music")`; `fun pickSpotifySession(packages: List<String>): Int?` (index of the first Spotify session, else null); `data class NowPlaying(val playing: Boolean, val title: String, val artist: String, val artJpegBase64: String?)`; `class NowPlayingMonitor(context: Context, onChange: (NowPlaying) -> Unit)` with `start()` / `stop()`; it uses `MediaSessionManager.getActiveSessions(ComponentName(context, MediaListener::class.java))` plus an active-sessions listener and a `MediaController.Callback`; a `SecurityException` (listener not granted) is caught and reported as `playing=false`.
- Art: take `METADATA_KEY_ALBUM_ART`, else `METADATA_KEY_ART`; scale to at most 640 px on the long edge; JPEG quality 85; base64 without line breaks; null when no bitmap.
- `MainActivity` forwards each change to JS as `window.onNowPlaying({playing,title,artist,artUrl})` with `artUrl` = `data:image/jpeg;base64,...` or `null`, via `evaluateJavascript` on the main thread. `native.js` registers the callback.

- [ ] **Step 1: Write failing JUnit tests** in `NowPlayingFilterTest`: `pickSpotifySession(listOf("com.android.chrome","com.spotify.tv.android"))` is `1`; with no Spotify package it is `null`; empty list is `null`.
- [ ] **Step 2: Implement** `pickSpotifySession`, the monitor and `MediaListener` (an empty `NotificationListenerService` subclass).
- [ ] **Step 3: Push and check CI** — expected: unit tests pass, build green.
- [ ] **Step 4: Commit** `feat: spotify now-playing via media sessions`.

### Task 6: Setup guide and first on-box test

**Files:**
- Create: `README.md` (replace the stub)

- [ ] **Step 1: Write `README.md`**: where to download the APK artifact; `adb install -r`; the three setup commands from the spec (`allow_listener`, `set-home-activity`, `resolve-activity` check); how to find the Spotify package (`adb shell pm list packages | findstr spotify`) and where to change `SPOTIFY_PACKAGES`; recovery command; how to lower `blurPx` or turn on `performanceMode` in `www/config.js`.
- [ ] **Step 2: On the box** (Vilgot runs it, reports back): install, press Home, check the resolve-activity output, launch two apps, play Spotify on the box and confirm album art appears and goes away on pause. Do **not** disable the stock launcher unless resolve-activity shows our activity.
- [ ] **Step 3: Commit** `docs: setup and recovery guide`.
