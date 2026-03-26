# Variable Rules

## Only explicit variables

Do not guess variables from ordinary text. Convert a value into a parameter only when the user explicitly says it is variable, dynamic, reusable, a parameter, or an input argument.

Signals that justify a variable:
- `这是变量`
- `作为参数`
- `后续会变`
- `把它提取成入参`
- `use a variable for this`

If none of those signals exists, keep the literal value in the recorded script.

## Naming

Use one english lower camel case field name per variable.

Good examples:
- `email`
- `searchKeyword`
- `recipientName`
- `confirmButtonText`

## Sample values during recording

Recording still needs a concrete value to interact with the current page.

Therefore every explicit variable should capture:
- runtime field name;
- sample value used during recording.

Use the sample value when executing the live step now. Use `params.<name>` in the final script.

## No implicit defaults

Do not write the sample value into generated code as a default just because recording needed a concrete value.

Default behavior:
- use the sample value only while recording in the live browser;
- require the runtime caller to provide the field in `params`;
- throw a missing-param error when that required field is absent.

Only emit a default in the final script when the user explicitly asks for it.

Without explicit permission:

```js
const email = requireParam(params, 'email');
```

With explicit permission:

```js
const email = 'email' in params ? params.email : 'demo@example.com';
```

## Single object contract

The generated function must always receive exactly one object argument:

```js
export default async function run(params = {}) {
```
