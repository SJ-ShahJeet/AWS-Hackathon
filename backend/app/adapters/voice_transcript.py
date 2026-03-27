import asyncio
from .base import VoiceTranscriptAdapter


class MockVoiceTranscriptAdapter(VoiceTranscriptAdapter):
    """Mock Bland voice transcript adapter. Replace with real Bland webhook integration."""

    async def process_transcript(self, transcript: str, metadata: dict) -> dict:
        await asyncio.sleep(0.2)

        words = transcript.split()
        word_count = len(words)

        return {
            "cleaned_transcript": transcript.strip(),
            "call_duration_seconds": max(30, word_count * 0.8),
            "speaker_segments": [
                {"speaker": "customer", "text": transcript, "start": 0.0, "end": word_count * 0.8}
            ],
            "detected_language": "en",
            "sentiment": "negative" if any(w in transcript.lower() for w in ["frustrated", "angry", "broken"]) else "neutral",
            "key_phrases": words[:5] if word_count > 5 else words,
            "confidence": 0.92,
        }
