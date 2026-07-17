import type {
  DeviceConnectionMode,
  HidReport,
  HidTransport,
  NizDeviceReader,
  NizDeviceWriter,
} from './contracts'
import type {
  KeymapCapture,
  KeymapRecord,
  KeymapWriteProgress,
  NizDeviceInfo,
  ReadProgress,
} from '../domain/types'
import type { DiagnosticLogger } from '../domain/diagnostics'
import {
  NIZ_COMMAND,
  decodeVersion,
  encodeCommand,
  packetType,
  parseKeymapRecord,
  summarizeKeymap,
} from '../protocol/nizProtocol'
import {
  encodeKeymapCommit,
  validateCompleteKeymapCapture,
} from './keymapWriteGuard'
import { getNizDeviceSupport } from './nizDeviceModels'

interface Collector<T> {
  label: string
  handle(report: HidReport): void
  promise: Promise<T>
  cancel(error: Error): void
}

const wait = (milliseconds: number): Promise<void> => (
  new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds))
)

export class NizDeviceClient implements NizDeviceReader, NizDeviceWriter {
  private readonly transport: HidTransport
  private readonly logger: DiagnosticLogger
  private deviceInfo: NizDeviceInfo | null = null
  private firmware: string | null = null
  private activeCollector: Collector<unknown> | null = null
  private readonly unsubscribe: () => void

  constructor(transport: HidTransport, logger: DiagnosticLogger = () => {}) {
    this.transport = transport
    this.logger = logger
    this.unsubscribe = transport.subscribe((report) => {
      this.activeCollector?.handle(report)
    })
  }

  get supported(): boolean {
    return this.transport.supported
  }

  async connect(mode: DeviceConnectionMode = 'known'): Promise<NizDeviceInfo> {
    this.logger({ level: 'info', scope: 'protocol', message: 'Connecting device client' })
    this.deviceInfo = await this.transport.connect(mode)
    this.logger({
      level: 'debug',
      scope: 'protocol',
      message: 'Waiting for HID control interface to settle',
      data: { delayMs: 300 },
    })
    await wait(300)
    return this.deviceInfo
  }

  async disconnect(): Promise<void> {
    this.cancelActiveCollector(new Error('Keyboard disconnected'))
    await this.transport.disconnect()
    this.deviceInfo = null
    this.firmware = null
  }

  dispose(): void {
    this.cancelActiveCollector(new Error('Device client disposed'))
    this.unsubscribe()
  }

