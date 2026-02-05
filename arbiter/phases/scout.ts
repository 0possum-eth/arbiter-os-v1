export async function runScout(): Promise<unknown> {
  return {
    schemaVersion: "arbiter.scout.v1",
    metadata: {
      runId: "scout-run",
      scoutId: "scout-0",
      generatedAt: new Date().toISOString(),
      confidence: "low"
    },
    summary: {
      problemStatement: "Bootstrap a placeholder epic",
      constraints: ["Temporary scaffold"],
      unknowns: ["Real requirements pending"]
    },
    candidates: [
      {
        id: "EPIC-1",
        title: "Bootstrap epic",
        intent: "Create a placeholder epic",
        scope: {
          included: ["arbiter"],
          excluded: []
        },
        prerequisites: [],
        estimatedComplexity: "low",
        artifactsToTouch: ["TASK-1"],
        risks: [],
        disallowedActions: []
      }
    ],
    recommendation: {
      candidateId: "EPIC-1",
      rationale: "Minimal viable activation"
    }
  };
}
