import express from "express";
import { config } from "dotenv";

config(); // load .env

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(express.json({ limit: "1mb" }));

//keep-alive timer so Node doesn't think it can exit
setInterval(() => {
  // no-op
}, 60_000);

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Main endpoint
app.post("/api/match", async (req, res) => {
  console.log("🔎 Received /api/match request");

  try {
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({
        error: "Missing 'transcript' (string) in request body",
      });
    }

    // lazy import so we don't construct OpenAI client at startup
    const { extractPatientData } = await import("./llmExtractor");

    const patientData = await extractPatientData(transcript);

    return res.json({ patientData });
  } catch (err: any) {
    console.error("Error in /api/match:", err?.message || err);
    return res.status(500).json({
      error: "Failed to process transcript",
      details: err?.message || String(err),
    });
  }
});

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

server.on("close", () => {
  console.log("Server closed.");
});
