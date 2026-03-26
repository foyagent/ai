---
name: auto-e2e
description: record or replay manual browser actions into a reusable single-file playwright script. use when the user invokes /auto-e2e or /aee with a url to open a page for step-by-step natural-language recording, when the user adds the record flag to save the session conversation, or when the user invokes /auto-e2e replay or /aee replay with a natural-language query to find a prior record and guide a verification re-recording against it. keep an editable step queue, support explicit variable extraction into a single params object, and finish by saving a runnable node-compatible replay script plus package.json under the agent workspace auto-e2e folder.
---

# Auto E2E

## Version

Current skill version: `1.1.0`.

For every future edit to this skill, bump the semantic version and update both:
- `VERSION`
- `CHANGELOG.md`

Use this bump policy:
- patch: wording fixes, clarification, non-behavioral instruction tweaks
- minor: backward-compatible new capabilities, flags, or output files
- major: breaking changes to trigger shape, generated script contract, save paths, or runtime expectations

Read these references when needed:
- [references/recording-rules.md](references/recording-rules.md) for the session workflow, queue handling, alias parsing, record mode, replay mode, and output contract.
- [references/replay.md](references/replay.md) for replay matching, expected-outcome checking, and mismatch handling.
- [references/variables.md](references/variables.md) for explicit variable detection and parameter generation.
- [references/versioning.md](references/versioning.md) for semantic-version maintenance rules.
- [assets/package.json](assets/package.json) for the default workspace package file that must exist beside generated scripts.

## Session workflow

1. Start recording when the user says `/auto-e2e <url>` or `/aee <url>` or otherwise clearly asks to begin an auto-e2e recording for a specific page.
2. Detect optional flags from the same start message.
   - If the user includes `record`, enable record mode for this session.
   - Examples that should enable record mode:
     - `/auto-e2e https://example.com record`
     - `/auto-e2e record https://example.com`
     - `/aee https://example.com record`
3. Also recognize replay mode when the user says `/auto-e2e replay <query>` or `/aee replay <query>`.
   - In replay mode, search `auto-e2e/records/` for the best matching prior record based on the natural-language query.
   - If one record is a clear best match, load it, open its `targetUrl`, and tell the user which record is being replayed.
   - If there is significant ambiguity between multiple strong matches, show the top few likely records and ask the user to choose before proceeding.
4. Maintain session state in memory for the current conversation:
   - `mode` as `record` or `replay`
   - `targetUrl`
   - `stepQueue[]` in order
   - `variables[]` with `name`, `description`, `sampleValue`, and optional `defaultValue` only when the user explicitly asks for one
   - `returnSpec` if the user asks to return JSON data at the end
   - `recordConversation` boolean
   - `conversationLog[]` when record mode is enabled
   - `scriptBasename` to be decided only when recording ends
   - `matchedRecord` when replay mode is enabled
   - `replayCursor` for the current expected step index when replaying against a prior record
5. If record mode is enabled, append every recording-session user message and every agent reply to `conversationLog[]` using the raw original text. Do not summarize or normalize the message text in the saved record.
6. Interpret each later user message as one step unless the message is clearly a control message such as undo, cancel the last step, finish, abort, or replay confirmation.
7. Execute the step in the open browser first, then record the canonical script version of the step into `stepQueue`.
8. If the user asks to undo or cancel the last step, remove only the last recorded item from `stepQueue`. Do not change the browser. The user is responsible for restoring the page state manually.
9. In replay mode, after each executed step, compare the current outcome against the most relevant expected assistant reply from the matched record.
   - If the current outcome is semantically consistent with the prior expected result, continue and advance `replayCursor`.
   - If the current outcome is inconsistent with the prior expected result, pause immediately and ask the user whether to continue, adjust the step, or stop.
10. When the user ends recording or replay re-recording, generate the final files inside the agent workspace `auto-e2e/` directory:
   - `auto-e2e/package.json`
   - `auto-e2e/<content-summary-name>.mjs`
   - `auto-e2e/records/<content-summary-name>.json` only when `recordConversation` is true
11. After saving, return a concise summary including the skill version, mode, output path, chosen script filename, whether a record JSON was written, required variables, and how to run it.

## Recording rules

- Treat the user's message as a browser action only when it clearly describes an intended action on the current page.
- Supported first-version actions: click, hover, fill or clear inputs, select options, check or uncheck controls, keyboard actions including Enter, explicit waits for visible or hidden elements, and final data extraction for JSON output.
- Prefer resilient locators in this order: `getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`, then `locator(...)` only as a fallback.
- Keep both a human-readable description and the exact generated Playwright code for each queued step, but the user does not need to see the code unless helpful.
- After each mutating step, insert the default settle behavior:
  1. wait until there are no network requests if possible;
  2. then wait one additional second.
