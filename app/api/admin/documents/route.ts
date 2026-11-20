import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const docs = await query<any[]>(`
      SELECT id, title, content, url, created_at
      FROM documents
      ORDER BY created_at DESC;
    `);

    const formatted = (docs || []).map((d) => ({
      id: String(d.id),
      content: d.content || '',
      created_at: d.created_at,
      updated_at: d.created_at,
      metadata: {
        title: d.title || 'Processed Webpage',
        source_url: d.url || ''
      }
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('Error fetching documents from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const id = randomUUID();
    const title = data.title || data.metadata?.title || 'Web Document';
    const content = data.content || '';
    const url = data.url || data.metadata?.source_url || '';

    await query(
      `
      INSERT INTO documents (id, title, content, url, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
      `,
      [id, title, content, url]
    );

    return NextResponse.json({ id, title, content, url });
  } catch (error: any) {
    console.error('Error creating document in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save document' },
      { status: 500 }
    );
  }
}
