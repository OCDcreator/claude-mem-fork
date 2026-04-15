import React, { createContext, useContext, useState, useCallback } from 'react';

export type Lang = 'en' | 'zh';
const STORAGE_KEY = 'claude-mem-lang';
const EXPLICIT_STORAGE_KEY = 'claude-mem-lang-explicit';

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
    'toggle-console': 'Toggle Console',
    'settings-source': 'Source:',
    'settings-project': 'Project:',
    'settings-close-title': 'Close (Esc)',
    'settings-preview-error': 'Error loading preview:',
    'settings-loading-title': 'Loading',
    'settings-loading-description': 'How many observations to inject',
    'settings-observations': 'Observations',
    'settings-observations-tooltip': 'Number of recent observations to include in context (1-200)',
    'settings-sessions': 'Sessions',
    'settings-sessions-tooltip': 'Number of recent sessions to pull observations from (1-50)',
    'settings-display-title': 'Display',
    'settings-display-description': 'What to show in context tables',
    'settings-full-observations': 'Full Observations',
    'settings-count': 'Count',
    'settings-count-tooltip': 'How many observations show expanded details (0-20)',
    'settings-field': 'Field',
    'settings-field-tooltip': 'Which field to expand for full observations',
    'settings-field-narrative': 'Narrative',
    'settings-field-facts': 'Facts',
    'settings-token-economics': 'Token Economics',
    'settings-read-cost': 'Read cost',
    'settings-read-cost-description': 'Tokens to read this observation',
    'settings-work-investment': 'Work investment',
    'settings-work-investment-description': 'Tokens spent creating this observation',
    'settings-savings': 'Savings',
    'settings-savings-description': 'Total tokens saved by reusing context',
    'settings-advanced-title': 'Advanced',
    'settings-advanced-description': 'AI provider and model selection',
    'settings-ai-provider': 'AI Provider',
    'settings-ai-provider-tooltip': 'Choose between Claude (via Agent SDK), Gemini (via REST API), or OpenRouter',
    'settings-provider-claude': 'Claude (uses your Claude account)',
    'settings-provider-gemini': 'Gemini (uses API key)',
    'settings-provider-openrouter': 'OpenRouter (multi-model)',
    'settings-claude-model': 'Claude Model',
    'settings-claude-model-tooltip': 'Claude model used for generating observations',
    'settings-model-haiku': 'haiku (fastest)',
    'settings-model-sonnet': 'sonnet (balanced)',
    'settings-model-opus': 'opus (highest quality)',
    'settings-gemini-api-key': 'Gemini API Key',
    'settings-gemini-api-key-tooltip': 'Your Google AI Studio API key (or set GEMINI_API_KEY env var)',
    'settings-gemini-api-key-placeholder': 'Enter Gemini API key...',
    'settings-gemini-model': 'Gemini Model',
    'settings-gemini-model-tooltip': 'Gemini model used for generating observations',
    'settings-gemini-model-flash-lite': 'gemini-2.5-flash-lite (10 RPM free)',
    'settings-gemini-model-flash': 'gemini-2.5-flash (5 RPM free)',
    'settings-gemini-model-preview': 'gemini-3-flash-preview (5 RPM free)',
    'settings-gemini-rate-limiting': 'Rate Limiting',
    'settings-gemini-rate-limiting-description': 'Enable for free tier (10-30 RPM). Disable if you have billing set up (1000+ RPM).',
    'settings-openrouter-api-key': 'OpenRouter API Key',
    'settings-openrouter-api-key-tooltip': 'Your OpenRouter API key from openrouter.ai (or set OPENROUTER_API_KEY env var)',
    'settings-openrouter-api-key-placeholder': 'Enter OpenRouter API key...',
    'settings-openrouter-model': 'OpenRouter Model',
    'settings-openrouter-model-tooltip': 'Model identifier from OpenRouter (e.g., anthropic/claude-3.5-sonnet, google/gemini-2.0-flash-thinking-exp)',
    'settings-openrouter-model-placeholder': 'e.g., xiaomi/mimo-v2-flash:free',
    'settings-site-url': 'Site URL (Optional)',
    'settings-site-url-tooltip': 'Your site URL for OpenRouter analytics (optional)',
    'settings-site-url-placeholder': 'https://yoursite.com',
    'settings-app-name': 'App Name (Optional)',
    'settings-app-name-tooltip': 'Your app name for OpenRouter analytics (optional)',
    'settings-app-name-placeholder': 'claude-mem',
    'settings-worker-port': 'Worker Port',
    'settings-worker-port-tooltip': 'Port for the background worker service',
    'settings-include-last-summary': 'Include last summary',
    'settings-include-last-summary-description': "Add previous session's summary to context",
    'settings-include-last-message': 'Include last message',
    'settings-include-last-message-description': "Add previous session's final message",
    'settings-saving': 'Saving...',
    'settings-saved': '✓ Saved',
    'settings-error-prefix': '✗ Error:',
    'settings-save': 'Save',
    'preview-wrap': 'Wrap',
    'preview-scroll': 'Scroll',
    'preview-wrap-enable': 'Enable word wrap',
    'preview-wrap-disable': 'Disable word wrap (scroll horizontally)',
    'preview-loading': 'Loading preview...',
    'card-type-prompt': 'Prompt',
    'card-type-session-summary': 'Session Summary',
    'card-toggle-facts': 'facts',
    'card-toggle-narrative': 'narrative',
    'card-title-untitled': 'Untitled',
    'card-files-read': 'read',
    'card-files-modified': 'modified',
    'card-summary-investigated': 'Investigated',
    'card-summary-learned': 'Learned',
    'card-summary-completed': 'Completed',
    'card-summary-next-steps': 'Next Steps',
    'card-summary-session': 'Session',
    'observation-type-bugfix': 'Bug Fix',
    'observation-type-feature': 'Feature',
    'observation-type-refactor': 'Refactor',
    'observation-type-change': 'Change',
    'observation-type-discovery': 'Discovery',
    'observation-type-decision': 'Decision',
    'observation-type-anomaly': 'Anomaly',
    'observation-type-conclusion': 'Conclusion',
    'observation-type-entity': 'Entity Discovery',
    'observation-type-evidence': 'Evidence',
    'observation-type-relationship': 'Relationship',
    'observation-type-timeline-event': 'Timeline Event',
    'observation-type-argument-structure': 'Argument Structure',
    'observation-type-case-holding': 'Case Holding',
    'observation-type-cross-case-connection': 'Cross-Case Connection',
    'observation-type-doctrine-rule': 'Doctrine / Rule',
    'observation-type-issue-pattern': 'Issue Pattern',
    'observation-type-prof-framework': 'Prof Framework',
    'observation-type-algorithm-insight': 'Algorithm Insight',
    'observation-type-dump-detected': 'Dump Detected',
    'observation-type-market-condition': 'Market Condition',
    'observation-type-pump-detected': 'Pump Detected',
    'observation-type-signal-change': 'Signal Change',
    'observation-type-token-profile': 'Token Profile',
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
    'toggle-console': '切换控制台',
    'settings-source': '来源：',
    'settings-project': '项目：',
    'settings-close-title': '关闭（Esc）',
    'settings-preview-error': '加载预览失败：',
    'settings-loading-title': '加载',
    'settings-loading-description': '注入多少条观察记录',
    'settings-observations': '观察记录',
    'settings-observations-tooltip': '要包含到上下文中的近期观察记录数量（1-200）',
    'settings-sessions': '会话',
    'settings-sessions-tooltip': '从多少个近期会话中提取观察记录（1-50）',
    'settings-display-title': '显示',
    'settings-display-description': '上下文表格中显示的内容',
    'settings-full-observations': '完整观察记录',
    'settings-count': '数量',
    'settings-count-tooltip': '展开显示详情的观察记录数量（0-20）',
    'settings-field': '字段',
    'settings-field-tooltip': '完整观察记录中展开显示的字段',
    'settings-field-narrative': '详情',
    'settings-field-facts': '要点',
    'settings-token-economics': 'Token 经济性',
    'settings-read-cost': '阅读成本',
    'settings-read-cost-description': '阅读这条观察记录所需的 Token',
    'settings-work-investment': '工作投入',
    'settings-work-investment-description': '创建这条观察记录消耗的 Token',
    'settings-savings': '节省量',
    'settings-savings-description': '复用上下文节省的总 Token',
    'settings-advanced-title': '高级',
    'settings-advanced-description': 'AI 提供方和模型选择',
    'settings-ai-provider': 'AI 提供方',
    'settings-ai-provider-tooltip': '选择 Claude（通过 Agent SDK）、Gemini（通过 REST API）或 OpenRouter',
    'settings-provider-claude': 'Claude（使用你的 Claude 账户）',
    'settings-provider-gemini': 'Gemini（使用 API Key）',
    'settings-provider-openrouter': 'OpenRouter（多模型）',
    'settings-claude-model': 'Claude 模型',
    'settings-claude-model-tooltip': '用于生成观察记录的 Claude 模型',
    'settings-model-haiku': 'haiku（最快）',
    'settings-model-sonnet': 'sonnet（均衡）',
    'settings-model-opus': 'opus（质量最高）',
    'settings-gemini-api-key': 'Gemini API Key',
    'settings-gemini-api-key-tooltip': '你的 Google AI Studio API Key（也可设置 GEMINI_API_KEY 环境变量）',
    'settings-gemini-api-key-placeholder': '输入 Gemini API Key...',
    'settings-gemini-model': 'Gemini 模型',
    'settings-gemini-model-tooltip': '用于生成观察记录的 Gemini 模型',
    'settings-gemini-model-flash-lite': 'gemini-2.5-flash-lite（免费档 10 RPM）',
    'settings-gemini-model-flash': 'gemini-2.5-flash（免费档 5 RPM）',
    'settings-gemini-model-preview': 'gemini-3-flash-preview（免费档 5 RPM）',
    'settings-gemini-rate-limiting': '速率限制',
    'settings-gemini-rate-limiting-description': '免费额度建议开启（10-30 RPM）。如果已开通计费（1000+ RPM）可关闭。',
    'settings-openrouter-api-key': 'OpenRouter API Key',
    'settings-openrouter-api-key-tooltip': '来自 openrouter.ai 的 OpenRouter API Key（也可设置 OPENROUTER_API_KEY 环境变量）',
    'settings-openrouter-api-key-placeholder': '输入 OpenRouter API Key...',
    'settings-openrouter-model': 'OpenRouter 模型',
    'settings-openrouter-model-tooltip': 'OpenRouter 模型标识符（例如 anthropic/claude-3.5-sonnet、google/gemini-2.0-flash-thinking-exp）',
    'settings-openrouter-model-placeholder': '例如 xiaomi/mimo-v2-flash:free',
    'settings-site-url': '站点 URL（可选）',
    'settings-site-url-tooltip': '用于 OpenRouter 分析的站点 URL（可选）',
    'settings-site-url-placeholder': 'https://yoursite.com',
    'settings-app-name': '应用名称（可选）',
    'settings-app-name-tooltip': '用于 OpenRouter 分析的应用名称（可选）',
    'settings-app-name-placeholder': 'claude-mem',
    'settings-worker-port': 'Worker 端口',
    'settings-worker-port-tooltip': '后台 Worker 服务端口',
    'settings-include-last-summary': '包含上次总结',
    'settings-include-last-summary-description': '将上一个会话的总结加入上下文',
    'settings-include-last-message': '包含上次消息',
    'settings-include-last-message-description': '加入上一个会话的最终消息',
    'settings-saving': '保存中...',
    'settings-saved': '✓ 已保存',
    'settings-error-prefix': '✗ 错误：',
    'settings-save': '保存',
    'preview-wrap': '换行',
    'preview-scroll': '滚动',
    'preview-wrap-enable': '开启自动换行',
    'preview-wrap-disable': '关闭自动换行（可横向滚动）',
    'preview-loading': '正在加载预览...',
    'card-type-prompt': '用户提示',
    'card-type-session-summary': '会话总结',
    'card-toggle-facts': '要点',
    'card-toggle-narrative': '详情',
    'card-title-untitled': '未命名',
    'card-files-read': '读取',
    'card-files-modified': '修改',
    'card-summary-investigated': '已排查',
    'card-summary-learned': '已了解',
    'card-summary-completed': '已完成',
    'card-summary-next-steps': '下一步',
    'card-summary-session': '会话',
    'observation-type-bugfix': '缺陷修复',
    'observation-type-feature': '功能',
    'observation-type-refactor': '重构',
    'observation-type-change': '变更',
    'observation-type-discovery': '发现',
    'observation-type-decision': '决策',
    'observation-type-anomaly': '异常',
    'observation-type-conclusion': '结论',
    'observation-type-entity': '实体发现',
    'observation-type-evidence': '证据',
    'observation-type-relationship': '关系',
    'observation-type-timeline-event': '时间线事件',
    'observation-type-argument-structure': '论证结构',
    'observation-type-case-holding': '裁判要旨',
    'observation-type-cross-case-connection': '跨案例关联',
    'observation-type-doctrine-rule': '法理／规则',
    'observation-type-issue-pattern': '争点模式',
    'observation-type-prof-framework': '教授框架',
    'observation-type-algorithm-insight': '算法洞察',
    'observation-type-dump-detected': '检测到抛售',
    'observation-type-market-condition': '市场状况',
    'observation-type-pump-detected': '检测到拉盘',
    'observation-type-signal-change': '信号变化',
    'observation-type-token-profile': '代币画像',
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

function detectBrowserLanguage(): Lang {
  if (typeof navigator === 'undefined') {
    return 'en';
  }

  const languages = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language];
  return languages.some(lang => lang?.toLowerCase().startsWith('zh')) ? 'zh' : 'en';
}

function getInitialLanguage(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const hasExplicitPreference = localStorage.getItem(EXPLICIT_STORAGE_KEY) === '1';
    const browserLang = detectBrowserLanguage();

    if (saved === 'zh' || saved === 'en') {
      // Migrate legacy installs that always defaulted to English before we
      // started tracking whether the user explicitly chose a language.
      if (!hasExplicitPreference && saved === 'en' && browserLang === 'zh') {
        localStorage.setItem(STORAGE_KEY, 'zh');
        return 'zh';
      }

      return saved;
    }

    localStorage.setItem(STORAGE_KEY, browserLang);
    return browserLang;
  } catch {
    return detectBrowserLanguage();
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => getInitialLanguage());

  const toggleLang = useCallback(() => {
    setLang(prev => {
      const next: Lang = prev === 'en' ? 'zh' : 'en';
      try {
        localStorage.setItem(STORAGE_KEY, next);
        localStorage.setItem(EXPLICIT_STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
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
