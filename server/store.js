const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const WS_ROOT = path.join(ROOT, "workspaces");
const TEMPLATE = path.join(ROOT, "crew-template");
const SETTINGS_FILE = path.join(ROOT, "server", "settings.json");

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function genId() {
  return crypto.randomBytes(4).toString("hex");
}

function wsDir(id) {
  return path.join(WS_ROOT, id);
}
function repoDir(id) {
  return path.join(WS_ROOT, id, "repo");
}
function metaPath(id) {
  return path.join(WS_ROOT, id, "meta.json");
}

function loadMeta(id) {
  try {
    return JSON.parse(fs.readFileSync(metaPath(id), "utf8"));
  } catch {
    return null;
  }
}

function saveMeta(id, meta) {
  fs.writeFileSync(metaPath(id), JSON.stringify(meta, null, 2));
}

function list() {
  ensureDir(WS_ROOT);
  return fs
    .readdirSync(WS_ROOT)
    .filter((d) => fs.existsSync(metaPath(d)))
    .map((d) => {
      const m = loadMeta(d);
      return { id: d, ...m };
    });
}

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
  } catch {
    return {
      provider: "openai",
      model: "gpt-4o-mini",
      keys: {},
    };
  }
}

function saveSettings(s) {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

function templateDir() {
  return TEMPLATE;
}

module.exports = {
  ROOT,
  WS_ROOT,
  TEMPLATE,
  genId,
  wsDir,
  repoDir,
  metaPath,
  loadMeta,
  saveMeta,
  list,
  loadSettings,
  saveSettings,
  templateDir,
  ensureDir,
};
