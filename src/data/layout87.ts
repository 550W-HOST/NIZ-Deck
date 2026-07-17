import type { KeyboardLayout, PhysicalKey } from '../domain/keyboardLayout'

interface PhysicalKeySpec {
  position: number
  label: string
  secondary?: string
  width?: number
  gapBefore?: number
  tone?: PhysicalKey['tone']
}

const KEYBOARD_87_ROW_SPECS: readonly (readonly PhysicalKeySpec[])[] = [
  [
    { position: 1, label: 'Esc', tone: 'accent' },
    { position: 2, label: 'F1', gapBefore: 1 },
    { position: 3, label: 'F2' },
    { position: 4, label: 'F3' },
    { position: 5, label: 'F4' },
    { position: 6, label: 'F5', gapBefore: 0.5 },
    { position: 7, label: 'F6' },
    { position: 8, label: 'F7' },
    { position: 9, label: 'F8' },
    { position: 10, label: 'F9', gapBefore: 0.5 },
    { position: 11, label: 'F10' },
    { position: 12, label: 'F11' },
    { position: 13, label: 'F12' },
    { position: 14, label: 'Print', gapBefore: 0.5, tone: 'modifier' },
    { position: 15, label: 'Scroll', tone: 'modifier' },
    { position: 16, label: 'Pause', tone: 'modifier' },
  ],
  [
    { position: 17, label: '`', secondary: '~' },
    { position: 18, label: '1', secondary: '!' },
    { position: 19, label: '2', secondary: '@' },
    { position: 20, label: '3', secondary: '#' },
    { position: 21, label: '4', secondary: '$' },
    { position: 22, label: '5', secondary: '%' },
    { position: 23, label: '6', secondary: '^' },
    { position: 24, label: '7', secondary: '&' },
    { position: 25, label: '8', secondary: '*' },
    { position: 26, label: '9', secondary: '(' },
    { position: 27, label: '0', secondary: ')' },
    { position: 28, label: '-', secondary: '_' },
    { position: 29, label: '=', secondary: '+' },
    { position: 30, label: 'Backspace', width: 2, tone: 'modifier' },
    { position: 31, label: 'Insert', gapBefore: 0.5, tone: 'modifier' },
    { position: 32, label: 'Home', tone: 'modifier' },
    { position: 33, label: 'PgUp', tone: 'modifier' },
  ],
  [
    { position: 34, label: 'Tab', width: 1.5, tone: 'modifier' },
    { position: 35, label: 'Q' },
    { position: 36, label: 'W' },
    { position: 37, label: 'E' },
    { position: 38, label: 'R' },
    { position: 39, label: 'T' },
    { position: 40, label: 'Y' },
    { position: 41, label: 'U' },
    { position: 42, label: 'I' },
    { position: 43, label: 'O' },
    { position: 44, label: 'P' },
    { position: 45, label: '[', secondary: '{' },
    { position: 46, label: ']', secondary: '}' },
    { position: 47, label: '\\', secondary: '|', width: 1.5, tone: 'modifier' },
    { position: 48, label: 'Delete', gapBefore: 0.5, tone: 'modifier' },
    { position: 49, label: 'End', tone: 'modifier' },
    { position: 50, label: 'PgDn', tone: 'modifier' },
  ],
  [
    { position: 51, label: 'Caps', width: 1.75, tone: 'modifier' },
    { position: 52, label: 'A' },
    { position: 53, label: 'S' },
    { position: 54, label: 'D' },
    { position: 55, label: 'F' },
    { position: 56, label: 'G' },
    { position: 57, label: 'H' },
    { position: 58, label: 'J' },
    { position: 59, label: 'K' },
    { position: 60, label: 'L' },
    { position: 61, label: ';', secondary: ':' },
    { position: 62, label: "'", secondary: '"' },
    { position: 63, label: 'Enter', width: 2.25, tone: 'modifier' },
  ],
  [
    { position: 64, label: 'Shift', width: 2.25, tone: 'modifier' },
    { position: 65, label: 'Z' },
    { position: 66, label: 'X' },
    { position: 67, label: 'C' },
    { position: 68, label: 'V' },
    { position: 69, label: 'B' },
    { position: 70, label: 'N' },
    { position: 71, label: 'M' },
    { position: 72, label: ',', secondary: '<' },
    { position: 73, label: '.', secondary: '>' },
    { position: 74, label: '/', secondary: '?' },
    { position: 75, label: 'Shift', width: 2.75, tone: 'modifier' },
    { position: 76, label: '↑', gapBefore: 1.5, tone: 'modifier' },
  ],
  [
    { position: 77, label: 'Ctrl', width: 1.25, tone: 'modifier' },
    { position: 78, label: 'Win', width: 1.25, tone: 'modifier' },
    { position: 79, label: 'Alt', width: 1.25, tone: 'modifier' },
    { position: 80, label: 'Space', width: 6.25 },
    { position: 81, label: 'Alt', width: 1.25, tone: 'modifier' },
    { position: 82, label: 'Fn', width: 1.25, tone: 'modifier' },
    { position: 83, label: 'Menu', width: 1.25, tone: 'modifier' },
    { position: 84, label: 'Ctrl', width: 1.25, tone: 'modifier' },
    { position: 85, label: '←', gapBefore: 0.5, tone: 'modifier' },
    { position: 86, label: '↓', tone: 'modifier' },
    { position: 87, label: '→', tone: 'modifier' },
  ],
] as const

export const KEYBOARD_87_ROWS: readonly (readonly PhysicalKey[])[] =
  KEYBOARD_87_ROW_SPECS.map((row, y) => {
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

export const NIZ_87_LAYOUT: KeyboardLayout = {
  id: 'niz-87-ansi',
  name: 'NIZ 87 ANSI',
  shortName: '87 ANSI',
  keyCount: 87,
  width: 18.5,
  height: 6,
  keys: KEYBOARD_87_ROWS.flat(),
}
