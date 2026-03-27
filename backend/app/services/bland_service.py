from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.schemas.models import CallSession, CallStatus, CallType


class BlandService:
    def __init__(self):
        self.settings = get_settings()

    def build_support_payload(self, call: CallSession) -> dict[str, Any]:
        return {
            "phone_number": call.phone_number,
            "voice": self.settings.bland_support_voice_id or "maya",
            "task": (
                "You are Penny, a friendly customer-care guide for a financial literacy app for kids. "
                "The child is {{child_name}}. Their current Penny balance is {{balance_amount}}. "
                "Their current recommendation summary is: {{recommendation_summary}}. "
                "Use a warm, peer-like tone. If asked a question about balances, recommendations, safety, or approvals, "
                "use the AnswerQuestion tool before answering whenever you need grounded details."
            ),
            "model": self.settings.bland_model,
            "language": "en",
            "wait_for_greeting": False,
            "record": True,
            "answered_by_enabled": True,
            "noise_cancellation": False,
            "interruption_threshold": 500,
            "block_interruptions": False,
            "max_duration": 12,
            "background_track": "none",
            "metadata": {
                "call_session_id": call.id,
                "call_type": call.call_type.value,
                "household_id": call.household_id,
            },
            "request_data": {
                "call_session_id": call.id,
            },
            "webhook": f"{self.settings.app_public_url.rstrip('/')}/api/webhooks/bland/call",
            "webhook_events": ["queue", "call", "tool", "dynamic_data", "webhook"],
            "dynamic_data": [self._customer_context_dynamic_data(call)],
            "tools": [self._answer_question_tool(call)],
        }

    def build_approval_payload(self, call: CallSession) -> dict[str, Any]:
        return {
            "phone_number": call.phone_number,
            "voice": self.settings.bland_approval_voice_id or self.settings.bland_support_voice_id or "maya",
            "task": (
                "You are Penny calling a parent for approval. The parent is {{parent_name}}. "
                "{{child_name}} has reached the $50 learning threshold. The current plan summary is: {{recommendation_summary}}. "
                "Briefly explain the recommendation, answer grounded questions with tools, and once the parent clearly says yes or no, "
                "use the ApprovalDecision tool immediately."
            ),
            "model": self.settings.bland_model,
            "language": "en",
            "wait_for_greeting": False,
            "record": True,
            "answered_by_enabled": True,
            "noise_cancellation": False,
            "interruption_threshold": 500,
            "block_interruptions": False,
            "max_duration": 12,
            "background_track": "none",
            "metadata": {
                "call_session_id": call.id,
                "call_type": call.call_type.value,
                "household_id": call.household_id,
                "approval_request_id": call.approval_request_id,
            },
            "request_data": {
                "call_session_id": call.id,
            },
            "webhook": f"{self.settings.app_public_url.rstrip('/')}/api/webhooks/bland/call",
            "webhook_events": ["queue", "call", "tool", "dynamic_data", "webhook"],
            "dynamic_data": [self._customer_context_dynamic_data(call)],
            "tools": [self._answer_question_tool(call), self._approval_decision_tool(call)],
        }

    async def queue_call(self, call: CallSession) -> dict[str, Any]:
        if call.call_type == CallType.SUPPORT:
            payload = self.build_support_payload(call)
        else:
            payload = self.build_approval_payload(call)

        if not self.settings.bland_api_key:
            return {
                "status": "demo",
                "message": "Bland API key not configured, stored locally only.",
                "call_id": f"demo-{call.id}",
                "payload": payload,
            }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.settings.bland_base_url.rstrip('/')}/calls",
                headers={
                    "authorization": self.settings.bland_api_key,
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            return response.json() | {"payload": payload}

    def _customer_context_dynamic_data(self, call: CallSession) -> dict[str, Any]:
        return {
            "url": f"{self.settings.app_public_url.rstrip('/')}/api/bland/tools/customer-context",
            "method": "POST",
            "headers": {
                "X-App-Secret": self.settings.app_secret_key,
            },
            "body": {
                "call_session_id": call.id,
            },
            "response_data": [
                {
                    "name": "child_name",
                    "data": "$.child_name",
                    "context": "The child tied to this household is {{child_name}}.",
                },
                {
                    "name": "parent_name",
                    "data": "$.parent_name",
                    "context": "The parent decision-maker is {{parent_name}}.",
                },
                {
                    "name": "balance_amount",
                    "data": "$.balance_amount",
                    "context": "Current Penny balance is {{balance_amount}}.",
                },
                {
                    "name": "recommendation_summary",
                    "data": "$.recommendation_summary",
                    "context": "Current recommendation summary: {{recommendation_summary}}",
                },
                {
                    "name": "approval_status",
                    "data": "$.approval_status",
                    "context": "Approval status right now is {{approval_status}}.",
                },
            ],
        }

    def _answer_question_tool(self, call: CallSession) -> dict[str, Any]:
        return {
            "name": "AnswerQuestion",
            "description": "Use this to answer grounded questions about Penny balances, recommendations, and approval rules.",
            "url": f"{self.settings.app_public_url.rstrip('/')}/api/bland/tools/answer-question",
            "method": "POST",
            "headers": {
                "X-App-Secret": self.settings.app_secret_key,
            },
            "body": {
                "call_session_id": call.id,
                "question": "{{input.question}}",
                "speech": "{{input.speech}}",
            },
            "input_schema": {
                "type": "object",
                "example": {
                    "speech": "Let me check that for you.",
                    "question": "How much money does Maya have and why did Penny choose those three options?",
                },
                "properties": {
                    "speech": "string",
                    "question": "string",
                },
                "required": ["question"],
            },
            "response": {
                "answer": "$.answer",
                "confidence": "$.confidence",
            },
        }

    def _approval_decision_tool(self, call: CallSession) -> dict[str, Any]:
        return {
            "name": "ApprovalDecision",
            "description": "Use this once the parent clearly approves or declines the recommendation.",
            "url": f"{self.settings.app_public_url.rstrip('/')}/api/bland/tools/approval-decision",
            "method": "POST",
            "headers": {
                "X-App-Secret": self.settings.app_secret_key,
            },
            "body": {
                "call_session_id": call.id,
                "decision": "{{input.decision}}",
                "note": "{{input.note}}",
                "speech": "{{input.speech}}",
            },
            "input_schema": {
                "type": "object",
                "example": {
                    "speech": "Thanks, I'll record that approval now.",
                    "decision": "approved",
                    "note": "Parent approved after hearing the three options.",
                },
                "properties": {
                    "speech": "string",
                    "decision": "approved or declined",
                    "note": "string",
                },
                "required": ["decision"],
            },
            "response": {
                "status": "$.status",
            },
        }
