import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { query, provider = 'brave', apiKey, maxResults = 3 } = await req.json();

    if (!query) {
      return new Response('Missing query', { status: 400 });
    }

    if (!apiKey) {
      return new Response(`Missing API key for ${provider}`, { status: 400 });
    }

    let summary: string;

    if (provider === 'brave') {
      // Brave Search API — https://api.search.brave.com
      const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('[search] Brave error:', res.status, body.slice(0, 200));
        return new Response(`Brave Search error ${res.status}: ${body.slice(0, 200)}`, { status: res.status });
      }
      const data = await res.json();
      type BraveResult = { title: string; url: string; description?: string; snippet?: string };
      const webResults: BraveResult[] = data.web?.results ?? [];
      const newsResults: BraveResult[] = data.news?.results ?? [];
      const combined = [...webResults, ...newsResults].slice(0, maxResults);
      summary = combined
        .map((r) => `${r.title}\n${r.url}\n${r.description ?? r.snippet ?? ''}`)
        .join('\n\n');
      console.log('[search] Brave result count:', combined.length);

    } else if (provider === 'tavily') {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey, query, max_results: maxResults }),
      });
      if (!res.ok) return new Response(`Tavily error: ${await res.text()}`, { status: res.status });
      const data = await res.json();
      const results = (data.results ?? []).slice(0, maxResults);
      summary = results
        .map((r: { title: string; url: string; content: string }) => `${r.title}\n${r.url}\n${r.content}`)
        .join('\n\n');

    } else {
      // Serper
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        signal: AbortSignal.timeout(15000),
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
        body: JSON.stringify({ q: query, num: maxResults }),
      });
      if (!res.ok) return new Response(`Serper error: ${await res.text()}`, { status: res.status });
      const data = await res.json();
      const organic = (data.organic ?? []).slice(0, maxResults);
      summary = organic
        .map((r: { title: string; link: string; snippet: string }) => `${r.title}\n${r.link}\n${r.snippet}`)
        .join('\n\n');
    }

    return new Response(JSON.stringify({ summary: summary || 'No results found.' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[search] Internal error:', error);
    return new Response(
      `Internal error: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 }
    );
  }
}
