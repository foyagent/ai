# Replay Rules

## Purpose

Replay mode lets the user reuse a previously saved record as a verification baseline.

Command forms:
- `/auto-e2e replay <query>`
- `/aee replay <query>`

The query is natural language. Use it to find the most relevant record JSON under `auto-e2e/records/`.

## Matching strategy

Rank candidate records using a combination of:
1. query similarity to the script basename;
2. query similarity to the `targetUrl` hostname or path;
3. query similarity to notable user instructions in `messages`;
4. query similarity to notable agent replies in `messages`.

Prefer the record that best matches the overall workflow intent, not just one repeated word.

If exactly one record is clearly best, select it automatically.

If there are several strong candidates with no clear winner:
- show a short list with basename and target URL;
- ask the user which one to replay.

If no candidate is good enough, say that no matching record was found.

## Replay workflow

After selecting a record:
1. load the record JSON;
2. open `targetUrl` from the record;
3. explain briefly that replay mode is active and which record was matched;
4. use the prior saved conversation as guidance while the user drives the new run;
5. build a fresh current `stepQueue` from the new run;
6. compare each new step outcome against the old expected outcome.

## What to compare

Use the prior assistant reply for the corresponding step as the expected outcome signal.

Compare semantically, not literally.

Examples:
- Old reply: “已点击登录按钮并进入仪表盘”
  - Good current outcome: dashboard is visible after click.
  - Bad current outcome: still on login form with an error banner.

- Old reply: “已搜索关键词 手机，共看到结果列表”
  - Good current outcome: a results list for 手机 is visible.
  - Bad current outcome: empty state or a different page opens.

When possible, use current browser evidence first:
- visible headings
- dialogs
- form state
- URL change
- result list presence
- success or error notifications

Use text similarity to the old assistant reply only as a secondary hint.

## Mismatch policy

If the current outcome conflicts with the expected outcome from the matched record:
1. pause immediately;
2. explain the mismatch briefly;
3. ask the user whether to continue, correct the step, or stop.

Example mismatch prompt:
- “The previous record expected the dashboard to open after this click, but the current page still shows the login form. Do you want to continue, adjust this step, or stop?”

Do not silently continue after a clear mismatch.

If the mismatch is user-confirmed and the run continues:
- record that divergence in the current session summary;
- continue building the new script from the user-approved current behavior.

## Completion

When replay reaches the end without unresolved mismatches:
- tell the user the replay verification re-recording is complete;
- save the new script;
- mention whether it matched cleanly or required confirmed divergence.
