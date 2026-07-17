import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  DeviceStatus,
  KeymapCapture,
  NizDeviceInfo,
} from '../domain/types'
import type {
  DiagnosticEvent,
  DiagnosticLogEntry,
  DiagnosticLogger,
} from '../domain/diagnostics'
import { errorDetails } from '../domain/diagnostics'
import { NizDeviceClient } from '../device/nizDeviceClient'
import type { DeviceConnectionMode } from '../device/contracts'
import {
  compareCompleteKeymapCaptures,
  validateCompleteKeymapCapture,
} from '../device/keymapWriteGuard'
import { WebHidTransport } from '../device/webHidTransport'
import {
  buildCompatibilityReport,
  type CompatibilityReadVerification,
} from '../device/compatibilityReport'
import {
  getNizDeviceSupport,
  type NizDeviceSupport,
} from '../device/nizDeviceModels'

export interface NizDeviceState {
  status: DeviceStatus
  device: NizDeviceInfo | null
  deviceSupport: NizDeviceSupport | null
  firmware: string | null
  capture: KeymapCapture | null
  readVerification: CompatibilityReadVerification
  progressRecords: number
  progressTotal: number
  recoveryRequired: boolean
  error: string | null
  logs: DiagnosticLogEntry[]
  connect(mode?: DeviceConnectionMode): Promise<void>
  disconnect(): Promise<void>
  refresh(): Promise<void>
  verifyKeymapWrite(): Promise<boolean>
  exportCapture(): void
  exportCompatibilityReport(): Promise<void>
  clearLogs(): void
}

