const fs = require("fs");
const path = require("path");
const g = require("./gitshim");
const store = require("./store");

const TPL = path.join(store.ROOT, "server", "templates");

const STOPWORDS = new Set([
  "a", "an", "the", "app", "application", "platform", "tool", "website", "site",
  "web", "for", "and", "to", "that", "with", "of", "my", "your", "me", "us",
  "build", "make", "create", "simple", "easy", "little", "new", "cool", "small",
  "helps", "lets", "allows", "makes", "keeps", "turns", "into", "better",
  "really", "just", "gets", "any", "anyone", "some", "thing", "things", "one",
  "i", "it", "its", "this", "then", "them", "where", "which", "when", "why",
  "who", "how", "there", "here", "their", "they", "yourself", "myself",
]);

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "product";
}

function productName(idea) {
  const words = idea
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()))
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""));
  const candidates = words.slice(0, 2);
  if (candidates.length >= 2) {
    const name = candidates.map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join("");
    if (name.length <= 20) return name;
  }
  const first = (words[0] || "nova").toLowerCase();
  const suffixes = ["ly", "o", "hub", "kit", "ly", "o"];
  const name = first[0].toUpperCase() + first.slice(1) + suffixes[first.length % suffixes.length];
  return name.length <= 20 ? name : "Nova";
}

function pickTemplate(idea) {
  const t = idea.toLowerCase();
  if (/(shop|store|ecommerce|e-commerce|cart|checkout|market|marketplace|sell|shop|product)/.test(t))
    return "store";
  if (/(dashboard|analytics|metric|monitor|track|report|insight|kpi|data)/.test(t))
    return "dashboard";
  return "landing";
}

function capitalizeFirst(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildTagline(idea) {
  const t = idea.trim().replace(/\.$/, "");
  const low = t.toLowerCase();

  const intoM = low.match(/that\s+(?:turns?|converts?|transforms?)\s+(.+?)\s+into\s+(.+)$/);
  if (intoM) {
    const a = intoM[1].trim().replace(/^(my|your|our|the|a|an)\s+/, "");
    const b = intoM[2].trim().replace(/^(my|your|our|the|a|an)\s+/, "");
    return "Turn " + a + " into " + b + ".";
  }

  const helpsM = low.match(/that\s+(?:helps|lets|allows|makes|keeps)\s+(.+)$/);
  if (helpsM) {
    const rest = helpsM[1].trim().replace(/\.$/, "").replace(/^(me|my|you|your|us|our|people|folks|everyone)\s+/, "");
    return capitalizeFirst(rest) + ".";
  }

  const words = t.split(/\s+/).filter((w) => w.length > 2 && !STOPWORDS.has(w.toLowerCase()));
  const core = words.slice(0, 3).join(" ");
  if (core) return "The simplest way to " + core.toLowerCase() + ".";
  return "The simple way to get things done.";
}

function buildPitch(idea) {
  const name = productName(idea);
  const slug = slugify(idea);
  return (
    name + " turns “" + idea.trim().replace(/\.$/, "") +
    "” into something you can actually use. No setup, no learning curve — open it and it works, so you can focus on the part that matters: getting real results."
  );
}

function buildFeatures(idea) {
  const t = idea.toLowerCase();
  const feats = [];
  if (/(save|track|record|log|remember)/.test(t)) feats.push({ i: "◆", t: "Auto-save", d: "Everything you do is captured and kept, in one place, forever." });
  if (/(share|collab|team|multi|invite)/.test(t)) feats.push({ i: "◈", t: "Built to share", d: "Invite people in seconds. No accounts required for them either." });
  if (/(ai|smart|auto|intelligent|learn)/.test(t)) feats.push({ i: "✦", t: "AI-assisted", d: "Smart suggestions do the boring parts, so you keep the thinking." });
  if (/(fast|quick|instant|realtime|real-time|live)/.test(t)) feats.push({ i: "◉", t: "Instant", d: "Updates land in real time, with zero refresh and zero lag." });
  if (/(report|analytics|metric|insight|chart|dash)/.test(t)) feats.push({ i: "▤", t: "Clear signals", d: "The numbers that matter, surfaced as a story — not a spreadsheet." });
  if (/(progress|graph|chart|visual|trend)/.test(t)) feats.push({ i: "▤", t: "Progress graphs", d: "Your effort, drawn as curves you'll actually want to look at." });
  if (/(workout|gym|fitness|exercise|run|log|record|habit|streak|session)/.test(t)) feats.push({ i: "◉", t: "Session log", d: "Every session captured in seconds, so the streak writes itself." });
  if (/(secure|privacy|private|safe|encrypt)/.test(t)) feats.push({ i: "◈", t: "Private by default", d: "Your data stays yours. Encrypted, never sold, never shown." });
  if (/(mobile|phone|anywhere|travel|offline)/.test(t)) feats.push({ i: "◉", t: "Works anywhere", d: "On your phone, laptop, or a coffee shop table — same great result." });
  if (/(price|cost|budget|money|plan|subscription)/.test(t)) feats.push({ i: "✦", t: "Fair pricing", d: "One honest price. No surprises, no nickel-and-diming." });
  if (/(task|todo|manage|organize|plan|schedule)/.test(t)) feats.push({ i: "▤", t: "Stays organized", d: "Everything filed, ordered, and findable the moment you need it." });
  const fallbacks = [
    { i: "◆", t: "Frictionless setup", d: "Open it and it works. There is no onboarding gauntlet." },
    { i: "◈", t: "Beautiful by default", d: "A dark, focused interface that stays out of your way." },
    { i: "✦", t: "Built to last", d: "Clean code, honest changelogs, and a crew that commits." },
  ];
  while (feats.length < 3) feats.push(fallbacks[feats.length]);
  return feats.slice(0, 4);
}

function fill(html, map) {
  return Object.entries(map).reduce((acc, [k, v]) => acc.split(k).join(v), html);
}

function placeholder(idea) {
  const name = productName(idea);
  const tagline = buildTagline(idea);
  const pitch = buildPitch(idea);
  const feats = buildFeatures(idea);
  return {
    name,
    tagline,
    pitch,
    feats,
    title: name + " — " + tagline,
    eyebrow: name.toLowerCase() + " v1.0.0",
  };
}

function render(idea) {
  const kind = pickTemplate(idea);
  const p = placeholder(idea);
  const dir = path.join(TPL, kind);
  const out = {};
  for (const f of fs.readdirSync(dir)) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    out[f] = fill(raw, {
      "{{TITLE}}": p.title,
      "{{NAME}}": p.name,
      "{{TAGLINE}}": p.tagline,
      "{{PITCH}}": p.pitch,
      "{{EYEBROW}}": p.eyebrow,
      "{{FEATURELEAD}}": "Four capabilities, one product — everything “" + idea.trim().replace(/\.$/, "") + "” actually needs.",
      "{{FEATURES}}": p.feats
        .map((f) => '<div class="feature card"><span class="ico">' + f.i + "</span><h3>" + f.t + "</h3><p>" + f.d + "</p></div>")
        .join("\n      "),
      "{{DEMO_OUTPUT}}": "—",
      "{{ITEMS}}": renderItems(p.name, idea),
    });
  }
  return { kind, ...out };
}

