---
name: sync-livekit-env
description: >
  Sync the root .env file to LiveKit Cloud after any changes. Use whenever the
  user edits .env, adds a new env var, or asks to deploy/push environment
  variables to LiveKit Cloud. Triggers on: "sync env", "push to livekit",
  "update livekit env", "deploy env vars", or after any .env file edit.
---

# Sync .env to LiveKit Cloud

Whenever `.env` is modified, immediately run the sync script so the LiveKit
Cloud agent picks up the new values on its next deployment.

## MANDATORY: Run After Every .env Edit

After any change to `.env` — adding, updating, or removing a variable — run:

```bash
./scripts/sync-livekit-env.sh
```

This script:
1. Installs the `lk` CLI if not already present
2. Authenticates with LiveKit Cloud if needed (browser popup, first run only)
3. Pushes all variables from `.env` to the LiveKit Cloud agent environment

## When to Use This Skill

- User adds or changes any value in `.env`
- User asks to "sync", "push", or "deploy" env vars
- User asks why the agent isn't picking up a new config value
- After adding new integrations that require new env vars (e.g. Google credentials, API keys)

## Notes

- The `.env` file is **local only** by default — LiveKit Cloud has its own
  separate env store. They are not automatically kept in sync.
- The agent running on LiveKit Cloud will only see the synced vars after its
  next redeploy/restart.
- To verify what LiveKit Cloud currently has: `lk app env -d .env` (without `-w`)
- Never commit `.env` to git — it contains secrets.
