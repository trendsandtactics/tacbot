import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db/mysql';
import { randomUUID } from 'crypto';
import { GradeAgent } from '@/types/agent';
import { GeminiService } from '@/lib/services/gemini-service';
import { HIS_OMEGA_AGENTS } from '@/scripts/setup-agents-schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const agents = await query<GradeAgent[]>(`
      SELECT 
        id,
        student_grade,
        agent_name,
        tone,
        custom_tone,
        knowledge_text,
        custom_instructions,
        model,
        is_active,
        created_at,
        updated_at
      FROM grade_agents
      ORDER BY 
        CASE WHEN student_grade = 'General / All Grades' THEN 0 ELSE 1 END,
        student_grade ASC;
    `);

    // Synchronize official hisomega.org knowledge base if missing or legacy
    let needsRefresh = false;
    for (const def of HIS_OMEGA_AGENTS) {
      const match = agents?.find((a) => a.student_grade === def.grade);
      if (!match) {
        await query(
          `INSERT INTO grade_agents (id, student_grade, agent_name, tone, knowledge_text, is_active)
           VALUES (?, ?, ?, ?, ?, TRUE);`,
          [randomUUID(), def.grade, def.name, def.tone, def.knowledge]
        ).catch(() => {});
        needsRefresh = true;
      } else if (
        !match.knowledge_text ||
        !match.knowledge_text.includes('hisomega.org') ||
        match.knowledge_text.includes('Hindustan International School') ||
        match.knowledge_text.includes('Pudupakkam')
      ) {
        await query(
          `UPDATE grade_agents 
           SET knowledge_text = ?,
               agent_name = CASE WHEN agent_name LIKE '%HIS General%' OR agent_name LIKE '%Counselor%' THEN ? ELSE agent_name END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?;`,
          [def.knowledge, def.name, match.id]
        ).catch(() => {});
        needsRefresh = true;
      }
    }

    if (needsRefresh) {
      GeminiService.clearCache();
      const updated = await query<GradeAgent[]>(`
        SELECT 
          id,
          student_grade,
          agent_name,
          tone,
          custom_tone,
          knowledge_text,
          custom_instructions,
          model,
          is_active,
          created_at,
          updated_at
        FROM grade_agents
        ORDER BY 
          CASE WHEN student_grade = 'General / All Grades' THEN 0 ELSE 1 END,
          student_grade ASC;
      `);
      return NextResponse.json(updated || []);
    }

    return NextResponse.json(agents || []);
  } catch (error: unknown) {
    console.error('Error fetching grade agents:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_grade,
      agent_name,
      tone = 'Friendly & Welcoming',
      custom_tone,
      knowledge_text = '',
      custom_instructions,
      model = 'gemini-1.5-flash',
      is_active = true
    } = body;

    if (!student_grade || !agent_name) {
      return NextResponse.json(
        { error: 'student_grade and agent_name are required' },
        { status: 400 }
      );
    }

    const cleanGrade = String(student_grade).trim();
    const cleanName = String(agent_name).trim();
    const cleanTone = String(tone).trim();
    const cleanKnowledge = String(knowledge_text).trim();

    // Check if agent exists for this grade
    const existing = await query<GradeAgent[]>(
      'SELECT id FROM grade_agents WHERE student_grade = ? LIMIT 1;',
      [cleanGrade]
    );

    if (existing && existing.length > 0) {
      const id = existing[0].id;
      await query(
        `UPDATE grade_agents 
         SET agent_name = ?,
             tone = ?,
             custom_tone = ?,
             knowledge_text = ?,
             custom_instructions = ?,
             model = ?,
             is_active = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?;`,
        [
          cleanName,
          cleanTone,
          custom_tone || null,
          cleanKnowledge,
          custom_instructions || null,
          model,
          is_active ? 1 : 0,
          id
        ]
      );

      // Invalidate in-memory cache
      GeminiService.clearCache();

      return NextResponse.json({
        success: true,
        id,
        message: 'Agent updated successfully'
      });
    } else {
      const id = randomUUID();
      await query(
        `INSERT INTO grade_agents 
         (id, student_grade, agent_name, tone, custom_tone, knowledge_text, custom_instructions, model, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          id,
          cleanGrade,
          cleanName,
          cleanTone,
          custom_tone || null,
          cleanKnowledge,
          custom_instructions || null,
          model,
          is_active ? 1 : 0
        ]
      );

      // Invalidate in-memory cache
      GeminiService.clearCache();

      return NextResponse.json({
        success: true,
        id,
        message: 'Agent created successfully'
      });
    }
  } catch (error: unknown) {
    console.error('Error saving grade agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save agent' },
      { status: 500 }
    );
  }
}
