import path from "node:path";
import { createHash } from "node:crypto";

import { retrieveBricks } from "../docs/retrieveBricks";
import { isTrusted } from "../trust/commands";

export const CONTEXT_PACK_HARD_CAP = 8_000;

const getIndexPath = () => {
  const envPath = process.env.ARBITER_DOCS_INDEX_PATH;
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(envPath);
  }
  return path.join(process.cwd(), "docs", "arbiter", "_ledger", "bricks.jsonl");
};

const normalizeHeading = (heading: string) => {
  const normalized = heading.replace(/^#+\s*/, "").trim();
  return normalized || heading.trim();
};

const normalizePath = (filePath: string) => filePath.replace(/\\/g, "/");

type ContextPackOptions = {
  includeTrustLabels?: boolean;
  requireTrusted?: boolean;
  allowedSourcePaths?: string[];
  includeSourceIds?: boolean;
  capProfile?: "compact" | "default" | "extended";
};

const CONTEXT_PACK_PROFILE_CAPS = {
  compact: 2_000,
  default: CONTEXT_PACK_HARD_CAP,
  extended: 12_000
} as const;

const CONTEXT_PACK_PROFILE_LIMITS = {
  compact: 1,
  default: 2,
  extended: 4
} as const;

const sourceIdFor = (source: string) => createHash("sha256").update(source, "utf8").digest("hex").slice(0, 12);

const formatLine = (
  source: string,
  trustLabel: "trusted" | "untrusted",
  content: string,
  includeTrustLabels: boolean,
  includeSourceIds: boolean
) => {
  const sourceIdSuffix = includeSourceIds ? ` source_id:${sourceIdFor(source)}` : "";
  if (!includeTrustLabels) {
    return `- [${source}]${sourceIdSuffix} ${content}`;
  }
  return `- [${source}] (${trustLabel})${sourceIdSuffix} ${content}`;
};

export async function contextPack(query: string, options: ContextPackOptions = {}) {
  const includeTrustLabels = options.includeTrustLabels === true;
  const includeSourceIds = options.includeSourceIds === true;
  const requireTrusted = options.requireTrusted === true;
  const capProfile = options.capProfile ?? "default";
  const maxChars = CONTEXT_PACK_PROFILE_CAPS[capProfile] ?? CONTEXT_PACK_PROFILE_CAPS.default;
  const retrievalLimit = CONTEXT_PACK_PROFILE_LIMITS[capProfile] ?? CONTEXT_PACK_PROFILE_LIMITS.default;
  const allowedSourcePaths = Array.isArray(options.allowedSourcePaths)
    ? new Set(options.allowedSourcePaths.map((value) => normalizePath(value)))
    : null;
  const indexPath = getIndexPath();
  const bricks = await retrieveBricks(indexPath, query, retrievalLimit);
  const lines = await Promise.all(
    bricks.map(async (brick) => {
      const normalizedSourcePath = normalizePath(brick.path);
      if (allowedSourcePaths && !allowedSourcePaths.has(normalizedSourcePath)) {
        return null;
      }

      const shouldCheckTrust = includeTrustLabels || requireTrusted;
      const trusted = shouldCheckTrust ? await isTrusted(brick.path) : true;
      if (requireTrusted && !trusted) {
        return null;
      }

      const heading = normalizeHeading(brick.heading);
      const source = `${normalizedSourcePath}#${heading}`;
      const trustLabel: "trusted" | "untrusted" = trusted ? "trusted" : "untrusted";
      return formatLine(source, trustLabel, brick.content, includeTrustLabels, includeSourceIds);
    })
  );

  let pack = "## Context Pack";
  for (const line of lines) {
    if (!line) {
      continue;
    }
    const nextPack = `${pack}\n${line}`;
    if (nextPack.length > maxChars) {
      break;
    }
    pack = nextPack;
  }

  return pack;
}
