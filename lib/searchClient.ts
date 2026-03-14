import { SearchConfig } from './types';

export async function fetchSearchContext(query: string, config: SearchConfig, signal?: AbortSignal): Promise<string> {
  const res = await fetch('/api/search', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      provider: config.provider,
      apiKey: config.apiKey,
      maxResults: config.maxResults,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error('[search] /api/search failed:', res.status, detail);
    throw new Error(`Search API error ${res.status}: ${detail}`);
  }

  const data = await res.json();
  return data.summary as string;
}
