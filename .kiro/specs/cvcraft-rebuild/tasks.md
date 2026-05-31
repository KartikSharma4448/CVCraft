# Implementation Plan: CVCraft Rebuild

## Overview

This plan implements the CVCraft Rebuild feature in incremental steps: backend modules first (template engine, PDF compiler, ATS scorer, AI refine endpoint), then frontend components (AI toggle, template selector, SEO, GA4, ATS panel), and finally wiring everything together with integration tests. Each task builds on previous work and references specific requirements for traceability.

## Tasks

- [x] 1. Backend: Template Engine and LaTeX Escaping
  - [x] 1.1 Create `backend/template_engine.py` with `escape_latex` and `render_template` functions
    - Implement `escape_latex(text)` that escapes all 9 LaTeX special characters (& % $ # _ { } ~ ^ \)
    - Implement `render_template(cv, template)` dispatcher that routes to one of six template functions
    - Define `SUPPORTED_TEMPLATES = ["modern", "traditional", "creative", "minimalist", "executive", "tech"]`
    - Each template function receives escaped CV data and returns a complete LaTeX document string
    - Use standard fonts (Computer Modern, Latin Modern) for ATS parseability
    - Omit sections for empty optional fields (linkedinUrl, portfolio, gpa)
    - Include all populated sections: personal info, summary, experience, education, skills
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 9.1, 9.4_

  - [x] 1.2 Write property tests for `escape_latex` function
    - **Property 6: LaTeX special character escaping**
    - **Validates: Requirements 3.3**
    - Use Hypothesis to generate arbitrary strings containing LaTeX special characters
    - Assert that no unescaped special characters remain in the output

  - [x] 1.3 Write property tests for `render_template` — populated sections
    - **Property 5: LaTeX output includes all populated sections**
    - **Validates: Requirements 3.2**
    - Use Hypothesis to generate valid CV data with non-empty fields
    - Assert output contains full name, company name, institution name, and at least one skill

  - [x] 1.4 Write property tests for `render_template` — empty optional fields omitted
    - **Property 7: Empty optional fields are omitted from LaTeX**
    - **Validates: Requirements 3.4**
    - Use Hypothesis to generate CV data with empty/null optional fields
    - Assert output does not contain section headers for those fields

  - [x] 1.5 Write property tests for distinct template outputs
    - **Property 14: Distinct templates produce distinct LaTeX output**
    - **Validates: Requirements 9.1**
    - Use Hypothesis to generate valid CV data, render with two different template names
    - Assert the two LaTeX strings are not equal

- [x] 2. Backend: AI Refinement Endpoint
  - [x] 2.1 Add `/api/ai/refine` endpoint to `backend/ai_router.py`
    - Add `RefineRequest` model with `text: str` and `section: Literal["summary", "experience", "skills"]`
    - Add `RefineResponse` model with `refined_text`, `original_text`, `is_error`, `error_message`
    - Construct prompt: `"Improve this resume {section} for professional impact and ATS optimization. Keep it concise and action-oriented:\n\n{text}"`
    - Call NVIDIA gemma-2-2b-it via existing `generate` infrastructure
    - On success: return refined text
    - On API error: return original text with `is_error=True` and error message
    - Cache results in Redis keyed by `cache:refine:{sha256(section|text)}` with 24-hour TTL
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property tests for refinement prompt construction
    - **Property 1: Refinement prompt contains original text**
    - **Validates: Requirements 1.1**
    - Use Hypothesis to generate non-empty strings and valid section names
    - Assert the constructed prompt contains the original text as a substring

  - [x] 2.3 Write property tests for error fallback behavior
    - **Property 2: Error fallback preserves original text**
    - **Validates: Requirements 1.4**
    - Use Hypothesis to generate arbitrary input text
    - Mock NVIDIA API to raise an error
    - Assert response has `refined_text == original_text` and `is_error == True`

  - [x] 2.4 Write property tests for refinement cache deduplication
    - **Property 3: Refinement cache deduplication**
    - **Validates: Requirements 1.5**
    - Use Hypothesis to generate text/section pairs
    - Call refine twice with identical params, assert NVIDIA API called at most once

- [x] 3. Backend: PDF Compiler Router
  - [x] 3.1 Create `backend/pdf_router.py` with `/api/pdf/compile` endpoint
    - Define `PDFCompileRequest` model with `cv: Dict[str, Any]` and `template: str = "modern"`
    - Call `template_engine.render_template()` to get LaTeX source
    - Write LaTeX to a temporary directory (`tempfile.mkdtemp()`)
    - Run `pdflatex` via `subprocess.run()` with 15-second timeout
    - On success: return PDF bytes with `Content-Type: application/pdf`
    - On failure: return JSON with `{"error": "compilation_failed", "log": "..."}` (HTTP 422)
    - On timeout: kill subprocess, return timeout error
    - Always clean up temp directory in a `finally` block
    - Validate template name against `SUPPORTED_TEMPLATES`, return 400 for invalid
    - Validate CV data is non-empty, return 400 for empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.2 Write unit tests for PDF compilation endpoint
    - Test successful compilation returns PDF content-type
    - Test invalid template name returns 400
    - Test empty CV data returns 400
    - Test compilation failure returns 422 with log
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 4. Backend: Enhanced ATS Scorer
  - [x] 4.1 Create `backend/ats_router.py` with `/api/ats/score` endpoint
    - Define `ATSScoreRequest` model with `cv_text: str` and `job_description: str`
    - Define `ATSScoreResponse` model with `score: int`, `matched_terms: List[str]`, `missing_terms: List[str]`, `method: Literal["semantic", "heuristic"]`
    - Implement semantic scoring pipeline: generate embeddings → rerank → normalize to 0-100
    - Extract matched/missing terms by comparing embedding clusters
    - On embedding/reranking service failure: fall back to keyword-based heuristic scoring with `method="heuristic"`
    - Cache results in Redis with key `cache:ats_enhanced:{sha256(cv_text|jd)}` and 1-hour TTL
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 4.2 Write property tests for ATS score bounds
    - **Property 8: ATS score is bounded between 0 and 100**
    - **Validates: Requirements 5.3**
    - Use Hypothesis to generate arbitrary resume text and job description strings
    - Assert score is >= 0 and <= 100

  - [x] 4.3 Write property tests for ATS response term breakdown
    - **Property 9: ATS response includes term breakdown**
    - **Validates: Requirements 5.4**
    - Use Hypothesis to generate resume text and non-empty job descriptions
    - Assert response includes `matched_terms` and `missing_terms` as lists (not null)

  - [x] 4.4 Write property tests for ATS fallback on service failure
    - **Property 10: ATS fallback produces valid score on service failure**
    - **Validates: Requirements 5.5**
    - Use Hypothesis to generate text pairs, mock embedding/reranking services as unavailable
    - Assert score is in [0, 100] and `method == "heuristic"`

  - [x] 4.5 Write property tests for ATS cache deduplication
    - **Property 11: ATS cache deduplication**
    - **Validates: Requirements 5.6**
    - Use Hypothesis to generate identical text pairs
    - Call score endpoint twice, assert external APIs called at most once

- [x] 5. Backend: Register New Routers and Backward Compatibility
  - [x] 5.1 Modify `backend/server.py` to register `pdf_router` and `ats_router`
    - Import and include `pdf_router.router` and `ats_router.router`
    - Ensure existing routers (ai_router, auth_router) remain unchanged
    - Verify all existing endpoint paths still respond correctly
    - _Requirements: 8.1, 8.3_

  - [x] 5.2 Write property tests for backward-compatible endpoints
    - **Property 13: Backward-compatible endpoints accept existing payloads**
    - **Validates: Requirements 8.2**
    - Use Hypothesis to generate valid payloads conforming to existing API schemas
    - Assert all existing endpoints return HTTP 2xx with same response structure

- [x] 6. Checkpoint - Backend verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Frontend: GA4 Analytics Utility
  - [x] 7.1 Create `frontend/src/lib/analytics.js` with GA4 tracking functions
    - Implement `initGA4()` that dynamically loads gtag.js script if `REACT_APP_GA4_ID` is set
    - Implement `trackPageView(path, title)` that sends page_view event
    - Implement `trackEvent(eventName, params)` that sends custom events
    - All functions must no-op if GA4 measurement ID is not configured
    - _Requirements: 7.1, 7.2, 7.6_

  - [x] 7.2 Write property tests for GA4 event suppression
    - **Property 12: GA4 events suppressed without measurement ID**
    - **Validates: Requirements 7.6**
    - Use fast-check to generate arbitrary event names and params
    - Assert `window.gtag` is never called when measurement ID is unset

- [x] 8. Frontend: SEO Module
  - [x] 8.1 Create `frontend/src/components/SEOHead.jsx` component
    - Accept `title`, `description`, and `path` props
    - Set document title and meta tags (description, keywords) programmatically via `useEffect`
    - Include Open Graph meta tags (og:title, og:description, og:image, og:url)
    - Include Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image)
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 8.2 Add JSON-LD structured data to Home page
    - Add WebApplication schema markup to Home page using JSON-LD script tag
    - Use semantic HTML elements (header, main, nav, section, footer) in Home page layout
    - _Requirements: 6.4, 6.5_

  - [x] 8.3 Update `frontend/public/index.html` with base meta tags and GA4 script placeholder
    - Add fallback meta tags for SEO
    - Add GA4 gtag.js script loading (conditional on env variable)
    - _Requirements: 6.1, 7.1_

