# AI 双机器人对话 · AI Dual Bot

两个 AI 用你配置的人格，自动辩论——实时流式输出，支持任何 OpenAI 兼容接口。

**[English Documentation →](README.md)**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)

---

## 功能

- **双 Bot 自动辩论** — Bot A 和 Bot B 交替发言，内置反收敛机制让对话持续对立
- **流式输出** — 实时 token 流，支持 `<think>` 标签和 `reasoning_content` 字段（DeepSeek R1、o1 系列）
- **按需联网搜索** — 基于 LLM 原生 Tool Calling，Bot 在辩论过程中自主决定何时调用 `web_search`；支持 Brave Search、Tavily、Serper
- **预设角色 × 情景** — 10 个现代角色（VC、工程师、律师、记者…）+ 10 个配对情景，选角色自动匹配辩题
- **上下文窗口** — 可调节每轮发送的消息数量，控制 token 用量
- **任意 LLM** — 支持任何 OpenAI 兼容接口（OpenAI、DeepSeek、本地 Ollama 等）以及 Anthropic 原生 API（Claude）；两个 Bot 可用不同模型
- **配置持久化** — Bot 配置、情景通过 localStorage 保存，刷新不丢失
- **中英文界面** — 点击右上角语言切换按钮，UI 即时切换为中文或英文

---

## 这个产品有什么用？

单个 AI 是回音壁——它会顺着你的思路、打磨你的措辞、把你的假设原样还给你。两个 AI 在结构化的对立框架里截然不同：它们产生真实的张力，会逼出你没考虑过的论点，暴露你推理链里最薄弱的环节，并且会一直守住各自的立场，不会向对方妥协。

### 使用场景

**做决定之前——压力测试你的想法**
把一个 Bot 设成支持你方案的角色，另一个设成唱反调的。看看对手能拆出哪些漏洞。你反驳不了的那个论点，就是你真正需要解决的风险。

> *创业者把一个 Bot 设成"催增长的 VC"，另一个设成"要盈利的 CFO"，比任何财务模型都更快地暴露真正的取舍。*

**准备一场艰难对话**
即将和投资人 pitch？要和甲方谈判？要向团队提一个有争议的方案？先让两个 Bot 把这场对话演一遍。在真正进场之前就知道对方会打什么牌。

**通过核心争议来学一个新领域**
每个行业都有活着的争论，教科书把它们压平成"已解决的共识"。选两个专家角色、设一个有争议的题目，看看真实从业者是怎么吵架的——他们引用什么证据、怎么驳斥对方、在哪里鸡同鸭讲。

> *刚接触后端架构争论的 PM，看工程师和 AI加速派为技术债吵一架，出来就能理解这个争论真正的筹码，而不只是词汇表。*

**审查自己的盲点**
如果你已经有强烈立场，就让一个 Bot 忠实地代表你的观点。然后看它被对面的 Bot 怼。你的 Bot 扛不住的地方，就是你自己的论点最弱的地方。

**生成有结构的内容**
辩论对话稿、对话体文章、播客脚本、呈现真实分歧的深度解析——从 AI 生成的真实交锋出发，比从空白页开始快一个数量级。你只需要编辑，不需要从零构建。

**会议前对齐团队**
与其让大家带着各自的隐藏假设坐进会议室，不如先把核心分歧扔给两个 Bot 跑一遍，把记录分享给团队。所有人到场时都已经看过两边最完整的论证，会议可以从"好，我们来找出路"开始，而不是从"让我解释一下为什么我觉得……"开始。

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
| **Base URL** | 接口地址。OpenAI 兼容默认：`https://api.openai.com/v1`；Anthropic（Claude）填 `https://api.anthropic.com`，协议自动识别。 |
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

## 联网搜索

Bot 在辩论过程中可通过 LLM 原生 Tool Calling 按需搜索网络。开启后，模型自主判断何时调用 `web_search`——通常在需要引用近期新闻、数据或政策时触发。

**带搜索的轮次流程：**
```
构建消息（含 web_search 工具定义）
  → streamChat() → finish_reason: "tool_calls"?
      ├─ 是：调用 /api/search → 注入结果 → 第二次 streamChat() → 最终回答
      └─ 否：正常流式输出
```

**支持的搜索服务**（均需 API Key）：

| 服务 | 免费额度 | 说明 |
|---|---|---|
| **Brave Search** | 2000次/月 | 真实 Web 搜索，服务端环境稳定 |
| **Tavily** | 1000次/月 | AI 专项优化，结构化摘要，质量最佳 |
| **Serper** | 2500次/月 | Google 结果封装 |

在控制栏底部的**联网搜索**行启用。需要模型支持 Function Calling（GPT-4o、DeepSeek V3、Qwen2.5 等）。若模型不支持，辩论正常继续，搜索步骤静默跳过。

---

## 技术栈

- **框架**：Next.js 16 (App Router)，Edge Runtime API 路由
- **UI**：React 19 + Tailwind CSS 4 + Radix UI + Lucide
- **状态管理**：Zustand 5，localStorage 持久化
- **LLM 接入**：原生 `fetch`；支持 OpenAI 兼容 SSE 和 Anthropic 原生 API（服务端在 `/api/chat` 做协议归一化）；支持 `reasoning_content` 和 Tool Calling
- **联网搜索**：服务端 Edge 路由代理搜索请求（Brave / Tavily / Serper），规避浏览器 CORS 限制
- **类型系统**：TypeScript 5，严格模式

---

## 架构概览

```
app/
  page.tsx              # 主页，组装所有组件
  api/chat/route.ts     # Edge 路由，代理 LLM 请求；自动识别 Anthropic / OpenAI 协议并归一化
  api/search/route.ts   # Edge 路由，代理搜索请求（Brave / Tavily / Serper）

components/
  BotConfigPanel.tsx    # Bot 配置面板（含角色预设选择）
  ScenarioPanel.tsx     # 情景配置面板（含自动匹配）
  ChatDisplay.tsx       # 消息流展示
  ControlBar.tsx        # 开始/暂停/重置 + 参数调节 + 联网搜索开关

lib/
  chatOrchestrator.ts   # 主循环：交替发言、上下文窗口、tool_call 处理
  llmClient.ts          # 流式 fetch，解析 SSE + tool_calls delta 累积
  searchClient.ts       # fetchSearchContext()，调用 /api/search
  parseThinking.ts      # <think>...</think> 实时流式解析
  presets.ts            # 角色预设 + 情景预设 + 自动匹配逻辑
  types.ts              # 共享类型定义（含 SearchConfig）

stores/
  chatStore.ts          # Zustand store，驱动所有 UI 响应（含 searchConfig）
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