export function useNizDevice(): NizDeviceState {
  const logSequence = useRef(0)
  const [logs, setLogs] = useState<DiagnosticLogEntry[]>([])
  const logger = useCallback<DiagnosticLogger>((event: DiagnosticEvent): void => {
    const entry: DiagnosticLogEntry = {
      ...event,
      id: ++logSequence.current,
      timestamp: new Date().toISOString(),
    }
    setLogs((current) => [...current.slice(-399), entry])
    const method = event.level === 'error'
      ? console.error
      : event.level === 'warn'
        ? console.warn
        : event.level === 'debug'
          ? console.debug
          : console.info
    method(`[NIZ:${event.scope}] ${event.message}`, event.data ?? '')
    ;(window as Window & { __nizDiagnostics?: DiagnosticLogEntry[] }).__nizDiagnostics = [
      ...((window as Window & { __nizDiagnostics?: DiagnosticLogEntry[] }).__nizDiagnostics ?? []).slice(-399),
      entry,
    ]
  }, [])
  const [client] = useState(() => {
    const transport = new WebHidTransport(logger)
    return new NizDeviceClient(transport, logger)
  })
  const [status, setStatus] = useState<DeviceStatus>(
    client.supported ? 'disconnected' : 'unsupported',
  )
  const [device, setDevice] = useState<NizDeviceInfo | null>(null)
  const [deviceSupport, setDeviceSupport] = useState<NizDeviceSupport | null>(null)
  const [firmware, setFirmware] = useState<string | null>(null)
  const [capture, setCapture] = useState<KeymapCapture | null>(null)
  const [readVerification, setReadVerification] = useState<CompatibilityReadVerification>({
    attempts: 0,
    consistent: null,
  })
  const [progressRecords, setProgressRecords] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [recoveryRequired, setRecoveryRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readDevice = useCallback(async (currentDevice: NizDeviceInfo): Promise<void> => {
    const initialSupport = getNizDeviceSupport(currentDevice)
    setDeviceSupport(initialSupport)
    if (!initialSupport?.canRead) {
      setReadVerification({ attempts: 0, consistent: null })
      setProgressRecords(0)
      setProgressTotal(0)
      setStatus('inspection-only')
      logger({
        level: 'warn',
        scope: 'protocol',
        message: 'Device retained for metadata inspection; no protocol command was sent',
        data: { reason: initialSupport?.reason ?? 'No device support profile' },
      })
      return
    }

    setStatus('reading-version')
    const nextFirmware = await client.readVersion()
    setFirmware(nextFirmware)
    setProgressRecords(0)
    setProgressTotal(0)
    setStatus('reading-keymap')
    let nextCapture = await client.readKeymap(({ records }) => {
      setProgressRecords(records)
    })
    let nextVerification: CompatibilityReadVerification = {
      attempts: 1,
      consistent: null,
    }
    setReadVerification(nextVerification)

    if (initialSupport.verification === 'read-candidate') {
      validateCompleteKeymapCapture(nextCapture)
      setCapture(nextCapture)
      setDeviceSupport(getNizDeviceSupport(
        currentDevice,
        nextCapture.summary.maxPosition,
      ))
      setProgressRecords(0)
      setProgressTotal(nextCapture.records.length)
      setReadVerification({ attempts: 2, consistent: false })
      logger({
        level: 'info',
        scope: 'protocol',
        message: 'Repeating keymap read for candidate-device consistency check',
        data: { baselineRecords: nextCapture.records.length },
      })
      const confirmationCapture = await client.readKeymap(({ records }) => {
        setProgressRecords(records)
      })
      const comparison = compareCompleteKeymapCaptures(nextCapture, confirmationCapture)
      if (comparison.mismatches.length > 0) {
        throw new Error(
          `Candidate device returned ${comparison.mismatches.length} inconsistent keymap records`,
        )
      }
      nextCapture = confirmationCapture
      nextVerification = { attempts: 2, consistent: true }
      logger({
        level: 'success',
        scope: 'protocol',
        message: 'Candidate-device keymap reads are consistent',
        data: { records: comparison.recordCount, mismatches: 0 },
      })
    }

    setDeviceSupport(getNizDeviceSupport(currentDevice, nextCapture.summary.maxPosition))
    setCapture(nextCapture)
    setReadVerification(nextVerification)
    setStatus('ready')
  }, [client, logger])

  const connect = useCallback(async (
    mode: DeviceConnectionMode = 'known',
  ): Promise<void> => {
    logger({
      level: 'info',
      scope: 'ui',
      message: mode === 'compatibility'
        ? 'Compatibility discovery activated'
        : 'Connect button activated',
      data: {
        mode,
        secureContext: window.isSecureContext,
        origin: window.location.origin,
        documentVisibility: document.visibilityState,
        hasUserActivation: navigator.userActivation?.isActive ?? null,
      },
    })
    setError(null)
    setDevice(null)
    setDeviceSupport(null)
    setFirmware(null)
    setCapture(null)
    setReadVerification({ attempts: 0, consistent: null })
    setStatus('connecting')
    try {
      const nextDevice = await client.connect(mode)
      setDevice(nextDevice)
      setDeviceSupport(getNizDeviceSupport(nextDevice))
      await readDevice(nextDevice)
    } catch (cause) {
      logger({
        level: 'error',
        scope: 'ui',
        message: 'Connection workflow failed',
        data: errorDetails(cause),
      })
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    }
  }, [client, logger, readDevice])

  const disconnect = useCallback(async (): Promise<void> => {
    await client.disconnect()
    setDevice(null)
    setDeviceSupport(null)
    setFirmware(null)
    setCapture(null)
    setReadVerification({ attempts: 0, consistent: null })
    setProgressRecords(0)
    setProgressTotal(0)
    setRecoveryRequired(false)
    setError(null)
    setStatus(client.supported ? 'disconnected' : 'unsupported')
  }, [client])

  const refresh = useCallback(async (): Promise<void> => {
    if (!device || !deviceSupport?.canRead) return
    if (recoveryRequired) {
      const message = 'Restore and verify the saved keymap before replacing the in-memory backup.'
      logger({ level: 'warn', scope: 'ui', message })
      setError(message)
      return
    }
    setError(null)
    try {
      await readDevice(device)
    } catch (cause) {
      logger({
        level: 'error',
        scope: 'ui',
        message: 'Refresh workflow failed',
        data: errorDetails(cause),
      })
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    }
  }, [device, deviceSupport?.canRead, logger, readDevice, recoveryRequired])

  const verifyKeymapWrite = useCallback(async (): Promise<boolean> => {
    if (!device || !capture) return false
    if (!deviceSupport?.canWrite) {
      const message = 'Keymap writing is disabled for this read-only device profile.'
      logger({ level: 'warn', scope: 'ui', message })
      setError(message)
      return false
    }

    const backup = capture
    let rewriteAttempted = false
    setError(null)
    setProgressRecords(0)
    setProgressTotal(backup.records.length)

    try {
      setStatus('validating-write')
      validateCompleteKeymapCapture(backup)
      logger({
        level: 'info',
        scope: 'protocol',
        message: 'Running second keymap read before rewrite',
        data: { baselineRecords: backup.records.length },
      })
      const preflight = await client.readKeymap(({ records }) => {
        setProgressRecords(records)
      })
      const preflightVerification = compareCompleteKeymapCaptures(backup, preflight)
      if (preflightVerification.mismatches.length > 0) {
        logger({
          level: 'error',
          scope: 'protocol',
          message: 'Keymap preflight captures do not match',
          data: {
            baselineRecords: backup.records.length,
            preflightRecords: preflight.records.length,
            mismatchCount: preflightVerification.mismatches.length,
            firstMismatches: preflightVerification.mismatches.slice(0, 10),
          },
        })
        throw new Error('Two keymap reads did not match; nothing was written')
      }

      setStatus('writing-keymap')
      setProgressRecords(0)
      rewriteAttempted = true
      await client.writeKeymap(backup, ({ records, total }) => {
        setProgressRecords(records)
        setProgressTotal(total)
      })

      setStatus('verifying-keymap')
      setProgressRecords(0)
      const readback = await client.readKeymap(({ records }) => {
        setProgressRecords(records)
      })
      const verification = compareCompleteKeymapCaptures(backup, readback)
      if (verification.mismatches.length > 0) {
        logger({
          level: 'error',
          scope: 'protocol',
          message: 'Keymap read-back verification found mismatches',
          data: {
            recordCount: verification.recordCount,
            mismatchCount: verification.mismatches.length,
            firstMismatches: verification.mismatches.slice(0, 10),
          },
        })
        throw new Error(
          `Keymap verification found ${verification.mismatches.length} mismatched records`,
        )
      }

      logger({
        level: 'success',
        scope: 'protocol',
        message: 'Keymap write verified by complete read-back',
        data: { recordCount: verification.recordCount, mismatches: 0 },
      })
      setCapture(readback)
      setRecoveryRequired(false)
      setProgressRecords(verification.recordCount)
      setStatus('ready')
      return true
    } catch (cause) {
      if (rewriteAttempted) setRecoveryRequired(true)
      logger({
        level: 'error',
        scope: 'ui',
        message: 'Keymap write verification failed',
        data: errorDetails(cause),
      })
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
      return false
    }
  }, [capture, client, device, deviceSupport?.canWrite, logger])

  const downloadJson = useCallback((value: unknown, filename: string): void => {
    const blob = new Blob([JSON.stringify(value, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }, [])

  const filenamePart = device?.productName
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'keyboard'

  const exportCapture = useCallback((): void => {
    if (!capture) return
    downloadJson(capture, `niz-${filenamePart}-${Date.now()}.json`)
  }, [capture, downloadJson, filenamePart])

  const exportCompatibilityReport = useCallback(async (): Promise<void> => {
    if (!device || !deviceSupport) return
    const report = await buildCompatibilityReport({
      device,
      firmware,
      support: deviceSupport,
      capture,
      verification: readVerification,
    })
    downloadJson(
      report,
      `niz-compatibility-${filenamePart}-${Date.now()}.json`,
    )
  }, [
    capture,
    device,
    deviceSupport,
    downloadJson,
    filenamePart,
    firmware,
    readVerification,
  ])

  const clearLogs = useCallback((): void => {
    setLogs([])
    ;(window as Window & { __nizDiagnostics?: DiagnosticLogEntry[] }).__nizDiagnostics = []
  }, [])

  useEffect(() => {
    const handlePageHide = (): void => {
      void client.disconnect().finally(() => client.dispose())
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => window.removeEventListener('pagehide', handlePageHide)
  }, [client])

  return {
    status,
    device,
    deviceSupport,
    firmware,
    capture,
    readVerification,
    progressRecords,
    progressTotal,
    recoveryRequired,
    error,
    logs,
    connect,
    disconnect,
    refresh,
    verifyKeymapWrite,
    exportCapture,
    exportCompatibilityReport,
    clearLogs,
  }
}
