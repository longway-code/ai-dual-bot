import { useChatStore } from '@/stores/chatStore';
import { streamChat, buildMessages } from './llmClient';
import { BotId } from './types';

let abortController: AbortController | null = null;

export function getAbortController() {
  return abortController;
}

export async function runChatLoop() {
  const store = useChatStore.getState();
  abortController = new AbortController();

  const lastMsg = store.messages.slice(-1)[0];
  const startBotId: BotId = store.messages.length === 0 ? 'A' :
    (lastMsg?.botId === 'A' ? 'B' : 'A');

  let currentBotId: BotId = startBotId;

  while (true) {
    const state = useChatStore.getState();

    if (state.status !== 'running') break;
    if (state.maxRounds > 0 && state.currentRound >= state.maxRounds) {
      useChatStore.getState().setStatus('finished');
      break;
    }

    const currentBot = currentBotId === 'A' ? state.botA : state.botB;

    // Build message history
    const messages = buildMessages(
      currentBotId,
      state.botA,
      state.botB,
      state.scenario,
      state.messages,
      state.maxMessagesInContext,
      state.currentRound
    );

    // If no history and Bot A is starting, add scenario as first user message
    if (state.messages.length === 0) {
      const userMsg = state.scenario
        ? `情景开始：${state.scenario}\n\n请开始对话。`
        : '请开始一段有趣的对话。';
      messages.push({ role: 'user', content: userMsg });
    }

    // Create new message placeholder
    const msgId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    useChatStore.getState().addMessage({
      id: msgId,
      botId: currentBotId,
      thinking: undefined,
      content: '',
      timestamp: Date.now(),
      streaming: true,
    });

    try {
      // Stream the response
      for await (const chunk of streamChat(messages, currentBot.llm)) {
        // Check if paused/stopped during streaming
        const currentStatus = useChatStore.getState().status;
        if (currentStatus !== 'running') {
          useChatStore.getState().finalizeMessage(msgId);
          return;
        }

        if (chunk.type === 'thinking') {
          useChatStore.getState().appendThinkingDelta(msgId, chunk.delta);
        } else {
          useChatStore.getState().appendContentDelta(msgId, chunk.delta);
        }
      }

      useChatStore.getState().finalizeMessage(msgId);
      useChatStore.getState().incrementRound();

    } catch (error) {
      console.error('Stream error:', error);
      useChatStore.getState().appendContentDelta(msgId, `\n[错误: ${error instanceof Error ? error.message : String(error)}]`);
      useChatStore.getState().finalizeMessage(msgId);
      useChatStore.getState().setStatus('paused');
      break;
    }

    // Switch bots
    currentBotId = currentBotId === 'A' ? 'B' : 'A';

    // Small delay between turns
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
