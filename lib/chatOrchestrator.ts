import { useChatStore } from '@/stores/chatStore';
import { streamChat, buildMessages } from './llmClient';
import { fetchSearchContext } from './searchClient';
import { BotId } from './types';
import { getTranslations } from './i18n';

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
    const { searchConfig } = state;
    const searchEnabled = searchConfig.enabled;

    // Build message history
    const messages = buildMessages(
      currentBotId,
      state.botA,
      state.botB,
      state.scenario,
      state.messages,
      state.maxMessagesInContext,
      state.currentRound,
      searchEnabled
    );

    // If no history and Bot A is starting, add scenario as first user message
    if (state.messages.length === 0) {
      const ot = getTranslations(state.locale);
      const userMsg = state.scenario
        ? ot.orchestrator.scenarioStart(state.scenario)
        : ot.orchestrator.defaultStart;
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
      let toolCallHandled = false;

      // First stream pass
      for await (const chunk of streamChat(messages, currentBot.llm, searchEnabled)) {
        const currentStatus = useChatStore.getState().status;
        if (currentStatus !== 'running') {
          useChatStore.getState().finalizeMessage(msgId);
          return;
        }

        if (chunk.type === 'tool_call' && chunk.name === 'web_search') {
          toolCallHandled = true;
          const t = getTranslations(useChatStore.getState().locale);

          // Show "Searching..." status in the message
          useChatStore.getState().appendContentDelta(msgId, `[${t.search.searching}]`);

          let searchResult = '';
          try {
            const query = JSON.parse(chunk.arguments ?? '{}').query ?? '';
            console.log('[search] querying:', query);
            searchResult = await fetchSearchContext(query, searchConfig);
            console.log('[search] result:', searchResult.slice(0, 100));
          } catch (err) {
            console.error('[search] fetchSearchContext failed:', err);
            const t2 = getTranslations(useChatStore.getState().locale);
            useChatStore.getState().appendContentDelta(msgId, ` ${t2.search.searchFailed}.`);
          }

          // Clear searching indicator from content before the real response
          // by resetting and doing a second call with tool results injected
          const toolCallMessages = [
            ...messages,
            {
              role: 'assistant' as const,
              content: '',
            },
            {
              role: 'user' as const,
              content: searchResult
                ? `[搜索结果]\n${searchResult}`
                : '[搜索无结果，请根据已有知识继续回答]',
            },
          ];

          // Reset message content (remove the searching indicator)
          useChatStore.getState().appendContentDelta(msgId, '\n');

          // Second stream pass with search result
          for await (const chunk2 of streamChat(toolCallMessages, currentBot.llm, false)) {
            const status2 = useChatStore.getState().status;
            if (status2 !== 'running') {
              useChatStore.getState().finalizeMessage(msgId);
              return;
            }
            if (chunk2.type === 'thinking') {
              useChatStore.getState().appendThinkingDelta(msgId, chunk2.delta ?? '');
            } else if (chunk2.type === 'content') {
              useChatStore.getState().appendContentDelta(msgId, chunk2.delta ?? '');
            }
          }

          break; // tool call consumed — done for this turn
        }

        if (chunk.type === 'thinking') {
          useChatStore.getState().appendThinkingDelta(msgId, chunk.delta ?? '');
        } else if (chunk.type === 'content') {
          useChatStore.getState().appendContentDelta(msgId, chunk.delta ?? '');
        }
      }

      void toolCallHandled; // suppress unused warning

      useChatStore.getState().finalizeMessage(msgId);
      useChatStore.getState().incrementRound();

    } catch (error) {
      console.error('Stream error:', error);
      const et = getTranslations(useChatStore.getState().locale);
      useChatStore.getState().appendContentDelta(msgId, et.orchestrator.errorPrefix(error instanceof Error ? error.message : String(error)));
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
