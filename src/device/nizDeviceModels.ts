import type { NizDeviceInfo } from '../domain/types'

export const NIZ_VENDOR_ID = 0x0483
export const NIZ_68_PRO_PRODUCT_ID = 0x5532
export const NIZ_84_EC_PRODUCT_ID = 0x5129
export const NIZ_66_PRODUCT_ID = 0x512a

export const NIZ_SUPPORTED_KEY_COUNTS = [68, 84, 87] as const
export type NizSupportedKeyCount = (typeof NIZ_SUPPORTED_KEY_COUNTS)[number]

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
  if (device.vendorId === NIZ_VENDOR_ID && device.productId === NIZ_68_PRO_PRODUCT_ID) {
    return 68
  }

  const productName = device.productName.trim().toLowerCase()
  if (/(?:^|[^0-9])x?87(?:ec)?(?:[^0-9]|$)/i.test(productName)) return 87
  if (/(?:^|[^0-9])84(?:ec)?(?:[^0-9]|$)/i.test(productName)) return 84
  if (/(?:^|[^0-9])68\s*pro(?:[^0-9]|$)/i.test(productName)) return 68

  return null
}
