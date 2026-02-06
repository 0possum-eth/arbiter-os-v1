import { spawn } from "node:child_process";
import path from "node:path";

import type { StrategyCommand } from "./taskPacket";

type CommandRunResult = {
  commandLine: string;
  output: string;
};

const renderCommand = (command: StrategyCommand) =>
  [command.command, ...(command.args ?? [])].join(" ").trim();

const truncate = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const ALLOWED_COMMANDS = new Set([process.execPath]);

const DISALLOWED_NODE_FLAGS = new Set(["-e", "--eval", "-p", "--print"]);

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_OUTPUT_BYTES = 4_096;

const resolveTimeoutMs = () => {
  const raw = process.env.ARBITER_STRATEGY_TIMEOUT_MS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS;
};

const isSafeScriptPath = (value: string) => {
  if (!value || value.trim().length === 0) {
    return false;
  }
  if (value.startsWith("-")) {
    return false;
  }
  const normalized = value.replace(/\\/g, "/").toLowerCase();
  return normalized.endsWith(".js") || normalized.endsWith(".mjs") || normalized.endsWith(".cjs");
};

const isWithinWorkspace = (value: string) => {
  const root = path.resolve(process.cwd());
  const candidate = path.resolve(value);
  const relative = path.relative(root, candidate);
  return relative.length > 0 && !relative.startsWith("..") && !path.isAbsolute(relative);
};

const validateCommand = (command: StrategyCommand) => {
  if (!ALLOWED_COMMANDS.has(command.command)) {
    throw new Error(`Unsupported strategy command: ${command.command}`);
  }
  const args = command.args ?? [];
  for (const arg of args) {
    if (DISALLOWED_NODE_FLAGS.has(arg)) {
      throw new Error(`Disallowed node strategy flag: ${arg}`);
    }
  }

  if (args.length === 0) {
    return;
  }

  if (args.length === 1 && args[0] === "--version") {
    return;
  }

  if (!isSafeScriptPath(args[0])) {
    throw new Error(`Unsupported node strategy args: ${args.join(" ")}`);
  }
  if (!isWithinWorkspace(args[0])) {
    throw new Error(`Strategy script must be within workspace: ${args[0]}`);
  }
};

const appendBounded = (current: string, chunk: Buffer | string, maxBytes: number) => {
  const nextChunk = chunk.toString();
  const usedBytes = Buffer.byteLength(current, "utf8");
  if (usedBytes >= maxBytes) {
    return current;
  }
  const room = maxBytes - usedBytes;

  let endIndex = 0;
  let consumed = 0;
  while (endIndex < nextChunk.length) {
    const char = nextChunk[endIndex];
    const nextBytes = Buffer.byteLength(char, "utf8");
    if (consumed + nextBytes > room) {
      break;
    }
    consumed += nextBytes;
    endIndex += 1;
  }

  return current + nextChunk.slice(0, endIndex);
};

const runCommand = (command: StrategyCommand): Promise<CommandRunResult> =>
  new Promise((resolve, reject) => {
    validateCommand(command);
    const commandLine = renderCommand(command);
    const child = spawn(command.command, command.args ?? [], {
      stdio: ["ignore", "pipe", "pipe"]
    });

    const timeoutMs = resolveTimeoutMs();
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Command timed out (${timeoutMs}ms): ${commandLine}`));
    }, timeoutMs);

    let stdout = "";
    let stderr = "";
    const maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES;

    child.stdout.on("data", (chunk: Buffer | string) => {
      stdout = appendBounded(stdout, chunk, maxOutputBytes);
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      stderr = appendBounded(stderr, chunk, maxOutputBytes);
    });

    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        const details = [stderr, stdout].find((value) => value.trim().length > 0)?.trim();
        reject(new Error(`Command failed (${commandLine})${details ? `: ${truncate(details, 200)}` : ""}`));
        return;
      }

      const output = [stdout, stderr].find((value) => value.trim().length > 0)?.trim() ?? "(no output)";
      resolve({
        commandLine,
        output: truncate(output, 200)
      });
    });
  });

export async function executeStrategyCommands(commands: StrategyCommand[]): Promise<string[]> {
  const evidence: string[] = [];
  for (const command of commands) {
    const result = await runCommand(command);
    evidence.push(`executed:${result.commandLine}: ${result.output}`);
  }
  return evidence;
}
