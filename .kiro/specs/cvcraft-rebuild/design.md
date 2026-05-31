# Design Document: CVCraft Rebuild

## Overview

CVCraft Rebuild enhances the existing CVCraft platform with AI-powered text refinement (NVIDIA gemma-2-2b-it), professional LaTeX-based PDF generation via server-side pdflatex compilation, semantic ATS scoring using embeddings and reranking, SEO optimization, and Google Analytics 4 integration. The existing page structure, UI framework, and backend deployment are preserved while capabilities are significantly upgraded.

## Architecture

The CVCraft Rebuild enhances the existing two-tier architecture (React SPA + FastAPI backend) without changing the deployment topology. The frontend remains a CRA-based React 18 app served as static files. The backend remains a single FastAPI process with MongoDB (Motor) for persistence and Redis for caching/rate-limiting.

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React 18)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Home Page│  │CreateCV  │  │SEO Module│  │GA4     │  │
│  │          │  │  Page    │  │          │  │Tracker │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
│       │              │                                    │
│       │    ┌─────────┴──────────┐                        │
│       │    │  AI Toggle Control │                        │
│       │    │  Template Selector │                        │
│       │    │  ATS Score Panel   │                        │
│       │    └────────────────────┘                        │
└───────┼──────────────┼───────────────────────────────────┘
        │              │  HTTP/REST
        ▼              ▼
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                        │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ ai_router  │  │ pdf_router │  │ ats_router (new) │  │
│  │ (existing) │  │   (new)    │  │                  │  │
│  └─────┬──────┘  └─────┬──────┘  └────────┬─────────┘  │
│        │                │                   │            │
│  ┌─────┴────────────────┴───────────────────┴────────┐  │
│  │              Shared Services Layer                  │  │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────────────┐ │  │
│  │  │  Redis  │  │ Template │  │  NVIDIA API      │ │  │
│  │  │  Cache  │  │  Engine  │  │  Client          │ │  │
│  │  └─────────┘  └──────────┘  └──────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
        │                │                   │
        ▼                ▼                   ▼
   ┌─────────┐    ┌───────────┐     ┌──────────────┐
   │ MongoDB │    │  pdflatex │     │ NVIDIA APIs  │
   │ (Motor) │    │ (subprocess)    │ (gemma, embed│
   └─────────┘    └───────────┘     │  rerank)     │
                                     └──────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. AI Refinement Engine (Enhanced `ai_router.py`)

The existing `/api/ai/generate` endpoint is extended with a new `/api/ai/refine` endpoint that wraps the generate call with a resume-specific system prompt.

```python
# POST /api/ai/refine
class RefineRequest(BaseModel):
    text: str
    section: str  # "summary" | "experience" | "skills"
    
class RefineResponse(BaseModel):
    refined_text: str
    original_text: str
    is_error: bool = False
    error_message: Optional[str] = None
```

**Behavior:**
- Constructs a prompt: `"Improve this resume {section} for professional impact and ATS optimization. Keep it concise and action-oriented:\n\n{text}"`
- Calls NVIDIA gemma-2-2b-it via existing `generate` infrastructure
- On success: returns refined text
- On API error: returns original text with `is_error=True`
- Caches results in Redis keyed by `cache:refine:{sha256(section+text)}`

#### 2. Template Engine (`template_engine.py` — new module)

A pure-function module that converts structured CV data into LaTeX source strings.

```python
SUPPORTED_TEMPLATES = ["modern", "traditional", "creative", "minimalist", "executive", "tech"]

def escape_latex(text: str) -> str:
    """Escape LaTeX special characters: & % $ # _ { } ~ ^ \\"""
    ...

def render_template(cv: Dict[str, Any], template: str) -> str:
    """Generate complete LaTeX document from CV data and template name."""
    ...
```

Each template is a function that receives escaped CV data and returns a LaTeX string. Templates use standard fonts (Computer Modern, Latin Modern) for ATS parseability.

#### 3. PDF Compiler (`pdf_router.py` — new module)

```python
# POST /api/pdf/compile
class PDFCompileRequest(BaseModel):
    cv: Dict[str, Any]
    template: str = "modern"

# Response: application/pdf binary or JSON error
```

**Behavior:**
- Calls `template_engine.render_template()` to get LaTeX source
- Writes to a temporary directory (`tempfile.mkdtemp()`)
- Runs `pdflatex` via `subprocess.run()` with 15-second timeout
- On success: returns PDF bytes with `Content-Type: application/pdf`
- On failure: returns JSON with compilation log
- Always cleans up temp directory in a `finally` block

