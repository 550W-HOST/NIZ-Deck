import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CircleStop,
  Keyboard,
  Plus,
  Search,
  X,
} from 'lucide-react'
import type { PhysicalKey } from '../domain/keyboardLayout'
import type { NizKeyAction } from '../domain/types'
import { layerName } from '../domain/formatters'
import {
  isModifierKeyboardCode,
  keycodeForKeyboardCode,
  keycodeName,
  keycodesForKeyboardChord,
  NIZ_KEYCODE_CATEGORIES,
  NIZ_KEYCODE_OPTIONS,
  type NizKeycodeCategory,
} from '../data/nizKeycodes'
import {
  cx,
  dialogBackdropClass,
  dialogButtonClass,
  dialogCloseButtonClass,
  dialogFooterClass,
  dialogHeaderClass,
  dialogHeaderTitleClass,
  dialogPanelClass,
  dialogPrimaryButtonClass,
} from '../uiStyles'

type PickerMode = 'keys' | 'sequence'
type CategoryFilter = 'All' | NizKeycodeCategory

const MAX_CHORD_KEYCODES = 58
const MAX_SEQUENCE_KEYCODES = 56

interface KeyActionPickerProps {
  open: boolean
  physicalKey: PhysicalKey | undefined
  activeLayer: number
  action: NizKeyAction
  onClose(): void
  onSave(action: NizKeyAction): void
}

function initialMode(action: NizKeyAction): PickerMode {
  return action.kind === 'emulate' ? 'sequence' : 'keys'
}

function initialKeycodes(action: NizKeyAction): number[] {
  if (action.kind === 'keys' || action.kind === 'emulate') return [...action.keycodes]
  return []
}

