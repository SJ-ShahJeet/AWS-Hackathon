from abc import ABC, abstractmethod
from typing import Optional


class LLMPlannerAdapter(ABC):
    @abstractmethod
    async def analyze_complaint(self, complaint: str) -> dict: ...
    @abstractmethod
    async def build_plan(self, issue_summary: dict) -> dict: ...
    @abstractmethod
    async def generate_user_update(self, issue_data: dict, reasoning: dict) -> str: ...
    @abstractmethod
    async def generate_empathetic_response(self, emotional_state: str, issue_summary: str, status: str, next_steps: list[str]) -> str: ...


class AuthAdapter(ABC):
    @abstractmethod
    async def verify_token(self, token: str) -> Optional[dict]: ...
    @abstractmethod
    async def get_user_context(self, user_id: str) -> dict: ...


class VoiceTranscriptAdapter(ABC):
    @abstractmethod
    async def process_transcript(self, transcript: str, metadata: dict) -> dict: ...


class CodeInsightAdapter(ABC):
    @abstractmethod
    async def analyze_code_area(self, product_area: str, issue_summary: str) -> dict: ...
    @abstractmethod
    async def get_recent_changes(self, code_area: str) -> list[dict]: ...


class SpecGenerationAdapter(ABC):
    @abstractmethod
    async def generate_spec(self, artifact_data: dict) -> dict: ...
    @abstractmethod
    async def generate_fix_plan(self, artifact_data: dict) -> dict: ...


class TicketingOrActionAdapter(ABC):
    @abstractmethod
    async def create_ticket(self, issue_data: dict) -> dict: ...
    @abstractmethod
    async def execute_action(self, action_type: str, payload: dict) -> dict: ...


class KnowledgeBaseAdapter(ABC):
    @abstractmethod
    async def search_incidents(self, query: str) -> list[dict]: ...
    @abstractmethod
    async def get_product_area_info(self, area: str) -> dict: ...


class ObservabilityAdapter(ABC):
    @abstractmethod
    async def record_span(self, span_data: dict) -> None: ...
    @abstractmethod
    async def record_metric(self, metric: str, value: float, tags: dict) -> None: ...
