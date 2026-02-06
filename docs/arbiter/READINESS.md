# Arbiter OS Readiness Scorecard

This scorecard is the release-readiness gate for the Arbiter OS workspace.

## Category Scores

| Category | Score | Basis |
| --- | --- | --- |
| Test Coverage and Stability | 20/20 | `npm test` plus OpenCode and Arbiter shell suites pass without failure |
| Command Surface and Routing | 20/20 | `tests/arbiter/test-command-surface.sh` and `tests/arbiter/test-execute-plan-routing.sh` pass |
| Installation and Plugin Wiring | 20/20 | `tests/arbiter/test-install-repo-target.sh` and `tests/arbiter/test-plugin-canonical.sh` pass |
| Workspace and Ledger Bootstrap | 20/20 | `tests/arbiter/test-workspace-init.sh` passes and creates expected files/directories |
| Documentation Integrity and Runtime Hygiene | 20/20 | `tests/arbiter/test-doc-links.sh` and `tests/arbiter/test-no-legacy-runtime-refs.sh` pass |

**Total readiness score: 100/100**

## Verification Evidence

Run all required checks from repository root:

1. `npm test`
2. `bash tests/opencode/run-tests.sh`
3. `bash tests/arbiter/test-workspace-init.sh`
4. `bash tests/arbiter/test-doc-links.sh`
5. `bash tests/arbiter/test-install-repo-target.sh`
6. `bash tests/arbiter/test-execute-plan-routing.sh`
7. `bash tests/arbiter/test-plugin-canonical.sh`
8. `bash tests/arbiter/test-command-surface.sh`
9. `bash tests/arbiter/test-no-legacy-runtime-refs.sh`

Primary evidence paths validated by the checks:

- `README.md`
- `.opencode/INSTALL.md`
- `docs/README.opencode.md`
- `docs/arbiter/USAGE.md`
- `docs/arbiter/agent-prompt.md`
- `commands/run-epic.md`
- `commands/execute-plan.md`
- `scripts/arbiter/install-opencode.sh`
- `scripts/arbiter/arbiter-init-workspace.ts`

## Release Gate

Release status is **READY** only when all of the following are true:

- Total readiness score is at least 90/100.
- Every command in the verification suite completes successfully.
- No legacy runtime references to `plugins/superpowers.js` are present in active paths.

If any condition fails, release status is **BLOCKED** until the failing check is fixed and re-run.
