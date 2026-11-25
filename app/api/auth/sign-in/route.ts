import { NextResponse } from 'next/server';
import { scryptSync, timingSafeEqual } from 'crypto';
import { query } from '@/lib/db/mysql';
import { ADMIN_COOKIE_NAME, signSessionToken } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

interface SettingRow {
  key: string;
  value: string;
}

function safeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function verifyScryptHash(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const derived = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return timingSafeEqual(derived, storedBuf);
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const inputEmail = String(email || '').trim().toLowerCase();
    const inputPassword = String(password || '');

    if (!inputEmail || !inputPassword) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    let isAuthenticated = false;

    // 1. Check environment variables if configured
    const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const envPassword = process.env.ADMIN_PASSWORD;
    if (envEmail && envPassword) {
      isAuthenticated =
        safeEqualString(inputEmail, envEmail) &&
        safeEqualString(inputPassword, envPassword);
    } else {
      // 2. Check MySQL app_settings credentials
      const rows = await query<SettingRow[]>(
        "SELECT `key`, `value` FROM app_settings WHERE `key` IN ('admin_email', 'admin_password_hash');"
      );
      const settings: Record<string, string> = {};
      rows?.forEach((r) => {
        settings[r.key] = r.value;
      });

      const dbEmail = (settings.admin_email || '').trim().toLowerCase();
      const dbHash = settings.admin_password_hash || '';

      if (dbEmail && dbHash) {
        isAuthenticated =
          safeEqualString(inputEmail, dbEmail) &&
          verifyScryptHash(inputPassword, dbHash);
      }
    }

    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = await signSessionToken(inputEmail);
    const response = NextResponse.json(
      { success: true, message: 'Signed in successfully' },
      { status: 200 }
    );

    response.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    return response;
  } catch (error: unknown) {
    console.error('Sign in error:', error);
    return NextResponse.json(
      { error: 'An error occurred during sign in' },
      { status: 500 }
    );
  }
}
