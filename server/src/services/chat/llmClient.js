import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

export const llm = env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  : null;

const rawModel = env.CHAT_MODEL || 'claude-3-5-sonnet-20241022';
export const CHAT_MODEL =
  rawModel === 'claude-sonnet-5-5' ? 'claude-3-5-sonnet-20241022' : rawModel;
