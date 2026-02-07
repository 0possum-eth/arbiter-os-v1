import fs from "node:fs/promises";
import path from "node:path";
import { execSync } from "node:child_process";
import { pathToFileURL } from "node:url";

type EvidenceMetadata = {
  generatedAt: string;
  sourceCommit: string;
};

const METADATA_START = "<!-- readiness-metadata:start -->";
const METADATA_END = "<!-- readiness-metadata:end -->";

const CATEGORY_EVIDENCE_INPUTS: Array<{ category: string; inputs: string[] }> = [
  {
    category: "Orchestration kernel & command surface",
    inputs: ["tests/arbiter/test-command-surface.sh", "tests/arbiter/test-execute-plan-routing.sh"]
  },
  {
    category: "Execution + verification + done gating",
    inputs: ["arbiter/verify/verifyReceipts.ts", "arbiter/execute/taskRunner.ts"]
  },
  {
    category: "Ledger/state architecture",
    inputs: ["arbiter/ledger/appendEvent.ts", "tests/arbiter/test-ledger-replay.sh"]
  },
  {
    category: "Trust gating & role isolation",
    inputs: ["arbiter/trust/policy.ts", ".opencode/plugins/arbiter-os.js"]
  },
  {
    category: "Retrieval/context quality",
    inputs: ["arbiter/docs/retrieveBricks.ts", "arbiter/librarian/contextPack.ts"]
  },
  {
    category: "Memory/continuity",
    inputs: ["arbiter/memory/query.ts", "arbiter/memory/policy.ts"]
  },
  {
    category: "Scout/research-to-PRD loop",
    inputs: ["arbiter/scout/extractPrd.ts", "arbiter/decisions/arbiterDecision.ts"]
  },
  {
    category: "Install/docs/runtime migration readiness",
    inputs: [".opencode/INSTALL.md", "tests/arbiter/test-install-windows-target.sh"]
  }
];

const normalizeCommit = (value: string) => value.trim().replace(/[^a-fA-F0-9]/g, "").toLowerCase();

const resolveSourceCommit = () => {
  const fromEnv = normalizeCommit(process.env.ARBITER_SOURCE_COMMIT ?? "");
  if (fromEnv.length >= 7) {
    return fromEnv;
  }

  try {
    return normalizeCommit(execSync("git rev-parse HEAD", { encoding: "utf8" }));
  } catch {
    return "0000000";
  }
};

export const renderEvidenceMetadataSection = (metadata: EvidenceMetadata) => {
  const lines: string[] = [];
  lines.push("## Evidence Metadata");
  lines.push("");
  lines.push(`- generatedAt: ${metadata.generatedAt}`);
  lines.push(`- sourceCommit: ${metadata.sourceCommit}`);
  lines.push("");
  lines.push("### Category Evidence Inputs");
  lines.push("");
  for (const entry of CATEGORY_EVIDENCE_INPUTS) {
    lines.push(`- ${entry.category}: ${entry.inputs.join(", ")}`);
  }
  lines.push("");
  return lines.join("\n");
};

export const upsertReadinessMetadata = (currentMarkdown: string, sectionMarkdown: string) => {
  const wrapped = `${METADATA_START}\n${sectionMarkdown}\n${METADATA_END}`;
  const blockPattern = new RegExp(`${METADATA_START}[\\s\\S]*?${METADATA_END}`, "m");

  if (blockPattern.test(currentMarkdown)) {
    return currentMarkdown.replace(blockPattern, wrapped);
  }

  const trimmed = currentMarkdown.replace(/\s*$/, "");
  return `${trimmed}\n\n${wrapped}\n`;
};

const recalculateReadiness = async () => {
  const repoRoot = process.env.ARBITER_REPO_ROOT
    ? path.resolve(process.env.ARBITER_REPO_ROOT)
    : process.cwd();
  const readinessPath = path.join(repoRoot, "docs", "arbiter", "READINESS.md");
  const currentMarkdown = await fs.readFile(readinessPath, "utf8");

  const section = renderEvidenceMetadataSection({
    generatedAt: new Date().toISOString(),
    sourceCommit: resolveSourceCommit()
  });

  const updated = upsertReadinessMetadata(currentMarkdown, section);
  await fs.writeFile(readinessPath, updated, "utf8");
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await recalculateReadiness();
}
