import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { GradeAgent } from '@/types/agent';
import { GeminiService } from '@/lib/services/gemini-service';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await query<GradeAgent[]>(
      'SELECT * FROM grade_agents WHERE id = ? OR student_grade = ? LIMIT 1;',
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error: unknown) {
    console.error('Error fetching agent by ID:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];

    if (body.agent_name !== undefined) {
      updates.push('agent_name = ?');
      values.push(String(body.agent_name).trim());
    }

    if (body.tone !== undefined) {
      updates.push('tone = ?');
      values.push(String(body.tone).trim());
    }

    if (body.custom_tone !== undefined) {
      updates.push('custom_tone = ?');
      values.push(body.custom_tone ? String(body.custom_tone).trim() : null);
    }

    if (body.knowledge_text !== undefined) {
      updates.push('knowledge_text = ?');
      values.push(String(body.knowledge_text));
    }

    if (body.custom_instructions !== undefined) {
      updates.push('custom_instructions = ?');
      values.push(body.custom_instructions ? String(body.custom_instructions).trim() : null);
    }

    if (body.model !== undefined) {
      updates.push('model = ?');
      values.push(String(body.model).trim());
    }

    if (body.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(body.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    await query(
      `UPDATE grade_agents SET ${updates.join(', ')} WHERE id = ?;`,
      values
    );

    GeminiService.clearCache();

    return NextResponse.json({ success: true, message: 'Agent updated successfully' });
  } catch (error: unknown) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update agent' },
      { status: 500 }
    );
  }
}
