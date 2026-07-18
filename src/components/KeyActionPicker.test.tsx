import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { KeyActionPicker } from './KeyActionPicker'

describe('KeyActionPicker', () => {
  it('opens sequence assignments with searchable categorized keycodes', () => {
    const markup = renderToStaticMarkup(
      <KeyActionPicker
        open
        physicalKey={{
          position: 1,
          label: 'Esc',
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        }}
        activeLayer={2}
        action={{ kind: 'emulate', delayMs: 25, keycodes: [43, 44] }}
        onClose={() => undefined}
        onSave={() => undefined}
      />,
    )

    expect(markup).toContain('Assign Esc')
    expect(markup).toContain('Right Fn')
    expect(markup).toContain('Search keys and functions')
    expect(markup).toContain('All categories')
    expect(markup).toContain('Record sequence')
    expect(markup).toContain('value="25"')
    expect(markup).toContain('Save assignment')
  })

  it('renders nothing while closed', () => {
    const markup = renderToStaticMarkup(
      <KeyActionPicker
        open={false}
        physicalKey={undefined}
        activeLayer={1}
        action={{ kind: 'unset' }}
        onClose={() => undefined}
        onSave={() => undefined}
      />,
    )

    expect(markup).toBe('')
  })
})
