import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';
import { ensureUserExists } from '@/lib/db/user-helper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const enquiries = await query<Record<string, unknown>[]>(
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
        const lastMsg = await query<Record<string, unknown>[]>(
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
  } catch (error: unknown) {
    console.error('Error fetching user enquiries from MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, subject = 'Chat with AI Assistant', message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Ensure valid user exists to satisfy foreign key fk_enquiries_user
    const validUserId = await ensureUserExists(userId);

    const enquiryId = randomUUID();
    const messageId = randomUUID();

    // Insert enquiry
    await query(
      `
      INSERT INTO enquiries (id, user_id, subject, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [enquiryId, validUserId, (subject || 'Chat with AI Assistant').trim()]
    );

    // Insert initial message
    await query(
      `
      INSERT INTO enquiry_messages (id, enquiry_id, content, sender_type, created_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP);
      `,
      [messageId, enquiryId, message.trim()]
    );

    const created = await query<Record<string, unknown>[]>(
      `SELECT id, user_id, subject, status, created_at, updated_at FROM enquiries WHERE id = ?;`,
      [enquiryId]
    );

    return NextResponse.json(created[0]);
  } catch (error: unknown) {
    console.error('Error creating enquiry in MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create enquiry' },
      { status: 500 }
    );
  }
}
