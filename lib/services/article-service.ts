import type { Article } from '@/types/admin';

export class ArticleService {
  static async getArticles(): Promise<Article[]> {
    try {
      const res = await fetch('/api/admin/articles');
      if (!res.ok) throw new Error('Failed to fetch articles');
      const data: Article[] = await res.json();
      return (data || []).filter((a) => a.active);
    } catch (error) {
      console.error('Error fetching articles:', error);
      return [];
    }
  }

  static async createArticle(data: Partial<Article>): Promise<Article> {
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create article');
      return await res.json();
    } catch (error) {
      console.error('Error creating article:', error);
      throw error;
    }
  }

  static async updateArticle(id: string, data: Partial<Article>): Promise<void> {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update article');
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  static async deleteArticle(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete article');
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }
}
