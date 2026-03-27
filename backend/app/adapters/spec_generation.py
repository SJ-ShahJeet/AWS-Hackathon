import asyncio
import random
from .base import SpecGenerationAdapter


class MockSpecGenerationAdapter(SpecGenerationAdapter):
    """Mock Kiro spec generation adapter. Replace with real Kiro integration."""

    async def generate_spec(self, artifact_data: dict) -> dict:
        await asyncio.sleep(random.uniform(0.3, 0.7))

        root_cause = artifact_data.get("probable_root_cause", "Unknown root cause")
        code_area = artifact_data.get("likely_code_area", "unknown")
        service = artifact_data.get("service", "unknown-service")

        return {
            "title": f"Fix: {root_cause[:80]}",
            "description": (
                f"## Problem\n{root_cause}\n\n"
                f"## Affected Service\n`{service}`\n\n"
                f"## Scope\nThis fix targets `{code_area}` and related integration points.\n\n"
                f"## Acceptance Criteria\n"
                f"- [ ] Root cause is verified through unit test\n"
                f"- [ ] Fix is applied and passes existing test suite\n"
                f"- [ ] No regression in related flows\n"
                f"- [ ] Monitoring confirms issue is resolved in staging\n"
            ),
            "priority": "P1" if artifact_data.get("severity", "medium") in ("critical", "high") else "P2",
            "labels": ["auto-generated", "rootcause-relay", service],
            "estimated_effort": "2-4 hours",
        }

    async def generate_fix_plan(self, artifact_data: dict) -> dict:
        await asyncio.sleep(random.uniform(0.3, 0.6))

        code_area = artifact_data.get("likely_code_area", "")
        recent_change = artifact_data.get("suspected_recent_change", "")
        failure_mode = artifact_data.get("probable_root_cause", "")

        return {
            "fix_outline": (
                f"1. Add a regression test that reproduces the exact failure condition\n"
                f"2. Review the recent change: {recent_change}\n"
                f"3. Apply fix in {code_area}:\n"
                f"   - Guard against the edge case that triggers: {failure_mode[:100]}\n"
                f"   - Add defensive checks and proper error propagation\n"
                f"4. Verify fix passes the new regression test\n"
                f"5. Run full integration test suite for the affected service\n"
                f"6. Deploy to staging and monitor for 30 minutes\n"
                f"7. If stable, proceed with production deployment"
            ),
            "tasks": [
                f"Write regression test for {failure_mode[:60]}",
                f"Fix root cause in {code_area}",
                "Update error handling and add defensive guards",
                "Run integration tests",
                "Deploy to staging and verify",
                "Update monitoring/alerting if needed",
            ],
            "risks": [
                "Fix may need adjustment if the root cause hypothesis is partially incorrect",
                "Related flows should be regression-tested",
            ],
            "rollback_plan": "Revert the specific commit and fall back to previous behavior",
        }
