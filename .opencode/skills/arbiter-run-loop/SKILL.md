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
