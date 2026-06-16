# 语音速记日程 App

> 按一下、说一句话，AI 自动把它记成一条清晰的日程。
> 第一版仅本人使用：PWA 前端 + Node.js 后端，部署在自己的腾讯云服务器，手机「添加到主屏幕」即用。

## 技术栈
- **前端**：React + Vite + TypeScript，PWA（可装主屏、全屏、离线缓存）
- **后端**：Node.js + Express + TypeScript，SQLite（better-sqlite3）
- **AI**：DeepSeek v4 pro（`deepseek-v4-pro`）+ 语音转写 `whisper-1`，均经 apimart.ai（OpenAI 兼容，`https://api.apimart.ai/v1`）
- **部署**：Docker Compose + Caddy（自动 HTTPS）

## 目录结构
```
server/        后端（接口、SQLite、apimart 调用）
web/           前端 PWA
deploy/Caddyfile  反向代理 + 自动 HTTPS 配置
Dockerfile     多阶段构建（前端 + 后端 → 单镜像）
docker-compose.yml
```

## 接口
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/health` | 健康检查（免鉴权） |
| POST | `/api/asr` | multipart 字段 `audio`，音频 → 文字 |
| POST | `/api/parse` | `{text, tz}` → `{entries:[…]}` |
| GET | `/api/schedules` | 列表，支持 `from/to/status` |
| POST | `/api/schedules` | 新增（单条或 `{entries:[…]}` 批量） |
| PATCH | `/api/schedules/:id` | 修改 |
| DELETE | `/api/schedules/:id` | 删除 |

除 `/api/health` 外，所有接口需请求头 `Authorization: Bearer <APP_TOKEN>`。

---

## 一、本地开发

```bash
# 后端
cd server
cp .env.example .env      # 填入 APIMART_API_KEY 和自定义 APP_TOKEN
npm install
npm run dev               # http://localhost:3000

# 前端（另开一个终端）
cd web
npm install
npm run dev               # http://localhost:5173 （已代理 /api 到 3000）
```

打开 http://localhost:5173 ，首次输入 APP_TOKEN 即可使用。

> 注意：浏览器调用麦克风要求 HTTPS 或 localhost。本地 `localhost` 可用；手机访问必须走下面的 HTTPS 部署。

---

## 二、部署到腾讯云轻量服务器（生产）

### 1. 准备
- 一台装好 **Docker** 与 **Docker Compose** 的腾讯云轻量应用服务器。
- 域名 **voice-schedule.aifeeling.tech** 的 A 记录解析到服务器公网 IP。
- 服务器安全组放行 **80 / 443** 端口。

### 2. 拉代码并配置环境变量
```bash
git clone <本仓库地址> richeng_anpai
cd richeng_anpai
cp server/.env.example .env      # 注意：compose 读取的是项目根目录的 .env
vim .env
```
`.env` 至少填：
```
APIMART_API_KEY=你的_apimart_key
APP_TOKEN=自定义一个长随机口令（手机端登录要用同一个）
CHAT_MODEL=deepseek-v4-pro
ASR_MODEL=whisper-1
APIMART_BASE_URL=https://api.apimart.ai/v1
DEFAULT_TZ=Asia/Shanghai
```

### 3. 启动
```bash
docker compose up -d --build
```
Caddy 会自动为 voice-schedule.aifeeling.tech 申请 HTTPS 证书。稍等片刻后访问：
```
https://voice-schedule.aifeeling.tech
```

### 4. 在 iPhone 上「装」成 App
1. 用 **Safari** 打开 `https://voice-schedule.aifeeling.tech`
2. 点底部分享按钮 → **添加到主屏幕**
3. 主屏会出现 App 图标，点开全屏运行
4. 首次进入输入 `APP_TOKEN`，允许麦克风权限
5. 按住麦克风按钮说一句话即可

### 5. （可选）操作按钮 / Siri 秒级触发
用 iOS「快捷指令」App 新建一个动作：**打开 URL → `https://voice-schedule.aifeeling.tech`**，命名为「记日程」。
- iPhone 15 Pro 及以上：设置 → 操作按钮 → 快捷指令 → 选「记日程」。
- 或对 Siri 说「记日程」唤起。

---

## 三、运维
```bash
docker compose logs -f app     # 看后端日志
docker compose restart app     # 重启
docker compose down            # 停止
```
- 数据库文件在宿主机 `./data/schedule.db`，备份此文件即可备份全部日程。
- 改了代码后：`git pull && docker compose up -d --build`。

## 四、安全说明
- apimart key、APP_TOKEN 只存在服务器 `.env`，不进前端代码。
- 所有接口经 HTTPS；业务接口用 APP_TOKEN 鉴权，避免被公网随意调用。
- 音频仅用于即时识别，服务器不持久化音频。
