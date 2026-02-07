# Arbiter OS Final Gap Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all remaining gaps against the original core build-plan intent while preserving Arbiter write power and adding explicit non-subagent workflow experimentation.

**Architecture:** Keep `run-epic` as canonical orchestration, preserve ledger-first state transitions, and improve depth in workflow modes, UX simulation, scout research, and documentation consistency. Strengthen evidence contracts and readiness automation without regressing trust/role isolation.

**Tech Stack:** TypeScript, Node.js, OpenCode plugin hooks, JSONL ledgers, `tsx --test`, shell gates.

---

## Completion Checklist

- [x] Task 1 - Lock Arbiter write-power behavior with explicit regression tests
- [x] Task 2 - Add workflow mode framework for non-subagent execution experiments
- [x] Task 3 - Support safe direct-command workflow mode policy
- [x] Task 4 - Upgrade UX coordinator from pass-through receipt to real journey simulation
- [x] Task 5 - Add Oracle review gate for high-risk tasks
- [x] Task 6 - Implement external scout research ingestion loop
- [x] Task 7 - Strengthen scout candidate quality and recommendation rationale
- [x] Task 8 - Align role prompt contracts with implemented packet schemas
- [x] Task 9 - Complete Arbiter OS branding convergence in active docs
- [x] Task 10 - Add evidence-driven readiness recalculation utility
- [x] Task 11 - Add end-to-end receipt-gated run-epic scenario test
- [x] Task 12 - Final verification pass + readiness publication

### Workflow Mode Outcomes

- `receipt_gated`: canonical behavior preserved, receipt gates required for completion.
- `single_agent`: deterministic one-task progression for direct non-subagent experimentation.
- `batch_validation`: bounded multi-task progression with validation-focused flow.

---

## Non-Negotiable Constraints

- Preserve Arbiter write power for non-ledger paths (do not downgrade `arbiter` role to read-only).
- Keep Ledger Keeper as the only writer for ledger/view paths (`docs/arbiter/_ledger/**`, `docs/arbiter/prd.json`, `docs/arbiter/progress.txt`).
- Keep `run-epic` as canonical command entrypoint.
- Keep `execute-plan` as compatibility path into Arbiter semantics.
- Keep receipt-gated completion and verifier evidence requirements.

---

### Task 1: Lock Arbiter write-power behavior with explicit regression tests

**Files:**
- Modify: `arbiter/policy/__tests__/rolePolicy.test.ts`
- Modify: `arbiter/trust/__tests__/policy.test.ts`
- Modify: `docs/arbiter/agent-prompt.md`

**Step 1: Write the failing tests**

Add assertions:
- `arbiter` role can execute write tools for non-ledger paths.
- `arbiter` role still cannot write ledger/view paths.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/policy/__tests__/rolePolicy.test.ts" "arbiter/trust/__tests__/policy.test.ts"`

Expected: FAIL until explicit arbiter-role assertions and policy wording align.

**Step 3: Implement minimal changes**

Update docs/tests to codify current intended behavior without changing core permissions.

**Step 4: Re-run tests to verify pass**

Run: `npm test -- "arbiter/policy/__tests__/rolePolicy.test.ts" "arbiter/trust/__tests__/policy.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/policy/__tests__/rolePolicy.test.ts arbiter/trust/__tests__/policy.test.ts docs/arbiter/agent-prompt.md
git commit -m "test(policy): pin arbiter write-power and ledger-boundary behavior"
```

---

### Task 2: Add workflow mode framework for non-subagent execution experiments

**Files:**
- Create: `arbiter/run/workflowMode.ts`
- Modify: `arbiter/run/runEpicAutopilot.ts`
- Modify: `arbiter/commands/runEpic.ts`
- Create: `arbiter/run/__tests__/workflowMode.test.ts`
- Modify: `arbiter/run/__tests__/runEpicAutopilot.test.ts`

**Step 1: Write failing tests**

Require deterministic mode parsing and routing for:
- `receipt_gated` (default)
- `single_agent`
- `batch_validation`

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/run/__tests__/workflowMode.test.ts" "arbiter/run/__tests__/runEpicAutopilot.test.ts"`

Expected: FAIL (mode abstraction missing).

**Step 3: Implement minimal mode layer**

