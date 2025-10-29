# Clinical Trial Matcher

## Goal
LLM-powered demo that:
1. Takes a doctor–patient transcript,
2. Extracts key structured clinical data (diagnosis, age, stage, etc.),
3. Finds relevant recruiting clinical trials from ClinicalTrials.gov,
4. Returns and displays the matches in a simple UI.

## High-level architecture
Transcript → LLM extraction → Structured JSON (patient profile) → ClinicalTrials.gov API query → Ranked trial matches → UI.

## Repo layout
- `backend/`: Node.js + Express API
  - `/api/match` → accepts transcript, returns `{ patientData, trials }`
- `frontend/`: React + Vite + TypeScript UI
  - Textarea for transcript
  - “Find Trials” button
  - Renders patient info + trial cards

## Environment
Create a `.env` file from `.env.example` and fill in `OPENAI_API_KEY`.

## Status
Phase 0 - project scaffolding in progress.