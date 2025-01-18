'use client';

import { useState } from 'react';
import { Modal, Form, Input, Select, Button, Alert, Typography } from 'antd';
import { FunctionDefinition } from '@/types';
import { testFunction, TestResult } from '@/lib/api/function-tester';

const { Text } = Typography;

interface FunctionTestModalProps {
  open: boolean;
  func: FunctionDefinition;
  onClose: () => void;
}

export function FunctionTestModal({ open, func, onClose }: FunctionTestModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  const handleTest = async (values: Record<string, any>) => {
    setLoading(true);
    try {
      const testResult = await testFunction(func, values);
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '测试失败',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`测试函数: ${func.name}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Form form={form} onFinish={handleTest} layout="vertical">
        {Object.entries(func.parameters.properties).map(([key, param]) => (
          <Form.Item
            key={key}
            name={key}
            label={
              <span>
                {key}
                {func.parameters.required.includes(key) && (
                  <Text type="danger">*</Text>
                )}
                <Text type="secondary" className="ml-2">
                  ({param.description})
                </Text>
              </span>
            }
            rules={[
              {
                required: func.parameters.required.includes(key),
                message: `请输入${param.description}`,
              },
            ]}
          >
            {param.enum ? (
              <Select>
                {param.enum.map((value) => (
                  <Select.Option key={value} value={value}>
                    {value}
                  </Select.Option>
                ))}
              </Select>
            ) : (
              <Input placeholder={`请输入${param.description}`} />
            )}
          </Form.Item>
        ))}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            发送测试请求
          </Button>
        </Form.Item>
      </Form>

      {result && (
        <div className="mt-4">
          <Alert
            type={result.success ? 'success' : 'error'}
            message={
              result.success
                ? `测试成功 (${result.duration}ms)`
                : `测试失败: ${result.error}`
            }
            className="mb-4"
          />
          {result.success && result.data && (
            <div className="bg-gray-50 p-4 rounded">
              <pre className="whitespace-pre-wrap">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
} 