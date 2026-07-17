import { useEffect, useLayoutEffect, useRef } from 'react'
import { layerName } from '../domain/formatters'

interface LayerTabsProps {
  layers: readonly number[]
  activeLayer: number
  transitionDirection: 'previous' | 'next'
  onChange(layer: number): void
}

export function LayerTabs({
  layers,
  activeLayer,
  transitionDirection,
  onChange,
}: LayerTabsProps) {
  const tablistRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const tablist = tablistRef.current
    if (!tablist) return undefined

    const updateIndicator = (): void => {
      const activeButton = tablist.querySelector<HTMLButtonElement>(
        `[data-layer="${activeLayer}"]`,
      )
      if (!activeButton) return

      tablist.style.setProperty('--layer-indicator-x', `${activeButton.offsetLeft}px`)
      tablist.style.setProperty('--layer-indicator-y', `${activeButton.offsetTop}px`)
      tablist.style.setProperty('--layer-indicator-width', `${activeButton.offsetWidth}px`)
      tablist.style.setProperty('--layer-indicator-height', `${activeButton.offsetHeight}px`)
      tablist.style.setProperty('--layer-indicator-opacity', '1')
    }

    updateIndicator()
    const resizeObserver = new ResizeObserver(updateIndicator)
    resizeObserver.observe(tablist)

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeLayer, layers, tablistRef])

  useEffect(() => {
    const tablist = tablistRef.current
    const activeButton = tablist?.querySelector<HTMLButtonElement>(
      `[data-layer="${activeLayer}"]`,
    )
    if (!tablist || !activeButton) return

    const buttonLeft = activeButton.offsetLeft
    const buttonRight = buttonLeft + activeButton.offsetWidth
    const buttonTop = activeButton.offsetTop
    const buttonBottom = buttonTop + activeButton.offsetHeight
    const visibleLeft = tablist.scrollLeft
    const visibleRight = visibleLeft + tablist.clientWidth
    const visibleTop = tablist.scrollTop
    const visibleBottom = visibleTop + tablist.clientHeight
    let nextScrollLeft = visibleLeft
    let nextScrollTop = visibleTop

    if (buttonLeft < visibleLeft) nextScrollLeft = buttonLeft - 3
    if (buttonRight > visibleRight) nextScrollLeft = buttonRight - tablist.clientWidth + 3
    if (buttonTop < visibleTop) nextScrollTop = buttonTop - 3
    if (buttonBottom > visibleBottom) nextScrollTop = buttonBottom - tablist.clientHeight + 3
    if (nextScrollLeft === visibleLeft && nextScrollTop === visibleTop) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    tablist.scrollTo({
      left: Math.max(0, nextScrollLeft),
      top: Math.max(0, nextScrollTop),
      behavior: reducedMotion ? 'auto' : 'smooth',
    })
  }, [activeLayer, tablistRef])

  return (
    <div
      className={`layer-tabs layer-tabs--${transitionDirection}`}
      role="tablist"
      aria-label="Keymap layers; use the mouse wheel to switch"
      ref={tablistRef}
    >
      <span className="layer-tabs__indicator" aria-hidden="true" />
      {layers.map((layer) => (
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === layer}
          className={activeLayer === layer ? 'is-active' : ''}
          data-layer={layer}
          key={layer}
          onClick={() => onChange(layer)}
        >
          {layerName(layer)}
        </button>
      ))}
    </div>
  )
}
