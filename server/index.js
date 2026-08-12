const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { spawn } = require("child_process");
const store = require("./store");
const crew = require("./crew");
const g = require("./gitshim");

const PORT = process.env.PORT || 4173;
const WEB = path.join(store.ROOT, "web");

// ── Settings: inject API keys into env for the gitagent SDK ─────────────
const KEY_ENV = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GEMINI_API_KEY",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
  mistral: "MISTRAL_API_KEY",
  local: "LOCAL_API_KEY",
};
function applySettings(s) {
  if (s && s.keys) {
    for (const [provider, key] of Object.entries(s.keys)) {
      if (key && !process.env[KEY_ENV[provider]]) process.env[KEY_ENV[provider]] = key;
    }
  }
  // Custom OpenAI-compatible endpoints (benchmark gateways, Ollama, LM Studio)
  // accept any non-empty key — ensure one exists so the OpenAI client works.
  const usesCustomEndpoint = s && (s.modelKey || s.baseUrl);
  if (usesCustomEndpoint) {
    if (!process.env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = s.keys?.local || "sk-gitcrew-local";
  }
}
applySettings(store.loadSettings());
const swept = store.sweepOrphanedRuns();
if (swept > 0) console.log(`[boot] reset ${swept} orphaned running crew(s) → error`);

// A disconnect or transient socket error must never take the whole server down.
process.on("uncaughtException", (err) => {
  console.error("[uncaught]", err && err.message || err);
});
process.on("unhandledRejection", (err) => {
  console.error("[unhandledRejection]", err && err.message || err);
});

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".md": "text/plain; charset=utf-8",
  ".yaml": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
  ".tgz": "application/gzip",
};

function send(res, code, body, type) {
  res.writeHead(code, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}
function json(res, code, obj) {
  send(res, code, JSON.stringify(obj), "application/json; charset=utf-8");
}
function ok(handler) {
  return async (req, res, ...rest) => {
    try {
      await handler(req, res, ...rest);
    } catch (err) {
      json(res, 500, { error: String(err.message || err) });
    }
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 2_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error("invalid json"));
      }
    });
  });
}

function isSafeId(id) {
  return /^[0-9a-f]{8}$/.test(id || "");
}
function safeRel(base, rel) {
  if (!rel || rel.includes("..")) return null;
  const clean = rel.replace(/^\/+/, "");
  const abs = path.resolve(base, clean);
  if (!abs.startsWith(path.resolve(base))) return null;
  return abs;
}

