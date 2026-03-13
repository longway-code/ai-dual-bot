'use client';

import { useEffect, useRef } from 'react';
import { Message, BotConfig } from '@/lib/types';
import MessageBubble from './MessageBubble';
import { useTranslation } from '@/lib/i18n';

interface ChatDisplayProps {
  messages: Message[];
  botA: BotConfig;
  botB: BotConfig;
  status: string;
}

export default function ChatDisplay({ messages, botA, botB, status }: ChatDisplayProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = useTranslation();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        {status === 'idle' ? t.chat.idleHint : t.chat.waitingHint}
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