- [x] 9. Frontend: AI Toggle and Template Selector Components
  - [x] 9.1 Create `frontend/src/components/AIToggle.jsx` component
    - Use shadcn/ui `Switch` and `Label` components
    - Accept `enabled` and `onToggle` props
    - Display "AI Refinement" label next to toggle
    - Fire GA4 `ai_toggle_changed` event on toggle with state parameter
    - _Requirements: 2.1, 7.5_

  - [x] 9.2 Create `frontend/src/components/TemplateSelector.jsx` component
    - Display all six templates with name and description
    - Accept `selected` and `onSelect` props
    - Show visual distinction for selected template
    - Define TEMPLATES array with id, name, description for all six templates
    - _Requirements: 9.2, 9.3_

  - [x] 9.3 Create `frontend/src/components/ATSScorePanel.jsx` component
    - Accept job description input from user
    - Display score (0-100), matched terms, and missing terms
    - Show method indicator (semantic vs heuristic)
    - Fire GA4 `ats_score_checked` event when score is requested
    - _Requirements: 5.3, 5.4, 7.4_

  - [x] 9.4 Write property tests for AI toggle disabling refinement calls
    - **Property 4: AI toggle disables refinement calls**
    - **Validates: Requirements 2.2**
    - Use fast-check to generate text entry actions
    - Assert zero HTTP requests to `/api/ai/refine` when toggle is disabled

