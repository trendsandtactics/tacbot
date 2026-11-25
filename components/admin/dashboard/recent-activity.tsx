'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Loader2, MessageSquare, ArrowRight, User } from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import type { RecentActivity as RecentActivityType } from '@/types/admin';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { format } from 'date-fns';

export function RecentActivity() {
  const [activity, setActivity] = useState<RecentActivityType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActivity = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await AdminService.getRecentActivity();
        setActivity(data);
      } catch (error) {
        console.error('Error loading recent activity:', error);
        setError('Failed to load recent activity');
        toast.error('Failed to load recent activity');
      } finally {
        setIsLoading(false);
      }
    };

    loadActivity();
  }, []);

  if (isLoading) {
    return (
      <div className='bg-white rounded-2xl border border-gray-100 shadow-xs p-6'>
        <div className='flex justify-center items-center min-h-[200px]'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className='bg-white rounded-2xl border border-gray-100 shadow-xs p-6'>
        <div className='text-center text-gray-500 py-6'>
          <p className='text-sm mb-2'>{error || 'Failed to load recent activity'}</p>
          <button
            onClick={() => window.location.reload()}
            className='text-xs font-semibold text-blue-600 hover:text-blue-700 underline'
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden'>
      <div className='p-6'>
        <div className='flex items-center justify-between mb-5'>
          <div>
            <h3 className='text-base font-bold text-gray-900'>Recent Activity</h3>
            <p className='text-xs text-gray-400 mt-0.5'>
              Latest user chats and support tickets
            </p>
          </div>
          <Link
            href='/admin/conversations'
            className='text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1'
          >
            View all conversations <ArrowRight size={13} />
          </Link>
        </div>

        {activity.recentEnquiries.length === 0 &&
        activity.recentChats.length === 0 ? (
          <div className='text-center text-gray-400 py-8 text-sm'>
            No recent activity recorded yet
          </div>
        ) : (
          <div className='space-y-3'>
            {activity.recentEnquiries.map((enquiry) => (
              <div
                key={enquiry.id}
                className='flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100/80 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0'>
                    <MessageSquare size={16} />
                  </div>
                  <div>
                    <p className='font-semibold text-sm text-gray-900'>
                      {enquiry.subject}
                    </p>
                    <p className='text-xs text-gray-500'>
                      by <strong className='font-medium text-gray-700'>{enquiry.users.name}</strong>
                    </p>
                  </div>
                </div>

                <div className='text-right'>
                  <span
                    className={`px-2.5 py-0.5 text-xs font-semibold rounded-full capitalize ${
                      enquiry.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : enquiry.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {enquiry.status}
                  </span>
                  <p className='text-[11px] text-gray-400 mt-1'>
                    {format(new Date(enquiry.created_at), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}

            {activity.recentChats.map((chat) => (
              <div
                key={chat.id}
                className='flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100/80 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div className='w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0'>
                    <MessageCircle size={16} />
                  </div>
                  <div>
                    <p className='font-semibold text-sm text-gray-900'>
                      New Chat Session
                    </p>
                    <p className='text-xs text-gray-500'>
                      by <strong className='font-medium text-gray-700'>{chat.users.name}</strong>
                    </p>
                  </div>
                </div>

                <p className='text-[11px] text-gray-400'>
                  {format(new Date(chat.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
