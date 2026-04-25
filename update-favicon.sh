#!/bin/bash

# ==================================================
# Favicon Replace Script
# Source: https://favicomatic.com/
# ==================================================

PUBLIC="d:/BOILERPLATE/boilerplate-commerce-marketing/public"
BRAND="$PUBLIC/branding"
FAV="$PUBLIC/favicomatic"

echo "=================================================="
echo "  Favicon Replace — powered by favicomatic.com"
echo "=================================================="
echo ""
echo "PREVIEW: What will happen"
echo "--------------------------------------------------"
echo "[REPLACE] Files in branding/ will be replaced"
echo "[DELETE]  favicomatic/ folder will be removed"
echo "[DELETE]  favicon/ folder will be removed"
echo "[KEEP]    logo.png and logo-sm.png untouched"
echo ""
echo "File mapping:"
echo "  apple-touch-icon-152x152.png  ->  apple-touch-icon.png"
echo "  favicon.ico                   ->  favicon.ico"
echo "  favicon-196x196.png           ->  icon-192.png"
echo "  favicon-128.png               ->  icon-144.png"
echo "  favicon-96x96.png             ->  icon-96.png"
echo "  favicon-32x32.png             ->  icon-48.png"
echo "  apple-touch-icon-72x72.png    ->  icon-72.png"
echo "  mstile-144x144.png            ->  icon-512.png"
echo ""
read -p "Continue? (y/N): " confirm
[[ "$confirm" != "y" && "$confirm" != "Y" ]] && echo "Cancelled." && exit 0

echo ""
echo "EXECUTING..."
echo "--------------------------------------------------"

# Remove old favicon files in branding
rm -f "$BRAND/apple-touch-icon.png" \
      "$BRAND/favicon.ico" \
      "$BRAND/favicon.svg" \
      "$BRAND/icon-144.png" \
      "$BRAND/icon-192.png" \
      "$BRAND/icon-48.png" \
      "$BRAND/icon-512.png" \
      "$BRAND/icon-72.png" \
      "$BRAND/icon-96.png"
echo "[OK] Old favicon files removed from branding/"

# Copy & rename from favicomatic -> branding
cp "$FAV/apple-touch-icon-152x152.png"  "$BRAND/apple-touch-icon.png"
cp "$FAV/favicon.ico"                   "$BRAND/favicon.ico"
cp "$FAV/favicon-196x196.png"           "$BRAND/icon-192.png"
cp "$FAV/favicon-128.png"               "$BRAND/icon-144.png"
cp "$FAV/favicon-96x96.png"             "$BRAND/icon-96.png"
cp "$FAV/favicon-32x32.png"             "$BRAND/icon-48.png"
cp "$FAV/apple-touch-icon-72x72.png"    "$BRAND/icon-72.png"
cp "$FAV/mstile-144x144.png"            "$BRAND/icon-512.png"
echo "[OK] New favicon files copied & renamed to branding/"

# Cleanup temp folders
rm -rf "$PUBLIC/favicomatic"
echo "[CLEAN] favicomatic/ deleted"

rm -rf "$PUBLIC/favicon"
echo "[CLEAN] favicon/ deleted"

echo ""
echo "RESULT — branding/ contents:"
echo "--------------------------------------------------"
ls "$BRAND"
echo ""
echo "All done! Favicon updated successfully."
echo "=================================================="