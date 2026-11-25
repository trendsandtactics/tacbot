import { Suspense } from 'react';
import { ContactsContent } from '@/components/admin/contacts/contacts-content';
import { Loader2 } from 'lucide-react';

export default function AdminContactsPage() {
  return (
    <div className='space-y-6' suppressHydrationWarning>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
            Contact Details
          </h2>
          <p className='text-sm text-gray-500 mt-1'>
            Manage and filter student contacts and admissions leads grade-wise
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className='flex justify-center items-center min-h-[300px]'>
            <Loader2 className='h-8 w-8 animate-spin text-gray-400' />
          </div>
        }
      >
        <ContactsContent />
      </Suspense>
    </div>
  );
}
