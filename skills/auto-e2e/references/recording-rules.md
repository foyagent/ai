# Recording Rules

## Start commands

Recognize these as start commands:
- `/auto-e2e <url>`
- `/aee <url>`
- `/auto-e2e storage <name> <url>`
- `/aee storage <name> <url>`

Optional additions in the same message:
- `record`
- runtime preferences such as profile reuse, storage-state reuse, incognito mode, headless mode, or headed mode.
- for storage capture only: `reset` or `append`

Examples:
- `/aee https://example.com record`
- `/aee https://example.com 复用 profile admin`
- `/aee https://example.com 复用登录态 auto-e2e/.auth/admin.json`
- `/aee https://example.com 复用登录态 user1，不存在就新建`
- `/aee https://example.com 使用凭证 user1`
- `/aee https://example.com 用隐身模式`
- `/aee https://example.com headless`
- `/aee https://example.com headed`
- `/aee storage user1 https://example.com/login`
- `/aee storage user1 reset https://example.com/login`
- `/aee storage user1 append https://example-b.com/login`

## Session state

Keep this structure in memory:

```json
{
  "mode": "record",
  "targetUrl": "https://example.com",
  "stepQueue": [],
  "variables": [],
  "returnSpec": null,
  "recordConversation": false,
  "conversationLog": [],
  "scriptBasename": null,
  "browserRuntime": {
    "profileMode": "incognito",
    "profileDir": null,
    "storageStatePath": null,
    "storageStateName": null,
    "initializeStorageStateIfMissing": false,
    "headless": false
  }
}
```

`profileMode` allowed values:
- `incognito`
- `persistent`
- `storageState`

Defaults:
- `profileMode: incognito`
- `headless: false`

## Runtime preference parsing

Translate user intent into `browserRuntime`.

Examples:
- “隐身模式” -> `{ "profileMode": "incognito" }`
- “复用 profile admin” -> `{ "profileMode": "persistent", "profileDir": "auto-e2e/profiles/admin" }`
- “复用登录态 auto-e2e/.auth/user.json” -> `{ "profileMode": "storageState", "storageStatePath": "auto-e2e/.auth/user.json" }`
- “复用登录态 user1” -> ask for a state file path or a named convention such as `auto-e2e/.auth/user1.json`
- “复用登录态 user1，不存在就新建” -> `{ "profileMode": "storageState", "storageStateName": "user1", "storageStatePath": "auto-e2e/.auth/user1.json", "initializeStorageStateIfMissing": true }`
- “使用凭证 user1” -> `{ "profileMode": "storageState", "storageStateName": "user1", "storageStatePath": "auto-e2e/.auth/user1.json" }`
- “无头模式” or `headless` -> `{ "headless": true }`
- “有头模式” or `headed` -> `{ "headless": false }`

Rules:
- only change runtime keys the user actually specified;
- preserve earlier runtime choices unless the user overrides them;
- if the user asks for both `persistent` and `storageState`, ask them to choose one instead of guessing;
- for storage-state reuse, default to strict behavior: if the file is missing, stop and tell the user it must exist first;
- only switch to initialization behavior when the user explicitly says phrases like `不存在就新建`, `没有就初始化`, or `if missing create it`;
- when initialization behavior is enabled, record against the user-provided real values, let the user complete login, then save the resulting state to the resolved `.auth` path;
- when a workflow was explicitly recorded with a storage-state credential, make that credential the generated script default runtime unless the caller later overrides it;
- do not create an empty placeholder state file; only write a real exported state after the live session reaches the desired signed-in state;
- do not assume a real Chrome default profile path; only use a dedicated workspace path or a user-provided explicit path.

## Recording flow

For each actionable user step:
1. execute it in the live page;
2. verify the likely result;
3. append a normalized queue item;
4. include generated Playwright code for that step;
5. include default settle logic after mutating actions.

Recommended queue item shape:

