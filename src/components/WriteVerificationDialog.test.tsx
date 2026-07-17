import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { WriteVerificationDialog } from './WriteVerificationDialog'

describe('WriteVerificationDialog', () => {
  it('requires acknowledgement before write confirmation', () => {
    const markup = renderToStaticMarkup(
      <WriteVerificationDialog
        open
        deviceName="68pro"
        firmware="68pro(S)BT;V1.0.3H;V2.0;"
        recordCount={204}
        recoveryRequired={false}
        onClose={vi.fn()}
        onDownloadBackup={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(markup).toContain('Download backup')
    expect(markup).toContain('Write and verify')
    expect(markup.match(/disabled=""/g)).toHaveLength(1)
  })

  it('does not render when closed', () => {
    const markup = renderToStaticMarkup(
      <WriteVerificationDialog
        open={false}
        deviceName="68pro"
        firmware={null}
        recordCount={0}
        recoveryRequired={false}
        onClose={vi.fn()}
        onDownloadBackup={vi.fn()}
        onConfirm={vi.fn()}
      />,
    )

    expect(markup).toBe('')
  })
})
