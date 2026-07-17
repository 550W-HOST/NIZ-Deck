import { AlertCircle, CheckCircle2, Circle, LoaderCircle } from 'lucide-react'
import type { DeviceStatus } from '../domain/types'

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

  return (
    <footer className={`status-bar status-bar--${status}`}>
      <div>
        <Icon size={13} className={busy ? 'is-spinning' : ''} />
        <span>{error ?? statusText[status]}</span>
        {showsRecordProgress && (
          <strong>
            {progressRecords}{progressTotal > 0 ? ` / ${progressTotal}` : ''} records
          </strong>
        )}
      </div>
      <span>WebHID · Report ID 0 · 64 bytes</span>
    </footer>
  )
}