export function KeyActionPicker({
  open,
  physicalKey,
  activeLayer,
  action,
  onClose,
  onSave,
}: KeyActionPickerProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<PickerMode>(() => initialMode(action))
  const [keycodes, setKeycodes] = useState<number[]>(() => initialKeycodes(action))
  const [delayMs, setDelayMs] = useState(action.kind === 'emulate' ? action.delayMs : 50)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [capturing, setCapturing] = useState(false)

  useEffect(() => {
    if (!open) return
    setMode(initialMode(action))
    setKeycodes(initialKeycodes(action))
    setDelayMs(action.kind === 'emulate' ? action.delayMs : 50)
    setSearch('')
    setCategory('All')
    setCapturing(false)
    window.requestAnimationFrame(() => searchInputRef.current?.focus())
  }, [action, open])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (!capturing) {
        if (event.key === 'Escape') onClose()
        return
      }
      if (event.repeat) return

      if (mode === 'keys' && isModifierKeyboardCode(event.code)) {
        event.preventDefault()
        return
      }

      const captured = mode === 'keys'
        ? keycodesForKeyboardChord(event)
        : [keycodeForKeyboardCode(event.code)].filter(
            (keycode): keycode is number => keycode !== undefined,
          )
      if (captured.length === 0) return

      event.preventDefault()
      event.stopPropagation()
      if (mode === 'keys') {
        setKeycodes(captured.slice(0, MAX_CHORD_KEYCODES))
        setCapturing(false)
      } else {
        setKeycodes((current) => [
          ...current,
          ...captured,
        ].slice(0, MAX_SEQUENCE_KEYCODES))
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [capturing, mode, onClose, open])

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    return NIZ_KEYCODE_OPTIONS.filter((option) => {
      if (category !== 'All' && option.category !== category) return false
      if (!query) return true
      const hex = `0x${option.keycode.toString(16).padStart(2, '0')}`
      return option.label.toLocaleLowerCase().includes(query) || hex.includes(query)
    })
  }, [category, search])

  if (!open) return null

  const maxKeycodes = mode === 'keys' ? MAX_CHORD_KEYCODES : MAX_SEQUENCE_KEYCODES
  const selectionFull = keycodes.length >= maxKeycodes

  const changeMode = (nextMode: PickerMode): void => {
    setMode(nextMode)
    setCapturing(false)
    if (nextMode === 'keys') setKeycodes((current) => [...new Set(current)])
  }

  const chooseKeycode = (keycode: number): void => {
    if (mode === 'sequence') {
      if (!selectionFull) setKeycodes((current) => [...current, keycode])
      return
    }
    setKeycodes((current) => current.includes(keycode)
      ? current.filter((value) => value !== keycode)
      : selectionFull
        ? current
        : [...current, keycode])
  }

  const saveAssignment = (): void => {
    if (keycodes.length === 0) return
    if (mode === 'keys') {
      onSave({ kind: 'keys', keycodes })
    } else {
      onSave({
        kind: 'emulate',
        delayMs: Math.min(65_535, Math.max(0, Math.round(delayMs))),
        keycodes,
      })
    }
    onClose()
  }

  return (
    <div
      className={cx(dialogBackdropClass, 'max-[520px]:p-2')}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        className={cx(
          dialogPanelClass,
          'grid h-[min(680px,calc(100svh-36px))] max-h-[calc(100svh-36px)] w-[min(100%,720px)] grid-rows-[54px_minmax(0,1fr)_54px]',
          'max-[520px]:h-[calc(100svh-16px)]',
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-action-dialog-title"
        onSubmit={(event) => {
          event.preventDefault()
          saveAssignment()
        }}
      >
        <header className={dialogHeaderClass}>
          <div className={dialogHeaderTitleClass}>
            <Keyboard size={18} />
            <div className="min-w-0">
              <h2
                className="m-0 overflow-hidden text-[15px] font-bold text-ellipsis whitespace-nowrap text-ink"
                id="key-action-dialog-title"
              >
                Assign {physicalKey?.label ?? 'key'}
              </h2>
              <span className="mt-0.5 block text-[9px] text-ink-muted">
                {layerName(activeLayer)}
              </span>
            </div>
          </div>
          <button
            className={dialogCloseButtonClass}
            type="button"
            onClick={onClose}
            aria-label="Close"
            title="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="grid min-h-0 min-w-0 grid-rows-[auto_auto_auto_auto_minmax(120px,1fr)] gap-3 overflow-hidden px-4 pt-[15px] pb-4 max-[520px]:gap-[10px] max-[520px]:p-3">
          <div
            className="inline-flex w-fit rounded-md border border-line-strong bg-[#e9ece7] p-[3px] max-[520px]:w-full"
            aria-label="Assignment type"
          >
            <button
              type="button"
              className={cx(
                'h-7 min-w-[104px] cursor-pointer rounded-[4px] border-0 bg-transparent px-3 text-[10px] font-[650] text-ink-muted hover:bg-white/50 hover:text-ink max-[520px]:min-w-0 max-[520px]:flex-1',
                mode === 'keys' && 'bg-surface text-ink shadow-[0_1px_3px_rgba(8,12,9,0.16)] hover:bg-surface',
              )}
              aria-pressed={mode === 'keys'}
              onClick={() => changeMode('keys')}
            >
              Key / chord
            </button>
            <button
              type="button"
              className={cx(
                'h-7 min-w-[104px] cursor-pointer rounded-[4px] border-0 bg-transparent px-3 text-[10px] font-[650] text-ink-muted hover:bg-white/50 hover:text-ink max-[520px]:min-w-0 max-[520px]:flex-1',
                mode === 'sequence' && 'bg-surface text-ink shadow-[0_1px_3px_rgba(8,12,9,0.16)] hover:bg-surface',
              )}
              aria-pressed={mode === 'sequence'}
              onClick={() => changeMode('sequence')}
            >
              Sequence
            </button>
          </div>

          <section className="min-w-0 border-b border-line pb-3" aria-label="Selected keycodes">
            <div className="mb-2 flex items-center justify-between gap-3">
              <strong className="text-[10px] uppercase">
                {mode === 'keys' ? 'Chord' : 'Sequence'}
              </strong>
              <span className="font-mono text-[9px] leading-none text-ink-faint">
                {keycodes.length}/{maxKeycodes}
              </span>
            </div>
            <div className="flex min-h-[30px] flex-wrap items-center gap-[5px]">
              {keycodes.length === 0 ? (
                <span className="inline-flex min-h-[25px] items-center text-[9px] text-ink-faint">
                  No keys selected
                </span>
              ) : keycodes.map((keycode, index) => (
                <span
                  className="inline-flex min-h-[25px] items-center gap-[5px] rounded-[4px] border border-[#bcc2bc] border-b-2 bg-[#f8f9f7] py-0 pr-[3px] pl-[7px] text-[9px] font-[650] text-[#343934]"
                  key={`${keycode}-${index}`}
                >
                  {keycodeName(keycode)}
                  <button
                    className="inline-flex size-[19px] cursor-pointer items-center justify-center rounded-[3px] border-0 bg-transparent p-0 text-ink-faint hover:bg-surface-strong hover:text-ink"
                    type="button"
                    onClick={() => setKeycodes((current) => current.filter(
                      (_, currentIndex) => currentIndex !== index,
                    ))}
                    aria-label={`Remove ${keycodeName(keycode)}`}
                    title={`Remove ${keycodeName(keycode)}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
            {mode === 'sequence' && (
              <label className="mt-[10px] grid w-fit grid-cols-[auto_78px_auto] items-center gap-[7px] text-[9px] text-ink-muted">
                <span>Delay</span>
                <input
                  className="h-7 w-[78px] rounded-[5px] border border-line-strong bg-surface px-[7px] py-0 font-mono text-[10px] leading-none text-ink"
                  type="number"
                  min="0"
                  max="65535"
                  step="1"
                  value={delayMs}
                  onChange={(event) => setDelayMs(event.currentTarget.valueAsNumber || 0)}
                />
                <span>ms</span>
              </label>
            )}
          </section>

          <div className="flex min-w-0 items-center gap-[9px]">
            <button
              type="button"
              className={cx(
                'inline-flex h-[31px] cursor-pointer items-center justify-center gap-[7px] rounded-[5px] border border-line-strong bg-surface px-[10px] text-[9px] font-[650] text-[#4d554f] hover:border-[#a8afa8] hover:bg-[#eef0ed]',
                capturing && 'border-[#dba7a2] bg-danger-soft text-danger hover:border-[#dba7a2] hover:bg-danger-soft',
              )}
              onClick={() => setCapturing((current) => !current)}
              title={mode === 'keys' ? 'Capture a physical key chord' : 'Append physical keys'}
            >
              {capturing ? <CircleStop size={15} /> : <Keyboard size={15} />}
              {capturing
                ? 'Stop recording'
                : mode === 'keys'
                  ? 'Record chord'
                  : 'Record sequence'}
            </button>
            <span className="text-[9px] text-danger" aria-live="polite">
              {capturing ? 'Listening…' : ''}
            </span>
          </div>

          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_148px] gap-2 max-[520px]:grid-cols-[minmax(0,1fr)]">
            <label className="relative flex h-8 items-center gap-[7px] rounded-[5px] border border-line-strong bg-surface px-[9px] py-0 text-ink-faint focus-within:border-action focus-within:ring-2 focus-within:ring-[rgba(45,99,162,0.14)]">
              <Search size={14} />
              <span className="sr-only">Search keycodes</span>
              <input
                className="h-full w-full min-w-0 border-0 bg-transparent text-[10px] text-ink outline-0 placeholder:text-ink-faint"
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search keys and functions"
              />
            </label>
            <label className="relative flex h-8 items-center rounded-[5px] border border-line-strong bg-surface px-[7px] py-0 focus-within:border-action focus-within:ring-2 focus-within:ring-[rgba(45,99,162,0.14)]">
              <span className="sr-only">Keycode category</span>
              <select
                className="h-full w-full min-w-0 cursor-pointer border-0 bg-transparent text-[10px] text-ink outline-0"
                value={category}
                onChange={(event) => setCategory(event.currentTarget.value as CategoryFilter)}
              >
                <option value="All">All categories</option>
                {NIZ_KEYCODE_CATEGORIES.map((value) => (
                  <option value={value} key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>

          <div
            className="grid min-h-0 min-w-0 grid-cols-2 content-start overflow-auto rounded-md border border-line bg-surface max-[520px]:grid-cols-1"
            aria-label="Available keycodes"
          >
            {filteredOptions.length === 0 ? (
              <p className="col-span-full mx-3 my-7 text-center text-[10px] text-ink-faint">
                No matching keys
              </p>
            ) : filteredOptions.map((option) => {
              const selected = keycodes.includes(option.keycode)
              return (
                <button
                  type="button"
                  className={cx(
                    'grid h-[38px] min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-2 border-0 border-r border-b border-line bg-transparent px-[9px] py-0 text-left text-ink even:border-r-0 enabled:hover:bg-surface-muted disabled:cursor-default disabled:opacity-40 max-[520px]:border-r-0',
                    selected && 'bg-action-soft text-[#153b60] enabled:hover:bg-action-soft',
                  )}
                  aria-pressed={mode === 'keys' ? selected : undefined}
                  disabled={selectionFull && (mode === 'sequence' || !selected)}
                  onClick={() => chooseKeycode(option.keycode)}
                  key={option.keycode}
                >
                  <span className="overflow-hidden text-[10px] font-[650] text-ellipsis whitespace-nowrap">
                    {option.label}
                  </span>
                  <small className="text-[8px] text-ink-faint">{option.category}</small>
                  {selected && mode === 'keys'
                    ? <Check className="text-action" size={14} />
                    : <Plus className="text-action" size={14} />}
                </button>
              )
            })}
          </div>
        </div>

        <footer className={dialogFooterClass}>
          <button className={dialogButtonClass} type="button" onClick={onClose}>Cancel</button>
          <button
            className={dialogPrimaryButtonClass}
            type="submit"
            disabled={keycodes.length === 0}
          >
            Save assignment
          </button>
        </footer>
      </form>
    </div>
  )
}
