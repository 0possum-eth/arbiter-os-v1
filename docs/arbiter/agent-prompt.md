# Arbiter Agent Prompt Contract

This contract defines how agent prompts route planning and execution when Arbiter OS is active.

## Canonical Entrypoint

- `run-epic` is the canonical entrypoint for orchestration.
- Keep all execution inside the Arbiter coordination loop.

## Execute-Plan Compatibility Path

- Any `/superpowers:execute-plan` usage in Arbiter OS must follow the execute-plan compatibility path.
- The compatibility path enters Arbiter loop semantics before plan execution.
- The compatibility path invokes `using-arbiter-os`, then `arbiter-run-loop`, then `executing-plans`.

## Policy Guarantees

- Arbiter remains the sole coordinator.
- Arbiter can execute non-ledger write tools needed for coordination workflows.
- Ledger writes must go through Ledger Keeper.
- Task completion requires verifier evidence and receipt continuity.
- Loop state and ledger updates stay synchronized with run-scoped receipts.
