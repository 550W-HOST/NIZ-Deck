import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NIZ_68_LAYOUT } from '../data/layout68'
import { KeyboardBoard } from './KeyboardBoard'

describe('KeyboardBoard draft state', () => {
  it('marks edited keys in both visual and accessible state', () => {
    const markup = renderToStaticMarkup(
      <KeyboardBoard
        layout={NIZ_68_LAYOUT}
        records={[{
          layer: 1,
          position: 1,
          functionType: 0,
          action: { kind: 'keys', keycodes: [67, 43] },
          raw: [],
        }]}
        layers={[1, 2, 3]}
        activeLayer={1}
        transitionDirection="next"
        selectedPosition={1}
        modifiedPositions={new Set([1])}
        onLayerChange={() => undefined}
        onSelect={() => undefined}
      />,
    )

    expect(markup).toContain('is-modified')
    expect(markup).toContain('draft modified')
    expect(markup).toContain('Left Ctrl + A')
  })
})
