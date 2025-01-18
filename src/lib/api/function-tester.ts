import { FunctionDefinition } from '@/types';
import { executeFunctionCall } from './function-handler';

export interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  duration?: number;
}

export async function testFunction(
  func: FunctionDefinition,
  args: Record<string, any>
): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const result = await executeFunctionCall(func, args);
    return {
      success: true,
      data: result,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
      duration: Date.now() - startTime,
    };
  }
} 