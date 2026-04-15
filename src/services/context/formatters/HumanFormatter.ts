/**
 * HumanFormatter - Formats context output with ANSI colors for terminal
 *
 * Handles all colored formatting for context injection (terminal display).
 */

import type {
  ContextConfig,
  Observation,
  TokenEconomics,
  PriorMessages,
} from '../types.js';
import { colors } from '../types.js';
import { ModeManager } from '../../domain/ModeManager.js';
import { formatObservationTokenDisplay } from '../TokenCalculator.js';

type ContextLang = 'en' | 'zh';

const messages: Record<ContextLang, Record<string, string>> = {
  en: {
    recentContext: 'recent context',
    legend: 'Legend',
    sessionRequest: 'session-request',
    columnKey: 'Column Key',
    readLabel: 'Read',
    readDescription: 'Tokens to read this observation (cost to learn it now)',
    workLabel: 'Work',
    workDescription: 'Tokens spent on work that produced this record ( research, building, deciding)',
    contextIndex: 'Context Index: This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.',
    implementationHelp: 'When you need implementation details, rationale, or debugging context:',
    fetchById: '  - Fetch by ID: get_observations([IDs]) for observations visible in this index',
    searchHistory: '  - Search history: Use the mem-search skill for past decisions, bugs, and deeper research',
    trustIndex: '  - Trust this index over re-reading code for past decisions and learnings',
    contextEconomics: 'Context Economics',
    loadingLine: '  Loading: {count} observations ({tokens} tokens to read)',
    workInvestmentLine: '  Work investment: {tokens} tokens spent on research, building, and decisions',
    savingsAmountPercent: '  Your savings: {tokens} tokens ({percent}% reduction from reuse)',
    savingsAmount: '  Your savings: {tokens} tokens',
    savingsPercent: '  Your savings: {percent}% reduction from reuse',
    sessionStarted: 'Session started',
    previously: 'Previously',
    footer: 'Access {workTokensK}k tokens of past research & decisions for just {readTokens}t. Use the claude-mem skill to access memories by ID.',
    emptyState: 'No previous sessions found for this project yet.',
    investigated: 'Investigated',
    learned: 'Learned',
    completed: 'Completed',
    nextSteps: 'Next Steps'
  },
  zh: {
    recentContext: '近期上下文',
    legend: '图例',
    sessionRequest: '会话请求',
    columnKey: '列说明',
    readLabel: '读入',
    readDescription: '读取这条观察记录所需的 Token（即现在理解它的成本）',
    workLabel: '工作',
    workDescription: '产出这条记录所投入的 Token（研究、构建、决策）',
    contextIndex: '上下文索引：这个语义索引（标题、类型、文件、Token）通常已经足够帮助你理解过去的工作。',
    implementationHelp: '当你需要实现细节、设计理由或调试上下文时：',
    fetchById: '  - 按 ID 获取：对当前索引里可见的记录使用 get_observations([IDs])',
    searchHistory: '  - 搜索历史：使用 mem-search skill 查找以往决策、Bug 和更深入的研究',
    trustIndex: '  - 相比重新读代码，优先信任这个索引来了解过去的决策与结论',
    contextEconomics: '上下文经济性',
    loadingLine: '  载入：{count} 条观察记录（需读取 {tokens} Token）',
    workInvestmentLine: '  工作投入：{tokens} Token 用于研究、构建和决策',
    savingsAmountPercent: '  你的节省：{tokens} Token（通过复用减少 {percent}%）',
    savingsAmount: '  你的节省：{tokens} Token',
    savingsPercent: '  你的节省：通过复用减少 {percent}%',
    sessionStarted: '会话开始',
    previously: '上一次内容',
    footer: '只需读取 {readTokens}t，就能访问过去约 {workTokensK}k Token 的研究与决策内容。可使用 claude-mem skill 按 ID 访问记忆。',
    emptyState: '这个项目暂时还没有可用的历史会话。',
    investigated: '已调查',
    learned: '已了解',
    completed: '已完成',
    nextSteps: '下一步'
  }
};

function tr(lang: ContextLang, key: string, vars?: Record<string, string | number>): string {
  let text = messages[lang][key] || messages.en[key] || key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}

