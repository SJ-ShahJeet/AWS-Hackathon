import logging
import os
from typing import Callable, Optional, Sequence

from dotenv import find_dotenv, load_dotenv
from livekit.agents import (
    Agent,
    AgentSession,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.plugins import elevenlabs, hedra, noise_cancellation, silero, tavus
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from mcp_client.agent_tools import MCPToolsIntegration
from mcp_client.server import MCPServerSse
from tools import open_url

logger = logging.getLogger("agent")

# Load environment from repo root `.env.local` regardless of CWD
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_env_path = os.path.join(repo_root, ".env.local")
frontend_env_path = os.path.join(repo_root, "frontend", ".env.local")

if os.path.exists(root_env_path):
    load_dotenv(root_env_path, override=False)
if os.path.exists(frontend_env_path):
    load_dotenv(frontend_env_path, override=False)
if not os.path.exists(root_env_path):
    discovered = find_dotenv(".env.local", usecwd=True)
    if discovered:
        load_dotenv(discovered, override=False)


class Assistant(Agent):
    def __init__(self, tools: Optional[Sequence[Callable]] = None) -> None:
        merged_tools = [open_url]
        if tools:
            merged_tools.extend(list(tools))
        super().__init__(
            instructions="""You are a helpful voice AI assistant. The user is interacting with you via voice, even if you perceive the conversation as text.
            You eagerly assist users with their questions by providing information from your extensive knowledge.
            Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
            You are curious, friendly, and have a sense of humor.""",
            tools=merged_tools,
        )


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


async def entrypoint(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    mcp_url = os.environ.get("MCP_URL")
    mcp_api_key = os.environ.get("MCP_API_KEY")
    if mcp_url:
        logger.info("MCP_URL found, preparing MCP tools")
        mcp_server = MCPServerSse(
            params={
                "url": mcp_url,
                "headers": {"Authorization": f"Bearer {mcp_api_key}"} if mcp_api_key else {},
            },
            name="mcp_main_server",
        )
        agent = await MCPToolsIntegration.create_agent_with_tools(
            agent_class=Assistant,
            mcp_servers=[mcp_server],
        )
    else:
        logger.info("MCP_URL not found, starting agent without MCP tools")
        agent = Assistant()

    # Set up a voice AI pipeline using OpenAI, Cartesia, AssemblyAI, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt="deepgram/nova-3:multi",
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm="google/gemini-2.5-flash-lite",
        # Text-to-speech (TTS) via ElevenLabs plugin for custom voices (LiveKit Inference only supports default voices)
        tts=elevenlabs.TTS(
            voice_id=(os.environ.get("ELEVENLABS_VOICE_ID") or "ZMWIEDLYkh84bAIlHt0B").strip(),
            model="eleven_flash_v2_5",
            api_key=os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY"),
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
        false_interruption_timeout=None,
    )

    # To use a realtime model instead of a voice pipeline, use the following session setup instead.
    # (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    # 1. Install livekit-agents[openai]
    # 2. Set OPENAI_API_KEY in .env.local
    # 3. Add `from livekit.plugins import openai` to the top of this file
    # 4. Use the following session setup instead of the version above
    # session = AgentSession(
    #     llm=openai.realtime.RealtimeModel(voice="marin")
    # )

    # Metrics collection, to measure pipeline performance
    # For more information, see https://docs.livekit.io/agents/build/metrics/
    usage_collector = metrics.UsageCollector()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    # Avatar provider: from room name (-a-hedra[-{id}], -a-tavus) or ENABLE_AVATAR default
    room_name = ctx.room.name
    avatar_provider: Optional[str] = None
    hedra_avatar_id = ""
    if "-a-hedra" in room_name:
        avatar_provider = "hedra"
        # Room format: room-xxx-a-hedra or room-xxx-a-hedra-{uuid}
        prefix = "-a-hedra-"
        if prefix in room_name:
            hedra_avatar_id = room_name.split(prefix, 1)[1].strip()
    elif "-a-tavus" in room_name:
        avatar_provider = "tavus"
    elif os.environ.get("ENABLE_AVATAR", "false").lower() == "true":
        avatar_provider = "tavus"

    if avatar_provider == "hedra":
        hedra_api_key = (os.environ.get("HEDRA_API_KEY") or "").strip()
        hedra_avatar_id = hedra_avatar_id.strip()
        if hedra_api_key and hedra_avatar_id:
            avatar = hedra.AvatarSession(
                avatar_id=hedra_avatar_id,
                api_key=hedra_api_key,
            )
            logger.info("Starting Hedra avatar session...")
            try:
                await avatar.start(session, room=ctx.room)
                logger.info("Hedra avatar started")
            except Exception as e:
                logger.error(f"Hedra avatar start error: {e.__class__.__name__}: {e}")
                raise
        else:
            logger.warning("Hedra requested but HEDRA_API_KEY or HEDRA_AVATAR_ID missing")
    elif avatar_provider == "tavus":
        tavus_replica_id = (os.environ.get("REPLICA_ID") or "").strip()
        tavus_persona_id = (os.environ.get("PERSONA_ID") or "").strip()
        tavus_api_key = (os.environ.get("TAVUS_API_KEY") or "").strip()

        def _mask(s: str) -> str:
            if not s:
                return "<empty>"
            if len(s) <= 6:
                return "***" + s[-2:]
            return s[:2] + "***" + s[-4:]

        logger.info(
            f"Tavus envs: replica_id={_mask(tavus_replica_id)} "
            f"persona_id={_mask(tavus_persona_id)} api_key_len={len(tavus_api_key)}"
        )

        avatar = tavus.AvatarSession(
            replica_id=tavus_replica_id,
            persona_id=tavus_persona_id,
            api_key=tavus_api_key,
        )
        logger.info("Starting Tavus avatar session...")
        try:
            await avatar.start(session, room=ctx.room)
            logger.info("Tavus avatar started")
        except Exception as e:
            logger.error(f"Tavus avatar start error: {e.__class__.__name__}: {e}")
            raise
    else:
        logger.info("Avatar disabled")

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            # For telephony applications, use `BVCTelephony` for best results
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Join the room and connect to the user
    await ctx.connect()


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
