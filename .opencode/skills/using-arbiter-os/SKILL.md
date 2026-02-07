---
name: using-arbiter-os
description: Operate Arbiter OS roles and entrypoints
---
# Using Arbiter OS

- Use `run-epic` as the canonical entrypoint
- Select a workflow profile: `hybrid_guided`, `superpowers_core`, or `arbiter_core`
- Keep Arbiter as the sole coordinator
- Use ledger-first state and receipts
- Never mark tasks done without verifier evidence
- Route execution through the coordinator loop
- Route execute-plan compatibility path into the Arbiter loop
- Apply `docs/arbiter/agent-prompt.md` as the policy contract
- In `superpowers_core`, keep `superpowers:brainstorming` and `superpowers:writing-plans` callable as first-class routes
