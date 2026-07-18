import type {
  DeviceConnectionMode,
  HidReportListener,
  HidTransport,
} from './contracts'
import type { NizDeviceInfo } from '../domain/types'
import type { DeviceCollectionSummary } from '../domain/types'
import type { DiagnosticLogger } from '../domain/diagnostics'
import { errorDetails } from '../domain/diagnostics'
import { NIZ_COMMAND, NIZ_REPORT_LENGTH } from '../protocol/nizProtocol'
import {
  NIZ_68_PRO_PRODUCT_ID,
  NIZ_84_EC_PRODUCT_ID,
  NIZ_87_PRODUCT_ID,
  NIZ_VENDOR_ID,
} from './nizDeviceModels'

export const NIZ_68_PRO_FILTER: HIDDeviceFilter = {
  vendorId: NIZ_VENDOR_ID,
  productId: NIZ_68_PRO_PRODUCT_ID,
  usagePage: 0x008c,
  usage: 0x0001,
}

export const NIZ_84_EC_FILTER: HIDDeviceFilter = {
  vendorId: NIZ_VENDOR_ID,
  productId: NIZ_84_EC_PRODUCT_ID,
}

export const NIZ_87_FILTER: HIDDeviceFilter = {
  vendorId: NIZ_VENDOR_ID,
  productId: NIZ_87_PRODUCT_ID,
}

export const NIZ_COMPATIBILITY_FILTER: HIDDeviceFilter = {
  vendorId: NIZ_VENDOR_ID,
}

export const NIZ_DEVICE_FILTERS: readonly HIDDeviceFilter[] = [
  NIZ_68_PRO_FILTER,
  NIZ_84_EC_FILTER,
  NIZ_87_FILTER,
]

export function summarizeHidCollections(
  collections: readonly HIDCollectionInfo[],
): DeviceCollectionSummary[] {
  return collections.flatMap((collection) => [{
    usagePage: collection.usagePage,
    usage: collection.usage,
    inputReportIds: collection.inputReports.map((report) => report.reportId),
    outputReportIds: collection.outputReports.map((report) => report.reportId),
  }, ...summarizeHidCollections(collection.children)])
}

export class WebHidTransport implements HidTransport {
  readonly supported = 'hid' in navigator
  private readonly logger: DiagnosticLogger
  private device: HIDDevice | null = null
  private readonly listeners = new Set<HidReportListener>()

  constructor(logger: DiagnosticLogger = () => {}) {
    this.logger = logger
    this.logger({
      level: this.supported ? 'info' : 'error',
      scope: 'transport',
      message: this.supported ? 'WebHID API detected' : 'WebHID API unavailable',
      data: {
        secureContext: window.isSecureContext,
        origin: window.location.origin,
        userAgent: navigator.userAgent,
      },
    })
  }

  get connected(): boolean {
    return this.device?.opened ?? false
  }

  async connect(mode: DeviceConnectionMode = 'known'): Promise<NizDeviceInfo> {
    if (!this.supported) throw new Error('WebHID is not supported by this browser')

    if (!window.isSecureContext) {
      this.logger({
        level: 'error',
        scope: 'transport',
        message: 'WebHID requires a secure context',
        data: { origin: window.location.origin },
      })
      throw new Error('WebHID requires HTTPS or localhost')
    }

    const filters = mode === 'compatibility'
      ? [NIZ_COMPATIBILITY_FILTER]
      : [...NIZ_DEVICE_FILTERS]
    this.logger({
      level: 'info',
      scope: 'transport',
      message: 'Opening WebHID device picker',
      data: { mode, filters },
    })
    let devices: HIDDevice[]
    try {
      devices = await navigator.hid.requestDevice({
        filters,
      })
    } catch (error) {
      this.logger({
        level: 'error',
        scope: 'transport',
        message: 'Device picker failed',
        data: errorDetails(error),
      })
      throw error
    }
    this.logger({
      level: devices.length === 1 ? 'success' : 'warn',
      scope: 'transport',
      message: 'Device picker completed',
      data: { selectedDevices: devices.length },
    })
    if (devices.length !== 1) {
      throw new Error(devices.length === 0 ? 'No keyboard selected' : 'Multiple keyboards selected')
    }

    const device = devices[0]
    this.logger({
      level: 'info',
      scope: 'transport',
      message: 'Opening HID device',
      data: {
        productName: device.productName,
        vendorId: device.vendorId,
        productId: device.productId,
        alreadyOpened: device.opened,
      },
    })
    try {
      if (!device.opened) await device.open()
    } catch (error) {
      this.logger({
        level: 'error',
        scope: 'transport',
        message: 'HID device open failed',
        data: errorDetails(error),
      })
      throw error
    }
    device.addEventListener('inputreport', this.handleInputReport)
    this.device = device
    const description = this.describeDevice(device)
    this.logger({
      level: 'success',
      scope: 'transport',
      message: 'HID device opened',
      data: description,
    })
    return description
  }

  async disconnect(): Promise<void> {
    if (!this.device) return
    this.logger({ level: 'info', scope: 'transport', message: 'Disconnecting HID device' })
    this.device.removeEventListener('inputreport', this.handleInputReport)
    if (this.device.opened) await this.device.close()
    this.device = null
    this.logger({ level: 'success', scope: 'transport', message: 'HID device disconnected' })
  }

  async send(bytes: Uint8Array<ArrayBuffer>): Promise<void> {
    if (!this.device?.opened) throw new Error('Keyboard is not connected')
    if (bytes.byteLength !== NIZ_REPORT_LENGTH) {
      throw new RangeError(`Expected a ${NIZ_REPORT_LENGTH}-byte NIZ report`)
    }
    const command = bytes[1]
    this.logger({
      level: 'debug',
      scope: 'transport',
      message: `TX 0x${command?.toString(16).padStart(2, '0').toUpperCase()}`,
      data: command === NIZ_COMMAND.KEY_DATA
        ? {
            reportId: 0,
            length: bytes.byteLength,
            layer: bytes[2],
            position: bytes[3],
            functionType: bytes[4],
            payload: 'redacted',
          }
        : { reportId: 0, length: bytes.byteLength, head: Array.from(bytes.slice(0, 12)) },
    })
    try {
      await this.device.sendReport(0, bytes)
    } catch (error) {
      this.logger({
        level: 'error',
        scope: 'transport',
        message: 'HID sendReport failed',
        data: errorDetails(error),
      })
      throw error
    }
  }

  subscribe(listener: HidReportListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private readonly handleInputReport = (event: HIDInputReportEvent): void => {
    const bytes = Array.from(new Uint8Array(
      event.data.buffer,
      event.data.byteOffset,
      event.data.byteLength,
    ))
    const command = bytes[1]
    this.logger({
      level: 'debug',
      scope: 'transport',
      message: `RX 0x${command?.toString(16).padStart(2, '0').toUpperCase()}`,
      data: command === NIZ_COMMAND.KEY_DATA
        ? {
            reportId: event.reportId,
            length: bytes.length,
            layer: bytes[2],
            position: bytes[3],
            functionType: bytes[4],
            payload: 'redacted',
          }
        : { reportId: event.reportId, length: bytes.length, head: bytes.slice(0, 12) },
    })
    for (const listener of this.listeners) {
      listener({ reportId: event.reportId, bytes })
    }
  }

  private describeDevice(device: HIDDevice): NizDeviceInfo {
    return {
      productName: device.productName,
      vendorId: device.vendorId,
      productId: device.productId,
      collections: summarizeHidCollections(device.collections),
    }
  }
}