- [x] 10. Frontend: Integrate Components into Pages
  - [x] 10.1 Integrate AIToggle, TemplateSelector, and ATSScorePanel into CreateCV page
    - Add `aiEnabled` state (default: `true`) and wire to AIToggle
    - Add `selectedTemplate` state (default: `"modern"`) and wire to TemplateSelector
    - When AI toggle is enabled, offer to refine unprocessed text entries
    - When AI toggle is disabled, preserve user text without refinement calls
    - Add PDF download button that calls `/api/pdf/compile` with selected template
    - Fire GA4 `pdf_generated` event with template name on successful PDF download
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.2, 7.3_

  - [x] 10.2 Integrate SEOHead into Home and CreateCV pages
    - Add `<SEOHead>` to Home page with appropriate title and description
    - Add `<SEOHead>` to CreateCV page with appropriate title and description
    - Restructure Home page with semantic HTML elements (header, main, section, footer)
    - _Requirements: 6.5, 6.6_

  - [x] 10.3 Integrate GA4 tracking into App.js
    - Call `initGA4()` on app mount
    - Track page views on route changes using `useLocation` hook
    - _Requirements: 7.1, 7.2_

- [x] 11. Checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Final wiring and API layer updates
  - [x] 12.1 Update frontend API utility (`frontend/src/lib/api.js`) with new endpoint methods
    - Add `refineText(text, section)` method calling `/api/ai/refine`
    - Add `compilePDF(cv, template)` method calling `/api/pdf/compile`
    - Add `getATSScore(cvText, jobDescription)` method calling `/api/ats/score`
    - _Requirements: 1.1, 4.1, 5.1_

  - [x] 12.2 Write integration tests for end-to-end API flows
    - Test refine endpoint returns valid response structure
    - Test PDF compile endpoint returns PDF content-type on valid input
    - Test ATS score endpoint returns bounded score with term breakdown
    - Test existing endpoints still work with original payloads
    - _Requirements: 8.1, 8.2, 8.4_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Backend uses Python (FastAPI, Hypothesis for property tests, pytest for unit tests)
- Frontend uses JavaScript/React (fast-check for property tests, Jest for unit tests)
- The existing `render_latex` function in `ai_router.py` is preserved for backward compatibility (the `/api/ai/latex` endpoint remains unchanged)
- New template engine is a separate module used by the new `/api/pdf/compile` endpoint

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "7.1", "8.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "2.1", "7.2", "8.2", "8.3"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.1", "4.1", "9.1", "9.2", "9.3"] },
    { "id": 3, "tasks": ["3.2", "4.2", "4.3", "4.4", "4.5", "5.1", "9.4"] },
    { "id": 4, "tasks": ["5.2", "10.1", "10.2", "10.3"] },
    { "id": 5, "tasks": ["12.1"] },
    { "id": 6, "tasks": ["12.2"] }
  ]
}
```
