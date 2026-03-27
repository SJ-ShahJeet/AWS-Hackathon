"""
Google Workspace tools for the voice agent, powered by the gws CLI.
https://github.com/googleworkspace/cli

Auth setup (one-time):
  1. Install gws locally: npm install -g @googleworkspace/cli
  2. Run: gws auth setup  (or manual OAuth setup via Google Cloud Console)
  3. Run: gws auth export --unmasked | base64 -w 0
  4. Set GOOGLE_CREDENTIALS_JSON_B64 in your .env / LiveKit Cloud env vars

The agent will decode the credentials at startup and pass them to gws via
GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE.
"""

import asyncio
import base64
import json
import logging
import os
from html import escape
from pathlib import Path

from livekit.agents import RunContext, function_tool

logger = logging.getLogger("google-tools")

_CREDS_DIR = Path("/tmp/gws-config")
_CREDS_FILE = _CREDS_DIR / "credentials.json"


def setup_google_credentials() -> bool:
    """
    Decode GOOGLE_CREDENTIALS_JSON_B64 and write to a temp file so gws can
    authenticate. Returns True if credentials are ready.

    If GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE is already set, skips setup.
    """
    if os.environ.get("GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE"):
        logger.info("gws: using GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE")
        return True

    b64 = os.environ.get("GOOGLE_CREDENTIALS_JSON_B64", "").strip()
    if not b64:
        logger.info("gws: no credentials configured — Google tools disabled")
        return False

    try:
        creds_json = base64.b64decode(b64).decode("utf-8")
        json.loads(creds_json)  # validate
    except Exception as e:
        logger.error("gws: failed to decode GOOGLE_CREDENTIALS_JSON_B64: %s", e)
        return False

    _CREDS_DIR.mkdir(parents=True, exist_ok=True)
    _CREDS_FILE.write_text(creds_json)

    os.environ["GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE"] = str(_CREDS_FILE)
    os.environ["GOOGLE_WORKSPACE_CLI_CONFIG_DIR"] = str(_CREDS_DIR)
    logger.info("gws: credentials ready at %s", _CREDS_FILE)
    return True


def google_credentials_configured() -> bool:
    return bool(
        os.environ.get("GOOGLE_WORKSPACE_CLI_CREDENTIALS_FILE")
        or os.environ.get("GOOGLE_CREDENTIALS_JSON_B64")
    )


async def _gws(*args: str) -> str:
    """Run a gws command and return its stdout."""
    proc = await asyncio.create_subprocess_exec(
        "gws",
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        env=os.environ.copy(),
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=30.0)
    except asyncio.TimeoutError:
        proc.kill()
        raise RuntimeError("gws command timed out after 30s")

    if proc.returncode != 0:
        err = stderr.decode().strip()
        raise RuntimeError(f"gws error (exit {proc.returncode}): {err[:400]}")

    return stdout.decode().strip()


def _sanitize_header_value(value: str) -> str:
    """Prevent CRLF/header injection in email headers."""
    return value.replace("\r", " ").replace("\n", " ").strip()


def _build_company_theme_html(
    *,
    subject: str,
    preheader: str,
    headline: str,
    body: str,
    cta_text: str,
    cta_url: str,
) -> str:
    company_name = os.environ.get("COMPANY_EMAIL_NAME", "Transformic").strip()
    primary_color = os.environ.get("COMPANY_EMAIL_PRIMARY_COLOR", "#2563eb").strip()
    secondary_color = os.environ.get("COMPANY_EMAIL_SECONDARY_COLOR", "#0f172a").strip()
    support_email = os.environ.get("COMPANY_SUPPORT_EMAIL", "support@example.com").strip()

    subject_html = escape(subject)
    preheader_html = escape(preheader)
    headline_html = escape(headline)
    body_html = escape(body).replace("\n", "<br>")
    cta_text_html = escape(cta_text)
    cta_url_html = escape(cta_url, quote=True)
    company_html = escape(company_name)
    support_email_html = escape(support_email)

    cta_block = ""
    if cta_text_html and cta_url_html:
        cta_block = (
            f'<tr><td style="padding-top:20px;">'
            f'<a href="{cta_url_html}" '
            f'style="display:inline-block;padding:12px 18px;'
            f'background:{primary_color};color:#ffffff;text-decoration:none;'
            f'font-weight:600;border-radius:8px;">{cta_text_html}</a>'
            f"</td></tr>"
        )

    return (
        "<!doctype html>"
        '<html><head><meta charset="UTF-8"><meta name="viewport" '
        'content="width=device-width,initial-scale=1"></head>'
        f'<body style="margin:0;padding:0;background:#f3f4f6;color:{secondary_color};'
        'font-family:Arial,sans-serif;">'
        f'<div style="display:none;max-height:0;overflow:hidden;opacity:0;">{preheader_html}</div>'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        'style="padding:24px 12px;"><tr><td align="center">'
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" '
        'style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;">'
        f'<tr><td style="padding:18px 24px;background:{secondary_color};color:#ffffff;'
        f'font-size:14px;letter-spacing:.3px;">{company_html}</td></tr>'
        '<tr><td style="padding:28px 24px 24px 24px;">'
        f'<p style="margin:0 0 10px;color:#6b7280;font-size:12px;'
        'text-transform:uppercase;letter-spacing:.6px;">'
        f"{subject_html}</p>"
        f'<h1 style="margin:0 0 14px;font-size:24px;line-height:1.3;color:{secondary_color};">'
        f"{headline_html}</h1>"
        f'<p style="margin:0;color:#374151;font-size:15px;line-height:1.7;">{body_html}</p>'
        f"{cta_block}"
        "</td></tr>"
        '<tr><td style="padding:16px 24px;border-top:1px solid #e5e7eb;'
        'font-size:12px;color:#6b7280;">'
        f"Questions? Reply to this email or contact {support_email_html}."
        "</td></tr></table></td></tr></table></body></html>"
    )