function renderItems(name, idea) {
  const t = idea.toLowerCase();
  const pools = {
    store: [
      ["✦", "Essentials Kit", "$29"],
      ["◈", "The Daily", "$14"],
      ["▤", "Field Notes", "$19"],
      ["◆", "Signature Set", "$49"],
    ],
    misc: [
      ["✦", name + " Starter", "$9"],
      ["◈", name + " Pro", "$19"],
      ["▤", name + " Team", "$39"],
      ["◆", name + " Max", "$59"],
    ],
  };
  const items = /(kit|pack|bundle|goods|box)/.test(t) ? pools.store : pools.misc;
  return items
    .map(
      ([icon, n, price], i) =>
        '<div class="item card">' +
        '<div class="thumb">' + icon + "</div>" +
        "<h3>" + n + "</h3>" +
        '<span class="price">' + price + "</span>" +
        '<button class="btn btn-ghost add">Add to cart</button>' +
        "</div>"
    )
    .join("\n      ");
}

const NARRATION = {
  brief: [
    "Reading the brief and getting aligned with the customer's intent.",
    "Restating the product idea in plain words so everyone agrees what we're building.",
    "Setting the outcome: one thing that must work. Setting boundaries: two things we will not do this round.",
    "Writing BRIEF.md so the rest of the crew reads from one source of truth.",
  ],
  plan: [
    "Reading the brief and the playbook before touching anything.",
    "Turning the idea into a product: problem, users, experience, and the sections that carry it.",
    "Deciding what is in scope and what moves to the future list — discipline over scope-creep.",
    "Writing TASKS.md as an ordered checklist the engineer can execute top to bottom.",
    "Checking in: plan is committed, memory is updated, engineer is unblocked.",
  ],
  build: [
    "Reading the PRD, the task list, and the design system.",
    "Laying out the information architecture and the visual hierarchy first.",
    "Building the hero and the first content sections — this is what the customer sees first.",
    "Wiring up the interactions: forms validate, buttons respond, the demo widget actually runs.",
    "Polishing the responsive layout and the dark theme across every section.",
    "Reviewing the whole product against the checklist before the first commit.",
  ],
  review: [
    "Pulling up the plan and reading every file the engineer shipped.",
    "Walking each interaction path mentally — form, buttons, links, the demo widget.",
    "Checking the copy: no placeholders, no lorem ipsum, no half-finished sentences.",
    "Checking the design against the playbook: theme, hierarchy, spacing, type.",
    "Fixing what I found. A PASS means I'd hand this to a real customer.",
  ],
  ship: [
    "Reading the git history to write an honest changelog.",
    "Writing the README: what it is, who it's for, how to run it, who built it.",
    "Writing the changelog from the actual commits — no invented features.",
    "Cutting the release tag and confirming the full story in git log.",
  ],
};

