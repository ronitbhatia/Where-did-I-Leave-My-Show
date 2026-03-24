(function (global) {
  "use strict";

  const STORAGE_KEY = "watchlistEntries";
  const BACKUP_VERSION = 1;

  const WATCH_STATUS = {
    QUEUE: "queue",
    WATCHING: "watching",
    DONE: "done"
  };

  const STATUS_LABEL = {
    queue: "Up next",
    watching: "Watching",
    done: "Done"
  };

  function uid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
  }

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

  async function loadEntries() {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    return Array.isArray(data[STORAGE_KEY]) ? data[STORAGE_KEY] : [];
  }

  async function saveEntries(entries) {
    await chrome.storage.local.set({ [STORAGE_KEY]: entries });
  }

  function normalizeWatchStatus(raw) {
    if (raw === WATCH_STATUS.QUEUE || raw === WATCH_STATUS.WATCHING || raw === WATCH_STATUS.DONE) {
      return raw;
    }
    return WATCH_STATUS.WATCHING;
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
    const watchStatus = normalizeWatchStatus(raw.watchStatus);
    return { id, title, season, episode, timestampSec, notes, url, updatedAt, watchStatus };
  }

  function sortEntries(entries) {
    const rank = { queue: 0, watching: 1, done: 2 };
    return [...entries].sort((a, b) => {
      const ra = rank[a.watchStatus] ?? 1;
      const rb = rank[b.watchStatus] ?? 1;
      if (ra !== rb) return ra - rb;
      const ta = new Date(a.updatedAt || 0).getTime();
      const tb = new Date(b.updatedAt || 0).getTime();
      return tb - ta;
    });
  }

  function filterEntries(entries, { query, statusFilter }) {
    let list = entries;
    const q = (query || "").trim().toLowerCase();
    if (q) {
      list = list.filter((e) => {
        const t = (e.title || "").toLowerCase();
        const n = (e.notes || "").toLowerCase();
        return t.includes(q) || n.includes(q);
      });
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((e) => (e.watchStatus || WATCH_STATUS.WATCHING) === statusFilter);
    }
    return sortEntries(list);
  }

  function renderList(container, entries, handlers) {
    const { onEdit, onDelete, onStatusChange } = handlers;
    container.innerHTML = "";

    for (const e of entries) {
      const li = document.createElement("li");
      li.className = "card";

      const status = e.watchStatus || WATCH_STATUS.WATCHING;

      const rowTop = document.createElement("div");
      rowTop.className = "card-top";

      const title = document.createElement("p");
      title.className = "card-title";
      title.textContent = e.title || "Untitled";

      const statusWrap = document.createElement("div");
      statusWrap.className = "status-wrap";
      const sel = document.createElement("select");
      sel.className = "status-select";
      sel.setAttribute("aria-label", "List status for " + (e.title || "show"));
      for (const [val, lab] of Object.entries(STATUS_LABEL)) {
        const opt = document.createElement("option");
        opt.value = val;
        opt.textContent = lab;
        if (val === status) opt.selected = true;
        sel.appendChild(opt);
      }
      sel.addEventListener("change", () => {
        onStatusChange(e.id, sel.value);
      });
      statusWrap.appendChild(sel);
      rowTop.appendChild(title);
      rowTop.appendChild(statusWrap);
      li.appendChild(rowTop);

      const ts = e.timestampSec != null ? formatSeconds(e.timestampSec) : "—";
      const se =
        e.season != null || e.episode != null
          ? `S${e.season != null ? e.season : "?"} E${e.episode != null ? e.episode : "?"}`
          : "Season / episode not set";

      const meta = document.createElement("p");
      meta.className = "card-meta";
      meta.textContent = `${se} · ${ts}`;

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
      btnEdit.addEventListener("click", () => onEdit(e));

      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "btn danger icon";
      btnDel.textContent = "Delete";
      btnDel.addEventListener("click", () => onDelete(e.id));

      actions.appendChild(btnEdit);
      actions.appendChild(btnDel);
      li.appendChild(actions);
      container.appendChild(li);
    }
  }

  global.WL = {
    STORAGE_KEY,
    BACKUP_VERSION,
    WATCH_STATUS,
    STATUS_LABEL,
    uid,
    parseTimeToSeconds,
    formatSeconds,
    loadEntries,
    saveEntries,
    normalizeEntry,
    sortEntries,
    filterEntries,
    renderList
  };
})(typeof self !== "undefined" ? self : window);
