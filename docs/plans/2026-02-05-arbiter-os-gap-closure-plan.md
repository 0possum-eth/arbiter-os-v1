# Arbiter OS Gap Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close remaining gaps vs core arbiter build plan by adding a real plugin kernel, Arbiter OS skills pack, ledger-keeper enforcement, doc brick indexing/retrieval, and completing the role suite + workspace scaffold.

**Architecture:** Keep the single coordinator loop intact. Introduce a policy‑enforcing plugin kernel, formal skills for Arbiter OS behavior, and a ledger‑keeper phase that is the only writer of ledger events. Add doc brick indexing and retrieval as a bounded reference system. Round out the agent roles and workspace bootstrap scripts.

**Tech Stack:** TypeScript, Node.js, OpenCode plugins/skills, JSONL ledger, node:test.

---

### Task 1: Plugin kernel with tool/stop hooks

**Files:**
- Modify: `.opencode/plugins/arbiter-os.js`
- Create: `arbiter/policy/ledgerGuard.ts`
- Test: `tests/opencode/test-plugin-loading.sh`

**Step 1: Write the failing test**

Extend `tests/opencode/test-plugin-loading.sh` to assert `arbiter-os.js` exports a `tool.execute.before` hook and a `stop` hook.

**Step 2: Run test to verify it fails**

Run: `bash tests/opencode/test-plugin-loading.sh`

Expected: FAIL (hooks missing)

**Step 3: Implement minimal plugin hooks**

`arbiter/policy/ledgerGuard.ts`:

```ts
export const isLedgerPath = (path: string) =>
  path.includes("docs/arbiter/_ledger") ||
  path.endsWith("docs/arbiter/prd.json") ||
  path.endsWith("docs/arbiter/progress.txt");
```

Update `.opencode/plugins/arbiter-os.js` to export:

```js
import { isLedgerPath } from "../arbiter/policy/ledgerGuard";

export const ArbiterOsPlugin = async () => ({
  "experimental.chat.system.transform": async (_input, output) => {
    (output.system ||= []).push("You are running Arbiter OS. Use run-epic as the canonical entrypoint.");
  },
  "tool.execute.before": async (input) => {
    const target = input?.args?.path;
    if (typeof target === "string" && isLedgerPath(target)) {
      throw new Error("Ledger writes must go through Ledger Keeper");
    }
  },
  stop: async () => ({
    reason: "Arbiter OS stop hook enabled"
  })
});
```

**Step 4: Run test to verify it passes**

Run: `bash tests/opencode/test-plugin-loading.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/plugins/arbiter-os.js arbiter/policy/ledgerGuard.ts tests/opencode/test-plugin-loading.sh
git commit -m "feat(opencode): add plugin kernel hooks"
```

---

### Task 2: Arbiter OS skills pack

**Files:**
- Create: `.opencode/skills/using-arbiter-os/SKILL.md`
- Create: `.opencode/skills/arbiter-run-loop/SKILL.md`
- Create: `.opencode/skills/arbiter-ledger-rules/SKILL.md`
- Create: `.opencode/skills/arbiter-doc-ingest/SKILL.md`
- Create: `.opencode/skills/arbiter-trust-gating/SKILL.md`
- Create: `.opencode/skills/arbiter-ux-sim/SKILL.md`

**Step 1: Write the failing test**

Add a shell test `tests/opencode/test-arbiter-skills.sh` that asserts these files exist.

**Step 2: Run test to verify it fails**

Run: `bash tests/opencode/test-arbiter-skills.sh`

Expected: FAIL

**Step 3: Add minimal skills**

Each skill should contain: name, description, and 5–10 lines of guidance. Keep them concise and aligned to the core plan.

**Step 4: Run test to verify it passes**

Run: `bash tests/opencode/test-arbiter-skills.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/skills tests/opencode/test-arbiter-skills.sh
git commit -m "feat(opencode): add arbiter os skills pack"
```

---

### Task 3: Ledger Keeper execution phase

