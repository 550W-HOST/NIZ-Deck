import { useEffect, useState } from 'react'
import {
  Binary,
  ChevronRight,
  KeyRound,
  Pencil,
  RotateCcw,
  Trash2,
} from 'lucide-react'
import type { KeymapRecord, NizKeyAction } from '../domain/types'
import type { PhysicalKey } from '../domain/keyboardLayout'
import { actionLabel, formatHex, layerName } from '../domain/formatters'
import { keycodeName } from '../data/nizKeycodes'
import { KeyActionPicker } from './KeyActionPicker'
import { cx } from '../uiStyles'

const inspectorLabelClass = 'flex items-center gap-[5px] text-[10px] font-[750] uppercase text-[#737a74]'
const propertyRowClass = 'flex min-w-0 items-center justify-between gap-3'
const propertyTermClass = 'inline-flex min-w-0 items-center gap-1.5 text-[11px] text-ink-muted'
const propertyDescriptionClass = 'm-0 max-w-[120px] min-w-0 overflow-hidden text-right font-mono text-[11px] leading-[1.3] font-semibold text-ellipsis whitespace-nowrap text-ink'

interface KeyInspectorProps {
  physicalKey: PhysicalKey | undefined
  record: KeymapRecord | undefined
  activeLayer: number
  assignment?: NizKeyAction
  editable?: boolean
  changed?: boolean
  onAssign?(action: NizKeyAction): void
  onRevert?(): void
}

function ActionDetails({ action }: { action: NizKeyAction }) {
  if (action.kind === 'unset') return null

  if (action.kind === 'keys' || action.kind === 'emulate') {
    return (
      <div className="mt-[10px] flex flex-wrap items-center gap-1.5">
        {action.keycodes.map((keycode, index) => (
          <span
            className="inline-flex min-h-6 items-center rounded-[4px] border border-[#bcc2bc] border-b-2 bg-[#f8f9f7] px-[7px] text-[10px] font-[650] text-[#343934]"
            key={`${keycode}-${index}`}
          >
            {keycodeName(keycode)}
          </span>
        ))}
        {action.kind === 'emulate' && (
          <span className="text-[10px] text-ink-faint">{action.delayMs} ms</span>
        )}
      </div>
    )
  }

  if (action.kind === 'macro') {
    return (
      <dl className="mt-[10px] mb-0">
        <div className={propertyRowClass}>
          <dt className={propertyTermClass}>Mode</dt>
          <dd className={propertyDescriptionClass}>{action.repeatMode}</dd>
        </div>
        <div className={cx(propertyRowClass, 'mt-[10px]')}>
          <dt className={propertyTermClass}>Events</dt>
          <dd className={propertyDescriptionClass}>{action.events.length}</dd>
        </div>
        <div className={cx(propertyRowClass, 'mt-[10px]')}>
          <dt className={propertyTermClass}>Delay</dt>
          <dd className={propertyDescriptionClass}>{action.automaticDelayMs} ms</dd>
        </div>
      </dl>
    )
  }

  return <p className="mt-[9px] mb-0 text-[10px] text-ink-faint">{action.data.length} raw bytes</p>
}

