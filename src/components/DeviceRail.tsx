import { Cpu, Database, ShieldCheck } from 'lucide-react'
import type {
  KeymapCapture,
  NizDeviceInfo,
} from '../domain/types'
import { formatHex } from '../domain/formatters'
import type { CompatibilityReadVerification } from '../device/compatibilityReport'
import type { NizDeviceSupport } from '../device/nizDeviceModels'
import { cx } from '../uiStyles'

const sectionClass = [
  'border-b border-line px-4 py-[18px]',
  'max-[900px]:min-w-0 max-[900px]:border-r max-[900px]:border-b-0 max-[900px]:px-[14px] max-[900px]:py-3 max-[900px]:last:border-r-0',
].join(' ')
const sectionHeadingClass = 'mb-[13px] text-[10px] font-[750] uppercase text-[#737a74]'
const rowClass = 'flex min-w-0 items-center justify-between gap-3'
const termClass = 'inline-flex min-w-0 items-center gap-1.5 text-[11px] text-ink-muted'
const descriptionClass = 'm-0 max-w-[120px] min-w-0 overflow-hidden text-right font-mono text-[11px] leading-[1.3] font-semibold text-ellipsis whitespace-nowrap text-ink'

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
    <aside
      className={cx(
        'flex min-w-0 flex-col border-r border-line bg-surface max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:border-r-0 max-[900px]:border-b max-[700px]:hidden',
        !(device && capture) && 'max-[900px]:grid-cols-1',
      )}
    >
      {device && (
        <section className={sectionClass}>
          <h2 className={sectionHeadingClass}>Device</h2>
          <dl className="m-0">
            <div className={rowClass}>
              <dt className={termClass}><Cpu size={14} /> Firmware</dt>
              <dd className={descriptionClass}>{firmware ?? '—'}</dd>
            </div>
            <div className={cx(rowClass, 'mt-[11px]')}>
              <dt className={termClass}>VID</dt>
              <dd className={descriptionClass}>{formatHex(device.vendorId)}</dd>
            </div>
            <div className={cx(rowClass, 'mt-[11px]')}>
              <dt className={termClass}>PID</dt>
              <dd className={descriptionClass}>{formatHex(device.productId)}</dd>
            </div>
            <div className={cx(rowClass, 'mt-[11px]')}>
              <dt className={termClass}><ShieldCheck size={14} /> Access</dt>
              <dd className={descriptionClass} title={support?.reason}>
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
        <section className={sectionClass}>
          <h2 className={sectionHeadingClass}>Capture</h2>
          <dl className="m-0">
            <div className={rowClass}>
              <dt className={termClass}><Database size={14} /> Records</dt>
              <dd className={descriptionClass}>{capture.summary.recordCount}</dd>
            </div>
            <div className={cx(rowClass, 'mt-[11px]')}>
              <dt className={termClass}>Assigned</dt>
              <dd className={descriptionClass}>{capture.summary.configuredRecords}</dd>
            </div>
            <div className={cx(rowClass, 'mt-[11px]')}>
              <dt className={termClass}>Layers</dt>
              <dd className={descriptionClass}>{Object.keys(capture.summary.byLayer).length}</dd>
            </div>
            {readVerification.attempts > 0 && (
              <div className={cx(rowClass, 'mt-[11px]')}>
                <dt className={termClass}>Verification</dt>
                <dd className={descriptionClass}>
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
