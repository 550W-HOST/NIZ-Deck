import type { KeymapRecord } from '../domain/types'
import type { KeyboardLayout } from '../domain/keyboardLayout'
import { actionLabel, boardActionLabel } from '../domain/formatters'
import { useLayerWheelNavigation } from '../hooks/useLayerWheelNavigation'

interface KeyboardBoardProps {
  layout: KeyboardLayout
  records: readonly KeymapRecord[]
  layers: readonly number[]
  activeLayer: number
  transitionDirection: 'previous' | 'next'
  selectedPosition: number
  keymapLoaded?: boolean
  modifiedPositions?: ReadonlySet<number>
  onLayerChange(layer: number, direction?: 'previous' | 'next'): void
  onSelect(position: number): void
}

export function KeyboardBoard({
  layout,
  records,
  layers,
  activeLayer,
  transitionDirection,
  selectedPosition,
  keymapLoaded = false,
  modifiedPositions,
  onLayerChange,
  onSelect,
}: KeyboardBoardProps) {
  const assignments = new Map(records.map((record) => [record.position, record]))

  const workspaceRef = useLayerWheelNavigation<HTMLDivElement>({
    layers,
    activeLayer,
    onChange: onLayerChange,
  })

  return (
    <div className="keyboard-work-area" ref={workspaceRef}>
      <div className="keyboard-viewport">
        <section
          className="keyboard-deck"
          aria-label={`${layout.name} keyboard layout; use the mouse wheel to switch layers`}
        >
          <div
            className={[
              'keyboard-stage',
              `keyboard-stage--${transitionDirection}`,
              layout.width >= 18 ? 'keyboard-stage--tkl' : '',
            ].filter(Boolean).join(' ')}
            data-layer={activeLayer}
            key={activeLayer}
            style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
          >
            {layout.keys.map((key) => {
              const assignment = assignments.get(key.position)
              const assignmentText = assignment ? actionLabel(assignment.action) : null
              const labelBudget = Math.max(7, Math.round(key.width * 8))
              const densityBudget = Math.max(6, Math.round(key.width * 7))
              const primaryLabel = keymapLoaded
                ? assignment
                  ? assignmentText
                    && (assignment.action.kind === 'keys' || assignment.action.kind === 'emulate')
                    && assignmentText.length < labelBudget
                    ? assignmentText
                    : boardActionLabel(assignment.action)
                  : '?'
                : key.label
              const normalizedPhysicalLabel = key.label.toLocaleLowerCase()
              const assignmentMatchesPhysical = assignmentText?.toLocaleLowerCase()
                === normalizedPhysicalLabel
                || primaryLabel.toLocaleLowerCase() === normalizedPhysicalLabel
              const showsPhysicalReference = keymapLoaded && !assignmentMatchesPhysical
              const accessibleAssignment = assignmentText
                ?? (keymapLoaded ? 'No data' : 'Not loaded')
              const compactLabel = key.width <= 1 && key.label.length >= 4
              const densePrimaryLabel = primaryLabel.length > densityBudget * 1.6
              const compactPrimaryLabel = primaryLabel.length > densityBudget
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
                      keymapLoaded ? 'is-loaded' : '',
                      keymapLoaded && !assignment ? 'has-missing-assignment' : '',
                      assignment ? `has-${assignment.action.kind}-action` : '',
                      compactPrimaryLabel ? 'has-compact-primary' : '',
                      densePrimaryLabel ? 'has-dense-primary' : '',
                      selectedPosition === key.position ? 'is-selected' : '',
                      modifiedPositions?.has(key.position) ? 'is-modified' : '',
                    ].filter(Boolean).join(' ')}
                    type="button"
                    onClick={() => onSelect(key.position)}
                    title={`#${key.position} · ${key.label} · ${accessibleAssignment}${
                      modifiedPositions?.has(key.position) ? ' · Draft modified' : ''
                    }`}
                    aria-label={`${key.label}, position ${key.position}, ${accessibleAssignment}${
                      modifiedPositions?.has(key.position) ? ', draft modified' : ''
                    }`}
                  >
                    <span className="kle-key-cap">
                      {!keymapLoaded && key.secondary && (
                        <span className="kle-key-secondary">{key.secondary}</span>
                      )}
                      {showsPhysicalReference && (
                        <span className="kle-key-physical-reference">{key.label}</span>
                      )}
                      {keymapLoaded ? (
                        <span className="kle-key-assignment">{primaryLabel}</span>
                      ) : (
                        <span className="kle-key-legend">{primaryLabel}</span>
                      )}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
