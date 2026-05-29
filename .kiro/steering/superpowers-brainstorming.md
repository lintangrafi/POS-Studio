---
inclusion: manual
---

# Superpowers: Brainstorming Skill

Use this before any creative work — creating features, building components, adding functionality, or modifying behavior. Explores user intent, requirements and design before implementation.

## Hard Gate

Do NOT write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.

## Process

1. **Explore project context** — check files, docs, recent commits
2. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present design** — in sections scaled to complexity, get user approval after each section
5. **Write design doc** — save to `docs/designs/YYYY-MM-DD-<topic>-design.md`
6. **Transition to implementation** — create implementation plan

## Key Principles

- **One question at a time** — Don't overwhelm with multiple questions
- **Multiple choice preferred** — Easier to answer than open-ended when possible
- **YAGNI ruthlessly** — Remove unnecessary features from all designs
- **Explore alternatives** — Always propose 2-3 approaches before settling
- **Incremental validation** — Present design, get approval before moving on
- **Design for isolation** — Break system into smaller units with clear boundaries

## Design Presentation

- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing

## Working in Existing Codebases

- Explore the current structure before proposing changes
- Follow existing patterns
- Where existing code has problems that affect the work, include targeted improvements as part of the design
- Don't propose unrelated refactoring

## Source

Adapted from [Superpowers](https://github.com/obra/superpowers) by Jesse Vincent.
