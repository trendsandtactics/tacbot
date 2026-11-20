import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db/mysql';

export async function GET() {
  const result = await testConnection();
  if (result.success) {
    return NextResponse.json({ status: 'ok', ...result }, { status: 200 });
  } else {
    return NextResponse.json({ status: 'error', ...result }, { status: 500 });
  }
}
