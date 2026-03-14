import { LLMConfig, Message, BotId } from './types';
import { parseStreamingChunk } from './parseThinking';

export interface StreamChunk {
  type: 'thinking' | 'content' | 'tool_call';
  delta?: string;
  name?: string;
  arguments?: string;
  toolCallId?: string;
}

const WEB_SEARCH_TOOL = {
  type: 'function',
  function: {
    name: 'web_search',
    description: '当你需要近期资讯、时事数据、最新动态时调用此工具搜索网络',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: '搜索关键词' } },
      required: ['query'],
    },
  },
};

export async function* streamChat(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  llmConfig: LLMConfig,
  searchEnabled = false
): AsyncGenerator<StreamChunk> {
  if (searchEnabled) {
    console.log('[search] streamChat: sending tools to model', { model: llmConfig.model });
  }

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      llmConfig,
      tools: searchEnabled ? [WEB_SEARCH_TOOL] : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';
  let parseState = { inThinkTag: false, buffer: '' };

  // Accumulate tool call fragments across chunks
  let toolCallName = '';
  let toolCallArgs = '';
  let toolCallId = '';
  let isToolCall = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          if (isToolCall && toolCallName) {
            yield { type: 'tool_call', name: toolCallName, arguments: toolCallArgs };
          }
          return;
        }

        try {
          const parsed = JSON.parse(data);
          const choice = parsed.choices?.[0];
          if (!choice) continue;

          const delta = choice.delta ?? {};

          // Always process tool_calls delta BEFORE checking finish_reason —
          // some APIs send the final argument fragment and finish_reason in the same chunk.
          if (delta.tool_calls) {
            isToolCall = true;
            for (const tc of delta.tool_calls) {
              if (tc.id) toolCallId = tc.id;
              if (tc.function?.name) {
                toolCallName += tc.function.name;
                console.log('[search] tool_call started:', tc.function.name);
              }
              if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
            }
          }

          // Now check finish_reason
          if (choice.finish_reason === 'tool_calls') {
            console.log('[search] finish_reason=tool_calls, name:', toolCallName, 'args:', toolCallArgs);
            if (toolCallName) {
              yield { type: 'tool_call', name: toolCallName, arguments: toolCallArgs, toolCallId };
            }
            return;
          }

          if (isToolCall) continue; // still accumulating, skip content parsing

          const { chunks, newState } = parseStreamingChunk(delta, parseState);
          parseState = newState;

          for (const chunk of chunks) {
            yield chunk as StreamChunk;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    // Flush any remaining tool call (in case [DONE] was missed)
    if (isToolCall && toolCallName) {
      yield { type: 'tool_call', name: toolCallName, arguments: toolCallArgs, toolCallId };
    }
  } finally {
    reader.releaseLock();
  }
}

export function buildMessages(
  currentBotId: BotId,
  botAConfig: { name: string; personality: string },
  botBConfig: { name: string; personality: string },
  scenario: string,
  history: Message[],
  maxContext: number,
  currentRound: number = 0,
  searchEnabled = false
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const currentBot = currentBotId === 'A' ? botAConfig : botBConfig;
  const otherBot = currentBotId === 'A' ? botBConfig : botAConfig;

  const antiConvergenceRules = `\n## 对话规则
请保持你的核心立场，不要轻易附和对方。
每次回应请做到以下至少一点：
- 挑战或质疑对方论点的某个前提
- 引入一个新的论据、例子或思想实验
- 从你的核心观点出发推进争论，而不只是回应对方

避免：空洞的赞美、重复对方的观点、单纯的附和。`;

  const roundHints: string[] = [];
  if (currentRound >= 4) {
    roundHints.push(`【当前进度：第 ${currentRound} 轮，请加深分歧，避免重复已有论点】`);
  }
  if (currentRound > 0 && currentRound % 5 === 0) {
    roundHints.push(`【请引入全新角度或极端案例来测试你的立场】`);
  }

  const now = new Date();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const dateStr = now.toLocaleString('en-CA', { hour12: false }) + ` (${tz})`;

  const systemPrompt = [
    `你是 ${currentBot.name}。`,
    `\n当前日期时间：${dateStr}`,
    currentBot.personality ? `\n## 你的性格与背景\n${currentBot.personality}` : '',
    `\n## 对话设定`,
    `你正在与 ${otherBot.name} 进行对话。`,
    scenario ? `\n## 情景\n${scenario}` : '',
    `\n请保持角色，回复要简洁有趣，避免过长。`,
    antiConvergenceRules,
    `\n## 格式要求\n直接以第一人称说话，就像真实对话一样。\n严格禁止：\n- Markdown 格式（不用 #标题、**粗体**、*斜体*、列表符号 -/• 等）\n- 旁白、动作描述或舞台指示（如"他若有所思地说……"、"（停顿）"）\n- 任何跳出第一人称角色的叙述\n只输出对话本身。`,
    searchEnabled
      ? `\n## 联网搜索\n你可以使用 web_search 工具搜索网络，获取最新资讯来支持你的论点。当需要引用具体数据、近期新闻、最新政策或时事信息时，请主动调用 web_search。`
      : '',
    roundHints.length > 0 ? `\n${roundHints.join('\n')}` : '',
  ].filter(Boolean).join('');

  const contextMessages = maxContext > 0 ? history.slice(-maxContext) : history;

  const msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];

  for (const msg of contextMessages) {
    if (msg.botId === currentBotId) {
      msgs.push({ role: 'assistant', content: msg.content });
    } else {
      const speakerName = msg.botId === 'A' ? botAConfig.name : botBConfig.name;
      msgs.push({ role: 'user', content: `[${speakerName}]: ${msg.content}` });
    }
  }

  return msgs;
}
