#!/bin/bash
# ================================================================
# collect-client.sh — Boilerplate Client-Server File Collector
# Run from: client root (where src/ lives)
# Output  : collections/COLLECT-<timestamp>.txt
# Skip    : src/components/ui/
# ================================================================

SRC="./src"
PUB="./public"
OUT="collections"
mkdir -p "$OUT"

# ── Colors ───────────────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

# ── Menu ─────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║    FILE COLLECTOR — CLIENT-SERVER        ║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║  1.${RESET}  ${CYAN}app/${RESET}                             ${BOLD}║${RESET}"
echo -e "${BOLD}║  2.${RESET}  ${CYAN}config/${RESET}                          ${BOLD}║${RESET}"
echo -e "${BOLD}║  3.${RESET}  ${CYAN}core/auth/components/${RESET}            ${BOLD}║${RESET}"
echo -e "${BOLD}║  4.${RESET}  ${CYAN}core/auth/hooks/${RESET}                 ${BOLD}║${RESET}"
echo -e "${BOLD}║  5.${RESET}  ${CYAN}core/auth/lib/${RESET}                   ${BOLD}║${RESET}"
echo -e "${BOLD}║  6.${RESET}  ${CYAN}core/auth/services/${RESET}              ${BOLD}║${RESET}"
echo -e "${BOLD}║  7.${RESET}  ${CYAN}core/auth/store/${RESET}                 ${BOLD}║${RESET}"
echo -e "${BOLD}║  8.${RESET}  ${CYAN}core/auth/${RESET} ${YELLOW}(root)${RESET}               ${BOLD}║${RESET}"
echo -e "${BOLD}║  9.${RESET}  ${CYAN}core/components/${RESET}                 ${BOLD}║${RESET}"
echo -e "${BOLD}║  10.${RESET} ${CYAN}core/constants/${RESET}                  ${BOLD}║${RESET}"
echo -e "${BOLD}║  11.${RESET} ${CYAN}core/i18n/${RESET} ${YELLOW}(ts + json)${RESET}         ${BOLD}║${RESET}"
echo -e "${BOLD}║  12.${RESET} ${CYAN}core/layout/${RESET}                     ${BOLD}║${RESET}"
echo -e "${BOLD}║  13.${RESET} ${CYAN}core/lib/${RESET}                        ${BOLD}║${RESET}"
echo -e "${BOLD}║  14.${RESET} ${CYAN}core/types/${RESET}                      ${BOLD}║${RESET}"
echo -e "${BOLD}║  15.${RESET} ${CYAN}core/ root${RESET} ${YELLOW}(index.ts)${RESET}          ${BOLD}║${RESET}"
echo -e "${BOLD}║  16.${RESET} ${CYAN}modules/${RESET}                         ${BOLD}║${RESET}"
echo -e "${BOLD}║  17.${RESET} ${CYAN}shared/${RESET}                          ${BOLD}║${RESET}"
echo -e "${BOLD}║  18.${RESET} ${CYAN}src/ root${RESET} ${YELLOW}(proxy.ts + globals)${RESET} ${BOLD}║${RESET}"
echo -e "${BOLD}║  19.${RESET} ${CYAN}public/${RESET} ${YELLOW}(struktur + text files)${RESET} ${BOLD}║${RESET}"
echo -e "${BOLD}║  20.${RESET} ${GREEN}ALL LAYERS${RESET}                       ${BOLD}║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${YELLOW}Pilih layer (contoh: 1 atau 1 3 4 atau 20):${RESET} "
read -r INPUT

# ── Init output file ─────────────────────────────────────────────
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
FILE="$OUT/COLLECT-${TIMESTAMP}.txt"
FOUND=0
MISSING=0
TOTAL=0
SKIPPED=0

