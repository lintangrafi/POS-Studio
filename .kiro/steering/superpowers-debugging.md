---
inclusion: manual
---

# Superpowers: Systematic Debugging

Use when encountering any bug, test failure, or unexpected behavior. Find root cause BEFORE attempting fixes.

## The Iron Law

```
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST
```

## The Four Phases

### Phase 1: Root Cause Investigation

1. **Read error messages carefully** — don't skip past them, read stack traces completely
2. **Reproduce consistently** — can you trigger it reliably? What are the exact steps?
3. **Check recent changes** — git diff, recent commits, new dependencies, config changes
4. **Gather evidence** — add diagnostic logging at component boundaries
5. **Trace data flow** — where does the bad value originate? Keep tracing up to the source.

### Phase 2: Pattern Analysis

1. **Find working examples** — locate similar working code in same codebase
2. **Compare against references** — read reference implementations completely
3. **Identify differences** — list every difference between working and broken
4. **Understand dependencies** — what components, settings, config does this need?

### Phase 3: Hypothesis and Testing

1. **Form single hypothesis** — "I think X is the root cause because Y"
2. **Test minimally** — smallest possible change, one variable at a time
3. **Verify before continuing** — worked? Move to Phase 4. Didn't? New hypothesis.

### Phase 4: Implementation

1. **Create failing test case** — simplest possible reproduction
2. **Implement single fix** — address root cause, ONE change at a time
3. **Verify fix** — test passes? No other tests broken?
4. **If 3+ fixes failed** — STOP. Question the architecture. Discuss before attempting more.

## Red Flags — STOP and Return to Phase 1

- "Quick fix for now, investigate later"
- "Just try changing X and see if it works"
- "It's probably X, let me fix that"
- "I don't fully understand but this might work"
- Proposing solutions before tracing data flow
- Each fix reveals new problem in different place

## Quick Reference

| Phase | Key Activities | Success Criteria |
|-------|---------------|------------------|
| 1. Root Cause | Read errors, reproduce, check changes | Understand WHAT and WHY |
| 2. Pattern | Find working examples, compare | Identify differences |
| 3. Hypothesis | Form theory, test minimally | Confirmed or rejected |
| 4. Implementation | Create test, fix, verify | Bug resolved, tests pass |

## Source

Adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.
