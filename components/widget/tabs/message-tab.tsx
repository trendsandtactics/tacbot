// components/widget/tabs/message-tab.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Send,
  Bot,
  Loader2,
  User,
  Plus,
  Phone,
  X,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  GraduationCap,
  ShieldCheck,
  Edit3,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { EnquiryService } from '@/lib/services/enquiry-service';
import { ChatService } from '@/lib/services/chat-service';
import { playNotificationSound } from '@/lib/utils';
import { STUDENT_GRADES, getGradeBadgeStyle } from '@/types/student';
import toast from 'react-hot-toast';

type View = 'chat' | 'contact-form';

interface AIResponseSection {
  type: 'list' | 'text' | 'buttons';
  content:
    | string
    | string[]
    | { transfer?: boolean; continue?: boolean; url?: string; label?: string };
}

/** Keep renderer contract: split by double newlines + detect bullets/buttons/text */
const formatAIResponse = (content: string): AIResponseSection[] => {
  // Normalize bullet markers (* or -) to standard bullets (•)
  const normalized = content.replace(/^[\*\-]\s+/gm, '• ');
  const sections = normalized.split('\n\n');
  return sections.map((section) => {
    // 1. Check custom button tag: [button:URL:LABEL]
    const buttonMatch = section.match(
      /\[button:(https?:\/\/[^\s:]+(?::\d+)?(?:\/[^\s:]*)?):([^\]]+)\]/
    );
    if (buttonMatch) {
      return {
        type: 'buttons',
        content: {
          url: buttonMatch[1].trim(),
          label: buttonMatch[2].trim()
        }
      };
    }

    // 2. Legacy button tags fallback
    if (
      section.includes('admission-button') ||
      section.includes('transfer-button')
    ) {
      return {
        type: 'buttons',
        content: {
          url: 'https://www.hisomega.org/admissions/',
          label: 'Admissions & Application'
        }
      };
    }

    // 3. Bullet list
    if (section.includes('•')) {
      return {
        type: 'list',
        content: section
          .split('•')
          .filter(Boolean)
          .map((item) => item.trim())
      };
    }

    // 4. Clean text (strip any remaining button tags)
    return {
      type: 'text',
      content: section.replace(/\[button:[^\]]+\]/g, '').trim()
    };
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
        'Our school is located in Pudupakkam with convenient access from nearby residential communities.'
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
        'From curiosity to confidence, from seeds to soaring, every child is prepared to thrive in school and in life.'
      ],
      ['Homer Eduship Curriculum', 'Focus: Curiosity → Confidence']
    );
  }

  // Fallback — Everything else
  return composeReply(
    [
      'I can help with information about our Pudupakkam school location or the JOIS Homer Eduship Curriculum.'
    ],
    ['Ask about location', 'Ask about curriculum']
  );
}

