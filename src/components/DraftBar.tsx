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
    <aside
      className="flex min-w-0 items-center justify-between gap-4 border-t border-[#c6b281] bg-[#fffaf0] px-3 max-[520px]:gap-2 max-[520px]:px-2"
      aria-label="Keymap draft controls"
    >
      <div
        className="flex min-w-0 items-center gap-2 text-[#6f5317]"
        data-change-count={changeCount}
        role="status"
      >
        <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] bg-warning px-[5px] text-[10px] font-[750] text-white">
          {changeCount}
        </span>
        <strong className="overflow-hidden text-[10px] text-ellipsis whitespace-nowrap max-[520px]:hidden">
          {changeCount === 1 ? 'change' : 'changes'} pending
        </strong>
      </div>
      <div className="flex min-w-0 flex-none items-center gap-1.5">
        <button
          className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-[5px] border border-[#c7b98f] bg-white p-0 text-[#5d543e] enabled:hover:border-[#aa996e] enabled:hover:bg-[#f7f1e3] disabled:cursor-default disabled:opacity-[0.38]"
          type="button"
          disabled={!canUndo}
          onClick={onUndo}
          aria-label="Undo draft change"
          title="Undo draft change"
        >
          <Undo2 size={15} />
        </button>
        <button
          className="inline-flex size-[30px] cursor-pointer items-center justify-center rounded-[5px] border border-[#c7b98f] bg-white p-0 text-[#5d543e] enabled:hover:border-[#aa996e] enabled:hover:bg-[#f7f1e3] disabled:cursor-default disabled:opacity-[0.38]"
          type="button"
          disabled={!canRedo}
          onClick={onRedo}
          aria-label="Redo draft change"
          title="Redo draft change"
        >
          <Redo2 size={15} />
        </button>
        <button
          className="inline-flex h-[30px] cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border border-[#c7b98f] bg-white px-[9px] text-[9px] font-[650] text-[#5d543e] enabled:hover:border-[#aa996e] enabled:hover:bg-[#f7f1e3] disabled:cursor-default disabled:opacity-[0.42] max-[520px]:w-[30px] max-[520px]:p-0"
          type="button"
          onClick={onReset}
          disabled={changeCount === 0}
          aria-label="Reset all draft changes"
          title="Reset all draft changes"
        >
          <RotateCcw size={14} />
          <span className="max-[520px]:hidden">Reset all</span>
        </button>
        <button
          className="inline-flex h-[30px] cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border border-[#245587] bg-action px-[9px] text-[9px] font-[650] text-white enabled:hover:border-[#1d4770] enabled:hover:bg-[#27588f] disabled:cursor-default disabled:opacity-[0.42] max-[520px]:px-2"
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
