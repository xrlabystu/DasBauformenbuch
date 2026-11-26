import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Move,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { BookPage } from '../data/brausewetter_1895';

interface FacsimileViewerProps {
  page: BookPage;
  pages?: BookPage[];
  currentPageIndex?: number;
  isFullscreen?: boolean;
  onFullscreenChange?: (open: boolean) => void;
  onSelectPage?: (pageIndex: number) => void;
}

const INLINE_ZOOM_STEPS = [1, 1.4, 1.85, 2.4];
const FULLSCREEN_ZOOM_MIN = 0.5;
const FULLSCREEN_ZOOM_MAX = 4.0;
const FULLSCREEN_ZOOM_STEP = 0.25;

function clampFullscreenZoom(z: number): number {
  return Math.min(FULLSCREEN_ZOOM_MAX, Math.max(FULLSCREEN_ZOOM_MIN, Number(z.toFixed(2))));
}

export function FacsimileViewer({
  page,
  pages = [page],
  currentPageIndex = 0,
  isFullscreen: controlledFullscreen,
  onFullscreenChange,
  onSelectPage,
}: FacsimileViewerProps) {
  const [zoomIndex, setZoomIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Fallback internal state when used uncontrolled
  const [internalFullscreen, setInternalFullscreen] = useState(false);
  const isFullscreen = controlledFullscreen ?? internalFullscreen;
  const setFullscreen = useCallback(
    (open: boolean) => {
      if (onFullscreenChange) {
        onFullscreenChange(open);
      } else {
        setInternalFullscreen(open);
      }
    },
    [onFullscreenChange]
  );

  // Fullscreen viewport transforms (zoom & rotation persist across page turns; pan resets cleanly on page change)
  const [fsZoom, setFsZoom] = useState(1);
  const [fsRotationDeg, setFsRotationDeg] = useState(0);
  const [fsPan, setFsPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const fsZoomRef = useRef(fsZoom);
  fsZoomRef.current = fsZoom;
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originPanX: number;
    originPanY: number;
  } | null>(null);

  const scale = INLINE_ZOOM_STEPS[zoomIndex];
  const baseUrl = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  const resolvedImageSrc = page.imagePath.startsWith('/')
    ? `${baseUrl}${page.imagePath.slice(1)}`
    : page.imagePath;

  // Reset error & pan when switching to a different page (while keeping fullscreen, zoom, and rotation)
  useEffect(() => {
    setImageError(false);
    setFsPan({ x: 0, y: 0 });
    dragStateRef.current = null;
    setIsDragging(false);
  }, [page.id]);

  const canGoPrev = currentPageIndex > 0;
  const canGoNext = currentPageIndex < pages.length - 1;

  const goToPrevPage = useCallback(() => {
    if (!onSelectPage || !canGoPrev) return;
    onSelectPage(currentPageIndex - 1);
  }, [onSelectPage, canGoPrev, currentPageIndex]);

  const goToNextPage = useCallback(() => {
    if (!onSelectPage || !canGoNext) return;
    onSelectPage(currentPageIndex + 1);
  }, [onSelectPage, canGoNext, currentPageIndex]);

  const handleInlineZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, INLINE_ZOOM_STEPS.length - 1));
  };

  const handleInlineZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleInlineReset = () => {
    setZoomIndex(0);
  };

  const handleFsZoomIn = useCallback(() => {
    setFsZoom((prev) => clampFullscreenZoom(prev + FULLSCREEN_ZOOM_STEP));
  }, []);

  const handleFsZoomOut = useCallback(() => {
    setFsZoom((prev) => clampFullscreenZoom(prev - FULLSCREEN_ZOOM_STEP));
  }, []);

  const handleFsRotateCw = useCallback(() => {
    setFsRotationDeg((prev) => prev + 90);
  }, []);

  const handleFsResetView = useCallback(() => {
    setFsZoom(1);
    setFsPan({ x: 0, y: 0 });
    setFsRotationDeg(0);
  }, []);

  // Body scroll lock & keyboard shortcuts while fullscreen overlay is active
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setFullscreen(false);
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleFsZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleFsZoomOut();
      } else if (e.key === 'r' || e.key === 'R' || e.key === 'к' || e.key === 'К') {
        e.preventDefault();
        handleFsRotateCw();
      } else if (e.key === '0') {
        e.preventDefault();
        handleFsResetView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    isFullscreen,
    setFullscreen,
    goToPrevPage,
    goToNextPage,
    handleFsZoomIn,
    handleFsZoomOut,
    handleFsRotateCw,
    handleFsResetView,
  ]);

  const handleStagePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originPanX: fsPan.x,
      originPanY: fsPan.y,
    };
    setIsDragging(true);
  };

  const handleStagePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setFsPan({
      x: drag.originPanX + dx,
      y: drag.originPanY + dy,
    });
  };

  const handleStagePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isFullscreen) return;
    const stage = stageRef.current;
    if (!stage) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const currentZoom = fsZoomRef.current;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nextZoom = clampFullscreenZoom(currentZoom * factor);
      if (nextZoom === currentZoom) return;

      const rect = stage.getBoundingClientRect();
      const cursorOffsetX = e.clientX - (rect.left + rect.width / 2);
      const cursorOffsetY = e.clientY - (rect.top + rect.height / 2);
      const ratio = nextZoom / currentZoom;
      setFsPan((prev) => ({
        x: cursorOffsetX - (cursorOffsetX - prev.x) * ratio,
        y: cursorOffsetY - (cursorOffsetY - prev.y) * ratio,
      }));
      setFsZoom(nextZoom);
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [isFullscreen]);

  const normalizedRotation = ((fsRotationDeg % 360) + 360) % 360;
  const isQuarterTurn = normalizedRotation === 90 || normalizedRotation === 270;
  const isFsModified =
    fsZoom !== 1 || fsPan.x !== 0 || fsPan.y !== 0 || normalizedRotation !== 0;

  return (
    <>
      <figure className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#E5DFD3]">
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
              onClick={handleInlineZoomOut}
              disabled={zoomIndex === 0}
              aria-label="Уменьшить скан"
              className="p-2 text-[#44403C] hover:text-[#1C1917] disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleInlineZoomIn}
              disabled={zoomIndex === INLINE_ZOOM_STEPS.length - 1}
              aria-label="Увеличить скан"
              className="p-2 text-[#44403C] hover:text-[#1C1917] disabled:opacity-35 disabled:cursor-not-allowed transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomIndex > 0 && (
              <button
                type="button"
                onClick={handleInlineReset}
                aria-label="Сбросить масштаб"
                className="p-2 text-[#44403C] hover:text-[#1C1917] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFullscreen(true)}
              aria-label="Открыть скан на весь экран"
              title="Открыть скан оригинала на весь экран"
              className="ml-1 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9A3412]"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>На весь экран</span>
            </button>
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
                onDoubleClick={() => setFullscreen(true)}
                title="Двойной клик — открыть скан на весь экран"
                className="w-full h-auto block select-none cursor-zoom-in"
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

      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Скан оригинала во весь экран — Скан ${page.scanNr}, стр. ${page.pageNumber}`}
            className="fixed inset-0 z-50 flex flex-col bg-[#161412] text-[#FBF9F5]"
          >
            {/* Fullscreen Top Toolbar */}
            <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#3A3530] bg-[#1C1917] shrink-0">
              {/* Page flipping controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevPage}
                  disabled={!onSelectPage || !canGoPrev}
                  aria-label="Предыдущая страница"
                  title="Предыдущая страница (←)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-[#44403C] bg-[#292524] text-[#FBF9F5] hover:bg-[#3A3530] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Пред.</span>
                </button>

                {onSelectPage && pages.length > 1 ? (
                  <select
                    aria-label="Выбор страницы скана"
                    value={currentPageIndex}
                    onChange={(e) => onSelectPage(Number(e.target.value))}
                    className="px-2.5 py-1.5 text-xs font-mono tabular-nums border border-[#44403C] bg-[#292524] text-[#FBF9F5] focus:outline-none focus:border-[#9A3412]"
                  >
                    {pages.map((p, idx) => (
                      <option key={p.id} value={idx}>
                        Скан {p.scanNr} · Стр. {p.pageNumber} ({idx + 1}/{pages.length})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-2.5 py-1.5 text-xs font-mono tabular-nums border border-[#44403C] bg-[#292524] text-[#E7E5E4]">
                    Скан {page.scanNr} · Стр. {page.pageNumber}
                  </div>
                )}

                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={!onSelectPage || !canGoNext}
                  aria-label="Следующая страница"
                  title="Следующая страница (→)"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border border-[#44403C] bg-[#292524] text-[#FBF9F5] hover:bg-[#3A3530] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                >
                  <span>След.</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Zoom, Rotate, Reset & Exit controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center border border-[#44403C] bg-[#292524]">
                  <button
                    type="button"
                    onClick={handleFsZoomOut}
                    disabled={fsZoom <= FULLSCREEN_ZOOM_MIN}
                    aria-label="Уменьшить масштаб"
                    title="Уменьшить масштаб (-)"
                    className="p-1.5 text-[#FBF9F5] hover:bg-[#3A3530] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2.5 text-xs font-mono tabular-nums text-[#E7E5E4] min-w-[54px] text-center">
                    {Math.round(fsZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleFsZoomIn}
                    disabled={fsZoom >= FULLSCREEN_ZOOM_MAX}
                    aria-label="Увеличить масштаб"
                    title="Увеличить масштаб (+)"
                    className="p-1.5 text-[#FBF9F5] hover:bg-[#3A3530] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFsRotateCw}
                  aria-label="Развернуть лист по часовой стрелке на 90 градусов"
                  title="Развернуть лист по часовой стрелке на 90° (клавиша R)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[#44403C] bg-[#292524] text-[#FBF9F5] hover:bg-[#3A3530] transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>+90°</span>
                  {normalizedRotation !== 0 && (
                    <span className="font-mono text-[11px] text-[#FDBA74]">
                      ({normalizedRotation}°)
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleFsResetView}
                  disabled={!isFsModified}
                  aria-label="Сбросить масштаб, смещение и поворот"
                  title="Сбросить масштаб, смещение и поворот (клавиша 0)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[#44403C] bg-[#292524] text-[#FBF9F5] hover:bg-[#3A3530] disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Сброс</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFullscreen(false)}
                  aria-label="Выйти из полноэкранного режима"
                  title="Закрыть полноэкранный режим (Esc)"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#9A3412] bg-[#9A3412] text-[#FBF9F5] hover:bg-[#7C2D12] transition-colors"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Закрыть</span>
                </button>
              </div>
            </header>

            {/* Fullscreen Interactive Stage (Pan + Zoom + Rotate) */}
            <div
              ref={stageRef}
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerEnd}
              onPointerCancel={handleStagePointerEnd}
              className={`relative flex-1 overflow-hidden flex items-center justify-center select-none touch-none ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
            >
              {!imageError ? (
                <div
                  style={{
                    transform: `translate3d(${fsPan.x}px, ${fsPan.y}px, 0) scale(${fsZoom}) rotate(${fsRotationDeg}deg)`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 160ms ease-out',
                  }}
                  className="flex items-center justify-center"
                >
                  <img
                    src={resolvedImageSrc}
                    alt={`Brausewetter, Das Bauformenbuch, Bd. 1 (1895) — Скан № ${page.scanNr}, страница ${page.pageNumber}`}
                    referrerPolicy="no-referrer"
                    draggable={false}
                    onError={() => setImageError(true)}
                    style={{
                      maxWidth: isQuarterTurn ? 'calc(100vh - 112px)' : 'calc(100vw - 48px)',
                      maxHeight: isQuarterTurn ? 'calc(100vw - 48px)' : 'calc(100vh - 112px)',
                    }}
                    className="w-auto h-auto object-contain shadow-2xl border border-[#3A3530] bg-[#EFECE4] select-none"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center text-[#A8A29E]">
                  <p className="font-display text-2xl text-[#FBF9F5]">Факсимиле временно недоступно</p>
                  <p className="mt-2 text-sm font-mono">{resolvedImageSrc}</p>
                </div>
              )}

              {/* Side Edge Flipping Buttons */}
              {onSelectPage && canGoPrev && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={goToPrevPage}
                  aria-label="Предыдущая страница"
                  title="Предыдущая страница (←)"
                  className="hidden sm:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 w-10 h-14 border border-[#44403C]/80 bg-[#1C1917]/80 text-[#FBF9F5] hover:bg-[#292524] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {onSelectPage && canGoNext && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={goToNextPage}
                  aria-label="Следующая страница"
                  title="Следующая страница (→)"
                  className="hidden sm:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 w-10 h-14 border border-[#44403C]/80 bg-[#1C1917]/80 text-[#FBF9F5] hover:bg-[#292524] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Bottom Status / Shortcuts Bar */}
            <footer className="px-4 py-1.5 border-t border-[#3A3530] bg-[#1C1917] text-[11px] text-[#A8A29E] flex flex-wrap items-center justify-between gap-2 shrink-0">
              <span className="truncate">
                Скан № {page.scanNr} · Стр. {page.pageNumber} —{' '}
                {page.sectionTitleRu || page.sectionTitleDe}
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[#A8A29E]">
                <Move className="w-3 h-3" />
                <span>
                  Перетаскивание — смещение · Колесо — масштаб · ←/→ — листать · R — поворот +90° · Esc — выход
                </span>
              </span>
            </footer>
          </div>,
          document.body
        )}
    </>
  );
}
