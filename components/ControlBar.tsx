'use client';

import { Play, Pause, RotateCcw, MessageSquare, Hash } from 'lucide-react';
import { ChatStatus } from '@/lib/types';
import { useTranslation } from '@/lib/i18n';

interface ControlBarProps {
  status: ChatStatus;
  currentRound: number;
  maxRounds: number;
  maxMessagesInContext: number;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onMaxRoundsChange: (n: number) => void;
  onMaxContextChange: (n: number) => void;
}

export default function ControlBar({
  status,
  currentRound,
  maxRounds,
  maxMessagesInContext,
  onStart,
  onPause,
  onReset,
  onMaxRoundsChange,
  onMaxContextChange,
}: ControlBarProps) {
  const canStart = status === 'idle' || status === 'paused';
  const canPause = status === 'running';
  const t = useTranslation();

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-16 pr-6 py-3 flex items-center gap-4 flex-wrap">
      {/* Control buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={canStart ? onStart : undefined}
          disabled={!canStart}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canStart
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
          }`}
        >
          <Play className="w-4 h-4" />
          {status === 'paused' ? t.control.resume : t.control.start}
        </button>

        <button
          onClick={canPause ? onPause : undefined}
          disabled={!canPause}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canPause
              ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
          }`}
        >
          <Pause className="w-4 h-4" />
          {t.control.pause}
        </button>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          {t.control.reset}
        </button>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1 text-sm text-gray-500">
        <span>{t.control.round(currentRound)}</span>
        {status === 'finished' && <span className="text-orange-500 font-medium ml-1">{t.control.finished}</span>}
        {status === 'running' && <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1" />}
      </div>

      <div className="ml-auto flex items-center gap-4 flex-wrap">
        {/* Max rounds */}
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 text-gray-400" />
          <label className="text-sm text-gray-600 dark:text-gray-400">{t.control.maxRoundsLabel}</label>
          <input
            type="number"
            min="0"
            value={maxRounds}
            onChange={(e) => onMaxRoundsChange(parseInt(e.target.value) || 0)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-800"
          />
          <span className="text-xs text-gray-400">{t.control.maxRoundsHint}</span>
        </div>

        {/* Context window */}
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-gray-400" />
          <label className="text-sm text-gray-600 dark:text-gray-400">{t.control.contextLabel}</label>
          <input
            type="number"
            min="1"
            value={maxMessagesInContext}
            onChange={(e) => onMaxContextChange(parseInt(e.target.value) || 10)}
            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm text-center dark:border-gray-600 dark:bg-gray-800"
          />
        </div>
      </div>
    </div>
  );
}
