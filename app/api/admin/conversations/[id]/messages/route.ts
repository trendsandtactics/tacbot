import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

interface MessageRow {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let messages = await query<MessageRow[]>(
      `
      SELECT id, chat_id, content, role, created_at
      FROM messages
      WHERE chat_id = ?
      ORDER BY created_at ASC;
      `,
      [id]
    );

    // If not found in messages, check enquiry_messages
    if (!messages || messages.length === 0) {
      const enquiryMsgs = await query<MessageRow[]>(
        `
        SELECT id, enquiry_id AS chat_id, content,
               CASE WHEN sender_type = 'user' THEN 'user' ELSE 'assistant' END AS role,
               created_at
        FROM enquiry_messages
        WHERE enquiry_id = ?
        ORDER BY created_at ASC;
        `,
        [id]
      );
      if (enquiryMsgs && enquiryMsgs.length > 0) {
        messages = enquiryMsgs;
      }
    }

    return NextResponse.json(messages || []);
  } catch (error: unknown) {
    console.error('Error fetching conversation messages from MySQL:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch messages'
      },
      { status: 500 }
    );
  }
}
