import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, mobile } = await req.json();

    if (!mobile || !name) {
      return NextResponse.json(
        { error: 'Name and mobile number are required' },
        { status: 400 }
      );
    }

    const cleanMobile = mobile.trim();
    const cleanName = name.trim();

    // Check if user already exists
    const existing = await query<any[]>(
      `SELECT id, name, mobile, role, created_at, updated_at FROM users WHERE mobile = ? LIMIT 1;`,
      [cleanMobile]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    // Create new user
    const id = randomUUID();
    await query(
      `
      INSERT INTO users (id, name, mobile, role, created_at, updated_at)
      VALUES (?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [id, cleanName, cleanMobile]
    );

    const created = await query<any[]>(
      `SELECT id, name, mobile, role, created_at, updated_at FROM users WHERE id = ?;`,
      [id]
    );

    return NextResponse.json(created[0]);
  } catch (error: any) {
    console.error('Error creating/finding user in MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process user registration' },
      { status: 500 }
    );
  }
}
