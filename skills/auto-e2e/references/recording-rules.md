# Recording Rules

## Supported top-level commands

Recognize these command families:
- `/auto-e2e <url>` and `/aee <url>`
- `/auto-e2e capture <url>` and `/aee capture <url>`
- `/auto-e2e <url> capture` and `/aee <url> capture`
- `/auto-e2e replay <query-or-json>` and `/aee replay <query-or-json>`
- `/auto-e2e storage <name> <url>` and `/aee storage <name> <url>`
- `/auto-e2e alias <alias-term> <script-query>` and `/aee alias <alias-term> <script-query>`
- `/auto-e2e list` and `/aee list`
- `/auto-e2e rm <file>.mjs` and `/aee rm <file>.mjs`
- direct alias run via `/auto-e2e <alias-term> ...` and `/aee <alias-term> ...`

## Session modes

Support these live modes:
- `record`
- `replay`
- `storage`
- `capture`

Support these non-live modes:
- `alias-bind`
- `alias-run`
- `list`
- `rm`

## Persistent recorder requirement

For live modes, always use the bundled recorder process. The agent must:
1. start one recorder process;
2. keep it alive for the whole session;
3. send each step through stdin JSON;
4. avoid browser-tool fallbacks that lose the active runtime state;
5. keep and reuse the recorder-issued `sessionId` and `runtimeLock` on every live mutating command.

Do not create a new temporary Playwright script for every user step.
Do not kill the recorder just because the user sent the next instruction.
Do not reopen the browser with a tool that cannot honor `storageState`, persistent profile reuse, or headless settings.
If the recorder reports `cross_runtime_fallback_forbidden`, stop and explain the conflict instead of opening another browser.

## Observed capture mode

In capture mode, the user performs actions directly in the browser and the recorder observes them.

Agent behavior in this mode:
1. start the recorder with `sessionMode: "capture"`;
2. keep polling `pollCapturedSteps` with the active `sessionId`, `runtimeLock`, and current cursor;
3. append newly returned observed steps into `stepQueue`;
4. send concise user-facing summaries when the chat surface allows it, but treat those updates as best effort only;
5. finish when the user sends an explicit finish message or the recorder reports `browserClosed: true`.

Do not require the user to narrate every step during an observed capture run.
Do not silently guess variables from observed literal input values; defer variable extraction until after capture.

## Queue state

Maintain in-memory state for the current session:
- `sessionMode`
- `targetUrl`
- `recordMode`
- `stepQueue[]`
- `variables[]`
- `returnSpec`
- `scriptBasename`
- `browserRuntime`
- `recordMessages[]`
- `captureCursor`
- `matchedRecord`
- `credentialDefault`
- `recorderSessionId`
- `recorderRuntimeLock`

Queue items should look like:

```json
{
  "description": "click the create button",
  "code": "await page.getByRole('button', { name: 'Create' }).click();
await settle(page);"
}
```

## Per-step execution flow

For each actionable user step in an ordinary live session:
1. parse the user's natural language into one action-oriented Playwright snippet;
2. if the step mentions a variable explicitly, resolve the recording sample value and the runtime variable name;
3. send the snippet to the recorder with `executeStep`, including the active `sessionId` and `runtimeLock`;
4. inspect the recorder response;
5. only if it succeeded, update `stepQueue` or replay progress;
6. if the step failed, explain the failure and do not mutate the queue.

## Record mode

When the initial command includes `record`, capture raw user and agent messages for the live session.

At finish time, write:
- `~/.auto-e2e/records/<basename>.json`

The record file should include:
- `skillVersion`
- `targetUrl`
- `scriptFile`
- `recordFile`
- `variables`
- `returnSpec`
- `browserRuntime`
- `messages`

## Storage capture mode

Recognize:
- `/aee storage user1 https://example.com`
- `/aee storage user1 reset https://example.com`
- `/aee storage user1 append https://example.com`

Resolution rules:
- the credential name `user1` maps to `~/.auto-e2e/.auth/user1.json`;
- first inspect the target with the recorder-side storage inspection logic;
- if the file does not exist, start a fresh capture session and save into that path at finish;
- if the file exists and the user did not say `reset` or `append`, stop and ask which one they want, or surface the recorder's `storage_decision_required` error;
- `reset` means discard prior state and capture fresh state into the same path;
- `append` means start the live session by loading the existing storage state, continue login or consent flows in the same context, then overwrite the file with the merged resulting state.

If append was requested but the file is unreadable or invalid, stop and tell the user to choose `reset` or repair the file.
Storage capture mode does not generate a workflow script. It only saves the state file and optionally updates package metadata.

## Finish behavior

### Capture-mode finish

When an observed capture run ends:
1. stop polling the recorder;
2. if the recorder reported `browserClosed: true`, treat that as a user-initiated finish signal rather than an automatic failure;
3. optionally ask one short post-capture question for variable extraction or return data if needed;
4. generate the final script and optional record file using the captured `stepQueue`;
5. clean up the recorder unless the user explicitly asks to keep the browser open;
6. clear in-memory session state.

### Ordinary recording finish

When the user says they are done:
1. derive the basename;
2. write the script file;
3. write the record file when record mode is on;
4. update shared-root metadata such as aliases or named storage states if needed;
5. close the recorder unless the user explicitly wants to keep the page open;
6. clear session memory.

### Storage capture finish

At the end of a storage capture session:
1. tell the recorder to save the storage state into the resolved path;
2. update `~/.auto-e2e/package.json` metadata for that named credential;
3. return a short summary including the credential name and path;
4. clean up the recorder unless the user explicitly wants to keep the page open;
5. clear session memory.

## Cleanup rules

After saving a record, replay result, or storage capture, clean up the live browser environment by default:
- close the active page if needed;
- close the active context;
- close the active browser process when applicable;
- stop the recorder process;
- clear in-memory session state.

Only skip cleanup when the user explicitly asks to keep the page open.

## Storage reliability guardrails

When storage capture or storage-state initialization is active:
- do not report success until the recorder has saved and re-read the state file successfully;
- if the target path begins with `~`, expand it before passing it to the recorder;
- if a relative path is used, resolve it from `~/.auto-e2e`;
- if append was requested, validate the existing file before starting the browser context.
