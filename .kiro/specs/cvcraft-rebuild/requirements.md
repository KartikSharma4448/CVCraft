# Requirements Document

## Introduction

CVCraft Rebuild is a feature upgrade to the existing CVCraft application that enhances the platform with advanced AI capabilities, professional LaTeX-based PDF generation, semantic ATS scoring, SEO optimization, and analytics integration. The existing page structure (Home landing page and CreateCV builder page) and UI framework (React 18, Tailwind CSS, shadcn/ui) are preserved while the underlying capabilities are significantly improved. The backend (Python FastAPI with MongoDB, NVIDIA API integration, Redis caching) is already deployed and changes must maintain backward compatibility.

## Glossary

- **CVCraft_System**: The full-stack web application comprising a React frontend and Python FastAPI backend for creating professional resumes
- **AI_Refinement_Engine**: The backend subsystem that uses NVIDIA gemma-2-2b-it model to refine and improve user-provided text content for resumes
- **Embedding_Service**: The backend subsystem that uses NVIDIA nv-embed-v1 model to generate semantic vector embeddings from text
- **Reranking_Service**: The backend subsystem that uses NVIDIA rerank-qa-mistral-4b model to score semantic relevance between a query and candidate texts
- **ATS_Scorer**: The subsystem that computes an Applicant Tracking System compatibility score by semantically comparing resume content against a job description
- **LaTeX_Compiler**: The backend subsystem that compiles LaTeX source code into a downloadable PDF using pdflatex
- **Template_Engine**: The subsystem responsible for generating LaTeX source code from structured CV data using one of six professional templates (modern, traditional, creative, minimalist, executive, tech)
- **AI_Toggle**: A user-facing control that enables or disables AI-powered text refinement during resume creation
- **GA4_Tracker**: The Google Analytics 4 integration that tracks page views, user events, and conversion metrics on the frontend
- **SEO_Module**: The set of meta tags, structured data, and semantic HTML enhancements applied to improve search engine discoverability

## Requirements

### Requirement 1: AI-Powered Text Refinement

**User Story:** As a resume creator, I want AI to refine and improve my text entries, so that my resume content is more professional and impactful.

#### Acceptance Criteria

1. WHEN the user submits text content for refinement, THE AI_Refinement_Engine SHALL send the text to the NVIDIA gemma-2-2b-it model with a prompt instructing professional resume language improvement.
2. WHEN the AI_Refinement_Engine receives a response from the gemma-2-2b-it model, THE AI_Refinement_Engine SHALL return the refined text to the frontend within 10 seconds.
3. THE AI_Refinement_Engine SHALL refine the following CV sections: professional summary, experience descriptions, and skills descriptions.
4. WHEN the AI_Refinement_Engine receives an error from the NVIDIA API, THE AI_Refinement_Engine SHALL return the original unmodified text along with an error indicator to the frontend.
5. THE AI_Refinement_Engine SHALL cache refinement results in Redis to avoid duplicate API calls for identical input text.

### Requirement 2: AI Toggle Control

**User Story:** As a resume creator, I want to toggle AI refinement on or off, so that I can choose whether to use AI-enhanced text or my own original wording.

#### Acceptance Criteria

1. THE CVCraft_System SHALL display an AI_Toggle control on the CreateCV page that allows the user to enable or disable AI text refinement.
2. WHILE the AI_Toggle is set to disabled, THE CVCraft_System SHALL preserve user-entered text without sending refinement requests to the AI_Refinement_Engine.
3. WHEN the user enables the AI_Toggle, THE CVCraft_System SHALL offer to refine existing text entries that have not yet been processed by the AI_Refinement_Engine.
4. THE AI_Toggle SHALL default to the enabled state when the CreateCV page loads.

### Requirement 3: LaTeX Template Generation

**User Story:** As a resume creator, I want my resume generated using professional LaTeX templates, so that the output PDF has high typographic quality suitable for professional use.

#### Acceptance Criteria

1. THE Template_Engine SHALL support six distinct LaTeX templates: modern, traditional, creative, minimalist, executive, and tech.
2. WHEN the user selects a template and provides CV data, THE Template_Engine SHALL generate valid LaTeX source code that includes all user-provided sections (personal info, summary, experience, education, skills).
3. THE Template_Engine SHALL escape special LaTeX characters (ampersand, percent, dollar, hash, underscore, braces, tilde, caret, backslash) in user-provided text to prevent compilation errors.
4. WHEN the user has optional sections with no data (such as empty portfolio or LinkedIn URL), THE Template_Engine SHALL omit those sections from the generated LaTeX rather than rendering empty placeholders.
5. THE Template_Engine SHALL produce LaTeX output that compiles without errors using pdflatex.

### Requirement 4: Server-Side PDF Compilation

**User Story:** As a resume creator, I want to download my resume as a professionally typeset PDF, so that I can submit it to employers directly.

#### Acceptance Criteria

