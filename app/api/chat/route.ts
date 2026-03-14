import { NextRequest } from 'next/server';

export const runtime = 'edge';

function isAnthropicURL(baseURL: string): boolean {
  try {
    const url = new URL(baseURL);
    return url.hostname.includes('anthropic.com') || url.pathname.includes('/anthropic');
  } catch {
    return baseURL.includes('anthropic.com') || baseURL.includes('/anthropic');
  }
}

// Convert OpenAI messages format to Anthropic format
// Returns { system, messages }
function convertMessagesToAnthropic(
  messages: Array<{ role: string; content: unknown; tool_calls?: unknown[]; tool_call_id?: string; name?: string }>
): { system: string | undefined; messages: unknown[] } {
  let system: string | undefined;
  const converted: unknown[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      system = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      continue;
    }

    if (msg.role === 'tool') {
      // OpenAI tool result → Anthropic tool_result block inside a user message
      converted.push({
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: msg.tool_call_id,
            content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          },
        ],
      });
      continue;
    }

    if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
      // OpenAI assistant tool_calls → Anthropic content blocks
      const contentBlocks: unknown[] = [];
      if (msg.content) {
        contentBlocks.push({ type: 'text', text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) });
      }
      for (const tc of msg.tool_calls as Array<{ id: string; function: { name: string; arguments: string } }>) {
        let input: unknown = {};
        try { input = JSON.parse(tc.function.arguments); } catch { input = {}; }
        contentBlocks.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.function.name,
          input,
        });
      }
      converted.push({ role: 'assistant', content: contentBlocks });
      continue;
    }

    converted.push({ role: msg.role, content: msg.content });
  }

  return { system, messages: converted };
}

// Convert OpenAI tools format to Anthropic format
function convertToolsToAnthropic(
  tools: Array<{ type: string; function: { name: string; description?: string; parameters?: unknown } }>
): unknown[] {
  return tools.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters ?? { type: 'object', properties: {} },
  }));
}

// Transform Anthropic SSE stream → OpenAI SSE stream
function transformAnthropicStream(anthropicStream: ReadableStream<Uint8Array>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Track current tool_use block index for input_json_delta events
  let toolUseIndex = 0;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = anthropicStream.getReader();
      let buffer = '';

      function emit(data: string) {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let currentEvent = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              const rawData = line.slice(6).trim();
              if (!rawData || rawData === '[DONE]') continue;

              let parsed: Record<string, unknown>;
              try { parsed = JSON.parse(rawData); } catch { continue; }

              if (currentEvent === 'content_block_start') {
                const block = parsed.content_block as Record<string, unknown> | undefined;
                if (block?.type === 'tool_use') {
                  emit(JSON.stringify({
                    choices: [{
                      delta: {
                        tool_calls: [{
                          index: toolUseIndex,
                          id: block.id,
                          type: 'function',
                          function: { name: block.name, arguments: '' },
                        }],
                      },
                    }],
                  }));
                }
              } else if (currentEvent === 'content_block_delta') {
                const delta = parsed.delta as Record<string, unknown> | undefined;
                if (!delta) continue;

                if (delta.type === 'text_delta') {
                  emit(JSON.stringify({
                    choices: [{ delta: { content: delta.text } }],
                  }));
                } else if (delta.type === 'thinking_delta') {
                  emit(JSON.stringify({
                    choices: [{ delta: { reasoning_content: delta.thinking } }],
                  }));
                } else if (delta.type === 'input_json_delta') {
                  emit(JSON.stringify({
                    choices: [{
                      delta: {
                        tool_calls: [{ index: toolUseIndex, function: { arguments: delta.partial_json } }],
                      },
                    }],
                  }));
                }
              } else if (currentEvent === 'content_block_stop') {
                // Increment tool index for next potential tool_use block
                toolUseIndex++;
              } else if (currentEvent === 'message_delta') {
                const delta = parsed.delta as Record<string, unknown> | undefined;
                if (delta?.stop_reason === 'tool_use') {
                  emit(JSON.stringify({
                    choices: [{ delta: {}, finish_reason: 'tool_calls' }],
                  }));
                } else if (delta?.stop_reason === 'end_turn') {
                  emit(JSON.stringify({
                    choices: [{ delta: {}, finish_reason: 'stop' }],
                  }));
                }
              } else if (currentEvent === 'message_stop') {
                emit('[DONE]');
              }
            }
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });
}

async function handleAnthropic(
  messages: Array<{ role: string; content: unknown; tool_calls?: unknown[]; tool_call_id?: string; name?: string }>,
  llmConfig: { baseURL: string; apiKey: string; model: string; temperature?: number },
  tools?: Array<{ type: string; function: { name: string; description?: string; parameters?: unknown } }>
): Promise<Response> {
  const baseURL = llmConfig.baseURL.replace(/\/$/, '');
  const apiURL = `${baseURL}/v1/messages`;

  const { system, messages: anthropicMessages } = convertMessagesToAnthropic(messages);

  const requestBody: Record<string, unknown> = {
    model: llmConfig.model,
    messages: anthropicMessages,
    stream: true,
    max_tokens: 16000,
    temperature: llmConfig.temperature ?? 0.8,
  };

  if (system) {
    requestBody.system = system;
  }

  if (tools && tools.length > 0) {
    requestBody.tools = convertToolsToAnthropic(tools);
    requestBody.tool_choice = { type: 'auto' };
  }

  const upstream = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': llmConfig.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!upstream.ok) {
    const error = await upstream.text();
    return new Response(`Upstream error: ${error}`, { status: upstream.status });
  }

  const transformedStream = transformAnthropicStream(upstream.body!);

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, llmConfig, tools } = await req.json();

    if (!llmConfig?.baseURL || !llmConfig?.apiKey || !llmConfig?.model) {
      return new Response('Missing LLM configuration', { status: 400 });
    }

    if (isAnthropicURL(llmConfig.baseURL)) {
      return handleAnthropic(messages, llmConfig, tools);
    }

    const baseURL = llmConfig.baseURL.replace(/\/$/, '');
    const apiURL = `${baseURL}/chat/completions`;

    const requestBody: Record<string, unknown> = {
      model: llmConfig.model,
      messages,
      stream: true,
      max_tokens: 1000,
      temperature: llmConfig.temperature ?? 0.8,
    };
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      requestBody.tool_choice = 'auto';
    }

    const upstream = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok) {
      const error = await upstream.text();
      return new Response(`Upstream error: ${error}`, { status: upstream.status });
    }

    // Pass through the SSE stream
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response(
      `Internal error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 }
    );
  }
}
