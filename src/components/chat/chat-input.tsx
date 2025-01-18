'use client';

import { useState } from 'react';
import { Input, Button, message, Tooltip, Modal } from 'antd';
import { SendOutlined, DeleteOutlined, DownloadOutlined } from '@ant-design/icons';
import { useChatStore } from '@/lib/store/chat-store';
import { useSettingsStore } from '@/lib/store/settings-store';
import { chatCompletion } from '@/lib/api/deepseek';
import { useChatShortcuts } from '@/hooks/use-chat-shortcuts';
import styles from '@/styles/chat/chat-input.module.css';
import { TemplateSelector } from './template-selector';

export const ChatInput = () => {
  const [input, setInput] = useState('');
  const { addMessage, messages, isLoading, setLoading, clearMessages } = useChatStore();
  const { settings, apiKey } = useSettingsStore();

  const sendMessage = async (content: string) => {
    if (!apiKey) {
      message.error('请先设置 API Key');
      return;
    }

    const userMessage = {
      role: 'user' as const,
      content: content.trim(),
      timestamp: Date.now(),
    };

    try {
      addMessage(userMessage);
      setLoading(true);

      const messageList = settings.systemPrompt
        ? [
            { role: 'system' as const, content: settings.systemPrompt, timestamp: 0 },
            ...messages,
            userMessage,
          ]
        : [...messages, userMessage];

      const response = await chatCompletion(messageList, settings, apiKey);

      addMessage({
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      });
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('发送消息失败，请重试');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  useChatShortcuts({
    onSend: handleSubmit,
    onClear: () => {
      if (messages.length > 0) {
        Modal.confirm({
          title: '确认清空',
          content: '确定要清空所有对话记录吗？此操作不可恢复。',
          onOk: clearMessages,
        });
      }
    },
  });

  const handleExport = () => {
    try {
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        time: new Date(msg.timestamp).toLocaleString()
      }));

      const blob = new Blob([JSON.stringify(chatHistory, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat-history-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  const handleClear = () => {
    if (messages.length > 0) {
      Modal.confirm({
        title: '确认清空',
        content: '确定要清空所有对话记录吗？此操作不可恢复。',
        onOk: clearMessages,
      });
    }
  };

  const handleTemplateSelect = async (prompt: string) => {
    if (isLoading) return;
    await sendMessage(prompt);
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <TemplateSelector 
          onSelect={handleTemplateSelect}
          disabled={isLoading} 
        />
        <div className={styles.toolbarActions}>
          <Tooltip title="导出对话">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
              disabled={messages.length === 0}
            />
          </Tooltip>
          <Tooltip title="清空对话">
            <Button
              icon={<DeleteOutlined />}
              onClick={handleClear}
              disabled={messages.length === 0}
            />
          </Tooltip>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className={styles.inputWrapper}>
          <Input.TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="输入消息... (Ctrl + Enter 发送)"
            autoSize={{ minRows: 1, maxRows: 4 }}
            className={styles.textarea}
          />
          <Tooltip title="发送 (Ctrl + Enter)">
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSubmit()}
              loading={isLoading}
              className={styles.sendButton}
            >
              发送
            </Button>
          </Tooltip>
        </div>
      </form>
    </div>
  );
}; 