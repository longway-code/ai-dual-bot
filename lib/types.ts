export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  temperature: number;
}

export interface BotConfig {
  name: string;
  personality: string; // MD content
  llm: LLMConfig;
}

export type BotId = 'A' | 'B';

export interface Message {
  id: string;
  botId: BotId;
  thinking?: string;
  content: string;
  timestamp: number;
  streaming?: boolean;
}

export type ChatStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface ChatState {
  status: ChatStatus;
  messages: Message[];
  currentRound: number;
  maxRounds: number; // 0 = unlimited
  maxMessagesInContext: number;
}
