# Browser Runtime Rules

## Goal

Support browser runtime preferences consistently in:
- live recording;
- replay;
- alias-run guidance;
- generated script runtime;
- CLI JSON input.

Keep all runtime controls under `params.browserRuntime`.

## Contract

Use this shape:

```json
{
  "browserRuntime": {
    "profileMode": "incognito",
    "profileDir": "auto-e2e/profiles/admin",
    "storageStatePath": "auto-e2e/.auth/admin.json",
    "storageStateName": null,
    "initializeStorageStateIfMissing": false,
    "headless": false
  }
}
```

Allowed keys:
- `profileMode`: `incognito`, `persistent`, or `storageState`
- `profileDir`: optional string, mainly for `persistent`
- `storageStatePath`: optional string, mainly for `storageState`
- `storageStateName`: optional string helper when the user refers to a named login-state such as `user1`
- `initializeStorageStateIfMissing`: optional boolean, default false
- `headless`: optional boolean

## Defaults

Generated runtime helpers should default in this order:

1. if the recording or replay re-recording explicitly captured a runtime choice, use that captured runtime as the script default;
2. otherwise fall back to:

```json
{
  "profileMode": "incognito",
  "headless": false
}
```

Reasoning:
- incognito-like isolated runs are the safest general default;
- headed mode is best for recording because the user can see the live browser;
- when the user intentionally recorded with a named credential or other runtime choice, later execution should reuse that choice unless the caller overrides it.

## Launch behavior

Generate helpers equivalent to these rules:

### Incognito

Use a normal browser launch plus a fresh isolated context.

Behavior:
- `browser = await chromium.launch({ headless })`
- `context = await browser.newContext()`
- `page = await context.newPage()`

### Persistent profile

Use a persistent context.

Behavior:
- `context = await chromium.launchPersistentContext(profileDir, { headless })`
- `page = context.pages()[0] ?? await context.newPage()`

Rules:
- require a dedicated `profileDir`;
- if the user says “复用 profile admin” and gives no path, use `auto-e2e/profiles/admin`;
- do not point at the machine's real default Chrome profile automatically.

### Storage-state reuse

Use a normal browser launch plus a new context with `storageState`.

Behavior:
- `browser = await chromium.launch({ headless })`
- `context = await browser.newContext({ storageState: storageStatePath })`
- `page = await context.newPage()`

Rules:
- require a resolvable state target when `profileMode` is `storageState`;
- if the user asked to reuse login state but did not give a path, ask for the state file path or a named convention;
- default to strict reuse: if the resolved file is missing, stop and tell the user to provide or initialize it;
- only enable auto-initialization when the user explicitly says phrases like `不存在就新建`, `没有就初始化`, or `if missing create it`;
- when the user says a simple name such as `user1` and explicitly wants initialization if missing, resolve it to `auto-e2e/.auth/user1.json`;
- when initialization is enabled and the file does not exist, let the user complete the login flow and then save a real exported storage state to that path;
- never create an empty placeholder JSON file just to satisfy the path requirement.
- treat `使用凭证 user1`, `credential user1`, or `use credential user1` as shorthand for `profileMode = "storageState"` with `storageStateName = "user1"` and resolved path `auto-e2e/.auth/user1.json`;
- if a workflow was recorded while explicitly using a storage-state credential, make that resolved storage-state choice the generated script default unless the runtime caller overrides it.

## Helper expectations

Require generated scripts to include helper logic that:
- reads `params.browserRuntime ?? {}`;
- resolves defaults;
- validates incompatible combinations;
- launches Playwright correctly for the selected mode;
- always cleans up in `finally`.

Recommended validation examples:
- reject unknown `profileMode`;
- reject `storageState` without either `storageStatePath` or a resolvable `storageStateName`;
- reject `persistent` without a resolvable `profileDir`.

## CLI contract

CLI still accepts exactly one JSON string argument.

That JSON object may include both business variables and browser runtime options.

Example:

```bash
node create-card.mjs '{"cardTitle":"新品提卡","amount":100,"browserRuntime":{"profileMode":"persistent","profileDir":"auto-e2e/profiles/admin","headless":true}}'
```

This means:
- reuse the named persistent profile;
- run in headless mode;
- keep the same single-object API.

## Recording summary guidance

When the user finishes recording, mention the runtime defaults and any explicit runtime choice that was captured.

Good examples:
- `runtime: incognito, headed`
- `runtime: persistent profile auto-e2e/profiles/admin, headless`
- `runtime: storageState auto-e2e/.auth/user.json, headed`



## Alias-run parsing examples

When the user invokes a bound alias, keep runtime parsing identical to ordinary recording and CLI parsing.

Examples:
- `/aee 提卡 标题是新品提卡，用隐身模式`
  - business data stays in top-level params
  - runtime becomes `{ "profileMode": "incognito" }`
- `/aee 提卡 标题是新品提卡，复用 profile admin，无头模式`
  - runtime becomes `{ "profileMode": "persistent", "profileDir": "auto-e2e/profiles/admin", "headless": true }`
- `/aee 提卡 标题是新品提卡，复用登录态 auto-e2e/.auth/user.json，显示浏览器`
  - runtime becomes `{ "profileMode": "storageState", "storageStatePath": "auto-e2e/.auth/user.json", "headless": false }`
- `/aee 提卡 标题是新品提卡，复用登录态 user1，不存在就新建`
  - runtime becomes `{ "profileMode": "storageState", "storageStateName": "user1", "storageStatePath": "auto-e2e/.auth/user1.json", "initializeStorageStateIfMissing": true }`

If the user names both a persistent profile and a storage-state file in the same request, stop and ask them to choose one.


## Generated-script guidance for optional initialization

When generated scripts support login-state initialization, keep the single-object API and allow this form:

```bash
node create-card.mjs '{"cardTitle":"新品提卡","browserRuntime":{"profileMode":"storageState","storageStatePath":"auto-e2e/.auth/user1.json","initializeStorageStateIfMissing":true,"headless":false}}'
```

Expected behavior:
- if the file exists, reuse it;
- if the file is missing and `initializeStorageStateIfMissing` is false or absent, throw a clear error;
- if the file is missing and `initializeStorageStateIfMissing` is true, proceed with a clean context, let the run establish the desired authenticated state, then save the resulting storage state to the target path before cleanup.


## Storage-capture command relationship

The dedicated commands `/auto-e2e storage <name> <url>` and `/aee storage <name> <url>` are for capturing or extending named storage-state files under `auto-e2e/.auth/` without generating a script.

Use these rules together with [storage-states.md](storage-states.md):
- plain `storage <name> <url>` creates a new state when missing;
- if the named file already exists and the user did not say `reset` or `append`, ask which one they want;
- `reset` overwrites from a clean context;
- `append` starts from the existing state and saves the merged result back to the same file.
