<p align="center">
  <img src="https://img.icons8.com/fluency/96/resume.png" alt="CVCraft Logo" width="80"/>
</p>

<h1 align="center">CVCraft</h1>
<p align="center"><strong>AI-Powered ATS Resume Builder</strong></p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/NVIDIA_NIM-AI-76B900?style=flat-square&logo=nvidia&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-6.0-47A248?style=flat-square&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=flat-square" />
</p>

<p align="center">
  Build professional, ATS-optimized resumes with AI-powered content refinement, real-time scoring, and instant PDF export — completely free, no signup required.
</p>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Content Refinement** | Improve resume sections using NVIDIA Gemma-2 AI |
| 📊 **Real-time ATS Scoring** | Instant ATS compatibility scores with matched/missing keyword analysis |
| 📄 **Professional PDF Export** | Download ATS-optimized PDFs in 2 proven formats |
| 👁️ **Live Preview** | See your resume update in real-time as you type |
| 🎨 **2 ATS Templates** | Jake Ryan Professional & Clean ATS format |
| 🆓 **No Signup Required** | Completely free, no account needed |
| 📈 **GA4 Analytics** | Built-in Google Analytics 4 tracking |
| 🔍 **SEO Optimized** | Open Graph, Twitter Cards, JSON-LD structured data |

---

## 🛠️ Tech Stack

### Frontend
![React](https://img.shields.io/badge/-React_18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/-Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/-shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white)
![jsPDF](https://img.shields.io/badge/-jsPDF-FF6B35?style=flat-square)
![fast-check](https://img.shields.io/badge/-fast--check-purple?style=flat-square)

### Backend
![FastAPI](https://img.shields.io/badge/-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/-Python_3.10+-3776AB?style=flat-square&logo=python&logoColor=white)
![NVIDIA](https://img.shields.io/badge/-NVIDIA_NIM-76B900?style=flat-square&logo=nvidia&logoColor=white)
![MongoDB](https://img.shields.io/badge/-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/-Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Hypothesis](https://img.shields.io/badge/-Hypothesis-BD1C2B?style=flat-square)

### AI Models (NVIDIA NIM)
| Model | Purpose |
|-------|---------|
| `gemma-2-2b-it` | Resume content refinement & generation |
| `nv-embed-v1` | Semantic text embeddings for ATS scoring |
| `rerank-qa-mistral-4b` | Relevance reranking for keyword matching |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ & Yarn
- **Python** 3.10+
- **MongoDB** (local or Atlas)
- **Redis** (optional — app works without it locally)

### Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cvcraft
CORS_ORIGINS=*

# NVIDIA API Keys (get from build.nvidia.com)
GEMMA_API_KEY=nvapi-xxxxx
EMBED_API_KEY=nvapi-xxxxx
RERANK_API_KEY=nvapi-xxxxx

# Local dev: relaxed rate limits
ANON_RATE_PER_MIN=100
ANON_DAILY_LIMIT=1000
```

Start the server:

```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
yarn install
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://127.0.0.1:8000
```

Start the dev server:

```bash
yarn start
```

Open **http://localhost:3000** 🎉

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai/refine` | AI-powered text refinement |
| `POST` | `/api/ai/generate` | General AI text generation |
| `POST` | `/api/ai/latex` | Generate LaTeX from CV data |
| `POST` | `/api/ats/score` | Enhanced ATS scoring with term breakdown |
| `POST` | `/api/pdf/compile` | Server-side PDF compilation (requires pdflatex) |
| `POST` | `/api/ai/ats` | Legacy ATS scoring |
| `GET`  | `/api/` | Health check |

---

## 🧪 Testing

### Backend (42 tests — Hypothesis property-based + pytest)

```bash
cd backend
.venv\Scripts\python -m pytest tests/ -v
```

### Frontend (42 tests — fast-check property-based + Jest)

```bash
cd frontend
npx craco test --watchAll=false
```

**84 total tests** covering:
- ATS score bounds & fallback behavior
- Cache deduplication
- Backward compatibility
- AI toggle behavior
- PDF compilation
- Integration flows

---

## 📁 Project Structure

```
CVCraft/
├── backend/
│   ├── server.py            # FastAPI app entry point
│   ├── ai_router.py         # AI endpoints (refine, generate, embed, rerank)
│   ├── ats_router.py        # Enhanced ATS scoring endpoint
│   ├── pdf_router.py        # PDF compilation endpoint
│   ├── template_engine.py   # LaTeX template rendering (6 templates)
│   ├── auth_router.py       # Authentication (unused — app is free)
│   ├── limits.py            # Rate limiting & caching utilities
│   ├── redis_client.py      # Redis connection (with in-memory fallback)
│   ├── email_sender.py      # Email utilities
│   ├── requirements.txt     # Python dependencies
│   └── tests/               # Property-based & unit tests (42 tests)
├── frontend/
│   ├── src/
│   │   ├── App.js           # Main app with routing & GA4
│   │   ├── pages/
│   │   │   ├── Home.jsx     # Landing page with SEO
│   │   │   └── CreateCV.jsx # CV editor with AI features
│   │   ├── components/
│   │   │   ├── CVPreview.jsx        # Live CV preview (2 templates)
│   │   │   ├── AIToggle.jsx         # AI refinement toggle
│   │   │   ├── TemplateSelector.jsx # Template picker
│   │   │   ├── ATSScorePanel.jsx    # ATS score display
│   │   │   └── SEOHead.jsx          # SEO meta tags
│   │   ├── lib/
│   │   │   ├── api.js        # Backend API client
│   │   │   └── analytics.js  # GA4 tracking utilities
│   │   └── __tests__/        # Frontend property tests
│   ├── public/
│   └── package.json
└── README.md
```

---

## 📸 Screenshots

| Home Page | CV Editor |
|-----------|-----------|
| Landing with features & CTA | Real-time editor with AI + ATS |

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | ✅ | MongoDB connection string |
| `DB_NAME` | ✅ | Database name |
| `GEMMA_API_KEY` | ⚡ | NVIDIA Gemma-2 API key (AI features) |
| `EMBED_API_KEY` | ⚡ | NVIDIA nv-embed-v1 key (semantic ATS) |
| `RERANK_API_KEY` | ⚡ | NVIDIA rerank key (semantic ATS) |
| `REDIS_URL` | ❌ | Redis URL (optional — in-memory fallback) |
| `REACT_APP_GA4_ID` | ❌ | Google Analytics 4 measurement ID |
| `CORS_ORIGINS` | ❌ | Allowed CORS origins (default: `*`) |

> ⚡ = Required for full AI features. App works without them (graceful fallback).

---

## 📄 License

MIT © [Kartik Sharma](https://kartiksharma.site)

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/kartiksharma4448">Kartik Sharma</a></strong>
</p>
