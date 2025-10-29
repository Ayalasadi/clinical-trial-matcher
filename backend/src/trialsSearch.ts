//backend/src/trialsSearch.ts
import axios from "axios";
import { PatientData, TrialResult } from "./types";

//tiny helper: try to parse "Portland, OR" -> city + state
function splitLocation(loc?: string) {
  if (!loc) return { city: undefined, state: undefined };
  const parts = loc.split(",").map(p => p.trim());
  return {
    city: parts[0],
    state: parts[1],
  };
}

// crude match scoring
function scoreTrial(trial: TrialResult, patient: PatientData): number {
  let score = 0;

  //+2 if condition matches diagnosis (case-insensitive substring check)
  if (
    patient.diagnosis &&
    trial.conditions.some(c =>
      c.toLowerCase().includes(patient.diagnosis.toLowerCase())
    )
  ) {
    score += 2;
  }

  //+1 if location matches (city or state text appears in trial.locations)
  const { city, state } = splitLocation(patient.location);
  if (trial.locations.length && (city || state)) {
    const locString = trial.locations.join(" | ").toLowerCase();
    if (
      (city && locString.includes(city.toLowerCase())) ||
      (state && locString.includes(state.toLowerCase()))
    ) {
      score += 1;
    }
  }

  //+1 for late-phase trials (II or III)
  if (trial.phase) {
    const phaseLower = trial.phase.toLowerCase();
    if (
      phaseLower.includes("phase ii") ||
      phaseLower.includes("phase iii") ||
      phaseLower.includes("phase 2") ||
      phaseLower.includes("phase 3")
    ) {
      score += 1;
    }
  }

  return score;
}

