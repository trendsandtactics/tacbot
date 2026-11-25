import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { GeminiService } from '@/lib/services/gemini-service';

export const dynamic = 'force-dynamic';

interface SettingRow {
  key: string;
  value: string;
}

export async function GET() {
  try {
    const rows = await query<SettingRow[]>(
      "SELECT `key`, `value` FROM app_settings WHERE `key` IN ('gemini_api_key', 'gemini_model', 'default_tone');"
    );

    const settingsMap: Record<string, string> = {};
    rows?.forEach((r) => {
      settingsMap[r.key] = r.value;
    });

    const apiKey = settingsMap['gemini_api_key'] || process.env.GEMINI_API_KEY || '';
    const has_api_key = Boolean(apiKey.trim());

    // Mask API key for security: AIzaSy...xxxx
    let gemini_api_key_masked = '';
    if (apiKey.trim()) {
      const trimmed = apiKey.trim();
      if (trimmed.length > 8) {
        gemini_api_key_masked = `${trimmed.slice(0, 6)}••••••••••••${trimmed.slice(-4)}`;
      } else {
        gemini_api_key_masked = '••••••••';
      }
    }

    return NextResponse.json({
      gemini_model: settingsMap['gemini_model'] || 'gemini-1.5-flash',
      default_tone: settingsMap['default_tone'] || 'Friendly & Welcoming',
      has_api_key,
      gemini_api_key_masked
    });
  } catch (error: unknown) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gemini_api_key, gemini_model, default_tone } = body;

    if (gemini_api_key !== undefined) {
      await query(
        `INSERT INTO app_settings (\`key\`, \`value\`) 
         VALUES ('gemini_api_key', ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);`,
        [String(gemini_api_key).trim()]
      );
    }

    if (gemini_model) {
      await query(
        `INSERT INTO app_settings (\`key\`, \`value\`) 
         VALUES ('gemini_model', ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);`,
        [String(gemini_model).trim()]
      );
    }

    if (default_tone) {
      await query(
        `INSERT INTO app_settings (\`key\`, \`value\`) 
         VALUES ('default_tone', ?)
         ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`);`,
        [String(default_tone).trim()]
      );
    }

    // Invalidate in-memory cache so updates take effect immediately
    GeminiService.clearCache();

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });
  } catch (error: unknown) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update settings' },
      { status: 500 }
    );
  }
}