{
  echo "################################################################"
  echo "##  BOILERPLATE CLIENT-SERVER — SOURCE COLLECTION"
  echo "##  Generated : $(date '+%Y-%m-%d %H:%M:%S')"
  echo "##  Selection : $INPUT"
  echo "##  Skipped   : src/components/ui/"
  echo "################################################################"
  echo ""
} > "$FILE"

# ── Helpers ──────────────────────────────────────────────────────

# Print a section header to terminal + file
sec() {
  local label="$1"
  echo -e "\n${BOLD}▶ $label${RESET}"
  {
    echo ""
    echo "################################################################"
    echo "##  $label"
    echo "################################################################"
    echo ""
  } >> "$FILE"
}

# Collect a single file into the output
cf() {
  local f="$1"
  TOTAL=$((TOTAL + 1))
  {
    echo ""
    echo "================================================"
    echo "FILE: ${f#./}"
  } >> "$FILE"
  if [ -f "$f" ]; then
    local lines
    lines=$(wc -l < "$f" 2>/dev/null || echo "0")
    echo -e "  ${GREEN}✓${RESET} ${f#./} (${lines} lines)"
    FOUND=$((FOUND + 1))
    {
      echo "Lines: $lines"
      echo "================================================"
      echo ""
      cat "$f"
      printf "\n\n"
    } >> "$FILE"
  else
    echo -e "  ${RED}✗${RESET} MISSING: ${f#./}"
    MISSING=$((MISSING + 1))
    {
      echo "STATUS: *** FILE NOT FOUND ***"
      echo "================================================"
      echo ""
    } >> "$FILE"
  fi
}

# ── Core collector ────────────────────────────────────────────────
# Usage: collect_dir "Label" "/path/to/dir" [mode]
# Modes:
#   ts_tsx     — all .ts/.tsx recursively (default)
#   root_only  — only .ts/.tsx at top level of dir
#   css        — only .css at top level of dir
#   json       — all .json recursively
#
# ALWAYS skips src/components/ui/
collect_dir() {
  local label="$1"
  local dir="$2"
  local mode="${3:-ts_tsx}"

  sec "$label"

  if [ ! -d "$dir" ]; then
    echo -e "  ${RED}⚠ DIR NOT FOUND: $dir${RESET}"
    return
  fi

  local find_cmd=()

  case "$mode" in
    css)
      find_cmd=(find "$dir" -maxdepth 1 -type f -name "*.css")
      ;;
    json)
      find_cmd=(find "$dir" -type f -name "*.json")
      ;;
    root_only)
      find_cmd=(find "$dir" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \))
      ;;
    *)
      # ts_tsx — recursive, skip components/ui
      find_cmd=(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \)
        -not -path "*/components/ui/*")
      ;;
  esac

  # Collect files, sorted
  while IFS= read -r -d '' f; do
    cf "$f"
  done < <("${find_cmd[@]}" -print0 | sort -z)
}

