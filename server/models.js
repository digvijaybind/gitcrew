// Model catalog — remote OpenAI-compatible endpoints validated for tool-calling
// agent use. Grade/latency from a 4-task coding benchmark; reachability
// re-validated at the time of writing. Fallback chain is built from this list.
// Remote only — no local Ollama/LM Studio.

const CATALOG = [

  // S-grade endpoint (89.34.219.53) — validated, tool-calling OK
  { key: "s-89.34.219.53/kr-qwen3-coder-next", name: "kr/qwen3-coder-next", host: "89.34.219.53", model: "kr/qwen3-coder-next", baseUrl: "http://89.34.219.53:20128/v1", grade: "S", latency: 4.1, note: "benchmark 28/28 · 100%" },
  { key: "s-89.34.219.53/kiro-qwen3-coder-next", name: "kiro/qwen3-coder-next", host: "89.34.219.53", model: "kiro/qwen3-coder-next", baseUrl: "http://89.34.219.53:20128/v1", grade: "S", latency: 3.3, note: "benchmark 28/28 · 100%" },
  { key: "s-89.34.219.53/kiro-auto", name: "kiro/auto", host: "89.34.219.53", model: "kiro/auto", baseUrl: "http://89.34.219.53:20128/v1", grade: "S", latency: 3.0, note: "benchmark 28/28 · 100%" },
  { key: "a-89.34.219.53/kr-auto", name: "kr/auto", host: "89.34.219.53", model: "kr/auto", baseUrl: "http://89.34.219.53:20128/v1", grade: "A", latency: 3.5, note: "auto-route" },
  { key: "a-89.34.219.53/kr-claude-sonnet-4.5", name: "kr/claude-sonnet-4.5", host: "89.34.219.53", model: "kr/claude-sonnet-4.5", baseUrl: "http://89.34.219.53:20128/v1", grade: "A", latency: 4.6, note: "benchmark 26/28" },
  { key: "a-89.34.219.53/kiro-claude-sonnet-4.5", name: "kiro/claude-sonnet-4.5", host: "89.34.219.53", model: "kiro/claude-sonnet-4.5", baseUrl: "http://89.34.219.53:20128/v1", grade: "A", latency: 5.1, note: "benchmark 26/28" },
  { key: "a-89.34.219.53/kiro-claude-haiku-4.5", name: "kiro/claude-haiku-4.5", host: "89.34.219.53", model: "kiro/claude-haiku-4.5", baseUrl: "http://89.34.219.53:20128/v1", grade: "A", latency: 3.5, note: "benchmark 26/28" },
  { key: "b-89.34.219.53/no-think-kr-haiku", name: "no-think/kr/claude-haiku-4.5", host: "89.34.219.53", model: "no-think/kr/claude-haiku-4.5", baseUrl: "http://89.34.219.53:20128/v1", grade: "B", latency: 2.0, note: "no-reasoning · fast" },

  // fast endpoint (31.42.189.181) — ~0.3-3s, tool-calling OK
  { key: "b-31.42.189.181/kr-haiku", name: "kr/claude-haiku-4.5", host: "31.42.189.181", model: "kr/claude-haiku-4.5", baseUrl: "http://31.42.189.181:20128/v1", grade: "B", latency: 0.3, note: "benchmark 26/28 · fastest" },
  { key: "b-31.42.189.181/kiro-haiku", name: "kiro/claude-haiku-4.5", host: "31.42.189.181", model: "kiro/claude-haiku-4.5", baseUrl: "http://31.42.189.181:20128/v1", grade: "B", latency: 1.8, note: "benchmark 26/28" },
  { key: "b-31.42.189.181/kr-sonnet", name: "kr/claude-sonnet-4.5", host: "31.42.189.181", model: "kr/claude-sonnet-4.5", baseUrl: "http://31.42.189.181:20128/v1", grade: "B", latency: 2.9, note: "benchmark 26/28" },
  { key: "b-31.42.189.181/kiro-sonnet", name: "kiro/claude-sonnet-4.5", host: "31.42.189.181", model: "kiro/claude-sonnet-4.5", baseUrl: "http://31.42.189.181:20128/v1", grade: "B", latency: 3.0, note: "benchmark 26/28" },

  // gateway (A) — works but rate-limit flaky
  { key: "a-gateway/deepseek-v4-flash", name: "oc/deepseek-v4-flash-free", host: "gateway.bizsearchuae.com", model: "oc/deepseek-v4-flash-free", baseUrl: "https://gateway.bizsearchuae.com/v1", grade: "A", latency: 2.5, note: "benchmark 28/28 · rate-limit flaky" },
  { key: "a-gateway/big-pickle", name: "oc/big-pickle", host: "gateway.bizsearchuae.com", model: "oc/big-pickle", baseUrl: "https://gateway.bizsearchuae.com/v1", grade: "A", latency: 4.0, note: "benchmark 28/28 · rate-limit flaky" },
];

const GRADE_RANK = { L: 0, S: 1, A: 2, B: 3, C: 4, D: 5, F: 6 };
// Never fall back to local Ollama/LM Studio even if someone adds one as a
// custom endpoint — runs must stay on remote models.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);

function byKey(key) {
  return CATALOG.find((m) => m.key === key) || null;
}

// Ordered fallback chain: selected model first, then the rest of the catalog
// sorted by grade then latency (healthy model from this run gets priority).
function buildChain(settings, lastHealthyKey) {
  const chain = [];
  const seen = new Set();
  const push = (m) => { if (m && !seen.has(m.key)) { seen.add(m.key); chain.push(m); } };

  if (lastHealthyKey) push(byKey(lastHealthyKey));
  push(byKey(settings.modelKey));
  if (settings.baseUrl) {
    const host = new URL(settings.baseUrl).hostname;
    if (!LOCAL_HOSTS.has(host)) {
      push({ key: "custom/" + settings.model, name: settings.model, host, model: settings.model, baseUrl: settings.baseUrl, grade: "L", latency: 0, note: "custom endpoint" });
    }
  }
  if (settings.fallback) {
    const rest = CATALOG.filter((m) => !seen.has(m.key) && !LOCAL_HOSTS.has(m.host));
    rest.sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.latency - b.latency);
    rest.forEach(push);
  }
  return chain;
}

// GitAgent loader syntax: "provider:model-id@base-url"
// Hosts that reject any non-empty Authorization header (or accept none) use
// the "noauth" provider prefix, which the SDK patch turns into an empty bearer
// token. Real keyed gateways keep "local" and rely on OPENAI_API_KEY.
const NOAUTH_HOSTS = ["localhost", "89.34.219.53", "31.42.189.181"];
function modelString(m) {
  const provider = NOAUTH_HOSTS.includes(m.host) ? "noauth" : "local";
  return `${provider}:${m.model}@${m.baseUrl}`;
}

module.exports = { CATALOG, byKey, buildChain, modelString };
