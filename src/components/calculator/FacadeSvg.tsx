import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  BookOpen,
  Download,
  Maximize2,
  Minimize2,
  Move,
  Redo2,
  RotateCcw,
  Undo2,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  formatMeters,
  hasAnyActiveBelt,
  isBeltEnabledAboveFloor,
  isFloorWindowSillBeltActive,
  mergeStatuses,
  resolveBeltFloorsMask,
  resolveBeltSillFloorsMask,
  resolveBeltVerticalBandM,
  resolveEntranceGeometry,
  resolveFloorWindowGeometryM,
  resolveMainCorniceLayers,
  resolveOrdinaryPierAxesM,
  resolvePilasterElevationSpans,
  resolvePilasterXPositions,
  resolveScaledVerticalGeometry,
  resolveSocleAndPilasterBounds,
  resolveWindowAxesM,
  resolveWindowAxisStepsM,
  type FacadeParameters,
  type FacadeSummary,
  type FacadeTargetElement,
  type SummaryCheckItem,
  type ValidationStatus,
} from '../../calc/rules';
import { getExcerptForCheckId, type RuleBookExcerpt } from '../../calc/ruleBookRefs';
import { downloadFacadeDwg } from '../../calc/dwgExport';

interface FacadeSvgProps {
  params: FacadeParameters;
  summary: FacadeSummary;
  highlightedElement: FacadeTargetElement | null;
  hideValidation?: boolean;
  onSelectElement?: (el: FacadeTargetElement) => void;
  onSelectEntrance?: () => void;
  onOpenBookPage?: (pageNum: number, excerpt?: RuleBookExcerpt) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

const ELEMENT_LABELS_RU: Record<FacadeTargetElement, string> = {
  axenweite: 'Оси и пропорция фасада (Axenweite)',
  pier: 'Межоконный простенок (p)',
  framing_pier: 'Простенок и наличник (p_c, u)',
  corner: 'Угол фасада (D, p_corner)',
  window: 'Оконный проём (w × h)',
  entablature: 'Сандрик и обрамление (R:F:K)',
  pilaster: 'Пилястр / лопатка / колонна',
  cornice: 'Главный карниз (Hauptgesims)',
  socle: 'Цоколь и иерархия (Sockel)',
  belt: 'Межэтажная лента (Gurtgesims)',
};

const STATUS_STROKE: Record<ValidationStatus, string> = {
  ok: '#15803D',
  approx: '#B45309',
  violation: '#B91C1C',
};

const STATUS_FILL: Record<ValidationStatus, string> = {
  ok: 'rgba(21, 128, 61, 0.10)',
  approx: 'rgba(180, 83, 9, 0.12)',
  violation: 'rgba(185, 28, 28, 0.13)',
};

const STATUS_TAG: Record<ValidationStatus, string> = {
  ok: 'OK',
  approx: 'ПРИБЛ.',
  violation: 'НАРУШЕНИЕ',
};

export function FacadeSvg({
  params,
  summary,
  highlightedElement,
  hideValidation = false,
  onSelectElement,
  onSelectEntrance,
  onOpenBookPage,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
}: FacadeSvgProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [hoveredViolation, setHoveredViolation] = useState<{
    element: FacadeTargetElement;
    left: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  const [view, setView] = useState<{ zoom: number; pan: { x: number; y: number } }>({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  const zoom = view.zoom;
  const pan = view.pan;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
    moved: boolean;
  } | null>(null);
  const suppressNextClickRef = useRef(false);

  const safeH = Math.max(1.8, summary.derivedGeometry.H_max);
  const safeA = Math.max(1.0, params.A);
  const safeW = Math.max(0.4, params.w);
  const safeWinH = Math.max(0.6, params.h);
  const effectiveU = params.withFraming ? Math.max(0, params.u) : 0;
  const safeAxesCount = Math.min(10, Math.max(2, Math.round(params.axesCount)));
  const axisStepsM = resolveWindowAxisStepsM(params);
  const effectiveAForD = axisStepsM[0] ?? safeA;
  const D = params.isRisalitCentered
    ? Math.max(0.6, params.risalitWidth / 2)
    : Math.max(0.5, effectiveAForD * params.k_D);

  const levelFloors = params.levels.floors;
  const safeFloors = Math.min(10, Math.max(1, levelFloors.length));
  const axesM = resolveWindowAxesM(D, axisStepsM);
  const hasVariedAxisSteps =
    axisStepsM.length >= 2 &&
    axisStepsM.some((step) => Math.abs(step - axisStepsM[0]) > 1e-4);
  const ordinaryPierAxesM = params.showOrdinaryPierAxes
    ? resolveOrdinaryPierAxesM(axesM)
    : [];
  const hasPierAxesDimChain = ordinaryPierAxesM.length > 0;

  // Общая ширина фасада из DerivedGeometry
  const totalWidthM = summary.derivedGeometry.facadeWidth;

  // Поэтажные отметки с учётом масштабирования при ручной H_зд
  const verticalGeo = resolveScaledVerticalGeometry(params, summary.derivedGeometry);
  const {
    groundToFloor1,
    floorHeightsM,
    floorOffsetsM,
    topFloorTopM,
    topFloorCeilingM,
    corniceBottomM,
    wallTopM,
    corniceM,
    corniceTopM,
    totalHeightM,
  } = verticalGeo;
  const effectiveSocleH = params.useFullFloorAsSocle
    ? floorOffsetsM.length >= 2
      ? floorOffsetsM[1]
      : wallTopM
    : Math.max(0.25, params.hSocle);
  const wallHeightM = wallTopM - groundToFloor1;

  const svgW = 928;
  const baseSvgH = safeFloors >= 7 ? 620 : safeFloors >= 4 ? 540 : 470;
  const extraBottomPx = hasPierAxesDimChain ? 48 : 0;
  const svgH = baseSvgH + extraBottomPx;
  const padLeft = 152;
  const padRight = 126;
  const padTop = 64;
  const padBottom = 86 + extraBottomPx;
  const drawW = svgW - padLeft - padRight;
  const drawH = svgH - padTop - padBottom;

  const scale = Math.min(
    drawW / Math.max(totalWidthM, 4),
    drawH / Math.max(corniceTopM, totalHeightM, 3.5)
  );
  const facadePxW = totalWidthM * scale;
  const originX = padLeft + (drawW - facadePxW) / 2;
  const groundY = svgH - padBottom;

  const xM = (meters: number) => originX + meters * scale;
  const yFromGroundM = (metersAboveGround: number) => groundY - metersAboveGround * scale;

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 5;

  const clampPan = useCallback(
    (nextX: number, nextY: number, targetZoom: number) => {
      const vbW = svgW / targetZoom;
      const vbH = svgH / targetZoom;
      const minX = Math.min(0, svgW - vbW) - svgW * 0.35;
      const maxX = Math.max(0, svgW - vbW) + svgW * 0.35;
      const minY = Math.min(0, svgH - vbH) - svgH * 0.35;
      const maxY = Math.max(0, svgH - vbH) + svgH * 0.35;
      return {
        x: Math.max(minX, Math.min(maxX, nextX)),
        y: Math.max(minY, Math.min(maxY, nextY)),
      };
    },
    [svgW, svgH]
  );

  const vbW = svgW / zoom;
  const vbH = svgH / zoom;
  const clampedPan = clampPan(pan.x, pan.y, zoom);
  const vbX = clampedPan.x;
  const vbY = clampedPan.y;

  const zoomByFactor = useCallback(
    (factor: number, clientPt?: { clientX: number; clientY: number }) => {
      setView((prev) => {
        const nextZoom = Math.max(
          MIN_ZOOM,
          Math.min(MAX_ZOOM, Number((prev.zoom * factor).toFixed(3)))
        );
        const prevVbW = svgW / prev.zoom;
        const prevVbH = svgH / prev.zoom;
        const curPan = clampPan(prev.pan.x, prev.pan.y, prev.zoom);

        let fx = curPan.x + prevVbW / 2;
        let fy = curPan.y + prevVbH / 2;

        if (clientPt && svgRef.current) {
          const rect = svgRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const scaleSvgPerPx = Math.max(prevVbW / rect.width, prevVbH / rect.height);
            const renderedW = prevVbW / scaleSvgPerPx;
            const renderedH = prevVbH / scaleSvgPerPx;
            const offsetX = rect.left + (rect.width - renderedW) / 2;
            const offsetY = rect.top + (rect.height - renderedH) / 2;
            fx = curPan.x + (clientPt.clientX - offsetX) * scaleSvgPerPx;
            fy = curPan.y + (clientPt.clientY - offsetY) * scaleSvgPerPx;
          }
        }

        const relX = (fx - curPan.x) / prevVbW;
        const relY = (fy - curPan.y) / prevVbH;
        const newVbW = svgW / nextZoom;
        const newVbH = svgH / nextZoom;
        const nextPan = clampPan(fx - relX * newVbW, fy - relY * newVbH, nextZoom);
        return { zoom: nextZoom, pan: nextPan };
      });
    },
    [clampPan, svgW, svgH]
  );

  const handleResetView = useCallback(() => {
    setView({ zoom: 1, pan: { x: 0, y: 0 } });
  }, []);

  const openBookFromSvg = useCallback(
    (pageNum: number, excerpt?: RuleBookExcerpt) => {
      if (!onOpenBookPage) return;
      setIsFullscreen(false);
      onOpenBookPage(pageNum, excerpt);
    },
    [onOpenBookPage]
  );

  useEffect(() => {
    if (hideValidation) {
      setHoveredViolation(null);
    }
  }, [hideValidation]);

  // Escape closes fullscreen; body scroll locked while fullscreen is active
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      } else if (e.key === '+' || e.key === '=') {
        zoomByFactor(1.25);
      } else if (e.key === '-' || e.key === '_') {
        zoomByFactor(0.8);
      } else if (e.key === '0') {
        handleResetView();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isFullscreen, zoomByFactor, handleResetView]);

