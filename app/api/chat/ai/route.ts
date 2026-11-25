import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';
import { GeminiService } from '@/lib/services/gemini-service';
import { ensureUserExists } from '@/lib/db/user-helper';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      message,
      studentGrade,
      history = [],
      persist = false
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    const cleanUserText = String(message).trim();

    // 1. Generate grounded response using Gemini
    const { reply, agentName, studentGrade: resolvedGrade } =
      await GeminiService.generateAnswer({
        studentGrade,
        userQuery: cleanUserText,
        history
      });

    // 2. Persist to MySQL messages table if sessionId is provided and persist is true
    if (persist && sessionId) {
      try {
        // Ensure chat_histories row exists to prevent fk_messages_chat constraint failure
        const existingChat = await query<any[]>(
          'SELECT id FROM chat_histories WHERE id = ? LIMIT 1;',
          [sessionId]
        );
        if (!existingChat || existingChat.length === 0) {
          const validUserId = await ensureUserExists();
          await query(
            `INSERT INTO chat_histories (id, user_id, title, current_flow, created_at, updated_at)
             VALUES (?, ?, 'New Chat', 'start', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
             ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`,
            [sessionId, validUserId]
          );
        }

        const userMsgId = randomUUID();
        const aiMsgId = randomUUID();

        // Strip transfer-button tag from stored content for clean history
        const cleanBotText = reply
          .replace(/\n\ntransfer-button/g, '')
          .replace(/transfer-button/g, '')
          .trim();

        await query(
          `INSERT INTO messages (id, chat_id, content, role, created_at)
           VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP);`,
          [userMsgId, sessionId, cleanUserText]
        );

        await query(
          `INSERT INTO messages (id, chat_id, content, role, created_at)
           VALUES (?, ?, ?, 'assistant', CURRENT_TIMESTAMP);`,
          [aiMsgId, sessionId, cleanBotText]
        );

        // Update chat_histories timestamp and title if default
        await query(
          `UPDATE chat_histories 
           SET updated_at = CURRENT_TIMESTAMP,
               title = CASE WHEN title = 'New Chat' THEN ? ELSE title END
           WHERE id = ?;`,
          [
            cleanUserText.length > 40
              ? `${cleanUserText.substring(0, 37)}...`
              : cleanUserText,
            sessionId
          ]
        );
      } catch (dbErr) {
        console.warn('Could not persist messages to MySQL:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      reply,
      agentName,
      studentGrade: resolvedGrade
    });
  } catch (error: unknown) {
    console.error('Error in chat/ai route:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to process AI chat message'
      },
      { status: 500 }
    );
  }
}
