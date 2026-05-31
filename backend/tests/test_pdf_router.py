"""Unit tests for PDF compilation endpoint (/api/pdf/compile).

Tests cover:
- Successful compilation returns PDF content-type
- Invalid template name returns 400
- Empty CV data returns 400
- Compilation failure returns 422 with log

Validates: Requirements 4.1, 4.2, 4.3
"""
import sys
import os
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from httpx import AsyncClient, ASGITransport
from fastapi import FastAPI

from pdf_router import router as pdf_router


# Create a test app with the pdf_router mounted at the same prefix as server.py
def create_test_app() -> FastAPI:
    app = FastAPI()
    app.include_router(pdf_router, prefix="/api/pdf")
    return app


app = create_test_app()


@pytest.fixture
def sample_cv():
    """Valid CV data for testing."""
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
        "experience": [
            {
                "company": "Tech Corp",
                "position": "Senior Developer",
                "location": "San Francisco, CA",
                "startDate": "2020-01",
                "endDate": "2024-01",
                "current": False,
                "description": "Led a team of 5 engineers.",
            }
        ],
        "education": [
            {
                "institution": "MIT",
                "degree": "Bachelor of Science",
                "field": "Computer Science",
                "startDate": "2012-09",
                "endDate": "2016-06",
                "gpa": "3.8",
            }
        ],
        "skills": ["Python", "JavaScript", "Docker"],
    }


