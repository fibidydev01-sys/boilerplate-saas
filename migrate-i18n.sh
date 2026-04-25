#!/usr/bin/env bash
# migrate-i18n.sh
#
# Wrapper around migrate-i18n.mjs. Lets you run:
#   bash migrate-i18n.sh           # dry-run preview
#   bash migrate-i18n.sh --apply   # write changes
#
# Equivalent to running `node migrate-i18n.mjs` directly.

set -e

# Resolve the directory of THIS script so the wrapper works regardless of
# where you invoke it from (as long as it's in your project root).
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: 'node' not found in PATH." >&2
  echo "This script needs Node.js (you have it — Next.js project)." >&2
  exit 1
fi

NODE_VERSION=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Error: Node.js 18+ required (found v$NODE_VERSION)." >&2
  exit 1
fi

exec node "$DIR/migrate-i18n.mjs" "$@"
