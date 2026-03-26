# Script Management Rules

## List

Recognize:
- `/aee list`
- `/auto-e2e list`

Behavior:
- list `.mjs` files directly under `~/.auto-e2e/`;
- include matching alias terms from `~/.auto-e2e/package.json` when present;
- mention whether a same-basename record exists under `~/.auto-e2e/records/`.

Do not list unrelated files such as package metadata or `.auth` contents unless the user asks.

## Remove

Recognize:
- `/aee rm xxx.mjs`
- `/auto-e2e rm xxx.mjs`

Behavior:
- remove the target script if it exists;
- remove aliases pointing at that script;
- leave same-basename record files untouched by default;
- leave storage-state files under `.auth` untouched;
- if the target does not exist or the user's description is ambiguous, stop and clarify instead of deleting the wrong file.
