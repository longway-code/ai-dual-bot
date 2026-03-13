'use client';

import { useState } from 'react';
import { Message } from '@/lib/types';
import { ChevronRight, ChevronDown, Brain } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  botName: string;
  isLeft: boolean;
}

export default function MessageBubble({ message, botName, isLeft }: MessageBubbleProps) {
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  return (
    <div className={`flex flex-col ${isLeft ? 'items-start' : 'items-end'} mb-4`}>
      <div className={`text-xs font-semibold mb-1 text-gray-500 ${isLeft ? 'ml-1' : 'mr-1'}`}>
        {botName}
      </div>

      <div className={`max-w-[75%] flex flex-col gap-2 ${isLeft ? '' : ''}`}>
        {/* Thinking block */}
        {message.thinking !== undefined && (
          <div className={`text-xs rounded-lg overflow-hidden border ${
            isLeft
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
              : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
          }`}>
            <button
              onClick={() => setThinkingExpanded(!thinkingExpanded)}
              className="flex items-center gap-1 px-3 py-2 w-full text-left hover:bg-black/5 transition-colors"
            >
              <Brain className="w-3 h-3 text-gray-400" />
              <span className="text-gray-500 flex-1">思考过程</span>
              {thinkingExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )}
            </button>
            {thinkingExpanded && (
              <div className="px-3 pb-3 text-gray-600 dark:text-gray-400 whitespace-pre-wrap border-t border-current/10">
                {message.thinking || (message.streaming ? '思考中...' : '')}
              </div>
            )}
          </div>
        )}

        {/* Main content */}
        <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap break-words ${
          isLeft
            ? 'bg-blue-500 text-white rounded-tl-sm'
            : 'bg-green-500 text-white rounded-tr-sm'
        } ${message.streaming && !message.content ? 'animate-pulse' : ''}`}>
          {message.content || (message.streaming ? '▋' : '')}
        </div>
      </div>
    </div>
  );
}
