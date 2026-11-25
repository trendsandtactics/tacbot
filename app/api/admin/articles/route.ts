import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const articles = await query<Array<{
      id: string;
      title: string;
      description: string | null;
      content: string;
      image_url: string | null;
      youtube_url: string | null;
      active: number | boolean;
      tags: string | string[] | null;
      created_at: string;
      updated_at: string;
    }>>(`
      SELECT id, title, description, content, image_url, youtube_url, active, tags, created_at, updated_at
      FROM articles
      ORDER BY created_at DESC;
    `);

    const formatted = (articles || []).map((art) => ({
      ...art,
      active: Boolean(art.active),
      tags: art.tags ? (typeof art.tags === 'string' ? art.tags.split(',') : art.tags) : []
    }));

    return NextResponse.json(formatted);
  } catch (error: unknown) {
    console.error('Error fetching articles from MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch articles' },
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
    const content = data.content || '';
    const image_url = data.image_url || null;
    const youtube_url = data.youtube_url || null;
    const active = data.active !== undefined ? (data.active ? 1 : 0) : 1;
    const tags = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || null);

    await query(
      `
      INSERT INTO articles (id, title, description, content, image_url, youtube_url, active, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [id, title, description, content, image_url, youtube_url, active, tags]
    );

    const rows = await query<Array<{
      id: string;
      title: string;
      description: string | null;
      content: string;
      image_url: string | null;
      youtube_url: string | null;
      active: number | boolean;
      tags: string | null;
      created_at: string;
      updated_at: string;
    }>>(
      `SELECT id, title, description, content, image_url, youtube_url, active, tags, created_at, updated_at FROM articles WHERE id = ?;`,
      [id]
    );

    const art = rows[0];
    return NextResponse.json({
      ...art,
      active: Boolean(art.active),
      tags: art.tags ? art.tags.split(',') : []
    });
  } catch (error: unknown) {
    console.error('Error creating article in MySQL:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create article' },
      { status: 500 }
    );
  }
}
