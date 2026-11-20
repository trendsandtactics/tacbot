import { NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await query<any[]>(`
      SELECT 
        (SELECT COUNT(*) FROM users) AS totalUsers,
        (SELECT COUNT(*) FROM chat_histories) AS totalChats,
        (SELECT COUNT(*) FROM enquiries) AS totalEnquiries,
        (SELECT COUNT(*) FROM enquiries WHERE status IN ('pending', 'active')) AS activeEnquiries,
        (SELECT COUNT(*) FROM chat_histories WHERE created_at >= CURDATE()) AS todayChats,
        (SELECT COUNT(*) FROM enquiries WHERE created_at >= CURDATE()) AS todayEnquiries;
    `);

    const stats = rows[0] || {};
    return NextResponse.json({
      totalUsers: Number(stats.totalUsers || 0),
      totalChats: Number(stats.totalChats || 0),
      totalEnquiries: Number(stats.totalEnquiries || 0),
      activeEnquiries: Number(stats.activeEnquiries || 0),
      todayChats: Number(stats.todayChats || 0),
      todayEnquiries: Number(stats.todayEnquiries || 0)
    });
  } catch (error: any) {
    console.error('Error fetching admin stats from MySQL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
