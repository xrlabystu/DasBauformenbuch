import type { LockedParamsMap } from './paramLocks';
import {
  D_from_A,
  resolveWindowAxisStepsM,
  resolveWindowSillHeightM,
  type BuildingLevelsInput,
  type FacadeParameters,
} from './rules';

function resolvePierAxisSpacingsFromSteps(stepsM: number[]): number[] {
  if (stepsM.length < 2) return [];
  return Array.from({ length: stepsM.length - 1 }, (_, idx) =>
    Number(((stepsM[idx] + stepsM[idx + 1]) / 2).toFixed(6))
  );
}

function getRawSillRelM(
  params: FacadeParameters,
  arch: BrickMasonryArchSnapshot,
  floorIndex: number
): number {
  const fl = arch.levels.floors[floorIndex] ?? arch.levels.floors[0];
  const clearH =
    fl?.clearHeight ?? Math.max(2.0, (fl?.floorToFloor ?? arch.H) - (fl?.slabThickness ?? 0.35));
  const winH = Math.min(Math.max(0.6, arch.h), clearH * 0.72);
  return resolveWindowSillHeightM(
    {
      ...params,
      h: arch.h,
      levels: arch.levels,
      windowSillHeights: arch.windowSillHeights,
    },
    floorIndex,
    clearH,
    winH,
    1
  );
}

export interface BrickMasonryBrickParams {
  /** Длина кирпича L, мм (по умолчанию 250) */
  L: number;
  /** Ширина кирпича W, мм (по умолчанию 120) */
  W: number;
  /** Высота кирпича H, мм (по умолчанию 65) */
  H: number;
  /** Толщина горизонтального шва Jh, мм (по умолчанию 10) */
  Jh: number;
  /** Толщина вертикального шва Jv, мм (по умолчанию 10) */
  Jv: number;
}

export interface BrickMasonryArchSnapshot {
  A: number;
  H: number;
  w: number;
  h: number;
  k_D: number;
  isRisalitCentered: boolean;
  risalitWidth: number;
  hSocle: number;
  hMain: number;
  hGurt: number;
  useFullFloorAsSocle: boolean;
  corniceBottomOffsetM?: number;
  hasEntrance?: boolean;
  entranceWidthM?: number;
  entranceHeightM?: number;
  entranceBottomM?: number;
  ordinaryPierAxisSpacings?: number[];
  windowSillHeights?: Array<number | undefined>;
  levels: BuildingLevelsInput;
}

export interface BrickMasonryConfig {
  enabled: boolean;
  brick: BrickMasonryBrickParams;
  baseArch?: BrickMasonryArchSnapshot;
}

export const DEFAULT_BRICK_MASONRY_PARAMS: BrickMasonryBrickParams = {
  L: 250,
  W: 120,
  H: 65,
  Jh: 10,
  Jv: 10,
};

export function createDefaultBrickMasonryConfig(): BrickMasonryConfig {
  return {
    enabled: false,
    brick: { ...DEFAULT_BRICK_MASONRY_PARAMS },
  };
}

export function sanitizeBrickParams(
  raw?: Partial<BrickMasonryBrickParams>
): BrickMasonryBrickParams {
  const toIntMm = (v: number | undefined, fallback: number, min: number, max: number) => {
    const n = v !== undefined && Number.isFinite(v) ? Math.round(v) : fallback;
    return Math.min(max, Math.max(min, n));
  };
  return {
    L: toIntMm(raw?.L, DEFAULT_BRICK_MASONRY_PARAMS.L, 60, 600),
    W: toIntMm(raw?.W, DEFAULT_BRICK_MASONRY_PARAMS.W, 40, 400),
    H: toIntMm(raw?.H, DEFAULT_BRICK_MASONRY_PARAMS.H, 30, 300),
    Jh: toIntMm(raw?.Jh, DEFAULT_BRICK_MASONRY_PARAMS.Jh, 2, 40),
    Jv: toIntMm(raw?.Jv, DEFAULT_BRICK_MASONRY_PARAMS.Jv, 2, 40),
  };
}

/**
 * Горизонтальный модульный размер (мм) с точностью до 1 мм:
 * - для целого количества кирпичей N: S = N * L + (N - 1) * Jv
 * - для половинной части (M + 0.5): S = M * (L + Jv) + W
 */
export function calcHorizontalModuleMm(
  modules: number,
  brick: BrickMasonryBrickParams
): number {
  const b = sanitizeBrickParams(brick);
  const halfSteps = Math.max(1, Math.round(modules * 2));
  const isHalf = halfSteps % 2 === 1;
  const wholeBricks = Math.floor(halfSteps / 2);
  if (isHalf) {
    return wholeBricks * (b.L + b.Jv) + b.W;
  }
  return wholeBricks * b.L + (wholeBricks - 1) * b.Jv;
}

/**
 * Ширина горизонтального проёма в свету между простенками (мм):
 * S_проёма = S(modules) + 2 * Jv (соответствует схеме d + 20 на стр. 1 таблицы).
 */
export function calcHorizontalOpeningMm(
  modules: number,
  brick: BrickMasonryBrickParams
): number {
  const b = sanitizeBrickParams(brick);
  return calcHorizontalModuleMm(modules, b) + 2 * b.Jv;
}

/**
 * Вертикальный модульный размер H1 (мм) — высота по количеству вертикальных модулей:
 * H1 = N * (H + Jh)
 */
