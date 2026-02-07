import path from "node:path";

import { buildViews } from "./buildViews";

type RebuildViewsOptions = {
  ledgerPath: string;
  rootDir: string;
  outDir?: string;
};

export async function rebuildViewsFromLedger(options: RebuildViewsOptions) {
  const viewsDir = options.outDir ?? path.join(options.rootDir, "docs", "arbiter");
  await buildViews(options.ledgerPath, viewsDir);

  return {
    viewsDir,
    prdPath: path.join(viewsDir, "prd.json"),
    progressPath: path.join(viewsDir, "progress.txt")
  };
}
