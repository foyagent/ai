# AI

OpenClaw 的 Agent 技能与资源。

[English](README.md)

## Skills

### auto-e2e

浏览器自动化录制/回放工具。通过自然语言描述操作步骤，自动生成可复用的单文件 Playwright 脚本。

**版本：** 1.7.0

#### 使用方式

**录制模式**
```
/auto-e2e https://example.com
/aee https://example.com record
```
打开页面后，用自然语言描述每一步操作（如"点击登录按钮"、"输入用户名 xxx"）。Agent 会执行并记录。支持撤销上一步、提取变量、设置返回数据。

**回放模式**
```
/auto-e2e replay 登录流程
/aee replay { "targetUrl": "...", "messages": [...] }
```
根据自然语言查询匹配历史录制，或直接传入 JSON 回放基线。执行时会对比预期结果，不一致则暂停询问。

**凭证捕获**
```
/auto-e2e storage user1 https://example.com/login
/aee storage admin https://example.com/login append
```
将登录凭证保存到 `auto-e2e/.auth/<name>.json`，不生成脚本。使用 `append` 可在现有凭证基础上扩展其他登录流程。

**别名绑定**
```
/auto-e2e alias login 登录流程脚本
```
为已生成的脚本绑定简短别名，方便后续调用。

**别名调用**
```
/auto-e2e login 用户名 test@example.com
```
直接用别名执行脚本，支持传入变量参数。

#### 浏览器运行时选项

- `用隐身模式` / `incognito mode` - 使用隐身/无痕模式
- `复用 profile <name>` / `reuse profile <name>` - 复用指定的浏览器配置
- `复用登录态 <name>` / `reuse login state <name>` - 复用 `.auth/<name>.json` 中的凭证
- `无头模式` / `headless` - 无头模式运行
- `有头模式` / `headed` - 显示浏览器窗口运行

#### 输出

脚本保存在 `auto-e2e/` 目录下：
- `<name>.mjs` - 可独立运行的 Playwright 脚本
- `records/<name>.json` - 录制会话记录（record 模式）
- `.auth/<name>.json` - 命名的登录态文件（凭证）
- `package.json` - 别名和凭证元数据

#### 文档

详见 [skills/auto-e2e/SKILL.md](skills/auto-e2e/SKILL.md)
