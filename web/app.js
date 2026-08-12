/* gitcrew — frontend app. vanilla JS, no deps. */
"use strict";

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };

const ROLES = [
  { id: "ceo", name: "CEO", title: "Brief · vision & boundaries" },
  { id: "pm", name: "PM", title: "Plan · PRD & tasks" },
  { id: "engineer", name: "Engineer", title: "Build · the product" },
  { id: "qa", name: "QA", title: "Review · audit & fix" },
  { id: "marketer", name: "Shippit", title: "Ship · docs & tag" },
];
const PHASES = [
  { id: "brief", label: "Brief", agent: "ceo" },
  { id: "plan", label: "Plan", agent: "pm" },
  { id: "build", label: "Build", agent: "engineer" },
  { id: "review", label: "Review", agent: "qa" },
  { id: "ship", label: "Ship", agent: "marketer" },
];
const AVATAR_COLOR = { ceo: "#5b8cff", pm: "#5b8cff", engineer: "#43d9a3", qa: "#ffb454", marketer: "#43d9a3" };

const state = {
  ws: null,
  events: [],
  phases: {}, // id -> pending|active|done|error
  tree: { files: [], tags: [] },
  commits: [],
  branch: "main",
  tab: "repo",
  file: null,
  streaming: null, // { phase, agent, node }
  refreshTimer: null,
  refreshPending: false,
};

/* ── navigation ── */
function switchView(v) {
  state.view = v;
  $("#view-landing").classList.toggle("hidden", v !== "landing");
  $("#view-workspace").classList.toggle("hidden", v !== "workspace");
  if (v === "landing") renderRecent();
}

/* ── landing ── */
function setupLanding() {
  const idea = $("#idea");
  idea.addEventListener("input", () => { $("#idea-count").textContent = idea.value.length + " / 240"; });

  $$("#stack-chips .chip-btn").forEach((c) =>
    c.addEventListener("click", () => {
      $$("#stack-chips .chip-btn").forEach((x) => x.classList.remove("active"));
      c.classList.add("active");
    })
  );
  $$("#mode-toggle .mode-btn").forEach((m) =>
    m.addEventListener("click", () => {
      $$("#mode-toggle .mode-btn").forEach((x) => x.classList.remove("active"));
      m.classList.add("active");
    })
  );
  const speed = $("#speed");
  speed.addEventListener("input", () => { $("#speed-label").textContent = speed.value + "×"; });

  $("#crew-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const ideaText = idea.value.trim();
    if (!ideaText) { idea.focus(); idea.style.borderColor = "#ff5f6e"; return; }
    idea.style.borderColor = "";
    const stack = $("#stack-chips .chip-btn.active").dataset.stack;
    const mode = $("#mode-toggle .mode-btn.active").dataset.mode;
    const speedVal = parseInt(speed.value, 10) || 2;
    const btn = $("#launch-btn");
    btn.disabled = true; btn.querySelector(".btn-label").textContent = "Deploying crew…";
    try {
      const res = await fetch("/api/crews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: ideaText, stack, mode, speed: mode === "rehearsal" ? speedVal : 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed to create crew");
      openWorkspace(data.id);
    } catch (err) {
      alert("Failed to launch: " + err.message);
    } finally {
      btn.disabled = false; btn.querySelector(".btn-label").textContent = "Launch crew";
    }
  });
}

async function renderRecent() {
  try {
    const res = await fetch("/api/crews");
    const list = await res.json();
    const box = $("#recent-list");
    box.innerHTML = "";
    if (!list.length) {
      box.appendChild(el("div", "empty-state", "Nothing yet. The company is waiting for its first brief."));
      return;
    }
    list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 8).forEach((ws) => {
      const item = el("button", "recent-item", "");
      const when = (ws.createdAt || "").replace("T", " ").slice(5, 16);
      item.appendChild(el("b", "", escapeHtml(ws.product || ws.idea)));
      const meta = el("span", "", "");
      meta.innerHTML = '<span class="st" data-state="' + (ws.status || "idle") + '"></span>' +
        escapeHtml(ws.idea || "").slice(0, 60) + " · " + when + " · " + (ws.mode || "rehearsal");
      item.appendChild(meta);
      item.addEventListener("click", () => openWorkspace(ws.id));
      box.appendChild(item);
    });
  } catch { /* ignore */ }
}

