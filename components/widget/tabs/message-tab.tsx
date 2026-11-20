// components/widget/tabs/message-tab.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Bot, Loader2, User, Plus, Phone, X, Check, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { EnquiryService } from '@/lib/services/enquiry-service';
import { ChatService } from '@/lib/services/chat-service';
import { playNotificationSound } from '@/lib/utils';
import toast from 'react-hot-toast';

type View = 'chat';

interface AIResponseSection {
  type: 'list' | 'text' | 'buttons';
  content: string | string[] | { transfer: boolean; continue: boolean };
}

/** Keep renderer contract: split by double newlines + detect bullets/buttons/text */
const formatAIResponse = (content: string): AIResponseSection[] => {
  const sections = content.split('\n\n');
  return sections.map((section) => {
    if (section.includes('transfer-button')) {
      return { type: 'buttons', content: { transfer: true, continue: true } };
    }
    if (section.includes('•')) {
      return {
        type: 'list',
        content: section
          .split('•')
          .filter(Boolean)
          .map((item) => item.trim()),
      };
    }
    return { type: 'text', content: section };
  });
};

interface MessageTabProps {
  onTabChange: (tab: string) => void;
}

/** Helper to compose response WITHOUT keywords visible */
function composeReply(bodyParagraphs: string[], bullets: string[]): string {
  const body = bodyParagraphs.join('\n\n');
  const bulletBlock = bullets.length ? `• ${bullets.join('\n• ')}` : '';
  return [body, bulletBlock, 'transfer-button'].filter(Boolean).join('\n\n');
}

/** ============================================
 *   BOT LOGIC — ONLY 2 ANSWERS ALLOWED
 * ============================================ */
function getBotReply(raw: string): string {
  const q = raw.toLowerCase();

  // 1 — School location in Pudupakkam
  if (
    q.includes('where') &&
    (q.includes('school') || q.includes('located')) &&
    q.includes('pudupakkam')
  ) {
    return composeReply(
      [
        'Our school is located in Pudupakkam with convenient access from nearby residential communities.',
      ],
      ['Location: Pudupakkam']
    );
  }

  // 2 — JOIS Homer Eduship Curriculum
  if (
    q.includes('curriculum') ||
    q.includes('homer eduship') ||
    q.includes('education')
  ) {
    return composeReply(
      [
        'At JOIS, the Homer Eduship Curriculum is more than education—it’s a voyage.',
        'From curiosity to confidence, from seeds to soaring, every child is prepared to thrive in school and in life.',
      ],
      ['Homer Eduship Curriculum', 'Focus: Curiosity → Confidence']
    );
  }

  // Fallback — Everything else
  return composeReply(
    [
      'I can help with information about our Pudupakkam school location or the JOIS Homer Eduship Curriculum.',
    ],
    ['Ask about location', 'Ask about curriculum']
  );
}

