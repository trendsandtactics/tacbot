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

    const allowedFields = ['title', 'description', 'content', 'image_url', 'youtube_url', 'active', 'tags'];
    const setClauses: string[] = [];
    const values: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        if (field === 'active') {
          values.push(updates[field] ? 1 : 0);
        } else if (field === 'tags' && Array.isArray(updates[field])) {
          values.push(updates[field].join(','));
        } else {
          values.push(updates[field]);
        }
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: true });
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(
      `
      UPDATE articles 
      SET ${setClauses.join(', ')} 
      WHERE id = ?;
      `,
      values
    );

    return NextResponse.json({ success: true, message: 'Article updated' });
  } catch (error: any) {
    console.error('Error updating article in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update article' },
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
    await query(`DELETE FROM articles WHERE id = ?;`, [id]);
    return NextResponse.json({ success: true, message: 'Article deleted' });
  } catch (error: any) {
    console.error('Error deleting article from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete article' },
      { status: 500 }
    );
  }
}
