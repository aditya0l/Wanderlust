#!/usr/bin/env bash
# Rebuilds everything generated from the content: self-hosted photos, journey pages, sitemap, robots, vercel.json,
# llms.txt and the Markdown pages. Run by the GitHub sync after the admin publishes, or by hand: bash tools/build-all.sh
set -euo pipefail
cd "$(dirname "$0")/.."
node tools/build-photos.js
work="tools/.build"                      # scratch space, never published (tools/ is ignored by Vercel)
rm -rf "$work"
node tools/build-seo.js "$work/markdown-source"
python3 tools/markdown/manage_markdown_site.py build --inventory "$work/markdown-source/inventory.json" --output "$work/public-md"
python3 tools/markdown/manage_markdown_site.py validate --manifest "$work/public-md-manifest.json" --root "$work/public-md"
cp -R "$work/public-md/." .
