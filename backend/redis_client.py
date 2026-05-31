import os
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get("REDIS_URL")

_client = None
_using_fake = False


class _FakeRedis:
    """In-memory fake Redis for local development when Redis is not available."""

    def __init__(self):
        self._store = {}

    async def get(self, key):
        return self._store.get(key)

    async def set(self, key, value, ex=None):
        self._store[key] = value
        return True

    async def incr(self, key):
        val = int(self._store.get(key) or 0) + 1
        self._store[key] = str(val)
        return val

    async def expire(self, key, seconds):
        return True

    async def keys(self, pattern="*"):
        return list(self._store.keys())

    async def hincrby(self, name, key, amount=1):
        hkey = f"{name}:{key}"
        val = int(self._store.get(hkey) or 0) + amount
        self._store[hkey] = str(val)
        return val


def get_redis():
    global _client, _using_fake
    if _client is None:
        if not REDIS_URL:
            logger.warning(
                "REDIS_URL not configured — using in-memory fake Redis. "
                "This is fine for local development but NOT for production."
            )
            _client = _FakeRedis()
            _using_fake = True
        else:
            try:
                import redis.asyncio as redis_mod
            except Exception as e:
                raise RuntimeError("redis.asyncio is not installed: " + str(e))
            _client = redis_mod.from_url(REDIS_URL, decode_responses=True)
    return _client
