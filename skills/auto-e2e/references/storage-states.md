# Storage State Rules

## Purpose

Storage states are named login-state files stored under:
- `~/.auto-e2e/.auth/<name>.json`

They capture cookies, local storage, and related persisted browser state for later reuse.

## Dedicated capture command

Recognize:
- `/aee storage user1 https://example.com/login`
- `/aee storage user1 reset https://example.com/login`
- `/aee storage user1 append https://example.com/login`

## Existing-file policy

If the named file already exists and the user did not say `reset` or `append`, ask which behavior they want.

### reset

Use a fresh session and overwrite the file at finish.

### append

Load the existing storage-state file into the recorder session, continue the workflow in that same context, and overwrite the file with the resulting merged state.

This supports cases like:
- first capture website A into `user1`;
- later append website B into `user1`.

## Credential defaults in scripts

If the user recorded a workflow while explicitly using a credential like `user1`, the generated script should treat that credential as the default runtime storage choice when the caller does not pass a different one.

The caller can still override it by passing a different `params.browserRuntime`.
