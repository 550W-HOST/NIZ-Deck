import { ChevronDown, LayoutGrid } from 'lucide-react'
import { KEYBOARD_LAYOUTS } from '../data/keyboardLayouts'
import type {
  KeyboardLayout,
  LayoutSelection,
  LayoutSource,
} from '../domain/keyboardLayout'

interface LayoutPickerProps {
  layout: KeyboardLayout
  selection: LayoutSelection
  source: LayoutSource
  onChange(selection: LayoutSelection): void
}

const sourceLabels: Record<LayoutSource, string> = {
  device: 'Device matched',
  capture: 'Capture matched',
  manual: 'Manual',
  fallback: 'Preview',
}

export function LayoutPicker({
  layout,
  selection,
  source,
  onChange,
}: LayoutPickerProps) {
  return (
    <div className="layout-control">
      <label className="layout-picker">
        <LayoutGrid size={14} aria-hidden="true" />
        <span className="sr-only">Keyboard layout</span>
        <select
          value={selection}
          onChange={(event) => onChange(event.target.value as LayoutSelection)}
          aria-label="Keyboard layout"
        >
          <option value="auto">Auto · {layout.shortName}</option>
          {KEYBOARD_LAYOUTS.map((option) => (
            <option value={option.id} key={option.id}>{option.name}</option>
          ))}
        </select>
        <ChevronDown size={13} aria-hidden="true" />
      </label>
      <span className={`layout-source layout-source--${source}`}>
        <i aria-hidden="true" />
        {sourceLabels[source]}
      </span>
    </div>
  )
}
