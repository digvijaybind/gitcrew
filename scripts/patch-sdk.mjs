#!/usr/bin/env node
// gitcrew — patch the gitagent/pi-ai SDK so custom (gateway/Ollama) endpoints
// can run WITHOUT an API key. The benchmark gateways (89.34.219.53:20128,
// 31.42.189.181:20128) return 401 if ANY non-empty Authorization header is
// sent, but accept `Authorization: Bearer ` (empty token). pi-ai's default
// openai-completions provider refuses keyless operation and forces an env key
// into the client, which breaks these endpoints.
//
// Idempotent: each patched file gets a marker comment; safe to run repeatedly.
// Wired into `npm run postinstall` (server/package.json).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "server");
const MARK = "// gitcrew:keyless-noauth";

function patch(file, marker, pairs) {
  const abs = join(ROOT, file);
  if (!existsSync(abs)) {
    console.log(`  ! missing ${file}`);
    return false;
  }
  let src = readFileSync(abs, "utf8");
  if (src.includes(MARK)) {
    console.log(`  · already patched ${file}`);
    return true;
  }
  let changed = false;
  for (const [from, to] of pairs) {
    if (!src.includes(from)) {
      console.log(`  ! pattern not found in ${file}: ${from.slice(0, 60).replace(/\n/g, "\\n")}...`);
      continue;
    }
    src = src.replace(from, to);
    changed = true;
  }
  if (changed) {
    // Insert the marker at the top of the file after the last `import`.
    const markerLine = src.includes(marker)
      ? src
      : src.replace(/^((?:import[^\n]*\n|\/\/[^\n]*\n)*)/, `$1${MARK}\n`);
    writeFileSync(abs, markerLine, "utf8");
    console.log(`  ✓ patched ${file}`);
  }
  return changed;
}

// 1) gitagent loader: mark custom endpoints whose provider prefix is "noauth"
//    so pi-ai can treat them as keyless.
const loaderPairs = [
  [
    `function createCustomModel(provider, modelId, baseUrl) {
    return {
        id: modelId,
        name: \`\${modelId} (\${provider})\`,
        api: "openai-completions",
        provider,
        baseUrl,`,
    `function createCustomModel(provider, modelId, baseUrl) {
    return {
        id: modelId,
        name: \`\${modelId} (\${provider})\`,
        api: "openai-completions",
        provider,
        baseUrl,
        noAuth: provider === "noauth",`,
  ],
];

// 2) pi-ai openai-completions: skip the key requirement + empty bearer for noAuth.
const piPairs = [
  [
    `    const apiKey = options?.apiKey || getEnvApiKey(model.provider);
    if (!apiKey) {
        throw new Error(\`No API key for provider: \${model.provider}\`);
    }`,
    `    const apiKey = model.noAuth ? "" : options?.apiKey || getEnvApiKey(model.provider);
    if (!apiKey && !model.noAuth) {
        throw new Error(\`No API key for provider: \${model.provider}\`);
    }`,
  ],
  [
    `    if (!apiKey) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it as an argument.");
        }
        apiKey = process.env.OPENAI_API_KEY;
    }`,
    `    if (!apiKey) {
        if (model.noAuth) {
            apiKey = "";
        } else if (!process.env.OPENAI_API_KEY) {
            throw new Error("OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass it as an argument.");
        } else {
            apiKey = process.env.OPENAI_API_KEY;
        }
    }`,
  ],
];

console.log("gitcrew · patching SDK for keyless custom endpoints");
patch("node_modules/@open-gitagent/gitagent/dist/loader.js", MARK, loaderPairs);
patch("node_modules/@mariozechner/pi-ai/dist/providers/openai-completions.js", MARK, piPairs);
console.log("done");
