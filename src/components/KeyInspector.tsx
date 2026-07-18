import { Binary, ChevronRight, KeyRound } from 'lucide-react'
import type { KeymapRecord } from '../domain/types'
import type { PhysicalKey } from '../domain/keyboardLayout'
import { actionLabel, formatHex, layerName } from '../domain/formatters'
import { keycodeName } from '../data/nizKeycodes'

interface KeyInspectorProps {
  physicalKey: PhysicalKey | undefined
  record: KeymapRecord | undefined
  activeLayer: number
}

function ActionDetails({ record }: { record: KeymapRecord }) {
  const { action } = record
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
}: KeyInspectorProps) {
  return (
    <aside className="key-inspector">
      <div className="inspector-heading">
        <div className="selected-key-icon">
          <KeyRound size={20} />
        </div>
        <div>
          <span>Selected key</span>
          <h2>{physicalKey?.label ?? 'Unknown'}</h2>
        </div>
      </div>

      <section className="inspector-section">
        <h3>Assignment</h3>
        {record ? (
          <>
            <strong className="assignment-title">{actionLabel(record.action)}</strong>
            <ActionDetails record={record} />
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
    </aside>
  )
}
