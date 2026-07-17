import type { KeymapRecord } from '../domain/types'
import type { KeyboardLayout } from '../domain/keyboardLayout'
import { actionLabel } from '../domain/formatters'

interface KeyboardBoardProps {
  layout: KeyboardLayout
  records: readonly KeymapRecord[]
  selectedPosition: number
  onSelect(position: number): void
}

export function KeyboardBoard({
  layout,
  records,
  selectedPosition,
  onSelect,
}: KeyboardBoardProps) {
  const assignments = new Map(records.map((record) => [record.position, record]))

  return (
    <div className="keyboard-viewport">
      <section className="keyboard-deck" aria-label={`${layout.name} keyboard layout`}>
        <div
          className="keyboard-stage"
          style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
        >
          {layout.keys.map((key) => {
            const assignment = assignments.get(key.position)
            const assignmentText = assignment ? actionLabel(assignment.action) : null
            const accessibleAssignment = assignmentText ?? 'Not loaded'
            const compactLabel = key.width <= 1 && key.label.length >= 4
            const style = {
              left: `${(key.x / layout.width) * 100}%`,
              top: `${(key.y / layout.height) * 100}%`,
              width: `${(key.width / layout.width) * 100}%`,
              height: `${(key.height / layout.height) * 100}%`,
            }
            return (
              <div className="kle-key-slot" style={style} key={key.position}>
                <button
                  className={[
                    'kle-key',
                    key.secondary ? 'has-secondary' : '',
                    compactLabel ? 'has-compact-label' : '',
                    key.tone ? `kle-key--${key.tone}` : '',
                    selectedPosition === key.position ? 'is-selected' : '',
                    assignment?.action.kind === 'unknown' ? 'has-unknown-action' : '',
                  ].filter(Boolean).join(' ')}
                  type="button"
                  onClick={() => onSelect(key.position)}
                  title={`#${key.position} · ${accessibleAssignment}`}
                  aria-label={`${key.label}, position ${key.position}, ${accessibleAssignment}`}
                >
                  <span className="kle-key-cap">
                    {key.secondary && (
                      <span className="kle-key-secondary">{key.secondary}</span>
                    )}
                    <span className="kle-key-legend">{key.label}</span>
                    {assignmentText && (
                      <span className="kle-key-assignment">{assignmentText}</span>
                    )}
                    <span className="kle-key-position">{key.position}</span>
                  </span>
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
