import { useEffect, useState } from 'react'
import { Download, ShieldCheck, TriangleAlert, X } from 'lucide-react'

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
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="write-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="write-dialog-title"
      >
        <header>
          <div>
            <ShieldCheck size={18} />
            <h2 id="write-dialog-title">
              {recoveryRequired ? 'Restore and verify keymap' : 'Verify keymap write'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </header>

        <div className="write-dialog-body">
          <div className="write-warning">
            <TriangleAlert size={17} />
            <strong>Complete keymap rewrite</strong>
          </div>
          <p>
            This sends <code>0xF1</code>, rewrites all {recordCount} records unchanged,
            commits with <code>0xF6</code>, then reads every record back.
          </p>
          <dl>
            <div><dt>Device</dt><dd>{deviceName}</dd></div>
            <div><dt>Firmware</dt><dd>{firmware ?? 'Unavailable'}</dd></div>
            <div><dt>Backup</dt><dd>{recordCount} records</dd></div>
          </dl>

          <label className="write-acknowledgement">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>I will keep the keyboard connected until read-back verification finishes.</span>
          </label>
        </div>

        <footer>
          <button className="dialog-button" type="button" onClick={onDownloadBackup}>
            <Download size={15} />
            Download backup
          </button>
          <button className="dialog-button" type="button" onClick={onClose}>Cancel</button>
          <button
            className="dialog-button dialog-button--danger"
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
