# Recording Rules

## Supported top-level commands

Recognize these command families:
- `/auto-e2e <url>` and `/aee <url>`
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
4. avoid browser-tool fallbacks that lose the active runtime state.

Do not create a new temporary Playwright script for every user step.
Do not kill the recorder just because the user sent the next instruction.
Do not reopen the browser with a tool that cannot honor `storageState`, persistent profile reuse, or headless settings.

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
- `matchedRecord`
- `credentialDefault`

Queue items should look like:

```json
{
  "description": "click the create button",
  "code": "await page.getByRole('button', { name: 'Create' }).click();\nawait settle(page);"
}
```

## Per-step execution flow

For each actionable user step in a live session:
1. parse the user's natural language into one action-oriented Playwright snippet;
2. if the step mentions a variable explicitly, resolve the recording sample value and the runtime variable name;
3. send the snippet to the recorder with `executeStep`;
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
- if the file does not exist, start a fresh capture session and save into that path at finish;
- if the file exists and the user did not say `reset` or `append`, ask which one they want;
- `reset` means discard prior state and capture fresh state into the same path;
- `append` means start the live session by loading the existing storage state, continue login or consent flows in the same context, then overwrite the file with the merged resulting state.

If append was requested but the file is unreadable or invalid, stop and tell the user to choose `reset` or repair the file.

Storage capture mode does not generate a workflow script. It only saves the state file and optionally updates package metadata.

## Finish behavior

### Ordinary recording finish

When the user says they are done:
1. derive the basename;
2. write the script file;
3. write the record file when record mode is on;
4. update shared-home metadata such as aliases or named storage states if needed;
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
