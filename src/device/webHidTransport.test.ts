import { describe, expect, it } from 'vitest'
import {
  NIZ_68_PRO_FILTER,
  NIZ_84_EC_FILTER,
  NIZ_87_FILTER,
  NIZ_COMPATIBILITY_FILTER,
  NIZ_DEVICE_FILTERS,
  selectNizHidDevice,
  summarizeHidCollections,
} from './webHidTransport'

function collection(
  usagePage: number,
  usage: number,
  inputReportIds: number[],
  outputReportIds: number[],
): HIDCollectionInfo {
  return {
    usagePage,
    usage,
    inputReports: inputReportIds.map((reportId) => ({ reportId })),
    outputReports: outputReportIds.map((reportId) => ({ reportId })),
    featureReports: [],
    children: [],
  }
}

function device(
  collections: HIDCollectionInfo[],
  productName = 'NIZ 87',
): HIDDevice {
  const events = new EventTarget()
  return {
    opened: false,
    productName,
    vendorId: 0x0483,
    productId: 0x5131,
    collections,
    open: () => Promise.resolve(),
    close: () => Promise.resolve(),
    sendReport: (_reportId: number, _data: BufferSource) => Promise.resolve(),
    addEventListener: (type, listener, options) => {
      events.addEventListener(type, listener as EventListener, options)
    },
    removeEventListener: (type, listener, options) => {
      events.removeEventListener(type, listener as EventListener, options)
    },
    dispatchEvent: (event) => events.dispatchEvent(event),
  }
}

describe('NIZ WebHID device filters', () => {
  it('offers the known 68 Pro, 84EC, and reported 87 product IDs', () => {
    expect(NIZ_DEVICE_FILTERS).toEqual([
      NIZ_68_PRO_FILTER,
      NIZ_84_EC_FILTER,
      NIZ_87_FILTER,
    ])
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
    expect(NIZ_87_FILTER).toEqual({
      vendorId: 0x0483,
      productId: 0x5131,
      usagePage: 0x008c,
      usage: 0x0001,
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

  it('selects the single programming interface from a composite keyboard', () => {
    const keyboard = device([collection(0x0001, 0x0006, [1], [])])
    const program = device([collection(0x008c, 0x0001, [0], [0])])
    const controls = device([collection(0x000c, 0x0001, [2], [])])

    expect(selectNizHidDevice([keyboard, program, controls])).toBe(program)
  })

  it('preserves a sole metadata-only selection for compatibility inspection', () => {
    const keyboard = device([collection(0x0001, 0x0006, [1], [])], 'Unknown STM device')

    expect(selectNizHidDevice([keyboard])).toBe(keyboard)
  })

  it('reports ambiguous multi-interface selections accurately', () => {
    const keyboard = device([collection(0x0001, 0x0006, [1], [])])
    const controls = device([collection(0x000c, 0x0001, [2], [])])
    const programA = device([collection(0x008c, 0x0001, [0], [0])])
    const programB = device([collection(0xff00, 0x0001, [0], [0])])

    expect(() => selectNizHidDevice([])).toThrow('No keyboard selected')
    expect(() => selectNizHidDevice([keyboard, controls]))
      .toThrow('No NIZ programming interface found among selected HID interfaces')
    expect(() => selectNizHidDevice([programA, programB]))
      .toThrow('Multiple NIZ programming interfaces selected')
  })
})
