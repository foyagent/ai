---
name: mutli-feishu-agent
description: 用中文处理 openclaw feishu 独立 agent 的创建、激活、排查和删除。适用于用户一次性提供 name、app_id、app_secret、可选 agent_id、可选 workspace_path 后，由当前 agent 负责备份、创建、配置、绑定、写入临时 BOOT.md、执行一次重启、重启后继续监听并提示用户给新 agent 发消息、收集 ou_、设置 allowFrom 和 channels.feishu.groupAllowFrom、执行 feishu pairing approve，并在完成后清理临时 BOOT.md。删除时先确认是否清理工作区，并优先使用 openclaw 自带删除能力。
---

# Mutli Feishu Agent

用这个 skill 创建、激活、排查和删除 OpenClaw 的独立 Feishu agent。

## 原则

- 用户只做两步：
  1. 一次性提供创建信息。
  2. 收到提示后，只给新 agent 发一条私聊消息。
- 其余步骤默认由当前 agent 执行。
- 这套流程为了稳定性，**创建阶段固定只重启一次**。
- 收到用户提供的创建信息后，**不要再发普通回复**；直接完成预处理、写入临时 `BOOT.md`、触发重启。用户下一条可见消息应该来自重启后的 boot 流程。
- 重启后的接力逻辑写在**当前 agent 工作区**的 `BOOT.md` 临时区块里，不要把一次性接力逻辑写进新 agent 工作区。
- `BOOT.md` 如果原本就存在，保留原内容，只追加和删除带标记的临时区块。
- 完成配对和放行后，清理临时 `BOOT.md` 指令；如果文件只剩临时区块，直接删掉 `BOOT.md`。
- 不单独展开群聊流程；只在设置私聊 `allowFrom` 时顺手追加 `channels.feishu.groupAllowFrom`。
- 删除 agent 时先问是否清理工作区，并优先使用 OpenClaw 自带删除能力。

## 需要收集的信息

- `name`
- `app_id`
- `app_secret`
- `agent_id`（可选）
- `workspace_path`（可选）

`agent_id` 规则：

- 用户传了 `agent_id` 就直接使用。
- 用户没传时，根据 `name` 自动生成。
- 非中文名称：转英文小写；多个单词用下划线连接。
- 中文名称：转拼音小写。
- 空格、短横线和连续分隔符统一规整为单个下划线。
- 最终只保留小写字母、数字和下划线。

示例：

```text
My Agent -> my_agent
Risk-Control Bot -> risk_control_bot
测试助手 -> ceshizhushou
```

`workspace_path` 规则：

- 用户传了就直接使用。
- 用户没传时，默认：

```text
~/.openclaw/workspaces/<agent_id>
```

## 用户两步

### 第一步

先把下面的链接发给用户，让用户自己创建飞书应用并一次性把信息给全：

```text
https://open.larkoffice.com/page/openclaw?form=multiAgent
```

要求用户一次性提供：

- `name`
- `app_id`
- `app_secret`
- `agent_id`（可选）
- `workspace_path`（可选）

### 第二步

等重启后的 boot 流程主动发出提示后，用户只需要：

- 给新 agent 发一条私聊消息。

用户不需要回来报告“已发送”。

## 创建与激活主流程

收到用户第一步给出的信息后，按这个顺序执行：

1. 确定最终 `agent_id`。
2. 确定最终 `workspace_path`。
3. 备份 `openclaw.json`。
4. 创建新 agent。
5. 设置 `channels.feishu.session.dmScope = "per-account-channel-peer"`。
6. 写入 `channels.feishu.accounts.<agent_id>.appId`、`appSecret`、`name`。
7. 绑定 `feishu:<agent_id>`。
8. 确认 `boot-md` hook 可用；如果未启用，优先启用它。必要时同时确保 internal hooks 已启用。
9. 在**当前 agent 工作区**的 `BOOT.md` 写入带标记的临时接力区块。
10. 立即重启一次 OpenClaw。
11. 到这里停止当前普通回复，让后续流程由 `BOOT.md` 接管。

命令模板：

```bash
openclaw agents add <agent_id> --workspace <workspace_path>
```

```bash
openclaw config set channels.feishu.session.dmScope "per-account-channel-peer"
```

