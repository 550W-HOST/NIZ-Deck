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
import {
  cx,
  iconButtonClass,
  primaryCommandButtonClass,
  quietCommandButtonClass,
} from '../uiStyles'

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
    <header
      className="relative z-10 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-[18px] border-b border-line bg-surface px-4"
      data-app-header
    >
      <div className="flex min-w-0 items-center gap-[10px]">
        <span
          className="inline-flex size-[34px] flex-none items-center justify-center rounded-md bg-[#23372d] text-white"
          aria-hidden="true"
        >
          <Keyboard size={18} strokeWidth={2.2} />
        </span>
        <strong className="overflow-hidden text-[13px] font-bold text-ellipsis whitespace-nowrap text-ink">
          NIZ Deck
        </strong>
      </div>

      <div className="flex min-w-0 items-center justify-self-end gap-[7px]">
        <button
          className={cx(iconButtonClass, 'relative')}
          type="button"
          onClick={onToggleDiagnostics}
          aria-label="Open diagnostics"
          title="Open diagnostics"
        >
          <SquareTerminal size={17} />
          {diagnosticAlertCount > 0 && (
            <span
              className="absolute -top-[5px] -right-[5px] inline-flex h-4 min-w-4 items-center justify-center rounded-lg border-2 border-surface bg-danger px-[3px] text-[8px] font-[750] text-white"
              data-diagnostics-alert-count={diagnosticAlertCount}
            >
              {Math.min(diagnosticAlertCount, 99)}
            </span>
          )}
        </button>
        {device && (
          <>
            <button
              className={cx(
                iconButtonClass,
                recoveryRequired && 'border-[#dba7a2] bg-danger-soft text-danger',
              )}
              type="button"
              onClick={onVerifyWrite}
              disabled={!canVerifyWrite || busy}
              aria-label={recoveryRequired ? 'Restore and verify keymap' : 'Verify keymap write'}
              title={recoveryRequired ? 'Restore and verify keymap' : 'Verify keymap write'}
            >
              <ShieldCheck size={17} />
            </button>
            <button
              className={iconButtonClass}
              type="button"
              onClick={onRefresh}
              disabled={busy || !canRefresh}
              aria-label="Refresh keymap"
              title="Refresh keymap"
            >
              <RefreshCw
                size={17}
                className={busy ? 'animate-spin [animation-duration:900ms]' : undefined}
              />
            </button>
            <button
              className={iconButtonClass}
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
            className={quietCommandButtonClass}
            type="button"
            onClick={onDisconnect}
            disabled={busy}
            aria-label="Disconnect keyboard"
            title="Disconnect keyboard"
          >
            <Unplug size={16} />
            <span className="max-[700px]:hidden">Disconnect</span>
          </button>
        ) : (
          <>
            <button
              className={iconButtonClass}
              type="button"
              onClick={onConnectCompatibility}
              disabled={busy || status === 'unsupported'}
              aria-label="Detect unknown device"
              title="Detect unknown device"
            >
              <ScanSearch size={17} />
            </button>
            <button
              className={primaryCommandButtonClass}
              type="button"
              onClick={onConnect}
              disabled={busy || status === 'unsupported'}
              aria-label="Connect keyboard"
              title="Connect keyboard"
            >
              <Usb size={16} />
              <span className="max-[700px]:hidden">Connect</span>
            </button>
          </>
        )}
      </div>
    </header>
  )
}
