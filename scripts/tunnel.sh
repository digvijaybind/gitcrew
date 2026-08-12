#!/usr/bin/env bash
# gitcrew — public tunnel manager (localtunnel; cloudflared doesn't route
# reliably through this NAT). Prints a public https URL for the app.
set -e
cd "$(dirname "$0")/.."

PIDFILE="/tmp/gitcrew-tunnel.pid"
LOGFILE="/tmp/gitcrew-tunnel.log"
PORT="${PORT:-4173}"
LT="/home/kali/.npm-global/bin/lt"

stop() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill "$(cat "$PIDFILE")"
    rm -f "$PIDFILE"
    echo "· tunnel stopped"
  else
    echo "· tunnel not running"
  fi
}

start() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "· tunnel already running → $(url)"
    return
  fi
  if [ ! -x "$LT" ]; then
    echo "· installing localtunnel…"
    npm install -g localtunnel
  fi
  nohup setsid "$LT" --port "$PORT" > "$LOGFILE" 2>&1 < /dev/null &
  echo $! > "$PIDFILE"
  for i in $(seq 1 30); do
    U=$(url)
    [ -n "$U" ] && break
    sleep 1
  done
  echo "· public URL: $(url)"
  echo "· note: first browser visit shows the localtunnel interstitial once"
}

url() {
  grep -oE "https://[a-z0-9-]+\.loca\.lt" "$LOGFILE" 2>/dev/null | head -1
}

case "${1:-start}" in
  start) start ;;
  stop) stop ;;
  restart) stop; sleep 1; start ;;
  url) url ;;
  *) echo "usage: $0 [start|stop|restart|url]" ;;
esac
