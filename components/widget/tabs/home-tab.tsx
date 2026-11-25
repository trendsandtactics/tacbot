'use client';

import Image from 'next/image';
import { Bot, ChevronDown, Facebook, Instagram, Linkedin, Loader2, Phone, User, X, GraduationCap } from 'lucide-react';
import * as Accordion from '@radix-ui/react-accordion';
import { useState, useEffect } from 'react';
import { AnnouncementService } from '@/lib/services/announcement-service';
import { ChatService } from '@/lib/services/chat-service';
import type { Announcement } from '@/types/announcement';
import { STUDENT_GRADES } from '@/types/student';
import toast from 'react-hot-toast';
import Link from 'next/link';

function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      viewBox='0 0 24 24'
      aria-hidden='true'
      className={className}
      fill='currentColor'
    >
      <path d='M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' />
    </svg>
  );
}

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/omegaintlschool',
    icon: Instagram,
    colorClass: 'text-pink-600',
    bgClass: 'bg-pink-50 group-hover:bg-pink-100'
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/school/lalaji-memorial-omega-international-school/posts/',
    icon: Linkedin,
    colorClass: 'text-[#0A66C2]',
    bgClass: 'bg-blue-50 group-hover:bg-blue-100'
  },
  {
    name: 'X',
    href: 'https://x.com/omegaintlschool',
    icon: XIcon,
    colorClass: 'text-gray-900',
    bgClass: 'bg-gray-100 group-hover:bg-gray-200'
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/omegaintlschool',
    icon: Facebook,
    colorClass: 'text-[#1877F2]',
    bgClass: 'bg-blue-50 group-hover:bg-blue-100'
  }
];

interface HomeTabProps {
  onChatClick: () => void;
  onClose?: () => void;
}

