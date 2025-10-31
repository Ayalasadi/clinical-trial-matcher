import { useEffect, useState } from "react";
import TranscriptInput from "./TranscriptInput";
import TrialResults from "./TrialResults";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "";

type MatchResponse = {
  patientData: Record<string, unknown>;
  trials: Array<Record<string, unknown>>;
};

// Small hook-y timer component
function RecorderTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // format mm:ss
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const mm = mins < 10 ? `0${mins}` : `${mins}`;
  const ss = secs < 10 ? `0${secs}` : `${secs}`;

  return (
    <span className="text-[10px] text-ds-text-body tabular-nums">
      {mm}:{ss}
    </span>
  );
}

//pulsing mic / pause button circle
function MicBubble() {
  return (
    <div className="relative mx-auto mt-3 flex h-8 w-8 items-center justify-center rounded-full border-4 border-ds-border text-[10px] font-semibold text-ds-text-dark">
      {/* pause icon bars */}
      <span className="relative z-10">||</span>
      {/* pulse ring */}
      <span className="absolute inset-0 rounded-full border-4 border-ds-accent/30 animate-ping"></span>
    </div>
  );
}

function RecorderFrame({
  variant,
}: {
  variant: "mobile" | "desktop";
}) {
  // shared UI, slight layout tweaks per variant
  return (
    <div
      className={
        variant === "mobile"
          ? "mt-4 w-32 rounded-2xl border border-ds-border bg-white shadow-ds-card ring-1 ring-black/5 lg:hidden"
          : "w-32 rounded-2xl border border-ds-border bg-white shadow-ds-card ring-1 ring-black/5 hidden lg:block"
      }
    >
      <div className="flex items-center justify-between border-b border-ds-border bg-gray-50 px-3 py-2 text-[10px] text-ds-text-body">
        <span className="font-medium text-ds-text-dark">Recording</span>
        <RecorderTimer />
      </div>
      <div className="p-3">
        <div className="flex h-12 items-center justify-center rounded-lg bg-white text-[10px] font-medium text-ds-text-body ring-1 ring-ds-border shadow-inner">
          live audio
        </div>
        <MicBubble />
      </div>
    </div>
  );
}

// mobile inline version
function MobileRecorder() {
  return <RecorderFrame variant="mobile" />;
}

// desktop floating version, positioned lower/right of the gradient card
function DesktopRecorder() {
  return (
    <div className="hidden lg:block lg:absolute lg:-bottom-12 lg:-right-10">
      <RecorderFrame variant="desktop" />
    </div>
  );
}

