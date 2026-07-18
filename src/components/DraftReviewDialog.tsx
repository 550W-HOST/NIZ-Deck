import { useEffect } from 'react'
import { ClipboardCheck, RotateCcw, ShieldAlert, X } from 'lucide-react'
import type { DraftAssignmentChange } from '../domain/keymapDraft'
import type { KeyboardLayout } from '../domain/keyboardLayout'
import { actionLabel, layerName } from '../domain/formatters'
import { physicalKeyAt } from '../data/keyboardLayouts'

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
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="draft-review-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-review-title"
      >
        <header>
          <div>
            <ClipboardCheck size={18} />
            <h2 id="draft-review-title">Review keymap draft</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </header>

        <div className="draft-review-body">
          <div className="draft-review-safety">
            <ShieldAlert size={17} />
            <div>
              <strong>Draft only</strong>
              <span>Edited records remain local until protocol encoding is verified.</span>
            </div>
          </div>

          <div className="draft-review-list">
            {changes.map((change) => (
              <div className="draft-review-row" key={`${change.layer}:${change.position}`}>
                <div>
                  <strong>{physicalKeyAt(layout, change.position)?.label ?? `#${change.position}`}</strong>
                  <span>{layerName(change.layer)}</span>
                </div>
                <div>
                  <span>{actionLabel(change.original)}</span>
                  <strong>{actionLabel(change.assignment)}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer>
          <button
            className="dialog-button"
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
            className="dialog-button dialog-button--primary"
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
