"""Enhanced ATS Scorer with semantic scoring pipeline and heuristic fallback.

Implements POST /api/ats/score endpoint that:
1. Generates embeddings for CV text and job description
2. Uses reranking service to compute semantic similarity
3. Normalizes score to 0-100
4. Extracts matched/missing terms
5. Falls back to keyword-based heuristic on service failure
6. Caches results in Redis with 1-hour TTL
"""

import os
import json
import hashlib
import httpx
import re
from typing import List, Literal
from fastapi import APIRouter, Request
from pydantic import BaseModel
from limits import enforce_quota, get_cached, set_cached
from redis_client import get_redis

router = APIRouter(prefix="/api/ats", tags=["ats"])

NV_API_BASE = os.environ.get("NV_API_BASE", "https://integrate.api.nvidia.com/v1")
EMBED_KEY = os.environ.get("EMBED_API_KEY")
RERANK_KEY = os.environ.get("RERANK_API_KEY")

# Stop words to filter out when extracting key terms
STOP_WORDS = frozenset([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "must",
    "that", "this", "these", "those", "it", "its", "we", "our", "you",
    "your", "they", "their", "he", "she", "his", "her", "who", "which",
    "what", "when", "where", "how", "not", "no", "nor", "as", "if",
    "then", "than", "too", "very", "just", "about", "above", "after",
    "again", "all", "also", "any", "because", "before", "between", "both",
    "each", "few", "more", "most", "other", "some", "such", "only", "own",
    "same", "so", "over", "under", "up", "out", "into", "through", "during",
])


class ATSScoreRequest(BaseModel):
    cv_text: str
    job_description: str


class ATSScoreResponse(BaseModel):
    score: int
    matched_terms: List[str]
    missing_terms: List[str]
    method: Literal["semantic", "heuristic"]


def _cache_key_for_ats(cv_text: str, job_description: str) -> str:
    """Generate the cache key data string for ATS scoring.

    The Redis key will be: cache:ats_enhanced:{sha256(cv_text|jd)}
    """
    raw = f"{cv_text}|{job_description}"
    return raw


def _extract_key_terms(text: str) -> set:
    """Extract meaningful key terms from text, filtering stop words and short tokens."""
    # Normalize and split into words
    words = re.findall(r'[a-zA-Z0-9#+\-/.]+', text.lower())
    # Filter stop words and very short terms
    terms = set()
    for w in words:
        cleaned = w.strip('.,;:!?()[]{}"\'-/')
        if cleaned and len(cleaned) > 2 and cleaned not in STOP_WORDS:
            terms.add(cleaned)
    return terms


def _heuristic_score(cv_text: str, job_description: str) -> ATSScoreResponse:
    """Compute a keyword-based heuristic ATS score.

    Used as fallback when embedding/reranking services are unavailable.
    """
    jd_terms = _extract_key_terms(job_description)
    cv_terms = _extract_key_terms(cv_text)

    if not jd_terms:
        # No meaningful terms in JD — return a neutral score
        return ATSScoreResponse(
            score=50,
            matched_terms=[],
            missing_terms=[],
            method="heuristic",
        )

    matched = sorted(jd_terms & cv_terms)
    missing = sorted(jd_terms - cv_terms)

    # Score based on percentage of JD terms found in CV
    match_ratio = len(matched) / len(jd_terms)
    score = int(round(match_ratio * 100))
    # Clamp to 0-100
    score = max(0, min(100, score))

    return ATSScoreResponse(
        score=score,
        matched_terms=matched[:30],
        missing_terms=missing[:30],
        method="heuristic",
    )


async def _generate_embeddings(texts: List[str]) -> list:
    """Call NVIDIA embedding service to generate embeddings for texts."""
    if not EMBED_KEY:
        raise RuntimeError("EMBED_API_KEY not configured")

    url = f"{NV_API_BASE}/models/nv-embed-v1/embeddings"
    headers = {"Authorization": f"Bearer {EMBED_KEY}"}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json={"input": texts}, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    # Extract embedding vectors from response
    if isinstance(data, dict) and "data" in data:
        return [item["embedding"] for item in data["data"]]
    return data


async def _rerank_score(query: str, candidates: List[str]) -> list:
    """Call NVIDIA reranking service to score candidates against query."""
    if not RERANK_KEY:
        raise RuntimeError("RERANK_API_KEY not configured")

    url = f"{NV_API_BASE}/models/rerank-qa-mistral-4b/score"
    headers = {"Authorization": f"Bearer {RERANK_KEY}"}
    payload = {"query": query, "candidates": candidates}

    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        res = resp.json()

    # Parse scores from response (flexible format handling)
    scores = []
    if isinstance(res, dict) and "scores" in res:
        scores = res["scores"]
    elif isinstance(res, list):
        scores = [
            r.get("score", 0) if isinstance(r, dict) else float(r)
            for r in res
        ]
    elif isinstance(res, dict) and "results" in res:
        scores = [r.get("relevance_score", 0) for r in res["results"]]
    else:
        scores = [0.0]

    return scores


async def _semantic_score(cv_text: str, job_description: str) -> ATSScoreResponse:
    """Compute semantic ATS score using embeddings and reranking.

    Pipeline:
    1. Generate embeddings for CV text and job description
    2. Use reranking service to compute semantic similarity
    3. Normalize to 0-100 scale
    4. Extract matched/missing terms by comparing key terms
    """
    # Step 1: Generate embeddings (validates service availability)
    await _generate_embeddings([cv_text, job_description])

    # Step 2: Split CV into meaningful segments for reranking
    # Use sentences/paragraphs as candidates
    candidates = [s.strip() for s in re.split(r'[.\n]+', cv_text) if s.strip() and len(s.strip()) > 10]
    if not candidates:
        candidates = [cv_text]

    # Step 3: Rerank CV segments against job description
    scores = await _rerank_score(job_description, candidates)

    # Step 4: Normalize scores to 0-100
    if not scores:
        score_pct = 0
    else:
        avg_score = sum(scores) / len(scores)
        # Scores from reranking are typically 0-1 range
        if avg_score <= 1.0:
            score_pct = int(round(avg_score * 100))
        else:
            score_pct = int(round(avg_score))

    # Clamp to 0-100
    score_pct = max(0, min(100, score_pct))

    # Step 5: Extract matched/missing terms
    jd_terms = _extract_key_terms(job_description)
    cv_terms = _extract_key_terms(cv_text)
    matched = sorted(jd_terms & cv_terms)
    missing = sorted(jd_terms - cv_terms)

    return ATSScoreResponse(
        score=score_pct,
        matched_terms=matched[:30],
        missing_terms=missing[:30],
        method="semantic",
    )


@router.post("/score", response_model=ATSScoreResponse)
async def score(req: ATSScoreRequest, request: Request):
    """Enhanced ATS scoring endpoint with semantic analysis and heuristic fallback."""
    await enforce_quota(request, "ats_enhanced")

    # Check Redis cache
    cache_data = _cache_key_for_ats(req.cv_text, req.job_description)
    cached = await get_cached("ats_enhanced", cache_data)
    if cached:
        return json.loads(cached)

    # Attempt semantic scoring pipeline
    try:
        result = await _semantic_score(req.cv_text, req.job_description)
    except Exception:
        # Fallback to heuristic scoring on any embedding/reranking failure
        result = _heuristic_score(req.cv_text, req.job_description)

    # Cache result with 1-hour TTL
    out = result.model_dump()
    await set_cached("ats_enhanced", cache_data, json.dumps(out), ttl=60 * 60)

    return out
