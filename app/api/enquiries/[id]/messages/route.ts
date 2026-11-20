import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

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
    const { content, sender_type = 'user' } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
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