export async function searchTrials(patientData: PatientData): Promise<TrialResult[]> {
    const conditionQuery = patientData.diagnosis ?? "";
    const { city, state } = splitLocation(patientData.location);
  
    // Build a free-text expression used by the v1 endpoints
    const parts: string[] = [];
    if (conditionQuery) parts.push(conditionQuery);
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (typeof patientData.age === "number") parts.push(`age ${patientData.age}`);
    const expr = parts.join(" ").trim() || "cancer";
  
    let trials: TrialResult[] = [];
  
    // ---- Attempt 1: v1 full_studies (rich nested data) ----
    try {
      const url = "https://classic.clinicaltrials.gov/api/query/full_studies";
      const resp = await axios.get(url, {
        params: { expr, min_rnk: "1", max_rnk: "30", fmt: "json" },
      });
  
      const studies: any[] =
        resp.data?.FullStudiesResponse?.FullStudies?.map((fs: any) => fs.Study) || [];
      console.log("full_studies fetched:", studies.length);
  
      if (studies.length) {
        trials = studies.map((study: any) => {
          const ps = study?.ProtocolSection || {};
          const idMod = ps.IdentificationModule || {};
          const statusMod = ps.StatusModule || {};
          const designMod = ps.DesignModule || {};
          const condMod = ps.ConditionsModule || {};
          const locMod = ps.ContactsLocationsModule || {};
          const descMod = ps.DescriptionModule || {};
  
          const nctId: string = idMod.NCTId || "N/A";
          const title: string = idMod.BriefTitle || "Untitled";
          const status: string = statusMod.OverallStatus || "Unknown";
  
          const phasesArr = designMod.Phases
            ? Array.isArray(designMod.Phases) ? designMod.Phases : [designMod.Phases]
            : [];
          const phase: string | null = phasesArr.length ? phasesArr.join(", ") : null;
  
          const conditionsArr = condMod.Conditions
            ? Array.isArray(condMod.Conditions) ? condMod.Conditions : [condMod.Conditions]
            : [];
          const conditions: string[] = conditionsArr.filter(Boolean);
  
          const locsRaw = Array.isArray(locMod.Locations) ? locMod.Locations : [];
          const locations: string[] = locsRaw
            .map((l: any) => [l?.City, l?.State, l?.Country].filter(Boolean).join(", "))
            .filter(Boolean);
  
          const brief_description: string = descMod.BriefSummary || "No description available.";
  
          return {
            nct_id: nctId,
            title,
            phase,
            status,
            conditions,
            locations,
            brief_description,
            url: nctId !== "N/A"
              ? `https://clinicaltrials.gov/study/${encodeURIComponent(nctId)}`
              : "https://clinicaltrials.gov/",
          };
        });
      }
    } catch (e: any) {
      console.error("full_studies failed:", e?.response?.status, e?.response?.data || e?.message);
    }
  
    // ---- Attempt 2: v1 study_fields (lighter) ----
    if (trials.length === 0) {
      try {
        const url = "https://classic.clinicaltrials.gov/api/query/study_fields";
        const v1Fields = [
          "NCTId",
          "BriefTitle",
          "OverallStatus",
          "Phase",
          "Condition",
          "LocationCity",
          "LocationState",
          "LocationCountry",
          "BriefSummary",
        ];
        const resp = await axios.get(url, {
          params: {
            expr,
            fields: v1Fields.join(","),
            min_rnk: "1",
            max_rnk: "50",
            fmt: "json",
          },
        });
  
        const sfs: any[] = resp.data?.StudyFieldsResponse?.StudyFields || [];
        console.log("study_fields fetched:", sfs.length);
  
        trials = sfs.map((s: any) => {
          const nct = s.NCTId?.[0] || "N/A";
          const title = s.BriefTitle?.[0] || "Untitled";
          const status = s.OverallStatus?.[0] || "Unknown";
          const phase = s.Phase?.[0] || null;
          const conditions = Array.isArray(s.Condition) ? s.Condition : [];
  
          const cities = s.LocationCity || [];
          const states = s.LocationState || [];
          const countries = s.LocationCountry || [];
          const maxLen = Math.max(cities.length, states.length, countries.length);
          const locations: string[] = [];
          for (let i = 0; i < maxLen; i++) {
            const combined = [cities[i] || "", states[i] || "", countries[i] || ""]
              .filter(Boolean)
              .join(", ");
            if (combined) locations.push(combined);
          }
  
          const brief_description = s.BriefSummary?.[0] || "No description available.";
          return {
            nct_id: nct,
            title,
            phase,
            status,
            conditions,
            locations,
            brief_description,
            url: nct !== "N/A"
              ? `https://clinicaltrials.gov/study/${encodeURIComponent(nct)}`
              : "https://clinicaltrials.gov/",
          };
        });
      } catch (e: any) {
        console.error("study_fields failed:", e?.response?.status, e?.response?.data || e?.message);
      }
    }
  
    // ---- Attempt 3: mock fallback (ensures non-empty trials for demo) ----
    if (trials.length === 0) {
      const dx = patientData.diagnosis || "cancer";
      const loc = patientData.location || "United States";
      trials = [
        {
          nct_id: "NCT-DEMO-001",
          title: `A Study for ${dx}`,
          phase: "Phase 2",
          status: "Recruiting",
          conditions: [dx],
          locations: [loc],
          brief_description: `Mock trial for ${dx} to keep demo responsive while ClinicalTrials.gov is unreachable.`,
          url: "https://clinicaltrials.gov/",
        },
        {
          nct_id: "NCT-DEMO-002",
          title: `Investigational Therapy in ${dx}`,
          phase: "Phase 3",
          status: "Recruiting",
          conditions: [dx],
          locations: [loc],
          brief_description: `Mock late-phase option for ${dx}.`,
          url: "https://clinicaltrials.gov/",
        },
      ];
    }
  
    // ---- Score/sort and return top results (your original logic) ----
    const scored = trials.map(t => ({ ...t, score: scoreTrial(t, patientData) }));
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aRecruit = a.status.toLowerCase().includes("recruit");
      const bRecruit = b.status.toLowerCase().includes("recruit");
      if (aRecruit && !bRecruit) return -1;
      if (!aRecruit && bRecruit) return 1;
      return 0;
    });
    return scored.slice(0, 8);
  }  
