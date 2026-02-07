import assert from "node:assert/strict";
import { test } from "node:test";

import { executeInstallPlan } from "../installExecutor";

test("executeInstallPlan rejects execution without consent", async () => {
  await assert.rejects(
    executeInstallPlan(
      {
        actions: [{ id: "install-git", target: "git", command: "echo git" }]
      },
      {
        consentGranted: false,
        runner: async () => ({ exitCode: 0, stdout: "ok", stderr: "" })
      }
    ),
    /consent/i
  );
});

test("executeInstallPlan runs actions sequentially and returns receipt", async () => {
  const order: string[] = [];
  const result = await executeInstallPlan(
    {
      actions: [
        { id: "install-git", target: "git", command: "echo git" },
        { id: "install-node", target: "node", command: "echo node" }
      ]
    },
    {
      consentGranted: true,
      runner: async (command) => {
        order.push(command);
        return { exitCode: 0, stdout: "ok", stderr: "" };
      }
    }
  );

  assert.deepEqual(order, ["echo git", "echo node"]);
  assert.equal(result.receipt.type, "INSTALL_ATTEMPTED");
  assert.equal(result.receipt.results.length, 2);
  assert.equal(result.receipt.results.every((item) => item.succeeded), true);
});
