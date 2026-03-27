#!/bin/bash
# Decode base64 placeholders into PNGs
set -e
for f in dev-server article-preview; do
  infile="$(dirname "$0")/${f}.png.base64"
  outfile="$(dirname "$0")/${f}.png"
  if [ -f "$infile" ]; then
    base64 --decode "$infile" > "$outfile"
    echo "Wrote $outfile"
  else
    echo "Missing $infile"
  fi
done
