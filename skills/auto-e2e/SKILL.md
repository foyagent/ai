---
name: auto-e2e
description: record, replay, manage, and run browser workflows as reusable single-file playwright scripts. use when the user invokes /auto-e2e or /aee to start step-by-step browser recording, capture a named login state, replay a prior record, bind or invoke an alias, list or remove saved scripts, or specify browser runtime options such as incognito, persistent profile reuse, storage-state reuse, or headless mode. keep one persistent live recorder session during recording or replay, maintain an editable step queue, support explicit variables through one params object, and save outputs under the shared home directory ~/.auto-e2e folder.
---

# Auto E2E

## Version

Current skill version: `2.0.0`.

For every future edit to this skill, bump the semantic version and update both:
- `VERSION`
- `CHANGELOG.md`

Use this bump policy:
- patch: wording fixes, clarification, non-behavioral instruction tweaks
- minor: backward-compatible new capabilities, commands, or output files
- major: breaking changes to triggers, generated script contract, save paths, or runtime expectations

Read these references when needed:
- [references/recording-rules.md](references/recording-rules.md) for triggers, session lifecycle, queue handling, storage capture, replay, alias behavior, and script management commands.
- [references/recorder-protocol.md](references/recorder-protocol.md) for the thin recorder architecture, stdin JSON protocol, and persistent-session rules.
- [references/browser-runtime.md](references/browser-runtime.md) for profile modes, storage-state reuse, optional storage-state initialization, incognito behavior, and headless handling.
- [references/variables.md](references/variables.md) for explicit variable detection and parameter generation.
- [references/replay.md](references/replay.md) for replay matching, direct replay JSON parsing, expected-outcome checking, and mismatch handling.
- [references/aliases.md](references/aliases.md) for alias binding, package.json storage, ambiguity handling, and direct alias invocation.
- [references/script-management.md](references/script-management.md) for `/aee list` and `/aee rm`.
- [references/storage-states.md](references/storage-states.md) for `/aee storage <name> ...`, reset, append, and credential defaults.
- [assets/package.json](assets/package.json) for the default shared-home package file that must exist beside generated scripts and hold alias and storage metadata.
- [scripts/live_recorder.mjs](scripts/live_recorder.mjs) for the bundled thin recorder that must drive all live recording, replay, and storage capture sessions.

## Non-negotiable runtime rule

For live recording, replay, and storage capture, always use the bundled thin recorder in `scripts/live_recorder.mjs`.

Do not implement those live modes by:
- killing and recreating the browser on every user step;
- swapping to a different browser tool mid-session;
- using a browser action that cannot honor the active `storageState`, profile, or headless settings.

Keep one persistent Playwright session alive for the whole run:
- one browser runtime;
- one context;
- one active page;
- multiple step executions sent into that same recorder process over stdin JSON lines.

Only close the live recorder session when:
- the user finishes;
- the user explicitly aborts;
- a fatal recorder error happens and you inform the user;
- cleanup is required after save.

## Session startup rules

Recognize these command families:
- `/auto-e2e <url>` or `/aee <url>` for ordinary recording.
- `/auto-e2e replay <query-or-json>` or `/aee replay <query-or-json>` for replay.
- `/auto-e2e storage <name> <url>` or `/aee storage <name> <url>` for login-state capture.
- `/auto-e2e alias <alias-term> <script-query>` or `/aee alias <alias-term> <script-query>` for alias binding.
- `/auto-e2e list` or `/aee list` for script listing.
- `/auto-e2e rm <file>.mjs` or `/aee rm <file>.mjs` for removing a saved script.
- `/auto-e2e <alias-term> ...` or `/aee <alias-term> ...` for direct alias invocation.

Before a live session begins:
1. ensure the shared home folder `~/.auto-e2e/` exists;
2. ensure `~/.auto-e2e/package.json` exists by copying the bundled default when missing;
3. if the shared home directory has not installed dependencies yet, instruct the agent to run `npm install` inside `~/.auto-e2e/`;
4. launch `scripts/live_recorder.mjs` in an interactive shell with the working directory set to the shared home `~/.auto-e2e/` folder;
5. send JSON commands to that recorder over stdin for every subsequent step.

## Live recorder usage

Treat the recorder as the only execution engine for live modes.

Minimum command flow:
1. `startSession`
2. repeated `executeStep`
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

The generated script file name must be summarized from the workflow meaning, in english lowercase with hyphens, and be stored by default under the shared home directory `~/.auto-e2e/`.

## CLI contract

Keep CLI usage to one JSON string argument.

Example:

```bash
cd auto-e2e
npm install
node create-work-item-type.mjs '{"name":"缺陷","browserRuntime":{"profileMode":"incognito","headless":false}}'
```

## Safety and consistency rules

- Never silently drop a requested storage state, profile, or alias default.
- Never create an empty placeholder storage-state file.
- Never write a variable sample value as a default unless the user explicitly allows that fallback.
- Never delete a script, alias, or record ambiguously. Ask when unsure.
- Never continue replay after a meaningful mismatch without pausing for user confirmation.
