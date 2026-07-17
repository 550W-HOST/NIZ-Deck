export type DiagnosticLevel = 'debug' | 'info' | 'success' | 'warn' | 'error'

export interface DiagnosticEvent {
  level: DiagnosticLevel
  scope: 'ui' | 'transport' | 'protocol'
  message: string
  data?: unknown
}

export interface DiagnosticLogEntry extends DiagnosticEvent {
  id: number
  timestamp: string
}

export type DiagnosticLogger = (event: DiagnosticEvent) => void

export function errorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof DOMException) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack,
    }
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }
  return { value: String(error) }
}
