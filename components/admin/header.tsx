'use client';

import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, ShieldCheck, ChevronRight } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import toast from 'react-hot-toast';
import Link from 'next/link';

export function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy'
  });

  const getSectionTitle = () => {
    if (pathname === '/admin') return 'Dashboard';
    if (pathname.includes('/agents')) return 'AI Grade Agents';
    if (pathname.includes('/contacts')) return 'Contact Details';
    if (pathname.includes('/conversations')) return 'Conversations';
    if (pathname.includes('/enquiries')) return 'Enquiries';
    if (pathname.includes('/announcements')) return 'Announcements';
    if (pathname.includes('/website')) return 'Website Content';
    if (pathname.includes('/articles')) return 'Articles';
    return 'Management';
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
      router.push('/sign-in');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <header
      className='bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs'
      suppressHydrationWarning
    >
      <div
        className='h-16 flex items-center justify-between px-6'
        suppressHydrationWarning
      >
        {/* Breadcrumb / Title */}
        <div
          className='flex items-center gap-2 pl-10 lg:pl-0'
          suppressHydrationWarning
        >
          <Link
            href='/admin'
            className='text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors uppercase tracking-wider'
          >
            Admin
          </Link>
          <ChevronRight size={14} className='text-gray-300' />
          <h1 className='text-base font-bold text-gray-900'>
            {getSectionTitle()}
          </h1>
        </div>

        {/* User profile & actions */}
        <div
          className='flex items-center gap-4'
          suppressHydrationWarning
        >
          <div
            className='hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-700'
            suppressHydrationWarning
          >
            <ShieldCheck size={14} className='text-emerald-600' />
            <span>Administrator</span>
          </div>

          <button
            onClick={handleSignOut}
            className='flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-xl border border-gray-200 transition-all'
            title='Sign out of admin portal'
          >
            <LogOut className='h-4 w-4' />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
