import fs from "node:fs";
import path from "node:path";

export type TrustRegistry = { trusted: string[] };

function getRegistryPath(): string {
  const envPath = process.env.ARBITER_TRUST_PATH;
  if (envPath && envPath.trim().length > 0) {
    return path.resolve(envPath);
  }
  return path.join(process.cwd(), "docs", "arbiter", "_ledger", "trust.json");
}

export async function readRegistry(): Promise<TrustRegistry> {
  try {
    const registryPath = getRegistryPath();
    const raw = await fs.promises.readFile(registryPath, "utf8");
    let parsed: { trusted?: string[] };
    try {
      parsed = JSON.parse(raw) as { trusted?: string[] };
    } catch (err) {
      if (err instanceof SyntaxError) {
        return { trusted: [] };
      }
      throw err;
    }
    const trusted = Array.isArray(parsed.trusted)
      ? parsed.trusted.filter((entry): entry is string => typeof entry === "string")
      : [];
    return { trusted };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return { trusted: [] };
    }
    throw err;
  }
}

export async function writeRegistry(registry: TrustRegistry): Promise<void> {
  const registryPath = getRegistryPath();
  await fs.promises.mkdir(path.dirname(registryPath), { recursive: true });
  const data = JSON.stringify({ trusted: registry.trusted }, null, 2) + "\n";
  const tempPath = `${registryPath}.${process.pid}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tempPath, data, "utf8");
  try {
    await fs.promises.rename(tempPath, registryPath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EEXIST" || code === "EPERM" || code === "EACCES") {
      await fs.promises.unlink(registryPath).catch((unlinkErr) => {
        if ((unlinkErr as NodeJS.ErrnoException).code !== "ENOENT") {
          throw unlinkErr;
        }
      });
      await fs.promises.rename(tempPath, registryPath);
      return;
    }
    throw err;
  } finally {
    await fs.promises.unlink(tempPath).catch((unlinkErr) => {
      if ((unlinkErr as NodeJS.ErrnoException).code !== "ENOENT") {
        throw unlinkErr;
      }
    });
  }
}
