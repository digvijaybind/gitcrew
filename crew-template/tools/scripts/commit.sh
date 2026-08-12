#!/bin/sh
# commit tool: stage everything, commit with the provided message.
# Receives JSON args on stdin: { "message": "..." }
msg=$(node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.parse(d).message||'wip'))")
git add -A
git commit -q -m "$msg" && echo "committed: $msg"