  async readVersion(): Promise<string> {
    this.assertReadableDevice()
    this.logger({ level: 'info', scope: 'protocol', message: 'Reading firmware version' })
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      this.logger({
        level: 'info',
        scope: 'protocol',
        message: 'Firmware read attempt',
        data: { attempt, maxAttempts: 3 },
      })
      const collector = this.createCollector<string>(
        `Version read attempt ${attempt}`,
        2_000,
        (report, finish) => {
          if (packetType(report.bytes) !== NIZ_COMMAND.VERSION) return
          finish(decodeVersion(report.bytes))
        },
      )
      try {
        const firmware = await this.sendAndCollect(NIZ_COMMAND.VERSION, collector)
        this.firmware = firmware
        this.logger({
          level: 'success',
          scope: 'protocol',
          message: 'Firmware version received',
          data: { firmware, attempt },
        })
        return firmware
      } catch (error) {
        if (attempt === 3) {
          this.logger({
            level: 'error',
            scope: 'protocol',
            message: 'No input reports received after three version requests',
            data: {
              possibleCauses: [
                'Another browser tab or configurator owns the HID interface',
                'The keyboard needs to be unplugged and reconnected',
              ],
            },
          })
          throw new Error(
            'Keyboard opened but did not respond. Close other configurators, reconnect it, and retry.',
            { cause: error },
          )
        }
        const retryDelayMs = attempt * 350
        this.logger({
          level: 'warn',
          scope: 'protocol',
          message: 'Firmware response missing; retry scheduled',
          data: { attempt, retryDelayMs },
        })
        await wait(retryDelayMs)
      }
    }
    throw new Error('Firmware version could not be read')
  }

  async readKeymap(
    onProgress?: (progress: ReadProgress) => void,
  ): Promise<KeymapCapture> {
    this.assertReadableDevice()

    this.logger({ level: 'info', scope: 'protocol', message: 'Reading complete keymap' })

    const rawReports: number[][] = []
    const otherReports: number[][] = []
    const records: KeymapRecord[] = []
    const collector = this.createCollector<KeymapCapture>(
      'Keymap read',
      15_000,
      (report, finish) => {
        rawReports.push(report.bytes)
        const type = packetType(report.bytes)
        if (type === NIZ_COMMAND.KEY_DATA) {
          records.push(parseKeymapRecord(report.bytes))
          onProgress?.({ records: records.length })
          if (records.length === 1 || records.length % 25 === 0) {
            this.logger({
              level: 'debug',
              scope: 'protocol',
              message: 'Keymap read progress',
              data: { records: records.length },
            })
          }
          return
        }
        if (type === NIZ_COMMAND.DATA_END) {
          this.logger({
            level: 'success',
            scope: 'protocol',
            message: 'Keymap data-end received',
            data: { records: records.length, otherReports: otherReports.length },
          })
          finish({
            schemaVersion: 1,
            capturedAt: new Date().toISOString(),
            device: this.deviceInfo!,
            firmware: this.firmware,
            summary: summarizeKeymap(records),
            rawReports,
            records,
            otherReports,
          })
          return
        }
        otherReports.push(report.bytes)
      },
    )

    return this.sendAndCollect(NIZ_COMMAND.READ_KEYMAP, collector)
  }

  async writeKeymap(
    capture: KeymapCapture,
    onProgress?: (progress: KeymapWriteProgress) => void,
  ): Promise<void> {
    if (!this.deviceInfo || !this.transport.connected) {
      throw new Error('Keyboard is not connected')
    }
    if (this.activeCollector) {
      throw new Error(`${this.activeCollector.label} is already active`)
    }
    if (
      capture.device.vendorId !== this.deviceInfo.vendorId
      || capture.device.productId !== this.deviceInfo.productId
      || capture.device.productName !== this.deviceInfo.productName
    ) {
      throw new Error('The keymap backup belongs to a different keyboard')
    }
    if (!this.firmware || capture.firmware !== this.firmware) {
      throw new Error('The keymap backup firmware does not match the connected keyboard')
    }
    const support = getNizDeviceSupport(this.deviceInfo, capture.summary.maxPosition)
    if (!support?.canWrite) {
      throw new Error('Keymap writing is disabled for devices without a hardware-verified write profile')
    }

    const records = validateCompleteKeymapCapture(capture)
    const total = records.length
    let recordsSent = 0
    let rewriteStarted = false

    this.logger({
      level: 'warn',
      scope: 'protocol',
      message: 'Starting complete keymap rewrite',
      data: {
        records: total,
        keyCount: capture.summary.maxPosition,
        layers: Object.keys(capture.summary.byLayer).length,
        firmware: this.firmware,
        sequence: ['0xF1', `${total} x 0xF0`, '0xF6'],
      },
    })

    try {
      await this.transport.send(encodeCommand(NIZ_COMMAND.WRITE_KEYMAP))
      rewriteStarted = true

      for (const record of records) {
        await this.transport.send(new Uint8Array(record.raw))
        recordsSent += 1
        onProgress?.({ records: recordsSent, total })
        if (recordsSent === 1 || recordsSent % 25 === 0 || recordsSent === total) {
          this.logger({
            level: 'debug',
            scope: 'protocol',
            message: 'Keymap write progress',
            data: { records: recordsSent, total },
          })
        }
      }

      await this.transport.send(encodeKeymapCommit())
      this.logger({
        level: 'success',
        scope: 'protocol',
        message: 'Complete keymap write sequence sent',
        data: { records: recordsSent, total, settleDelayMs: 500 },
      })
      await wait(500)
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause))
      this.logger({
        level: 'error',
        scope: 'protocol',
        message: 'Complete keymap write sequence interrupted',
        data: {
          name: error.name,
          message: error.message,
          recordsSent,
          total,
          recoveryRequired: rewriteStarted,
        },
      })
      if (rewriteStarted) {
        throw new Error(
          `Keymap write stopped after ${recordsSent}/${total} records. Keep the keyboard connected and retry the saved backup.`,
          { cause: error },
        )
      }
      throw error
    }
  }

  private createCollector<T>(
    label: string,
    timeoutMs: number,
    onReport: (report: HidReport, finish: (value: T) => void) => void,
  ): Collector<T> {
    if (this.activeCollector) {
      throw new Error(`${this.activeCollector.label} is already active`)
    }

    this.logger({
      level: 'debug',
      scope: 'protocol',
      message: `${label} collector started`,
      data: { timeoutMs },
    })

    let settled = false
    let resolvePromise: (value: T) => void = () => {}
    let rejectPromise: (error: Error) => void = () => {}
    const promise = new Promise<T>((resolve, reject) => {
      resolvePromise = resolve
      rejectPromise = reject
    })

    const finish = (value: T): void => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      this.activeCollector = null
      resolvePromise(value)
    }
    const cancel = (error: Error): void => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      this.activeCollector = null
      this.logger({
        level: 'error',
        scope: 'protocol',
        message: `${label} collector cancelled`,
        data: { name: error.name, message: error.message },
      })
      rejectPromise(error)
    }
    const timeout = globalThis.setTimeout(() => {
      cancel(new Error(`${label} timed out`))
    }, timeoutMs)

    const collector: Collector<T> = {
      label,
      promise,
      cancel,
      handle(report) {
        try {
          onReport(report, finish)
        } catch (error) {
          cancel(error instanceof Error ? error : new Error(String(error)))
        }
      },
    }
    this.activeCollector = collector as Collector<unknown>
    return collector
  }

  private assertReadableDevice(): void {
    if (!this.deviceInfo || !this.transport.connected) {
      throw new Error('Keyboard is not connected')
    }
    const support = getNizDeviceSupport(this.deviceInfo)
    if (!support?.canRead) {
      throw new Error(
        'No NiZ-compatible programming interface was identified; no protocol command was sent',
      )
    }
  }

  private async sendAndCollect<T>(command: number, collector: Collector<T>): Promise<T> {
    try {
      await this.transport.send(encodeCommand(command))
      return await collector.promise
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error))
      collector.cancel(failure)
      await collector.promise.catch(() => undefined)
      throw failure
    }
  }

  private cancelActiveCollector(error: Error): void {
    this.activeCollector?.cancel(error)
  }
}