#### 4. Enhanced ATS Scorer (`ats_router.py` — new module)

```python
# POST /api/ats/score
class ATSScoreRequest(BaseModel):
    cv_text: str
    job_description: str

class ATSScoreResponse(BaseModel):
    score: int  # 0-100
    matched_terms: List[str]
    missing_terms: List[str]
    method: str  # "semantic" | "heuristic"
```

**Scoring Pipeline:**
1. Generate embeddings for CV text and job description via `/api/ai/embed`
2. Use reranking service to compute semantic similarity
3. Normalize to 0-100 scale
4. Extract matched/missing terms by comparing embedding clusters
5. On service failure: fall back to keyword-based heuristic (existing logic)
6. Cache results in Redis with 1-hour TTL

### Frontend Components

#### 5. AI Toggle Control

A `Switch` component from shadcn/ui placed in the CreateCV header bar.

```jsx
// src/components/AIToggle.jsx
const AIToggle = ({ enabled, onToggle }) => {
  return (
    <div className="flex items-center gap-2">
      <Switch checked={enabled} onCheckedChange={onToggle} />
      <Label>AI Refinement</Label>
    </div>
  );
};
```

**State management:** The toggle state lives in `CreateCV.jsx` as `const [aiEnabled, setAiEnabled] = useState(true)`. When toggled on, the system offers to refine unprocessed text fields. When off, no refinement API calls are made.

#### 6. Template Selector (Enhanced)

The existing template selection in CreateCV is extended to show all six templates with visual thumbnails.

```jsx
// Within CreateCV.jsx
const TEMPLATES = [
  { id: 'modern', name: 'Modern', description: 'Clean lines with blue accents' },
  { id: 'traditional', name: 'Traditional', description: 'Classic serif layout' },
  { id: 'creative', name: 'Creative', description: 'Bold colors, two-column' },
  { id: 'minimalist', name: 'Minimalist', description: 'Whitespace-focused' },
  { id: 'executive', name: 'Executive', description: 'Dark sidebar, serif fonts' },
  { id: 'tech', name: 'Tech Pro', description: 'Terminal-inspired monospace' },
];
```

#### 7. SEO Module

Implemented via React Helmet (or direct `document.head` manipulation in `useEffect`) and semantic HTML restructuring.

```jsx
// src/components/SEOHead.jsx
const SEOHead = ({ title, description, path }) => {
  useEffect(() => {
    document.title = title;
    // Set meta tags programmatically
  }, [title, description, path]);
  ...
};
```

**Home page** includes JSON-LD structured data:
```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "CVCraft",
  "description": "AI-powered professional resume builder",
  "url": "https://cvcraft.app",
  "applicationCategory": "BusinessApplication"
}
```

#### 8. GA4 Tracker

```jsx
// src/lib/analytics.js
const GA4_ID = process.env.REACT_APP_GA4_ID;

export function initGA4() {
  if (!GA4_ID) return;
  // Load gtag.js script dynamically
}

export function trackPageView(path, title) {
  if (!GA4_ID || !window.gtag) return;
  window.gtag('config', GA4_ID, { page_path: path, page_title: title });
}

export function trackEvent(eventName, params = {}) {
  if (!GA4_ID || !window.gtag) return;
  window.gtag('event', eventName, params);
}
```

Events tracked:
- `page_view` — on every route change (via `useLocation` hook)
- `pdf_generated` — with `{ template: selectedTemplate }`
- `ats_score_checked` — when ATS score is requested
- `ai_toggle_changed` — with `{ state: 'enabled' | 'disabled' }`

## Data Models

### CV Data Structure (Frontend State)

```javascript
const cvData = {
  personalInfo: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    title: String,
    summary: String,
    linkedinUrl: String,      // optional
    portfolio: String,        // optional
    profilePhoto: String|null // base64 data URL, optional
  },
  experience: [{
    id: String,
    company: String,
    position: String,
    location: String,
    startDate: String,  // "YYYY-MM"
    endDate: String,    // "YYYY-MM"
    current: Boolean,
    description: String
  }],
  education: [{
    id: String,
    institution: String,
    degree: String,
    field: String,
    startDate: String,
    endDate: String,
    gpa: String         // optional
  }],
  skills: [String]
};
```

### Backend Request/Response Models

