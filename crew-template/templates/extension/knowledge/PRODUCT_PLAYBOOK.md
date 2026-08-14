# Chrome Extension Playbook

The law for everything that ships from this repo. Products are **Manifest V3 Chrome Extensions** with popup, optional background/service worker, and content scripts.

## 1. Tech Stack

- **Manifest**: V3 (required)
- **Language**: TypeScript (ESM), compiled with `esbuild` or `vite`
- **Popup**: React/Preact or vanilla (single HTML + JS)
- **Background**: Service worker (`background.ts`)
- **Content Scripts**: isolated world, message passing
- **Storage**: `chrome.storage.local` / `sync`
- **Permissions**: minimal, host permissions only when needed
- **Icons**: 16/32/48/128px, generated from single SVG source
- **Build**: `npm run build` → `dist/` (zip-ready for Chrome Web Store)

## 2. Project Structure

```
src/
  manifest.ts         ← programmatic manifest (type-safe)
  popup/
    index.html        ← popup UI
    app.tsx           ← React/Preact entry
    styles.css        ← scoped to popup
  background/
    index.ts          ← service worker: events, alarms, messaging
  content/
    index.ts          ← content script: DOM interaction, injection
  shared/
    types.ts          ← message types, storage schemas
    utils.ts          ← helpers (storage, messaging)
  styles/
    global.css        ← injected styles (if needed)
public/
  icons/              ← icon assets
dist/                 ← build output (gitignored)
package.json          ← scripts: dev, build, package, lint
vite.config.ts        ← or esbuild config
```

## 3. Architecture Rules

- **Popup**: mounts on click, unmounts on close — keep it lightweight
- **Background**: service worker (not persistent), handle:
  - `chrome.runtime.onInstalled` (setup)
  - `chrome.alarms` (periodic tasks)
  - `chrome.runtime.onMessage` (popup ↔ content ↔ background)
- **Content Scripts**: declare `matches` precisely, use `run_at: "document_idle"`
- **Messaging**: typed request/response via `chrome.runtime.sendMessage`
- **Storage**: schema-validated (Zod), versioned migrations
- **Permissions**: declare only what you use, optional permissions requested at runtime

## 4. UI/UX Standards

- Popup: 360-400px wide, max 600px tall, scrollable
- Follow Chrome's design language (Material-ish)
- Dark mode via `prefers-color-scheme` media query
- Keyboard navigable, ARIA labels on all interactive elements
- Loading states for async operations
- Toast notifications via background script (offscreen document if needed)

## 5. Testing & Quality

- Unit: pure logic (storage, messaging, utils) — Vitest
- E2E: Playwright + Chrome DevTools Protocol (load extension, interact)
- Lint: ESLint + `eslint-plugin-chrome-extension`
- Type-check: `tsc --noEmit`
- Package: `npm run package` → `dist.zip` (Chrome Web Store ready)

## 6. Acceptance Criteria (v1.0.0)

- `npm run dev` — hot reload popup + background
- `npm run build` → `dist/` with valid `manifest.json`
- `npm run package` → `dist.zip` < 2MB
- Load unpacked in Chrome → works end-to-end
- Popup opens, interacts with background/content
- All declared permissions are actually used
- No console errors in popup/background/content

## 7. Copy Rules

- Popup copy: concise, action-oriented
- No lorem ipsum in UI
- Permission rationale in `optional_permissions` descriptions
- Extension name ≤ 45 chars, description ≤ 132 chars