# Arbiter OS Usage

This guide covers the operational commands used during an Arbiter OS run in OpenCode.

## Run-Epic Usage

`run-epic` is the canonical entrypoint for Arbiter OS orchestration.

- Use `run-epic` to start or continue epic coordination
- Keep all implementation work inside the `run-epic` loop so state, receipts, and ledger updates stay aligned
- Command contract: [`commands/run-epic.md`](../../commands/run-epic.md)

## Arbiter-Status Usage

`arbiter-status` is the canonical command for state inspection snapshots.

- Use `arbiter-status` to read the current `inspectState` result before running work
- Snapshot status returns one of: `NO_ACTIVE_EPIC`, `ACTIVE_EPIC` (with `epicId`), `NO_MORE_WORK`
- Command contract: [`commands/arbiter-status.md`](../../commands/arbiter-status.md)

## Run-Epic + Arbiter-Status + Trust Flow

Use trust commands inside the `run-epic` loop before behavior-doc execution:

1. `run-epic`
2. `arbiter-status`
3. `approve-brick <doc-path>`
4. `mount-doc <doc-path>`
5. `list-bricks`
6. Continue the `run-epic` cycle with trusted mounted docs

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

## Ledger Replay

Replay tooling rebuilds derived views from the ledger event stream.

- Use `rebuildViewsFromLedger({ ledgerPath, rootDir })` from `arbiter/ledger/rebuildViews.ts` to regenerate `prd.json` and `progress.txt`
- Ledger events are schema-versioned as `arbiter.ledger.v1` before they are appended
- Validate replay behavior with `bash tests/arbiter/test-ledger-replay.sh`

## Run-Epic End-to-End Gate

Use the e2e gate to validate receipt-gated orchestration in an isolated temporary workspace.

- Run `bash tests/arbiter/test-run-epic-e2e.sh`
- The gate initializes a workspace, seeds a minimal epic/task, executes `run-epic`, and validates receipts plus ledger coherence

## Install Steps

For OpenCode installation and plugin wiring, follow [.opencode/INSTALL.md](../../.opencode/INSTALL.md#installation-steps).
