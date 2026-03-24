(function () {
  "use strict";

  const STORAGE_KEY = "watchlistEntries";
  const BACKUP_VERSION = 1;

  const $ = (id) => document.getElementById(id);

  const els = {
    form: $("form"),
    title: $("title"),
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
    kbdHint: $("kbdHint")
  };

  const SAVE_LABEL = "Save";

  function parseTimeToSeconds(str) {
    if (str == null) return null;
    const s = String(str).trim();
    if (!s) return null;
    const parts = s.split(":").map((p) => p.trim());
    if (parts.some((p) => p === "" || Number.isNaN(Number(p)))) return null;
    const nums = parts.map((p) => parseInt(p, 10));
    if (nums.some((n) => n < 0 || Number.isNaN(n))) return null;
    if (nums.length === 1) return nums[0];
    if (nums.length === 2) return nums[0] * 60 + nums[1];
    if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
    return null;
  }

  function formatSeconds(total) {
    if (total == null || !Number.isFinite(total) || total < 0) return "";
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = Math.floor(total % 60);
    if (h > 0) {
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

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
    if (ctx.hasVideo && ctx.currentTime != null) {
      els.timestamp.value = formatSeconds(ctx.currentTime);
      els.captureHint.textContent = ctx.paused ? "Video paused — time captured." : "Playing — time captured.";
    } else {
      els.captureHint.textContent = "No video found — title and link filled from the tab.";
    }
  }

  async function loadEntries() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  }

  async function saveEntries(entries) {
    await chrome.storage.local.set({ [STORAGE_KEY]: entries });
  }

  function normalizeEntry(raw) {
    if (!raw || typeof raw !== "object") return null;
    const title = typeof raw.title === "string" ? raw.title.trim() : "";
    if (!title) return null;
    const id = typeof raw.id === "string" && raw.id ? raw.id : uid();
    const season = raw.season != null && Number.isFinite(Number(raw.season)) ? parseInt(String(raw.season), 10) : null;
    const episode = raw.episode != null && Number.isFinite(Number(raw.episode)) ? parseInt(String(raw.episode), 10) : null;
    let timestampSec = null;
    if (raw.timestampSec != null && Number.isFinite(Number(raw.timestampSec))) {
      timestampSec = Number(raw.timestampSec);
    }
    const notes = typeof raw.notes === "string" && raw.notes.trim() ? raw.notes.trim() : undefined;
    const url = typeof raw.url === "string" && raw.url.trim() ? raw.url.trim() : undefined;
    const updatedAt =
      typeof raw.updatedAt === "string" && raw.updatedAt ? raw.updatedAt : new Date().toISOString();
    return { id, title, season, episode, timestampSec, notes, url, updatedAt };
  }

  function render(entries) {
    els.list.innerHTML = "";
    els.count.textContent = String(entries.length);
    els.empty.hidden = entries.length > 0;

    const sorted = [...entries].sort((a, b) => {
      const ta = new Date(a.updatedAt || 0).getTime();
      const tb = new Date(b.updatedAt || 0).getTime();
      return tb - ta;
    });

    for (const e of sorted) {
      const li = document.createElement("li");
      li.className = "card";

      const ts = e.timestampSec != null ? formatSeconds(e.timestampSec) : "—";
      const se =
        e.season != null || e.episode != null
          ? `S${e.season != null ? e.season : "?"} E${e.episode != null ? e.episode : "?"}`
          : "Season / episode not set";

      const title = document.createElement("p");
      title.className = "card-title";
      title.textContent = e.title || "Untitled";

      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = `${se} · ${ts}`;

      li.appendChild(title);
      li.appendChild(meta);

      if (e.notes) {
        const n = document.createElement("p");
        n.className = "card-notes";
        n.textContent = e.notes;
        li.appendChild(n);
      }

      const actions = document.createElement("div");
      actions.className = "card-actions";

      if (e.url) {
        const a = document.createElement("a");
        a.href = e.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = "Open link";
        actions.appendChild(a);
      }

      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn ghost icon";
      btnEdit.textContent = "Edit";
      btnEdit.addEventListener("click", () => {
        els.editId.value = e.id;
        setEditingUi(true);
        els.title.value = e.title || "";
        els.season.value = e.season != null ? String(e.season) : "";
        els.episode.value = e.episode != null ? String(e.episode) : "";
        els.timestamp.value = e.timestampSec != null ? formatSeconds(e.timestampSec) : "";
        els.notes.value = e.notes || "";
        els.url.value = e.url || "";
        els.title.focus();
      });

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn danger icon";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", async () => {
        const next = (await loadEntries()).filter((x) => x.id !== e.id);
        await saveEntries(next);
        render(next);
        if (els.editId.value === e.id) {
          els.form.reset();
          els.editId.value = "";
          setEditingUi(false);
        }
      });

      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
      li.appendChild(actions);
      els.list.appendChild(li);
    }
  }

  els.btnCapture.addEventListener("click", async () => {
    const ctx = await getPageContext();
    applyContext(ctx);
  });

  els.btnNow.addEventListener("click", async () => {
    const ctx = await getPageContext();
    if (ctx && !ctx.restricted && !ctx.error && ctx.hasVideo && ctx.currentTime != null) {
      els.timestamp.value = formatSeconds(ctx.currentTime);
    }
  });

  els.btnClear.addEventListener("click", () => {
    els.form.reset();
    els.editId.value = "";
    setEditingUi(false);
  });

  els.btnExport.addEventListener("click", async () => {
    const entries = await loadEntries();
    const payload = {
      watchlistBackupVersion: BACKUP_VERSION,
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
        const n = normalizeEntry(item);
        if (n) next.push(n);
      }
      await saveEntries(next);
      render(next);
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

    const tsSec = parseTimeToSeconds(els.timestamp.value);
    const notes = els.notes.value.trim();
    const url = els.url.value.trim();

    const entries = await loadEntries();
    const editId = els.editId.value;
    const now = new Date().toISOString();

    if (editId) {
      const idx = entries.findIndex((x) => x.id === editId);
      if (idx >= 0) {
        entries[idx] = {
          ...entries[idx],
          title,
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
        id: uid(),
        title,
        season: Number.isFinite(season) ? season : null,
        episode: Number.isFinite(episode) ? episode : null,
        timestampSec: tsSec,
        notes: notes || undefined,
        url: url || undefined,
        updatedAt: now
      });
    }

    await saveEntries(entries);
    els.form.reset();
    els.editId.value = "";
    setEditingUi(false);
    render(entries);
    flashSaved();
    showStatus("Saved to this device.");
  });

  (function setShortcutLabel() {
    const mac =
      /Mac|iPhone|iPod|iPad/i.test(navigator.platform || "") || /\bMac OS X\b/i.test(navigator.userAgent || "");
    if (els.kbdHint) els.kbdHint.textContent = mac ? "⌘⇧Y" : "Ctrl+Shift+Y";
  })();

  loadEntries().then(render);

  getPageContext().then((ctx) => {
    if (ctx && !ctx.restricted && !ctx.error && ctx.pageTitle) {
      els.title.placeholder = ctx.pageTitle.slice(0, 60);
    }
  });
})();
