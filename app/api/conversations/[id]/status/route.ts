import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    if (!status || !['resolved', 'active', 'pending'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status required: resolved, active, or pending' },
        { status: 400 }
      );
    }

    // 1. Update in enquiries table
    try {
      await query(
        `
        UPDATE enquiries 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?;
        `,
        [status, id]
      );
    } catch (e) {
      console.error('Error updating enquiry status in MySQL:', e);
    }

    // 2. Update in chat_histories table
    try {
      await query(
        `
        UPDATE chat_histories 
        SET current_flow = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?;
        `,
        [status, id]
      );
    } catch (e) {
      console.error('Error updating chat_histories in MySQL:', e);
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error: unknown) {
    console.error('Error updating conversation status:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update conversation status'
      },
      { status: 500 }
    );
  }
}