def _build_multipart_email(
    *, to: str, subject: str, text_body: str, html_body: str, from_addr: str = "me"
) -> str:
    boundary = "gws-company-template-boundary"
    return (
        f"From: {from_addr}\r\n"
        f"To: {to}\r\n"
        f"Subject: {subject}\r\n"
        "MIME-Version: 1.0\r\n"
        f'Content-Type: multipart/alternative; boundary="{boundary}"\r\n'
        "\r\n"
        f"--{boundary}\r\n"
        'Content-Type: text/plain; charset="UTF-8"\r\n'
        "Content-Transfer-Encoding: 8bit\r\n"
        "\r\n"
        f"{text_body}\r\n"
        f"--{boundary}\r\n"
        'Content-Type: text/html; charset="UTF-8"\r\n'
        "Content-Transfer-Encoding: 8bit\r\n"
        "\r\n"
        f"{html_body}\r\n"
        f"--{boundary}--\r\n"
    )


@function_tool
async def get_calendar_agenda(context: RunContext) -> str:
    """Get today's calendar agenda and upcoming events from Google Calendar."""
    return await _gws("calendar", "+agenda")


@function_tool
async def create_calendar_event(
    title: str,
    start_datetime: str,
    end_datetime: str,
    description: str,
    context: RunContext,
) -> str:
    """
    Create a new Google Calendar event.
    Use ISO 8601 format for start_datetime and end_datetime,
    e.g. 2026-03-21T10:00:00-05:00. Include the timezone offset.
    description is optional extra notes for the event.
    """
    event = {
        "summary": title,
        "description": description,
        "start": {"dateTime": start_datetime},
        "end": {"dateTime": end_datetime},
    }
    return await _gws(
        "calendar",
        "events",
        "insert",
        "--params",
        json.dumps({"calendarId": "primary"}),
        "--json",
        json.dumps(event),
    )


@function_tool
async def check_gmail_inbox(context: RunContext) -> str:
    """Check Gmail inbox for a summary of unread messages: sender, subject, and date."""
    return await _gws("gmail", "+triage")


@function_tool
async def send_email(
    to: str,
    subject: str,
    body: str,
    context: RunContext,
    headline: str = "",
    preheader: str = "",
    cta_text: str = "",
    cta_url: str = "",
) -> str:
    """
    Send a branded email via Gmail using a predefined company HTML template.
    This is the only email sending path and always includes a plain-text fallback.
    """
    safe_to = _sanitize_header_value(to)
    safe_subject = _sanitize_header_value(subject)
    safe_headline = headline.strip() or safe_subject
    safe_body = body.strip()
    safe_preheader = preheader.strip() or safe_body[:120]
    safe_cta_text = cta_text.strip()
    safe_cta_url = cta_url.strip()

    html_body = _build_company_theme_html(
        subject=safe_subject,
        preheader=safe_preheader,
        headline=safe_headline,
        body=safe_body,
        cta_text=safe_cta_text,
        cta_url=safe_cta_url,
    )

    text_lines = [safe_headline, "", safe_body]
    if safe_cta_text and safe_cta_url:
        text_lines.extend(["", f"{safe_cta_text}: {safe_cta_url}"])
    text_body = "\n".join(text_lines).strip()

    mime_message = _build_multipart_email(
        to=safe_to,
        subject=safe_subject,
        text_body=text_body,
        html_body=html_body,
    )
    raw = base64.urlsafe_b64encode(mime_message.encode("utf-8")).decode("ascii").rstrip("=")
    payload = {"raw": raw}
    return await _gws(
        "gmail",
        "users",
        "messages",
        "send",
        "--params",
        json.dumps({"userId": "me"}),
        "--json",
        json.dumps(payload),
    )


@function_tool
async def get_meeting_prep(context: RunContext) -> str:
    """Get preparation notes for the next calendar meeting: agenda, attendees, and linked docs."""
    return await _gws("workflow", "+meeting-prep")


@function_tool
async def get_standup_report(context: RunContext) -> str:
    """Get a morning standup summary: today's meetings and open tasks."""
    return await _gws("workflow", "+standup-report")


GOOGLE_TOOLS = [
    get_calendar_agenda,
    create_calendar_event,
    check_gmail_inbox,
    send_email,
    get_meeting_prep,
    get_standup_report,
]
