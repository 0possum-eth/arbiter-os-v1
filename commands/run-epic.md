---
description: Canonical Arbiter OS orchestration entrypoint
disable-model-invocation: true
---

`run-epic` is the canonical entrypoint for Arbiter OS orchestration.

Use this command surface for every cycle:

1. Invoke the `superpowers:using-arbiter-os` skill.
2. Invoke the `superpowers:arbiter-run-loop` skill.
3. When behavior docs are required, enforce trust flow before execution:
   - `approve-brick <doc-path>`
   - `mount-doc <doc-path>`
   - `list-bricks`
