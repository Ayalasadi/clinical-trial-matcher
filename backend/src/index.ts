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
  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({
        error: "Missing 'transcript' (string) in request body",
      });
    }

    //1. Extract patient data using LLM
    const patientData = await extractPatientData(transcript);

    //2. Search clinical trials using extracted data
    const trials = await searchTrials(patientData);

    //3. Return both
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

//finally start server
const PORT = process.env.PORT ? Number(process.env.PORT) : 5050;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on :${PORT}`);
});
