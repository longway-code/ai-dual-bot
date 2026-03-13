# AI 双机器人对话 · AI Dual Bot

两个 AI 用你配置的人格，自动辩论——实时流式输出，支持任何 OpenAI 兼容接口。

**[English Documentation →](README.md)**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)

---

## 功能

- **双 Bot 自动辩论** — Bot A 和 Bot B 交替发言，内置反收敛机制让对话持续对立
- **流式输出** — 实时 token 流，支持 `<think>` 标签和 `reasoning_content` 字段（DeepSeek R1、o1 系列）
- **预设角色 × 情景** — 10 个现代角色（VC、工程师、律师、记者…）+ 10 个配对情景，选角色自动匹配辩题
- **可选主持人** — 可配置一个主持 Bot，按轮数间隔注入追问，打破僵局
- **上下文窗口** — 可调节每轮发送的消息数量，控制 token 用量
- **任意 LLM** — 支持任何 OpenAI 兼容接口（OpenAI、DeepSeek、本地 Ollama 等），两个 Bot 可用不同模型
- **配置持久化** — Bot 配置、情景通过 localStorage 保存，刷新不丢失
- **中英文界面** — 点击右上角语言切换按钮，UI 即时切换为中文或英文

---

## 快速开始

```bash
# 克隆
git clone https://github.com/your-username/ai-dual-bot.git
cd ai-dual-bot

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000)，点击右上角**展开设置**，配置 Bot 的 API Key 和模型后即可开始。

---

## 配置说明

每个 Bot 独立配置，互不干扰。

| 字段 | 说明 |
|---|---|
| **Base URL** | OpenAI 兼容接口地址，默认 `https://api.openai.com/v1` |
| **API Key** | 对应接口的 Key（仅存在浏览器本地，不经过服务端） |
| **Model** | 模型名，如 `gpt-4o`、`deepseek-reasoner`、`llama3` |
| **Temperature** | 生成随机性，推荐 0.7–1.0 |
| **Personality** | 角色人格，支持 Markdown，可手写或从预设选择 |

> API Key 通过 `/api/chat` Edge 路由代理转发，**不存服务端、不做日志**。如需自部署，建议在服务端环境变量里配置统一 Key。

---

## 预设角色

| emoji | 角色 | 核心立场 |
|---|---|---|
| 💰 | 硅谷VC | 规模至上，融资是创业的氧气 |
| 🔧 | 独立创业者 | 利润第一，不融资慢慢做大 |
| 📊 | 产品经理 | 数据驱动，MVP 先跑起来 |
| ⚙️ | 工程师/CTO | 架构正确性，先别发布 |
| 🤖 | AI加速派 | AGI 将至，全速加速 |
| 📰 | 调查记者 | 公众知情权，警惕权力集中 |
| ⚖️ | 科技律师 | 法律框架先行，合规优先 |
| 🩺 | 公卫医生 | 群体健康，预防优先 |
| 📈 | 市场经济学家 | 自由市场，效率最优 |
| 🎓 | 教育改革者 | 批判性思维，系统不公平 |

选定两个角色后，**情景面板自动匹配**对应辩题（如 VC × 独立创业者 → "创业该不该融资？"）。

---

## 技术栈

- **框架**：Next.js 16 (App Router)，Edge Runtime API 路由
- **UI**：React 19 + Tailwind CSS 4 + Radix UI + Lucide
- **状态管理**：Zustand 5，localStorage 持久化
- **LLM 接入**：原生 `fetch` + OpenAI SSE 流解析，支持 `reasoning_content` 字段
- **类型系统**：TypeScript 5，严格模式

---

## 架构概览

```
app/
  page.tsx              # 主页，组装所有组件
  api/chat/route.ts     # Edge 路由，代理 LLM 请求

components/
  BotConfigPanel.tsx    # Bot 配置面板（含角色预设选择）
  ScenarioPanel.tsx     # 情景配置面板（含自动匹配）
  ChatDisplay.tsx       # 消息流展示
  ControlBar.tsx        # 开始/暂停/重置 + 参数调节

lib/
  chatOrchestrator.ts   # 主循环：交替发言、注入主持消息、上下文窗口
  llmClient.ts          # 流式 fetch，解析 SSE + reasoning_content
  parseThinking.ts      # <think>...</think> 实时流式解析
  presets.ts            # 角色预设 + 情景预设 + 自动匹配逻辑
  types.ts              # 共享类型定义

stores/
  chatStore.ts          # Zustand store，驱动所有 UI 响应
```

---

## 部署

### Vercel（推荐）

```bash
vercel deploy
```

Edge Runtime 无需额外配置，API 路由自动以 Edge 函数运行。

### 自托管

```bash
npm run build
npm run start
```

---

## 本地开发

```bash
npm run dev     # 开发服务器（带热更新）
npm run build   # 生产构建
npm run lint    # ESLint 检查
```

无测试框架。

---

## License

MIT
