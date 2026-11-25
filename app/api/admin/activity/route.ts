import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const recentChats = await query<Record<string, unknown>[]>(`
      SELECT 
        ch.id, 
        ch.created_at, 
        COALESCE(u.name, 'Unknown User') AS user_name
      FROM chat_histories ch
      LEFT JOIN users u ON ch.user_id = u.id
      ORDER BY ch.created_at DESC
      LIMIT 5;
    `);

    const recentEnquiries = await query<Record<string, unknown>[]>(`
      SELECT 
        e.id, 
        e.subject, 
        e.status, 
        e.created_at, 
        COALESCE(u.name, 'Unknown User') AS user_name
      FROM enquiries e
      LEFT JOIN users u ON e.user_id = u.id
      ORDER BY e.created_at DESC
      LIMIT 5;
    `);

    return NextResponse.json({
      recentChats: (recentChats || []).map((chat) => ({
        id: String(chat.id),
        created_at: chat.created_at,
        users: {
          name: chat.user_name || 'Unknown User'
        }
      })),
      recentEnquiries: (recentEnquiries || []).map((enquiry) => ({
        id: String(enquiry.id),
        subject: enquiry.subject,
        status: enquiry.status,
        created_at: enquiry.created_at,
        users: {
          name: enquiry.user_name || 'Unknown User'
        }
      }))
    });
  } catch (error: unknown) {
    console.error('Error fetching recent activity from MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch recent activity' },
      { status: 500 }
    );
  }
}
