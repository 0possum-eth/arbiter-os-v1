const normalizePath = (docPath: string) => docPath.trim().replace(/\\/g, "/").toLowerCase();

export function classifyBrick(docPath: string): "knowledge" | "behavior" {
  const normalized = normalizePath(docPath);
  if (
    normalized.includes("/docs/arbiter/reference/") ||
    normalized.includes("/docs/arbiter/knowledge/") ||
    normalized.startsWith("docs/arbiter/reference/") ||
    normalized.startsWith("docs/arbiter/knowledge/")
  ) {
    return "knowledge";
  }
  return "behavior";
}

export function canMountForExecution(docPath: string, trusted: boolean): boolean {
  if (classifyBrick(docPath) === "knowledge") {
    return true;
  }
  return trusted;
}
