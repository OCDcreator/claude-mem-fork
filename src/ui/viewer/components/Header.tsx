import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ThemePreference } from '../hooks/useTheme';
import { GitHubStarsButton } from './GitHubStarsButton';
import { useSpinningFavicon } from '../hooks/useSpinningFavicon';
import { useI18n } from '../context/I18nContext';

interface HeaderProps {
  isConnected: boolean;
  projects: string[];
  sources: string[];
  currentFilter: string;
  currentSource: string;
  onFilterChange: (filter: string) => void;
  onSourceChange: (source: string) => void;
  isProcessing: boolean;
  queueDepth: number;
  themePreference: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
  onContextPreviewToggle: () => void;
}

function formatSourceLabel(source: string): string {
  if (source === 'all') return 'All';
  if (source === 'claude') return 'Claude';
  if (source === 'codex') return 'Codex';
  return source.charAt(0).toUpperCase() + source.slice(1);
}

function buildSourceTabs(sources: string[]): string[] {
  const merged = ['all', 'claude', 'codex', ...sources];
  return Array.from(new Set(merged.filter(Boolean)));
}

export function Header({
  isConnected,
  projects,
  sources,
  currentFilter,
  currentSource,
  onFilterChange,
  onSourceChange,
  isProcessing,
  queueDepth,
  themePreference,
  onThemeChange,
  onContextPreviewToggle
}: HeaderProps) {
  useSpinningFavicon(isProcessing);
  const availableSources = buildSourceTabs(sources);
  const { lang, toggleLang, t } = useI18n();

  return (
    <div className="header">
      <div className="header-main">
        <h1>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img src="claude-mem-logomark.webp" alt="" className={`logomark ${isProcessing ? 'spinning' : ''}`} />
            {queueDepth > 0 && (
              <div className="queue-bubble">
                {queueDepth}
              </div>
            )}
          </div>
          <span className="logo-text">claude-mem</span>
        </h1>
        <div className="source-tabs" role="tablist" aria-label="Context source tabs">
          {availableSources.map(source => (
            <button
              key={source}
              type="button"
              className={`source-tab ${currentSource === source ? 'active' : ''}`}
              onClick={() => onSourceChange(source)}
              aria-pressed={currentSource === source}
            >
              {formatSourceLabel(source)}
            </button>
          ))}
        </div>
      </div>
      <div className="status">
        <div className="header-actions">
          <button
            id="lang-toggle"
            className="lang-toggle"
            title={t('lang-toggle-title')}
            onClick={toggleLang}
          >
            {lang === 'en' ? 'EN' : '中'}
          </button>
          <div className="repo-links">
            <a
              href="https://github.com/thedotmack/claude-mem"
              target="_blank"
              rel="noopener noreferrer"
              className="repo-link repo-link-upstream"
              title={t('repo-upstream-title')}
            >
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="3" x2="6" y2="15"></line>
                <circle cx="18" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <path d="M18 9a9 9 0 0 1-9 9"></path>
              </svg>
              <span>{t('repo-upstream')}</span>
            </a>
            <a
              href="https://github.com/OCDcreator/claude-mem-fork"
              target="_blank"
              rel="noopener noreferrer"
              className="repo-link repo-link-fork"
              title={t('repo-fork-title')}
            >
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="18" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"></path>
                <path d="M12 12v3"></path>
              </svg>
              <span>{t('repo-fork')}</span>
            </a>
          </div>
        </div>
        <a
          href="https://docs.claude-mem.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="icon-link"
          title={t('documentation')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </a>
        <GitHubStarsButton username="thedotmack" repo="claude-mem" />
        <select
          value={currentFilter}
          onChange={e => onFilterChange(e.target.value)}
        >
          <option value="">{t('all-projects')}</option>
          {projects.map(project => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
        <ThemeToggle
          preference={themePreference}
          onThemeChange={onThemeChange}
        />
        <button
          className="settings-btn"
          onClick={onContextPreviewToggle}
          title={t('settings')}
        >
          <svg className="settings-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}
