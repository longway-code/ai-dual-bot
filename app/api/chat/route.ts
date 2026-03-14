import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, llmConfig, tools } = await req.json();

    if (!llmConfig?.baseURL || !llmConfig?.apiKey || !llmConfig?.model) {
      return new Response('Missing LLM configuration', { status: 400 });
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
