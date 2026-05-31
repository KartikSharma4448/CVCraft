import os
import logging
import httpx

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@cvcraft.local")


async def send_magic_link(email: str, token: str) -> dict:
    """Send a magic link or token to `email`.

    Dev behavior: if no SENDGRID_API_KEY is present, return the token so the dev flow can continue.
    Production behavior: POST to SendGrid v3 mail/send.
    """
    if not SENDGRID_API_KEY:
        logging.warning("SENDGRID_API_KEY not set; falling back to dev token return")
        return {"dev": True, "token": token}

    url = "https://api.sendgrid.com/v3/mail/send"
    payload = {
        "personalizations": [{"to": [{"email": email}], "subject": "Your CV Craft magic link"}],
        "from": {"email": MAIL_FROM},
        "content": [
            {
                "type": "text/plain",
                "value": f"Use this token to verify your CV Craft signup: {token}\nOr open the app and paste it into the verification dialog.\n"
            }
        ],
    }
    headers = {"Authorization": f"Bearer {SENDGRID_API_KEY}", "Content-Type": "application/json"}
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, json=payload, headers=headers, timeout=15.0)
        resp.raise_for_status()
    return {"sent": True}
