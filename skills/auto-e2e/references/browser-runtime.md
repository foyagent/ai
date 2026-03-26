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
    "headless": false
  }
}
```

Allowed keys:
- `profileMode`: `incognito`, `persistent`, or `storageState`
- `profileDir`: optional string, mainly for `persistent`
- `storageStatePath`: optional string, mainly for `storageState`
- `headless`: optional boolean

## Defaults

If the caller provides nothing, generate runtime helpers that default to:

```json
{
  "profileMode": "incognito",
  "headless": false
}
```

Reasoning:
- incognito-like isolated runs are the safest general default;
- headed mode is best for recording because the user can see the live browser.

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
- require `storageStatePath` when `profileMode` is `storageState`;
- if the user asked to reuse login state but did not give a path, ask for the state file path or a named convention.

## Helper expectations

Require generated scripts to include helper logic that:
- reads `params.browserRuntime ?? {}`;
- resolves defaults;
- validates incompatible combinations;
- launches Playwright correctly for the selected mode;
- always cleans up in `finally`.

Recommended validation examples:
- reject unknown `profileMode`;
- reject `storageState` without `storageStatePath`;
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
