import {
  Download,
  Keyboard,
  RefreshCw,
  ShieldCheck,
  SquareTerminal,
  Unplug,
  Usb,
} from 'lucide-react'
import type { DeviceStatus, NizDeviceInfo } from '../domain/types'

interface AppHeaderProps {
  status: DeviceStatus
  device: NizDeviceInfo | null
  firmware: string | null
  canExport: boolean
  logCount: number
  canRefresh: boolean
  canVerifyWrite: boolean
  recoveryRequired: boolean
  onConnect(): void
  onDisconnect(): void
  onRefresh(): void
  onExport(): void
  onVerifyWrite(): void
  onToggleDiagnostics(): void
}

const busyStatuses: DeviceStatus[] = [
  'connecting',
  'reading-version',
  'reading-keymap',
  'validating-write',
  'writing-keymap',
  'verifying-keymap',
]

export function AppHeader({
  status,
  device,
  firmware,
  canExport,
  logCount,
  canRefresh,
  canVerifyWrite,
  recoveryRequired,
  onConnect,
  onDisconnect,
  onRefresh,
  onExport,
  onVerifyWrite,
  onToggleDiagnostics,
}: AppHeaderProps) {
  const busy = busyStatuses.includes(status)

  return (
    <header className="app-header">
      <div className="brand-block">
        <span className="brand-mark" aria-hidden="true">
          <Keyboard size={18} strokeWidth={2.2} />
        </span>
        <div>
          <strong>NIZ Deck</strong>
          <span>Community Web Configurator</span>
        </div>
      </div>

      <div className="header-device-state">
        <span className={`status-dot status-dot--${status}`} aria-hidden="true" />
        <div>
          <strong>{device?.productName ?? 'No device'}</strong>
          <span>{firmware ?? 'Not connected'}</span>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-button icon-button--logs"
          type="button"
          onClick={onToggleDiagnostics}
          aria-label="Open diagnostics"
          title="Open diagnostics"
        >
          <SquareTerminal size={17} />
          {logCount > 0 && <span>{Math.min(logCount, 99)}</span>}
        </button>
        <button
          className={`icon-button icon-button--write${recoveryRequired ? ' requires-recovery' : ''}`}
          type="button"
          onClick={onVerifyWrite}
          disabled={!canVerifyWrite || busy}
          aria-label={recoveryRequired ? 'Restore and verify keymap' : 'Verify keymap write'}
          title={recoveryRequired ? 'Restore and verify keymap' : 'Verify keymap write'}
        >
          <ShieldCheck size={17} />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onRefresh}
          disabled={!device || busy || !canRefresh}
          aria-label="Refresh keymap"
          title="Refresh keymap"
        >
          <RefreshCw size={17} className={busy ? 'is-spinning' : ''} />
        </button>
        <button
          className="icon-button"
          type="button"
          onClick={onExport}
          disabled={!canExport}
          aria-label="Export keymap"
          title="Export keymap"
        >
          <Download size={17} />
        </button>
        {device ? (
          <button
            className="command-button command-button--quiet"
            type="button"
            onClick={onDisconnect}
            disabled={busy}
            aria-label="Disconnect keyboard"
            title="Disconnect keyboard"
          >
            <Unplug size={16} />
            <span className="button-label">Disconnect</span>
          </button>
        ) : (
          <button
            className="command-button"
            type="button"
            onClick={onConnect}
            disabled={busy || status === 'unsupported'}
            aria-label="Connect keyboard"
            title="Connect keyboard"
          >
            <Usb size={16} />
            <span className="button-label">Connect</span>
          </button>
        )}
      </div>
    </header>
  )
}
