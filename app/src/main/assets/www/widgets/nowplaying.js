// Now-playing stage: sharp album art with title / artist / album beneath.
// viewState is pure so it can be tested without a DOM.

export function viewState(np) {
  const playing = !!np && np.playing === true;
  if (!playing) return { mode: "idle", showArt: false, title: "", artist: "", album: "" };
  return {
    mode: "playing",
    showArt: !!np.artUrl,
    title: np.title ?? "",
    artist: np.artist ?? "",
    album: np.album ?? "",
  };
}

export function mount(el) {
  el.innerHTML =
    '<div class="cover glass"><img alt="" hidden></div>' +
    '<div class="np-title"></div><div class="np-artist"></div><div class="np-album"></div>';
  const img = el.querySelector("img");
  const title = el.querySelector(".np-title");
  const artist = el.querySelector(".np-artist");
  const album = el.querySelector(".np-album");

  return {
    onNowPlaying(np) {
      const s = viewState(np);
      if (s.showArt) {
        img.src = np.artUrl;
        img.hidden = false;
      } else {
        img.hidden = true; // blank glass square shows through
        img.removeAttribute("src");
      }
      title.textContent = s.title;
      artist.textContent = s.artist;
      album.textContent = s.album;
    },
  };
}
