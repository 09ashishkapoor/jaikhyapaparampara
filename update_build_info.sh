#!/usr/bin/env bash
set -euo pipefail
# Build Number and Date Auto-Updater - Linux-compatible wrapper for scripts/update_build.py

cd "$(dirname "$0")"

if [ ! -f "index.html" ]; then
  echo "Error: index.html not found"
  exit 1
fi

# Prefer python3 but allow overriding with PYTHON env var
PYTHON=${PYTHON:-python3}
if ! command -v "$PYTHON" >/dev/null 2>&1; then
  echo "Error: $PYTHON not found. Install Python 3 or set PYTHON env var to the interpreter path."
  exit 1
fi

"$PYTHON" "scripts/update_build.py" "$@"
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
  echo "Error: update script exited with code $EXIT_CODE"
  exit $EXIT_CODE
fi

echo "index.html updated successfully."
