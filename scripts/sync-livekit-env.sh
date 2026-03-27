#!/usr/bin/env bash
# Syncs the root .env file to LiveKit Cloud agent environment variables.
# Uses the lk CLI: https://docs.livekit.io/home/cli/cli-setup
#
# Usage: ./scripts/sync-livekit-env.sh

set -euo pipefail

# User-local installs (jq, lk) without sudo
export PATH="$HOME/.local/bin:$PATH"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "error: .env not found at $ENV_FILE" >&2
  exit 1
fi

# Install lk CLI if not present
if ! command -v lk &>/dev/null; then
  echo "lk CLI not found — installing..."
  curl -sSL https://get.livekit.io/cli | bash
  # Reload PATH in case the installer wrote to /usr/local/bin
  export PATH="$PATH:/usr/local/bin:$HOME/.local/bin"
fi

if ! command -v lk &>/dev/null; then
  echo "error: lk CLI install failed. Install manually: https://docs.livekit.io/home/cli/cli-setup" >&2
  exit 1
fi

# Authenticate if needed (opens browser on first run)
if ! lk cloud auth status &>/dev/null; then
  echo "Authenticating with LiveKit Cloud (browser will open)..."
  lk cloud auth
fi

echo "Syncing .env → LiveKit Cloud..."
lk app env -w -d "$ENV_FILE"
echo "Done. Agent will pick up new env vars on next deployment."
