import { FunctionDefinition } from '@/types/settings';

export async function executeFunctionCall(
  functionDef: FunctionDefinition,
  args: Record<string, any>
) {
  try {
    // 替换 URL 中的参数
    let url = functionDef.url;
    Object.entries(args).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    });

    const response = await fetch(url, {
      method: functionDef.method,
      headers: {
        'Content-Type': 'application/json',
        ...functionDef.headers,
      },
      ...(functionDef.method === 'POST' && {
        body: JSON.stringify(args),
      }),
    });

    if (!response.ok) {
      throw new Error(`函数调用失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('函数执行错误:', error);
    throw error;
  }
} 