import { useChatStore } from '@/stores/chatStore';
import { Locale } from './types';

export type { Locale };

export const translations = {
  zh: {
    appTitle: 'AI 双机器人对话',
    settings: { open: '展开设置', close: '收起设置' },
    botConfig: {
      selectPresetTooltip: '选择角色预设',
      selectPresetButton: '选角色',
      selectPresetHeading: '选择角色',
      personalityLabel: '性格设定 (Markdown)',
      personalityPlaceholder: '描述这个 Bot 的性格、背景、说话风格...',
      apiKeyHide: '隐藏',
      apiKeyShow: '显示',
      tempPrecise: '0 严谨',
      tempBalanced: '1 平衡',
      tempCreative: '2 随机',
    },
    scenario: {
      heading: '情景设定',
      matched: '已匹配',
      selectTooltip: '选择情景预设',
      selectButton: '选情景',
      exclusiveSection: '当前角色专属',
      otherSection: '其他情景',
      matchedHint: '发现专属情景：',
      applyButton: '应用',
      placeholder: '描述对话的场景、背景、目标...（留空则由 Bot A 自由开场）',
    },
    chat: {
      idleHint: '配置好 Bot 后点击「开始」开始对话',
      waitingHint: '等待对话开始...',
    },
    control: {
      resume: '继续',
      start: '开始',
      pause: '暂停',
      reset: '重置',
      round: (n: number) => `第 ${n} 轮`,
      finished: '已完成',
      maxRoundsLabel: '轮数上限',
      maxRoundsHint: '(0=不限)',
      contextLabel: '上下文消息数',
    },
    message: {
      thinkingHeading: '思考过程',
      thinkingPlaceholder: '思考中...',
    },
    editor: { uploadButton: '上传 .md 文件' },
    orchestrator: {
      scenarioStart: (s: string) => `情景开始：${s}\n\n请开始对话。`,
      defaultStart: '请开始一段有趣的对话。',
      errorPrefix: (msg: string) => `\n[错误: ${msg}]`,
    },
    lang: { label: '中文', switchTo: 'EN' },
  },
  en: {
    appTitle: 'AI Dual Bot',
    settings: { open: 'Settings', close: 'Close' },
    botConfig: {
      selectPresetTooltip: 'Select a character preset',
      selectPresetButton: 'Pick role',
      selectPresetHeading: 'Characters',
      personalityLabel: 'Personality (Markdown)',
      personalityPlaceholder: "Describe this bot's personality, background, and speaking style...",
      apiKeyHide: 'Hide',
      apiKeyShow: 'Show',
      tempPrecise: '0 Precise',
      tempBalanced: '1 Balanced',
      tempCreative: '2 Creative',
    },
    scenario: {
      heading: 'Scenario',
      matched: 'Matched',
      selectTooltip: 'Select a scenario preset',
      selectButton: 'Pick scenario',
      exclusiveSection: 'For Selected Characters',
      otherSection: 'Other Scenarios',
      matchedHint: 'Matched scenario: ',
      applyButton: 'Apply',
      placeholder: 'Describe the debate context, background, and goal... (leave empty for Bot A to open freely)',
    },
    chat: {
      idleHint: 'Configure bots and press Start to begin',
      waitingHint: 'Waiting for the conversation to start...',
    },
    control: {
      resume: 'Resume',
      start: 'Start',
      pause: 'Pause',
      reset: 'Reset',
      round: (n: number) => `Round ${n}`,
      finished: 'Finished',
      maxRoundsLabel: 'Max Rounds',
      maxRoundsHint: '(0=∞)',
      contextLabel: 'Context Messages',
    },
    message: {
      thinkingHeading: 'Thinking Process',
      thinkingPlaceholder: 'Thinking...',
    },
    editor: { uploadButton: 'Upload .md file' },
    orchestrator: {
      scenarioStart: (s: string) => `Scenario: ${s}\n\nPlease begin the conversation.`,
      defaultStart: 'Please start an engaging conversation.',
      errorPrefix: (msg: string) => `\n[Error: ${msg}]`,
    },
    lang: { label: 'EN', switchTo: '中文' },
  },
} as const;

export type T = typeof translations['zh'];

export function getTranslations(locale: Locale): T {
  return translations[locale] as unknown as T;
}

export function useTranslation(): T {
  const locale = useChatStore((s) => s.locale);
  return getTranslations(locale);
}
