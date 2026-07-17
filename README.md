# NIZ Deck

Community WebHID configurator with physical-layout support for NIZ 68 Pro, 84EC, and 87-key ANSI keyboards, built with React and TypeScript.

NIZ Deck is an independent community project and is not affiliated with NiZ.

## Commands

```bash
bun install
bun run dev
bun run test
bun run typecheck
bun run lint
bun run build
```

## Current scope

- Connect to NIZ 68 Pro (`VID 0x0483`, `PID 0x5532`) and 84EC (`PID 0x5129`)
- Open the 68 Pro program interface (`UsagePage 0x8C`, Usage `0x01`); discover the 84EC collection by VID/PID
- Read firmware version (`0xF9`)
- Capture the complete keymap (`0xF2`, `0xF0`, `0xF6`)
- Inspect Base, Right Fn, and Left Fn layers
- Render the 68-key, 84-key, or 87-key ANSI physical layout from the device or capture, with manual selection available
- Recognize 87-key devices by product name; the WebHID picker remains limited to confirmed 68 Pro and 84EC product IDs
- Export a versioned JSON capture containing raw and parsed reports
- Rewrite the unchanged complete capture only after a second matching read, then verify a complete read-back

The rewrite action is deliberately guarded: it validates every raw record, permits no more than one stable omitted record, requires matching preflight reads, and marks interrupted writes as requiring recovery.

## Structure

```text
src/
  components/   Workbench UI
  data/         Physical layout and NIZ keycode names
  device/       Transport contracts, WebHID adapter, device client
  domain/       Shared state and action models
  hooks/        React device lifecycle
  protocol/     64-byte packet codec and parser
  types/        WebHID browser declarations
```
