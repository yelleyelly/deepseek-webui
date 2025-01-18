'use client';

import { ChatWindow } from '@/components/chat/chat-window';
import { ChatInput } from '@/components/chat/chat-input';
import styles from '@/styles/layout/page-layout.module.css';

export default function ChatPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageContent}>
        <div className="flex-1 min-h-0">
          <ChatWindow />
        </div>
        <ChatInput />
      </div>
    </div>
  );
} 