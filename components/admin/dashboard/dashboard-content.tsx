'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  MessageCircle,
  FileQuestion,
  Clock,
  Loader2,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { StatsCard } from './stats-card';
import { RecentActivity } from './recent-activity';
import { AdminService } from '@/lib/services/admin-service';
import { STUDENT_GRADES, getGradeBadgeStyle } from '@/types/student';
import Link from 'next/link';

export function DashboardContent() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalChats: number;
    totalEnquiries: number;
    activeEnquiries: number;
    todayChats: number;
    todayEnquiries: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await AdminService.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard stats:', error);
        toast.error('Failed to load dashboard statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div
        className='flex justify-center items-center min-h-[300px]'
        suppressHydrationWarning
      >
        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className='text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100'
        suppressHydrationWarning
      >
        Failed to load dashboard statistics
      </div>
    );
  }

  return (
    <div className='space-y-6' suppressHydrationWarning>
      {/* Stat Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <StatsCard
          title='Contact Details'
          value={stats.totalUsers}
          icon={Users}
          href='/admin/contacts'
        />
        <StatsCard
          title='Total Chats'
          value={stats.totalChats}
          icon={MessageCircle}
          trend={{
            value: stats.todayChats,
            label: 'Today'
          }}
          href='/admin/conversations'
        />
        <StatsCard
          title='Total Enquiries'
          value={stats.totalEnquiries}
          icon={FileQuestion}
          trend={{
            value: stats.todayEnquiries,
            label: 'Today'
          }}
          href='/admin/enquiries'
        />
        <StatsCard
          title='Active Enquiries'
          value={stats.activeEnquiries}
          icon={Clock}
          href='/admin/enquiries'
        />
      </div>

      {/* Grade Quick Filter Bar */}
      <div className='bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-sm'>
        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4'>
          <div>
            <div className='flex items-center gap-2'>
              <GraduationCap className='w-5 h-5 text-blue-400' />
              <h3 className='text-base font-bold'>Student Grade Streams</h3>
            </div>
            <p className='text-xs text-blue-200 mt-1'>
              Explore student admissions and leads categorized by grade streams
            </p>
          </div>
          <Link
            href='/admin/contacts'
            className='inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white text-gray-900 hover:bg-blue-50 transition-colors shadow-xs'
          >
            View All Contact Details <ArrowRight size={14} />
          </Link>
        </div>

        <div className='flex flex-wrap gap-2 pt-1'>
          {STUDENT_GRADES.map((grade) => (
            <Link
              key={grade}
              href={`/admin/contacts`}
              className='px-3 py-1.5 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all'
            >
              {grade}
            </Link>
          ))}
        </div>
      </div>

      <RecentActivity />
    </div>
  );
}
