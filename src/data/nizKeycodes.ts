const NIZ_KEYCODE_NAMES: Record<number, string> = {
  0: 'Unassigned',
  1: 'Esc',
  2: 'F1', 3: 'F2', 4: 'F3', 5: 'F4', 6: 'F5', 7: 'F6',
  8: 'F7', 9: 'F8', 10: 'F9', 11: 'F10', 12: 'F11', 13: 'F12',
  14: '`', 15: '1', 16: '2', 17: '3', 18: '4', 19: '5',
  20: '6', 21: '7', 22: '8', 23: '9', 24: '0', 25: '-', 26: '=',
  27: 'Backspace', 28: 'Tab', 29: 'Q', 30: 'W', 31: 'E', 32: 'R',
  33: 'T', 34: 'Y', 35: 'U', 36: 'I', 37: 'O', 38: 'P', 39: '[',
  40: ']', 41: '\\', 42: 'Caps Lock', 43: 'A', 44: 'S', 45: 'D',
  46: 'F', 47: 'G', 48: 'H', 49: 'J', 50: 'K', 51: 'L', 52: ';',
  53: "'", 54: 'Enter', 55: 'Left Shift', 56: 'Z', 57: 'X', 58: 'C',
  59: 'V', 60: 'B', 61: 'N', 62: 'M', 63: ',', 64: '.', 65: '/',
  66: 'Right Shift', 67: 'Left Ctrl', 68: 'Left Win', 69: 'Left Alt',
  70: 'Space', 71: 'Right Alt', 72: 'Right Win', 73: 'Menu', 74: 'Right Ctrl',
  75: 'Wake', 76: 'Sleep', 77: 'Power', 78: 'Print Screen',
  79: 'Scroll Lock', 80: 'Pause', 81: 'Insert', 82: 'Home', 83: 'Page Up',
  84: 'Delete', 85: 'End', 86: 'Page Down', 87: 'Up', 88: 'Left',
  89: 'Down', 90: 'Right', 91: 'Num Lock', 92: 'Numpad /', 93: 'Numpad *',
  94: 'Numpad 7', 95: 'Numpad 8', 96: 'Numpad 9', 97: 'Numpad 4',
  98: 'Numpad 5', 99: 'Numpad 6', 100: 'Numpad 1', 101: 'Numpad 2',
  102: 'Numpad 3', 103: 'Numpad 0', 104: 'Numpad .', 105: 'Numpad -',
  106: 'Numpad +', 107: 'Numpad Enter', 108: 'Next Track',
  109: 'Previous Track', 110: 'Media Stop', 111: 'Play / Pause',
  112: 'Mute', 113: 'Volume Up', 114: 'Volume Down', 115: 'Media Select',
  116: 'Email', 117: 'Calculator', 118: 'My Computer', 119: 'Search',
  120: 'Browser Home', 121: 'Browser Back', 122: 'Browser Forward',
  123: 'Browser Stop', 124: 'Browser Refresh', 125: 'Favorites',
  126: 'Mouse Move Left', 127: 'Mouse Move Right', 128: 'Mouse Move Up',
  129: 'Mouse Move Down', 130: 'Mouse Left', 131: 'Mouse Right',
  132: 'Mouse Middle', 133: 'Wheel Up', 134: 'Wheel Down',
  135: 'Backlight Switch', 136: 'Backlight Macro', 137: 'Lighting Demo',
  138: 'Star Shower', 139: 'Riffle', 140: 'Lighting Stop', 141: 'Breathe',
  142: 'Breathe Previous', 143: 'Breathe Next', 144: 'Brightness Down',
  145: 'Brightness Up', 146: 'Relax / Aurora', 147: 'Color Breathe',
  148: 'Background Color', 149: 'Trigger Point', 150: 'Keyboard Lock',
  151: 'Shift + Up', 152: 'Ctrl / Caps Swap', 153: 'Win Lock',
  154: 'Mouse Lock', 155: 'Win / Mac', 156: 'Right Fn',
  157: 'Mouse Step', 158: 'Mouse Timing', 159: 'Profile Cycle',
  160: 'Lighting Record 1', 161: 'Lighting Record 2',
  162: 'Lighting Record 3', 163: 'Lighting Record 4',
  164: 'Lighting Record 5', 165: 'Lighting Record 6', 166: 'Left Fn',
  167: 'Wired / Wireless', 168: 'Bluetooth 1', 169: 'Bluetooth 2',
  170: 'Bluetooth 3', 171: 'Game Mode', 172: 'Eco Mode',
  173: 'Mouse Initial Delay', 174: 'Repeat Rate', 175: 'Response Delay',
  176: 'USB Report Rate', 177: 'Scan Period', 178: 'App Lock',
}

export type NizKeycodeCategory =
  | 'Typing'
  | 'Navigation'
  | 'Media'
  | 'Mouse'
  | 'Lighting'
  | 'Device'

export interface NizKeycodeOption {
  keycode: number
  label: string
  category: NizKeycodeCategory
}

export const NIZ_KEYCODE_CATEGORIES: readonly NizKeycodeCategory[] = [
  'Typing',
  'Navigation',
  'Media',
  'Mouse',
  'Lighting',
  'Device',
]

