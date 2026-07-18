import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { KeymapRecord } from '../domain/types'
import type { PhysicalKey } from '../domain/keyboardLayout'
import { KeyInspector } from './KeyInspector'

const physicalKey: PhysicalKey = {
  position: 1,
  label: 'Esc',
  x: 0,
  y: 0,
  width: 1,
  height: 1,
}

describe('KeyInspector information hierarchy', () => {
  it('uses one empty state and omits fixed protocol claims', () => {
    const markup = renderToStaticMarkup(
      <KeyInspector physicalKey={physicalKey} record={undefined} activeLayer={1} />,
    )

    expect(markup).toContain('No data for this key')
    expect(markup).not.toContain('Not loaded')
    expect(markup).not.toContain('Read only')
    expect(markup).not.toContain('Packet')
  })

  it('keeps raw values inside technical details', () => {
    const record: KeymapRecord = {
      layer: 1,
      position: 1,
      functionType: 1,
      action: { kind: 'keys', keycodes: [41] },
      raw: [0xf0, 0x01, 0x01],
    }
    const markup = renderToStaticMarkup(
      <KeyInspector physicalKey={physicalKey} record={record} activeLayer={1} />,
    )

    expect(markup).toContain('<details class="inspector-advanced">')
    expect(markup).toContain('Technical details')
    expect(markup).toContain('Raw report')
    expect(markup).not.toContain('Packet')
  })
})
