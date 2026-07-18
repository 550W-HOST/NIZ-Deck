import { useCallback, useEffect, useRef, useState } from 'react'
import type { KeymapRecord } from '../domain/types'
import type { KeyboardLayout } from '../domain/keyboardLayout'
import { actionLabel } from '../domain/formatters'
import { useLayerWheelNavigation } from '../hooks/useLayerWheelNavigation'
import { LayerTabs } from './LayerTabs'

const LAYER_CONTROL_HIDE_MS = 900

interface KeyboardBoardProps {
  layout: KeyboardLayout
  records: readonly KeymapRecord[]
  layers: readonly number[]
  activeLayer: number
  transitionDirection: 'previous' | 'next'
  selectedPosition: number
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
  onLayerChange,
  onSelect,
}: KeyboardBoardProps) {
  const assignments = new Map(records.map((record) => [record.position, record]))
  const [layerControlVisible, setLayerControlVisible] = useState(false)
  const layerControlHideTimerRef = useRef<number | null>(null)

  const clearLayerControlHideTimer = useCallback((): void => {
    if (layerControlHideTimerRef.current === null) return
    window.clearTimeout(layerControlHideTimerRef.current)
    layerControlHideTimerRef.current = null
  }, [])

  const scheduleLayerControlHide = useCallback((): void => {
    clearLayerControlHideTimer()
    layerControlHideTimerRef.current = window.setTimeout(() => {
      setLayerControlVisible(false)
      layerControlHideTimerRef.current = null
    }, LAYER_CONTROL_HIDE_MS)
  }, [clearLayerControlHideTimer])

  const showLayerControl = useCallback((): void => {
    setLayerControlVisible(true)
    scheduleLayerControlHide()
  }, [scheduleLayerControlHide])

  useEffect(() => clearLayerControlHideTimer, [clearLayerControlHideTimer])

  const workspaceRef = useLayerWheelNavigation<HTMLDivElement>({
    layers,
    activeLayer,
    onChange: onLayerChange,
    onActivity: showLayerControl,
  })

  const handleLayerControlChange = (layer: number): void => {
    setLayerControlVisible(true)
    onLayerChange(layer)
  }

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
                    </span>
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      <aside
        className={`keyboard-layer-control${layerControlVisible ? ' is-visible' : ''}`}
        aria-label="Layer selection"
        onMouseEnter={() => {
          clearLayerControlHideTimer()
          setLayerControlVisible(true)
        }}
        onMouseLeave={scheduleLayerControlHide}
        onFocusCapture={() => {
          clearLayerControlHideTimer()
          setLayerControlVisible(true)
        }}
        onBlurCapture={scheduleLayerControlHide}
      >
        <LayerTabs
          layers={layers}
          activeLayer={activeLayer}
          transitionDirection={transitionDirection}
          onChange={handleLayerControlChange}
        />
      </aside>
    </div>
  )
}
