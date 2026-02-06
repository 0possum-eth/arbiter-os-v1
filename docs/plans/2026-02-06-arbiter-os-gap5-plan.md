# Arbiter OS Gap 5 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete remaining Arbiter OS gaps by unifying run-scoped receipts, implementing real task execution/verification/integration/ux flow, exposing full commands, repointing install/docs to `0possum-eth/arbiter-os-v1`, and upgrading role prompts to packet contracts.

**Architecture:** Preserve `run-epic` as single coordinator and ledger-first state. Standardize on run-scoped receipt envelopes. Require task completion packets and verifier packets before ledger commits. Expose trust commands through `arbiter/commands` and align docs/scripts to the `arbiter-os-v1` repo.

**Tech Stack:** TypeScript, Node.js, OpenCode plugins/skills, JSONL ledgers, node:test, shell tests.

---

### Task 1: Fix receipt pipeline consistency

**Files:**
- Modify: `arbiter/ledger/ledgerKeeper.ts`
- Create: `arbiter/receipts/readRunReceipts.ts`
- Modify: `arbiter/receipts/emitReceipt.ts`
- Test: `arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 1: Write failing test**
Assert `ledgerKeeper` reads `docs/arbiter/_ledger/runs/<runId>/receipts.jsonl` and no longer depends on `docs/arbiter/_ledger/receipts/receipts.jsonl`.

**Step 2: Verify fail**
Run: `npm test -- arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 3: Implement minimal fix**
Add `readRunReceipts(rootDir)` helper and route `ledgerKeeper` through it.

**Step 4: Verify pass**
Run: `npm test -- arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 5: Commit**
`git commit -m "fix(ledger): consume run-scoped receipts in ledger keeper"`

---

### Task 2: Enforce packet schemas for done gating

**Files:**
- Create: `arbiter/contracts/packets.ts`
- Modify: `arbiter/receipts/types.ts`
- Modify: `arbiter/verify/verifyReceipts.ts`
- Test: `arbiter/verify/__tests__/verifyReceipts.test.ts`

**Step 1: Write failing test**
Require packet-based evidence: `EXECUTOR_COMPLETED`, `VERIFIER_SPEC`, `VERIFIER_QUALITY`, and task-conditional integration/ux packets.

**Step 2: Verify fail**
Run: `npm test -- arbiter/verify/__tests__/verifyReceipts.test.ts`

**Step 3: Implement minimal packet model**
Define TCP/VP/Integration/Ux packet types and enforce in `verifyReceipts`.

**Step 4: Verify pass**
Run: `npm test -- arbiter/verify/__tests__/verifyReceipts.test.ts`

**Step 5: Commit**
`git commit -m "feat(verify): enforce packet-based receipt contracts"`

---

### Task 3: Implement real executor+verifier flow in `runTask`

**Files:**
- Modify: `arbiter/execute/taskRunner.ts`
- Create: `arbiter/execute/executeTaskStrategy.ts`
- Create: `arbiter/verify/specVerifier.ts`
- Create: `arbiter/verify/qualityVerifier.ts`
- Test: `arbiter/execute/__tests__/taskRunner.test.ts`

**Step 1: Write failing test**
Assert non-noop task emits executor + verifier receipts and returns `TASK_DONE` (not placeholder halt).

**Step 2: Verify fail**
Run: `npm test -- arbiter/execute/__tests__/taskRunner.test.ts`

**Step 3: Implement minimal real flow**
Add execution strategy hook and verifier stubs, emit receipts, halt only on verifier failure.

**Step 4: Verify pass**
Run: `npm test -- arbiter/execute/__tests__/taskRunner.test.ts`

**Step 5: Commit**
`git commit -m "feat(execute): replace placeholder halt with executor-verifier flow"`

---

### Task 4: Add electrician + UX task-level gates

**Files:**
- Modify: `arbiter/execute/taskRunner.ts`
- Modify: `arbiter/phases/electrician.ts`
- Modify: `arbiter/phases/uxCoordinator.ts`
- Modify: `arbiter/ledger/ledgerKeeper.ts`
- Test: `arbiter/execute/__tests__/taskRunner.test.ts`
- Test: `arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 1: Write failing test**
Assert integration-required tasks need `INTEGRATION_CHECKED` and UX-sensitive tasks need `UX_SIMULATED` before ledger commit.

**Step 2: Verify fail**
Run: `npm test -- arbiter/execute/__tests__/taskRunner.test.ts arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 3: Implement minimal gating**
Add task flags (`requiresIntegrationCheck`, `uxSensitive`) and enforce corresponding packets.

**Step 4: Verify pass**
Run: `npm test -- arbiter/execute/__tests__/taskRunner.test.ts arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 5: Commit**
`git commit -m "feat(run): gate task completion on integration and ux packets"`

