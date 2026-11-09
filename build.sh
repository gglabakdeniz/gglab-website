#!/usr/bin/env bash
set -e

mkdir -p dist
cp -r index.html 404.html oyun.html uyelik ggj27 css js assets dist/
if [ -f og-image.png ]; then
  cp og-image.png dist/
fi
echo "Build complete. Files in dist:"
ls -la dist
