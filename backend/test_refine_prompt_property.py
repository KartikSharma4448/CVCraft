"""Property-based tests for refinement prompt construction.

**Validates: Requirements 1.1**

Property 1: Refinement prompt contains original text
For any non-empty user text string and any valid section name,
the prompt constructed by the AI Refinement Engine SHALL contain
the original user text verbatim as a substring.
"""
import pytest
from hypothesis import given, settings
from hypothesis.strategies import text, sampled_from

from ai_router import build_refine_prompt, VALID_SECTIONS


# Strategy: non-empty strings (min_size=1 ensures non-empty)
non_empty_text = text(min_size=1)

# Strategy: valid section names
valid_section = sampled_from(VALID_SECTIONS)


class TestRefinePromptContainsOriginalText:
    """Property 1: Refinement prompt contains original text."""

    @given(original_text=non_empty_text, section=valid_section)
    @settings(max_examples=200)
    def test_prompt_contains_original_text(self, original_text: str, section: str):
        """For any non-empty text and valid section, the constructed prompt
        contains the original text verbatim as a substring.

        **Validates: Requirements 1.1**
        """
        prompt = build_refine_prompt(section, original_text)
        assert original_text in prompt, (
            f"Original text not found in prompt.\n"
            f"Section: {section!r}\n"
            f"Original text: {original_text!r}\n"
            f"Prompt: {prompt!r}"
        )

    @given(original_text=non_empty_text, section=valid_section)
    @settings(max_examples=200)
    def test_prompt_contains_section_name(self, original_text: str, section: str):
        """For any non-empty text and valid section, the constructed prompt
        contains the section name.

        **Validates: Requirements 1.1**
        """
        prompt = build_refine_prompt(section, original_text)
        assert section in prompt, (
            f"Section name not found in prompt.\n"
            f"Section: {section!r}\n"
            f"Prompt: {prompt!r}"
        )

    @given(original_text=non_empty_text, section=valid_section)
    @settings(max_examples=200)
    def test_prompt_text_appears_after_section(self, original_text: str, section: str):
        """The original text appears after the section name in the prompt,
        ensuring the prompt structure places user content at the end.

        **Validates: Requirements 1.1**
        """
        prompt = build_refine_prompt(section, original_text)
        section_idx = prompt.index(section)
        text_idx = prompt.index(original_text)
        assert text_idx > section_idx, (
            f"Original text should appear after section name in prompt.\n"
            f"Section index: {section_idx}, Text index: {text_idx}"
        )