# ── Public folder collector ───────────────────────────────────────
collect_public() {
  sec "public/ (text files collected, binary listed only)"

  if [ ! -d "$PUB" ]; then
    echo -e "  ${RED}⚠ DIR NOT FOUND: $PUB${RESET}"
    return
  fi

  # Text-based extensions → collect full content
  while IFS= read -r -d '' f; do
    cf "$f"
  done < <(find "$PUB" -type f \(
      -name "*.xml"         \
   -o -name "*.json"        \
   -o -name "*.html"        \
   -o -name "*.js"          \
   -o -name "*.css"         \
   -o -name "*.txt"         \
   -o -name "*.webmanifest" \
  \) -print0 | sort -z)

  # Binary extensions → list path only
  local bin_files=()
  while IFS= read -r -d '' f; do
    bin_files+=("${f#./}")
  done < <(find "$PUB" -type f \(
      -name "*.svg"  \
   -o -name "*.png"  \
   -o -name "*.jpg"  \
   -o -name "*.jpeg" \
   -o -name "*.ico"  \
   -o -name "*.gif"  \
   -o -name "*.webp" \
   -o -name "*.mp3"  \
   -o -name "*.mp4"  \
   -o -name "*.woff" \
   -o -name "*.woff2"\
   -o -name "*.ttf"  \
  \) -print0 | sort -z)

  if [ ${#bin_files[@]} -gt 0 ]; then
    echo -e "  ${YELLOW}Binary files (listed only):${RESET}"
    {
      echo ""
      echo "================================================"
      echo "BINARY FILES (not collected — path only)"
      echo "================================================"
    } >> "$FILE"
    for bf in "${bin_files[@]}"; do
      echo -e "  ${CYAN}~${RESET} $bf"
      echo "  ~ $bf" >> "$FILE"
    done
    echo "" >> "$FILE"
  fi
}

# ── Layer runner ──────────────────────────────────────────────────
run_layer() {
  case "$1" in
    1)  collect_dir "app/"                         "$SRC/app"               ;;
    2)  collect_dir "config/"                      "$SRC/config"            ;;
    3)  collect_dir "core/auth/components/"        "$SRC/core/auth/components" ;;
    4)  collect_dir "core/auth/hooks/"             "$SRC/core/auth/hooks"   ;;
    5)  collect_dir "core/auth/lib/"               "$SRC/core/auth/lib"     ;;
    6)  collect_dir "core/auth/services/"          "$SRC/core/auth/services" ;;
    7)  collect_dir "core/auth/store/"             "$SRC/core/auth/store"   ;;
    8)  collect_dir "core/auth/ (root)"            "$SRC/core/auth"         "root_only" ;;
    9)  collect_dir "core/components/"             "$SRC/core/components"   ;;
    10) collect_dir "core/constants/"              "$SRC/core/constants"    ;;
    11)
        collect_dir "core/i18n/ (ts)"             "$SRC/core/i18n"         "root_only"
        collect_dir "core/i18n/locales/ (json)"   "$SRC/core/i18n/locales" "json"
        ;;
    12) collect_dir "core/layout/"                 "$SRC/core/layout"       ;;
    13) collect_dir "core/lib/"                    "$SRC/core/lib"          ;;
    14) collect_dir "core/types/"                  "$SRC/core/types"        ;;
    15) collect_dir "core/ root (index.ts)"        "$SRC/core"              "root_only" ;;
    16) collect_dir "modules/"                     "$SRC/modules"           ;;
    17) collect_dir "shared/"                      "$SRC/shared"            ;;
    18)
        sec "src/ root (proxy.ts + globals.css)"
        while IFS= read -r -d '' f; do cf "$f"
        done < <(find "$SRC" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | sort -z)
        collect_dir "app/ globals.css"            "$SRC/app"               "css"
        ;;
    19) collect_public ;;
    *)  echo -e "  ${RED}⚠ Pilihan tidak valid: $1${RESET}" ;;
  esac
}

# ── Execute ───────────────────────────────────────────────────────
if echo "$INPUT" | grep -qw "20"; then
  for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19; do
    run_layer "$i"
  done
else
  for i in $INPUT; do
    run_layer "$i"
  done
fi

# ── Summary ───────────────────────────────────────────────────────
pct=0
[ "$TOTAL" -gt 0 ] && pct=$(( FOUND * 100 / TOTAL ))

echo ""
echo -e "${BOLD}════════════════════════════════════${RESET}"
echo -e "  ${GREEN}✓ Found   : $FOUND / $TOTAL${RESET}"
echo -e "  ${RED}✗ Missing : $MISSING${RESET}"
echo -e "  Coverage  : $pct%"
echo -e "${BOLD}════════════════════════════════════${RESET}"
echo -e "  Output: ${CYAN}$FILE${RESET}"
echo ""

{
  echo ""
  echo "################################################################"
  echo "##  SUMMARY"
  echo "################################################################"
  echo "Found   : $FOUND / $TOTAL"
  echo "Missing : $MISSING"
  echo "Coverage: $pct%"
} >> "$FILE"