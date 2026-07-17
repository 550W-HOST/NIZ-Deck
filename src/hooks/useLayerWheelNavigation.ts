import { useEffect, useRef } from 'react'
import { layerAfterVerticalWheel } from '../domain/layerNavigation'

interface LayerWheelNavigationOptions {
  layers: readonly number[]
  activeLayer: number
  onChange(layer: number, direction: 'previous' | 'next'): void
  onActivity?(): void
}

const WHEEL_GESTURE_END_MS = 160

export function useLayerWheelNavigation<T extends HTMLElement>({
  layers,
  activeLayer,
  onChange,
  onActivity,
}: LayerWheelNavigationOptions) {
  const surfaceRef = useRef<T>(null)
  const currentStateRef = useRef({ layers, activeLayer, onChange, onActivity })
  const wheelGestureActiveRef = useRef(false)
  const wheelEndTimerRef = useRef<number | null>(null)
  currentStateRef.current = { layers, activeLayer, onChange, onActivity }

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return undefined

    const finishWheelGesture = (): void => {
      wheelGestureActiveRef.current = false
      wheelEndTimerRef.current = null
    }

    const restartWheelGestureTimer = (): void => {
      if (wheelEndTimerRef.current !== null) {
        window.clearTimeout(wheelEndTimerRef.current)
      }
      wheelEndTimerRef.current = window.setTimeout(
        finishWheelGesture,
        WHEEL_GESTURE_END_MS,
      )
    }

    const handleWheel = (event: WheelEvent): void => {
      if (event.deltaY === 0 || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

      const {
        layers: currentLayers,
        activeLayer: currentLayer,
        onChange: changeLayer,
        onActivity: reportActivity,
      } = currentStateRef.current
      reportActivity?.()
      const nextLayer = layerAfterVerticalWheel(
        currentLayers,
        currentLayer,
        event.deltaX,
        event.deltaY,
      )

      if (wheelGestureActiveRef.current) {
        event.preventDefault()
        restartWheelGestureTimer()
        return
      }

      if (nextLayer === currentLayer) return

      event.preventDefault()
      wheelGestureActiveRef.current = true
      restartWheelGestureTimer()
      changeLayer(nextLayer, event.deltaY > 0 ? 'next' : 'previous')
    }

    surface.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      surface.removeEventListener('wheel', handleWheel)
      if (wheelEndTimerRef.current !== null) {
        window.clearTimeout(wheelEndTimerRef.current)
      }
      wheelGestureActiveRef.current = false
      wheelEndTimerRef.current = null
    }
  }, [])

  return surfaceRef
}
