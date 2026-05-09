#!/usr/bin/env bash
set -euo pipefail

RELEASE_DIR="${1:?usage: devbox-restart.sh RELEASE_DIR}"
DEPLOY_PATH="${DEPLOY_PATH:-$(cd "$RELEASE_DIR/../.." && pwd)}"
PORT="${PORT:-8000}"
SHARED_DIR="$DEPLOY_PATH/shared"
PID_FILE="$SHARED_DIR/django.pid"
LOG_FILE="$SHARED_DIR/django.log"
PYTHON="$SHARED_DIR/venv/bin/python"

mkdir -p "$SHARED_DIR"

if [ -f "$PID_FILE" ]; then
  old_pid="$(cat "$PID_FILE")"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
    kill "$old_pid" || true
  fi
fi

export DJANGO_DEBUG="${DJANGO_DEBUG:-true}"
export DJANGO_ALLOWED_HOSTS="${DJANGO_ALLOWED_HOSTS:-*}"
export DJANGO_CORS_ALLOW_ALL_ORIGINS="${DJANGO_CORS_ALLOW_ALL_ORIGINS:-true}"
export DB_ENGINE="${DB_ENGINE:-django.db.backends.sqlite3}"
export DB_NAME="${DB_NAME:-$SHARED_DIR/db.sqlite3}"

cd "$RELEASE_DIR/backend"
nohup "$PYTHON" manage.py runserver "0.0.0.0:$PORT" > "$LOG_FILE" 2>&1 &
echo "$!" > "$PID_FILE"

echo "Django demo server started on 0.0.0.0:$PORT"
