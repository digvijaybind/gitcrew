const { execFile } = require("child_process");
const { promisify } = require("util");
const execFileP = promisify(execFile);

async function git(cwd, args, opts = {}) {
  try {
    const { stdout } = await execFileP("git", args, {
      cwd,
      maxBuffer: 64 * 1024 * 1024,
      ...opts,
    });
    return { ok: true, out: stdout.replace(/\s+$/, ""), err: "" };
  } catch (e) {
    return { ok: false, out: "", err: (e.stderr || e.message || "").trim() };
  }
}

const identity = ["-c", "user.name=gitcrew crew", "-c", "user.email=crew@gitcrew.dev"];

async function init(repoDir, message) {
  await git(repoDir, ["init", "-q", "-b", "main"]);
  await git(repoDir, [...identity, "add", "-A"]);
  await git(repoDir, [...identity, "commit", "-q", "-m", message]);
}

async function commitAll(repoDir, message) {
  await git(repoDir, [...identity, "add", "-A"]);
  const r = await git(repoDir, [...identity, "commit", "-q", "-m", message]);
  if (!r.ok && !/nothing to commit/.test(r.err)) return r;
  const head = await git(repoDir, ["rev-parse", "--short", "HEAD"]);
  return { ok: true, out: head.out };
}

async function commitsSince(repoDir, sinceIso) {
  const r = await git(repoDir, [
    "log",
    "--since=" + sinceIso,
    "--pretty=format:%h%x1f%s%x1f%an%x1f%aI",
    "--date-order",
  ]);
  if (!r.ok || !r.out) return [];
  return r.out.split("\n").map((line) => {
    const [hash, subject, author, date] = line.split("\x1f");
    return { hash, subject, author, date };
  });
}

async function log(repoDir, n = 40) {
  const r = await git(repoDir, [
    "log",
    `-${n}`,
    "--pretty=format:%h%x1f%s%x1f%an%x1f%aI%x1f%D",
    "--date-order",
  ]);
  if (!r.ok || !r.out) return [];
  return r.out
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [hash, subject, author, date, refs] = line.split("\x1f");
      return { hash, subject, author, date, refs };
    });
}

async function tags(repoDir) {
  const r = await git(repoDir, ["tag", "--sort=-creatordate"]);
  if (!r.ok) return [];
  return r.out.split("\n").filter(Boolean);
}

async function currentBranch(repoDir) {
  const r = await git(repoDir, ["rev-parse", "--abbrev-ref", "HEAD"]);
  return r.ok ? r.out : "main";
}

async function statusShort(repoDir) {
  const r = await git(repoDir, ["status", "--short"]);
  if (!r.ok) return [];
  return r.out.split("\n").filter(Boolean);
}

async function tree(repoDir, base = "") {
  const args = ["ls-tree", "-r", "--name-only", "HEAD"];
  if (base) args.push(base);
  const r = await git(repoDir, args);
  if (!r.ok) return [];
  return r.out.split("\n").filter(Boolean);
}

async function tag(repoDir, name, message) {
  return git(repoDir, [...identity, "tag", "-a", name, "-m", message]);
}

async function archiveTar(repoDir, outPath) {
  const r = await git(repoDir, ["archive", "--format=tar", "-o", outPath, "HEAD"]);
  return r.ok;
}

module.exports = {
  git,
  identity,
  init,
  commitAll,
  commitsSince,
  log,
  tags,
  currentBranch,
  statusShort,
  tree,
  tag,
  archiveTar,
};
