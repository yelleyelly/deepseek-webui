export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
  BASE_URL_V0: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL_V0 || 'https://api.deepseek.com/v1',
  MODELS: {
    'chat': 'deepseek-chat',
    'coder': 'deepseek-coder',
    'reasoner': 'deepseek-reasoner',
  },
} as const;

export type ModelType = keyof typeof API_CONFIG.MODELS; 