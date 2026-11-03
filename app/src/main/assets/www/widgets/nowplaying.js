// Now-playing widget. viewState is pure so it can be tested without a DOM.

export function viewState(np) {
  const playing = !!np && np.playing === true;
  if (!playing) return { mode: "idle", showArt: false, title: "", artist: "" };
  return {
    mode: "playing",
    showArt: !!np.artUrl,
    title: np.title ?? "",
    artist: np.artist ?? "",
  };
}

export function mount(el) {
  return {
    onNowPlaying(np) {
      const s = viewState(np);
      if (s.mode === "idle") {
        el.replaceChildren(); // empty widgets are hidden by CSS
        return;
      }
      const card = document.createElement("div");
      card.className = "np";
      if (s.showArt) {
        const img = document.createElement("img");
        img.className = "np-cover";
        img.alt = "";
        img.src = np.artUrl;
        card.append(img);
      }
      const text = document.createElement("div");
      text.className = "np-text";
      const title = document.createElement("div");
      title.className = "np-title";
      title.textContent = s.title;
      const artist = document.createElement("div");
      artist.className = "np-artist";
      artist.textContent = s.artist;
      text.append(title, artist);
      card.append(text);
      el.replaceChildren(card);
    },
  };
}
