#!/bin/sh
# checkpoint tool: append a memory note, then commit memory.
# Receives JSON args on stdin: { "note": "..." }
note=$(node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d).note||'checkpoint'))")
stamp=$(date -u +"%Y-%m-%d %H:%M UTC")
printf -- "- %s — %s\n" "$stamp" "$note" >> memory/MEMORY.md
git add -A
git commit -q -m "mem: $note" && echo "memory committed: $note"
