import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const enquiries = await query<any[]>(
      `
      SELECT id, user_id, subject, status, created_at, updated_at
      FROM enquiries
      WHERE user_id = ?
      ORDER BY updated_at DESC;
      `,
      [userId]
    );

    const listWithMessages = await Promise.all(
      (enquiries || []).map(async (enquiry) => {
        const lastMsg = await query<any[]>(
          `
          SELECT id, enquiry_id, content, sender_type, created_at
          FROM enquiry_messages
          WHERE enquiry_id = ?
          ORDER BY created_at DESC
          LIMIT 1;
          `,
          [enquiry.id]
        );

        return {
          ...enquiry,
          id: String(enquiry.id),
          lastMessage: lastMsg[0] || null
        };
      })
    );

    return NextResponse.json(listWithMessages);
  } catch (error: any) {
    console.error('Error fetching user enquiries from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, subject, message } = await req.json();

    if (!userId || !subject || !message) {
      return NextResponse.json(
        { error: 'userId, subject, and message are required' },
        { status: 400 }
      );
    }

    const enquiryId = randomUUID();
    const messageId = randomUUID();

    // Insert enquiry
    await query(
      `
      INSERT INTO enquiries (id, user_id, subject, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [enquiryId, userId, subject.trim()]
    );

    // Insert initial message
    await query(
      `
      INSERT INTO enquiry_messages (id, enquiry_id, content, sender_type, created_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP);
      `,
      [messageId, enquiryId, message.trim()]
    );

    const created = await query<any[]>(
      `SELECT id, user_id, subject, status, created_at, updated_at FROM enquiries WHERE id = ?;`,
      [enquiryId]
    );

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Error creating enquiry in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create enquiry' },
      { status: 500 }
    );
  }
}
