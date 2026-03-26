# Changelog

## 1.7.0 - 2026-03-26
- add dedicated storage-capture commands via `/auto-e2e storage <name> <url>` and `/aee storage <name> <url>` for saving login credentials under `auto-e2e/.auth/` without generating a workflow script
- require an explicit `reset` or `append` decision when a named storage-state file already exists, unless the user already specified one in the command
- define append behavior as loading the existing readable storage-state file, completing extra login flows, and exporting the merged state back to the same path
- keep `initializeStorageStateIfMissing` and other 1.5.0 storage-state initialization rules intact
- treat `使用凭证 <name>` as shorthand for using `auto-e2e/.auth/<name>.json`
- require generated scripts to default to the credential chosen during recording when the runtime caller does not override it
- add optional `autoE2E.storageStates` metadata to the workspace package file for named credential bookkeeping

## 1.5.0 - 2026-03-26
- keep storage-state reuse strict by default and require the file to exist unless the user explicitly asks to initialize it if missing
- add explicit natural-language support for requests like `复用登录态 user1，不存在就新建` and `没有就初始化一个 user1 登录态`
- define named login-state resolution to `auto-e2e/.auth/<name>.json` when initialization is requested without an explicit path
- require real state export after login instead of creating an empty placeholder storage-state file
- extend recording, alias, replay, and CLI guidance so `initializeStorageStateIfMissing` is part of the supported runtime contract

## 1.4.1 - 2026-03-26
- clarify alias-run parsing so business variables and browser runtime preferences are separated consistently
- add richer `/aee <alias> ...` examples covering incognito, persistent profile reuse, storage-state reuse, and headless or headed execution
- document the expected single `params` object shape for alias invocation with `params.browserRuntime`

## 1.4.0 - 2026-03-26
- add browser runtime support for incognito, persistent profile reuse, and storage-state reuse
- add headless or headed runtime control for live recording guidance and generated scripts
- require generated scripts to accept runtime options under `params.browserRuntime` while keeping the single-object API
- require CLI examples and CLI parsing to support both business variables and browser runtime options in the same JSON payload
- add browser-runtime reference guidance and include runtime defaults in recording completion summaries

## 1.3.0 - 2026-03-26
- add direct replay payload parsing for `/auto-e2e replay { ... }` and `/aee replay { ... }`
- accept inline JSON replay baselines instead of searching `auto-e2e/records/` when the replay argument is a JSON object
- validate inline replay payloads and require at least `targetUrl` and `messages` before starting replay
- use the inline payload as the replay verification baseline while preserving the existing natural-language record search flow


## 1.2.1 - 2026-03-26
- require cleanup of the live recording environment after saving unless the user explicitly asks to keep the page open
- require closing the live page, context, and browser created for the run when cleanup applies
- require clearing in-memory session state after save so the next run starts fresh

## 1.2.0 - 2026-03-26
- add alias binding via `/auto-e2e alias ...` and `/aee alias ...`
- store alias metadata in `auto-e2e/package.json` under `autoE2E.aliases`
- resolve direct alias invocation via `/auto-e2e <alias> ...` and `/aee <alias> ...`
- require user confirmation before writing ambiguous alias bindings or replacing an existing alias target
- use stored alias metadata and variable names to guide param mapping during alias invocation

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
