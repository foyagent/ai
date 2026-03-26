# Replay Rules

## Trigger shapes

Recognize:
- `/auto-e2e replay <query>`
- `/aee replay <query>`
- `/auto-e2e replay { ...json... }`
- `/aee replay { ...json... }`

The replay argument can therefore be either:
- ordinary natural language used to search prior records;
- a direct JSON object that already contains the replay baseline.

## Direct JSON replay

When the replay argument starts with `{`, attempt to parse it as JSON.

Supported baseline shape:

```json
{
  "skillVersion": "1.5.0",
  "targetUrl": "https://example.com",
  "scriptFile": "auto-e2e/create-card.mjs",
  "recordFile": "auto-e2e/records/create-card.json",
  "variables": [],
  "returnSpec": {},
  "browserRuntime": {
    "profileMode": "incognito",
    "headless": false
  },
  "messages": []
}
```

Required fields for direct replay:
- `targetUrl`: non-empty string
- `messages`: non-empty array

Optional but useful fields:
- `skillVersion`
- `scriptFile`
- `recordFile`
- `variables`
- `returnSpec`
- `browserRuntime`

Rules:
- if parsing fails, ask the user to send valid JSON;
- if required fields are missing, ask the user to supply them;
- do not search `auto-e2e/records/` when a valid inline replay JSON payload was provided;
- if `browserRuntime` exists in the payload, use it as the initial replay runtime unless the user explicitly overrides it in the current command.

## Natural-language replay search

When the replay argument is normal text:
1. search saved files under `auto-e2e/records/`;
2. rank candidates by semantic closeness to the user's query;
3. prefer clearer, more specific matches;
4. if one result clearly wins, use it;
5. if several are plausible, show a short candidate list and ask the user to choose.

## Replay guidance source

Once a replay baseline is selected, use it as a guide for the new run.

Relevant guidance inputs can include:
- prior user messages;
- prior assistant replies;
- variable declarations;
- return expectations;
- prior runtime settings.

Do not treat the old record as unchangeable truth. Use it as a behavioral baseline while still following the user's current instructions.

## Mismatch handling

After each replayed step, compare the current outcome against the prior expected result.

If the current outcome and the prior result are semantically aligned:
- continue;
- advance the replay cursor.

If they differ materially:
- pause;
- explain the mismatch briefly;
- ask the user whether to continue, revise, or stop.

Examples of meaningful mismatch:
- button text differs and changes the workflow;
- a page transition happened earlier or later than before;
- the previous agent reply expected a success state but the current page shows an error;
- the current result contradicts a prior extracted value.

## Message comparison guidance

When using prior agent replies for validation, compare meaning rather than wording.

Treat these as acceptable matches:
- “clicked submit and moved to confirmation” vs “submit worked and the confirmation page appeared”
- “filled search box with 手机” vs “entered 手机 into the search input”

Treat these as mismatches:
- “modal opened” vs “page navigated away”
- “login succeeded” vs “still on login page with error message”

## Completion

When replay reaches the end without unresolved mismatches:
- tell the user the replay verification re-recording is complete;
- save the new script;
- mention whether it matched cleanly or required confirmed divergence.
