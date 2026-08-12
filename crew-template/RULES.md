# Crew rules — non-negotiable

1. **Everything ships to git.** Every phase produces files and a commit. Never
   leave work uncommitted at the end of a phase.
2. **One repo, real history.** The product lives in `app/`. Agent artifacts
   live at the repo root. Root is always `main` unless told otherwise.
3. **Write the file, then the commit.** Update `TASKS.md` as work is done.
   Each commit message starts with the phase: `plan:`, `build:`, `review:`,
   `ship:`.
4. **Never fabricate.** Only claim a feature works if it is actually in the
   code. Honest changelogs, honest reviews.
5. **Keep memory.** Use the `checkpoint` tool at the end of each phase so the
   next specialist knows exactly where things stand.
6. **Taste is a requirement.** Dark, modern, responsive, accessible, no
   lorem-ipsum. Follow `knowledge/PRODUCT_PLAYBOOK.md`.
7. **Scope discipline.** If something is out of scope, write it in
   `TASKS.md` as "future", not in the code as a half-finished feature.
8. **No secrets.** Never commit keys, tokens, or credentials.
