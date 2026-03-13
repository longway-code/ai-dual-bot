export interface ParsedChunk {
  type: 'thinking' | 'content';
  delta: string;
}

export function parseStreamingChunk(
  delta: { content?: string; reasoning_content?: string },
  state: { inThinkTag: boolean; buffer: string }
): { chunks: ParsedChunk[]; newState: { inThinkTag: boolean; buffer: string } } {
  const chunks: ParsedChunk[] = [];
  let { inThinkTag, buffer } = state;

  // Handle reasoning_content field (DeepSeek/OpenAI reasoning models)
  if (delta.reasoning_content) {
    chunks.push({ type: 'thinking', delta: delta.reasoning_content });
  }

  if (delta.content) {
    buffer += delta.content;

    // Process buffer for <think> tags
    while (buffer.length > 0) {
      if (inThinkTag) {
        const closeIdx = buffer.indexOf('</think>');
        if (closeIdx !== -1) {
          // Found closing tag
          if (closeIdx > 0) {
            chunks.push({ type: 'thinking', delta: buffer.slice(0, closeIdx) });
          }
          buffer = buffer.slice(closeIdx + 8); // '</think>'.length = 8
          inThinkTag = false;
        } else {
          // Still inside think tag, check if we might be at partial closing tag
          const partialClose = findPartialMatch(buffer, '</think>');
          if (partialClose !== -1) {
            // Output everything before the potential partial match
            if (partialClose > 0) {
              chunks.push({ type: 'thinking', delta: buffer.slice(0, partialClose) });
              buffer = buffer.slice(partialClose);
            }
            break; // Wait for more data
          } else {
            chunks.push({ type: 'thinking', delta: buffer });
            buffer = '';
          }
        }
      } else {
        const openIdx = buffer.indexOf('<think>');
        if (openIdx !== -1) {
          // Found opening tag
          if (openIdx > 0) {
            chunks.push({ type: 'content', delta: buffer.slice(0, openIdx) });
          }
          buffer = buffer.slice(openIdx + 7); // '<think>'.length = 7
          inThinkTag = true;
        } else {
          // Check for partial opening tag
          const partialOpen = findPartialMatch(buffer, '<think>');
          if (partialOpen !== -1) {
            if (partialOpen > 0) {
              chunks.push({ type: 'content', delta: buffer.slice(0, partialOpen) });
              buffer = buffer.slice(partialOpen);
            }
            break; // Wait for more data
          } else {
            chunks.push({ type: 'content', delta: buffer });
            buffer = '';
          }
        }
      }
    }
  }

  return { chunks, newState: { inThinkTag, buffer } };
}

function findPartialMatch(text: string, pattern: string): number {
  for (let len = Math.min(pattern.length - 1, text.length); len > 0; len--) {
    if (text.endsWith(pattern.slice(0, len))) {
      return text.length - len;
    }
  }
  return -1;
}
