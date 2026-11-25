import { Suspense } from 'react';
import { AgentsManagement } from '@/components/admin/agents/agents-management';
import { Loader2 } from 'lucide-react';

export default function AdminAgentsPage() {
  return (
    <div className='space-y-6' suppressHydrationWarning>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2'>
            <span>AI Grade Agents & Gemini Settings</span>
          </h2>
          <p className='text-sm text-gray-500 mt-1'>
            Configure Google Gemini API key, customize chatbot tone, and ground AI agents with curriculum and prospectus text for each grade.
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
        <AgentsManagement />
      </Suspense>
    </div>
  );
}