export function HomeTab({ onChatClick, onClose }: HomeTabProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', mobile: '', student_grade: '' });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const data = await AnnouncementService.getAnnouncements();
        // Only show the latest 3 announcements on home tab
        setAnnouncements(data.slice(0, 5));
      } catch (error) {
       
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  const handleChatClick = () => {
    // Navigate directly into message tab where contact details form is rendered within the widget popup
    onChatClick();
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
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
        setFormData({ name: '', mobile: '', student_grade: '' });
        onChatClick();
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

  const faqs = [
    {
      question: 'How can I start a conversation?',
      answer:
        'Click on the Message tab and start chatting with our AI assistant.'
    },
    {
      question: 'What are your business hours?',
      answer: 'We are available 24/7 through our AI chat support.'
    }
  ];

  return (
    <div className='flex flex-col gap-6 animate-fade-in p-4'>
      {/* Hero Section */}
      <div className='relative text-black'>
        <button
          onClick={onClose}
          className='absolute top-8 right-5 text-white hover:opacity-75'
          aria-label='Close widget'
        >
          <X size={20} className='text-white' />
        </button>
         <div
  className="flex justify-between p-5 rounded-lg mt-2 items-start mb-4"
  style={{
    background: 'linear-gradient(to right, #A8D63A, #25B99A, #168FE0, #326BEA)'
  }}
>
  <div className="flex flex-col items-start gap-6">
            <Image
              src='/hisomegalogo.png'
              alt='Logo'
              width={100}
              height={100}
              className='h-20 w-20 rounded-full object-cover'
            />
            <div>
              <h1 className='text-[32px] font-semibold mb-2 text-white'>
                Hello there
              </h1>
              <h2 className='text-[24px] font-semibold text-white'>
                How can we help?
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className='flex flex-col gap-3'>
        <button
          onClick={handleChatClick}
          className="bg-gradient-to-r flex items-center gap-4 justify-center text-base font-semibold hover:font-semibold from-[#A8D63A] via-[#25B99A] to-[#326BEA] text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
        >
          Chat with Us <Bot className="w-6 h-6" />
        </button>

        {/* Social Media Accounts */}
        <div className='bg-white rounded-lg border p-3 shadow-sm'>
          <p className='text-xs font-semibold text-gray-500 uppercase tracking-wider text-center mb-2'>
            Connect with Us
          </p>
          <div className='grid grid-cols-4 gap-2'>
            {socialLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  title={`Follow us on ${item.name}`}
                  aria-label={item.name}
                  className='flex flex-col items-center justify-center p-2 rounded-lg border border-transparent hover:bg-gray-50 transition-all duration-200 group'
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${item.bgClass} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <Icon className={`w-4 h-4 ${item.colorClass}`} />
                  </div>
                  <span className='text-[11px] font-medium text-gray-600 mt-1.5 group-hover:text-gray-900 truncate w-full text-center'>
                    {item.name}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className='space-y-4'>
        <h3 className='font-semibold text-[14px] text-gray-800 px-1'>
          Recent Announcements
        </h3>
        {isLoading ? (
          <div className='flex justify-center items-center py-8'>
            <Loader2 className='w-6 h-6 animate-spin text-gray-500' />
          </div>
        ) : announcements.length === 0 ? (
          <div className='text-center py-8 text-gray-500'>
            No announcements available
          </div>
        ) : (
          <div className='space-y-3'>
            {announcements.map((announcement, index) => (
              <div
                key={announcement.id}
                className='bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-300 animate-fade-in'
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {announcement.image_url && (
                  <div className='relative w-full h-80 mb-3 rounded-lg overflow-hidden'>
                    <Image
                      src={announcement.image_url}
                      alt={announcement.title}
                      fill
                      className='object-cover'
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className='space-y-2'>
                  <h4 className='font-medium text-[14px] leading-6 text-gray-800'>
                    {announcement.title}
                  </h4>
                  <p className='text-sm text-gray-600 text-[13px] leading-6'>
                    {announcement.description}
                  </p>
                  {announcement.link && (
                    <Link
                      href={announcement.link}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-yellow-600 text-sm hover:underline inline-block'
                    >
                      Learn more
                    </Link>
                  )}
                  <span className='text-xs text-gray-400 block'>
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className='space-y-4'>
        <h3 className='font-semibold text-[14px] text-gray-800 px-1'>
          Frequently Asked Questions
        </h3>
        <Accordion.Root type='single' collapsible className='space-y-2'>
          {faqs.map((faq, index) => (
            <Accordion.Item
              key={index}
              value={`item-${index}`}
              className='bg-white border rounded-lg overflow-hidden animate-fade-in'
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <Accordion.Trigger className='flex items-center justify-between w-full p-4 text-left hover:bg-gray-50 transition-colors'>
                <span className='font-medium text-gray-600 text-[14px] leading-6'>
                  {faq.question}
                </span>
                <ChevronDown className='h-4 w-4 text-gray-500 transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] group-data-[state=open]:rotate-180' />
              </Accordion.Trigger>
              <Accordion.Content className='overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp'>
                <div className='p-4 pt-0 text-sm text-gray-600 text-[13px] leading-6'>
                  {faq.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>

      {/* Registration Modal for Chat with Us - contained inside widget popup */}
      {showRegisterModal && (
        <div className='absolute inset-0 z-30 flex flex-col bg-white p-5 overflow-y-auto animate-fade-in'>
          <div className='w-full relative'>
            <button
              onClick={() => setShowRegisterModal(false)}
              className='absolute top-0 right-0 p-1 text-gray-400 hover:text-gray-600 transition-colors'
              aria-label='Close modal'
            >
              <X size={20} />
            </button>

            <div className='flex items-center gap-3 mb-5'>
              <div className='w-11 h-11 rounded-full bg-gradient-to-r from-[#A8D63A] via-[#25B99A] to-[#326BEA] flex items-center justify-center text-white shadow-sm'>
                <Bot size={24} />
              </div>
              <div>
                <h3 className='text-lg font-bold text-gray-900'>Start Chat</h3>
                <p className='text-xs text-gray-500'>
                  Please provide your details to chat with us
                </p>
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className='space-y-4'>
              <div>
                <label className='block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5'>
                  Name
                </label>
                <div className='relative'>
                  <User className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
                  <input
                    type='text'
                    required
                    placeholder='Enter your full name'
                    className='w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={isRegistering}
                  />
                </div>
              </div>

              <div>
                <label className='block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5'>
                  Mobile Number
                </label>
                <div className='relative'>
                  <Phone className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
                  <input
                    type='tel'
                    required
                    placeholder='Enter 10-digit mobile number'
                    pattern='[0-9]{10}'
                    maxLength={10}
                    className='w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all'
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
                <label className='block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5'>
                  Student Grade
                </label>
                <div className='relative'>
                  <GraduationCap className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
                  <select
                    required
                    className='w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#25B99A] focus:border-transparent outline-none transition-all bg-white text-gray-800'
                    value={formData.student_grade}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        student_grade: e.target.value
                      }))
                    }
                    disabled={isRegistering}
                  >
                    <option value=''>Select Student Grade...</option>
                    {STUDENT_GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type='submit'
                className='w-full bg-gradient-to-r from-[#A8D63A] via-[#25B99A] to-[#326BEA] text-white py-3 rounded-lg font-semibold shadow hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2'
                disabled={
                  isRegistering ||
                  !formData.name.trim() ||
                  formData.mobile.length !== 10 ||
                  !formData.student_grade
                }
              >
                {isRegistering ? (
                  <>
                    <Loader2 size={18} className='animate-spin' />
                    Starting Chat...
                  </>
                ) : (
                  <>
                    Start Chatting <Bot size={18} />
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
