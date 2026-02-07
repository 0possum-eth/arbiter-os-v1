# Dual-Stack Routing Requirements

This document captures locked requirements for dual-stack Superpowers + Arbiter routing.

## Route Selection Behavior

- Prompt only when route is ambiguous.
- If intent is explicit, route directly without an extra menu.
- Offer these route options in order:
  1. Quick Scout from one sentence (Recommended)
  2. Brainstorm then Scout
  3. Use existing docs
  4. Use existing plan
- Re-prompt only when the prior route fails or prerequisites change.

## Dependency Automation Policy

- Assisted installation supports prerequisites + toolchain.
- Missing dependency remediation requires explicit user consent.
- Install attempts must emit structured receipts for outcome traceability.
- Disallowed actions include unrelated destructive system changes and silent installs.

## Truthfulness Guardrails

- The system must not claim loop success from artifact shape alone.
- Status output must include evidence-health/provenance fields.
- Task completion remains verifier-gated and ledger-committed.

## Acceptance Criteria

| Requirement | Verification |
| --- | --- |
| Route menu appears only when needed and includes locked options | `npm test -- "arbiter/intake/__tests__/routePrompt.test.ts" "arbiter/intake/__tests__/promptCopySnapshot.test.ts"` |
| Explicit intent bypasses route prompt | `npm test -- "arbiter/workflow/__tests__/router.test.ts"` |
| Mode selection is persisted and configurable | `npm test -- "arbiter/workflow/__tests__/modeStore.test.ts" "arbiter/commands/__tests__/index.test.ts"` |
| Assisted dependency path requires consent and writes receipts | `npm test -- "arbiter/preflight/__tests__/runtimeDoctor.test.ts" "arbiter/preflight/__tests__/installPlanner.test.ts" "arbiter/preflight/__tests__/installExecutor.test.ts"` |
| Status includes evidence health and prevents false “flawless” claims | `npm test -- "arbiter/state/__tests__/inspectStateEvidence.test.ts"` and `bash tests/arbiter/test-run-epic-intake-routing.sh` |
| Core build-plan parity remains enforced | `bash tests/arbiter/test-core-plan-parity.sh` |

## Mandatory Closure Checklist

- All acceptance criteria verification commands pass before publication.
- No task is marked done without verifier evidence and ledger continuity.
- Generated run artifacts are cleaned before publication commits (`docs/arbiter/_ledger/runs*`, `docs/arbiter/context-packs*`).
- Readiness publication includes parity confirmation for `run-epic` canonical routing and `execute-plan` compatibility.
