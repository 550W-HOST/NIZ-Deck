import type { KeymapRecord } from '../domain/types'
import type { KeyboardLayout } from '../domain/keyboardLayout'
import { actionLabel, boardActionLabel } from '../domain/formatters'
import { useLayerWheelNavigation } from '../hooks/useLayerWheelNavigation'
import { cx } from '../uiStyles'

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
  const tkl = layout.width >= 18

  const workspaceRef = useLayerWheelNavigation<HTMLDivElement>({
    layers,
    activeLayer,
    onChange: onLayerChange,
  })

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 max-[700px]:flex-col" ref={workspaceRef}>
      <div
        className="flex min-h-0 min-w-0 flex-1 items-center justify-start overflow-auto bg-[#f4f5f3] px-7 py-8 max-[700px]:p-4"
        data-keyboard-viewport
      >
        <section
          className="mx-auto w-[min(100%,1040px)] min-w-[700px] flex-none p-0"
          aria-label={`${layout.name} keyboard layout; use the mouse wheel to switch layers`}
        >
          <div
            className={cx(
              'relative w-full border-0 bg-transparent',
              transitionDirection === 'next'
                ? 'motion-safe:animate-layer-next'
                : 'motion-safe:animate-layer-previous',
            )}
            data-keyboard-stage
            data-layout-size={tkl ? 'tkl' : 'compact'}
            data-transition={transitionDirection}
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
              const selected = selectedPosition === key.position
              const modified = modifiedPositions?.has(key.position) ?? false
              const unknownAction = assignment?.action.kind === 'unknown'
              const unsetAction = !assignment || assignment.action.kind === 'unset'
              const style = {
                left: `${(key.x / layout.width) * 100}%`,
                top: `${(key.y / layout.height) * 100}%`,
                width: `${(key.width / layout.width) * 100}%`,
                height: `${(key.height / layout.height) * 100}%`,
              }
              return (
                <div
                  className="absolute p-[calc(var(--key-gap)/2)]"
                  data-key-slot
                  style={style}
                  key={key.position}
                >
                  <button
                    className={cx(
                      'group/key relative block size-full cursor-pointer rounded-md border border-[#171a18] bg-[#ced0ce] pt-1 pb-[7px] text-[#282c29]',
                      'shadow-[0_1px_1px_rgba(28,31,29,0.16)] transition-[transform,box-shadow] duration-[90ms] ease-out active:translate-y-0 active:shadow-none',
                      tkl ? 'px-[3px]' : 'px-1',
                      selected
                        ? 'border-[#255f96] bg-[#bdd8ef] shadow-[0_0_0_2px_rgba(66,126,181,0.2),0_1px_1px_rgba(28,31,29,0.16)] hover:-translate-y-px hover:shadow-[0_0_0_2px_rgba(66,126,181,0.2),0_1px_1px_rgba(28,31,29,0.16)]'
                        : 'hover:-translate-y-px hover:shadow-[0_2px_2px_rgba(28,31,29,0.2)]',
                      unknownAction && !selected && 'border-[#725115] bg-[#9d7425]',
                      modified && [
                        'after:absolute after:top-1 after:right-1 after:z-[2] after:size-[7px] after:rounded-[2px] after:border after:border-white/90',
                        'after:bg-warning after:shadow-[0_1px_2px_rgba(28,31,29,0.22)] after:content-[\'\']',
                      ].join(' '),
                    )}
                    type="button"
                    data-action-kind={assignment?.action.kind ?? (keymapLoaded ? 'missing' : 'unloaded')}
                    data-key-position={key.position}
                    data-modified={modified || undefined}
                    data-selected={selected || undefined}
                    onClick={() => onSelect(key.position)}
                    title={`#${key.position} · ${key.label} · ${accessibleAssignment}${
                      modifiedPositions?.has(key.position) ? ' · Draft modified' : ''
                    }`}
                    aria-label={`${key.label}, position ${key.position}, ${accessibleAssignment}${
                      modifiedPositions?.has(key.position) ? ', draft modified' : ''
                    }`}
                  >
                    <span className={cx(
                      'relative block size-full overflow-hidden rounded-[3px] border border-[#b8bbb8] bg-[#f7f7f5] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-[background,border-color] duration-[90ms]',
                      key.tone && 'bg-[#f3f3f1]',
                      !selected && !unknownAction && 'group-hover/key:border-[#d5d7d2] group-hover/key:bg-[#fafaf7]',
                      selected && 'border-[#8db7da] bg-[#edf6fc] text-[#153b60]',
                      unknownAction && !selected && 'border-[#d5af62] bg-[#f6e7c2]',
                    )}>
                      {!keymapLoaded && key.secondary && (
                        <span className={cx(
                          'pointer-events-none absolute top-1.5 overflow-hidden text-ellipsis whitespace-nowrap text-[#282c29] font-bold leading-none',
                          tkl ? 'left-1 text-[8px]' : 'left-1.5 text-[9px]',
                        )}>
                          {key.secondary}
                        </span>
                      )}
                      {showsPhysicalReference && (
                        <span
                          className={cx(
                            'pointer-events-none absolute top-1 right-[15px] overflow-hidden text-left font-bold text-ellipsis whitespace-nowrap uppercase',
                            tkl ? 'left-[3px] text-[5.5px]' : 'left-[5px] text-[6px]',
                            selected ? 'text-[#5f7f9c]' : 'text-ink-faint',
                          )}
                          data-key-reference
                        >
                          {key.label}
                        </span>
                      )}
                      {keymapLoaded ? (
                        <span
                          className={cx(
                            'pointer-events-none absolute top-1/2 right-1 left-1 line-clamp-2 max-h-[2.15em] -translate-y-[44%] overflow-hidden text-center leading-[1.05] font-[760] text-ellipsis whitespace-normal [overflow-wrap:anywhere]',
                            unsetAction
                              ? 'text-xs font-semibold text-ink-faint'
                              : densePrimaryLabel
                                ? 'text-[6.5px]'
                                : compactPrimaryLabel || tkl
                                  ? 'text-[8px]'
                                  : 'text-[9px]',
                            selected && !unsetAction ? 'text-[#204e79]' : 'text-[#2d322e]',
                            unsetAction && 'text-ink-faint',
                          )}
                          data-key-assignment
                        >
                          {primaryLabel}
                        </span>
                      ) : (
                        <span
                          className={cx(
                            'pointer-events-none absolute overflow-hidden font-[760] text-ellipsis whitespace-nowrap',
                            key.secondary ? 'top-auto bottom-[5px]' : 'top-1.5',
                            compactLabel
                              ? tkl
                                ? 'left-0.5 max-w-[calc(100%-4px)] text-[6px] leading-none'
                                : 'left-[3px] max-w-[calc(100%-6px)] text-[6.5px] leading-none'
                              : tkl
                                ? 'left-1 max-w-[calc(100%-8px)] text-[8px] leading-[1.1]'
                                : 'left-1.5 max-w-[calc(100%-12px)] text-[9px] leading-[1.1]',
                          )}
                          data-key-legend
                        >
                          {primaryLabel}
                        </span>
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
