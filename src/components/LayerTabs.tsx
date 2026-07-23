import { useEffect, useLayoutEffect, useRef } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { layerName } from '../domain/formatters'
import { cx } from '../uiStyles'

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

  const handleKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    layer: number,
  ): void => {
    const currentIndex = layers.indexOf(layer)
    let nextLayer: number | undefined
    if (event.key === 'ArrowLeft') nextLayer = layers[currentIndex - 1]
    if (event.key === 'ArrowRight') nextLayer = layers[currentIndex + 1]
    if (event.key === 'Home') nextLayer = layers[0]
    if (event.key === 'End') nextLayer = layers.at(-1)
    if (nextLayer === undefined || nextLayer === layer) return

    event.preventDefault()
    onChange(nextLayer)
    window.requestAnimationFrame(() => {
      tablistRef.current
        ?.querySelector<HTMLButtonElement>(`[data-layer="${nextLayer}"]`)
        ?.focus()
    })
  }

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
      className={[
        'relative inline-flex max-w-full flex-none overflow-x-auto overflow-y-hidden rounded-md border border-line-strong bg-[#e9ece7] p-[3px]',
        '[--layer-indicator-height:26px] [--layer-indicator-opacity:0] [--layer-indicator-width:68px] [--layer-indicator-x:3px] [--layer-indicator-y:3px]',
        'max-[700px]:w-full max-[700px]:flex-row max-[700px]:border-line max-[700px]:shadow-none max-[700px]:[backdrop-filter:none]',
      ].join(' ')}
      role="tablist"
      aria-label="Keymap layers; use the mouse wheel to switch"
      data-transition={transitionDirection}
      ref={tablistRef}
    >
      <span
        className="pointer-events-none absolute top-0 left-0 z-0 h-[var(--layer-indicator-height)] w-[var(--layer-indicator-width)] translate-x-[var(--layer-indicator-x)] translate-y-[var(--layer-indicator-y)] rounded-[4px] bg-surface opacity-[var(--layer-indicator-opacity)] shadow-[0_1px_3px_rgba(8,12,9,0.16),inset_0_1px_0_rgba(255,255,255,0.78)] [transition:width_180ms_cubic-bezier(0.2,0.8,0.2,1),height_180ms_cubic-bezier(0.2,0.8,0.2,1),transform_180ms_cubic-bezier(0.2,0.8,0.2,1),opacity_100ms_ease]"
        aria-hidden="true"
      />
      {layers.map((layer) => (
        <button
          type="button"
          role="tab"
          aria-selected={activeLayer === layer}
          tabIndex={activeLayer === layer ? 0 : -1}
          className={cx(
            'relative z-[1] h-[26px] min-w-[68px] cursor-pointer rounded-[4px] border-0 bg-transparent px-[9px] text-[10px] font-[650] text-[#626963] transition-colors duration-140 hover:bg-white/50 hover:text-ink',
            'max-[700px]:h-[27px] max-[700px]:w-auto max-[700px]:min-w-[72px] max-[700px]:flex-[1_0_auto] max-[700px]:px-[10px]',
            activeLayer === layer && 'text-ink hover:bg-transparent',
          )}
          data-layer={layer}
          key={layer}
          onClick={() => onChange(layer)}
          onKeyDown={(event) => handleKeyDown(event, layer)}
        >
          {layerName(layer)}
        </button>
      ))}
    </div>
  )
}