function getLocale(lang: ContextLang): string {
  return lang === 'zh' ? 'zh-CN' : 'en-US';
}

function formatHeaderDateTime(lang: ContextLang = 'en'): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA');
  const locale = getLocale(lang);
  const time = now.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', '');
  const tz = now.toLocaleTimeString(locale, { timeZoneName: 'short' }).split(' ').pop();
  return `${date} ${time} ${tz}`;
}

export function renderHumanHeader(project: string, lang: ContextLang = 'en'): string[] {
  return [
    '',
    `${colors.bright}${colors.cyan}[${project}] ${tr(lang, 'recentContext')}, ${formatHeaderDateTime(lang)}${colors.reset}`,
    `${colors.gray}${'─'.repeat(60)}${colors.reset}`,
    ''
  ];
}

export function renderHumanLegend(lang: ContextLang = 'en'): string[] {
  const mode = ModeManager.getInstance().getActiveMode();
  const typeLegendItems = mode.observation_types.map(type => `${type.emoji} ${type.id}`).join(' | ');

  return [
    `${colors.dim}${tr(lang, 'legend')}: ${tr(lang, 'sessionRequest')} | ${typeLegendItems}${colors.reset}`,
    ''
  ];
}

export function renderHumanColumnKey(lang: ContextLang = 'en'): string[] {
  return [
    `${colors.bright}${tr(lang, 'columnKey')}${colors.reset}`,
    `${colors.dim}  ${tr(lang, 'readLabel')}: ${tr(lang, 'readDescription')}${colors.reset}`,
    `${colors.dim}  ${tr(lang, 'workLabel')}: ${tr(lang, 'workDescription')}${colors.reset}`,
    ''
  ];
}

export function renderHumanContextIndex(lang: ContextLang = 'en'): string[] {
  return [
    `${colors.dim}${tr(lang, 'contextIndex')}${colors.reset}`,
    '',
    `${colors.dim}${tr(lang, 'implementationHelp')}${colors.reset}`,
    `${colors.dim}${tr(lang, 'fetchById')}${colors.reset}`,
    `${colors.dim}${tr(lang, 'searchHistory')}${colors.reset}`,
    `${colors.dim}${tr(lang, 'trustIndex')}${colors.reset}`,
    ''
  ];
}

export function renderHumanContextEconomics(
  economics: TokenEconomics,
  config: ContextConfig,
  lang: ContextLang = 'en'
): string[] {
  const output: string[] = [];

  output.push(`${colors.bright}${colors.cyan}${tr(lang, 'contextEconomics')}${colors.reset}`);
  output.push(`${colors.dim}${tr(lang, 'loadingLine', {
    count: economics.totalObservations,
    tokens: economics.totalReadTokens.toLocaleString()
  })}${colors.reset}`);
  output.push(`${colors.dim}${tr(lang, 'workInvestmentLine', {
    tokens: economics.totalDiscoveryTokens.toLocaleString()
  })}${colors.reset}`);

  if (economics.totalDiscoveryTokens > 0 && (config.showSavingsAmount || config.showSavingsPercent)) {
    let savingsLine = '';
    if (config.showSavingsAmount && config.showSavingsPercent) {
      savingsLine = tr(lang, 'savingsAmountPercent', {
        tokens: economics.savings.toLocaleString(),
        percent: economics.savingsPercent
      });
    } else if (config.showSavingsAmount) {
      savingsLine = tr(lang, 'savingsAmount', {
        tokens: economics.savings.toLocaleString()
      });
    } else {
      savingsLine = tr(lang, 'savingsPercent', {
        percent: economics.savingsPercent
      });
    }
    output.push(`${colors.green}${savingsLine}${colors.reset}`);
  }

  output.push('');
  return output;
}

export function renderHumanDayHeader(day: string): string[] {
  return [
    `${colors.bright}${colors.cyan}${day}${colors.reset}`,
    ''
  ];
}

export function renderHumanFileHeader(file: string): string[] {
  return [
    `${colors.dim}${file}${colors.reset}`
  ];
}