```json
{
  "description": "click the submit button",
  "code": "await page.getByRole('button', { name: 'Submit' }).click();\nawait settle(page);"
}
```

## Undo behavior

If the user says things like:
- “撤回上一步”
- “取消刚才那个操作”
- “undo last step”

Do this:
- remove only the last item from `stepQueue`;
- do not modify the browser;
- tell the user the queue was updated and that page restoration remains manual.

## Finish behavior

When the user says recording is finished:
1. determine the script basename from the workflow meaning;
2. write `auto-e2e/<basename>.mjs`;
3. ensure `auto-e2e/package.json` exists;
4. write `auto-e2e/records/<basename>.json` when record mode is on;
5. clean up the live browser environment unless the user explicitly wants to keep it open;
6. clear in-memory session state.

Return a short completion summary that includes:
- version;
- output file path;
- whether a record file was written;
- required variables;
- browser runtime defaults;
- a runnable CLI example.

## CLI example contract

When showing usage, keep one-object input and include runtime options in the same object.

Example:

```bash
cd auto-e2e
npm install
node create-card.mjs '{"cardTitle":"新品提卡","amount":100,"browserRuntime":{"profileMode":"incognito","headless":false}}'
```


## Alias-run parsing examples

Treat direct alias invocation exactly like a normal run request with an already chosen script.

Examples:
- `/aee 提卡 标题是新品提卡，金额 100`
- `/aee 提卡 标题是新品提卡，金额 100，用隐身模式`
- `/aee 提卡 标题是新品提卡，金额 100，复用 profile admin，无头运行`
- `/aee 提卡 标题是新品提卡，金额 100，复用登录态 user1，不存在就新建`

Interpretation rules:
- keep script variables at the top level of `params`;
- keep runtime choices only under `params.browserRuntime`;
- if the alias metadata says the script expects `cardTitle` and `amount`, map `标题是新品提卡` to `cardTitle` and `金额 100` to `amount`;
- map `用隐身模式` to `browserRuntime.profileMode = "incognito"`;
- map `复用 profile admin` to `browserRuntime.profileMode = "persistent"` and default `profileDir` to `auto-e2e/profiles/admin`;
- map `无头运行` to `browserRuntime.headless = true`.


## Storage-state initialization rule

When the user explicitly asks to create the login-state file if it is missing:
1. resolve the target path under `auto-e2e/.auth/` when only a name like `user1` was provided;
2. start from a fresh non-persistent browser launch suitable for capturing state;
3. let the user finish the login flow during recording or guided replay;
4. export the real state with Playwright storage-state saving into the resolved path after the login is complete;
5. on later runs, treat that path like an ordinary `storageState` file.

Do not silently auto-enable this behavior. The user must request it explicitly.


## Storage-capture command rules

When the command starts with `/auto-e2e storage` or `/aee storage`:
1. switch the session mode to `storage-capture`;
2. parse the next token as the credential name;
3. parse optional `reset` or `append` if present;
4. parse the URL to open for login capture;
5. resolve the target path to `auto-e2e/.auth/<name>.json` unless the user explicitly provided another path.

Behavior rules:
- if the target file does not exist and no action was specified, treat it as a new capture;
- if the target file exists and the user did not specify `reset` or `append`, pause and ask which one they want;
- if the user chose `reset`, start from a clean context and overwrite the file after login completes;
- if the user chose `append`, start from the existing storage-state file and save the merged result back to the same path after login completes;
- if the user chose `append` but the target file does not exist, do not guess; tell the user it cannot append and offer create or `reset`;
- if the existing file is unreadable or invalid, do not append; ask the user whether to `reset` instead.

Finish rules for storage-capture:
- do not generate a workflow script;
- save only the real storage state under `auto-e2e/.auth/`;
- update `auto-e2e/package.json` metadata when that file exists or is created;
- clean up the live browser environment after saving unless the user explicitly asks to keep it open;
- clear in-memory session state after saving.
