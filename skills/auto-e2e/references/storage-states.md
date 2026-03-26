# Storage-State Capture Rules

## Purpose

Support a dedicated command for capturing named login-state files without generating a Playwright workflow script.

Command forms:
- `/auto-e2e storage <name> <url>`
- `/aee storage <name> <url>`
- `/auto-e2e storage <name> reset <url>`
- `/aee storage <name> reset <url>`
- `/auto-e2e storage <name> append <url>`
- `/aee storage <name> append <url>`

Resolve `<name>` to `auto-e2e/.auth/<name>.json` unless the user explicitly overrides the path.

## Mode semantics

Treat this as a dedicated `storage-capture` session mode.

Session state should include:

```json
{
  "mode": "storage-capture",
  "storageName": "user1",
  "targetUrl": "https://example.com/login",
  "storageAction": "create",
  "resolvedStorageStatePath": "auto-e2e/.auth/user1.json",
  "browserRuntime": {
    "profileMode": "incognito",
    "storageStatePath": null,
    "storageStateName": null,
    "initializeStorageStateIfMissing": false,
    "headless": false
  }
}
```

This mode is for acquiring or extending authenticated state. Do not create a step queue for script generation.

## Existing-file handling

When `auto-e2e/.auth/<name>.json` does not exist:
- default `storageAction` to `create`;
- open a clean visible browser session;
- let the user complete the login flow;
- save the resulting Playwright storage state into that path.

When the target file already exists and the user did not specify `reset` or `append`:
- stop and ask which behavior they want;
- offer only `reset` or `append`.

When the user specifies `reset`:
- ignore the prior file contents;
- start from a clean context;
- overwrite the target file with the new exported state after login completes.

When the user specifies `append`:
- require the existing file to be readable and valid JSON for Playwright storage-state reuse;
- start a context from that existing storage-state file;
- let the user complete extra login or consent flows for the new site;
- export the final merged state back into the same file.

If the user asks for `append` but the file does not exist:
- do not silently switch to create;
- tell the user the named state does not exist yet and offer `reset` or a plain create flow instead.

If the file exists but is unreadable or invalid and the user asked for `append`:
- stop and tell the user the existing state cannot be appended safely;
- offer `reset` or manual repair.

## Finish behavior

When the user finishes a storage-capture session:
- do not generate `auto-e2e/<script>.mjs`;
- do not generate `auto-e2e/records/<name>.json` unless the user explicitly asked to record the conversation for a separate reason;
- save the real Playwright storage state to the resolved `.auth` path;
- update `auto-e2e/package.json` under `autoE2E.storageStates.<name>` with metadata when package.json exists or is being created;
- return a concise summary with the storage name, saved path, action (`create`, `reset`, or `append`), target URL, and runtime mode used.

Suggested metadata shape:

```json
{
  "autoE2E": {
    "storageStates": {
      "user1": {
        "path": "auto-e2e/.auth/user1.json",
        "lastTargetUrl": "https://example.com/login",
        "updatedAt": "2026-03-26T00:00:00Z"
      }
    }
  }
}
```

## Relationship to ordinary recording and run modes

If an ordinary recording or replay re-recording explicitly uses a named credential such as `user1` or a resolved storage-state path:
- preserve that choice in the generated script as the runtime default;
- when later CLI or programmatic calls omit `params.browserRuntime`, default to the credential selected during recording;
- still allow callers to override the runtime choice explicitly at execution time.

This means a workflow recorded with `使用凭证 user1` should default to:

```json
{
  "browserRuntime": {
    "profileMode": "storageState",
    "storageStateName": "user1",
    "storageStatePath": "auto-e2e/.auth/user1.json",
    "headless": false
  }
}
```

unless the caller provides a different runtime configuration.
