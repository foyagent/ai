# Thin Recorder Protocol

## Goal

The bundled `scripts/live_recorder.mjs` is the only live execution engine for:
- recording;
- replay;
- storage capture.
- observed capture.

It is intentionally thin:
- the agent understands natural language;
- the recorder only manages one persistent Playwright session and executes structured commands.

## Why this exists

The recorder prevents these failure modes:
- killing the browser when the user sends the next step;
- reopening a browser without the current `storageState`;
- switching to a different browser tool mid-session;
- losing runtime state because each step was executed in a fresh temporary script.

## Live-session lock

The recorder writes a lock file at:
- `~/.auto-e2e/.live-session.json`

The lock represents the one allowed active live browser runtime. If another recorder tries to start while that lock belongs to a live process, the recorder must raise a hard error with code:
- `cross_runtime_fallback_forbidden`

Treat that as a stop signal, not as a reason to silently open a second browser.

## Launch pattern

Run the recorder in an interactive shell. The recorder itself resolves relative script, profile, record, and storage-state paths from `~/.auto-e2e`, and tries to load `playwright` from `~/.auto-e2e/package.json` before falling back to the current working directory.

Then send newline-delimited JSON commands to stdin.

## Command envelope

Each request line must be a JSON object like:

```json
{
  "id": "msg-1",
  "command": "startSession",
  "payload": {}
}
```

Each response line is JSON with the same `id`.

## Recorder lifecycle states

The recorder owns a hard state machine:
- `idle`
- `recording`
- `replaying`
- `storage_capturing`
- `capturing_observed`
- `finishing`
- `finished_open`

If a command is not valid in the current state, the recorder returns an error with code:
- `invalid_state_transition`

Do not work around that by starting a new browser runtime.

## Session binding

When `startSession` succeeds, the recorder returns:
- `sessionId`
- `runtimeLock`

Every live mutating command must echo both values back:
- `executeStep`
- `saveStorageState`
- `finishSession`
- `abortSession`

If they do not match the active session, the recorder raises a hard error with code:
- `cross_runtime_fallback_forbidden`

This is how the recorder prevents steps from drifting onto a fresh runtime.

## Supported commands

### inspectStorageTarget

Payload:

```json
{
  "storageStatePath": "~/.auto-e2e/.auth/user1.json"
}
```

Return whether the file exists, whether it is valid Playwright `storageState` JSON, and whether the caller must ask for `reset` or `append`.

### startSession

Payload:

```json
{
  "sessionMode": "record",
  "targetUrl": "https://example.com",
  "browserRuntime": {
    "profileMode": "incognito",
    "headless": false
  }
}
```

Rules:
- starts one persistent session;
- reuses the chosen runtime for the whole session;
- opens the target URL when provided;
- may prepare pending storage-state initialization when requested.

For storage capture:
- if the target file already exists and no explicit `storageBehavior` was given, return a hard error with code `storage_decision_required`;
- only `reset` or `append` are valid explicit decisions.

For observed capture:
- use `sessionMode: "capture"`;
- install DOM observers into the active page and future navigations;
- keep returning the same `sessionId` and `runtimeLock` for the whole run;
- do not require `executeStep` for user-driven actions.

### executeStep

Payload:

```json
{
  "sessionId": "...",
  "runtimeLock": "...",
  "description": "click create",
  "code": "await page.getByRole('button', { name: 'Create' }).click();
await helpers.settle();"
}
```

Rules:
- `code` is Playwright JavaScript that can use:
  - `page`
  - `context`
  - `browser`
  - `session`
  - `helpers`
- `helpers` exposes at least:
  - `settle()`
  - `snapshot()`
- the recorder executes the code inside the existing session and returns a new snapshot.

### pollCapturedSteps

Only valid while the recorder lifecycle state is `capturing_observed`.

Payload:

```json
{
  "sessionId": "...",
  "runtimeLock": "...",
  "cursor": 0,
  "timeoutMs": 15000
}
```

Rules:
- block for up to `timeoutMs` waiting for newly observed steps or browser closure;
- return only steps after the supplied cursor;
- return `browserClosed: true` when the user manually closes the page, context, or browser;
- do not silently fabricate steps when no observed event arrived.

### getState

Return the current session metadata and page snapshot without mutating the page.

### saveStorageState

Payload:

```json
{
  "sessionId": "...",
  "runtimeLock": "...",
  "path": "~/.auto-e2e/.auth/user1.json"
}
```

Save the current context storage state to the given path.

### finishSession

Optional payload:

```json
{
  "sessionId": "...",
  "runtimeLock": "...",
  "keepOpen": false
}
```

Rules:
- if the session has a pending storage-state initialization target, save it before cleanup;
- if capture mode is active, include the captured step count in the final metadata;
- if `keepOpen` is false, close the session;
- if `keepOpen` is true, keep the same runtime open and move to `finished_open`;
- return final metadata.

### abortSession

Abort the live session and close it immediately.

### shutdown

Close any remaining session and exit the recorder process.

## Failure handling

If the recorder exits unexpectedly:
- tell the user the live session died;
- do not silently reopen a fresh browser and continue as if nothing happened;
- if recovery is attempted, explicitly preserve the original `browserRuntime` and tell the user what was recovered and what was lost.

## Path and save guarantees

The recorder must:
- expand `~` in any incoming path;
- resolve any relative path from `~/.auto-e2e`, never from `process.cwd()`;
- validate existing storage-state files before using them for append or reuse;
- perform a final settle before writing pending storage state;
- re-read the written storage-state file and validate its JSON structure before reporting success.
