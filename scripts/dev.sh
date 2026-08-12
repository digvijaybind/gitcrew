#!/usr/bin/env bash
# gitcrew — one-command dev runner
set -e
cd "$(dirname "$0")"

PORT="${PORT:-4173}"
PIDFILE="server/.pid"

stop() {
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
    echo "· stopped"
  fi
}

case "${1:-start}" in
  start)
    if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
      echo "· already running on :$PORT (pid $(cat "$PIDFILE"))"
      exit 0
    fi
    echo "· installing deps…"
    (cd server && npm install --silent 2>/dev/null || npm install --silent)
    echo "· launching server on :$PORT"
    nohup node server/index.js > /tmp/gitcrew.log 2>&1 &
    echo $! > "$PIDFILE"
    sleep 1
    echo "· gitcrew → http://localhost:$PORT"
    ;;
  stop)
    stop
    ;;
  restart)
    stop
    sleep 1
    "$0" start
    ;;
  *)
    echo "usage: $0 [start|stop|restart]"
    ;;
esac
