from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os
import httpx
from typing import List, Literal, Optional, Dict, Any
from limits import enforce_quota, get_cached, set_cached, cache_key, require_admin
from redis_client import get_redis
import hashlib
import json

router = APIRouter(prefix="/api/ai", tags=["ai"])

NV_API_BASE = os.environ.get("NV_API_BASE", "https://integrate.api.nvidia.com/v1")
GEMMA_KEY = os.environ.get("GEMMA_API_KEY")
EMBED_KEY = os.environ.get("EMBED_API_KEY")
RERANK_KEY = os.environ.get("RERANK_API_KEY")


class EmbedRequest(BaseModel):
    texts: List[str]


class GenerateRequest(BaseModel):
    prompt: str
    max_tokens: Optional[int] = 256


class RerankRequest(BaseModel):
    query: str
    candidates: List[str]


class LatexRequest(BaseModel):
    cv: Dict[str, Any]
    template: Optional[str] = "modern"


class ATSRequest(BaseModel):
    cv_text: str
    job_description: Optional[str] = None


class RefineRequest(BaseModel):
    text: str
    section: Literal["summary", "experience", "skills"]


class RefineResponse(BaseModel):
    refined_text: str
    original_text: str
    is_error: bool = False
    error_message: Optional[str] = None


@router.post("/embed")
async def embed_text(req: EmbedRequest, request: Request):
    await enforce_quota(request, 'embed')
    if not EMBED_KEY:
        raise HTTPException(status_code=500, detail="EMBED_API_KEY not set")
    # caching by concatenated texts
    key_data = json.dumps(req.texts, sort_keys=True)
    cached = await get_cached('embed', key_data)
    if cached:
        return json.loads(cached)
    url = f"{NV_API_BASE}/models/nv-embed-v1/embeddings"
    headers = {"Authorization": f"Bearer {EMBED_KEY}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json={"input": req.texts}, headers=headers)
        resp.raise_for_status()
        out = resp.json()
        await set_cached('embed', key_data, json.dumps(out), ttl=60 * 60 * 24)
        return out


@router.post("/generate")
async def generate_text(req: GenerateRequest, request: Request):
    await enforce_quota(request, 'generate')
    if not GEMMA_KEY:
        raise HTTPException(status_code=500, detail="GEMMA_API_KEY not set")
    # caching prompts to avoid duplicate cost
    key_data = req.prompt + f"|{req.max_tokens}"
    cached = await get_cached('generate', key_data)
    if cached:
        return json.loads(cached)
    url = f"{NV_API_BASE}/chat/completions"
    headers = {"Authorization": f"Bearer {GEMMA_KEY}"}
    payload = {
        "model": "google/gemma-2-2b-it",
        "messages": [{"role": "user", "content": req.prompt}],
        "max_tokens": req.max_tokens,
        "temperature": 0.7,
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        out = resp.json()
        # Normalize to a simpler shape for the frontend
        if 'choices' in out and out['choices']:
            content = out['choices'][0].get('message', {}).get('content', '')
            out = {"output_text": content}
        await set_cached('generate', key_data, json.dumps(out), ttl=60 * 60)
        return out


@router.post("/rerank")
async def rerank(req: RerankRequest, request: Request):
    await enforce_quota(request, 'rerank')
    if not RERANK_KEY:
        raise HTTPException(status_code=500, detail="RERANK_API_KEY not set")
    key_data = json.dumps({"q": req.query, "c": req.candidates}, sort_keys=True)
    cached = await get_cached('rerank', key_data)
    if cached:
        return json.loads(cached)
    url = f"{NV_API_BASE}/models/rerank-qa-mistral-4b/score"
    headers = {"Authorization": f"Bearer {RERANK_KEY}"}
    payload = {"query": req.query, "candidates": req.candidates}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        out = resp.json()
        await set_cached('rerank', key_data, json.dumps(out), ttl=60 * 60)
        return out


def render_latex(cv: Dict[str, Any], template: str = "modern") -> str:
    # Minimal LaTeX generator — extend templates as needed
    name = cv.get("personalInfo", {}).get("fullName", "")
    email = cv.get("personalInfo", {}).get("email", "")
    phone = cv.get("personalInfo", {}).get("phone", "")
    skills = cv.get("skills", [])
    experience = cv.get("experience", [])

    header = r"""\\documentclass[11pt]{article}
\\usepackage[margin=0.8in]{geometry}
\\usepackage{enumitem}
\\begin{document}
"""
    body = f"\\begin{{center}}\\Large\\textbf{{{name}}}\\\\\\small {email} ~|~ {phone} \\ \\end{{center}}\n"

    if skills:
        body += "\\section*{Skills}\n\\begin{itemize}[leftmargin=*]\n"
        for s in skills:
            body += f"\\item {s}\n"
        body += "\\end{itemize}\n"

    if experience:
        body += "\\section*{Experience}\n"
        for exp in experience:
            company = exp.get("company", "")
            pos = exp.get("position", "")
            desc = exp.get("description", "")
            body += f"\\textbf{{{pos}}} --- {company}\\\\\n{desc}\\\\\n"

    footer = r"""\\end{document}
"""
    return header + body + footer


@router.post("/latex")
async def make_latex(req: LatexRequest, request: Request):
    await enforce_quota(request, 'latex')
    latex = render_latex(req.cv, req.template)
    return {"latex": latex}


@router.post("/ats")
async def ats_score(req: ATSRequest, request: Request):
    await enforce_quota(request, 'ats')
    # Simple heuristic ATS scoring: presence of contact, skills count, length
    score = 50
    text = req.cv_text or ""
    if "@" in text:
        score += 10
    if any(c.isdigit() for c in text):
        score += 5
    words = len(text.split())
    if words < 200:
        score -= 10
    elif words > 800:
        score -= 5
    # bonus for skills matches if job_description provided
    if req.job_description:
        jd = req.job_description.lower()
        matches = sum(1 for kw in ["python","javascript","react","sql","aws"] if kw in text.lower())
        score += min(20, matches * 5)
    score = max(0, min(100, score))
    return {"ats_score": score}


@router.get('/admin/usage')
async def admin_usage(request: Request):
    token = request.headers.get('X-Admin-Token')
    await require_admin(token)
    r = get_redis()
    # return simple keys for today
    tkey = 'daily:*'
    keys = await r.keys(tkey)
    out = {}
    for k in keys:
        out[k] = await r.get(k)
    return out



VALID_SECTIONS = ["summary", "experience", "skills"]


def build_refine_prompt(section: str, text: str) -> str:
    """Construct the refinement prompt for the AI model.

    Args:
        section: The resume section being refined (summary, experience, skills).
        text: The original user text to refine.

    Returns:
        The formatted prompt string containing the original text.
    """
    return f"Improve this resume {section} for professional impact and ATS optimization. Keep it concise and action-oriented:\n\n{text}"


@router.post('/refine', response_model=RefineResponse)
async def refine_text(req: RefineRequest, request: Request):
    await enforce_quota(request, 'refine')
    text = req.text
    section = req.section
    # Cache by section|text (pipe-separated) as specified
    key_data = f"{section}|{text}"
    cached = await get_cached('refine', key_data)
    if cached:
        return json.loads(cached)

    if not GEMMA_KEY:
        # fallback: return original text with error flag
        out = RefineResponse(
            refined_text=text,
            original_text=text,
            is_error=True,
            error_message='GEMMA_API_KEY not set'
        ).model_dump()
        await set_cached('refine', key_data, json.dumps(out), ttl=86400)
        return out

    prompt = build_refine_prompt(section, text)
    url = f"{NV_API_BASE}/chat/completions"
    headers = {"Authorization": f"Bearer {GEMMA_KEY}"}
    payload = {
        "model": "google/gemma-2-2b-it",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 256,
        "temperature": 0.7,
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
            data = resp.json()
            # extract text from OpenAI-compatible response
            refined = (
                data.get('choices', [{}])[0].get('message', {}).get('content')
                or data.get('generated_text')
                or data.get('output', {}).get('text')
                or json.dumps(data)
            )
            out = RefineResponse(
                refined_text=refined.strip(),
                original_text=text,
                is_error=False,
                error_message=None
            ).model_dump()
            await set_cached('refine', key_data, json.dumps(out), ttl=86400)
            return out
    except Exception as e:
        out = RefineResponse(
            refined_text=text,
            original_text=text,
            is_error=True,
            error_message=str(e)
        ).model_dump()
        await set_cached('refine', key_data, json.dumps(out), ttl=86400)
        return out