  // Non-passive wheel handler: zooms in fullscreen, with Ctrl/Cmd (incl. pinch), or once zoomed
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const shouldZoom = isFullscreen || e.ctrlKey || e.metaKey || Math.abs(zoom - 1) > 0.01;
      if (!shouldZoom) return;
      e.preventDefault();
      setHoveredViolation(null);
      const factor = Math.exp(-e.deltaY * 0.0018);
      zoomByFactor(factor, { clientX: e.clientX, clientY: e.clientY });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [isFullscreen, zoom, zoomByFactor]);

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // Ignore right-click or clicks inside the floating violation popover
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('[role="dialog"]')) return;
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: vbX,
      startPanY: vbY,
      moved: false,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || !drag.active || drag.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - drag.startClientX;
    const dyPx = e.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dxPx, dyPx) < 4) return;

    if (!drag.moved) {
      drag.moved = true;
      setIsPanning(true);
      setHoveredViolation(null);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignore if pointer capture is unavailable
      }
    }

    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const scaleSvgPerPx = Math.max(vbW / rect.width, vbH / rect.height);
    const nextPan = clampPan(
      drag.startPanX - dxPx * scaleSvgPerPx,
      drag.startPanY - dyPx * scaleSvgPerPx,
      zoom
    );
    setView((prev) => ({ ...prev, pan: nextPan }));
  };

  const handlePointerUpOrCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (drag.moved) {
      suppressNextClickRef.current = true;
      window.setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 40);
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore
      }
    }
    dragStateRef.current = null;
    setIsPanning(false);
  };

  const checksByElement = useMemo(() => {
    const map: Record<FacadeTargetElement, SummaryCheckItem[]> = {
      axenweite: [],
      pier: [],
      framing_pier: [],
      corner: [],
      window: [],
      entablature: [],
      pilaster: [],
      cornice: [],
      socle: [],
      belt: [],
    };
    for (const c of summary.checks) {
      map[c.targetElement].push(c);
      // Дублируем нарушение пропорции главного карниза на сам карниз, чтобы наведение на него тоже показывало правило
      if (c.id === 'main_cornice_subordination' && c.targetElement !== 'cornice') {
        map.cornice.push(c);
      }
      // Связанные проверки простенка/наличника доступны при наведении на простенок
      if (c.targetElement === 'framing_pier' && !params.withFraming) {
        map.pier.push(c);
      }
    }
    return map;
  }, [summary.checks, params.withFraming]);

  const getViolationsForElement = (el: FacadeTargetElement): SummaryCheckItem[] => {
    if (hideValidation) return [];
    if (el === 'pier' || el === 'framing_pier') {
      const combined = [...checksByElement.pier, ...checksByElement.framing_pier];
      const seen = new Set<string>();
      return combined.filter((c) => {
        if (c.status !== 'violation' || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
    }
    return checksByElement[el].filter((c) => c.status === 'violation');
  };

  const getWorstCheckStatus = (
    el: FacadeTargetElement,
    baseStatus: ValidationStatus
  ): ValidationStatus => {
    let acc = baseStatus;
    for (const c of checksByElement[el]) {
      acc = mergeStatuses(acc, c.status);
    }
    return acc;
  };

  const cornerStatus = getWorstCheckStatus('corner', summary.cornerCheck.status);
  const pierStatus = getWorstCheckStatus(
    params.withFraming ? 'framing_pier' : 'pier',
    summary.pierResult.status
  );
  const windowStatus = getWorstCheckStatus('window', summary.windowCheck.status);
  const corniceStatus = getWorstCheckStatus(
    'cornice',
    mergeStatuses(summary.corniceCheck.status, summary.mainCorniceCheck.status)
  );
  const pilasterStatus = getWorstCheckStatus('pilaster', summary.pilasterCheck.status);
  const ahStatus = getWorstCheckStatus(
    'axenweite',
    mergeStatuses(summary.ahCheck.status, summary.variantAxisCheck.status)
  );
  const entablatureStatus = getWorstCheckStatus('entablature', summary.framingResult.status);
  const socleBaseStatus: ValidationStatus =
    summary.socleHeightCheck.status === 'violation' ||
    summary.mainCorniceCheck.status === 'violation' ||
    summary.decreasingCheck.status === 'violation'
      ? 'violation'
      : summary.socleHeightCheck.status === 'approx' ||
          summary.rusticationCheck.status !== 'ok' ||
          summary.abkroepfungCheck.status === 'approx'
        ? 'approx'
        : 'ok';
  const socleStatus = getWorstCheckStatus('socle', socleBaseStatus);

  const beltBaseStatus: ValidationStatus =
    summary.beltHeightCheck.status === 'violation' ||
    summary.beltCrowningCheck.status === 'violation' ||
    summary.beltColumnsCheck.status === 'violation' ||
    summary.beltSpecialCheck.status === 'violation' ||
    summary.gurtCheck.status === 'violation'
      ? 'violation'
      : summary.beltCrowningCheck.status === 'approx' ||
          summary.beltSpecialCheck.status === 'approx'
        ? 'approx'
        : 'ok';
  const beltStatus = getWorstCheckStatus('belt', beltBaseStatus);

  const strokeFor = (status: ValidationStatus) =>
    hideValidation ? '#44403C' : STATUS_STROKE[status];
  const fillFor = (status: ValidationStatus) =>
    hideValidation ? 'rgba(68, 64, 60, 0.08)' : STATUS_FILL[status];
  const showViol = (status: ValidationStatus) => !hideValidation && status === 'violation';
  const showNonOk = (status: ValidationStatus) => !hideValidation && status !== 'ok';

  const cancelHideTimer = () => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleHideViolation = () => {
    cancelHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setHoveredViolation(null);
    }, 180);
  };

  const handleElementMouseEnter = (
    el: FacadeTargetElement,
    e: ReactMouseEvent<SVGElement>
  ) => {
    if (hideValidation) return;
    const violations = getViolationsForElement(el);
    if (violations.length === 0) return;
    cancelHideTimer();
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const left = Math.max(12, Math.min(e.clientX + 14, vw - 348));
    const placeAbove = e.clientY + 300 > vh && e.clientY > 240;
    const top = placeAbove ? undefined : Math.max(12, Math.min(e.clientY + 14, vh - 240));
    const bottom = placeAbove ? Math.max(12, vh - e.clientY + 12) : undefined;
    setHoveredViolation({
      element: el,
      left,
      top,
      bottom,
    });
  };

  const violationHoverProps = (el: FacadeTargetElement) =>
    hideValidation
      ? {}
      : {
          onMouseEnter: (e: ReactMouseEvent<SVGElement>) => handleElementMouseEnter(el, e),
          onMouseLeave: scheduleHideViolation,
        };

  const activeViolationItems =
    !hideValidation && hoveredViolation
      ? getViolationsForElement(hoveredViolation.element)
      : [];

  const allViolationElements = useMemo(() => {
    if (hideValidation) return [];
    const order: FacadeTargetElement[] = [
      'axenweite',
      'pier',
      'framing_pier',
      'corner',
      'window',
      'entablature',
      'pilaster',
      'cornice',
      'socle',
      'belt',
    ];
    return order
      .map((el) => ({
        element: el,
        label: ELEMENT_LABELS_RU[el],
        violations: checksByElement[el].filter((c) => c.status === 'violation'),
      }))
      .filter((item) => item.violations.length > 0);
  }, [checksByElement, hideValidation]);

  const p_corner = D - safeW / 2 - effectiveU;
  const p_inter = (axisStepsM[0] ?? safeA) - safeW - 2 * effectiveU;
  const w_v = safeW + 2 * effectiveU;

  const isHi = (el: FacadeTargetElement) => highlightedElement === el;

  const boostMult =
    safeFloors === 5 && params.fiveStoryScheme === 'rich_1_2_unified'
      ? Math.max(1, params.mainCorniceProjectionBoost)
      : 1;
  const corniceOverhangPx =
    Math.min(26, Math.max(8, corniceM * scale * 0.55)) * boostMult;
  const corniceLayers = resolveMainCorniceLayers(
    corniceM,
    summary.corniceCheck.h_u,
    summary.corniceCheck.h_l,
    params.corniceVariantMode,
    params.corniceFullStyle ?? 'frieze_architrave'
  );
  const totalCornicePx = Math.max(8, corniceM * scale);
  const huPx = Math.max(3, (corniceLayers.huM / corniceLayers.totalM) * totalCornicePx);
  const hlPx = Math.max(3, (corniceLayers.hlM / corniceLayers.totalM) * totalCornicePx);
  const hasLowerCornice = corniceLayers.middleM + corniceLayers.bottomBandM > 0.005;
  const lowerCornicePx = hasLowerCornice ? Math.max(4, totalCornicePx - huPx - hlPx) : 0;
  const middleCornicePx =
    hasLowerCornice && corniceLayers.middleM + corniceLayers.bottomBandM > 0
      ? Math.max(
          2,
          lowerCornicePx *
            (corniceLayers.middleM / (corniceLayers.middleM + corniceLayers.bottomBandM))
        )
      : 0;
  const bottomBandCornicePx = hasLowerCornice
    ? Math.max(1.5, lowerCornicePx - middleCornicePx)
    : 0;

  // Позиция и геометрия входа (дверного проёма)
  const entranceGeo = resolveEntranceGeometry(params, totalWidthM, axesM);

  // Позиции пилястров по краям
  const pilasterW = Math.min(params.Wp, Math.max(0.2, p_corner * 0.72));
  const pilasterPxW = pilasterW * scale;

  const renderDimLine = (
    x1: number,
    x2: number,
    y: number,
    label: string,
    status: ValidationStatus,
    onClickEl?: FacadeTargetElement
  ) => {
    const color = strokeFor(status);
    const midX = (x1 + x2) / 2;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const widthPx = maxX - minX;
    return (
      <g
        onClick={onClickEl && onSelectElement ? () => onSelectElement(onClickEl) : undefined}
        {...(onClickEl ? violationHoverProps(onClickEl) : {})}
        className={onClickEl ? 'cursor-pointer' : undefined}
      >
        <line x1={minX} y1={y - 5} x2={minX} y2={y + 5} stroke={color} strokeWidth={1.25} />
        <line x1={maxX} y1={y - 5} x2={maxX} y2={y + 5} stroke={color} strokeWidth={1.25} />
        <line x1={minX} y1={y} x2={maxX} y2={y} stroke={color} strokeWidth={1.35} />
        {widthPx > 14 && (
          <>
            <polygon points={`${minX},${y} ${minX + 5},${y - 2.5} ${minX + 5},${y + 2.5}`} fill={color} />
            <polygon points={`${maxX},${y} ${maxX - 5},${y - 2.5} ${maxX - 5},${y + 2.5}`} fill={color} />
          </>
        )}
        <rect
          x={midX - Math.max(28, label.length * 3.2)}
          y={y - 15}
          width={Math.max(56, label.length * 6.4)}
          height={14}
          fill="#FBF9F5"
          fillOpacity={0.92}
        />
        <text
          x={midX}
          y={y - 4.5}
          textAnchor="middle"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight={500}
          fill={color}
        >
          {label}
        </text>
      </g>
    );
  };

  // Доли трёхчастного цоколя и единая привязка низа пилястр к верху цоколя
  const partsSum = Math.max(
    0.01,
    summary.threePartSocleResult.fuss +
      summary.threePartSocleResult.rumpf +
      summary.threePartSocleResult.deck
  );
  const soclePilasterBounds = resolveSocleAndPilasterBounds(params, summary.derivedGeometry);
  const visualSocleTopM = soclePilasterBounds.socleTopM;
  const plinthPxH = visualSocleTopM * scale;
  const deckPxH = Math.max(3, (summary.threePartSocleResult.deck / partsSum) * plinthPxH);
  const fussPxH = Math.max(3, (summary.threePartSocleResult.fuss / partsSum) * plinthPxH);
  const rumpfPxH = Math.max(4, plinthPxH - deckPxH - fussPxH);
  const isSimpleSocle = Boolean(params.isSimpleSocle);
  const hasSocleRust = !isSimpleSocle && params.hasSocleRustication !== false;
  const rustCourses = hasSocleRust ? Math.min(12, Math.max(1, summary.rusticationCheck.n)) : 0;

  // Главный ярус для подробного показа сандрика
  const activeFramingFloor = safeFloors >= 2 ? 1 : 0;
  const rectOriRu =
    summary.facadeRectCheck.actualOrientation === 'lying'
      ? 'лежачий прямоугольник'
      : summary.facadeRectCheck.actualOrientation === 'standing'
        ? 'стоячий прямоугольник'
        : 'квадрат (избегать)';

  const isViewModified = Math.abs(zoom - 1) > 0.01 || Math.abs(pan.x) > 0.5 || Math.abs(pan.y) > 0.5;
  const zoomPct = Math.round(zoom * 100);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#FBF9F5] flex flex-col'
          : 'border border-[#D6CEBE] bg-[#FBF9F5]'
      }
    >
      {/* Header strip inside drafting sheet */}
      <div className="px-4 py-2.5 border-b border-[#E5DFD3] bg-[#F3EFE6]/85 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#44403C]">
          <span className="font-display text-base font-semibold text-[#1C1917]">
            Ортогональный чертёж ({safeFloors} эт. · {safeAxesCount} осей)
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-[#78716C] tabular-nums">
            W={formatMeters(totalWidthM, 2)} м × H_зд={formatMeters(totalHeightM, 2)} м
            {!hideValidation ? ` (${rectOriRu})` : ''}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!hideValidation && (
            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono tabular-nums pr-2 border-r border-[#D6CEBE]">
              <span className="text-[#15803D]">■ OK</span>
              <span className="text-[#B45309]">▲ ПРИБЛ.</span>
              <span className="text-[#B91C1C]">✕ НАРУШЕНИЕ</span>
            </div>
          )}

          {(onUndo || onRedo) && (
            <div className="inline-flex items-center gap-1 pr-2 border-r border-[#D6CEBE] font-mono text-[11px]">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="Шаг назад — отменить последнее изменение"
                aria-label="Шаг назад"
                className="inline-flex items-center gap-1 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Назад</span>
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title="Шаг вперёд — вернуть отменённое изменение"
                aria-label="Шаг вперёд"
                className="inline-flex items-center gap-1 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Redo2 className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Вперёд</span>
              </button>
            </div>
          )}

          {/* Zoom / Pan / Fullscreen Controls */}
          <div className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums">
            <button
              type="button"
              onClick={() => zoomByFactor(0.8)}
              disabled={zoom <= MIN_ZOOM + 0.001}
              title="Уменьшить масштаб (−)"
              aria-label="Уменьшить масштаб чертежа"
              className="p-1.5 border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              title="Сбросить масштаб до 100% и центрировать (0)"
              className="px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors min-w-[52px] text-center"
            >
              {zoomPct}%
            </button>
            <button
              type="button"
              onClick={() => zoomByFactor(1.25)}
              disabled={zoom >= MAX_ZOOM - 0.001}
              title="Увеличить масштаб (+)"
              aria-label="Увеличить масштаб чертежа"
              className="p-1.5 border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {isViewModified && (
              <button
                type="button"
                onClick={handleResetView}
                title="Сбросить масштаб и сдвиг"
                aria-label="Сбросить масштаб и сдвиг чертежа"
                className="inline-flex items-center gap-1 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5] text-[#57534E] hover:text-[#1C1917] hover:bg-[#EAE3D5] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden md:inline">Сброс</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setHoveredViolation(null);
                setIsFullscreen((v) => !v);
              }}
              aria-pressed={isFullscreen}
              title={
                isFullscreen
                  ? 'Вернуться в обычный режим (Esc)'
                  : 'Развернуть ортогональный чертёж во весь экран'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 border transition-colors whitespace-nowrap shrink-0 ml-1 ${
                isFullscreen
                  ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917] hover:bg-[#292524]'
                  : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Обычный режим</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Во весь экран</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => downloadFacadeDwg(params, summary)}
              title="Скачать ортогональный чертёж в формате AutoCAD DWG (1 ед. = 1 мм, со слоями и размерами)"
              aria-label="Экспортировать ортогональный чертёж в формат DWG"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#9A3412]/45 bg-[#9A3412]/10 text-[#9A3412] hover:bg-[#9A3412] hover:text-[#FBF9F5] transition-colors whitespace-nowrap shrink-0 ml-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DWG</span>
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onClickCapture={(e) => {
          if (suppressNextClickRef.current) {
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        style={{ touchAction: isFullscreen || isViewModified ? 'none' : 'pan-y' }}
        className={`relative overflow-hidden select-none ${
          isFullscreen ? 'flex-1 min-h-0 p-3 sm:p-5 bg-[#FBF9F5]' : 'p-2 sm:p-4'
        } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      >
        <svg
          ref={svgRef}
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          role="img"
          aria-label="Параметрическая схема фасада по правилам Brausewetter 1895"
          className={
            isFullscreen
              ? 'w-full h-full select-none'
              : 'w-full h-auto select-none'
          }
        >
          <rect x={vbX - 400} y={vbY - 400} width={vbW + 800} height={vbH + 800} fill="#FBF9F5" />

          {/* Ground baseline */}
          <line
            x1={padLeft - 24}
            y1={groundY}
            x2={svgW - padRight + 24}
            y2={groundY}
            stroke="#57534E"
            strokeWidth={1.5}
          />

          {/* Main Wall Body */}
          <rect
            x={xM(0)}
            y={yFromGroundM(wallTopM)}
            width={facadePxW}
            height={wallTopM * scale}
            fill="#F4EFE4"
            stroke="#292524"
            strokeWidth={1.4}
          />

          {/* Plinth / Цоколь (Sockel) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectElement?.('socle')}
            {...violationHoverProps('socle')}
          >
            <rect
              x={isSimpleSocle ? xM(0) : xM(0) - 3}
              y={yFromGroundM(visualSocleTopM)}
              width={isSimpleSocle ? facadePxW : facadePxW + 6}
              height={plinthPxH}
              fill={
                isHi('socle')
                  ? fillFor(socleStatus)
                  : showViol(socleStatus)
                    ? 'rgba(185, 28, 28, 0.14)'
                    : '#E6DFD0'
              }
              stroke={
                isHi('socle') || showViol(socleStatus) ? strokeFor(socleStatus) : '#292524'
              }
              strokeWidth={isHi('socle') || showViol(socleStatus) ? 1.8 : 1.2}
            />
            {!isSimpleSocle && (
              <>
                <rect
                  x={xM(0) - 5}
                  y={yFromGroundM(visualSocleTopM)}
                  width={facadePxW + 10}
                  height={deckPxH}
                  fill="#DDD4C0"
                  stroke={isHi('socle') ? strokeFor(socleStatus) : '#44403C'}
                  strokeWidth={0.95}
                />
                {Array.from({ length: Math.max(0, rustCourses - 1) }).map((_, rIdx) => {
                  const lineY =
                    yFromGroundM(visualSocleTopM) + deckPxH + ((rIdx + 1) / rustCourses) * rumpfPxH;
                  return (
                    <line
                      key={rIdx}
                      x1={xM(0) - 2}
                      y1={lineY}
                      x2={xM(0) + facadePxW + 2}
                      y2={lineY}
                      stroke="#78716C"
                      strokeOpacity={0.55}
                      strokeWidth={0.8}
                    />
                  );
                })}
                <rect
                  x={xM(0) - 5}
                  y={groundY - fussPxH}
                  width={facadePxW + 10}
                  height={fussPxH}
                  fill="#D6CEBE"
                  stroke={isHi('socle') ? strokeFor(socleStatus) : '#44403C'}
                  strokeWidth={0.95}
                />
              </>
            )}
            <rect
              x={xM(0) + 6}
              y={yFromGroundM(visualSocleTopM / 2) - 6}
              width={185}
              height={12}
              fill="#FBF9F5"
              fillOpacity={0.82}
            />
            <text
              x={xM(0) + 10}
              y={yFromGroundM(visualSocleTopM / 2) + 3}
              fontSize="9"
              fontFamily="IBM Plex Mono, monospace"
              fill={isHi('socle') ? strokeFor(socleStatus) : '#44403C'}
            >
              Цоколь {formatMeters(effectiveSocleH)} м (
              {isSimpleSocle
                ? 'простой'
                : hasSocleRust
                  ? `${summary.rusticationCheck.n} ряд.`
                  : 'гладкий'}
              )
            </text>
          </g>

          {/* Highlight overlay: Corner pier (left) */}
          <rect
            x={xM(0)}
            y={yFromGroundM(wallTopM)}
            width={Math.max(0, p_corner * scale)}
            height={wallHeightM * scale}
            fill={
              isHi('corner')
                ? fillFor(cornerStatus)
                : showViol(cornerStatus)
                  ? 'rgba(185, 28, 28, 0.14)'
                  : 'transparent'
            }
            stroke={
              isHi('corner') || showViol(cornerStatus)
                ? strokeFor(cornerStatus)
                : 'none'
            }
            strokeWidth={isHi('corner') || showViol(cornerStatus) ? 1.8 : 0}
            strokeDasharray={showViol(cornerStatus) && !isHi('corner') ? '5 3' : undefined}
            className="cursor-pointer"
            onClick={() => onSelectElement?.('corner')}
            {...violationHoverProps('corner')}
          />

          {/* Highlight overlay: Intermediate pier (between axis 0 and 1) */}
          {axesM.length >= 2 && (
            <rect
              x={xM(axesM[0] + safeW / 2 + effectiveU)}
              y={yFromGroundM(wallTopM)}
              width={Math.max(0, p_inter * scale)}
              height={wallHeightM * scale}
              fill={
                isHi('pier') || isHi('framing_pier')
                  ? fillFor(pierStatus)
                  : showViol(pierStatus)
                    ? 'rgba(185, 28, 28, 0.14)'
                    : 'transparent'
              }
              stroke={
                isHi('pier') || isHi('framing_pier') || showViol(pierStatus)
                  ? strokeFor(pierStatus)
                  : 'none'
              }
              strokeWidth={
                isHi('pier') || isHi('framing_pier') || showViol(pierStatus) ? 1.8 : 0
              }
              strokeDasharray={
                showViol(pierStatus) && !isHi('pier') && !isHi('framing_pier')
                  ? '5 3'
                  : undefined
              }
              className="cursor-pointer"
              onClick={() => onSelectElement?.(params.withFraming ? 'framing_pier' : 'pier')}
              {...violationHoverProps(params.withFraming ? 'framing_pier' : 'pier')}
            />
          )}

          {/* Lower-floor colonnade / pilasters hint when beltHasColumnsBelow is enabled (S. 17) */}
          {params.beltHasColumnsBelow &&
            safeFloors >= 2 &&
            floorOffsetsM[1] - Math.max(floorOffsetsM[0], visualSocleTopM) > 0.35 && (
            <g opacity={0.75}>
              {axesM.slice(0, -1).map((axX, idx) => {
                const colX = xM((axX + (axesM[idx + 1] ?? axX + safeA)) / 2);
                const yBot = yFromGroundM(Math.max(floorOffsetsM[0], visualSocleTopM));
                const yTop = yFromGroundM(floorOffsetsM[1]);
                return (
                  <g key={`col-hint-${idx}`}>
                    <rect
                      x={colX - 4}
                      y={yTop + 4}
                      width={8}
                      height={Math.max(8, yBot - yTop - 8)}
                      fill="#EAE3D3"
                      stroke="#78716C"
                      strokeWidth={0.85}
                    />
                    <rect
                      x={colX - 6}
                      y={yTop + 4}
                      width={12}
                      height={4}
                      fill="#D6CEBE"
                      stroke="#57534E"
                      strokeWidth={0.75}
                    />
                    <rect
                      x={colX - 6}
                      y={yBot - 6}
                      width={12}
                      height={4}
                      fill="#D6CEBE"
                      stroke="#57534E"
                      strokeWidth={0.75}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Belt Cornices / Gurtgesimse (S. 16, 22) */}
          {safeFloors >= 2 &&
            (() => {
              const beltMask = resolveBeltFloorsMask(params, safeFloors);
              const beltSillMask = resolveBeltSillFloorsMask(params, safeFloors);
              const anyBeltsOn = hasAnyActiveBelt(params, safeFloors);
              const firstNormalBoundaryIdx = beltMask.findIndex(
                (on, boundaryIdx) => on && !beltSillMask[boundaryIdx]
              );
              const firstSillBoundaryIdx = beltSillMask.findIndex(Boolean);
              return floorOffsetsM.slice(1).map((floorStartM, idx) => {
                const upperFloorNum = idx + 2; // 2nd, 3rd...
                const upperFloorH = floorHeightsM[idx + 1] ?? floorHeightsM[0] ?? safeH;
                const isUpperBelt = upperFloorNum === 3;
                const beltEnabledHere = isBeltEnabledAboveFloor(params, idx, safeFloors);

                if (!beltEnabledHere) {
                  return (
                    <g
                      key={`gurt-off-${upperFloorNum}`}
                      className="cursor-pointer"
                      onClick={() => onSelectElement?.('belt')}
                      {...violationHoverProps('belt')}
                    >
                      <rect
                        x={xM(0)}
                        y={yFromGroundM(floorStartM) - 8}
                        width={facadePxW}
                        height={16}
                        fill={showViol(beltStatus) && !anyBeltsOn ? 'rgba(185, 28, 28, 0.08)' : 'transparent'}
                      />
                      <line
                        x1={xM(0)}
                        y1={yFromGroundM(floorStartM)}
                        x2={xM(0) + facadePxW}
                        y2={yFromGroundM(floorStartM)}
                        stroke={
                          isHi('belt') || (!anyBeltsOn && showNonOk(beltStatus))
                            ? strokeFor(beltStatus)
                            : '#A8A29E'
                        }
                        strokeOpacity={isHi('belt') || (!anyBeltsOn && showNonOk(beltStatus)) ? 0.9 : 0.45}
                        strokeWidth={!anyBeltsOn && showViol(beltStatus) ? 1.5 : 0.9}
                        strokeDasharray="5 4"
                      />
                      {!hideValidation &&
                        upperFloorNum === 2 &&
                        !anyBeltsOn &&
                        (isHi('belt') || beltStatus !== 'ok' || params.beltOnlySillUnderSecond) && (
                          <text
                            x={xM(0) + facadePxW / 2}
                            y={yFromGroundM(floorStartM) - 4}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontFamily="IBM Plex Mono, monospace"
                            fill={
                              beltStatus === 'violation'
                                ? '#B91C1C'
                                : beltStatus === 'approx'
                                  ? '#B45309'
                                  : '#57534E'
                            }
                          >
                            {params.beltOnlySillUnderSecond
                              ? '▲ только подоконник под 2 эт. (редко, S. 22)'
                              : 'Без ленты — этажи единым целым'}
                          </text>
                        )}
                    </g>
                  );
                }

              const beltBand = resolveBeltVerticalBandM(params, verticalGeo, idx) ?? {
                boundaryIdx: idx,
                floorStartM,
                centerM: floorStartM,
                bottomM: floorStartM - Math.max(0.08, params.hGurt) / 2,
                topM: floorStartM + Math.max(0.08, params.hGurt) / 2,
                thicknessM: Math.max(0.08, params.hGurt),
                isSillMode: false,
              };
              const isSillMode = beltBand.isSillMode;
              const yBelt = yFromGroundM(beltBand.centerM);
              const beltTopY = yFromGroundM(beltBand.topM);
              const beltBotY = yFromGroundM(beltBand.bottomM);
              const rawBeltThicknessPx = Math.max(0, beltBotY - beltTopY);
              const beltThicknessPx = Math.max(2.5, rawBeltThicknessPx);
              const beltRectY =
                rawBeltThicknessPx >= 2.5 ? beltTopY : yBelt - beltThicknessPx / 2;

              const beltStroke =
                isHi('belt') || showNonOk(beltStatus)
                  ? strokeFor(beltStatus)
                  : '#57534E';
              const beltFill =
                isHi('belt') || showViol(beltStatus)
                  ? fillFor(beltStatus)
                  : params.beltMode === 'crowning'
                    ? '#D6CEBE'
                    : '#DFD6C3';

              // Замена ленты рустовкой (Fugenteilung + Fußprofil)
              if (params.beltAsRusticationMode) {
                const rustHeightPx = Math.max(4, beltBotY - beltTopY);
                const baseTopY = yFromGroundM(beltBand.centerM);
                const baseHeightPx = Math.max(2, beltBotY - baseTopY);
                return (
                  <g
                    key={`gurt-rust-${upperFloorNum}`}
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('belt')}
                    {...violationHoverProps('belt')}
                  >
                    <rect
                      x={xM(0)}
                      y={beltTopY}
                      width={facadePxW}
                      height={rustHeightPx}
                      fill={
                        isHi('belt') || showViol(beltStatus)
                          ? fillFor(beltStatus)
                          : 'rgba(214, 206, 190, 0.35)'
                      }
                      stroke={showViol(beltStatus) ? strokeFor('violation') : 'none'}
                      strokeWidth={showViol(beltStatus) ? 1.2 : 0}
                    />
                    <line
                      x1={xM(0)}
                      y1={yFromGroundM(beltBand.centerM + 0.12)}
                      x2={xM(0) + facadePxW}
                      y2={yFromGroundM(beltBand.centerM + 0.12)}
                      stroke="#78716C"
                      strokeWidth={0.75}
                      strokeDasharray="6 3"
                    />
                    <line
                      x1={xM(0)}
                      y1={yFromGroundM(beltBand.centerM + 0.05)}
                      x2={xM(0) + facadePxW}
                      y2={yFromGroundM(beltBand.centerM + 0.05)}
                      stroke="#78716C"
                      strokeWidth={0.75}
                      strokeDasharray="6 3"
                    />
                    {params.beltRusticationHasBaseProfile && (
                      <rect
                        x={xM(0) - 3}
                        y={baseTopY}
                        width={facadePxW + 6}
                        height={baseHeightPx}
                        fill="#D6CEBE"
                        stroke={beltStroke}
                        strokeWidth={0.9}
                      />
                    )}
                    {!hideValidation && !params.beltRusticationHasBaseProfile && upperFloorNum === 2 && (
                      <text
                        x={xM(0) + facadePxW / 2}
                        y={yBelt + 12}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#B91C1C"
                      >
                        ✕ рустовка без базового профиля (S. 16)
                      </text>
                    )}
                  </g>
                );
              }

              return (
                <g
                  key={`gurt-${upperFloorNum}`}
                  className="cursor-pointer"
                  onClick={() => onSelectElement?.('belt')}
                  {...violationHoverProps('belt')}
                >
                  <rect
                    x={xM(0) - (params.beltMode === 'crowning' ? 7 : 5)}
                    y={beltRectY}
                    width={facadePxW + (params.beltMode === 'crowning' ? 14 : 10)}
                    height={beltThicknessPx}
                    fill={beltFill}
                    stroke={beltStroke}
                    strokeWidth={isHi('belt') || showViol(beltStatus) ? 1.5 : 1}
                    strokeDasharray={isSillMode ? '4 2' : undefined}
                  />
                  {((!isSillMode && idx === firstNormalBoundaryIdx) ||
                    (isSillMode && idx === firstSillBoundaryIdx)) && (
                    <g>
                      <rect
                        x={xM(0) + facadePxW - 142}
                        y={beltRectY - 12}
                        width={138}
                        height={11}
                        fill="#FBF9F5"
                        fillOpacity={0.9}
                      />
                      <text
                        x={xM(0) + facadePxW - 6}
                        y={beltRectY - 4}
                        textAnchor="end"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight={isHi('belt') || showNonOk(beltStatus) ? 600 : 400}
                        fill={beltStroke}
                      >
                        {isSillMode ? 'Подокон. ' : 'Лента '}
                        {formatMeters(params.hGurt, 2)}м
                        {!hideValidation ? ` (${STATUS_TAG[beltStatus]})` : ''}
                      </text>
                    </g>
                  )}
                </g>
              );
            });
            })()}

          {/* Pilasters / Mauerpfeiler (поэтажные диапазоны >= верха цоколя; по краям или в каждом простенке) */}
          {(() => {
            const pilasterSpans = resolvePilasterElevationSpans(params, summary.derivedGeometry);
            const pilasterXPositions = resolvePilasterXPositions(
              params,
              totalWidthM,
              axesM,
              pilasterW
            );
            const strokeCol =
              isHi('pilaster') || showViol(pilasterStatus)
                ? strokeFor(pilasterStatus)
                : '#57534E';
            return pilasterSpans.map((span, spanIdx) => {
              const yTop = yFromGroundM(span.topM);
              const yBot = yFromGroundM(span.bottomM);
              const hPx = Math.max(4, yBot - yTop);
              const capH = params.isMauerpfeiler ? 0 : Math.min(18, hPx * 0.08);
              const baseH = params.isMauerpfeiler ? 0 : Math.min(14, hPx * 0.06);
              return pilasterXPositions.map((px, posIdx) => {
                const xLeft = xM(px.xStartM);
                return (
                  <g
                    key={`pil-${spanIdx}-${posIdx}`}
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('pilaster')}
                    {...violationHoverProps('pilaster')}
                  >
                    <rect
                      x={xLeft}
                      y={yTop + capH}
                      width={pilasterPxW}
                      height={Math.max(4, hPx - capH - baseH)}
                      fill={
                        isHi('pilaster') || showViol(pilasterStatus)
                          ? fillFor(pilasterStatus)
                          : '#EAE3D3'
                      }
                      stroke={strokeCol}
                      strokeWidth={isHi('pilaster') || showViol(pilasterStatus) ? 1.6 : 1}
                    />
                    {!params.isMauerpfeiler && (
                      <>
                        <rect
                          x={xLeft - 2}
                          y={yTop}
                          width={pilasterPxW + 4}
                          height={capH}
                          fill={showViol(pilasterStatus) ? fillFor('violation') : '#DFD6C3'}
                          stroke={strokeCol}
                          strokeWidth={showViol(pilasterStatus) ? 1.4 : 1}
                        />
                        <rect
                          x={xLeft - 2}
                          y={yTop + hPx - baseH}
                          width={pilasterPxW + 4}
                          height={baseH}
                          fill={showViol(pilasterStatus) ? fillFor('violation') : '#DFD6C3'}
                          stroke={strokeCol}
                          strokeWidth={showViol(pilasterStatus) ? 1.4 : 1}
                        />
                      </>
                    )}
                  </g>
                );
              });
            });
          })()}

          {/* Crowning Cornice (Главный карниз) — строго от wallTopM до corniceTopM */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectElement?.('cornice')}
            {...violationHoverProps('cornice')}
          >
            <rect
              x={xM(0) - corniceOverhangPx}
              y={yFromGroundM(corniceTopM)}
              width={facadePxW + corniceOverhangPx * 2}
              height={huPx}
              fill={
                isHi('cornice') || showViol(corniceStatus)
                  ? fillFor(corniceStatus)
                  : '#DFD6C3'
              }
              stroke={
                isHi('cornice') || showViol(corniceStatus)
                  ? strokeFor(corniceStatus)
                  : '#292524'
              }
              strokeWidth={showViol(corniceStatus) ? 1.8 : 1.25}
            />
            <rect
              x={xM(0) - corniceOverhangPx * 0.55}
              y={yFromGroundM(corniceTopM) + huPx}
              width={facadePxW + corniceOverhangPx * 1.1}
              height={hlPx}
              fill={
                isHi('cornice') || showViol(corniceStatus)
                  ? fillFor(corniceStatus)
                  : '#EAE3D3'
              }
              stroke={
                isHi('cornice') || showViol(corniceStatus)
                  ? strokeFor(corniceStatus)
                  : '#292524'
              }
              strokeWidth={showViol(corniceStatus) ? 1.6 : 1.1}
            />
            {hasLowerCornice && (
              <>
                <rect
                  x={
                    xM(0) -
                    corniceOverhangPx * (corniceLayers.fullStyle === 'neck_band' ? 0.04 : 0.12)
                  }
                  y={yFromGroundM(corniceTopM) + huPx + hlPx}
                  width={
                    facadePxW +
                    corniceOverhangPx * (corniceLayers.fullStyle === 'neck_band' ? 0.08 : 0.24)
                  }
                  height={middleCornicePx}
                  fill={
                    isHi('cornice') || showViol(corniceStatus)
                      ? fillFor(corniceStatus)
                      : corniceLayers.fullStyle === 'neck_band'
                        ? '#F4EFE2'
                        : '#F0EAD8'
                  }
                  stroke={
                    isHi('cornice') || showViol(corniceStatus)
                      ? strokeFor(corniceStatus)
                      : '#292524'
                  }
                  strokeWidth={showViol(corniceStatus) ? 1.5 : 1.0}
                />
                <rect
                  x={
                    xM(0) -
                    corniceOverhangPx * (corniceLayers.fullStyle === 'neck_band' ? 0.28 : 0.22)
                  }
                  y={yFromGroundM(corniceTopM) + huPx + hlPx + middleCornicePx}
                  width={
                    facadePxW +
                    corniceOverhangPx * (corniceLayers.fullStyle === 'neck_band' ? 0.56 : 0.44)
                  }
                  height={bottomBandCornicePx}
                  fill={
                    isHi('cornice') || showViol(corniceStatus)
                      ? fillFor(corniceStatus)
                      : corniceLayers.fullStyle === 'neck_band'
                        ? '#DAD0BA'
                        : '#E2DAC5'
                  }
                  stroke={
                    isHi('cornice') || showViol(corniceStatus)
                      ? strokeFor(corniceStatus)
                      : '#292524'
                  }
                  strokeWidth={showViol(corniceStatus) ? 1.5 : 1.05}
                />
              </>
            )}
          </g>

          {/* Vertical Window Axes + Windows per floor */}
          {axesM.map((axisM, axIdx) => {
            const cx = xM(axisM);
            return (
              <g key={`axis-${axIdx}`}>
                <line
                  x1={cx}
                  y1={padTop - 20}
                  x2={cx}
                  y2={groundY + 18}
                  stroke={showViol(ahStatus) ? '#B91C1C' : '#9A3412'}
                  strokeOpacity={showViol(ahStatus) ? 0.72 : 0.4}
                  strokeWidth={showViol(ahStatus) ? 1.35 : 0.85}
                  strokeDasharray="5 3"
                />
                {showViol(ahStatus) && (
                  <line
                    x1={cx}
                    y1={padTop - 20}
                    x2={cx}
                    y2={groundY + 18}
                    stroke="transparent"
                    strokeWidth={14}
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('axenweite')}
                    {...violationHoverProps('axenweite')}
                  />
                )}
                {floorOffsetsM.map((_floorStartM, flIdx) => {
                  const isDoorReplacedWindow =
                    entranceGeo.hasDoor && flIdx === 0 && axIdx === entranceGeo.doorAxisIndex;
                  if (isDoorReplacedWindow) {
                    return null;
                  }
                  const winGeo = resolveFloorWindowGeometryM(
                    params,
                    verticalGeo,
                    flIdx,
                    summary.variantInfo.rules.upperFloorSmallest
                  );
                  const winHThisFloor = winGeo.windowHeightM;
                  const winTopThisM = winGeo.windowTopM;
                  const floorHasSillBelt = isFloorWindowSillBeltActive(params, flIdx, safeFloors);

                  const winX = xM(axisM - safeW / 2);
                  const winY = yFromGroundM(winTopThisM);
                  const winWpx = safeW * scale;
                  const winHpx = winHThisFloor * scale;

                  const showRichFraming = params.withFraming && flIdx === activeFramingFloor;
                  const uPx = effectiveU * scale;
                  const { R, F, K } = summary.framingResult;
                  const rPx = R * scale;
                  const fPx = F * scale;
                  const kPx = K * scale;
                  const kOverhangPx = params.withConsoles
                    ? ((K * 5) / 6) * scale * 0.55
                    : K * scale * 0.55;

                  return (
                    <g key={`win-${axIdx}-${flIdx}`}>
                      {showRichFraming && (
                        <g
                          className="cursor-pointer"
                          onClick={() => onSelectElement?.('entablature')}
                          {...violationHoverProps('entablature')}
                        >
                          <rect
                            x={winX - uPx}
                            y={winY - rPx}
                            width={winWpx + 2 * uPx}
                            height={winHpx + rPx + (floorHasSillBelt ? 0 : uPx * 0.5)}
                            fill={
                              isHi('entablature') || showViol(entablatureStatus)
                                ? fillFor(entablatureStatus)
                                : '#E6DEC9'
                            }
                            stroke={
                              isHi('entablature') || showViol(entablatureStatus)
                                ? strokeFor(entablatureStatus)
                                : '#44403C'
                            }
                            strokeWidth={showViol(entablatureStatus) ? 1.6 : 1.05}
                          />
                          {fPx > 0.01 && (
                            <rect
                              x={winX - uPx}
                              y={winY - rPx - fPx}
                              width={winWpx + 2 * uPx}
                              height={Math.max(2, fPx)}
                              fill={showViol(entablatureStatus) ? fillFor('violation') : '#EFE8D7'}
                              stroke={
                                isHi('entablature') || showViol(entablatureStatus)
                                  ? strokeFor(entablatureStatus)
                                  : '#44403C'
                              }
                              strokeWidth={showViol(entablatureStatus) ? 1.4 : 0.95}
                            />
                          )}
                          {params.withConsoles && K > 1e-6 && (
                            <>
                              <rect
                                x={winX - uPx - 3}
                                y={winY - rPx - fPx * 0.85}
                                width={Math.max(4, uPx * 0.7)}
                                height={Math.max(4, fPx + rPx * 0.5)}
                                fill="#D6CEBE"
                                stroke={
                                  showViol(entablatureStatus)
                                    ? strokeFor('violation')
                                    : '#44403C'
                                }
                                strokeWidth={0.85}
                              />
                              <rect
                                x={winX + winWpx + uPx + 3 - Math.max(4, uPx * 0.7)}
                                y={winY - rPx - fPx * 0.85}
                                width={Math.max(4, uPx * 0.7)}
                                height={Math.max(4, fPx + rPx * 0.5)}
                                fill="#D6CEBE"
                                stroke={
                                  showViol(entablatureStatus)
                                    ? strokeFor('violation')
                                    : '#44403C'
                                }
                                strokeWidth={0.85}
                              />
                            </>
                          )}
                          {kPx > 0.01 && (() => {
                            const capH = Math.max(3, kPx);
                            const capBotY = winY - rPx - fPx;
                            const capTopY = capBotY - capH;
                            const innerL = winX - uPx;
                            const innerR = winX + winWpx + uPx;
                            const outerL = innerL - kOverhangPx;
                            const outerR = innerR + kOverhangPx;
                            return (
                              <polygon
                                points={`${outerL},${capTopY} ${outerR},${capTopY} ${innerR},${capBotY} ${innerL},${capBotY}`}
                                fill={showViol(entablatureStatus) ? fillFor('violation') : '#DDD4C0'}
                                stroke={
                                  isHi('entablature') || showViol(entablatureStatus)
                                    ? strokeFor(entablatureStatus)
                                    : '#292524'
                                }
                                strokeLinejoin="miter"
                                strokeWidth={showViol(entablatureStatus) ? 1.6 : 1.1}
                              />
                            );
                          })()}
                        </g>
                      )}

                      {params.withFraming && flIdx !== activeFramingFloor && (
                        <rect
                          x={winX - uPx * 0.65}
                          y={winY - uPx * 0.65}
                          width={winWpx + uPx * 1.3}
                          height={winHpx + uPx * (floorHasSillBelt ? 0.65 : 1.1)}
                          fill="#EAE3D3"
                          stroke="#57534E"
                          strokeWidth={0.8}
                        />
                      )}

                      <g
                        className="cursor-pointer"
                        onClick={() => onSelectElement?.('window')}
                        {...violationHoverProps('window')}
                      >
                        <rect
                          x={winX}
                          y={winY}
                          width={winWpx}
                          height={winHpx}
                          fill={
                            isHi('window')
                              ? fillFor(windowStatus)
                              : showViol(windowStatus)
                                ? 'rgba(185, 28, 28, 0.16)'
                                : '#D6DEE2'
                          }
                          stroke={
                            isHi('window') || showNonOk(windowStatus)
                              ? strokeFor(windowStatus)
                              : '#292524'
                          }
                          strokeWidth={isHi('window') || showViol(windowStatus) ? 1.8 : 1.1}
                        />
                        <line
                          x1={cx}
                          y1={winY}
                          x2={cx}
                          y2={winY + winHpx}
                          stroke="#57534E"
                          strokeWidth={0.75}
                        />
                        <line
                          x1={winX}
                          y1={winY + winHpx * 0.36}
                          x2={winX + winWpx}
                          y2={winY + winHpx * 0.36}
                          stroke="#57534E"
                          strokeWidth={0.75}
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* ENTRANCE DOOR (standalone so both center-of-facade and axis placement work) */}
          {entranceGeo.hasDoor &&
            (() => {
              const doorCx = xM(entranceGeo.doorCenterX);
              const doorWpx = Math.max(10, entranceGeo.doorWidthM * scale);
              const doorX = doorCx - doorWpx / 2;
              const doorTopY = yFromGroundM(entranceGeo.doorTopM);
              const doorBottomY = yFromGroundM(entranceGeo.doorBottomM);
              const doorHpx = Math.max(8, doorBottomY - doorTopY);
              const hasSteps = entranceGeo.doorBottomM > 0.05;
              const stepCount = hasSteps
                ? Math.min(6, Math.max(2, Math.round(entranceGeo.doorBottomM / 0.16)))
                : 0;
              return (
                <g
                  className="cursor-pointer"
                  onClick={() =>
                    onSelectEntrance ? onSelectEntrance() : onSelectElement?.('axenweite')
                  }
                >
                  <rect
                    x={doorX - 3}
                    y={doorTopY - 3}
                    width={doorWpx + 6}
                    height={doorHpx + 3}
                    fill="#D6CEBE"
                    stroke="#292524"
                    strokeWidth={1.1}
                  />
                  <rect
                    x={doorX}
                    y={doorTopY}
                    width={doorWpx}
                    height={doorHpx}
                    fill="#6D4C3D"
                    fillOpacity={0.85}
                    stroke="#1C1917"
                    strokeWidth={1}
                  />
                  <line
                    x1={doorCx}
                    y1={doorTopY}
                    x2={doorCx}
                    y2={doorBottomY}
                    stroke="#FBF9F5"
                    strokeOpacity={0.6}
                    strokeWidth={0.8}
                  />
                  {hasSteps && (
                    <g>
                      {Array.from({ length: stepCount }, (_, sIdx) => {
                        const t0 = sIdx / stepCount;
                        const t1 = (sIdx + 1) / stepCount;
                        const yS0 = doorBottomY + t0 * (groundY - doorBottomY);
                        const yS1 = doorBottomY + t1 * (groundY - doorBottomY);
                        const stepGrow = (sIdx + 1) * 3.5;
                        return (
                          <rect
                            key={`door-step-${sIdx}`}
                            x={doorX - 3 - stepGrow}
                            y={yS0}
                            width={doorWpx + 6 + stepGrow * 2}
                            height={Math.max(1.5, yS1 - yS0)}
                            fill="#DDD5C5"
                            stroke="#44403C"
                            strokeWidth={0.75}
                          />
                        );
                      })}
                    </g>
                  )}
                  <text
                    x={doorCx}
                    y={groundY + 11}
                    textAnchor="middle"
                    fontSize="8"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#9A3412"
                  >
                    вход ({formatMeters(entranceGeo.doorWidthM, 2)}×{formatMeters(entranceGeo.doorHeightM, 2)})
                  </text>
                </g>
              );
            })()}

          {/* LEFT VERTICAL ELEVATION DATUM CHAIN (0.00 = 1st floor) & FLOOR TAGS */}
          {(() => {
            const chainX = xM(0) - 18;
            const shelfLeftX = xM(0) - 70;
            const datum0M = floorOffsetsM[0] ?? groundToFloor1;
            const hasIndependentCorniceBottom =
              Math.abs(corniceBottomM - topFloorTopM) > 0.01;
            const chainTopY = yFromGroundM(Math.max(topFloorTopM, corniceBottomM));
            const formatElev = (relM: number) => {
              if (Math.abs(relM) < 0.005) return '0.00';
              const val = formatMeters(Math.abs(relM), 2);
              return relM > 0 ? `+${val}` : `-${val}`;
            };
            const groundElevText = formatElev(-datum0M);
            const levelHeightsM = [...floorOffsetsM, topFloorTopM];
            const yTopCeiling = yFromGroundM(topFloorCeilingM);
            const yCorniceBot = yFromGroundM(corniceBottomM);

            return (
              <g aria-label="Размерная цепочка высот слева от фасада">
                {/* Пунктирная линия отметки потолка верхнего этажа при несовпадении с низом гл. карниза */}
                {Math.abs(corniceBottomM - topFloorCeilingM) > 0.01 && (
                  <g aria-label="Отметка потолка верхнего этажа">
                    <line
                      x1={xM(0)}
                      y1={yTopCeiling}
                      x2={xM(totalWidthM)}
                      y2={yTopCeiling}
                      stroke="#78716C"
                      strokeOpacity={hasIndependentCorniceBottom ? 0.65 : 0.32}
                      strokeWidth={0.8}
                      strokeDasharray="4 3"
                    />
                    {hasIndependentCorniceBottom && (
                      <text
                        x={xM(totalWidthM) - 4}
                        y={yTopCeiling - 3}
                        textAnchor="end"
                        fontSize="7.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#78716C"
                      >
                        потолок {formatElev(topFloorCeilingM - datum0M)}
                      </text>
                    )}
                  </g>
                )}

                {/* Непрерывная вертикальная линия размерной цепочки от уровня земли до верха цепи отметок */}
                <line
                  x1={chainX}
                  y1={groundY}
                  x2={chainX}
                  y2={chainTopY}
                  stroke="#57534E"
                  strokeWidth={1.05}
                />

                {/* Отметка уровня земли */}
                <g>
                  <line
                    x1={shelfLeftX}
                    y1={groundY}
                    x2={xM(0)}
                    y2={groundY}
                    stroke="#57534E"
                    strokeWidth={0.85}
                    strokeDasharray="3 2"
                  />
                  <line
                    x1={chainX - 3.5}
                    y1={groundY + 3.5}
                    x2={chainX + 3.5}
                    y2={groundY - 3.5}
                    stroke="#44403C"
                    strokeWidth={1.25}
                  />
                  <polygon
                    points={`${chainX - 11},${groundY} ${chainX - 15},${groundY - 6} ${chainX - 7},${groundY - 6}`}
                    fill="#FBF9F5"
                    stroke="#57534E"
                    strokeWidth={0.95}
                  />
                  <rect
                    x={shelfLeftX - 4}
                    y={groundY + 2}
                    width={62}
                    height={12}
                    fill="#FBF9F5"
                    fillOpacity={0.92}
                  />
                  <text
                    x={chainX - 4}
                    y={groundY + 11}
                    textAnchor="end"
                    fontSize="8.5"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#57534E"
                  >
                    {groundElevText} земля
                  </text>
                </g>

                {/* Отметки уровня пола 1-го, 2-го и последующих этажей + верхняя граница верхнего этажа */}
                {levelHeightsM.map((lvlM, lvlIdx) => {
                  const yLvl = yFromGroundM(lvlM);
                  const isFloor1 = lvlIdx === 0;
                  const elevText = formatElev(lvlM - datum0M);
                  const strokeCol = isFloor1 ? '#9A3412' : '#44403C';
                  return (
                    <g key={`elev-lvl-${lvlIdx}`}>
                      <line
                        x1={shelfLeftX}
                        y1={yLvl}
                        x2={xM(0)}
                        y2={yLvl}
                        stroke={isFloor1 ? '#9A3412' : '#78716C'}
                        strokeOpacity={isFloor1 ? 0.75 : 0.55}
                        strokeWidth={isFloor1 ? 0.95 : 0.75}
                        strokeDasharray="3 2"
                      />
                      <line
                        x1={chainX - 3.5}
                        y1={yLvl + 3.5}
                        x2={chainX + 3.5}
                        y2={yLvl - 3.5}
                        stroke={strokeCol}
                        strokeWidth={1.25}
                      />
                      <polygon
                        points={`${chainX - 11},${yLvl} ${chainX - 15},${yLvl - 6} ${chainX - 7},${yLvl - 6}`}
                        fill={isFloor1 ? '#9A3412' : '#FBF9F5'}
                        stroke={strokeCol}
                        strokeWidth={0.95}
                      />
                      <rect
                        x={shelfLeftX + 4}
                        y={yLvl - 14}
                        width={46}
                        height={11}
                        fill="#FBF9F5"
                        fillOpacity={0.92}
                      />
                      <text
                        x={chainX - 17}
                        y={yLvl - 4}
                        textAnchor="end"
                        fontSize="9"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight={isFloor1 ? 700 : 500}
                        fill={strokeCol}
                      >
                        {elevText}
                      </text>
                    </g>
                  );
                })}

                {/* Независимая отметка низа главного карниза, если он не совпадает с верхом верхнего этажа */}
                {hasIndependentCorniceBottom && (
                  <g aria-label="Отметка низа главного карниза">
                    <line
                      x1={shelfLeftX - 10}
                      y1={yCorniceBot}
                      x2={xM(0)}
                      y2={yCorniceBot}
                      stroke="#9A3412"
                      strokeOpacity={0.7}
                      strokeWidth={0.85}
                      strokeDasharray="3 2"
                    />
                    <line
                      x1={chainX - 3.5}
                      y1={yCorniceBot + 3.5}
                      x2={chainX + 3.5}
                      y2={yCorniceBot - 3.5}
                      stroke="#9A3412"
                      strokeWidth={1.25}
                    />
                    <rect
                      x={shelfLeftX - 14}
                      y={yCorniceBot - 14}
                      width={66}
                      height={11}
                      fill="#FBF9F5"
                      fillOpacity={0.94}
                    />
                    <text
                      x={chainX - 6}
                      y={yCorniceBot - 4}
                      textAnchor="end"
                      fontSize="8"
                      fontFamily="IBM Plex Mono, monospace"
                      fontWeight={600}
                      fill="#9A3412"
                    >
                      {formatElev(corniceBottomM - datum0M)} гл.к.
                    </text>
                  </g>
                )}

                {/* Высота каждого этажа по размерной цепочке (включая верхний этаж и 1-й в одноэтажном доме) */}
                {floorOffsetsM.map((floorStartM, flIdx) => {
                  const flH = floorHeightsM[flIdx] ?? safeH;
                  const yBot = yFromGroundM(floorStartM);
                  const yTop = yFromGroundM(floorStartM + flH);
                  const floorPxH = Math.abs(yBot - yTop);
                  if (floorPxH < 18) return null;
                  const segY = Math.min((yBot + yTop) / 2 + 3, yBot - 15);
                  return (
                    <g key={`elev-seg-h-${flIdx}`}>
                      <rect
                        x={chainX - 42}
                        y={segY - 8.5}
                        width={37}
                        height={10.5}
                        fill="#FBF9F5"
                        fillOpacity={0.92}
                      />
                      <text
                        x={chainX - 6}
                        y={segY}
                        textAnchor="end"
                        fontSize="8"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#57534E"
                      >
                        {formatMeters(flH, 2)} м
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {floorOffsetsM.map((floorStartM, flIdx) => {
            const flMidY = yFromGroundM(floorStartM + floorHeightsM[flIdx] / 2);
            const flNum = flIdx + 1;
            const isMainTier =
              safeFloors >= 3 && summary.variantInfo.rules.mainTierFloor === flNum;
            const isFullSocle = flNum === 1 && params.useFullFloorAsSocle;
            const isUnified12 =
              safeFloors === 5 &&
              params.fiveStoryScheme === 'rich_1_2_unified' &&
              (flNum === 1 || flNum === 2);
            let tag = `${flNum} эт.`;
            if (isUnified12) tag = `${flNum} эт. (объед.)`;
            else if (isFullSocle) tag = '1 эт. (цоколь)';
            else if (isMainTier) tag = '2 эт. (главн.)';
            else if (safeFloors >= 3 && flNum === safeFloors && summary.variantInfo.rules.upperFloorSmallest) {
              tag = `${flNum} эт. (мал.)`;
            }
            return (
              <text
                key={`fl-tag-${flNum}`}
                x={xM(0) - 76}
                y={flMidY + 3}
                textAnchor="end"
                fontSize="8.5"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight={isMainTier || isFullSocle || isUnified12 ? 600 : 400}
                fill={isUnified12 || isMainTier ? '#9A3412' : '#57534E'}
              >
                {tag}
              </text>
            );
          })}

          {/* TOP DIMENSION LINES: D and A */}
          {renderDimLine(
            xM(0),
            xM(axesM[0]),
            padTop - 26,
            hideValidation ? `D = ${formatMeters(D)}` : `D = ${formatMeters(D)} (${STATUS_TAG[cornerStatus]})`,
            cornerStatus,
            'corner'
          )}
          {axesM.length >= 2 &&
            (!hasVariedAxisSteps
              ? renderDimLine(
                  xM(axesM[0]),
                  xM(axesM[1]),
                  padTop - 26,
                  hideValidation
                    ? `A = ${formatMeters(safeA)}`
                    : `A = ${formatMeters(safeA)} (${STATUS_TAG[ahStatus]})`,
                  ahStatus,
                  'axenweite'
                )
              : axisStepsM.map((stepM, idx) => (
                  <g key={`top-step-${idx}`}>
                    {renderDimLine(
                      xM(axesM[idx]),
                      xM(axesM[idx + 1]),
                      padTop - 26,
                      `A${idx + 1}=${formatMeters(stepM)}`,
                      ahStatus,
                      'axenweite'
                    )}
                  </g>
                )))}

          {/* BOTTOM DIMENSION LINES: p_corner, w / w_v, p / p_c */}
          {renderDimLine(
            xM(0),
            xM(axesM[0] - safeW / 2 - effectiveU),
            groundY + 26,
            `p_cор = ${formatMeters(p_corner)}`,
            cornerStatus,
            'corner'
          )}
          {renderDimLine(
            xM(axesM[0] - safeW / 2 - effectiveU),
            xM(axesM[0] + safeW / 2 + effectiveU),
            groundY + 52,
            params.withFraming
              ? `w_v = ${formatMeters(w_v)} (w=${formatMeters(safeW)})`
              : `w = ${formatMeters(safeW)}`,
            windowStatus,
            'window'
          )}
          {axesM.length >= 2 &&
            (!hasVariedAxisSteps
              ? renderDimLine(
                  xM(axesM[0] + safeW / 2 + effectiveU),
                  xM(axesM[1] - safeW / 2 - effectiveU),
                  groundY + 26,
                  params.withFraming
                    ? hideValidation
                      ? `p_c = ${formatMeters(p_inter)}`
                      : `p_c = ${formatMeters(p_inter)} (${STATUS_TAG[pierStatus]})`
                    : hideValidation
                      ? `p = ${formatMeters(p_inter)}`
                      : `p = ${formatMeters(p_inter)} (${STATUS_TAG[pierStatus]})`,
                  pierStatus,
                  params.withFraming ? 'framing_pier' : 'pier'
                )
              : axisStepsM.map((stepM, idx) => {
                  const pierW = Math.max(0, stepM - safeW - 2 * effectiveU);
                  return (
                    <g key={`bot-pier-${idx}`}>
                      {renderDimLine(
                        xM(axesM[idx] + safeW / 2 + effectiveU),
                        xM(axesM[idx + 1] - safeW / 2 - effectiveU),
                        groundY + 26,
                        params.withFraming
                          ? `p_c${idx + 1}=${formatMeters(pierW)}`
                          : `p${idx + 1}=${formatMeters(pierW)}`,
                        pierStatus,
                        params.withFraming ? 'framing_pier' : 'pier'
                      )}
                    </g>
                  );
                }))}

          {/* Ordinary Pier Axes (ONLY below ground level) + dedicated dimension chain */}
          {hasPierAxesDimChain && (() => {
            const pierColor = '#0F766E';
            const chainY = groundY + 96;
            const axisBottomY = groundY + 114;
            const nodesM = [0, ...ordinaryPierAxesM, totalWidthM];
            return (
              <g aria-label="Оси рядовых простенков ниже уровня земли">
                {/* Крайние выносные линии от углов фасада вниз */}
                <line
                  x1={xM(0)}
                  y1={groundY}
                  x2={xM(0)}
                  y2={chainY + 6}
                  stroke={pierColor}
                  strokeOpacity={0.55}
                  strokeWidth={0.9}
                  strokeDasharray="3 2"
                />
                <line
                  x1={xM(totalWidthM)}
                  y1={groundY}
                  x2={xM(totalWidthM)}
                  y2={chainY + 6}
                  stroke={pierColor}
                  strokeOpacity={0.55}
                  strokeWidth={0.9}
                  strokeDasharray="3 2"
                />

                {/* Вертикальные оси рядовых простенков — строго от groundY вниз */}
                {ordinaryPierAxesM.map((pierAxisM, pIdx) => {
                  const px = xM(pierAxisM);
                  return (
                    <g key={`pier-axis-${pIdx}`}>
                      <line
                        x1={px}
                        y1={groundY}
                        x2={px}
                        y2={axisBottomY}
                        stroke={pierColor}
                        strokeWidth={1.2}
                        strokeDasharray="6 2 2 2"
                      />
                      <text
                        x={px}
                        y={axisBottomY + 11}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight={600}
                        fill={pierColor}
                      >
                        {`П${pIdx + 1}`}
                      </text>
                    </g>
                  );
                })}

                {/* Собственная размерная цепочка осей рядовых простенков */}
                {nodesM.slice(0, -1).map((fromM, segIdx) => {
                  const toM = nodesM[segIdx + 1];
                  const distM = toM - fromM;
                  const x1 = xM(fromM);
                  const x2 = xM(toM);
                  const midX = (x1 + x2) / 2;
                  const segWidthPx = Math.abs(x2 - x1);
                  const isInnerPierStep =
                    segIdx > 0 && segIdx < nodesM.length - 2;
                  const label = isInnerPierStep
                    ? `A_п=${formatMeters(distM)}`
                    : `${formatMeters(distM)}`;
                  return (
                    <g key={`pier-dim-${segIdx}`}>
                      <line
                        x1={x1}
                        y1={chainY - 4}
                        x2={x1}
                        y2={chainY + 4}
                        stroke={pierColor}
                        strokeWidth={1.15}
                      />
                      <line
                        x1={x2}
                        y1={chainY - 4}
                        x2={x2}
                        y2={chainY + 4}
                        stroke={pierColor}
                        strokeWidth={1.15}
                      />
                      <line
                        x1={x1}
                        y1={chainY}
                        x2={x2}
                        y2={chainY}
                        stroke={pierColor}
                        strokeWidth={1.25}
                      />
                      {segWidthPx > 14 && (
                        <>
                          <polygon
                            points={`${x1},${chainY} ${x1 + 4.5},${chainY - 2.3} ${x1 + 4.5},${chainY + 2.3}`}
                            fill={pierColor}
                          />
                          <polygon
                            points={`${x2},${chainY} ${x2 - 4.5},${chainY - 2.3} ${x2 - 4.5},${chainY + 2.3}`}
                            fill={pierColor}
                          />
                        </>
                      )}
                      <rect
                        x={midX - Math.max(18, label.length * 3.1)}
                        y={chainY - 14}
                        width={Math.max(36, label.length * 6.2)}
                        height={12}
                        fill="#FBF9F5"
                        fillOpacity={0.94}
                      />
                      <text
                        x={midX}
                        y={chainY - 4.5}
                        textAnchor="middle"
                        fontSize="9.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight={500}
                        fill={pierColor}
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })()}

          {/* RIGHT VERTICAL DIMENSION: h_socle, H_max, h_гк & H_total */}
          {(() => {
            const dimX = xM(totalWidthM) + 28;
            const totalDimX = dimX + 68;
            const yGround = groundY;
            const ySocTop = yFromGroundM(visualSocleTopM);
            const yFloor1Top = yFromGroundM(floorOffsetsM[0] + floorHeightsM[0]);
            const yCBot = yFromGroundM(corniceBottomM);
            const yCTop = yFromGroundM(corniceTopM);
            return (
              <g>
                {/* Socle vertical dimension */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectElement?.('socle')}
                  {...violationHoverProps('socle')}
                >
                  <line x1={dimX} y1={yGround} x2={dimX} y2={ySocTop} stroke={strokeFor(socleStatus)} strokeWidth={1.25} />
                  <line x1={dimX - 4} y1={yGround} x2={dimX + 4} y2={yGround} stroke={strokeFor(socleStatus)} strokeWidth={1.25} />
                  <line x1={dimX - 4} y1={ySocTop} x2={dimX + 4} y2={ySocTop} stroke={strokeFor(socleStatus)} strokeWidth={1.25} />
                  <text
                    x={dimX + 7}
                    y={(yGround + ySocTop) / 2 + 3}
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={strokeFor(socleStatus)}
                  >
                    h_s={formatMeters(effectiveSocleH, 2)}
                  </text>
                </g>

                {/* Main cornice height dimension h_гк */}
                <g
                  className="cursor-pointer"
                  aria-label="Высота главного карниза справа от фасада"
                  onClick={() => onSelectElement?.('cornice')}
                  {...violationHoverProps('cornice')}
                >
                  <line
                    x1={xM(totalWidthM)}
                    y1={yCBot}
                    x2={dimX + 6}
                    y2={yCBot}
                    stroke="#A8A29E"
                    strokeWidth={0.7}
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={xM(totalWidthM)}
                    y1={yCTop}
                    x2={totalDimX + 4}
                    y2={yCTop}
                    stroke="#A8A29E"
                    strokeWidth={0.7}
                    strokeDasharray="2 2"
                  />
                  <line
                    x1={dimX}
                    y1={yCBot}
                    x2={dimX}
                    y2={yCTop}
                    stroke={strokeFor(corniceStatus)}
                    strokeWidth={1.25}
                  />
                  <line
                    x1={dimX - 4}
                    y1={yCBot}
                    x2={dimX + 4}
                    y2={yCBot}
                    stroke={strokeFor(corniceStatus)}
                    strokeWidth={1.25}
                  />
                  <line
                    x1={dimX - 4}
                    y1={yCTop}
                    x2={dimX + 4}
                    y2={yCTop}
                    stroke={strokeFor(corniceStatus)}
                    strokeWidth={1.25}
                  />
                  <text
                    x={dimX + 7}
                    y={(yCBot + yCTop) / 2 + 3}
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fontWeight={600}
                    fill={strokeFor(corniceStatus)}
                  >
                    h_гк={formatMeters(corniceM, 2)}
                  </text>
                </g>

                {/* Total building height H_total */}
                <line x1={totalDimX} y1={yGround} x2={totalDimX} y2={yCTop} stroke="#44403C" strokeWidth={1.1} />
                <line x1={totalDimX - 4} y1={yGround} x2={totalDimX + 4} y2={yGround} stroke="#44403C" strokeWidth={1.1} />
                <line x1={totalDimX - 4} y1={yCTop} x2={totalDimX + 4} y2={yCTop} stroke="#44403C" strokeWidth={1.1} />
                <text
                  x={totalDimX + 5}
                  y={(yGround + yCTop) / 2 + 3}
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#44403C"
                >
                  H_зд={formatMeters(totalHeightM, 1)}
                </text>

                {/* Main floor height */}
                {!params.useFullFloorAsSocle && (
                  <>
                    <line
                      x1={dimX}
                      y1={yFromGroundM(floorOffsetsM[0])}
                      x2={dimX}
                      y2={yFloor1Top}
                      stroke={strokeFor(ahStatus)}
                      strokeWidth={1.2}
                    />
                    <text
                      x={dimX + 7}
                      y={(yFromGroundM(floorOffsetsM[0]) + yFloor1Top) / 2 + 3}
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fill={strokeFor(ahStatus)}
                    >
                      H={formatMeters(safeH, 2)}
                    </text>
                  </>
                )}
              </g>
            );
          })()}
        </svg>

        {/* Subtle navigation hint inside drafting sheet */}
        <div className="pointer-events-none absolute bottom-2 right-2.5 z-10 hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#D6CEBE]/90 bg-[#FBF9F5]/90 text-[10px] font-mono text-[#78716C]">
          <Move className="w-3 h-3" />
          <span>
            {isFullscreen
              ? 'Сдвиг: перетаскивание · Масштаб: колесо / +− · Esc: выйти'
              : isViewModified
                ? 'Сдвиг: перетаскивание · Масштаб: колесо / +− · 100%: сброс'
                : 'Сдвиг: перетаскивание · Масштаб: Ctrl+колесо или + / −'}
          </span>
        </div>

        {/* Floating Explanatory Popover for Hovered Violation Element (fixed viewport-clamped so never clipped) */}
        {!hideValidation && hoveredViolation && activeViolationItems.length > 0 && (
          <div
            role="dialog"
            aria-label={`Нарушение правила: ${ELEMENT_LABELS_RU[hoveredViolation.element]}`}
            onMouseEnter={cancelHideTimer}
            onMouseLeave={scheduleHideViolation}
            style={{
              left: `${hoveredViolation.left}px`,
              ...(hoveredViolation.top !== undefined ? { top: `${hoveredViolation.top}px` } : {}),
              ...(hoveredViolation.bottom !== undefined
                ? { bottom: `${hoveredViolation.bottom}px` }
                : {}),
            }}
            className="fixed z-60 w-[332px] max-w-[calc(100vw-24px)] border-2 border-[#B91C1C] bg-[#FBF9F5] shadow-xl p-3 space-y-2.5 text-xs cursor-default"
          >
            <div className="flex items-start justify-between gap-2 pb-1.5 border-b border-[#E5DFD3]">
              <div className="flex items-center gap-1.5 text-[#B91C1C] font-semibold">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Нарушение · {ELEMENT_LABELS_RU[hoveredViolation.element]}</span>
              </div>
              <button
                type="button"
                aria-label="Закрыть подсказку"
                onClick={() => setHoveredViolation(null)}
                className="text-[#78716C] hover:text-[#1C1917] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
              {activeViolationItems.slice(0, 3).map((item) => {
                const excerpt = getExcerptForCheckId(item.id, item.page);
                return (
                  <div key={item.id} className="space-y-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-1">
                      <span className="font-medium text-[#1C1917]">{item.title}</span>
                      <span className="font-mono text-[10px] text-[#B91C1C]">
                        {item.valueText}
                      </span>
                    </div>
                    <p className="text-[11px] leading-snug text-[#57534E]">{item.explanation}</p>

                    {onOpenBookPage ? (
                      <button
                        type="button"
                        onClick={() => openBookFromSvg(excerpt.pageNumber, excerpt)}
                        className="w-full text-left p-2 border border-[#B91C1C]/35 border-l-3 border-l-[#B91C1C] bg-[#FEF2F2]/85 hover:bg-[#FEE2E2]/80 transition-colors space-y-1 group cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono uppercase tracking-wider text-[#B91C1C]">
                          <span>Нарушенное правило ({item.page})</span>
                          <span className="inline-flex items-center gap-1 underline underline-offset-2 group-hover:text-[#7F1D1D]">
                            <BookOpen className="w-3 h-3" />
                            <span>В читальный зал →</span>
                          </span>
                        </div>
                        <p className="text-[11px] leading-snug text-[#1C1917]">
                          <mark className="bg-[#FDE68A]/85 text-[#1C1917] px-1 py-0.5 rounded-[2px] font-medium">
                            {excerpt.ruleSummaryHighlight}
                          </mark>
                        </p>
                        {excerpt.bookQuoteRu && (
                          <p className="text-[10.5px] italic text-[#44403C] line-clamp-2">
                            «{excerpt.bookQuoteRu}»
                          </p>
                        )}
                      </button>
                    ) : (
                      <div className="p-2 border border-[#B91C1C]/35 border-l-3 border-l-[#B91C1C] bg-[#FEF2F2]/85 space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#B91C1C]">
                          Нарушенное правило ({item.page})
                        </div>
                        <p className="text-[11px] leading-snug text-[#1C1917]">
                          {excerpt.ruleSummaryHighlight}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Compact Interactive Violation Strip below SVG when violations exist */}
      {!hideValidation && allViolationElements.length > 0 && (
        <div className="px-4 py-2.5 border-t border-[#B91C1C]/25 bg-[#FEF2F2]/65 flex flex-wrap items-center gap-2 text-[11px] shrink-0">
          <span className="font-mono uppercase tracking-wider text-[#B91C1C] font-semibold">
            Нарушения на схеме (наведите на элемент):
          </span>
          {allViolationElements.map(({ element, label, violations }) => {
            const first = violations[0];
            const excerpt = getExcerptForCheckId(first.id, first.page);
            return (
              <button
                key={element}
                type="button"
                onMouseEnter={() => onSelectElement?.(element)}
                onClick={() => {
                  if (onOpenBookPage) {
                    openBookFromSvg(excerpt.pageNumber, excerpt);
                  } else {
                    onSelectElement?.(element);
                  }
                }}
                title={
                  onOpenBookPage
                    ? `${first.title} — открыть в «Читальном зале» (${first.page})`
                    : `${first.title} — показать элемент`
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 border border-[#B91C1C]/45 bg-[#FBF9F5] text-[#B91C1C] hover:bg-[#B91C1C] hover:text-[#FBF9F5] transition-colors font-mono text-[10.5px]"
              >
                <span>✕ {label.split(' (')[0]}</span>
                <span className="opacity-75">({first.page})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
