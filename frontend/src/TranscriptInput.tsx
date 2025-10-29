import { useState } from 'react'

type TranscriptInputProps = {
  onSubmit: (transcript: string) => void
  loading?: boolean
}

export default function TranscriptInput({ onSubmit, loading = false }: TranscriptInputProps) {
  const [text, setText] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || loading) return
    onSubmit(text.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-medium text-gray-200">Clinical Transcript</label>
      <textarea
        className="w-full min-h-40 rounded-lg border border-gray-700 bg-gray-900 p-3 text-gray-100 shadow-sm placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        placeholder="Paste or type the clinical transcript here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{text.length} characters</span>
        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Finding…' : 'Find Trials'}
        </button>
      </div>
    </form>
  )
}