Add mode resolver (env + command options), keep default behavior unchanged.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/run/__tests__/workflowMode.test.ts" "arbiter/run/__tests__/runEpicAutopilot.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/run/workflowMode.ts arbiter/run/runEpicAutopilot.ts arbiter/commands/runEpic.ts arbiter/run/__tests__/workflowMode.test.ts arbiter/run/__tests__/runEpicAutopilot.test.ts
git commit -m "feat(run): add workflow modes for non-subagent experimentation"
```

---

### Task 3: Support safe direct-command workflow mode policy

**Files:**
- Modify: `arbiter/policy/toolTargets.ts`
- Modify: `arbiter/policy/rolePolicy.ts`
- Modify: `.opencode/plugins/arbiter-os.js`
- Modify: `arbiter/policy/__tests__/rolePolicy.test.ts`
- Modify: `arbiter/trust/__tests__/policy.test.ts`

**Step 1: Write failing tests**

Add tests for:
- read-only bash commands allowed only in explicit experimental mode,
- mutating/path-ambiguous bash denied fail-closed,
- ledger boundary still enforced.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/policy/__tests__/rolePolicy.test.ts" "arbiter/trust/__tests__/policy.test.ts"`

Expected: FAIL.

**Step 3: Implement minimal policy extension**

Add explicit command classifier and feature-flag gate (`ARBITER_EXPERIMENTAL_DIRECT=true`).

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/policy/__tests__/rolePolicy.test.ts" "arbiter/trust/__tests__/policy.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/policy/toolTargets.ts arbiter/policy/rolePolicy.ts .opencode/plugins/arbiter-os.js arbiter/policy/__tests__/rolePolicy.test.ts arbiter/trust/__tests__/policy.test.ts
git commit -m "feat(policy): add guarded direct-command mode without weakening ledger boundaries"
```

---

### Task 4: Upgrade UX coordinator from pass-through receipt to real journey simulation

**Files:**
- Create: `arbiter/phases/uxJourney.ts`
- Modify: `arbiter/phases/uxCoordinator.ts`
- Modify: `arbiter/contracts/packets.ts`
- Modify: `arbiter/verify/verifyReceipts.ts`
- Modify: `arbiter/phases/__tests__/phaseReceipts.test.ts`
- Modify: `arbiter/verify/__tests__/verifyReceipts.test.ts`
- Modify: `arbiter/execute/__tests__/taskRunner.test.ts`

**Step 1: Write failing tests**

Require `UxPacket` to include non-empty journey checks and fail when missing for UX-sensitive tasks.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/phases/__tests__/phaseReceipts.test.ts" "arbiter/verify/__tests__/verifyReceipts.test.ts" "arbiter/execute/__tests__/taskRunner.test.ts"`

Expected: FAIL.

**Step 3: Implement minimal journey model**

Generate deterministic checklist from task packet context/citations, emit structured `UxPacket`.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/phases/__tests__/phaseReceipts.test.ts" "arbiter/verify/__tests__/verifyReceipts.test.ts" "arbiter/execute/__tests__/taskRunner.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/phases/uxJourney.ts arbiter/phases/uxCoordinator.ts arbiter/contracts/packets.ts arbiter/verify/verifyReceipts.ts arbiter/phases/__tests__/phaseReceipts.test.ts arbiter/verify/__tests__/verifyReceipts.test.ts arbiter/execute/__tests__/taskRunner.test.ts
git commit -m "feat(ux): replace pass-through ux receipt with journey simulation evidence"
```

---

### Task 5: Add Oracle review gate for high-risk tasks

**Files:**
- Create: `arbiter/phases/oracle.ts`
- Modify: `arbiter/execute/taskRunner.ts`
- Modify: `arbiter/contracts/packets.ts`
- Modify: `arbiter/receipts/types.ts`
- Modify: `arbiter/verify/verifyReceipts.ts`
- Create: `arbiter/phases/__tests__/oracle.test.ts`
- Modify: `arbiter/verify/__tests__/verifyReceipts.test.ts`

**Step 1: Write failing tests**

Require oracle packet when `requiresOracleReview` is true.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/phases/__tests__/oracle.test.ts" "arbiter/verify/__tests__/verifyReceipts.test.ts"`

Expected: FAIL.

**Step 3: Implement minimal oracle gate**

Emit `ORACLE_REVIEWED` receipt with pass/fail summary and wire it to verifier evidence gate.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/phases/__tests__/oracle.test.ts" "arbiter/verify/__tests__/verifyReceipts.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/phases/oracle.ts arbiter/execute/taskRunner.ts arbiter/contracts/packets.ts arbiter/receipts/types.ts arbiter/verify/verifyReceipts.ts arbiter/phases/__tests__/oracle.test.ts arbiter/verify/__tests__/verifyReceipts.test.ts
git commit -m "feat(oracle): add high-risk review gate in receipt evidence pipeline"
```

---

### Task 6: Implement external scout research ingestion loop

**Files:**
- Create: `arbiter/scout/fetchResearch.ts`
- Modify: `arbiter/phases/scout.ts`
- Modify: `arbiter/scout/researchIngest.ts`
- Modify: `arbiter/scout/synthesizePrd.ts`
- Create: `arbiter/scout/__tests__/fetchResearch.test.ts`
- Modify: `arbiter/scout/__tests__/researchLoop.test.ts`

**Step 1: Write failing tests**

Require scout to ingest URL-sourced research (with deterministic offline test doubles) and persist source lineage.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/scout/__tests__/fetchResearch.test.ts" "arbiter/scout/__tests__/researchLoop.test.ts"`

