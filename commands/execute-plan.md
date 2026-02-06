---
description: Execute plan in batches with review checkpoints
disable-model-invocation: true
---

execute-plan compatibility path for Arbiter OS: route `/superpowers:execute-plan` into the Arbiter loop, keep `run-epic` as the canonical entrypoint, and use Arbiter run semantics before task execution.

1. Invoke the `superpowers:using-arbiter-os` skill.
2. Invoke the `superpowers:arbiter-run-loop` skill.
3. Invoke the `superpowers:executing-plans` skill and follow it exactly as presented.
