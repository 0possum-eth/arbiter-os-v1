import { readRegistry, writeRegistry } from "./registry";

function normalizeDocPath(docPath: string): string {
  return docPath.trim().replace(/\\/g, "/");
}

export async function approveDoc(docPath: string): Promise<void> {
  const normalizedPath = normalizeDocPath(docPath);
  const registry = await readRegistry();
  if (!registry.trusted.includes(normalizedPath)) {
    registry.trusted.push(normalizedPath);
    await writeRegistry(registry);
  }
}

export async function isTrusted(docPath: string): Promise<boolean> {
  const normalizedPath = normalizeDocPath(docPath);
  const registry = await readRegistry();
  return registry.trusted.includes(normalizedPath);
}
