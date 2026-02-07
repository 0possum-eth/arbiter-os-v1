#!/usr/bin/env bash
# Main test runner for OpenCode plugin test suite
# Runs all tests and reports results
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
REPO_ROOT="$(cd ../.. && pwd)"

echo "========================================"
echo " OpenCode Plugin Test Suite"
echo "========================================"
echo ""
echo "Repository: $REPO_ROOT"
echo "Test time: $(date)"
echo ""

# Parse command line arguments
RUN_INTEGRATION=false
VERBOSE=false
SPECIFIC_TEST=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --integration|-i)
            RUN_INTEGRATION=true
            shift
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --test|-t)
            if [[ $# -lt 2 || -z "${2:-}" ]]; then
                echo "Error: --test requires a test filename"
                echo "Use --help for usage information"
                exit 1
            fi
            SPECIFIC_TEST="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --integration, -i  Run integration tests (requires OpenCode)"
            echo "  --verbose, -v      Show verbose output"
            echo "  --test, -t NAME    Run only the specified test"
            echo "  --help, -h         Show this help"
            echo ""
            echo "Tests:"
            echo "  test-plugin-loading.sh  Verify plugin installation and structure"
            echo "  test-skills-core.sh     Test skills-core.js library functions"
            echo "  test-agents.sh          Validate arbiter agent prompt contracts"
            echo "  test-agent-contracts.sh Validate packet-schema references in prompts"
            echo "  test-arbiter-skills.sh  Validate arbiter skill registration/content"
            echo "  test-tools.sh           Test use_skill and find_skills tools (integration)"
            echo "  test-priority.sh        Test skill priority resolution (integration)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# List of tests to run (no external dependencies)
tests=(
    "test-plugin-loading.sh"
    "test-skills-core.sh"
    "test-agents.sh"
    "test-agent-contracts.sh"
    "test-arbiter-skills.sh"
)

# Integration tests (require OpenCode)
integration_tests=(
    "test-tools.sh"
    "test-priority.sh"
)

# Add integration tests if requested
if [ "$RUN_INTEGRATION" = true ]; then
    tests+=("${integration_tests[@]}")
fi

# Filter to specific test if requested
if [ -n "$SPECIFIC_TEST" ]; then
    tests=("$SPECIFIC_TEST")
fi

# Track results
passed=0
failed=0
skipped=0

# Run each test
for test in "${tests[@]}"; do
    echo "----------------------------------------"
    echo "Running: $test"
    echo "----------------------------------------"

    test_path="$SCRIPT_DIR/$test"

    if [ ! -f "$test_path" ]; then
        echo "  [SKIP] Test file not found: $test"
        skipped=$((skipped + 1))
        continue
    fi

    if [ ! -x "$test_path" ]; then
        echo "  Making $test executable..."
        chmod +x "$test_path"
    fi

    start_time=$(date +%s)

    if [ "$VERBOSE" = true ]; then
        if bash "$test_path"; then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [PASS] $test (${duration}s)"
            passed=$((passed + 1))
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo ""
            echo "  [FAIL] $test (${duration}s)"
            failed=$((failed + 1))
        fi
    else
        # Capture output for non-verbose mode
        if output=$(bash "$test_path" 2>&1); then
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [PASS] (${duration}s)"
            passed=$((passed + 1))
        else
            end_time=$(date +%s)
            duration=$((end_time - start_time))
            echo "  [FAIL] (${duration}s)"
            echo ""
            echo "  Output:"
            echo "$output" | sed 's/^/    /'
            failed=$((failed + 1))
        fi
    fi

    echo ""
done

# Print summary
echo "========================================"
echo " Test Results Summary"
echo "========================================"
echo ""
echo "  Passed:  $passed"
echo "  Failed:  $failed"
echo "  Skipped: $skipped"
echo ""

if [ "$RUN_INTEGRATION" = false ] && [ ${#integration_tests[@]} -gt 0 ]; then
    echo "Note: Integration tests were not run."
    echo "Use --integration flag to run tests that require OpenCode."
    echo ""
fi

if [ $failed -gt 0 ]; then
    echo "STATUS: FAILED"
    exit 1
else
    echo "STATUS: PASSED"
fi

echo ""
echo "Refreshing readiness evidence metadata..."
ARBITER_REPO_ROOT="$REPO_ROOT" node "$REPO_ROOT/node_modules/tsx/dist/cli.mjs" "$REPO_ROOT/scripts/arbiter/recalculate-readiness.ts"

echo ""
echo "Running readiness documentation gate..."
if bash "$REPO_ROOT/tests/arbiter/test-doc-links.sh"; then
  echo "Readiness documentation gate passed"
else
  echo "Readiness documentation gate failed"
  exit 1
fi

echo ""
echo "Running readiness score floor gate..."
if bash "$REPO_ROOT/tests/arbiter/test-readiness-scores.sh"; then
  echo "Readiness score floor gate passed"
else
  echo "Readiness score floor gate failed"
  exit 1
fi

echo ""
echo "Running run-epic e2e gate..."
if bash "$REPO_ROOT/tests/arbiter/test-run-epic-e2e.sh"; then
  echo "Run-epic e2e gate passed"
  exit 0
fi

echo "Run-epic e2e gate failed"
exit 1
