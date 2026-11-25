'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Phone,
  MessageSquare,
  Calendar,
  Edit2,
  X,
  Check,
  Loader2,
  Users,
  GraduationCap,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import { STUDENT_GRADES, getGradeBadgeStyle } from '@/types/student';
import { AdminService } from '@/lib/services/admin-service';
import type { AdminContact } from '@/types/admin';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function ContactsContent() {
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [editingContact, setEditingContact] = useState<AdminContact | null>(null);
  const [newGradeValue, setNewGradeValue] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState(false);
  const [selectedDetailContact, setSelectedDetailContact] = useState<AdminContact | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const loadContacts = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const data = await AdminService.getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
      if (!silent) toast.error('Failed to load contact details');
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Filtered contacts calculation
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      // Grade filter
      if (selectedGrade !== 'all') {
        if (selectedGrade === 'unassigned') {
          if (contact.student_grade && contact.student_grade.trim() !== '') {
            return false;
          }
        } else if (contact.student_grade !== selectedGrade) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = contact.name.toLowerCase().includes(query);
        const matchesMobile = contact.mobile.toLowerCase().includes(query);
        const matchesGrade = (contact.student_grade || '')
          .toLowerCase()
          .includes(query);
        return matchesName || matchesMobile || matchesGrade;
      }

      return true;
    });
  }, [contacts, selectedGrade, searchQuery]);

  // Grade counts for quick pills
  const gradeCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: contacts.length,
      unassigned: 0
    };
    STUDENT_GRADES.forEach((g) => {
      counts[g] = 0;
    });

    contacts.forEach((c) => {
      if (!c.student_grade || c.student_grade.trim() === '') {
        counts.unassigned = (counts.unassigned || 0) + 1;
      } else if (counts[c.student_grade] !== undefined) {
        counts[c.student_grade] += 1;
      }
    });

    return counts;
  }, [contacts]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const handleUpdateGrade = async () => {
    if (!editingContact) return;
    setIsSavingGrade(true);
    try {
      const updated = await AdminService.updateContact(editingContact.id, {
        student_grade: newGradeValue || undefined
      });
      setContacts((prev) =>
        prev.map((c) =>
          c.id === editingContact.id ? { ...c, student_grade: newGradeValue || null } : c
        )
      );
      toast.success('Student grade updated successfully!');
      setEditingContact(null);
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error('Failed to update student grade');
    } finally {
      setIsSavingGrade(false);
    }
  };

  const exportCSV = () => {
    if (filteredContacts.length === 0) {
      toast.error('No contacts to export');
      return;
    }

    const headers = ['Name', 'Mobile', 'Student Grade', 'Role', 'Total Chats', 'Total Enquiries', 'Registered Date'];
    const rows = filteredContacts.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.mobile}"`,
      `"${c.student_grade || 'Unassigned'}"`,
      `"${c.role}"`,
      c.total_chats || 0,
      c.total_enquiries || 0,
      `"${format(new Date(c.created_at), 'yyyy-MM-dd HH:mm')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `his_omega_contacts_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Contacts exported to CSV');
  };

  return (
    <div className='space-y-6'>
      {/* Overview Stat Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Total Contacts
            </p>
            <p className='text-2xl font-bold text-gray-900 mt-1.5'>
              {contacts.length}
            </p>
            <span className='text-xs text-blue-600 font-medium inline-flex items-center gap-1 mt-1'>
              Registered parents & leads
            </span>
          </div>
          <div className='w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center'>
            <Users className='w-6 h-6' />
          </div>
        </div>

        <div className='bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Graded Students
            </p>
            <p className='text-2xl font-bold text-emerald-600 mt-1.5'>
              {contacts.length - (gradeCounts.unassigned || 0)}
            </p>
            <span className='text-xs text-gray-500 mt-1 block'>
              {gradeCounts.unassigned || 0} unassigned
            </span>
          </div>
          <div className='w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center'>
            <GraduationCap className='w-6 h-6' />
          </div>
        </div>

        <div className='bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Total Inquiries
            </p>
            <p className='text-2xl font-bold text-purple-600 mt-1.5'>
              {contacts.reduce((acc, c) => acc + (c.total_enquiries || 0), 0)}
            </p>
            <span className='text-xs text-gray-500 mt-1 block'>
              Direct support tickets
            </span>
          </div>
          <div className='w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center'>
            <MessageSquare className='w-6 h-6' />
          </div>
        </div>

        <div className='bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center justify-between'>
          <div>
            <p className='text-xs font-medium text-gray-500 uppercase tracking-wider'>
              Chat Sessions
            </p>
            <p className='text-2xl font-bold text-amber-600 mt-1.5'>
              {contacts.reduce((acc, c) => acc + (c.total_chats || 0), 0)}
            </p>
            <span className='text-xs text-gray-500 mt-1 block'>
              Interactive bot discussions
            </span>
          </div>
          <div className='w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center'>
            <MessageCircle className='w-6 h-6' />
          </div>
        </div>
      </div>

      {/* Grade Quick Filter Chips */}
      <div className='bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Filter size={16} className='text-gray-500' />
            <h3 className='text-xs font-semibold text-gray-700 uppercase tracking-wider'>
              Filter by Student Grade Stream
            </h3>
          </div>
          <button
            onClick={() => {
              setSelectedGrade('all');
              setSearchQuery('');
              setCurrentPage(1);
            }}
            className='text-xs text-blue-600 hover:text-blue-800 font-medium'
          >
            Reset Filters
          </button>
        </div>

        <div className='flex flex-wrap gap-2 pt-1'>
          <button
            type='button'
            onClick={() => {
              setSelectedGrade('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              selectedGrade === 'all'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            All Grades
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedGrade === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {gradeCounts.all}
            </span>
          </button>

          {STUDENT_GRADES.map((grade) => {
            const count = gradeCounts[grade] || 0;
            const isSelected = selectedGrade === grade;
            const style = getGradeBadgeStyle(grade);

            return (
              <button
                key={grade}
                type='button'
                onClick={() => {
                  setSelectedGrade(grade);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : `${style.bg} ${style.text} ${style.border} hover:opacity-85`
                }`}
              >
                <span>{grade}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-white/80 border border-black/5 text-gray-800'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <button
            type='button'
            onClick={() => {
              setSelectedGrade('unassigned');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              selectedGrade === 'unassigned'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Unassigned
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedGrade === 'unassigned'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-600'
              }`}
            >
              {gradeCounts.unassigned || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className='bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4'>
        <div className='relative w-full sm:max-w-md'>
          <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4' />
          <input
            type='text'
            placeholder='Search by student name, mobile, or grade...'
            className='w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
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

        <div className='flex items-center gap-2 w-full sm:w-auto justify-end'>
          <button
            onClick={() => loadContacts()}
            className='flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors'
            title='Refresh contact list'
          >
            <RefreshCw size={14} />
            Refresh
          </button>

          <button
            onClick={exportCSV}
            className='flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-xs'
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Contact Table */}
      <div className='bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden'>
        <div className='overflow-x-auto'>
          <table className='w-full text-left'>
            <thead>
              <tr className='bg-gray-50/75 border-b border-gray-100'>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Student / Contact
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Mobile Number
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Student Grade
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Interactions
                </th>
                <th className='px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider'>
                  Date Added
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
                    <Loader2 className='w-7 h-7 animate-spin mx-auto text-blue-500 mb-2' />
                    <p className='text-sm text-gray-500'>Loading contact details...</p>
                  </td>
                </tr>
              ) : paginatedContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className='py-12 text-center'>
                    <Users className='w-10 h-10 mx-auto text-gray-300 mb-2' />
                    <p className='text-sm font-semibold text-gray-700'>No contacts found</p>
                    <p className='text-xs text-gray-500 mt-1'>
                      Try clearing your search query or selecting a different grade filter
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedContacts.map((contact) => {
                  const gradeStyle = getGradeBadgeStyle(contact.student_grade);

                  return (
                    <tr
                      key={contact.id}
                      className='hover:bg-gray-50/70 transition-colors group'
                    >
                      {/* Name with Avatar */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-3'>
                          <div className='w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs'>
                            {contact.name.slice(0, 2)}
                          </div>
                          <div>
                            <span className='font-semibold text-sm text-gray-900 block'>
                              {contact.name}
                            </span>
                            <span className='text-[11px] text-gray-400 capitalize'>
                              Role: {contact.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Mobile */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm font-mono text-gray-800 font-medium'>
                            {contact.mobile}
                          </span>
                          <a
                            href={`https://wa.me/91${contact.mobile.replace(/\D/g, '')}`}
                            target='_blank'
                            rel='noopener noreferrer'
                            title='Chat on WhatsApp'
                            className='w-6 h-6 rounded-md bg-green-50 text-green-600 hover:bg-green-100 flex items-center justify-center transition-colors'
                          >
                            <ExternalLink size={12} />
                          </a>
                          <a
                            href={`tel:${contact.mobile}`}
                            title='Call contact'
                            className='w-6 h-6 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors'
                          >
                            <PhoneCall size={12} />
                          </a>
                        </div>
                      </td>

                      {/* Grade Badge */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${gradeStyle.bg} ${gradeStyle.text} ${gradeStyle.border}`}
                          >
                            <GraduationCap size={13} />
                            {contact.student_grade || 'Unassigned'}
                          </span>
                          <button
                            type='button'
                            onClick={() => {
                              setEditingContact(contact);
                              setNewGradeValue(contact.student_grade || '');
                            }}
                            className='opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity'
                            title='Change Grade'
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Interactions */}
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center gap-2'>
                          <span
                            className='inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-medium'
                            title='Total Chat Sessions'
                          >
                            <MessageCircle size={12} />
                            {contact.total_chats || 0} chats
                          </span>
                          <span
                            className='inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-medium'
                            title='Total Enquiries'
                          >
                            <MessageSquare size={12} />
                            {contact.total_enquiries || 0} enq
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className='px-6 py-4 whitespace-nowrap text-xs text-gray-500'>
                        <div className='flex items-center gap-1.5'>
                          <Calendar size={13} className='text-gray-400' />
                          {format(new Date(contact.created_at), 'MMM d, yyyy')}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className='px-6 py-4 whitespace-nowrap text-right'>
                        <button
                          type='button'
                          onClick={() => setSelectedDetailContact(contact)}
                          className='text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1'
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

        {/* Pagination Bar */}
        <div className='bg-white px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600'>
          <div className='flex items-center gap-2'>
            <span>Rows per page:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className='border border-gray-200 rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none'
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className='flex items-center gap-3'>
            <span>
              Showing {filteredContacts.length > 0 ? startIndex + 1 : 0}-
              {Math.min(endIndex, filteredContacts.length)} of{' '}
              {filteredContacts.length}
            </span>

            <div className='flex items-center gap-1'>
              <button
                type='button'
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className='px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold'
              >
                &larr; Prev
              </button>
              <button
                type='button'
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className='px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold'
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Grade Modal */}
      {editingContact && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in'>
          <div className='bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-scale-in'>
            <div className='flex items-center justify-between mb-4 pb-3 border-b border-gray-100'>
              <div className='flex items-center gap-2'>
                <GraduationCap className='w-5 h-5 text-blue-600' />
                <h3 className='font-bold text-base text-gray-900'>
                  Update Student Grade
                </h3>
              </div>
              <button
                onClick={() => setEditingContact(null)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X size={18} />
              </button>
            </div>

            <div className='space-y-4'>
              <div>
                <p className='text-xs text-gray-500'>Contact Name</p>
                <p className='text-sm font-semibold text-gray-900'>
                  {editingContact.name} ({editingContact.mobile})
                </p>
              </div>

              <div>
                <label className='block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2'>
                  Select Student Grade
                </label>
                <select
                  value={newGradeValue}
                  onChange={(e) => setNewGradeValue(e.target.value)}
                  className='w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white'
                >
                  <option value=''>Unassigned / Not Specified</option>
                  {STUDENT_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex justify-end gap-2 pt-4 border-t border-gray-100'>
                <button
                  type='button'
                  onClick={() => setEditingContact(null)}
                  className='px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors'
                  disabled={isSavingGrade}
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={handleUpdateGrade}
                  disabled={isSavingGrade}
                  className='px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-1.5'
                >
                  {isSavingGrade ? (
                    <>
                      <Loader2 size={14} className='animate-spin' />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      Save Grade
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedDetailContact && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in'>
          <div className='bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 animate-scale-in max-h-[90vh] overflow-y-auto'>
            <div className='flex items-center justify-between mb-5 pb-3 border-b border-gray-100'>
              <div className='flex items-center gap-3'>
                <div className='w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-bold flex items-center justify-center text-sm'>
                  {selectedDetailContact.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className='font-bold text-base text-gray-900'>
                    {selectedDetailContact.name}
                  </h3>
                  <p className='text-xs text-gray-500'>
                    Contact Profile & Admissions Info
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDetailContact(null)}
                className='text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100'
              >
                <X size={18} />
              </button>
            </div>

            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-3'>
                <div className='p-3 bg-gray-50 rounded-xl border border-gray-100'>
                  <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider block'>
                    Mobile Number
                  </span>
                  <span className='text-sm font-bold text-gray-800 font-mono'>
                    {selectedDetailContact.mobile}
                  </span>
                </div>

                <div className='p-3 bg-gray-50 rounded-xl border border-gray-100'>
                  <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider block'>
                    Student Grade
                  </span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      getGradeBadgeStyle(selectedDetailContact.student_grade).bg
                    } ${
                      getGradeBadgeStyle(selectedDetailContact.student_grade).text
                    } ${
                      getGradeBadgeStyle(selectedDetailContact.student_grade)
                        .border
                    }`}
                  >
                    {selectedDetailContact.student_grade || 'Not Specified'}
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='p-3 bg-gray-50 rounded-xl border border-gray-100'>
                  <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider block'>
                    Chat Sessions
                  </span>
                  <span className='text-sm font-bold text-blue-600'>
                    {selectedDetailContact.total_chats || 0} Sessions
                  </span>
                </div>

                <div className='p-3 bg-gray-50 rounded-xl border border-gray-100'>
                  <span className='text-[11px] font-semibold text-gray-400 uppercase tracking-wider block'>
                    Support Enquiries
                  </span>
                  <span className='text-sm font-bold text-purple-600'>
                    {selectedDetailContact.total_enquiries || 0} Enquiries
                  </span>
                </div>
              </div>

              <div className='p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1 text-xs'>
                <div className='flex justify-between py-1'>
                  <span className='text-gray-500'>First Registered:</span>
                  <span className='font-medium text-gray-800'>
                    {format(
                      new Date(selectedDetailContact.created_at),
                      'PPP p'
                    )}
                  </span>
                </div>
                <div className='flex justify-between py-1'>
                  <span className='text-gray-500'>Last Active:</span>
                  <span className='font-medium text-gray-800'>
                    {format(
                      new Date(
                        selectedDetailContact.last_active ||
                          selectedDetailContact.created_at
                      ),
                      'PPP p'
                    )}
                  </span>
                </div>
                <div className='flex justify-between py-1'>
                  <span className='text-gray-500'>System ID:</span>
                  <span className='font-mono text-gray-600 text-[11px]'>
                    {selectedDetailContact.id}
                  </span>
                </div>
              </div>

              {/* Outreach actions */}
              <div className='flex items-center gap-2 pt-2'>
                <a
                  href={`https://wa.me/91${selectedDetailContact.mobile.replace(
                    /\D/g,
                    ''
                  )}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='flex-1 py-2.5 px-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs'
                >
                  <ExternalLink size={14} /> Message on WhatsApp
                </a>
                <a
                  href={`tel:${selectedDetailContact.mobile}`}
                  className='flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs'
                >
                  <PhoneCall size={14} /> Call Contact
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
