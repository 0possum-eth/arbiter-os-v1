---
name: using-arbiter-os
description: Operate Arbiter OS roles and entrypoints
---
# Using Arbiter OS

- Use `run-epic` as the canonical entrypoint
- Keep Arbiter as the sole coordinator
- Use ledger-first state and receipts
- Never mark tasks done without verifier evidence
- Route execution through the coordinator loop
- Route execute-plan compatibility path into the Arbiter loop
- Apply `docs/arbiter/agent-prompt.md` as the policy contract
