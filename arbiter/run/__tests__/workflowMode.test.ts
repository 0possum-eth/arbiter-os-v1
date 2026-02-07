import assert from "node:assert/strict";
import { test } from "node:test";

import {
  resolveWorkflowExecutionProfile,
  resolveWorkflowMode
} from "../workflowMode";

test("resolveWorkflowMode defaults to receipt_gated", () => {
  const original = process.env.ARBITER_WORKFLOW_MODE;
  delete process.env.ARBITER_WORKFLOW_MODE;

  try {
    assert.equal(resolveWorkflowMode(), "receipt_gated");
  } finally {
    if (original === undefined) {
      delete process.env.ARBITER_WORKFLOW_MODE;
    } else {
      process.env.ARBITER_WORKFLOW_MODE = original;
    }
  }
});

test("resolveWorkflowMode reads ARBITER_WORKFLOW_MODE", () => {
  const original = process.env.ARBITER_WORKFLOW_MODE;
  process.env.ARBITER_WORKFLOW_MODE = "single_agent";

  try {
    assert.equal(resolveWorkflowMode(), "single_agent");
  } finally {
    if (original === undefined) {
      delete process.env.ARBITER_WORKFLOW_MODE;
    } else {
      process.env.ARBITER_WORKFLOW_MODE = original;
    }
  }
});

test("resolveWorkflowMode falls back for invalid mode", () => {
  const original = process.env.ARBITER_WORKFLOW_MODE;
  process.env.ARBITER_WORKFLOW_MODE = "invalid";

  try {
    assert.equal(resolveWorkflowMode(), "receipt_gated");
  } finally {
    if (original === undefined) {
      delete process.env.ARBITER_WORKFLOW_MODE;
    } else {
      process.env.ARBITER_WORKFLOW_MODE = original;
    }
  }
});

test("explicit workflow mode overrides env", () => {
  const original = process.env.ARBITER_WORKFLOW_MODE;
  process.env.ARBITER_WORKFLOW_MODE = "single_agent";

  try {
    assert.equal(resolveWorkflowMode("batch_validation"), "batch_validation");
  } finally {
    if (original === undefined) {
      delete process.env.ARBITER_WORKFLOW_MODE;
    } else {
      process.env.ARBITER_WORKFLOW_MODE = original;
    }
  }
});

test("single_agent profile disables continuous mode and limits bundle size", () => {
  const profile = resolveWorkflowExecutionProfile("single_agent", { continuousEnv: true });

  assert.equal(profile.mode, "single_agent");
  assert.equal(profile.continuousMode, false);
  assert.equal(profile.maxBundleSize, 1);
});

test("batch_validation profile forces continuous mode", () => {
  const profile = resolveWorkflowExecutionProfile("batch_validation", { continuousEnv: false });

  assert.equal(profile.mode, "batch_validation");
  assert.equal(profile.continuousMode, true);
  assert.equal(profile.maxBundleSize, 2);
});
