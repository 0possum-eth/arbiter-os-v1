# Dual-Stack Superpowers + Arbiter Routing Max-Effort Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ship a dual-stack orchestration system where users can run `superpowers_core`, `arbiter_core`, or `hybrid_guided`, with adaptive intake, assisted dependency installation, truthful status reporting, and strict core build-plan guarantees on done-gating.

**Architecture:** Keep `run-epic` as canonical entrypoint and preserve the existing receipt/ledger kernel. Add a workflow router and intake classifier that decide when to continue immediately, when to ask route options, and when to run Scout/Brainstorm/Plan flows. Integrate Superpowers flows directly into routing while preserving Arbiter evidence boundaries in Arbiter/Hybrid modes.

**Tech Stack:** TypeScript, Node.js, OpenCode plugin hooks, shell gate scripts, JSONL ledgers/receipts, `tsx --test`.

---

## Non-Negotiable Constraints

- Preserve Arbiter core rule: no task marked done without verifier evidence and ledger keeper commit.
- Keep `run-epic` as canonical orchestration entrypoint.
- Keep execute-plan compatibility routing through Arbiter semantics.
- Do not regress trust gating for behavior docs.
- Add dual-stack routing without breaking Superpowers-only experience.
- Ensure first-run behavior is guided and automated, not synthetic and misleading.

---

## Requirement Traceability Matrix (Discussion -> Implementation)

1. User can start from one-sentence prompt -> Tasks 9, 10, 11, 21, 22
2. Prompt user for route only when needed -> Tasks 9, 10, 11
3. Offer route choices: Superpowers, Arbiter, Hybrid -> Tasks 3, 5, 6, 9, 12
4. Integrate Superpowers and Arbiter awareness -> Tasks 12, 13, 14
5. Assisted auto-install for prereqs + toolchain -> Tasks 15, 16, 17, 18
6. Prevent false "flawless" success claims -> Tasks 19, 20, 23
7. Stay aligned to core build plan intent -> Tasks 1, 2, 24

---

## Revision Pass Decisions (Locked)

1. **Order/dependencies:** execute in phase order A -> G; no downstream phase starts before upstream gate passes.
2. **Prompt UX:** ask route-choice only when intent/maturity is ambiguous; otherwise route directly.
3. **Auto-install:** support assisted install for prerequisites + toolchain with explicit user consent and receipt logging.

### Prompt Contract (run-epic intake)

- Trigger prompt only when `NO_ACTIVE_EPIC` and requirements maturity is unknown/insufficient.
- Show options in this order:
  1. Quick Scout from one sentence (Recommended)
  2. Brainstorm then Scout
  3. Use existing docs
  4. Use existing plan
- If user explicitly requests a route (`run-epic`, `brainstorm`, `execute-plan`, etc.), skip the menu and route directly.

### Prompt Copy Freeze (Exact Wording)

- **Ambiguous start (no explicit route):**

```text
run-epic needs direction before execution.

Choose a route:
1) Quick Scout from one sentence (Recommended)
2) Brainstorm then Scout
3) Use existing docs
4) Use existing plan

Reply with 1-4, or paste your one-sentence goal now.
```

- **One-sentence detected:**

```text
I detected a one-sentence goal and can route immediately.

Recommended route:
1) Quick Scout from one sentence (Recommended)
2) Brainstorm then Scout
3) Use existing docs
4) Use existing plan

Reply with 1-4 to continue.
```

- **Explicit route bypass:**

```text
Routing directly to <selected-route> because you explicitly requested it.
```

- **Re-prompt guardrail:**
  - Do not ask the route menu again in the same run unless prior route failed or prerequisites changed.

### Auto-Install Safety Boundaries

- Allowed with consent: install Git/Node and repository-indicated toolchain dependencies.
- Required before execution: explicit consent captured in receipt payload.
- Always blocked: destructive system changes unrelated to prerequisites, forced reconfiguration of unrelated global tooling, and silent background installs.

---

## Canonical 27-Task Control Checklist

### Phase A: Lock Requirements + Invariants
- [x] Task 1 - Build discussion-to-requirement checklist
- [x] Task 2 - Build core build-plan parity checklist
- [x] Task 3 - Add acceptance criteria per requirement
- [x] Task 4 - Add mandatory closure checklist

