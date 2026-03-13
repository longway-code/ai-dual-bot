'use client';

import { useCallback, useState } from 'react';
import { useChatStore } from '@/stores/chatStore';
import { runChatLoop } from '@/lib/chatOrchestrator';
import BotConfigPanel from '@/components/BotConfigPanel';
import ScenarioPanel from '@/components/ScenarioPanel';
import ChatDisplay from '@/components/ChatDisplay';
import ControlBar from '@/components/ControlBar';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/lib/i18n';
import { Settings, ChevronUp } from 'lucide-react';

export default function Home() {
  const [configOpen, setConfigOpen] = useState(false);
  const t = useTranslation();

  const {
    botA, botB, scenario, status, messages, currentRound,
    maxRounds, maxMessagesInContext,
    botAPresetId, botBPresetId,
    setBotConfig, applyCharacterPreset, setScenario, setStatus, setMaxRounds,
    setMaxMessagesInContext, resetChat,
  } = useChatStore();

  const handleStart = useCallback(async () => {
    setStatus('running');
    try {
      await runChatLoop();
    } catch (error) {
      console.error('Chat loop error:', error);
      setStatus('paused');
    }
  }, [setStatus]);

  const handlePause = useCallback(() => setStatus('paused'), [setStatus]);

  const handleReset = useCallback(() => {
    setStatus('idle');
    resetChat();
  }, [setStatus, resetChat]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center gap-3 shrink-0">
        <span className="text-xl">🤖</span>
        <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">{t.appTitle}</h1>
        <span className="text-xs text-gray-400 hidden sm:inline">
          {botA.name} × {botB.name}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <button
            onClick={() => setConfigOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
              configOpen
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950 dark:border-blue-700 dark:text-blue-300'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {configOpen ? <ChevronUp className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {configOpen ? t.settings.close : t.settings.open}
          </button>
        </div>
      </header>

      {/* Collapsible config area */}
      {configOpen && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shrink-0">
          <div className="grid grid-cols-3 gap-4 max-w-6xl mx-auto">
            <BotConfigPanel
              botId="A"
              config={botA}
              activePresetId={botAPresetId}
              onChange={(c) => setBotConfig('A', c)}
              onApplyPreset={(id, name, personality) => applyCharacterPreset('A', id, name, personality)}
              color="border-blue-300 bg-blue-50 dark:bg-blue-950 dark:border-blue-700"
            />
            <ScenarioPanel
              value={scenario}
              botAPresetId={botAPresetId}
              botBPresetId={botBPresetId}
              onChange={setScenario}
            />
            <BotConfigPanel
              botId="B"
              config={botB}
              activePresetId={botBPresetId}
              onChange={(c) => setBotConfig('B', c)}
              onApplyPreset={(id, name, personality) => applyCharacterPreset('B', id, name, personality)}
              color="border-green-300 bg-green-50 dark:bg-green-950 dark:border-green-700"
            />
          </div>
        </div>
      )}

      {/* Chat area */}
      <ChatDisplay
        messages={messages}
        botA={botA}
        botB={botB}
        status={status}
      />

      {/* Control bar */}
      <ControlBar
        status={status}
        currentRound={currentRound}
        maxRounds={maxRounds}
        maxMessagesInContext={maxMessagesInContext}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onMaxRoundsChange={setMaxRounds}
        onMaxContextChange={setMaxMessagesInContext}
      />
    </div>
  );
}
