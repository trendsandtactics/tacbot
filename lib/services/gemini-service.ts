import { query } from '@/lib/db/mysql';
import { GradeAgent, TONE_OPTIONS } from '@/types/agent';
import { HIS_OMEGA_AGENTS } from '@/scripts/setup-agents-schema';

interface AppSettingRow {
  key: string;
  value: string;
}

interface DocumentRow {
  title: string;
  url: string;
  content: string;
}

interface MessageHistoryItem {
  role: 'user' | 'assistant' | 'bot' | 'model';
  content: string;
}

const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest'
];

// Official website URLs from https://www.hisomega.org/
export const OFFICIAL_PAGES = {
  HOME: 'https://www.hisomega.org/',
  MANAGEMENT_TEAM: 'https://www.hisomega.org/management-team/',
  UNIT_HEADS: 'https://www.hisomega.org/unit-heads/',
  ACADEMIC_TEAM: 'https://www.hisomega.org/academic_team/',
  ADMISSIONS: 'https://www.hisomega.org/admissions/',
  CBSE: 'https://www.hisomega.org/cbse-about-the-curriculum/',
  CAMBRIDGE: 'https://www.hisomega.org/cis-about-the-curriculum/',
  IBDP: 'https://www.hisomega.org/ibdp-about-the-curriculum/',
  MONTESSORI: 'https://www.hisomega.org/montessori-introduction/',
  EYP: 'https://www.hisomega.org/eyp-Introduction/',
  NIOS: 'https://www.hisomega.org/nios-about-the-curriculum/',
  SPECIAL_ED: 'https://www.hisomega.org/Indigo-about-the-curriculum/',
  INDIGO: 'https://www.hisomega.org/Indigo-about-the-curriculum/',
  TRANSPORT: 'https://www.hisomega.org/facilities/transport/',
  FACILITIES: 'https://www.hisomega.org/facilities/',
  CONTACT: 'https://www.hisomega.org/contact-us/'
};

type StreamKey = 'montessori' | 'eyp' | 'cbse' | 'cis' | 'ibdp' | 'nios' | 'indigo';

interface StreamDefinition {
  key: StreamKey;
  label: string;
  url: string;
  buttonLabel: string;
  queryRegex: RegExp;
}

const STREAM_DEFINITIONS: StreamDefinition[] = [
  {
    key: 'montessori',
    label: 'Montessori',
    url: OFFICIAL_PAGES.MONTESSORI,
    buttonLabel: 'Know More About Montessori',
    queryRegex: /\bmontessori\b|\bm0\b|\bm1\b|\bm2\b/i
  },
  {
    key: 'eyp',
    label: 'Early Years Programme',
    url: OFFICIAL_PAGES.EYP,
    buttonLabel: 'Know More About Early Years',
    queryRegex: /\bearly years\b|\beyp\b|(?<!indigo )\bheartful kids\b|\bnursery\b|\bk1\b|\bk2\b/i
  },
  {
    key: 'cbse',
    label: 'CBSE (K–12)',
    url: OFFICIAL_PAGES.CBSE,
    buttonLabel: 'Know More About CBSE',
    queryRegex: /\bcbse\b|\baisse\b|\baissce\b/i
  },
  {
    key: 'cis',
    label: 'Cambridge International Stream (Grades I–XII)',
    url: OFFICIAL_PAGES.CAMBRIDGE,
    buttonLabel: 'Know More About Cambridge',
    queryRegex: /\bcambridge\b|\bcis\b|\bigcse\b|\bcheckpoint\b|\ba level\b|\bas & a\b/i
  },
  {
    key: 'ibdp',
    label: 'IB Diploma Programme',
    url: OFFICIAL_PAGES.IBDP,
    buttonLabel: 'Know More About IBDP',
    queryRegex: /\bibdp\b|\bib diploma\b|\binternational baccalaureate\b|\btok\b|\bextended essay\b|\bnaviance\b/i
  },
  {
    key: 'nios',
    label: 'NIOS',
    url: OFFICIAL_PAGES.NIOS,
    buttonLabel: 'Know More About NIOS',
    queryRegex: /\bnios\b|\bopen schooling\b/i
  },
  {
    key: 'indigo',
    label: 'Special Education',
    url: OFFICIAL_PAGES.INDIGO,
    buttonLabel: 'Know More About Indigo Special Ed',
    queryRegex: /\bindigo\b|\bspecial ed(?:ucation)?\b|\bdavis learning\b/i
  }
];

function getStreamKeyForGrade(grade?: string | null): StreamKey | null {
  const g = (grade || '').toLowerCase().trim();
  if (!g || g === 'general / all grades' || g === 'general') {
    return null;
  }
  if (g.includes('cambridge') || g === 'cis') return 'cis';
  if (g.includes('cbse')) return 'cbse';
  if (g.includes('ib') || g.includes('diploma')) return 'ibdp';
  if (g.includes('montessori')) return 'montessori';
  if (g.includes('early years') || g === 'eyp') return 'eyp';
  if (g.includes('nios')) return 'nios';
  if (g.includes('special') || g.includes('indigo')) return 'indigo';
  return null;
}