### Phase B: Workflow Profiles + Persistence
- [x] Task 5 - Add profile model (`superpowers_core`, `arbiter_core`, `hybrid_guided`)
- [x] Task 6 - Add mode persistence store
- [x] Task 7 - Add `workflow-mode` command (view/set)
- [x] Task 8 - Add tests for profile switching and persistence

### Phase C: Adaptive Routing
- [x] Task 9 - Add intake classifier (maturity/env/workspace)
- [x] Task 10 - Add conditional prompt generator
- [x] Task 11 - Route explicit user intent directly
- [x] Task 12 - Route ambiguous starts to option menu
- [x] Task 13 - Add tests for each route + prompt copy snapshot freeze

### Phase D: Superpowers/Arbiter Interplay
- [x] Task 14 - Update `run-epic`/`execute-plan` docs and skills for dual-stack routing
- [x] Task 15 - Ensure Superpowers flows remain callable in `superpowers_core`
- [x] Task 16 - Ensure done-gating mandatory in `arbiter_core` + `hybrid_guided`
- [x] Task 17 - Add routing-doc drift tests

### Phase E: Dependency Automation
- [x] Task 18 - Add runtime doctor + installer planner
- [x] Task 19 - Add consented auto-install executor + receipts
- [x] Task 20 - Add no-git/no-node/no-toolchain tests

### Phase F: Truthful Status + Anti-False-Success
- [x] Task 21 - Extend `arbiter-status` with evidence health/provenance
- [x] Task 22 - Add guard against artifact-shape-only "flawless" claims
- [x] Task 23 - Add VM regression tests

### Phase G: Docs + Verification Publish
- [x] Task 24 - Update install docs for dual-stack modes and first-run choices
- [x] Task 25 - Update usage docs with route examples
- [x] Task 26 - Run full verification suite
- [x] Task 27 - Publish readiness deltas + explicit parity report

---

## 27-Task to Implementation Work-Package Crosswalk

- Tasks 1-4 -> Detailed Tasks 1-2 + final plan/readiness checklist updates
- Tasks 5-8 -> Detailed Tasks 3-6
- Tasks 9-13 -> Detailed Tasks 7-11
- Tasks 14-17 -> Detailed Tasks 12-14
- Tasks 18-20 -> Detailed Tasks 15-18
- Tasks 21-23 -> Detailed Tasks 19-23
- Tasks 24-27 -> Detailed Task 24 + docs/readiness publication steps

---

### Task 1: Lock discussion requirements and acceptance criteria

**Files:**
- Create: `docs/arbiter/DUAL_STACK_REQUIREMENTS.md`
- Modify: `docs/plans/2026-02-07-dual-stack-superpowers-arbiter-routing-max-effort-plan.md`

**Step 1: Write the failing checklist assertions**

Define pass/fail statements for each user requirement from this conversation.

**Step 2: Verify gaps exist before implementation**

Run: `bash tests/arbiter/test-dual-stack-requirements.sh`

Expected: FAIL (test file not yet exists / requirements not yet captured).

**Step 3: Write requirements doc**

Add explicit acceptance criteria with objective verification command per criterion.

**Step 4: Re-run verification**

Run: `bash tests/arbiter/test-dual-stack-requirements.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add docs/arbiter/DUAL_STACK_REQUIREMENTS.md docs/plans/2026-02-07-dual-stack-superpowers-arbiter-routing-max-effort-plan.md
git commit -m "docs(requirements): lock dual-stack routing acceptance criteria"
```

---

### Task 2: Add core-plan parity checklist gate

**Files:**
- Create: `tests/arbiter/test-core-plan-parity.sh`
- Modify: `docs/arbiter/READINESS.md`

**Step 1: Write failing parity test**

