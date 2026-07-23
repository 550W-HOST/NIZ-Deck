import { useMemo, useReducer, useState } from 'react'
import { AppHeader } from '../components/AppHeader'
import { DeviceRail } from '../components/DeviceRail'
import { DraftBar } from '../components/DraftBar'
import { DraftReviewDialog } from '../components/DraftReviewDialog'
import { KeyboardBoard } from '../components/KeyboardBoard'
import { KeyInspector } from '../components/KeyInspector'
import { LayerTabs } from '../components/LayerTabs'
import { LayoutPicker } from '../components/LayoutPicker'
import { StatusBar } from '../components/StatusBar'
import { NIZ_68_LAYOUT } from '../data/layout68'
import { physicalKeyAt } from '../data/keyboardLayouts'
import {
  createKeymapDraftState,
  draftAssignmentFor,
  draftRecordKey,
  keymapDraftChanges,
  keymapDraftReducer,
} from '../domain/keymapDraft'
import type { KeymapCapture, KeymapRecord, NizDeviceInfo } from '../domain/types'
import { getNizDeviceSupport } from '../device/nizDeviceModels'
import { summarizeKeymap } from '../protocol/nizProtocol'
import {
  appShellClass,
  contentStackClass,
  keymapToolbarActionsClass,
  keymapToolbarClass,
  keymapWorkspaceClass,
  workspaceClass,
} from '../uiStyles'

const BASE_KEYCODES = [
  1,
  15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 14,
  28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 84,
  42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 83,
  55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 87, 86,
  67, 68, 69, 70, 156, 71, 74, 88, 89, 90,
] as const

const FN_KEYCODES: Readonly<Record<number, number>> = {
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  17: 168,
  18: 169,
  19: 170,
  57: 113,
  67: 114,
}

const PREVIEW_DEVICE: NizDeviceInfo = {
  productName: 'NIZ 68 Pro',
  vendorId: 0x0483,
  productId: 0x5532,
  collections: [{
    usagePage: 0x008c,
    usage: 0x0001,
    inputReportIds: [0],
    outputReportIds: [0],
  }],
}

function previewRecord(layer: number, position: number): KeymapRecord {
  const keycode = layer === 1 ? BASE_KEYCODES[position - 1] : FN_KEYCODES[position]
  const raw = Array<number>(64).fill(0)
  raw[1] = 0xf0
  raw[2] = layer
  raw[3] = position
  raw[4] = 0
  raw[5] = keycode === undefined ? 0 : 1
  raw[6] = keycode ?? 0
  return {
    layer,
    position,
    functionType: 0,
    action: keycode === undefined
      ? { kind: 'unset' }
      : { kind: 'keys', keycodes: [keycode] },
    raw,
  }
}

const PREVIEW_RECORDS = [1, 2, 3].flatMap((layer) => (
  NIZ_68_LAYOUT.keys.map((key) => previewRecord(layer, key.position))
))

const PREVIEW_CAPTURE: KeymapCapture = {
  schemaVersion: 1,
  capturedAt: '2026-07-19T00:00:00.000Z',
  device: PREVIEW_DEVICE,
  firmware: 'V1.0.4',
  summary: summarizeKeymap(PREVIEW_RECORDS),
  rawReports: [],
  records: PREVIEW_RECORDS,
  otherReports: [],
}

function createPreviewDraft() {
  const record = PREVIEW_RECORDS.find(({ layer, position }) => (
    layer === 1 && position === 1
  ))!
  return keymapDraftReducer(createKeymapDraftState(), {
    type: 'assign',
    layer: record.layer,
    position: record.position,
    original: record.action,
    assignment: { kind: 'keys', keycodes: [67, 43] },
  })
}

