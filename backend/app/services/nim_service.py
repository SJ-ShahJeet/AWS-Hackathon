from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.schemas.models import CustomerProfile, KnowledgeArticle, RecommendationOption, RecommendationSet


class NimService:
    def __init__(self):
        self.settings = get_settings()

    async def answer_question(
        self,
        question: str,
        profile: CustomerProfile | None,
        recommendation: RecommendationSet | None,
        options: list[RecommendationOption],
        articles: list[KnowledgeArticle],
    ) -> dict[str, Any]:
        if not question.strip():
            return {
                "answer": "I can help with balances, Penny's recommendations, and parent approval steps. What would you like to know?",
                "confidence": 0.45,
                "sources": [],
            }

        heuristic = self._heuristic_answer(question, profile, recommendation, options, articles)
        if not self.settings.nim_api_key:
            return heuristic

        try:
            response = await self._call_nim(question, profile, recommendation, options, articles)
            if response.get("answer"):
                return response
        except Exception:
            pass
        return heuristic

    def _heuristic_answer(
        self,
        question: str,
        profile: CustomerProfile | None,
        recommendation: RecommendationSet | None,
        options: list[RecommendationOption],
        articles: list[KnowledgeArticle],
    ) -> dict[str, Any]:
        text = question.lower()
        sources: list[str] = []

        if any(term in text for term in ["balance", "coins", "$50", "fifty", "threshold"]):
            balance = f"${(profile.balance_cents / 100):.2f}" if profile else "your current balance"
            answer = (
                f"Your Penny balance is {balance}. Once a child reaches at least $50, Penny can explain the starter plan and ask a parent for approval before anything goes forward."
            )
            sources.append("How Penny uses the $50 threshold")
            return {"answer": answer, "confidence": 0.86, "sources": sources}

        if any(term in text for term in ["why", "recommend", "portfolio", "option", "invest"]):
            names = ", ".join(option.symbol for option in options[:3]) if options else "a diversified starter mix"
            answer = (
                f"Penny picked {names} to keep things simple and diversified. The idea is to mix broad market growth with one steadier option so the first investment lesson feels understandable."
            )
            sources.append("Why Penny suggests diversified starter options")
            return {"answer": answer, "confidence": 0.82, "sources": sources}

        if any(term in text for term in ["parent", "approve", "approval", "safe"]):
            status = recommendation.status.value.replace("_", " ") if recommendation else "ready"
            answer = (
                f"Parents stay in control. Right now the recommendation is {status}, and nothing is finalized until the parent approves by phone or from the dashboard."
            )
            sources.append("Parent safety controls")
            return {"answer": answer, "confidence": 0.84, "sources": sources}

        answer = "I can answer balance questions, explain Penny's three recommendations, or walk through how parent approval works."
        sources.extend(article.title for article in articles[:2])
        return {"answer": answer, "confidence": 0.5, "sources": sources}

    async def _call_nim(
        self,
        question: str,
        profile: CustomerProfile | None,
        recommendation: RecommendationSet | None,
        options: list[RecommendationOption],
        articles: list[KnowledgeArticle],
    ) -> dict[str, Any]:
        system_prompt = (
            "You are Penny customer care on a live phone call. "
            "Answer in 2 to 4 short spoken sentences. "
            "Use only the provided child balance, recommendation, and knowledge notes. "
            "If the facts do not support a precise answer, say you need a parent or ops follow-up."
        )
        context = {
            "profile": profile.model_dump() if profile else None,
            "recommendation": recommendation.model_dump() if recommendation else None,
            "options": [option.model_dump() for option in options],
            "knowledge": [article.model_dump() for article in articles],
            "question": question,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.settings.nim_base_url.rstrip('/')}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.settings.nim_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.settings.nim_model,
                    "temperature": 0.2,
                    "max_tokens": 220,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": str(context)},
                    ],
                },
            )
            response.raise_for_status()
            payload = response.json()

        answer = payload["choices"][0]["message"]["content"].strip()
        return {
            "answer": answer,
            "confidence": 0.79,
            "sources": [article.title for article in articles[:3]],
        }
