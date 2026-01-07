#!/usr/bin/env bash
set -e

echo "→ Updating panel"
git pull --ff-only

echo "→ Installing dependencies"
bun install

echo "→ Building frontend"
bun run build

echo "→ Restarting panel"
sudo systemctl restart panel

echo "✓ Panel deployed"
