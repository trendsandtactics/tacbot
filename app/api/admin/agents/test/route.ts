import { NextRequest, NextResponse } from 'next/server';
import { GeminiService } from '@/lib/services/gemini-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentGrade, question, draftAgent, apiKey } = body;

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'A test question is required.' },
        { status: 400 }
      );
    }

    const result = await GeminiService.generateAnswer({
      studentGrade: studentGrade || draftAgent?.student_grade,
      userQuery: question.trim(),
      overrideAgent: draftAgent,
      overrideApiKey: apiKey
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error testing agent:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error generating test reply'
      },
      { status: 500 }
    );
  }
}