export function MessageTab({ onTabChange }: MessageTabProps) {
  const [view, setView] = useState<View>('chat');
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'bot'; content: string }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [formData, setFormData] = useState({ name: '', mobile: '', student_grade: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; mobile: string; student_grade?: string } | null>(null);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [satisfactionAnswer, setSatisfactionAnswer] = useState<'yes' | 'no' | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, showSatisfaction]);

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

  // Check user registration and student grade upon entering chat
  useEffect(() => {
    const u = getUser();
    setCurrentUser(u);
    if (!u?.id || !u?.student_grade) {
      if (u?.name || u?.mobile) {
        setFormData({
          name: u.name || '',
          mobile: u.mobile || '',
          student_grade: u.student_grade || ''
        });
      }
      // Put contact details form within the chat widget popup
      setView('contact-form');
    }
  }, []);

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
          console.warn('Stale enquiry ID cleared from storage:', e);
          localStorage.removeItem('active-chat-enquiry-id');
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
          console.warn('Stale chat ID cleared from storage:', e);
          localStorage.removeItem('active-chat-history-id');
        }
      }
    };

    loadSavedChat();
  }, []);

  const saveMessageToEnquiry = async (userText: string, botText: string) => {
    try {
      let user = getUser();
      
      // Auto-heal missing user if registration data exists
      if (!user?.id && (formData.name || formData.mobile)) {
        try {
          const freshUser = await ChatService.createUser(
            formData.name || 'Parent',
            formData.mobile || '9000000000',
            formData.student_grade || 'General / All Grades'
          );
          if (freshUser?.id) {
            user = freshUser;
            localStorage.setItem('user-details', JSON.stringify(freshUser));
            setCurrentUser(freshUser);
          }
        } catch (healErr) {
          console.warn('Could not auto-register user for session:', healErr);
        }
      }

      const userId = user?.id;
      if (!userId) return;

      const cleanBotText = botText
        .replace(/\n\nadmission-button/g, '')
        .replace(/admission-button/g, '')
        .replace(/\n\ntransfer-button/g, '')
        .replace(/transfer-button/g, '')
        .replace(/\[button:[^\]]+\]/g, '')
        .trim();

      // 1. Save to chat_histories and messages (Populates Conversations tab in Admin)
      try {
        let chatId = localStorage.getItem('active-chat-history-id');
        if (!chatId) {
          const newChat = await ChatService.createChat(userId);
          if (newChat?.id) {
            chatId = String(newChat.id);
            localStorage.setItem('active-chat-history-id', chatId);
          }
        }

        if (chatId) {
          try {
            await ChatService.sendMessage(
              chatId,
              userText,
              cleanBotText,
              'start',
              userId
            );
          } catch (sendErr) {
            console.warn('Chat session recovering with new session ID...', sendErr);
            localStorage.removeItem('active-chat-history-id');
            const newChat = await ChatService.createChat(userId);
            if (newChat?.id) {
              chatId = String(newChat.id);
              localStorage.setItem('active-chat-history-id', chatId);
              await ChatService.sendMessage(
                chatId,
                userText,
                cleanBotText,
                'start',
                userId
              );
            }
          }
        }
      } catch (chatErr) {
        console.warn('Chat history persistence notice:', chatErr);
      }

      // 2. Save to enquiries and enquiry_messages (Populates Enquiries tab in widget and Admin)
      try {
        let enquiryId = localStorage.getItem('active-chat-enquiry-id');
        if (!enquiryId) {
          const newEnquiry = await EnquiryService.createEnquiry(
            userId,
            'Chat with AI Assistant',
            userText
          );
          if (newEnquiry?.id) {
            enquiryId = String(newEnquiry.id);
            localStorage.setItem('active-chat-enquiry-id', enquiryId);
          }
        } else {
          try {
            await EnquiryService.sendMessage(enquiryId, userText, 'user', userId);
          } catch (enqSendErr) {
            console.warn('Enquiry session recovering with new session ID...', enqSendErr);
            localStorage.removeItem('active-chat-enquiry-id');
            const newEnquiry = await EnquiryService.createEnquiry(
              userId,
              'Chat with AI Assistant',
              userText
            );
            if (newEnquiry?.id) {
              enquiryId = String(newEnquiry.id);
              localStorage.setItem('active-chat-enquiry-id', enquiryId);
            }
          }
        }

        // Store bot response as admin message in the enquiry
        if (enquiryId && cleanBotText) {
          await EnquiryService.sendMessage(
            enquiryId,
            cleanBotText,
            'admin',
            userId
          ).catch((e) => console.warn('Could not store admin enquiry response:', e));
        }
      } catch (enqErr) {
        console.warn('Enquiries persistence notice:', enqErr);
      }
    } catch (err) {
      console.warn('Failed to store chat details notice:', err);
    }
  };

  const executeSend = async (userText: string) => {
    setIsSending(true);

    // Optimistically show user message
    setMessages((prev) => [...prev, { type: 'user', content: userText }]);

    // Call Gemini AI endpoint grounded in the student's selected grade & text
    let botText = '';
    try {
      const u = getUser();
      const currentGrade =
        u?.student_grade || currentUser?.student_grade || formData.student_grade;
      const activeChatId =
        typeof window !== 'undefined'
          ? localStorage.getItem('active-chat-history-id')
          : null;

      const res = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: activeChatId,
          message: userText,
          studentGrade: currentGrade,
          history: messages.slice(-4)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.reply) {
          botText = data.reply;
        } else {
          botText = getBotReply(userText);
        }
      } else {
        botText = getBotReply(userText);
      }
    } catch (err) {
      console.warn('AI endpoint unavailable, using fallback:', err);
      botText = getBotReply(userText);
    }

    setMessages((prev) => [...prev, { type: 'bot', content: botText }]);
    setIsSending(false);

    // Reset satisfaction & update last reply time for 3-minute prompt
    if (typeof window !== 'undefined') {
      localStorage.setItem('chat-last-reply-time', Date.now().toString());
      localStorage.removeItem('chat-satisfaction-status');
      setShowSatisfaction(false);
      setSatisfactionAnswer(null);
    }

    // Real-time audio notification
    playNotificationSound();

    // Store in enquiries and chat_histories tab in background without delaying UI
    saveMessageToEnquiry(userText, botText).catch((err) => {
      console.warn('Could not persist message in background:', err);
    });
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
    if (!user?.id || !user?.student_grade) {
      setPendingMessage(userText);
      if (user?.name || user?.mobile) {
        setFormData({
          name: user.name || '',
          mobile: user.mobile || '',
          student_grade: user.student_grade || ''
        });
      }
      setView('contact-form');
      return;
    }

    await executeSend(userText);
  };

  const handleRegisterAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.mobile.length !== 10 || !formData.student_grade || isRegistering) return;

    setIsRegistering(true);
    try {
      const user = await ChatService.createUser(
        formData.name.trim(),
        formData.mobile.trim(),
        formData.student_grade
      );
      if (user) {
        const userObj = {
          id: user.id,
          name: user.name,
          mobile: user.mobile,
          student_grade: user.student_grade || formData.student_grade
        };
        localStorage.setItem('user-details', JSON.stringify(userObj));
        setCurrentUser(userObj);
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
        setView('chat');

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
          : 'Failed to save contact details. Please try again.'
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

  // ----------------------------------------------------
  // VIEW: Contact Details Form (Within the Chat Widget Popup)
  // ----------------------------------------------------
  if (view === 'contact-form') {
    return (
      <div className="flex flex-col h-full bg-white p-5 overflow-y-auto animate-fade-in">
        {/* Navigation / Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentUser?.id && currentUser?.student_grade) {
                  setView('chat');
                } else {
                  onTabChange('home');
                }
              }}
              className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
              title="Go back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="text-base font-bold text-gray-900 leading-tight">
                {currentUser?.id ? 'Your Contact Details' : 'Student Contact Details'}
              </h2>
              <p className="text-[11px] text-gray-500">
                {currentUser?.id ? 'Review or update your information' : 'Please provide your details to chat'}
              </p>
            </div>
          </div>

          {currentUser?.id && currentUser?.student_grade && (
            <button
              onClick={() => setView('chat')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Back to Chat
            </button>
          )}
        </div>

        {/* Welcome Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-100/70 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#A8D63A] via-[#25B99A] to-[#326BEA] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot size={22} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900">
                Welcome to HIS Omega
              </h3>
              <p className="text-xs text-gray-600 mt-0.5">
                Connecting you with the right academic stream & support team
              </p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <form onSubmit={handleRegisterAndSend} className="space-y-4 flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Student / Parent Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all"
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
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="10-digit mobile number"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all"
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Student Grade <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all bg-white text-gray-800 cursor-pointer"
                  value={formData.student_grade}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      student_grade: e.target.value
                    }))
                  }
                  disabled={isRegistering}
                >
                  <option value="">Select Student Grade...</option>
                  {STUDENT_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#A8D63A] via-[#25B99A] to-[#326BEA] text-white py-3 rounded-xl font-semibold shadow hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-4"
            disabled={
              isRegistering ||
              !formData.name.trim() ||
              formData.mobile.length !== 10 ||
              !formData.student_grade
            }
          >
            {isRegistering ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving Details...
              </>
            ) : (
              <>
                {currentUser?.id ? 'Save & Continue Chatting' : 'Continue to Chat'}{' '}
                <Bot size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW: Interactive Chat
  // ----------------------------------------------------
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 px-4 border-b bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => onTabChange('home')}
            aria-label="Back to home"
            className="hover:bg-gray-100 p-1.5 rounded-full transition-colors text-gray-600 hover:text-black shrink-0"
            title="Back to Home"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-semibold text-gray-800 truncate">
                AI Support Assistant
              </span>
            </div>
            {currentUser?.student_grade && (
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    name: currentUser.name || '',
                    mobile: currentUser.mobile || '',
                    student_grade: currentUser.student_grade || ''
                  });
                  setView('contact-form');
                }}
                className="text-[11px] text-gray-500 hover:text-blue-600 text-left transition-colors flex items-center gap-1 truncate"
                title="Click to view or edit contact details"
              >
                <span>Grade:</span>
                <strong className="text-blue-600 font-semibold truncate">
                  {currentUser.student_grade}
                </strong>
                <Edit3 size={11} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              const u = getUser();
              setFormData({
                name: u?.name || '',
                mobile: u?.mobile || '',
                student_grade: u?.student_grade || ''
              });
              setView('contact-form');
            }}
            className="text-xs text-gray-600 hover:text-blue-600 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
            title="View or Edit Contact Details within widget"
          >
            <User size={13} />
            <span className="hidden sm:inline">Details</span>
          </button>

          <button
            onClick={handleNewChat}
            className="text-xs font-medium text-gray-600 hover:text-black flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors border border-gray-200"
            title="Start a new chat"
          >
            <Plus size={13} />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
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
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
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
                          <div className="mt-2.5">
                            {(() => {
                              const btn = section.content as { url?: string; label?: string };
                              const href = btn?.url || 'https://www.hisomega.org/';
                              const label = btn?.label || 'Know More on hisomega.org';
                              const isAdmission =
                                href.includes('admissions') ||
                                label.toLowerCase().includes('admission') ||
                                label.toLowerCase().includes('apply');

                              return (
                                <Link
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                  {isAdmission ? (
                                    <GraduationCap size={14} className="shrink-0" />
                                  ) : (
                                    <ExternalLink size={14} className="shrink-0" />
                                  )}
                                  <span>{label}</span>
                                </Link>
                              );
                            })()}
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
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <User size={20} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}

        {isSending && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
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

      {/* Message Input */}
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
  );
}
