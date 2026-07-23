import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NIZ_68_LAYOUT } from '../data/layout68'
import { DraftBar } from './DraftBar'
import { DraftReviewDialog } from './DraftReviewDialog'

describe('keymap draft controls', () => {
  it('keeps redo available when no changes are currently applied', () => {
    const markup = renderToStaticMarkup(
      <DraftBar
        changeCount={0}
        canUndo={false}
        canRedo
        onUndo={() => undefined}
        onRedo={() => undefined}
        onReset={() => undefined}
        onReview={() => undefined}
      />,
    )

    expect(markup).toContain('Redo draft change')
    expect(markup).toContain('data-change-count="0"')
    expect(markup).toContain('changes pending')
    expect(markup).toMatch(/<button[^>]*disabled=""[^>]*aria-label="Reset all draft changes"/)
  })

  it('reviews semantic changes without offering an unverified write action', () => {
    const markup = renderToStaticMarkup(
      <DraftReviewDialog
        open
        layout={NIZ_68_LAYOUT}
        changes={[{
          layer: 1,
          position: 1,
          original: { kind: 'keys', keycodes: [1] },
          assignment: { kind: 'keys', keycodes: [67, 43] },
        }]}
        onClose={() => undefined}
        onReset={() => undefined}
      />,
    )

    expect(markup).toContain('Review keymap draft')
    expect(markup).toContain('Esc')
    expect(markup).toContain('Left Ctrl + A')
    expect(markup).toContain('Draft only')
    expect(markup).not.toContain('Write and verify')
  })
})
