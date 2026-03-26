# Versioning Rules

## Current version

`1.4.0`

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
- minor: backward-compatible new features or flags
- patch: corrections, clarifications, examples, and non-breaking improvements

## Update procedure

Whenever the skill is edited:
1. decide whether the change is major, minor, or patch;
2. bump the version string consistently in every required location;
3. add a new top entry to `CHANGELOG.md` with date and summary;
4. ensure any new example JSON or sample output reflects the bumped version.
