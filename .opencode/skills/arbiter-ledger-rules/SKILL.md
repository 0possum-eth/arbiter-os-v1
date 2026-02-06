---
name: arbiter-ledger-rules
description: Ledger-first state and evidence requirements
---
# Arbiter Ledger Rules

- Ledger is append-only JSONL
- Views are derived and regenerable
- Only Ledger Keeper writes task_done events
- Require executor + verifier receipts before commit
- Never edit ledger or views outside the keeper
