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

    const chats = await query<any[]>(
      `
      SELECT id, user_id, title, current_flow, created_at, updated_at
      FROM chat_histories
      WHERE user_id = ?
      ORDER BY updated_at DESC;
      `,
      [userId]
    );

    const historyWithMessages = await Promise.all(
      (chats || []).map(async (chat) => {
        const msgs = await query<any[]>(
          `
          SELECT content, created_at
          FROM messages
          WHERE chat_id = ?
          ORDER BY created_at DESC
          LIMIT 1;
          `,
          [chat.id]
        );

        return {
          id: String(chat.id),
          title: chat.title || 'New Chat',
          timestamp: new Date(chat.created_at).toLocaleString(),
          lastMessage: msgs?.[0]?.content,
          currentFlow: chat.current_flow || 'start'
        };
      })
    );

    return NextResponse.json(historyWithMessages);
  } catch (error: any) {
    console.error('Error fetching chat history from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const id = randomUUID();
    await query(
      `
      INSERT INTO chat_histories (id, user_id, title, current_flow, created_at, updated_at)
      VALUES (?, ?, 'New Chat', 'start', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [id, userId]
    );

    const created = await query<any[]>(
      `SELECT id, user_id, title, current_flow, created_at, updated_at FROM chat_histories WHERE id = ?;`,
      [id]
    );

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Error creating chat in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chat' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { chatId, title } = await req.json();
    if (!chatId || !title) {
      return NextResponse.json({ error: 'chatId and title are required' }, { status: 400 });
    }

    await query(
      `UPDATE chat_histories SET title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;`,
      [title, chatId]
    );

    const updated = await query<any[]>(
      `SELECT id, user_id, title, current_flow, created_at, updated_at FROM chat_histories WHERE id = ?;`,
      [chatId]
    );

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating chat title in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chat title' },
      { status: 500 }
    );
  }
}
