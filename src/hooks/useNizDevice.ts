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
import {
  compareCompleteKeymapCaptures,
  validateCompleteKeymapCapture,
} from '../device/keymapWriteGuard'
import { WebHidTransport } from '../device/webHidTransport'

export interface NizDeviceState {
  status: DeviceStatus
  device: NizDeviceInfo | null
  firmware: string | null
  capture: KeymapCapture | null
  progressRecords: number
  progressTotal: number
  recoveryRequired: boolean
  error: string | null
  logs: DiagnosticLogEntry[]
  connect(): Promise<void>
  disconnect(): Promise<void>
  refresh(): Promise<void>
  verifyKeymapWrite(): Promise<boolean>
  exportCapture(): void
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
  const [firmware, setFirmware] = useState<string | null>(null)
  const [capture, setCapture] = useState<KeymapCapture | null>(null)
  const [progressRecords, setProgressRecords] = useState(0)
  const [progressTotal, setProgressTotal] = useState(0)
  const [recoveryRequired, setRecoveryRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const readDevice = useCallback(async (): Promise<void> => {
    setStatus('reading-version')
    const nextFirmware = await client.readVersion()
    setFirmware(nextFirmware)
    setProgressRecords(0)
    setProgressTotal(0)
    setStatus('reading-keymap')
    const nextCapture = await client.readKeymap(({ records }) => {
      setProgressRecords(records)
    })
    setCapture(nextCapture)
    setStatus('ready')
  }, [client])

  const connect = useCallback(async (): Promise<void> => {
    logger({
      level: 'info',
      scope: 'ui',
      message: 'Connect button activated',
      data: {
        secureContext: window.isSecureContext,
        origin: window.location.origin,
        documentVisibility: document.visibilityState,
        hasUserActivation: navigator.userActivation?.isActive ?? null,
      },
    })
    setError(null)
    setStatus('connecting')
    try {
      const nextDevice = await client.connect()
      setDevice(nextDevice)
      await readDevice()
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
    setFirmware(null)
    setCapture(null)
    setProgressRecords(0)
    setProgressTotal(0)
    setRecoveryRequired(false)
    setError(null)
    setStatus(client.supported ? 'disconnected' : 'unsupported')
  }, [client])

  const refresh = useCallback(async (): Promise<void> => {
    if (!device) return
    if (recoveryRequired) {
      const message = 'Restore and verify the saved keymap before replacing the in-memory backup.'
      logger({ level: 'warn', scope: 'ui', message })
      setError(message)
      return
    }
    setError(null)
    try {
      await readDevice()
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
  }, [device, logger, readDevice, recoveryRequired])

  const verifyKeymapWrite = useCallback(async (): Promise<boolean> => {
    if (!device || !capture) return false

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
  }, [capture, client, device, logger])

  const exportCapture = useCallback((): void => {
    if (!capture) return
    const blob = new Blob([JSON.stringify(capture, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `niz-${device?.productName ?? 'keyboard'}-${Date.now()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [capture, device])

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
    firmware,
    capture,
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
    clearLogs,
  }
}
