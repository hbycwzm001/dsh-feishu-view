# dsh-feishu-view

飞书（Feishu / Lark）工作台视图插件，用于 DeepSeek Harness：在会话顶栏加一个「飞书」标签，把常用动作收在一张卡片里。

> 入口默认隐藏，可在设置里打开（`showTab`）。隐藏只关界面入口，不影响插件与数据。

## 功能

- **接入状态**：显示是否配置了飞书应用凭据、用户令牌是否有效、哪个应用（只显示 App ID 尾号）。
- **速记**：一句话存进飞书文档。首次使用会在指定知识库里自动建「📝 速记本」，之后一直追加到同一份；也可以自己指定目标文档。
- **新建**：在知识库里建文档 / 多维表格。
- **浏览**：知识库节点、云空间文件夹列表，点开直达飞书网页。
- **上传**：把本地文件传到飞书云空间（可指定目标文件夹）。
- **每日情报**：读取本地归档的 JSON（目录可配），在卡片里展示最近几期。

## 依赖

- Node.js >= 22
- DeepSeek Harness >= 0.2.2-rc.1
- 一份可用的飞书凭据文件 `~/.dsh/dsh-feishu.json`（与 [`dsh-feishu-mcp`](https://github.com/zhengjy01/dsh-feishu-mcp) 共用同一份，字段：`appId` / `appSecret` / 可选 `userAccessToken` / `domain`）。

插件本身不发起 OAuth：令牌由 `dsh-feishu-mcp` 的授权流程写入，本插件只读取使用。要读写私有文档、知识库，`userAccessToken` 必须有效。

## 安装

在本机 DSH profile 的 `package.json` 里指向源码目录（开发态）：

```json
{
  "dependencies": {
    "dsh-feishu-view": "link:D:/path/to/dsh-feishu-view"
  }
}
```

或在 profile 的 `cordis.patch.yml` 里插入（同仓库内的 `cordis.patch.yml` 就是这段）：

```yaml
- insert:
    - id: feishu-view
      name: dsh-feishu-view
      config: {}
```

改完重启 DSH。

## 配置

设置持久化在 `~/.dsh/feishu-view/settings.json`（`DSH_HOME` 可改根目录）：

| 字段 | 说明 |
| --- | --- |
| `showTab` | 是否显示顶栏入口，默认 `false` |
| `kbSpaceId` | 默认知识库 space_id（知识库 URL 里 `space` 后面那串数字）。新建文档、自动建速记本都落在这里 |
| `intelDir` | 每日情报归档目录，读取 `YYYY-MM-DD.json` |
| `note` | 速记本位置缓存（`docToken` / `nodeToken` / `spaceId` / `url`），首次保存后自动写入 |
| `attachFolder` | 上传文件的默认云空间文件夹 token |

同名能力也可用环境变量覆盖：`FEISHU_VIEW_KB_SPACE_ID`、`FEISHU_INTEL_DIR`。

`kbSpaceId` 留空时，新建/速记会明确报错提示去配置，而不是静默失败。

## HTTP 接口

插件在 DSH web 服务上注册 `POST /api/feishu-view`，请求体 `{ method, payload }`，`method` 取值：

`status` / `inventory` / `settings` / `note` / `noteTarget` / `createDoc` / `createBitable` / `noteFile`

响应统一为 `{ ok: true, value }` 或 `{ ok: false, error: { code, message } }`。另有兼容入口 `GET /api/feishu-view/status`、`GET /api/feishu-view/inventory`、`POST /api/feishu-view/settings`。

## 安全提示

- 上面的 HTTP 接口**没有单独鉴权**，靠的是 DSH web 服务本身的访问控制。这些接口能以你的飞书身份读云空间、写文档、上传文件，**只适合本机使用，不要把 DSH 的 web 服务端口暴露到局域网或公网**。
- 飞书凭据在 `~/.dsh/dsh-feishu.json` 里是明文（App Secret、用户令牌），这是与 `dsh-feishu-mcp` 共用一份的既定格式，本插件只读不写；请确保该文件不要被同步盘、备份工具或截图带出去。插件自身的设置与清单快照在 `~/.dsh/feishu-view/`，新建文件按 0600 权限落盘。
- 用户令牌（`userAccessToken`）过期由 `dsh-feishu-mcp` 的授权流程负责刷新写回，本插件不持有刷新逻辑；面板提示「需要重新授权」时，去对话里重新走一次飞书授权即可。

## 关于 MCP 连接

本插件直接调飞书 OpenAPI，不经过 MCP。如果你同时使用 `dsh-feishu-mcp`（把飞书 API 暴露成模型可调用的 `mcp__feishu__*` 工具），那个插件的已知问题是：每次连接都跑 `npx -y @larksuiteoapi/lark-mcp`，冷启动要 11 秒且依赖 npm registry，失败累计 10 次后永久放弃重连。改成优先用本地 lark-mcp CLI 后可以稳定在 1.3 秒左右，重连也不再封顶。补丁没有放进本仓库（那是第三方 MIT 项目），只在这里记一笔，方便日后对齐。

## 许可

MIT，见 [LICENSE](LICENSE)。
