import { useState } from 'react'
import TranscriptInput from './TranscriptInput'
import TrialResults from './TrialResults'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || "";

type MatchResponse = {
  patientData: Record<string, unknown>
  trials: Array<Record<string, unknown>>
}

export default function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<Record<string, unknown> | null>(
    null
  );
  const [trials, setTrials] = useState<Array<Record<string, unknown>> | null>(
    null
  );

  async function handleFindTrials(transcript: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Request failed with ${res.status}`)
      }
      const data = (await res.json()) as MatchResponse

      setPatientData(data.patientData ?? null)
      setTrials(data.trials ?? [])
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong while matching trials.'
      setError(message)
      setPatientData(null)
      setTrials(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <header className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Clinical Trial Matcher
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Paste a provider–patient transcript to find actively recruiting trials.
          </p>
        </header>

        {/* PHI disclaimer banner */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
          <strong className="font-medium">Demo only. </strong>
          Do not enter real patient data (no PHI). This tool is for showcasing
          clinical trial matching.
        </div>

        {/* Transcript input + submit */}
        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <TranscriptInput onSubmit={handleFindTrials} loading={loading} />

          {/* Error alert */}
          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              <div className="font-medium">We couldn’t match trials.</div>
              <div className="text-xs text-red-700">
                {error} Please try again.
              </div>
            </div>
          )}
        </section>

        {/* Results */}
        <section className="mb-8">
          <TrialResults
            loading={loading}
            patientData={patientData}
            trials={trials}
          />
        </section>

        {/* Footer */}
        <footer className="mt-10 text-center text-[11px] leading-relaxed text-slate-500">
        © {new Date().getFullYear()} Clinical Trial Matcher. All rights reserved.
        </footer>
      </main>
    </div>
  );
}
