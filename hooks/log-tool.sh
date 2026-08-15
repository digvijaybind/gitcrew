#!/bin/sh
# pre_tool_use hook: log tool usage to .gitagent/hooks.log
# Receives JSON context on stdin: { "tool": "...", "args": {...} }
mkdir -p .gitagent
node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const f=require('fs');f.appendFileSync('.gitagent/hooks.log', '['+new Date().toISOString()+'] tool='+j.tool+'\n')}catch(e){}})"
echo '{"action":"allow"}'
