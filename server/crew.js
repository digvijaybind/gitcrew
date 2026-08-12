const fs = require("fs");
const path = require("path");
const g = require("./gitshim");
const store = require("./store");
const { createRehearsalEngine, productName } = require("./rehearsal");
const { createLiveEngine } = require("./live");

const PHASES = [
  { id: "brief", label: "Brief", agent: "ceo", maxTurns: 8 },
  { id: "plan", label: "Plan", agent: "pm", maxTurns: 12 },
  { id: "build", label: "Build", agent: "engineer", maxTurns: 30 },
  { id: "review", label: "Review", agent: "qa", maxTurns: 18 },
  { id: "ship", label: "Ship", agent: "marketer", maxTurns: 10 },
];

function copyDir(src, dest, ignore = []) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (ignore.includes(entry.name)) continue;
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d, ignore);
    else fs.copyFileSync(s, d);
  }
}

function deployCrew({ idea, stack, mode, speed }) {
  const id = store.genId();
  const ws = store.wsDir(id);
  const repo = path.join(ws, "repo");
  store.ensureDir(ws);

  copyDir(store.templateDir(), repo, [".git"]);
  fs.writeFileSync(
    path.join(repo, "PROJECT.md"),
    [
      "# Project brief",
      "",
      "## Idea",
      idea.trim(),
      "",
      "## Stack",
      stack || "static (HTML/CSS/JS)",
      "",
      "## Product path",
      "app/ — a self-contained static product that opens by double-clicking app/index.html.",
      "",
      "## Goal",
      "A real, working product, fully committed to git, ready for a human to open.",
    ].join("\n") + "\n"
  );

  const memPath = path.join(repo, "memory", "MEMORY.md");
  fs.appendFileSync(
    memPath,
    "\n## Engagement\n- idea: " + idea.trim().replace(/\n/g, " ") + "\n- stack: " + (stack || "static") + "\n"
  );

  g.git(repo, ["init", "-q", "-b", "main"]);
  g.git(repo, [...g.identity, "add", "-A"]);
  g.git(repo, [...g.identity, "commit", "-q", "-m", "init: crew deployed for “" + idea.slice(0, 48) + "”"]);

  const meta = {
    id,
    idea: idea.trim(),
    stack: stack || "static",
    mode: mode || "rehearsal",
    speed: speed || 1,
    status: "idle",
    product: productName(idea),
    createdAt: new Date().toISOString(),
    phase: null,
  };
  store.saveMeta(id, meta);
  return id;
}

class EventHub {
  constructor() {
    this.buffer = new Map();
    this.subs = new Map();
  }
  emit(id, ev) {
    ev.ts = Date.now();
    const buf = this.buffer.get(id) || [];
    buf.push(ev);
    if (buf.length > 500) buf.splice(0, buf.length - 500);
    this.buffer.set(id, buf);
    const subs = this.subs.get(id);
    if (subs) for (const s of subs) s(ev);
  }
  subscribe(id, handler) {
    const subs = this.subs.get(id) || [];
    subs.push(handler);
    this.subs.set(id, subs);
    const history = this.buffer.get(id) || [];
    const self = this;
    return {
      history,
      unsubscribe() {
        const arr = self.subs.get(id) || [];
        const i = arr.indexOf(handler);
        if (i >= 0) arr.splice(i, 1);
      },
    };
  }
}

const hub = new EventHub();

async function runCrew(id) {
  const meta = store.loadMeta(id);
  if (!meta || meta.status === "running") return { error: "already running or missing" };
  const repo = store.repoDir(id);

  meta.status = "running";
  store.saveMeta(id, meta);
  hub.emit(id, { type: "status", state: "running" });

  const settings = store.loadSettings();
  const ctx = { repo, idea: meta.idea, meta, settings };
  const engine = meta.mode === "live" ? await createLiveEngine() : await createRehearsalEngine();

  const emit = (ev) => {
    if (ev.type === "commit" && ev.hash) emittedHashes.add(ev.hash);
    hub.emit(id, ev);
  };
  const emittedHashes = new Set();

  try {
    for (const phase of PHASES) {
      meta.phase = phase.id;
      store.saveMeta(id, meta);
      emit({ type: "status", state: "running", phase: phase.id });

      const startIso = new Date().toISOString();

      await engine.runPhase(phase, ctx, emit);

      const commits = await g.commitsSince(repo, startIso);
      for (const c of commits) {
        if (emittedHashes.has(c.hash)) continue;
        emittedHashes.add(c.hash);
        emit({ type: "commit", hash: c.hash, subject: c.subject, author: c.author, date: c.date, source: "agent" });
      }
      emit({ type: "refresh", reason: "phase_end", phase: phase.id });
    }

    const tagRes = await g.git(repo, [...g.identity, "tag", "-a", "v1.0.0", "-m", "ship: v1.0.0"]);
    if (tagRes.ok) emit({ type: "tag", name: "v1.0.0" });

    const log = await g.log(repo, 40);
    const files = await g.tree(repo);
    emit({ type: "refresh", reason: "done" });
    emit({
      type: "done",
      commits: log,
      files: files.filter((f) => !f.startsWith(".")),
      preview: "/preview/" + id + "/",
      product: meta.product,
    });

    meta.status = "done";
    meta.phase = null;
    store.saveMeta(id, meta);
    emit({ type: "status", state: "done" });
    return { ok: true };
  } catch (err) {
    meta.status = "error";
    store.saveMeta(id, meta);
    emit({ type: "error", message: String(err.message || err) });
    emit({ type: "status", state: "error" });
    return { error: String(err.message || err) };
  }
}

module.exports = { PHASES, deployCrew, runCrew, hub };
