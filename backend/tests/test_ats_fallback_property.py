"""Property-based tests for ATS fallback on service failure.

**Validates: Requirements 5.5**

Property 10: ATS fallback produces valid score on service failure
For any resume text and job description, when the Embedding Service or Reranking
Service is unavailable, the ATS scorer SHALL still return a valid score in the
range [0, 100] with `method` set to "heuristic".
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from unittest.mock import patch, AsyncMock, MagicMock
from hypothesis import given, settings
from hypothesis.strategies import text

from ats_router import score, ATSScoreRequest, ATSScoreResponse, _heuristic_score


# Strategies: arbitrary text pairs for resume and job description
resume_text_strategy = text(min_size=0, max_size=300)
job_description_strategy = text(min_size=0, max_size=300)


def _make_fake_request():
    """Create a minimal fake Request object for the endpoint."""
    request = MagicMock()
    request.headers = {}
    request.client = MagicMock()
    request.client.host = "127.0.0.1"
    return request


class TestATSFallbackOnServiceFailure:
    """Property 10: ATS fallback produces valid score on service failure."""

    @given(cv_text=resume_text_strategy, jd=job_description_strategy)
    @settings(max_examples=200)
    def test_heuristic_fallback_score_in_valid_range(self, cv_text: str, jd: str):
        """For any text pair, the heuristic fallback SHALL return a score
        in [0, 100].

        **Validates: Requirements 5.5**
        """
        result = _heuristic_score(cv_text, jd)

        assert isinstance(result, ATSScoreResponse)
        assert 0 <= result.score <= 100, (
            f"Heuristic score {result.score} is out of bounds [0, 100].\n"
            f"CV text: {cv_text!r}\n"
            f"Job description: {jd!r}"
        )

    @given(cv_text=resume_text_strategy, jd=job_description_strategy)
    @settings(max_examples=200)
    def test_heuristic_fallback_method_is_heuristic(self, cv_text: str, jd: str):
        """For any text pair, the heuristic fallback SHALL set method to
        "heuristic".

        **Validates: Requirements 5.5**
        """
        result = _heuristic_score(cv_text, jd)

        assert result.method == "heuristic", (
            f"Expected method='heuristic', got method='{result.method}'.\n"
            f"CV text: {cv_text!r}\n"
            f"Job description: {jd!r}"
        )

    @given(cv_text=resume_text_strategy, jd=job_description_strategy)
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_endpoint_falls_back_on_embedding_failure(
        self, cv_text: str, jd: str
    ):
        """When the embedding service is unavailable (raises exception), the
        /api/ats/score endpoint SHALL still return a valid score in [0, 100]
        with method == "heuristic".

        **Validates: Requirements 5.5**
        """
        fake_request = _make_fake_request()

        with patch("ats_router.enforce_quota", new_callable=AsyncMock), \
             patch("ats_router.get_cached", new_callable=AsyncMock, return_value=None), \
             patch("ats_router.set_cached", new_callable=AsyncMock), \
             patch(
                 "ats_router._generate_embeddings",
                 new_callable=AsyncMock,
                 side_effect=RuntimeError("Embedding service unavailable"),
             ):

            req = ATSScoreRequest(cv_text=cv_text, job_description=jd)
            result = await score(req, fake_request)

        # Result may be a dict (from json.loads of cached) or ATSScoreResponse
        if isinstance(result, dict):
            result_score = result["score"]
            result_method = result["method"]
        else:
            result_score = result.score
            result_method = result.method

        assert 0 <= result_score <= 100, (
            f"Score {result_score} out of bounds [0, 100] on embedding failure.\n"
            f"CV text: {cv_text!r}\n"
            f"Job description: {jd!r}"
        )
        assert result_method == "heuristic", (
            f"Expected method='heuristic' on embedding failure, "
            f"got '{result_method}'.\n"
            f"CV text: {cv_text!r}\n"
            f"Job description: {jd!r}"
        )

    @given(cv_text=resume_text_strategy, jd=job_description_strategy)
    @settings(max_examples=100)
    @pytest.mark.asyncio
    async def test_endpoint_falls_back_on_reranking_failure(
        self, cv_text: str, jd: str
    ):
        """When the reranking service is unavailable (raises exception), the
        /api/ats/score endpoint SHALL still return a valid score in [0, 100]
        with method == "heuristic".

        **Validates: Requirements 5.5**
        """
        fake_request = _make_fake_request()

        with patch("ats_router.enforce_quota", new_callable=AsyncMock), \
             patch("ats_router.get_cached", new_callable=AsyncMock, return_value=None), \
             patch("ats_router.set_cached", new_callable=AsyncMock), \
             patch(
                 "ats_router._generate_embeddings",
                 new_callable=AsyncMock,
                 return_value=[[0.1, 0.2], [0.3, 0.4]],
             ), \
             patch(
                 "ats_router._rerank_score",
                 new_callable=AsyncMock,
                 side_effect=RuntimeError("Reranking service unavailable"),
             ):

            req = ATSScoreRequest(cv_text=cv_text, job_description=jd)
            result = await score(req, fake_request)

        if isinstance(result, dict):
            result_score = result["score"]
            result_method = result["method"]
        else:
            result_score = result.score
            result_method = result.method

        assert 0 <= result_score <= 100, (
            f"Score {result_score} out of bounds [0, 100] on reranking failure.\n"
            f"CV text: {cv_text!r}\n"
            f"Job description: {jd!r}"
        )
        assert result_method == "heuristic", (
            f"Expected method='heuristic' on reranking failure, "
            f"got '{result_method}'.\n"
            f"CV text: {cv_text!r}\n"
            f"Job description: {jd!r}"
        )
