import { describe, expect, it } from 'vitest'
import type { NizDeviceInfo } from '../domain/types'
import {
  NIZ_68_PRO_PRODUCT_ID,
  NIZ_84_EC_PRODUCT_ID,
  NIZ_87_PRODUCT_ID,
  NIZ_VENDOR_ID,
  getNizDeviceSupport,
} from './nizDeviceModels'

function device(overrides: Partial<NizDeviceInfo> = {}): NizDeviceInfo {
  return {
    productName: '68pro',
    vendorId: NIZ_VENDOR_ID,
    productId: NIZ_68_PRO_PRODUCT_ID,
    collections: [{
      usagePage: 0x008c,
      usage: 1,
      inputReportIds: [0],
      outputReportIds: [0],
    }],
    ...overrides,
  }
}

describe('NiZ device support profiles', () => {
  it('allows writes only for the hardware-verified 68 Pro profile', () => {
    expect(getNizDeviceSupport(device())).toMatchObject({
      profileId: 'niz-68-pro',
      verification: 'write-verified',
      canRead: true,
      canWrite: true,
      keyCount: 68,
    })

    expect(getNizDeviceSupport(device({
      productName: '84EC(S)BLe',
      productId: NIZ_84_EC_PRODUCT_ID,
      collections: [{
        usagePage: 0xff00,
        usage: 1,
        inputReportIds: [0],
        outputReportIds: [0],
      }],
    }))).toMatchObject({
      profileId: 'niz-84-ec',
      verification: 'read-candidate',
      canRead: true,
      canWrite: false,
      keyCount: 84,
    })
  })

  it('allows an unknown 87-key NiZ-like device to be probed read-only', () => {
    expect(getNizDeviceSupport(device({
      productName: '87EC(S)BLe',
      productId: 0x9001,
      collections: [{
        usagePage: 0xff00,
        usage: 1,
        inputReportIds: [0],
        outputReportIds: [0],
      }],
    }))).toMatchObject({
      profileId: 'community-candidate',
      verification: 'read-candidate',
      canRead: true,
      canWrite: false,
      keyCount: 87,
    })
  })

  it('recognizes the reported 0x5131 product ID as a read-only 87-key profile', () => {
    expect(getNizDeviceSupport(device({
      productName: 'USB Keyboard',
      productId: NIZ_87_PRODUCT_ID,
      collections: [{
        usagePage: 0xff00,
        usage: 1,
        inputReportIds: [0],
        outputReportIds: [0],
      }],
    }))).toMatchObject({
      profileId: 'niz-87',
      verification: 'read-candidate',
      canRead: true,
      canWrite: false,
      keyCount: 87,
    })
  })

  it('keeps unrelated STM devices metadata-only', () => {
    expect(getNizDeviceSupport(device({
      productName: 'STM32 bootloader',
      productId: 0x9002,
      collections: [{
        usagePage: 0xff00,
        usage: 1,
        inputReportIds: [0],
        outputReportIds: [0],
      }],
    }))).toMatchObject({
      verification: 'metadata-only',
      canRead: false,
      canWrite: false,
    })
  })

  it('requires a compatible programming collection before probing', () => {
    expect(getNizDeviceSupport(device({ collections: [] }))).toMatchObject({
      verification: 'metadata-only',
      canRead: false,
      canWrite: false,
    })
  })

  it('records an observed supported key count for generic NiZ candidates', () => {
    expect(getNizDeviceSupport(device({
      productName: 'NiZ keyboard',
      productId: 0x9003,
    }), 84)).toMatchObject({
      profileId: 'community-candidate',
      keyCount: 84,
      canRead: true,
      canWrite: false,
    })
  })
})
