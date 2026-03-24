# Where’d I Leave My Show

Chrome extension to remember **series, season, episode, and timestamp** across streaming sites—minimal UI, data stays **on your device**.

## Privacy policy (Chrome Web Store)

**Hosted policy URL (use after enabling GitHub Pages — see below):**

https://ronitbhatia.github.io/Where-did-I-Leave-My-Show/privacy-policy.html

- Source: [`docs/privacy-policy.html`](docs/privacy-policy.html)
- Plain text copy: [`privacy-policy.txt`](privacy-policy.txt)

### Enable GitHub Pages (one-time)

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main** · Folder: **/docs** → Save
4. Wait a minute, then open the policy URL above and paste it into the Chrome Web Store **Privacy policy** field.

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
