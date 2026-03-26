# AI

Agent skills & resources for OpenClaw.

[中文文档](README.zh-CN.md)

## Skills

### auto-e2e

Browser automation recording/replay tool. Generate reusable single-file Playwright scripts through natural language descriptions.

**Version:** 1.4.0

#### Usage

**Record Mode**
```
/auto-e2e https://example.com
/aee https://example.com record
```
After opening the page, describe each step in natural language (e.g., "click login button", "enter username xxx"). Agent executes and records. Supports undo, variable extraction, and return data specification.

**Replay Mode**
```
/auto-e2e replay login flow
/aee replay { "targetUrl": "...", "messages": [...] }
```
Match historical recordings by natural language query, or pass a JSON replay baseline directly. Compares expected results during execution, pauses on mismatch.

**Alias Binding**
```
/auto-e2e alias login login-flow-script
```
Bind a short alias to a generated script for easy invocation.

**Alias Invocation**
```
/auto-e2e login username test@example.com
```
Execute script by alias with variable parameters.

#### Browser Runtime Options

- `incognito mode` / `用隐身模式` - Use incognito/private mode
- `reuse profile <name>` / `复用 profile <name>` - Reuse specified browser profile
- `reuse login state <path>` / `复用登录态 <path>` - Reuse storage-state file
- `headless` - Run in headless mode

#### Output

Scripts are saved in `auto-e2e/` directory:
- `<name>.mjs` - Standalone Playwright script
- `records/<name>.json` - Recording session log (record mode)
- `package.json` - Alias metadata

#### Documentation

See [skills/auto-e2e/SKILL.md](skills/auto-e2e/SKILL.md)
