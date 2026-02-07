---
description: Set or view the active dual-stack workflow profile
disable-model-invocation: true
---

`workflow-mode` manages the active workflow profile for the current workspace.

Use this command to select how Arbiter OS routes execution between core Superpowers flows and Arbiter orchestration.

Available workflow profile values:

- `hybrid_guided` (recommended default)
- `superpowers_core`
- `arbiter_core`

Behavior:

1. `workflow-mode` with no profile returns current profile.
2. `workflow-mode` with a profile updates persistence and returns selected profile.
3. `run-epic` consumes this selection when resolving intake and execution routing.
