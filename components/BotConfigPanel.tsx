'use client';

import { useState, useRef, useEffect } from 'react';
import { BotId, BotConfig } from '@/lib/types';
import MarkdownEditor from './MarkdownEditor';
import { ChevronDown, ChevronUp, Bot, Sparkles, Check } from 'lucide-react';
import { characterPresets } from '@/lib/presets';

interface BotConfigPanelProps {
  botId: BotId;
  config: BotConfig;
  activePresetId: string | null;
  onChange: (config: Partial<BotConfig>) => void;
  onApplyPreset: (presetId: string, name: string, personality: string) => void;
  color: string;
}

export default function BotConfigPanel({
  botId,
  config,
  activePresetId,
  onChange,
  onApplyPreset,
  color,
}: BotConfigPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    if (pickerOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pickerOpen]);

  const activePreset = characterPresets.find(p => p.id === activePresetId);

  return (
    <div className={`border-2 rounded-xl p-4 ${color} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <input
            type="text"
            value={config.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="font-bold text-lg bg-transparent border-b border-current focus:outline-none w-32"
          />
        </div>
        <div className="flex items-center gap-1">
          {/* Preset picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              title="选择角色预设"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white/60 hover:bg-white/90 dark:bg-gray-700/60 dark:hover:bg-gray-700 transition-colors border border-current/20"
            >
              <Sparkles className="w-3 h-3" />
              {activePreset ? `${activePreset.emoji} ${activePreset.label}` : '选角色'}
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-8 z-50 w-48 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800">
                  选择角色
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {characterPresets.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        onApplyPreset(preset.id, preset.name, preset.personality);
                        setPickerOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-base">{preset.emoji}</span>
                      <span className="flex-1">{preset.label}</span>
                      {preset.id === activePresetId && (
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-700 p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Personality preview when collapsed */}
      {!expanded && config.personality && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {config.personality.replace(/^#+\s.+\n?/gm, '').trim().slice(0, 80)}…
        </p>
      )}

      {expanded && (
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">性格设定 (Markdown)</label>
            <MarkdownEditor
              value={config.personality}
              onChange={(v) => onChange({ personality: v })}
              placeholder="描述这个 Bot 的性格、背景、说话风格..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Base URL</label>
              <input
                type="text"
                value={config.llm.baseURL}
                onChange={(e) => onChange({ llm: { ...config.llm, baseURL: e.target.value } })}
                placeholder="https://api.openai.com/v1"
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">API Key</label>
              <div className="flex gap-1">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={config.llm.apiKey}
                  onChange={(e) => onChange({ llm: { ...config.llm, apiKey: e.target.value } })}
                  placeholder="sk-..."
                  className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="text-xs px-2 border rounded border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                >
                  {showApiKey ? '隐藏' : '显示'}
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Model</label>
              <input
                type="text"
                value={config.llm.model}
                onChange={(e) => onChange({ llm: { ...config.llm, model: e.target.value } })}
                placeholder="gpt-4o-mini"
                className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Temperature</label>
                <span className="text-xs font-mono text-gray-500">{(config.llm.temperature ?? 0.8).toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.llm.temperature ?? 0.8}
                onChange={(e) => onChange({ llm: { ...config.llm, temperature: parseFloat(e.target.value) } })}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                <span>0 严谨</span>
                <span>1 平衡</span>
                <span>2 随机</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
