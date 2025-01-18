import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Message, ChatSettings } from '@/types';

interface ChatState {
  messages: Message[];
  settings: ChatSettings;
  isLoading: boolean;
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  setLoading: (loading: boolean) => void;
}

const defaultSettings: ChatSettings = {
  temperature: 0.7,
  topP: 0.9,
  topK: 50,
  maxLength: 2000,
  systemPrompt: '',
  model: '7b'
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      settings: defaultSettings,
      isLoading: false,
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),
      clearMessages: () => set({ messages: [] }),
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'chat-store',
      partialize: (state) => ({ messages: state.messages, settings: state.settings }),
    }
  )
); 