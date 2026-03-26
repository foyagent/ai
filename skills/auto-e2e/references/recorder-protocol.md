# Thin Recorder Protocol

## Goal

The bundled `scripts/live_recorder.mjs` is the only live execution engine for:
- recording;
- replay;
- storage capture.

It is intentionally thin:
- the agent understands natural language;
- the recorder only manages one persistent Playwright session and executes structured commands.

## Why this exists

The recorder prevents these failure modes:
- killing the browser when the user sends the next step;
- reopening a browser without the current `storageState`;
- switching to a different browser tool mid-session;
- losing runtime state because each step was executed in a fresh temporary script.

## Launch pattern

Run the recorder in an interactive shell with the shared home directory `~/.auto-e2e/` as the current working directory so `playwright` resolves from that shared home package.

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

Each response line is JSON with the same `id`:

```json
{
  "id": "msg-1",
  "ok": true,
  "result": {}
}
```

If a command fails, the response should be:

```json
{
  "id": "msg-1",
  "ok": false,
  "error": {
    "message": "..."
  }
}
```

## Supported commands

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

### executeStep

Payload:

```json
{
  "description": "click create",
  "code": "await page.getByRole('button', { name: 'Create' }).click();\nawait helpers.settle();"
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

### getState

Return the current session metadata and page snapshot without mutating the page.

### saveStorageState

Payload:

```json
{
  "path": "~/.auto-e2e/.auth/user1.json"
}
```

Save the current context storage state to the given path.

### finishSession

Optional payload:

```json
{
  "keepOpen": false
}
```

Rules:
- if the session has a pending storage-state initialization target, save it before cleanup;
- if `keepOpen` is false, close the session;
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
