'use client';

import { useEffect, useRef } from 'react';
import { Message, BotConfig } from '@/lib/types';
import MessageBubble from './MessageBubble';

interface ChatDisplayProps {
  messages: Message[];
  botA: BotConfig;
  botB: BotConfig;
  status: string;
}

export default function ChatDisplay({ messages, botA, botB, status }: ChatDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        {status === 'idle' ? '配置好 Bot 后点击「开始」开始对话' : '等待对话开始...'}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          botName={msg.botId === 'A' ? botA.name : botB.name}
          isLeft={msg.botId === 'A'}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