export function keycodeCategory(keycode: number): NizKeycodeCategory {
  if (keycode <= 74) return 'Typing'
  if (keycode <= 107) return 'Navigation'
  if (keycode <= 125) return 'Media'
  if (keycode <= 134) return 'Mouse'
  if ((keycode >= 135 && keycode <= 149) || (keycode >= 160 && keycode <= 165)) {
    return 'Lighting'
  }
  return 'Device'
}

export const NIZ_KEYCODE_OPTIONS: readonly NizKeycodeOption[] = Object.entries(
  NIZ_KEYCODE_NAMES,
).flatMap(([keycode, label]) => {
  const value = Number(keycode)
  return value === 0 ? [] : [{ keycode: value, label, category: keycodeCategory(value) }]
})

const KEYBOARD_CODE_TO_NIZ_KEYCODE: Readonly<Record<string, number>> = {
  Escape: 1,
  F1: 2, F2: 3, F3: 4, F4: 5, F5: 6, F6: 7,
  F7: 8, F8: 9, F9: 10, F10: 11, F11: 12, F12: 13,
  Backquote: 14,
  Digit1: 15, Digit2: 16, Digit3: 17, Digit4: 18, Digit5: 19,
  Digit6: 20, Digit7: 21, Digit8: 22, Digit9: 23, Digit0: 24,
  Minus: 25,
  Equal: 26,
  Backspace: 27,
  Tab: 28,
  KeyQ: 29, KeyW: 30, KeyE: 31, KeyR: 32, KeyT: 33,
  KeyY: 34, KeyU: 35, KeyI: 36, KeyO: 37, KeyP: 38,
  BracketLeft: 39,
  BracketRight: 40,
  Backslash: 41,
  CapsLock: 42,
  KeyA: 43, KeyS: 44, KeyD: 45, KeyF: 46, KeyG: 47,
  KeyH: 48, KeyJ: 49, KeyK: 50, KeyL: 51,
  Semicolon: 52,
  Quote: 53,
  Enter: 54,
  ShiftLeft: 55,
  KeyZ: 56, KeyX: 57, KeyC: 58, KeyV: 59, KeyB: 60,
  KeyN: 61, KeyM: 62,
  Comma: 63,
  Period: 64,
  Slash: 65,
  ShiftRight: 66,
  ControlLeft: 67,
  MetaLeft: 68,
  AltLeft: 69,
  Space: 70,
  AltRight: 71,
  MetaRight: 72,
  ContextMenu: 73,
  ControlRight: 74,
  PrintScreen: 78,
  ScrollLock: 79,
  Pause: 80,
  Insert: 81,
  Home: 82,
  PageUp: 83,
  Delete: 84,
  End: 85,
  PageDown: 86,
  ArrowUp: 87,
  ArrowLeft: 88,
  ArrowDown: 89,
  ArrowRight: 90,
  NumLock: 91,
  NumpadDivide: 92,
  NumpadMultiply: 93,
  Numpad7: 94, Numpad8: 95, Numpad9: 96,
  Numpad4: 97, Numpad5: 98, Numpad6: 99,
  Numpad1: 100, Numpad2: 101, Numpad3: 102,
  Numpad0: 103,
  NumpadDecimal: 104,
  NumpadSubtract: 105,
  NumpadAdd: 106,
  NumpadEnter: 107,
  MediaTrackNext: 108,
  MediaTrackPrevious: 109,
  MediaStop: 110,
  MediaPlayPause: 111,
  AudioVolumeMute: 112,
  AudioVolumeUp: 113,
  AudioVolumeDown: 114,
}

const MODIFIER_CODES = new Set([
  'ControlLeft',
  'ControlRight',
  'MetaLeft',
  'MetaRight',
  'AltLeft',
  'AltRight',
  'ShiftLeft',
  'ShiftRight',
])

export function keycodeForKeyboardCode(code: string): number | undefined {
  return KEYBOARD_CODE_TO_NIZ_KEYCODE[code]
}

export function isModifierKeyboardCode(code: string): boolean {
  return MODIFIER_CODES.has(code)
}

interface KeyboardChordEvent {
  code: string
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
  shiftKey: boolean
}

export function keycodesForKeyboardChord(event: KeyboardChordEvent): number[] {
  const mainKeycode = keycodeForKeyboardCode(event.code)
  if (mainKeycode === undefined) return []

  const keycodes: number[] = []
  if (event.ctrlKey && !event.code.startsWith('Control')) keycodes.push(67)
  if (event.metaKey && !event.code.startsWith('Meta')) keycodes.push(68)
  if (event.altKey && !event.code.startsWith('Alt')) keycodes.push(69)
  if (event.shiftKey && !event.code.startsWith('Shift')) keycodes.push(55)
  keycodes.push(mainKeycode)
  return [...new Set(keycodes)]
}

export function keycodeName(keycode: number): string {
  return NIZ_KEYCODE_NAMES[keycode] ?? `Code 0x${keycode.toString(16).padStart(2, '0').toUpperCase()}`
}
