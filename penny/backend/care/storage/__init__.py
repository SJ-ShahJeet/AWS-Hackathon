from care.config import get_settings
from .memory_store import MemoryStore


def create_store():
    settings = get_settings()
    if settings.ghost_enabled:
        try:
            from .ghost_store import GhostStore
            return GhostStore(settings.ghost_database_url)
        except Exception:
            return MemoryStore()
    return MemoryStore()


store = create_store()
