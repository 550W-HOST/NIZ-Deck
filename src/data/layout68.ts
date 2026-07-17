import type { KeyboardLayout, PhysicalKey } from '../domain/keyboardLayout'

interface PhysicalKeySpec {
  position: number
  label: string
  secondary?: string
  width?: number
  gapBefore?: number
  tone?: PhysicalKey['tone']
}

const KEYBOARD_68_ROW_SPECS: readonly (readonly PhysicalKeySpec[])[] = [
  [
    { position: 1, label: 'Esc', tone: 'accent' },
    { position: 2, label: '1', secondary: '!' },
    { position: 3, label: '2', secondary: '@' },
    { position: 4, label: '3', secondary: '#' },
    { position: 5, label: '4', secondary: '$' },
    { position: 6, label: '5', secondary: '%' },
    { position: 7, label: '6', secondary: '^' },
    { position: 8, label: '7', secondary: '&' },
    { position: 9, label: '8', secondary: '*' },
    { position: 10, label: '9', secondary: '(' },
    { position: 11, label: '0', secondary: ')' },
    { position: 12, label: '-', secondary: '_' },
    { position: 13, label: '=', secondary: '+' },
    { position: 14, label: 'Backspace', width: 2, tone: 'modifier' },
    { position: 15, label: '`', secondary: '~', gapBefore: 0.25 },
  ],
  [
    { position: 16, label: 'Tab', width: 1.5, tone: 'modifier' },
    { position: 17, label: 'Q' },
    { position: 18, label: 'W' },
    { position: 19, label: 'E' },
    { position: 20, label: 'R' },
    { position: 21, label: 'T' },
    { position: 22, label: 'Y' },
    { position: 23, label: 'U' },
    { position: 24, label: 'I' },
    { position: 25, label: 'O' },
    { position: 26, label: 'P' },
    { position: 27, label: '[', secondary: '{' },
    { position: 28, label: ']', secondary: '}' },
    { position: 29, label: '\\', secondary: '|', width: 1.5 },
    { position: 30, label: 'Delete', gapBefore: 0.25, tone: 'modifier' },
  ],
  [
    { position: 31, label: 'Caps', width: 1.75, tone: 'modifier' },
    { position: 32, label: 'A' },
    { position: 33, label: 'S' },
    { position: 34, label: 'D' },
    { position: 35, label: 'F' },
    { position: 36, label: 'G' },
    { position: 37, label: 'H' },
    { position: 38, label: 'J' },
    { position: 39, label: 'K' },
    { position: 40, label: 'L' },
    { position: 41, label: ';', secondary: ':' },
    { position: 42, label: "'", secondary: '"' },
    { position: 43, label: 'Enter', width: 2.25, tone: 'modifier' },
    { position: 44, label: 'PgUp', gapBefore: 0.25, tone: 'modifier' },
  ],
  [
    { position: 45, label: 'Shift', width: 2.25, tone: 'modifier' },
    { position: 46, label: 'Z' },
    { position: 47, label: 'X' },
    { position: 48, label: 'C' },
    { position: 49, label: 'V' },
    { position: 50, label: 'B' },
    { position: 51, label: 'N' },
    { position: 52, label: 'M' },
    { position: 53, label: ',', secondary: '<' },
    { position: 54, label: '.', secondary: '>' },
    { position: 55, label: '/', secondary: '?' },
    { position: 56, label: 'Shift', width: 1.75, tone: 'modifier' },
    { position: 57, label: '↑', gapBefore: 0.25, tone: 'modifier' },
    { position: 58, label: 'PgDn', tone: 'modifier' },
  ],
  [
    { position: 59, label: 'Ctrl', width: 1.25, tone: 'modifier' },
    { position: 60, label: 'Win', width: 1.25, tone: 'modifier' },
    { position: 61, label: 'Alt', width: 1.25, tone: 'modifier' },
    { position: 62, label: 'Space', width: 6.25 },
    { position: 63, label: 'Fn', tone: 'modifier' },
    { position: 64, label: 'Alt', tone: 'modifier' },
    { position: 65, label: 'Ctrl', tone: 'modifier' },
    { position: 66, label: '←', gapBefore: 0.25, tone: 'modifier' },
    { position: 67, label: '↓', tone: 'modifier' },
    { position: 68, label: '→', tone: 'modifier' },
  ],
] as const

export const KEYBOARD_68_ROWS: readonly (readonly PhysicalKey[])[] =
  KEYBOARD_68_ROW_SPECS.map((row, y) => {
    let x = 0
    return row.map((key) => {
      x += key.gapBefore ?? 0
      const positionedKey: PhysicalKey = {
        position: key.position,
        label: key.label,
        secondary: key.secondary,
        x,
        y,
        width: key.width ?? 1,
        height: 1,
        tone: key.tone,
      }
      x += positionedKey.width
      return positionedKey
    })
  })

export const PHYSICAL_KEYS = KEYBOARD_68_ROWS.flat()

export const NIZ_68_LAYOUT: KeyboardLayout = {
  id: 'niz-68-ansi',
  name: 'NIZ 68 Pro ANSI',
  shortName: '68 Pro ANSI',
  keyCount: 68,
  width: 16.25,
  height: 5,
  keys: PHYSICAL_KEYS,
}

export function physicalKeyAt(position: number): PhysicalKey | undefined {
  return PHYSICAL_KEYS.find((key) => key.position === position)
}

export type { PhysicalKey }
