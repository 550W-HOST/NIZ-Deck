import { useEffect, useMemo, useReducer, useState } from 'react'
import './App.css'
import { AppHeader } from './components/AppHeader'
import { DeviceRail } from './components/DeviceRail'
import { DiagnosticsPanel } from './components/DiagnosticsPanel'
import { DraftBar } from './components/DraftBar'
import { DraftReviewDialog } from './components/DraftReviewDialog'
import { KeyboardBoard } from './components/KeyboardBoard'
import { KeyInspector } from './components/KeyInspector'
import { LayerTabs } from './components/LayerTabs'
import { LayoutPicker } from './components/LayoutPicker'
import { StatusBar } from './components/StatusBar'
import { WriteVerificationDialog } from './components/WriteVerificationDialog'
import type { LayoutSelection } from './domain/keyboardLayout'
import { physicalKeyAt, resolveKeyboardLayout } from './data/keyboardLayouts'
import { useNizDevice } from './hooks/useNizDevice'
import {
  createKeymapDraftState,
  draftAssignmentFor,
  draftRecordKey,
  keymapDraftChanges,
  keymapDraftReducer,
} from './domain/keymapDraft'

function App() {
  const niz = useNizDevice()
  const [activeLayer, setActiveLayer] = useState(1)
  const [layerTransitionDirection, setLayerTransitionDirection] = useState<
    'previous' | 'next'
  >('next')
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [layoutSelection, setLayoutSelection] = useState<LayoutSelection>('auto')
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false)
  const [writeDialogOpen, setWriteDialogOpen] = useState(false)
  const [draftReviewOpen, setDraftReviewOpen] = useState(false)
  const [keymapDraft, dispatchKeymapDraft] = useReducer(
    keymapDraftReducer,
    undefined,
    createKeymapDraftState,
  )
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
  const draftChanges = keymapDraftChanges(keymapDraft)
  const draftSessionVisible = draftChanges.length > 0
    || keymapDraft.past.length > 0
    || keymapDraft.future.length > 0
  const displayedActiveRecords = useMemo(
    () => activeRecords.map((record) => {
      const assignment = draftAssignmentFor(keymapDraft, record)
      return assignment && assignment !== record.action
        ? { ...record, action: assignment }
        : record
    }),
    [activeRecords, keymapDraft],
  )
  const modifiedPositions = useMemo(
    () => new Set(
      draftChanges
        .filter((change) => change.layer === activeLayer)
        .map((change) => change.position),
    ),
    [activeLayer, draftChanges],
  )
  const selectedRecord = activeRecords.find(
    (record) => record.position === selectedPosition,
  )
  const selectedAssignment = draftAssignmentFor(keymapDraft, selectedRecord)
  const selectedRecordChanged = Boolean(
    selectedRecord && keymapDraft.present[draftRecordKey(selectedRecord)],
  )
  const showsDeviceRail = Boolean(niz.device || niz.capture)
  const showsKeyInspector = Boolean(niz.capture)
  const diagnosticAlertCount = niz.logs.filter(
    (entry) => entry.level === 'warn' || entry.level === 'error',
  ).length
  const workspaceClassName = [
    'workspace',
    showsDeviceRail ? '' : 'workspace--no-device-rail',
    showsKeyInspector ? '' : 'workspace--no-inspector',
  ].filter(Boolean).join(' ')

  useEffect(() => {
    if (!physicalKeyAt(layout, selectedPosition)) {
      setSelectedPosition(layout.keys[0]?.position ?? 1)
    }
  }, [layout, selectedPosition])

  useEffect(() => {
    if (niz.status === 'error' || niz.status === 'unsupported') setDiagnosticsOpen(true)
  }, [niz.status])

  useEffect(() => {
    dispatchKeymapDraft({ type: 'clear' })
    setDraftReviewOpen(false)
  }, [niz.capture?.capturedAt])

  useEffect(() => {
    if (draftChanges.length === 0) return undefined
    const handleBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [draftChanges.length])

  const handleConnect = (): void => {
    setDiagnosticsOpen(true)
    void niz.connect()
  }

  const handleCompatibilityConnect = (): void => {
    setDiagnosticsOpen(true)
    void niz.connect('compatibility')
  }

  const exportsCompatibilityReport = Boolean(
    niz.device && !niz.deviceSupport?.canWrite,
  )

  const handleLayerChange = (
    layer: number,
    direction?: 'previous' | 'next',
  ): void => {
    if (layer === activeLayer) return
    setLayerTransitionDirection(direction ?? (layer < activeLayer ? 'previous' : 'next'))
    setActiveLayer(layer)
  }

  const runAfterDraftConfirmation = (action: () => void): void => {
    if (
      draftChanges.length > 0
      && !window.confirm('Discard the pending keymap draft?')
    ) return
    dispatchKeymapDraft({ type: 'clear' })
    setDraftReviewOpen(false)
    action()
  }

  return (
    <div className={`app-shell${draftSessionVisible ? ' app-shell--has-draft' : ''}`}>
      <AppHeader
        status={niz.status}
        device={niz.device}
        canExport={exportsCompatibilityReport ? Boolean(niz.device) : Boolean(niz.capture)}
        exportMode={exportsCompatibilityReport ? 'compatibility' : 'capture'}
        diagnosticAlertCount={diagnosticAlertCount}
        canRefresh={Boolean(niz.deviceSupport?.canRead && !niz.recoveryRequired)}
        canVerifyWrite={Boolean(
          niz.capture
          && niz.device
          && niz.deviceSupport?.canWrite
          && draftChanges.length === 0,
        )}
        recoveryRequired={niz.recoveryRequired}
        onConnect={handleConnect}
        onConnectCompatibility={handleCompatibilityConnect}
        onDisconnect={() => runAfterDraftConfirmation(() => void niz.disconnect())}
        onRefresh={() => runAfterDraftConfirmation(() => void niz.refresh())}
        onExport={() => {
          if (exportsCompatibilityReport) {
            void niz.exportCompatibilityReport()
          } else {
            niz.exportCapture()
          }
        }}
        onVerifyWrite={() => setWriteDialogOpen(true)}
        onToggleDiagnostics={() => setDiagnosticsOpen((open) => !open)}
      />

      <div className="content-stack">
        <div className={workspaceClassName}>
          {showsDeviceRail && (
            <DeviceRail
              device={niz.device}
              support={niz.deviceSupport}
              firmware={niz.firmware}
              capture={niz.capture}
              readVerification={niz.readVerification}
            />
          )}

          <main className="keymap-workspace">
            <div className="keymap-toolbar">
              <div className="keymap-title">
                <h1>{niz.device?.productName ?? 'Keymap'}</h1>
              </div>
              <div className="keymap-toolbar-actions">
                <LayerTabs
                  layers={layers}
                  activeLayer={activeLayer}
                  transitionDirection={layerTransitionDirection}
                  onChange={handleLayerChange}
                />
                <LayoutPicker
                  layout={layout}
                  selection={layoutSelection}
                  onChange={setLayoutSelection}
                />
              </div>
            </div>

            <KeyboardBoard
              layout={layout}
              records={displayedActiveRecords}
              layers={layers}
              activeLayer={activeLayer}
              transitionDirection={layerTransitionDirection}
              selectedPosition={selectedPosition}
              modifiedPositions={modifiedPositions}
              onLayerChange={handleLayerChange}
              onSelect={setSelectedPosition}
            />
          </main>

          {showsKeyInspector && (
            <KeyInspector
              physicalKey={physicalKeyAt(layout, selectedPosition)}
              record={selectedRecord}
              activeLayer={activeLayer}
              assignment={selectedAssignment}
              editable={Boolean(niz.deviceSupport?.canWrite)}
              changed={selectedRecordChanged}
              onAssign={selectedRecord && niz.deviceSupport?.canWrite
                ? (assignment) => dispatchKeymapDraft({
                    type: 'assign',
                    layer: selectedRecord.layer,
                    position: selectedRecord.position,
                    original: selectedRecord.action,
                    assignment,
                  })
                : undefined}
              onRevert={selectedRecordChanged && selectedRecord
                ? () => dispatchKeymapDraft({
                    type: 'revert',
                    layer: selectedRecord.layer,
                    position: selectedRecord.position,
                  })
                : undefined}
            />
          )}
        </div>

        <DiagnosticsPanel
          open={diagnosticsOpen}
          entries={niz.logs}
          onClose={() => setDiagnosticsOpen(false)}
          onClear={niz.clearLogs}
        />
      </div>

      {draftSessionVisible && (
        <DraftBar
          changeCount={draftChanges.length}
          canUndo={keymapDraft.past.length > 0}
          canRedo={keymapDraft.future.length > 0}
          onUndo={() => dispatchKeymapDraft({ type: 'undo' })}
          onRedo={() => dispatchKeymapDraft({ type: 'redo' })}
          onReset={() => dispatchKeymapDraft({ type: 'clear' })}
          onReview={() => setDraftReviewOpen(true)}
        />
      )}

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

      <DraftReviewDialog
        open={draftReviewOpen}
        changes={draftChanges}
        layout={layout}
        onClose={() => setDraftReviewOpen(false)}
        onReset={() => dispatchKeymapDraft({ type: 'clear' })}
      />
    </div>
  )
}

export default App
