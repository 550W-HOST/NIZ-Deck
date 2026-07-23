import { ChevronDown, LayoutGrid } from 'lucide-react'
import { KEYBOARD_LAYOUTS } from '../data/keyboardLayouts'
import type { KeyboardLayout, LayoutSelection } from '../domain/keyboardLayout'

interface LayoutPickerProps {
  layout: KeyboardLayout
  selection: LayoutSelection
  onChange(selection: LayoutSelection): void
}

export function LayoutPicker({
  layout,
  selection,
  onChange,
}: LayoutPickerProps) {
  return (
    <div className="flex items-center gap-[7px] max-[700px]:w-full">
      <label className="relative flex h-[34px] min-w-[154px] items-center gap-[7px] rounded-md border border-line-strong bg-surface py-0 pr-2 pl-[9px] text-[#555e57] focus-within:border-action focus-within:ring-2 focus-within:ring-[rgba(45,99,162,0.14)] max-[700px]:w-full">
        <LayoutGrid size={14} aria-hidden="true" />
        <span className="sr-only">Keyboard layout</span>
        <select
          className="min-w-0 flex-1 cursor-pointer appearance-none border-0 bg-transparent py-0 pr-[17px] pl-0 text-[10px] font-[650] text-ink outline-0"
          value={selection}
          onChange={(event) => onChange(event.target.value as LayoutSelection)}
          aria-label="Keyboard layout"
        >
          <option value="auto">Auto · {layout.shortName}</option>
          {KEYBOARD_LAYOUTS.map((option) => (
            <option value={option.id} key={option.id}>{option.name}</option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-[7px]"
          size={13}
          aria-hidden="true"
        />
      </label>
    </div>
  )
}