1. WHEN the user requests a PDF download, THE LaTeX_Compiler SHALL compile the generated LaTeX source using pdflatex on the server.
2. WHEN pdflatex compilation succeeds, THE LaTeX_Compiler SHALL return the resulting PDF file as a downloadable binary response with the content type application/pdf.
3. IF pdflatex compilation fails, THEN THE LaTeX_Compiler SHALL return an error response containing the compilation error log to aid debugging.
4. THE LaTeX_Compiler SHALL complete PDF compilation and return the response within 15 seconds.
5. THE LaTeX_Compiler SHALL clean up temporary LaTeX source files and compilation artifacts after each compilation request.

### Requirement 5: Semantic ATS Score Checker

**User Story:** As a resume creator, I want to check my resume's ATS compatibility score against a specific job description, so that I can optimize my resume for automated screening systems.

#### Acceptance Criteria

1. WHEN the user provides a job description and requests an ATS score, THE ATS_Scorer SHALL generate embeddings for both the resume text and the job description using the Embedding_Service.
2. WHEN embeddings are generated, THE ATS_Scorer SHALL compute a semantic similarity score using the Reranking_Service to compare resume content against the job description.
3. THE ATS_Scorer SHALL return a numerical score between 0 and 100 representing the degree of semantic match between the resume and the job description.
4. WHEN the ATS_Scorer computes a score, THE ATS_Scorer SHALL return a breakdown of matched and missing key terms identified through the semantic comparison.
5. IF the Embedding_Service or Reranking_Service is unavailable, THEN THE ATS_Scorer SHALL fall back to keyword-based heuristic scoring and indicate to the user that semantic scoring is temporarily unavailable.
6. THE ATS_Scorer SHALL cache scoring results in Redis for identical resume-text and job-description pairs with a time-to-live of 1 hour.

### Requirement 6: SEO Optimization

**User Story:** As the product owner, I want the CVCraft website to be optimized for search engines, so that potential users can discover the platform through organic search.

#### Acceptance Criteria

1. THE SEO_Module SHALL include descriptive meta tags (title, description, keywords) on each page of the CVCraft_System.
2. THE SEO_Module SHALL include Open Graph meta tags (og:title, og:description, og:image, og:url) for social media sharing on each page.
3. THE SEO_Module SHALL include Twitter Card meta tags (twitter:card, twitter:title, twitter:description, twitter:image) on each page.
4. THE SEO_Module SHALL add structured data markup using JSON-LD schema (WebApplication type) to the Home page.
5. THE SEO_Module SHALL use semantic HTML elements (header, main, nav, section, article, footer) in page layouts.
6. THE SEO_Module SHALL set a unique and descriptive document title for each page (Home page and CreateCV page).

### Requirement 7: Google Analytics 4 Integration

**User Story:** As the product owner, I want to track user behavior and conversions using Google Analytics 4, so that I can make data-driven decisions about feature improvements.

#### Acceptance Criteria

1. THE GA4_Tracker SHALL load the Google Analytics 4 measurement script on every page of the CVCraft_System.
2. WHEN a user navigates between pages, THE GA4_Tracker SHALL send a page_view event to GA4 with the page path and title.
3. WHEN a user generates a PDF, THE GA4_Tracker SHALL send a custom event named "pdf_generated" with the selected template name as a parameter.
4. WHEN a user requests an ATS score, THE GA4_Tracker SHALL send a custom event named "ats_score_checked" to GA4.
5. WHEN a user toggles the AI_Toggle, THE GA4_Tracker SHALL send a custom event named "ai_toggle_changed" with the new state (enabled or disabled) as a parameter.
6. THE GA4_Tracker SHALL respect user privacy by not sending events until the GA4 measurement ID is configured in the environment.

### Requirement 8: Backend API Compatibility

**User Story:** As a developer, I want the enhanced backend endpoints to remain backward compatible, so that the deployed backend continues to serve existing clients without breaking changes.

#### Acceptance Criteria

1. THE CVCraft_System SHALL maintain all existing API endpoint paths and response formats for the embed, generate, rerank, latex, and ats endpoints.
2. WHEN new parameters are added to existing endpoints, THE CVCraft_System SHALL make those parameters optional with sensible defaults so that existing clients continue to function.
3. THE CVCraft_System SHALL add new endpoints (such as PDF compilation and enhanced ATS scoring) as separate routes rather than modifying existing endpoint behavior.
4. THE CVCraft_System SHALL maintain existing rate limiting and Redis caching behavior for all current endpoints.

### Requirement 9: Six Professional Resume Templates

**User Story:** As a resume creator, I want to choose from six distinct professional resume formats, so that I can select a style that matches my industry and personal preference.

#### Acceptance Criteria

1. THE Template_Engine SHALL produce visually distinct LaTeX output for each of the six templates: modern, traditional, creative, minimalist, executive, and tech.
2. THE CVCraft_System SHALL display a template selector on the CreateCV page allowing the user to choose among the six templates.
3. WHEN the user selects a different template, THE CVCraft_System SHALL update the CV preview to reflect the selected template style.
4. THE Template_Engine SHALL ensure each template produces a PDF that is ATS-parseable (uses standard fonts, avoids images for text content, maintains logical reading order).
