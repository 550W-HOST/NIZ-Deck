import type { KeyboardLayout, PhysicalKey } from '../domain/keyboardLayout'

interface PhysicalKeySpec {
  position: number
  label: string
  secondary?: string
  width?: number
  gapBefore?: number
  tone?: PhysicalKey['tone']
}

const KEYBOARD_84_ROW_SPECS: readonly (readonly PhysicalKeySpec[])[] = [
  [
    { position: 1, label: 'Esc', tone: 'accent' },
    { position: 2, label: 'F1', gapBefore: 0.8 },
    { position: 3, label: 'F2' },
    { position: 4, label: 'F3' },
    { position: 5, label: 'F4' },
    { position: 6, label: 'F5', gapBefore: 0.4 },
    { position: 7, label: 'F6' },
    { position: 8, label: 'F7' },
    { position: 9, label: 'F8' },
    { position: 10, label: 'F9', gapBefore: 0.4 },
    { position: 11, label: 'F10' },
    { position: 12, label: 'F11' },
    { position: 13, label: 'F12' },
    { position: 14, label: 'Delete', gapBefore: 0.4, tone: 'modifier' },
  ],
  [
    { position: 15, label: '`', secondary: '~' },
    { position: 16, label: '1', secondary: '!' },
    { position: 17, label: '2', secondary: '@' },
    { position: 18, label: '3', secondary: '#' },
    { position: 19, label: '4', secondary: '$' },
    { position: 20, label: '5', secondary: '%' },
    { position: 21, label: '6', secondary: '^' },
    { position: 22, label: '7', secondary: '&' },
    { position: 23, label: '8', secondary: '*' },
    { position: 24, label: '9', secondary: '(' },
    { position: 25, label: '0', secondary: ')' },
    { position: 26, label: '-', secondary: '_' },
    { position: 27, label: '=', secondary: '+' },
    { position: 28, label: 'Backspace', width: 2, tone: 'modifier' },
    { position: 29, label: 'Home', tone: 'modifier' },
  ],
  [
    { position: 30, label: 'Tab', width: 1.5, tone: 'modifier' },
    { position: 31, label: 'Q' },
    { position: 32, label: 'W' },
    { position: 33, label: 'E' },
    { position: 34, label: 'R' },
    { position: 35, label: 'T' },
    { position: 36, label: 'Y' },
    { position: 37, label: 'U' },
    { position: 38, label: 'I' },
    { position: 39, label: 'O' },
    { position: 40, label: 'P' },
    { position: 41, label: '[', secondary: '{' },
    { position: 42, label: ']', secondary: '}' },
    { position: 43, label: '\\', secondary: '|', width: 1.5, tone: 'modifier' },
    { position: 44, label: 'PgUp', tone: 'modifier' },
  ],
  [
    { position: 45, label: 'Caps', width: 1.75, tone: 'modifier' },
    { position: 46, label: 'A' },
    { position: 47, label: 'S' },
    { position: 48, label: 'D' },
    { position: 49, label: 'F' },
    { position: 50, label: 'G' },
    { position: 51, label: 'H' },
    { position: 52, label: 'J' },
    { position: 53, label: 'K' },
    { position: 54, label: 'L' },
    { position: 55, label: ';', secondary: ':' },
    { position: 56, label: "'", secondary: '"' },
    { position: 57, label: 'Enter', width: 2.25, tone: 'modifier' },
    { position: 58, label: 'PgDn', tone: 'modifier' },
  ],
  [
    { position: 59, label: 'Shift', width: 2.25, tone: 'modifier' },
    { position: 60, label: 'Z' },
    { position: 61, label: 'X' },
    { position: 62, label: 'C' },
    { position: 63, label: 'V' },
    { position: 64, label: 'B' },
    { position: 65, label: 'N' },
    { position: 66, label: 'M' },
    { position: 67, label: ',', secondary: '<' },
    { position: 68, label: '.', secondary: '>' },
    { position: 69, label: '/', secondary: '?' },
    { position: 70, label: 'Shift', width: 1.75, tone: 'modifier' },
    { position: 71, label: '↑', tone: 'modifier' },
    { position: 72, label: 'End', tone: 'modifier' },
  ],
  [
    { position: 73, label: 'Ctrl', width: 1.25, tone: 'modifier' },
    { position: 74, label: 'Fn', tone: 'modifier' },
    { position: 75, label: 'Win', tone: 'modifier' },
    { position: 76, label: 'Alt', tone: 'modifier' },
    { position: 77, label: 'Space', width: 4.75 },
    { position: 78, label: 'Fn', tone: 'modifier' },
    { position: 79, label: 'Alt', tone: 'modifier' },
    { position: 80, label: 'Menu', tone: 'modifier' },
    { position: 81, label: 'Ctrl', tone: 'modifier' },
    { position: 82, label: '←', tone: 'modifier' },
    { position: 83, label: '↓', tone: 'modifier' },
    { position: 84, label: '→', tone: 'modifier' },
  ],
] as const

export const KEYBOARD_84_ROWS: readonly (readonly PhysicalKey[])[] =
  KEYBOARD_84_ROW_SPECS.map((row, y) => {
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

export const NIZ_84_LAYOUT: KeyboardLayout = {
  id: 'niz-84ec-ansi',
  name: 'NIZ 84EC ANSI',
  shortName: '84EC ANSI',
  keyCount: 84,
  width: 16,
  height: 6,
  keys: KEYBOARD_84_ROWS.flat(),
}
