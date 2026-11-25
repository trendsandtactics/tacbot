'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageCircle,
  Bell,
  Globe,
  Menu,
  X,
  Newspaper,
  MessagesSquare,
  Users,
  Bot
} from 'lucide-react';
import { useState } from 'react';
import { Logo } from '../logo';

// All items preserved; articles is hidden per user request
const allNavigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'AI Grade Agents',
    href: '/admin/agents',
    icon: Bot
  },
  {
    name: 'Contact Details',
    href: '/admin/contacts',
    icon: Users
  },
  {
    name: 'Conversations',
    href: '/admin/conversations',
    icon: MessageCircle
  },
  {
    name: 'Enquiries',
    href: '/admin/enquiries',
    icon: MessagesSquare
  },
  {
    name: 'Articles',
    href: '/admin/articles',
    icon: Newspaper,
    hidden: true
  },
  {
    name: 'Announcements',
    href: '/admin/announcements',
    icon: Bell
  },
  {
    name: 'Website Content',
    href: '/admin/website',
    icon: Globe
  }
];

const navigation = allNavigation.filter((item) => !item.hidden);

export function AdminNavigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        aria-label='Toggle navigation menu'
        className='lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-lg bg-white shadow-md text-gray-700 hover:text-black hover:bg-gray-50 border border-gray-200'
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className='h-5 w-5' />
        ) : (
          <Menu className='h-5 w-5' />
        )}
      </button>

      {/* Sidebar */}
      <aside
        suppressHydrationWarning
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 shadow-sm flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div
          className='flex items-center justify-center h-16 border-b border-gray-100 px-6'
          suppressHydrationWarning
        >
          <Logo />
        </div>

        <div
          className='flex-1 overflow-y-auto px-3 py-5'
          suppressHydrationWarning
        >
          <p className='px-3 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider'>
            Management
          </p>
          <nav className='space-y-1' suppressHydrationWarning>
            {navigation.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'group flex items-center px-3.5 py-2.5 text-sm font-medium rounded-xl transition-all duration-150',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-4 w-4 transition-colors',
                      isActive
                        ? 'text-blue-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div
          className='p-4 border-t border-gray-100 bg-gray-50/50'
          suppressHydrationWarning
        >
          <div
            className='flex items-center gap-3 px-2 py-1.5'
            suppressHydrationWarning
          >
            <div
              className='w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs'
              suppressHydrationWarning
            >
              HO
            </div>
            <div
              className='flex flex-col min-w-0'
              suppressHydrationWarning
            >
              <span className='text-xs font-semibold text-gray-900 truncate'>
                HIS Omega Admin
              </span>
              <span className='text-[10px] text-gray-500 truncate'>
                omega-support@hisomega.org
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 z-30 bg-black/40 backdrop-blur-xs lg:hidden'
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