Assert presence of documented guarantees: role separation, no-done-without-evidence, run-epic canonical, execute-plan compatibility path.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-core-plan-parity.sh`

Expected: FAIL.

**Step 3: Add parity checklist section to readiness doc**

Link each parity item to implementing file/test.

**Step 4: Re-run test**

Run: `bash tests/arbiter/test-core-plan-parity.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add tests/arbiter/test-core-plan-parity.sh docs/arbiter/READINESS.md
git commit -m "test(readiness): add core-build-plan parity gate"
```

---

### Task 3: Add workflow profile contracts

**Files:**
- Create: `arbiter/workflow/contracts.ts`
- Create: `arbiter/workflow/__tests__/contracts.test.ts`

**Step 1: Write failing tests**

Require valid profiles:
- `superpowers_core`
- `arbiter_core`
- `hybrid_guided`

And route outcomes:
- `DIRECT_SUPERPOWERS`
- `DIRECT_ARBITER`
- `PROMPT_FOR_ROUTE`

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/workflow/__tests__/contracts.test.ts"`

Expected: FAIL.

**Step 3: Implement contracts**

Add typed route decision objects with recommended/default option field.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/workflow/__tests__/contracts.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/workflow/contracts.ts arbiter/workflow/__tests__/contracts.test.ts
git commit -m "feat(workflow): define dual-stack profile contracts"
```

---

### Task 4: Add workspace workflow mode persistence

**Files:**
- Create: `arbiter/workflow/modeStore.ts`
- Create: `arbiter/workflow/__tests__/modeStore.test.ts`

**Step 1: Write failing tests**

Verify mode default and read/write persistence under workspace docs path.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/workflow/__tests__/modeStore.test.ts"`

Expected: FAIL.

**Step 3: Implement mode store**

Persist mode in a deterministic workspace config file.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/workflow/__tests__/modeStore.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/workflow/modeStore.ts arbiter/workflow/__tests__/modeStore.test.ts
git commit -m "feat(workflow): persist selected orchestration profile"
```

---

### Task 5: Add `workflow-mode` command surface

**Files:**
- Create: `arbiter/commands/workflowMode.ts`
- Modify: `arbiter/commands/index.ts`
- Modify: `arbiter/commands/__tests__/index.test.ts`

**Step 1: Write failing tests**

Require exported command key `workflow-mode` and handler wiring.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/commands/__tests__/index.test.ts"`

Expected: FAIL.

**Step 3: Implement command**

Support read current mode and set mode with validation.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/commands/__tests__/index.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/commands/workflowMode.ts arbiter/commands/index.ts arbiter/commands/__tests__/index.test.ts
git commit -m "feat(commands): add workflow-mode command"
```

---

### Task 6: Add workflow mode command docs and tests

**Files:**
- Create: `commands/workflow-mode.md`
- Modify: `docs/arbiter/USAGE.md`
- Modify: `tests/arbiter/test-command-surface.sh`

**Step 1: Write failing docs gate assertions**

Require `workflow-mode` in command docs and usage docs.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-command-surface.sh`

Expected: FAIL.

**Step 3: Implement docs**

Document profile values, defaults, and when prompts occur.

**Step 4: Re-run test**

Run: `bash tests/arbiter/test-command-surface.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add commands/workflow-mode.md docs/arbiter/USAGE.md tests/arbiter/test-command-surface.sh
git commit -m "docs(commands): document workflow-mode and profile behavior"
```

---

### Task 7: Add intake/preflight state model

**Files:**
- Create: `arbiter/intake/state.ts`
- Create: `arbiter/intake/__tests__/state.test.ts`

**Step 1: Write failing tests**

Classify states:
- `ENV_NOT_READY`
- `WORKSPACE_NOT_INITIALIZED`
- `REQUIREMENTS_MISSING`
- `PLAN_READY`
- `EXECUTION_READY`

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/intake/__tests__/state.test.ts"`

Expected: FAIL.

**Step 3: Implement state model**

Use workspace files, dependency checks, and user intent hints.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/intake/__tests__/state.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/intake/state.ts arbiter/intake/__tests__/state.test.ts
git commit -m "feat(intake): add run-epic readiness state classifier"
```

---

### Task 8: Add structured route option payloads

**Files:**
- Modify: `arbiter/receipts/types.ts`
- Create: `arbiter/receipts/__tests__/haltOptions.test.ts`

**Step 1: Write failing tests**

Require `HALT_AND_ASK` receipts to support optional structured options list:
- id
- label
- description
- recommended

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/receipts/__tests__/haltOptions.test.ts"`

