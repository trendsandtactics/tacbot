import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const enquiries = await query<any[]>(`
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
      ORDER BY e.updated_at DESC;
    `);

    // Fetch messages for each enquiry
    const enquiryList = await Promise.all(
      (enquiries || []).map(async (enquiry) => {
        const messages = await query<any[]>(
          `
          SELECT id, enquiry_id, content, sender_type, created_at
          FROM enquiry_messages
          WHERE enquiry_id = ?
          ORDER BY created_at ASC;
          `,
          [enquiry.id]
        );

        return {
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
        };
      })
    );

    return NextResponse.json(enquiryList);
  } catch (error: any) {
    console.error('Error fetching admin enquiries from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch enquiries' },
      { status: 500 }
    );
  }
}
