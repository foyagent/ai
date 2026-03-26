# Versioning Rules

## Current version

`2.0.0`

## Required files

Keep the skill version synchronized in all of these places:
- `VERSION`
- `CHANGELOG.md`
- the version callout near the top of `SKILL.md`
- any example record JSON that exposes `skillVersion`
- any example alias metadata that exposes `autoE2E.skillVersion`

## Semantic version policy

Use semantic versioning:
- major: breaking changes to triggers, runtime contract, output paths, or file formats
- minor: backward-compatible new features or commands
- patch: corrections, clarifications, examples, and non-breaking improvements
