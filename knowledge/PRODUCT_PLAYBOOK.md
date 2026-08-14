# Product Playbook

The law for everything that ships from this repo. Products are **dark,
premium, single-file static sites** that open by double-clicking
`app/index.html`.

## 1. Palette

```
--bg:        #0b0d10   (page background)
--panel:     #11151a   (cards / sections)
--panel2:    #161b22   (raised surfaces)
--line:      #222b36   (borders, hairline rules)
--text:      #e8ecf1   (primary text)
--muted:     #8a94a3   (secondary text)
--accent:    #5b8cff   (primary accent — links, buttons, highlights)
--accent2:   #43d9a3   (secondary accent — success, "live" elements)
--warn:      #ffb454
--danger:    #ff5f6e
```

Use the accent sparingly — one dominant color, never a rainbow.

## 2. Type

- System stack, no webfonts: `font-family: "Inter", ui-sans-serif, system-ui,
  -apple-system, "Segoe UI", Roboto, sans-serif;`
- Mono for code/labels: `ui-monospace, "SF Mono", "JetBrains Mono", Menlo,
  monospace`.
- Display scale: hero headline `clamp(2.5rem, 6vw, 4.5rem)`, weight 800,
  letter-spacing `-0.03em`. Section headings `1.5-1.75rem`, weight 700.
- Body: `16px/1.65`, color `--text`, max line length ~65ch.

## 3. Layout

- **Hero**: full-viewport, centered or left-aligned headline, one supporting
  paragraph (muted), one primary CTA + one ghost CTA. No clutter.
- **Sections** (3-6): each with an eyebrow label (mono, uppercase, accent),
  a heading, and real content. Use cards with `--panel` background,
  `1px solid --line` border, `12px` radius, generous padding.
- Grid via CSS `grid`, gap `24px`. Responsive: collapse to one column under
  720px. `max-width: 1120px` page container, centered.
- Vertical rhythm: sections spaced `clamp(64px, 10vw, 120px)`.

## 4. Motion & detail

- Subtle `:hover` transitions (border/color shifts), `0.15s ease`.
- A restrained fade/slide-in on hero load via CSS `@keyframes`.
- No infinite bouncing, no parallax, no confetti. Tasteful only.

## 5. Copy rules

- **Never** lorem ipsum. Every word of copy is real and specific to the
  product idea in `PROJECT.md`.
- One line pitches under 12 words. Buttons say what they do ("Start building",
  not "Click here").
- No placeholder features; if a feature is cosmetic, don't claim it works.

## 6. Structure

```
app/
  index.html      ← semantic sections, one <link> to styles.css, one <script src="app.js"> at end of body
  styles.css      ← CSS custom properties at :root, all layout via grid/flex
  app.js          ← all interactivity (guarded by DOMContentLoaded), no globals leak
```

`<title>` and `<meta name="description">` set to the product. `lang="en"`.
Footer includes the product name and a tiny "built by a crew in git" line.

## 7. Acceptable advanced touches (optional)

- A small working demo widget tied to the product (counter, calculator,
  generator, filter, form with JS validation). Interactive = memorable.
- `prefers-color-scheme` handled via a media query if trivial. No dark/light
  toggle in v1.
