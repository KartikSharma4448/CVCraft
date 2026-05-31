"""
PDF Compiler Router for CVCraft.

Provides the /api/pdf/compile endpoint that renders CV data into a LaTeX
document using the template engine, compiles it with pdflatex, and returns
the resulting PDF binary.
"""
import os
import tempfile
import shutil
import subprocess
from typing import Dict, Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel

from template_engine import render_template, SUPPORTED_TEMPLATES

router = APIRouter()


class PDFCompileRequest(BaseModel):
    cv: Dict[str, Any]
    template: str = "modern"


@router.post("/compile")
async def compile_pdf(req: PDFCompileRequest):
    """Compile CV data into a PDF using pdflatex.

    - Validates template name against SUPPORTED_TEMPLATES (400 if invalid)
    - Validates CV data is non-empty (400 if empty)
    - On success: returns PDF bytes with Content-Type application/pdf
    - On compilation failure: returns 422 with error log
    - On timeout (>15s): kills subprocess, returns timeout error
    - Always cleans up temporary directory
    """
    # Validate CV data is non-empty
    if not req.cv:
        raise HTTPException(status_code=400, detail="Empty CV data")

    # Validate template name
    if req.template not in SUPPORTED_TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid template. Supported: {SUPPORTED_TEMPLATES}",
        )

    # Render LaTeX source from CV data
    tex = render_template(req.cv, req.template)

    # Create temporary directory for compilation
    tempdir = tempfile.mkdtemp(prefix="cvcraft_")
    try:
        tex_path = os.path.join(tempdir, "resume.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(tex)

        cmd = [
            "pdflatex",
            "-interaction=nonstopmode",
            "-halt-on-error",
            "-output-directory",
            tempdir,
            tex_path,
        ]

        try:
            proc = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
        except FileNotFoundError:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "pdflatex_not_installed",
                    "log": "pdflatex not found on server",
                },
            )
        except subprocess.TimeoutExpired:
            # subprocess.run with timeout automatically kills the process
            return JSONResponse(
                status_code=504,
                content={
                    "error": "compilation_timeout",
                    "log": "PDF compilation timed out after 15 seconds",
                },
            )

        # Check for compilation failure
        if proc.returncode != 0:
            log = proc.stdout + "\n" + proc.stderr
            return JSONResponse(
                status_code=422,
                content={"error": "compilation_failed", "log": log},
            )

        # Read the generated PDF
        pdf_path = os.path.join(tempdir, "resume.pdf")
        if not os.path.exists(pdf_path):
            # Some LaTeX setups name output differently; try searching
            for fname in os.listdir(tempdir):
                if fname.lower().endswith(".pdf"):
                    pdf_path = os.path.join(tempdir, fname)
                    break

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="cv.pdf"'},
        )
    finally:
        # Always clean up temp directory
        try:
            shutil.rmtree(tempdir)
        except Exception:
            pass
