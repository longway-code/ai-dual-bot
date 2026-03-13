'use client';

import { useChatStore } from '@/stores/chatStore';
import { useTranslation } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const locale = useChatStore((s) => s.locale);
  const setLocale = useChatStore((s) => s.setLocale);
  const t = useTranslation();

  return (
    <button
      onClick={() => setLocale(locale === 'zh' ? 'en' : 'zh')}
      title={`Switch to ${t.lang.switchTo}`}
      className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      {t.lang.switchTo}
    </button>
  );
}
