"""Unit tests for template_engine module."""
import pytest
from template_engine import escape_latex, render_template, SUPPORTED_TEMPLATES


class TestEscapeLatex:
    """Tests for escape_latex function."""

    def test_escapes_ampersand(self):
        assert escape_latex("a & b") == "a \\& b"

    def test_escapes_percent(self):
        assert escape_latex("100%") == "100\\%"

    def test_escapes_dollar(self):
        assert escape_latex("$100") == "\\$100"

    def test_escapes_hash(self):
        assert escape_latex("#1") == "\\#1"

    def test_escapes_underscore(self):
        assert escape_latex("a_b") == "a\\_b"

    def test_escapes_open_brace(self):
        assert escape_latex("{") == "\\{"

    def test_escapes_close_brace(self):
        assert escape_latex("}") == "\\}"

    def test_escapes_tilde(self):
        assert escape_latex("~") == "\\textasciitilde{}"

    def test_escapes_caret(self):
        assert escape_latex("^") == "\\textasciicircum{}"

    def test_escapes_backslash(self):
        assert escape_latex("\\") == "\\textbackslash{}"

    def test_backslash_braces_not_double_escaped(self):
        """Braces in \\textbackslash{} should not be re-escaped."""
        result = escape_latex("\\")
        assert result == "\\textbackslash{}"
        assert "\\textbackslash\\{\\}" not in result

    def test_tilde_braces_not_double_escaped(self):
        result = escape_latex("~")
        assert result == "\\textasciitilde{}"

    def test_caret_braces_not_double_escaped(self):
        result = escape_latex("^")
        assert result == "\\textasciicircum{}"

    def test_none_returns_empty(self):
        assert escape_latex(None) == ""

    def test_empty_string(self):
        assert escape_latex("") == ""

    def test_normal_text_unchanged(self):
        assert escape_latex("Hello World") == "Hello World"

    def test_multiple_special_chars(self):
        result = escape_latex("a & b $ c")
        assert result == "a \\& b \\$ c"

    def test_all_special_chars_combined(self):
        text = "\\&%$#_{}~^"
        result = escape_latex(text)
        # Should not contain any unescaped special chars
        assert "\\" in result  # backslash is escaped
        assert "\\&" in result
        assert "\\%" in result
        assert "\\$" in result
        assert "\\#" in result
        assert "\\_" in result
        assert "\\{" in result
        assert "\\}" in result
        assert "\\textasciitilde{}" in result
        assert "\\textasciicircum{}" in result


class TestSupportedTemplates:
    """Tests for SUPPORTED_TEMPLATES constant."""

    def test_has_six_templates(self):
        assert len(SUPPORTED_TEMPLATES) == 6

    def test_contains_all_required(self):
        expected = {"modern", "traditional", "creative", "minimalist", "executive", "tech"}
        assert set(SUPPORTED_TEMPLATES) == expected


