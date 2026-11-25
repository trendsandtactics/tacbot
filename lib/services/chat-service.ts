import { Message } from '@/types/admin';

interface Button {
  text: string;
  nextFlow: string;
}

export interface ChatFlow {
  id: string;
  message: string;
  buttons: Button[];
}

export class ChatService {
  static async createUser(name: string, mobile: string, student_grade?: string) {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, student_grade })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create user');
      }

      return await res.json();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async createChat(userId: string) {
    try {
      const res = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create chat');
      }

      return await res.json();
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  static async getChatHistory(userId: string) {
    try {
      const res = await fetch(`/api/chat/history?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch chat history');
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  static async getMessages(chatId: string) {
    try {
      const res = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(chatId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch messages');
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async sendMessage(
    sessionId: string,
    content: string,
    botReply?: string,
    currentFlow: string = 'start',
    userId?: string
  ): Promise<{ userMessage: Message; aiMessage: Message; nextFlow: ChatFlow }> {
    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, content, botReply, currentFlow, userId })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }

      return await res.json();
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  static async updateChatTitle(chatId: string, title: string) {
    try {
      const res = await fetch('/api/chat/history', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, title })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update chat title');
      }

      return await res.json();
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  static async updateConversationStatus(
    id: string,
    status: 'resolved' | 'active' | 'pending'
  ) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update conversation status');
      }

      return await res.json();
    } catch (error) {
      console.error('Error updating conversation status:', error);
      throw error;
    }
  }
}
