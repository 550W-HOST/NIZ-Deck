import {
  Download,
  FileDown,
  Keyboard,
  RefreshCw,
  ScanSearch,
  ShieldCheck,
  SquareTerminal,
  Unplug,
  Usb,
} from 'lucide-react'
import type { DeviceStatus, NizDeviceInfo } from '../domain/types'

interface AppHeaderProps {
  status: DeviceStatus
  device: NizDeviceInfo | null
  canExport: boolean
  exportMode: 'capture' | 'compatibility'
  diagnosticAlertCount: number
  canRefresh: boolean
  canVerifyWrite: boolean
  recoveryRequired: boolean
  onConnect(): void
  onConnectCompatibility(): void
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
  canExport,
  exportMode,
  diagnosticAlertCount,
  canRefresh,
  canVerifyWrite,
  recoveryRequired,
  onConnect,
  onConnectCompatibility,
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
        <strong>NIZ Deck</strong>
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
          {diagnosticAlertCount > 0 && (
            <span>{Math.min(diagnosticAlertCount, 99)}</span>
          )}
        </button>
        {device && (
          <>
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
              disabled={busy || !canRefresh}
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
              aria-label={exportMode === 'compatibility'
                ? 'Export compatibility report'
                : 'Export keymap'}
              title={exportMode === 'compatibility'
                ? 'Export compatibility report'
                : 'Export keymap'}
            >
              {exportMode === 'compatibility'
                ? <FileDown size={17} />
                : <Download size={17} />}
            </button>
          </>
        )}
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
          <>
            <button
              className="icon-button"
              type="button"
              onClick={onConnectCompatibility}
              disabled={busy || status === 'unsupported'}
              aria-label="Detect unknown device"
              title="Detect unknown device"
            >
              <ScanSearch size={17} />
            </button>
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
          </>
        )}
      </div>
    </header>
  )
}
