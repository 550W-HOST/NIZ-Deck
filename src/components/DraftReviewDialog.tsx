import { useEffect } from 'react'
import { ArrowRight, ClipboardCheck, RotateCcw, ShieldAlert, X } from 'lucide-react'
import type { DraftAssignmentChange } from '../domain/keymapDraft'
import type { KeyboardLayout } from '../domain/keyboardLayout'
import { actionLabel, layerName } from '../domain/formatters'
import { physicalKeyAt } from '../data/keyboardLayouts'
import {
  cx,
  dialogBackdropClass,
  dialogButtonClass,
  dialogCloseButtonClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogHeaderTitleClass,
  dialogPanelClass,
  dialogPrimaryButtonClass,
} from '../uiStyles'

interface DraftReviewDialogProps {
  open: boolean
  changes: readonly DraftAssignmentChange[]
  layout: KeyboardLayout
  onClose(): void
  onReset(): void
}

export function DraftReviewDialog({
  open,
  changes,
  layout,
  onClose,
  onReset,
}: DraftReviewDialogProps) {
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) return null

  return (
    <div
      className={dialogBackdropClass}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className={cx(
          dialogPanelClass,
          'grid max-h-[calc(100svh-36px)] w-[min(100%,620px)] grid-rows-[52px_minmax(0,1fr)_54px]',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-review-title"
      >
        <header className={dialogHeaderClass}>
          <div className={dialogHeaderTitleClass}>
            <ClipboardCheck size={18} />
            <h2
              className="m-0 overflow-hidden text-[15px] font-bold text-ellipsis whitespace-nowrap text-ink"
              id="draft-review-title"
            >
              Review keymap draft
            </h2>
          </div>
          <button
            className={dialogCloseButtonClass}
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 min-w-0 overflow-auto">
          <div className="grid grid-cols-[20px_minmax(0,1fr)] items-start gap-[9px] border-b border-[#e7d7ac] bg-warning-soft px-4 py-[13px] text-warning">
            <ShieldAlert size={17} />
            <div className="min-w-0">
              <strong className="block text-[10px]">Draft only</strong>
              <span className="mt-[3px] block text-[9px] leading-[1.4] text-[#775f2f]">
                Edited records remain local until protocol encoding is verified.
              </span>
            </div>
          </div>

          <div className="px-4">
            {changes.map((change) => (
              <div
                className="grid min-w-0 grid-cols-[110px_minmax(0,1fr)] items-center gap-[18px] border-b border-line py-[11px] last:border-b-0 max-[520px]:grid-cols-[minmax(0,1fr)] max-[520px]:gap-[7px]"
                key={`${change.layer}:${change.position}`}
              >
                <div className="min-w-0">
                  <strong className="block overflow-hidden text-[11px] text-ellipsis whitespace-nowrap">
                    {physicalKeyAt(layout, change.position)?.label ?? `#${change.position}`}
                  </strong>
                  <span className="mt-0.5 block text-[8px] text-ink-faint">
                    {layerName(change.layer)}
                  </span>
                </div>
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_14px_minmax(0,1fr)] items-center gap-[7px]">
                  <span className="col-start-1 min-w-0 overflow-hidden text-[9px] text-ellipsis whitespace-nowrap text-ink-muted">
                    {actionLabel(change.original)}
                  </span>
                  <ArrowRight className="col-start-2 text-ink-faint" size={11} />
                  <strong className="col-start-3 min-w-0 overflow-hidden text-[9px] text-ellipsis whitespace-nowrap text-action">
                    {actionLabel(change.assignment)}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className={dialogFooterClass}>
          <button
            className={dialogButtonClass}
            type="button"
            onClick={() => {
              onReset()
              onClose()
            }}
          >
            <RotateCcw size={14} />
            Reset all
          </button>
          <button
            className={dialogPrimaryButtonClass}
            type="button"
            onClick={onClose}
          >
            Continue editing
          </button>
        </footer>
      </section>
    </div>
  )
}
