---
name: auto-e2e
description: record, replay, manage, and run browser workflows as reusable single-file playwright scripts. use when the user invokes /auto-e2e or /aee to start step-by-step browser recording, capture a named login state, replay a prior record, bind or invoke an alias, list or remove saved scripts, or specify browser runtime options such as incognito, persistent profile reuse, storage-state reuse, or headless mode. keep one persistent live recorder session during recording or replay, maintain an editable step queue, support explicit variables through one params object, and save outputs under the shared user directory `~/.auto-e2e`, including an observed capture mode triggered by `capture` where the user operates the browser directly and the recorder turns those actions into reusable steps.
---

# Auto E2E

## Version

Current skill version: `2.2.1`.

For every future edit to this skill, bump the semantic version and update both:
- `VERSION`
- `CHANGELOG.md`

Use this bump policy:
- patch: wording fixes, clarification, non-behavioral instruction tweaks
- minor: backward-compatible new capabilities, commands, or output files
- major: breaking changes to triggers, generated script contract, save paths, or runtime expectations

Read these references when needed:
- [references/recording-rules.md](references/recording-rules.md) for triggers, session lifecycle, queue handling, storage capture, replay, alias behavior, capture mode, and script management commands.
- [references/recorder-protocol.md](references/recorder-protocol.md) for the thin recorder architecture, stdin JSON protocol, persistent-session rules, state machine, and session-binding requirements.
- [references/browser-runtime.md](references/browser-runtime.md) for profile modes, storage-state reuse, optional storage-state initialization, incognito behavior, and headless handling.
- [references/variables.md](references/variables.md) for explicit variable detection and parameter generation.
- [references/replay.md](references/replay.md) for replay matching, direct replay JSON parsing, expected-outcome checking, and mismatch handling.
- [references/aliases.md](references/aliases.md) for alias binding, package.json storage, ambiguity handling, and direct alias invocation.
- [references/script-management.md](references/script-management.md) for `/aee list` and `/aee rm`.
- [references/storage-states.md](references/storage-states.md) for `/aee storage <name> ...`, reset, append, and credential defaults.
- [references/capture-mode.md](references/capture-mode.md) for the observed capture flow where the user acts directly in the browser, including capture with named credentials, storage-state reuse, profiles, and headless options.
- [assets/package.json](assets/package.json) for the default shared-root package file that must exist under `~/.auto-e2e` and hold alias and storage metadata.
- [scripts/live_recorder.mjs](scripts/live_recorder.mjs) for the bundled thin recorder that must drive all live recording, replay, and storage capture sessions.

## Non-negotiable runtime rule

For live recording, replay, and storage capture, always use the bundled thin recorder in `scripts/live_recorder.mjs`.

Do not implement those live modes by:
- killing and recreating the browser on every user step;
- swapping to a different browser tool mid-session;
- using a browser action that cannot honor the active `storageState`, profile, or headless settings;
- opening a second recorder or ad-hoc browser runtime while `~/.auto-e2e/.live-session.json` says a live session already exists.

Keep one persistent Playwright session alive for the whole run:
- one browser runtime;
- one context;
- one active page;
- multiple step executions sent into that same recorder process over stdin JSON lines;
- one recorder-issued `sessionId` and `runtimeLock` that must be echoed back on every live mutating command.

The recorder now owns the live-session state machine. Treat these lifecycle states as hard boundaries:
- `idle`
- `recording`
- `replaying`
- `storage_capturing`
- `capturing_observed`
- `finishing`
- `finished_open`

Do not send a command that the recorder reports as invalid for the current state.

Only close the live recorder session when:
- the user finishes;
- the user explicitly aborts;
- a fatal recorder error happens and you inform the user;
- cleanup is required after save.

## Session startup rules

Recognize these command families:
- `/auto-e2e <url>` or `/aee <url>` for ordinary recording.
- `/auto-e2e capture <url>` or `/aee capture <url>` for observed capture recording.
- `/auto-e2e replay <query-or-json>` or `/aee replay <query-or-json>` for replay.
- `/auto-e2e storage <name> <url>` or `/aee storage <name> <url>` for login-state capture.
- `/auto-e2e alias <alias-term> <script-query>` or `/aee alias <alias-term> <script-query>` for alias binding.
- `/auto-e2e list` or `/aee list` for script listing.
- `/auto-e2e rm <file>.mjs` or `/aee rm <file>.mjs` for removing a saved script.
- `/auto-e2e <alias-term> ...` or `/aee <alias-term> ...` for direct alias invocation.

Use these example prompt shapes when they match the user request:
- `/aee capture https://example.com 使用凭证 user1`
- `/aee capture https://example.com 复用登录态 user1，不存在就新建`
- `/aee capture https://example.com 复用 profile admin，无头运行`
- `/aee capture https://example.com headed`
- `/aee https://example.com capture 使用凭证 qa-admin`

Before a live session begins:
1. ensure the shared root `~/.auto-e2e/` exists;
2. if the flow is a storage capture, call the recorder-side storage inspection logic first or be ready to handle a hard `storage_decision_required` error when the named file already exists;
2. ensure `~/.auto-e2e/package.json` exists by copying the bundled default when missing;
3. if dependencies are missing, run `npm install` inside `~/.auto-e2e/`;
4. launch `scripts/live_recorder.mjs` in an interactive shell;
5. treat `~/.auto-e2e/` as the shared save root for scripts, records, profiles, and storage-state files;
6. send JSON commands to that recorder over stdin for every subsequent step.

