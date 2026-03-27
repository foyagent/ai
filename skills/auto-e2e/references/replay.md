# Replay Rules

## Trigger shapes

Recognize:
- `/auto-e2e replay <query>`
- `/aee replay <query>`
- `/auto-e2e replay { ...json... }`
- `/aee replay { ...json... }`

## Direct JSON replay

When the replay argument starts with `{`, parse it as JSON.

Supported baseline shape:

```json
{
  "skillVersion": "2.0.1",
  "targetUrl": "https://example.com",
  "scriptFile": "~/.auto-e2e/create-card.mjs",
  "recordFile": "~/.auto-e2e/records/create-card.json",
  "variables": [],
  "returnSpec": {},
  "browserRuntime": {
    "profileMode": "incognito",
    "headless": false
  },
  "messages": []
}
```

Required fields:
- `targetUrl`: non-empty string
- `messages`: non-empty array

Rules:
- if parsing fails, ask the user for valid JSON;
- if required fields are missing, ask the user to supply them;
- if `browserRuntime` exists, use it unless the user explicitly overrides it in the current command;
- do not search records when the inline payload is valid.

## Natural-language replay search

When the replay argument is ordinary text:
1. search `~/.auto-e2e/records/`;
2. rank candidates by semantic closeness;
3. if one record clearly wins, use it;
4. if several are plausible, ask the user to choose.

## Replay execution

Replay must use the same persistent recorder architecture as ordinary recording.

After each replayed step:
- compare the current outcome against the baseline messages and expected meaning;
- continue if they are semantically aligned;
- pause and ask the user if they materially differ.

Meaningful mismatch examples:
- previous reply expected a modal but the current run navigated away;
- previous run succeeded but current page shows an error;
- the expected extracted value now differs in a way that changes the workflow.

## Completion

When replay finishes without unresolved mismatches:
- save the updated script;
- optionally save a new record if record mode was enabled;
- tell the user replay completed and whether divergence confirmations were required.