class TestPDFCompileEndpoint:
    """Unit tests for POST /api/pdf/compile."""

    @pytest.mark.asyncio
    async def test_successful_compilation_returns_pdf_content_type(self, sample_cv):
        """Successful pdflatex compilation returns application/pdf content-type.

        Validates: Requirement 4.2
        """
        fake_pdf_bytes = b"%PDF-1.4 fake pdf content"

        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = ""
        mock_proc.stderr = ""

        with patch("pdf_router.subprocess.run", return_value=mock_proc) as mock_run, \
             patch("pdf_router.os.path.exists", return_value=True), \
             patch("builtins.open", create=True) as mock_open, \
             patch("pdf_router.tempfile.mkdtemp", return_value="/tmp/cvcraft_test"), \
             patch("pdf_router.shutil.rmtree"):

            # Configure mock_open to handle both write (tex) and read (pdf) calls
            from unittest.mock import mock_open as _mock_open
            m = _mock_open()

            # Track calls to distinguish write vs read mode
            call_count = [0]
            original_side_effect = m.side_effect

            def open_side_effect(path, *args, **kwargs):
                call_count[0] += 1
                if "rb" in args or kwargs.get("mode") == "rb":
                    # Reading PDF file
                    read_mock = MagicMock()
                    read_mock.__enter__ = MagicMock(return_value=read_mock)
                    read_mock.__exit__ = MagicMock(return_value=False)
                    read_mock.read = MagicMock(return_value=fake_pdf_bytes)
                    return read_mock
                else:
                    # Writing tex file
                    write_mock = MagicMock()
                    write_mock.__enter__ = MagicMock(return_value=write_mock)
                    write_mock.__exit__ = MagicMock(return_value=False)
                    return write_mock

            with patch("builtins.open", side_effect=open_side_effect):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post(
                        "/api/pdf/compile",
                        json={"cv": sample_cv, "template": "modern"},
                    )

                assert response.status_code == 200
                assert response.headers["content-type"] == "application/pdf"
                assert response.content == fake_pdf_bytes

    @pytest.mark.asyncio
    async def test_invalid_template_name_returns_400(self, sample_cv):
        """Invalid template name returns HTTP 400 with error detail.

        Validates: Requirement 4.1 (template validation)
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/pdf/compile",
                json={"cv": sample_cv, "template": "nonexistent_template"},
            )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Invalid template" in data["detail"] or "Supported" in data["detail"]

    @pytest.mark.asyncio
    async def test_empty_cv_data_returns_400(self):
        """Empty CV data (empty dict) returns HTTP 400.

        Validates: Requirement 4.1 (input validation)
        """
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/pdf/compile",
                json={"cv": {}, "template": "modern"},
            )

        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "Empty" in data["detail"] or "empty" in data["detail"].lower()

    @pytest.mark.asyncio
    async def test_compilation_failure_returns_422_with_log(self, sample_cv):
        """When pdflatex fails (non-zero return code), returns 422 with error log.

        Validates: Requirement 4.3
        """
        mock_proc = MagicMock()
        mock_proc.returncode = 1
        mock_proc.stdout = "! LaTeX Error: File `missing.sty' not found."
        mock_proc.stderr = "Fatal error occurred"

        with patch("pdf_router.subprocess.run", return_value=mock_proc), \
             patch("pdf_router.tempfile.mkdtemp", return_value="/tmp/cvcraft_test"), \
             patch("pdf_router.shutil.rmtree"):

            # Mock the file write for the tex file
            def open_side_effect(path, *args, **kwargs):
                write_mock = MagicMock()
                write_mock.__enter__ = MagicMock(return_value=write_mock)
                write_mock.__exit__ = MagicMock(return_value=False)
                return write_mock

            with patch("builtins.open", side_effect=open_side_effect):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post(
                        "/api/pdf/compile",
                        json={"cv": sample_cv, "template": "modern"},
                    )

            assert response.status_code == 422
            data = response.json()
            assert data["error"] == "compilation_failed"
            assert "log" in data
            assert "LaTeX Error" in data["log"] or "Fatal" in data["log"]

    @pytest.mark.asyncio
    async def test_compilation_timeout_returns_error(self, sample_cv):
        """When pdflatex exceeds 15-second timeout, returns timeout error.

        Validates: Requirement 4.4
        """
        import subprocess

        with patch("pdf_router.subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="pdflatex", timeout=15)), \
             patch("pdf_router.tempfile.mkdtemp", return_value="/tmp/cvcraft_test"), \
             patch("pdf_router.shutil.rmtree"):

            def open_side_effect(path, *args, **kwargs):
                write_mock = MagicMock()
                write_mock.__enter__ = MagicMock(return_value=write_mock)
                write_mock.__exit__ = MagicMock(return_value=False)
                return write_mock

            with patch("builtins.open", side_effect=open_side_effect):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    response = await client.post(
                        "/api/pdf/compile",
                        json={"cv": sample_cv, "template": "modern"},
                    )

            assert response.status_code == 504
            data = response.json()
            assert data["error"] == "compilation_timeout"
            assert "15 seconds" in data["log"] or "timed out" in data["log"].lower()

    @pytest.mark.asyncio
    async def test_default_template_is_modern(self):
        """When no template is specified, defaults to 'modern'.

        Validates: Requirement 4.1
        """
        sample_cv = {
            "personalInfo": {
                "fullName": "Test User",
                "email": "test@test.com",
                "phone": "555",
                "location": "Here",
                "title": "Dev",
                "summary": "Hi.",
                "linkedinUrl": "",
                "portfolio": "",
            },
            "experience": [
                {
                    "company": "Co",
                    "position": "Dev",
                    "location": "There",
                    "startDate": "2020-01",
                    "endDate": "2023-01",
                    "current": False,
                    "description": "Stuff.",
                }
            ],
            "education": [],
            "skills": ["Python"],
        }

        fake_pdf_bytes = b"%PDF-1.4 fake"
        mock_proc = MagicMock()
        mock_proc.returncode = 0
        mock_proc.stdout = ""
        mock_proc.stderr = ""

        with patch("pdf_router.subprocess.run", return_value=mock_proc), \
             patch("pdf_router.os.path.exists", return_value=True), \
             patch("pdf_router.tempfile.mkdtemp", return_value="/tmp/cvcraft_test"), \
             patch("pdf_router.shutil.rmtree"):

            def open_side_effect(path, *args, **kwargs):
                if "rb" in args or kwargs.get("mode") == "rb":
                    read_mock = MagicMock()
                    read_mock.__enter__ = MagicMock(return_value=read_mock)
                    read_mock.__exit__ = MagicMock(return_value=False)
                    read_mock.read = MagicMock(return_value=fake_pdf_bytes)
                    return read_mock
                else:
                    write_mock = MagicMock()
                    write_mock.__enter__ = MagicMock(return_value=write_mock)
                    write_mock.__exit__ = MagicMock(return_value=False)
                    return write_mock

            with patch("builtins.open", side_effect=open_side_effect):
                transport = ASGITransport(app=app)
                async with AsyncClient(transport=transport, base_url="http://test") as client:
                    # Send without specifying template - should default to "modern"
                    response = await client.post(
                        "/api/pdf/compile",
                        json={"cv": sample_cv},
                    )

                # Should succeed since "modern" is a valid template
                assert response.status_code == 200
                assert response.headers["content-type"] == "application/pdf"
