import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

interface DbUserRow {
  id: string;
  name: string;
  mobile: string;
  student_grade: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export async function POST(req: NextRequest) {
  try {
    const { name, mobile, student_grade } = await req.json();

    if (!mobile || !name) {
      return NextResponse.json(
        { error: 'Name and mobile number are required' },
        { status: 400 }
      );
    }

    const cleanMobile = String(mobile).trim();
    const cleanName = String(name).trim();
    const cleanGrade =
      typeof student_grade === 'string' && student_grade.trim()
        ? student_grade.trim()
        : null;

    // Check if user already exists
    const existing = await query<DbUserRow[]>(
      `SELECT id, name, mobile, student_grade, role, created_at, updated_at FROM users WHERE mobile = ? LIMIT 1;`,
      [cleanMobile]
    );

    if (existing && existing.length > 0) {
      const updates: string[] = [];
      const params: (string | null)[] = [];

      if (cleanName) {
        updates.push('name = ?');
        params.push(cleanName);
      }

      if (cleanGrade) {
        updates.push('student_grade = ?');
        params.push(cleanGrade);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(existing[0].id);

        await query(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?;`,
          params
        );
      }

      const updated = await query<DbUserRow[]>(
        `SELECT id, name, mobile, student_grade, role, created_at, updated_at FROM users WHERE id = ?;`,
        [existing[0].id]
      );
      return NextResponse.json(updated[0]);
    }

    // Create new user
    const id = randomUUID();
    await query(
      `
      INSERT INTO users (id, name, mobile, student_grade, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `,
      [id, cleanName, cleanMobile, cleanGrade]
    );

    const created = await query<DbUserRow[]>(
      `SELECT id, name, mobile, student_grade, role, created_at, updated_at FROM users WHERE id = ?;`,
      [id]
    );

    return NextResponse.json(created[0]);
  } catch (error: unknown) {
    console.error('Error creating/finding user in MySQL:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to process user registration'
      },
      { status: 500 }
    );
  }
}
