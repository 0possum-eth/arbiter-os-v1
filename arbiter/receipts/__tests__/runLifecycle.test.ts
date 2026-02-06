import assert from "node:assert/strict";
import { test } from "node:test";

const loadRunContext = async () =>
  import(`../runContext.ts?cacheBust=${Date.now()}-${Math.random().toString(16).slice(2)}`);

const loadRunLifecycle = async () =>
  import(`../runLifecycle.ts?cacheBust=${Date.now()}-${Math.random().toString(16).slice(2)}`);

test("getRunId never falls back to unknown", async () => {
  const originalRunId = process.env.ARBITER_RUN_ID;
  delete process.env.ARBITER_RUN_ID;

  try {
    const { getRunId } = await loadRunContext();
    const runId = getRunId();
    assert.notEqual(runId, "unknown");
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});

test("getRunId is deterministic when env run id is absent", async () => {
  const originalRunId = process.env.ARBITER_RUN_ID;
  delete process.env.ARBITER_RUN_ID;

  try {
    const { getRunId } = await loadRunContext();
    const first = getRunId();
    const second = getRunId();

    assert.equal(first, `run-${process.pid}`);
    assert.equal(second, first);
    assert.match(first, /^run-\d+$/);
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});

test("run lifecycle helpers keep one stable run id", async () => {
  const originalRunId = process.env.ARBITER_RUN_ID;
  delete process.env.ARBITER_RUN_ID;

  try {
    const { markRunStarted, markRunCompleted } = await loadRunLifecycle();
    const started = markRunStarted();
    const completed = markRunCompleted();

    assert.equal(started.runId, `run-${process.pid}`);
    assert.equal(completed.runId, started.runId);
    assert.equal(completed.startedAt, started.startedAt);
    assert.ok(typeof completed.completedAt === "string");
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});

test("run lifecycle runId does not change after env mutation", async () => {
  const originalRunId = process.env.ARBITER_RUN_ID;
  process.env.ARBITER_RUN_ID = "RUN-INITIAL";

  try {
    const { getLifecycleRunId } = await loadRunLifecycle();
    const first = getLifecycleRunId();
    process.env.ARBITER_RUN_ID = "RUN-MUTATED";
    const second = getLifecycleRunId();

    assert.equal(first, "RUN-INITIAL");
    assert.equal(second, first);
  } finally {
    if (originalRunId === undefined) {
      delete process.env.ARBITER_RUN_ID;
    } else {
      process.env.ARBITER_RUN_ID = originalRunId;
    }
  }
});