function getStreamDefinition(key: StreamKey | null): StreamDefinition | null {
  if (!key) return null;
  return STREAM_DEFINITIONS.find((s) => s.key === key) || null;
}

function detectOutOfScopeStream(activeStreamKey: StreamKey | null, queryText: string): StreamDefinition | null {
  if (!activeStreamKey) return null;

  const ownDef = getStreamDefinition(activeStreamKey);
  const mentionsOwnStream = ownDef ? ownDef.queryRegex.test(queryText) : false;
  const isTransitionQuestion =
    (activeStreamKey === 'montessori' || activeStreamKey === 'eyp') &&
    /\b(transition|after|next|class 1|grade 1|continue)\b/i.test(queryText);

  if (mentionsOwnStream || isTransitionQuestion) {
    return null;
  }

  for (const stream of STREAM_DEFINITIONS) {
    if (stream.key !== activeStreamKey && stream.queryRegex.test(queryText)) {
      return stream;
    }
  }

  return null;
}

function isLegacyKnowledge(text?: string | null): boolean {
  if (!text) return true;
  return (
    !text.includes('hisomega.org') ||
    text.includes('Hindustan International School') ||
    text.includes('Pudupakkam')
  );
}

/**
 * Determine the exact official page link and action label based on inquiry and student grade
 */
export function resolvePageLink(grade?: string | null, queryText: string = ''): { url: string; label: string } {
  const q = queryText.toLowerCase().trim();
  const activeStreamKey = getStreamKeyForGrade(grade);
  const ownStream = getStreamDefinition(activeStreamKey);

  // If user is in a specific grade and asks about an out-of-scope stream, keep the action button on their grade
  if (activeStreamKey && ownStream && detectOutOfScopeStream(activeStreamKey, queryText)) {
    return {
      url: ownStream.url,
      label: ownStream.buttonLabel
    };
  }

  // 1. Management Team (General or explicit management query)
  if (
    !activeStreamKey &&
    (q.includes('management') ||
      q.includes('chairman') ||
      q.includes('correspondent') ||
      q.includes('cfo') ||
      q.includes('chief financial') ||
      q.includes('director') ||
      q.includes('rajesh rathod') ||
      q.includes('bharath madhavan') ||
      q.includes('subramanian') ||
      q.includes('bhavanishankar'))
  ) {
    return {
      url: OFFICIAL_PAGES.MANAGEMENT_TEAM,
      label: 'Meet Our Management Team'
    };
  }

  // 2. Unit Heads & Principals / Headmistresses
  if (
    q.includes('unit head') ||
    q.includes('unit heads') ||
    q.includes('principal') ||
    q.includes('headmistress') ||
    q.includes('head of school') ||
    q.includes('muthiah') ||
    q.includes('priya susan') ||
    q.includes('divya samvit') ||
    q.includes('radha devi') ||
    q.includes('preetha george') ||
    q.includes('sreelekha') ||
    q.includes('priti venkatesan')
  ) {
    return {
      url: OFFICIAL_PAGES.UNIT_HEADS,
      label: 'Meet Our Unit Heads'
    };
  }

  // 3. Academic Team, Departments, HODs & Faculty
  if (
    !activeStreamKey &&
    (q.includes('academic team') ||
      q.includes('department') ||
      q.includes('hod') ||
      q.includes('head of department') ||
      q.includes('faculty') ||
      q.includes('teacher') ||
      q.includes('teachers') ||
      q.includes('vice principal') ||
      q.includes('coordinator') ||
      q.includes('counsellor') ||
      q.includes('counselor'))
  ) {
    return {
      url: OFFICIAL_PAGES.ACADEMIC_TEAM,
      label: 'Explore Academic Team'
    };
  }

  // 4. Admission, application, documents, fees, eligibility
  if (
    q.includes('admission') ||
    q.includes('apply') ||
    q.includes('fee') ||
    q.includes('cost') ||
    q.includes('pay') ||
    q.includes('enroll') ||
    q.includes('document') ||
    q.includes('eligib') ||
    q.includes('age') ||
    q.includes('registration')
  ) {
    return {
      url: OFFICIAL_PAGES.ADMISSIONS,
      label: 'Admissions & Application'
    };
  }

  // 5. Transport & Bus routes
  if (
    q.includes('transport') ||
    q.includes('bus') ||
    q.includes('route') ||
    q.includes('van') ||
    q.includes('commute') ||
    q.includes('driver')
  ) {
    return {
      url: OFFICIAL_PAGES.TRANSPORT,
      label: 'Know More About Transport'
    };
  }

  // 6. Query-specific curriculum mentions (for General / All Grades, or matching the active stream)
  for (const stream of STREAM_DEFINITIONS) {
    if ((!activeStreamKey || activeStreamKey === stream.key) && stream.queryRegex.test(q)) {
      return {
        url: stream.url,
        label: stream.buttonLabel
      };
    }
  }

  // 7. Contact, Location, Phone, Address, Email (general)
  if (
    !activeStreamKey &&
    (q.includes('contact') ||
      q.includes('phone') ||
      q.includes('call') ||
      q.includes('address') ||
      q.includes('location') ||
      q.includes('where') ||
      q.includes('reach') ||
      q.includes('email'))
  ) {
    return {
      url: OFFICIAL_PAGES.CONTACT,
      label: 'Know More & Contact Campus'
    };
  }

  // 8. Facilities & Campus
  if (
    !activeStreamKey &&
    (q.includes('facility') ||
      q.includes('campus') ||
      q.includes('lab') ||
      q.includes('sport') ||
      q.includes('library') ||
      q.includes('ground') ||
      q.includes('amenities'))
  ) {
    return {
      url: OFFICIAL_PAGES.FACILITIES,
      label: 'Explore Campus Facilities'
    };
  }

  // 9. Grade / Curriculum specific links
  if (ownStream) {
    return {
      url: ownStream.url,
      label: ownStream.buttonLabel
    };
  }

  // Default to main portal
  return {
    url: OFFICIAL_PAGES.HOME,
    label: 'Know More on hisomega.org'
  };
}