/* ── workspace ── */
let sseController = null;
let reconnectTimer = null;

function openWorkspace(id) {
  state.events = [];
  state.phases = {};
  state.streaming = null;
  state.file = null;
  state.ws = { id };
  $("#feed").innerHTML = '<div class="feed-inner" id="feed-inner"></div>';
  $("#tree").innerHTML = ""; $("#fileview").classList.add("hidden");
  $("#gitlog").innerHTML = ""; $("#preview-frame").src = "about:blank";
  $("#done-banner").classList.add("hidden");
  switchView("workspace");
  $("#ws-status").setAttribute("data-state", "idle");
  $("#ws-status-text").textContent = "connecting";

  loadStatus(id).then(loadTree).then(loadLog).then(() => {
    connectSSE(id);
    const st = state.ws ? state.ws.status : "idle";
    if (st === "idle") runCrew(id);
  });
  renderPhaseStrip();
  renderRoster();
  renderChecklist();
}

async function runCrew(id) {
  try {
    await fetch("/api/crews/" + id + "/run", { method: "POST" });
  } catch { /* engine will surface errors via SSE */ }
}

async function loadStatus(id) {
  try {
    const r = await fetch("/api/crews/" + id + "/status");
    const d = await r.json();
    state.ws = d.meta;
    $("#ws-name").textContent = d.meta.product || "—";
    $("#ws-idea").textContent = d.meta.idea || "";
    $("#ws-mode").textContent = d.meta.mode || "rehearsal";
    $("#ws-branch").innerHTML = '<span class="dot dot-branch"></span>' + escapeHtml(d.branch || "main");
    setStatus(d.meta.status || "idle");
    $("#ws-download").href = "/api/crews/" + id + "/download";
    $("#done-download").href = "/api/crews/" + id + "/download";
    if (d.meta.status === "done" && d.meta.phase == null) showDoneBanner(null);
  } catch { /* ignore */ }
}

function setStatus(s) {
  const pill = $("#ws-status");
  pill.setAttribute("data-state", s);
  $("#ws-status-text").textContent = s;
}

async function loadTree() {
  if (!state.ws) return;
  try {
    const r = await fetch("/api/crews/" + state.ws.id + "/tree");
    const d = await r.json();
    state.tree = d;
    renderTree();
  } catch { /* ignore */ }
}

async function loadLog() {
  if (!state.ws) return;
  try {
    const r = await fetch("/api/crews/" + state.ws.id + "/log");
    const d = await r.json();
    state.commits = d.commits || [];
    state.branch = d.branch || "main";
    renderLog();
  } catch { /* ignore */ }
}

function connectSSE(id) {
  if (sseController) sseController.abort();
  sseController = new AbortController();
  fetch("/api/crews/" + id + "/events", { signal: sseController.signal })
    .then((res) => {
      if (!res.ok || !res.body) throw new Error("no stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });
            const lines = buf.split("\n\n");
            buf = lines.pop();
            for (const line of lines) {
              if (line.startsWith("data: ")) onEvent(JSON.parse(line.slice(6)));
            }
          }
        } catch { /* aborted */ }
      };
      pump();
    })
    .catch(() => {
      if (!sseController.signal.aborted) {
        reconnectTimer = setTimeout(() => connectSSE(id), 2500);
      }
    });
}

