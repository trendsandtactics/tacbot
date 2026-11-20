import type { EnquiryMessage } from '@/types/enquiry';

export class EnquiryService {
  static async createEnquiry(userId: string, subject: string, message: string) {
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subject, message })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create enquiry');
      }

      return await res.json();
    } catch (error) {
      console.error('Error in createEnquiry:', error);
      throw error;
    }
  }

  static async getEnquiries(userId: string) {
    try {
      const res = await fetch(`/api/enquiries?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch enquiries');
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching enquiries:', error);
      throw error;
    }
  }

  static async getEnquiryMessages(enquiryId: string) {
    try {
      const res = await fetch(`/api/enquiries/${encodeURIComponent(enquiryId)}/messages`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch enquiry messages');
      }
      return await res.json();
    } catch (error) {
      console.error('Error fetching enquiry messages:', error);
      throw error;
    }
  }

  static async sendMessage(
    enquiryId: string,
    content: string,
    sender_type: 'user' | 'admin'
  ): Promise<EnquiryMessage> {
    try {
      const res = await fetch(`/api/enquiries/${encodeURIComponent(enquiryId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, sender_type })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }

      return await res.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  static async updateStatus(
    enquiryId: string,
    status: 'pending' | 'active' | 'resolved'
  ) {
    try {
      const res = await fetch(`/api/conversations/${encodeURIComponent(enquiryId)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update enquiry status');
      }

      return await res.json();
    } catch (error) {
      console.error('Error updating enquiry status:', error);
      throw error;
    }
  }
}
