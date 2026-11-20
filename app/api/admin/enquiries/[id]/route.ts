import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const enquiries = await query<any[]>(
      `
      SELECT 
        e.id, 
        e.subject, 
        e.status, 
        e.created_at, 
        e.updated_at, 
        e.user_id,
        COALESCE(u.name, 'Unknown User') AS user_name,
        COALESCE(u.mobile, '') AS user_mobile
      FROM enquiries e
      LEFT JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
      LIMIT 1;
      `,
      [id]
    );

    if (!enquiries || enquiries.length === 0) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    const enquiry = enquiries[0];
    const messages = await query<any[]>(
      `
      SELECT id, enquiry_id, content, sender_type, created_at
      FROM enquiry_messages
      WHERE enquiry_id = ?
      ORDER BY created_at ASC;
      `,
      [id]
    );

    return NextResponse.json({
      id: String(enquiry.id),
      subject: enquiry.subject,
      status: enquiry.status,
      created_at: enquiry.created_at,
      updated_at: enquiry.updated_at,
      users: {
        name: enquiry.user_name,
        mobile: enquiry.user_mobile
      },
      messages: messages || []
    });
  } catch (error: any) {
    console.error('Error fetching enquiry by id from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch enquiry' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await req.json();

    await query(
      `
      UPDATE enquiries 
      SET status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?;
      `,
      [status, id]
    );

    return NextResponse.json({ success: true, message: 'Status updated' });
  } catch (error: any) {
    console.error('Error updating enquiry status in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update status' },
      { status: 500 }
    );
  }
}
