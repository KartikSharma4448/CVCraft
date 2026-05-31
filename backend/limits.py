import os
import hashlib
import time
from fastapi import Request, HTTPException
from typing import Optional
from redis_client import get_redis
from jose import jwt, JWTError

SECRET_KEY = os.environ.get('MAGIC_SECRET', os.environ.get('SECRET_KEY', 'dev-secret'))
ALGORITHM = 'HS256'

# Configurable limits via env
ANON_DAILY_LIMIT = int(os.environ.get("ANON_DAILY_LIMIT", "10"))
AUTH_DAILY_LIMIT = int(os.environ.get("AUTH_DAILY_LIMIT", "30"))
ANON_RATE_PER_MIN = int(os.environ.get("ANON_RATE_PER_MIN", "3"))
AUTH_RATE_PER_MIN = int(os.environ.get("AUTH_RATE_PER_MIN", "10"))
GLOBAL_DAILY_CAP = int(os.environ.get("GLOBAL_DAILY_CAP", "1000"))
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")


def _today_key(suffix: str) -> str:
    t = time.gmtime()
    day = f"{t.tm_year:04d}{t.tm_mon:02d}{t.tm_mday:02d}"
    return f"daily:{day}:{suffix}"


def _rate_min_key(identifier: str) -> str:
    t = int(time.time() // 60)
    return f"rate:{t}:{identifier}"


async def enforce_quota(request: Request, action: str = "generic"):
    """Enforce per-IP or per-user quota and global daily cap.

    Expects REDIS_URL to be set.
    If the request has header X-User-Id, treat as authenticated.
    """
    r = get_redis()
    # Determine identifier
    # Prefer Authorization header Bearer token
    auth = request.headers.get('Authorization')
    user_id = None
    if auth and auth.lower().startswith('bearer '):
        token = auth.split(' ', 1)[1].strip()
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            user_id = payload.get('sub')
        except JWTError:
            # invalid token - treat as anonymous
            user_id = None

    if user_id:
        ident = f"user:{user_id}"
        daily_limit = AUTH_DAILY_LIMIT
        rate_limit = AUTH_RATE_PER_MIN
    else:
        # fallback to client IP
        client_host = request.client.host if request.client else "anon"
        ident = f"ip:{client_host}"
        daily_limit = ANON_DAILY_LIMIT
        rate_limit = ANON_RATE_PER_MIN

    # Global daily cap check
    global_key = _today_key("global_calls")
    global_calls = await r.get(global_key) or "0"
    if int(global_calls) >= GLOBAL_DAILY_CAP:
        raise HTTPException(status_code=503, detail="Global daily AI usage cap reached")

    # Rate limit
    rate_key = _rate_min_key(ident)
    rate_count = await r.incr(rate_key)
    if rate_count == 1:
        await r.expire(rate_key, 60)
    if rate_count > rate_limit:
        raise HTTPException(status_code=429, detail="Too many requests — rate limit exceeded")

    # Daily limit
    daily_key = _today_key(ident)
    daily_count = await r.incr(daily_key)
    if daily_count == 1:
        # expire in 2 days just to be safe (seconds)
        await r.expire(daily_key, 60 * 60 * 48)
    if int(daily_count) > daily_limit:
        raise HTTPException(status_code=402, detail="Daily quota exceeded")

    # Increment global daily counter
    g = await r.incr(global_key)
    if g == 1:
        await r.expire(global_key, 60 * 60 * 48)

    # Log usage per action
    await r.hincrby(_today_key(f"actions:{ident}"), action, 1)


def cache_key(prefix: str, data: str) -> str:
    h = hashlib.sha256(data.encode('utf-8')).hexdigest()
    return f"cache:{prefix}:{h}"


async def get_cached(prefix: str, data: str):
    r = get_redis()
    key = cache_key(prefix, data)
    val = await r.get(key)
    return val


async def set_cached(prefix: str, data: str, value: str, ttl: int = 60 * 60 * 24):
    r = get_redis()
    key = cache_key(prefix, data)
    await r.set(key, value, ex=ttl)


async def require_admin(token: Optional[str]):
    if not ADMIN_TOKEN or token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Forbidden")
