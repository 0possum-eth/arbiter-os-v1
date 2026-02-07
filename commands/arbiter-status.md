---
description: Canonical Arbiter OS state snapshot command
disable-model-invocation: true
---

`arbiter-status` is the canonical state inspection command for Arbiter OS.

Use it to fetch an `inspectState` state snapshot before or during a `run-epic` cycle.

The command returns structured state summary values:

- `NO_ACTIVE_EPIC`
- `ACTIVE_EPIC` with `epicId`
- `NO_MORE_WORK`

It also reports evidence health metadata used to prevent false "flawless" claims:

- `evidenceHealth.receiptContinuity`
- `evidenceHealth.verifierEvidence`
- `evidenceHealth.executionEvidence`
- `evidenceHealth.canClaimFlawless`
