// gitcrew — publish the latest built product to the live GitHub Pages site.
// Called automatically by crew.js when a run finishes (mode-independent).
// The gh-pages branch lives in a worktree at <root>/site-live; this module
// syncs the newest "done" product's app/ (or full repo if no app/) into it,
// commits, and pushes. Pushing uses whatever git credentials are configured
// (Credential Manager / gh auth) — no token is stored in the repo.

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const store = require("./store");

const SITE_DIR = path.join(store.ROOT, "site-live");
const BRANCH = "gh-pages";

function sh(args, cwd) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function latestDoneCrew() {
  const done = store
    .list()
    .filter((m) => m.status === "done")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return done[0] || null;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// Copy product files from a workspace into the gh-pages worktree, replacing
// whatever is there so the live site always mirrors the newest build.
function syncProduct(crew) {
  const repo = store.repoDir(crew.id);
  const appDir = path.join(repo, "app");
  const src = fs.existsSync(appDir) ? appDir : repo;

  // Clean the worktree (keep .git)
  for (const entry of fs.readdirSync(SITE_DIR)) {
    if (entry === ".git") continue;
    fs.rmSync(path.join(SITE_DIR, entry), { recursive: true, force: true });
  }
  copyDir(src, SITE_DIR);
}

async function publish({ emit } = {}) {
  const emit_ = (ev) => emit && emit(ev);
  const crew = latestDoneCrew();
  if (!crew) {
    emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: "no completed crew to publish" });
    return { ok: false, reason: "no crew" };
  }
  if (!fs.existsSync(SITE_DIR)) {
    emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: "site-live worktree missing — run `git worktree add --orphan -B gh-pages site-live`" });
    return { ok: false, reason: "no worktree" };
  }

  syncProduct(crew);
  const product = crew.product || "product";

  try {
    sh(["add", "-A"], SITE_DIR);
    const changed = sh(["status", "--porcelain"], SITE_DIR).trim();
    if (changed) {
      sh(["commit", "-m", `deploy: ${product} (crew ${crew.id})`], SITE_DIR);
      sh(["push", "origin", BRANCH], SITE_DIR);
    }
  } catch (err) {
    emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: `publish failed: ${String(err.message || err)}` });
    return { ok: false, reason: String(err.message || err) };
  }

  emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: `published ${product} → gh-pages` });
  return { ok: true, crew: crew.id, product };
}

module.exports = { publish, SITE_DIR, BRANCH };
