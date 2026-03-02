#!/bin/bash
# Deploy-Script: Baut die App und kopiert Build-Output für GitHub Pages
# Usage: cd Unterrichtsplaner && ./deploy.sh
set -e
cd "$(dirname "$0")"

# 1. Restore dev index.html for Vite build
cp src/index.dev.html index.html

# 2. Build
echo "🔨 Building..."
npm run build

# 3. Copy build output to repo root (GitHub Pages serves from here)
echo "📦 Deploying build output..."
rm -rf assets/ sw.js registerSW.js manifest.webmanifest workbox-*.js 2>/dev/null

cp dist/index.html index.html
cp -r dist/assets/ assets/
cp dist/sw.js sw.js
cp dist/registerSW.js registerSW.js
cp dist/manifest.webmanifest manifest.webmanifest
cp dist/workbox-*.js .

echo "✅ Deploy ready!"
echo "   git add -A && git commit -m 'deploy v3.XX' && git push"
