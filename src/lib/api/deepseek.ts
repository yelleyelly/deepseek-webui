import { Message, Settings } from '@/types';
import { API_CONFIG } from './config';
import { executeFunctionCall } from './function-handler';

interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

export async function chatCompletion(
  messages: Message[],
  settings: Settings,
  apiKey: string,
  onStream?: (content: string) => void,
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
    if (!apiKey || apiKey.length < 30) {
      throw new Error('请先在设置页面配置您的 DeepSeek API Key');
    }

    const response = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        model: API_CONFIG.MODELS[settings.model as keyof typeof API_CONFIG.MODELS],
        messages: messages.map(({ role, content }) => ({ role, content })),
        temperature: settings.temperature,
        ...(tools && tools.length > 0 ? { tools } : {}),
        stream: true,
      }),
    }).catch(error => {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('apikey') || 
          errorMessage.includes('api key') || 
          errorMessage.includes('access token') ||
          errorMessage.includes('unauthorized')) {
        throw new Error('API Key 无效，请检查您的 API Key 设置');
      }
      throw error;
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => null);
      const errorMessage = errorBody?.toLowerCase() || response.statusText.toLowerCase();
      
      if (errorMessage.includes('authentication') || 
          errorMessage.includes('apikey') || 
          errorMessage.includes('api key') || 
          errorMessage.includes('access token') ||
          errorMessage.includes('unauthorized')) {
        throw new Error('API Key 无效，请检查您的 API Key 设置');
      }
      
      throw new Error(
        `API 请求失败 (${response.status}): ${response.statusText}\n${errorBody ? `详细信息: ${errorBody}` : ''}`
      );
    }

    if (!response.body) {
      throw new Error('响应体为空');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let currentToolCall: {
      id?: string;
      function?: {
        name?: string;
        arguments?: string;
      };
    } = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 解码新的数据块并添加到缓冲区
        const chunk = decoder.decode(value, { stream: true });
        console.log('收到原始数据块:', chunk);
        buffer += chunk;

        // 处理完整的 SSE 消息
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        for (const line of lines) {
          // 跳过空行和注释
          if (!line.trim() || line.startsWith(':')) continue;

          console.log('处理单行数据:', line);

          // 处理 SSE 消息
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim(); // 移除 "data: " 前缀并清理空白
            console.log('尝试解析的 JSON 数据:', data);
            
            if (data === '[DONE]') {
              console.log('收到结束标记');
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              console.log('解析后的数据:', parsed);
              
              // 处理普通的文本内容
              if (parsed.choices?.[0]?.delta?.content) {
                const content = parsed.choices[0].delta.content;
                console.log('提取的内容:', content);
                fullContent += content;
                onStream?.(content);
              }

              // 处理函数调用的增量更新
              if (parsed.choices?.[0]?.delta?.tool_calls?.[0]) {
                const toolCallDelta = parsed.choices[0].delta.tool_calls[0];
                
                // 更新当前的工具调用
                if (toolCallDelta.id) {
                  currentToolCall.id = toolCallDelta.id;
                }
                if (toolCallDelta.function?.name) {
                  if (!currentToolCall.function) currentToolCall.function = {};
                  currentToolCall.function.name = toolCallDelta.function.name;
                }
                if (toolCallDelta.function?.arguments) {
                  if (!currentToolCall.function) currentToolCall.function = {};
                  currentToolCall.function.arguments = (currentToolCall.function.arguments || '') + 
                    toolCallDelta.function.arguments;
                }

                // 如果收到了完整的函数调用
                if (currentToolCall.id && 
                    currentToolCall.function?.name && 
                    typeof currentToolCall.function.arguments === 'string') {
                  console.log('完整的函数调用:', currentToolCall);

                  const functionDef = settings.functions?.find(
                    f => f.name === currentToolCall.function?.name
                  );

                  if (!functionDef) {
                    throw new Error(`未找到函数定义: ${currentToolCall.function?.name}`);
                  }

                  try {
                    const functionArgs = JSON.parse(currentToolCall.function.arguments);
                    const result = await executeFunctionCall(functionDef, functionArgs);
                    
                    // 发送第二次请求
                    const secondResponse = await fetch(`${API_CONFIG.BASE_URL}/chat/completions`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'Accept': 'text/event-stream',
                      },
                      body: JSON.stringify({
                        model: API_CONFIG.MODELS[settings.model as keyof typeof API_CONFIG.MODELS],
                        messages: [
                          ...messages,
                          { 
                            role: 'assistant',
                            content: fullContent,
                            tool_calls: [{
                              id: currentToolCall.id!,
                              type: 'function',
                              function: {
                                name: currentToolCall.function!.name!,
                                arguments: currentToolCall.function!.arguments!
                              }
                            }]
                          },
                          {
                            role: 'tool',
                            tool_call_id: currentToolCall.id,
                            content: JSON.stringify(result),
                          },
                        ],
                        temperature: settings.temperature,
                        stream: true,
                      }),
                    });

                    if (!secondResponse.ok) {
                      throw new Error(`API 请求失败: ${secondResponse.statusText}`);
                    }

                    // 重置当前工具调用
                    currentToolCall = {};

                    // 处理第二次响应
                    const secondReader = secondResponse.body?.getReader();
                    if (secondReader) {
                      let secondBuffer = '';
                      while (true) {
                        const { done, value } = await secondReader.read();
                        if (done) break;

                        const secondChunk = decoder.decode(value, { stream: true });
                        console.log('第二次响应原始数据块:', secondChunk);
                        secondBuffer += secondChunk;

                        const secondLines = secondBuffer.split('\n');
                        secondBuffer = secondLines.pop() || '';

                        for (const secondLine of secondLines) {
                          if (!secondLine.trim() || secondLine.startsWith(':')) continue;

                          if (secondLine.startsWith('data: ')) {
                            const secondData = secondLine.slice(6).trim();
                            if (secondData === '[DONE]') continue;

                            try {
                              const secondParsed = JSON.parse(secondData);
                              if (secondParsed.choices?.[0]?.delta?.content) {
                                const content = secondParsed.choices[0].delta.content;
                                fullContent += content;
                                onStream?.(content);
                              }
                            } catch (e) {
                              console.error('解析第二次响应数据失败:', e);
                            }
                          }
                        }
                      }
                      secondReader.releaseLock();
                    }
                  } catch (e) {
                    console.error('执行函数调用失败:', e);
                  }
                }
              }
            } catch (e) {
              console.error('解析响应数据失败:', e);
              console.error('导致错误的数据:', data);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent;
  } catch (error) {
    console.error('API 调用错误:', error);
    throw error;
  }
}

export interface BalanceInfo {
  currency: 'CNY' | 'USD';
  total_balance: string;
  granted_balance: string;
  topped_up_balance: string;
}

export interface BalanceResponse {
  is_available: boolean;
  balance_infos: BalanceInfo[];
}

export async function getBalance(apiKey: string): Promise<BalanceResponse> {
  if (!apiKey) {
    throw new Error('请先设置 API Key');
  }

  const response = await fetch(`${API_CONFIG.BASE_URL}/user/balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error('获取余额失败');
  }

  return response.json();
} 