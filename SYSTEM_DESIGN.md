# System Diagram (High-Level Data Flow)

[1] Patient/Provider Transcript (raw text)
    ↓
[2] `/api/match` backend endpoint
    - Calls LLM with extraction prompt
    - Produces `PatientData` (age, sex, diagnosis, cancer_stage, location, prior_treatments, performance_status)
    ↓
[3] ClinicalTrials.gov API fetch
    - Uses diagnosis, location, age to search
    - Ranks trials with simple scoring
    ↓
[4] Response to frontend
    {
      patientData: { ... },
      trials: [ { nct_id, title, phase, status, locations, ... } ]
    }
    ↓
[5] Frontend UI
    - Shows patient summary
    - Shows ranked trial cards with links
    - Explains “why matched”
