#!/usr/bin/env bash
# CSV 4종을 R2 버킷에 업로드한다.
#
# Usage: bash scripts/upload-to-r2.sh
# Requires: wrangler v3+, 'byeongithon-opus-stats' R2 bucket created

set -euo pipefail
cd "$(dirname "$0")/.."

BUCKET="byeongithon-opus-stats"
DATA_DIR="data"

echo "[r2] bucket: $BUCKET"

# Ensure bucket exists (idempotent)
node_modules/.bin/wrangler r2 bucket create "$BUCKET" 2>/dev/null || true

for f in total.csv key_breakdown.csv model_breakdown.csv hourly.csv; do
   path="$DATA_DIR/$f"
   if [ ! -f "$path" ]; then
      echo "[r2] skip missing: $path" >&2
      continue
   fi
   echo "[r2] upload $path → r2://$BUCKET/$f"
   node_modules/.bin/wrangler r2 object put "$BUCKET/$f" \
      --file "$path" \
      --content-type "text/csv; charset=utf-8" \
      --remote
done

echo "[r2] done."
