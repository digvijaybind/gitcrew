// gitcrew — publish the latest built product to the live GitHub Pages site.
// Called automatically by crew.js when a run finishes (mode-independent).
// The gh-pages branch lives in a worktree at <root>/site-live; this module
// syncs the newest product's app/ (or full repo if no app/) into it, commits,
// and pushes. All git calls are async with a hard timeout so a slow/hung push
// can never block the server's event loop.

const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const store = require("./store");

const SITE_DIR = path.join(store.ROOT, "site-live");
const BRANCH = "gh-pages";
const TIMEOUT_MS = 30000;

function sh(args, cwd, env) {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd,
        encoding: "utf8",
        timeout: TIMEOUT_MS,
        killSignal: "SIGKILL",
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0", ...(env || {}) },
      },
      (err, stdout) => {
        if (err) {
          const msg = String((err && err.message) || err);
          reject(new Error(msg + (stdout ? " :: " + stdout.trim() : "")));
          return;
        }
        resolve((stdout || "").trim());
      }
    );
  });
}

// git push spawns git-remote-https which inherits stdout/stderr pipes; with
// default execFile stdio the child keeps the pipes open after git exits, so
// the promise never resolves. Detach all stdio for pushes (we only need the
// exit code + timeout). Auth via token URL when available. Note: do NOT set
// GIT_TERMINAL_PROMPT=0 here — it makes Git Credential Manager bail out
// instead of using stored creds, hanging the push on Windows.
function shPush(args, cwd, env) {
  return new Promise((resolve, reject) => {
    execFile(
      "git",
      args,
      {
        cwd,
        timeout: TIMEOUT_MS,
        killSignal: "SIGKILL",
        detached: true,
        stdio: ["ignore", "ignore", "ignore"],
        env: { ...process.env, GIT_TERMINAL_PROMPT: "1", ...(env || {}) },
      },
      (err) => {
        if (err) reject(new Error(String((err && err.message) || err)));
        else resolve();
      }
    );
  });
}

function latestDoneCrew() {
  const done = store
    .list()
    .filter((m) => m.status === "done")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return done[0] || null;
}

// Accept an explicit crew (from the just-finished run) or fall back to the
// newest done crew. Called right after a run finishes, before status flips to
// "done" — so the caller passes its own meta to guarantee THIS product ships.
function pickCrew(crew) {
  if (typeof crew === "string") return store.loadMeta(crew);
  if (crew && crew.id) return store.loadMeta(crew.id) || crew;
  return latestDoneCrew();
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

// Provision the gh-pages worktree if it doesn't exist yet. On a fresh clone
// (no worktree, maybe no gh-pages branch) this creates it so publish can run
// without manual setup.
async function ensureWorktree() {
  if (fs.existsSync(SITE_DIR) && fs.existsSync(path.join(SITE_DIR, ".git"))) return;
  fs.rmSync(SITE_DIR, { recursive: true, force: true });
  try {
    // Does origin already have a gh-pages branch?
    const refs = await sh(["ls-remote", "--heads", "origin", "gh-pages"], store.ROOT);
    if (refs) {
      // Fresh containers have no local gh-pages branch — fetch it from origin
      // (with a forced refspec so an existing branch is updated, not rejected).
      await sh(["fetch", "origin", `+${BRANCH}:${BRANCH}`], store.ROOT);
      await sh(["worktree", "add", SITE_DIR, BRANCH], store.ROOT);
    } else {
      await sh(["worktree", "add", "--orphan", "-B", BRANCH, SITE_DIR], store.ROOT);
    }
  } catch (err) {
    throw new Error("site-live worktree setup failed: " + String(err.message || err));
  }
}

// Push to the gh-pages branch. Auth priority:
//   1. Token (GH_TOKEN / GITHUB_TOKEN env, or settings.ghToken) — cloud first
//   2. Fall back to whatever git has configured (Credential Manager / gh auth),
//      which covers the common local case where a read-only app token is set
//      but real write credentials live in the OS credential store.
async function pushToOrigin() {
  const token =
    process.env.GH_TOKEN ||
    process.env.GITHUB_TOKEN ||
    store.loadSettings().ghToken;
  const remote = await sh(["remote", "get-url", "origin"], SITE_DIR);
  if (token) {
    const authUrl = remote.replace("https://", `https://x-access-token:${token}@`);
    try {
      await shPush(["push", authUrl, `HEAD:${BRANCH}`], SITE_DIR);
      return;
    } catch (e) {
      if (!process.env.GH_TOKEN && !process.env.GITHUB_TOKEN) {
        // The app-level token may be read-only; local creds can still push.
        await shPush(["push", "origin", BRANCH], SITE_DIR);
        return;
      }
      throw e;
    }
  }
  await shPush(["push", "origin", BRANCH], SITE_DIR);
}

async function publish({ emit } = {}, crewOverride) {
  const emit_ = (ev) => emit && emit(ev);
  const crew = pickCrew(crewOverride);
  if (!crew) {
    emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: "no completed crew to publish" });
    return { ok: false, reason: "no crew" };
  }

  try {
    await ensureWorktree();
  } catch (err) {
    emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: String(err.message) });
    return { ok: false, reason: String(err.message) };
  }

  syncProduct(crew);
  const product = crew.product || "product";

  try {
    await sh(["add", "-A"], SITE_DIR);
    const changed = await sh(["status", "--porcelain"], SITE_DIR);
    if (changed) {
      await sh(["commit", "-m", `deploy: ${product} (crew ${crew.id})`], SITE_DIR);
      await pushToOrigin();
    }
  } catch (err) {
    emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: `publish failed: ${String(err.message || err)}` });
    return { ok: false, reason: String(err.message || err) };
  }

  emit_({ type: "system", phase: null, agent: "publisher", subtype: "publish", content: `published ${product} → gh-pages` });
  return { ok: true, crew: crew.id, product };
}

module.exports = { publish, SITE_DIR, BRANCH };
