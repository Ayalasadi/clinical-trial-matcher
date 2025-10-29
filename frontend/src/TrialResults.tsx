type TrialResultsProps = {
  patientData: Record<string, unknown> | null
  trials: Array<Record<string, unknown>> | null
}

function formatLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

export default function TrialResults({ patientData, trials }: TrialResultsProps) {
  const hasResults = !!patientData || (trials && trials.length > 0)

  if (!hasResults) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-gray-300">
        No results yet. Submit a transcript to see patient info and matches.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {patientData && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-100">Patient Info</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.entries(patientData).map(([key, value]) => (
              <div key={key} className="rounded-md border border-gray-800 bg-gray-900 p-3">
                <div className="text-xs uppercase tracking-wide text-gray-400">{formatLabel(key)}</div>
                <div className="mt-1 text-sm text-gray-100">
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {trials && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-gray-100">Trial Matches ({trials.length})</h2>
          {trials.length === 0 ? (
            <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 text-gray-300">No matching trials found.</div>
          ) : (
            <ul className="space-y-4">
              {trials.map((trial, idx) => {
                const title = (trial.title || trial.name || trial.nctId || `Trial ${idx + 1}`) as string
                const summary = (trial.summary || trial.description || '') as string
                const phase = (trial.phase || trial.trialPhase || '') as string
                const status = (trial.status || trial.recruitmentStatus || '') as string
                const location = (trial.location || trial.locations || trial.city || '') as string
                const url = (trial.url || trial.link || '') as string
                return (
                  <li key={idx} className="rounded-lg border border-gray-800 bg-gray-900 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-semibold text-gray-100">{title}</h3>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400">
                          {phase && <span>Phase: <span className="text-gray-200">{String(phase)}</span></span>}
                          {status && <span>Status: <span className="text-gray-200">{String(status)}</span></span>}
                          {location && <span>Location: <span className="text-gray-200">{String(location)}</span></span>}
                        </div>
                      </div>
                      {url && (
                        <a
                          href={String(url)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-indigo-500"
                        >
                          View
                        </a>
                      )}
                    </div>
                    {summary && (
                      <p className="mt-3 text-sm leading-6 text-gray-300">{String(summary)}</p>
                    )}
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-gray-400">Raw data</summary>
                      <pre className="mt-2 overflow-auto rounded-md bg-black/40 p-3 text-xs text-gray-200">{JSON.stringify(trial, null, 2)}</pre>
                    </details>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}


