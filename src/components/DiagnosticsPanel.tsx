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
import { cx } from '../uiStyles'

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
    .querySelector<HTMLElement>('[data-app-header]')
    ?.getBoundingClientRect().height ?? 0
  const statusHeight = document
    .querySelector<HTMLElement>('[data-status-bar]')
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
      className="grid min-w-0 flex-none grid-rows-[8px_35px_minmax(0,1fr)] border-t border-[#bfc5bf] bg-[#171b18] text-[#d8ded9]"
      aria-label="Diagnostics log"
      style={{ height: panelHeight }}
    >
      <div
        className={cx(
          'relative min-w-0 touch-none cursor-ns-resize border-b border-[#303732] bg-[#1e2420] outline-none',
          'after:absolute after:top-[3px] after:left-1/2 after:h-0.5 after:w-[38px] after:-translate-x-1/2 after:rounded-[1px] after:bg-[#59625b] after:content-[\'\']',
          'hover:after:bg-[#9da79f] focus-visible:after:bg-[#9da79f]',
          resizing && 'after:bg-[#9da79f]',
        )}
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
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-[#303732] bg-[#1e2420] py-0 pr-2 pl-3">
        <div className="flex items-center gap-[7px]">
          <SquareTerminal size={15} />
          <strong className="text-[10px]">Diagnostics</strong>
          <span className="min-w-5 rounded-[3px] bg-[#303732] px-[5px] py-0.5 text-center font-mono text-[9px] leading-[1.2] text-[#bac2bc]">
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-[7px]">
          <button
            className="inline-flex size-[27px] cursor-pointer items-center justify-center rounded-[4px] border border-transparent bg-transparent p-0 text-[#aeb7b0] enabled:hover:border-[#444d46] enabled:hover:bg-[#2a312c] enabled:hover:text-white disabled:cursor-default disabled:opacity-[0.35]"
            type="button"
            onClick={() => void copyLogs()}
            disabled={entries.length === 0}
            aria-label="Copy diagnostics"
            title="Copy diagnostics"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            className="inline-flex size-[27px] cursor-pointer items-center justify-center rounded-[4px] border border-transparent bg-transparent p-0 text-[#aeb7b0] enabled:hover:border-[#444d46] enabled:hover:bg-[#2a312c] enabled:hover:text-white disabled:cursor-default disabled:opacity-[0.35]"
            type="button"
            onClick={onClear}
            disabled={entries.length === 0}
            aria-label="Clear diagnostics"
            title="Clear diagnostics"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="inline-flex size-[27px] cursor-pointer items-center justify-center rounded-[4px] border border-transparent bg-transparent p-0 text-[#aeb7b0] enabled:hover:border-[#444d46] enabled:hover:bg-[#2a312c] enabled:hover:text-white disabled:cursor-default disabled:opacity-[0.35]"
            type="button"
            onClick={onClose}
            aria-label="Close diagnostics"
            title="Close diagnostics"
          >
            <X size={14} />
          </button>
        </div>
      </header>
      <div className="min-h-0 overflow-auto px-0 pt-1.5 pb-[10px] font-mono" ref={listRef}>
        {entries.length === 0 ? (
          <p className="mx-3 my-4 text-[10px] text-[#7f8982]">No events</p>
        ) : entries.map((entry) => (
          <div
            className="grid min-w-[760px] grid-cols-[82px_52px_66px_minmax(180px,auto)] items-baseline gap-[7px] px-3 py-[3px] text-[9px] leading-[1.45] text-[#bcc4be] hover:bg-[#202622]"
            key={entry.id}
          >
            <time className="text-[#78837b]">{entry.timestamp.slice(11, 23)}</time>
            <span className={cx(
              'uppercase text-[#8d9890]',
              entry.level === 'success' && 'text-[#79c59c]',
              entry.level === 'warn' && 'text-[#e2b763]',
              entry.level === 'error' && 'text-[#ee8981]',
            )}>
              {entry.level}
            </span>
            <strong className="font-[650] text-[#7ea2c9]">{entry.scope}</strong>
            <p className={cx(
              'm-0 text-[#dbe1dc]',
              entry.level === 'success' && 'text-[#79c59c]',
              entry.level === 'warn' && 'text-[#e2b763]',
              entry.level === 'error' && 'text-[#ee8981]',
            )}>
              {entry.message}
            </p>
            {entry.data !== undefined && (
              <code className="col-start-4 font-[inherit] text-[#89958d] [overflow-wrap:anywhere]">
                {JSON.stringify(entry.data)}
              </code>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
