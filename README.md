# AI Dual Bot

Two AI bots with configurable personalities debate each other automatically — real-time streaming, supports any OpenAI-compatible API.

**[中文文档 →](README.zh.md)**

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)

---

## Features

- **Automatic dual-bot debate** — Bot A and Bot B alternate turns; built-in anti-convergence keeps the debate heated
- **Streaming output** — Real-time token streaming; supports `<think>` tags and `reasoning_content` field (DeepSeek R1, o1-series)
- **Character × Scenario presets** — 10 modern character archetypes (VC, Engineer, Lawyer, Journalist…) + 10 paired debate scenarios with auto-matching
- **Context window** — Configurable message history per turn to control token usage
- **Any LLM** — Supports any OpenAI-compatible endpoint (OpenAI, DeepSeek, local Ollama, etc.); each bot can use a different model
- **Persistent config** — Bot config and scenario saved to localStorage; survives page refresh
- **i18n** — UI supports English and Chinese; switch with the language toggle in the header

---

## Why AI Dual Bot?

A single AI is an echo chamber — it agrees with you, refines your framing, and hands your assumptions back polished. Two AIs locked in structured opposition are something different: genuine tension that surfaces arguments you hadn't considered, reveals the weakest links in your reasoning, and forces both sides to stay committed to their positions.

### Use Cases

**Before making a decision — stress-test your thinking**
Set one bot to argue for your plan and the other to tear it apart. Watch what arguments emerge. The case you can't rebut is the risk you need to address.

> *A founder setting one bot as "VC pushing for growth" and the other as "CFO demanding profitability" will surface the real trade-offs faster than any spreadsheet.*

**Preparing for a difficult conversation**
About to pitch investors, negotiate a contract, or propose a controversial change to your team? Configure the bots to simulate both sides and run the conversation in advance. Know what objections are coming before you're in the room.

**Learning a new field through its core tensions**
Every discipline has live debates that textbooks flatten into settled consensus. Pick two expert archetypes, set a contested topic, and watch how practitioners on each side actually argue — what evidence they cite, what they dismiss, where they talk past each other.

> *A PM new to infrastructure debates can watch an Engineer and an AI Accelerationist argue about technical debt and come away understanding the actual stakes, not just the vocabulary.*

**Auditing your own blind spots**
If you already have a strong opinion, configure one bot to argue your position faithfully. Then watch it get challenged by the opposing bot. The moments where your position's bot struggles are the moments your own argument is weakest.

**Generating structured content**
Debate transcripts, dialogue-format articles, podcast scripts, explainer pieces that present genuine trade-offs — all are faster to produce when you start from a real AI-generated exchange rather than a blank page. Edit the output, don't write from scratch.

**Team alignment before a meeting**
Instead of going into a planning session where everyone holds unstated assumptions, run the core disagreement through the bots first. Share the transcript. The team arrives already having seen the best version of both arguments, and the meeting can start at synthesis rather than at "let me explain why I think..."

---

## Quick Start

```bash
git clone https://github.com/your-username/ai-dual-bot.git
cd ai-dual-bot
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **Settings** in the top-right, configure each bot's API key and model, then press **Start**.

---

## Configuration

Each bot is configured independently.

| Field | Description |
|---|---|
| **Base URL** | OpenAI-compatible endpoint, default `https://api.openai.com/v1` |
| **API Key** | API key for the endpoint (stored only in the browser, never sent to any backend) |
| **Model** | Model name, e.g. `gpt-4o`, `deepseek-reasoner`, `llama3` |
| **Temperature** | Generation randomness, recommended 0.7–1.0 |
| **Personality** | Character prompt in Markdown; type freely or pick from presets |

> API keys are forwarded through the `/api/chat` Edge route. **They are not logged or stored server-side.** For self-hosted deployments, set a server-side API key via environment variables instead.

---

## Character Presets

| Emoji | Character | Core Stance |
|---|---|---|
| 💰 | Silicon Valley VC | Scale above all, funding is oxygen |
| 🔧 | Indie Founder | Profit first, bootstrapped growth lasts |
| 📊 | Product Manager | Data-driven, ship the MVP |
| ⚙️ | Engineer / CTO | Architectural correctness, don't ship yet |
| 🤖 | AI Accelerationist | AGI is near, full speed ahead |
| 📰 | Investigative Journalist | Public right to know, scrutinize power |
| ⚖️ | Tech Lawyer | Legal framework first, compliance is foundation |
| 🩺 | Public Health Doctor | Population health, prevention over treatment |
| 📈 | Market Economist | Free markets, efficiency optimal |
| 🎓 | Education Reformer | Critical thinking, system reproduces inequality |

Selecting two characters **automatically matches** the paired scenario (e.g. VC × Indie Founder → "Should Startups Raise Funding?").

---

## Tech Stack

- **Framework**: Next.js 16 (App Router), Edge Runtime API route
- **UI**: React 19 + Tailwind CSS 4 + Radix UI + Lucide icons
- **State**: Zustand 5 with localStorage persistence
- **LLM**: Native `fetch` + OpenAI SSE stream parsing; supports `reasoning_content` field
- **i18n**: Lightweight translation dictionary in `lib/i18n.ts`; locale stored in Zustand
- **TypeScript**: v5, strict mode

---

## Architecture

```
app/
  page.tsx              # Root page — assembles all components
  api/chat/route.ts     # Edge route — proxies LLM requests

components/
  BotConfigPanel.tsx    # Bot config panel (includes character preset picker)
  ScenarioPanel.tsx     # Scenario panel (includes auto-match logic)
  ChatDisplay.tsx       # Message stream display
  ControlBar.tsx        # Start / Pause / Reset + parameter controls
  LanguageSwitcher.tsx  # EN ↔ 中文 toggle

lib/
  chatOrchestrator.ts   # Main loop: alternating turns, context window
  llmClient.ts          # Streaming fetch, SSE parsing, reasoning_content support
  parseThinking.ts      # Real-time <think>...</think> stream parser
  presets.ts            # Bilingual character + scenario presets; locale-aware exports
  i18n.ts               # Translation dictionary + useTranslation hook
  types.ts              # Shared TypeScript interfaces

stores/
  chatStore.ts          # Zustand store — drives all UI reactivity
```

---

## Deployment

### Vercel (recommended)

```bash
vercel deploy
```

The Edge Runtime API route works out of the box with zero configuration.

### Self-hosted

```bash
npm run build
npm run start
```

---

## Development

```bash
npm run dev     # Development server with hot reload
npm run build   # Production build
npm run lint    # ESLint check
```

No test framework is configured.

---

## License

MIT
