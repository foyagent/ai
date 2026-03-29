---
name: mutli-feishu-agent
description: 用中文处理 openclaw feishu 独立 agent 的创建、激活、排查和删除。适用于用户先通过飞书创建页一次性提供名称、app_id、app_secret、可选 agent_id 和可选 workspace_path；如果未提供 agent_id，就根据名称自动生成。随后由 agent 负责备份 openclaw.json、创建 agent、写入配置、绑定 feishu、优先不重启并先验证是否生效、开始日志监听、收集 owner 的 ou_、补充 allowFrom 和 channels.feishu.groupAllowFrom，并在删除时先确认是否清理工作区且优先使用 openclaw 自带删除能力。
---

# Mutli Feishu Agent

用这个 skill 处理 OpenClaw Feishu 独立 agent 的创建、激活、排查和删除。

## 原则

- 不要把流程写成纯用户手动。
- 用户负责提供信息，和新 agent 对话触发 owner 标识收集。
- 其他步骤默认由 agent 执行；只有当前环境无法执行命令时，才给用户可复制命令。
- 不用 Playwright，不写脚本，不拆成很多轮确认。
- 修改配置后默认不重启；先直接验证是否生效，只有未生效时才升级到重载或重启。
- 提示用户发消息前，先进入日志监听。

## 需要收集的信息

- `name`
- `app_id`
- `app_secret`
- `agent_id`（可选）
- `workspace_path`（可选）

`agent_id` 规则：

- 如果用户传了 `agent_id`，直接使用。
- 如果用户没传，就根据 `name` 自动生成。
- 非中文名称：转英文小写；多个单词用下划线连接。
- 中文名称：转拼音小写。
- 把空格、短横线和连续分隔符统一规整为单个下划线。
- 最终只保留小写字母、数字和下划线。

示例：

```text
My Agent -> my_agent
Risk-Control Bot -> risk_control_bot
测试助手 -> ceshizhushou
```

如果用户没给 `workspace_path`，默认使用：

```text
~/.openclaw/workspaces/<agent_id>
```

`channels.feishu.accounts.<agent_id>` 的 key 就是最终确定的 `agent_id`。

## 创建与激活

按两步组织。

### 第一步：用户一次性提供信息

先把飞书创建链接发给用户：

```text
https://open.larkoffice.com/page/openclaw?form=multiAgent
```

要求用户一次性提供：

- `name`
- `app_id`
- `app_secret`
- `agent_id`（可选）
- `workspace_path`（可选）

收到后，agent 继续完成：

1. 先确定 `agent_id`。如果用户没传，就按名称自动生成，并把结果明确告知用户。
2. 确定 `workspace_path`。
3. 先备份 `openclaw.json`。
4. 创建 agent。
5. 设置 `channels.feishu.session.dmScope` 为 `per-account-channel-peer`。
6. 写入 `channels.feishu.accounts.<agent_id>.appId`、`appSecret`、`name`。
7. 绑定 `feishu:<agent_id>`。
8. 先直接验证配置是否已生效；只有验证未生效时，才执行重载或重启。
9. 立即开始日志监听。
10. 再提示用户去给新 agent 发一条私聊消息。

这一阶段要点：

- 不要默认重启。
- 不要在提示用户发消息之前才准备监听；必须先进入日志监听，再发提示。
- 提示用户时要明确说：**我已经开始监听，你只需要给新 agent 发一条私聊消息，不需要回来报告已发送。**

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
openclaw logs --follow
```

### 第二步：用户只做一次激活

现在请用户只做这一件事：

- 从飞书给新 agent 发一条私聊消息。

用户不需要再回来报告“已发送”。

agent 继续完成：

1. 从日志里提取第一条有效的 `ou_...`。
2. 把这个值加入绑定账号的私聊 `allowFrom`。
3. 同时把这个值加入 `channels.feishu.groupAllowFrom`。
4. 先直接验证新 agent 是否已经激活；只有验证未生效时，才执行重载或重启并再次验证。
5. 如平台支持处理或重放刚才那条消息，新 agent 应主动回复并告知“已激活”；否则再把“请再发一条消息”作为兜底方案。

规则：

- 只把第一条 `ou_...` 当成 owner 标识。
- 不要把 `on_...` 当成目标值。
- 私聊 `allowFrom` 要优先追加，不要盲目覆盖已有值。
- `channels.feishu.groupAllowFrom` 也按追加处理，不要盲目覆盖已有值。

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

即使成功，也不要立刻删备份。只有在用户明确确认最终结果正确后，才建议删除备份：

```bash
rm /path/to/openclaw.json.bak.manual-feishu
```

## 删除 agent

删除前先确认：

- 要删除的 `agent_id`
- 是否要同时清理 feishu 绑定与相关配置
- 是否要同时清理工作区

删除时按这个顺序组织：

1. 备份 `openclaw.json`。
2. 优先使用 openclaw 自带的删除、解绑、清理能力；只有当前环境做不到时，才退回手动清理配置。
3. 如有需要，先解绑。
4. 清理 `channels.feishu.accounts.<agent_id>` 相关配置。
5. 清理该 agent 追加过的 `channels.feishu.groupAllowFrom` 条目。
6. 删除 agent。
7. 如果用户明确要求清理工作区，再清理工作区；否则保留工作区。
8. 先直接验证删除结果；只有验证未生效时，才执行重载或重启并再次验证。
9. 只有用户明确确认删除结果正确后，才建议删除备份。

如果删除命令依赖版本或环境，不要臆造命令；先读取帮助输出或让用户提供可用命令，再执行。

## 输出规则

- 优先给结论和下一步，不要长篇背景。
- 需要用户动作时，明确写成“现在请你做这一步”。
- 在创建流里，把链接和一次性收集项放在最前面。
