import { useState } from 'react'
import TranscriptInput from './TranscriptInput'
import TrialResults from './TrialResults'
import './App.css'

type MatchResponse = {
  patientData: Record<string, unknown>
  trials: Array<Record<string, unknown>>
}

export default function App() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [patientData, setPatientData] = useState<Record<string, unknown> | null>(null)
  const [trials, setTrials] = useState<Array<Record<string, unknown>> | null>(null)

  async function handleFindTrials(transcript: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/match', {
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
      const message = e instanceof Error ? e.message : 'Unknown error'
      setError(message)
      setPatientData(null)
      setTrials(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-100">Clinical Trial Matcher</h1>
        <p className="mt-1 text-sm text-gray-400">Paste a clinical transcript to find matching trials.</p>
      </header>

      <section className="mb-8 rounded-xl border border-gray-800 bg-gray-950 p-6">
        <TranscriptInput onSubmit={handleFindTrials} loading={loading} />
        {error && (
          <div className="mt-3 rounded-md border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </section>

      <section className="mb-8">
        <TrialResults patientData={patientData} trials={trials} />
      </section>

      <footer className="mt-10 text-center text-xs text-gray-500">
        Built with React, TypeScript, and Tailwind CSS
      </footer>
    </div>
  )
}
