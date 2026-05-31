"""Generate template_engine.py file."""
import os

target = os.path.join(os.path.dirname(os.path.abspath(__file__)), "template_engine.py")

# Read the content that the editor has (which is the correct full version)
# We'll generate it fresh here

HEADER = '''\
"""
Template Engine for CVCraft - generates LaTeX source from structured CV data.

Supports six distinct professional templates:
- modern: Clean lines with blue accents and sans-serif headings
- traditional: Classic serif layout with horizontal rules
- creative: Two-column layout with colored sidebar
- minimalist: Whitespace-focused, minimal formatting
- executive: Bold headings with dark styling
- tech: Monospace-inspired technical layout

All templates use standard fonts (Computer Modern, Latin Modern) for ATS parseability.
"""

from typing import Dict, Any, List

SUPPORTED_TEMPLATES = ["modern", "traditional", "creative", "minimalist", "executive", "tech"]

# Null byte placeholders used during escaping to prevent double-escaping
_PH_BACKSLASH = "\\x00BS\\x00"
_PH_TILDE = "\\x00TI\\x00"
_PH_CARET = "\\x00CA\\x00"


def escape_latex(text: str) -> str:
    r"""Escape LaTeX special characters: & % $ # _ { } ~ ^ \\

    Args:
        text: Raw text string to escape.

    Returns:
        String with all LaTeX special characters properly escaped.
        Returns empty string for None input.
    """
    if text is None:
        return ""
    out = str(text)
    # Use null-byte placeholders for chars whose LaTeX replacements
    # contain braces, to prevent double-escaping.
    out = out.replace("\\\\", _PH_BACKSLASH)
    out = out.replace("~", _PH_TILDE)
    out = out.replace("^", _PH_CARET)
    # Escape simple characters
    out = out.replace("&", "\\\\&")
    out = out.replace("%", "\\\\%")
    out = out.replace("$", "\\\\$")
    out = out.replace("#", "\\\\#")
    out = out.replace("_", "\\\\_")
    out = out.replace("{", "\\\\{")
    out = out.replace("}", "\\\\}")
    # Now replace placeholders (braces in these won\\'t be re-escaped)
    out = out.replace(_PH_BACKSLASH, "\\\\textbackslash{}")
    out = out.replace(_PH_TILDE, "\\\\textasciitilde{}")
    out = out.replace(_PH_CARET, "\\\\textasciicircum{}")
    return out
'''

print("This approach won't work well with nested escaping. Using a different method.")
print("Will write the file using raw bytes.")
