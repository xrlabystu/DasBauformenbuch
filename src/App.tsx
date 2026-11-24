import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import {
  BOOK_METADATA,
  BRAUSEWETTER_PAGES,
  type ArchitecturalTerm,
  type BookPage,
} from './data/brausewetter_1895';
import { FacsimileViewer } from './components/FacsimileViewer';
import {
  FacadeCalculatorPage,
  type CalculatorSubpage,
} from './components/FacadeCalculatorPage';
import {
  createDefaultParamsForTypology,
  type FacadeParameters,
  type FacadeTargetElement,
} from './calc/rules';
import type { LockedParamsMap } from './calc/paramLocks';
import type { CalculatorModuleId } from './components/calculator/CalculatorModules';
import type { AnalyticalPlateId } from './components/calculator/AnalyticalPlates';
import {
  countSearchMatches,
  highlightPlainTextWithSearch,
  highlightRuleAndTermsInText,
  highlightTermsInText,
  type GlossaryLookupEntry,
} from './utils/termHighlight';
import type { RuleBookExcerpt } from './calc/ruleBookRefs';

type ActiveSection = 'reader' | 'calculator' | 'glossary' | 'provenance';
type TextMode = 'parallel' | 'de' | 'ru';

interface CalcSnapshot {
  params: FacadeParameters;
  lockedParams: LockedParamsMap;
}

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('reader');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [textMode, setTextMode] = useState<TextMode>('parallel');
  const [showFacsimile, setShowFacsimile] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<{
    pageId: string;
    term: ArchitecturalTerm;
  } | null>(null);
  const [focusedGlossaryTerm, setFocusedGlossaryTerm] = useState<{
    pageId: string;
    pageNumber: string;
    term: ArchitecturalTerm;
  } | null>(null);
  const [glossaryReturnTarget, setGlossaryReturnTarget] = useState<'reader' | 'calculator'>('reader');
  const [selectedRuleExcerpt, setSelectedRuleExcerpt] = useState<RuleBookExcerpt | null>(null);
  const [readerSearchQuery, setReaderSearchQuery] = useState('');
  const [readerMatchIndex, setReaderMatchIndex] = useState(0);
  const [glossarySearchQuery, setGlossarySearchQuery] = useState('');
  const [glossaryMatchIndex, setGlossaryMatchIndex] = useState(0);

  // Сессионное состояние калькулятора (сбрасывается только при обновлении страницы или по «Сбросить к примеру из книги»)
  const [calcSubpage, setCalcSubpage] = useState<CalculatorSubpage>('workspace');
  const [calcExpertMode, setCalcExpertMode] = useState<boolean>(false);
  const [calcActiveModule, setCalcActiveModule] = useState<CalculatorModuleId>('axes');
  const [calcActivePlate, setCalcActivePlate] = useState<AnalyticalPlateId>('fan');
  const [calcHighlightedElement, setCalcHighlightedElement] = useState<FacadeTargetElement | null>(null);
  const [calcHistory, setCalcHistory] = useState<{
    past: CalcSnapshot[];
    present: CalcSnapshot;
    future: CalcSnapshot[];
  }>(() => ({
    past: [],
    present: {
      params: createDefaultParamsForTypology('urban_house'),
      lockedParams: {},
    },
    future: [],
  }));
  const calcBurstRef = useRef<{ time: number; key: string } | null>(null);

  const pages = BRAUSEWETTER_PAGES;
  const page: BookPage = pages[currentPageIndex] ?? pages[0];
  const activeTerm = selectedTerm?.pageId === page.id ? selectedTerm.term : null;
  const activeRuleExcerpt =
    selectedRuleExcerpt && Number(page.pageNumber) === selectedRuleExcerpt.pageNumber
      ? selectedRuleExcerpt
      : null;

  const readerMatches = useMemo(() => {
    const q = readerSearchQuery.trim();
    if (!q) return [] as Array<{ pageIndex: number; localOffset: number }>;

    const matches: Array<{ pageIndex: number; localOffset: number }> = [];
    pages.forEach((p, pageIdx) => {
      let countOnPage = 0;
      const collect = (txt?: string) => {
        if (!txt) return;
        const c = countSearchMatches(txt, q);
        for (let i = 0; i < c; i += 1) {
          matches.push({ pageIndex: pageIdx, localOffset: countOnPage + i });
        }
        countOnPage += c;
      };

      if (textMode !== 'ru') collect(p.sectionTitleDe);
      if (textMode !== 'de') collect(p.sectionTitleRu);
      for (const para of p.paragraphs) {
        if (textMode !== 'ru') collect(para.subheadingDe);
        if (textMode !== 'de') collect(para.subheadingRu);
        if (textMode !== 'ru') collect(para.subsubheadingDe);
        if (textMode !== 'de') collect(para.subsubheadingRu);
        if (textMode !== 'ru') collect(para.de);
        if (textMode !== 'de') collect(para.ru);
      }
      if (p.figures) {
        for (const fig of p.figures) {
          if (textMode !== 'ru') collect(fig.captionDe);
          if (textMode !== 'de') collect(fig.captionRu);
        }
      }
      collect(p.editorialNote);
    });
    return matches;
  }, [pages, readerSearchQuery, textMode]);

  const clampedReaderMatchIndex =
    readerMatches.length > 0 ? Math.min(readerMatchIndex, readerMatches.length - 1) : 0;
  const activeReaderMatch = readerMatches[clampedReaderMatchIndex] ?? null;
  const activePageSearchOffset =
    activeReaderMatch && activeReaderMatch.pageIndex === currentPageIndex
      ? activeReaderMatch.localOffset
      : null;

  const currentPageSearchLayout = useMemo(() => {
    const q = readerSearchQuery.trim();
    let offset = 0;
    const take = (txt?: string) => {
      const start = offset;
      if (q && txt) offset += countSearchMatches(txt, q);
      return start;
    };
    const titleDe = textMode !== 'ru' ? take(page.sectionTitleDe) : 0;
    const titleRu = textMode !== 'de' ? take(page.sectionTitleRu) : 0;
    const paragraphs = page.paragraphs.map((para) => ({
      subDe: textMode !== 'ru' && para.subheadingDe ? take(para.subheadingDe) : 0,
      subRu: textMode !== 'de' && para.subheadingRu ? take(para.subheadingRu) : 0,
      subsubDe: textMode !== 'ru' && para.subsubheadingDe ? take(para.subsubheadingDe) : 0,
      subsubRu: textMode !== 'de' && para.subsubheadingRu ? take(para.subsubheadingRu) : 0,
      de: textMode !== 'ru' ? take(para.de) : 0,
      ru: textMode !== 'de' ? take(para.ru) : 0,
    }));
    const figures = (page.figures ?? []).map((fig) => ({
      de: textMode !== 'ru' ? take(fig.captionDe) : 0,
      ru: textMode !== 'de' ? take(fig.captionRu) : 0,
    }));
    const editorial = page.editorialNote ? take(page.editorialNote) : 0;
    return { titleDe, titleRu, paragraphs, figures, editorial };
  }, [page, readerSearchQuery, textMode]);

  const glossaryEntries = useMemo(
    () =>
      pages.flatMap((p, pageIdx) =>
        p.terms.map((term) => ({
          key: `${p.id}-${term.de}`,
          pageIdx,
          pageId: p.id,
          pageNumber: p.pageNumber,
          term,
        }))
      ),
    [pages]
  );

  const glossarySearchLayout = useMemo(() => {
    const q = glossarySearchQuery.trim();
    let total = 0;
    const offsets = glossaryEntries.map((entry) => {
      const de = total;
      if (q) total += countSearchMatches(entry.term.de, q);
      const ru = total;
      if (q) total += countSearchMatches(entry.term.ru, q);
      const context = total;
      if (q) total += countSearchMatches(entry.term.context, q);
      return {
        de,
        ru,
        context,
        hasAny: total > de,
      };
    });
    return { total, offsets };
  }, [glossaryEntries, glossarySearchQuery]);

  const clampedGlossaryMatchIndex =
    glossarySearchLayout.total > 0
      ? Math.min(glossaryMatchIndex, glossarySearchLayout.total - 1)
      : 0;

  const handleReaderSearchChange = (value: string) => {
    setReaderSearchQuery(value);
    setReaderMatchIndex(0);
    const q = value.trim();
    if (!q) return;
    // Переходим сразу к первому найденному фрагменту
    for (let pageIdx = 0; pageIdx < pages.length; pageIdx += 1) {
      const p = pages[pageIdx];
      let found = false;
      const check = (txt?: string) => {
        if (!found && txt && countSearchMatches(txt, q) > 0) found = true;
      };
      if (textMode !== 'ru') check(p.sectionTitleDe);
      if (textMode !== 'de') check(p.sectionTitleRu);
      for (const para of p.paragraphs) {
        if (textMode !== 'ru') check(para.subheadingDe);
        if (textMode !== 'de') check(para.subheadingRu);
        if (textMode !== 'ru') check(para.subsubheadingDe);
        if (textMode !== 'de') check(para.subsubheadingRu);
        if (textMode !== 'ru') check(para.de);
        if (textMode !== 'de') check(para.ru);
      }
      if (p.figures) {
        for (const fig of p.figures) {
          if (textMode !== 'ru') check(fig.captionDe);
          if (textMode !== 'de') check(fig.captionRu);
        }
      }
      check(p.editorialNote);
      if (found) {
        setCurrentPageIndex(pageIdx);
        break;
      }
    }
  };

  const navigateReaderMatch = (delta: number) => {
    if (readerMatches.length === 0) return;
    const nextIdx = (clampedReaderMatchIndex + delta + readerMatches.length) % readerMatches.length;
    setReaderMatchIndex(nextIdx);
    const target = readerMatches[nextIdx];
    if (target) {
      setCurrentPageIndex(target.pageIndex);
    }
  };

  const handleGlossarySearchChange = (value: string) => {
    setGlossarySearchQuery(value);
    setGlossaryMatchIndex(0);
  };

  const navigateGlossaryMatch = (delta: number) => {
    if (glossarySearchLayout.total === 0) return;
    setGlossaryMatchIndex(
      (clampedGlossaryMatchIndex + delta + glossarySearchLayout.total) %
        glossarySearchLayout.total
    );
  };

  useEffect(() => {
    if (activeSection !== 'reader' || !activeTerm) return;
    const frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-term-highlight="true"]');
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, currentPageIndex, activeTerm]);

  useEffect(() => {
    if (activeSection !== 'reader' || !activeRuleExcerpt) return;
    const frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-rule-highlight="true"]');
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, currentPageIndex, activeRuleExcerpt]);

  useEffect(() => {
    if (activeSection !== 'reader' || !readerSearchQuery.trim() || readerMatches.length === 0) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-search-active="true"]');
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, currentPageIndex, readerSearchQuery, clampedReaderMatchIndex, readerMatches.length]);

  useEffect(() => {
    if (activeSection !== 'glossary' || !focusedGlossaryTerm) return;
    const frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-glossary-term="true"]');
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, focusedGlossaryTerm]);

  useEffect(() => {
    if (
      activeSection !== 'glossary' ||
      !glossarySearchQuery.trim() ||
      glossarySearchLayout.total === 0
    ) {
      return;
    }
    const frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-search-active="true"]');
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [
    activeSection,
    glossarySearchQuery,
    clampedGlossaryMatchIndex,
    glossarySearchLayout.total,
  ]);

  const handleSelectTerm = (pageIndex: number, pageId: string, term: ArchitecturalTerm) => {
    setCurrentPageIndex(pageIndex);
    setTextMode('parallel');
    setActiveSection('reader');
    setFocusedGlossaryTerm(null);
    setSelectedRuleExcerpt(null);
    setSelectedTerm({ pageId, term });
  };

  const handleJumpToGlossary = (pageId: string, pageNumber: string, term: ArchitecturalTerm) => {
    setFocusedGlossaryTerm({ pageId, pageNumber, term });
    setGlossaryReturnTarget('reader');
    setActiveSection('glossary');
  };

  const handleOpenGlossaryFromCalc = (entry: GlossaryLookupEntry) => {
    setFocusedGlossaryTerm({
      pageId: entry.pageId,
      pageNumber: entry.pageNumber,
      term: entry.term,
    });
    setGlossaryReturnTarget('calculator');
    setActiveSection('glossary');
  };

  const updateCalcSnapshot = (
    updater: (prev: CalcSnapshot) => CalcSnapshot,
    burstKey?: string
  ) => {
    const now = Date.now();
    setCalcHistory((prev) => {
      const nextPresent = updater(prev.present);
      if (
        nextPresent.params === prev.present.params &&
        nextPresent.lockedParams === prev.present.lockedParams
      ) {
        return prev;
      }
      const isSameBurst = Boolean(
        burstKey &&
          calcBurstRef.current &&
          calcBurstRef.current.key === burstKey &&
          now - calcBurstRef.current.time < 400
      );
      calcBurstRef.current = { time: now, key: burstKey ?? '' };
      if (isSameBurst && prev.past.length > 0) {
        return {
          past: prev.past,
          present: nextPresent,
          future: [],
        };
      }
      return {
        past: [...prev.past.slice(-59), prev.present],
        present: nextPresent,
        future: [],
      };
    });
  };

  const handleCalcUndo = () => {
    calcBurstRef.current = null;
    setCalcHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const previous = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: previous,
        future: [prev.present, ...prev.future.slice(0, 59)],
      };
    });
  };

  const handleCalcRedo = () => {
    calcBurstRef.current = null;
    setCalcHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const next = prev.future[0];
      return {
        past: [...prev.past.slice(-59), prev.present],
        present: next,
        future: prev.future.slice(1),
      };
    });
  };

  const handleResetCalcSession = () => {
    calcBurstRef.current = null;
    setCalcHistory({
      past: [],
      present: {
        params: createDefaultParamsForTypology('urban_house'),
        lockedParams: {},
      },
      future: [],
    });
    setCalcHighlightedElement(null);
  };

  const handleOpenBookPageFromCalc = (pageNum: number, excerpt?: RuleBookExcerpt) => {
    const targetPageNum = excerpt?.pageNumber ?? pageNum;
    const idx = pages.findIndex((p) => Number(p.pageNumber) === targetPageNum);
    setSelectedTerm(null);
    setSelectedRuleExcerpt(excerpt ?? null);
    setCurrentPageIndex(idx >= 0 ? idx : 0);
    setActiveSection('reader');
    if (!excerpt) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navItems: { id: ActiveSection; label: string }[] = [
    { id: 'reader', label: 'Читальный зал' },
    { id: 'calculator', label: 'Калькулятор' },
    { id: 'glossary', label: 'Терминология' },
    { id: 'provenance', label: 'Опись издания' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Top Bar */}
      <header className="border-b border-[#E5DFD3] bg-[#FBF9F5]">
        <div className="max-w-[1380px] mx-auto px-6 lg:px-10 py-4 flex items-center justify-between gap-8">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection('reader');
            }}
            className="font-display text-2xl font-semibold tracking-tight text-[#1C1917] whitespace-nowrap shrink-0"
          >
            Das Bauformenbuch
          </a>

          <nav aria-label="Разделы издания" className="hidden md:flex items-center gap-7">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'glossary') setFocusedGlossaryTerm(null);
                    setActiveSection(item.id);
                  }}
                  className={`py-1.5 text-sm transition-colors whitespace-nowrap shrink-0 border-b ${
                    isActive
                      ? 'text-[#1C1917] border-[#9A3412] font-semibold'
                      : 'text-[#57534E] border-transparent hover:text-[#1C1917]'
                  } focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A3412]`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="hidden md:block text-xs font-mono text-[#78716C] whitespace-nowrap shrink-0">
            Brausewetter · 1895
          </div>
        </div>

        {/* Mobile secondary nav */}
        <div className="md:hidden border-t border-[#E5DFD3] px-6 py-2 flex items-center gap-5 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'glossary') setFocusedGlossaryTerm(null);
                  setActiveSection(item.id);
                }}
                className={`py-1 text-xs whitespace-nowrap shrink-0 border-b ${
                  isActive
                    ? 'text-[#1C1917] border-[#9A3412] font-semibold'
                    : 'text-[#57534E] border-transparent'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <main className="flex-1 max-w-[1380px] w-full mx-auto px-6 lg:px-10 py-8 lg:py-10">
        {/* Archival Title & Unboxed Metadata Strip */}
        <section className="pb-8 border-b border-[#E5DFD3]">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs tracking-wider uppercase text-[#78716C] font-mono tabular-nums">
            <span>{BOOK_METADATA.author}</span>
            <span aria-hidden="true">·</span>
            <span>{BOOK_METADATA.volume}</span>
            <span aria-hidden="true">·</span>
            <span>{BOOK_METADATA.year}</span>
            <span aria-hidden="true">·</span>
            <span>{BOOK_METADATA.sourceSlug}</span>
            <span aria-hidden="true">·</span>
            <span>Загружено страниц: {pages.length}</span>
          </div>

          <div className="mt-3 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-medium tracking-tight text-[#1C1917] text-balance">
                {BOOK_METADATA.title}
              </h1>
              <p className="mt-2 text-base text-[#57534E] max-w-2xl">
                Постраничное цифровое издание немецкого архитектурного трактата 1895 года с дипломатической
                транскрипцией, научным русским переводом и привязкой к оригиналам сканов.
              </p>
            </div>

            {/* Page Navigation Controls (hidden on Calculator page) */}
            {activeSection !== 'calculator' && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTerm(null);
                    setSelectedRuleExcerpt(null);
                    setCurrentPageIndex((i) => Math.max(0, i - 1));
                  }}
                  disabled={currentPageIndex === 0}
                  aria-label="Предыдущая страница"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Пред.</span>
                </button>

                <div className="px-3 py-2 text-xs font-mono tabular-nums text-[#44403C] border border-[#E5DFD3] bg-[#FBF9F5] whitespace-nowrap shrink-0">
                  Скан {page.scanNr} · Стр. {page.pageNumber} ({currentPageIndex + 1}/{pages.length})
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTerm(null);
                    setSelectedRuleExcerpt(null);
                    setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1));
                  }}
                  disabled={currentPageIndex >= pages.length - 1}
                  aria-label="Следующая страница"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                >
                  <span>След.</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </section>

        {activeSection === 'reader' && (
          <section className="pt-6">
            {/* Workspace Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
              <div
                role="tablist"
                aria-label="Режим отображения текста"
                className="inline-flex items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E5DFD3]"
              >
                {(
                  [
                    { id: 'parallel', label: 'Параллельно (DE / RU)' },
                    { id: 'de', label: 'Оригинал (DE)' },
                    { id: 'ru', label: 'Перевод (RU)' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={textMode === mode.id}
                    onClick={() => setTextMode(mode.id)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      textMode === mode.id
                        ? 'bg-[#FBF9F5] text-[#1C1917] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
                <div className="flex items-center gap-1.5 border border-[#D6CEBE] bg-[#FBF9F5] px-2.5 py-1.5 min-w-[240px] max-w-md flex-1">
                  <Search className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                  <input
                    type="search"
                    value={readerSearchQuery}
                    onChange={(e) => handleReaderSearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        navigateReaderMatch(e.shiftKey ? -1 : 1);
                      }
                    }}
                    placeholder="Поиск по тексту (DE / RU)…"
                    aria-label="Поиск по тексту читального зала"
                    className="w-full bg-transparent text-xs text-[#1C1917] placeholder:text-[#78716C] focus:outline-none"
                  />
                  {readerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleReaderSearchChange('')}
                      aria-label="Очистить поиск"
                      className="text-[#78716C] hover:text-[#1C1917] p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {readerSearchQuery.trim() && (
                  <div className="inline-flex items-center gap-1 border border-[#D6CEBE] bg-[#F3EFE6] px-2 py-1 text-xs font-mono tabular-nums text-[#1C1917] shrink-0">
                    <span>
                      {readerMatches.length > 0
                        ? `${clampedReaderMatchIndex + 1} / ${readerMatches.length}`
                        : 'Найдено: 0'}
                    </span>
                    <button
                      type="button"
                      disabled={readerMatches.length === 0}
                      onClick={() => navigateReaderMatch(-1)}
                      aria-label="Предыдущий найденный фрагмент"
                      title="Предыдущий фрагмент (Shift+Enter)"
                      className="p-0.5 border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={readerMatches.length === 0}
                      onClick={() => navigateReaderMatch(1)}
                      aria-label="Следующий найденный фрагмент"
                      title="Следующий фрагмент (Enter)"
                      className="p-0.5 border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowFacsimile((v) => !v)}
                  className="px-3.5 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
                >
                  {showFacsimile ? 'Скрыть скан оригинала' : 'Показать скан оригинала'}
                </button>
              </div>
            </div>

            {/* Asymmetric Two-Column Reading Canvas */}
            <div
              className={`mt-8 grid gap-10 lg:gap-12 items-start ${
                showFacsimile ? 'grid-cols-1 lg:grid-cols-12' : 'grid-cols-1'
              }`}
            >
              {showFacsimile && (
                <div className="lg:col-span-5 lg:sticky lg:top-6">
                  <FacsimileViewer key={page.id} page={page} />
                </div>
              )}

              <article
                className={`${
                  showFacsimile ? 'lg:col-span-7' : 'max-w-4xl mx-auto w-full'
                }`}
              >
                {/* Chapter Heading */}
                <header className="pb-6 border-b border-[#E5DFD3]">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div>
                      {textMode !== 'ru' && (
                        <h2 className="font-display text-3xl font-medium tracking-wide text-[#1C1917]">
                          {highlightPlainTextWithSearch(page.sectionTitleDe, {
                            query: readerSearchQuery,
                            startOffset: currentPageSearchLayout.titleDe,
                            activeOffset: activePageSearchOffset,
                          })}
                        </h2>
                      )}
                      {textMode !== 'de' && (
                        <p
                          className={`${
                            textMode === 'ru'
                              ? 'font-display text-3xl font-medium tracking-wide text-[#1C1917]'
                              : 'mt-1 font-display text-xl italic text-[#57534E]'
                          }`}
                        >
                          {highlightPlainTextWithSearch(page.sectionTitleRu, {
                            query: readerSearchQuery,
                            startOffset: currentPageSearchLayout.titleRu,
                            activeOffset: activePageSearchOffset,
                          })}
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-mono tabular-nums text-[#78716C]">
                      Стр. {page.pageNumber}
                    </span>
                  </div>
                </header>

                {activeRuleExcerpt && (
                  <div className="mt-4 py-3 px-4 border border-[#B91C1C]/45 bg-[#FEF3C7]/45 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 text-[#1C1917]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-[#B91C1C] text-[#FBF9F5]">
                          Правило из калькулятора · Стр. {activeRuleExcerpt.pageNumber}
                        </span>
                        <strong className="font-medium text-[#1C1917]">
                          {activeRuleExcerpt.ruleTitle}
                        </strong>
                      </div>
                      <p className="text-[11px] text-[#57534E]">
                        {activeRuleExcerpt.ruleSummaryHighlight}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setActiveSection('calculator')}
                        className="text-[#9A3412] hover:text-[#7C2D12] underline underline-offset-4 transition-colors"
                      >
                        Вернуться в калькулятор
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRuleExcerpt(null)}
                        className="inline-flex items-center gap-1 text-[#57534E] hover:text-[#1C1917] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Сбросить</span>
                      </button>
                    </div>
                  </div>
                )}

                {activeTerm && (
                  <div className="mt-4 py-2.5 px-4 border border-[#E5DFD3] bg-[#F3EFE6]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[#44403C]">
                      <span className="uppercase tracking-wider text-[11px] text-[#78716C]">
                        Выделен термин:
                      </span>
                      <span lang="de" className="font-semibold text-[#1C1917]">
                        {activeTerm.de}
                      </span>
                      <span aria-hidden="true" className="text-[#78716C]">
                        —
                      </span>
                      <span className="font-medium text-[#9A3412]">{activeTerm.ru}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedTerm(null)}
                      className="inline-flex items-center gap-1 text-[#57534E] hover:text-[#1C1917] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Сбросить</span>
                    </button>
                  </div>
                )}

                {/* Paragraphs */}
                <div className="divide-y divide-[#ECE7DC]">
                  {page.paragraphs.map((para, idx) => {
                    const isFirst = idx === 0 && !para.continuesFromPrevPage;
                    const dropCapClasses = isFirst
                      ? 'first-letter:text-5xl first-letter:font-display first-letter:font-semibold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-[0.85] first-letter:text-[#9A3412]'
                      : '';

                    const paraOffsets = currentPageSearchLayout.paragraphs[idx];

                    return (
                      <div key={para.index} className="py-6">
                        {(para.subheadingDe || para.subheadingRu || para.subsubheadingDe || para.subsubheadingRu) && (
                          <div className="mb-5 pb-3 border-b border-[#D6CEBE]">
                            {textMode !== 'ru' && para.subheadingDe && (
                              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                                {highlightTermsInText(
                                  para.subheadingDe,
                                  page.terms,
                                  activeTerm,
                                  'de',
                                  (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                  {
                                    query: readerSearchQuery,
                                    startOffset: paraOffsets?.subDe ?? 0,
                                    activeOffset: activePageSearchOffset,
                                  }
                                )}
                              </h3>
                            )}
                            {textMode !== 'de' && para.subheadingRu && (
                              <p
                                className={
                                  textMode === 'ru'
                                    ? 'font-display text-2xl font-medium text-[#1C1917]'
                                    : 'mt-0.5 font-display text-lg italic text-[#57534E]'
                                }
                              >
                                {highlightTermsInText(
                                  para.subheadingRu,
                                  page.terms,
                                  activeTerm,
                                  'ru',
                                  (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                  {
                                    query: readerSearchQuery,
                                    startOffset: paraOffsets?.subRu ?? 0,
                                    activeOffset: activePageSearchOffset,
                                  }
                                )}
                              </p>
                            )}
                            {(para.subsubheadingDe || para.subsubheadingRu) && (
                              <div className="mt-3">
                                {textMode !== 'ru' && para.subsubheadingDe && (
                                  <h4 className="font-display text-xl italic font-medium text-[#1C1917]">
                                    {highlightTermsInText(
                                      para.subsubheadingDe,
                                      page.terms,
                                      activeTerm,
                                      'de',
                                      (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                      {
                                        query: readerSearchQuery,
                                        startOffset: paraOffsets?.subsubDe ?? 0,
                                        activeOffset: activePageSearchOffset,
                                      }
                                    )}
                                  </h4>
                                )}
                                {textMode !== 'de' && para.subsubheadingRu && (
                                  <p
                                    className={
                                      textMode === 'ru'
                                        ? 'font-display text-xl italic font-medium text-[#1C1917]'
                                        : 'mt-0.5 text-sm italic text-[#57534E]'
                                    }
                                  >
                                    {highlightTermsInText(
                                      para.subsubheadingRu,
                                      page.terms,
                                      activeTerm,
                                      'ru',
                                      (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                      {
                                        query: readerSearchQuery,
                                        startOffset: paraOffsets?.subsubRu ?? 0,
                                        activeOffset: activePageSearchOffset,
                                      }
                                    )}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mb-2 flex items-center justify-between gap-4">
                          <span className="text-[11px] font-mono tabular-nums text-[#78716C]">
                            Абзац {para.index}
                          </span>
                          <div className="flex items-center gap-3">
                            {para.continuesFromPrevPage && (
                              <span className="text-[11px] font-mono text-[#78716C]">
                                Продолжение с предыдущей страницы
                              </span>
                            )}
                            {para.continuesOnNextPage && (
                              <span className="text-[11px] font-mono text-[#9A3412]">
                                Перенос на следующую страницу
                              </span>
                            )}
                          </div>
                        </div>

                        {textMode === 'parallel' ? (
                          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8">
                            <p
                              lang="de"
                              className={`whitespace-pre-line text-[15.5px] leading-[1.75] text-[#1C1917] ${dropCapClasses}`}
                            >
                              {highlightRuleAndTermsInText(
                                para.de,
                                page.terms,
                                activeTerm,
                                'de',
                                (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                activeRuleExcerpt?.bookQuoteDe,
                                {
                                  query: readerSearchQuery,
                                  startOffset: paraOffsets?.de ?? 0,
                                  activeOffset: activePageSearchOffset,
                                }
                              )}
                            </p>
                            <p
                              lang="ru"
                              className={`whitespace-pre-line text-[15.5px] leading-[1.75] text-[#292524] ${dropCapClasses}`}
                            >
                              {highlightRuleAndTermsInText(
                                para.ru,
                                page.terms,
                                activeTerm,
                                'ru',
                                (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                activeRuleExcerpt?.bookQuoteRu,
                                {
                                  query: readerSearchQuery,
                                  startOffset: paraOffsets?.ru ?? 0,
                                  activeOffset: activePageSearchOffset,
                                }
                              )}
                            </p>
                          </div>
                        ) : textMode === 'de' ? (
                          <p
                            lang="de"
                            className={`whitespace-pre-line max-w-prose text-[16.5px] leading-[1.8] text-[#1C1917] ${dropCapClasses}`}
                          >
                            {highlightRuleAndTermsInText(
                              para.de,
                              page.terms,
                              activeTerm,
                              'de',
                              (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                              activeRuleExcerpt?.bookQuoteDe,
                              {
                                query: readerSearchQuery,
                                startOffset: paraOffsets?.de ?? 0,
                                activeOffset: activePageSearchOffset,
                              }
                            )}
                          </p>
                        ) : (
                          <p
                            lang="ru"
                            className={`whitespace-pre-line max-w-prose text-[16.5px] leading-[1.8] text-[#1C1917] ${dropCapClasses}`}
                          >
                            {highlightRuleAndTermsInText(
                              para.ru,
                              page.terms,
                              activeTerm,
                              'ru',
                              (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                              activeRuleExcerpt?.bookQuoteRu,
                              {
                                query: readerSearchQuery,
                                startOffset: paraOffsets?.ru ?? 0,
                                activeOffset: activePageSearchOffset,
                              }
                            )}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Geometric Figures Index */}
                {page.figures && page.figures.length > 0 && (
                  <div className="mt-2 pt-6 border-t border-[#D6CEBE]">
                    <p className="text-xs uppercase tracking-widest text-[#78716C]">
                      Чертежи и геометрические схемы на странице
                    </p>
                    <dl className="mt-3 divide-y divide-[#ECE7DC]">
                      {page.figures.map((fig, figIdx) => {
                        const figOffsets = currentPageSearchLayout.figures[figIdx];
                        return (
                          <div
                            key={fig.label}
                            className="py-3 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 items-baseline"
                          >
                            <dt className="sm:col-span-2 font-mono text-xs font-medium text-[#9A3412]">
                              {fig.label}
                            </dt>
                            <dd className="sm:col-span-10 text-sm text-[#292524]">
                              {textMode !== 'ru' && (
                                <span lang="de" className="block font-medium text-[#1C1917]">
                                  {highlightTermsInText(
                                    fig.captionDe,
                                    page.terms,
                                    activeTerm,
                                    'de',
                                    (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                    {
                                      query: readerSearchQuery,
                                      startOffset: figOffsets?.de ?? 0,
                                      activeOffset: activePageSearchOffset,
                                    }
                                  )}
                                </span>
                              )}
                              {textMode !== 'de' && (
                                <span className="block text-[#57534E]">
                                  {highlightTermsInText(
                                    fig.captionRu,
                                    page.terms,
                                    activeTerm,
                                    'ru',
                                    (t) => handleJumpToGlossary(page.id, page.pageNumber, t),
                                    {
                                      query: readerSearchQuery,
                                      startOffset: figOffsets?.ru ?? 0,
                                      activeOffset: activePageSearchOffset,
                                    }
                                  )}
                                </span>
                              )}
                            </dd>
                          </div>
                        );
                      })}
                    </dl>
                  </div>
                )}

                {/* Editorial Note */}
                {page.editorialNote && (
                  <aside className="mt-4 pt-6 border-t border-[#D6CEBE]">
                    <p className="text-xs uppercase tracking-widest text-[#78716C]">
                      Текстологическое примечание
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#57534E] max-w-prose">
                      {highlightPlainTextWithSearch(page.editorialNote, {
                        query: readerSearchQuery,
                        startOffset: currentPageSearchLayout.editorial,
                        activeOffset: activePageSearchOffset,
                      })}
                    </p>
                  </aside>
                )}

                {/* Bottom Page Navigation */}
                <nav
                  aria-label="Навигация по страницам"
                  className="mt-8 pt-6 border-t border-[#D6CEBE] flex flex-wrap items-center justify-between gap-3"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTerm(null);
                      setSelectedRuleExcerpt(null);
                      setCurrentPageIndex((i) => Math.max(0, i - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPageIndex === 0}
                    aria-label="Предыдущая страница"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Пред.</span>
                  </button>

                  <div className="px-3 py-2 text-xs font-mono tabular-nums text-[#44403C] border border-[#E5DFD3] bg-[#FBF9F5] whitespace-nowrap shrink-0">
                    Скан {page.scanNr} · Стр. {page.pageNumber} ({currentPageIndex + 1}/{pages.length})
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTerm(null);
                      setSelectedRuleExcerpt(null);
                      setCurrentPageIndex((i) => Math.min(pages.length - 1, i + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPageIndex >= pages.length - 1}
                    aria-label="Следующая страница"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>След.</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </nav>
              </article>
            </div>
          </section>
        )}

        {activeSection === 'glossary' && (
          <section aria-labelledby="glossary-heading" className="py-8 max-w-4xl">
            <div className="pb-6 border-b border-[#E5DFD3]">
              <p className="text-xs tracking-widest uppercase text-[#78716C]">
                Словарь понятий · Страницы 1–{pages.length}
              </p>
              <h2
                id="glossary-heading"
                className="mt-1 font-display text-3xl font-medium text-[#1C1917]"
              >
                Ключевая архитектурная терминология
              </h2>
              <p className="mt-2 text-sm text-[#57534E]">
                Нажмите на немецкий или русский термин, чтобы перейти в читальный зал (параллельно DE / RU) с мягким выделением в тексте.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 border border-[#D6CEBE] bg-[#FBF9F5] px-2.5 py-1.5 min-w-[240px] max-w-md flex-1">
                  <Search className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
                  <input
                    type="search"
                    value={glossarySearchQuery}
                    onChange={(e) => handleGlossarySearchChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        navigateGlossaryMatch(e.shiftKey ? -1 : 1);
                      }
                    }}
                    placeholder="Поиск по терминам и пояснениям…"
                    aria-label="Поиск по терминологии"
                    className="w-full bg-transparent text-xs text-[#1C1917] placeholder:text-[#78716C] focus:outline-none"
                  />
                  {glossarySearchQuery && (
                    <button
                      type="button"
                      onClick={() => handleGlossarySearchChange('')}
                      aria-label="Очистить поиск по терминологии"
                      className="text-[#78716C] hover:text-[#1C1917] p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {glossarySearchQuery.trim() && (
                  <div className="inline-flex items-center gap-1 border border-[#D6CEBE] bg-[#F3EFE6] px-2 py-1 text-xs font-mono tabular-nums text-[#1C1917] shrink-0">
                    <span>
                      {glossarySearchLayout.total > 0
                        ? `${clampedGlossaryMatchIndex + 1} / ${glossarySearchLayout.total}`
                        : 'Найдено: 0'}
                    </span>
                    <button
                      type="button"
                      disabled={glossarySearchLayout.total === 0}
                      onClick={() => navigateGlossaryMatch(-1)}
                      aria-label="Предыдущий найденный фрагмент в терминологии"
                      title="Предыдущий фрагмент (Shift+Enter)"
                      className="p-0.5 border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={glossarySearchLayout.total === 0}
                      onClick={() => navigateGlossaryMatch(1)}
                      aria-label="Следующий найденный фрагмент в терминологии"
                      title="Следующий фрагмент (Enter)"
                      className="p-0.5 border border-[#D6CEBE] bg-[#FBF9F5] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {focusedGlossaryTerm && (
              <div className="mt-4 py-2.5 px-4 border border-[#E5DFD3] bg-[#F3EFE6]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[#44403C]">
                  <span className="uppercase tracking-wider text-[11px] text-[#78716C]">
                    Переход со стр. {focusedGlossaryTerm.pageNumber}:
                  </span>
                  <span lang="de" className="font-semibold text-[#1C1917]">
                    {focusedGlossaryTerm.term.de}
                  </span>
                  <span aria-hidden="true" className="text-[#78716C]">
                    —
                  </span>
                  <span className="font-medium text-[#9A3412]">{focusedGlossaryTerm.term.ru}</span>
                </div>
                <div className="flex items-center gap-4">
                  {glossaryReturnTarget === 'calculator' && (
                    <button
                      type="button"
                      onClick={() => setActiveSection('calculator')}
                      className="text-[#9A3412] hover:text-[#7C2D12] underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                    >
                      Вернуться в калькулятор
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const targetIndex = pages.findIndex((p) => p.id === focusedGlossaryTerm.pageId);
                      if (targetIndex >= 0) {
                        handleSelectTerm(
                          targetIndex,
                          focusedGlossaryTerm.pageId,
                          focusedGlossaryTerm.term
                        );
                      } else {
                        setActiveSection('reader');
                      }
                    }}
                    className="text-[#9A3412] hover:text-[#7C2D12] underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                  >
                    Вернуться к тексту
                  </button>
                  <button
                    type="button"
                    onClick={() => setFocusedGlossaryTerm(null)}
                    className="inline-flex items-center gap-1 text-[#57534E] hover:text-[#1C1917] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Сбросить</span>
                  </button>
                </div>
              </div>
            )}

            <dl className="divide-y divide-[#E5DFD3]">
              {glossaryEntries.map((entry, idx) => {
                const { pageIdx, pageId, pageNumber, term } = entry;
                const offsets = glossarySearchLayout.offsets[idx];
                const isFocused =
                  focusedGlossaryTerm?.pageId === pageId &&
                  focusedGlossaryTerm?.term.de === term.de;
                const activeMatchOffset =
                  glossarySearchQuery.trim() && glossarySearchLayout.total > 0
                    ? clampedGlossaryMatchIndex
                    : null;

                return (
                  <div
                    key={entry.key}
                    data-glossary-term={isFocused ? 'true' : undefined}
                    className={`py-5 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 items-baseline transition-colors ${
                      isFocused
                        ? 'bg-[#9A3412]/[0.08] border-l-2 border-l-[#9A3412] -mx-4 px-4'
                        : ''
                    }`}
                  >
                    <dt lang="de" className="md:col-span-4 font-display text-xl font-semibold text-[#1C1917]">
                      <button
                        type="button"
                        onClick={() => handleSelectTerm(pageIdx, pageId, term)}
                        title={`Открыть термин на стр. ${pageNumber}`}
                        className="text-left cursor-pointer hover:text-[#9A3412] underline decoration-transparent hover:decoration-[#9A3412]/50 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                      >
                        {highlightPlainTextWithSearch(term.de, {
                          query: glossarySearchQuery,
                          startOffset: offsets?.de ?? 0,
                          activeOffset: activeMatchOffset,
                        })}
                      </button>
                      <span className="ml-2 text-xs font-mono font-normal text-[#78716C]">
                        стр. {pageNumber}
                      </span>
                    </dt>
                    <dd className="md:col-span-3 text-sm font-semibold text-[#9A3412]">
                      <button
                        type="button"
                        onClick={() => handleSelectTerm(pageIdx, pageId, term)}
                        title={`Открыть термин на стр. ${pageNumber}`}
                        className="text-left cursor-pointer hover:text-[#7C2D12] underline decoration-transparent hover:decoration-[#9A3412]/60 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                      >
                        {highlightPlainTextWithSearch(term.ru, {
                          query: glossarySearchQuery,
                          startOffset: offsets?.ru ?? 0,
                          activeOffset: activeMatchOffset,
                        })}
                      </button>
                    </dd>
                    <dd className="md:col-span-5 text-sm leading-relaxed text-[#57534E]">
                      {highlightPlainTextWithSearch(term.context, {
                        query: glossarySearchQuery,
                        startOffset: offsets?.context ?? 0,
                        activeOffset: activeMatchOffset,
                      })}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}

        {activeSection === 'calculator' && (
          <FacadeCalculatorPage
            onOpenBookPage={handleOpenBookPageFromCalc}
            onOpenGlossaryTerm={handleOpenGlossaryFromCalc}
            subpage={calcSubpage}
            onChangeSubpage={setCalcSubpage}
            expertMode={calcExpertMode}
            onChangeExpertMode={setCalcExpertMode}
            activeModule={calcActiveModule}
            onChangeActiveModule={setCalcActiveModule}
            activePlate={calcActivePlate}
            onChangeActivePlate={setCalcActivePlate}
            highlightedElement={calcHighlightedElement}
            onChangeHighlightedElement={setCalcHighlightedElement}
            params={calcHistory.present.params}
            lockedParams={calcHistory.present.lockedParams}
            canUndo={calcHistory.past.length > 0}
            canRedo={calcHistory.future.length > 0}
            onUndo={handleCalcUndo}
            onRedo={handleCalcRedo}
            onResetSession={handleResetCalcSession}
            onCommitSnapshot={updateCalcSnapshot}
          />
        )}

        {activeSection === 'provenance' && (
          <section aria-labelledby="provenance-heading" className="py-8 max-w-3xl">
            <div className="pb-6 border-b border-[#E5DFD3]">
              <p className="text-xs tracking-widest uppercase text-[#78716C]">
                Библиографическая карточка
              </p>
              <h2
                id="provenance-heading"
                className="mt-1 font-display text-3xl font-medium text-[#1C1917]"
              >
                Опись источника
              </h2>
            </div>

            <dl className="divide-y divide-[#E5DFD3] text-sm">
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Идентификатор (source_slug)</dt>
                <dd className="sm:col-span-2 font-mono text-[#1C1917]">{BOOK_METADATA.sourceSlug}</dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Автор</dt>
                <dd className="sm:col-span-2 text-[#1C1917]">{BOOK_METADATA.author}</dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Заглавие</dt>
                <dd className="sm:col-span-2 text-[#1C1917] italic">{BOOK_METADATA.title}</dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Том и год издания</dt>
                <dd className="sm:col-span-2 text-[#1C1917] tabular-nums">
                  {BOOK_METADATA.volume}, {BOOK_METADATA.year}
                </dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Язык оригинала</dt>
                <dd className="sm:col-span-2 text-[#1C1917]">{BOOK_METADATA.language}</dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Хранилище факсимиле</dt>
                <dd className="sm:col-span-2 text-[#1C1917]">{BOOK_METADATA.holdingInstitution}</dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Адрес источника скана</dt>
                <dd className="sm:col-span-2 font-mono text-xs break-all">
                  <a
                    href={BOOK_METADATA.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                  >
                    {BOOK_METADATA.sourceUrl}
                  </a>
                </dd>
              </div>
              <div className="py-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <dt className="text-[#78716C]">Индексированные сканы</dt>
                <dd className="sm:col-span-2 font-mono text-xs text-[#1C1917] tabular-nums">
                  {pages.map((p) => `Скан № ${p.scanNr} (стр. ${p.pageNumber})`).join(', ')}
                </dd>
              </div>
            </dl>
          </section>
        )}
      </main>

      <footer className="border-t border-[#E5DFD3] py-6 px-6 lg:px-10">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-[#78716C]">
          <span>
            {BOOK_METADATA.author}, «{BOOK_METADATA.title}», {BOOK_METADATA.volume} ({BOOK_METADATA.year})
          </span>
          <span className="font-mono">{BOOK_METADATA.sourceSlug}</span>
        </div>
      </footer>
    </div>
  );
}