class TestRenderTemplate:
    """Tests for render_template function."""

    @pytest.fixture
    def sample_cv(self):
        return {
            "personalInfo": {
                "fullName": "John Doe",
                "email": "john@example.com",
                "phone": "+1-555-0123",
                "location": "New York, NY",
                "title": "Software Engineer",
                "summary": "Experienced developer.",
                "linkedinUrl": "linkedin.com/in/johndoe",
                "portfolio": "johndoe.dev",
            },
            "experience": [{
                "company": "Tech Corp",
                "position": "Senior Developer",
                "location": "San Francisco, CA",
                "startDate": "2020-01",
                "endDate": "2024-01",
                "current": False,
                "description": "Led a team of 5 engineers.",
            }],
            "education": [{
                "institution": "MIT",
                "degree": "Bachelor of Science",
                "field": "Computer Science",
                "startDate": "2012-09",
                "endDate": "2016-06",
                "gpa": "3.8",
            }],
            "skills": ["Python", "JavaScript", "Docker"],
        }

    @pytest.fixture
    def cv_no_optional(self):
        return {
            "personalInfo": {
                "fullName": "Jane Smith",
                "email": "jane@example.com",
                "phone": "+1-555-9999",
                "location": "Boston, MA",
                "title": "Designer",
                "summary": "Creative professional.",
                "linkedinUrl": "",
                "portfolio": "",
            },
            "experience": [{
                "company": "Design Co",
                "position": "Lead Designer",
                "location": "Boston, MA",
                "startDate": "2019-01",
                "endDate": "",
                "current": True,
                "description": "Leading design team.",
            }],
            "education": [{
                "institution": "RISD",
                "degree": "BFA",
                "field": "Graphic Design",
                "startDate": "2015-09",
                "endDate": "2019-05",
                "gpa": "",
            }],
            "skills": ["Figma", "Photoshop"],
        }

    def test_invalid_template_raises_valueerror(self, sample_cv):
        with pytest.raises(ValueError, match="invalid"):
            render_template(sample_cv, "invalid")

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_produces_valid_latex_structure(self, sample_cv, template):
        result = render_template(sample_cv, template)
        assert "\\documentclass" in result
        assert "\\begin{document}" in result
        assert "\\end{document}" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_includes_full_name(self, sample_cv, template):
        result = render_template(sample_cv, template)
        assert "John Doe" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_includes_company(self, sample_cv, template):
        result = render_template(sample_cv, template)
        assert "Tech Corp" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_includes_institution(self, sample_cv, template):
        result = render_template(sample_cv, template)
        assert "MIT" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_includes_skills(self, sample_cv, template):
        result = render_template(sample_cv, template)
        assert "Python" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_uses_standard_fonts(self, sample_cv, template):
        result = render_template(sample_cv, template)
        assert "lmodern" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_omits_gpa_when_empty(self, cv_no_optional, template):
        result = render_template(cv_no_optional, template)
        assert "GPA" not in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_omits_linkedin_when_empty(self, cv_no_optional, template):
        result = render_template(cv_no_optional, template)
        assert "linkedin" not in result.lower()

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_omits_portfolio_when_empty(self, cv_no_optional, template):
        result = render_template(cv_no_optional, template)
        assert "portfolio" not in result.lower()

    def test_distinct_templates_produce_different_output(self, sample_cv):
        outputs = {t: render_template(sample_cv, t) for t in SUPPORTED_TEMPLATES}
        for i, t1 in enumerate(SUPPORTED_TEMPLATES):
            for t2 in SUPPORTED_TEMPLATES[i+1:]:
                assert outputs[t1] != outputs[t2], f"{t1} and {t2} are identical"

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_escapes_special_chars_in_output(self, template):
        cv_with_special = {
            "personalInfo": {
                "fullName": "John & Jane",
                "email": "test@test.com",
                "phone": "555-0000",
                "location": "City",
                "title": "Dev",
                "summary": "Works with $money.",
                "linkedinUrl": "",
                "portfolio": "",
            },
            "experience": [],
            "education": [],
            "skills": ["C#", "C++"],
        }
        result = render_template(cv_with_special, template)
        # The & in the name should be escaped
        assert "John \\& Jane" in result
        # The $ in summary should be escaped
        assert "\\$money" in result
        # The # in C# should be escaped
        assert "C\\#" in result

    @pytest.mark.parametrize("template", SUPPORTED_TEMPLATES)
    def test_handles_none_optional_fields(self, template):
        cv = {
            "personalInfo": {
                "fullName": "Test",
                "email": "t@t.com",
                "phone": "555",
                "location": "Here",
                "title": "Dev",
                "summary": "Hi.",
                "linkedinUrl": None,
                "portfolio": None,
            },
            "experience": [{
                "company": "Co",
                "position": "Dev",
                "location": "There",
                "startDate": "2020-01",
                "endDate": "2023-01",
                "current": False,
                "description": "Stuff.",
            }],
            "education": [{
                "institution": "Uni",
                "degree": "BS",
                "field": "CS",
                "startDate": "2016",
                "endDate": "2020",
                "gpa": None,
            }],
            "skills": ["Python"],
        }
        result = render_template(cv, template)
        assert "None" not in result
        assert "GPA" not in result