## Live recorder usage

Treat the recorder as the only execution engine for live modes.

Minimum command flow for ordinary recording, replay, or storage capture:
1. `startSession`
2. repeated `executeStep`
3. optional `getState`
4. `finishSession` or `abortSession`
5. `shutdown`

Observed capture flow:
1. `startSession` with `sessionMode: "capture"`
2. repeated `pollCapturedSteps` against the active `sessionId` and `runtimeLock`
3. optional `getState`
4. `finishSession` or `abortSession`
5. `shutdown`

Use `container.exec` with a persistent session name to start the recorder, then `container.feed_chars` to send newline-delimited JSON commands.

When a user sends a new step during recording or replay:
- do not kill the recorder;
- do not open a new browser;
- translate the user step into Playwright code for that one action;
- send it through `executeStep` to the existing recorder process;
- append or remove queue items only after the recorder confirms the action.

## Capture mode rules

When the initial command includes `capture`, invert the normal recording flow:
- the user performs actions directly in the live browser;
- the recorder observes those actions;
- the agent polls `pollCapturedSteps` and turns returned steps into queue items;
- per-step chat updates are best effort only and should not be described as guaranteed.

In capture mode, do not wait for a natural-language step message before updating `stepQueue`. Instead, consume the recorder's observed step feed.

When a capture command also includes runtime hints such as `使用凭证 user1`, `复用登录态 user1`, `复用 profile admin`, `无头运行`, or `显示浏览器`, parse them exactly the same way as ordinary recording. Capture mode does not get a separate runtime system.

## Step recording rules

For each ordinary recording step:
1. translate the user message into one action-oriented Playwright snippet;
2. prefer locator strategies in this order:
   - `getByRole`
   - `getByLabel`
   - `getByPlaceholder`
   - `getByText`
   - `locator(...)`
3. execute the step in the live page first through the recorder;
4. if execution succeeds, append a queue item with both a short description and the final code snippet;
5. after mutating actions, include the standard settle behavior: wait for network idle when possible, then wait one additional second.

If the user says undo or cancel the last step:
- remove only the last queue item;
- do not attempt browser rollback;
- do not restart the recorder;
- tell the user the page must be restored manually if needed.

## Finishing a recording

When the user finishes an observed capture session:
1. stop polling the recorder;
2. if variables or `returnSpec` are still ambiguous, ask one short follow-up after capture rather than interrupting the live capture flow;
3. summarize the workflow meaning into an english lowercase hyphenated basename;
4. write `~/.auto-e2e/<basename>.mjs`;
5. write `~/.auto-e2e/records/<basename>.json` when record mode is on;
6. clean up the recorder unless the user explicitly asks to keep the page open;
7. clear in-memory queue and session state.

When the user finishes a normal recording:
1. summarize the workflow meaning into an english lowercase hyphenated basename;
2. write `~/.auto-e2e/<basename>.mjs`;
3. ensure `~/.auto-e2e/package.json` exists;
4. write `~/.auto-e2e/records/<basename>.json` when record mode is on;
5. if the session used a named credential or a storage-state path as the recording default, persist that default in the generated script runtime contract;
6. clean up the recorder unless the user explicitly asks to keep the page open;
7. clear in-memory queue and session state.

Always return a short completion summary containing:
- skill version;
- script path;
- optional record path;
- required variables;
- browser runtime defaults;
- a runnable CLI example.


## Shared-root path rules

Treat `~/.auto-e2e` as the canonical root across all agents.

Path handling rules:
- expand `~` before using any profile, record, script, or storage-state path;
- resolve relative paths against `~/.auto-e2e`, never against `process.cwd()`;
- do not save state or scripts under a transient workspace path unless the user explicitly requested an absolute custom location.

For storage capture and storage-state initialization:
- save only after the page has settled one final time;
- validate the written JSON file after saving before reporting success;
- if validation fails, treat the save as failed and tell the user.

## Generated script contract

The final script must:
- be a single-file Playwright ESM script;
- default export exactly one async function:

```js
export default async function run(params = {}) {
```

- accept all runtime and business inputs through that one `params` object;
- place browser runtime options under `params.browserRuntime`;
- use legal JSON returns when the user asked to return structured data;
- include a shebang path so the file can be called directly when appropriate;
- close the browser in `finally`.

The generated script file name must be summarized from the workflow meaning, in english lowercase with hyphens, and be stored by default under `~/.auto-e2e/`.

## CLI contract

Keep CLI usage to one JSON string argument.

Example:

```bash
cd ~/.auto-e2e
npm install
node create-work-item-type.mjs '{"name":"缺陷","browserRuntime":{"profileMode":"incognito","headless":false}}'
```

## Safety and consistency rules

- Never silently drop a requested storage state, profile, or alias default.
- Never create an empty placeholder storage-state file.
- Never write a variable sample value as a default unless the user explicitly allows that fallback.
- Never delete a script, alias, or record ambiguously. Ask when unsure.
- Never continue replay after a meaningful mismatch without pausing for user confirmation.
- Never pretend capture mode fully understands unsupported widget types; tell the user when a captured step may need manual cleanup.