export function calcVerticalModuleH1Mm(
  modules: number,
  brick: BrickMasonryBrickParams
): number {
  const b = sanitizeBrickParams(brick);
  const n = Math.max(1, Math.round(modules));
  return n * (b.H + b.Jh);
}

/**
 * Вертикальный модульный размер H2 (мм) — отметка с учётом высоты одного кирпича:
 * H2 = H1 - H = N * (H + Jh) - H
 */
export function calcVerticalModuleH2Mm(
  modules: number,
  brick: BrickMasonryBrickParams
): number {
  const b = sanitizeBrickParams(brick);
  return calcVerticalModuleH1Mm(modules, b) - b.H;
}

export type CoordinationDirection = 'increase' | 'decrease' | 'unchanged';

export interface BrickSnapResult {
  originalMm: number;
  modules: number;
  modularMm: number;
  deltaMm: number;
  direction: CoordinationDirection;
}

function resolveDirection(deltaMm: number): CoordinationDirection {
  if (deltaMm > 0) return 'increase';
  if (deltaMm < 0) return 'decrease';
  return 'unchanged';
}

export function snapHorizontalToBrick(
  targetMm: number,
  brick: BrickMasonryBrickParams,
  options?: {
    minModules?: number;
    maxModules?: number;
    isOpening?: boolean;
    allowHalf?: boolean;
  }
): BrickSnapResult {
  const b = sanitizeBrickParams(brick);
  const originalMm = Math.round(targetMm);
  const isOpening = Boolean(options?.isOpening);
  const allowHalf = options?.allowHalf !== false;
  const minHalf = Math.max(1, Math.round((options?.minModules ?? 0.5) * 2));
  const stepHalf = allowHalf ? 1 : 2;
  const approxMaxModules = Math.max(
    options?.maxModules ?? 120,
    Math.ceil((Math.max(originalMm, 1000) / Math.max(20, b.L + b.Jv)) * 1.5) + 8
  );
  const maxHalf = Math.max(minHalf + 4, Math.round(approxMaxModules * 2));

  let bestModules = minHalf / 2;
  let bestMm = isOpening
    ? calcHorizontalOpeningMm(bestModules, b)
    : calcHorizontalModuleMm(bestModules, b);
  let bestDiff = Math.abs(bestMm - originalMm);

  for (let h = minHalf; h <= maxHalf; h += stepHalf) {
    if (!allowHalf && h % 2 === 1) continue;
    const mod = h / 2;
    const candMm = isOpening
      ? calcHorizontalOpeningMm(mod, b)
      : calcHorizontalModuleMm(mod, b);
    const diff = Math.abs(candMm - originalMm);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestModules = mod;
      bestMm = candMm;
    }
  }

  const deltaMm = bestMm - originalMm;
  return {
    originalMm,
    modules: bestModules,
    modularMm: bestMm,
    deltaMm,
    direction: resolveDirection(deltaMm),
  };
}

export function snapVerticalH1ToBrick(
  targetMm: number,
  brick: BrickMasonryBrickParams,
  minModules = 1
): BrickSnapResult {
  const b = sanitizeBrickParams(brick);
  const originalMm = Math.round(targetMm);
  const unit = b.H + b.Jh;
  const minN = Math.max(1, Math.round(minModules));
  const approxN = Math.max(minN, Math.round(originalMm / unit));

  let bestN = minN;
  let bestMm = calcVerticalModuleH1Mm(bestN, b);
  let bestDiff = Math.abs(bestMm - originalMm);

  for (let n = Math.max(minN, approxN - 3); n <= approxN + 3; n += 1) {
    const candMm = calcVerticalModuleH1Mm(n, b);
    const diff = Math.abs(candMm - originalMm);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestN = n;
      bestMm = candMm;
    }
  }

  const deltaMm = bestMm - originalMm;
  return {
    originalMm,
    modules: bestN,
    modularMm: bestMm,
    deltaMm,
    direction: resolveDirection(deltaMm),
  };
}

export function snapVerticalH2ToBrick(
  targetMm: number,
  brick: BrickMasonryBrickParams,
  minModules = 1
): BrickSnapResult {
  const b = sanitizeBrickParams(brick);
  const originalMm = Math.round(targetMm);
  const unit = b.H + b.Jh;
  const minN = Math.max(1, Math.round(minModules));
  const approxN = Math.max(minN, Math.round((originalMm + b.H) / unit));

  let bestN = minN;
  let bestMm = calcVerticalModuleH2Mm(bestN, b);
  let bestDiff = Math.abs(bestMm - originalMm);

  for (let n = Math.max(minN, approxN - 3); n <= approxN + 3; n += 1) {
    const candMm = calcVerticalModuleH2Mm(n, b);
    const diff = Math.abs(candMm - originalMm);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestN = n;
      bestMm = candMm;
    }
  }

  const deltaMm = bestMm - originalMm;
  return {
    originalMm,
    modules: bestN,
    modularMm: bestMm,
    deltaMm,
    direction: resolveDirection(deltaMm),
  };
}

function cloneLevels(levels: BuildingLevelsInput): BuildingLevelsInput {
  return {
    groundToFloor1: levels.groundToFloor1,
    floors: levels.floors.map((fl) => ({ ...fl })),
    ...(levels.manualTotalHeight !== undefined
      ? { manualTotalHeight: levels.manualTotalHeight }
      : {}),
  };
}