Expected: FAIL.

**Step 3: Implement receipt type extension**

Add route options support without breaking existing consumers.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/receipts/__tests__/haltOptions.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/receipts/types.ts arbiter/receipts/__tests__/haltOptions.test.ts
git commit -m "feat(receipts): support structured halt option payloads"
```

---

### Task 9: Build intake classifier (maturity + explicit intent)

**Files:**
- Create: `arbiter/workflow/router.ts`
- Create: `arbiter/workflow/__tests__/router.test.ts`

**Step 1: Write failing tests**

Cases:
- explicit `run-epic` continuation -> direct Arbiter route
- explicit brainstorm request -> direct Superpowers route
- one-sentence build idea -> prompt route choices with recommendation
- no intent + empty workspace -> prompt route choices

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/workflow/__tests__/router.test.ts"`

Expected: FAIL.

**Step 3: Implement router**

Generate deterministic route decision from intent + intake state + selected mode.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/workflow/__tests__/router.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/workflow/router.ts arbiter/workflow/__tests__/router.test.ts
git commit -m "feat(router): classify explicit and ambiguous workflow entry intents"
```

---

### Task 10: Add adaptive route prompt policy

**Files:**
- Create: `arbiter/intake/routePrompt.ts`
- Create: `arbiter/intake/__tests__/routePrompt.test.ts`
- Create: `arbiter/intake/promptCopy.ts`
- Create: `arbiter/intake/__tests__/promptCopySnapshot.test.ts`

**Step 1: Write failing tests**

Require:
- prompt emitted only when route is ambiguous or requirements missing,
- exact prompt copy matches locked text in this plan,
- one-sentence and explicit-route bypass variants are deterministic.

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/intake/__tests__/routePrompt.test.ts"`

Expected: FAIL.

**Step 3: Implement policy**

Prompt options:
- Quick Scout from one sentence
- Brainstorm then Scout
- Use existing docs
- Use existing plan

Extract copy strings into `promptCopy.ts` and treat them as a snapshot-frozen contract.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/intake/__tests__/routePrompt.test.ts" "arbiter/intake/__tests__/promptCopySnapshot.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/intake/routePrompt.ts arbiter/intake/promptCopy.ts arbiter/intake/__tests__/routePrompt.test.ts arbiter/intake/__tests__/promptCopySnapshot.test.ts
git commit -m "feat(intake): add conditional route prompts with snapshot-frozen copy"
```

---

### Task 11: Integrate router into `run-epic`

**Files:**
- Modify: `arbiter/run/runEpicAutopilot.ts`
- Modify: `arbiter/run/__tests__/runEpicAutopilot.test.ts`

**Step 1: Write failing tests**

Require run loop to:
- continue directly when execution-ready,
- emit route prompt when ambiguous,
- avoid silent synthetic task completion.

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/run/__tests__/runEpicAutopilot.test.ts"`

Expected: FAIL.

**Step 3: Implement routing integration**

Insert router gate before brainstorm/scout/execute branches.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/run/__tests__/runEpicAutopilot.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/run/runEpicAutopilot.ts arbiter/run/__tests__/runEpicAutopilot.test.ts
git commit -m "feat(run): integrate adaptive dual-stack router into run-epic"
```

---

### Task 12: Update Arbiter skills for dual-stack interplay

**Files:**
- Modify: `.opencode/skills/using-arbiter-os/SKILL.md`
- Modify: `.opencode/skills/arbiter-run-loop/SKILL.md`
- Modify: `.opencode/skills/arbiter-doc-ingest/SKILL.md`

**Step 1: Write failing skill-content tests**

Add assertions to ensure skills mention profile interplay and route conditions.

**Step 2: Run test to verify failure**

Run: `bash tests/opencode/test-arbiter-skills.sh`

Expected: FAIL.

**Step 3: Implement skill updates**

Explicitly document dual-stack routing and when to invoke core Superpowers flows.

**Step 4: Re-run test**

Run: `bash tests/opencode/test-arbiter-skills.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add .opencode/skills/using-arbiter-os/SKILL.md .opencode/skills/arbiter-run-loop/SKILL.md .opencode/skills/arbiter-doc-ingest/SKILL.md tests/opencode/test-arbiter-skills.sh
git commit -m "docs(skills): define superpowers-arbiter dual-stack interplay"
```

---

### Task 13: Update command docs for dual-stack routing

**Files:**
- Modify: `commands/run-epic.md`
- Modify: `commands/execute-plan.md`
- Modify: `commands/brainstorm.md`
- Modify: `commands/write-plan.md`
- Modify: `docs/arbiter/agent-prompt.md`
- Modify: `tests/arbiter/test-execute-plan-routing.sh`

**Step 1: Write failing routing doc assertions**

Require profile-mode route explanations in command docs and agent prompt contract.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-execute-plan-routing.sh`

