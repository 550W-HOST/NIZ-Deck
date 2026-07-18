import { Cpu, Database, ShieldCheck } from 'lucide-react'
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
}

export function DeviceRail({
  device,
  support,
  firmware,
  capture,
  readVerification,
}: DeviceRailProps) {
  return (
    <aside className={`device-rail${device && capture ? '' : ' device-rail--single'}`}>
      {device && (
        <section className="rail-section">
          <h2>Device</h2>
          <dl className="property-list">
            <div>
              <dt><Cpu size={14} /> Firmware</dt>
              <dd>{firmware ?? '—'}</dd>
            </div>
            <div>
              <dt>VID</dt>
              <dd>{formatHex(device.vendorId)}</dd>
            </div>
            <div>
              <dt>PID</dt>
              <dd>{formatHex(device.productId)}</dd>
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
      )}

      {capture && (
        <section className="rail-section">
          <h2>Capture</h2>
          <dl className="metric-list">
            <div>
              <dt><Database size={14} /> Records</dt>
              <dd>{capture.summary.recordCount}</dd>
            </div>
            <div>
              <dt>Assigned</dt>
              <dd>{capture.summary.configuredRecords}</dd>
            </div>
            <div>
              <dt>Layers</dt>
              <dd>{Object.keys(capture.summary.byLayer).length}</dd>
            </div>
            {readVerification.attempts > 0 && (
              <div>
                <dt>Verification</dt>
                <dd>
                  {readVerification.consistent === true
                    ? `${readVerification.attempts} reads match`
                    : `${readVerification.attempts} read`}
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}
    </aside>
  )
}
