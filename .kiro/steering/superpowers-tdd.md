---
inclusion: manual
---

# Superpowers: Test-Driven Development

Use when implementing any feature or bugfix. Write the test first. Watch it fail. Write minimal code to pass.

## The Iron Law

```
NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST
```

Write code before the test? Delete it. Start over. No exceptions.

## Red-Green-Refactor Cycle

### RED — Write Failing Test
- Write one minimal test showing what should happen
- One behavior per test
- Clear name describing the behavior
- Use real code (no mocks unless unavoidable)

### Verify RED — Watch It Fail (MANDATORY)
- Run the test, confirm it fails
- Failure message is expected (feature missing, not typo)
- If test passes immediately → you're testing existing behavior, fix the test

### GREEN — Minimal Code
- Write the simplest code to pass the test
- Don't add features beyond what the test requires
- Don't refactor other code
- Don't "improve" beyond the test

### Verify GREEN — Watch It Pass (MANDATORY)
- Run the test, confirm it passes
- Confirm other tests still pass
- Output pristine (no errors, warnings)

### REFACTOR — Clean Up
- Only after green
- Remove duplication, improve names, extract helpers
- Keep tests green throughout
- Don't add behavior

## Common Rationalizations to Reject

| Excuse | Reality |
|--------|---------|
| "Too simple to test" | Simple code breaks. Test takes 30 seconds. |
| "I'll test after" | Tests passing immediately prove nothing. |
| "Need to explore first" | Fine. Throw away exploration, start with TDD. |
| "TDD will slow me down" | TDD is faster than debugging. |

## Bug Fix Example

1. **RED**: Write test that exposes the bug
2. **Verify RED**: Confirm it fails as expected
3. **GREEN**: Fix the bug with minimal code
4. **Verify GREEN**: Confirm test passes
5. **REFACTOR**: Clean up if needed

## Source

Adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.
