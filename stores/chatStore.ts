import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BotConfig, Message, ChatStatus, BotId, Locale, SearchConfig } from '@/lib/types';
import { findMatchedScenario, getCharacterPresets, getScenarioPresets } from '@/lib/presets';

interface ChatStore {
  // Locale
  locale: Locale;
  setLocale: (locale: Locale) => void;

  // Config
  botA: BotConfig;
  botB: BotConfig;
  scenario: string;
  botAPresetId: string | null;
  botBPresetId: string | null;

  // Chat state
  status: ChatStatus;
  messages: Message[];
  currentRound: number;
  maxRounds: number;
  maxMessagesInContext: number;

  // Search
  searchConfig: SearchConfig;
  setSearchConfig: (config: Partial<SearchConfig>) => void;

  // Actions
  setBotConfig: (botId: BotId, config: Partial<BotConfig>) => void;
  applyCharacterPreset: (botId: BotId, presetId: string, name: string, personality: string) => void;
  setScenario: (scenario: string) => void;
  setMaxRounds: (n: number) => void;
  setMaxMessagesInContext: (n: number) => void;
  setStatus: (status: ChatStatus) => void;
  addMessage: (msg: Message) => void;
  appendThinkingDelta: (id: string, delta: string) => void;
  appendContentDelta: (id: string, delta: string) => void;
  finalizeMessage: (id: string) => void;
  resetChat: () => void;
  incrementRound: () => void;
}

const defaultLLM = {
  baseURL: 'https://api.openai.com/v1',
  apiKey: '',
  model: 'gpt-4o-mini',
  temperature: 0.8,
};

// Use VC + Bootstrapper as defaults (matching the new presets)
const defaultPresetA = getCharacterPresets('zh').find((p) => p.id === 'vc')!;
const defaultPresetB = getCharacterPresets('zh').find((p) => p.id === 'bootstrapper')!;
const defaultScenario = getScenarioPresets('zh').find((s) => s.id === 'vc-bootstrapper')!;

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      locale: 'zh',

      botA: {
        name: defaultPresetA.name,
        personality: defaultPresetA.personality,
        llm: { ...defaultLLM },
      },
      botB: {
        name: defaultPresetB.name,
        personality: defaultPresetB.personality,
        llm: { ...defaultLLM },
      },
      scenario: defaultScenario.content,
      botAPresetId: 'vc',
      botBPresetId: 'bootstrapper',
      searchConfig: {
        enabled: false,
        provider: 'brave',
        apiKey: '',
        maxResults: 3,
      },
      status: 'idle',
      messages: [],
      currentRound: 0,
      maxRounds: 10,
      maxMessagesInContext: 20,

      setLocale: (locale) => set({ locale }),
      setSearchConfig: (config) =>
        set((state) => ({ searchConfig: { ...state.searchConfig, ...config } })),

      setBotConfig: (botId, config) =>
        set((state) => ({
          [botId === 'A' ? 'botA' : 'botB']: {
            ...state[botId === 'A' ? 'botA' : 'botB'],
            ...config,
            llm: config.llm
              ? { ...state[botId === 'A' ? 'botA' : 'botB'].llm, ...config.llm }
              : state[botId === 'A' ? 'botA' : 'botB'].llm,
          },
          // Manual edit clears preset ID
          [botId === 'A' ? 'botAPresetId' : 'botBPresetId']: null,
        })),

      applyCharacterPreset: (botId, presetId, name, personality) =>
        set((state) => {
          const botKey = botId === 'A' ? 'botA' : 'botB';
          const presetIdKey = botId === 'A' ? 'botAPresetId' : 'botBPresetId';
          const otherPresetId = botId === 'A' ? state.botBPresetId : state.botAPresetId;

          const matched = findMatchedScenario(presetId, otherPresetId, state.locale);

          return {
            [botKey]: { ...state[botKey], name, personality },
            [presetIdKey]: presetId,
            ...(matched ? { scenario: matched.content } : {}),
          };
        }),

      setScenario: (scenario) => set({ scenario }),
      setMaxRounds: (maxRounds) => set({ maxRounds }),
      setMaxMessagesInContext: (maxMessagesInContext) => set({ maxMessagesInContext }),
      setStatus: (status) => set({ status }),

      addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

      appendThinkingDelta: (id, delta) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, thinking: (m.thinking ?? '') + delta } : m
          ),
        })),

      appendContentDelta: (id, delta) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, content: m.content + delta } : m
          ),
        })),

      finalizeMessage: (id) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === id ? { ...m, streaming: false } : m
          ),
        })),

      resetChat: () =>
        set({ messages: [], currentRound: 0, status: 'idle' }),

      incrementRound: () =>
        set((state) => ({ currentRound: state.currentRound + 1 })),
    }),
    {
      name: 'ai-dual-bot-storage',
      // Persist config and locale, not chat messages
      partialize: (state) => ({
        locale: state.locale,
        botA: state.botA,
        botB: state.botB,
        scenario: state.scenario,
        botAPresetId: state.botAPresetId,
        botBPresetId: state.botBPresetId,
        maxRounds: state.maxRounds,
        maxMessagesInContext: state.maxMessagesInContext,
        searchConfig: state.searchConfig,
      }),
    }
  )
);
