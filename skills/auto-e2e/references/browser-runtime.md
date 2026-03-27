# Browser Runtime Rules

## Defaults

Unless the user says otherwise, use:

```json
{
  "profileMode": "incognito",
  "headless": false,
  "initializeStorageStateIfMissing": false
}
```

## Supported profile modes

### incognito

Use a fresh non-persistent context. This is the default.

### persistent

Use a persistent profile directory.

If the user says:
- `复用 profile admin`
- `reuse profile admin`

Interpret as:

```json
{
  "profileMode": "persistent",
  "profileDir": "~/.auto-e2e/profiles/admin"
}
```

### storageState

Use a storage-state file.

If the user says:
- `复用登录态 ~/.auto-e2e/.auth/user1.json`
- `复用登录态 user1`
- `使用凭证 user1`

Interpret as:

```json
{
  "profileMode": "storageState",
  "storageStateName": "user1",
  "storageStatePath": "~/.auto-e2e/.auth/user1.json"
}
```

## Missing storage-state initialization

Default behavior is strict:
- if the file does not exist, do not silently create an empty one;
- tell the user they need an existing file or must explicitly ask to initialize one.

Only enable initialization when the user clearly says something like:
- `复用登录态 user1，不存在就新建`
- `没有就初始化一个 user1 登录态`
- `if missing create it`

Interpret as:

```json
{
  "profileMode": "storageState",
  "storageStateName": "user1",
  "storageStatePath": "~/.auto-e2e/.auth/user1.json",
  "initializeStorageStateIfMissing": true
}
```

Rules:
- do not create a placeholder file at start time;
- start from a fresh context when the file is missing and initialization was explicitly allowed;
- let the user finish the real login flow;
- save the real storage state at finish time.

## Named credential defaults in generated scripts

If the user recorded a workflow while explicitly using a named credential or a storage-state path, treat that as the script's runtime default unless the user later overrides it.

Generated scripts should therefore default to the recorded credential when runtime input omits a storage choice, while still allowing explicit override through `params.browserRuntime`.

## Headless handling

Recognize:
- `headless`
- `无头模式`
- `无头运行`

Map to:

```json
{
  "headless": true
}
```

Recognize:
- `headed`
- `有头模式`
- `显示浏览器`

Map to:

```json
{
  "headless": false
}
```

## CLI contract

Runtime options stay under `params.browserRuntime`.

Example:

```bash
node create-card.mjs '{"cardTitle":"新品提卡","browserRuntime":{"profileMode":"storageState","storageStatePath":"~/.auto-e2e/.auth/user1.json","initializeStorageStateIfMissing":true,"headless":false}}'
```


## Shared-root resolution

For all runtime file paths:
- expand `~` first;
- resolve relative paths against `~/.auto-e2e`;
- never resolve storage or profile paths against the current shell working directory.

## Capture-mode parity

Capture mode uses the exact same runtime parsing as ordinary recording, replay, and alias invocation.

Examples:
- `/aee capture https://example.com 使用凭证 user1`
- `/aee capture https://example.com 复用登录态 user1，不存在就新建`
- `/aee capture https://example.com 复用 profile admin，无头运行`
- `/aee capture https://example.com 显示浏览器`

Do not tell users that capture mode cannot use credentials, profiles, or storage-state initialization. It can.
