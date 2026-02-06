# Arbiter OS Remaining Gaps Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the last alignment gaps with the core arbiter build plan: ledger snapshots + progress view, evidence-bound task_done events, trust gating commands + enforcement, context pack integration, real Scout PRD extraction, and a minimal bundle strategy.

**Architecture:** Extend existing ledger/view pipeline and run loop without adding new entrypoints. Ledger Keeper becomes evidence-aware and writes snapshots. Trust gating is enforced via plugin and explicit commands. Librarian context packs are mounted into task packets. Scout reads PRD metadata from reference docs rather than brainstorm placeholders. Add a minimal bundle strategy to allow single-run multi-task execution when tasks touch distinct files.

**Tech Stack:** TypeScript, Node.js, JSONL ledger, OpenCode plugins/skills, node:test.

---

### Task 1: Ledger snapshots + progress view

**Files:**
- Modify: `arbiter/ledger/buildViews.ts`
- Create: `arbiter/ledger/progressView.ts`
- Create: `arbiter/ledger/__tests__/progressView.test.ts`

**Step 1: Write the failing test**

Test that `buildViews` now writes:
- `docs/arbiter/progress.txt`
- `docs/arbiter/build-log/prd.snapshots.log`
- `docs/arbiter/build-log/progress.snapshots.log`

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/ledger/__tests__/progressView.test.ts`

Expected: FAIL

**Step 3: Implement progress view + snapshots**

- Add `progressView.ts` to generate a simple checklist grouped by epic.
- Update `buildViews.ts` to:
  - write snapshot entries before overwriting `prd.json` and `progress.txt`
  - call `progressView` to write `docs/arbiter/progress.txt`

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/ledger/__tests__/progressView.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/ledger
git commit -m "feat(ledger): add progress view and snapshots"
```

---

### Task 2: Evidence-bound task_done events

**Files:**
- Modify: `arbiter/ledger/ledgerKeeper.ts`
- Modify: `arbiter/verify/verifyReceipts.ts`
- Test: `arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 1: Write the failing test**

Extend ledgerKeeper test to assert `task_done` events include an `evidence` field with verifier receipt IDs.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/ledger/__tests__/ledgerKeeper.test.ts`

Expected: FAIL

**Step 3: Implement evidence binding**

- Update `verifyReceipts` to return evidence IDs (verifier receipts) rather than a boolean.
- Update `ledgerKeeper` to embed evidence in `task_done` events.

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/ledger/__tests__/ledgerKeeper.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/ledger arbiter/verify
git commit -m "feat(ledger): bind evidence to task completion"
```

---

### Task 3: Trust gating commands + enforcement

**Files:**
- Create: `arbiter/trust/cli.ts`
- Modify: `.opencode/plugins/arbiter-os.js`
- Test: `arbiter/trust/__tests__/cli.test.ts`

**Step 1: Write the failing test**

Test that `approve-brick`, `mount-doc`, and `list-bricks` commands modify trust registry and return expected output.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/trust/__tests__/cli.test.ts`

Expected: FAIL

**Step 3: Implement minimal CLI functions**

- `approveBrick(path)` → marks trusted
- `mountDoc(path)` → returns context pack path if trusted, otherwise error
- `listBricks()` → returns list from index
- Plugin hook blocks `runTask` when untrusted docs are mounted

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/trust/__tests__/cli.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/trust .opencode/plugins/arbiter-os.js
git commit -m "feat(trust): add gating commands and enforcement"
```

---

### Task 4: Context packs wired into execution

**Files:**
- Create: `arbiter/execute/taskPacket.ts`
- Modify: `arbiter/execute/taskRunner.ts`
- Test: `arbiter/execute/__tests__/taskPacket.test.ts`

**Step 1: Write the failing test**

Test that `buildTaskPacket` includes:
- task ID
- context pack (from librarian)
- citations list

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/execute/__tests__/taskPacket.test.ts`

Expected: FAIL

**Step 3: Implement task packets**

- `taskPacket.ts` builds a packet using `contextPack(query)`
- `taskRunner` uses packet (stubbed) to decide execution

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/execute/__tests__/taskPacket.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/execute arbiter/librarian
git commit -m "feat(execute): add context-aware task packets"
```

---

### Task 5: Scout PRD extraction from reference docs

**Files:**
- Create: `arbiter/scout/extractPrd.ts`
- Modify: `arbiter/phases/scout.ts`
- Test: `arbiter/scout/__tests__/extractPrd.test.ts`

**Step 1: Write the failing test**

Given a PRD metadata JSON in `docs/arbiter/reference/phase-01/PRD_metadata.json`, ensure `extractPrd` returns epic + tasks.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/scout/__tests__/extractPrd.test.ts`

Expected: FAIL

**Step 3: Implement PRD extraction**

- Parse `PRD_metadata.json`
- Map tasks into Scout envelope fields
- `runScout` prefers PRD extraction, falls back to brainstorm

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/scout/__tests__/extractPrd.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/scout arbiter/phases/scout.ts
git commit -m "feat(scout): extract epics from PRD metadata"
```

---

### Task 6: Minimal bundle strategy

**Files:**
- Create: `arbiter/execute/bundleStrategy.ts`
- Modify: `arbiter/run/runEpicAutopilot.ts`
- Test: `arbiter/execute/__tests__/bundleStrategy.test.ts`

**Step 1: Write the failing test**

Test that non-overlapping tasks are bundled (max 2 per run).

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/execute/__tests__/bundleStrategy.test.ts`

Expected: FAIL

**Step 3: Implement bundle strategy**

- Add a simple strategy: bundle tasks if their `artifactsToTouch` do not overlap.
- Update `runEpicAutopilot` to request a bundle of up to 2 tasks per run when safe.

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/execute/__tests__/bundleStrategy.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/execute arbiter/run
git commit -m "feat(arbiter): add minimal bundle strategy"
```

---

**Plan complete and saved to `docs/plans/2026-02-05-arbiter-os-gap3-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
