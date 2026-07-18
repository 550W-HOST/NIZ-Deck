import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NIZ_68_LAYOUT } from '../data/layout68'
import { KeyboardBoard } from './KeyboardBoard'

const oneKeyLayout = {
  ...NIZ_68_LAYOUT,
  keyCount: 1,
  width: 1,
  height: 1,
  keys: [NIZ_68_LAYOUT.keys[0]!],
}

describe('KeyboardBoard labels', () => {
  it('promotes a loaded assignment and keeps remapped physical context', () => {
    const markup = renderToStaticMarkup(
      <KeyboardBoard
        layout={oneKeyLayout}
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
        keymapLoaded
        modifiedPositions={new Set([1])}
        onLayerChange={() => undefined}
        onSelect={() => undefined}
      />,
    )

    expect(markup).toContain('is-modified')
    expect(markup).toContain('is-loaded')
    expect(markup).toContain('draft modified')
    expect(markup).toContain('Left Ctrl + A')
    expect(markup).toContain('kle-key-physical-reference">Esc')
    expect(markup).toContain('kle-key-assignment">LCtrl+A')
    expect(markup).not.toContain('kle-key-legend')
  })

  it('shows one centered assignment when the loaded mapping matches the key', () => {
    const markup = renderToStaticMarkup(
      <KeyboardBoard
        layout={oneKeyLayout}
        records={[{
          layer: 1,
          position: 1,
          functionType: 0,
          action: { kind: 'keys', keycodes: [1] },
          raw: [],
        }]}
        layers={[1, 2, 3]}
        activeLayer={1}
        transitionDirection="next"
        selectedPosition={1}
        keymapLoaded
        onLayerChange={() => undefined}
        onSelect={() => undefined}
      />,
    )

    expect(markup).toContain('kle-key-assignment">Esc')
    expect(markup).not.toContain('kle-key-physical-reference')
  })

  it('keeps the physical legend before a complete keymap is loaded', () => {
    const markup = renderToStaticMarkup(
      <KeyboardBoard
        layout={oneKeyLayout}
        records={[]}
        layers={[1, 2, 3]}
        activeLayer={1}
        transitionDirection="next"
        selectedPosition={1}
        onLayerChange={() => undefined}
        onSelect={() => undefined}
      />,
    )

    expect(markup).toContain('kle-key-legend">Esc')
    expect(markup).not.toContain('is-loaded')
    expect(markup).not.toContain('kle-key-assignment')
  })
})