Expected: FAIL.

**Step 3: Implement minimal research fetch pipeline**

Add fetch adapter with timeout/allowlist, integrate into scout fallback path.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/scout/__tests__/fetchResearch.test.ts" "arbiter/scout/__tests__/researchLoop.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/scout/fetchResearch.ts arbiter/phases/scout.ts arbiter/scout/researchIngest.ts arbiter/scout/synthesizePrd.ts arbiter/scout/__tests__/fetchResearch.test.ts arbiter/scout/__tests__/researchLoop.test.ts
git commit -m "feat(scout): add external research ingestion with source lineage"
```

---

### Task 7: Strengthen scout candidate quality and recommendation rationale

**Files:**
- Modify: `arbiter/scout/candidateScoring.ts`
- Modify: `arbiter/scout/extractPrd.ts`
- Modify: `arbiter/decisions/arbiterDecision.ts`
- Modify: `arbiter/decisions/__tests__/scoutSeam.test.ts`
- Modify: `arbiter/validators/__tests__/validateScoutSynthesis.test.ts`

**Step 1: Write failing tests**

Require recommendation rationale to include scored reasons and tie-break context.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/decisions/__tests__/scoutSeam.test.ts" "arbiter/validators/__tests__/validateScoutSynthesis.test.ts"`

Expected: FAIL.

**Step 3: Implement minimal scoring explainability**

Add deterministic reason strings based on winning score components.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/decisions/__tests__/scoutSeam.test.ts" "arbiter/validators/__tests__/validateScoutSynthesis.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/scout/candidateScoring.ts arbiter/scout/extractPrd.ts arbiter/decisions/arbiterDecision.ts arbiter/decisions/__tests__/scoutSeam.test.ts arbiter/validators/__tests__/validateScoutSynthesis.test.ts
git commit -m "feat(scout): add explainable deterministic recommendation rationale"
```

---

### Task 8: Align role prompt contracts with implemented packet schemas

**Files:**
- Modify: `.opencode/agents/arbiter.md`
- Modify: `.opencode/agents/executor.md`
- Modify: `.opencode/agents/verifier-spec.md`
- Modify: `.opencode/agents/verifier-quality.md`
- Modify: `.opencode/agents/electrician.md`
- Modify: `.opencode/agents/ux-coordinator.md`
- Modify: `.opencode/agents/ledger-keeper.md`
- Modify: `docs/arbiter/agent-prompt.md`
- Create: `tests/arbiter/test-agent-contracts-sync.sh`

**Step 1: Write failing test**

Require packet terms in agent docs to match active contract types in `arbiter/contracts/packets.ts` and `arbiter/receipts/types.ts`.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-agent-contracts-sync.sh`

Expected: FAIL.

**Step 3: Implement minimal contract sync**

Normalize doc vocabulary and required fields; remove stale/undefined packet names.

**Step 4: Re-run test**

Run: `bash tests/arbiter/test-agent-contracts-sync.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add .opencode/agents/arbiter.md .opencode/agents/executor.md .opencode/agents/verifier-spec.md .opencode/agents/verifier-quality.md .opencode/agents/electrician.md .opencode/agents/ux-coordinator.md .opencode/agents/ledger-keeper.md docs/arbiter/agent-prompt.md tests/arbiter/test-agent-contracts-sync.sh
git commit -m "docs(agents): align role packet contracts with live arbiter schemas"
```

---

### Task 9: Complete Arbiter OS branding convergence in active docs

**Files:**
- Modify: `README.md`
- Modify: `docs/README.opencode.md`
- Modify: `.opencode/INSTALL.md`
- Modify: `docs/testing.md`
- Create: `tests/arbiter/test-branding-active-docs.sh`
- Modify: `tests/arbiter/test-doc-links.sh`

**Step 1: Write failing test**

