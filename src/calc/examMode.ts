import type { FacadeSummary } from './rules';

export interface ExamState {
  examMode: boolean;
  examSubmitted: boolean;
}

export interface ExamResultSummary {
  okCount: number;
  approxCount: number;
  violationCount: number;
  totalChecks: number;
  overallStatus: FacadeSummary['overallStatus'];
  passed: boolean;
}

/**
 * Returns true when Exam Mode is active and the user has NOT yet clicked
 * «Завершить создание и узнать результат». All hints, norms, and violation
 * indicators must be hidden in this state.
 */
export function isExamBlindState(examMode: boolean, examSubmitted: boolean): boolean {
  return examMode && !examSubmitted;
}

export function getExamResultSummary(summary: FacadeSummary): ExamResultSummary {
  const totalChecks = summary.checks.length;
  return {
    okCount: summary.okCount,
    approxCount: summary.approxCount,
    violationCount: summary.violationCount,
    totalChecks,
    overallStatus: summary.overallStatus,
    passed: summary.violationCount === 0,
  };
}

const NORM_HINT_CONTENT_RE =
  /(?:\bнорма\b|\bдопустимо\b|\bнежелательно\b|\bредко\b|\bпроблем|\bидеал\b|\bэвристик|\bэкстрапол|\bS\.\s*\d|\bN\d+\b|\bрис\.\s*\d|\bUX-|\bapprox\b|\bw\/\d|\bW_p\/|\bh_нижн|\b1\/\d|\b1:1\b|\bдо\s+w\/|\b≤|\b≥)/i;

/**
 * Strips normative/rule hints (e.g. "(норма w/8…w/7)", "(S. 16)", "(N2, ...)")
 * from UI control labels and section titles while preserving neutral
 * architectural terminology such as "(Axenweite)", "(Rahmen)", "(K = 0)".
 */
export function stripExamNormHints(text: string): string {
  if (!text) return text;

  let result = text.replace(/\s*\(([^()]*)\)/g, (fullMatch, inner: string) => {
    if (!NORM_HINT_CONTENT_RE.test(inner)) {
      return fullMatch;
    }

    // If parenthetical mixes a non-norm term with a ", S. 16" or "; N3" suffix,
    // keep only the clean non-norm leading part if it looks like a term name.
    const parts = inner
      .split(/[;,]/)
      .map((part) => part.trim())
      .filter((part) => part.length > 0 && !NORM_HINT_CONTENT_RE.test(part));

    if (parts.length > 0) {
      return ` (${parts.join(', ')})`;
    }
    return '';
  });

  // Also remove trailing bare "S. 10–11" or "N18–N19" fragments if any remained
  result = result
    .replace(/\s*[·,]\s*(?:S\.\s*\d[\d–,\s-]*|N\d+(?:–N?\d+)?)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return result;
}
