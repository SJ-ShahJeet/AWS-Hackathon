import json
import logging
from urllib.parse import urlparse

from livekit.agents import RunContext, function_tool

logger = logging.getLogger(__name__)

# Text stream topic: browser clients open this URL in a new tab (see AvatarChatPanel).
AGENT_OPEN_URL_TOPIC = "lk.agent.open_url"


@function_tool
async def open_url(url: str, context: RunContext) -> str:
    """
    Opens a URL in the user's browser tab (the page connected to this LiveKit room).
    """
    parsed = urlparse(url.strip())
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        return "Only http and https URLs with a host can be opened."

    try:
        room = context.session.room_io.room
    except RuntimeError:
        return "Cannot open a URL because this session is not connected to a room."

    payload = json.dumps({"v": 1, "url": url.strip()})
    try:
        await room.local_participant.send_text(payload, topic=AGENT_OPEN_URL_TOPIC)
    except Exception as e:
        logger.warning("open_url: failed to notify client: %s", e)
        return f"Could not ask your browser to open the link. {e!s}"

    return f"Opened {url.strip()} in your browser."
