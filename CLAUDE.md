# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

**AI Dual Bot** is a Next.js app where two AI bots with configurable personalities automatically debate each other in real-time. The conversation alternates between Bot A and Bot B, with an optional moderator that injects probing questions at configurable intervals.

### Data Flow

1. User configures two bots (name, personality, LLM endpoint/model) via `BotConfigPanel`
2. User starts the chat via `ControlBar` → triggers `runChatLoop()` in `lib/chatOrchestrator.ts`
3. Orchestrator alternates turns: builds message history → calls `lib/llmClient.ts` → streams tokens to store
4. `app/api/chat/route.ts` (Edge runtime) proxies LLM requests to any OpenAI-compatible API
5. Zustand store (`stores/chatStore.ts`) drives all UI reactivity; messages are NOT persisted

### Key Files

- **`lib/chatOrchestrator.ts`** — Main loop: alternates bots, injects moderator messages, handles pause/abort, applies context windowing
- **`lib/llmClient.ts`** — Streaming fetch client; parses OpenAI SSE format; supports both `content` and `reasoning_content` fields (for DeepSeek R1, o1-style models)
- **`lib/parseThinking.ts`** — Streams `<think>...</think>` tag parsing; separates reasoning from response content
- **`lib/presets.ts`** — Bilingual (zh/en) character presets (VC, Bootstrapper, PM, Engineer, AI-bull, Journalist, Lawyer, Doctor, Economist, Educator) + 10 scenario presets; exports locale-aware `getCharacterPresets(locale)` and `getScenarioPresets(locale)` functions
- **`lib/i18n.ts`** — Full UI translation dictionary for `zh` and `en`; exports `useTranslation()` hook and `getTranslations(locale)` function
- **`stores/chatStore.ts`** — Zustand store with localStorage persistence for bot configs, scenario, locale, and settings (but not messages)
- **`lib/types.ts`** — All shared TypeScript interfaces: `BotConfig`, `Message`, `ChatStatus`, `LLMConfig`, `Locale`

### Notable Patterns

- **Anti-convergence:** System prompts instruct bots to hold their position and not agree with each other
- **Round hints:** Later rounds inject increasingly challenging instructions to deepen conflict
- **Extended thinking support:** `llmClient.ts` handles `reasoning_content` for models that expose chain-of-thought; `parseThinking.ts` handles `<think>` tag variants
- **Context windowing:** Only last N messages sent per turn (configurable) to control token usage
- **i18n:** Locale (`'zh' | 'en'`) is stored in Zustand and persisted to localStorage. All components read locale via `useTranslation()`. Preset content is bilingual in `lib/presets.ts` and projected to the active locale via `getCharacterPresets(locale)` / `getScenarioPresets(locale)`.
- **Import alias:** `@/*` maps to the project root

### LLM API

The `/api/chat` route accepts `{ messages, config }` where `config` is `LLMConfig` (`baseURL`, `apiKey`, `model`, `temperature`). It forwards streaming SSE responses directly to the client. Supports any OpenAI-compatible endpoint.
