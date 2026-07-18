import { Cpu, Database, ShieldCheck, Usb } from 'lucide-react'
import type {
  KeymapCapture,
  NizDeviceInfo,
} from '../domain/types'
import { formatHex } from '../domain/formatters'
import type { CompatibilityReadVerification } from '../device/compatibilityReport'
import type { NizDeviceSupport } from '../device/nizDeviceModels'

interface DeviceRailProps {
  device: NizDeviceInfo | null
  support: NizDeviceSupport | null
  firmware: string | null
  capture: KeymapCapture | null
  readVerification: CompatibilityReadVerification
  keyCount: number
}

export function DeviceRail({
  device,
  support,
  firmware,
  capture,
  readVerification,
  keyCount,
}: DeviceRailProps) {
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
          <div>
            <dt><ShieldCheck size={14} /> Access</dt>
            <dd title={support?.reason}>
              {support?.canWrite
                ? 'Read/write'
                : support?.canRead
                  ? 'Read only'
                  : support
                    ? 'Metadata only'
                    : '—'}
            </dd>
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
          <div>
            <dt>Verification</dt>
            <dd>
              {readVerification.consistent === true
                ? `${readVerification.attempts} reads match`
                : readVerification.attempts > 0
                  ? `${readVerification.attempts} read`
                  : '—'}
            </dd>
          </div>
        </dl>
      </section>

    </aside>
  )
}