```python
# Refinement
class RefineRequest(BaseModel):
    text: str
    section: Literal["summary", "experience", "skills"]

class RefineResponse(BaseModel):
    refined_text: str
    original_text: str
    is_error: bool = False
    error_message: Optional[str] = None

# PDF Compilation
class PDFCompileRequest(BaseModel):
    cv: Dict[str, Any]
    template: str = "modern"

# ATS Scoring (Enhanced)
class ATSScoreRequest(BaseModel):
    cv_text: str
    job_description: str

class ATSScoreResponse(BaseModel):
    score: int
    matched_terms: List[str]
    missing_terms: List[str]
    method: Literal["semantic", "heuristic"]
```

### Redis Cache Key Schema

| Purpose | Key Pattern | TTL |
|---------|-------------|-----|
| AI Refinement | `cache:refine:{sha256(section\|text)}` | 24 hours |
| Embeddings | `cache:embed:{sha256(texts_json)}` | 24 hours |
| Reranking | `cache:rerank:{sha256(query\|candidates)}` | 1 hour |
| ATS Score | `cache:ats_enhanced:{sha256(cv_text\|jd)}` | 1 hour |
| Generate | `cache:generate:{sha256(prompt\|max_tokens)}` | 1 hour |

## API Contracts

### Existing Endpoints (Unchanged)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/embed` | Generate text embeddings |
| POST | `/api/ai/generate` | Generate text via gemma-2-2b-it |
| POST | `/api/ai/rerank` | Rerank candidates against query |
| POST | `/api/ai/latex` | Generate LaTeX source (legacy) |
| POST | `/api/ai/ats` | Heuristic ATS score (legacy) |
| POST | `/api/auth/signup` | Magic link signup |
| POST | `/api/auth/verify` | Verify magic token |

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/refine` | AI text refinement for resume sections |
| POST | `/api/pdf/compile` | Compile LaTeX to PDF and return binary |
| POST | `/api/ats/score` | Enhanced semantic ATS scoring |

#### POST `/api/ai/refine`

**Request:**
```json
{
  "text": "Managed a team of developers",
  "section": "experience"
}
```

**Success Response (200):**
```json
{
  "refined_text": "Led and mentored a cross-functional team of 8 software engineers, driving 40% improvement in sprint velocity",
  "original_text": "Managed a team of developers",
  "is_error": false,
  "error_message": null
}
```

**Error Fallback Response (200):**
```json
{
  "refined_text": "Managed a team of developers",
  "original_text": "Managed a team of developers",
  "is_error": true,
  "error_message": "NVIDIA API timeout"
}
```

#### POST `/api/pdf/compile`

**Request:**
```json
{
  "cv": { "personalInfo": {...}, "experience": [...], "education": [...], "skills": [...] },
  "template": "modern"
}
```

**Success Response (200):** Binary PDF with `Content-Type: application/pdf`

**Failure Response (422):**
```json
{
  "error": "compilation_failed",
  "log": "! LaTeX Error: ..."
}
```

#### POST `/api/ats/score`

**Request:**
```json
{
  "cv_text": "Full text of resume...",
  "job_description": "We are looking for a senior engineer..."
}
```

**Response (200):**
```json
{
  "score": 78,
  "matched_terms": ["python", "react", "team leadership", "agile"],
  "missing_terms": ["kubernetes", "ci/cd", "terraform"],
  "method": "semantic"
}
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| NVIDIA API timeout/error on refine | Return original text + error indicator |
| NVIDIA API timeout/error on ATS | Fall back to keyword heuristic scoring |
| pdflatex compilation failure | Return error JSON with compilation log |
| pdflatex timeout (>15s) | Kill subprocess, return timeout error |
| Redis unavailable | Skip caching, proceed without cache (log warning) |
| Invalid template name | Return 400 with list of valid templates |
| Empty CV data | Return 400 with validation error details |
| Rate limit exceeded | Return 429 (existing behavior preserved) |

## Testing Strategy

- **Property-based tests** (Python: Hypothesis; JS: fast-check): Validate universal properties for template engine, ATS scoring, LaTeX escaping, and caching logic
- **Unit tests** (pytest, Jest): Verify specific examples for API responses, error handling, and UI component rendering
- **Integration tests** (pytest + httpx): Verify PDF compilation pipeline, NVIDIA API interactions, and backward compatibility
- **Smoke tests**: Verify GA4 script loading, SEO meta tag presence, and endpoint availability

## File Structure (New/Modified)

