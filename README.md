# AI

Agent skills & resources for any AI assistant.

[中文文档](README.zh-CN.md)

## Skills

### auto-e2e

Browser automation recording/replay tool. Generate reusable single-file Playwright scripts through natural language descriptions.

**Version:** 2.2.1

#### Usage

**Record Mode**
```
/auto-e2e https://example.com
/aee https://example.com record
```
After opening the page, describe each step in natural language (e.g., "click login button", "enter username xxx"). Agent executes and records. Supports undo, variable extraction, and return data specification.

**Capture Mode**
```
/auto-e2e capture https://example.com
/aee capture https://example.com
```
In capture mode, you operate the browser directly. The recorder observes your actions and converts them into reusable steps. No need to narrate each step in chat. Supports click, fill, select, check, key press, and navigation.

**Replay Mode**
```
/auto-e2e replay login flow
/aee replay { "targetUrl": "...", "messages": [...] }
```
Match historical recordings by natural language query, or pass a JSON replay baseline directly. Compares expected results during execution, pauses on mismatch.

**Storage Capture**
```
/auto-e2e storage user1 https://example.com/login
/aee storage admin https://example.com/login append
```
Capture login credentials to `~/.auto-e2e/.auth/<name>.json` without generating a script. Use `append` to extend an existing storage-state with additional login flows.

**Script Management**
```
/aee list
/aee rm login-flow.mjs
```
List all saved scripts or remove a specific script.

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
- `reuse login state <name>` / `复用登录态 <name>` - Reuse storage-state from `.auth/<name>.json`
- `headless` / `无头模式` - Run in headless mode
- `headed` / `有头模式` - Run with visible browser

#### Output

Scripts are saved in `~/.auto-e2e/` directory (shared across agents):
- `<name>.mjs` - Standalone Playwright script
- `records/<name>.json` - Recording session log (record mode)
- `.auth/<name>.json` - Named storage-state files (login credentials)
- `package.json` - Alias and credential metadata

#### Documentation

See [skills/auto-e2e/SKILL.md](skills/auto-e2e/SKILL.md)

### avatar-style-prompt

Generate detailed, model-agnostic image prompts for chest-up avatar portraits that match a fixed six-reference visual style. Ensures consistency across different image agents with anti-drift constraints.

**Usage**

Provide a character or person description to get a prompt that stays within the bundled youthful stylized 3D social-profile avatar family.

**Output includes:**
- Universal prompt (cross-model compatible)
- Negative prompt
- Style lock bullets
- Anti-drift suffix
- Chinese gloss (if input is Chinese)

#### Documentation

See [skills/avatar-style-prompt/SKILL.md](skills/avatar-style-prompt/SKILL.md)

### cozy-pixel-prompter

Generate unified prompt packs for production-ready pixel-art game assets with a soft modern East-Asian neighborhood family style.

**Usage**

Provide a character, sprite, equipment, prop, or avatar description to get complete prompt packs including:
- Positive prompt (English, with optional Chinese gloss)
- Negative prompt (drift prevention)
- Asset specs (canvas size, framing, alignment)
- Style alignment notes

**Features:**
- Family-style consistency across all assets
- Support for portraits, sprites, items, and avatars
- Reference image editing with style preservation
- Character differentiation for role-based designs
- Production-ready output with transparent backgrounds

#### Documentation

See [skills/cozy-pixel-prompter-v3/SKILL.md](skills/cozy-pixel-prompter-v3/SKILL.md)

### mutli-feishu-agent

Manage OpenClaw Feishu independent agents - create, activate, troubleshoot, and delete. Automatically generates agent IDs from names (Chinese → pinyin), handles configuration backup, account binding, and owner identification.

**Usage**

Provide `name`, `app_id`, `app_secret`, optional `agent_id` and `workspace_path` to create a new Feishu agent. The agent ID is auto-generated from the name if not provided.

**Features:**
- Auto-generate agent_id from Chinese/English names
- Single restart during creation (stable flow)
- Uses temporary BOOT.md block for post-restart handoff
- Auto-extract owner `ou_` and pairing code from logs/messages
- Auto-approve pairing and configure allowFrom/groupAllowFrom
- Verify after pairing without second restart

#### Documentation

See [skills/mutli-feishu-agent/SKILL.md](skills/mutli-feishu-agent/SKILL.md)
