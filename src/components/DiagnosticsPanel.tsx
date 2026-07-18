import { useEffect, useRef, useState } from 'react'
import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
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

interface PanelResize {
  pointerId: number
  startHeight: number
  startY: number
}

const DEFAULT_PANEL_HEIGHT = 220
const MIN_PANEL_HEIGHT = 120
const RESIZE_STEP = 20

function maxPanelHeight(panel: HTMLElement): number {
  const containerHeight = panel.parentElement?.getBoundingClientRect().height
    ?? window.innerHeight
  const headerHeight = document
    .querySelector<HTMLElement>('.app-header')
    ?.getBoundingClientRect().height ?? 0
  const statusHeight = document
    .querySelector<HTMLElement>('.status-bar')
    ?.getBoundingClientRect().height ?? 0
  const viewportContentHeight = window.innerHeight - headerHeight - statusHeight
  const availableHeight = Math.min(containerHeight, viewportContentHeight)

  return Math.max(MIN_PANEL_HEIGHT, Math.floor(availableHeight * 0.72))
}

function constrainHeight(height: number, panel: HTMLElement): number {
  return Math.min(Math.max(height, MIN_PANEL_HEIGHT), maxPanelHeight(panel))
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
  const panelRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<PanelResize | null>(null)
  const [copied, setCopied] = useState(false)
  const [resizing, setResizing] = useState(false)
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT)
  const [panelMaxHeight, setPanelMaxHeight] = useState(DEFAULT_PANEL_HEIGHT)

  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [entries, open])

  useEffect(() => {
    if (!open) return

    const keepPanelInBounds = (): void => {
      const panel = panelRef.current
      if (!panel) return

      setPanelMaxHeight(maxPanelHeight(panel))
      setPanelHeight((current) => constrainHeight(current, panel))
    }

    keepPanelInBounds()
    window.addEventListener('resize', keepPanelInBounds)
    return () => window.removeEventListener('resize', keepPanelInBounds)
  }, [open])

  useEffect(() => {
    if (!open || !resizing) return

    const resizePanel = (event: PointerEvent): void => {
      const resize = resizeRef.current
      const panel = panelRef.current
      if (!resize || !panel || resize.pointerId !== event.pointerId) return

      setPanelHeight(constrainHeight(
        resize.startHeight + resize.startY - event.clientY,
        panel,
      ))
    }

    const cancelResize = (): void => {
      resizeRef.current = null
      setResizing(false)
    }

    const finishResize = (event: PointerEvent): void => {
      if (resizeRef.current?.pointerId !== event.pointerId) return
      cancelResize()
    }

    window.addEventListener('pointermove', resizePanel)
    window.addEventListener('pointerup', finishResize)
    window.addEventListener('pointercancel', finishResize)
    window.addEventListener('blur', cancelResize)
    return () => {
      window.removeEventListener('pointermove', resizePanel)
      window.removeEventListener('pointerup', finishResize)
      window.removeEventListener('pointercancel', finishResize)
      window.removeEventListener('blur', cancelResize)
    }
  }, [open, resizing])

  if (!open) return null

  const copyLogs = async (): Promise<void> => {
    await navigator.clipboard.writeText(entries.map(formatEntry).join('\n'))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  const startResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    const panel = panelRef.current
    if (!panel) return

    resizeRef.current = {
      pointerId: event.pointerId,
      startHeight: panel.getBoundingClientRect().height,
      startY: event.clientY,
    }
    setPanelMaxHeight(maxPanelHeight(panel))
    setResizing(true)
    event.preventDefault()
  }

  const resizeWithKeyboard = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const panel = panelRef.current
    if (!panel) return

    let nextHeight: number | null = null
    if (event.key === 'ArrowUp') nextHeight = panelHeight + RESIZE_STEP
    if (event.key === 'ArrowDown') nextHeight = panelHeight - RESIZE_STEP
    if (event.key === 'Home') nextHeight = MIN_PANEL_HEIGHT
    if (event.key === 'End') nextHeight = maxPanelHeight(panel)
    if (nextHeight === null) return

    event.preventDefault()
    setPanelMaxHeight(maxPanelHeight(panel))
    setPanelHeight(constrainHeight(nextHeight, panel))
  }

  return (
    <section
      ref={panelRef}
      className={`diagnostics-panel${resizing ? ' diagnostics-panel--resizing' : ''}`}
      aria-label="Diagnostics log"
      style={{ height: panelHeight }}
    >
      <div
        className="diagnostics-resize-handle"
        role="separator"
        aria-label="Resize diagnostics panel"
        aria-orientation="horizontal"
        aria-valuemin={MIN_PANEL_HEIGHT}
        aria-valuemax={panelMaxHeight}
        aria-valuenow={Math.round(panelHeight)}
        tabIndex={0}
        onKeyDown={resizeWithKeyboard}
        onPointerDown={startResize}
      />
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