export function captureBrickMasonryBaseArch(
  params: FacadeParameters
): BrickMasonryArchSnapshot {
  return {
    A: params.A,
    H: params.H,
    w: params.w,
    h: params.h,
    k_D: params.k_D,
    isRisalitCentered: params.isRisalitCentered,
    risalitWidth: params.risalitWidth,
    hSocle: params.hSocle,
    hMain: params.hMain,
    hGurt: params.hGurt,
    useFullFloorAsSocle: params.useFullFloorAsSocle,
    ...(params.corniceBottomOffsetM !== undefined
      ? { corniceBottomOffsetM: params.corniceBottomOffsetM }
      : {}),
    ...(params.hasEntrance !== undefined ? { hasEntrance: params.hasEntrance } : {}),
    ...(params.entranceWidthM !== undefined ? { entranceWidthM: params.entranceWidthM } : {}),
    ...(params.entranceHeightM !== undefined ? { entranceHeightM: params.entranceHeightM } : {}),
    ...(params.entranceBottomM !== undefined ? { entranceBottomM: params.entranceBottomM } : {}),
    ...(params.ordinaryPierAxisSpacings
      ? { ordinaryPierAxisSpacings: [...params.ordinaryPierAxisSpacings] }
      : {}),
    ...(params.windowSillHeights
      ? { windowSillHeights: [...params.windowSillHeights] }
      : {}),
    levels: cloneLevels(params.levels),
  };
}

export function restoreBrickMasonryBaseArch(
  params: FacadeParameters,
  baseArch: BrickMasonryArchSnapshot,
  lockedParams: LockedParamsMap = {}
): FacadeParameters {
  const isLocked = (k: string) => Boolean(lockedParams[k]);
  const next: FacadeParameters = {
    ...params,
    levels: isLocked('levels') ? cloneLevels(params.levels) : cloneLevels(baseArch.levels),
  };
  if (!isLocked('A')) next.A = baseArch.A;
  if (!isLocked('H')) next.H = baseArch.H;
  if (!isLocked('w')) next.w = baseArch.w;
  if (!isLocked('h')) next.h = baseArch.h;
  if (!isLocked('k_D')) next.k_D = baseArch.k_D;
  if (!isLocked('risalitWidth')) next.risalitWidth = baseArch.risalitWidth;
  if (!isLocked('hSocle')) next.hSocle = baseArch.hSocle;
  if (!isLocked('hMain')) next.hMain = baseArch.hMain;
  if (!isLocked('hGurt')) next.hGurt = baseArch.hGurt;
  if (!isLocked('corniceBottomOffsetM')) {
    next.corniceBottomOffsetM = baseArch.corniceBottomOffsetM;
  }
  if (!isLocked('entranceWidthM') && baseArch.entranceWidthM !== undefined) {
    next.entranceWidthM = baseArch.entranceWidthM;
  }
  if (!isLocked('entranceHeightM') && baseArch.entranceHeightM !== undefined) {
    next.entranceHeightM = baseArch.entranceHeightM;
  }
  if (!isLocked('entranceBottomM') && baseArch.entranceBottomM !== undefined) {
    next.entranceBottomM = baseArch.entranceBottomM;
  }
  if (!isLocked('A')) {
    next.ordinaryPierAxisSpacings = baseArch.ordinaryPierAxisSpacings
      ? [...baseArch.ordinaryPierAxisSpacings]
      : undefined;
  }
  next.windowSillHeights = baseArch.windowSillHeights
    ? [...baseArch.windowSillHeights]
    : undefined;
  next.floors = next.levels.floors.length;
  return next;
}

export interface BrickCoordinationItem {
  id: string;
  axis: 'horizontal' | 'vertical_height' | 'vertical_elevation';
  label: string;
  formulaUsed: string;
  originalMm: number;
  modules: number;
  modularMm: number;
  deltaMm: number;
  direction: CoordinationDirection;
}

export interface BrickCoordinationResult {
  coordinatedParams: FacadeParameters;
  brick: BrickMasonryBrickParams;
  items: BrickCoordinationItem[];
  horizontalTablePreview: Array<{
    modules: number;
    solidMm: number;
    openingMm: number;
  }>;
  verticalTablePreview: Array<{
    modules: number;
    h1Mm: number;
    h2Mm: number;
  }>;
}

export const BRICK_MASONRY_TECH_WARNING =
  'Совпадение размеров с модульной сеткой не является достаточным доказательством полной технологической реализуемости кладки. Перевязка, углы, примыкания, четверти и доборные элементы требуют отдельной проверки по принятой схеме кладки.';

function mmToM(mm: number): number {
  return Number((mm / 1000).toFixed(6));
}

/**
 * Основной алгоритм модульной координации фасада с лицевой кирпичной кладкой (точность 1 мм).
 * Не изменяет несущие конструктивные толщины перекрытий (slabThickness).
 */