Assert active user-facing docs default to Arbiter OS naming while preserving explicit compatibility references where needed.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-branding-active-docs.sh`

Expected: FAIL.

**Step 3: Implement minimal docs rewrite**

Update top-level narrative to Arbiter OS-first phrasing with compatibility notes.

**Step 4: Re-run tests**

Run: `bash tests/arbiter/test-branding-active-docs.sh && bash tests/arbiter/test-doc-links.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add README.md docs/README.opencode.md .opencode/INSTALL.md docs/testing.md tests/arbiter/test-branding-active-docs.sh tests/arbiter/test-doc-links.sh
git commit -m "docs(brand): converge active docs on arbiter-os-first language"
```

---

### Task 10: Add evidence-driven readiness recalculation utility

**Files:**
- Create: `scripts/arbiter/recalculate-readiness.ts`
- Modify: `docs/arbiter/READINESS.md`
- Modify: `tests/arbiter/test-readiness-scores.sh`
- Modify: `tests/opencode/run-tests.sh`
- Create: `arbiter/__tests__/readinessRecalculation.test.ts`

**Step 1: Write failing tests**

Require readiness file to include generated evidence metadata (generatedAt + source commit).

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/__tests__/readinessRecalculation.test.ts" && bash tests/arbiter/test-readiness-scores.sh`

Expected: FAIL.

**Step 3: Implement minimal generator**

Generate deterministic markdown section from configured category evidence inputs.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/__tests__/readinessRecalculation.test.ts" && bash tests/arbiter/test-readiness-scores.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/arbiter/recalculate-readiness.ts docs/arbiter/READINESS.md tests/arbiter/test-readiness-scores.sh tests/opencode/run-tests.sh arbiter/__tests__/readinessRecalculation.test.ts
git commit -m "feat(readiness): generate evidence-driven readiness score sections"
```

---

### Task 11: Add end-to-end receipt-gated run-epic scenario test

**Files:**
- Create: `tests/arbiter/test-run-epic-e2e.sh`
- Modify: `tests/opencode/run-tests.sh`
- Modify: `docs/arbiter/USAGE.md`

**Step 1: Write failing test**

Test flow in a temp workspace:
- initialize workspace,
- create minimal epic/task,
- run execution path,
- assert receipts + ledger + views show coherent completion.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-run-epic-e2e.sh`

Expected: FAIL.

**Step 3: Implement minimal script and wiring**

Make script deterministic and CI-friendly; wire into test runner.

**Step 4: Re-run tests**

Run: `bash tests/arbiter/test-run-epic-e2e.sh && bash tests/opencode/run-tests.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add tests/arbiter/test-run-epic-e2e.sh tests/opencode/run-tests.sh docs/arbiter/USAGE.md
git commit -m "test(run): add end-to-end receipt-gated run-epic scenario"
```

---

### Task 12: Final verification pass + readiness publication

**Files:**
- Modify: `docs/arbiter/READINESS.md`
- Modify: `docs/plans/2026-02-06-arbiter-os-final-gap-closure-plan.md`

**Step 1: Add completion checklist to this plan**

Add checkbox status for Tasks 1-12 and mode-experiment outcomes.

**Step 2: Run complete verification suite**

Run:
- `npm test`
- `bash tests/opencode/run-tests.sh`
- `bash tests/arbiter/test-workspace-init.sh`
- `bash tests/arbiter/test-doc-links.sh`
- `bash tests/arbiter/test-install-repo-target.sh`
- `bash tests/arbiter/test-install-windows-target.sh`
- `bash tests/arbiter/test-execute-plan-routing.sh`
- `bash tests/arbiter/test-plugin-canonical.sh`
- `bash tests/arbiter/test-command-surface.sh`
- `bash tests/arbiter/test-no-legacy-runtime-refs.sh`
- `bash tests/arbiter/test-ledger-replay.sh`
- `bash tests/arbiter/test-readiness-scores.sh`
- `bash tests/arbiter/test-agent-contracts-sync.sh`
- `bash tests/arbiter/test-branding-active-docs.sh`
- `bash tests/arbiter/test-run-epic-e2e.sh`

Expected: all PASS.

**Step 3: Clean generated artifacts before commit**

Remove:
- `docs/arbiter/_ledger/runs*`
- `docs/arbiter/context-packs*`

**Step 4: Confirm clean status**

Run: `git status -sb`

Expected: only intended docs changes.

**Step 5: Commit**

```bash
git add docs/arbiter/READINESS.md docs/plans/2026-02-06-arbiter-os-final-gap-closure-plan.md
git commit -m "docs(readiness): publish final gap-closure assessment and evidence"
```

---

## Execution Notes

- Recommended execution style for this plan: **non-subagent experimental path using `executing-plans` batches**, then compare outcomes to prior subagent-driven flow.
- Preserve Arbiter write power throughout this plan; do not change `arbiter` to read-only.
- If any gate fails repeatedly, stop and run `superpowers:systematic-debugging` before continuing.