Expected: FAIL.

**Step 3: Implement docs**

Keep canonical `run-epic`; map execute-plan and superpowers compatibility paths.

**Step 4: Re-run test**

Run: `bash tests/arbiter/test-execute-plan-routing.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add commands/run-epic.md commands/execute-plan.md commands/brainstorm.md commands/write-plan.md docs/arbiter/agent-prompt.md tests/arbiter/test-execute-plan-routing.sh
git commit -m "docs(commands): add dual-stack route contract across command surfaces"
```

---

### Task 14: Update plugin kernel guidance for mode awareness

**Files:**
- Modify: `.opencode/plugins/arbiter-os.js`
- Modify: `tests/arbiter/test-plugin-canonical.sh`

**Step 1: Write failing plugin guidance tests**

Require injected kernel guidance to mention workflow profiles and route behavior.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-plugin-canonical.sh`

Expected: FAIL.

**Step 3: Implement kernel update**

Keep token-light guidance but include profile awareness and route discoverability.

**Step 4: Re-run test**

Run: `bash tests/arbiter/test-plugin-canonical.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add .opencode/plugins/arbiter-os.js tests/arbiter/test-plugin-canonical.sh
git commit -m "feat(plugin): inject dual-stack workflow profile guidance"
```

---

### Task 15: Add runtime doctor (prereqs + toolchain)

**Files:**
- Create: `arbiter/preflight/runtimeDoctor.ts`
- Create: `arbiter/preflight/__tests__/runtimeDoctor.test.ts`

**Step 1: Write failing tests**

Detect missing:
- Git
- Node
- project toolchain cues (npm/pnpm/bun equivalents)

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/preflight/__tests__/runtimeDoctor.test.ts"`

Expected: FAIL.

**Step 3: Implement doctor**

Return structured findings + installability hints.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/preflight/__tests__/runtimeDoctor.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/preflight/runtimeDoctor.ts arbiter/preflight/__tests__/runtimeDoctor.test.ts
git commit -m "feat(preflight): add runtime doctor for prereqs and toolchain"
```

---

### Task 16: Add install planner (platform-aware)

**Files:**
- Create: `arbiter/preflight/installPlanner.ts`
- Create: `arbiter/preflight/__tests__/installPlanner.test.ts`

**Step 1: Write failing tests**

Require command plans per platform (Windows/macOS/Linux) with fallback strategy.

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/preflight/__tests__/installPlanner.test.ts"`

Expected: FAIL.

**Step 3: Implement planner**

Generate staged install plan with command labels and risk notes.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/preflight/__tests__/installPlanner.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/preflight/installPlanner.ts arbiter/preflight/__tests__/installPlanner.test.ts
git commit -m "feat(preflight): add platform-aware dependency install planning"
```

---

### Task 17: Add consented install executor

**Files:**
- Create: `arbiter/preflight/installExecutor.ts`
- Create: `arbiter/preflight/__tests__/installExecutor.test.ts`
- Modify: `arbiter/receipts/types.ts`

**Step 1: Write failing tests**

Require:
- no install without consent flag,
- result receipts on success/failure,
- sequential execution with bounded timeouts.

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/preflight/__tests__/installExecutor.test.ts"`

Expected: FAIL.

**Step 3: Implement executor**

