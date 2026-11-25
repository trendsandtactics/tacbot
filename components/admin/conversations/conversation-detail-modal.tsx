'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, X, MessageSquare, Bot, User } from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import type { Message } from '@/types/admin';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

interface ConversationDetailModalProps {
  conversationId: string;
  onClose: () => void;
}

export function ConversationDetailModal({
  conversationId,
  onClose
}: ConversationDetailModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await AdminService.getConversationMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in'>
      <div className='bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-gray-100 animate-scale-in'>
        <div className='flex items-center justify-between p-4 px-6 border-b border-gray-100'>
          <div className='flex items-center gap-2.5'>
            <div className='w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center'>
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className='text-base font-bold text-gray-900'>
                Conversation Transcript
              </h3>
              <p className='text-xs font-mono text-gray-400'>
                ID: {conversationId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className='p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-600 transition-colors'
          >
            <X className='h-5 w-5' />
          </button>
        </div>

        <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50'>
          {isLoading ? (
            <div className='flex justify-center items-center h-48'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
            </div>
          ) : messages.length === 0 ? (
            <div className='text-center py-12 text-gray-400 text-sm'>
              No messages in this conversation session
            </div>
          ) : (
            messages.map((message) => {
              const isBot = message.role === 'assistant';

              return (
                <div
                  key={message.id}
                  className={`flex items-start gap-2.5 ${
                    isBot ? 'justify-start' : 'justify-end'
                  }`}
                >
                  {isBot && (
                    <div className='w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-1'>
                      <Bot size={14} />
                    </div>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 shadow-2xs ${
                      isBot
                        ? 'bg-white text-gray-900 border border-gray-100 rounded-tl-xs'
                        : 'bg-blue-600 text-white rounded-tr-xs'
                    }`}
                  >
                    <p className='text-xs font-semibold mb-1 opacity-70 capitalize'>
                      {isBot ? 'AI Assistant' : 'User'}
                    </p>
                    <p className='text-sm whitespace-pre-wrap leading-relaxed'>
                      {message.content}
                    </p>
                    <span className='text-[10px] opacity-65 mt-2 block text-right'>
                      {format(new Date(message.created_at), 'h:mm a, MMM d')}
                    </span>
                  </div>

                  {!isBot && (
                    <div className='w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-1'>
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className='p-4 px-6 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
