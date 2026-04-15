/**
 * HeaderRenderer - Renders the context header sections
 *
 * Handles rendering of header, legend, column key, context index, and economics.
 */

import type { ContextConfig, TokenEconomics } from '../types.js';
import { shouldShowContextEconomics } from '../TokenCalculator.js';
import * as Agent from '../formatters/AgentFormatter.js';
import * as Human from '../formatters/HumanFormatter.js';

/**
 * Render the complete header section
 */
export function renderHeader(
  project: string,
  economics: TokenEconomics,
  config: ContextConfig,
  forHuman: boolean,
  lang: 'en' | 'zh' = 'en'
): string[] {
  const output: string[] = [];

  // Main header
  if (forHuman) {
    output.push(...Human.renderHumanHeader(project, lang));
  } else {
    output.push(...Agent.renderAgentHeader(project));
  }

  // Legend
  if (forHuman) {
    output.push(...Human.renderHumanLegend(lang));
  } else {
    output.push(...Agent.renderAgentLegend());
  }

  // Column key
  if (forHuman) {
    output.push(...Human.renderHumanColumnKey(lang));
  } else {
    output.push(...Agent.renderAgentColumnKey());
  }

  // Context index instructions
  if (forHuman) {
    output.push(...Human.renderHumanContextIndex(lang));
  } else {
    output.push(...Agent.renderAgentContextIndex());
  }

  // Context economics
  if (shouldShowContextEconomics(config)) {
    if (forHuman) {
      output.push(...Human.renderHumanContextEconomics(economics, config, lang));
    } else {
      output.push(...Agent.renderAgentContextEconomics(economics, config));
    }
  }

  return output;
}
