---
name: arbiter-run-loop
description: Execute the Arbiter OS coordination loop
---
# Arbiter Run Loop

- Inspect state before executing
- If no epic, run Scout then activate one
- Execute exactly one task per run
- Emit receipts for HALT and FINALIZE
- Resume by re-entering inspectState
- Treat execute-plan compatibility path as an Arbiter loop entry
- Keep `run-epic` as the canonical entrypoint for each cycle
- Align loop behavior with `docs/arbiter/agent-prompt.md`
- In `hybrid_guided`, present route choices only when requirements maturity is ambiguous
