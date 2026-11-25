'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Loader2, Filter, GraduationCap, X, RefreshCw } from 'lucide-react';
import { AdminService } from '@/lib/services/admin-service';
import { ChatService } from '@/lib/services/chat-service';
import type { Conversation } from '@/types/admin';
import { STUDENT_GRADES, getGradeBadgeStyle } from '@/types/student';
import toast from 'react-hot-toast';
import { ConversationDetailModal } from './conversation-detail-modal';
import { playNotificationSound } from '@/lib/utils';
import {
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  endOfDay
} from 'date-fns';

export function ConversationsContent() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const prevCountRef = useRef<number>(0);

  const loadConversations = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await AdminService.getConversations();
      if (silent && prevCountRef.current > 0 && data.length > prevCountRef.current) {
        toast('🔔 New conversation received!', { icon: '💬' });
        playNotificationSound();
      }
      prevCountRef.current = data.length;
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (!silent) toast.error('Failed to load conversations');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(() => {
      loadConversations(true);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      // Grade filter
      if (selectedGrade !== 'all') {
        const grade = conversation.users?.student_grade || '';
        if (selectedGrade === 'unassigned') {
          if (grade.trim() !== '') return false;
        } else if (grade !== selectedGrade) {
          return false;
        }
      }

      // Search filter
      const matchesSearch =
        conversation.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conversation.lastMessage?.toLowerCase() || '').includes(
          searchQuery.toLowerCase()
        ) ||
        (conversation.users?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conversation.users?.mobile || '').includes(searchQuery);

      if (!matchesSearch) return false;

      // Date range filter
      if (dateRange) {
        const conversationDate = parseISO(conversation.updated_at);
        const selectedDate = parseISO(dateRange);
        return isWithinInterval(conversationDate, {
          start: startOfDay(selectedDate),
          end: endOfDay(selectedDate)
        });
      }

      return true;
    });
  }, [conversations, searchQuery, selectedGrade, dateRange]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredConversations.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentConversations = filteredConversations.slice(
    startIndex,
    endIndex
  );

  const handleShowAll = () => {
    setSearchQuery('');
    setSelectedGrade('all');
    setDateRange('');
    setCurrentPage(1);
  };

  return (
    <div className='space-y-4'>
      {/* Search and Filters */}
      <div className='bg-white rounded-2xl shadow-xs border border-gray-100 p-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3'>
          <div className='relative lg:col-span-2'>
            <Search className='w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2' />
            <input
              type='text'
              placeholder='Search by name, mobile, session ID...'
              className='w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className='w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700'
            >
              <option value='all'>All Student Grades</option>
              {STUDENT_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
              <option value='unassigned'>Unassigned Grade</option>
            </select>
          </div>

          <div>
            <input
              type='date'
              className='w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700'
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className='flex gap-2'>
            <button
              onClick={handleShowAll}
              className='flex-1 px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors'
            >
              Reset
            </button>
            <button
              onClick={() => loadConversations()}
              className='px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center'
              title='Refresh conversations'
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Conversations Table */}
      <div className='bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='bg-gray-50/75 border-b border-gray-100'>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Date & Time
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Student / User
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Student Grade
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Latest Message
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className='py-12 text-center'>
                    <Loader2 className='h-7 w-7 animate-spin mx-auto text-blue-500 mb-2' />
                    <p className='text-sm text-gray-500'>Loading conversations...</p>
                  </td>
                </tr>
              ) : currentConversations.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className='py-12 text-center text-gray-500 text-sm'
                  >
                    No conversations found matching filters
                  </td>
                </tr>
              ) : (
                currentConversations.map((conversation) => {
                  const gradeStyle = getGradeBadgeStyle(
                    conversation.users?.student_grade
                  );

                  return (
                    <tr
                      key={conversation.id}
                      className='hover:bg-gray-50/70 transition-colors'
                    >
                      <td className='px-6 py-4 whitespace-nowrap text-xs text-gray-600'>
                        {format(
                          new Date(conversation.updated_at),
                          'MMM d, yyyy, h:mm a'
                        )}
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex flex-col'>
                          <span className='text-sm font-semibold text-gray-900'>
                            {conversation.users?.name || 'Unknown User'}
                          </span>
                          {conversation.users?.mobile && (
                            <span className='text-xs font-mono text-gray-400'>
                              {conversation.users.mobile}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${gradeStyle.bg} ${gradeStyle.text} ${gradeStyle.border}`}
                        >
                          <GraduationCap size={12} />
                          {conversation.users?.student_grade || 'Unassigned'}
                        </span>
                      </td>

                      <td className='px-6 py-4 text-sm text-gray-600 max-w-xs truncate'>
                        {conversation.lastMessage || 'No messages yet'}
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <select
                          value={conversation.status || 'active'}
                          onChange={async (e) => {
                            const newStatus = e.target.value as
                              | 'resolved'
                              | 'active'
                              | 'pending';
                            try {
                              await ChatService.updateConversationStatus(
                                conversation.id,
                                newStatus
                              );
                              setConversations((prev) =>
                                prev.map((c) =>
                                  c.id === conversation.id
                                    ? { ...c, status: newStatus }
                                    : c
                                )
                              );
                              playNotificationSound();
                              toast.success(`Marked as ${newStatus}`);
                            } catch {
                              toast.error('Failed to update status');
                            }
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer outline-none capitalize ${
                            conversation.status === 'resolved'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : conversation.status === 'active'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                        >
                          <option value='active'>Active</option>
                          <option value='resolved'>Resolved</option>
                          <option value='pending'>Pending</option>
                        </select>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <button
                          onClick={() => setSelectedConversation(conversation.id)}
                          className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors'
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600'>
          <div className='flex items-center gap-2'>
            <span>Rows per page:</span>
            <select
              className='border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none'
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className='flex items-center gap-3'>
            <span>
              {filteredConversations.length > 0
                ? `${startIndex + 1}-${Math.min(
                    endIndex,
                    filteredConversations.length
                  )} of ${filteredConversations.length}`
                : '0 of 0'}
            </span>

            <div className='flex items-center gap-1'>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className='px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold'
              >
                &larr; Prev
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
                className='px-2.5 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold'
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conversation Detail Modal */}
      {selectedConversation && (
        <ConversationDetailModal
          conversationId={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
}
