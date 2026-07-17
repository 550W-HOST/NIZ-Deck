import { describe, expect, it } from 'vitest'
import { NIZ_68_LAYOUT } from './layout68'
import { NIZ_84_LAYOUT } from './layout84'
import {
  KEYBOARD_LAYOUTS,
  detectKeyboardLayout,
  physicalKeyAt,
  resolveKeyboardLayout,
} from './keyboardLayouts'
import type { KeymapCapture, NizDeviceInfo } from '../domain/types'

const niz68Device: NizDeviceInfo = {
  productName: '68pro',
  vendorId: 0x0483,
  productId: 0x5532,
  collections: [],
}

const niz84Device: NizDeviceInfo = {
  productName: '84EC(S)BLe',
  vendorId: 0x0483,
  productId: 0x5129,
  collections: [],
}

function captureWithMaxPosition(maxPosition: number): KeymapCapture {
  return {
    schemaVersion: 1,
    capturedAt: '2026-07-17T00:00:00.000Z',
    device: {
      productName: 'Unknown NIZ',
      vendorId: 0x0483,
      productId: 0xffff,
      collections: [],
    },
    firmware: null,
    summary: {
      recordCount: 0,
      configuredRecords: 0,
      maxPosition,
      byLayer: {},
      byAction: { unset: 0, keys: 0, emulate: 0, macro: 0, unknown: 0 },
    },
    rawReports: [],
    records: [],
    otherReports: [],
  }
}

describe('keyboard layout resolution', () => {
  it('registers both supported physical layouts', () => {
    expect(KEYBOARD_LAYOUTS.map(({ keyCount }) => keyCount)).toEqual([68, 84])
  })

  it('detects the connected NIZ 68pro by product name', () => {
    const result = resolveKeyboardLayout('auto', {
      device: niz68Device,
      capture: null,
    })

    expect(result.layout.id).toBe(NIZ_68_LAYOUT.id)
    expect(result.source).toBe('device')
  })

  it('allows the layout to be selected manually', () => {
    const result = resolveKeyboardLayout(NIZ_84_LAYOUT.id, {
      device: null,
      capture: null,
    })

    expect(result.layout).toBe(NIZ_84_LAYOUT)
    expect(result.source).toBe('manual')
  })

  it('detects the NIZ 84EC by PID and product name', () => {
    const byPid = resolveKeyboardLayout('auto', {
      device: { ...niz84Device, productName: 'NIZ keyboard' },
      capture: null,
    })
    const byName = resolveKeyboardLayout('auto', {
      device: { ...niz84Device, productId: 0xffff },
      capture: null,
    })

    expect(byPid).toEqual({ layout: NIZ_84_LAYOUT, source: 'device' })
    expect(byName).toEqual({ layout: NIZ_84_LAYOUT, source: 'device' })
  })

  it('detects an 84-key layout from a completed capture', () => {
    const result = resolveKeyboardLayout('auto', {
      device: null,
      capture: captureWithMaxPosition(84),
    })

    expect(result).toEqual({ layout: NIZ_84_LAYOUT, source: 'capture' })
  })

  it('does not classify the known 0x512A 66-key model as 84', () => {
    const result = detectKeyboardLayout({
      device: { ...niz84Device, productId: 0x512a },
      capture: captureWithMaxPosition(84),
    })

    expect(result).toBeNull()
  })

  it('finds physical keys through the resolved layout', () => {
    expect(physicalKeyAt(NIZ_68_LAYOUT, 68)?.label).toBe('→')
    expect(physicalKeyAt(NIZ_68_LAYOUT, 69)).toBeUndefined()
    expect(physicalKeyAt(NIZ_84_LAYOUT, 84)?.label).toBe('→')
  })
})
