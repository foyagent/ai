# Recording Rules

## Start commands

Recognize these as start commands:
- `/auto-e2e <url>`
- `/aee <url>`

Optional additions in the same message:
- `record`
- runtime preferences such as profile reuse, storage-state reuse, incognito mode, headless mode, or headed mode.

Examples:
- `/aee https://example.com record`
- `/aee https://example.com 复用 profile admin`
- `/aee https://example.com 复用登录态 auto-e2e/.auth/admin.json`
- `/aee https://example.com 用隐身模式`
- `/aee https://example.com headless`
- `/aee https://example.com headed`

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
- “无头模式” or `headless` -> `{ "headless": true }`
- “有头模式” or `headed` -> `{ "headless": false }`

Rules:
- only change runtime keys the user actually specified;
- preserve earlier runtime choices unless the user overrides them;
- if the user asks for both `persistent` and `storageState`, ask them to choose one instead of guessing;
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
