import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BotConfig, Message, ChatStatus, BotId } from '@/lib/types';
import { findMatchedScenario } from '@/lib/presets';

interface ChatStore {
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

const defaultPersonalityA = `# 爱因斯坦（Albert Einstein）

你扮演年轻时期的爱因斯坦（约35岁，1914年），刚刚发表广义相对论不久。

## 性格特点
- 充满好奇心，对一切自然现象都有强烈的探索欲
- 说话喜欢用类比和思想实验来解释复杂概念
- 有点理想主义，相信宇宙背后有简洁而深刻的规律
- 偶尔幽默，会自嘲，但在科学问题上认真执着
- 对音乐（尤其是莫扎特）有深厚感情，有时会引用音乐来类比物理

## 口头习惯
- 喜欢说"想象一下……"开头引入思想实验
- 经常提到"上帝不会掷骰子"这类对宇宙规律的信念
- 用"有趣！"表达对新观点的好奇

## 限制
- 以第一人称对话，不要破坏角色
- 不要提及1914年之后发生的事情`;

const defaultPersonalityB = `# 尼尔斯·玻尔（Niels Bohr）

你扮演量子力学奠基人玻尔（约40岁，1925年左右），哥本哈根诠释的核心倡导者。

## 性格特点
- 思维深邃，善于从哲学角度思考物理问题
- 说话有时绕来绕去，但总能抵达深刻的结论
- 对不确定性有独特的接受态度，认为这是自然的本质
- 温和但有韧性，愿意与爱因斯坦争论但始终保持尊重
- 强调观测与现实的关系，认为"现象"依赖于观测方式

## 口头习惯
- 喜欢说"相反的事物往往都是正确的"（互补原理）
- 用"但我们必须问……"来引出更深层的问题
- 会说"这个问题本身就很有趣"

## 限制
- 以第一人称对话，不要破坏角色
- 围绕量子力学与相对论的哲学分歧展开思考`;

const defaultScenario = `## 世纪之辩：量子与相对论的交锋

**时间**：1927年，布鲁塞尔，第五届索尔维会议期间的晚宴后

**场景**：爱因斯坦和玻尔在酒店大堂偶遇，各自手持一杯咖啡，坐在壁炉旁的扶手椅上。其他物理学家已散去，只剩他们两人。

**对话主题**：围绕"量子力学是否完备"展开深度讨论——爱因斯坦认为现实必有确定性，玻尔坚持不确定性是自然的根本属性。

**要求**：
- 两人以第一人称对话，保持各自的历史人物性格
- 可以引用真实的思想实验（如EPR悖论、薛定谔的猫的早期讨论）
- 对话要有思想碰撞，但保持互相尊重的学术氛围
- 每条回复控制在150字以内，对话自然流畅`;

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
  botA: {
    name: '爱因斯坦',
    personality: defaultPersonalityA,
    llm: { ...defaultLLM },
  },
  botB: {
    name: '玻尔',
    personality: defaultPersonalityB,
    llm: { ...defaultLLM },
  },
  scenario: defaultScenario,
  botAPresetId: 'einstein',
  botBPresetId: 'bohr',
  status: 'idle',
  messages: [],
  currentRound: 0,
  maxRounds: 10,
  maxMessagesInContext: 20,

  setBotConfig: (botId, config) =>
    set((state) => ({
      [botId === 'A' ? 'botA' : 'botB']: {
        ...state[botId === 'A' ? 'botA' : 'botB'],
        ...config,
        llm: config.llm
          ? { ...state[botId === 'A' ? 'botA' : 'botB'].llm, ...config.llm }
          : state[botId === 'A' ? 'botA' : 'botB'].llm,
      },
      // 手动修改则清除预设 ID
      [botId === 'A' ? 'botAPresetId' : 'botBPresetId']: null,
    })),

  applyCharacterPreset: (botId, presetId, name, personality) =>
    set((state) => {
      const botKey = botId === 'A' ? 'botA' : 'botB';
      const presetIdKey = botId === 'A' ? 'botAPresetId' : 'botBPresetId';
      const otherPresetId = botId === 'A' ? state.botBPresetId : state.botAPresetId;
      const newPresetId = presetId;

      // 自动匹配情景
      const matched = findMatchedScenario(newPresetId, otherPresetId);

      return {
        [botKey]: { ...state[botKey], name, personality },
        [presetIdKey]: newPresetId,
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
      // 只持久化配置，不持久化对话消息
      partialize: (state) => ({
        botA: state.botA,
        botB: state.botB,
        scenario: state.scenario,
        botAPresetId: state.botAPresetId,
        botBPresetId: state.botBPresetId,
        maxRounds: state.maxRounds,
        maxMessagesInContext: state.maxMessagesInContext,
      }),
    }
  )
);
