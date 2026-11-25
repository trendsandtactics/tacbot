import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#\d+;/g, ' ');
}

export function extractStructuredTextFromHtml(html: string, maxLength: number = 30000): string {
  let clean = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '\n')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '\n')
    .replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, '\n')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '\n');

  const mainMatch =
    clean.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i) ||
    clean.match(/<div[^>]+id=["']content["'][^>]*>([\s\S]*?)<\/footer>/i);
  if (mainMatch) {
    clean = mainMatch[1];
  }

  clean = clean
    .replace(/<\/(h[1-6]|p|div|li|tr|section|article|blockquote)>/gi, '\n')
    .replace(/<(br|hr)\s*\/?>/gi, '\n')
    .replace(/<t[dh][^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ');

  clean = decodeHtmlEntities(clean);

  const lines = clean
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const deduped: string[] = [];
  for (const line of lines) {
    if (deduped[deduped.length - 1] !== line) {
      deduped.push(line);
    }
  }

  return deduped.join('\n').substring(0, maxLength);
}

export async function processWebsiteContent(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (${response.status})`);
    }

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, ' ').trim() : url;
    const textContent = extractStructuredTextFromHtml(html, 30000);

    // Upsert by URL so re-processing refreshes existing knowledge instead of duplicating
    const existing = await query<Array<{ id: string }>>(
      'SELECT id FROM documents WHERE url = ? LIMIT 1;',
      [url]
    );

    if (existing && existing.length > 0) {
      await query(
        `UPDATE documents SET title = ?, content = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?;`,
        [title, textContent, existing[0].id]
      );
    } else {
      const id = randomUUID();
      await query(
        `INSERT INTO documents (id, title, content, url, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);`,
        [id, title, textContent, url]
      );
    }

    return { success: true, title, length: textContent.length };
  } catch (error) {
    console.error('Error processing website:', error);
    throw error;
  }
}
