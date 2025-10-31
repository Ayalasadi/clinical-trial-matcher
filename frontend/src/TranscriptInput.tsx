import { useState } from "react";

type TranscriptInputProps = {
  onSubmit: (transcript: string) => void;
  loading?: boolean;
};

export default function TranscriptInput({
  onSubmit,
  loading = false,
}: TranscriptInputProps) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    onSubmit(text.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-[12px] font-medium text-ds-text-dark tracking-[-0.03em]">
        Clinical Transcript
      </label>

      <textarea
        className="w-full min-h-40 rounded-xl border border-ds-border bg-white p-3 text-[13px] leading-relaxed text-ds-text-dark shadow-sm placeholder:text-ds-text-body/50 focus:border-ds-accent focus:outline-none focus:ring-2 focus:ring-ds-accent/30"
        placeholder="Paste a brief provider–patient note or conversation summary (no real PHI)…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-ds-text-body">
          {text.length} characters
        </span>

        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="inline-flex items-center rounded-pill bg-ds-cta px-4 py-2 text-[13px] font-medium text-ds-cta-text shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? "Matching…" : "Find Trials"}
        </button>
      </div>
    </form>
  );
}
