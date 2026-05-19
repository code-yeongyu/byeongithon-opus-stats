#!/usr/bin/env bash
# Enforce the 250 pure-LOC rule across all .ts/.tsx files.
# Pure LOC = lines that are NOT blank, NOT comment-only, NOT import-only.
set -euo pipefail

LIMIT=250
FAILED=0
SCANNED=0

count_pure_loc() {
   awk '
      BEGIN { in_block = 0 }
      {
         line = $0
         # Strip trailing whitespace
         sub(/[[:space:]]+$/, "", line)

         # Blank line
         if (line ~ /^[[:space:]]*$/) next

         # Block comment handling
         if (in_block) {
            if (line ~ /\*\//) in_block = 0
            next
         }
         if (line ~ /^[[:space:]]*\/\*/) {
            if (line !~ /\*\//) in_block = 1
            next
         }

         # Single-line comment
         if (line ~ /^[[:space:]]*\/\//) next

         # JSDoc continuation
         if (line ~ /^[[:space:]]*\*/) next

         count++
      }
      END { print count + 0 }
   ' "$1"
}

while IFS= read -r -d '' file; do
   SCANNED=$((SCANNED + 1))
   n=$(count_pure_loc "$file")
   if [ "$n" -gt "$LIMIT" ]; then
      echo "FAIL  ($n LOC > $LIMIT): $file" >&2
      FAILED=$((FAILED + 1))
   else
      echo "ok    ($n LOC): $file"
   fi
done < <(find src test -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 2>/dev/null || true)

echo ""
echo "Scanned: $SCANNED file(s)"
if [ "$FAILED" -gt 0 ]; then
   echo "Failed:  $FAILED file(s) exceed $LIMIT pure LOC" >&2
   exit 1
fi
echo "All files within $LIMIT pure LOC limit."