function onEvent(ev) {
  state.events.push(ev);
  switch (ev.type) {
    case "status":
      setStatus(ev.state);
      if (ev.state === "done") showDoneBanner(null);
      if (ev.state === "error") setStatus("error");
      if (ev.state === "running") $("#done-banner").classList.add("hidden");
      break;
    case "phase":
      state.phases[ev.id] = ev.status === "start" ? "active" : "done";
      if (ev.status === "start") renderPhaseStart(ev);
      else renderPhaseEnd(ev);
      renderPhaseStrip();
      renderRoster();
      renderChecklist();
      scheduleRefresh();
      break;
    case "delta":
      streamDelta(ev);
      break;
    case "msg":
      finalizeStream(ev);
      break;
    case "tool":
      renderTool(ev);
      break;
    case "commit":
      renderCommit(ev);
      scheduleRefresh();
      break;
    case "tag":
      renderTag(ev);
      scheduleRefresh();
      break;
    case "file":
      scheduleRefresh();
      break;
    case "system":
      renderSystem(ev);
      break;
    case "usage":
      renderUsage(ev);
      break;
    case "done":
      showDoneBanner(ev);
      break;
    case "error":
      renderError(ev);
      break;
    case "deployed":
      renderSystem({ content: "crew deployed — " + (ev.product || "workspace") + " ready", subtype: "info" });
      break;
  }
}

function feedInner() {
  return $("#feed-inner") || (function () { $("#feed").innerHTML = '<div class="feed-inner" id="feed-inner"></div>'; return $("#feed-inner"); })();
}

function scrollIfNeeded() {
  const f = $("#feed");
  const near = f.scrollHeight - f.scrollTop - f.clientHeight < 140;
  if (near) f.scrollTop = f.scrollHeight;
}

function phaseDividerNode(ev) {
  const div = el("div", "feed-phase", "");
  div.dataset.state = "active";
  const agent = ev.agent || PHASES.find((p) => p.id === ev.id)?.agent || "";
  const ph = PHASES.find((p) => p.id === ev.id) || { label: ev.id };
  div.appendChild(el("div", "fp-ava", initialsOf(agent)));
  const info = el("div", "", "");
  info.appendChild(el("div", "fp-name", ph.label + " phase"));
  info.appendChild(el("div", "fp-agent", "agent/" + agent));
  div.appendChild(info);
  const st = el("span", "fp-status", "▶ running");
  div.appendChild(st);
  feedInner().appendChild(div);
  return div;
}

function initialsOf(name) {
  return (name || "?").slice(0, 2).toUpperCase();
}

function renderPhaseStart(ev) {
  phaseDividerNode(ev);
}

function renderPhaseEnd(ev) {
  const divs = $$("#feed-inner .feed-phase[data-state='active']");
  const d = divs[divs.length - 1];
  if (d) {
    d.dataset.state = "done";
    $(".fp-status", d).textContent = "✓ done";
  }
  const bubble = state.streaming;
  if (bubble && bubble.phase === ev.id) finalizeStream({ phase: ev.id, agent: ev.agent });
}

function streamDelta(ev) {
  const key = ev.phase + ":" + ev.agent;
  let b = state.streaming && state.streaming.key === key ? state.streaming : null;
  if (!b) {
    const node = el("div", "bubble delta", '<span class="content"></span><span class="caret"></span>');
    feedInner().appendChild(node);
    b = { key, node, phase: ev.phase, agent: ev.agent, text: "" };
    state.streaming = b;
  }
  b.text += ev.content;
  $(".content", b.node).textContent = b.text;
  scrollIfNeeded();
}

function finalizeStream(ev) {
  if (!state.streaming) return;
  const b = state.streaming;
  if (ev.phase && ev.phase !== b.phase) return;
  b.node.classList.remove("delta");
  b.node.classList.add("bubble");
  const caret = $(".caret", b.node);
  if (caret) caret.remove();
  const content = $(".content", b.node);
  content.textContent = ev.text || b.text;
  state.streaming = null;
  scrollIfNeeded();
}

function renderTool(ev) {
  const pill = el("div", "tool-pill", "");
  pill.dataset.state = ev.status;
  if (ev.status === "result" && ev.isError) pill.classList.add("error");
  pill.appendChild(el("span", "tp-name", ev.name));
  if (ev.args) {
    let a;
    try { a = JSON.stringify(ev.args); } catch { a = String(ev.args); }
    pill.appendChild(el("span", "tp-args", escapeHtml(a)));
  }
  const stTxt = ev.status === "call" ? "→" : (ev.isError ? "✕" : "✓");
  pill.appendChild(el("span", "tp-st", stTxt));
  feedInner().appendChild(pill);
  scrollIfNeeded();
}

