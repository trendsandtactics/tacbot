import type { Document } from '@/types/admin';

export class WebsiteService {
  static async getDocuments(): Promise<Document[]> {
    try {
      const response = await fetch('/api/admin/documents');
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  }

  static async processWebsite(url: string): Promise<void> {
    try {
      const response = await fetch('/api/process-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process website');
      }
    } catch (error) {
      console.error('Error processing website:', error);
      throw error;
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/admin/documents/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}
