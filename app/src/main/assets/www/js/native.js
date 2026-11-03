// The only place the page talks to the Android bridge.
// Without window.Android (desktop browser preview) it returns mock data.

const hasNative = () => typeof window !== "undefined" && !!window.Android;

const MOCK_APPS = [
  ["com.google.android.youtube.tv", "YouTube", "#ff3b30"],
  ["com.netflix.ninja", "Netflix", "#e50914"],
  ["com.amazon.amazonvideo.livingroom", "Prime Video", "#00a8e1"],
  ["com.spotify.tv.android", "Spotify", "#1db954"],
  ["com.plexapp.android", "Plex", "#e5a00d"],
  ["com.crunchyroll.crunchyroid", "Crunchyroll", "#f47521"],
  ["com.disney.disneyplus", "Disney+", "#113ccf"],
  ["com.android.tv.settings", "Settings", "#8e8e93"],
  ["com.google.android.apps.tv.launcherx", "Stock launcher", "#5856d6"],
].map(([pkg, label, color]) => ({ pkg, label, color }));

export async function getApps() {
  if (hasNative()) return JSON.parse(window.Android.getApps());
  return MOCK_APPS.map(({ pkg, label }) => ({ pkg, label }));
}

export function launch(pkg) {
  if (hasNative()) window.Android.launch(pkg);
  else console.log("launch", pkg);
}

export function iconUrl(pkg) {
  if (hasNative()) return `https://appassets.androidplatform.net/app-icon/${pkg}`;
  const app = MOCK_APPS.find((a) => a.pkg === pkg);
  const letter = (app?.label ?? "?")[0];
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">` +
    `<rect width="128" height="128" rx="28" fill="${app?.color ?? "#666"}"/>` +
    `<text x="64" y="86" font-size="64" font-family="sans-serif" font-weight="700" ` +
    `text-anchor="middle" fill="#fff">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function mockArt() {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#ff6a88"/><stop offset="1" stop-color="#3a1c71"/></linearGradient></defs>` +
    `<rect width="640" height="640" fill="url(#g)"/>` +
    `<circle cx="320" cy="320" r="170" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="22"/>` +
    `<circle cx="320" cy="320" r="40" fill="#fff" fill-opacity=".8"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// cb receives {playing, title, artist, album, artUrl}
export function onNowPlaying(cb) {
  if (hasNative()) {
    window.onNowPlaying = cb;
    window.Android.nowPlayingReady(); // ask Kotlin to send the current state now
    return;
  }
  const mock = new URLSearchParams(location.search).get("mock");
  if (mock === "playing") {
    cb({ playing: true, title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", artUrl: mockArt() });
  } else if (mock === "playing-noart") {
    cb({ playing: true, title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", artUrl: null });
  } else {
    cb({ playing: false, title: "", artist: "", album: "", artUrl: null });
  }
}
