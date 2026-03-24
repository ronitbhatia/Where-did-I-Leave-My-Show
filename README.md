# Where’d I Leave My Show

Chrome extension to remember **series, season, episode, and timestamp** across streaming sites—watchlist, search, and statuses—minimal UI, data stays **on your device**.

## Chrome Web Store description (copy / paste)

Use the text below for the **detailed description** field in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

**Where’d I Leave My Show** is a small Chrome extension for anyone who jumps between Netflix, Prime Video, and other sites and loses track of **which episode** they were on—or **how far** they got.

**What it does**

- **Watchlist** — Keep every show in one place. **Search** your list and filter by **All**, **Up next**, **Watching**, or **Done**.
- **Quick add** — Type a title and add it to **Up next** in one step (no video tab required).
- **Per-show status** — Mark each title as **Up next**, **Watching**, or **Done** from the list (or set it when you save).
- **This tab** — **Fill from this page** pulls the tab title, URL, and (when possible) the current time from the video on the page. Tweak season, episode, timestamp, notes, and link, then save.
- **Full watchlist** — Open your list in a **full browser tab** for more space; it stays in sync with the popup.
- **Export / import** — Download or restore a backup **JSON** file—your data, your copy.

**Privacy**

Your list is stored **only in Chrome on your device** (local storage). We don’t run a backend for this extension.

**Open source**

Code and updates: [github.com/ronitbhatia/Where-did-I-Leave-My-Show](https://github.com/ronitbhatia/Where-did-I-Leave-My-Show)

---

## Privacy policy (Chrome Web Store)

**Hosted policy URL (after GitHub Pages is enabled — see below):**

https://ronitbhatia.github.io/Where-did-I-Leave-My-Show/privacy-policy.html

- Source: [`privacy-policy.html`](privacy-policy.html) (repository **root**, not `/docs`)
- Plain text copy: [`privacy-policy.txt`](privacy-policy.txt)

### Enable GitHub Pages (one-time)

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main** · Folder: **/ (root)** → **Save**  
   (Must be **root**, because `privacy-policy.html` lives next to `manifest.json`.)
4. Wait 1–2 minutes for the first deploy, then open the policy URL above.  
   Root URL `https://ronitbhatia.github.io/Where-did-I-Leave-My-Show/` redirects to the policy via [`index.html`](index.html).

If you still see **404**, confirm Pages shows “Your site is live at …” and that you did not select **/docs** unless you move the HTML back into `docs/`.

## Install (developer / unpacked)

1. Clone this repository.
2. Chrome → `chrome://extensions` → enable **Developer mode**
3. **Load unpacked** → select this folder (the one containing `manifest.json`).

## Permissions

- **storage** — Save your list locally.
- **activeTab** — Only the tab you’re using when you open the extension.
- **scripting** — Inject a small script on that tab when you use **Fill from this page** / **Now**.

See the privacy policy for details.

## Keyboard shortcut

- **macOS:** ⌘⇧Y  
- **Windows / Linux:** Ctrl+Shift+Y  

(Opens the extension popup — configurable in Chrome’s extension shortcuts.)

## License

See [LICENSE](LICENSE).
