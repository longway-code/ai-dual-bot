import { useChatStore } from '@/stores/chatStore';
import { streamChat, buildMessages } from './llmClient';
import { fetchSearchContext } from './searchClient';
import { BotId } from './types';
import { getTranslations } from './i18n';

let abortController: AbortController | null = null;

export function getAbortController() {
  return abortController;
}

function isAborted() {
  return abortController?.signal.aborted ?? false;
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
      // First stream pass
      for await (const chunk of streamChat(messages, currentBot.llm, searchEnabled)) {
        if (useChatStore.getState().status !== 'running') {
          useChatStore.getState().finalizeMessage(msgId);
          return;
        }

        if (chunk.type === 'tool_call' && chunk.name === 'web_search') {
          const t = getTranslations(useChatStore.getState().locale);
          useChatStore.getState().appendContentDelta(msgId, `[${t.search.searching}]`);

          let searchResult = '';
          try {
            const query = JSON.parse(chunk.arguments ?? '{}').query ?? '';
            console.log('[search] querying:', query);
            // Pass abort signal so search is cancelled if user pauses/resets
            searchResult = await fetchSearchContext(query, searchConfig, abortController?.signal);
            console.log('[search] result:', searchResult.slice(0, 100));
          } catch (err) {
            if (isAborted()) {
              useChatStore.getState().finalizeMessage(msgId);
              return;
            }
            console.error('[search] fetchSearchContext failed:', err);
            const t2 = getTranslations(useChatStore.getState().locale);
            useChatStore.getState().appendContentDelta(msgId, ` ${t2.search.searchFailed}.`);
          }

          if (isAborted() || useChatStore.getState().status !== 'running') {
            useChatStore.getState().finalizeMessage(msgId);
            return;
          }

          // Build tool result messages using proper role: 'tool' format
          const callId = chunk.toolCallId ?? 'call_0';
          const toolCallMessages = [
            ...messages,
            {
              role: 'assistant' as const,
              content: '',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tool_calls: [{ id: callId, type: 'function', function: { name: 'web_search', arguments: chunk.arguments ?? '{}' } }],
            } as any, // OpenAI tool_calls field not in standard message type
            {
              role: 'tool' as const,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              tool_call_id: callId,
              content: searchResult || '搜索无结果，请根据已有知识继续回答',
            } as any,
          ];

          useChatStore.getState().resetMessageContent(msgId);

          for await (const chunk2 of streamChat(toolCallMessages, currentBot.llm, false)) {
            if (useChatStore.getState().status !== 'running') {
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
