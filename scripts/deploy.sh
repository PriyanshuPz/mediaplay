#!/usr/bin/env bash
set -e

echo "→ Updating panel"
git pull --ff-only

echo "→ Installing dependencies"
pnpm install

echo "→ Building frontend"
pnpm run build

echo "→ Restarting panel"
sudo systemctl restart panel

echo "✓ Panel deployed"
