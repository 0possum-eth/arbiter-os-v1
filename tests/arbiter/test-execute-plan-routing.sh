#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

EXECUTE_PLAN_COMMAND="$REPO_ROOT/commands/execute-plan.md"
ARBITER_RUN_LOOP_SKILL="$REPO_ROOT/.opencode/skills/arbiter-run-loop/SKILL.md"
USING_ARBITER_OS_SKILL="$REPO_ROOT/.opencode/skills/using-arbiter-os/SKILL.md"
AGENT_PROMPT_DOC="$REPO_ROOT/docs/arbiter/agent-prompt.md"
BRAINSTORM_COMMAND="$REPO_ROOT/commands/brainstorm.md"
WRITE_PLAN_COMMAND="$REPO_ROOT/commands/write-plan.md"

grep -Fq "compatibility path" "$EXECUTE_PLAN_COMMAND"
grep -Fq 'run-epic' "$EXECUTE_PLAN_COMMAND"
grep -Fq "superpowers:arbiter-run-loop" "$EXECUTE_PLAN_COMMAND"
grep -Fq "hybrid_guided" "$EXECUTE_PLAN_COMMAND"
grep -Fq "superpowers_core" "$EXECUTE_PLAN_COMMAND"
grep -Fq "arbiter_core" "$EXECUTE_PLAN_COMMAND"

grep -Fq "execute-plan compatibility path" "$ARBITER_RUN_LOOP_SKILL"
grep -Fq 'run-epic' "$ARBITER_RUN_LOOP_SKILL"
grep -Fq "route choices" "$ARBITER_RUN_LOOP_SKILL"

grep -Fq "execute-plan compatibility path" "$USING_ARBITER_OS_SKILL"
grep -Fq 'docs/arbiter/agent-prompt.md' "$USING_ARBITER_OS_SKILL"
grep -Fq "superpowers_core" "$USING_ARBITER_OS_SKILL"
grep -Fq "arbiter_core" "$USING_ARBITER_OS_SKILL"
grep -Fq "hybrid_guided" "$USING_ARBITER_OS_SKILL"
grep -Fq "superpowers:brainstorming" "$USING_ARBITER_OS_SKILL"
grep -Fq "superpowers:writing-plans" "$USING_ARBITER_OS_SKILL"

test -f "$AGENT_PROMPT_DOC"
grep -Fq "# Arbiter Agent Prompt Contract" "$AGENT_PROMPT_DOC"
grep -Fq 'run-epic' "$AGENT_PROMPT_DOC"
grep -Fq "execute-plan compatibility path" "$AGENT_PROMPT_DOC"
grep -Fq "Never mark tasks done without verifier evidence" "$AGENT_PROMPT_DOC"

test -f "$BRAINSTORM_COMMAND"
test -f "$WRITE_PLAN_COMMAND"
grep -Fq "superpowers:brainstorming" "$BRAINSTORM_COMMAND"
grep -Fq "superpowers:writing-plans" "$WRITE_PLAN_COMMAND"

echo "Execute-plan routing test passed"
