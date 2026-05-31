"""Property-based tests for ATS score bounds.

**Validates: Requirements 5.3**

Property 8: ATS score is bounded between 0 and 100
For any resume text string and job description string (including empty strings),
the ATS scorer SHALL return a numerical score that is greater than or equal to 0
and less than or equal to 100.
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from hypothesis import given, settings
from hypothesis.strategies import text

from ats_router import _heuristic_score


class TestATSScoreBounds:
    """Property 8: ATS score is bounded between 0 and 100."""

    @given(
        cv_text=text(min_size=0, max_size=500),
        job_description=text(min_size=0, max_size=500),
    )
    @settings(max_examples=200)
    def test_heuristic_score_bounded_0_to_100(self, cv_text: str, job_description: str):
        """For any arbitrary resume text and job description strings,
        the heuristic ATS scorer returns a score >= 0 and <= 100.

        **Validates: Requirements 5.3**
        """
        result = _heuristic_score(cv_text, job_description)

        assert isinstance(result.score, int), (
            f"Score should be an integer, got {type(result.score)}"
        )
        assert 0 <= result.score <= 100, (
            f"Score {result.score} is out of bounds [0, 100] "
            f"for cv_text={cv_text!r}, job_description={job_description!r}"
        )

    @given(
        cv_text=text(min_size=0, max_size=500),
    )
    @settings(max_examples=100)
    def test_heuristic_score_bounded_with_empty_job_description(self, cv_text: str):
        """When job description is empty, score is still bounded [0, 100].

        **Validates: Requirements 5.3**
        """
        result = _heuristic_score(cv_text, "")

        assert 0 <= result.score <= 100, (
            f"Score {result.score} is out of bounds [0, 100] with empty job description"
        )

    @given(
        job_description=text(min_size=0, max_size=500),
    )
    @settings(max_examples=100)
    def test_heuristic_score_bounded_with_empty_cv_text(self, job_description: str):
        """When CV text is empty, score is still bounded [0, 100].

        **Validates: Requirements 5.3**
        """
        result = _heuristic_score("", job_description)

        assert 0 <= result.score <= 100, (
            f"Score {result.score} is out of bounds [0, 100] with empty cv_text"
        )
