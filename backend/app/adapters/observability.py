from .base import ObservabilityAdapter
from app.core.logging import get_logger

log = get_logger("observability")


class MockObservabilityAdapter(ObservabilityAdapter):
    """Mock TrueFoundry observability adapter. Replace with real TrueFoundry/OTEL integration."""

    async def record_span(self, span_data: dict) -> None:
        log.info("trace_span", **{k: v for k, v in span_data.items() if k != "metadata"})

    async def record_metric(self, metric: str, value: float, tags: dict) -> None:
        log.info("metric", metric=metric, value=value, **tags)
