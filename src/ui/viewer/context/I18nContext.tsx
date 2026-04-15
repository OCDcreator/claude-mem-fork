import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'en' | 'zh';
const STORAGE_KEY = 'claude-mem-lang';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    'lang-toggle-title': 'Switch Language',
    'repo-upstream': 'Upstream',
    'repo-upstream-title': 'View upstream repository',
    'repo-fork': 'My Fork',
    'repo-fork-title': 'View custom fork repository',
    'all-projects': 'All Projects',
    'settings': 'Settings',
    'documentation': 'Documentation',
    'follow-x': 'Follow us on X',
    'join-discord': 'Join our Discord community',
    'toggle-console': 'Toggle Console',
  },
  zh: {
    'lang-toggle-title': '切换语言',
    'repo-upstream': '上游仓库',
    'repo-upstream-title': '查看上游仓库',
    'repo-fork': '我的 Fork',
    'repo-fork-title': '查看 Fork 仓库',
    'all-projects': '所有项目',
    'settings': '设置',
    'documentation': '文档',
    'follow-x': '在 X 上关注我们',
    'join-discord': '加入 Discord 社区',
    'toggle-console': '切换控制台',
  },
};

interface I18nContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'en',
  toggleLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return (saved === 'zh' || saved === 'en') ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next: Lang = prev === 'en' ? 'zh' : 'en';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const t = useCallback((key: string) => {
    return translations[lang][key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
