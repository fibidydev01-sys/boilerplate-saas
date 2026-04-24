#!/bin/bash
# ================================================================
# collect-client.sh — Boilerplate Client-Server File Collector
# Run from : client root (where src/ lives)
# Output   : collections/COLLECT-<timestamp>.txt
# Skipped  : src/components/ui/  |  public/  |  *.sql  |  .gitkeep
# ----------------------------------------------------------------
# v2 CHANGES:
#   + MARKETING bundle (isolated)        : app/(marketing)/ + modules/landing/
#   + AUTH+COMMERCE bundle (merged)      : core/auth/* + modules/commerce/
#   = Total layers reduced from 23 → 18
# ================================================================

SRC="./src"
OUT="collections"
mkdir -p "$OUT"

# ── Colors ────────────────────────────────────────────────────────
BOLD='\033[1m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
MAGENTA='\033[0;35m'
BLUE='\033[0;34m'
RED='\033[0;31m'
DIM='\033[2m'
RESET='\033[0m'

# ── Menu ──────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║         FILE COLLECTOR — CLIENT-SERVER  (v2)         ║${RESET}"
echo -e "${BOLD}╠══════════════════════════════════════════════════════╣${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── src/ root ─────────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 1.${RESET}  src/ root ${DIM}(proxy.ts)${RESET}                          ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── app/ ──────────────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 2.${RESET}  app/ root ${DIM}(layout · manifest · globals.css)${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 3.${RESET}  app/(auth)/                                   ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 4.${RESET}  app/(dashboard)/                              ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}admin · customers · dashboard · orders       ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}overview · products · profile · settings     ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}subscriptions · settings/webhooks            ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 5.${RESET}  app/api/                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}auth/callback · confirm · hooks/send-email   ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}commerce/checkout · credentials · customers  ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}commerce/orders · products · subscriptions   ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}commerce/webhooks                            ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── config/ ───────────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 6.${RESET}  config/                                       ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── core/ ─────────────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 7.${RESET}  core/ root ${DIM}(index.ts)${RESET}                       ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 8.${RESET}  core/components/                              ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN} 9.${RESET}  core/constants/                               ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}10.${RESET}  core/i18n/ ${DIM}(ts + json locales)${RESET}             ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}11.${RESET}  core/layout/                                  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}12.${RESET}  core/lib/ ${DIM}(supabase/ · encryption · request)${RESET}${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}utils · validators · service-role            ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}13.${RESET}  core/types/                                   ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── BUNDLES ───────────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${MAGENTA}14.${RESET}  ${MAGENTA}AUTH + COMMERCE BUNDLE${RESET}                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}core/auth/ (root · components · hooks       ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}           lib · services · store)          ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}modules/commerce/ (components · lib         ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}                  services · types)         ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${BLUE}15.${RESET}  ${BLUE}MARKETING BUNDLE (isolated)${RESET}                 ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}app/(marketing)/ (home · pricing · showcase ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}                  legal/*)                  ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}modules/landing/ (components · content      ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}                  lib · types · config)     ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── other modules ─────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}16.${RESET}  modules/ ${DIM}(non-marketing, non-commerce)${RESET}       ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}admin · blog · chat · forum · project · saas${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${DIM}── shared/ ───────────────────────────────────────${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${CYAN}17.${RESET}  shared/                                       ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}email · file-upload · notifications          ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}       ${DIM}payment · search                             ${RESET}  ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}                                                      ${BOLD}║${RESET}"
echo -e "${BOLD}║${RESET}  ${GREEN}18.${RESET}  ${GREEN}ALL LAYERS${RESET}                                  ${BOLD}║${RESET}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "${YELLOW}Pilih layer (contoh: 5 atau 4 5 14 atau 18):${RESET} "
read -r INPUT

# ── Init output file ──────────────────────────────────────────────
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
FILE="$OUT/COLLECT-${TIMESTAMP}.txt"
FOUND=0
MISSING=0
TOTAL=0

{
  echo "################################################################"
  echo "##  BOILERPLATE CLIENT-SERVER — SOURCE COLLECTION (v2)"
  echo "##  Generated : $(date '+%Y-%m-%d %H:%M:%S')"
  echo "##  Selection : $INPUT"
  echo "##  Skipped   : src/components/ui/  |  public/  |  *.sql  |  .gitkeep"
  echo "################################################################"
  echo ""
} > "$FILE"

# ── Helpers ───────────────────────────────────────────────────────

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

# Sub-section header (for bundles)
subsec() {
  local label="$1"
  echo -e "  ${DIM}└── $label${RESET}"
  {
    echo ""
    echo "# ─────────────────────────────────────────────────────"
    echo "#   $label"
    echo "# ─────────────────────────────────────────────────────"
    echo ""
  } >> "$FILE"
}

# Collect a single file (explicit path)
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

# collect_dir <label> <dir> [mode]
#
# Modes:
#   ts_tsx    — all .ts/.tsx recursively           (default)
#   root_only — only .ts/.tsx at top level of dir
#   css       — only .css at top level of dir
#   json      — all .json recursively
#   ts_md     — all .ts/.tsx + .md recursively
#
# Always skips: src/components/ui/  |  *.sql  |  .gitkeep
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
      find_cmd=(find "$dir" -type f -name "*.json"
        -not -name ".gitkeep")
      ;;
    root_only)
      find_cmd=(find "$dir" -maxdepth 1 -type f
        \( -name "*.ts" -o -name "*.tsx" \)
        -not -name ".gitkeep")
      ;;
    ts_md)
      find_cmd=(find "$dir" -type f
        \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \)
        -not -path "*/components/ui/*"
        -not -name ".gitkeep"
        -not -name "*.sql")
      ;;
    *)  # ts_tsx
      find_cmd=(find "$dir" -type f
        \( -name "*.ts" -o -name "*.tsx" \)
        -not -path "*/components/ui/*"
        -not -name ".gitkeep"
        -not -name "*.sql")
      ;;
  esac

  while IFS= read -r -d '' f; do
    cf "$f"
  done < <("${find_cmd[@]}" -print0 | sort -z)
}

