(function () {
  "use strict";

  const WL = window.WL;
  const $ = (id) => document.getElementById(id);

  const els = {
    list: $("list"),
    empty: $("empty"),
    count: $("count"),
    wlSearch: $("wlSearch"),
    wlChips: $("wlChips"),
    quickTitle: $("quickTitle"),
    quickAdd: $("quickAdd"),
    btnExport: $("btnExport"),
    btnImport: $("btnImport"),
    importFile: $("importFile")
  };

  let statusFilter = "all";
  let searchQuery = "";

  function showToast(message) {
    let t = document.getElementById("wlToast");
    if (!t) {
      t = document.createElement("p");
      t.id = "wlToast";
      t.className = "toast toast-page";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.insertBefore(t, document.body.firstChild);
    }
    t.textContent = message;
    t.hidden = false;
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      t.hidden = true;
      t.textContent = "";
    }, 2200);
  }

  async function refreshList() {
    const all = await WL.loadEntries();
    els.count.textContent = String(all.length);
    const filtered = WL.filterEntries(all, { query: searchQuery, statusFilter });
    els.empty.hidden = filtered.length > 0;

    WL.renderList(els.list, filtered, {
      onEdit: () => {
        showToast("Use the extension icon → “This tab” to edit details.");
      },
      onDelete: async (id) => {
        const next = (await WL.loadEntries()).filter((x) => x.id !== id);
        await WL.saveEntries(next);
        await refreshList();
        showToast("Removed.");
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
        showToast("Updated.");
      }
    });
  }

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
    showToast("Added to Up next.");
  });

  els.quickTitle.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      els.quickAdd.click();
    }
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
    showToast("Backup downloaded.");
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
        showToast("Invalid backup file.");
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
      showToast(`Imported ${next.length} show(s).`);
    } catch {
      showToast("Could not read that file.");
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes[WL.STORAGE_KEY]) {
      refreshList();
    }
  });

  refreshList();
})();