export function renderHumanTableRow(
  obs: Observation,
  time: string,
  showTime: boolean,
  config: ContextConfig
): string {
  const title = obs.title || 'Untitled';
  const icon = ModeManager.getInstance().getTypeIcon(obs.type);
  const { readTokens, discoveryTokens, workEmoji } = formatObservationTokenDisplay(obs, config);

  const timePart = showTime ? `${colors.dim}${time}${colors.reset}` : ' '.repeat(time.length);
  const readPart = (config.showReadTokens && readTokens > 0) ? `${colors.dim}(~${readTokens}t)${colors.reset}` : '';
  const discoveryPart = (config.showWorkTokens && discoveryTokens > 0) ? `${colors.dim}(${workEmoji} ${discoveryTokens.toLocaleString()}t)${colors.reset}` : '';

  return `  ${colors.dim}#${obs.id}${colors.reset}  ${timePart}  ${icon}  ${title} ${readPart} ${discoveryPart}`;
}

export function renderHumanFullObservation(
  obs: Observation,
  time: string,
  showTime: boolean,
  detailField: string | null,
  config: ContextConfig
): string[] {
  const output: string[] = [];
  const title = obs.title || 'Untitled';
  const icon = ModeManager.getInstance().getTypeIcon(obs.type);
  const { readTokens, discoveryTokens, workEmoji } = formatObservationTokenDisplay(obs, config);

  const timePart = showTime ? `${colors.dim}${time}${colors.reset}` : ' '.repeat(time.length);
  const readPart = (config.showReadTokens && readTokens > 0) ? `${colors.dim}(~${readTokens}t)${colors.reset}` : '';
  const discoveryPart = (config.showWorkTokens && discoveryTokens > 0) ? `${colors.dim}(${workEmoji} ${discoveryTokens.toLocaleString()}t)${colors.reset}` : '';

  output.push(`  ${colors.dim}#${obs.id}${colors.reset}  ${timePart}  ${icon}  ${colors.bright}${title}${colors.reset}`);
  if (detailField) {
    output.push(`    ${colors.dim}${detailField}${colors.reset}`);
  }
  if (readPart || discoveryPart) {
    output.push(`    ${readPart} ${discoveryPart}`);
  }
  output.push('');

  return output;
}

export function renderHumanSummaryItem(
  summary: { id: number; request: string | null },
  formattedTime: string,
  lang: ContextLang = 'en'
): string[] {
  const summaryTitle = `${summary.request || tr(lang, 'sessionStarted')} (${formattedTime})`;
  return [
    `${colors.yellow}#S${summary.id}${colors.reset} ${summaryTitle}`,
    ''
  ];
}

export function renderHumanSummaryField(label: string, value: string | null, color: string): string[] {
  if (!value) return [];
  return [`${color}${label}:${colors.reset} ${value}`, ''];
}

export function renderHumanPreviouslySection(priorMessages: PriorMessages, lang: ContextLang = 'en'): string[] {
  if (!priorMessages.assistantMessage) return [];

  return [
    '',
    '---',
    '',
    `${colors.bright}${colors.magenta}${tr(lang, 'previously')}${colors.reset}`,
    '',
    `${colors.dim}A: ${priorMessages.assistantMessage}${colors.reset}`,
    ''
  ];
}

export function renderHumanFooter(totalDiscoveryTokens: number, totalReadTokens: number, lang: ContextLang = 'en'): string[] {
  const workTokensK = Math.round(totalDiscoveryTokens / 1000);
  return [
    '',
    `${colors.dim}${tr(lang, 'footer', {
      workTokensK,
      readTokens: totalReadTokens.toLocaleString()
    })}${colors.reset}`
  ];
}

export function renderHumanEmptyState(project: string, lang: ContextLang = 'en'): string {
  return `\n${colors.bright}${colors.cyan}[${project}] ${tr(lang, 'recentContext')}, ${formatHeaderDateTime(lang)}${colors.reset}\n${colors.gray}${'─'.repeat(60)}${colors.reset}\n\n${colors.dim}${tr(lang, 'emptyState')}${colors.reset}\n`;
}

export function getHumanSummaryLabel(label: 'Investigated' | 'Learned' | 'Completed' | 'Next Steps', lang: ContextLang = 'en'): string {
  if (label === 'Investigated') return tr(lang, 'investigated');
  if (label === 'Learned') return tr(lang, 'learned');
  if (label === 'Completed') return tr(lang, 'completed');
  return tr(lang, 'nextSteps');
}
