#!/bin/bash
# Migrate OrbStack data from internal Mac storage to external SSD
# Run with: bash scripts/migrate-orbstack-to-ssd.sh

set -e

GROUP_SRC="$HOME/Library/Group Containers/HUAQ24HBR6.dev.orbstack"
GROUP_DST="/Volumes/NidhalSSD/Docker/orbstack-data"

echo "=== OrbStack → SSD Migration ==="
echo "Source: $GROUP_SRC"
echo "Dest:   $GROUP_DST"
echo ""

# Check SSD is mounted
if [[ ! -d "/Volumes/NidhalSSD" ]]; then
  echo "ERROR: /Volumes/NidhalSSD not mounted. Plug in the SSD first."
  exit 1
fi

# Check OrbStack is NOT running
if [[ -S "$HOME/.orbstack/run/docker.sock" ]]; then
  echo "ERROR: OrbStack is still running. Quit it from the menu bar first."
  exit 1
fi

# If already a symlink, nothing to do
if [[ -L "$GROUP_SRC" ]]; then
  CURRENT_TARGET=$(readlink "$GROUP_SRC")
  echo "Already a symlink → $CURRENT_TARGET"
  if [[ "$CURRENT_TARGET" == "$GROUP_DST" ]]; then
    echo "Already pointing to the right place."
  else
    echo "WARNING: Points to a different location!"
  fi
  ls -la "$GROUP_DST/data/" 2>/dev/null
  exit 0
fi

# Step 1: Clean up any partial copy
echo "[1/4] Cleaning partial copy on SSD..."
rm -rf "$GROUP_DST"

# Step 2: Move the original (mv on macOS handles cross-filesystem by copy+delete)
echo "[2/4] Moving OrbStack group container to SSD..."
mv "$GROUP_SRC" "$GROUP_DST"
echo "      Move complete."

# Step 3: Fix permissions (macOS group containers need specific perms)
chmod 700 "$GROUP_DST"

# Step 4: Create symlink
echo "[3/4] Creating symlink..."
ln -s "$GROUP_DST" "$GROUP_SRC"
echo "      Symlink created."

# Verify
echo "[4/4] Verification:"
echo "  Symlink: $GROUP_SRC → $(readlink $GROUP_SRC)"
echo "  Contents of data/:"
ls -lah "$GROUP_DST/data/" 2>/dev/null || echo "  (data/ is empty — OrbStack will initialize it)"
echo ""
echo "✓ Migration done! OrbStack will now use /Volumes/NidhalSSD/Docker/orbstack-data"
echo ""
echo "Next steps:"
echo "  1. Open OrbStack from Applications"
echo "  2. Run: cd /Volumes/NidhalSSD/Projects/myb && docker compose up -d"
