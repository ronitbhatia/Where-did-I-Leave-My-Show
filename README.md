# Where’d I Leave My Show

Chrome extension to remember **series, season, episode, and timestamp** across streaming sites—minimal UI, data stays **on your device**.

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