//lightweight editable form for patient data
function EditablePatientForm({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  function handleFieldChange(key: string, newVal: string) {
    const updated = { ...value, [key]: newVal };
    onChange(updated);
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Object.entries(value).map(([key, val]) => (
        <div key={key} className="flex flex-col text-[12px]">
          <label className="mb-1 font-medium text-ds-text-dark capitalize">
            {key}
          </label>
          <input
            className="rounded-lg border border-ds-border bg-white px-3 py-2 text-[12px] text-ds-text-dark shadow-inner outline-none focus:ring-2 focus:ring-ds-accent/50"
            value={val === undefined || val === null ? "" : String(val)}
            onChange={(e) => handleFieldChange(key, e.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [rerunLoading, setRerunLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<Record<string, unknown> | null>(
    null
  );

  //editable copy that clinician can correct
  const [editedPatientData, setEditedPatientData] = useState<
    Record<string, unknown> | null
  >(null);
  const [trials, setTrials] = useState<Array<Record<string, unknown>> | null>(
    null
  );

  async function handleFindTrials(transcript: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }
      const data = (await res.json()) as MatchResponse;

      setPatientData(data.patientData ?? null);

      // Initialize editable copy to same data
      setEditedPatientData(data.patientData ?? null);

      setTrials(data.trials ?? []);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Something went wrong while matching trials.";
      setError(message);
      setPatientData(null);
      setEditedPatientData(null);
      setTrials(null);
    } finally {
      setLoading(false);
    }
  }

  // SECOND CALL (corrected form -> new trials, NO LLM)
  async function handleRerunWithEdits() {
    if (!editedPatientData) return;
    setRerunLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/matchFromPatientData`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientData: editedPatientData }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed with ${res.status}`);
      }

      // backend returns { trials }
      const data = await res.json();
      setTrials(data.trials ?? []);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Re-run failed.";
      setError(message);
    } finally {
      setRerunLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-ds-text-dark flex flex-col">
      {/* Top announcement bar */}
      <div className="w-full bg-black text-white text-[11px] leading-tight">
        <div className="mx-auto max-w-7xl px-4 py-2 text-center">
          <span className="font-medium">
            Clinical Trial Matcher · Demo only · Not for clinical decision-making
          </span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-12 md:py-16 lg:py-20">
        {/* HERO */}
        <section className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start">
          {/* LEFT SIDE */}
          <div className="max-w-xl">
            {/* Logo / product name row */}
            <div className="flex items-center gap-2 mb-6">
              <div className="font-semibold text-[13px] text-ds-text-dark tracking-[-0.03em]">
                Clinical Trial Matcher
              </div>
              <div className="h-4 w-px bg-gray-300" />
              <div className="text-[12px] text-ds-text-body">
                LLM-Assisted Intake
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-ds-text-dark sm:text-5xl mb-6">
              From transcripts to trial candidates.
              <br />
              <span className="text-ds-accent">In one step.</span>
            </h1>

            {/* Body copy */}
            <p className="text-base leading-relaxed text-ds-text-body max-w-md mb-8">
              Paste part of a provider–patient conversation. The tool uses an
              LLM to pull out key clinical details: diagnosis, stage, age,
              location, prior treatment, then looks up currently enrolling
              trials from ClinicalTrials.gov that match.
            </p>

            {/* CTA + inline reassurance */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-10">
              <button
                className="inline-flex items-center justify-center rounded-pill bg-ds-cta px-5 py-2.5 text-sm font-medium text-ds-cta-text shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:opacity-90 transition"
                onClick={() => {
                  const el = document.getElementById("matcher-card");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                  }
                }}
              >
                Try the matcher
              </button>

              <div className="text-[12px] leading-snug text-ds-text-body">
                Not for clinical decisions. Do not include PHI.{" "}
                <br className="hidden sm:block" />
                Backed by ClinicalTrials.gov data.
              </div>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative lg:pl-8 lg:self-start">
            {/* gradient / form card */}
            <div
              id="matcher-card"
              className="relative overflow-hidden rounded-3xl shadow-ds-card ring-1 ring-[rgba(0,0,0,0.06)] bg-gradient-to-b from-ds-grad-top to-ds-grad-bottom"
            >
              <div className="relative p-6 md:p-8 pb-16 md:pb-20">
                {/* inner white card with border */}
                <div className="rounded-2xl bg-ds-surface border border-ds-border shadow-sm p-6 md:p-6 relative">
                  {/* tiny header */}
                  <div className="text-[11px] font-medium text-ds-text-dark mb-4 tracking-[-0.03em]">
                    Clinical Transcript Input
                  </div>

                  <TranscriptInput
                    onSubmit={handleFindTrials}
                    loading={loading}
                  />

                  {/* error alert inline */}
                  {error && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-900">
                      <div className="font-medium">
                        We couldn't match trials.
                      </div>
                      <div className="mt-1 text-[11px] text-red-700">
                        {error}
                      </div>
                    </div>
                  )}
                </div>

                {/* mobile recorder below form */}
                <MobileRecorder />
              </div>
            </div>

            {/* desktop floating recorder, offset from bottom-right */}
            <DesktopRecorder />
          </div>
        </section>

        {/* RESULTS SECTION */}
        <section className="mt-20">
          <div className="rounded-2xl border border-ds-border bg-ds-surface p-6 md:p-8 shadow-sm space-y-10">
            {/* --- NEW: Editable clinician review block --- */}
            {editedPatientData && (
              <div className="rounded-xl border border-ds-border bg-white p-4 md:p-6 shadow-sm">
                <div className="mb-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <div className="text-[12px] font-semibold text-ds-text-dark tracking-[-0.03em]">
                      Patient Profile (review & correct)
                    </div>
                    <div className="mt-1 text-[11px] leading-snug text-ds-text-body">
                      The LLM extracted this from the transcript. Edit any field
                      before running the final match.
                    </div>
                  </div>

                  <button
                    className="self-start inline-flex items-center justify-center rounded-lg bg-ds-cta px-3 py-2 text-[12px] font-medium text-ds-cta-text shadow hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleRerunWithEdits}
                    disabled={rerunLoading}
                  >
                    {rerunLoading
                      ? "Re-running…"
                      : "Re-run match with corrected info"}
                  </button>
                </div>

                <EditablePatientForm
                  value={editedPatientData}
                  onChange={setEditedPatientData}
                />

                <p className="mt-3 text-[11px] leading-snug text-ds-text-body">
                  This is how clinicians actually work with AI in practice:
                  AI drafts, clinician verifies, system re-queries using the
                  verified record.
                </p>
              </div>
            )}

            {/* Trials block (what you already had) */}
            <div className="rounded-xl border border-ds-border bg-white p-4 md:p-6 shadow-sm">
              <TrialResults
                loading={loading || rerunLoading}
                patientData={editedPatientData ?? patientData}
                trials={trials}
              />
            </div>
          </div>

          {/* FOOTER */}
          <footer className="text-center text-[11px] leading-relaxed text-ds-text-body mt-20">
            © {new Date().getFullYear()} Clinical Trial Matcher. All rights
            reserved.
          </footer>
        </section>
      </main>
    </div>
  );
}
