export type BundleTask = {
  id: string;
  artifactsToTouch?: string[];
};

type BundleOptions = {
  maxBundleSize?: number;
};

const normalizeArtifacts = (artifacts: string[] | undefined) =>
  Array.isArray(artifacts)
    ? artifacts.map((artifact) => artifact.trim()).filter((artifact) => artifact.length > 0)
    : [];

export function bundleTasks(tasks: BundleTask[], options: BundleOptions = {}): BundleTask[] {
  if (!Array.isArray(tasks) || tasks.length === 0) return [];
  const maxBundleSize = options.maxBundleSize ?? 2;
  if (maxBundleSize <= 1) return [tasks[0]];

  const bundle: BundleTask[] = [];
  const touched = new Set<string>();

  for (const task of tasks) {
    if (bundle.length >= maxBundleSize) break;

    const artifacts = normalizeArtifacts(task.artifactsToTouch);
    if (bundle.length === 0) {
      bundle.push(task);
      if (artifacts.length === 0) break;
      for (const artifact of artifacts) touched.add(artifact);
      continue;
    }

    if (artifacts.length === 0) break;
    const overlaps = artifacts.some((artifact) => touched.has(artifact));
    if (overlaps) break;

    bundle.push(task);
    for (const artifact of artifacts) touched.add(artifact);
  }

  return bundle;
}
