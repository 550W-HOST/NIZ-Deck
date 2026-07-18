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
      <div className="keycode-list">
        {action.keycodes.map((keycode, index) => (
          <span className="keycode-token" key={`${keycode}-${index}`}>
            {keycodeName(keycode)}
          </span>
        ))}
        {action.kind === 'emulate' && (
          <span className="detail-note">{action.delayMs} ms</span>
        )}
      </div>
    )
  }

  if (action.kind === 'macro') {
    return (
      <dl className="inspector-properties inspector-properties--compact">
        <div><dt>Mode</dt><dd>{action.repeatMode}</dd></div>
        <div><dt>Events</dt><dd>{action.events.length}</dd></div>
        <div><dt>Delay</dt><dd>{action.automaticDelayMs} ms</dd></div>
      </dl>
    )
  }

  return <p className="empty-value">{action.data.length} raw bytes</p>
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
    <aside className="key-inspector">
      <div className="inspector-heading">
        <div className="selected-key-icon">
          <KeyRound size={20} />
        </div>
        <div>
          <span>Selected key</span>
          <h2>{physicalKey?.label ?? 'Unknown'}</h2>
          <small>{layerName(activeLayer)}</small>
        </div>
      </div>

      <section className="inspector-section">
        <div className="inspector-section-title">
          <h3>Assignment</h3>
          {changed && <span>Draft</span>}
        </div>
        {record && currentAction ? (
          <>
            <strong className="assignment-title">{actionLabel(currentAction)}</strong>
            <ActionDetails action={currentAction} />
            {editable && onAssign ? (
              <div className="inspector-assignment-actions">
                <button
                  className="inspector-change-button"
                  type="button"
                  onClick={() => setPickerOpen(true)}
                >
                  <Pencil size={14} />
                  Change
                </button>
                <button
                  className="inspector-tool-button"
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
                    className="inspector-tool-button"
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
              <p className="inspector-readonly-status">Read-only device profile</p>
            )}
          </>
        ) : (
          <p className="empty-value">No data for this key</p>
        )}
      </section>

      <details className="inspector-advanced">
        <summary>
          <ChevronRight size={14} />
          Technical details
        </summary>
        <div className="inspector-advanced-body">
          <dl className="inspector-properties">
            <div><dt>Position</dt><dd>#{physicalKey?.position ?? '—'}</dd></div>
            <div><dt>Layer</dt><dd>{layerName(activeLayer)}</dd></div>
            <div><dt>Function</dt><dd>{record ? formatHex(record.functionType, 2) : '—'}</dd></div>
          </dl>
          <div className="inspector-raw-report">
            <h3><Binary size={14} /> Raw report</h3>
            <div className="hex-grid">
              {record?.raw.slice(0, 16).map((byte, index) => (
                <span key={index}>{byte.toString(16).padStart(2, '0').toUpperCase()}</span>
              )) ?? <span>—</span>}
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
