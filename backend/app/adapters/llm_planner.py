import asyncio
import random
from .base import LLMPlannerAdapter

EMOTION_MAP = {
    "frustrated": ["frustrat", "annoying", "broken", "doesn't work", "still", "again"],
    "angry": ["furious", "unacceptable", "demand", "lawsuit", "scam", "ridiculous"],
    "confused": ["confused", "don't understand", "why", "how come", "doesn't make sense"],
    "worried": ["worried", "afraid", "losing", "scared", "concerned", "urgent"],
    "urgent": ["asap", "emergency", "critical", "immediately", "production down"],
}

SEVERITY_SIGNALS = {
    "critical": ["production", "down", "all users", "data loss", "security", "breach"],
    "high": ["can't", "unable", "blocked", "multiple", "customers", "revenue"],
    "medium": ["intermittent", "sometimes", "slow", "incorrect", "wrong"],
    "low": ["minor", "cosmetic", "typo", "suggestion", "would be nice"],
}

PRODUCT_AREA_SIGNALS = {
    "billing": ["charge", "payment", "invoice", "subscription", "price", "billing", "refund"],
    "checkout": ["checkout", "cart", "purchase", "order", "promo", "coupon", "discount"],
    "authentication": ["login", "password", "reset", "email", "sign in", "2fa", "mfa", "auth"],
    "file-management": ["upload", "download", "file", "storage", "attachment", "document"],
    "ui-frontend": ["page", "crash", "display", "mobile", "responsive", "button", "screen"],
    "api": ["api", "endpoint", "request", "timeout", "500", "error", "response"],
}


def _detect(text: str, signal_map: dict) -> str:
    text_lower = text.lower()
    scores = {}
    for category, keywords in signal_map.items():
        scores[category] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else list(signal_map.keys())[0]


class MockLLMPlanner(LLMPlannerAdapter):
    """Mock LLM planner simulating Anthropic Claude analysis. Replace with real API calls."""

    async def analyze_complaint(self, complaint: str) -> dict:
        await asyncio.sleep(random.uniform(0.3, 0.8))

        emotional_state = _detect(complaint, EMOTION_MAP)
        severity = _detect(complaint, SEVERITY_SIGNALS)
        product_area = _detect(complaint, PRODUCT_AREA_SIGNALS)

        sentences = [s.strip() for s in complaint.replace("!", ".").replace("?", ".").split(".") if s.strip()]
        summary = sentences[0] if sentences else complaint[:120]
        if len(summary) > 120:
            summary = summary[:117] + "..."

        title_map = {
            "billing": "Billing issue reported",
            "checkout": "Checkout flow problem",
            "authentication": "Authentication/access issue",
            "file-management": "File management failure",
            "ui-frontend": "UI/display issue",
            "api": "API error encountered",
        }
        title = title_map.get(product_area, "Product issue reported")

        missing_info = []
        if "browser" not in complaint.lower() and "mobile" not in complaint.lower():
            missing_info.append("Browser/device information")
        if not any(word in complaint.lower() for word in ["step", "tried", "when", "after"]):
            missing_info.append("Steps to reproduce")

        return {
            "title": title,
            "normalized_summary": summary,
            "emotional_state": emotional_state,
            "severity": severity,
            "product_area": product_area,
            "missing_information": missing_info,
            "confidence": random.uniform(0.72, 0.95),
        }

    async def build_plan(self, issue_summary: dict) -> dict:
        await asyncio.sleep(random.uniform(0.2, 0.5))

        product_area = issue_summary.get("product_area", "unknown")
        severity = issue_summary.get("severity", "medium")

        steps = [
            "fetch_user_context",
            "search_known_incidents",
            "analyze_code_area",
            "create_engineering_artifact",
            "generate_spec_and_fix_plan",
            "produce_user_update",
            "verify_completion",
        ]

        return {
            "objective": f"Diagnose and create actionable engineering artifact for {product_area} issue",
            "assumptions": [
                "User account is active and in good standing",
                "The reported issue is reproducible",
                f"The {product_area} service is the primary area of concern",
            ],
            "missing_information": issue_summary.get("missing_information", []),
            "ordered_steps": steps,
            "fallback_strategy": "If code analysis confidence is below 60%, escalate to on-call engineer with all collected evidence",
            "escalation_condition": f"Confidence below 0.5 or severity is critical with no matching known incident",
            "verification_criteria": f"Engineering artifact created with confidence > 0.6 and user update delivered",
        }

    async def generate_user_update(self, issue_data: dict, reasoning: dict) -> str:
        await asyncio.sleep(random.uniform(0.2, 0.4))
        return await self.generate_empathetic_response(
            emotional_state=issue_data.get("emotional_state", "neutral"),
            issue_summary=issue_data.get("normalized_summary", "your reported issue"),
            status="investigating",
            next_steps=reasoning.get("next_steps", ["Our team is reviewing this"]),
        )

    async def generate_empathetic_response(
        self, emotional_state: str, issue_summary: str, status: str, next_steps: list[str]
    ) -> str:
        await asyncio.sleep(random.uniform(0.1, 0.3))

        empathy_openers = {
            "frustrated": "I completely understand how frustrating this must be",
            "angry": "I hear you, and I want you to know we're taking this very seriously",
            "confused": "I can see how this situation is confusing, and I want to help clarify",
            "worried": "I understand your concern, and I want to assure you we're on it",
            "urgent": "We recognize the urgency here and are prioritizing this right now",
            "neutral": "Thank you for bringing this to our attention",
        }

        opener = empathy_openers.get(emotional_state, empathy_openers["neutral"])

        status_phrases = {
            "investigating": "We've started investigating the root cause",
            "identified": "We've identified the likely cause",
            "fixing": "A fix is being prepared",
            "resolved": "This issue has been resolved",
        }
        status_msg = status_phrases.get(status, "We're looking into this")

        steps_text = ""
        if next_steps:
            steps_text = "\n\nHere's what happens next:\n" + "\n".join(f"• {s}" for s in next_steps)

        return (
            f"{opener}. {status_msg} related to {issue_summary}. "
            f"Our system has automatically analyzed the issue and created an engineering ticket "
            f"with the relevant technical details.{steps_text}\n\n"
            f"We'll keep you updated as we make progress. You don't need to re-explain — "
            f"we have the full context."
        )
