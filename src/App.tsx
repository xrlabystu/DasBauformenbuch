import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import {
  BOOK_METADATA,
  BRAUSEWETTER_PAGES,
  type ArchitecturalTerm,
  type BookPage,
} from './data/brausewetter_1895';
import { FacsimileViewer } from './components/FacsimileViewer';
import { CorpusJsonPanel } from './components/CorpusJsonPanel';
import { FacadeCalculatorPage } from './components/FacadeCalculatorPage';
import { highlightRuleAndTermsInText, highlightTermsInText } from './utils/termHighlight';
import type { RuleBookExcerpt } from './calc/ruleBookRefs';

type ActiveSection = 'reader' | 'calculator' | 'glossary' | 'corpus' | 'provenance';
type TextMode = 'parallel' | 'de' | 'ru';

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
  const [selectedRuleExcerpt, setSelectedRuleExcerpt] = useState<RuleBookExcerpt | null>(null);

  const pages = BRAUSEWETTER_PAGES;
  const page: BookPage = pages[currentPageIndex] ?? pages[0];
  const activeTerm = selectedTerm?.pageId === page.id ? selectedTerm.term : null;
  const activeRuleExcerpt =
    selectedRuleExcerpt && Number(page.pageNumber) === selectedRuleExcerpt.pageNumber
      ? selectedRuleExcerpt
      : null;

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
    if (activeSection !== 'glossary' || !focusedGlossaryTerm) return;
    const frameId = window.requestAnimationFrame(() => {
      const target = document.querySelector('[data-glossary-term="true"]');
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeSection, focusedGlossaryTerm]);

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
    setActiveSection('glossary');
  };

  const handleDownloadJson = () => {
    const payload = {
      source_slug: BOOK_METADATA.sourceSlug,
      author: BOOK_METADATA.author,
      title: BOOK_METADATA.title,
      volume: BOOK_METADATA.volume,
      year: BOOK_METADATA.year,
      language: BOOK_METADATA.languageCode,
      source_url: BOOK_METADATA.sourceUrl,
      pages,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${BOOK_METADATA.sourceSlug}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
    { id: 'corpus', label: 'Корпус JSON' },
    { id: 'provenance', label: 'Опись издания' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      {/* Top Bar: 3-zone contract */}
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

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-[#292524] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт JSON</span>
            </button>
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

              <button
                type="button"
                onClick={() => setShowFacsimile((v) => !v)}
                className="px-3.5 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#F3EFE6] transition-colors whitespace-nowrap shrink-0"
              >
                {showFacsimile ? 'Скрыть скан оригинала' : 'Показать скан оригинала'}
              </button>
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
                          {page.sectionTitleDe}
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
                          {page.sectionTitleRu}
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

                    return (
                      <div key={para.index} className="py-6">
                        {(para.subheadingDe || para.subheadingRu || para.subsubheadingDe || para.subsubheadingRu) && (
                          <div className="mb-5 pb-3 border-b border-[#D6CEBE]">
                            {textMode !== 'ru' && para.subheadingDe && (
                              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                                {highlightTermsInText(para.subheadingDe, page.terms, activeTerm, 'de', (t) =>
                                  handleJumpToGlossary(page.id, page.pageNumber, t)
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
                                {highlightTermsInText(para.subheadingRu, page.terms, activeTerm, 'ru', (t) =>
                                  handleJumpToGlossary(page.id, page.pageNumber, t)
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
                                      (t) => handleJumpToGlossary(page.id, page.pageNumber, t)
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
                                      (t) => handleJumpToGlossary(page.id, page.pageNumber, t)
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
                                activeRuleExcerpt?.bookQuoteDe
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
                                activeRuleExcerpt?.bookQuoteRu
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
                              activeRuleExcerpt?.bookQuoteDe
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
                              activeRuleExcerpt?.bookQuoteRu
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
                      {page.figures.map((fig) => (
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
                                {highlightTermsInText(fig.captionDe, page.terms, activeTerm, 'de', (t) =>
                                  handleJumpToGlossary(page.id, page.pageNumber, t)
                                )}
                              </span>
                            )}
                            {textMode !== 'de' && (
                              <span className="block text-[#57534E]">
                                {highlightTermsInText(fig.captionRu, page.terms, activeTerm, 'ru', (t) =>
                                  handleJumpToGlossary(page.id, page.pageNumber, t)
                                )}
                              </span>
                            )}
                          </dd>
                        </div>
                      ))}
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
                      {page.editorialNote}
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
              {pages.flatMap((p, pageIdx) =>
                p.terms.map((term) => {
                  const isFocused =
                    focusedGlossaryTerm?.pageId === p.id &&
                    focusedGlossaryTerm?.term.de === term.de;

                  return (
                    <div
                      key={`${p.id}-${term.de}`}
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
                          onClick={() => handleSelectTerm(pageIdx, p.id, term)}
                          title={`Открыть термин на стр. ${p.pageNumber}`}
                          className="text-left cursor-pointer hover:text-[#9A3412] underline decoration-transparent hover:decoration-[#9A3412]/50 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                        >
                          {term.de}
                        </button>
                        <span className="ml-2 text-xs font-mono font-normal text-[#78716C]">
                          стр. {p.pageNumber}
                        </span>
                      </dt>
                      <dd className="md:col-span-3 text-sm font-semibold text-[#9A3412]">
                        <button
                          type="button"
                          onClick={() => handleSelectTerm(pageIdx, p.id, term)}
                          title={`Открыть термин на стр. ${p.pageNumber}`}
                          className="text-left cursor-pointer hover:text-[#7C2D12] underline decoration-transparent hover:decoration-[#9A3412]/60 underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
                        >
                          {term.ru}
                        </button>
                      </dd>
                      <dd className="md:col-span-5 text-sm leading-relaxed text-[#57534E]">
                        {term.context}
                      </dd>
                    </div>
                  );
                })
              )}
            </dl>
          </section>
        )}

        {activeSection === 'corpus' && (
          <CorpusJsonPanel pages={pages} onDownload={handleDownloadJson} />
        )}

        {activeSection === 'calculator' && (
          <FacadeCalculatorPage onOpenBookPage={handleOpenBookPageFromCalc} />
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
