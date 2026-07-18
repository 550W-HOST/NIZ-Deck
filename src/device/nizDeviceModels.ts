import type { NizDeviceInfo } from '../domain/types'

export const NIZ_VENDOR_ID = 0x0483
export const NIZ_68_PRO_PRODUCT_ID = 0x5532
export const NIZ_84_EC_PRODUCT_ID = 0x5129
export const NIZ_87_PRODUCT_ID = 0x5131
export const NIZ_66_PRODUCT_ID = 0x512a

export const NIZ_SUPPORTED_KEY_COUNTS = [68, 84, 87] as const
export type NizSupportedKeyCount = (typeof NIZ_SUPPORTED_KEY_COUNTS)[number]

export type NizDeviceVerification =
  | 'write-verified'
  | 'read-candidate'
  | 'metadata-only'

export interface NizDeviceSupport {
  profileId: 'niz-68-pro' | 'niz-84-ec' | 'niz-87' | 'community-candidate' | 'unrecognized'
  label: string
  verification: NizDeviceVerification
  keyCount: NizSupportedKeyCount | null
  canRead: boolean
  canWrite: boolean
  reason: string
}

export function isSupportedNizKeyCount(
  keyCount: number,
): keyCount is NizSupportedKeyCount {
  return NIZ_SUPPORTED_KEY_COUNTS.some((supported) => supported === keyCount)
}

export function isKnownNiz66Device(
  device: NizDeviceInfo | null | undefined,
): boolean {
  return device?.vendorId === NIZ_VENDOR_ID && device.productId === NIZ_66_PRODUCT_ID
}

export function detectNizDeviceKeyCount(
  device: NizDeviceInfo | null | undefined,
): NizSupportedKeyCount | null {
  if (!device) return null

  // 0x512A is identified by existing native tools as a 66-key model.
  if (isKnownNiz66Device(device)) return null
  if (device.vendorId === NIZ_VENDOR_ID && device.productId === NIZ_84_EC_PRODUCT_ID) {
    return 84
  }
  if (device.vendorId === NIZ_VENDOR_ID && device.productId === NIZ_87_PRODUCT_ID) {
    return 87
  }
  if (device.vendorId === NIZ_VENDOR_ID && device.productId === NIZ_68_PRO_PRODUCT_ID) {
    return 68
  }

  const productName = device.productName.trim().toLowerCase()
  if (/(?:^|[^0-9])x?87(?:ec)?(?:[^0-9]|$)/i.test(productName)) return 87
  if (/(?:^|[^0-9])84(?:ec)?(?:[^0-9]|$)/i.test(productName)) return 84
  if (/(?:^|[^0-9])68\s*pro(?:[^0-9]|$)/i.test(productName)) return 68

  return null
}

export function hasNizProgramCollection(
  device: NizDeviceInfo | null | undefined,
): boolean {
  return device?.collections.some((collection) => (
    collection.inputReportIds.includes(0)
    && collection.outputReportIds.includes(0)
    && (collection.usagePage === 0x008c || collection.usagePage >= 0xff00)
  )) ?? false
}

function metadataOnlySupport(
  reason: string,
  keyCount: NizSupportedKeyCount | null = null,
): NizDeviceSupport {
  return {
    profileId: 'unrecognized',
    label: 'Unrecognized device',
    verification: 'metadata-only',
    keyCount,
    canRead: false,
    canWrite: false,
    reason,
  }
}

export function getNizDeviceSupport(
  device: NizDeviceInfo | null | undefined,
  observedKeyCount?: number,
): NizDeviceSupport | null {
  if (!device) return null

  const detectedKeyCount = detectNizDeviceKeyCount(device)
  const keyCount = observedKeyCount !== undefined && isSupportedNizKeyCount(observedKeyCount)
    ? observedKeyCount
    : detectedKeyCount

  if (device.vendorId !== NIZ_VENDOR_ID) {
    return metadataOnlySupport('The selected device does not use the expected USB vendor ID')
  }
  if (isKnownNiz66Device(device)) {
    return metadataOnlySupport('This known 66-key model is not supported')
  }
  if (!hasNizProgramCollection(device)) {
    return metadataOnlySupport('No compatible HID programming collection was found', keyCount)
  }

  if (device.productId === NIZ_68_PRO_PRODUCT_ID) {
    return {
      profileId: 'niz-68-pro',
      label: '68 Pro verified',
      verification: 'write-verified',
      keyCount: 68,
      canRead: true,
      canWrite: true,
      reason: 'The connected VID, PID, and HID collection match the verified 68 Pro profile',
    }
  }

  if (device.productId === NIZ_84_EC_PRODUCT_ID) {
    return {
      profileId: 'niz-84-ec',
      label: '84EC read only',
      verification: 'read-candidate',
      keyCount: 84,
      canRead: true,
      canWrite: false,
      reason: 'The 84EC profile is recognized but has not been verified for writing on hardware',
    }
  }

  if (device.productId === NIZ_87_PRODUCT_ID) {
    return {
      profileId: 'niz-87',
      label: '87 read only',
      verification: 'read-candidate',
      keyCount: 87,
      canRead: true,
      canWrite: false,
      reason: 'The reported NIZ 87 profile is recognized but has not been verified for writing on hardware',
    }
  }

  const productName = device.productName.trim().toLowerCase()
  const looksLikeNiz = keyCount !== null || /(?:^|[^a-z])(?:niz|plum)(?:[^a-z]|$)/i.test(productName)
  if (!looksLikeNiz) {
    return metadataOnlySupport('The device name and HID collections are not specific enough to run a NiZ protocol probe')
  }

  return {
    profileId: 'community-candidate',
    label: 'Candidate read only',
    verification: 'read-candidate',
    keyCount,
    canRead: true,
    canWrite: false,
    reason: 'This device has NiZ-like identity and HID characteristics but is not write verified',
  }
}
