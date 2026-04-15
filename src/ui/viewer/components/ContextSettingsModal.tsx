import React, { useState, useCallback, useEffect } from 'react';
import type { Settings } from '../types';
import { TerminalPreview } from './TerminalPreview';
import { useContextPreview } from '../hooks/useContextPreview';
import { useI18n } from '../context/I18nContext';

interface ContextSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (settings: Settings) => void;
  isSaving: boolean;
  saveStatus: string;
}

// Collapsible section component
function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = true
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`settings-section-collapsible ${isOpen ? 'open' : ''}`}>
      <button
        className="section-header-btn"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <div className="section-header-content">
          <span className="section-title">{title}</span>
          {description && <span className="section-description">{description}</span>}
        </div>
        <svg
          className={`chevron-icon ${isOpen ? 'rotated' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && <div className="section-content">{children}</div>}
    </div>
  );
}

// Form field with optional tooltip
function FormField({
  label,
  tooltip,
  children
}: {
  label: string;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label className="form-field-label">
        {label}
        {tooltip && (
          <span className="tooltip-trigger" title={tooltip}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

// Toggle switch component
function ToggleSwitch({
  id,
  label,
  description,
  checked,
  onChange,
  disabled
}: {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <label htmlFor={id} className="toggle-label">{label}</label>
        {description && <span className="toggle-description">{description}</span>}
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        className={`toggle-switch ${checked ? 'on' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

export function ContextSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  isSaving,
  saveStatus
}: ContextSettingsModalProps) {
  const [formState, setFormState] = useState<Settings>(settings);
  const { t } = useI18n();

  // Update form state when settings prop changes
  useEffect(() => {
    setFormState(settings);
  }, [settings]);

  // Get context preview based on current form state
  const {
    preview,
    isLoading,
    error,
    projects,
    sources,
    selectedSource,
    setSelectedSource,
    selectedProject,
    setSelectedProject
  } = useContextPreview(formState);

  const updateSetting = useCallback((key: keyof Settings, value: string) => {
    const newState = { ...formState, [key]: value };
    setFormState(newState);
  }, [formState]);

  const handleSave = useCallback(() => {
    onSave(formState);
  }, [formState, onSave]);

  const toggleBoolean = useCallback((key: keyof Settings) => {
    const currentValue = formState[key];
    const newValue = currentValue === 'true' ? 'false' : 'true';
    updateSetting(key, newValue);
  }, [formState, updateSetting]);

  const displaySaveStatus = saveStatus.startsWith('✓')
    ? t('settings-saved')
    : saveStatus.startsWith('✗ Error:')
      ? `${t('settings-error-prefix')} ${saveStatus.replace('✗ Error:', '').trim()}`
      : saveStatus === 'Saving...'
        ? t('settings-saving')
        : saveStatus;

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="context-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{t('settings')}</h2>
          <div className="header-controls">
            <label className="preview-selector">
              {t('settings-source')}
              <select
                value={selectedSource || ''}
                onChange={(e) => setSelectedSource(e.target.value)}
                disabled={sources.length === 0}
              >
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </label>
            <label className="preview-selector">
              {t('settings-project')}
              <select
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value)}
                disabled={projects.length === 0}
              >
                {projects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </label>
            <button
              onClick={onClose}
              className="modal-close-btn"
              title={t('settings-close-title')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body - 2 columns */}
        <div className="modal-body">
          {/* Left column - Terminal Preview */}
          <div className="preview-column">
            <div className="preview-content">
              {error ? (
                <div style={{ color: '#ff6b6b' }}>
                  {t('settings-preview-error')} {error}
                </div>
              ) : (
                <TerminalPreview content={preview} isLoading={isLoading} />
              )}
            </div>
          </div>

          {/* Right column - Settings Panel */}
          <div className="settings-column">
            {/* Section 1: Loading */}
            <CollapsibleSection
              title={t('settings-loading-title')}
              description={t('settings-loading-description')}
            >
              <FormField
                label={t('settings-observations')}
                tooltip={t('settings-observations-tooltip')}
              >
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={formState.CLAUDE_MEM_CONTEXT_OBSERVATIONS || '50'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_OBSERVATIONS', e.target.value)}
                />
              </FormField>
              <FormField
                label={t('settings-sessions')}
                tooltip={t('settings-sessions-tooltip')}
              >
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formState.CLAUDE_MEM_CONTEXT_SESSION_COUNT || '10'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_SESSION_COUNT', e.target.value)}
                />
              </FormField>
            </CollapsibleSection>

            {/* Section 2: Display */}
            <CollapsibleSection
              title={t('settings-display-title')}
              description={t('settings-display-description')}
            >
              <div className="display-subsection">
                <span className="subsection-label">{t('settings-full-observations')}</span>
                <FormField
                  label={t('settings-count')}
                  tooltip={t('settings-count-tooltip')}
                >
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formState.CLAUDE_MEM_CONTEXT_FULL_COUNT || '5'}
                    onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_FULL_COUNT', e.target.value)}
                  />
                </FormField>
                <FormField
                  label={t('settings-field')}
                  tooltip={t('settings-field-tooltip')}
                >
                  <select
                    value={formState.CLAUDE_MEM_CONTEXT_FULL_FIELD || 'narrative'}
                    onChange={(e) => updateSetting('CLAUDE_MEM_CONTEXT_FULL_FIELD', e.target.value)}
                  >
                    <option value="narrative">{t('settings-field-narrative')}</option>
                    <option value="facts">{t('settings-field-facts')}</option>
                  </select>
                </FormField>
              </div>

              <div className="display-subsection">
                <span className="subsection-label">{t('settings-token-economics')}</span>
                <div className="toggle-group">
                  <ToggleSwitch
                    id="show-read-tokens"
                    label={t('settings-read-cost')}
                    description={t('settings-read-cost-description')}
                    checked={formState.CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS === 'true'}
                    onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS')}
                  />
                  <ToggleSwitch
                    id="show-work-tokens"
                    label={t('settings-work-investment')}
                    description={t('settings-work-investment-description')}
                    checked={formState.CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS === 'true'}
                    onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS')}
                  />
                  <ToggleSwitch
                    id="show-savings-amount"
                    label={t('settings-savings')}
                    description={t('settings-savings-description')}
                    checked={formState.CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT === 'true'}
                    onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT')}
                  />
                </div>
              </div>
            </CollapsibleSection>

            {/* Section 4: Advanced */}
            <CollapsibleSection
              title={t('settings-advanced-title')}
              description={t('settings-advanced-description')}
              defaultOpen={false}
            >
              <FormField
                label={t('settings-ai-provider')}
                tooltip={t('settings-ai-provider-tooltip')}
              >
                <select
                  value={formState.CLAUDE_MEM_PROVIDER || 'claude'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_PROVIDER', e.target.value)}
                >
                  <option value="claude">{t('settings-provider-claude')}</option>
                  <option value="gemini">{t('settings-provider-gemini')}</option>
                  <option value="openrouter">{t('settings-provider-openrouter')}</option>
                </select>
              </FormField>

              {formState.CLAUDE_MEM_PROVIDER === 'claude' && (
                <FormField
                  label={t('settings-claude-model')}
                  tooltip={t('settings-claude-model-tooltip')}
                >
                  <select
                    value={formState.CLAUDE_MEM_MODEL || 'haiku'}
                    onChange={(e) => updateSetting('CLAUDE_MEM_MODEL', e.target.value)}
                  >
                    <option value="haiku">{t('settings-model-haiku')}</option>
                    <option value="sonnet">{t('settings-model-sonnet')}</option>
                    <option value="opus">{t('settings-model-opus')}</option>
                  </select>
                </FormField>
              )}

              {formState.CLAUDE_MEM_PROVIDER === 'gemini' && (
                <>
                  <FormField
                    label={t('settings-gemini-api-key')}
                    tooltip={t('settings-gemini-api-key-tooltip')}
                  >
                    <input
                      type="password"
                      value={formState.CLAUDE_MEM_GEMINI_API_KEY || ''}
                      onChange={(e) => updateSetting('CLAUDE_MEM_GEMINI_API_KEY', e.target.value)}
                      placeholder={t('settings-gemini-api-key-placeholder')}
                    />
                  </FormField>
                  <FormField
                    label={t('settings-gemini-model')}
                    tooltip={t('settings-gemini-model-tooltip')}
                  >
                    <select
                      value={formState.CLAUDE_MEM_GEMINI_MODEL || 'gemini-2.5-flash-lite'}
                      onChange={(e) => updateSetting('CLAUDE_MEM_GEMINI_MODEL', e.target.value)}
                    >
                      <option value="gemini-2.5-flash-lite">{t('settings-gemini-model-flash-lite')}</option>
                      <option value="gemini-2.5-flash">{t('settings-gemini-model-flash')}</option>
                      <option value="gemini-3-flash-preview">{t('settings-gemini-model-preview')}</option>
                    </select>
                  </FormField>
                  <div className="toggle-group" style={{ marginTop: '8px' }}>
                    <ToggleSwitch
                      id="gemini-rate-limiting"
                      label={t('settings-gemini-rate-limiting')}
                      description={t('settings-gemini-rate-limiting-description')}
                      checked={formState.CLAUDE_MEM_GEMINI_RATE_LIMITING_ENABLED === 'true'}
                      onChange={(checked) => updateSetting('CLAUDE_MEM_GEMINI_RATE_LIMITING_ENABLED', checked ? 'true' : 'false')}
                    />
                  </div>
                </>
              )}

              {formState.CLAUDE_MEM_PROVIDER === 'openrouter' && (
                <>
                  <FormField
                    label={t('settings-openrouter-api-key')}
                    tooltip={t('settings-openrouter-api-key-tooltip')}
                  >
                    <input
                      type="password"
                      value={formState.CLAUDE_MEM_OPENROUTER_API_KEY || ''}
                      onChange={(e) => updateSetting('CLAUDE_MEM_OPENROUTER_API_KEY', e.target.value)}
                      placeholder={t('settings-openrouter-api-key-placeholder')}
                    />
                  </FormField>
                  <FormField
                    label={t('settings-openrouter-model')}
                    tooltip={t('settings-openrouter-model-tooltip')}
                  >
                    <input
                      type="text"
                      value={formState.CLAUDE_MEM_OPENROUTER_MODEL || 'xiaomi/mimo-v2-flash:free'}
                      onChange={(e) => updateSetting('CLAUDE_MEM_OPENROUTER_MODEL', e.target.value)}
                      placeholder={t('settings-openrouter-model-placeholder')}
                    />
                  </FormField>
                  <FormField
                    label={t('settings-site-url')}
                    tooltip={t('settings-site-url-tooltip')}
                  >
                    <input
                      type="text"
                      value={formState.CLAUDE_MEM_OPENROUTER_SITE_URL || ''}
                      onChange={(e) => updateSetting('CLAUDE_MEM_OPENROUTER_SITE_URL', e.target.value)}
                      placeholder={t('settings-site-url-placeholder')}
                    />
                  </FormField>
                  <FormField
                    label={t('settings-app-name')}
                    tooltip={t('settings-app-name-tooltip')}
                  >
                    <input
                      type="text"
                      value={formState.CLAUDE_MEM_OPENROUTER_APP_NAME || 'claude-mem'}
                      onChange={(e) => updateSetting('CLAUDE_MEM_OPENROUTER_APP_NAME', e.target.value)}
                      placeholder={t('settings-app-name-placeholder')}
                    />
                  </FormField>
                </>
              )}

              <FormField
                label={t('settings-worker-port')}
                tooltip={t('settings-worker-port-tooltip')}
              >
                <input
                  type="number"
                  min="1024"
                  max="65535"
                  value={formState.CLAUDE_MEM_WORKER_PORT || '37777'}
                  onChange={(e) => updateSetting('CLAUDE_MEM_WORKER_PORT', e.target.value)}
                />
              </FormField>

              <div className="toggle-group" style={{ marginTop: '12px' }}>
                <ToggleSwitch
                  id="show-last-summary"
                  label={t('settings-include-last-summary')}
                  description={t('settings-include-last-summary-description')}
                  checked={formState.CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY')}
                />
                <ToggleSwitch
                  id="show-last-message"
                  label={t('settings-include-last-message')}
                  description={t('settings-include-last-message-description')}
                  checked={formState.CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE === 'true'}
                  onChange={() => toggleBoolean('CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE')}
                />
              </div>
            </CollapsibleSection>
          </div>
        </div>

        {/* Footer with Save button */}
        <div className="modal-footer">
          <div className="save-status">
            {displaySaveStatus && <span className={saveStatus.includes('✓') ? 'success' : saveStatus.includes('✗') ? 'error' : ''}>{displaySaveStatus}</span>}
          </div>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t('settings-saving') : t('settings-save')}
          </button>
        </div>
      </div>
    </div>
  );
}
