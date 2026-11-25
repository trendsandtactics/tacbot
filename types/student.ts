export const STUDENT_GRADES = [
  'Montessori',
  'Early Years Programme',
  'CBSE (K–12)',
  'Cambridge International Stream (Grades I–XII)',
  'IB Diploma Programme',
  'NIOS',
  'Special Education'
] as const;

export type StudentGrade = (typeof STUDENT_GRADES)[number];

export const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Montessori: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Early Years Programme': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  'CBSE (K–12)': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  'Cambridge International Stream (Grades I–XII)': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'IB Diploma Programme': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  NIOS: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Special Education': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  // Historic fallback
  Indigo: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' }
};

export function getGradeBadgeStyle(grade?: string | null) {
  if (!grade) {
    return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' };
  }
  return (
    GRADE_COLORS[grade] || {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-200'
    }
  );
}