export function KeymapEditorPreview() {
  const [activeLayer, setActiveLayer] = useState(1)
  const [transitionDirection, setTransitionDirection] = useState<'previous' | 'next'>('next')
  const [selectedPosition, setSelectedPosition] = useState(1)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [draft, dispatchDraft] = useReducer(
    keymapDraftReducer,
    undefined,
    createPreviewDraft,
  )
  const changes = keymapDraftChanges(draft)
  const draftSessionVisible = changes.length > 0
    || draft.past.length > 0
    || draft.future.length > 0
  const activeRecords = PREVIEW_RECORDS.filter(({ layer }) => layer === activeLayer)
  const displayedRecords = activeRecords.map((record) => ({
    ...record,
    action: draftAssignmentFor(draft, record) ?? record.action,
  }))
  const modifiedPositions = useMemo(() => new Set(
    changes
      .filter((change) => change.layer === activeLayer)
      .map((change) => change.position),
  ), [activeLayer, changes])
  const selectedRecord = activeRecords.find(({ position }) => position === selectedPosition)
  const selectedChanged = Boolean(
    selectedRecord && draft.present[draftRecordKey(selectedRecord)],
  )

  const changeLayer = (layer: number, direction?: 'previous' | 'next'): void => {
    if (layer === activeLayer) return
    setTransitionDirection(direction ?? (layer < activeLayer ? 'previous' : 'next'))
    setActiveLayer(layer)
  }

  return (
    <div className={appShellClass(draftSessionVisible)}>
      <AppHeader
        status="ready"
        device={PREVIEW_DEVICE}
        canExport
        exportMode="capture"
        diagnosticAlertCount={0}
        canRefresh
        canVerifyWrite={changes.length === 0}
        recoveryRequired={false}
        onConnect={() => undefined}
        onConnectCompatibility={() => undefined}
        onDisconnect={() => undefined}
        onRefresh={() => undefined}
        onExport={() => undefined}
        onVerifyWrite={() => undefined}
        onToggleDiagnostics={() => undefined}
      />

      <div className={contentStackClass}>
        <div className={workspaceClass(true, true)}>
          <DeviceRail
            device={PREVIEW_DEVICE}
            support={getNizDeviceSupport(PREVIEW_DEVICE, 68)}
            firmware={PREVIEW_CAPTURE.firmware}
            capture={PREVIEW_CAPTURE}
            readVerification={{ attempts: 1, consistent: null }}
          />

          <main className={keymapWorkspaceClass}>
            <div className={keymapToolbarClass}>
              <div className="min-w-[150px]">
                <h1 className="m-0 text-[17px] font-bold text-ink">
                  {PREVIEW_DEVICE.productName}
                </h1>
              </div>
              <div className={keymapToolbarActionsClass}>
                <LayerTabs
                  layers={[1, 2, 3]}
                  activeLayer={activeLayer}
                  transitionDirection={transitionDirection}
                  onChange={changeLayer}
                />
                <LayoutPicker
                  layout={NIZ_68_LAYOUT}
                  selection="niz-68-ansi"
                  onChange={() => undefined}
                />
              </div>
            </div>
            <KeyboardBoard
              layout={NIZ_68_LAYOUT}
              records={displayedRecords}
              layers={[1, 2, 3]}
              activeLayer={activeLayer}
              transitionDirection={transitionDirection}
              selectedPosition={selectedPosition}
              keymapLoaded
              modifiedPositions={modifiedPositions}
              onLayerChange={changeLayer}
              onSelect={setSelectedPosition}
            />
          </main>

          <KeyInspector
            physicalKey={physicalKeyAt(NIZ_68_LAYOUT, selectedPosition)}
            record={selectedRecord}
            activeLayer={activeLayer}
            assignment={draftAssignmentFor(draft, selectedRecord)}
            editable
            changed={selectedChanged}
            onAssign={selectedRecord
              ? (assignment) => dispatchDraft({
                  type: 'assign',
                  layer: selectedRecord.layer,
                  position: selectedRecord.position,
                  original: selectedRecord.action,
                  assignment,
                })
              : undefined}
            onRevert={selectedRecord
              ? () => dispatchDraft({
                  type: 'revert',
                  layer: selectedRecord.layer,
                  position: selectedRecord.position,
                })
              : undefined}
          />
        </div>
      </div>

      {draftSessionVisible && (
        <DraftBar
          changeCount={changes.length}
          canUndo={draft.past.length > 0}
          canRedo={draft.future.length > 0}
          onUndo={() => dispatchDraft({ type: 'undo' })}
          onRedo={() => dispatchDraft({ type: 'redo' })}
          onReset={() => dispatchDraft({ type: 'clear' })}
          onReview={() => setReviewOpen(true)}
        />
      )}

      <StatusBar
        status="ready"
        progressRecords={0}
        progressTotal={PREVIEW_RECORDS.length}
        error={null}
      />

      <DraftReviewDialog
        open={reviewOpen}
        changes={changes}
        layout={NIZ_68_LAYOUT}
        onClose={() => setReviewOpen(false)}
        onReset={() => dispatchDraft({ type: 'clear' })}
      />
    </div>
  )
}
