export interface GradeAgent {
  id: string;
  student_grade: string;
  agent_name: string;
  tone: string;
  custom_tone?: string | null;
  knowledge_text: string;
  custom_instructions?: string | null;
  model?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface GeminiSettings {
  gemini_api_key_masked?: string;
  gemini_model: string;
  default_tone: string;
  has_api_key: boolean;
}

export interface ToneOption {
  id: string;
  label: string;
  description: string;
  systemPromptModifier: string;
}

export const TONE_OPTIONS: ToneOption[] = [
  {
    id: 'Friendly & Welcoming',
    label: 'Friendly & Welcoming',
    description: 'Warm, approachable, conversational, and parent-friendly',
    systemPromptModifier:
      'Warm, friendly, welcoming, polite, and enthusiastic about helping parents and students.'
  },
  {
    id: 'Professional & Formal',
    label: 'Professional & Formal',
    description: 'Structured, respectful, official, and direct',
    systemPromptModifier:
      'Highly professional, respectful, official, polished, and structured.'
  },
  {
    id: 'Encouraging & Inspiring',
    label: 'Encouraging & Inspiring',
    description: 'Nurturing, positive, motivational, and growth-oriented',
    systemPromptModifier:
      'Encouraging, inspiring, positive, highlighting student growth and opportunities.'
  },
  {
    id: 'Academic & Informative',
    label: 'Academic & Informative',
    description: 'Detailed, precise, curriculum-focused, and thorough',
    systemPromptModifier:
      'Academic, educational, precise, informative, and focused on pedagogy and curriculum.'
  },
  {
    id: 'Empathetic & Supportive',
    label: 'Empathetic & Supportive',
    description: 'Patient, gentle, compassionate, and reassuring',
    systemPromptModifier:
      'Empathetic, reassuring, deeply understanding, patient, and compassionate.'
  },
  {
    id: 'Concise & Direct',
    label: 'Concise & Direct',
    description: 'Crisp, quick bullet points, avoiding unnecessary filler',
    systemPromptModifier:
      'Brief, crisp, direct to the point, utilizing concise bullet points without unnecessary filler.'
  },
  {
    id: 'Custom Tone',
    label: 'Custom Tone',
    description: 'Specify your own custom tone instructions',
    systemPromptModifier: ''
  }
];

export const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Fast, Recommended)' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Lightweight)' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash Latest' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { id: 'gemini-pro-latest', label: 'Gemini Pro Latest (Deep Reasoning)' }
];
