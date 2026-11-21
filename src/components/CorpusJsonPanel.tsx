import { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { BOOK_METADATA, type BookPage } from '../data/brausewetter_1895';

interface CorpusJsonPanelProps {
  pages: BookPage[];
  onDownload: () => void;
}

export function CorpusJsonPanel({ pages, onDownload }: CorpusJsonPanelProps) {
  const [copied, setCopied] = useState(false);

  const payload = {
    source_slug: BOOK_METADATA.sourceSlug,
    author: BOOK_METADATA.author,
    title: BOOK_METADATA.title,
    volume: BOOK_METADATA.volume,
    year: BOOK_METADATA.year,
    language: BOOK_METADATA.languageCode,
    source_url: BOOK_METADATA.sourceUrl,
    pages_count: pages.length,
    pages: pages.map((page) => ({
      scan_nr: page.scanNr,
      page_number: page.pageNumber,
      section_de: page.sectionTitleDe,
      section_ru: page.sectionTitleRu,
      urn: page.urn,
      image_path: page.imagePath,
      ...(page.figures && page.figures.length > 0 ? { figures: page.figures } : {}),
      paragraphs: page.paragraphs.map((p) => ({
        index: p.index,
        ...(p.subheadingDe ? { subheading_de: p.subheadingDe } : {}),
        ...(p.subheadingRu ? { subheading_ru: p.subheadingRu } : {}),
        ...(p.subsubheadingDe ? { subsubheading_de: p.subsubheadingDe } : {}),
        ...(p.subsubheadingRu ? { subsubheading_ru: p.subsubheadingRu } : {}),
        de: p.de,
        ru: p.ru,
        ...(p.continuesOnNextPage ? { continues_on_next_page: true } : {}),
        ...(p.continuesFromPrevPage ? { continues_from_prev_page: true } : {}),
      })),
    })),
  };

  const formatted = JSON.stringify(payload, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section aria-labelledby="corpus-json-heading" className="py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[#E5DFD3]">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#78716C]">
            Машиночитаемый корпус · {BOOK_METADATA.sourceSlug}
          </p>
          <h2
            id="corpus-json-heading"
            className="mt-1 font-display text-3xl font-medium text-[#1C1917]"
          >
            Структурированный экспорт JSON
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#14532D]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Скопировано' : 'Копировать JSON'}</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[#1C1917] text-[#FBF9F5] hover:bg-[#292524] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Скачать файл</span>
          </button>
        </div>
      </div>

      <pre className="mt-6 p-6 bg-[#F3EFE6] border border-[#E5DFD3] overflow-x-auto text-xs leading-relaxed font-mono text-[#292524] tabular-nums">
        <code>{formatted}</code>
      </pre>
    </section>
  );
}
