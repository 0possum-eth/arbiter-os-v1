import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { readRegistry, writeRegistry } from "./registry";

function normalizeDocPath(docPath: string): string {
  return docPath.trim().replace(/\\/g, "/");
}

async function computeDocHash(docPath: string): Promise<string> {
  const resolvedPath = path.resolve(docPath);
  const content = await fs.promises.readFile(resolvedPath);
  return createHash("sha256").update(content).digest("hex");
}

type TrustCheck = {
  trusted: boolean;
  reason?: "not approved" | "hash mismatch" | "missing file";
};

export async function verifyTrustedDoc(docPath: string): Promise<TrustCheck> {
  const normalizedPath = normalizeDocPath(docPath);
  const registry = await readRegistry();
  const record = registry.records[normalizedPath];
  if (!record || record.approved !== true || record.hash.trim().length === 0) {
    return { trusted: false, reason: "not approved" };
  }

  try {
    const currentHash = await computeDocHash(normalizedPath);
    if (currentHash !== record.hash) {
      return { trusted: false, reason: "hash mismatch" };
    }
    return { trusted: true };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { trusted: false, reason: "missing file" };
    }
    throw err;
  }
}

export async function approveDoc(docPath: string): Promise<void> {
  const normalizedPath = normalizeDocPath(docPath);
  const hash = await computeDocHash(normalizedPath);
  const registry = await readRegistry();
  registry.records[normalizedPath] = {
    approved: true,
    hash,
    approvedAt: new Date().toISOString()
  };
  await writeRegistry(registry);
}

export async function isTrusted(docPath: string): Promise<boolean> {
  const trustCheck = await verifyTrustedDoc(docPath);
  return trustCheck.trusted;
}
