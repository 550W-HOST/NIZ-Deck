import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { AppHeader } from './AppHeader'

const handlers = {
  onConnect: vi.fn(),
  onConnectCompatibility: vi.fn(),
  onDisconnect: vi.fn(),
  onRefresh: vi.fn(),
  onExport: vi.fn(),
  onVerifyWrite: vi.fn(),
  onToggleDiagnostics: vi.fn(),
}

describe('AppHeader compatibility controls', () => {
  it('offers unknown-device discovery separately from normal connection', () => {
    const markup = renderToStaticMarkup(
      <AppHeader
        status="disconnected"
        device={null}
        canExport={false}
        exportMode="capture"
        diagnosticAlertCount={0}
        canRefresh={false}
        canVerifyWrite={false}
        recoveryRequired={false}
        {...handlers}
      />,
    )

    expect(markup).toContain('aria-label="Detect unknown device"')
    expect(markup).toContain('aria-label="Connect keyboard"')
  })

  it('labels the redacted report export and keeps writing disabled', () => {
    const markup = renderToStaticMarkup(
      <AppHeader
        status="ready"
        device={{
          productName: '87EC(S)BLe',
          vendorId: 0x0483,
          productId: 0x9001,
          collections: [],
        }}
        canExport
        exportMode="compatibility"
        diagnosticAlertCount={0}
        canRefresh
        canVerifyWrite={false}
        recoveryRequired={false}
        {...handlers}
      />,
    )

    expect(markup).toContain('aria-label="Export compatibility report"')
    expect(markup).toMatch(
      /<button(?=[^>]*disabled="")(?=[^>]*aria-label="Verify keymap write")[^>]*>/,
    )
    expect(markup).not.toContain('aria-label="Detect unknown device"')
  })

  it('renders an actionable diagnostics count without a brand subtitle', () => {
    const markup = renderToStaticMarkup(
      <AppHeader
        status="disconnected"
        device={null}
        canExport={false}
        exportMode="capture"
        diagnosticAlertCount={3}
        canRefresh={false}
        canVerifyWrite={false}
        recoveryRequired={false}
        {...handlers}
      />,
    )

    expect(markup).toContain('<span>3</span>')
    expect(markup).not.toContain('Community Web Configurator')
  })
})
