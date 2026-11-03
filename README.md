# tv-launcher

A custom Home screen for the Strong LEAP-S3+ (Android TV 11). The UI is a bundled web page (wallpaper, liquid-glass panels, app grid, clock, Spotify album art) shown by a tiny Android app that registers as Home.

Design: `docs/superpowers/specs/2026-11-03-tv-launcher-design.md`

## Get the APK

1. Open the **Actions** tab, click the latest green **build** run.
2. Download the **tv-launcher-debug-apk** artifact and unzip it. You get `app-debug.apk`.

## Install on the box

Connect ADB first (box and PC on the same network, USB debugging on):

```powershell
adb connect <box-ip>:5555
adb install -r app-debug.apk
```

Updates: run `adb install -r` again.

## Make it work

1. **Let it read Spotify's now-playing info** (Android TV has no obvious screen for this):

   ```powershell
   adb shell cmd notification allow_listener com.vilgot.tvlauncher/com.vilgot.tvlauncher.MediaListener
   ```

2. **Check which Spotify package is on the box**, and if it is not `com.spotify.tv.android` or `com.spotify.music`, add it to `SPOTIFY_PACKAGES` in `NowPlayingMonitor.kt`:

   ```powershell
   adb shell pm list packages | Select-String spotify
   ```

3. **Make it the Home app** and check that Android agrees:

   ```powershell
   adb shell cmd package set-home-activity com.vilgot.tvlauncher/.MainActivity
   adb shell cmd package resolve-activity -a android.intent.action.MAIN -c android.intent.category.HOME
   ```

   The output should mention `com.vilgot.tvlauncher`. Press Home on the remote to test.

   **Do not disable the stock launcher** (`com.google.android.apps.tv.launcherx`) unless the output above shows our app. Disabling it before that can leave a blank home screen.

Spotify art only shows when Spotify is playing **on the box** (for example by picking the box in Spotify Connect from your phone). Playback that stays on the phone is not visible to it.

## If something goes wrong

- Stock home screen back: `adb shell pm enable com.google.android.apps.tv.launcherx`
- The "Stock launcher" tile in the app grid also opens it.
- Remove the launcher: `adb uninstall com.vilgot.tvlauncher`

## Tweak the look

Edit `app/src/main/assets/www/config.js`:

- `blurPx`: glass blur strength. Lower it if the UI stutters.
- `performanceMode: true`: no blur at all, solid translucent panels.
- `wallpaper`: path to the wallpaper (put your image in `wallpapers/`).

Preview the UI on a PC without the box: `npm run preview -- --playing` writes screenshots (`preview-*.png`). Run the web tests with `npm test`.