```bash
openclaw config set --batch-json '[
  {"path": "channels.feishu.accounts.<agent_id>.appId", "value": "<app_id>"},
  {"path": "channels.feishu.accounts.<agent_id>.appSecret", "value": "<app_secret>"},
  {"path": "channels.feishu.accounts.<agent_id>.name", "value": "<name>"}
]'
```

```bash
openclaw agents bind --agent <agent_id> --bind feishu:<agent_id>
```

```bash
openclaw hooks enable boot-md
```

## 临时 BOOT.md 要做的事

临时 `BOOT.md` 区块只负责这一次创建接力。内容要明确要求当前 agent：

1. 网关启动后先进入日志监听。
2. 然后主动给用户发消息：**可以给新 agent 发消息了。**
3. 不要求用户回来确认；直接继续监听。
4. 从日志和消息里抓取这次激活相关的两类信息：
   - owner 的 `ou_...`
   - pairing code
5. 一旦拿到 `ou_...`，把它追加到：
   - 绑定账号的私聊 `allowFrom`
   - `channels.feishu.groupAllowFrom`
6. 一旦拿到 pairing code，立刻执行：

```bash
openclaw pairing approve feishu <code>
```

7. 完成后直接验证，不要再次重启。
8. 验证通过后，清理 `BOOT.md` 临时区块。
9. 最后再给用户一个完成提示，说明新 agent 已经配置好，可以继续直接和新 agent 聊。

## 监听与提取规则

当用户给新 agent 发出第一条消息后，新 agent 可能会回复类似：

```text
OpenClaw: access not configured.
ou_xxx
Pairing code:
4T4LRADK
Ask the bot owner to approve with:
openclaw pairing approve feishu 4T4LRADK
```

处理规则：

- `ou_...` 只取第一条有效 owner 标识。
- pairing code 优先从 `Pairing code:` 后一行提取。
- 如果格式不同，就从 `openclaw pairing approve feishu <code>` 这行里提取 `<code>`。
- 提取到 code 后，由**当前主 agent**执行 approve；不要把 approve 这一步留给用户。
- 设置完 `allowFrom` 和 approve 之后，不再做第二次重启；直接验证结果。

## BOOT.md 临时区块建议格式

追加区块时使用固定标记，方便清理：

```text
<!-- BEGIN mutli-feishu-agent temporary bootstrap -->
...
<!-- END mutli-feishu-agent temporary bootstrap -->
```

清理时：

- 只删除这个标记区块。
- 保留用户原有 `BOOT.md` 内容。
- 如果整个文件只有这个临时区块，直接删除 `BOOT.md`。

## 备份与恢复

改配置前必须先备份 `openclaw.json`。

备份模板：

```bash
cp /path/to/openclaw.json /path/to/openclaw.json.bak.manual-feishu
```

如果结果异常、配置损坏、绑定失败或删除误操作，优先按备份恢复：

```bash
cp /path/to/openclaw.json.bak.manual-feishu /path/to/openclaw.json
```

只有在用户明确确认最终结果正确后，才建议删除备份：

```bash
rm /path/to/openclaw.json.bak.manual-feishu
```

## 删除 agent

删除前先确认：

- 要删除的 `agent_id`
- 是否清理 feishu 绑定与相关配置
- 是否同时清理工作区

删除时按这个顺序处理：

1. 备份 `openclaw.json`。
2. 优先使用 OpenClaw 自带的删除、解绑、清理能力。
3. 如有需要，先解绑。
4. 清理 `channels.feishu.accounts.<agent_id>` 相关配置。
5. 清理该 agent 追加过的 `channels.feishu.groupAllowFrom` 条目。
6. 删除 agent。
7. 如果用户明确要求清理工作区，再清理工作区；否则保留工作区。
8. 先直接验证删除结果；只有验证未生效时才升级到重载或重启。
9. 只有用户明确确认删除结果正确后，才建议删除备份。

如果删除命令依赖版本或环境，不要臆造命令；先读取帮助输出或确认当前环境可用命令，再执行。

## 输出规则

- 优先给结论和下一步，不要长篇背景。
- 需要用户动作时，明确写成“现在请你做这一步”。
- 在创建流里，把链接和一次性收集项放在最前面。