**Files:**
- Create: `arbiter/ledger/ledgerKeeper.ts`
- Modify: `arbiter/execute/executeEpic.ts`
- Modify: `arbiter/run/runEpicAutopilot.ts`
- Test: `arbiter/ledger/__tests__/ledgerKeeper.test.ts`

**Step 1: Write the failing test**

`arbiter/ledger/__tests__/ledgerKeeper.test.ts` should assert that ledger writes only happen via `ledgerKeeper()` when receipts are valid.

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/ledger/__tests__/ledgerKeeper.test.ts`

Expected: FAIL

**Step 3: Implement ledger keeper**

`arbiter/ledger/ledgerKeeper.ts` should:
- Accept taskId + epicId
- Verify receipts (executor + verifiers)
- Append task_done event
- Rebuild views

Modify `executeEpic()` to:
- Stop writing ledger events directly
- Instead return a new result type like `{ type: "PENDING_LEDGER", epicId, taskId }`

Modify `runEpicAutopilot()` to:
- When `PENDING_LEDGER`, call `ledgerKeeper()` and then continue

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/ledger/__tests__/ledgerKeeper.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/ledger arbiter/execute arbiter/run
git commit -m "feat(ledger): route task completion through ledger keeper"
```

---

### Task 4: Doc brick indexing + retrieval (Stage 0)

**Files:**
- Create: `arbiter/docs/indexBricks.ts`
- Create: `arbiter/docs/retrieveBricks.ts`
- Test: `arbiter/docs/__tests__/retrieveBricks.test.ts`

**Step 1: Write the failing test**

Test should:
- Write two small docs
- Index them
- Query retrieval returns the best match with source path

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/docs/__tests__/retrieveBricks.test.ts`

Expected: FAIL

**Step 3: Implement minimal indexing + retrieval**

`indexBricks()` should chunk by headings and write a JSONL index with path + heading + content.
`retrieveBricks(query)` should rank by simple term overlap and return top N.

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/docs/__tests__/retrieveBricks.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/docs
git commit -m "feat(docs): add stage-0 brick retrieval"
```

---

### Task 5: Complete agent suite

**Files:**
- Create: `.opencode/agents/electrician.md`
- Create: `.opencode/agents/ux-coordinator.md`
- Create: `.opencode/agents/librarian.md`
- Create: `.opencode/agents/oracle.md`
- Modify: `tests/opencode/test-agents.sh`

**Step 1: Write the failing test**

Extend `test-agents.sh` to assert these files exist.

**Step 2: Run test to verify it fails**

Run: `bash tests/opencode/test-agents.sh`

Expected: FAIL

**Step 3: Add minimal prompts**

Each file should be 2–4 lines: role purpose + one hard constraint.

**Step 4: Run test to verify it passes**

Run: `bash tests/opencode/test-agents.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/agents tests/opencode/test-agents.sh
git commit -m "feat(opencode): add remaining role prompts"
```

---

### Task 6: Workspace scaffold + bootstrap scripts

**Files:**
- Create: `docs/arbiter/.keep`
- Create: `docs/arbiter/reference/_inbox/.keep`
- Create: `docs/arbiter/_ledger/.keep`
- Create: `scripts/arbiter/arbiter-init-workspace.ts`
- Create: `scripts/arbiter/install-opencode.sh`

**Step 1: Write the failing test**

Add `tests/arbiter/test-workspace-init.sh` that runs `arbiter-init-workspace.ts` and asserts folders exist.

**Step 2: Run test to verify it fails**

Run: `bash tests/arbiter/test-workspace-init.sh`

Expected: FAIL

**Step 3: Implement bootstrap scripts**

`arbiter-init-workspace.ts` should create folder skeleton and empty ledger files.

**Step 4: Run test to verify it passes**

Run: `bash tests/arbiter/test-workspace-init.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add docs/arbiter scripts/arbiter tests/arbiter
git commit -m "feat(arbiter): add workspace bootstrap scripts"
```

---

**Plan complete and saved to `docs/plans/2026-02-05-arbiter-os-gap-closure-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