function filterDocumentsForGrade(
  docs: DocumentRow[],
  activeStreamKey: StreamKey | null
): DocumentRow[] {
  if (!activeStreamKey) {
    return docs;
  }
  const ownStream = getStreamDefinition(activeStreamKey);
  if (!ownStream) return [];
  return docs.filter((d) => d.url === ownStream.url);
}

function getCrossStreamKnowledge(resolvedGrade: string, userQuery: string): string {
  // Specific grade users are strictly scoped to their own grade only
  if (getStreamKeyForGrade(resolvedGrade) !== null) {
    return '';
  }

  const q = userQuery.toLowerCase();
  const extraParts: string[] = [];

  for (const stream of STREAM_DEFINITIONS) {
    if (stream.queryRegex.test(q)) {
      const targetGrade = stream.key === 'indigo' ? 'Special Education' : stream.label;
      const streamAgent = HIS_OMEGA_AGENTS.find((a) => a.grade === targetGrade);
      if (streamAgent) {
        extraParts.push(streamAgent.knowledge);
      }
    }
  }

  return extraParts.join('\n\n');
}

function findRelevantDocumentSnippets(
  docs: DocumentRow[],
  userQuery: string,
  maxChars: number = 4500
): string {
  if (!docs || docs.length === 0) return '';

  const stopWords = new Set([
    'what', 'when', 'where', 'which', 'about', 'tell', 'does', 'have',
    'from', 'with', 'your', 'school', 'please', 'know', 'want', 'the',
    'and', 'for', 'are', 'can', 'give', 'details', 'info', 'information',
    'who', 'how', 'his', 'omega'
  ]);

  const tokens = userQuery
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  if (tokens.length === 0) return '';

  const scoredChunks: Array<{ score: number; text: string }> = [];

  for (const doc of docs) {
    const lines = (doc.content || '').split('\n').filter(Boolean);
    // Group into windows of up to 8 lines with 2-line overlap so names/degrees/departments stay together
    const windowSize = 8;
    for (let i = 0; i < lines.length; i += 6) {
      const chunkText = lines.slice(i, i + windowSize).join('\n');
      const lowerChunk = chunkText.toLowerCase();
      const lowerMeta = `${doc.title} ${doc.url}`.toLowerCase();

      let score = 0;
      for (const token of tokens) {
        if (lowerChunk.includes(token)) score += 3;
        if (lowerMeta.includes(token)) score += 1;
      }

      if (score > 0) {
        scoredChunks.push({
          score,
          text: `[Source: ${doc.url || doc.title}]\n${chunkText}`
        });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  let totalLen = 0;
  for (const item of scoredChunks.slice(0, 6)) {
    if (totalLen + item.text.length > maxChars) break;
    selected.push(item.text);
    totalLen += item.text.length;
  }

  return selected.join('\n\n');
}

// In-memory cache to eliminate repetitive remote database round-trips for high-speed replies
let cachedApiKey: { value: string; expiresAt: number } | null = null;
let cachedModel: { value: string; expiresAt: number } | null = null;
let cachedDocs: { value: DocumentRow[]; expiresAt: number } | null = null;
const cachedAgents = new Map<string, { value: GradeAgent | null; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export class GeminiService {
  /**
   * Clear in-memory caches (called on settings or agent updates)
   */
  static clearCache(): void {
    cachedApiKey = null;
    cachedModel = null;
    cachedDocs = null;
    cachedAgents.clear();
  }

  /**
   * Fetch stored website documents from MySQL (with fast in-memory cache)
   */
  static async getStoredDocuments(): Promise<DocumentRow[]> {
    const now = Date.now();
    if (cachedDocs && cachedDocs.expiresAt > now) {
      return cachedDocs.value;
    }

    try {
      const rows = await query<DocumentRow[]>(
        'SELECT title, url, content FROM documents ORDER BY created_at DESC;'
      );
      const docs = rows || [];
      cachedDocs = { value: docs, expiresAt: now + CACHE_TTL_MS };
      return docs;
    } catch (e) {
      console.warn('Could not read documents table:', e);
      return [];
    }
  }

  /**
   * Fetch active Gemini API key from database or fallback to environment variable (with fast in-memory cache)
   */
  static async getApiKey(): Promise<string> {
    const now = Date.now();
    if (cachedApiKey && cachedApiKey.expiresAt > now) {
      return cachedApiKey.value;
    }

    try {
      const rows = await query<AppSettingRow[]>(
        "SELECT `value` FROM app_settings WHERE `key` = 'gemini_api_key' LIMIT 1;"
      );
      if (rows && rows.length > 0 && rows[0].value?.trim()) {
        const key = rows[0].value.trim();
        cachedApiKey = { value: key, expiresAt: now + CACHE_TTL_MS };
        return key;
      }
    } catch (e) {
      console.warn('Could not read gemini_api_key from app_settings:', e);
    }

    const envKey = (process.env.GEMINI_API_KEY || '').trim();
    cachedApiKey = { value: envKey, expiresAt: now + CACHE_TTL_MS };
    return envKey;
  }

  /**
   * Fetch configured Gemini model from database (with fast in-memory cache)
   */
  static async getModel(): Promise<string> {
    const now = Date.now();
    if (cachedModel && cachedModel.expiresAt > now) {
      return cachedModel.value;
    }

    try {
      const rows = await query<AppSettingRow[]>(
        "SELECT `value` FROM app_settings WHERE `key` = 'gemini_model' LIMIT 1;"
      );
      if (rows && rows.length > 0 && rows[0].value?.trim()) {
        let val = rows[0].value.trim();
        if (
          val === 'gemini-1.5-flash' ||
          val === 'gemini-2.0-flash' ||
          val === 'gemini-2.5-flash'
        ) {
          val = 'gemini-3.5-flash';
        }
        cachedModel = { value: val, expiresAt: now + CACHE_TTL_MS };
        return val;
      }
    } catch (e) {
      console.warn('Could not read gemini_model from app_settings:', e);
    }

    const defaultModel = 'gemini-3.5-flash';
    cachedModel = { value: defaultModel, expiresAt: now + CACHE_TTL_MS };
    return defaultModel;
  }

  /**
   * Test an API key against Google Gemini REST API with candidate models
   */
  static async testApiKey(
    apiKey: string,
    model: string = 'gemini-3.5-flash'
  ): Promise<{ success: boolean; message: string }> {
    if (!apiKey?.trim()) {
      return { success: false, message: 'API key is empty.' };
    }

    const cleanKey = apiKey.trim();
    const modelsToTry = [model, ...CANDIDATE_MODELS.filter((m) => m !== model)];

    let lastError = '';

    for (const testModel of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          testModel
        )}:generateContent?key=${encodeURIComponent(cleanKey)}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: 'Respond with "Gemini API connected successfully."' }]
              }
            ],
            generationConfig: {
              maxOutputTokens: 50,
              temperature: 0.1
            }
          })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          return {
            success: true,
            message: `${text.trim() || 'Connected to Gemini API successfully!'} (Using model: ${testModel})`
          };
        }

        lastError = data?.error?.message || `HTTP ${res.status}`;
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Network error testing Gemini API';
      }
    }

    return {
      success: false,
      message: lastError || 'Failed to authenticate with Gemini API'
    };
  }

  /**
   * Get agent configuration for a specific student grade with hisomega.org defaults
   */
  static async getAgentForGrade(grade?: string | null): Promise<GradeAgent | null> {
    const cleanGrade = (grade || 'General / All Grades').trim();
    const now = Date.now();

    const cached = cachedAgents.get(cleanGrade);
    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    // Default fallback from official hisomega.org knowledge base
    const defaultData =
      HIS_OMEGA_AGENTS.find((a) => a.grade === cleanGrade) ||
      HIS_OMEGA_AGENTS.find((a) => a.grade === 'General / All Grades') ||
      HIS_OMEGA_AGENTS[0];

    try {
      if (cleanGrade && cleanGrade !== 'General / All Grades') {
        const rows = await query<GradeAgent[]>(
          'SELECT * FROM grade_agents WHERE student_grade = ? AND is_active = TRUE LIMIT 1;',
          [cleanGrade]
        );
        if (rows && rows.length > 0) {
          const matched = rows[0];
          if (isLegacyKnowledge(matched.knowledge_text)) {
            matched.knowledge_text = defaultData.knowledge;
          }
          cachedAgents.set(cleanGrade, { value: matched, expiresAt: now + CACHE_TTL_MS });
          return matched;
        }
      }

      // Fallback to General agent
      const fallbackRows = await query<GradeAgent[]>(
        "SELECT * FROM grade_agents WHERE student_grade = 'General / All Grades' LIMIT 1;"
      );
      if (fallbackRows && fallbackRows.length > 0) {
        const fallback = fallbackRows[0];
        if (isLegacyKnowledge(fallback.knowledge_text)) {
          fallback.knowledge_text = defaultData.knowledge;
        }
        cachedAgents.set(cleanGrade, { value: fallback, expiresAt: now + CACHE_TTL_MS });
        return fallback;
      }
    } catch (err) {
      console.warn('Database agent lookup notice (using official hisomega.org defaults):', err);
    }

    const defaultAgent: GradeAgent = {
      id: 'default-' + cleanGrade.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      student_grade: cleanGrade,
      agent_name: defaultData.name,
      tone: defaultData.tone,
      custom_tone: null,
      knowledge_text: defaultData.knowledge,
      custom_instructions: null,
      model: 'gemini-3.5-flash',
      is_active: true
    };

    cachedAgents.set(cleanGrade, { value: defaultAgent, expiresAt: now + CACHE_TTL_MS });
    return defaultAgent;
  }

  /**
   * Grounded synthesis directly from the given website knowledge text.
   * Produces an overall content in ONE paragraph within 6 lines with complete meaningful data and page link button.
   */
  static extractAnswerFromContent(
    knowledgeText: string,
    queryText: string,
    grade: string,
    agentName: string
  ): string {
    const rawText = knowledgeText?.trim() || '';
    const cleanQuery = queryText.toLowerCase().trim();
    const pageAction = resolvePageLink(grade, cleanQuery);
    const buttonTag = `\n\n[button:${pageAction.url}:${pageAction.label}]`;
    const isAdmissionRelated =
      cleanQuery.includes('admission') ||
      cleanQuery.includes('apply') ||
      cleanQuery.includes('fee') ||
      cleanQuery.includes('enroll') ||
      cleanQuery.includes('document') ||
      cleanQuery.includes('eligib');

    if (!rawText) {
      return `Welcome to Heartfulness International School, Omega Branch! For detailed admissions guidelines and academic information regarding ${grade}, our team is available at admissions@hisomega.org or +91 92824 47706.${buttonTag}`;
    }

    // Check greeting
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'start'];
    const isGreeting = greetings.some(
      (g) => cleanQuery === g || cleanQuery.startsWith(`${g} `) || cleanQuery.startsWith(`${g}!`)
    );

    if (isGreeting) {
      return `Hello and welcome to Heartfulness International School, Omega Branch! I am your ${agentName} for ${grade}, here to guide you with complete details on curriculum options, school leadership, admissions, timings, and campus infrastructure.${buttonTag}`;
    }

    // Split text into logical sections (double-newline or === headers)
    const sections = rawText
      .split(/\n\s*\n|(?====\s)/)
      .map((s) => s.trim())
      .filter(Boolean);

    const stopWords = new Set([
      'what', 'when', 'where', 'which', 'about', 'tell', 'does', 'have',
      'from', 'with', 'your', 'school', 'please', 'know', 'want', 'the',
      'and', 'for', 'are', 'can', 'give', 'details', 'info', 'information',
      'who', 'how'
    ]);
    const queryWords = cleanQuery
      .replace(/[^\w\s]/gi, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

    let bestSections: string[] = [];
    let highestScore = 0;

    for (const sec of sections) {
      const secLower = sec.toLowerCase();
      let score = 0;

      for (const w of queryWords) {
        if (secLower.includes(w)) {
          score += 3;
        }
      }

      if ((cleanQuery.includes('timing') || cleanQuery.includes('time') || cleanQuery.includes('hour')) &&
          (secLower.includes('timing') || secLower.includes('am') || secLower.includes('pm') || secLower.includes('hours'))) {
        score += 8;
      }
      if ((cleanQuery.includes('stream') || cleanQuery.includes('subject') || cleanQuery.includes('course') || cleanQuery.includes('syllabus') || cleanQuery.includes('curriculum')) &&
          (secLower.includes('stream') || secLower.includes('subject') || secLower.includes('curriculum') || secLower.includes('syllabus'))) {
        score += 8;
      }
      if ((cleanQuery.includes('management') || cleanQuery.includes('chairman') || cleanQuery.includes('correspondent') || cleanQuery.includes('cfo') || cleanQuery.includes('director')) &&
          (secLower.includes('management team') || secLower.includes('chairman') || secLower.includes('correspondent') || secLower.includes('chief financial'))) {
        score += 10;
      }
      if ((cleanQuery.includes('unit head') || cleanQuery.includes('principal') || cleanQuery.includes('headmistress') || cleanQuery.includes('head of school')) &&
          (secLower.includes('unit heads') || secLower.includes('principal') || secLower.includes('headmistress'))) {
        score += 10;
      }
      if ((cleanQuery.includes('academic team') || cleanQuery.includes('hod') || cleanQuery.includes('department') || cleanQuery.includes('teacher') || cleanQuery.includes('faculty')) &&
          (secLower.includes('department heads') || secLower.includes('academic team') || secLower.includes('hod'))) {
        score += 10;
      }
      if ((cleanQuery.includes('admission') || cleanQuery.includes('apply') || cleanQuery.includes('document') || cleanQuery.includes('eligib') || cleanQuery.includes('age')) &&
          (secLower.includes('admission') || secLower.includes('document') || secLower.includes('age') || secLower.includes('eligibility') || secLower.includes('process'))) {
        score += 8;
      }
      if ((cleanQuery.includes('fee') || cleanQuery.includes('cost') || cleanQuery.includes('pay') || cleanQuery.includes('emi')) &&
          (secLower.includes('fee') || secLower.includes('payment') || secLower.includes('scholarship') || secLower.includes('emi') || secLower.includes('grayquest'))) {
        score += 8;
      }
      if ((cleanQuery.includes('sport') || cleanQuery.includes('facility') || cleanQuery.includes('bus') || cleanQuery.includes('transport') || cleanQuery.includes('campus')) &&
          (secLower.includes('facility') || secLower.includes('sport') || secLower.includes('bus') || secLower.includes('transport') || secLower.includes('campus') || secLower.includes('fleet'))) {
        score += 8;
      }

      if (score > highestScore) {
        highestScore = score;
        bestSections = [sec];
      } else if (score > 0 && score === highestScore && bestSections.length < 2) {
        bestSections.push(sec);
      }
    }

    const targetBlock = bestSections.length > 0 ? bestSections.join(' ') : sections.slice(0, 2).join(' ');

    const cleanLines = targetBlock
      .replace(/===+/g, '')
      .replace(/###/g, '')
      .replace(/\[Source:[^\]]+\]/g, '')
      .replace(/^[\s*\-•\d\.\)]+/gm, '')
      .replace(/:\s*\n+/g, ': ')
      .replace(/\n+/g, '. ')
      .replace(/\s+/g, ' ')
      .replace(/:\./g, ':')
      .replace(/\.{2,}/g, '.')
      .trim();

    const sentences = cleanLines.match(/[^.!?]+[.!?]+/g) || [cleanLines];
    const meaningfulSentences: string[] = [];
    let charCount = 0;

    for (const rawSen of sentences) {
      const sen = rawSen.trim();
      if (sen.length > 20 && !sen.endsWith(':')) {
        meaningfulSentences.push(sen);
        charCount += sen.length;
        if (meaningfulSentences.length >= 4 || charCount > 420) {
          break;
        }
      }
    }

    const synthesizedParagraph =
      meaningfulSentences.length > 0
        ? meaningfulSentences.join(' ')
        : (highestScore === 0 && !isAdmissionRelated)
          ? `For this specific inquiry regarding ${grade}, our school administration and admissions coordinators are pleased to assist you directly with exact details. Please reach out to our admissions office at admissions@hisomega.org or call 044-66241130 / +91 92824 47706, or visit our campus at 79, Omega School Road, Kolapakkam, Chennai.`
          : `At Heartfulness International School (HIS Omega) for ${grade}, academic programs combine rigorous board learning with holistic student development, modern campus facilities, and dedicated counseling support.`;

    return `${synthesizedParagraph}${buttonTag}`;
  }

  /**
   * Generate an answer using Gemini grounded in the official website knowledge base (https://www.hisomega.org/).
   * Strictly outputs an overall synthesized answer within ONE paragraph within 6 lines with complete meaningful data and page link button.
   */
  static async generateAnswer(params: {
    studentGrade?: string | null;
    userQuery: string;
    history?: MessageHistoryItem[];
    overrideAgent?: Partial<GradeAgent>;
    overrideApiKey?: string;
  }): Promise<{ reply: string; agentName: string; studentGrade: string }> {
    const { studentGrade, userQuery, history = [], overrideAgent, overrideApiKey } = params;

    // 1. Resolve agent
    let agent: GradeAgent | null = null;
    if (overrideAgent?.knowledge_text) {
      agent = {
        id: overrideAgent.id || 'draft',
        student_grade: overrideAgent.student_grade || studentGrade || 'General / All Grades',
        agent_name: overrideAgent.agent_name || 'HIS School Counselor',
        tone: overrideAgent.tone || 'Friendly & Welcoming',
        custom_tone: overrideAgent.custom_tone || null,
        knowledge_text: overrideAgent.knowledge_text || '',
        custom_instructions: overrideAgent.custom_instructions || null,
        model: overrideAgent.model || 'gemini-3.5-flash',
        is_active: true
      };
    } else {
      agent = await this.getAgentForGrade(studentGrade);
    }

    const resolvedGrade = agent?.student_grade || studentGrade || 'General / All Grades';
    const agentName = agent?.agent_name || 'HIS School Counselor';
    const baseKnowledgeText = agent?.knowledge_text || '';
    const activeStreamKey = getStreamKeyForGrade(resolvedGrade);
    const ownStreamDef = getStreamDefinition(activeStreamKey);

    // Resolve official website button link
    const pageAction = resolvePageLink(resolvedGrade, userQuery);
    const expectedButtonTag = `[button:${pageAction.url}:${pageAction.label}]`;

    // Strictly enforce grade-only answers when a specific grade/stream is selected
    const outOfScopeStream = detectOutOfScopeStream(activeStreamKey, userQuery);
    if (activeStreamKey && outOfScopeStream) {
      const buttonUrl = ownStreamDef?.url || OFFICIAL_PAGES.HOME;
      const buttonLabel = ownStreamDef?.buttonLabel || `Know More About ${resolvedGrade}`;
      return {
        reply: `As the dedicated ${agentName} for ${resolvedGrade} at Heartfulness International School, Omega Branch, I can only answer questions related to ${resolvedGrade}. For details about ${outOfScopeStream.label}, please switch your selected grade to "${outOfScopeStream.label}" or "General / All Grades", or contact our admissions team at admissions@hisomega.org or +91 92824 47706.\n\n[button:${buttonUrl}:${buttonLabel}]`,
        agentName,
        studentGrade: resolvedGrade
      };
    }

    // Scope knowledge & documents strictly to the active grade (or all streams when General / All Grades)
    const crossStreamText = getCrossStreamKnowledge(resolvedGrade, userQuery);
    const storedDocs = filterDocumentsForGrade(await this.getStoredDocuments(), activeStreamKey);
    const docSnippets = findRelevantDocumentSnippets(storedDocs, userQuery);

    const combinedKnowledgeText = [baseKnowledgeText, crossStreamText, docSnippets]
      .filter(Boolean)
      .join('\n\n');

    // 2. Resolve tone instructions
    const selectedToneOption = TONE_OPTIONS.find((t) => t.id === agent?.tone);
    let toneDescription = selectedToneOption?.systemPromptModifier || 'Warm, courteous, professional, encouraging, and clear.';
    if (agent?.tone === 'Custom Tone' && agent.custom_tone?.trim()) {
      toneDescription = agent.custom_tone.trim();
    }

    // 4. Resolve API key
    const apiKey = overrideApiKey?.trim() || (await this.getApiKey());
    if (!apiKey) {
      const contentReply = this.extractAnswerFromContent(
        combinedKnowledgeText,
        userQuery,
        resolvedGrade,
        agentName
      );
      return {
        reply: contentReply,
        agentName,
        studentGrade: resolvedGrade
      };
    }

    // 5. Construct System Instruction: strictly one paragraph within 6 lines with complete meaningful data
    const gradeScopeDirective = activeStreamKey
      ? `STRICT GRADE-ONLY SCOPE (MANDATORY):
   - You are assigned EXCLUSIVELY to "${resolvedGrade}".
   - Answer ONLY questions subjected to "${resolvedGrade}" using the "${resolvedGrade}" reference information below.
   - Do NOT answer questions about other grades, classes, or streams outside "${resolvedGrade}". If the user asks about any other stream or grade level not belonging to "${resolvedGrade}", politely decline to answer for other streams and advise them to select that stream or "General / All Grades", or contact admissions@hisomega.org / +91 92824 47706.`
      : `SCHOOL-WIDE COVERAGE:
   - You are assisting on "General / All Grades", covering Management Team, Unit Heads, Academic Team & HODs, EYP, CBSE, Cambridge/CIS, IBDP, Montessori, NIOS, and Indigo Special Education.`;

    const systemPrompt = `You are "${agentName}", the official AI School Counselor for Heartfulness International School, Omega Branch (HIS Omega / Lalaji Memorial Omega International School, https://www.hisomega.org/).
You are answering parent, student, and visitor inquiries ${activeStreamKey ? `exclusively for the "${resolvedGrade}" stream` : 'regarding all streams, school leadership, unit heads, academic departments/faculty, admissions, and campus details'}.

TONE & COMMUNICATION:
Maintain a courteous, highly professional, polite, and helpful communication style at all times: ${toneDescription}

CRITICAL RESPONSE RULES (STRICTLY ENFORCED):
1. GROUNDED IN OFFICIAL SCHOOL WEBSITE CONTENT (https://www.hisomega.org/):
   - Answer all questions accurately using ONLY the official reference information below.
   - ${gradeScopeDirective}
   - Do NOT verbatim copy-paste or dump raw reference paragraphs. Synthesize and communicate the answer naturally in your own clear words.
2. ONE SINGLE PARAGRAPH (MAXIMUM 6 LINES):
   - Provide your entire textual answer in EXACTLY ONE coherent, well-structured paragraph of 3 to 5 complete sentences (maximum 6 lines).
   - Do NOT use separate bullet points, numbered lists, asterisks, or multiple paragraph breaks.
3. COMPLETE & MEANINGFUL DATA:
   - Ensure every sentence is grammatically complete, ending with a period (.), question mark (?), or exclamation mark (!).
   - Never cut off mid-thought or mid-sentence.
   - Include exact names, designations, timings, phone numbers, email addresses, curriculum highlights, or process steps requested.
4. IF YOU DO NOT KNOW THE ANSWER (OFFICIAL CONTACT DETAILS FALLBACK):
   - If an inquiry asks about a specific detail not covered in the reference information (such as unpublished fee structures, personal student records, or custom bus stops):
   - Do NOT guess or invent facts.
   - Transparently and politely inform the user that our school administration and admissions counselors can assist directly with exact details, and provide the official contact information:
     Admissions: admissions@hisomega.org | General: info@hisomega.org | Phone: 044-66241130 / 044-66241105 / +91 92824 47706 | Main Campus: 79, Omega School Road, Kolapakkam, Chennai – 600128.
5. GREETINGS:
   - If the user sends a greeting, provide a warm 2-sentence single-paragraph welcome introducing HIS Omega and ${resolvedGrade}.
6. MANDATORY PAGE LINK BUTTON:
   - Always append the following exact button tag on a new line at the very end of your response:
   ${expectedButtonTag}
${agent?.custom_instructions ? `\nSPECIAL DIRECTIVES:\n${agent.custom_instructions}\n` : ''}

REFERENCE INFORMATION FOR ${resolvedGrade} (FROM hisomega.org):
==================================================
${combinedKnowledgeText}
==================================================`;

    // 6. Construct conversation history
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    const recentHistory = history.slice(-4);
    for (const msg of recentHistory) {
      const role = msg.role === 'assistant' || msg.role === 'bot' || msg.role === 'model' ? 'model' : 'user';
      if (msg.content?.trim()) {
        contents.push({
          role,
          parts: [{ text: msg.content.trim() }]
        });
      }
    }

    contents.push({
      role: 'user',
      parts: [{ text: userQuery }]
    });

    // 7. Call Gemini API with candidate model fallback and quick timeout
    const configuredModel =
      agent?.model &&
      agent.model !== 'gemini-1.5-flash' &&
      agent.model !== 'gemini-2.0-flash' &&
      agent.model !== 'gemini-2.5-flash'
        ? agent.model
        : (await this.getModel());

    const modelsToAttempt = [
      configuredModel,
      ...CANDIDATE_MODELS.filter((m) => m !== configuredModel)
    ];

    for (const currentModel of modelsToAttempt) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          currentModel
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(7000),
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }]
            },
            contents,
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              maxOutputTokens: 1024
            }
          })
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (generatedText.trim()) {
            let cleanText = generatedText
              .replace(/\[button:[^\]]+\]/g, '')
              .replace(/\[admission-button\]/g, '')
              .replace(/transfer-button/g, '')
              .replace(/admission-button/g, '')
              .trim();

            if (cleanText.includes('\n')) {
              const lines = cleanText
                .split('\n')
                .map((line: string) => line.replace(/^[\*\-•\d\.\)]+\s*/, '').trim())
                .filter(Boolean);

              cleanText = lines
                .map((l: string) => (/[.!?]$/.test(l) ? l : `${l}.`))
                .join(' ');
            }

            const finalReply = `${cleanText}\n\n${expectedButtonTag}`;

            return {
              reply: finalReply,
              agentName,
              studentGrade: resolvedGrade
            };
          }
        } else {
          console.warn(`Gemini model ${currentModel} returned ${res.status}:`, data?.error?.message);
        }
      } catch (err) {
        console.warn(`Error invoking Gemini model ${currentModel}:`, err);
      }
    }

    // 8. Instant Fallback: If all Gemini calls time out or fail, answer with synthesized website content
    const contentReply = this.extractAnswerFromContent(
      combinedKnowledgeText,
      userQuery,
      resolvedGrade,
      agentName
    );
    return {
      reply: contentReply,
      agentName,
      studentGrade: resolvedGrade
    };
  }
}
