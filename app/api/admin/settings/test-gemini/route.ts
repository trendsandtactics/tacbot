import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, model = 'gemini-1.5-flash' } = body;

    let targetKey = apiKey?.trim();
    if (!targetKey) {
      targetKey = await GeminiService.getApiKey();
    }

    if (!targetKey) {
      return NextResponse.json(
        { success: false, error: 'No Gemini API key provided or saved in settings.' },
        { status: 400 }
      );
    }

    const result = await GeminiService.testApiKey(targetKey, model);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in test-gemini route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error testing Gemini connection'
      },
      { status: 500 }
    );
  }
}