Run planned commands with controlled shell execution and outcome capture.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/preflight/__tests__/installExecutor.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/preflight/installExecutor.ts arbiter/preflight/__tests__/installExecutor.test.ts arbiter/receipts/types.ts
git commit -m "feat(preflight): add consented dependency installer with receipts"
```

---

### Task 18: Wire preflight + install flow into run loop

**Files:**
- Modify: `arbiter/run/runEpicAutopilot.ts`
- Modify: `arbiter/run/__tests__/runEpicAutopilot.test.ts`

**Step 1: Write failing tests**

Require run loop behavior:
- if env not ready and no consent -> prompt with install options,
- if consented -> execute install, re-evaluate, then continue.

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/run/__tests__/runEpicAutopilot.test.ts"`

Expected: FAIL.

**Step 3: Implement integration**

Insert preflight gate before intake routing and execution.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/run/__tests__/runEpicAutopilot.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/run/runEpicAutopilot.ts arbiter/run/__tests__/runEpicAutopilot.test.ts
git commit -m "feat(run): integrate preflight doctor and assisted install path"
```

---

### Task 19: Add evidence-health status model

**Files:**
- Modify: `arbiter/state/inspectState.ts`
- Create: `arbiter/state/__tests__/inspectStateEvidence.test.ts`

**Step 1: Write failing tests**

Require status to report:
- receipt continuity
- verifier evidence presence
- execution evidence presence

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/state/__tests__/inspectStateEvidence.test.ts"`

Expected: FAIL.

**Step 3: Implement evidence-health fields**

