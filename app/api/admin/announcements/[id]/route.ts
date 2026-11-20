import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const allowedFields = ['title', 'description', 'image_url', 'link', 'status'];
    const setClauses: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true });
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(
      `
      UPDATE announcements 
      SET ${setClauses.join(', ')} 
      WHERE id = ?;
      `,
      values
    );

    return NextResponse.json({ success: true, message: 'Announcement updated' });
  } catch (error: any) {
    console.error('Error updating announcement in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query(`DELETE FROM announcements WHERE id = ?;`, [id]);
    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (error: any) {
    console.error('Error deleting announcement from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}
