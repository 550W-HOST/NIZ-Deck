interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDReportInfo {
  reportId: number
}

interface HIDCollectionInfo {
  usagePage: number
  usage: number
  inputReports: readonly HIDReportInfo[]
  outputReports: readonly HIDReportInfo[]
  featureReports: readonly HIDReportInfo[]
  children: readonly HIDCollectionInfo[]
}

interface HIDInputReportEvent extends Event {
  readonly device: HIDDevice
  readonly reportId: number
  readonly data: DataView<ArrayBuffer>
}

interface HIDDevice extends EventTarget {
  readonly opened: boolean
  readonly vendorId: number
  readonly productId: number
  readonly productName: string
  readonly collections: readonly HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  addEventListener(
    type: 'inputreport',
    listener: (event: HIDInputReportEvent) => void,
    options?: boolean | AddEventListenerOptions,
  ): void
  removeEventListener(
    type: 'inputreport',
    listener: (event: HIDInputReportEvent) => void,
    options?: boolean | EventListenerOptions,
  ): void
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>
  requestDevice(options: { filters: HIDDeviceFilter[] }): Promise<HIDDevice[]>
}

interface Navigator {
  readonly hid: HID
}