function renderCommit(ev) {
  const line = el("div", "commit-line", "");
  line.appendChild(el("span", "cm-dot", ""));
  line.appendChild(el("span", "cm-hash", ev.hash || ""));
  line.appendChild(el("span", "cm-msg", escapeHtml(ev.subject || ev.message || "")));
  feedInner().appendChild(line);
  scrollIfNeeded();
}

function renderTag(ev) {
  feedInner().appendChild(el("div", "tag-line", "◂ tag &nbsp;<b>" + escapeHtml(ev.name) + "</b>&nbsp; cut"));
  scrollIfNeeded();
}

function renderSystem(ev) {
  const line = el("div", "sys-line", "· " + escapeHtml(ev.content || ""));
  feedInner().appendChild(line);
  scrollIfNeeded();
}

function renderUsage(ev) {
  if (!ev.inputTokens) return;
  const line = el("div", "usage-line", "· tokens ↑" + (ev.inputTokens || 0) + " ↓" + (ev.outputTokens || 0) + " · $" + ((ev.costUsd || 0)).toFixed(4));
  feedInner().appendChild(line);
  scrollIfNeeded();
}

function renderError(ev) {
  const node = el("div", "bubble", '<span style="color:var(--red)">⚠ ' + escapeHtml(ev.message || ev.content || "error") + "</span>");
  feedInner().appendChild(node);
  scrollIfNeeded();
}

function scheduleRefresh() {
  if (state.refreshTimer) return;
  state.refreshTimer = setTimeout(async () => {
    state.refreshTimer = null;
    await Promise.all([loadTree(), loadLog()]);
  }, 350);
}

/* ── phase strip / roster / checklist ── */
function renderPhaseStrip() {
  const strip = $("#phase-strip");
  strip.innerHTML = "";
  PHASES.forEach((p) => {
    const cell = el("div", "phase-cell", "");
    cell.dataset.state = state.phases[p.id] || "pending";
    const top = el("div", "pc-top", "");
    top.appendChild(el("span", "phase-dot", ""));
    top.appendChild(el("span", "pc-name", p.label));
    cell.appendChild(top);
    cell.appendChild(el("div", "pc-agent", p.agent + " · " + p.label.toLowerCase()));
    strip.appendChild(cell);
  });
}

function renderRoster() {
  const box = $("#roster");
  box.innerHTML = "";
  ROLES.forEach((role) => {
    const ph = PHASES.find((p) => p.agent === role.id);
    const st = ph ? state.phases[ph.id] || "pending" : "pending";
    const item = el("div", "roster-item", "");
    item.dataset.state = st;
    item.appendChild(el("div", "roster-ava", initialsOf(role.name)));
    const info = el("div", "roster-info", "");
    info.appendChild(el("b", "", role.name));
    info.appendChild(el("span", "", role.title));
    item.appendChild(info);
    item.appendChild(el("span", "rt", st === "done" ? "✓" : st === "active" ? "●" : ""));
    box.appendChild(item);
  });
}

function renderChecklist() {
  const box = $("#ws-checklist");
  box.innerHTML = "";
  PHASES.forEach((p) => {
    const st = state.phases[p.id] || "pending";
    const c = el("div", "chk", "");
    c.dataset.state = st;
    c.appendChild(el("span", "box", st === "done" ? "✓" : ""));
    c.appendChild(el("span", "", p.label));
    box.appendChild(c);
  });
}

