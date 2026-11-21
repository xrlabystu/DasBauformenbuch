import { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { BookPage } from '../data/brausewetter_1895';

interface FacsimileViewerProps {
  page: BookPage;
}

const ZOOM_STEPS = [1, 1.4, 1.85, 2.4];

export function FacsimileViewer({ page }: FacsimileViewerProps) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const scale = ZOOM_STEPS[zoomIndex];
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const resolvedImageSrc = page.imagePath.startsWith('/')
    ? `${baseUrl}${page.imagePath.slice(1)}`
    : page.imagePath;

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setZoomIndex(0);
  };

  return (
    <figure className="flex flex-col">
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#E5DFD3]">
        <div className="flex items-center gap-2 text-xs text-[#57534E] font-mono tabular-nums">
          <span>Скан № {page.scanNr}</span>
          <span aria-hidden="true">·</span>
          <span>Стр. {page.pageNumber}</span>
          <span aria-hidden="true">·</span>
          <span>{Math.round(scale * 100)}%</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoomIndex === 0}
            aria-label="Уменьшить скан"
            className="p-2 text-[#44403C] hover:text-[#1C1917] disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoomIndex === ZOOM_STEPS.length - 1}
            aria-label="Увеличить скан"
            className="p-2 text-[#44403C] hover:text-[#1C1917] disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          {zoomIndex > 0 && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Сбросить масштаб"
              className="p-2 text-[#44403C] hover:text-[#1C1917] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 bg-[#EFECE4] border border-[#DFD8C8] overflow-auto max-h-[78vh]">
        {!imageError ? (
          <div
            className="origin-top-left transition-transform duration-150 ease-out"
            style={{
              width: `${scale * 100}%`,
            }}
          >
            <img
              src={resolvedImageSrc}
              alt={`Brausewetter, Das Bauformenbuch, Bd. 1 (1895) — Скан № ${page.scanNr}, страница ${page.pageNumber}`}
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="w-full h-auto block select-none"
            />
          </div>
        ) : (
          <div className="aspect-[3/4] flex flex-col items-center justify-center p-8 text-center text-[#57534E]">
            <p className="font-display text-2xl text-[#1C1917]">Факсимиле временно недоступно</p>
            <p className="mt-2 text-sm font-mono">{resolvedImageSrc}</p>
          </div>
        )}
      </div>

      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#57534E]">
        <span className="italic">
          Илл. — Оригинальный разворот, {page.institution} (Скан № {page.scanNr})
        </span>
        <span className="font-mono text-[11px] text-[#78716C] break-all">{page.urn}</span>
      </figcaption>
    </figure>
  );
}
