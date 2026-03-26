# Alias Rules

## Purpose

Alias mode lets the user assign a short trigger word to an existing generated script and invoke it later without remembering the script filename.

Command forms:
- `/auto-e2e alias <alias-term> <script-query>`
- `/aee alias <alias-term> <script-query>`
- `/auto-e2e <alias-term> <optional-run-text>`
- `/aee <alias-term> <optional-run-text>`

## Storage location

Persist aliases in `auto-e2e/package.json` under `autoE2E.aliases`.

Suggested shape:

```json
{
  "name": "auto-e2e-workspace",
  "private": true,
  "type": "module",
  "dependencies": {
    "playwright": "^1.53.0"
  },
  "autoE2E": {
    "skillVersion": "1.7.0",
    "aliases": {
      "提卡": {
        "scriptFile": "auto-e2e/create-card.mjs",
        "basename": "create-card",
        "query": "做创建提卡那个脚本",
        "variableNames": ["cardTitle", "amount"],
        "updatedAt": "2026-03-26T00:00:00Z"
      }
    }
  }
}
```

Rules:
- keep alias keys exactly as the user wants to say them, including Chinese if the user chose Chinese;
- keep `scriptFile` as the relative path under the workspace;
- save a short `query` note describing why this alias points to that script;
- save `variableNames` when they can be inferred from the script or matching record;
- update `autoE2E.skillVersion` when writing alias metadata.

## Binding workflow

Given a command like:
- `/aee alias 提卡 做 xxxx 那个脚本`

Do this:
1. parse `提卡` as the alias term;
2. parse `做 xxxx 那个脚本` as the script query;
3. search `auto-e2e/*.mjs` basenames first;
4. use matching `auto-e2e/records/*.json` content as a secondary signal;
5. if one script clearly wins, bind it;
6. if multiple scripts are plausible, show a short candidate list and ask the user which one to bind;
7. if the alias already exists and points elsewhere, ask whether to overwrite;
8. after confirmation, write the alias entry into `auto-e2e/package.json`.

## Ambiguity handling

Never guess when:
- multiple script basenames match similarly well;
- multiple records strongly support different scripts;
- the alias term already exists for another script.

In those cases, ask the user a narrow confirmation question with the top candidates.

Good confirmation style:
- “I found two likely scripts for `提卡`: `create-card.mjs` and `create-card-and-submit.mjs`. Which one should I bind?”
- “`提卡` is already bound to `create-card.mjs`. Do you want to replace it with `issue-card.mjs`?”

## Alias invocation workflow

Given a command like:
- `/aee 提卡 标题是新品提卡，金额 100，用 profile admin，无头模式`

Do this:
1. parse `提卡` as the alias term;
2. resolve it through `auto-e2e/package.json`;
3. identify the target script from `scriptFile`;
4. inspect known variable names from alias metadata and related script context;
5. treat the trailing text as natural-language variable content plus optional runtime preferences;
6. map values into the single `params` object;
7. place runtime preferences under `params.browserRuntime`;
8. if the mapping is incomplete or ambiguous, ask only about the unresolved variables;
9. tell the user which script is being used.

If the alias has no trailing run text:
- still resolve the script;
- tell the user which script it maps to;
- if the script needs variables, ask for the missing ones.

## Variable mapping guidance

When alias metadata includes `variableNames`, prefer those names when mapping trailing text into `params`.

Example:
- alias metadata says variable names are `cardTitle` and `amount`
- user says `/aee 提卡 标题是新品提卡，金额 100`
- map to:

```json
{
  "cardTitle": "新品提卡",
  "amount": 100
}
```

If the user wording could map to more than one variable, ask for clarification instead of guessing.


## Richer alias-run examples

Use examples like these to keep parsing stable:

- `/aee 提卡 标题是新品提卡，金额 100`
  - treat `标题是新品提卡` and `金额 100` as business variables
- `/aee 提卡 标题是新品提卡，金额 100，用隐身模式`
  - map runtime to `params.browserRuntime.profileMode = "incognito"`
- `/aee 提卡 标题是新品提卡，金额 100，复用 profile admin`
  - map runtime to `params.browserRuntime.profileMode = "persistent"`
  - if no explicit path is given, use `auto-e2e/profiles/admin`
- `/aee 提卡 标题是新品提卡，金额 100，复用登录态 auto-e2e/.auth/admin.json`
  - map runtime to `params.browserRuntime.profileMode = "storageState"`
  - map `storageStatePath` to the provided path
- `/aee 提卡 标题是新品提卡，金额 100，复用登录态 user1，不存在就新建`
  - map runtime to `params.browserRuntime.profileMode = "storageState"`
  - resolve `storageStatePath` to `auto-e2e/.auth/user1.json`
  - set `initializeStorageStateIfMissing = true`
- `/aee 提卡 标题是新品提卡，金额 100，使用凭证 user1`
  - map runtime to `params.browserRuntime.profileMode = "storageState"`
  - resolve `storageStatePath` to `auto-e2e/.auth/user1.json`
- `/aee 提卡 标题是新品提卡，金额 100，无头运行`
  - map runtime to `params.browserRuntime.headless = true`
- `/aee 提卡 标题是新品提卡，金额 100，显示浏览器`
  - map runtime to `params.browserRuntime.headless = false`
- `/aee 提卡 标题是新品提卡，金额 100，用隐身模式，无头运行`
  - combine both runtime settings under `params.browserRuntime`

## Parsing rule

When resolving a direct alias invocation:
- first resolve the alias term to its script;
- then split the trailing natural language into two buckets:
  - business variables for the matched script;
  - browser runtime instructions for `params.browserRuntime`;
- do not turn runtime phrases into business variables;
- do not turn business values into runtime fields;
- if a phrase could belong to either bucket, ask a narrow follow-up question.

## Example final params object

For a script expecting `cardTitle` and `amount`, this input:
- `/aee 提卡 标题是双十一活动，金额 100，用隐身模式，无头运行`

should produce guidance equivalent to:

```json
{
  "cardTitle": "双十一活动",
  "amount": 100,
  "browserRuntime": {
    "profileMode": "incognito",
    "headless": true
  }
}
```
