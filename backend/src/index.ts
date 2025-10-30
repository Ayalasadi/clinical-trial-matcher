import express from "express";
import { config } from "dotenv";
import cors from "cors";
import { extractPatientData } from "./llmExtractor";
import { searchTrials } from "./trialsSearch";

config(); //load .env

const app = express();
app.use(cors({ origin: true, credentials: false }));
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
app.listen(PORT, '0.0.0.0', () => console.log(`API running on :${PORT}`));

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
  //console.log("🔎 Received /api/match request");

  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({
        error: "Missing 'transcript' (string) in request body",
      });
    }

    // 1. Extract patient data using LLM
    const patientData = await extractPatientData(transcript);

    // 2. Search clinical trials using extracted data
    const trials = await searchTrials(patientData);

    // 3. Return both
    return res.json({
      patientData,
      trials,
    });
  } catch (err: any) {
    console.error("Error in /api/match:", err?.message || err);
    
    return res.status(500).json({
      error: "Failed to match clinical trials",
      details: err?.message || "Unknown error",
    });
  }
});

// single listener already configured above binding to 0.0.0.0 for Render
