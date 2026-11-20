import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

export async function processWebsiteContent(url: string) {
  try {
    // Fetch website content
    const response = await fetch(url);
    const html = await response.text();

    // Clean and extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    // Clean and extract text content with length limit
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 4000); // Limit content length

    const id = randomUUID();

    // Store in MySQL documents table
    await query(
      `
      INSERT INTO documents (id, title, content, url, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
      `,
      [id, title, textContent, url]
    );

    return { success: true };
  } catch (error) {
    console.error('Error processing website:', error);
    throw error;
  }
}