export function coordinateFacadeWithBrickMasonry(
  params: FacadeParameters,
  rawBaseArch?: BrickMasonryArchSnapshot,
  lockedParams: LockedParamsMap = {}
): BrickCoordinationResult {
  const brick = sanitizeBrickParams(params.brickMasonry?.brick);
  const arch: BrickMasonryArchSnapshot = rawBaseArch ?? captureBrickMasonryBaseArch(params);
  const isLocked = (k: string) => Boolean(lockedParams[k]);

  const items: BrickCoordinationItem[] = [];
  const safeAxes = Math.min(10, Math.max(2, Math.round(params.axesCount)));
  const safeFloors = Math.min(10, Math.max(1, arch.levels.floors.length));

  // --- A. ГОРИЗОНТАЛЬНАЯ КООРДИНАЦИЯ (без подрезки кирпича) ---
  // 1. Ширина оконного проёма w = S(m_w) + 2 * Jv (или locked)
  const rawWMm = Math.round(arch.w * 1000);
  const wSnap = isLocked('w')
    ? {
        originalMm: rawWMm,
        modules: Number(((rawWMm - brick.Jv) / Math.max(1, brick.L + brick.Jv)).toFixed(2)),
        modularMm: Math.round(params.w * 1000),
        deltaMm: Math.round(params.w * 1000) - rawWMm,
        direction: resolveDirection(Math.round(params.w * 1000) - rawWMm),
      }
    : snapHorizontalToBrick(rawWMm, brick, { minModules: 1.5, isOpening: true });
  const coordWMm = wSnap.modularMm;
  items.push({
    id: 'window_width',
    axis: 'horizontal',
    label: 'Ширина оконного проёма w',
    formulaUsed: 'S_пр = S(m) + 2·Jv',
    ...wSnap,
  });

  // 2. Ширина дверного проёма (если вход активен)
  let coordDoorWMm = Math.round((arch.entranceWidthM ?? Math.max(0.95, arch.w * 1.05)) * 1000);
  if (params.hasEntrance) {
    const rawDoorWMm = coordDoorWMm;
    const doorWSnap = isLocked('entranceWidthM')
      ? {
          originalMm: rawDoorWMm,
          modules: Number(((rawDoorWMm - brick.Jv) / Math.max(1, brick.L + brick.Jv)).toFixed(2)),
          modularMm: Math.round((params.entranceWidthM ?? Math.max(0.95, arch.w * 1.05)) * 1000),
          deltaMm:
            Math.round((params.entranceWidthM ?? Math.max(0.95, arch.w * 1.05)) * 1000) -
            rawDoorWMm,
          direction: resolveDirection(
            Math.round((params.entranceWidthM ?? Math.max(0.95, arch.w * 1.05)) * 1000) -
              rawDoorWMm
          ),
        }
      : snapHorizontalToBrick(rawDoorWMm, brick, { minModules: 2, isOpening: true });
    coordDoorWMm = doorWSnap.modularMm;
    items.push({
      id: 'door_width',
      axis: 'horizontal',
      label: 'Ширина дверного проёма',
      formulaUsed: 'S_пр = S(m) + 2·Jv',
      ...doorWSnap,
    });
  }

  // 3. Рядовые простенки (расстояния между проёмами) и шаги осей
  const rawStepsM = resolveWindowAxisStepsM({
    ...params,
    axesCount: safeAxes,
    A: arch.A,
    ordinaryPierAxisSpacings: arch.ordinaryPierAxisSpacings,
  });
  const hasCustomSpacings =
    Boolean(arch.ordinaryPierAxisSpacings && arch.ordinaryPierAxisSpacings.length > 0) &&
    rawStepsM.some((s) => Math.abs(s - rawStepsM[0]) > 1e-4);

  const coordPierMms: number[] = [];
  const coordStepMms: number[] = [];
  const pierSnaps: BrickSnapResult[] = [];

  if (hasCustomSpacings) {
    for (let i = 0; i < rawStepsM.length; i += 1) {
      const rawStepMm = Math.round(rawStepsM[i] * 1000);
      const rawPierMm = Math.max(brick.W, rawStepMm - rawWMm);
      const snap = isLocked('A')
        ? {
            originalMm: rawPierMm,
            modules: Number(((rawPierMm + brick.Jv) / Math.max(1, brick.L + brick.Jv)).toFixed(2)),
            modularMm: Math.max(brick.W, Math.round(rawStepsM[i] * 1000) - coordWMm),
            deltaMm: 0,
            direction: 'unchanged' as const,
          }
        : snapHorizontalToBrick(rawPierMm, brick, { minModules: 1 });
      pierSnaps.push(snap);
      coordPierMms.push(snap.modularMm);
      coordStepMms.push(snap.modularMm + coordWMm);
    }
    pierSnaps.forEach((snap, idx) => {
      items.push({
        id: `ordinary_pier_${idx + 1}`,
        axis: 'horizontal',
        label: `Рядовой простенок П${idx + 1} (между окнами)`,
        formulaUsed: 'S = N·L + (N−1)·Jv / M·(L+Jv)+W',
        ...snap,
      });
    });
  } else {
    const rawStepMm = Math.round(arch.A * 1000);
    const rawPierMm = Math.max(brick.W, rawStepMm - rawWMm);
    const snap = isLocked('A')
      ? {
          originalMm: rawPierMm,
          modules: Number(((rawPierMm + brick.Jv) / Math.max(1, brick.L + brick.Jv)).toFixed(2)),
          modularMm: Math.max(brick.W, Math.round(params.A * 1000) - coordWMm),
          deltaMm: Math.max(brick.W, Math.round(params.A * 1000) - coordWMm) - rawPierMm,
          direction: resolveDirection(
            Math.max(brick.W, Math.round(params.A * 1000) - coordWMm) - rawPierMm
          ),
        }
      : snapHorizontalToBrick(rawPierMm, brick, { minModules: 1 });
    for (let i = 0; i < rawStepsM.length; i += 1) {
      coordPierMms.push(snap.modularMm);
      coordStepMms.push(snap.modularMm + coordWMm);
    }
    items.push({
      id: 'ordinary_pier',
      axis: 'horizontal',
      label: 'Расстояние между проёмами (рядовой простенок)',
      formulaUsed: 'S = N·L + (N−1)·Jv / M·(L+Jv)+W',
      ...snap,
    });
    const avgStepMm = coordStepMms[0] ?? Math.round(arch.A * 1000);
    items.push({
      id: 'axis_step_A',
      axis: 'horizontal',
      label: 'Шаг оконных осей A (= простенок + проём)',
      formulaUsed: 'A = S_простенка + S_проёма',
      originalMm: rawStepMm,
      modules: Number((snap.modules + wSnap.modules).toFixed(2)),
      modularMm: avgStepMm,
      deltaMm: avgStepMm - rawStepMm,
      direction: resolveDirection(avgStepMm - rawStepMm),
    });
  }

  const coordAMm = coordStepMms[0] ?? Math.round(arch.A * 1000);
  const coordSpacingsM =
    hasCustomSpacings && safeAxes >= 3
      ? resolvePierAxisSpacingsFromSteps(coordStepMms.map((s) => s / 1000))
      : arch.ordinaryPierAxisSpacings;

  // 4. Расстояние от углов здания до проёмов (угловой простенок)
  const rawDM = arch.isRisalitCentered
    ? arch.risalitWidth / 2
    : D_from_A(rawStepsM[0] ?? arch.A, arch.k_D);
  const rawCornerPierMm = Math.max(brick.W, Math.round((rawDM - arch.w / 2) * 1000));
  const cornerLocked = isLocked('k_D') || (arch.isRisalitCentered && isLocked('risalitWidth'));
  const currentCornerPierMm = Math.max(
    brick.W,
    Math.round(
      ((params.isRisalitCentered
        ? params.risalitWidth / 2
        : D_from_A(coordAMm / 1000, params.k_D)) -
        coordWMm / 2000) *
        1000
    )
  );
  const cornerSnap = cornerLocked
    ? {
        originalMm: rawCornerPierMm,
        modules: Number(((currentCornerPierMm + brick.Jv) / Math.max(1, brick.L + brick.Jv)).toFixed(2)),
        modularMm: currentCornerPierMm,
        deltaMm: currentCornerPierMm - rawCornerPierMm,
        direction: resolveDirection(currentCornerPierMm - rawCornerPierMm),
      }
    : snapHorizontalToBrick(rawCornerPierMm, brick, { minModules: 1 });
  const coordCornerPierMm = cornerSnap.modularMm;
  const coordDMm = coordCornerPierMm + coordWMm / 2;
  items.push({
    id: 'corner_pier',
    axis: 'horizontal',
    label: 'Расстояние от угла здания до крайнего проёма',
    formulaUsed: 'S = N·L + (N−1)·Jv / M·(L+Jv)+W',
    ...cornerSnap,
  });

  const rawTotalWidthMm =
    2 * rawCornerPierMm +
    rawStepsM.reduce((acc, s) => acc + Math.max(brick.W, Math.round(s * 1000) - rawWMm), 0) +
    safeAxes * rawWMm;
  const coordTotalWidthMm =
    2 * coordCornerPierMm +
    coordPierMms.reduce((acc, p) => acc + p, 0) +
    safeAxes * coordWMm;
  const totalWidthDelta = coordTotalWidthMm - rawTotalWidthMm;
  items.push({
    id: 'facade_width',
    axis: 'horizontal',
    label: 'Общая ширина фасада W',
    formulaUsed: '2·p_угл + Σp + n·w',
    originalMm: rawTotalWidthMm,
    modules: Number(
      (
        2 * cornerSnap.modules +
        (hasCustomSpacings
          ? pierSnaps.reduce((s, p) => s + p.modules, 0)
          : Math.max(0, safeAxes - 1) *
            ((items.find((i) => i.id === 'ordinary_pier')?.modules ?? 0))) +
        safeAxes * wSnap.modules
      ).toFixed(2)
    ),
    modularMm: coordTotalWidthMm,
    deltaMm: totalWidthDelta,
    direction: resolveDirection(totalWidthDelta),
  });

  // --- B. ВЕРТИКАЛЬНАЯ КООРДИНАЦИЯ (H1 — высоты, H2 = H1 − H — отметки) ---
  // 1. Уровень пола 1-го этажа (H1) и высоты этажей (H1, не трогая толщину перекрытий slabThickness!)
  const rawGroundToF1Mm = Math.round(arch.levels.groundToFloor1 * 1000);
  const g1Snap = isLocked('levels.groundToFloor1')
    ? {
        originalMm: rawGroundToF1Mm,
        modules: Math.max(1, Math.round(params.levels.groundToFloor1 * 1000 / (brick.H + brick.Jh))),
        modularMm: Math.round(params.levels.groundToFloor1 * 1000),
        deltaMm: Math.round(params.levels.groundToFloor1 * 1000) - rawGroundToF1Mm,
        direction: resolveDirection(Math.round(params.levels.groundToFloor1 * 1000) - rawGroundToF1Mm),
      }
    : snapVerticalH1ToBrick(rawGroundToF1Mm, brick, 4);
  const coordGroundToF1Mm = g1Snap.modularMm;

  const coordFloors = arch.levels.floors.slice(0, safeFloors).map((fl, idx) => {
    const rawF2fMm = Math.round(fl.floorToFloor * 1000);
    const fLocked = isLocked(`levels.floor.${idx}.floorToFloor`) || isLocked('H');
    const fSnap = fLocked
      ? {
          originalMm: rawF2fMm,
          modules: Math.max(1, Math.round((params.levels.floors[idx]?.floorToFloor ?? fl.floorToFloor) * 1000 / (brick.H + brick.Jh))),
          modularMm: Math.round((params.levels.floors[idx]?.floorToFloor ?? fl.floorToFloor) * 1000),
          deltaMm: 0,
          direction: 'unchanged' as const,
        }
      : snapVerticalH1ToBrick(rawF2fMm, brick, Math.max(18, Math.ceil(1800 / (brick.H + brick.Jh))));
    const f2fM = mmToM(fSnap.modularMm);
    return {
      floorToFloor: f2fM,
      slabThickness: fl.slabThickness, // конструктивный слой не меняется!
      clearHeight: Number(Math.max(1.5, f2fM - fl.slabThickness).toFixed(4)),
      snap: fSnap,
    };
  });

  const rawFloorOffsetsMm: number[] = [];
  let rawCursorMm = rawGroundToF1Mm;
  for (let i = 0; i < safeFloors; i += 1) {
    rawFloorOffsetsMm.push(rawCursorMm);
    rawCursorMm += Math.round(arch.levels.floors[i].floorToFloor * 1000);
  }
  const rawTopFloorTopMm = rawCursorMm;

  const coordFloorOffsetsMm: number[] = [];
  let coordCursorMm = coordGroundToF1Mm;
  for (let i = 0; i < safeFloors; i += 1) {
    coordFloorOffsetsMm.push(coordCursorMm);
    coordCursorMm += coordFloors[i].snap.modularMm;
  }
  const coordTopFloorTopMm = coordCursorMm;

  // 2. Высота цоколя / отметка верха цоколя (H2)
  const rawSocleMm = arch.useFullFloorAsSocle
    ? rawFloorOffsetsMm[1] ?? rawTopFloorTopMm
    : Math.round(arch.hSocle * 1000);
  const fullFloorSocleSnap = arch.useFullFloorAsSocle
    ? snapVerticalH2ToBrick(coordFloorOffsetsMm[1] ?? coordTopFloorTopMm, brick, 4)
    : undefined;
  const socleSnap = fullFloorSocleSnap
    ? {
        ...fullFloorSocleSnap,
        originalMm: rawSocleMm,
        deltaMm: fullFloorSocleSnap.modularMm - rawSocleMm,
        direction: resolveDirection(fullFloorSocleSnap.modularMm - rawSocleMm),
      }
    : isLocked('hSocle')
      ? {
          originalMm: rawSocleMm,
          modules: Math.max(1, Math.round((Math.round(params.hSocle * 1000) + brick.H) / (brick.H + brick.Jh))),
          modularMm: Math.round(params.hSocle * 1000),
          deltaMm: Math.round(params.hSocle * 1000) - rawSocleMm,
          direction: resolveDirection(Math.round(params.hSocle * 1000) - rawSocleMm),
        }
      : snapVerticalH2ToBrick(rawSocleMm, brick, 4);
  const coordSocleMm = socleSnap.modularMm;
  items.push({
    id: 'socle_top',
    axis: 'vertical_elevation',
    label: 'Отметка верха цоколя (H2)',
    formulaUsed: 'H2 = N·(H + Jh) − H',
    ...socleSnap,
  });

  // 3. Высота оконных проёмов h (H1)
  const rawHMm = Math.round(arch.h * 1000);
  const hSnap = isLocked('h')
    ? {
        originalMm: rawHMm,
        modules: Math.max(1, Math.round((params.h * 1000) / (brick.H + brick.Jh))),
        modularMm: Math.round(params.h * 1000),
        deltaMm: Math.round(params.h * 1000) - rawHMm,
        direction: resolveDirection(Math.round(params.h * 1000) - rawHMm),
      }
    : snapVerticalH1ToBrick(rawHMm, brick, 6);
  const coordHMm = hSnap.modularMm;
  items.push({
    id: 'window_height',
    axis: 'vertical_height',
    label: 'Высота оконных проёмов h (H1)',
    formulaUsed: 'H1 = N·(H + Jh)',
    ...hSnap,
  });

  // 4. Поэтажные отметки подоконников (H2) и верха окон (H2), совместимость с цоколем и смежными этажами
  const coordSillHeights: Array<number | undefined> = [];
  const sillModCounts: number[] = [];
  const topModCounts: number[] = [];
  const coordSillMmList: number[] = [];
  const coordWinTopMmList: number[] = [];

  for (let i = 0; i < safeFloors; i += 1) {
    const rawSillRelM = arch.windowSillHeights?.[i] ?? getRawSillRelM(params, arch, i);
    const rawSillFromGroundMm = rawFloorOffsetsMm[i] + Math.round(rawSillRelM * 1000);
    const minNForSill =
      i === 0 && !arch.useFullFloorAsSocle && rawSillFromGroundMm >= rawSocleMm - (brick.H + brick.Jh)
        ? socleSnap.modules + 1
        : i > 0
          ? topModCounts[i - 1] + 2
          : 4;

    const rawSnap = snapVerticalH2ToBrick(rawSillFromGroundMm, brick, minNForSill);
    const clampedN = Math.max(minNForSill, rawSnap.modules);
    const sillMm = calcVerticalModuleH2Mm(clampedN, brick);
    const topN = clampedN + hSnap.modules;
    const winTopMm = calcVerticalModuleH2Mm(topN, brick);

    sillModCounts.push(clampedN);
    topModCounts.push(topN);
    coordSillMmList.push(sillMm);
    coordWinTopMmList.push(winTopMm);
    coordSillHeights.push(mmToM(sillMm - coordFloorOffsetsMm[i]));

    items.push({
      id: `sill_floor_${i + 1}`,
      axis: 'vertical_elevation',
      label: `Отметка подоконника ${i + 1}-го эт. (от уровня земли, H2)`,
      formulaUsed: 'H2 = N·(H + Jh) − H',
      originalMm: rawSillFromGroundMm,
      modules: clampedN,
      modularMm: sillMm,
      deltaMm: sillMm - rawSillFromGroundMm,
      direction: resolveDirection(sillMm - rawSillFromGroundMm),
    });
    items.push({
      id: `window_top_floor_${i + 1}`,
      axis: 'vertical_elevation',
      label: `Отметка верха окна ${i + 1}-го эт. (от уровня земли, H2)`,
      formulaUsed: 'H2 = (N_под + N_ок)·(H + Jh) − H',
      originalMm: rawSillFromGroundMm + rawHMm,
      modules: topN,
      modularMm: winTopMm,
      deltaMm: winTopMm - (rawSillFromGroundMm + rawHMm),
      direction: resolveDirection(winTopMm - (rawSillFromGroundMm + rawHMm)),
    });

    if (i === 0 && !arch.useFullFloorAsSocle && sillMm >= coordSocleMm) {
      const rawDistMm = rawSillFromGroundMm - rawSocleMm;
      const modDistMm = sillMm - coordSocleMm;
      items.push({
        id: 'socle_to_sill_1',
        axis: 'vertical_height',
        label: 'Расстояние от цоколя до подоконника 1-го эт. (H1)',
        formulaUsed: 'H1 = (N_под1 − N_цок)·(H + Jh)',
        originalMm: rawDistMm,
        modules: clampedN - socleSnap.modules,
        modularMm: modDistMm,
        deltaMm: modDistMm - rawDistMm,
        direction: resolveDirection(modDistMm - rawDistMm),
      });
    }

    if (i > 0) {
      const prevRawTop =
        rawFloorOffsetsMm[i - 1] +
        Math.round(
          (arch.windowSillHeights?.[i - 1] ?? getRawSillRelM(params, arch, i - 1)) * 1000
        ) +
        rawHMm;
      const rawSpandrelMm = rawSillFromGroundMm - prevRawTop;
      const modSpandrelMm = sillMm - coordWinTopMmList[i - 1];
      items.push({
        id: `spandrel_${i}_${i + 1}`,
        axis: 'vertical_height',
        label: `Простенок по вертикали между окнами ${i} и ${i + 1} эт. (H1)`,
        formulaUsed: 'H1 = (N_под(i+1) − N_верх(i))·(H + Jh)',
        originalMm: rawSpandrelMm,
        modules: clampedN - topModCounts[i - 1],
        modularMm: modSpandrelMm,
        deltaMm: modSpandrelMm - rawSpandrelMm,
        direction: resolveDirection(modSpandrelMm - rawSpandrelMm),
      });
    }
  }

  // 5. Дверной проём по вертикали (если вход активен)
  let coordDoorBottomM = arch.entranceBottomM ?? params.entranceBottomM;
  let coordDoorHeightM = arch.entranceHeightM ?? params.entranceHeightM;
  if (params.hasEntrance) {
    const rawDoorBotMm = Math.round((arch.entranceBottomM ?? 0) * 1000);
    const rawDoorHMm = Math.round((arch.entranceHeightM ?? 2.4) * 1000);
    if (rawDoorBotMm <= (brick.H + brick.Jh) / 2) {
      const topSnap = snapVerticalH2ToBrick(rawDoorHMm, brick, 12);
      coordDoorBottomM = 0;
      coordDoorHeightM = mmToM(topSnap.modularMm);
      items.push({
        id: 'door_height',
        axis: 'vertical_elevation',
        label: 'Высота / отметка верха входа (от земли, H2)',
        formulaUsed: 'H2 = N·(H + Jh) − H',
        originalMm: rawDoorHMm,
        modules: topSnap.modules,
        modularMm: topSnap.modularMm,
        deltaMm: topSnap.deltaMm,
        direction: topSnap.direction,
      });
    } else {
      const botSnap = snapVerticalH2ToBrick(rawDoorBotMm, brick, 1);
      const dhSnap = snapVerticalH1ToBrick(rawDoorHMm, brick, 12);
      coordDoorBottomM = mmToM(botSnap.modularMm);
      coordDoorHeightM = mmToM(dhSnap.modularMm);
      items.push({
        id: 'door_height',
        axis: 'vertical_height',
        label: 'Высота дверного проёма (H1)',
        formulaUsed: 'H1 = N·(H + Jh)',
        ...dhSnap,
      });
    }
  }

  // 6. Главный карниз: отметка низа карниза (H2), расстояние от верхнего окна до карниза (H1) и высота h_main (H1)
  const rawCorniceBotMm = Math.round(
    rawTopFloorTopMm + (arch.corniceBottomOffsetM ?? 0) * 1000
  );
  const lastTopN = topModCounts[topModCounts.length - 1] ?? 10;
  const rawCBotSnap = snapVerticalH2ToBrick(rawCorniceBotMm, brick, lastTopN + 1);
  const clampedCBotN = Math.max(lastTopN + 1, rawCBotSnap.modules);
  const coordCorniceBotMm = calcVerticalModuleH2Mm(clampedCBotN, brick);
  const coordCorniceOffsetM = mmToM(coordCorniceBotMm - coordTopFloorTopMm);

  const rawW2cMm =
    rawCorniceBotMm -
    (rawFloorOffsetsMm[safeFloors - 1] +
      Math.round(
        (arch.windowSillHeights?.[safeFloors - 1] ?? getRawSillRelM(params, arch, safeFloors - 1)) *
          1000
      ) +
      rawHMm);
  const modW2cMm = coordCorniceBotMm - (coordWinTopMmList[coordWinTopMmList.length - 1] ?? 0);
  items.push({
    id: 'top_window_to_cornice',
    axis: 'vertical_height',
    label: 'От верхней границы верхних окон до низа главного карниза (H1)',
    formulaUsed: 'H1 = (N_карн − N_верх)·(H + Jh)',
    originalMm: rawW2cMm,
    modules: clampedCBotN - lastTopN,
    modularMm: modW2cMm,
    deltaMm: modW2cMm - rawW2cMm,
    direction: resolveDirection(modW2cMm - rawW2cMm),
  });

  const rawHMainMm = Math.round(arch.hMain * 1000);
  const hMainSnap = isLocked('hMain')
    ? {
        originalMm: rawHMainMm,
        modules: Math.max(1, Math.round((params.hMain * 1000) / (brick.H + brick.Jh))),
        modularMm: Math.round(params.hMain * 1000),
        deltaMm: Math.round(params.hMain * 1000) - rawHMainMm,
        direction: resolveDirection(Math.round(params.hMain * 1000) - rawHMainMm),
      }
    : snapVerticalH1ToBrick(rawHMainMm, brick, 3);
  const coordHMainMm = hMainSnap.modularMm;
  items.push({
    id: 'main_cornice_height',
    axis: 'vertical_height',
    label: 'Высота главного карниза h_main (H1)',
    formulaUsed: 'H1 = N·(H + Jh)',
    ...hMainSnap,
  });

  // 7. Поясная лента hGurt (H1)
  const rawHGurtMm = Math.round(arch.hGurt * 1000);
  const hGurtSnap = isLocked('hGurt')
    ? {
        originalMm: rawHGurtMm,
        modules: Math.max(1, Math.round((params.hGurt * 1000) / (brick.H + brick.Jh))),
        modularMm: Math.round(params.hGurt * 1000),
        deltaMm: Math.round(params.hGurt * 1000) - rawHGurtMm,
        direction: resolveDirection(Math.round(params.hGurt * 1000) - rawHGurtMm),
      }
    : snapVerticalH1ToBrick(rawHGurtMm, brick, 2);
  items.push({
    id: 'belt_height',
    axis: 'vertical_height',
    label: 'Высота поясной ленты h_gurt (H1)',
    formulaUsed: 'H1 = N·(H + Jh)',
    ...hGurtSnap,
  });

  const coordCorniceTopMm = coordCorniceBotMm + coordHMainMm;
  const maxFloorHMaxM = coordFloors.reduce((acc, fl) => Math.max(acc, fl.clearHeight), 0);

  const nextLevels: BuildingLevelsInput = {
    groundToFloor1: mmToM(coordGroundToF1Mm),
    floors: coordFloors.map(({ floorToFloor, slabThickness, clearHeight }) => ({
      floorToFloor,
      slabThickness,
      clearHeight,
    })),
    ...(arch.levels.manualTotalHeight !== undefined
      ? { manualTotalHeight: mmToM(coordCorniceTopMm) }
      : {}),
  };

  const coordinatedParams: FacadeParameters = {
    ...params,
    w: mmToM(coordWMm),
    A: mmToM(coordAMm),
    ordinaryPierAxisSpacings: coordSpacingsM,
    k_D: Number((coordDMm / coordAMm).toFixed(6)),
    ...(params.isRisalitCentered ? { risalitWidth: mmToM(2 * coordDMm) } : {}),
    h: mmToM(coordHMm),
    H: isLocked('H') ? params.H : Number(maxFloorHMaxM.toFixed(4)),
    hSocle: arch.useFullFloorAsSocle ? params.hSocle : mmToM(coordSocleMm),
    hMain: mmToM(coordHMainMm),
    hGurt: mmToM(hGurtSnap.modularMm),
    corniceBottomOffsetM: isLocked('corniceBottomOffsetM')
      ? params.corniceBottomOffsetM
      : coordCorniceOffsetM,
    windowSillHeights: coordSillHeights,
    ...(params.hasEntrance
      ? {
          entranceWidthM: mmToM(coordDoorWMm),
          entranceHeightM: coordDoorHeightM,
          entranceBottomM: coordDoorBottomM,
        }
      : {}),
    levels: nextLevels,
    totalHeight: mmToM(coordCorniceTopMm),
    brickMasonry: {
      enabled: true,
      brick,
      baseArch: arch,
    },
  };

  const horizontalTablePreview = Array.from({ length: 24 }, (_, idx) => {
    const modules = (idx + 1) * 0.5;
    return {
      modules,
      solidMm: calcHorizontalModuleMm(modules, brick),
      openingMm: calcHorizontalOpeningMm(modules, brick),
    };
  });

  const verticalTablePreview = Array.from({ length: 25 }, (_, idx) => {
    const modules = idx + 1;
    return {
      modules,
      h1Mm: calcVerticalModuleH1Mm(modules, brick),
      h2Mm: calcVerticalModuleH2Mm(modules, brick),
    };
  });

  return {
    coordinatedParams,
    brick,
    items,
    horizontalTablePreview,
    verticalTablePreview,
  };
}
