import { describe, expect, it } from 'vitest'
import {
  NIZ_68_PRO_FILTER,
  NIZ_84_EC_FILTER,
  NIZ_COMPATIBILITY_FILTER,
  NIZ_DEVICE_FILTERS,
  summarizeHidCollections,
} from './webHidTransport'

describe('NIZ WebHID device filters', () => {
  it('offers both the known 68 Pro and 84EC product IDs', () => {
    expect(NIZ_DEVICE_FILTERS).toEqual([NIZ_68_PRO_FILTER, NIZ_84_EC_FILTER])
    expect(NIZ_68_PRO_FILTER).toEqual({
      vendorId: 0x0483,
      productId: 0x5532,
      usagePage: 0x008c,
      usage: 0x0001,
    })
    expect(NIZ_84_EC_FILTER).toEqual({
      vendorId: 0x0483,
      productId: 0x5129,
    })
  })

  it('uses an explicit vendor-wide filter only for compatibility discovery', () => {
    expect(NIZ_COMPATIBILITY_FILTER).toEqual({ vendorId: 0x0483 })
    expect(NIZ_DEVICE_FILTERS).not.toContain(NIZ_COMPATIBILITY_FILTER)
  })

  it('includes nested HID collections in compatibility metadata', () => {
    const child: HIDCollectionInfo = {
      usagePage: 0xff00,
      usage: 1,
      inputReports: [{ reportId: 0 }],
      outputReports: [{ reportId: 0 }],
      featureReports: [],
      children: [],
    }
    const parent: HIDCollectionInfo = {
      usagePage: 1,
      usage: 6,
      inputReports: [{ reportId: 1 }],
      outputReports: [],
      featureReports: [],
      children: [child],
    }

    expect(summarizeHidCollections([parent])).toEqual([
      {
        usagePage: 1,
        usage: 6,
        inputReportIds: [1],
        outputReportIds: [],
      },
      {
        usagePage: 0xff00,
        usage: 1,
        inputReportIds: [0],
        outputReportIds: [0],
      },
    ])
  })
})
