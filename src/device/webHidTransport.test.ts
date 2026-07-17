import { describe, expect, it } from 'vitest'
import {
  NIZ_68_PRO_FILTER,
  NIZ_84_EC_FILTER,
  NIZ_DEVICE_FILTERS,
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
})
