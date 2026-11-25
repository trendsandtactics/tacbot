'use client';

import { useState, useRef, useEffect } from 'react';
import {
  X,
  MessageCircle,
  Crown,
  FileQuestion,
  Info,
  Book,
  Bot,
  MessageCircleHeart,
  Send,
  Newspaper,
  Mic,
  MessageSquare,
  Home
} from 'lucide-react';
import { HomeTab } from './tabs/home-tab';
import Image from 'next/image';
import { Tooltip } from '../tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { MessageTab } from './tabs/message-tab';
import { EnquiryTab } from './tabs/enquiry-tab';
import { AnnouncementTab } from './tabs/announcement-tab';
import { ArticleTab } from './tabs/article-tab';
import { useWidget } from '@/contexts/widget-context';
import { Maximize2, Minimize2 } from 'lucide-react';

// Articles tab is kept for future use but hidden as requested
const allTabs = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'message', label: 'Message', Icon: MessageCircle },
  { id: 'enquiry', label: 'Enquiry', Icon: Send },
  { id: 'info', label: 'News', Icon: Mic },
  { id: 'articles', label: 'Articles', Icon: Newspaper, hidden: true }
];

const tabs = allTabs.filter((tab) => !tab.hidden);

export function ChatWidget() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <ChatWidgetContent />;
}

function ChatWidgetContent() {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const isMobile = useIsMobile();
  const widgetRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const { setIsExpanded } = useWidget();
  const [isExpanded, setIsExpandedState] = useState(false);

  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // On mobile screen covering whole page, do not close by outside click
      if (typeof window !== 'undefined' && window.innerWidth < 768) return;

      if (
        widgetRef.current &&
        !widgetRef.current.contains(event.target as Node)
      ) {
        setIsWidgetOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleWidget = () => {
    const newState = !isWidgetOpen;
    setIsWidgetOpen(newState);

    // Send message to parent window
    if (typeof window !== 'undefined') {
      window.parent.postMessage(
        {
          type: 'widget-toggle',
          open: newState
        },
        '*'
      );
    }
  };

  const closeWidget = () => {
    setIsWidgetOpen(false);
    // Send message to parent window
    if (typeof window !== 'undefined') {
      window.parent.postMessage(
        {
          type: 'widget-toggle',
          open: false
        },
        '*'
      );
    }
  };

  const renderHeader = () => {
    if (activeTab === 'home') return null;

    return (
      <div className='flex items-center justify-between bg-white text-black p-4 border-b border-gray-100 shrink-0'>
        <div className='flex items-center gap-2'>
          <div className='h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-white overflow-hidden shadow-2xs'>
            <Image
              src='/hisomegalogo.png'
              alt='Logo'
              width={80}
              height={80}
              className='object-cover w-full h-full'
            />
          </div>
          <div className='text-black'>
            <h3 className='font-bold text-sm sm:text-base'>HIS OMEGA</h3>
            <p className='text-xs text-gray-500'>Support & Admissions</p>
          </div>
        </div>
        <button
          onClick={closeWidget}
          className='p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-black transition-colors'
          aria-label='Close chat widget'
        >
          <X size={20} />
        </button>
      </div>
    );
  };

  const getWidgetDimensions = () => {
    if (isMobile) {
      // Mobile: cover the whole screen/page
      return 'fixed inset-0 w-full h-full h-[100dvh] rounded-none border-none z-50';
    }

    if (isExpanded) {
      // Desktop expanded: directly above the chat widget launcher button in bottom right
      return `fixed bottom-24 right-4 sm:right-6 z-50
        2xl:w-[800px] 2xl:h-[700px]
        xl:w-[700px] xl:h-[650px]
        lg:w-[600px] lg:h-[580px]
        md:w-[520px] md:h-[540px]
        w-[480px] h-[540px]
        max-w-[calc(100vw-32px)] max-h-[calc(100vh-115px)]
        rounded-2xl border border-gray-200`;
    }

    // Desktop normal: directly above the chat widget launcher button in bottom right
    return `fixed bottom-24 right-4 sm:right-6 z-50
      2xl:w-[400px] 2xl:h-[600px]
      xl:w-[390px] xl:h-[600px]
      lg:w-[380px] lg:h-[580px]
      md:w-[360px] md:h-[560px]
      w-[360px] h-[560px]
      max-w-[calc(100vw-32px)] max-h-[calc(100vh-115px)]
      rounded-2xl border border-gray-200`;
  };

  const handleExpand = (expanded: boolean) => {
    setIsExpandedState(expanded);
    setIsExpanded(expanded);
  };

  // Add effect to handle tab changes
  useEffect(() => {
    if (activeTab !== 'articles') {
      handleExpand(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Update tab switching
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId !== 'articles') {
      handleExpand(false);
    }
  };

  return (
    <div className='z-50' ref={widgetRef}>
      {/* Main Floating Button - Always pinned to bottom right */}
      <div
        className={`fixed bottom-4 right-4 sm:right-6 z-40 transition-all ${
          isMobile && isWidgetOpen ? 'hidden' : 'block'
        }`}
      >
        <button
          onClick={toggleWidget}
          className='w-16 h-16 sm:w-18 sm:h-18 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 drop-shadow-xl'
          aria-label='Chat with us'
        >
          <Image
            src='/chatbot icon.gif'
            alt='Chat with us'
            width={72}
            height={72}
            unoptimized
            className='object-cover'
          />
        </button>
      </div>

      {/* Full Widget Window - Pinned above chat widget button on desktop, full page on mobile */}
      {isWidgetOpen && (
        <div
          className={`bg-white shadow-2xl animate-scale-in transition-all duration-300 overflow-hidden flex flex-col z-50
            ${getWidgetDimensions()}`}
        >
          {/* Conditional Header */}
          {renderHeader()}

          {/* Content & Navigation Layout */}
          <div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
            <div
              ref={contentContainerRef}
              className='flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide scroll-smooth'
            >
              {activeTab === 'home' && (
                <HomeTab
                  onChatClick={() => setActiveTab('message')}
                  onClose={closeWidget}
                />
              )}
              {activeTab === 'message' && (
                <MessageTab onTabChange={setActiveTab} />
              )}
              {activeTab === 'enquiry' && <EnquiryTab />}
              {activeTab === 'info' && <AnnouncementTab />}
              {activeTab === 'articles' && (
                <div className='h-full'>
                  <ArticleTab onExpand={handleExpand} />
                </div>
              )}
            </div>

            {/* Bottom Navigation Bar */}
            <div className='flex items-center justify-between border-t border-gray-100 p-2 bg-white shrink-0'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center p-2 rounded-xl transition-colors ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.Icon size={20} />
                  <span className='text-xs mt-1'>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
