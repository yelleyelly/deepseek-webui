'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { useState } from 'react';

interface MessageContentProps {
  content: string;
}

export function MessageContent({ content }: MessageContentProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      message.success('代码已复制');
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      message.error('复制失败');
    }
  };

  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const code = String(children).replace(/\n$/, '');

          if (!inline && match) {
            return (
              <div className="relative group">
                <Button
                  type="text"
                  size="small"
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  icon={copiedCode === code ? <CheckOutlined /> : <CopyOutlined />}
                  onClick={() => handleCopyCode(code)}
                />
                <SyntaxHighlighter
                  language={match[1]}
                  style={vscDarkPlus}
                  PreTag="div"
                  {...props}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          }
          return <code className={className} {...props}>{children}</code>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
} 