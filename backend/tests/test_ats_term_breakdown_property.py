"""Property-based tests for ATS response term breakdown.

**Validates: Requirements 5.4**

Property 9: ATS response includes term breakdown
For any resume text and non-empty job description that produces a valid ATS score,
the response SHALL include a `matched_terms` list and a `missing_terms` list,
both of which are arrays (possibly empty but never null).
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from hypothesis import given, settings
from hypothesis.strategies import text, composite

from ats_router import _heuristic_score, ATSScoreResponse


# Strategy for generating arbitrary resume text (can be empty or non-empty)
resume_text = text(min_size=0, max_size=500)

# Strategy for generating non-empty job descriptions
non_empty_job_description = text(min_size=1, max_size=500)


class TestATSResponseTermBreakdown:
    """Property 9: ATS response includes term breakdown."""

    @given(cv_text=resume_text, job_description=non_empty_job_description)
    @settings(max_examples=200)
    def test_response_includes_matched_terms_as_list(
        self, cv_text: str, job_description: str
    ):
        """For any resume text and non-empty job description, the ATS response
        SHALL include matched_terms as a list (not null).

        **Validates: Requirements 5.4**
        """
        result = _heuristic_score(cv_text, job_description)

        assert isinstance(result, ATSScoreResponse)
        assert result.matched_terms is not None, (
            "matched_terms should never be None"
        )
        assert isinstance(result.matched_terms, list), (
            f"matched_terms should be a list, got {type(result.matched_terms)}"
        )

    @given(cv_text=resume_text, job_description=non_empty_job_description)
    @settings(max_examples=200)
    def test_response_includes_missing_terms_as_list(
        self, cv_text: str, job_description: str
    ):
        """For any resume text and non-empty job description, the ATS response
        SHALL include missing_terms as a list (not null).

        **Validates: Requirements 5.4**
        """
        result = _heuristic_score(cv_text, job_description)

        assert isinstance(result, ATSScoreResponse)
        assert result.missing_terms is not None, (
            "missing_terms should never be None"
        )
        assert isinstance(result.missing_terms, list), (
            f"missing_terms should be a list, got {type(result.missing_terms)}"
        )

    @given(cv_text=resume_text, job_description=non_empty_job_description)
    @settings(max_examples=200)
    def test_all_term_entries_are_strings(
        self, cv_text: str, job_description: str
    ):
        """For any resume text and non-empty job description, all entries in
        matched_terms and missing_terms SHALL be strings.

        **Validates: Requirements 5.4**
        """
        result = _heuristic_score(cv_text, job_description)

        for term in result.matched_terms:
            assert isinstance(term, str), (
                f"Each matched term should be a string, got {type(term)}: {term!r}"
            )

        for term in result.missing_terms:
            assert isinstance(term, str), (
                f"Each missing term should be a string, got {type(term)}: {term!r}"
            )
