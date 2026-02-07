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