/* ── tree / file view ── */
function renderTree() {
  const box = $("#tree");
  box.innerHTML = "";
  const files = state.tree.files || [];
  if (!files.length) { box.appendChild(el("div", "tree-empty", "no files committed yet")); return; }

  const root = { type: "dir", path: "", children: new Map() };
  files.forEach((f) => {
    const parts = f.split("/");
    let node = root;
    let p = "";
    parts.forEach((part, i) => {
      p = p ? p + "/" + part : part;
      const isLast = i === parts.length - 1;
      if (!node.children.has(part)) {
        node.children.set(part, { type: isLast ? "file" : "dir", path: p, name: part, children: new Map() });
      }
      node = node.children.get(part);
    });
  });

  const closed = new Set();
  const walk = (node, depth) => {
    for (const child of node.children.values()) {
      const pad = 10 + depth * 14;
      if (child.type === "dir") {
        const isClosed = closed.has(child.path);
        const row = el("div", "tree-item dir", "");
        row.dataset.path = child.path;
        row.style.paddingLeft = pad + "px";
        row.appendChild(el("span", "ti-ico", isClosed ? "▸" : "▾"));
        row.appendChild(el("span", "ti-path", escapeHtml(child.name)));
        row.addEventListener("click", () => {
          if (closed.has(child.path)) closed.delete(child.path);
          else closed.add(child.path);
          renderTree();
        });
        box.appendChild(row);
        if (!isClosed) walk(child, depth + 1);
      } else {
        const kind = extKind(child.path);
        const row = el("div", "tree-item", "");
        row.dataset.kind = kind;
        row.dataset.path = child.path;
        row.style.paddingLeft = pad + "px";
        row.appendChild(el("span", "ti-ico", iconFor(kind)));
        row.appendChild(el("span", "ti-path", escapeHtml(child.name)));
        row.addEventListener("click", () => selectFile(child.path));
        box.appendChild(row);
      }
    }
  };
  walk(root, 0);
}

function iconFor(kind) {
  if (kind === "md") return "M";
  if (kind === "yaml") return "Y";
  if (kind === "js") return "JS";
  if (kind === "css") return "CSS";
  if (kind === "html") return "H";
  return "f";
}
function extKind(p) {
  const e = p.split(".").pop().toLowerCase();
  if (e === "md") return "md";
  if (e === "yaml" || e === "yml") return "yaml";
  if (e === "js") return "js";
  if (e === "css") return "css";
  if (e === "html" || e === "htm") return "html";
  return "txt";
}

async function selectFile(path) {
  if (!state.ws) return;
  try {
    const r = await fetch("/api/crews/" + state.ws.id + "/file?path=" + encodeURIComponent(path));
    const d = await r.json();
    if (!r.ok) return;
    $("#file-path").textContent = path;
    $("#file-code").innerHTML = highlight(d.content, path);
    $("#tree").classList.add("hidden");
    $("#fileview").classList.remove("hidden");
    state.file = path;
  } catch { /* ignore */ }
}

