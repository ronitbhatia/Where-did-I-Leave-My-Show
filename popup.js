(function () {
  "use strict";

  const WL = window.WL;
  const $ = (id) => document.getElementById(id);

  const els = {
    form: $("form"),
    title: $("title"),
    watchStatus: $("watchStatus"),
    season: $("season"),
    episode: $("episode"),
    timestamp: $("timestamp"),
    notes: $("notes"),
    url: $("url"),
    editId: $("editId"),
    list: $("list"),
    empty: $("empty"),
    count: $("count"),
    btnCapture: $("btnCapture"),
    btnNow: $("btnNow"),
    btnClear: $("btnClear"),
    captureHint: $("captureHint"),
    editingBanner: $("editingBanner"),
    btnSave: $("btnSave"),
    status: $("status"),
    btnExport: $("btnExport"),
    btnImport: $("btnImport"),
    importFile: $("importFile"),
    kbdHint: $("kbdHint"),
    tabWatchlist: $("tabWatchlist"),
    tabCapture: $("tabCapture"),
    panelWatchlist: $("panelWatchlist"),
    panelCapture: $("panelCapture"),
    wlSearch: $("wlSearch"),
    wlChips: $("wlChips"),
    quickTitle: $("quickTitle"),
    quickAdd: $("quickAdd"),
    openFullPage: $("openFullPage")
  };

  const SAVE_LABEL = "Save";

  let statusFilter = "all";
  let searchQuery = "";

  function isRestrictedUrl(url) {
    if (!url) return true;
    const u = url.toLowerCase();
    return (
      u.startsWith("chrome://") ||
      u.startsWith("chrome-extension://") ||
      u.startsWith("edge://") ||
      u.startsWith("about:") ||
      u.startsWith("devtools:") ||
      u.startsWith("view-source:") ||
      u.startsWith("https://chrome.google.com/webstore") ||
      u.startsWith("https://chromewebstore.google.com/")
    );
  }

  async function getTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function injectContentScript(tabId) {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      files: ["content.js"]
    });
  }

  async function getPageContext() {
    const tab = await getTab();
    if (!tab?.id) return null;
    if (isRestrictedUrl(tab.url)) {
      return { restricted: true };
    }
    try {
      await injectContentScript(tab.id);
    } catch {
      return { error: true, injectFailed: true };
    }
    try {
      const res = await chrome.tabs.sendMessage(tab.id, { type: "WATCHLIST_GET_CONTEXT" });
      return res;
    } catch {
      return { error: true };
    }
  }

  function setEditingUi(on) {
    els.editingBanner.hidden = !on;
  }

  function showStatus(message) {
    els.status.textContent = message;
    els.status.hidden = false;
    window.clearTimeout(showStatus._t);
    showStatus._t = window.setTimeout(() => {
      els.status.hidden = true;
      els.status.textContent = "";
    }, 2200);
  }

  function flashSaved() {
    const btn = els.btnSave;
    btn.disabled = true;
    btn.textContent = "Saved";
    window.setTimeout(() => {
      btn.textContent = SAVE_LABEL;
      btn.disabled = false;
    }, 1200);
  }

  function applyContext(ctx) {
    if (!ctx || ctx.restricted) {
      els.captureHint.textContent = "Open a streaming tab in this window, then try again.";
      return;
    }
    if (ctx.error) {
      els.captureHint.textContent = ctx.injectFailed
        ? "This page doesn’t allow reading the player. Type the time manually or try another tab."
        : "Reload the page once, then try again.";
      return;
    }
    if (ctx.pageTitle && !els.title.value.trim()) {
      els.title.value = ctx.pageTitle;
    }
    if (ctx.url) {
      els.url.value = ctx.url;
    }
    els.watchStatus.value = WL.WATCH_STATUS.WATCHING;
    if (ctx.hasVideo && ctx.currentTime != null) {
      els.timestamp.value = WL.formatSeconds(ctx.currentTime);
      els.captureHint.textContent = ctx.paused ? "Video paused — time captured." : "Playing — time captured.";
    } else {
      els.captureHint.textContent = "No video found — title and link filled from the tab.";
    }
  }

  async function refreshList() {
    const all = await WL.loadEntries();
    els.count.textContent = String(all.length);
    const filtered = WL.filterEntries(all, { query: searchQuery, statusFilter });
    els.empty.hidden = filtered.length > 0;

    WL.renderList(els.list, filtered, {
      onEdit: (e) => {
        els.editId.value = e.id;
        setEditingUi(true);
        els.title.value = e.title || "";
        els.watchStatus.value = e.watchStatus || WL.WATCH_STATUS.WATCHING;
        els.season.value = e.season != null ? String(e.season) : "";
        els.episode.value = e.episode != null ? String(e.episode) : "";
        els.timestamp.value = e.timestampSec != null ? WL.formatSeconds(e.timestampSec) : "";
        els.notes.value = e.notes || "";
        els.url.value = e.url || "";
        setTab("capture");
        els.title.focus();
      },
      onDelete: async (id) => {
        const next = (await WL.loadEntries()).filter((x) => x.id !== id);
        await WL.saveEntries(next);
        await refreshList();
        if (els.editId.value === id) {
          els.form.reset();
          els.editId.value = "";
          els.watchStatus.value = WL.WATCH_STATUS.WATCHING;
          setEditingUi(false);
        }
      },
      onStatusChange: async (id, newStatus) => {
        const entries = await WL.loadEntries();
        const idx = entries.findIndex((x) => x.id === id);
        if (idx < 0) return;
        entries[idx] = {
          ...entries[idx],
          watchStatus: newStatus,
          updatedAt: new Date().toISOString()
        };
        await WL.saveEntries(entries);
        await refreshList();
        showStatus("Updated.");
      }
    });
  }

  function setTab(which) {
    const watch = which === "watchlist";
    els.tabWatchlist.setAttribute("aria-selected", watch ? "true" : "false");
    els.tabCapture.setAttribute("aria-selected", watch ? "false" : "true");
    els.panelWatchlist.hidden = !watch;
    els.panelCapture.hidden = watch;
    try {
      sessionStorage.setItem("wlPopupTab", which);
    } catch {
      /* ignore */
    }
  }

  els.tabWatchlist.addEventListener("click", () => setTab("watchlist"));
  els.tabCapture.addEventListener("click", () => setTab("capture"));

  els.wlSearch.addEventListener("input", () => {
    searchQuery = els.wlSearch.value;
    refreshList();
  });

  els.wlChips.addEventListener("click", (ev) => {
    const btn = ev.target.closest(".chip");
    if (!btn || !els.wlChips.contains(btn)) return;
    const f = btn.getAttribute("data-filter");
    if (!f) return;
    statusFilter = f;
    els.wlChips.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === btn));
    refreshList();
  });

  els.quickAdd.addEventListener("click", async () => {
    const t = els.quickTitle.value.trim();
    if (!t) {
      els.quickTitle.focus();
      return;
    }
    const entries = await WL.loadEntries();
    entries.push({
      id: WL.uid(),
      title: t,
      season: null,
      episode: null,
      timestampSec: null,
      notes: undefined,
      url: undefined,
      updatedAt: new Date().toISOString(),
      watchStatus: WL.WATCH_STATUS.QUEUE
    });
    await WL.saveEntries(entries);
    els.quickTitle.value = "";
    await refreshList();
    showStatus("Added to Up next.");
  });

  els.quickTitle.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      els.quickAdd.click();
    }
  });

  els.openFullPage.addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("watchlist.html") });
  });

  els.btnCapture.addEventListener("click", async () => {
    const ctx = await getPageContext();
    applyContext(ctx);
  });

  els.btnNow.addEventListener("click", async () => {
    const ctx = await getPageContext();
    if (ctx && !ctx.restricted && !ctx.error && ctx.hasVideo && ctx.currentTime != null) {
      els.timestamp.value = WL.formatSeconds(ctx.currentTime);
    }
  });

  els.btnClear.addEventListener("click", () => {
    els.form.reset();
    els.editId.value = "";
    els.watchStatus.value = WL.WATCH_STATUS.WATCHING;
    setEditingUi(false);
  });

  els.btnExport.addEventListener("click", async () => {
    const entries = await WL.loadEntries();
    const payload = {
      watchlistBackupVersion: WL.BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      entries
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `whered-i-leave-my-show-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus("Backup downloaded.");
  });

  els.btnImport.addEventListener("click", () => {
    els.importFile.click();
  });

  els.importFile.addEventListener("change", async () => {
    const file = els.importFile.files?.[0];
    els.importFile.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const rawList = Array.isArray(data.entries) ? data.entries : Array.isArray(data) ? data : null;
      if (!rawList) {
        showStatus("Invalid backup file.");
        return;
      }
      const ok = window.confirm(
        "Replace all saved shows with this backup? This cannot be undone (export first if unsure)."
      );
      if (!ok) return;
      const next = [];
      for (const item of rawList) {
        const n = WL.normalizeEntry(item);
        if (n) next.push(n);
      }
      await WL.saveEntries(next);
      await refreshList();
      showStatus(`Imported ${next.length} show(s).`);
    } catch {
      showStatus("Could not read that file.");
    }
  });

  els.form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const title = els.title.value.trim();
    if (!title) return;

    const seasonRaw = els.season.value.trim();
    const episodeRaw = els.episode.value.trim();
    const season = seasonRaw === "" ? null : parseInt(seasonRaw, 10);
    const episode = episodeRaw === "" ? null : parseInt(episodeRaw, 10);

    const tsSec = WL.parseTimeToSeconds(els.timestamp.value);
    const notes = els.notes.value.trim();
    const url = els.url.value.trim();
    const watchStatus = els.watchStatus.value || WL.WATCH_STATUS.WATCHING;

    const entries = await WL.loadEntries();
    const editId = els.editId.value;
    const now = new Date().toISOString();

    if (editId) {
      const idx = entries.findIndex((x) => x.id === editId);
      if (idx >= 0) {
        entries[idx] = {
          ...entries[idx],
          title,
          watchStatus,
          season: Number.isFinite(season) ? season : null,
          episode: Number.isFinite(episode) ? episode : null,
          timestampSec: tsSec,
          notes: notes || undefined,
          url: url || undefined,
          updatedAt: now
        };
      }
    } else {
      entries.push({
        id: WL.uid(),
        title,
        watchStatus,
        season: Number.isFinite(season) ? season : null,
        episode: Number.isFinite(episode) ? episode : null,
        timestampSec: tsSec,
        notes: notes || undefined,
        url: url || undefined,
        updatedAt: now
      });
    }

    await WL.saveEntries(entries);
    els.form.reset();
    els.editId.value = "";
    els.watchStatus.value = WL.WATCH_STATUS.WATCHING;
    setEditingUi(false);
    await refreshList();
    flashSaved();
    showStatus("Saved to this device.");
    setTab("watchlist");
  });

  (function setShortcutLabel() {
    const mac =
      /Mac|iPhone|iPod|iPad/i.test(navigator.platform || "") || /\bMac OS X\b/i.test(navigator.userAgent || "");
    if (els.kbdHint) els.kbdHint.textContent = mac ? "⌘⇧Y" : "Ctrl+Shift+Y";
  })();

  (function initTab() {
    let t = "watchlist";
    try {
      t = sessionStorage.getItem("wlPopupTab") || "watchlist";
    } catch {
      /* ignore */
    }
    setTab(t === "capture" ? "capture" : "watchlist");
  })();

  refreshList();

  getPageContext().then((ctx) => {
    if (ctx && !ctx.restricted && !ctx.error && ctx.pageTitle) {
      els.title.placeholder = ctx.pageTitle.slice(0, 60);
    }
  });
})();
