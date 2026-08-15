# Email to Siva — Recruiter / GitAgentProtocol team

**Subject:** I built a tiny AI dev company that lives in git — it builds & ships real products end-to-end. Here's how it works.

---

Hi Siva,

I took up the GitAgentProtocol challenge and built **gitcrew** — a working,
agentic AI application where a "company" of five AI specialists lives entirely
inside a git repository, and turns a one-line product idea into a shipped,
live product on its own.

**Watch it work (2 min video):**
`docs/video/gitcrew-walkthrough.webm`

**Try it live (lands directly on the landing page — no interstitial):**
`https://meetup-briefly-startup-entered.trycloudflare.com`

**Everything it ships auto-publishes here:**
`https://digvijaybind.github.io/gitcrew/`

**Code:** `https://github.com/digvijaybind/gitcrew`

---

## What it is

You type one line, e.g. *"a habit tracker that turns streaks into a shareable
garden."* A crew of five git-native agents — **CEO → PM → Engineer → QA →
Shippit** — plans, builds, reviews and ships it into a real git repo. Every
decision is a commit. The finished product is previewable, downloadable, and
auto-published to a live URL.

## How the agentic AI works (the mechanism)

### 0. The full flow — from click to shipped product
Here's exactly what my system does, end to end:

1. **You type an idea** ("a habit tracker that turns streaks into a shareable
   garden") and hit **Launch crew**.
2. **The server deploys a crew** — it clones the company repository
   (`crew-template/`), seeds it with your brief, and gets a fresh isolated
   workspace repo. The agent's whole identity is now that repo.
3. **Five specialists run one after another** — CEO writes the brief, PM the
   plan, Engineer the product, QA the review + fixes, Shippit the docs and the
   `v1.0.0` tag. Each one is a real LLM agent that calls real tools (`commit`,
   `checkpoint`) inside that repo.
4. **Everything streams live** — phases, commits, tool results and file writes
   stream to the browser over SSE, so you watch the crew build in real time.
5. **The repo is real** — `git log` on the finished workspace shows the whole
   story: `init: crew deployed` → `plan:` → `build:` → `review:` → `ship:` →
   `v1.0.0`. You can browse the tree, open any file, and download the whole
   repo (with history) as a `.tgz`.
6. **It ships itself** — the finished product is previewed in the browser, and
   the server auto-publishes it to GitHub Pages. The live URL is always the
   newest product.

### 1. The agent IS a repo (GitAgentProtocol)
The company definition is a real git repository (`crew-template/`):
`SOUL.md` (identity), `RULES.md` (behavior), `agents/<role>/` (each specialist's
manifest + SOUL), `skills/<phase>/` (prompt modules), `tools/*.yaml`
(declarative tools), `workflows/build.yaml` (the pipeline), `hooks/hooks.yaml`
(tool audit log), `memory/MEMORY.md` (persistent memory).

Launching a crew = **cloning that repo** and seeding it with your brief. So the
agent's entire identity, rules, memory and tools are versioned files — not a
magic black box.

### 2. Five specialists run in sequence (the pipeline)
Each phase loads that role's sub-agent: `composeSystemPrompt(role)` builds the
system prompt from its SOUL + RULES + the phase's skill module, then one
`query()` call into the GitAgent SDK runs the agent **inside the workspace
repo**:

```js
import { query } from "@open-gitagent/gitagent";

const gen = query({
  dir: repoDir,                 // the workspace IS the agent
  model: `${provider}:${model}`,
  prompt: phasePrompt,
  systemPrompt: composeSystemPrompt(role),
  maxTurns: phase.maxTurns,
});
for await (const msg of gen) {
  // delta / assistant / tool_use / tool_result / system → streamed live
  // to the browser over SSE
}
```

| Phase | Agent | Deliverable |
|-------|-------|-------------|
| Brief | `ceo` | `BRIEF.md` — vision + boundaries |
| Plan | `pm` | `PRD.md`, `TASKS.md` |
| Build | `engineer` | `app/` — a real, self-contained product |
| Review | `qa` | `REVIEW.md` + fixes |
| Ship | `marketer` | `README.md`, `CHANGELOG.md`, tag `v1.0.0` |

### 3. Tools the agents actually call
Declarative tools (`commit.yaml`, `checkpoint.yaml`) are auto-discovered from
the repo. Every commit and memory checkpoint is a real tool call by the agent
— and hooks audit every tool call, so the whole run is traceable.

### 4. Streaming, not waiting
The server streams every phase event, commit and tool result to the browser
over **SSE** — you watch the crew think, write, commit and fix in real time.
The "agent is building your solution" loader tracks the exact pipeline phase.

### 5. Auto-ship to production
When the pipeline finishes, the platform tags `v1.0.0`, syncs the newest
product into the `gh-pages` branch via a worktree, and pushes it — no manual
deploy. **The live URL is always the newest product.**

## Why this matters for companies

1. **The company is the artifact.** `SOUL.md`, `RULES.md`, `memory/`, tools and
   skills are all versioned files. You can `git log` the memory, `git diff` the
   rules, **branch** a build, and **fork** the whole company.
2. **Explainability for free.** Every decision is a commit. `git log` tells the
   whole story: `init: crew deployed` → `plan:` → `build:` → `review:` →
   `ship:` → `v1.0.0`. If a result is wrong, you audit git history — not a
   black box.
3. **Reproducible teams.** Clone the template, edit `SOUL.md`, and you have a
   different personality. Onboarding a new engineer is a `git clone`.
4. **Zero-to-live automation.** Idea → shipped, live URL, no manual step.

## Why this matters for product builders

- **Speed:** one-line idea → working, live product in minutes.
- **Real output, not slides:** an actual `app/` you can preview and download
  (full repo + history as `.tgz`).
- **Two modes:** *Rehearsal* (deterministic, no API key — instant demos) and
  *Live* (real LLM agents via the GitAgent SDK — OpenAI, Anthropic, Google,
  Groq, xAI, Mistral, or a self-hosted llama.cpp endpoint).
- **It scales:** the pipeline that built gitcrew's demo products is itself a
  forkable company.

## Live proof

I launched a live-mode crew ("a landing page for a fintech app") — real LLM
agents ran **brief → plan → build → review → ship** to completion. You can do
the same in the tunnel link: switch to **Live**, drop a model key in Settings,
and watch it build.

---

I'd love to walk you through it live — happy to launch a fresh crew on a call
so you can watch it go from idea to shipped product end to end.

Best,
Digvijay
