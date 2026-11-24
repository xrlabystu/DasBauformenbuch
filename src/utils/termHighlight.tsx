import type { KeyboardEvent, ReactNode } from 'react';
import { BRAUSEWETTER_PAGES, type ArchitecturalTerm } from '../data/brausewetter_1895';

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

export interface SearchHighlightOptions {
  query: string;
  startOffset?: number;
  activeOffset?: number | null;
}

interface SearchSpan {
  start: number;
  end: number;
  occurrenceIndex: number;
}

function buildSearchRegex(query: string): RegExp | null {
  const normalized = query.trim();
  if (!normalized) return null;
  const pattern = escapeRegExp(normalized).replace(/\s+/g, '\\s+');
  return new RegExp(pattern, 'giu');
}

function findSearchSpans(text: string, query: string): SearchSpan[] {
  if (!text) return [];
  const regex = buildSearchRegex(query);
  if (!regex) return [];
  const spans: SearchSpan[] = [];
  let idx = 0;
  for (const match of text.matchAll(regex)) {
    if (match.index === undefined || match[0].length === 0) continue;
    spans.push({
      start: match.index,
      end: match.index + match[0].length,
      occurrenceIndex: idx,
    });
    idx += 1;
  }
  return spans;
}

export function countSearchMatches(text: string, query: string): number {
  return findSearchSpans(text, query).length;
}

