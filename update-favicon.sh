#!/bin/bash

PUBLIC="d:/BOILERPLATE/boilerplate-commerce-marketing/public"
BRAND="$PUBLIC/branding"
FAV="$PUBLIC/favicomatic"

echo "=== PREVIEW: Yang akan terjadi ==="
echo ""
echo "[REMOVE] branding.bak (kalau ada)"
echo "[COPY]   favicomatic/* -> branding/ (rename sesuai convention)"
echo "[DELETE] favicomatic/ folder"
echo "[DELETE] favicon/ folder"
echo ""
echo "Mapping:"
echo "  apple-touch-icon-152x152.png -> apple-touch-icon.png"
echo "  favicon.ico                  -> favicon.ico"
echo "  favicon-196x196.png          -> icon-192.png"
echo "  favicon-128.png              -> icon-144.png"
echo "  favicon-96x96.png            -> icon-96.png"
echo "  favicon-32x32.png            -> icon-48.png"
echo "  apple-touch-icon-72x72.png   -> icon-72.png"
echo "  mstile-144x144.png           -> icon-512.png"
echo ""
read -p "Lanjut? (y/N): " confirm
[[ "$confirm" != "y" && "$confirm" != "Y" ]] && echo "Dibatalin." && exit 0

echo ""
echo "=== EXECUTING ==="

# Cleanup backup lama
rm -rf "$BRAND.bak"
echo "[CLEAN] branding.bak removed"

# Replace files di branding
rm -f "$BRAND/apple-touch-icon.png" "$BRAND/favicon.ico" "$BRAND/favicon.svg" \
      "$BRAND/icon-144.png" "$BRAND/icon-192.png" "$BRAND/icon-48.png" \
      "$BRAND/icon-512.png" "$BRAND/icon-72.png" "$BRAND/icon-96.png"

cp "$FAV/apple-touch-icon-152x152.png"  "$BRAND/apple-touch-icon.png"
cp "$FAV/favicon.ico"                   "$BRAND/favicon.ico"
cp "$FAV/favicon-196x196.png"           "$BRAND/icon-192.png"
cp "$FAV/favicon-128.png"               "$BRAND/icon-144.png"
cp "$FAV/favicon-96x96.png"             "$BRAND/icon-96.png"
cp "$FAV/favicon-32x32.png"             "$BRAND/icon-48.png"
cp "$FAV/apple-touch-icon-72x72.png"    "$BRAND/icon-72.png"
cp "$FAV/mstile-144x144.png"            "$BRAND/icon-512.png"
echo "[OK] Files copied & renamed to branding/"

# Cleanup folder sampah
rm -rf "$PUBLIC/favicomatic"
echo "[CLEAN] favicomatic/ deleted"

rm -rf "$PUBLIC/favicon"
echo "[CLEAN] favicon/ deleted"

echo ""
echo "=== RESULT ==="
ls "$BRAND"
echo ""
echo "Done! Semua bersih bro."