---

### Task 5: Wire full command surface through `arbiter/commands`

**Files:**
- Modify: `arbiter/commands/index.ts`
- Create: `arbiter/commands/approveBrick.ts`
- Create: `arbiter/commands/mountDoc.ts`
- Create: `arbiter/commands/listBricks.ts`
- Test: `arbiter/commands/__tests__/index.test.ts`

**Step 1: Write failing test**
Assert exports include `run-epic`, `approve-brick`, `mount-doc`, and `list-bricks`.

**Step 2: Verify fail**
Run: `npm test -- arbiter/commands/__tests__/index.test.ts`

**Step 3: Implement wrappers and exports**
Wire command wrappers to `arbiter/trust/cli.ts` functions.

**Step 4: Verify pass**
Run: `npm test -- arbiter/commands/__tests__/index.test.ts arbiter/trust/__tests__/cli.test.ts`

**Step 5: Commit**
`git commit -m "feat(commands): expose full arbiter command surface"`

---

### Task 6: Repoint install/docs defaults to `arbiter-os-v1`

**Files:**
- Modify: `.opencode/INSTALL.md`
- Modify: `README.md`
- Modify: `docs/README.opencode.md`
- Modify: `scripts/arbiter/install-opencode.sh`
- Create: `tests/arbiter/test-install-repo-target.sh`

**Step 1: Write failing test**
Assert install docs/scripts target `https://github.com/0possum-eth/arbiter-os-v1.git` as Arbiter OS default.

**Step 2: Verify fail**
Run: `bash tests/arbiter/test-install-repo-target.sh`

**Step 3: Implement doc/script updates**
Repoint clone/symlink examples and preserve legacy notes where needed.

**Step 4: Verify pass**
Run: `bash tests/arbiter/test-install-repo-target.sh && bash tests/arbiter/test-doc-links.sh`

**Step 5: Commit**
`git commit -m "docs(arbiter): repoint install defaults to arbiter-os-v1"`

---

### Task 7: Upgrade role prompts to enforceable packet contracts

**Files:**
- Modify: `.opencode/agents/*.md`
- Create: `tests/opencode/test-agent-contracts.sh`

**Step 1: Write failing test**
Assert each role prompt includes purpose, hard constraints, and required packet output contract where applicable.

**Step 2: Verify fail**
Run: `bash tests/opencode/test-agent-contracts.sh`

**Step 3: Implement prompt upgrades**
Add explicit contract blocks for Arbiter, Executor, Verifiers, Electrician, UX Coordinator, Ledger Keeper, Librarian, Oracle, Scout.

**Step 4: Verify pass**
Run: `bash tests/opencode/test-agent-contracts.sh && bash tests/opencode/test-agents.sh`

**Step 5: Commit**
`git commit -m "feat(agents): enforce packet-based role contracts"`

---

### Task 8: Route execute-plan compatibility path into Arbiter loop

**Files:**
- Modify: `commands/execute-plan.md`
- Modify: `.opencode/skills/arbiter-run-loop/SKILL.md`
- Modify: `.opencode/skills/using-arbiter-os/SKILL.md`
- Create: `docs/arbiter/agent-prompt.md`
- Create: `tests/arbiter/test-execute-plan-routing.sh`

**Step 1: Write failing test**
Assert execute-plan guidance routes to Arbiter run-loop semantics and `run-epic` canonical entrypoint.

**Step 2: Verify fail**
Run: `bash tests/arbiter/test-execute-plan-routing.sh`

**Step 3: Implement routing bridge**
Update command/skills and add `docs/arbiter/agent-prompt.md` policy contract.

**Step 4: Verify pass**
Run: `bash tests/arbiter/test-execute-plan-routing.sh`

**Step 5: Commit**
`git commit -m "feat(arbiter): route execute-plan through arbiter loop"`

---

### Task 9: Full verification and regression hardening

**Files:**
- Modify: `tests/opencode/run-tests.sh`
- Modify: `docs/plans/2026-02-06-arbiter-os-gap5-plan.md`

**Step 1: Expand runner coverage**
Ensure new contract/routing tests are included in shell suites.

**Step 2: Run full verification**
Run:
- `npm test`
- `bash tests/opencode/run-tests.sh`
- `bash tests/arbiter/test-workspace-init.sh`
- `bash tests/arbiter/test-doc-links.sh`
- `bash tests/arbiter/test-install-repo-target.sh`
- `bash tests/arbiter/test-execute-plan-routing.sh`

Expected: all PASS.

**Step 3: Commit**
`git commit -m "test(arbiter): harden gap5 regression coverage"`

---

**Plan complete and saved to `docs/plans/2026-02-06-arbiter-os-gap5-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