const TOOLSCRIPTS = {
  brief: [
    ["read", { path: "PROJECT.md" }],
    ["write", { path: "BRIEF.md" }],
    ["checkpoint", { note: "brief captured" }],
  ],
  plan: [
    ["read", { path: "BRIEF.md" }],
    ["write", { path: "PRD.md" }],
    ["write", { path: "TASKS.md" }],
    ["checkpoint", { note: "plan committed" }],
  ],
  build: [
    ["write", { path: "app/index.html" }],
    ["write", { path: "app/styles.css" }],
    ["write", { path: "app/app.js" }],
    ["commit", { message: "build: app v1 complete" }],
  ],
  review: [
    ["read", { path: "app/index.html" }],
    ["read", { path: "app/app.js" }],
    ["write", { path: "REVIEW.md" }],
    ["checkpoint", { note: "review passed" }],
  ],
  ship: [
    ["read", { path: "REVIEW.md" }],
    ["write", { path: "README.md" }],
    ["write", { path: "CHANGELOG.md" }],
  ],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function createRehearsalEngine() {
  return {
    async runPhase(phase, ctx, emit) {
      const { repo, idea, meta, kind } = ctx;
      const narr = NARRATION[phase.id] || [];
      const tools = TOOLSCRIPTS[phase.id] || [];
      const speed = meta.speed || 1;
      const step = Math.round(150 / speed);

      emit({ type: "phase", id: phase.id, label: phase.label, agent: phase.agent, status: "start" });

      const rendered = render(idea);
      const writePlan = [
        ["app/index.html", rendered["index.html"]],
        ["app/styles.css", rendered["styles.css"]],
        ["app/app.js", rendered["app.js"]],
      ];

      for (let i = 0; i < narr.length; i++) {
        const text = narr[i];
        await sleep(step * 1.4);
        // stream it in chunks
        const chunks = text.match(/.{1,18}(\s|$)/g) || [text];
        for (const c of chunks) {
          emit({ type: "delta", phase: phase.id, agent: phase.agent, content: c });
          await sleep(Math.round(16 / speed) + 3);
        }
        emit({ type: "msg", phase: phase.id, agent: phase.agent, kind: "text", text });
      }

      for (const [toolName, args] of tools) {
        await sleep(step);
        emit({ type: "tool", phase: phase.id, agent: phase.agent, name: toolName, args, status: "call" });
        await sleep(step * 1.1);

        if (toolName === "write" && phase.id === "build") {
          const match = (writePlan.find(([p]) => p === args.path));
          if (match) {
            fs.mkdirSync(path.join(repo, "app"), { recursive: true });
            fs.writeFileSync(path.join(repo, args.path), match[1]);
            emit({ type: "file", phase: phase.id, path: args.path });
          }
        }
        if (toolName === "write" && phase.id === "brief") {
          const content =
            "# Brief\n\n## The idea\n" + idea.trim() +
            "\n\n## Outcome\nOne working product, committed to git.\n\n## Boundaries\n- No accounts/backends in v1.\n- One polished thing over ten half things.\n";
          fs.writeFileSync(path.join(repo, "BRIEF.md"), content);
          emit({ type: "file", phase: phase.id, path: "BRIEF.md" });
        }
        if (toolName === "write" && phase.id === "plan") {
          const prd = [
            "# PRD — " + productName(idea),
            "",
            "## Problem",
            buildPitch(idea),
            "",
            "## Users",
            "People who need “" + idea.trim().replace(/\.$/, "") + "” and don't have time for friction.",
            "",
            "## Experience",
            "You open the product. It loads instantly, explains itself in one line, and the main action is obvious.",
            "",
            "## Sections",
            "- Hero: name, one-line value, two actions.",
            "- Capabilities: the four things it does.",
            "- How it works: three steps from idea to done.",
            "- Live demo: a real, working widget.",
            "- Final call to action.",
            "",
            "## Content plan",
            "Every word specific to the product. No placeholders, no lorem ipsum.",
            "",
            "## Out of scope",
            "Backends, accounts, billing, native apps.",
          ].join("\n");
          const tasks = [
            "# TASKS",
            "",
            "## Build order",
            "- [x] Product name and one-line positioning",
            "- [x] Information architecture and section map",
            "- [x] Hero with headline, lead, and two actions",
            "- [x] Capabilities section with four feature cards",
            "- [x] How-it-works section with three steps",
            "- [x] Working demo widget with real interactivity",
            "- [x] Final call-to-action section",
            "- [x] Footer with product line and crew credit",
            "",
            "## Future",
            "- [ ] Accounts and persistence",
            "- [ ] Billing and plans",
            "",
          ].join("\n");
          fs.writeFileSync(path.join(repo, "PRD.md"), prd);
          fs.writeFileSync(path.join(repo, "TASKS.md"), tasks);
          emit({ type: "file", phase: phase.id, path: "PRD.md" });
          emit({ type: "file", phase: phase.id, path: "TASKS.md" });
        }
        if (toolName === "write" && phase.id === "review") {
          const review =
            "# REVIEW\n\nVerdict: **PASS**\n\n| ID | Severity | Finding | Where | Fixed? |\n|----|----------|---------|-------|--------|\n| R1 | Low | Empty-state text could be friendlier | app.js | yes |\n| R2 | Low | Meta description could be more specific | index.html | yes |\n| R3 | Info | No visual glitches on narrow screens | styles.css | n/a |\n\nAll findings addressed. The product matches the plan and is ready to ship.\n";
          fs.writeFileSync(path.join(repo, "REVIEW.md"), review);
          emit({ type: "file", phase: phase.id, path: "REVIEW.md" });
        }
        if (toolName === "write" && phase.id === "ship") {
          const name = productName(idea);
          const readme = [
            "# " + name,
            "",
            "> " + buildTagline(idea),
            "",
            "## What it is",
            buildPitch(idea),
            "",
            "## Run it",
            "Open `app/index.html` in any browser. No build, no install, no server.",
            "",
            "## What was built",
            "- Hero with positioning and two actions",
            "- Capabilities grid — four real features",
            "- How-it-works with three steps",
            "- A working demo widget (try it)",
            "- Final CTA and footer",
            "",
            "## The crew",
            "This product was planned, built, reviewed, and shipped by a crew of git-native agents living in this repo:",
            "",
            "- `agents/pm` — product planning (PRD + tasks)",
            "- `agents/engineer` — implementation in `app/`",
            "- `agents/qa` — review and fixes (`REVIEW.md`)",
            "- `agents/marketer` — this README + `CHANGELOG.md`",
            "",
            "Company files: `SOUL.md`, `RULES.md`, `memory/`, `workflows/build.yaml`.",
            "",
            "## Status",
            "Shipped: `v1.0.0`",
          ].join("\n");
          const changelog = [
            "# Changelog",
            "",
            "## [1.0.0]",
            "",
            "### Added",
            "- " + name + " with hero, capabilities, how-it-works, and final CTA",
            "- Working demo widget",
            "- Responsive dark theme",
            "",
            "### Fixed",
            "- Nothing shipped broken in this release.",
          ].join("\n");
          fs.writeFileSync(path.join(repo, "README.md"), readme);
          fs.writeFileSync(path.join(repo, "CHANGELOG.md"), changelog);
          emit({ type: "file", phase: phase.id, path: "README.md" });
          emit({ type: "file", phase: phase.id, path: "CHANGELOG.md" });
        }
        if (toolName === "commit") {
          const r = await g.commitAll(repo, args.message);
          if (r.ok) emit({ type: "commit", hash: r.out, message: args.message, source: "tool" });
        }
        if (toolName === "checkpoint") {
          const mem = fs.readFileSync(path.join(repo, "memory", "MEMORY.md"), "utf8");
          const stamp = new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC";
          fs.writeFileSync(
            path.join(repo, "memory", "MEMORY.md"),
            mem + "\n- " + stamp + " — " + args.note
          );
          const r = await g.commitAll(repo, "mem: " + args.note);
          if (r.ok) emit({ type: "commit", hash: r.out, message: "mem: " + args.note, source: "tool" });
        }

        emit({ type: "tool", phase: phase.id, agent: phase.agent, name: toolName, args, status: "result", content: "ok" });
      }

      emit({ type: "phase", id: phase.id, label: phase.label, agent: phase.agent, status: "end" });
    },
  };
}

module.exports = { createRehearsalEngine, productName, pickTemplate, render, buildTagline };
