import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyIntakeState } from "../state";

test("classifyIntakeState returns ENV_NOT_READY when runtime is missing", () => {
  const state = classifyIntakeState({
    envReady: false,
    workspaceInitialized: true,
    hasRequirements: true,
    hasPlan: true,
    hasActiveEpic: true
  });

  assert.equal(state, "ENV_NOT_READY");
});

test("classifyIntakeState returns WORKSPACE_NOT_INITIALIZED when workspace is missing", () => {
  const state = classifyIntakeState({
    envReady: true,
    workspaceInitialized: false,
    hasRequirements: true,
    hasPlan: true,
    hasActiveEpic: false
  });

  assert.equal(state, "WORKSPACE_NOT_INITIALIZED");
});

test("classifyIntakeState returns PLAN_READY when plan exists without active epic", () => {
  const state = classifyIntakeState({
    envReady: true,
    workspaceInitialized: true,
    hasRequirements: true,
    hasPlan: true,
    hasActiveEpic: false
  });

  assert.equal(state, "PLAN_READY");
});

test("classifyIntakeState returns REQUIREMENTS_MISSING when no requirements signal exists", () => {
  const state = classifyIntakeState({
    envReady: true,
    workspaceInitialized: true,
    hasRequirements: false,
    hasPlan: false,
    hasActiveEpic: false
  });

  assert.equal(state, "REQUIREMENTS_MISSING");
});

test("classifyIntakeState returns EXECUTION_READY when active epic already exists", () => {
  const state = classifyIntakeState({
    envReady: true,
    workspaceInitialized: true,
    hasRequirements: false,
    hasPlan: false,
    hasActiveEpic: true
  });

  assert.equal(state, "EXECUTION_READY");
});
