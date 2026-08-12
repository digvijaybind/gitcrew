const fs = require("fs");
const path = require("path");
const store = require("./store");
const { buildChain, modelString } = require("./models");

let sdk = null;
async function loadSdk() {
  if (!sdk) sdk = await import("@open-gitagent/gitagent");
  return sdk;
}

function read(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

const PHASE_PROMPTS = {
  brief: (idea, name) =>
    `You are the CEO of this company repo. The customer brief is in PROJECT.md.\n\nIdea: ${idea}\n\nWrite BRIEF.md at the repo root: restate the idea in plain words, name the one outcome that must work, and set 2-3 boundaries. Then run the checkpoint tool.`,
  plan: (idea, name) =>
    `You are the product planner (pm). Read BRIEF.md and PROJECT.md. Produce PRD.md (problem, users, experience, 3-6 sections, content plan, out of scope) and TASKS.md (ordered, verifiable checklist + "## Future" section). Checkpoint when done.`,
  build: (idea, name) =>
    `You are the engineer. Read PRD.md, TASKS.md and knowledge/PRODUCT_PLAYBOOK.md (the design system — obey it exactly). Build the product in app/ as a self-contained static site: app/index.html, app/styles.css, app/app.js. It must open by double-clicking app/index.html — no build step, no CDN, no dependencies. Make every promised interaction actually work in the browser. Update TASKS.md as you complete tasks. Use the commit tool after each meaningful milestone with a "build:" message.`,
  review: (idea, name) =>
    `You are QA. Read PRD.md, TASKS.md, and every file in app/. Verify completeness, correctness (follow every interaction path), copy (no placeholders), and playbook design compliance. Write REVIEW.md with a verdict and a findings table. Fix every finding you can directly in app/ (commit with "review:" prefix).`,
  ship: (idea, name) =>
    `You are the marketer/shippit. Read git log, PRD.md, TASKS.md, REVIEW.md. Write README.md (pitch, run instructions, what was built, the crew, status) and CHANGELOG.md (honest Added/Fixed bullets under ## [1.0.0]). Create the annotated tag v1.0.0.`,
};

async function createLiveEngine() {
  await loadSdk();
  const { query } = sdk;

  async function runPhaseOnce(phase, ctx, emit, model) {
    const { repo, idea, settings } = ctx;
    const tpl = store.templateDir();
    const agent = phase.agent;

    const soul = read(path.join(tpl, "agents", agent, "SOUL.md"));
    const rules = read(path.join(tpl, "RULES.md"));
    const duties = read(path.join(tpl, "agents", agent, "agent.yaml"));
    const skill = read(path.join(tpl, "skills", phase.id, "SKILL.md"));
    const playbook = phase.id === "build" ? read(path.join(tpl, "knowledge", "PRODUCT_PLAYBOOK.md")) : "";

    const systemPrompt = [
      `You are ${agent} in a tiny product studio whose company lives in this git repo.`,
      soul,
      "## Company rules (non-negotiable)",
      rules,
      phase.id === "brief" ? "" : "## Your specialist role",
      duties ? "" : "",
      skill ? "## The skill you are executing now\n" + skill : "",
      playbook ? "## The design system (obey exactly)\n" + playbook : "",
      "## Workspace facts",
      `- Working directory: ${repo}`,
      `- Product must live in ${repo}/app/ (self-contained static site: index.html, styles.css, app.js)`,
      `- Plan/notes/artifacts go at the repo root as markdown`,
      `- Commit your work with the commit tool (message prefixed with the phase, e.g. "${phase.id}: ...")`,
      `- End the phase by running the checkpoint tool to commit memory`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = PHASE_PROMPTS[phase.id](idea);

    emit({
      type: "system",
      phase: phase.id,
      agent,
      subtype: "model",
      content: `running ${phase.id} on ${model.name} (${model.host})`,
    });

    const gen = query({
      dir: repo,
      model: modelString(model),
      prompt,
      systemPrompt,
      constraints: { temperature: 0.5 },
      maxTurns: phase.maxTurns,
      hooks: {
        onError: (c) => {
          emit({ type: "system", phase: phase.id, agent, subtype: "error", content: c.error });
        },
      },
    });

    let failed = false;
    let sawAssistant = false;
    let sawTool = false;
    try {
      for await (const msg of gen) {
        if (msg.type === "delta") {
          emit({ type: "delta", phase: phase.id, agent, content: msg.content });
        } else if (msg.type === "assistant") {
          sawAssistant = true;
          if (msg.content) emit({ type: "msg", phase: phase.id, agent, kind: "text", text: msg.content });
          if (msg.usage) emit({ type: "usage", phase: phase.id, agent, ...msg.usage });
          if (msg.stopReason === "error") {
            failed = true;
            emit({ type: "system", phase: phase.id, agent, subtype: "error", content: msg.errorMessage || "LLM request failed" });
          }
        } else if (msg.type === "tool_use") {
          sawTool = true;
          emit({ type: "tool", phase: phase.id, agent, name: msg.toolName, args: msg.args, status: "call" });
        } else if (msg.type === "tool_result") {
          emit({ type: "tool", phase: phase.id, agent, name: msg.toolName, status: "result", content: (msg.content || "").slice(0, 400), isError: msg.isError });
        } else if (msg.type === "system") {
          if (msg.subtype === "error") failed = true;
          emit({ type: "system", phase: phase.id, agent, subtype: msg.subtype, content: msg.content });
        }
      }
    } catch (err) {
      failed = true;
      emit({ type: "system", phase: phase.id, agent, subtype: "error", content: String(err.message || err) });
    }

    if (!sawAssistant && !sawTool) failed = true;
    return { ok: !failed };
  }

  return {
    async runPhase(phase, ctx, emit) {
      const { settings } = ctx;
      const chain = buildChain(settings, ctx.lastHealthyKey);
      const agent = phase.agent;

      emit({ type: "phase", id: phase.id, label: phase.label, agent, status: "start" });

      for (let i = 0; i < chain.length; i++) {
        const model = chain[i];
        const { ok } = await runPhaseOnce(phase, ctx, emit, model);
        if (ok) {
          ctx.lastHealthyKey = model.key;
          emit({ type: "phase", id: phase.id, label: phase.label, agent, status: "end", model: model.name });
          return;
        }
        if (i < chain.length - 1) {
          emit({
            type: "system",
            phase: phase.id,
            agent,
            subtype: "fallback",
            content: `model ${model.name} failed — retrying ${phase.id} with ${chain[i + 1].name}`,
          });
        } else {
          emit({ type: "phase", id: phase.id, label: phase.label, agent, status: "error", model: model.name });
        }
      }
    },
  };
}

module.exports = { createLiveEngine };
