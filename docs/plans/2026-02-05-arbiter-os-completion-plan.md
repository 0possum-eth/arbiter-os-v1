# Arbiter OS Completion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete Arbiter OS core gaps by adding ledger-first state, two-phase commit gating, Scout→Arbiter activation, plugin/runtime enforcement, role scaffolding, and doc ingestion/trust gating.

**Architecture:** Keep `runEpicAutopilot` as the sole coordinator. Add a ledger subsystem for append-only events and derived views, route Scout output into ledger/PRD activation, and gate task completion through verifier receipts before ledger commit. Introduce a plugin bootstrap for runtime policy and add minimal role/agent definitions and doc ingestion/trust gating.

**Tech Stack:** Node.js (ESM), TypeScript, node:test, JSONL ledger, OpenCode plugins/skills.

---

### Task 1: Add minimal TypeScript test runtime

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`

**Step 1: Write the failing test**

Create `package.json` with a `test` script that runs `node --test` via `tsx`:

```json
{
  "name": "arbiter-os",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "tsx --test \"arbiter/**/*.test.ts\""
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.7.2"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["arbiter/**/*.ts"]
}
```

**Step 2: Run test to verify it fails**

Run: `npm test`

Expected: FAIL (missing devDependencies until install)

**Step 3: Install deps**

Run: `npm install`

**Step 4: Run tests to verify they pass**

Run: `npm test`

Expected: PASS or actionable failures from existing tests

**Step 5: Commit**

```bash
git add package.json tsconfig.json
git commit -m "chore(test): add tsx test runner"
```

---

### Task 2: Introduce ledger event schema and append-only writer

**Files:**
- Create: `arbiter/ledger/events.ts`
- Create: `arbiter/ledger/appendEvent.ts`
- Test: `arbiter/ledger/__tests__/appendEvent.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { appendEvent } from "../appendEvent";