function highlight(code, path) {
  const esc = escapeHtml(code);
  const kind = extKind(path);
  let out = esc;
  // comments
  if (kind === "md" || kind === "yaml") {
    out = out.replace(/^(&gt;|#).*$/gm, '<span class="tok-c">$&</span>');
  } else if (kind === "js" || kind === "html" || kind === "css") {
    out = out.replace(/(\/\/[^\n]*|&lt;!--[\s\S]*?--&gt;|\/\*[\s\S]*?\*\/)/g, '<span class="tok-c">$1</span>');
    out = out.replace(/"([^"\n]*)"|'([^'\n]*)'/g, '<span class="tok-s">$&</span>');
  }
  if (kind === "js") {
    const kw = /\b(const|let|var|function|return|if|else|for|while|async|await|new|typeof|class|import|export|from|document|window|Math|JSON|require|module)\b/g;
    out = out.replace(kw, '<span class="tok-k">$1</span>');
    out = out.replace(/\b(\d+)\b/g, '<span class="tok-n">$1</span>');
  }
  return out;
}

/* ── git log ── */
function renderLog() {
  const box = $("#gitlog");
  box.innerHTML = "";
  if (!state.commits.length) { box.appendChild(el("div", "gitlog-empty", "no commits yet")); return; }
  state.commits.forEach((c) => {
    const row = el("div", "git-commit", "");
    row.appendChild(el("span", "gc-hash", c.hash));
    const msg = el("span", "gc-msg", escapeHtml(c.subject || ""));
    row.appendChild(msg);
    const refs = el("span", "gc-refs", "");
    (c.refs || "").split(",").filter(Boolean).forEach((r) => {
      const t = r.trim();
      refs.appendChild(el("span", t.startsWith("tag:") ? "gc-tag" : "gc-branch", escapeHtml(t.replace(/^tag:\s*/, "").replace(/HEAD.*/, ""))));
    });
    row.appendChild(refs);
    row.appendChild(el("span", "gc-meta", escapeHtml((c.author || "") + " · " + (c.date || "").replace("T", " ").slice(0, 16))));
    box.appendChild(row);
  });
}

/* ── preview / done ── */
function showDoneBanner(ev) {
  const b = $("#done-banner");
  b.classList.remove("hidden");
  const n = state.ws ? state.ws.product : (ev && ev.product);
  $("#done-title").textContent = (n || "Product") + " shipped.";
  $("#done-sub").textContent = ev && ev.preview ? "5 phases · " + (ev.commits ? ev.commits.length + " commits · " : "") + "tag v1.0.0" : "tag v1.0.0 · everything committed";
  const id = state.ws ? state.ws.id : null;
  if (id) {
    $("#done-preview").onclick = () => { setTab("preview"); loadPreview(id); };
  }
  loadPreview(id);
}

function loadPreview(id) {
  if (!id) return;
  $("#preview-frame").src = "/preview/" + id + "/?t=" + Date.now();
}

/* ── tabs ── */
function setTab(t) {
  state.tab = t;
  $$(".tab").forEach((x) => x.classList.toggle("active", x.dataset.tab === t));
  ["repo", "git", "preview"].forEach((x) => $("#tab-" + x).classList.toggle("hidden", x !== t));
  if (t === "git") loadLog();
  if (t === "repo") { $("#tree").classList.remove("hidden"); $("#fileview").classList.add("hidden"); }
  if (t === "preview" && state.ws) loadPreview(state.ws.id);
}

/* ── settings ── */
async function openSettings() {
  $("#settings-modal").classList.remove("hidden");
  try {
    const r = await fetch("/api/settings");
    const d = await r.json();
    $("#set-provider").value = d.provider || "openai";
    $("#set-model").value = d.model || "gpt-4o-mini";
    $("#set-key").value = "";
    $("#settings-status").textContent = d.keys && d.keys[d.provider] ? "key saved (hidden)" : "no key saved for " + (d.provider || "openai");
  } catch { /* ignore */ }
}

/* ── misc ── */
function escapeHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function bindStatic() {
  $("#nav-settings").addEventListener("click", openSettings);
  $("#ws-settings").addEventListener("click", openSettings);
  $("#modal-close").addEventListener("click", () => $("#settings-modal").classList.add("hidden"));
  $("#settings-cancel").addEventListener("click", () => $("#settings-modal").classList.add("hidden"));
  $("#settings-modal").addEventListener("click", (e) => { if (e.target.id === "settings-modal") e.target.classList.add("hidden"); });
  $("#settings-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const body = { provider: $("#set-provider").value, model: $("#set-model").value.trim() };
    const key = $("#set-key").value.trim();
    if (key) body.key = key;
    try {
      const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) throw new Error("save failed");
      $("#settings-status").textContent = key ? "saved ✓ key stored server-side" : "saved ✓";
      $("#set-key").value = "";
    } catch (err) {
      $("#settings-status").textContent = "error: " + err.message;
    }
  });

  $("#ws-back").addEventListener("click", () => {
    if (sseController) sseController.abort();
    switchView("landing");
  });
  $("#tree-refresh").addEventListener("click", () => { loadTree(); loadLog(); });
  $("#file-close").addEventListener("click", () => {
    $("#fileview").classList.add("hidden");
    $("#tree").classList.remove("hidden");
    state.file = null;
  });
  $$(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));
  $("#done-download").addEventListener("click", (e) => {
    if (state.ws) e.currentTarget.href = "/api/crews/" + state.ws.id + "/download";
  });
  $("#done-rerun").addEventListener("click", () => {
    if (!state.ws) return;
    state.events = [];
    state.phases = {};
    state.streaming = null;
    $("#feed").innerHTML = '<div class="feed-inner" id="feed-inner"></div>';
    renderPhaseStrip();
    renderRoster();
    renderChecklist();
    $("#done-banner").classList.add("hidden");
    runCrew(state.ws.id);
  });
}

/* ── init ── */
function init() {
  bindStatic();
  setupLanding();
  renderRecent();
}
document.addEventListener("DOMContentLoaded", init);
