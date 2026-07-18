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
      className="dialog-backdrop key-action-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <form
        className="key-action-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="key-action-dialog-title"
        onSubmit={(event) => {
          event.preventDefault()
          saveAssignment()
        }}
      >
        <header>
          <div>
            <Keyboard size={18} />
            <div>
              <h2 id="key-action-dialog-title">
                Assign {physicalKey?.label ?? 'key'}
              </h2>
              <span>{layerName(activeLayer)}</span>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" title="Close">
            <X size={16} />
          </button>
        </header>

        <div className="key-action-dialog-body">
          <div className="assignment-mode-control" aria-label="Assignment type">
            <button
              type="button"
              className={mode === 'keys' ? 'is-active' : ''}
              aria-pressed={mode === 'keys'}
              onClick={() => changeMode('keys')}
            >
              Key / chord
            </button>
            <button
              type="button"
              className={mode === 'sequence' ? 'is-active' : ''}
              aria-pressed={mode === 'sequence'}
              onClick={() => changeMode('sequence')}
            >
              Sequence
            </button>
          </div>

          <section className="assignment-selection" aria-label="Selected keycodes">
            <div className="assignment-selection-heading">
              <strong>{mode === 'keys' ? 'Chord' : 'Sequence'}</strong>
              <span>{keycodes.length}/{maxKeycodes}</span>
            </div>
            <div className="assignment-token-list">
              {keycodes.length === 0 ? (
                <span className="assignment-token-empty">No keys selected</span>
              ) : keycodes.map((keycode, index) => (
                <span className="assignment-token" key={`${keycode}-${index}`}>
                  {keycodeName(keycode)}
                  <button
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
              <label className="sequence-delay-control">
                <span>Delay</span>
                <input
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

          <div className="capture-control">
            <button
              type="button"
              className={capturing ? 'is-capturing' : ''}
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
            <span aria-live="polite">{capturing ? 'Listening…' : ''}</span>
          </div>

          <div className="keycode-library-toolbar">
            <label className="keycode-search">
              <Search size={14} />
              <span className="sr-only">Search keycodes</span>
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                placeholder="Search keys and functions"
              />
            </label>
            <label className="keycode-category">
              <span className="sr-only">Keycode category</span>
              <select
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

          <div className="keycode-option-list" aria-label="Available keycodes">
            {filteredOptions.length === 0 ? (
              <p>No matching keys</p>
            ) : filteredOptions.map((option) => {
              const selected = keycodes.includes(option.keycode)
              return (
                <button
                  type="button"
                  className={selected ? 'is-selected' : ''}
                  aria-pressed={mode === 'keys' ? selected : undefined}
                  disabled={selectionFull && (mode === 'sequence' || !selected)}
                  onClick={() => chooseKeycode(option.keycode)}
                  key={option.keycode}
                >
                  <span>{option.label}</span>
                  <small>{option.category}</small>
                  {selected && mode === 'keys' ? <Check size={14} /> : <Plus size={14} />}
                </button>
              )
            })}
          </div>
        </div>

        <footer>
          <button className="dialog-button" type="button" onClick={onClose}>Cancel</button>
          <button
            className="dialog-button dialog-button--primary"
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