export function highlightPlainTextWithSearch(
  text: string,
  search?: SearchHighlightOptions
): ReactNode {
  if (!text || !search || !search.query.trim()) return text;
  const spans = findSearchSpans(text, search.query);
  if (spans.length === 0) return text;

  const base = search.startOffset ?? 0;
  const active = search.activeOffset ?? null;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const span of spans) {
    if (span.start > lastIndex) {
      nodes.push(text.slice(lastIndex, span.start));
    }
    const globalIdx = base + span.occurrenceIndex;
    const isActive = active !== null && globalIdx === active;
    nodes.push(
      <mark
        key={`search-${span.start}-${span.end}-${globalIdx}`}
        data-search-match="true"
        data-search-active={isActive ? 'true' : undefined}
        className={
          isActive
            ? 'bg-[#EA580C] text-[#FBF9F5] px-0.5 rounded-[2px] ring-2 ring-[#9A3412] font-medium'
            : 'bg-[#FDE047]/80 text-[#1C1917] px-0.5 rounded-[2px] border-b border-[#CA8A04]'
        }
      >
        {text.slice(span.start, span.end)}
      </mark>
    );
    lastIndex = span.end;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function renderTermSpanNode(
  matchedText: string,
  span: TermSpan,
  key: string,
  onTermClick?: (term: ArchitecturalTerm) => void
): ReactNode {
  const handleKeyDown = (e: KeyboardEvent<HTMLSpanElement>) => {
    if (!onTermClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onTermClick(span.term);
    }
  };

  if (span.isActive) {
    return (
      <mark
        key={key}
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
  }

  return (
    <span
      key={key}
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

export function highlightTermsInText(
  text: string,
  terms: ArchitecturalTerm[],
  activeTerm: ArchitecturalTerm | null | undefined,
  lang: 'de' | 'ru',
  onTermClick?: (term: ArchitecturalTerm) => void,
  search?: SearchHighlightOptions
): ReactNode {
  if (!text) return text;
  const searchSpans = search?.query?.trim() ? findSearchSpans(text, search.query) : [];
  if (terms.length === 0 && searchSpans.length === 0) return text;

  const rawTermSpans = findMatchesForTerms(text, terms, activeTerm, lang);
  const termSpans =
    searchSpans.length === 0
      ? rawTermSpans
      : rawTermSpans.filter(
          (ts) => !searchSpans.some((ss) => ts.start < ss.end && ts.end > ss.start)
        );

  if (termSpans.length === 0 && searchSpans.length === 0) return text;

  const baseOffset = search?.startOffset ?? 0;
  const activeOffset = search?.activeOffset ?? null;

  type CombinedItem =
    | { kind: 'term'; span: TermSpan }
    | { kind: 'search'; span: SearchSpan };

  const combined: CombinedItem[] = [
    ...termSpans.map((span): CombinedItem => ({ kind: 'term', span })),
    ...searchSpans.map((span): CombinedItem => ({ kind: 'search', span })),
  ].sort((a, b) => a.span.start - b.span.start);

  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  combined.forEach((item, idx) => {
    if (item.span.start > lastIndex) {
      nodes.push(text.slice(lastIndex, item.span.start));
    }

    const matchedText = text.slice(item.span.start, item.span.end);
    if (item.kind === 'search') {
      const globalIdx = baseOffset + item.span.occurrenceIndex;
      const isActive = activeOffset !== null && globalIdx === activeOffset;
      nodes.push(
        <mark
          key={`search-${item.span.start}-${item.span.end}-${globalIdx}`}
          data-search-match="true"
          data-search-active={isActive ? 'true' : undefined}
          className={
            isActive
              ? 'bg-[#EA580C] text-[#FBF9F5] px-0.5 rounded-[2px] ring-2 ring-[#9A3412] font-medium'
              : 'bg-[#FDE047]/80 text-[#1C1917] px-0.5 rounded-[2px] border-b border-[#CA8A04]'
          }
        >
          {matchedText}
        </mark>
      );
    } else {
      nodes.push(
        renderTermSpanNode(
          matchedText,
          item.span,
          `term-${item.span.start}-${item.span.end}-${idx}`,
          onTermClick
        )
      );
    }

    lastIndex = item.span.end;
  });

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function highlightRuleAndTermsInText(
  text: string,
  terms: ArchitecturalTerm[],
  activeTerm: ArchitecturalTerm | null | undefined,
  lang: 'de' | 'ru',
  onTermClick?: (term: ArchitecturalTerm) => void,
  activeRuleQuote?: string | null,
  search?: SearchHighlightOptions
): ReactNode {
  const quote = activeRuleQuote?.trim();
  if (!text || !quote) {
    return highlightTermsInText(text, terms, activeTerm, lang, onTermClick, search);
  }

  const normalizedQuote = quote.replace(/\s+/g, ' ');
  const pattern = escapeRegExp(normalizedQuote).replace(/\\ /g, '\\s+');
  const regex = new RegExp(pattern, 'iu');
  const match = regex.exec(text);

  if (!match || match.index === undefined || match[0].length === 0) {
    return highlightTermsInText(text, terms, activeTerm, lang, onTermClick, search);
  }

  const start = match.index;
  const end = start + match[0].length;
  const before = text.slice(0, start);
  const matched = text.slice(start, end);
  const after = text.slice(end);

  const beforeMatches = search?.query?.trim() ? countSearchMatches(before, search.query) : 0;
  const matchedMatches = search?.query?.trim() ? countSearchMatches(matched, search.query) : 0;
  const baseOffset = search?.startOffset ?? 0;

  return (
    <>
      {before
        ? highlightTermsInText(before, terms, activeTerm, lang, onTermClick, search)
        : null}
      <mark
        data-rule-highlight="true"
        className="bg-[#FDE68A]/85 text-[#1C1917] border-b-2 border-[#B91C1C] px-1 py-0.5 rounded-[2px] font-medium"
      >
        {matchedMatches > 0 && search
          ? highlightPlainTextWithSearch(matched, {
              ...search,
              startOffset: baseOffset + beforeMatches,
            })
          : matched}
      </mark>
      {after
        ? highlightTermsInText(
            after,
            terms,
            activeTerm,
            lang,
            onTermClick,
            search
              ? {
                  ...search,
                  startOffset: baseOffset + beforeMatches + matchedMatches,
                }
              : undefined
          )
        : null}
    </>
  );
}

// ==================================================
// Кликабельные ссылки на термины «Терминологии» из калькулятора
// ==================================================

export interface GlossaryLookupEntry {
  pageId: string;
  pageNumber: string;
  term: ArchitecturalTerm;
}

const ALL_GLOSSARY_ENTRIES: GlossaryLookupEntry[] = BRAUSEWETTER_PAGES.flatMap((page) =>
  page.terms.map((term) => ({
    pageId: page.id,
    pageNumber: page.pageNumber,
    term,
  }))
);

interface GlossaryRuleSpec {
  pattern: string;
  termDe: string;
}

const GLOSSARY_LINK_SPECS: GlossaryRuleSpec[] = [
  // Сначала более длинные фразы и специфичные термины
  { pattern: 'золотое\\s+сечение|золотого\\s+сечения|золотому\\s+сечению|золотом\\s+сечении|goldener?\\s+schnitt', termDe: 'der goldene Schnitt' },
  { pattern: 'межоконн(?:ый|ого|ому|ом|ых)\\s+простен(?:ок|ка|ку|ке|ков)|zwischenpfeiler', termDe: 'der Zwischenpfeiler' },
  { pattern: 'углов(?:ой|ого|ому|ом)\\s+простен(?:ок|ка|ку)|углов(?:ого|ой)\\s+уст(?:ой|оя)|eckpfeiler', termDe: 'der Eckpfeiler' },
  { pattern: 'главн(?:ый|ого|ому|ом|ым)\\s+карниз(?:а|у|ом|е)?|венчающ(?:ий|его)\\s+карниз(?:а)?|hauptgesims', termDe: 'Hauptgesims-Verhältnisse' },
  { pattern: 'поясн(?:ой|ого|ому|ом)\\s+карниз(?:а|у|ом)?|межэтажн(?:ый|ого|ая|ой|ую)\\s+(?:карниз|лент)(?:а|ы|е|у|ой)?|междуэтажн(?:ый|ого)\\s+карниз|gurtgesims(?:e)?', termDe: 'Gurt- / Sohlbankgesimse' },
  { pattern: 'подоконн(?:ая|ой|ую)\\s+плит(?:а|ы|у|ой)|внешний\\s+подоконник|sohlbank', termDe: 'die Sohlbank' },
  { pattern: 'подоконн(?:ый|ого|ому)\\s+карниз(?:а|у)?|sohlbankgesims(?:e)?', termDe: 'das Sohlbankgesimse' },
  { pattern: 'подоконн(?:ая|ой)\\s+стен(?:а|е)-парапет|brüstung', termDe: 'die Brüstung (als Fuss für den Oberbau)' },
  { pattern: 'трёхчастн(?:ый|ого|ом|ая)\\s+цокол(?:ь|я|ю|ем|е)|dreiteiliger?\\s+sockel|fuss,?\\s*rumpf\\s*und\\s*deckglied', termDe: 'Fuss, Rumpf und Deckglied (dreiteiliger Sockel)' },
  { pattern: 'боков(?:ой|ого|ые|ых)\\s+ризалит(?:а|ы|ов)?|seitenrisalit(?:e)?', termDe: 'der Seitenrisalit (und rückspringender Mittelteil)' },
  { pattern: 'центральн(?:ый|ого)\\s+ризалит(?:а|у)?|средн(?:ий|его)\\s+ризалит(?:а)?|mittelrisalit', termDe: 'Mittelrisalit und Rücklagen' },
  { pattern: 'спаренн(?:ые|ых)\\s+пилястр(?:ы|ов)?|gekuppelte\\s+pilaster', termDe: 'gekuppelte Pilaster' },
  { pattern: 'трёхчетвертн(?:ая|ой)\\s+колонн(?:а|ы)|dreiviertelsäule', termDe: 'die Dreiviertelsäule / Halbsäule' },
  { pattern: 'полуколонн(?:а|ы|ой)?|halbsäule', termDe: 'die Dreiviertelsäule / Halbsäule' },
  { pattern: 'шовн(?:ое|ого)\\s+членени(?:е|я)|fugenteilung', termDe: 'Fugenteilung / Fussprofil' },
  { pattern: 'базов(?:ый|ого)\\s+профил(?:ь|я)|fussprofil', termDe: 'Fugenteilung / Fussprofil' },
  { pattern: 'углов(?:ая|ой)\\s+рустовк(?:а|и)|углов(?:ая|ой)\\s+перевязк(?:а|и)|eckarmierung', termDe: 'die Eckarmierung' },
  { pattern: 'ряд(?:ы|ов|а)?\\s+руста|квадров(?:ой|ая)\\s+кладк(?:а|и)|quaderschicht', termDe: 'die Quaderschicht' },
  { pattern: 'слёзн(?:ая|ой)\\s+плит(?:а|ы)|слезник|hängeplatte|wassernase', termDe: 'die Hängeplatte / Wassernase' },
  { pattern: 'лежач(?:ие|их)\\s+консол(?:и|ей)|liegende\\s+konsolen', termDe: 'liegende Konsolen' },
  { pattern: 'стояч(?:ие|их)\\s+консол(?:и|ей)|stehenden?\\s+konsolen', termDe: 'stehende Konsolen' },
  { pattern: 'баз(?:а|е|ой|у|ы)\\s+и\\s+капител(?:ь|и|ью)|basis\\s+und\\s+kapitäl', termDe: 'Fuss- und Kopfgliederung (Basis und Kapitäl)' },
  { pattern: 'сдвоенн(?:ые|ых)\\s+ок(?:на|он)|gekuppelte\\s+fenster', termDe: 'gekuppelte Fenster' },
  { pattern: 'лежач(?:ий|его|ее)\\s+прямоугольник|liegende(?:s)?\\s+rechteck', termDe: 'das liegende / stehende Rechteck' },
  { pattern: 'стояч(?:ий|его|ее)\\s+прямоугольник|stehende(?:s)?\\s+rechteck', termDe: 'das liegende / stehende Rechteck' },
  { pattern: 'высота\\s+комнат(?:ы)?|zimmerhöhe', termDe: 'die Zimmerhöhe' },
  { pattern: 'шаг\\s+осей|шага\\s+осей|межосев(?:ое|ые|ых)\\s+расстояни(?:е|я|й)|axenweite(?:n)?', termDe: 'die Axenweiten' },
  { pattern: 'встроенн(?:ый|ого|ом)\\s+(?:городской\\s+)?дом(?:а|е)?|eingebautes\\s+wohnhaus', termDe: 'eingebautes Wohnhaus (Stadthaus)' },
  { pattern: 'доходн(?:ый|ого|ом)\\s+дом(?:а|е)?|miethaus', termDe: 'das Miethaus' },
  { pattern: 'бюргерск(?:ий|ого)\\s+дом|городской\\s+дом|das\\s+einfache\\s+bürgerhaus', termDe: 'das einfache Bürgerhaus (städtisches Wohnhaus)' },
  { pattern: 'одноэтажн(?:ый|ого|ом)\\s+(?:жилой\\s+)?дом|ebenerdige\\s+wohnhaus', termDe: 'das ebenerdige Wohnhaus' },
  { pattern: 'дворц(?:овое|е|а)|palastbau', termDe: 'der Palastbau' },
  { pattern: 'аттиков(?:ое|ого)\\s+венчани(?:е|я)|аттик(?:а|у|ом|е)?|attikakrönung|attika', termDe: 'die Attikakrönung / Attika' },
  { pattern: 'сандрик(?:а|у|ом|е|ов)?|verdachung', termDe: 'die Verdachung' },
  { pattern: 'наличник(?:а|у|ом|е|ов)?|обрамлени(?:е|я|ю|ем|и)|umrahmung', termDe: 'die Umrahmung (der Rahmen)' },
  { pattern: 'архитрав(?:а|у|ом|е|ные)?', termDe: 'Architrav, Fries und Kranz' },
  { pattern: 'раскреповк(?:а|и|у|ой|е|ам)?|abkröpfung', termDe: 'die Abkröpfung' },
  { pattern: 'вынос(?:а|у|ом|е)?\\s+(?:карниза|сандрика)|ausladung', termDe: 'die Ausladung' },
  { pattern: 'ризалит(?:а|у|ом|е|ы|ов)?|risalit(?:e|en)?', termDe: 'Mittel- und Seitenrisalite / Rücklagen' },
  { pattern: 'западающ(?:ая|ие|их)\\s+(?:част(?:ь|и)|крыль(?:я|ев))|rücklage(?:n)?', termDe: 'Mittel- und Seitenrisalite / Rücklagen' },
  { pattern: 'лопатк(?:а|и|у|ой|е|ам)|лизен(?:а|ы|у|е)|mauerpfeiler|lisene(?:n)?', termDe: 'der Mauerpfeiler (die Lisene)' },
  { pattern: 'пилястр(?:а|у|ом|е|ы|ов)?|pilaster', termDe: 'der Vorsprung des Pilasters' },
  { pattern: 'цокол(?:ь|я|ю|ем|е)|sockel', termDe: 'Sockel-, Gurt- und Hauptgesims' },
  { pattern: 'выкружк(?:а|и|ой)|гусёк|четвертн(?:ой|ая)\\s+вал|каблучок|eierstab|perlschnur|karnies|viertelkehle|viertelstab', termDe: 'Viertelkehle und Viertelstab' },
  { pattern: 'каннелюр(?:ы|ами)?|каннелировани(?:е|я)|kanellierung', termDe: 'die Kanellierung' },
  { pattern: 'филёнк(?:а|и|ой)|füllungstafel', termDe: 'die Füllungstafel / Nischenöffnung' },
  { pattern: 'простен(?:ок|ка|ку|ке|ков)', termDe: 'der Zwischenpfeiler' },
  { pattern: 'консол(?:ь|и|ей|ями|ях)', termDe: 'das Deckglied der Konsole' },
  { pattern: 'портал(?:а|у|ом|е)?', termDe: 'das Portal' },
];

export function findGlossaryEntryByTerm(keyword: string): GlossaryLookupEntry | undefined {
  const q = keyword.trim().toLowerCase();
  if (!q) return undefined;

  for (const spec of GLOSSARY_LINK_SPECS) {
    if (spec.termDe.toLowerCase() === q) {
      const hit = ALL_GLOSSARY_ENTRIES.find((e) => e.term.de === spec.termDe);
      if (hit) return hit;
    }
  }

  for (const spec of GLOSSARY_LINK_SPECS) {
    if (new RegExp(`(?:${spec.pattern})`, 'iu').test(keyword)) {
      const hit = ALL_GLOSSARY_ENTRIES.find((e) => e.term.de === spec.termDe);
      if (hit) return hit;
    }
  }

  return ALL_GLOSSARY_ENTRIES.find(
    (entry) =>
      entry.term.de.toLowerCase().includes(q) || entry.term.ru.toLowerCase().includes(q)
  );
}

const COMBINED_GLOSSARY_REGEX = new RegExp(
  GLOSSARY_LINK_SPECS.map((spec, idx) => `(?<t${idx}>${spec.pattern})`).join('|'),
  'giu'
);

export function TermLink({
  entry,
  children,
  onOpenGlossaryTerm,
  insideLabel = false,
}: {
  entry: GlossaryLookupEntry;
  children: ReactNode;
  onOpenGlossaryTerm?: (entry: GlossaryLookupEntry) => void;
  insideLabel?: boolean;
}) {
  if (!onOpenGlossaryTerm) return <>{children}</>;

  const title = `${entry.term.de} — ${entry.term.ru} (стр. ${entry.pageNumber} · открыть в «Терминологии»)`;
  const className =
    'underline decoration-dotted decoration-[#9A3412]/65 underline-offset-2 text-[#9A3412] hover:text-[#7C2D12] hover:decoration-solid cursor-pointer transition-colors';

  if (insideLabel) {
    return (
      <span
        role="button"
        tabIndex={0}
        title={title}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onOpenGlossaryTerm(entry);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onOpenGlossaryTerm(entry);
          }
        }}
        className={className}
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onOpenGlossaryTerm(entry);
      }}
      className={`${className} inline text-left`}
    >
      {children}
    </button>
  );
}

export function TextWithGlossaryLinks({
  text,
  onOpenGlossaryTerm,
  insideLabel = false,
}: {
  text: string;
  onOpenGlossaryTerm?: (entry: GlossaryLookupEntry) => void;
  insideLabel?: boolean;
}): ReactNode {
  if (!text || !onOpenGlossaryTerm) return text;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let keyCounter = 0;

  for (const match of text.matchAll(COMBINED_GLOSSARY_REGEX)) {
    if (match.index === undefined || match[0].length === 0) continue;
    const start = match.index;
    const end = start + match[0].length;

    // Границы слова (избегаем подстроки внутри более длинного слова)
    const prevChar = start > 0 ? text[start - 1] : '';
    const nextChar = end < text.length ? text[end] : '';
    if (/[\p{L}\p{N}]/u.test(prevChar) || /[\p{L}\p{N}]/u.test(nextChar)) {
      continue;
    }

    let matchedSpec: GlossaryRuleSpec | undefined;
    if (match.groups) {
      for (let i = 0; i < GLOSSARY_LINK_SPECS.length; i += 1) {
        if (match.groups[`t${i}`] !== undefined) {
          matchedSpec = GLOSSARY_LINK_SPECS[i];
          break;
        }
      }
    }
    if (!matchedSpec) continue;

    const entry = ALL_GLOSSARY_ENTRIES.find((e) => e.term.de === matchedSpec!.termDe);
    if (!entry) continue;

    if (start > lastIndex) {
      nodes.push(text.slice(lastIndex, start));
    }

    nodes.push(
      <TermLink
        key={`gl-${start}-${keyCounter++}`}
        entry={entry}
        onOpenGlossaryTerm={onOpenGlossaryTerm}
        insideLabel={insideLabel}
      >
        {match[0]}
      </TermLink>
    );

    lastIndex = end;
  }

  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

