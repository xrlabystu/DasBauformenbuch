import type { KeyboardEvent, ReactNode } from 'react';
import type { ArchitecturalTerm } from '../data/brausewetter_1895';

const STOP_WORDS_DE = new Set([
  'der',
  'die',
  'das',
  'den',
  'dem',
  'des',
  'ein',
  'eine',
  'einer',
  'einem',
  'einen',
  'und',
  'oder',
  'mit',
  'als',
  'für',
  'von',
  'im',
  'in',
  'am',
  'zu',
  'zum',
  'zur',
  'bis',
  'vs',
  'ohne',
  'auf',
  'bei',
]);

const STOP_WORDS_RU = new Set([
  'и',
  'или',
  'в',
  'на',
  'по',
  'из',
  'от',
  'до',
  'к',
  'с',
  'со',
  'об',
  'о',
  'при',
  'для',
  'как',
  'не',
  'а',
  'но',
  'их',
  'его',
  'её',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stemWord(word: string, lang: 'de' | 'ru'): string {
  const lower = word.toLowerCase();
  if (lower.length <= 4) {
    return lower;
  }
  if (lang === 'de') {
    return lower.replace(/(ungen|heiten|keiten|ern|en|er|es|em|e|s)$/u, '');
  }
  return lower.replace(
    /(ыми|ими|ями|ами|ого|его|ому|ему|ною|ной|ою|ею|ах|ях|ов|ев|ей|ие|ые|ое|ее|ая|яя|ую|юю|ый|ий|ой|ом|ем|а|я|у|ю|ы|и|е|о|ь)$/u,
    ''
  );
}

function buildExplicitRegexes(phrases: string[]): RegExp[] {
  return phrases
    .map((phrase) => phrase.trim())
    .filter(Boolean)
    .map((phrase) => {
      const escaped = escapeRegExp(phrase).replace(/\s+/g, '\\s+');
      const startsWithWordChar = /^[\p{L}\p{N}]/u.test(phrase);
      const endsWithWordChar = /[\p{L}\p{N}]$/u.test(phrase);
      const prefix = startsWithWordChar ? '(?<![\\p{L}\\p{N}])' : '';
      const suffix = endsWithWordChar ? '(?![\\p{L}\\p{N}])' : '';
      return new RegExp(`${prefix}${escaped}${suffix}`, 'giu');
    });
}

function buildDerivedRegexes(rawTerm: string, lang: 'de' | 'ru'): RegExp[] {
  const stopWords = lang === 'de' ? STOP_WORDS_DE : STOP_WORDS_RU;
  const parentheticals: string[] = [];
  const withoutParens = rawTerm.replace(/\(([^)]*)\)/g, (_, inner: string) => {
    parentheticals.push(inner);
    return ' ';
  });

  const primarySegments = withoutParens
    .split(/[\/·,—]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const secondarySegments = parentheticals
    .flatMap((inner) => inner.split(/[\/·,—]+/))
    .map((s) => s.trim())
    .filter(Boolean);

  const orderedSegments: string[] = [];
  for (const segment of [...primarySegments, ...secondarySegments]) {
    orderedSegments.push(segment);
    const splitSubs = segment
      .split(lang === 'de' ? /\s+und\s+/i : /\s+и\s+/i)
      .map((s) => s.trim())
      .filter(Boolean);
    if (splitSubs.length > 1) {
      orderedSegments.push(...splitSubs);
    }
  }

  const regexes: RegExp[] = [];
  const seen = new Set<string>();

  for (const segment of orderedSegments) {
    const tokens = (segment.match(/[\p{L}\p{N}]+/gu) ?? []).filter(
      (w) => !stopWords.has(w.toLowerCase())
    );
    const usable = tokens.filter((w) => w.length >= 3 || /^\d+$/.test(w));
    if (usable.length === 0) continue;
    if (usable.length === 1 && usable[0].length < 5) continue;

    const tokenPatterns = usable.map((word) => {
      const stemmed = stemWord(word, lang);
      const root = stemmed.length >= 3 ? stemmed : word.toLowerCase();
      return `${escapeRegExp(root)}[\\p{L}\\p{N}]*`;
    });

    const pattern = `(?<![\\p{L}\\p{N}])${tokenPatterns.join('[^.;!?\\n]{1,22}?')}(?![\\p{L}\\p{N}])`;
    if (!seen.has(pattern)) {
      seen.add(pattern);
      regexes.push(new RegExp(pattern, 'giu'));
    }
  }

  return regexes;
}

function getRegexesForTerm(term: ArchitecturalTerm, lang: 'de' | 'ru'): RegExp[] {
  const explicit = lang === 'de' ? term.highlightDe : term.highlightRu;
  if (explicit && explicit.length > 0) {
    return buildExplicitRegexes(explicit);
  }
  const raw = lang === 'de' ? term.de : term.ru;
  return buildDerivedRegexes(raw, lang);
}

interface TermSpan {
  start: number;
  end: number;
  term: ArchitecturalTerm;
  isActive: boolean;
}

function findMatchesForTerms(
  text: string,
  terms: ArchitecturalTerm[],
  activeTerm: ArchitecturalTerm | null | undefined,
  lang: 'de' | 'ru'
): TermSpan[] {
  if (!text || terms.length === 0) return [];

  const candidates: TermSpan[] = [];

  for (const term of terms) {
    const isActive = Boolean(activeTerm && activeTerm.de === term.de);
    const regexes = getRegexesForTerm(term, lang);

    for (const regex of regexes) {
      for (const match of text.matchAll(regex)) {
        if (match.index === undefined || match[0].length === 0) continue;
        candidates.push({
          start: match.index,
          end: match.index + match[0].length,
          term,
          isActive,
        });
      }
    }
  }

  if (candidates.length === 0) return [];

  // Active term spans take highest priority; otherwise prefer longer then earlier spans.
  candidates.sort((a, b) => {
    if (a.isActive !== b.isActive) return a.isActive ? -1 : 1;
    const lenDiff = b.end - b.start - (a.end - a.start);
    if (lenDiff !== 0) return lenDiff;
    return a.start - b.start;
  });

  const accepted: TermSpan[] = [];
  for (const candidate of candidates) {
    const overlaps = accepted.some(
      (existing) => candidate.start < existing.end && candidate.end > existing.start
    );
    if (!overlaps) {
      accepted.push(candidate);
    }
  }

  accepted.sort((a, b) => a.start - b.start);
  return accepted;
}

export function highlightTermsInText(
  text: string,
  terms: ArchitecturalTerm[],
  activeTerm: ArchitecturalTerm | null | undefined,
  lang: 'de' | 'ru',
  onTermClick?: (term: ArchitecturalTerm) => void
): ReactNode {
  if (!text || terms.length === 0) return text;

  const spans = findMatchesForTerms(text, terms, activeTerm, lang);
  if (spans.length === 0) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  spans.forEach((span, idx) => {
    if (span.start > lastIndex) {
      nodes.push(text.slice(lastIndex, span.start));
    }

    const matchedText = text.slice(span.start, span.end);
    const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
      if (!onTermClick) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onTermClick(span.term);
      }
    };

    if (span.isActive) {
      nodes.push(
        <mark
          key={`${span.start}-${span.end}-${idx}`}
          data-term-highlight="true"
          role={onTermClick ? 'button' : undefined}
          tabIndex={onTermClick ? 0 : undefined}
          onClick={onTermClick ? () => onTermClick(span.term) : undefined}
          onKeyDown={onTermClick ? handleKeyDown : undefined}
          title={
            onTermClick
              ? `${span.term.de} — ${span.term.ru} (перейти в «Терминологию»)`
              : undefined
          }
          className={`bg-[#9A3412]/16 text-[#1C1917] border-b-2 border-[#9A3412]/70 px-0.5 rounded-[2px] ${
            onTermClick
              ? 'cursor-pointer hover:bg-[#9A3412]/22 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]'
              : ''
          }`}
        >
          {matchedText}
        </mark>
      );
    } else {
      nodes.push(
        <span
          key={`${span.start}-${span.end}-${idx}`}
          role={onTermClick ? 'button' : undefined}
          tabIndex={onTermClick ? 0 : undefined}
          onClick={onTermClick ? () => onTermClick(span.term) : undefined}
          onKeyDown={onTermClick ? handleKeyDown : undefined}
          title={`${span.term.de} — ${span.term.ru} (нажмите, чтобы перейти в «Терминологию»)`}
          className="bg-[#9A3412]/[0.04] hover:bg-[#9A3412]/12 border-b border-dotted border-[#9A3412]/40 hover:border-solid hover:border-[#9A3412]/75 px-[1px] rounded-[1px] cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
        >
          {matchedText}
        </span>
      );
    }

    lastIndex = span.end;
  });

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}
