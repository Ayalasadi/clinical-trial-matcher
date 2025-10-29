import { config } from "dotenv";
import OpenAI from "openai";
import { PatientData } from "./types";

config(); // load .env

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

//toggles mock mode based on .env
const MOCK_MODE = process.env.MOCK_MODE === "true";

/**
 * Prompt template:
 * We instruct the model to ONLY return JSON in our schema.
 */
function buildExtractionPrompt(transcript: string): string {
  return `
You are a medical intake assistant. Extract structured patient oncology data from the conversation transcript below.

Return a JSON object with EXACTLY these keys:
{
  "age": number | null,
  "sex": string | null,
  "diagnosis": string | null,
  "cancer_stage": string | null,
  "location": string | null,
  "prior_treatments": string[],
  "performance_status": string | null
}

Rules:
- Use null if unknown.
- "performance_status" should be ECOG-style text if mentioned (e.g. "ECOG 1").
- "prior_treatments" should be an array of strings of systemic therapies, radiation, surgeries, etc.
- Be concise, no extra keys, no commentary.
- Output ONLY raw JSON, no markdown fences.

Transcript:
"""${transcript}"""
`;
}

/**
 * extractPatientData
 * Takes raw transcript text
 * Returns strongly-typed PatientData
 */
export async function extractPatientData(
  transcript: string
): Promise<PatientData> {

  // ✅ Add this block — short-circuit to mock data in dev mode
  if (MOCK_MODE) {
    console.log("⚙️ MOCK_MODE enabled – returning hardcoded patient data");
    return {
      age: 62,
      sex: "female",
      diagnosis: "non-small cell lung cancer (adenocarcinoma)",
      cancer_stage: "stage IIIA",
      location: "Portland, Oregon",
      prior_treatments: [
        "carboplatin",
        "paclitaxel",
        "concurrent chemoradiation",
        "radiation therapy"
      ],
      performance_status: "ECOG 1",
    };
  }

  // --- Normal LLM mode below ---
  const prompt = buildExtractionPrompt(transcript);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0,
  });

  // Grab the model's reply text
  const rawText = completion.choices?.[0]?.message?.content ?? "";

  // Try to parse JSON. If the model wrapped it in ```json ... ``` we strip that first.
  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    const cleaned = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    parsed = JSON.parse(cleaned);
  }

  // Normalize to PatientData
  const result: PatientData = {
    age: parsed.age ?? null,
    sex: parsed.sex ?? null,
    diagnosis: parsed.diagnosis ?? null,
    cancer_stage: parsed.cancer_stage ?? null,
    location: parsed.location ?? null,
    prior_treatments: Array.isArray(parsed.prior_treatments)
      ? parsed.prior_treatments
      : [],
    performance_status: parsed.performance_status ?? null,
  };

  return result;
}
