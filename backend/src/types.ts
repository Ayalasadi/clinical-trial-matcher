export interface PatientData {
    age: number;
    sex: string; //"female", "male", etc.
    diagnosis: string; //e.g. "non-small cell lung cancer, adenocarcinoma"
    cancer_stage?: string | null; //e.g. "stage IIIA"
    location?: string; //city/state or region
    prior_treatments: string[]; // e.g. ["carboplatin", "paclitaxel", "radiation"]
    performance_status: string; //e.g. "ECOG 1"
  }
  
  export interface TrialResult {
    nct_id: string;
    title: string;
    phase: string | null;
    status: string;
    conditions: string[];
    locations: string[];
    brief_description: string;
    url: string;
    score?: number; //will add this in ranking
  }