function serveStatic(res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
  const ext = path.extname(filePath).toLowerCase();
  send(res, 200, fs.readFileSync(filePath), MIME[ext] || "application/octet-stream");
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;

  if (req.method === "GET" && !p.startsWith("/api") && !p.startsWith("/preview")) {
    let fp = p === "/" ? path.join(WEB, "index.html") : safeRel(WEB, p);
    if (!fp) return send(res, 404, "not found");
    if (serveStatic(res, fp)) return;
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory() && serveStatic(res, path.join(fp, "index.html"))) return;
    return send(res, 404, "not found");
  }

  // API
  if (p === "/api/meta" && req.method === "GET") {
    return json(res, 200, { app: "gitcrew", version: "1.0.0", builtOn: "GitAgentProtocol (GAP)" });
  }

  if (p === "/api/crews" && req.method === "GET") {
    return json(res, 200, store.list());
  }

  if (p === "/api/crews" && req.method === "POST") {
    const body = await readBody(req);
    if (!body.idea || !String(body.idea).trim()) return json(res, 400, { error: "idea is required" });
    const id = crew.deployCrew({ idea: String(body.idea).trim(), stack: body.stack, mode: body.mode, speed: body.speed });
    const meta = store.loadMeta(id);
    crew.hub.emit(id, { type: "deployed", id, product: meta.product });
    return json(res, 201, { id, ...meta });
  }

  const m = p.match(/^\/api\/crews\/([0-9a-f]{8})(\/.*)?$/);
  if (m) {
    const id = m[1];
    const rest = m[2] || "";
    const meta = store.loadMeta(id);
    if (!meta) return json(res, 404, { error: "crew not found" });
    const repo = store.repoDir(id);

    if (rest === "/run" && req.method === "POST") {
      if (meta.status === "running") return json(res, 200, { id, status: "running" });
      setImmediate(() => crew.runCrew(id).catch(() => {}));
      return json(res, 200, { id, status: "running" });
    }

    if (rest === "/events" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.write("retry: 2000\n\n");
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        sub.unsubscribe();
        res.end();
      };
      const sub = crew.hub.subscribe(id, (ev) => {
        if (closed) return;
        try {
          res.write("data: " + JSON.stringify(ev) + "\n\n");
        } catch {
          close();
        }
      });
      for (const ev of sub.history) {
        if (closed) break;
        try {
          res.write("data: " + JSON.stringify(ev) + "\n\n");
        } catch {
          break;
        }
      }
      res.on("error", close);
      req.on("close", close);
      return;
    }

    if (rest === "/tree" && req.method === "GET") {
      const files = await g.tree(repo);
      const tags = await g.tags(repo);
      return json(res, 200, { files: files.filter((f) => !f.startsWith(".gitagent")), tags });
    }

    if (rest === "/file" && req.method === "GET") {
      const rel = url.searchParams.get("path");
      const fp = safeRel(repo, rel);
      if (!fp || !fs.existsSync(fp) || fs.statSync(fp).isDirectory())
        return json(res, 404, { error: "no such file" });
      const content = fs.readFileSync(fp, "utf8");
      const size = Buffer.byteLength(content);
      if (size > 400_000) return json(res, 200, { truncated: true, content: content.slice(0, 400_000), ext: path.extname(fp) });
      return json(res, 200, { content, ext: path.extname(fp) });
    }

    if (rest === "/log" && req.method === "GET") {
      return json(res, 200, { commits: await g.log(repo, 60), tags: await g.tags(repo), branch: await g.currentBranch(repo) });
    }

    if (rest === "/status" && req.method === "GET") {
      const dirty = await g.statusShort(repo);
      return json(res, 200, { meta, branch: await g.currentBranch(repo), dirty: dirty.length });
    }

    if (rest === "/download" && req.method === "GET") {
      const tar = path.join(store.wsDir(id), "crew.tgz");
      await new Promise((resolve) => {
        const child = spawn("git", ["-C", repo, "archive", "--format=tar", "HEAD"]);
        const gz = zlib.createGzip();
        const out = fs.createWriteStream(tar);
        child.stdout.pipe(gz).pipe(out);
        child.on("error", () => resolve());
        out.on("finish", resolve);
      });
      if (fs.existsSync(tar)) {
        res.writeHead(200, {
          "Content-Type": "application/gzip",
          "Content-Disposition": `attachment; filename="crew-${id}.tgz"`,
        });
        fs.createReadStream(tar).pipe(res);
        return;
      }
      return json(res, 500, { error: "could not create archive" });
    }
  }

  if (p.startsWith("/preview/")) {
    const parts = p.split("/").filter(Boolean);
    if (parts.length < 2 || !isSafeId(parts[1])) return send(res, 404, "not found");
    const id = parts[1];
    const appDir = path.join(store.wsDir(id), "repo", "app");
    if (!fs.existsSync(appDir)) {
      return send(
        res,
        200,
        "<!doctype html><meta charset=utf-8><title>not built yet</title>" +
          "<body style='background:#0b0d10;color:#8a94a3;font-family:sans-serif;display:grid;place-items:center;height:100vh'>" +
          "The crew hasn't built anything yet.</body>",
        "text/html; charset=utf-8"
      );
    }
    const rel = p.slice(("/preview/" + id).length) || "/index.html";
    const fp = safeRel(appDir, rel) || path.join(appDir, "index.html");
    if (serveStatic(res, fp)) return;
    if (!path.extname(fp)) return serveStatic(res, path.join(fp, "index.html")) || send(res, 404, "not found");
    return send(res, 404, "not found");
  }

  if (p === "/api/settings" && req.method === "GET") {
    const s = store.loadSettings();
    const masked = { ...s, keys: Object.fromEntries(Object.entries(s.keys || {}).map(([k, v]) => [k, v ? "••••••" : ""])) };
    masked.catalog = require("./models").CATALOG;
    return json(res, 200, masked);
  }

  if (p === "/api/settings" && req.method === "POST") {
    const body = await readBody(req);
    const s = store.loadSettings();
    if (body.modelKey) s.modelKey = body.modelKey;
    if (body.fallback !== undefined) s.fallback = !!body.fallback;
    if (body.provider) s.provider = body.provider;
    if (body.model) s.model = body.model;
    if (body.baseUrl !== undefined) s.baseUrl = String(body.baseUrl).trim();
    if (body.key) s.keys = { ...(s.keys || {}), [body.provider || s.provider]: String(body.key).trim() };
    store.saveSettings(s);
    applySettings(s);
    return json(res, 200, { ok: true });
  }

  return send(res, 404, "not found");
});

server.listen(PORT, () => {
  console.log(`gitcrew running → http://localhost:${PORT}`);
  const s = store.loadSettings();
  console.log(`mode provider=${s.provider} model=${s.model}`);
});
