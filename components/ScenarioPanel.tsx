'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Map, Sparkles, Zap } from 'lucide-react';
import MarkdownEditor from './MarkdownEditor';
import { characterPresets, sortedScenarios, findMatchedScenario } from '@/lib/presets';

interface ScenarioPanelProps {
  value: string;
  botAPresetId: string | null;
  botBPresetId: string | null;
  onChange: (value: string) => void;
}

export default function ScenarioPanel({
  value,
  botAPresetId,
  botBPresetId,
  onChange,
}: ScenarioPanelProps) {
  const [expanded, setExpanded] = useState(true);
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

  const matched = findMatchedScenario(botAPresetId, botBPresetId);
  const sorted = sortedScenarios(botAPresetId, botBPresetId);
  const matchedGroup = sorted.filter(s => s.characters &&
    ((s.characters[0] === botAPresetId && s.characters[1] === botBPresetId) ||
     (s.characters[0] === botBPresetId && s.characters[1] === botAPresetId)));
  const otherGroup = sorted.filter(s => !matchedGroup.includes(s));

  const isCurrentMatched = matched && value === matched.content;

  return (
    <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50 dark:bg-purple-950 dark:border-purple-700 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="w-5 h-5 text-purple-600" />
          <span className="font-bold text-lg text-purple-800 dark:text-purple-200">情景设定</span>
          {isCurrentMatched && (
            <span className="flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full bg-purple-200 dark:bg-purple-800 text-purple-700 dark:text-purple-200">
              <Zap className="w-2.5 h-2.5" />
              已匹配
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Preset picker */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setPickerOpen(!pickerOpen)}
              title="选择情景预设"
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white/60 hover:bg-white/90 dark:bg-gray-700/60 dark:hover:bg-gray-700 transition-colors border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300"
            >
              <Sparkles className="w-3 h-3" />
              选情景
            </button>
            {pickerOpen && (
              <div className="absolute right-0 top-8 z-50 w-60 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
                {matchedGroup.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-purple-500 uppercase tracking-wide border-b border-purple-100 dark:border-purple-900 bg-purple-50 dark:bg-purple-950 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      当前角色专属
                    </div>
                    {matchedGroup.map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => { onChange(preset.content); setPickerOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left bg-purple-50/60 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                      >
                        <span className="text-base">{preset.emoji}</span>
                        <span className="flex-1 font-medium">{preset.label}</span>
                      </button>
                    ))}
                  </>
                )}
                {otherGroup.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 mt-0.5">
                      其他情景
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                      {otherGroup.map(preset => (
                        <button
                          key={preset.id}
                          onClick={() => { onChange(preset.content); setPickerOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <span className="text-base">{preset.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div>{preset.label}</div>
                            {preset.characters && (
                              <div className="text-xs text-gray-400 truncate">
                                {preset.characters.map(id =>
                                  characterPresets.find(c => c.id === id)?.label ?? id
                                ).join(' × ')}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-gray-700 p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Matched hint when not yet applied */}
      {matched && !isCurrentMatched && (
        <div className="flex items-center justify-between rounded-lg px-3 py-2 bg-purple-100 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 text-xs">
          <span className="text-purple-700 dark:text-purple-300">
            {matched.emoji} 发现专属情景：<strong>{matched.label}</strong>
          </span>
          <button
            onClick={() => onChange(matched.content)}
            className="ml-2 px-2 py-0.5 rounded-md bg-purple-500 hover:bg-purple-600 text-white font-medium transition-colors"
          >
            应用
          </button>
        </div>
      )}

      {expanded && (
        <MarkdownEditor
          value={value}
          onChange={onChange}
          placeholder="描述对话的场景、背景、目标...（留空则由 Bot A 自由开场）"
          rows={4}
        />
      )}
    </div>
  );
}
