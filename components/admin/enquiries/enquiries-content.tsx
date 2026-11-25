'use client';

import { useState, useEffect, useMemo } from 'react';
import { AdminService } from '@/lib/services/admin-service';
import { Loader2, Search, Eye, Clock, GraduationCap, X, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AdminEnquiry } from '@/types/admin';
import { STUDENT_GRADES, getGradeBadgeStyle } from '@/types/student';
import { EnquiryDetailModal } from './enquiry-detail-modal';
import { format } from 'date-fns';

export function EnquiriesContent() {
  const [enquiries, setEnquiries] = useState<AdminEnquiry[]>([]);
  const [selectedEnquiryId, setSelectedEnquiryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);

  const loadEnquiries = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await AdminService.getAdminEnquiries();
      setEnquiries(data);
    } catch (error) {
      console.error('Error loading enquiries:', error);
      if (!silent) toast.error('Failed to load enquiries');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEnquiries();

    // Auto-refresh enquiries periodically
    const interval = setInterval(() => {
      loadEnquiries(true);
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((enquiry) => {
      // Grade filter
      if (selectedGrade !== 'all') {
        const grade = enquiry.users?.student_grade || '';
        if (selectedGrade === 'unassigned') {
          if (grade.trim() !== '') return false;
        } else if (grade !== selectedGrade) {
          return false;
        }
      }

      // Search filter
      const query = searchQuery.toLowerCase().trim();
      if (!query) return true;

      const matchesSubject = (enquiry.subject || '').toLowerCase().includes(query);
      const matchesName = (enquiry.users?.name || '').toLowerCase().includes(query);
      const matchesMobile = (enquiry.users?.mobile || '').includes(query);
      const matchesGrade = (enquiry.users?.student_grade || '').toLowerCase().includes(query);

      return matchesSubject || matchesName || matchesMobile || matchesGrade;
    });
  }, [enquiries, selectedGrade, searchQuery]);

  return (
    <div className='space-y-4'>
      {/* Search and Filters */}
      <div className='bg-white rounded-2xl shadow-xs border border-gray-100 p-4'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
          <div className='relative lg:col-span-2'>
            <Search className='w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2' />
            <input
              type='text'
              placeholder='Search by subject, student name, or mobile...'
              className='w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className='w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700'
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

          <div className='flex gap-2 justify-end'>
            <button
              onClick={() => {
                setSelectedGrade('all');
                setSearchQuery('');
              }}
              className='px-3.5 py-2 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors'
            >
              Reset
            </button>
            <button
              onClick={() => loadEnquiries()}
              className='px-3.5 py-2 text-xs font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors flex items-center justify-center gap-1.5'
              title='Refresh'
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Enquiries Table */}
      <div className='bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='bg-gray-50/75 border-b border-gray-100'>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Student / User
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Student Grade
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Subject & Details
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Status
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Last Updated
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
                    <p className='text-sm text-gray-500'>Loading enquiries...</p>
                  </td>
                </tr>
              ) : filteredEnquiries.length === 0 ? (
                <tr>
                  <td colSpan={6} className='py-12 text-center text-gray-500 text-sm'>
                    No enquiries found
                  </td>
                </tr>
              ) : (
                filteredEnquiries.map((enquiry) => {
                  const gradeStyle = getGradeBadgeStyle(enquiry.users?.student_grade);

                  return (
                    <tr key={enquiry.id} className='hover:bg-gray-50/70 transition-colors'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex flex-col'>
                          <span className='text-sm font-semibold text-gray-900'>
                            {enquiry.users?.name || 'Unknown User'}
                          </span>
                          <span className='text-xs font-mono text-gray-500'>
                            {enquiry.users?.mobile}
                          </span>
                        </div>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${gradeStyle.bg} ${gradeStyle.text} ${gradeStyle.border}`}
                        >
                          <GraduationCap size={12} />
                          {enquiry.users?.student_grade || 'Unassigned'}
                        </span>
                      </td>

                      <td className='px-6 py-4'>
                        <div className='text-sm font-medium text-gray-900 truncate max-w-xs'>
                          {enquiry.subject}
                        </div>
                        {enquiry.messages[0] && (
                          <div className='text-xs text-gray-500 truncate max-w-xs mt-0.5'>
                            {enquiry.messages[0].content}
                          </div>
                        )}
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                            enquiry.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : enquiry.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {enquiry.status}
                        </span>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center text-xs text-gray-500'>
                          <Clock className='h-3.5 w-3.5 mr-1 text-gray-400' />
                          {format(new Date(enquiry.updated_at), 'MMM d, h:mm a')}
                        </div>
                      </td>

                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <button
                          onClick={() => {
                            setSelectedEnquiryId(enquiry.id);
                            setShowModal(true);
                          }}
                          className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1'
                        >
                          <Eye className='h-3.5 w-3.5' />
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
      </div>

      {/* Enquiry Detail Modal */}
      {showModal && selectedEnquiryId && (
        <EnquiryDetailModal
          enquiryId={selectedEnquiryId}
          onClose={() => {
            setShowModal(false);
            setSelectedEnquiryId(null);
          }}
          onStatusChange={async () => {
            const data = await AdminService.getAdminEnquiries();
            setEnquiries(data);
          }}
        />
      )}
    </div>
  );
}
