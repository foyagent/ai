# Alias Rules

## Binding

Recognize:
- `/auto-e2e alias <alias-term> <script-query>`
- `/aee alias <alias-term> <script-query>`

Examples:
- `/aee alias 提卡 做创建提卡那个脚本`
- `/aee alias card-run use the script that creates a work item type`

Rules:
1. search existing `.mjs` files under `~/.auto-e2e/`;
2. use matching records under `~/.auto-e2e/records/` as extra hints;
3. if one script clearly matches, bind it;
4. if multiple strong candidates exist, ask the user before writing anything;
5. store alias metadata in `~/.auto-e2e/package.json` under `autoE2E.aliases`.

Suggested alias metadata shape:

```json
{
  "autoE2E": {
    "skillVersion": "2.0.1",
    "aliases": {
      "提卡": {
        "scriptFile": "~/.auto-e2e/create-card.mjs",
        "variables": ["cardTitle", "amount"]
      }
    }
  }
}
```

## Direct alias invocation

Recognize:
- `/aee <alias-term> ...`
- `/auto-e2e <alias-term> ...`

When the second token is not a URL, `replay`, `alias`, `storage`, `list`, or `rm`, attempt alias resolution.

If the alias exists:
- resolve the script target;
- parse the trailing text into one `params` object;
- put business variables at the top level;
- put runtime choices only under `params.browserRuntime`.

Examples:
- `/aee 提卡 标题是新品提卡，金额 100`
- `/aee 提卡 标题是新品提卡，金额 100，用隐身模式`
- `/aee 提卡 标题是新品提卡，金额 100，复用 profile admin，无头运行`
- `/aee 提卡 标题是新品提卡，金额 100，复用登录态 user1，不存在就新建`

Interpretation:

```json
{
  "cardTitle": "新品提卡",
  "amount": 100,
  "browserRuntime": {
    "profileMode": "storageState",
    "storageStateName": "user1",
    "storageStatePath": "~/.auto-e2e/.auth/user1.json",
    "initializeStorageStateIfMissing": true,
    "headless": true
  }
}
```

If the alias does not exist, say so clearly instead of guessing.

## Alias cleanup

When removing a script with `/aee rm <file>.mjs`, also remove any aliases that point to that script.
