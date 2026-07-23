import { useEffect, useState } from 'react'
import { Download, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import {
  cx,
  dialogBackdropClass,
  dialogButtonClass,
  dialogCloseButtonClass,
  dialogDangerButtonClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogHeaderTitleClass,
  dialogPanelClass,
} from '../uiStyles'

interface WriteVerificationDialogProps {
  open: boolean
  deviceName: string
  firmware: string | null
  recordCount: number
  recoveryRequired: boolean
  onClose(): void
  onDownloadBackup(): void
  onConfirm(): void
}

export function WriteVerificationDialog({
  open,
  deviceName,
  firmware,
  recordCount,
  recoveryRequired,
  onClose,
  onDownloadBackup,
  onConfirm,
}: WriteVerificationDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (!open) return
    setAcknowledged(false)
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
          'max-h-[calc(100svh-36px)] w-[min(100%,500px)] overflow-auto',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-dialog-title"
      >
        <header className={cx(dialogHeaderClass, 'min-h-[50px]')}>
          <div className={dialogHeaderTitleClass}>
            <ShieldCheck size={18} />
            <h2 className="m-0 text-[15px] font-bold text-ink" id="write-dialog-title">
              {recoveryRequired ? 'Restore and verify keymap' : 'Verify keymap write'}
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

        <div className="px-[18px] pt-[18px] pb-4">
          <div className="flex items-center gap-2 text-xs text-warning">
            <TriangleAlert size={17} />
            <strong>Complete keymap rewrite</strong>
          </div>
          <p className="mt-[10px] mb-4 text-[11px] leading-[1.55] text-ink-muted">
            This sends <code className="font-mono text-[10px] leading-none font-semibold text-[#4f5751]">0xF1</code>, rewrites all {recordCount} records unchanged,
            commits with <code className="font-mono text-[10px] leading-none font-semibold text-[#4f5751]">0xF6</code>, then reads every record back.
          </p>
          <dl className="m-0 border-y border-line py-3">
            <div className="flex items-center justify-between gap-[18px]">
              <dt className="text-[10px] text-ink-muted">Device</dt>
              <dd className="m-0 min-w-0 overflow-hidden text-right font-mono text-[10px] leading-[1.3] font-semibold text-ellipsis whitespace-nowrap">{deviceName}</dd>
            </div>
            <div className="mt-2 flex items-center justify-between gap-[18px]">
              <dt className="text-[10px] text-ink-muted">Firmware</dt>
              <dd className="m-0 min-w-0 overflow-hidden text-right font-mono text-[10px] leading-[1.3] font-semibold text-ellipsis whitespace-nowrap">{firmware ?? 'Unavailable'}</dd>
            </div>
            <div className="mt-2 flex items-center justify-between gap-[18px]">
              <dt className="text-[10px] text-ink-muted">Backup</dt>
              <dd className="m-0 min-w-0 overflow-hidden text-right font-mono text-[10px] leading-[1.3] font-semibold text-ellipsis whitespace-nowrap">{recordCount} records</dd>
            </div>
          </dl>

          <label className="mt-[15px] grid cursor-pointer grid-cols-[16px_minmax(0,1fr)] items-start gap-[9px] text-[10px] leading-[1.45] text-ink-muted">
            <input
              className="m-0 size-[14px] accent-action"
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>I will keep the keyboard connected until read-back verification finishes.</span>
          </label>
        </div>

        <footer className={cx(dialogFooterClass, 'flex-wrap py-[11px]')}>
          <button className={dialogButtonClass} type="button" onClick={onDownloadBackup}>
            <Download size={15} />
            Download backup
          </button>
          <button className={dialogButtonClass} type="button" onClick={onClose}>Cancel</button>
          <button
            className={cx(
              dialogDangerButtonClass,
              'max-[700px]:order-3 max-[700px]:w-full',
            )}
            type="button"
            disabled={!acknowledged}
            onClick={onConfirm}
          >
            <ShieldCheck size={15} />
            Write and verify
          </button>
        </footer>
      </section>
    </div>
  )
}
