(function () {
  "use strict";

  if (window.__watchlistExtensionHooked) {
    return;
  }
  window.__watchlistExtensionHooked = true;

  function pickPrimaryVideo() {
    const list = Array.from(document.querySelectorAll("video"));
    if (!list.length) return null;
    return list.reduce((best, v) => {
      const a = v.clientWidth * v.clientHeight;
      const b = best.clientWidth * best.clientHeight;
      return a > b ? v : best;
    });
  }

  function safeTitle() {
    const raw = document.title || "";
    return raw
      .replace(/\s*[-|—]\s*(Netflix|Prime Video|YouTube|Disney\+|HBO Max|Max|Hulu|Apple TV|Paramount\+|Peacock|Cineby).*$/i, "")
      .trim();
  }

  function hostHint() {
    try {
      const h = location.hostname.replace(/^www\./, "");
      if (!h) return "";
      const parts = h.split(".");
      if (parts.length >= 2) {
        return parts[parts.length - 2].replace(/^\w/, (c) => c.toUpperCase());
      }
      return h;
    } catch {
      return "";
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== "WATCHLIST_GET_CONTEXT") return false;
    const video = pickPrimaryVideo();
    const payload = {
      ok: true,
      url: location.href,
      pageTitle: safeTitle() || document.title || "",
      platformGuess: hostHint(),
      hasVideo: Boolean(video),
      currentTime: video && Number.isFinite(video.currentTime) ? video.currentTime : null,
      duration: video && Number.isFinite(video.duration) && video.duration > 0 ? video.duration : null,
      paused: video ? video.paused : null
    };
    sendResponse(payload);
    return true;
  });
})();
