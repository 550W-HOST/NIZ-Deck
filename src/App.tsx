import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { DeviceRail } from './components/DeviceRail'
import { DiagnosticsPanel } from './components/DiagnosticsPanel'
import { KeyboardBoard } from './components/KeyboardBoard'
import { KeyInspector } from './components/KeyInspector'
import { LayoutPicker } from './components/LayoutPicker'
import { StatusBar } from './components/StatusBar'
import { WriteVerificationDialog } from './components/WriteVerificationDialog'
import { layerName } from './domain/formatters'
import type { LayoutSelection } from './domain/keyboardLayout'
import { physicalKeyAt, resolveKeyboardLayout } from './data/keyboardLayouts'
import { useNizDevice } from './hooks/useNizDevice'

function App() {
  const niz = useNizDevice()
  const [activeLayer, setActiveLayer] = useState(1)
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [layoutSelection, setLayoutSelection] = useState<LayoutSelection>('auto')
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [writeDialogOpen, setWriteDialogOpen] = useState(false)
  const resolvedLayout = useMemo(
    () => resolveKeyboardLayout(layoutSelection, {
      device: niz.device,
      capture: niz.capture,
    }),
    [layoutSelection, niz.capture, niz.device],
  )
  const { layout } = resolvedLayout
  const layers = useMemo(() => {
    const capturedLayers = Object.keys(niz.capture?.summary.byLayer ?? {})
      .map(Number)
      .filter(Number.isFinite)
      .sort((a, b) => a - b)
    return capturedLayers.length > 0 ? capturedLayers : [1, 2, 3]
  }, [niz.capture])
  const activeRecords = useMemo(
    () => niz.capture?.records.filter((record) => record.layer === activeLayer) ?? [],
    [activeLayer, niz.capture],
  )
  const selectedRecord = activeRecords.find(
    (record) => record.position === selectedPosition,
  )

  useEffect(() => {
    if (!physicalKeyAt(layout, selectedPosition)) {
      setSelectedPosition(layout.keys[0]?.position ?? 1)
    }
  }, [layout, selectedPosition])

  useEffect(() => {
    if (niz.status === 'error' || niz.status === 'unsupported') setDiagnosticsOpen(true)
  }, [niz.status])

  const handleConnect = (): void => {
    setDiagnosticsOpen(true)
    void niz.connect()
  }

  return (
    <div className="app-shell">
      <AppHeader
        status={niz.status}
        device={niz.device}
        firmware={niz.firmware}
        canExport={Boolean(niz.capture)}
        logCount={niz.logs.length}
        canRefresh={!niz.recoveryRequired}
        canVerifyWrite={Boolean(niz.capture && niz.device)}
        recoveryRequired={niz.recoveryRequired}
        onConnect={handleConnect}
        onDisconnect={() => void niz.disconnect()}
        onRefresh={() => void niz.refresh()}
        onExport={niz.exportCapture}
        onVerifyWrite={() => setWriteDialogOpen(true)}
        onToggleDiagnostics={() => setDiagnosticsOpen((open) => !open)}
      />

      <div className="content-stack">
        <div className="workspace">
          <DeviceRail
            status={niz.status}
            device={niz.device}
            firmware={niz.firmware}
            capture={niz.capture}
            keyCount={layout.keyCount}
          />

          <main className="keymap-workspace">
            <div className="keymap-toolbar">
              <div className="keymap-title">
                <span className="toolbar-eyebrow">Keymap</span>
                <div>
                  <h1>{niz.device?.productName ?? layout.name}</h1>
                  <span>{layout.keyCount} keys</span>
                </div>
              </div>
              <div className="keymap-toolbar-actions">
                <LayoutPicker
                  layout={layout}
                  selection={layoutSelection}
                  source={resolvedLayout.source}
                  onChange={setLayoutSelection}
                />
                <div className="layer-tabs" role="tablist" aria-label="Keymap layers">
                  {layers.map((layer) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeLayer === layer}
                      className={activeLayer === layer ? 'is-active' : ''}
                      key={layer}
                      onClick={() => setActiveLayer(layer)}
                    >
                      {layerName(layer)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <KeyboardBoard
              layout={layout}
              records={activeRecords}
              selectedPosition={selectedPosition}
              onSelect={setSelectedPosition}
            />
          </main>

          <KeyInspector
            physicalKey={physicalKeyAt(layout, selectedPosition)}
            record={selectedRecord}
            activeLayer={activeLayer}
          />
        </div>

        <DiagnosticsPanel
          open={diagnosticsOpen}
          entries={niz.logs}
          onClose={() => setDiagnosticsOpen(false)}
          onClear={niz.clearLogs}
        />
      </div>

      <StatusBar
        status={niz.status}
        progressRecords={niz.progressRecords}
        progressTotal={niz.progressTotal}
        error={niz.error}
      />

      <WriteVerificationDialog
        open={writeDialogOpen}
        deviceName={niz.device?.productName ?? 'No device'}
        firmware={niz.firmware}
        recordCount={niz.capture?.records.length ?? 0}
        recoveryRequired={niz.recoveryRequired}
        onClose={() => setWriteDialogOpen(false)}
        onDownloadBackup={niz.exportCapture}
        onConfirm={() => {
          setWriteDialogOpen(false)
          setDiagnosticsOpen(true)
          void niz.verifyKeymapWrite()
        }}
      />
    </div>
  )
}

export default App
