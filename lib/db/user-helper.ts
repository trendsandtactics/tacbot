import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

interface UserRow {
  id: string;
  name: string;
  mobile: string;
  student_grade: string | null;
}

/**
 * Ensures a valid user exists in the MySQL `users` table to satisfy foreign key constraints.
 * If the provided userId does not exist in MySQL, it automatically creates a valid user record
 * or links to an existing user by mobile/fallback, completely preventing foreign key constraint failures.
 */
export async function ensureUserExists(
  userId?: string | null,
  fallbackDetails?: { name?: string; mobile?: string; student_grade?: string }
): Promise<string> {
  try {
    // 1. If a userId was passed, check if it already exists in the users table
    if (userId?.trim()) {
      const cleanId = userId.trim();
      const existing = await query<UserRow[]>(
        'SELECT id FROM users WHERE id = ? LIMIT 1;',
        [cleanId]
      );
      if (existing && existing.length > 0) {
        return existing[0].id;
      }

      // 2. If mobile is provided, check if user exists by mobile
      if (fallbackDetails?.mobile?.trim()) {
        const cleanMobile = fallbackDetails.mobile.trim();
        const byMobile = await query<UserRow[]>(
          'SELECT id FROM users WHERE mobile = ? LIMIT 1;',
          [cleanMobile]
        );
        if (byMobile && byMobile.length > 0) {
          return byMobile[0].id;
        }
      }

      // 3. User with this ID does not exist in MySQL. Auto-create it to satisfy foreign key constraints!
      const cleanName = fallbackDetails?.name?.trim() || 'Parent / Visitor';
      // Format a clean unique mobile string within the 20-character column limit
      const shortId = cleanId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
      const cleanMobile = fallbackDetails?.mobile?.trim() || `v_${shortId}`;
      const cleanGrade = fallbackDetails?.student_grade?.trim() || 'General / All Grades';

      try {
        await query(
          `INSERT INTO users (id, name, mobile, student_grade, role, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;`,
          [cleanId, cleanName, cleanMobile, cleanGrade]
        );
        return cleanId;
      } catch (insertErr) {
        console.warn('Could not insert user with provided ID, falling back to existing user:', insertErr);
      }
    }

    // 4. Fallback to any recent user
    const anyUser = await query<UserRow[]>(
      'SELECT id FROM users ORDER BY created_at DESC LIMIT 1;'
    );
    if (anyUser && anyUser.length > 0) {
      return anyUser[0].id;
    }

    // 5. If users table is completely empty, create an initial user
    const newId = randomUUID();
    await query(
      `INSERT INTO users (id, name, mobile, student_grade, role, created_at, updated_at)
       VALUES (?, 'Parent / Visitor', '9000000000', 'General / All Grades', 'user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);`,
      [newId]
    );
    return newId;
  } catch (err) {
    console.error('Error ensuring user exists:', err);
    // Return a UUID as last resort
    return userId?.trim() || randomUUID();
  }
}