- Implement settle behavior in generated code with a helper that gracefully falls back if `networkidle` never arrives.
- Do not record pure conversation, clarifications, or status acknowledgements as browser steps.
- In record mode, still save those non-step user and agent messages into `conversationLog[]`; only exclude browser-internal state dumps or tool traces.
- In replay mode, use the matched record only as guidance and a verification baseline. The newly generated script must reflect what happened in the current run, not blindly copy the old steps if the user intentionally changed them.

## Variable handling

Only create variables when the user explicitly marks content as variable or clearly says it should become an argument. Examples:
- “这个邮箱是变量，变量名 email，当前值是 demo@example.com”
- “把收货人当成变量 recipientName，录制时先填 张三”
- “这一步里的搜索词后续会变，作为参数 searchKeyword，目前用 手机”

When the user explicitly marks something as variable:
1. Require or infer a stable variable name in english lower camel case. If the user gives a Chinese name, translate it to a short english identifier.
2. Record the sample value because recording still needs a concrete value to drive the browser now.
3. Generate code that reads the runtime value from the single `params` object, for example `params.email`.
4. Never write the recorded sample value into the script as a default value unless the user explicitly says it should be used when the param is missing.
5. Add a runtime guard near the top of the script for every required variable that has no explicit default.
6. Keep all variables under one function parameter object. Never generate multiple positional arguments.

If the user explicitly asks to use the recorded value as a fallback, treat that variable as optional at runtime and emit the default in code. Otherwise treat the sample value as recording-only data that must not appear in the generated script beyond comments or metadata.

If the user does not clearly say something is a variable, keep it as a literal value in the script.

## Final script and record contract

Generate one single-file Playwright ESM script with these properties:

- Filename: summarize the recorded workflow in english using lowercase words joined with hyphens. Make it specific but short, for example `login-search-order.mjs` or `open-dashboard-export-report.mjs`.
- Location: `auto-e2e/<filename>.mjs` under the agent workspace.
- Include a node shebang.
- Default export exactly one async function receiving one object argument:

```js
export default async function run(params = {}) {
```

- Ensure `auto-e2e/package.json` exists and is compatible with the generated script. Use the bundled template in [assets/package.json](assets/package.json) unless an equivalent file already exists.
- The script must import Playwright from `playwright`, launch a browser, create a page, run all recorded steps, return the requested JSON object when the user asked for one, and always close the browser in `finally`.
- If the user did not request data extraction, return a small JSON object describing success.
- CLI mode must accept only one optional command-line argument: a JSON string representing the same `params` object.
- In CLI mode, call the default-exported function and print the return value to stdout. If the return value is an object or array, print valid JSON.

If record mode is enabled, also write a JSON file to `auto-e2e/records/<script-basename>.json` with this shape:

```json
{
  "skillVersion": "1.1.0",
  "targetUrl": "https://example.com",
  "scriptFile": "auto-e2e/login-search-order.mjs",
  "recordFile": "auto-e2e/records/login-search-order.json",
  "messages": [
    { "index": 1, "role": "user", "content": "/auto-e2e https://example.com record" },
    { "index": 2, "role": "assistant", "content": "已打开页面，等待下一步。" }
  ]
}
```

Rules for the record JSON:
- Use the same basename as the generated script.
- Preserve user original wording and agent reply text as-is.
- Save only the recording-session conversation, from the start command through the final save confirmation for that session.
- Store valid JSON only.

## Replay contract

When the user starts replay mode with `/auto-e2e replay <query>` or `/aee replay <query>`:

1. Search `auto-e2e/records/` for likely matches using:
   - the natural-language replay query;
   - record basename;
   - target URL and hostname;
   - notable user and assistant text from saved messages.
2. Load the matched record and use it to reconstruct the expected flow.
3. Re-record the flow in the live browser based on the current user instructions.
4. After each step, use the matched record's prior assistant reply as the main expectation for whether the behavior still looks correct.
5. Compare semantic outcomes, not exact wording. Prefer observed browser state over text similarity.
6. If the current result contradicts the prior expected result, stop and confirm with the user before continuing.
7. If the replay completes without unresolved mismatches, tell the user the verification re-recording is complete and then save the new script.

## Output checklist

Before finishing, verify that the generated script:
- uses only one `params` object for all variables;
- includes required-variable validation for explicitly declared variables without explicit defaults;
- does not leak recorded sample values into runtime defaults unless the user explicitly requested that behavior;
- uses the default settle helper between steps;
- writes valid ESM code runnable with Node;
- writes or preserves `auto-e2e/package.json`;
- saves the script with a summarized english hyphen-case filename.

Before finishing in record mode, also verify that the generated record file:
- is saved under `auto-e2e/records/`;
- uses the same basename as the script;
- contains raw user and agent text from this recording session only;
- includes the current skill version.

Before finishing in replay mode, also verify that:
- the matched prior record was identified from `auto-e2e/records/`;
- any mismatched step paused for user confirmation;
- the final script reflects the current successful run, not stale prior code;
- the completion message clearly states whether the replay matched cleanly or required user-confirmed divergence.
