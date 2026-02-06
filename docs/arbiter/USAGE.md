# Arbiter OS Usage

This guide covers the operational commands used during an Arbiter OS run in OpenCode.

## Run-Epic Usage

`run-epic` is the canonical entrypoint for Arbiter OS orchestration.

- Use `run-epic` to start or continue epic coordination
- Keep all implementation work inside the `run-epic` loop so state, receipts, and ledger updates stay aligned
- Command contract: [`commands/run-epic.md`](../../commands/run-epic.md)

## Run-Epic + Trust Flow

Use trust commands inside the `run-epic` loop before behavior-doc execution:

1. `run-epic`
2. `approve-brick <doc-path>`
3. `mount-doc <doc-path>`
4. `list-bricks`
5. Continue the `run-epic` cycle with trusted mounted docs

## Trust Commands

Arbiter OS treats behavior docs as untrusted until approved.

- `approve-brick <doc-path>` records trust for a doc path
- `mount-doc <doc-path>` mounts a trusted doc for execution and returns mount metadata
- `list-bricks` lists indexed doc bricks from the retrieval ledger

If a behavior doc is mounted without trust approval, execution is blocked by policy.

## Context Packs

Context packs are generated from indexed document bricks and mounted into execution tasks.

- Generated packs are written under `docs/arbiter/context-packs/`
- Packs are synthesized from retrieval results so execution receives focused context
- Use context packs after trust checks to keep runs both safe and relevant

## Workspace Bootstrap

`scripts/arbiter/arbiter-init-workspace.ts` initializes Arbiter workspace scaffolding for a new run.

- Creates the run ledger base directory at `docs/arbiter/_ledger/runs/` (run-scoped subdirectories are created during execution)
- Initializes run index stream at `docs/arbiter/_ledger/runs.jsonl`
- Preserves baseline workspace files such as `docs/arbiter/prd.json` and `docs/arbiter/_ledger/prd.events.jsonl`

## Install Steps

For OpenCode installation and plugin wiring, follow [.opencode/INSTALL.md](../../.opencode/INSTALL.md#installation-steps).
