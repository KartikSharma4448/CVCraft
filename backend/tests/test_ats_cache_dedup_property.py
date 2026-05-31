"""Property-based tests for ATS cache deduplication.

**Validates: Requirements 5.6**

Property 11: ATS cache deduplication
For any identical resume text and job description pair, calling the enhanced ATS
score endpoint twice SHALL result in at most one invocation of the external
embedding/reranking APIs (the second call served from Redis cache).
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
import json
import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from hypothesis import given, settings
from hypothesis.strategies import text

from ats_router import score, ATSScoreRequest, ATSScoreResponse, _cache_key_for_ats
from limits import cache_key


# Strategy: generate non-empty text pairs (at least some content for meaningful tests)
resume_text_strategy = text(
    alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-,",
    min_size=1,
    max_size=200,
)

job_description_strategy = text(
    alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-,",
    min_size=1,
    max_size=200,
)


def _make_fake_request():
    """Create a minimal fake Request object for the endpoint."""
    request = MagicMock()
    request.headers = {}
    request.client = MagicMock()
    request.client.host = "127.0.0.1"
    return request


class TestATSCacheDeduplication:
    """Property 11: ATS cache deduplication."""

    @given(cv_text=resume_text_strategy, jd=job_description_strategy)
    @settings(max_examples=50)
    def test_duplicate_calls_invoke_external_api_at_most_once(
        self, cv_text: str, jd: str
    ):
        """For any identical resume text and job description pair, calling the
        score endpoint twice SHALL result in at most one invocation of the
        external embedding/reranking APIs (the second call served from cache).

        **Validates: Requirements 5.6**
        """

        async def _run():
            # In-memory cache to simulate Redis behavior
            fake_cache = {}

            async def fake_get_cached(prefix: str, data: str):
                key = cache_key(prefix, data)
                return fake_cache.get(key)

            async def fake_set_cached(prefix: str, data: str, value: str, ttl: int = 3600):
                key = cache_key(prefix, data)
                fake_cache[key] = value

            # Track calls to external APIs
            embed_call_count = 0
            rerank_call_count = 0

            async def fake_generate_embeddings(texts):
                nonlocal embed_call_count
                embed_call_count += 1
                return [[0.1, 0.2, 0.3] for _ in texts]

            async def fake_rerank_score(query, candidates):
                nonlocal rerank_call_count
                rerank_call_count += 1
                return [0.75 for _ in candidates]

            fake_request = _make_fake_request()

            with patch("ats_router.enforce_quota", new_callable=AsyncMock), \
                 patch("ats_router.get_cached", side_effect=fake_get_cached), \
                 patch("ats_router.set_cached", side_effect=fake_set_cached), \
                 patch("ats_router._generate_embeddings", side_effect=fake_generate_embeddings), \
                 patch("ats_router._rerank_score", side_effect=fake_rerank_score):

                req = ATSScoreRequest(cv_text=cv_text, job_description=jd)

                # First call — should invoke external APIs
                await score(req, fake_request)

                # Second call with identical inputs — should be served from cache
                await score(req, fake_request)

            # Assert external APIs called at most once
            assert embed_call_count <= 1, (
                f"External embedding API was called {embed_call_count} times for "
                f"identical inputs. Expected at most 1 call (second should be cached).\n"
                f"CV text: {cv_text!r}\n"
                f"Job description: {jd!r}"
            )
            assert rerank_call_count <= 1, (
                f"External reranking API was called {rerank_call_count} times for "
                f"identical inputs. Expected at most 1 call (second should be cached).\n"
                f"CV text: {cv_text!r}\n"
                f"Job description: {jd!r}"
            )

        asyncio.run(_run())

    @given(cv_text=resume_text_strategy, jd=job_description_strategy)
    @settings(max_examples=50)
    def test_cached_response_matches_original(
        self, cv_text: str, jd: str
    ):
        """For any identical inputs, the cached response SHALL be equivalent
        to the original response from the first call.

        **Validates: Requirements 5.6**
        """

        async def _run():
            fake_cache = {}

            async def fake_get_cached(prefix: str, data: str):
                key = cache_key(prefix, data)
                return fake_cache.get(key)

            async def fake_set_cached(prefix: str, data: str, value: str, ttl: int = 3600):
                key = cache_key(prefix, data)
                fake_cache[key] = value

            async def fake_generate_embeddings(texts):
                return [[0.1, 0.2, 0.3] for _ in texts]

            async def fake_rerank_score(query, candidates):
                return [0.75 for _ in candidates]

            fake_request = _make_fake_request()

            with patch("ats_router.enforce_quota", new_callable=AsyncMock), \
                 patch("ats_router.get_cached", side_effect=fake_get_cached), \
                 patch("ats_router.set_cached", side_effect=fake_set_cached), \
                 patch("ats_router._generate_embeddings", side_effect=fake_generate_embeddings), \
                 patch("ats_router._rerank_score", side_effect=fake_rerank_score):

                req = ATSScoreRequest(cv_text=cv_text, job_description=jd)

                # First call
                result1 = await score(req, fake_request)

                # Second call (from cache)
                result2 = await score(req, fake_request)

            # Both results should be equivalent
            assert result1 == result2, (
                f"Cached response does not match original.\n"
                f"First call: {result1}\n"
                f"Second call: {result2}\n"
                f"CV text: {cv_text!r}\n"
                f"Job description: {jd!r}"
            )

        asyncio.run(_run())
