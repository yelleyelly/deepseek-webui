export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || 'https://api.siliconflow.cn/v1',
  BASE_URL_V0: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL_V0 || 'https://api.siliconflow.cn/v1',
  BASE_COZE_URL: process.env.NEXT_PUBLIC_COZE_API_URL || 'https://api.coze.cn/v1',
  MODELS: {
    'chat': 'deepseek-ai/DeepSeek-V3',
    'reasoner': 'Pro/deepseek-ai/DeepSeek-R1',
  },
} as const;

export type ModelType = keyof typeof API_CONFIG.MODELS; 
