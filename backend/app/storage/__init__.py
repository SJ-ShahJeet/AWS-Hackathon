from app.core.config import get_settings

from .ghost_store import GhostStore
from .memory_store import MemoryStore


def create_store():
    settings = get_settings()
    if settings.ghost_enabled:
        try:
            return GhostStore(settings.ghost_database_url)
        except Exception:
            return MemoryStore()
    return MemoryStore()


store = create_store()
