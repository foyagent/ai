# AI

通用 Agent 技能与资源。

[English](README.md)

## Skills

### auto-e2e

浏览器自动化录制/回放工具。通过自然语言描述操作步骤，自动生成可复用的单文件 Playwright 脚本。

**版本：** 2.2.1

#### 使用方式

**录制模式**
```
/auto-e2e https://example.com
/aee https://example.com record
```
打开页面后，用自然语言描述每一步操作（如"点击登录按钮"、"输入用户名 xxx"）。Agent 会执行并记录。支持撤销上一步、提取变量、设置返回数据。

**捕获模式**
```
/auto-e2e capture https://example.com
/aee capture https://example.com
```
捕获模式下，你直接在浏览器中操作，录制器会观察你的动作并转换为可复用的步骤。无需在聊天中描述每一步。支持点击、填充、选择、勾选、按键和导航操作。

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
将登录凭证保存到 `~/.auto-e2e/.auth/<name>.json`，不生成脚本。使用 `append` 可在现有凭证基础上扩展其他登录流程。

**脚本管理**
```
/aee list
/aee rm login-flow.mjs
```
列出所有已保存的脚本，或删除指定脚本。

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

脚本保存在 `~/.auto-e2e/` 目录下（跨 Agent 共享）：
- `<name>.mjs` - 可独立运行的 Playwright 脚本
- `records/<name>.json` - 录制会话记录（record 模式）
- `.auth/<name>.json` - 命名的登录态文件（凭证）
- `package.json` - 别名和凭证元数据

#### 文档

详见 [skills/auto-e2e/SKILL.md](skills/auto-e2e/SKILL.md)

### avatar-style-prompt

生成详细的、跨模型兼容的头像肖像提示词，保持与六张参考图一致的视觉风格。通过防漂移约束确保跨不同图像生成器的一致性。

**使用方式**

提供角色或人物描述，获得与内置年轻化风格 3D 社交头像家族保持一致的提示词。

**输出包含：**
- 通用提示词（跨模型兼容）
- 负面提示词
- 风格锁定要点
- 防漂移后缀
- 中文说明（如输入为中文）

#### 文档

详见 [skills/avatar-style-prompt/SKILL.md](skills/avatar-style-prompt/SKILL.md)

### mutli-feishu-agent

OpenClaw 飞书独立 Agent 管理工具 - 创建、激活、排查和删除。支持从名称自动生成 agent_id（中文→拼音），自动处理配置备份、账号绑定和 owner 标识收集。

**使用方式**

提供 `name`、`app_id`、`app_secret`，可选 `agent_id` 和 `workspace_path` 来创建新的飞书 Agent。如未提供 agent_id，会自动根据名称生成。

**功能：**
- 中文名称自动转拼音生成 agent_id
- 修改配置前自动备份 openclaw.json
- 绑定飞书账号，从第一条消息收集 owner `ou_`
- 自动添加 owner 到 `allowFrom` 和 `groupAllowFrom`
- 默认不重启 - 先验证配置，未生效才重载

#### 文档

详见 [skills/mutli-feishu-agent/SKILL.md](skills/mutli-feishu-agent/SKILL.md)