export function MessageTab({ onTabChange }: MessageTabProps) {
  const [view] = useState<View>('chat');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot'; content: string }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', mobile: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [satisfactionAnswer, setSatisfactionAnswer] = useState<'yes' | 'no' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, showSatisfaction]);

  // Check 3-minute satisfaction prompt timer
  useEffect(() => {
    if (typeof window === 'undefined' || messages.length === 0) return;

    // Check if at least one bot reply has occurred
    const hasBotReply = messages.some((m) => m.type === 'bot');
    if (!hasBotReply) return;

    const savedStatus = localStorage.getItem('chat-satisfaction-status');
    if (savedStatus === 'yes' || savedStatus === 'no') {
      setSatisfactionAnswer(savedStatus);
      setShowSatisfaction(true);
      return;
    }

    let lastReplyTimeStr = localStorage.getItem('chat-last-reply-time');
    if (!lastReplyTimeStr) {
      lastReplyTimeStr = Date.now().toString();
      localStorage.setItem('chat-last-reply-time', lastReplyTimeStr);
    }

    const lastReplyTime = parseInt(lastReplyTimeStr, 10);
    const elapsed = Date.now() - lastReplyTime;
    const THREE_MINUTES = 3 * 60 * 1000; // 180,000 ms

    if (elapsed >= THREE_MINUTES) {
      setShowSatisfaction(true);
    } else {
      const remainingTime = THREE_MINUTES - elapsed;
      const timer = setTimeout(() => {
        setShowSatisfaction(true);
        playNotificationSound();
        toast('Are you satisfied with the answer?', { icon: '❓' });
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const getUser = () => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('user-details');
    if (!stored) return null;
    try {
      const u = JSON.parse(stored);
      return u?.id ? u : null;
    } catch {
      return null;
    }
  };

  // Load existing messages from active enquiry or chat history on mount
  useEffect(() => {
    const loadSavedChat = async () => {
      if (typeof window === 'undefined') return;
      const savedEnquiryId = localStorage.getItem('active-chat-enquiry-id');
      const savedChatId = localStorage.getItem('active-chat-history-id');

      if (savedEnquiryId) {
        try {
          const history = await EnquiryService.getEnquiryMessages(savedEnquiryId);
          if (history && history.length > 0) {
            setMessages(
              history.map((m: { sender_type: string; content: string }) => ({
                type: m.sender_type === 'user' ? 'user' : 'bot',
                content: m.content
              }))
            );
            return;
          }
        } catch (e) {
          console.error('Error loading previous enquiry messages:', e);
        }
      }

      if (savedChatId) {
        try {
          const chatMsgs = await ChatService.getMessages(savedChatId);
          if (chatMsgs && chatMsgs.length > 0) {
            setMessages(
              chatMsgs.map((m: { role: string; content: string }) => ({
                type: m.role === 'user' ? 'user' : 'bot',
                content: m.content
              }))
            );
          }
        } catch (e) {
          console.error('Error loading previous chat messages:', e);
        }
      }
    };

    loadSavedChat();
  }, []);

  const saveMessageToEnquiry = async (userText: string, botText: string) => {
    try {
      const user = getUser();
      if (!user?.id) return;

      const cleanBotText = botText
        .replace(/\n\ntransfer-button/g, '')
        .replace(/transfer-button/g, '')
        .trim();

      // 1. Save to chat_histories and messages (Populates Conversations tab in Admin!)
      try {
        let chatId = localStorage.getItem('active-chat-history-id');
        if (!chatId) {
          const newChat = await ChatService.createChat(user.id);
          if (newChat?.id) {
            chatId = String(newChat.id);
            localStorage.setItem('active-chat-history-id', chatId);
          }
        }
        if (chatId) {
          await ChatService.sendMessage(chatId, userText, cleanBotText);
        }
      } catch (chatErr) {
        console.error('Failed to store in chat_histories:', chatErr);
      }

      // 2. Save to enquiries and enquiry_messages (Populates Enquiries tab in widget and Admin!)
      try {
        let enquiryId = localStorage.getItem('active-chat-enquiry-id');
        if (!enquiryId) {
          // Create new enquiry in MySQL enquiries table
          const newEnquiry = await EnquiryService.createEnquiry(
            user.id,
            'Chat with AI Assistant',
            userText
          );
          if (newEnquiry?.id) {
            enquiryId = String(newEnquiry.id);
            localStorage.setItem('active-chat-enquiry-id', enquiryId);
          }
        } else {
          // Append user message to existing enquiry
          await EnquiryService.sendMessage(enquiryId, userText, 'user');
        }

        // Store bot response as admin message in the enquiry
        if (enquiryId && cleanBotText) {
          await EnquiryService.sendMessage(enquiryId, cleanBotText, 'admin');
        }
      } catch (enqErr) {
        console.error('Failed to store in enquiries:', enqErr);
      }
    } catch (err) {
      console.error('Failed to store chat details:', err);
    }
  };

  const executeSend = async (userText: string) => {
    setIsSending(true);

    // Optimistically show user message
    setMessages((prev) => [...prev, { type: 'user', content: userText }]);

    // Get bot reply
    const botText = getBotReply(userText);
    setMessages((prev) => [...prev, { type: 'bot', content: botText }]);

    // Reset satisfaction & update last reply time for 3-minute prompt
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-last-reply-time', Date.now().toString());
      localStorage.removeItem('chat-satisfaction-status');
      setShowSatisfaction(false);
      setSatisfactionAnswer(null);
    }

    // Real-time audio and toast notifications
    playNotificationSound();
    toast.success('Assistant replied!');

    // Store in enquiries tab
    await saveMessageToEnquiry(userText, botText);

    setIsSending(false);
  };

  const handleSatisfaction = async (answer: 'yes' | 'no') => {
    setIsUpdatingStatus(true);
    const targetStatus: 'resolved' | 'active' = answer === 'yes' ? 'resolved' : 'active';

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('chat-satisfaction-status', answer);
        const chatId = localStorage.getItem('active-chat-history-id');
        const enquiryId = localStorage.getItem('active-chat-enquiry-id');

        if (chatId) {
          await ChatService.updateConversationStatus(chatId, targetStatus).catch(() => {});
        }
        if (enquiryId) {
          await EnquiryService.updateStatus(enquiryId, targetStatus).catch(() => {});
        }
      }

      setSatisfactionAnswer(answer);
      playNotificationSound();
      toast.success(
        answer === 'yes'
          ? 'Conversation marked as resolved!'
          : 'Conversation marked as active!'
      );
    } catch (err) {
      console.error('Error updating satisfaction status:', err);
      toast.error('Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isSending) return;

    const userText = currentMessage.trim();
    setCurrentMessage('');

    const user = getUser();
    if (!user?.id) {
      setPendingMessage(userText);
      setShowRegisterModal(true);
      return;
    }

    await executeSend(userText);
  };

  const handleRegisterAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.mobile.length !== 10 || isRegistering) return;

    setIsRegistering(true);
    try {
      const user = await ChatService.createUser(formData.name.trim(), formData.mobile.trim());
      if (user) {
        const userObj = {
          id: user.id,
          name: user.name,
          mobile: user.mobile
        };
        localStorage.setItem('user-details', JSON.stringify(userObj));
        window.dispatchEvent(
          new CustomEvent('local-storage-update', {
            detail: { key: 'user-details', value: userObj }
          })
        );
        window.dispatchEvent(
          new CustomEvent('user-details-updated', {
            detail: userObj
          })
        );
        toast.success(`Welcome, ${user.name}!`);
        setShowRegisterModal(false);
        setFormData({ name: '', mobile: '' });

        if (pendingMessage) {
          const textToSend = pendingMessage;
          setPendingMessage('');
          await executeSend(textToSend);
        }
      }
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to register. Please try again.'
      );
    } finally {
      setIsRegistering(false);
    }
  };

  const handleNewChat = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('active-chat-history-id');
      localStorage.removeItem('active-chat-enquiry-id');
      localStorage.removeItem('chat-last-reply-time');
      localStorage.removeItem('chat-satisfaction-status');
    }
    setMessages([]);
    setShowSatisfaction(false);
    setSatisfactionAnswer(null);
    playNotificationSound();
    toast.success('Started a new chat session');
  };

  return (
    <div className="flex flex-col h-full">
      {view === 'chat' && (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-3 px-4 border-b bg-white">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTabChange('home')}
                aria-label="Back to home"
                className="hover:bg-gray-100 p-1.5 rounded-full transition-colors text-gray-600 hover:text-black"
                title="Back to Home"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-gray-800">
                  AI Support Assistant
                </span>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="text-xs font-medium text-gray-600 hover:text-black flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
              title="Start a new chat"
            >
              <Plus size={14} /> New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {messages.length === 0 && (
              <div className="h-full w-full flex items-center justify-center text-gray-500">
                <span className="text-sm">Start a conversation…</span>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot size={20} className="text-gray-600" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    message.type === 'user'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.type === 'user' ? (
                    <p className="text-[13px] leading-6">{message.content}</p>
                  ) : (
                    <div className="space-y-5">
                      {formatAIResponse(message.content).map(
                        (section: AIResponseSection, idx: number) => (
                          <div key={idx}>
                            {section.type === 'list' ? (
                              <ul className="space-y-3">
                                {(section.content as string[]).map(
                                  (item: string, itemIdx: number) => (
                                    <li
                                      key={itemIdx}
                                      className="flex items-start gap-3"
                                    >
                                      <span className="text-gray-700 mt-1">
                                        •
                                      </span>
                                      <span className="text-[13px] leading-6">
                                        {item}
                                      </span>
                                    </li>
                                  )
                                )}
                              </ul>
                            ) : section.type === 'buttons' ? (
                              <div className="flex gap-3 mt-2">
                                <button
                                  onClick={() => onTabChange('enquiry')}
                                  className="px-2 py-2 text-[14px] font-semibold bg-black text-white rounded-lg"
                                >
                                  Talk to Agent
                                </button>
                                <Link
                                  href="https://www.hisomega.org/admissions/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-2 text-[14px] font-semibold bg-black text-white rounded-lg"
                                >
                                  Admission
                                </Link>
                              </div>
                            ) : (
                              <p className="text-[13px] text-black leading-6 tracking-wide">
                                {(section.content as string)
                                  .split('\n')
                                  .map((line: string, i: number) => (
                                    <span
                                      key={i}
                                      className="block mb-2 last:mb-0"
                                    >
                                      {line || <br />}
                                    </span>
                                  ))}
                              </p>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User size={20} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}

            {isSending && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bot size={20} className="text-gray-600" />
                </div>
                <div className="bg-gray-100 rounded-2xl px-4 py-2.5">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}

            {/* 3-Minute Satisfaction Check */}
            {showSatisfaction && (
              <div className="mx-auto my-3 w-full max-w-sm rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <Sparkles size={14} />
                  </div>
                  <p className="text-xs font-semibold text-gray-800">
                    Are you satisfied with the answer?
                  </p>
                </div>

                {satisfactionAnswer ? (
                  <div
                    className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                      satisfactionAnswer === 'yes'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                    }`}
                  >
                    {satisfactionAnswer === 'yes' ? (
                      <>
                        <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                        <span>
                          Conversation marked as <strong>Resolved</strong>. Thank you!
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={16} className="text-yellow-600 shrink-0" />
                        <span>
                          Conversation marked as <strong>Active</strong>. Support is available to assist you.
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleSatisfaction('yes')}
                      disabled={isUpdatingStatus}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-xs disabled:opacity-50"
                    >
                      <Check size={14} /> Yes (Resolve)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSatisfaction('no')}
                      disabled={isUpdatingStatus}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 disabled:opacity-50"
                    >
                      <X size={14} /> No (Keep Active)
                    </button>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t bg-white p-2 sm:p-4">
            <div className="flex gap-2 max-w-full">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 rounded-full border border-gray-200 focus:ring-2 focus:ring-black"
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={isSending}
                />
              </div>

              <button
                onClick={handleSendMessage}
                className="shrink-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600"
                aria-label="Send message"
                disabled={!currentMessage.trim() || isSending}
              >
                {isSending ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal if not registered */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 pt-3 sm:pt-4 overflow-y-auto bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 relative animate-scale-in">
            <button
              onClick={() => {
                setShowRegisterModal(false);
                setPendingMessage('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#A8D63A] via-[#25B99A] to-[#326BEA] flex items-center justify-center text-white shadow-sm">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Start Chat</h3>
                <p className="text-xs text-gray-500">
                  Please enter your details to chat with support
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterAndSend} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all"
                    value={formData.mobile}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        mobile: e.target.value.replace(/\D/g, '')
                      }))
                    }
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#A8D63A] via-[#25B99A] to-[#326BEA] text-white py-3 rounded-lg font-semibold shadow hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
                disabled={
                  isRegistering ||
                  !formData.name.trim() ||
                  formData.mobile.length !== 10
                }
              >
                {isRegistering ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Continue to Chat <Bot size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
