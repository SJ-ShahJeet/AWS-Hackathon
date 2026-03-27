"""
Penny — Structured Backend Logger
Agent 2 (Backend) uses this in all routers.
"""
import logging
import json
from datetime import datetime, timezone


class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        base = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "tag": getattr(record, "tag", record.name),
            "message": record.getMessage(),
        }
        extra = getattr(record, "extra", {})
        if extra:
            base.update(extra)
        return json.dumps(base)


def get_logger(name: str = "penny") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(StructuredFormatter())
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)
    return logger


logger = get_logger()
