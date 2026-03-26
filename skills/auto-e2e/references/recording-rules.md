# Recording Rules

## State model

Keep one active session per conversation.

Suggested internal state:

```text
session = {
  mode: 'record' | 'replay',
  targetUrl,
  stepQueue: [
    {
      summary,
      code,
      usesVariables: [],
      needsSettle: true
    }
  ],
  variables: [
    {
      name,
      description,
      sampleValue,
      defaultValue,
      required: true
    }
  ],
  returnSpec,
  recordConversation: false,
  conversationLog: [
    {
      index,
      role,
      content
    }
  ],
  scriptBasename,
  matchedRecord,
  replayCursor: 0,
  replayMismatches: []
}
```

## Start command parsing

Recognize both `/auto-e2e` and `/aee` as valid command prefixes.

### Record mode start commands

Recognize these examples as equivalent:
- `/auto-e2e https://example.com`
- `/auto-e2e https://example.com record`
- `/auto-e2e record https://example.com`
- `/aee https://example.com`
- `/aee https://example.com record`
- `/aee record https://example.com`

Parsing rules:
1. Find the URL.
2. Detect whether `record` appears as a standalone token.
3. Set `mode = 'record'`.
4. Set `recordConversation = true` only when the `record` token is present.
5. If record mode logging is on, immediately start logging the raw user start message and every assistant reply from that point onward.

### Replay mode start commands

Recognize these examples:
- `/auto-e2e replay login export report`
- `/aee replay 登录并导出报表`
- `/aee replay order detail verify`

Replay parsing rules:
1. Detect `replay` as a standalone token immediately after the command prefix or elsewhere in the command.
2. Treat the remaining text as the replay search query.
3. Set `mode = 'replay'`.
4. Search `auto-e2e/records/` for matching prior record JSON files.
5. If one record is clearly best, load it and open its saved `targetUrl`.
6. If no good record exists, say so clearly instead of guessing.
7. If several close matches exist, ask the user to pick one before opening the page.

## Control messages

Recognize these as control messages instead of new browser steps:
- start recording
- undo / 撤回 / 取消上一步 / remove last step
- finish / 结束 / stop recording / 生成脚本
- abort / 放弃本次录制
- replay confirmation replies such as “继续”, “按现在这个结果继续”, “停止”, “改成点击右上角那个按钮”

Even in record mode, control messages are not browser steps. They are still conversation messages and should remain in `conversationLog` when logging is enabled.

## Step queue policy

For every action step:
1. execute it in the browser;
2. normalize it into Playwright code;
3. append it to the queue.

For undo:
1. remove the last queued step only;
2. do not mutate the browser state;
3. tell the user that only the recorded queue changed.

For replay:
1. still build a fresh queue for the current run;
2. do not blindly copy old steps into the new queue;
3. use the old record only as context and verification guidance.

## Conversation record policy

When `recordConversation` is true:
- capture every user message in this session with role `user`;
- capture every agent reply in this session with role `assistant`;
- preserve the original text as written or sent;
- do not rewrite, summarize, translate, or strip filler words;
- do not include hidden chain-of-thought, tool traces, or browser internals.

Suggested JSON shape:

```json
{
  "skillVersion": "1.1.0",
  "targetUrl": "https://example.com",
  "scriptFile": "auto-e2e/example-flow.mjs",
  "recordFile": "auto-e2e/records/example-flow.json",
  "messages": [
    { "index": 1, "role": "user", "content": "/auto-e2e https://example.com record" },
    { "index": 2, "role": "assistant", "content": "Opened the page and waiting for your next step." }
  ]
}
```

Use the same basename for the script and the record file.

## Settle helper

Use this helper pattern in generated scripts:

```js
async function waitForSettled(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch {
    // fallback for pages with long polling or persistent requests
  }
  await page.waitForTimeout(1000);
}
```

Call it after actions that can change UI or data. Avoid redundant waits after pure reads unless needed for reliability.

## Save location

Default save location is the agent workspace folder `auto-e2e/`.

Always ensure these files exist at the end:
- `auto-e2e/package.json`
- `auto-e2e/<generated-name>.mjs`
- `auto-e2e/records/<generated-name>.json` only when `recordConversation` is true

## Post-generation message

Return a compact summary containing:
- skill version;
- session mode;
- generated filename;
- full relative path;
- whether a record JSON was written;
- variable names expected in `params`;
- a minimal run example.
