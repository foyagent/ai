# Variable Rules

## Only explicit variables

Do not guess variables from ordinary text. Convert a value into a parameter only when the user explicitly says it is variable, dynamic, reusable, a parameter, or an input argument.

Signals that justify a variable:
- “这是变量”
- “作为参数”
- “后续会变”
- “把它提取成入参”
- “use a variable for this”

If none of those signals exists, keep the literal value in the recorded script.

## Naming

Use one english lower camel case field name per variable.

Good examples:
- `email`
- `searchKeyword`
- `recipientName`
- `confirmButtonText`

Avoid:
- spaces
- chinese identifiers in code
- ambiguous names like `value1`

## Sample values during recording

Recording still needs a concrete value to interact with the current page.

Therefore every explicit variable should capture both:
- runtime field name, such as `searchKeyword`
- sample value used during recording, such as `手机`

Optionally capture:
- `defaultValue` only when the user explicitly says the recorded value should become the fallback when no param is passed

Use the sample value when executing the step now. Use `params.searchKeyword` in the final script.

## No implicit defaults

Do not write the sample value into generated code as a default just because recording needed a concrete value.

Default behavior:
- use the sample value only while recording in the live browser;
- require the runtime caller to provide the field in `params`;
- throw a missing-param error when that required field is absent.

Only emit a default in the final script when the user explicitly asks for it, for example:
- "如果没传 email，就默认用现在这个值"
- "把当前城市作为默认值"
- "use this recorded value as the fallback default"

When the user explicitly allows a fallback default, generate code like:

```js
const email = 'email' in params ? params.email : 'demo@example.com';
```

Without that explicit instruction, generate code like:

```js
const email = requireParam(params, 'email');
```

## Required parameter guard

At the top of the generated function, create a guard for each variable that does not have an explicit user-approved default. Example:

```js
function requireParam(params, key) {
  if (!(key in params)) {
    throw new Error(`Missing required param: ${key}`);
  }
  return params[key];
}
```

Then inside the workflow:

```js
const email = requireParam(params, 'email');
```

## Single object contract

The generated function must always receive exactly one object argument:

```js
export default async function run(params = {}) {
```

All extracted variables must come from that object. CLI mode must also accept exactly one JSON string that maps to the same object.
