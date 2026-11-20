import type {
  Conversation,
  Message,
  RecentActivity,
  AdminEnquiry,
  EnquiryMessage,
  Announcement,
  CreateAnnouncementData,
  Article
} from '@/types/admin';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export class AdminService {
  static async getDashboardStats() {
    try {
      return await apiFetch<{
        totalUsers: number;
        totalChats: number;
        totalEnquiries: number;
        activeEnquiries: number;
        todayChats: number;
        todayEnquiries: number;
      }>('/api/admin/stats');
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  static async getRecentActivity(): Promise<RecentActivity> {
    try {
      return await apiFetch<RecentActivity>('/api/admin/activity');
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  static async getConversations(): Promise<Conversation[]> {
    try {
      return await apiFetch<Conversation[]>('/api/admin/conversations');
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  static async getConversationMessages(chatId: string): Promise<Message[]> {
    try {
      return await apiFetch<Message[]>(`/api/admin/conversations/${chatId}/messages`);
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  static async getAdminEnquiries(): Promise<AdminEnquiry[]> {
    try {
      return await apiFetch<AdminEnquiry[]>('/api/admin/enquiries');
    } catch (error) {
      console.error('Error fetching admin enquiries:', error);
      throw error;
    }
  }

  static async getEnquiryMessages(enquiryId: string): Promise<EnquiryMessage[]> {
    try {
      return await apiFetch<EnquiryMessage[]>(`/api/admin/enquiries/${enquiryId}/messages`);
    } catch (error) {
      console.error('Error fetching enquiry messages:', error);
      throw error;
    }
  }

  static async sendEnquiryMessage(
    enquiryId: string,
    content: string
  ): Promise<void> {
    try {
      await apiFetch(`/api/admin/enquiries/${enquiryId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
    } catch (error) {
      console.error('Error sending enquiry message:', error);
      throw error;
    }
  }

  static async getEnquiryById(enquiryId: string): Promise<AdminEnquiry> {
    try {
      return await apiFetch<AdminEnquiry>(`/api/admin/enquiries/${enquiryId}`);
    } catch (error) {
      console.error('Error fetching enquiry:', error);
      throw error;
    }
  }

  static async updateEnquiryStatus(
    enquiryId: string,
    status: 'pending' | 'active' | 'resolved'
  ): Promise<void> {
    try {
      await apiFetch(`/api/admin/enquiries/${enquiryId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      throw error;
    }
  }

  static async getAnnouncements(): Promise<Announcement[]> {
    try {
      return await apiFetch<Announcement[]>('/api/admin/announcements');
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  }

  static async createAnnouncement(data: CreateAnnouncementData): Promise<Announcement> {
    try {
      return await apiFetch<Announcement>('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  static async updateAnnouncement(
    id: string,
    updates: Partial<Announcement>
  ): Promise<void> {
    try {
      await apiFetch(`/api/admin/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  }

  static async deleteAnnouncement(id: string): Promise<void> {
    try {
      await apiFetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  }

  static async getArticles(): Promise<Article[]> {
    try {
      return await apiFetch<Article[]>('/api/admin/articles');
    } catch (error) {
      console.error('Error fetching articles:', error);
      throw error;
    }
  }

  static async createArticle(data: {
    title: string;
    description: string;
    content: string;
    image_url?: string;
    youtube_url?: string;
    active: boolean;
  }): Promise<Article> {
    try {
      return await apiFetch<Article>('/api/admin/articles', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  static async updateArticle(
    id: string,
    data: Partial<Article>
  ): Promise<void> {
    try {
      await apiFetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  static async deleteArticle(id: string): Promise<void> {
    try {
      await apiFetch(`/api/admin/articles/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }

  static async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload image');
    }
    const data = await res.json();
    return data.url;
  }
}
