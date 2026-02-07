const normalize = (value: string | undefined) => (value || "").trim().toLowerCase();

const toRecord = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, unknown>;
};

const extractPathLikeTargets = (
  args: Record<string, unknown>,
  singleKeys: string[],
  listKeys: string[] = []
): string[] => {
  const targets: string[] = [];
  for (const key of singleKeys) {
    const value = args[key];
    if (typeof value === "string" && value.trim().length > 0) {
      targets.push(value);
    }
  }

  for (const key of listKeys) {
    if (!Object.prototype.hasOwnProperty.call(args, key)) {
      continue;
    }
    const value = args[key];
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
      throw new Error(`Invalid ${key} payload`);
    }
    targets.push(...value.filter((item) => item.trim().length > 0));
  }

  return targets;
};

const extractApplyPatchTargets = (args: Record<string, unknown>): string[] => {
  const patchText = args.patchText;
  if (typeof patchText !== "string" || patchText.trim().length === 0) {
    throw new Error("apply_patch requires patchText");
  }
  const targets = [
    ...patchText.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm),
    ...patchText.matchAll(/^\*\*\* Move to: (.+)$/gm)
  ]
    .map((match) => match[1].trim())
    .filter((value) => value.length > 0);

  if (targets.length === 0) {
    throw new Error("apply_patch payload did not contain file targets");
  }
  return targets;
};

export const WRITE_TOOLS = new Set([
  "write",
  "writefile",
  "edit",
  "delete",
  "deletefile",
  "move",
  "movefile",
  "rename",
  "renamefile",
  "createfile",
  "applypatch",
  "apply_patch",
  "bash"
]);

export const isWriteToolName = (toolName: string | undefined) => WRITE_TOOLS.has(normalize(toolName));

export const extractToolTargets = (toolName: string | undefined, toolArgs: unknown): string[] => {
  const normalizedToolName = normalize(toolName);
  if (!WRITE_TOOLS.has(normalizedToolName)) {
    return [];
  }

  const args = toRecord(toolArgs);
  let targets: string[] = [];

  switch (normalizedToolName) {
    case "write":
    case "writefile":
    case "edit":
    case "delete":
    case "deletefile":
    case "createfile":
      targets = extractPathLikeTargets(args, ["path", "filePath", "target"]);
      break;
    case "move":
    case "movefile":
    case "rename":
    case "renamefile":
      targets = extractPathLikeTargets(args, ["path", "filePath", "fromPath", "toPath", "source", "destination"]);
      break;
    case "applypatch":
    case "apply_patch":
      targets = extractApplyPatchTargets(args);
      break;
    case "bash":
      targets = extractPathLikeTargets(args, ["path", "filePath", "target"], ["paths", "targets", "filePaths"]);
      break;
    default:
      throw new Error(`Unsupported write tool: ${toolName || "unknown"}`);
  }

  if (targets.length === 0) {
    throw new Error(`Cannot determine targets for write tool ${toolName || "unknown"}`);
  }

  return targets;
};