# collect_sub <label> <dir> [mode]
# Same as collect_dir but uses subsec() for bundle sub-groupings.
collect_sub() {
  local label="$1"
  local dir="$2"
  local mode="${3:-ts_tsx}"

  subsec "$label"

  if [ ! -d "$dir" ]; then
    echo -e "    ${RED}⚠ DIR NOT FOUND: $dir${RESET}"
    return
  fi

  local find_cmd=()
  case "$mode" in
    root_only)
      find_cmd=(find "$dir" -maxdepth 1 -type f
        \( -name "*.ts" -o -name "*.tsx" \)
        -not -name ".gitkeep")
      ;;
    ts_md)
      find_cmd=(find "$dir" -type f
        \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \)
        -not -path "*/components/ui/*"
        -not -name ".gitkeep"
        -not -name "*.sql")
      ;;
    *)
      find_cmd=(find "$dir" -type f
        \( -name "*.ts" -o -name "*.tsx" \)
        -not -path "*/components/ui/*"
        -not -name ".gitkeep"
        -not -name "*.sql")
      ;;
  esac

  while IFS= read -r -d '' f; do
    cf "$f"
  done < <("${find_cmd[@]}" -print0 | sort -z)
}

# ── Layer definitions ─────────────────────────────────────────────
run_layer() {
  case "$1" in

    # ── src/ root ──────────────────────────────────────────────
    1)
      sec "src/ root (proxy.ts)"
      cf "$SRC/proxy.ts"
      ;;

    # ── app/ ───────────────────────────────────────────────────
    2)
      sec "app/ root (layout · manifest · globals.css)"
      while IFS= read -r -d '' f; do cf "$f"
      done < <(find "$SRC/app" -maxdepth 1 -type f \( -name "*.ts" -o -name "*.tsx" \) -print0 | sort -z)
      while IFS= read -r -d '' f; do cf "$f"
      done < <(find "$SRC/app" -maxdepth 1 -type f -name "*.css" -print0 | sort -z)
      cf "$SRC/app/manifest.json"
      ;;
    3)  collect_dir "app/(auth)/"       "$SRC/app/(auth)"       ;;
    4)  collect_dir "app/(dashboard)/"  "$SRC/app/(dashboard)"  ;;
    5)  collect_dir "app/api/"          "$SRC/app/api"          ;;

    # ── config/ ────────────────────────────────────────────────
    6)  collect_dir "config/"           "$SRC/config"           ;;

    # ── core/ ──────────────────────────────────────────────────
    7)  collect_dir "core/ root (index.ts)" "$SRC/core" "root_only" ;;
    8)  collect_dir "core/components/"  "$SRC/core/components"  ;;
    9)  collect_dir "core/constants/"   "$SRC/core/constants"   ;;
    10)
        collect_dir "core/i18n/ (ts root)"      "$SRC/core/i18n"         "root_only"
        collect_dir "core/i18n/locales/ (json)" "$SRC/core/i18n/locales" "json"
        ;;
    11) collect_dir "core/layout/"  "$SRC/core/layout"  ;;
    12) collect_dir "core/lib/"     "$SRC/core/lib"     ;;
    13) collect_dir "core/types/"   "$SRC/core/types"   ;;

    # ── BUNDLES ────────────────────────────────────────────────
    # Layer 14: AUTH + COMMERCE bundle
    14)
      sec "AUTH + COMMERCE BUNDLE"
      collect_sub "core/auth/ root (index.ts · provider.tsx)" "$SRC/core/auth"             "root_only"
      collect_sub "core/auth/components/"                     "$SRC/core/auth/components"
      collect_sub "core/auth/hooks/"                          "$SRC/core/auth/hooks"
      collect_sub "core/auth/lib/"                            "$SRC/core/auth/lib"
      collect_sub "core/auth/services/"                       "$SRC/core/auth/services"
      collect_sub "core/auth/store/"                          "$SRC/core/auth/store"
      collect_sub "modules/commerce/ (all)"                   "$SRC/modules/commerce"      "ts_md"
      ;;

    # Layer 15: MARKETING bundle (ISOLATED)
    # Intentionally covers BOTH app-level marketing routes AND the
    # modules/landing/ module in a single collect call.
    15)
      sec "MARKETING BUNDLE (isolated)"
      collect_sub "app/(marketing)/ (routes + layouts)" "$SRC/app/(marketing)" "ts_tsx"
      collect_sub "modules/landing/ (components + content + lib + types)" "$SRC/modules/landing" "ts_md"
      ;;

    # ── Other modules (excluding marketing + commerce) ─────────
    16)
      sec "modules/ (non-marketing, non-commerce)"
      for mod in admin blog chat forum project saas; do
        collect_sub "modules/$mod/" "$SRC/modules/$mod" "ts_md"
      done
      ;;

    # ── shared/ ────────────────────────────────────────────────
    17) collect_dir "shared/" "$SRC/shared" "ts_md" ;;

    *)  echo -e "  ${RED}⚠ Pilihan tidak valid: $1${RESET}" ;;
  esac
}

# ── Execute ───────────────────────────────────────────────────────
if echo "$INPUT" | grep -qw "18"; then
  for i in $(seq 1 17); do
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