Add derived evidence summary in state output.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/state/__tests__/inspectStateEvidence.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/state/inspectState.ts arbiter/state/__tests__/inspectStateEvidence.test.ts
git commit -m "feat(status): derive evidence-health signals from receipts and run state"
```

---

### Task 20: Update `arbiter-status` truthfulness contract

**Files:**
- Modify: `arbiter/commands/status.ts`
- Modify: `commands/arbiter-status.md`
- Modify: `tests/arbiter/test-command-surface.sh`

**Step 1: Write failing docs and behavior tests**

Require command contract to include evidence-health and anti-false-success framing.

**Step 2: Run test to verify failure**

Run: `bash tests/arbiter/test-command-surface.sh`

Expected: FAIL.

**Step 3: Implement updates**

Return richer status payload and update command docs.

**Step 4: Re-run test**

Run: `bash tests/arbiter/test-command-surface.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/commands/status.ts commands/arbiter-status.md tests/arbiter/test-command-surface.sh
git commit -m "docs(status): enforce truthful run-state reporting with evidence health"
```

---

### Task 21: Replace static brainstorm placeholder with guided intake template

**Files:**
- Modify: `arbiter/phases/brainstorm.ts`
- Create: `arbiter/phases/__tests__/brainstorm.test.ts`

**Step 1: Write failing tests**

Require brainstorm output to reflect user intent context fields and avoid static generic text.

**Step 2: Run test to verify failure**

Run: `npm test -- "arbiter/phases/__tests__/brainstorm.test.ts"`

Expected: FAIL.

**Step 3: Implement template**

Generate bounded guided template seeded by available user intent and constraints.

**Step 4: Re-run test**

Run: `npm test -- "arbiter/phases/__tests__/brainstorm.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/phases/brainstorm.ts arbiter/phases/__tests__/brainstorm.test.ts
git commit -m "feat(brainstorm): replace static placeholder with guided intake template"
```

---

### Task 22: Tighten scout synthesis gating for weak input

**Files:**
- Modify: `arbiter/phases/scout.ts`
- Modify: `arbiter/decisions/arbiterDecision.ts`
- Modify: `arbiter/scout/__tests__/researchLoop.test.ts`
- Modify: `arbiter/decisions/__tests__/scoutSeam.test.ts`

**Step 1: Write failing tests**

Require scout to halt-and-ask when input signal is insufficient for actionable plan.

**Step 2: Run tests to verify failure**

Run: `npm test -- "arbiter/scout/__tests__/researchLoop.test.ts" "arbiter/decisions/__tests__/scoutSeam.test.ts"`

Expected: FAIL.

**Step 3: Implement gating**

Ensure candidates are grounded in user/reference signal before activation.

**Step 4: Re-run tests**

Run: `npm test -- "arbiter/scout/__tests__/researchLoop.test.ts" "arbiter/decisions/__tests__/scoutSeam.test.ts"`

Expected: PASS.

**Step 5: Commit**

```bash
git add arbiter/phases/scout.ts arbiter/decisions/arbiterDecision.ts arbiter/scout/__tests__/researchLoop.test.ts arbiter/decisions/__tests__/scoutSeam.test.ts
git commit -m "fix(scout): gate weak-input synthesis and require grounded candidate evidence"
```

---

### Task 23: Add VM-regression gates for first-run behavior

**Files:**
- Create: `tests/arbiter/test-run-epic-intake-routing.sh`
- Modify: `tests/arbiter/test-run-epic-e2e.sh`
- Modify: `tests/opencode/run-tests.sh`
- Modify: `docs/arbiter/USAGE.md`

**Step 1: Write failing scenario tests**

Reproduce VM flow:
- empty workspace,
- missing deps,
- no prior plan,
- one-sentence and no-sentence variants.

Require route prompts and truthful outcomes.

**Step 2: Run tests to verify failure**

Run: `bash tests/arbiter/test-run-epic-intake-routing.sh`

Expected: FAIL.

**Step 3: Implement test wiring and docs**

Add gate to run suite and usage documentation.

**Step 4: Re-run tests**

Run: `bash tests/arbiter/test-run-epic-intake-routing.sh && bash tests/opencode/run-tests.sh`

Expected: PASS.

**Step 5: Commit**

```bash
git add tests/arbiter/test-run-epic-intake-routing.sh tests/arbiter/test-run-epic-e2e.sh tests/opencode/run-tests.sh docs/arbiter/USAGE.md
git commit -m "test(run): add first-run intake routing regression gate for VM scenarios"
```

---

### Task 24: Final verification + readiness publication

**Files:**
- Modify: `docs/arbiter/READINESS.md`
- Modify: `docs/plans/2026-02-07-dual-stack-superpowers-arbiter-routing-max-effort-plan.md`

**Step 1: Mark checklist completion in this plan**

Update Task 1-24 checkboxes after verification evidence is collected.

**Step 2: Run full verification suite**

Run:
- `npm test`
- `bash tests/opencode/run-tests.sh`
- `bash tests/arbiter/test-workspace-init.sh`
- `bash tests/arbiter/test-doc-links.sh`
- `bash tests/arbiter/test-install-repo-target.sh`
- `bash tests/arbiter/test-install-windows-target.sh`
- `bash tests/arbiter/test-execute-plan-routing.sh`
- `bash tests/arbiter/test-plugin-canonical.sh`
- `bash tests/arbiter/test-command-surface.sh`
- `bash tests/arbiter/test-no-legacy-runtime-refs.sh`
- `bash tests/arbiter/test-ledger-replay.sh`
- `bash tests/arbiter/test-readiness-scores.sh`
- `bash tests/arbiter/test-agent-contracts-sync.sh`
- `bash tests/arbiter/test-branding-active-docs.sh`
- `bash tests/arbiter/test-run-epic-e2e.sh`
- `bash tests/arbiter/test-run-epic-intake-routing.sh`
- `bash tests/arbiter/test-core-plan-parity.sh`

Expected: all PASS.

**Step 3: Clean generated artifacts before final commit**

Remove:
- `docs/arbiter/_ledger/runs*`
- `docs/arbiter/context-packs*`

**Step 4: Confirm clean intended change set**

Run: `git status -sb`

Expected: readiness + plan publication updates only.

**Step 5: Commit**

```bash
git add docs/arbiter/READINESS.md docs/plans/2026-02-07-dual-stack-superpowers-arbiter-routing-max-effort-plan.md
git commit -m "docs(readiness): publish dual-stack routing verification and core-plan parity"
```

---

## Definition of Done for This Plan

- All 27 tasks completed with passing verification steps.
- Dual-stack workflow mode is discoverable and configurable.
- `run-epic` prompts only when route is ambiguous.
- One-sentence startup and no-instruction startup both handled predictably.
- Missing dependencies can be auto-installed via consented path.
- No false "flawless" outcome claims without evidence-health support.
- Core build plan parity gate passes and is documented in readiness.
