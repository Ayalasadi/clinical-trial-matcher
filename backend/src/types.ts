export interface PatientData {
    age: number | null;
    sex: string | null; //"female", "male", etc.
    diagnosis: string | null; //e.g. "non-small cell lung cancer, adenocarcinoma"
    cancer_stage: string | null; //e.g. "stage IIIA"
    location: string | null; //city/state or region
    prior_treatments: string[]; // e.g. ["carboplatin", "paclitaxel", "radiation"]
    performance_status: string | null; //e.g. "ECOG 1"
  }
  