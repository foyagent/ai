# Capture Mode Rules

## Trigger shapes

Recognize:
- `/auto-e2e capture <url>`
- `/aee capture <url>`
- `/auto-e2e <url> capture`
- `/aee <url> capture`

Prefer the explicit front-loaded form when restating instructions to the user.

## Product promise

Capture mode inverts ordinary recording:
- the user performs actions directly in the browser;
- the recorder observes those actions and turns them into structured steps;
- the agent summarizes newly captured steps when the chat surface allows it;
- the user does not need to narrate every step in chat.

Treat per-step chat feedback as best effort, not as a hard guarantee. The hard guarantee is that the recorder keeps an observed step queue that can be polled and converted into a final script at the end.

## Recorder session mode

Capture mode is a live recorder session with:
- `sessionMode: "capture"`
- lifecycle state `capturing_observed`

The recorder must keep one persistent Playwright runtime alive and observe user actions on the active page.

## Recorder polling contract

After capture starts, the agent should poll the recorder with `pollCapturedSteps`.

Payload example:

```json
{
  "sessionId": "...",
  "runtimeLock": "...",
  "cursor": 0,
  "timeoutMs": 15000
}
```

Return shape:

```json
{
  "steps": [],
  "nextCursor": 0,
  "totalCaptured": 0,
  "browserClosed": false,
  "closeReason": null,
  "timedOut": false
}
```

Rules:
- `steps` contains only newly captured steps after the supplied cursor;
- `nextCursor` is the cursor for the next poll;
- `browserClosed` tells the agent the user manually closed the session browser;
- `timedOut` means no new steps arrived during the poll window.

## MVP capture scope

The first supported capture set is intentionally narrow:
- click
- fill / clear text input
- select option
- check / uncheck
- key press for `Enter` or `Escape`
- top-level page navigation

Do not claim robust capture for:
- drag and drop
- file picker workflows
- canvas interactions
- rich text editors
- browser chrome interactions
- highly custom widgets that do not emit standard DOM events

When capture quality is uncertain, tell the user the step may need manual cleanup before script generation.

## Summarization behavior

When the recorder returns new captured steps:
1. keep them in order;
2. summarize them in concise user-facing language;
3. store both summary and generated code in `stepQueue`.

Good examples:
- `点击“新建工作项类型”`
- `在“名称”输入“缺陷”`
- `在“类型”中选择“系统字段”`

## Variables and return data

Capture mode cannot reliably infer which observed literals are runtime variables.

Therefore:
- record observed values literally during capture;
- after the user finishes, ask a short follow-up only if variable extraction or `returnSpec` is still ambiguous;
- then convert explicitly marked values into the single `params` object just like ordinary recording.

Do not silently guess that an observed input is a variable.

## Finish conditions

Capture mode finishes when either happens:
- the user sends a finish message;
- the user manually closes the browser and the recorder reports `browserClosed: true`.

At finish time:
1. stop polling;
2. optionally ask the short post-processing questions for variables or return data;
3. generate the final script and optional record file the same way as ordinary recording;
4. clean up the recorder unless the user explicitly asked to keep the browser open.
