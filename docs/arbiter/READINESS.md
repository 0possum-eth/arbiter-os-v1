# Arbiter OS Readiness Scorecard

This scorecard is the release-readiness gate for the Arbiter OS workspace.

## Category Scores

| Category | Score | Basis |
| --- | --- | --- |
| Orchestration kernel & command surface | 95/100 | `run-epic` remains canonical; command and routing gates pass (`test-command-surface.sh`, `test-execute-plan-routing.sh`) |
| Execution + verification + done gating | 94/100 | Executor packets require structured command evidence, verifier chain enforced, and done-state gating is receipt-backed |
| Ledger/state architecture | 93/100 | Ledger schema versioning and replay workflow are covered by `test-ledger-replay.sh` and state-view rebuild tests |
| Trust gating & role isolation | 94/100 | Content-hash trust approvals plus strict role-policy gates validated by trust and plugin policy tests |
| Retrieval/context quality | 92/100 | Hybrid lexical + semantic-lite retrieval with deterministic ranking and context-pack source trace IDs |
| Memory/continuity | 92/100 | Memory query integration plus promotion/decay lifecycle policy is covered by memory policy and compaction tests |
| Scout/research-to-PRD loop | 93/100 | Scout metadata realism, deterministic mode, and execution-ready candidate selection are validated in scout seam and synthesis tests |
| Install/docs/runtime migration readiness | 95/100 | Repo and Windows install targets validated (`test-install-repo-target.sh`, `test-install-windows-target.sh`) with doc and runtime hygiene gates |

**Total readiness score: 94/100**

## Independent Audit Pass

Audit scope: `core arbiter build plan.md` criteria mapped to repository evidence.

| Category | Evidence |
| --- | --- |
| Orchestration kernel & command surface | `arbiter/run/runEpicAutopilot.ts`, `arbiter/commands/index.ts`, `tests/arbiter/test-command-surface.sh` |
| Execution + verification + done gating | `arbiter/execute/executeTaskStrategy.ts`, `arbiter/verify/verifyReceipts.ts`, `arbiter/ledger/ledgerKeeper.ts` |
| Ledger/state architecture | `arbiter/ledger/appendEvent.ts`, `arbiter/ledger/rebuildViews.ts`, `tests/arbiter/test-ledger-replay.sh` |
| Trust gating & role isolation | `arbiter/trust/policy.ts`, `arbiter/policy/rolePolicy.ts`, `.opencode/plugins/arbiter-os.js` |
| Retrieval/context quality | `arbiter/docs/retrieveBricks.ts`, `arbiter/docs/retrievalScoring.ts`, `arbiter/librarian/contextPack.ts` |
| Memory/continuity | `arbiter/memory/query.ts`, `arbiter/memory/policy.ts`, `arbiter/memory/compactSummary.ts` |
| Scout/research-to-PRD loop | `arbiter/scout/extractPrd.ts`, `arbiter/scout/candidateScoring.ts`, `arbiter/decisions/arbiterDecision.ts` |
| Install/docs/runtime migration readiness | `.opencode/INSTALL.md`, `docs/README.opencode.md`, `scripts/arbiter/install-opencode.ps1` |

## Core Build Plan Parity

- Role separation: Arbiter coordinates, Executor implements, Verifiers validate, and Ledger Keeper performs final commit authority.
- No done without verifier evidence: completion requires executor + verifier receipts before ledger `task_done` is accepted.
- `run-epic` canonical entrypoint: orchestration contracts and command docs keep `run-epic` as primary loop command.
- `execute-plan` compatibility path: compatibility routing remains documented and covered by command tests.
- Trust gating remains enforced: behavior docs are untrusted by default unless explicitly approved.

## Verification Evidence

Run all required checks from repository root:

1. `npm test`
2. `bash tests/opencode/run-tests.sh`
3. `bash tests/arbiter/test-workspace-init.sh`
4. `bash tests/arbiter/test-doc-links.sh`
5. `bash tests/arbiter/test-install-repo-target.sh`
6. `bash tests/arbiter/test-install-windows-target.sh`
7. `bash tests/arbiter/test-execute-plan-routing.sh`
8. `bash tests/arbiter/test-plugin-canonical.sh`
9. `bash tests/arbiter/test-command-surface.sh`
10. `bash tests/arbiter/test-no-legacy-runtime-refs.sh`
11. `bash tests/arbiter/test-ledger-replay.sh`
12. `bash tests/arbiter/test-readiness-scores.sh`
13. `bash tests/arbiter/test-agent-contracts-sync.sh`
14. `bash tests/arbiter/test-branding-active-docs.sh`
15. `bash tests/arbiter/test-run-epic-e2e.sh`

Primary evidence paths validated by the checks:

- `README.md`
- `.opencode/INSTALL.md`
- `docs/README.opencode.md`
- `docs/arbiter/USAGE.md`
- `docs/arbiter/agent-prompt.md`
- `commands/run-epic.md`
- `commands/execute-plan.md`
- `scripts/arbiter/install-opencode.sh`
- `scripts/arbiter/install-opencode.ps1`
- `scripts/arbiter/arbiter-init-workspace.ts`

## Release Gate

Release status is **READY** only when all of the following are true:

- Total readiness score is at least 90/100.
- Every category score is at least 90/100.
- Every command in the verification suite completes successfully.
- No legacy runtime references to `plugins/superpowers.js` are present in active paths.

If any condition fails, release status is **BLOCKED** until the failing check is fixed and re-run.

<!-- readiness-metadata:start -->
## Evidence Metadata

- generatedAt: 2026-02-07T18:20:39.027Z
- sourceCommit: 0d19915b0bd2a357a945a0cd6c06644ea052f219

### Category Evidence Inputs

- Orchestration kernel & command surface: tests/arbiter/test-command-surface.sh, tests/arbiter/test-execute-plan-routing.sh
- Execution + verification + done gating: arbiter/verify/verifyReceipts.ts, arbiter/execute/taskRunner.ts
- Ledger/state architecture: arbiter/ledger/appendEvent.ts, tests/arbiter/test-ledger-replay.sh
- Trust gating & role isolation: arbiter/trust/policy.ts, .opencode/plugins/arbiter-os.js
- Retrieval/context quality: arbiter/docs/retrieveBricks.ts, arbiter/librarian/contextPack.ts
- Memory/continuity: arbiter/memory/query.ts, arbiter/memory/policy.ts
- Scout/research-to-PRD loop: arbiter/scout/extractPrd.ts, arbiter/decisions/arbiterDecision.ts
- Install/docs/runtime migration readiness: .opencode/INSTALL.md, tests/arbiter/test-install-windows-target.sh

<!-- readiness-metadata:end -->
