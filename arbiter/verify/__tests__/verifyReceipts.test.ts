import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";

import { verifyReceipts } from "../verifyReceipts";

const digestForSummary = (summary: string) => createHash("sha256").update(summary, "utf8").digest("hex");

const executionRecord = (summary: string, command = "node --version") => ({
  command,
  exitCode: 0,
  outputSummary: summary,
  outputDigest: digestForSummary(summary)
});

const validTaskPackets = (taskId: string) => [
  {
    id: "REC-EXECUTOR-1",
    receipt: {
      type: "EXECUTOR_COMPLETED",
      taskId,
      packet: {
        taskId,
        execution: [
          executionRecord("v22.0.0")
        ],
        tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
        files_changed: ["arbiter/verify/verifyReceipts.ts"]
      }
    }
  },
  {
    id: "REC-SPEC-1",
    receipt: { type: "VERIFIER_SPEC", taskId, passed: true, packet: { taskId, passed: true } }
  },
  {
    id: "REC-QUALITY-1",
    receipt: { type: "VERIFIER_QUALITY", taskId, passed: true, packet: { taskId, passed: true } }
  }
];

test("verifyReceipts requires executor + verifiers", () => {
  const ok = verifyReceipts(validTaskPackets("TASK-1"), "TASK-1");

  assert.deepEqual(ok, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    execution: [executionRecord("v22.0.0")],
    tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts rejects tests-only evidence packets", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-TESTS-ONLY",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            tests: ["executed:node --version: v22.0.0"],
            files_changed: ["arbiter/verify/verifyReceipts.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-1",
        receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true, packet: { taskId: "TASK-1", passed: true } }
      },
      {
        id: "REC-QUALITY-1",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts rejects packets without structured execution records", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-NO-EXEC",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [],
            tests: ["executed:node --version: v22.0.0"],
            files_changed: ["arbiter/verify/verifyReceipts.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-1",
        receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true, packet: { taskId: "TASK-1", passed: true } }
      },
      {
        id: "REC-QUALITY-1",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts rejects forged execution records", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-FORGED-EXEC",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [
              {
                command: "node --version",
                exitCode: 0,
                outputSummary: "v22.0.0",
                outputDigest: "0".repeat(64)
              }
            ],
            files_changed: ["arbiter/verify/verifyReceipts.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-FORGED-EXEC",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-FORGED-EXEC",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts uses latest relevant receipts for task", () => {
  const ok = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-OLD",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [executionRecord("v21.9.0")],
            tests: ["arbiter/verify/__tests__/old.test.ts"],
            files_changed: ["old-file.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-OLD",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-OLD",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-EXECUTOR-OTHER",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-2",
          packet: {
            taskId: "TASK-2",
            execution: [executionRecord("v22.0.0", "node ./scripts/other.js")],
            tests: ["arbiter/verify/__tests__/other.test.ts"],
            files_changed: ["other.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-FAILED",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: false,
          packet: { taskId: "TASK-1", passed: false }
        }
      },
      {
        id: "REC-QUALITY-FAILED",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: false,
          packet: { taskId: "TASK-1", passed: false }
        }
      },
      {
        id: "REC-EXECUTOR-NEW",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [executionRecord("v22.0.0")],
            tests: ["arbiter/verify/__tests__/latest.test.ts"],
            files_changed: ["arbiter/verify/verifyReceipts.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-NEW",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-NEW",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.deepEqual(ok, {
    executor_receipt_id: "REC-EXECUTOR-NEW",
    verifier_receipt_ids: ["REC-SPEC-NEW", "REC-QUALITY-NEW"],
    execution: [executionRecord("v22.0.0")],
    tests: ["arbiter/verify/__tests__/latest.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts rejects missing executor packet", () => {
  const result = verifyReceipts(
    [
      { id: "REC-EXECUTOR-1", receipt: { type: "EXECUTOR_COMPLETED", taskId: "TASK-1" } },
      {
        id: "REC-SPEC-1",
        receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true, packet: { taskId: "TASK-1", passed: true } }
      },
      {
        id: "REC-QUALITY-1",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts skips invalid latest verifier packet and keeps valid packet", () => {
  const result = verifyReceipts(
    [
      ...validTaskPackets("TASK-1"),
      {
        id: "REC-SPEC-2",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-OTHER", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.deepEqual(result, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    execution: [executionRecord("v22.0.0")],
    tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts enforces integration and ux packets for task gates", () => {
  const withoutTaskGates = verifyReceipts(validTaskPackets("TASK-1"), "TASK-1", {
    requiresIntegrationCheck: true,
    uxSensitive: true
  });
  assert.equal(withoutTaskGates, null);

  const withTaskGates = verifyReceipts(
    [
      ...validTaskPackets("TASK-1"),
      {
        id: "REC-INTEGRATION-1",
        receipt: {
          type: "INTEGRATION_CHECKED",
          taskId: "TASK-1",
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-UX-1",
        receipt: {
          type: "UX_SIMULATED",
          taskId: "TASK-1",
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1",
    { requiresIntegrationCheck: true, uxSensitive: true }
  );

  assert.deepEqual(withTaskGates, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    integration_receipt_id: "REC-INTEGRATION-1",
    ux_receipt_id: "REC-UX-1",
    execution: [executionRecord("v22.0.0")],
    tests: ["arbiter/verify/__tests__/verifyReceipts.test.ts"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});

test("verifyReceipts requires verifier packets after latest executor receipt", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-OLD",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [executionRecord("v21.9.0")],
            tests: ["arbiter/verify/__tests__/old.test.ts"],
            files_changed: ["old.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-OLD",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-OLD",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-EXECUTOR-NEW",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [executionRecord("v22.0.0")],
            tests: ["arbiter/verify/__tests__/new.test.ts"],
            files_changed: ["new.ts"]
          }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts rejects forged verifier success for malformed executor evidence", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-FORGED",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            tests: ["simulated:TASK-1"],
            files_changed: ["arbiter/verify/specVerifier.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-FORGED",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      },
      {
        id: "REC-QUALITY-FORGED",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts rejects malformed verifier packet keys", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-1",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [executionRecord("v22.0.0")],
            tests: ["executed:node --version: v22.0.0"],
            files_changed: ["arbiter/verify/verifyReceipts.ts"]
          }
        }
      },
      {
        id: "REC-SPEC-MALFORMED",
        receipt: {
          type: "VERIFIER_SPEC",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true, forged: true }
        }
      },
      {
        id: "REC-QUALITY-1",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.equal(result, null);
});

test("verifyReceipts rejects malformed integration and ux packet keys", () => {
  const result = verifyReceipts(
    [
      ...validTaskPackets("TASK-1"),
      {
        id: "REC-INTEGRATION-BAD",
        receipt: {
          type: "INTEGRATION_CHECKED",
          taskId: "TASK-1",
          packet: { taskId: "TASK-1", passed: true, forged: true }
        }
      },
      {
        id: "REC-UX-BAD",
        receipt: {
          type: "UX_SIMULATED",
          taskId: "TASK-1",
          packet: { taskId: "TASK-1", passed: true, forged: true }
        }
      }
    ],
    "TASK-1",
    { requiresIntegrationCheck: true, uxSensitive: true }
  );

  assert.equal(result, null);
});

test("verifyReceipts emits normalized evidence only", () => {
  const result = verifyReceipts(
    [
      {
        id: "REC-EXECUTOR-1",
        receipt: {
          type: "EXECUTOR_COMPLETED",
          taskId: "TASK-1",
          packet: {
            taskId: "TASK-1",
            execution: [
              {
                command: " node --version ",
                exitCode: 0,
                outputSummary: "  v22.0.0  ",
                outputDigest: digestForSummary("v22.0.0")
              }
            ],
            tests: [" executed:node --version: v22.0.0 ", "simulated:TASK-1"],
            files_changed: [" arbiter/verify/verifyReceipts.ts ", "no-extension"]
          }
        }
      },
      {
        id: "REC-SPEC-1",
        receipt: { type: "VERIFIER_SPEC", taskId: "TASK-1", passed: true, packet: { taskId: "TASK-1", passed: true } }
      },
      {
        id: "REC-QUALITY-1",
        receipt: {
          type: "VERIFIER_QUALITY",
          taskId: "TASK-1",
          passed: true,
          packet: { taskId: "TASK-1", passed: true }
        }
      }
    ],
    "TASK-1"
  );

  assert.deepEqual(result, {
    executor_receipt_id: "REC-EXECUTOR-1",
    verifier_receipt_ids: ["REC-SPEC-1", "REC-QUALITY-1"],
    execution: [executionRecord("v22.0.0")],
    tests: ["executed:node --version: v22.0.0"],
    files_changed: ["arbiter/verify/verifyReceipts.ts"]
  });
});
