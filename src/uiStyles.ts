type ClassValue = string | false | null | undefined

export function cx(...classes: readonly ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}

export function appShellClass(hasDraft: boolean): string {
  return cx(
    'grid h-svh min-h-svh bg-canvas text-ink max-[900px]:h-auto',
    hasDraft
      ? 'grid-rows-[58px_minmax(0,1fr)_46px_30px] max-[900px]:grid-rows-[58px_auto_46px_30px]'
      : 'grid-rows-[58px_minmax(0,1fr)_30px] max-[900px]:grid-rows-[58px_auto_30px]',
  )
}

export const contentStackClass = 'flex min-h-0 min-w-0 flex-col'

export function workspaceClass(
  showsDeviceRail: boolean,
  showsInspector: boolean,
): string {
  const base = 'grid min-h-0 flex-1 min-[901px]:overflow-hidden max-[900px]:grid-cols-[minmax(0,1fr)]'

  if (showsDeviceRail && showsInspector) {
    return cx(
      base,
      'grid-cols-[218px_minmax(0,1fr)_300px] max-[1100px]:grid-cols-[190px_minmax(0,1fr)_270px]',
      'max-[900px]:grid-rows-[auto_minmax(540px,1fr)_auto] max-[700px]:grid-rows-[minmax(520px,1fr)_auto]',
    )
  }

  if (showsDeviceRail) {
    return cx(
      base,
      'grid-cols-[218px_minmax(0,1fr)] max-[1100px]:grid-cols-[190px_minmax(0,1fr)]',
      'max-[900px]:grid-rows-[auto_minmax(540px,1fr)] max-[700px]:grid-rows-[minmax(520px,1fr)]',
    )
  }

  if (showsInspector) {
    return cx(
      base,
      'grid-cols-[minmax(0,1fr)_300px] max-[1100px]:grid-cols-[minmax(0,1fr)_270px]',
      'max-[900px]:grid-rows-[minmax(540px,1fr)_auto] max-[700px]:grid-rows-[minmax(520px,1fr)_auto]',
    )
  }

  return cx(
    base,
    'grid-cols-[minmax(0,1fr)] max-[900px]:grid-rows-[minmax(540px,1fr)] max-[700px]:grid-rows-[minmax(520px,1fr)]',
  )
}

export const keymapWorkspaceClass = 'flex min-h-0 min-w-0 flex-col bg-[#eceeea]'

export const keymapToolbarClass = [
  'flex min-h-[58px] items-center justify-between gap-[18px] border-b border-line bg-surface-muted px-[18px] py-2',
  'max-[700px]:flex-col max-[700px]:items-start max-[700px]:gap-2 max-[700px]:px-3 max-[700px]:py-[10px]',
].join(' ')

export const keymapToolbarActionsClass = [
  'flex min-w-0 items-center justify-end gap-3 max-[1300px]:gap-2',
  'max-[700px]:w-full max-[700px]:flex-wrap max-[700px]:justify-start',
].join(' ')

export const iconButtonClass = [
  'inline-flex size-[34px] cursor-pointer items-center justify-center rounded-md border border-line-strong bg-surface p-0 text-[#4f5751]',
  'transition-colors duration-120 enabled:hover:border-[#aab2aa] enabled:hover:bg-[#f1f3f0]',
  'disabled:cursor-default disabled:opacity-[0.45]',
].join(' ')

const commandButtonBaseClass = [
  'inline-flex h-[34px] min-w-[94px] cursor-pointer items-center justify-center gap-[7px] rounded-md border px-3 text-xs font-[650]',
  'transition-colors duration-120 disabled:cursor-default disabled:opacity-[0.45]',
  'max-[700px]:size-[34px] max-[700px]:min-w-[34px] max-[700px]:p-0',
].join(' ')

export const primaryCommandButtonClass = cx(
  commandButtonBaseClass,
  'border-[#245587] bg-action text-white enabled:hover:border-[#1d4770] enabled:hover:bg-[#27588f]',
)

export const quietCommandButtonClass = cx(
  commandButtonBaseClass,
  'border-line-strong bg-surface text-[#4b514c] enabled:hover:border-[#aab2aa] enabled:hover:bg-[#f1f3f0]',
)

export const dialogBackdropClass = 'fixed inset-0 z-100 grid place-items-center bg-[rgba(24,29,26,0.48)] p-[18px]'

export const dialogPanelClass = [
  'overflow-hidden rounded-[7px] border border-[#aeb5ae] bg-surface text-ink',
  'shadow-[0_20px_55px_rgba(22,27,23,0.26)]',
].join(' ')

export const dialogHeaderClass = [
  'flex min-w-0 items-center justify-between gap-4 border-b border-line py-2 pr-[10px] pl-4',
].join(' ')

export const dialogHeaderTitleClass = 'flex min-w-0 items-center gap-[9px] text-action'

export const dialogCloseButtonClass = [
  'inline-flex size-[30px] flex-none cursor-pointer items-center justify-center rounded-[5px] border-0 bg-transparent p-0 text-ink-muted',
  'hover:bg-surface-strong hover:text-ink',
].join(' ')

export const dialogFooterClass = 'flex min-w-0 items-center justify-end gap-[7px] border-t border-line bg-surface-muted px-3 py-[10px]'

const dialogButtonBaseClass = [
  'inline-flex min-h-8 cursor-pointer items-center justify-center gap-1.5 rounded-[5px] border px-[10px]',
  'text-[10px] font-[650]',
  'disabled:cursor-default disabled:opacity-[0.42]',
].join(' ')

export const dialogButtonClass = cx(
  dialogButtonBaseClass,
  'border-line-strong bg-surface text-[#4d554f] enabled:hover:border-[#a8afa8] enabled:hover:bg-[#eef0ed]',
)

export const dialogPrimaryButtonClass = cx(
  dialogButtonBaseClass,
  'border-[#245587] bg-action text-white enabled:hover:border-[#1d4770] enabled:hover:bg-[#27588f] enabled:hover:text-white',
)

export const dialogDangerButtonClass = cx(
  dialogButtonBaseClass,
  'border-[#92352e] bg-danger text-white enabled:hover:border-[#7d2c26] enabled:hover:bg-[#9d332c]',
)
