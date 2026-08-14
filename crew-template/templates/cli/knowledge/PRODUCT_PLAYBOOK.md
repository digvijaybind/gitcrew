# CLI Tool Playbook

The law for everything that ships from this repo. Products are **Node.js CLIs** built with Commander.js, TypeScript, and distributed via npm.

## 1. Tech Stack

- **Language**: TypeScript (ESM), Node.js 20+
- **Framework**: Commander.js (v11+) for commands/options/help
- **Prompts**: @inquirer/prompts (interactive mode)
- **Output**: chalk (colors), ora (spinners), cli-table3 (tables)
- **Config**: cosmiconfig (`.rc` files: `.toolrc.json`, `.toolrc.yaml`, etc.)
- **Logging**: pino (structured) + pino-pretty (dev)
- **Tests**: Vitest (unit) + executable integration tests
- **Packaging**: `pkg` or `esbuild` → single binary, or npm package
- **Release**: semantic-release + changelog

## 2. Project Structure

```
src/
  index.ts            ← entry: Commander program, command registration
  commands/
    init.ts           ← project scaffolding
    generate.ts       ← code/file generators
    config.ts         ← get/set/validate config
    doctor.ts         ← environment/health checks
  utils/
    config.ts         ← cosmiconfig loader + validation (Zod)
    logger.ts         ← pino instance
    fs.ts             ← safe file ops (atomic write, backup)
    exec.ts           ← spawn with timeout, streaming output
  types.ts            ← shared types, command interfaces
tests/
  unit/               ← pure logic tests
  integration/        ← spawn CLI, assert stdout/exit code
bin/
  tool                ← shebang entry (generated)
package.json          ← "bin": { "tool": "bin/tool" }, scripts
tsconfig.json
.eslintrc.json
```

## 3. CLI Design Rules

- **Single binary**: `tool <command> [options]`
- **Subcommands**: noun-verb (`generate component`, `config get`)
- **Global flags**: `--help`, `--version`, `--verbose`, `--json`, `--no-color`
- **Interactive mode**: `--interactive` / `-i` launches prompts
- **Config hierarchy**: CLI args > env vars > `.toolrc` > defaults
- **Exit codes**: 0 success, 1 general error, 2 usage error, 3 config error
- **Stdout**: machine-readable (JSON with `--json`), human otherwise
- **Stderr**: logs, progress, errors only
- **Help**: `tool --help`, `tool <cmd> --help` — auto-generated, comprehensive

## 4. UX Standards

- Fast startup (< 100ms cold)
- Pretty errors with actionable suggestions (`Did you mean...?`)
- Spinners for long ops, progress bars for multi-step
- Confirm destructive actions (`--yes` to skip)
- Dry-run mode (`--dry-run`) shows what would happen
- Colored output respects `--no-color` and `NO_COLOR` env

## 5. Testing Standards

- Unit: pure functions (config, utils, parsers) — 100% target
- Integration: spawn `bin/tool` via `execa`, assert stdout/stderr/exit
- Snapshot: `--help` output, `--version`, command trees
- E2E: common workflows (init → generate → config → doctor)
- Run: `npm test` (Vitest)

## 6. Packaging & Release

- Dev: `tsx src/index.ts` (tsx for TS execution)
- Build: `esbuild` → `dist/index.js` + `bin/tool` wrapper
- Single binary: `pkg dist/index.js` → `tool-linux`, `tool-macos`, `tool-win.exe`
- Publish: `npm publish` (includes bin entry)
- Homebrew tap: formula generated from release

## 7. Acceptance Criteria (v1.0.0)

- `npm run dev -- --help` works
- `npm run build` → `dist/` + executable `bin/tool`
- `./bin/tool --version` prints version
- `./bin/tool init` scaffolds a project
- `npm test` passes (unit + integration)
- Single binary builds for linux/mac/win
- `npm publish` dry-run succeeds
- No globals leak, no `require` in ESM code