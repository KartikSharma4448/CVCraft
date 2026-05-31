"""Property-based tests for distinct template outputs.

**Validates: Requirements 9.1**

Property 14: Distinct templates produce distinct LaTeX output
For any valid CV data object with at least one experience entry and one skill,
generating LaTeX with two different template names SHALL produce two structurally
different LaTeX strings (not equal to each other).
"""
import sys
import os

# Add backend directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from hypothesis import given, settings, assume
from hypothesis.strategies import (
    text,
    composite,
    lists,
    booleans,
    sampled_from,
    tuples,
)

from template_engine import render_template, SUPPORTED_TEMPLATES


# --- Strategies for generating valid CV data ---

# Printable text without LaTeX special chars to keep things simple and focused
# on the property (distinctness), not on escaping behavior.
safe_text = text(
    alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-,",
    min_size=1,
    max_size=50,
)

optional_text = text(
    alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-,",
    min_size=0,
    max_size=50,
)

date_text = text(
    alphabet="0123456789-",
    min_size=4,
    max_size=10,
)


@composite
def experience_entry(draw):
    """Generate a valid experience entry."""
    return {
        "company": draw(safe_text),
        "position": draw(safe_text),
        "location": draw(safe_text),
        "startDate": draw(date_text),
        "endDate": draw(date_text),
        "current": draw(booleans()),
        "description": draw(safe_text),
    }


@composite
def education_entry(draw):
    """Generate a valid education entry."""
    return {
        "institution": draw(safe_text),
        "degree": draw(safe_text),
        "field": draw(safe_text),
        "startDate": draw(date_text),
        "endDate": draw(date_text),
        "gpa": draw(optional_text),
    }


@composite
def valid_cv_data(draw):
    """Generate valid CV data with at least one experience entry and one skill."""
    personal_info = {
        "fullName": draw(safe_text),
        "email": draw(safe_text),
        "phone": draw(safe_text),
        "location": draw(safe_text),
        "title": draw(safe_text),
        "summary": draw(safe_text),
        "linkedinUrl": draw(optional_text),
        "portfolio": draw(optional_text),
    }
    experiences = draw(lists(experience_entry(), min_size=1, max_size=3))
    educations = draw(lists(education_entry(), min_size=0, max_size=2))
    skills = draw(lists(safe_text, min_size=1, max_size=5))

    return {
        "personalInfo": personal_info,
        "experience": experiences,
        "education": educations,
        "skills": skills,
    }


def two_different_templates():
    """Strategy that produces a tuple of two distinct template names."""
    return tuples(
        sampled_from(SUPPORTED_TEMPLATES),
        sampled_from(SUPPORTED_TEMPLATES),
    ).filter(lambda pair: pair[0] != pair[1])


class TestDistinctTemplatesProduceDistinctOutput:
    """Property 14: Distinct templates produce distinct LaTeX output."""

    @given(cv=valid_cv_data(), templates=two_different_templates())
    @settings(max_examples=200)
    def test_different_templates_produce_different_latex(
        self, cv: dict, templates: tuple
    ):
        """For any valid CV data with at least one experience entry and one skill,
        rendering with two different template names produces two distinct LaTeX strings.

        **Validates: Requirements 9.1**
        """
        template_a, template_b = templates

        output_a = render_template(cv, template_a)
        output_b = render_template(cv, template_b)

        assert output_a != output_b, (
            f"Templates '{template_a}' and '{template_b}' produced identical LaTeX output "
            f"for the same CV data.\n"
            f"Output length: {len(output_a)} chars"
        )
