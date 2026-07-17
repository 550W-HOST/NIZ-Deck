import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Copy,
  SquareTerminal,
  Trash2,
  X,
} from 'lucide-react'
import type { DiagnosticLogEntry } from '../domain/diagnostics'

interface DiagnosticsPanelProps {
  open: boolean
  entries: readonly DiagnosticLogEntry[]
  onClose(): void
  onClear(): void
}

function formatEntry(entry: DiagnosticLogEntry): string {
  const time = entry.timestamp.slice(11, 23)
  const suffix = entry.data === undefined ? '' : ` ${JSON.stringify(entry.data)}`
  return `${time} [${entry.level.toUpperCase()}] [${entry.scope}] ${entry.message}${suffix}`
}

export function DiagnosticsPanel({
  open,
  entries,
  onClose,
  onClear,
}: DiagnosticsPanelProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [entries, open])

  if (!open) return null

  const copyLogs = async (): Promise<void> => {
    await navigator.clipboard.writeText(entries.map(formatEntry).join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <section className="diagnostics-panel" aria-label="Diagnostics log">
      <header>
        <div>
          <SquareTerminal size={15} />
          <strong>Diagnostics</strong>
          <span>{entries.length}</span>
        </div>
        <div>
          <button
            type="button"
            onClick={() => void copyLogs()}
            disabled={entries.length === 0}
            aria-label="Copy diagnostics"
            title="Copy diagnostics"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={onClear}
            disabled={entries.length === 0}
            aria-label="Clear diagnostics"
            title="Clear diagnostics"
          >
            <Trash2 size={14} />
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close diagnostics"
            title="Close diagnostics"
          >
            <X size={14} />
          </button>
        </div>
      </header>
      <div className="diagnostics-list" ref={listRef}>
        {entries.length === 0 ? (
          <p>No events</p>
        ) : entries.map((entry) => (
          <div className={`log-entry log-entry--${entry.level}`} key={entry.id}>
            <time>{entry.timestamp.slice(11, 23)}</time>
            <span>{entry.level}</span>
            <strong>{entry.scope}</strong>
            <p>{entry.message}</p>
            {entry.data !== undefined && <code>{JSON.stringify(entry.data)}</code>}
          </div>
        ))}
      </div>
    </section>
  )
}
