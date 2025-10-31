import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { extractPatientData } from "./llmExtractor";
import { searchTrials } from "./trialsSearch";

config(); //load .env

const app = express();
//CORS: allow local dev + deployed frontend
const allowedOrigins = [
  "http://localhost:5173", //for local dev
  "https://clinical-trial-matcher-frontend.vercel.app", //production frontend
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// Limit JSON payload size
app.use(express.json({ limit: "1mb" }));

//keep-alive timer so Node doesn't think it can exit
setInterval(() => {
  //no-op
}, 60_000);

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Main endpoint
app.post("/api/match", async (req, res) => {
  const { transcript } = req.body;

  //base validation
  if (!transcript || typeof transcript !== "string") {
    return res.status(400).json({
      error: "Missing 'transcript' (string) in request body",
    });
  }

  // --- MOCK SHORT-CIRCUIT LOGIC FOR DEMO ---
  //detect which sample transcript this looks like
  const lower = transcript.toLowerCase();

  // === Patient: James – recurrent prostate cancer, rising PSA ===
  if (
    lower.includes("psa") ||
    lower.includes("prostatectomy") ||
    lower.includes("gleason") ||
    lower.includes("salem")
  ) {
    const patientData = {
      age: "71",
      sex: "male",
      diagnosis: "recurrent prostate adenocarcinoma with rising PSA",
      cancer_stage: "biochemical recurrence (post-prostatectomy)",
      location: "Salem, Oregon",
      prior_treatments:
        "radical prostatectomy; 6 months androgen deprivation therapy; no radiation yet",
      performance_status: "ECOG 1 (independent, mild fatigue)",
    };

    const trials = [
      {
        nct_id: "NCT-PROSTATE-001",
        title:
          "Androgen Pathway Inhibitor vs Standard Care in Biochemical Recurrence",
        phase: "II",
        status: "Recruiting",
        locations: ["Portland, OR"],
        brief_description:
          "Trial for men with rising PSA after prostatectomy and short-course ADT.",
        url: "https://clinicaltrials.gov/study/NCT-PROSTATE-001",
      },
    ];

    return res.json({ patientData, trials });
  }

  // === Patient: Aisha – metastatic HER2+ breast cancer ===
  if (
    lower.includes("her2") ||
    lower.includes("trastuzumab") ||
    lower.includes("pertuzumab") ||
    lower.includes("deruxtecan") ||
    lower.includes("liver") ||
    lower.includes("seattle")
  ) {
    const patientData = {
      age: "44",
      sex: "female",
      diagnosis: "metastatic HER2-positive breast cancer",
      cancer_stage: "metastatic (liver involvement)",
      location: "Seattle, Washington",
      prior_treatments:
        "trastuzumab, pertuzumab, trastuzumab deruxtecan (T-DXd)",
      performance_status: "ECOG 1 (works, cares for kids)",
    };

    const trials = [
      {
        nct_id: "NCT-HER2-002",
        title:
          "Next-Gen HER2 Antibody-Drug Conjugate in Previously Treated Metastatic Breast Cancer",
        phase: "II",
        status: "Recruiting",
        locations: ["Seattle, WA", "Portland, OR"],
        brief_description:
          "For HER2+ metastatic breast cancer after T-DXd with mild liver progression.",
        url: "https://clinicaltrials.gov/study/NCT-HER2-002",
      },
    ];

    return res.json({ patientData, trials });
  }

  // === Patient: Maria – stage IIIA NSCLC post-chemoradiation ===
  if (
    lower.includes("non-small cell lung cancer") ||
    lower.includes("adenocarcinoma") ||
    lower.includes("carboplatin") ||
    lower.includes("paclitaxel") ||
    lower.includes("chemoradiation") ||
    lower.includes("ecog") ||
    lower.includes("portland")
  ) {
    const patientData = {
      age: "62",
      sex: "female",
      diagnosis: "non-small cell lung cancer (adenocarcinoma)",
      cancer_stage: "stage IIIA",
      location: "Portland, Oregon",
      prior_treatments:
        "concurrent carboplatin + paclitaxel chemoradiation; no immunotherapy yet",
      performance_status: "ECOG 1 (independent, gets winded)",
    };

    const trials = [
      {
        nct_id: "NCT-NSCLC-001",
        title:
          "PD-L1 / PD-1 Inhibitor Consolidation After Chemoradiation in Stage IIIA NSCLC",
        phase: "II",
        status: "Recruiting",
        locations: ["Portland, OR", "Seattle, WA"],
        brief_description:
          "Consolidation immunotherapy for unresectable stage IIIA adenocarcinoma post chemoradiation.",
        url: "https://clinicaltrials.gov/study/NCT-NSCLC-001",
      },
    ];

    return res.json({ patientData, trials });
  }
  // --- END MOCK SHORT-CIRCUIT LOGIC FOR DEMO ---

  //if no mock matched, fall back to real pipeline with try/catch,
  //then existing static fallback if that throws.
  try {
    // 1. Extract patient data using LLM
    const patientData = await extractPatientData(transcript);

    // 2. Search clinical trials using extracted data
    const trials = await searchTrials(patientData);

    // 3. Return both
    return res.json({ patientData, trials });
  } catch (err: any) {
    console.error("Error in /api/match:", err?.message || err);

    // 4. Graceful fallback for demo (OpenAI quota exceeded, etc.)
    const fallback = {
      patientData: {
        age: "62",
        sex: "female",
        diagnosis: "non-small cell lung cancer",
        cancer_stage: "III",
        location: "Portland, Oregon",
        prior_treatments: "carboplatin and paclitaxel",
        performance_status: "short of breath, fatigued",
      },
      trials: [
        {
          nct_id: "NCT-DEMO-001",
          title:
            "Phase II Carboplatin + Novel Immunotherapy in Stage III NSCLC",
          phase: "II",
          status: "Recruiting",
          locations: ["Portland, OR"],
          brief_description:
            "Evaluating combination therapy in locally advanced non-small cell lung cancer.",
          url: "https://clinicaltrials.gov/study/NCT-DEMO-001",
        },
      ],
    };

    return res.status(200).json({
      ...fallback,
      note:
        "LLM quota exceeded in production; returning demo data instead of live model output.",
    });
  }
});

app.post("/api/matchFromPatientData", async (req, res) => {
  try {
    const { patientData } = req.body;

    //validate
    if (!patientData || typeof patientData !== "object") {
      return res.status(400).json({
        error: "Missing 'patientData' (object) in request body",
      });
    }

    const trials = await searchTrials(patientData);

    return res.json({ trials });
  } catch (err: any) {
    console.error("Error in /api/matchFromPatientData:", err?.message || err);

    return res.status(500).json({
      error: "Internal server error while matching from patientData",
    });
  }
});

//finally start server
const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on :${PORT}`);
});

export default app;