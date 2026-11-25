import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';
import { ensureUserExists } from '@/lib/db/user-helper';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const messages = await query<any[]>(
      `
      SELECT id, enquiry_id, content, sender_type, created_at
      FROM enquiry_messages
      WHERE enquiry_id = ?
      ORDER BY created_at ASC;
      `,
      [id]
    );

    return NextResponse.json(messages || []);
  } catch (error: any) {
    console.error('Error fetching enquiry messages from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { content, sender_type = 'user', userId } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Ensure parent enquiries row exists to satisfy fk_enquiry_messages_enquiry
    const existingEnquiry = await query<any[]>(
      'SELECT id, user_id FROM enquiries WHERE id = ? LIMIT 1;',
      [id]
    );

    if (!existingEnquiry || existingEnquiry.length === 0) {
      const targetUserId = await ensureUserExists(userId);
      await query(
        `INSERT INTO enquiries (id, user_id, subject, status, created_at, updated_at)
         VALUES (?, ?, 'Chat with AI Assistant', 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`,
        [id, targetUserId]
      );
    }

    const messageId = randomUUID();

    await query(
      `
      INSERT INTO enquiry_messages (id, enquiry_id, content, sender_type, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
      `,
      [messageId, id, content.trim(), sender_type]
    );

    // If sender is user, update enquiry status to pending
    const newStatus = sender_type === 'user' ? 'pending' : 'resolved';
    await query(
      `
      UPDATE enquiries 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?;
      `,
      [newStatus, id]
    );

    const created = await query<any[]>(
      `SELECT id, enquiry_id, content, sender_type, created_at FROM enquiry_messages WHERE id = ?;`,
      [messageId]
    );

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Error sending enquiry message to MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
