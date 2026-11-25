import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const announcements = await query<Record<string, unknown>[]>(`
      SELECT id, title, description, image_url, link, status, created_at, updated_at
      FROM announcements
      ORDER BY created_at DESC;
    `);

    return NextResponse.json(announcements || []);
  } catch (error: unknown) {
    console.error('Error fetching announcements from MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = randomUUID();
    const title = data.title || '';
    const description = data.description || '';
    const image_url = data.image_url || null;
    const link = data.link || null;
    const status = data.status || 'draft';

    await query(
      `
      INSERT INTO announcements (id, title, description, image_url, link, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [id, title, description, image_url, link, status]
    );

    const rows = await query<Record<string, unknown>[]>(
      `SELECT id, title, description, image_url, link, status, created_at, updated_at FROM announcements WHERE id = ?;`,
      [id]
    );

    return NextResponse.json(rows[0]);
  } catch (error: unknown) {
    console.error('Error creating announcement in MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create announcement' },
      { status: 500 }
    );
  }
}