test("appendEvent writes JSONL events", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-ledger-"));
  const ledgerPath = path.join(tempDir, "prd.events.jsonl");

  await appendEvent(ledgerPath, {
    ts: "2026-02-05T00:00:00Z",
    op: "task_upsert",
    id: "TASK-1",
    data: { title: "Test" }
  });

  const content = await fs.promises.readFile(ledgerPath, "utf8");
  const lines = content.trim().split("\n");
  assert.equal(lines.length, 1);
  const event = JSON.parse(lines[0]);
  assert.equal(event.op, "task_upsert");
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/ledger/__tests__/appendEvent.test.ts`

Expected: FAIL (appendEvent not implemented)

**Step 3: Write minimal implementation**

`arbiter/ledger/events.ts`:

```ts
export type LedgerEvent = {
  ts: string;
  op: "task_upsert" | "task_done" | "epic_selected";
  id: string;
  data?: Record<string, unknown>;
};
```

`arbiter/ledger/appendEvent.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

import type { LedgerEvent } from "./events";

export async function appendEvent(ledgerPath: string, event: LedgerEvent) {
  const dir = path.dirname(ledgerPath);
  await fs.promises.mkdir(dir, { recursive: true });
  const line = `${JSON.stringify(event)}\n`;
  await fs.promises.appendFile(ledgerPath, line, "utf8");
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/ledger/__tests__/appendEvent.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/ledger
git commit -m "feat(ledger): add append-only event writer"
```

---

### Task 3: Build derived views from ledger (prd.json + progress)

**Files:**
- Create: `arbiter/ledger/buildViews.ts`
- Test: `arbiter/ledger/__tests__/buildViews.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { buildViews } from "../buildViews";

test("buildViews regenerates prd.json from events", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-views-"));
  const ledgerPath = path.join(tempDir, "_ledger", "prd.events.jsonl");
  await fs.promises.mkdir(path.dirname(ledgerPath), { recursive: true });
  await fs.promises.writeFile(
    ledgerPath,
    [
      JSON.stringify({ ts: "t", op: "task_upsert", id: "TASK-1", data: { epicId: "EPIC-1" } }),
      JSON.stringify({ ts: "t", op: "task_done", id: "TASK-1", data: { epicId: "EPIC-1" } })
    ].join("\n") + "\n",
    "utf8"
  );

  const viewsDir = path.join(tempDir, "views");
  await buildViews(ledgerPath, viewsDir);

  const prd = JSON.parse(await fs.promises.readFile(path.join(viewsDir, "prd.json"), "utf8"));
  assert.equal(prd.epics[0].tasks[0].done, true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/ledger/__tests__/buildViews.test.ts`

Expected: FAIL (buildViews not implemented)

**Step 3: Write minimal implementation**

`arbiter/ledger/buildViews.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

import type { LedgerEvent } from "./events";

type Epic = { id: string; tasks: Array<{ id: string; done: boolean }> };

export async function buildViews(ledgerPath: string, outDir: string) {
  const content = await fs.promises.readFile(ledgerPath, "utf8");
  const events = content
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as LedgerEvent);

  const epicMap = new Map<string, Epic>();

  for (const event of events) {
    const epicId = (event.data?.epicId as string) || "unknown";
    if (!epicMap.has(epicId)) {
      epicMap.set(epicId, { id: epicId, tasks: [] });
    }
    const epic = epicMap.get(epicId)!;
    if (event.op === "task_upsert") {
      if (!epic.tasks.find((task) => task.id === event.id)) {
        epic.tasks.push({ id: event.id, done: false });
      }
    }
    if (event.op === "task_done") {
      const task = epic.tasks.find((t) => t.id === event.id);
      if (task) task.done = true;
    }
  }

  await fs.promises.mkdir(outDir, { recursive: true });
  const prd = { epics: Array.from(epicMap.values()) };
  await fs.promises.writeFile(path.join(outDir, "prd.json"), `${JSON.stringify(prd, null, 2)}\n`, "utf8");
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/ledger/__tests__/buildViews.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/ledger
git commit -m "feat(ledger): add derived view builder"
```

---

### Task 4: Switch inspectState and executeEpic to ledger-first state

**Files:**
- Modify: `arbiter/state/inspectState.ts`
- Modify: `arbiter/execute/executeEpic.ts`
- Test: `arbiter/state/__tests__/inspectState.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { inspectState } from "../inspectState";

test("inspectState reads active epic from derived prd.json", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-inspect-"));
  const prdPath = path.join(tempDir, "docs", "arbiter", "prd.json");
  await fs.promises.mkdir(path.dirname(prdPath), { recursive: true });
  await fs.promises.writeFile(prdPath, JSON.stringify({ activeEpicId: "EPIC-1", epics: [] }), "utf8");
  const original = process.cwd();
  process.chdir(tempDir);
  try {
    const state = await inspectState();
    assert.equal(state.status, "ACTIVE_EPIC");
  } finally {
    process.chdir(original);
  }
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/state/__tests__/inspectState.test.ts`

Expected: FAIL if inspectState is updated before test is ready

**Step 3: Implement ledger-first updates**

- Update `inspectState` to read derived `docs/arbiter/prd.json` (generated from ledger), not mutate it.
- Update `executeEpic` to append ledger events instead of writing `prd.json` directly:

```ts
// after TASK_COMPLETED
await appendEvent(ledgerPath, {
  ts: new Date().toISOString(),
  op: "task_done",
  id: nextTask.id,
  data: { epicId: prdState.activeEpicId }
});
await buildViews(ledgerPath, path.join(rootDir, "docs", "arbiter"));
```

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/state/__tests__/inspectState.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/state arbiter/execute
git commit -m "feat(state): read derived views and write ledger events"
```

---

### Task 5: Implement Scout → Arbiter → PRD activation

**Files:**
- Modify: `arbiter/phases/scout.ts`
- Modify: `arbiter/decisions/arbiterDecision.ts`
- Create: `arbiter/state/activateEpic.ts`
- Test: `arbiter/state/__tests__/activateEpic.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { activateEpic } from "../activateEpic";

test("activateEpic writes activeEpicId and tasks via ledger", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-activate-"));
  const ledgerPath = path.join(tempDir, "docs", "arbiter", "_ledger", "prd.events.jsonl");
  const epic = { id: "EPIC-1", tasks: [{ id: "TASK-1" }] };
  await activateEpic(ledgerPath, epic);
  const content = await fs.promises.readFile(ledgerPath, "utf8");
  assert.ok(content.includes("task_upsert"));
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/state/__tests__/activateEpic.test.ts`

Expected: FAIL

**Step 3: Implement activation**

`arbiter/state/activateEpic.ts`:

```ts
import { appendEvent } from "../ledger/appendEvent";
import { buildViews } from "../ledger/buildViews";

export async function activateEpic(ledgerPath: string, epic: { id: string; tasks: Array<{ id: string }> }) {
  for (const task of epic.tasks) {
    await appendEvent(ledgerPath, {
      ts: new Date().toISOString(),
      op: "task_upsert",
      id: task.id,
      data: { epicId: epic.id }
    });
  }
  await buildViews(ledgerPath, ledgerPath.replace(/_ledger\/prd.events.jsonl$/, ""));
}
```

Update `runScout()` to return a valid Scout envelope with one candidate epic (temporary fixture) and update `arbiterDecision()` to call `activateEpic()` on SELECT_EPIC.

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/state/__tests__/activateEpic.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/state arbiter/phases arbiter/decisions
git commit -m "feat(arbiter): activate epic from scout output"
```

---

### Task 6: Add two-phase commit gating (minimal)

**Files:**
- Create: `arbiter/verify/verifyReceipts.ts`
- Modify: `arbiter/execute/executeEpic.ts`
- Test: `arbiter/verify/__tests__/verifyReceipts.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import { test } from "node:test";

import { verifyReceipts } from "../verifyReceipts";

test("verifyReceipts requires executor + verifiers", () => {
  const ok = verifyReceipts([
    { type: "EXECUTOR_COMPLETED", taskId: "TASK-1" },
    { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true },
    { type: "VERIFIER_QUALITY", taskId: "TASK-1", passed: true }
  ]);
  assert.equal(ok, true);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/verify/__tests__/verifyReceipts.test.ts`

Expected: FAIL

**Step 3: Implement minimal verifier**

`arbiter/verify/verifyReceipts.ts`:

```ts
type Receipt = { type: string; taskId: string; passed?: boolean };

export function verifyReceipts(receipts: Receipt[]) {
  const exec = receipts.find((r) => r.type === "EXECUTOR_COMPLETED");
  const spec = receipts.find((r) => r.type === "VERIFIER_SPEC" && r.passed);
  const qual = receipts.find((r) => r.type === "VERIFIER_QUALITY" && r.passed);
  return !!exec && !!spec && !!qual;
}
```

Update `executeEpic()` to require verifier receipts (from receipts.jsonl) before marking task done.

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/verify/__tests__/verifyReceipts.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/verify arbiter/execute
git commit -m "feat(verify): add minimal two-phase commit gating"
```

---

### Task 7: Add OpenCode plugin bootstrap and ledger guard (minimal)

**Files:**
- Create: `.opencode/plugins/arbiter-os.js`

**Step 1: Write the failing test**

Create a smoke test in `tests/opencode/test-plugin-loading.sh` to assert the plugin loads (follow existing patterns in `tests/opencode`).

**Step 2: Run test to verify it fails**

Run: `bash tests/opencode/test-plugin-loading.sh`

Expected: FAIL before plugin exists

**Step 3: Implement plugin**

`.opencode/plugins/arbiter-os.js`:

```js
export const ArbiterOsPlugin = async () => ({
  "experimental.chat.system.transform": async (_input, output) => {
    (output.system ||= []).push("You are running Arbiter OS. Use run-epic as the canonical entrypoint.");
  }
});
```

**Step 4: Run test to verify it passes**

Run: `bash tests/opencode/test-plugin-loading.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/plugins/arbiter-os.js tests/opencode/test-plugin-loading.sh
git commit -m "feat(opencode): add Arbiter OS plugin bootstrap"
```

---

### Task 8: Add role prompt scaffolds (minimal)

**Files:**
- Create: `.opencode/agents/arbiter.md`
- Create: `.opencode/agents/scout.md`
- Create: `.opencode/agents/executor.md`
- Create: `.opencode/agents/verifier-spec.md`
- Create: `.opencode/agents/verifier-quality.md`
- Create: `.opencode/agents/ledger-keeper.md`

**Step 1: Write the failing test**

Add a simple list test in `tests/opencode/test-agents.sh` that ensures these files exist.

**Step 2: Run test to verify it fails**

Run: `bash tests/opencode/test-agents.sh`

Expected: FAIL

**Step 3: Create minimal prompts**

Each file should contain a one-paragraph role description and the single “never do X” constraint.

**Step 4: Run test to verify it passes**

Run: `bash tests/opencode/test-agents.sh`

Expected: PASS

**Step 5: Commit**

```bash
git add .opencode/agents tests/opencode/test-agents.sh
git commit -m "feat(opencode): add minimal role agent scaffolds"
```

---

### Task 9: Add doc ingestion + trust gating (minimal)

**Files:**
- Create: `arbiter/docs/ingestDoc.ts`
- Create: `arbiter/docs/trustRegistry.ts`
- Test: `arbiter/docs/__tests__/ingestDoc.test.ts`

**Step 1: Write the failing test**

```ts
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { ingestDoc } from "../ingestDoc";

test("ingestDoc copies into reference inbox and marks untrusted", async () => {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), "arbiter-doc-"));
  const src = path.join(tempDir, "source.md");
  await fs.promises.writeFile(src, "hello", "utf8");
  const result = await ingestDoc(src, tempDir);
  assert.ok(result.destPath.includes("reference/_inbox"));
  assert.equal(result.trusted, false);
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- arbiter/docs/__tests__/ingestDoc.test.ts`

Expected: FAIL

**Step 3: Implement minimal ingestion**

`arbiter/docs/ingestDoc.ts`:

```ts
import fs from "node:fs";
import path from "node:path";

export async function ingestDoc(srcPath: string, rootDir: string) {
  const inbox = path.join(rootDir, "docs", "arbiter", "reference", "_inbox");
  await fs.promises.mkdir(inbox, { recursive: true });
  const destPath = path.join(inbox, path.basename(srcPath));
  await fs.promises.copyFile(srcPath, destPath);
  return { destPath, trusted: false };
}
```

`arbiter/docs/trustRegistry.ts`:

```ts
export type TrustEntry = { path: string; trusted: boolean };
```

**Step 4: Run test to verify it passes**

Run: `npm test -- arbiter/docs/__tests__/ingestDoc.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add arbiter/docs
git commit -m "feat(docs): add minimal doc ingestion and trust stub"
```

---

**Plan complete and saved to `docs/plans/2026-02-05-arbiter-os-completion-plan.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
