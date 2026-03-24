# Chrome Web Store — submission notes

**Extension name:** Where’d I Leave My Show

Use this when filling the listing and the **Privacy practices** questionnaire.

## Single purpose

Help users remember which show, season, episode, and timestamp they were watching, with optional links and notes.

## Permission justifications (copy into the form)

**storage** — Saves the user’s watch list locally in the browser. No account and no remote server.

**activeTab** — Only accesses the tab that is active when the user opens the extension or uses its actions, to read the page title and URL and (when possible) the current time from the page’s video player.

**scripting** — Injects a small script into that same active tab only when the user uses “Fill from this page” or “Now,” so the extension can read title/URL/video time without requesting broad access to every website.

## Host permissions

None. The extension does not use `<all_urls>` or persistent host access.

## Privacy policy URL (canonical)

After you enable **GitHub Pages** (branch `main`, folder `/docs`), use:

**https://ronitbhatia.github.io/Where-did-I-Leave-My-Show/privacy-policy.html**

Source file in this repo: [`docs/privacy-policy.html`](docs/privacy-policy.html).

Paste that **https** URL into the Chrome Web Store **Privacy policy** field. Plain text: [`privacy-policy.txt`](privacy-policy.txt).

## Data handling (typical answers)

- **User data collected:** Yes — stored locally only (watch list entries).
- **Encryption in transit:** Not applicable (no transmission to a backend for core features).
- **Data sale:** No.

## ZIP for upload

Zip the **contents** of `watchlist-extension/` (not the parent folder), so `manifest.json` is at the root of the zip.

## Reviewer notes (optional)

Optional shortcut: Command+Shift+Y (macOS) / Ctrl+Shift+Y (Windows/Linux) opens the action, per `commands._execute_action` in `manifest.json`.
