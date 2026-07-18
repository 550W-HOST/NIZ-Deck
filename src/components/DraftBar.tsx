import { Eye, Redo2, RotateCcw, Undo2 } from 'lucide-react'

interface DraftBarProps {
  changeCount: number
  canUndo: boolean
  canRedo: boolean
  onUndo(): void
  onRedo(): void
  onReset(): void
  onReview(): void
}

export function DraftBar({
  changeCount,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onReset,
  onReview,
}: DraftBarProps) {
  return (
    <aside className="draft-bar" aria-label="Keymap draft controls">
      <div className="draft-bar-status" role="status">
        <span>{changeCount}</span>
        <strong>{changeCount === 1 ? 'change' : 'changes'} pending</strong>
      </div>
      <div className="draft-bar-actions">
        <button
          className="draft-icon-button"
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo draft change"
          title="Undo draft change"
        >
          <Undo2 size={15} />
        </button>
        <button
          className="draft-icon-button"
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo draft change"
          title="Redo draft change"
        >
          <Redo2 size={15} />
        </button>
        <button
          className="draft-reset-button"
          type="button"
          onClick={onReset}
          disabled={changeCount === 0}
          aria-label="Reset all draft changes"
          title="Reset all draft changes"
        >
          <RotateCcw size={14} />
          <span>Reset all</span>
        </button>
        <button
          className="draft-review-button"
          type="button"
          onClick={onReview}
          disabled={changeCount === 0}
        >
          <Eye size={15} />
          <span>Review</span>
        </button>
      </div>
    </aside>
  )
}
