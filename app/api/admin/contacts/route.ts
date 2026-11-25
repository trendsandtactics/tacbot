import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

interface UserContactRow {
  id: string;
  name: string;
  mobile: string;
  student_grade: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  total_chats: number;
  total_enquiries: number;
  last_active: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get('grade');
    const search = searchParams.get('search');

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.mobile,
        u.student_grade,
        u.role,
        u.created_at,
        u.updated_at,
        (SELECT COUNT(*) FROM chat_histories ch WHERE ch.user_id = u.id) AS total_chats,
        (SELECT COUNT(*) FROM enquiries e WHERE e.user_id = u.id) AS total_enquiries,
        GREATEST(
          u.created_at,
          COALESCE((SELECT MAX(ch.updated_at) FROM chat_histories ch WHERE ch.user_id = u.id), u.created_at),
          COALESCE((SELECT MAX(e.updated_at) FROM enquiries e WHERE e.user_id = u.id), u.created_at)
        ) AS last_active
      FROM users u
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (grade && grade !== 'all') {
      if (grade === 'unassigned') {
        sql += ` AND (u.student_grade IS NULL OR u.student_grade = '')`;
      } else {
        sql += ` AND u.student_grade = ?`;
        params.push(grade);
      }
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ` AND (u.name LIKE ? OR u.mobile LIKE ? OR u.student_grade LIKE ?)`;
      params.push(term, term, term);
    }

    sql += ` ORDER BY u.created_at DESC;`;

    const rows = await query<UserContactRow[]>(sql, params);

    const contacts = (rows || []).map((row) => ({
      id: String(row.id),
      name: row.name || 'Unknown',
      mobile: row.mobile || '',
      student_grade: row.student_grade || null,
      role: row.role || 'user',
      created_at: row.created_at,
      updated_at: row.updated_at,
      total_chats: Number(row.total_chats || 0),
      total_enquiries: Number(row.total_enquiries || 0),
      last_active: row.last_active || row.created_at
    }));

    return NextResponse.json(contacts);
  } catch (error: unknown) {
    console.error('Error fetching admin contacts:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to fetch contact details'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, student_grade, name, mobile } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Contact ID is required' },
        { status: 400 }
      );
    }

    const updates: string[] = [];
    const params: (string | null)[] = [];

    if (student_grade !== undefined) {
      updates.push('student_grade = ?');
      params.push(student_grade ? String(student_grade).trim() : null);
    }

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(String(name).trim());
    }

    if (mobile !== undefined) {
      updates.push('mobile = ?');
      params.push(String(mobile).trim());
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields provided to update' },
        { status: 400 }
      );
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?;`,
      params
    );

    const updated = await query<UserContactRow[]>(
      `SELECT id, name, mobile, student_grade, role, created_at, updated_at FROM users WHERE id = ?;`,
      [id]
    );

    return NextResponse.json(updated[0]);
  } catch (error: unknown) {
    console.error('Error updating admin contact:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update contact'
      },
      { status: 500 }
    );
  }
}
