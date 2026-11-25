import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

interface ConversationRow {
  id: string;
  updated_at: string;
  user_name: string;
  user_mobile?: string;
  user_student_grade?: string;
  lastMessage: string;
  status: 'pending' | 'active' | 'resolved';
}

export async function GET() {
  try {
    const rows = await query<ConversationRow[]>(`
      SELECT * FROM (
        SELECT 
          ch.id, 
          ch.updated_at, 
          COALESCE(u.name, 'Unknown User') AS user_name,
          COALESCE(u.mobile, '') AS user_mobile,
          COALESCE(u.student_grade, '') AS user_student_grade,
          (
            SELECT m.content 
            FROM messages m 
            WHERE m.chat_id = ch.id 
            ORDER BY m.created_at DESC 
            LIMIT 1
          ) AS lastMessage,
          COALESCE(
            (SELECT status FROM enquiries WHERE id = ch.id LIMIT 1),
            CASE 
              WHEN ch.current_flow IN ('resolved', 'active', 'pending') THEN ch.current_flow
              ELSE 'active'
            END
          ) AS status
        FROM chat_histories ch
        LEFT JOIN users u ON ch.user_id = u.id

        UNION ALL

        SELECT 
          e.id, 
          e.updated_at, 
          COALESCE(u.name, 'Unknown User') AS user_name,
          COALESCE(u.mobile, '') AS user_mobile,
          COALESCE(u.student_grade, '') AS user_student_grade,
          (
            SELECT em.content 
            FROM enquiry_messages em 
            WHERE em.enquiry_id = e.id 
            ORDER BY em.created_at DESC 
            LIMIT 1
          ) AS lastMessage,
          COALESCE(e.status, 'pending') AS status
        FROM enquiries e
        LEFT JOIN users u ON e.user_id = u.id
        WHERE e.id NOT IN (SELECT id FROM chat_histories)
      ) AS combined
      ORDER BY updated_at DESC;
    `);

    const conversations = (rows || []).map((chat) => ({
      id: String(chat.id),
      users: {
        name: chat.user_name || 'Unknown User',
        mobile: chat.user_mobile || '',
        student_grade: chat.user_student_grade || ''
      },
      lastMessage: chat.lastMessage || '',
      updated_at: chat.updated_at,
      status: (['resolved', 'active', 'pending'].includes(chat.status)
        ? chat.status
        : 'active') as 'resolved' | 'active' | 'pending'
    }));

    return NextResponse.json(conversations);
  } catch (error: unknown) {
    console.error('Error fetching conversations from MySQL:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversations'
      },
      { status: 500 }
    );
  }
}
