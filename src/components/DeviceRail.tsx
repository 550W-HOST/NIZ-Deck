import { Activity, Cpu, Database, Usb } from 'lucide-react'
import type {
  DeviceStatus,
  KeymapCapture,
  NizDeviceInfo,
} from '../domain/types'
import { formatHex } from '../domain/formatters'

interface DeviceRailProps {
  status: DeviceStatus
  device: NizDeviceInfo | null
  firmware: string | null
  capture: KeymapCapture | null
  keyCount: number
}

export function DeviceRail({
  status,
  device,
  firmware,
  capture,
  keyCount,
}: DeviceRailProps) {
  const usagePage = device?.collections[0]?.usagePage

  return (
    <aside className="device-rail">
      <section className="rail-section">
        <h2>Device</h2>
        <dl className="property-list">
          <div>
            <dt><Usb size={14} /> Product</dt>
            <dd>{device?.productName ?? '—'}</dd>
          </div>
          <div>
            <dt><Cpu size={14} /> Firmware</dt>
            <dd>{firmware ?? '—'}</dd>
          </div>
          <div>
            <dt>VID</dt>
            <dd>{device ? formatHex(device.vendorId) : '—'}</dd>
          </div>
          <div>
            <dt>PID</dt>
            <dd>{device ? formatHex(device.productId) : '—'}</dd>
          </div>
        </dl>
      </section>

      <section className="rail-section">
        <h2>Capture</h2>
        <dl className="metric-list">
          <div>
            <dt><Database size={14} /> Records</dt>
            <dd>{capture?.summary.recordCount ?? 0}</dd>
          </div>
          <div>
            <dt>Configured</dt>
            <dd>{capture?.summary.configuredRecords ?? 0}</dd>
          </div>
          <div>
            <dt>Keys</dt>
            <dd>{capture?.summary.maxPosition ?? keyCount}</dd>
          </div>
          <div>
            <dt>Layers</dt>
            <dd>{capture ? Object.keys(capture.summary.byLayer).length : 0}</dd>
          </div>
        </dl>
      </section>

      <section className="rail-section rail-section--bottom">
        <div className="protocol-state">
          <Activity size={15} />
          <div>
            <span>Transport</span>
            <strong>
              {status === 'unsupported'
                ? 'Unavailable'
                : usagePage === undefined
                  ? 'WebHID'
                  : `WebHID · ${formatHex(usagePage)}`}
            </strong>
          </div>
        </div>
      </section>
    </aside>
  )
}
