# Clinical Trial Matcher

Live demo:  
**Frontend:** https://clinical-trial-matcher-frontend.vercel.app  
**Backend API:** https://clinical-trial-matcher-api.onrender.com/api/match  

> Demo only — Do not enter real patient data (no PHI).  
> The LLM integration is live but may return demo data if OpenAI quota is exceeded.


## Goal

LLM-powered demo that:

1. Takes a realistic **doctor–patient transcript**,
2. Uses an **LLM to extract key structured clinical data** (diagnosis, age, stage, etc.),
3. Queries **ClinicalTrials.gov** for recruiting trials that match,
4. Returns and displays results in a clear UI.

---

## Architecture
Transcript
↓
OpenAI API (LLM extraction)
↓
Structured JSON (patient profile)
↓
ClinicalTrials.gov API query
↓
Trial ranking + formatting
↓
React frontend display\


**Stack:**
- **Backend:** Node.js + Express + TypeScript  
  - `/api/match` → accepts transcript, returns `{ patientData, trials }`
  - Uses `extractPatientData()` (OpenAI) + `searchTrials()` (ClinicalTrials.gov)
  - Deploy: Render  
- **Frontend:** React + Vite + TypeScript + Tailwind CSS  
  - Text input, submit, and results display  
  - Deploy: Vercel  

---

## Environment Setup

### 1. Backend (`/backend/.env`)
   Create a `.env` file in `/backend`:
   ```env
   OPENAI_API_KEY=sk-key-here
   MOCK_MODE=false
   PORT=5050

### 2. Frontend (`/frontend/.env`) 
  VITE_API_BASE=https://clinical-trial-matcher-api.onrender.com

### 3. Local Run
  # backend
  cd backend
  npm install
  npm run dev

  # frontend
  cd frontend
  npm install
  npm run dev

## Deployement
  - **Backend:** Render (Node Web Service)
  Environment variables configured in Render Dashboard.
  Public endpoint: /api/match

  - **Frontend:** Vercel (React app)
  Environment variable VITE_API_BASE points to the Render URL.

## Example
  **Input Transcript**
    Hi doctor, I'm a 62 year old woman with stage III non-small cell lung cancer in Portland, Oregon.
    I'm currently on carboplatin and paclitaxel but still progressing.
    I'm tired and short of breath. I'm interested in clinical trials nearby if possible.
  
  **Response**
    {
      "patientData": {
      "age": "62",
      "sex": "female",
      "diagnosis": "non-small cell lung cancer",
      "cancer_stage": "III",
      "location": "Portland, Oregon",
      "prior_treatments": "carboplatin and paclitaxel",
      "performance_status": "short of breath, fatigued"
    },
    "trials": [
      {
        "nct_id": "NCT-DEMO-001",
        "title": "Phase II Carboplatin + Novel Immunotherapy in Stage III NSCLC",
        "phase": "II",
        "status": "Recruiting",
        "locations": ["Portland, OR"]
      }
    ],
    "note": "LLM quota exceeded in production; returning demo data instead of live model output."
    }

## Current Features
- End-to-end working demo (frontend + backend)
- OpenAI-powered extraction (gracefully degrades if quota reached)
- Fetches and filters trials from ClinicalTrials.gov
- CORS-secured API (Render ⇆ Vercel)
- Clear dark UI with transcript input + structured output

## Future Improvements
- Enable real OpenAI completions once billing credits are active
- Add trial ranking explanation (e.g., “matched by cancer type + location”)
- Add pagination + “save trial” feature
- Expand LLM prompt to include comorbidities, biomarkers, or eligibility
- Authentication and patient session management
- Optional fine-tuned LLM for medical entity extraction

## Screenshots
**Frontend UI**

**Backend API (Postmand)**
``md
![Alt text] (docs/BackendAPI(Postman).png)