export function KeyInspector({
  physicalKey,
  record,
  activeLayer,
  assignment,
  editable = false,
  changed = false,
  onAssign,
  onRevert,
}: KeyInspectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const currentAction = assignment ?? record?.action

  useEffect(() => setPickerOpen(false), [activeLayer, physicalKey?.position])

  return (
    <aside className="min-h-0 min-w-0 overflow-y-auto border-l border-line bg-surface max-[900px]:grid max-[900px]:grid-cols-2 max-[900px]:overflow-visible max-[900px]:border-t max-[900px]:border-l-0 max-[700px]:grid-cols-1">
      <div className="grid min-h-[72px] grid-cols-[36px_minmax(0,1fr)] items-center gap-[10px] border-b border-line px-[15px] py-3 max-[900px]:col-span-full">
        <div className="flex size-9 items-center justify-center rounded-md border border-[#b9cde1] bg-action-soft text-action">
          <KeyRound size={20} />
        </div>
        <div className="min-w-0">
          <span className="block text-[9px] text-ink-faint">Selected key</span>
          <h2 className="mt-0.5 mb-0 overflow-hidden text-base font-bold text-ellipsis whitespace-nowrap text-ink">
            {physicalKey?.label ?? 'Unknown'}
          </h2>
          <small className="mt-[3px] block text-[9px] text-ink-muted">
            {layerName(activeLayer)}
          </small>
        </div>
      </div>

      <section className="border-b border-line p-4 max-[900px]:min-w-0 max-[900px]:border-r max-[900px]:border-b-0 max-[700px]:border-r-0 max-[700px]:border-b">
        <div className="mb-[13px] flex items-center justify-between gap-3">
          <h3 className={inspectorLabelClass}>Assignment</h3>
          {changed && (
            <span className="rounded-[3px] bg-warning-soft px-[5px] py-0.5 text-[8px] font-[750] uppercase text-warning">
              Draft
            </span>
          )}
        </div>
        {record && currentAction ? (
          <>
            <strong className="block text-sm leading-[1.35] text-ink [overflow-wrap:anywhere]">
              {actionLabel(currentAction)}
            </strong>
            <ActionDetails action={currentAction} />
            {editable && onAssign ? (
              <div className="mt-[14px] flex items-center gap-1.5">
                <button
                  className="inline-flex h-[31px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border border-line-strong bg-surface px-[10px] text-[10px] font-[650] text-[#4d554f] hover:border-[#a8afa8] hover:bg-[#eef0ed]"
                  type="button"
                  onClick={() => setPickerOpen(true)}
                >
                  <Pencil size={14} />
                  Change
                </button>
                <button
                  className="inline-flex size-[31px] flex-none cursor-pointer items-center justify-center rounded-[5px] border border-line-strong bg-surface p-0 text-[#4d554f] enabled:hover:border-[#a8afa8] enabled:hover:bg-[#eef0ed] disabled:cursor-default disabled:opacity-[0.38]"
                  type="button"
                  disabled={currentAction.kind === 'unset'}
                  onClick={() => onAssign({ kind: 'unset' })}
                  aria-label="Unassign key"
                  title="Unassign key"
                >
                  <Trash2 size={14} />
                </button>
                {changed && onRevert && (
                  <button
                    className="inline-flex size-[31px] flex-none cursor-pointer items-center justify-center rounded-[5px] border border-line-strong bg-surface p-0 text-[#4d554f] hover:border-[#a8afa8] hover:bg-[#eef0ed]"
                    type="button"
                    onClick={onRevert}
                    aria-label="Restore device assignment"
                    title="Restore device assignment"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-[13px] mb-0 text-[9px] text-ink-faint">
                Read-only device profile
              </p>
            )}
          </>
        ) : (
          <p className="mt-[9px] mb-0 text-[10px] text-ink-faint">No data for this key</p>
        )}
      </section>

      <details
        className="group/details border-b border-line max-[900px]:min-w-0 max-[900px]:border-b-0 max-[700px]:border-b"
        data-technical-details
      >
        <summary className="flex min-h-[43px] cursor-pointer list-none items-center gap-1.5 px-4 text-[10px] font-[750] uppercase text-[#737a74] [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="transition-transform duration-140 group-open/details:rotate-90"
            size={14}
          />
          Technical details
        </summary>
        <div className="px-4 pb-4">
          <dl className="m-0">
            <div className={propertyRowClass}>
              <dt className={propertyTermClass}>Position</dt>
              <dd className={propertyDescriptionClass}>#{physicalKey?.position ?? '—'}</dd>
            </div>
            <div className={cx(propertyRowClass, 'mt-[10px]')}>
              <dt className={propertyTermClass}>Layer</dt>
              <dd className={propertyDescriptionClass}>{layerName(activeLayer)}</dd>
            </div>
            <div className={cx(propertyRowClass, 'mt-[10px]')}>
              <dt className={propertyTermClass}>Function</dt>
              <dd
                className={propertyDescriptionClass}
                data-function-type={record ? formatHex(record.functionType, 2) : undefined}
              >
                {record ? formatHex(record.functionType, 2) : '—'}
              </dd>
            </div>
          </dl>
          <div className="mt-4 border-t border-line pt-4">
            <h3 className={cx(inspectorLabelClass, 'mb-[13px]')}>
              <Binary size={14} /> Raw report
            </h3>
            <div className="grid grid-cols-8 gap-1">
              {record?.raw.slice(0, 16).map((byte, index) => (
                <span
                  className="min-w-0 rounded-[3px] border border-[#e0e3df] bg-[#f6f7f5] px-px py-1 text-center font-mono text-[9px] leading-none text-[#5c645d]"
                  key={index}
                >
                  {byte.toString(16).padStart(2, '0').toUpperCase()}
                </span>
              )) ?? (
                <span className="min-w-0 rounded-[3px] border border-[#e0e3df] bg-[#f6f7f5] px-px py-1 text-center font-mono text-[9px] leading-none text-[#5c645d]">
                  —
                </span>
              )}
            </div>
          </div>
        </div>
      </details>

      {record && currentAction && onAssign && (
        <KeyActionPicker
          open={pickerOpen}
          physicalKey={physicalKey}
          activeLayer={activeLayer}
          action={currentAction}
          onClose={() => setPickerOpen(false)}
          onSave={onAssign}
        />
      )}
    </aside>
  )
}