```
backend/
├── ai_router.py          # Modified: add /refine endpoint
├── pdf_router.py         # New: PDF compilation endpoint
├── ats_router.py         # New: Enhanced ATS scoring
├── template_engine.py    # New: LaTeX template generation (6 templates)
├── server.py             # Modified: register new routers
└── requirements.txt      # Modified: no new deps needed (subprocess, tempfile are stdlib)

frontend/src/
├── components/
│   ├── AIToggle.jsx      # New: AI on/off switch
│   ├── SEOHead.jsx       # New: Meta tags component
│   ├── ATSScorePanel.jsx # New: ATS score display with breakdown
│   └── TemplateSelector.jsx # New: Visual template picker
├── lib/
│   ├── analytics.js      # New: GA4 tracking utilities
│   └── api.js            # Modified: add refine, pdf, ats methods
├── pages/
│   ├── Home.jsx          # Modified: add semantic HTML + SEO
│   └── CreateCV.jsx      # Modified: integrate toggle, template selector, PDF
└── public/
    └── index.html        # Modified: add GA4 script, meta tags
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Refinement prompt contains original text

*For any* non-empty user text string and any valid section name ("summary", "experience", "skills"), the prompt constructed by the AI Refinement Engine SHALL contain the original user text verbatim as a substring.

**Validates: Requirements 1.1**

### Property 2: Error fallback preserves original text

*For any* input text submitted to the AI Refinement Engine, when the NVIDIA API returns an error, the response SHALL contain `refined_text` equal to the original input text and `is_error` set to true.

**Validates: Requirements 1.4**

### Property 3: Refinement cache deduplication

*For any* input text and section, calling the refine endpoint twice with identical parameters SHALL result in at most one call to the external NVIDIA API (the second call served from Redis cache).

**Validates: Requirements 1.5**

### Property 4: AI toggle disables refinement calls

*For any* text entry action performed while the AI toggle is in the disabled state, the system SHALL make zero HTTP requests to the `/api/ai/refine` endpoint.

**Validates: Requirements 2.2**

### Property 5: LaTeX output includes all populated sections

*For any* valid CV data object where personal info, experience, education, and skills are all non-empty, and for any valid template name, the generated LaTeX source SHALL contain text representations of the full name, at least one company name, at least one institution name, and at least one skill.

**Validates: Requirements 3.2**

### Property 6: LaTeX special character escaping

*For any* string containing one or more LaTeX special characters (& % $ # _ { } ~ ^ \), the `escape_latex` function SHALL return a string where none of those characters appear in their unescaped form (each is replaced with its LaTeX-safe equivalent).

**Validates: Requirements 3.3**

### Property 7: Empty optional fields are omitted from LaTeX

*For any* CV data object where optional fields (linkedinUrl, portfolio, gpa) are empty strings or null, the generated LaTeX source SHALL NOT contain section headers or labels for those fields.

**Validates: Requirements 3.4**

### Property 8: ATS score is bounded between 0 and 100

*For any* resume text string and job description string (including empty strings), the ATS scorer SHALL return a numerical score that is greater than or equal to 0 and less than or equal to 100.

**Validates: Requirements 5.3**

### Property 9: ATS response includes term breakdown

*For any* resume text and non-empty job description that produces a valid ATS score, the response SHALL include a `matched_terms` list and a `missing_terms` list, both of which are arrays (possibly empty but never null).

**Validates: Requirements 5.4**

### Property 10: ATS fallback produces valid score on service failure

*For any* resume text and job description, when the Embedding Service or Reranking Service is unavailable, the ATS scorer SHALL still return a valid score in the range [0, 100] with `method` set to "heuristic".

**Validates: Requirements 5.5**

### Property 11: ATS cache deduplication

*For any* identical resume text and job description pair, calling the enhanced ATS score endpoint twice SHALL result in at most one invocation of the external embedding/reranking APIs (the second call served from Redis cache).

**Validates: Requirements 5.6**

### Property 12: GA4 events suppressed without measurement ID

*For any* trackable user action (page view, PDF generation, ATS check, toggle change), if the GA4 measurement ID environment variable is not configured, the analytics module SHALL make zero calls to `window.gtag`.

**Validates: Requirements 7.6**

### Property 13: Backward-compatible endpoints accept existing payloads

*For any* valid request payload that conforms to the existing API schema (without new optional parameters), all existing endpoints SHALL return a successful response (HTTP 2xx) with the same response structure as before the rebuild.

**Validates: Requirements 8.2**

### Property 14: Distinct templates produce distinct LaTeX output

*For any* valid CV data object with at least one experience entry and one skill, generating LaTeX with two different template names SHALL produce two structurally different LaTeX strings (not equal to each other).

**Validates: Requirements 9.1**
