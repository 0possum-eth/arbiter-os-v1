# Arbiter OS Next-Phase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining alignment gaps with the core arbiter build plan: role-aware plugin enforcement, run-scoped receipts/runs ledger, trust gating commands, librarian context packs, real brainstorm/scout outputs, and Electrician/UX loop steps.

**Architecture:** Extend the existing coordinator without adding new entrypoints. Enforce ledger writes and stop behavior via plugin hooks. Add a run-scoped receipts layout and a runs.jsonl ledger. Provide trust-gating commands and a librarian context pack builder that uses stage‑0 retrieval. Replace placeholder brainstorm/scout with real artifacts and PRD extraction. Wire Electrician and UX steps into the run loop with receipts.

**Tech Stack:** TypeScript, Node.js, OpenCode plugins/skills, JSONL ledger, node:test, shell tests.

---

### Task 1: Role-aware plugin enforcement + stop/compaction hooks

**Files:**
- Modify: `.opencode/plugins/arbiter-os.js`
- Create: `arbiter/policy/roleContext.ts`
- Modify: `tests/opencode/test-plugin-loading.sh`

**Step 1: Write the failing test**

Extend `tests/opencode/test-plugin-loading.sh` to assert:
- `tool.execute.before` exists
- `stop` exists
- `experimental.session.compacting` exists

**Step 2: Run test to verify it fails**

Run: `bash tests/opencode/test-plugin-loading.sh`

Expected: FAIL (new hooks missing)

**Step 3: Implement minimal role context + hooks**

`arbiter/policy/roleContext.ts`:

```ts
export const getRoleFromEnv = () => process.env.ARBITER_ROLE || "unknown";
```

Update `.opencode/plugins/arbiter-os.js` to:
- use `ARBITER_ROLE` for ledger guard enforcement
- allow Ledger Keeper to write ledger paths
- add `experimental.session.compacting` hook that injects a one-line Arbiter state summary
- in `stop`, block if current epic incomplete (read `docs/arbiter/prd.json`)

**Step 4: Run test to verify it passes**

Run: `bash tests/opencode/test-plugin-loading.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/plugins/arbiter-os.js arbiter/policy/roleContext.ts tests/opencode/test-plugin-loading.sh
git commit -m "feat(opencode): add role-aware plugin enforcement"
```

---

### Task 2: Run-scoped receipts + runs ledger

**Files:**
- Modify: `arbiter/receipts/emitReceipt.ts`
- Create: `arbiter/receipts/runContext.ts`
- Create: `arbiter/ledger/runs.ts`
- Test: `arbiter/receipts/__tests__/emitReceipt.test.ts`

**Step 1: Write the failing test**

`emitReceipt` should write to `docs/arbiter/_ledger/runs/<runId>/receipts.jsonl` and append to `docs/arbiter/_ledger/runs.jsonl`.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/receipts/__tests__/emitReceipt.test.ts`

Expected: FAIL

**Step 3: Implement run-scoped receipts**

- `runContext.ts` reads `ARBITER_RUN_ID` and defaults to `unknown`
- `emitReceipt` writes to per-run receipts path
- `runs.ts` appends run start/update events to `runs.jsonl`

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/receipts/__tests__/emitReceipt.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/receipts arbiter/ledger
git commit -m "feat(ledger): add run-scoped receipts"
```

---

### Task 3: Trust gating commands + enforcement stub

**Files:**
- Create: `arbiter/trust/registry.ts`
- Create: `arbiter/trust/commands.ts`
- Modify: `.opencode/skills/arbiter-trust-gating/SKILL.md`
- Test: `arbiter/trust/__tests__/registry.test.ts`

**Step 1: Write the failing test**

Test that approving a doc path marks it trusted in a JSON registry.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/trust/__tests__/registry.test.ts`

Expected: FAIL

**Step 3: Implement minimal trust registry + commands**

- `registry.ts` reads/writes `docs/arbiter/_ledger/trust.json`
- `commands.ts` exposes `approveDoc(path)` and `isTrusted(path)`
- Update skill to document the command usage

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/trust/__tests__/registry.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/trust .opencode/skills/arbiter-trust-gating/SKILL.md
git commit -m "feat(trust): add approval registry and commands"
```

---

### Task 4: Librarian context pack builder

**Files:**
- Create: `arbiter/librarian/contextPack.ts`
- Test: `arbiter/librarian/__tests__/contextPack.test.ts`

**Step 1: Write the failing test**

Test that `contextPack(query)` returns top 2 bricks with source paths and headings.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/librarian/__tests__/contextPack.test.ts`

Expected: FAIL

**Step 3: Implement minimal context pack**

Use `retrieveBricks` to assemble a markdown pack with citations:

```
## Context Pack
- [source/path.md#Heading] excerpt
```

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/librarian/__tests__/contextPack.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/librarian
git commit -m "feat(librarian): add context pack builder"
```

---

### Task 5: Replace placeholder brainstorm/scout outputs

**Files:**
- Modify: `arbiter/phases/brainstorm.ts`
- Modify: `arbiter/phases/scout.ts`
- Test: `arbiter/phases/__tests__/brainstorm.test.ts`

**Step 1: Write the failing test**

Brainstorm should write `docs/arbiter/brainstorm.md` and return its path.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/phases/__tests__/brainstorm.test.ts`

Expected: FAIL

**Step 3: Implement**

- `runBrainstorm()` writes a bounded brainstorm file
- `runScout()` reads brainstorm file, emits a Scout envelope with epic + tasks derived from bullet list

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/phases/__tests__/brainstorm.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/phases
git commit -m "feat(arbiter): add brainstorm + scout output"
```

---

### Task 6: Electrician + UX coordinator loop steps

**Files:**
- Create: `arbiter/phases/electrician.ts`
- Create: `arbiter/phases/uxCoordinator.ts`
- Modify: `arbiter/run/runEpicAutopilot.ts`
- Test: `arbiter/run/__tests__/runEpicAutopilot.test.ts`

**Step 1: Write the failing test**

Extend run loop tests to assert `electrician` and `uxCoordinator` receipts are emitted before `RUN_FINALIZED`.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/run/__tests__/runEpicAutopilot.test.ts`

Expected: FAIL

**Step 3: Implement**

- `electrician.ts` and `uxCoordinator.ts` emit placeholder receipts (`INTEGRATION_CHECKED`, `UX_SIMULATED`).
- `runEpicAutopilot` invokes them after `EPIC_COMPLETE` but before `RUN_FINALIZED`.

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/run/__tests__/runEpicAutopilot.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/phases arbiter/run
git commit -m "feat(arbiter): add electrician and ux loop steps"
```

---

**Plan complete and saved to `docs/plans/2026-02-05-arbiter-os-nextphase-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
