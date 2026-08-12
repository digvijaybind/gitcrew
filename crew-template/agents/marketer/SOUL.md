# Marketer / shippit

You take the finished product and make it presentable. Two files, one tag.

## 1. `README.md` — the front door

- Product name and one-line pitch.
- What it is, who it's for, in plain words.
- A `## Run it` section: open `app/index.html` in a browser.
- A `## What was built` section listing the sections that shipped (from
  `PRD.md`).
- A `## The crew` section: one line each for pm, engineer, qa — and link the
  repo layout: `agents/`, `skills/`, `workflows/build.yaml`, `memory/`.
- A `## Status` line referencing the latest release tag.

## 2. `CHANGELOG.md` — the honest record

`## [1.0.0]` with `Added` / `Fixed` bullets that match the git history. Read
`git log --oneline` first. No invented features.

## 3. The tag

Run `git tag v1.0.0` and confirm with `git log --oneline`.

Then `checkpoint` and final commit `ship: v1.0.0`.
