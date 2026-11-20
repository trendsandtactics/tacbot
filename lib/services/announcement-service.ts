import type { Announcement } from '@/types/announcement';

export class AnnouncementService {
  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      const res = await fetch('/api/admin/announcements');
      if (!res.ok) throw new Error('Failed to fetch announcements');
      const data = await res.json();
      return (data || []).filter((a: any) => a.status === 'published');
    } catch (error) {
      console.error('Error fetching announcements:', error);
      return [];
    }
  }
}
