type TrialResultsProps = {
  loading: boolean;
  patientData: Record<string, unknown> | null;
  trials: Array<Record<string, unknown>> | null;
};

function formatLabel(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}

export default function TrialResults({
  loading,
  patientData,
  trials,
}: TrialResultsProps) {
  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-ds-border border-t-ds-accent mb-4" />
        <div className="text-sm font-medium text-ds-text-dark">
          Matching trials…
        </div>
        <div className="text-[12px] text-ds-text-body mt-1 leading-snug max-w-sm">
          Extracting patient details and searching currently enrolling trials.
        </div>
      </div>
    );
  }

  // Empty state
  const hasResults = !!patientData || (trials && trials.length > 0);
  if (!hasResults) {
    return (
      <div className="text-sm text-ds-text-body text-center leading-relaxed">
        No results yet. Submit a transcript to see patient info and trial
        matches.
      </div>
    );
  }

  // Populated state
  return (
    <div>
      {patientData && (
        <div className="mb-8">
          <h2 className="text-ds-text-dark font-semibold text-base tracking-[-0.03em] mb-4">
            Patient Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] leading-relaxed">
            {Object.entries(patientData).map(([key, value]) => (
              <div key={key}>
                <div className="text-[11px] text-ds-text-body uppercase tracking-wide">
                  {formatLabel(key)}
                </div>
                <div className="text-ds-text-dark font-medium mt-1 text-[13px] leading-snug">
                  {typeof value === "object"
                    ? JSON.stringify(value, null, 2)
                    : String(value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {trials && (
        <div className={patientData ? "mt-8" : ""}>
          <h2 className="text-ds-text-dark font-semibold text-base tracking-[-0.03em] mb-4">
            Trial Matches ({trials.length})
          </h2>

          {trials.length === 0 ? (
            <div className="text-sm text-ds-text-body text-center leading-relaxed">
              No matching trials found.
            </div>
          ) : (
            <div>
              {trials.map((trial, idx) => {
                const title = (trial.title ||
                  trial.name ||
                  trial.nctId ||
                  `Trial ${idx + 1}`) as string;
                const summary = (trial.summary ||
                  trial.description ||
                  "") as string;
                const phase = (trial.phase ||
                  trial.trialPhase ||
                  "") as string;
                const status = (trial.status ||
                  trial.recruitmentStatus ||
                  "") as string;
                const location = (trial.location ||
                  trial.locations ||
                  trial.city ||
                  "") as string | string[];
                const url = (trial.url || trial.link || "") as string;
                const reasons = (trial.reasons || []) as string[];

                // location could be string or array
                let firstLocation = "";
                if (typeof location === "string") {
                  firstLocation = location;
                } else if (Array.isArray(location) && location.length > 0) {
                  firstLocation = String(location[0]);
                }

                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-ds-border bg-ds-surface p-4 shadow-sm mb-4"
                  >
                    {url ? (
                      <a
                        href={String(url)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[14px] font-semibold leading-snug text-ds-text-dark hover:opacity-80 block tracking-[-0.03em]"
                      >
                        {title}
                      </a>
                    ) : (
                      <div className="text-[14px] font-semibold leading-snug text-ds-text-dark tracking-[-0.03em]">
                        {title}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-[11px] mt-2">
                      {phase && (
                        <span className="rounded-md border border-ds-border bg-white px-2 py-[2px] font-medium text-ds-text-body">
                          {String(phase)}
                        </span>
                      )}
                      {status && (
                        <span className="rounded-md border border-ds-border bg-white px-2 py-[2px] font-medium text-ds-text-body">
                          {String(status)}
                        </span>
                      )}
                      {firstLocation && (
                        <span className="rounded-md border border-ds-border bg-white px-2 py-[2px] font-medium text-ds-text-body">
                          {firstLocation}
                        </span>
                      )}
                    </div>

                    {summary && (
                      <p className="text-[12px] text-ds-text-body leading-relaxed mt-3">
                        {String(summary)}
                      </p>
                    )}

                    {reasons && reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {reasons.map((reason, reasonIdx) => (
                          <span
                            key={reasonIdx}
                            className="rounded-lg border border-green-200 bg-green-50 px-2 py-1 text-[11px] font-medium text-green-700"
                          >
                            {String(reason)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
