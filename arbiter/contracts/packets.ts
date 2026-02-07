import { createHash } from "node:crypto";

export type ExecutionRecord = {
  command: string;
  exitCode: number;
  outputSummary: string;
  outputDigest: string;
};

export const MAX_EXECUTION_OUTPUT_SUMMARY_CHARS = 200;
export const EXECUTION_DIGEST_PATTERN = /^[a-f0-9]{64}$/;

export const computeExecutionDigest = (outputSummary: string) =>
  createHash("sha256").update(outputSummary.trim(), "utf8").digest("hex");

export type TaskCompletionPacket = {
  taskId: string;
  execution: ExecutionRecord[];
  tests?: string[];
  files_changed?: string[];
};

export type VerificationPacket = {
  taskId: string;
  passed: boolean;
};

export type IntegrationPacket = {
  taskId: string;
  passed: boolean;
};

export type UxPacket = {
  taskId: string;
  passed: boolean;
};
