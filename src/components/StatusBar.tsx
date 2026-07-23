import { AlertCircle, CheckCircle2, Circle, LoaderCircle } from 'lucide-react'
import type { DeviceStatus } from '../domain/types'
import { cx } from '../uiStyles'

interface StatusBarProps {
  status: DeviceStatus
  progressRecords: number
  progressTotal: number
  error: string | null
}

const statusText: Record<DeviceStatus, string> = {
  unsupported: 'WebHID unavailable',
  disconnected: 'Disconnected',
  connecting: 'Waiting for device',
  'inspection-only': 'Metadata only · no protocol commands sent',
  'reading-version': 'Reading firmware',
  'reading-keymap': 'Reading keymap',
  'validating-write': 'Checking keymap backup',
  'writing-keymap': 'Writing complete keymap',
  'verifying-keymap': 'Reading keymap back',
  ready: 'Synced',
  error: 'Device error',
}

export function StatusBar({
  status,
  progressRecords,
  progressTotal,
  error,
}: StatusBarProps) {
  const busy = status === 'connecting'
    || status.startsWith('reading-')
    || status === 'validating-write'
    || status === 'writing-keymap'
    || status === 'verifying-keymap'
  const showsRecordProgress = status === 'reading-keymap'
    || status === 'writing-keymap'
    || status === 'verifying-keymap'
  const Icon = status === 'ready'
    ? CheckCircle2
    : status === 'error' || status === 'unsupported'
      ? AlertCircle
      : busy
        ? LoaderCircle
        : Circle
  const statusTone = status === 'ready'
    ? 'text-success'
    : status === 'error' || status === 'unsupported'
      ? 'text-danger'
      : busy || status === 'inspection-only'
        ? 'text-warning'
        : 'text-[#707770]'

  return (
    <footer
      className="flex min-w-0 items-center justify-start gap-4 border-t border-line bg-[#fafbfa] px-3 text-[9px] text-[#707770]"
      data-status-bar
      data-status={status}
    >
      <div className={cx('flex min-w-0 items-center gap-1.5', statusTone)}>
        <Icon
          size={13}
          className={busy ? 'animate-spin [animation-duration:900ms]' : undefined}
        />
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">
          {error ?? statusText[status]}
        </span>
        {showsRecordProgress && (
          <strong className="text-[9px] text-ink">
            {progressRecords}{progressTotal > 0 ? ` / ${progressTotal}` : ''} records
          </strong>
        )}
      </div>
    </footer>
  )
}
