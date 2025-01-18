import { Message, Settings } from '@/types';
import { API_CONFIG } from './config';
import { executeFunctionCall } from './function-handler';

export async function chatCompletion(
  messages: Message[],
  settings: Settings,
  apiKey: string
) {
  try {
    // 转换函数定义为 DeepSeek 格式
    const tools = settings.functions?.map(func => ({
      type: 'function',
      function: {
        name: func.name,
        description: func.description,
        parameters: func.parameters,
      },
    }));

    const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: API_CONFIG.MODELS[settings.model],
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: settings.temperature,
        ...(tools && tools.length > 0 ? { tools } : {}), // 只在有函数时添加 tools
      }),
    });

    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.statusText}`);
    }

    const data = await response.json();
    const message = data.choices[0].message;

    // 处理函数调用
    if (message.tool_calls && settings.functions) {
      const results = await Promise.all(
        message.tool_calls.map(async (toolCall) => {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const functionDef = settings.functions.find(f => f.name === functionName);

          if (!functionDef) {
            throw new Error(`未找到函数定义: ${functionName}`);
          }

          const result = await executeFunctionCall(functionDef, functionArgs);
          return {
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          };
        })
      );

      // 第二次调用，包含所有函数执行结果
      const secondResponse = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: API_CONFIG.MODELS[settings.model],
          messages: [
            ...messages,
            message,
            ...results,
          ],
          temperature: settings.temperature,
        }),
      });

      if (!secondResponse.ok) {
        throw new Error(`API 请求失败: ${secondResponse.statusText}`);
      }

      const secondData = await secondResponse.json();
      return secondData.choices[0].message.content;
    }

    return message.content;
  } catch (error) {
    console.error('API 调用错误:', error);
    throw error;
  }
} 