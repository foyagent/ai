# Changelog

## 1.1.0 - 2026-03-26
- add `/aee` as a supported alias for `/auto-e2e`
- add replay mode via `/auto-e2e replay <query>` and `/aee replay <query>`
- use saved files under `auto-e2e/records/` as replay-match candidates
- guide a verification re-recording from the matched record and pause for user confirmation when current behavior diverges from the prior expected result

## 1.0.0 - 2026-03-26
- establish the first semantic-versioned release for this skill
- keep generated scripts in the agent workspace `auto-e2e/` folder with bundled `package.json`
- support explicit variable extraction into a single `params` object
- prevent recorded variable sample values from becoming runtime defaults unless the user explicitly allows that fallback
- add optional `record` start flag to save raw user and agent messages for the recording session into `auto-e2e/records/<script-basename>.json`
