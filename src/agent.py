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
from livekit.plugins import noise_cancellation, silero, tavus
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from mcp_client.agent_tools import MCPToolsIntegration
from mcp_client.server import MCPServerSse
from tools import open_url

logger = logging.getLogger("agent")

# Load environment from repo root `.env.local` regardless of CWD
repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
root_env_path = os.path.join(repo_root, ".env.local")

if os.path.exists(root_env_path):
    load_dotenv(root_env_path, override=False)
else:
    # Fallback: search upwards from current working directory
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
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts="elevenlabs/eleven_flash_v2_5",
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

    # Conditionally start Tavus avatar based on ENABLE_AVATAR flag
    enable_avatar = os.environ.get("ENABLE_AVATAR", "false").lower() == "true"
    if enable_avatar:
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
        # Start the avatar and wait for it to join
        try:
            await avatar.start(session, room=ctx.room)
            logger.info("Tavus avatar started")
        except Exception as e:
            logger.error(f"Tavus avatar start error: {e.__class__.__name__}: {e}")
            raise
    else:
        logger.info("Avatar disabled (ENABLE_AVATAR=False)")

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
