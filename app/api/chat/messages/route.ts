import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

interface Button {
  text: string;
  nextFlow: string;
}

interface ChatFlow {
  id: string;
  message: string;
  buttons: Button[];
}

const chatFlows: Record<string, ChatFlow> = {
  start: {
    id: 'start',
    message: 'Welcome! How can I help you today?',
    buttons: [
      { text: 'Admission Information', nextFlow: 'admission' },
      { text: 'Fee Structure', nextFlow: 'fees' },
      { text: 'Campus Details', nextFlow: 'campus' },
      { text: 'Courses Offered', nextFlow: 'courses' }
    ]
  },
  admission: {
    id: 'admission',
    message: 'What would you like to know about admissions?',
    buttons: [
      { text: 'Application Process', nextFlow: 'application_process' },
      { text: 'Required Documents', nextFlow: 'documents' },
      { text: 'Important Dates', nextFlow: 'admission_dates' },
      { text: 'Back to Main Menu', nextFlow: 'start' }
    ]
  },
  fees: {
    id: 'fees',
    message: 'What fee information are you looking for?',
    buttons: [
      { text: 'Tuition Fees', nextFlow: 'tuition_fees' },
      { text: 'Payment Schedule', nextFlow: 'payment_schedule' },
      { text: 'Scholarships', nextFlow: 'scholarships' },
      { text: 'Back to Main Menu', nextFlow: 'start' }
    ]
  },
  campus: {
    id: 'campus',
    message: 'Here are details about our campus facilities.',
    buttons: [
      { text: 'Hostel Facilities', nextFlow: 'hostel' },
      { text: 'Sports Complex', nextFlow: 'sports' },
      { text: 'Back to Main Menu', nextFlow: 'start' }
    ]
  },
  courses: {
    id: 'courses',
    message: 'We offer a wide range of undergraduate and postgraduate programs.',
    buttons: [
      { text: 'Engineering', nextFlow: 'eng' },
      { text: 'Arts & Science', nextFlow: 'arts' },
      { text: 'Back to Main Menu', nextFlow: 'start' }
    ]
  }
};

function processFlow(content: string, currentFlow: string): ChatFlow {
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('admission')) return chatFlows.admission;
  if (lowerContent.includes('fee')) return chatFlows.fees;
  if (lowerContent.includes('campus')) return chatFlows.campus;
  if (lowerContent.includes('course')) return chatFlows.courses;

  const flow = chatFlows[currentFlow];
  const selectedButton = flow?.buttons?.find(
    (button) => button.text.toLowerCase() === content.toLowerCase()
  );

  if (selectedButton && chatFlows[selectedButton.nextFlow]) {
    return chatFlows[selectedButton.nextFlow];
  }

  return chatFlows[currentFlow] || chatFlows.start;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'chatId is required' }, { status: 400 });
    }

    const messages = await query<Record<string, unknown>[]>(
      `
      SELECT id, chat_id, content, role, created_at
      FROM messages
      WHERE chat_id = ?
      ORDER BY created_at ASC;
      `,
      [chatId]
    );

    return NextResponse.json(messages || []);
  } catch (error: unknown) {
    console.error('Error fetching chat messages from MySQL:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch messages'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, content, botReply, currentFlow = 'start' } = await req.json();

    if (!sessionId || !content) {
      return NextResponse.json(
        { error: 'sessionId and content are required' },
        { status: 400 }
      );
    }

    const userMessageId = randomUUID();
    const aiMessageId = randomUUID();

    // Insert user message
    await query(
      `
      INSERT INTO messages (id, chat_id, content, role, created_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP);
      `,
      [userMessageId, sessionId, content]
    );

    const nextFlow = processFlow(content, currentFlow);
    const assistantContent = botReply || nextFlow.message;

    // Insert AI message
    await query(
      `
      INSERT INTO messages (id, chat_id, content, role, created_at)
      VALUES (?, ?, ?, 'assistant', CURRENT_TIMESTAMP);
      `,
      [aiMessageId, sessionId, assistantContent]
    );

    // Update chat history
    const snippet = content.slice(0, 50) + (content.length > 50 ? '...' : '');
    await query(
      `
      UPDATE chat_histories
      SET title = ?, current_flow = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?;
      `,
      [snippet, nextFlow.id, sessionId]
    );

    const userMsg = {
      id: userMessageId,
      chat_id: sessionId,
      content,
      role: 'user',
      created_at: new Date().toISOString()
    };

    const aiMsg = {
      id: aiMessageId,
      chat_id: sessionId,
      content: assistantContent,
      role: 'assistant',
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      userMessage: userMsg,
      aiMessage: aiMsg,
      nextFlow
    });
  } catch (error: unknown) {
    console.error('Error sending chat message in MySQL:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process message'
      },
      { status: 500 }
    );
  }
}
