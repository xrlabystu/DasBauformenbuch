import rulesDataJson from './rulesData.json';

export type ValidationStatus = 'ok' | 'approx' | 'violation';

export type SourceStatus =
  | 'explicit-verified'
  | 'explicit-unverified'
  | 'heuristic'
  | 'editorial'
  | 'gap';

export type RulePriority = 'P0' | 'P1' | 'P2' | 'P3';

export const SOURCE_STATUS_LABELS: Record<SourceStatus, string> = {
  'explicit-verified': 'Из книги (проверено S. 1–23)',
  'explicit-unverified': 'Из книги (требует сверки)',
  heuristic: 'UX-эвристика (допущение)',
  editorial: 'Редакционная разметка',
  gap: 'Пробел / экстраполяция',
};

export function mergeStatuses(...statuses: (ValidationStatus | 'n/a')[]): ValidationStatus {
  const rank: Record<ValidationStatus | 'n/a', number> = {
    'n/a': 0,
    ok: 1,
    approx: 2,
    violation: 3,
  };
  let worst: ValidationStatus = 'ok';
  for (const s of statuses) {
    if (s === 'n/a') continue;
    if (rank[s] > rank[worst]) {
      worst = s;
    }
  }
  return worst;
}

export type BuildingTypeId =
  | 'simple_house'
  | 'urban_house'
  | 'miethaus'
  | 'villa'
  | 'monumental'
  | 'palace'
  | 'rich_columnar';

export type RuleType = 'formula' | 'constraint' | 'heuristic' | 'typology' | 'profile_rule';
export type RuleConfidence = 'explicit' | 'heuristic';
export type FacadeTargetElement =
  | 'axenweite'
  | 'pier'
  | 'framing_pier'
  | 'corner'
  | 'window'
  | 'entablature'
  | 'pilaster'
  | 'cornice'
  | 'socle'
  | 'belt';

export interface RatioSpec {
  label: string;
  n: number;
  m: number;
  category?: string;
  note?: string;
}

export interface FramingRatioSpec {
  label: string;
  r: number;
  f: number;
  k: number;
  note: string;
}

export interface TypologyPreset {
  id: BuildingTypeId;
  nameRu: string;
  nameDe: string;
  page: string;
  recommendedAH: string;
  minRatioAH: number;
  maxRatioAH: number;
  typicalRatioAH: [number, number];
  cornerRule: string;
  pierRule: string;
  defaults: {
    H: number;
    ratioN: number;
    ratioM: number;
    w: number;
    u: number;
    h: number;
    k_D: number;
    T: number;
    Wp: number;
    v: number;
    Tc: number;
  };
  summary: string;
}

export interface RuleRecord {
  id: string;
  page: string;
  bookPageIndex: number;
  type: RuleType;
  title: string;
  expression: string;
  domain: string;
  values?: string[];
  limits?: string[];
  inputs: string[];
  outputs: string[];
  example: string;
  note: string;
  confidence: RuleConfidence;
  sourceStatus: SourceStatus;
  priority?: RulePriority;
  statusLabel: 'жёсткое ограничение' | 'эвристика' | 'качественный совет';
  targetElement: FacadeTargetElement;
}

export const RULES_DATA = rulesDataJson as {
  source: {
    author: string;
    title: string;
    volume: string;
    year: number;
    pages: string;
  };
  standardAxenRatios: RatioSpec[];
  limitAxenRatios: RatioSpec[];
  goldenApproximations: RatioSpec[];
  framingRatios: FramingRatioSpec[];
  typologies: TypologyPreset[];
  rules: RuleRecord[];
};

export const PHI = (1 + Math.sqrt(5)) / 2;
const EPS = 1e-9;

export const KNOWN_GOOD_RATIOS: [number, number][] = [
  [3, 5],
  [5, 8],
  [5, 9],
  [4, 7],
  [8, 13],
  [13, 21],
  [21, 34],
  [34, 55],
  [55, 89],
  [89, 144],
];

export function isKnownGoodRatio(w: number, h: number, eps = 1e-3): boolean {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return false;
  const actual = h / w;
  return KNOWN_GOOD_RATIOS.some(([a, b]) => Math.abs(actual - b / a) <= eps);
}

export function formatMeters(value: number, digits = 3): string {
  if (!Number.isFinite(value)) return '—';
  const normalized = Math.abs(value) < 1e-12 ? 0 : value;
  return normalized.toFixed(digits);
}

export function formatPercent(ratioDiff: number, digits = 1): string {
  if (!Number.isFinite(ratioDiff)) return '—';
  return `${(ratioDiff * 100).toFixed(digits)} %`;
}

export function getTypology(id: BuildingTypeId): TypologyPreset {
  return RULES_DATA.typologies.find((t) => t.id === id) ?? RULES_DATA.typologies[1];
}

// ==================================================
// Поэтажная геометрическая модель (Levels & DerivedGeometry)
// ==================================================

export interface FloorLevelInput {
  floorToFloor: number;
  slabThickness: number;
  clearHeight?: number;
}

export interface BuildingLevelsInput {
  groundToFloor1: number;
  floors: FloorLevelInput[];
  manualTotalHeight?: number;
  facadeWidthOverride?: number;
}

export interface DerivedGeometry {
  clearHeights: number[];
  H_max: number;
  floor1FloorToFloor: number;
  floor1FullHeight: number;
  wallTopElevation: number;
  totalHeight: number;
  facadeWidth: number;
  usesManualTotalHeight: boolean;
}

export function computeDerivedGeometry(
  levels: BuildingLevelsInput,
  A: number,
  D: number,
  axesCount: number,
  hMain: number
): DerivedGeometry {
  const clearHeights = levels.floors.map((f) =>
    f.clearHeight !== undefined && Number.isFinite(f.clearHeight)
      ? Math.max(0.5, f.clearHeight)
      : Math.max(0.5, f.floorToFloor - f.slabThickness)
  );
  const H_max = clearHeights.length > 0 ? Math.max(...clearHeights) : 3.6;
  const floor1FloorToFloor = levels.floors[0]?.floorToFloor ?? H_max + 0.35;
  const floor1FullHeight = Math.max(0.5, levels.groundToFloor1) + floor1FloorToFloor;
  const sumFloors = levels.floors.reduce((acc, f) => acc + Math.max(0.5, f.floorToFloor), 0);
  const wallTopElevation = Math.max(0, levels.groundToFloor1) + sumFloors;
  const usesManualTotalHeight =
    levels.manualTotalHeight !== undefined &&
    Number.isFinite(levels.manualTotalHeight) &&
    levels.manualTotalHeight > 0;
  const totalHeight = usesManualTotalHeight
    ? levels.manualTotalHeight!
    : wallTopElevation + Math.max(0, hMain);
  const safeAxesCount = Math.max(1, Math.round(axesCount));
  const facadeWidth =
    levels.facadeWidthOverride !== undefined &&
    Number.isFinite(levels.facadeWidthOverride) &&
    levels.facadeWidthOverride > 0
      ? levels.facadeWidthOverride
      : 2 * D + Math.max(0, safeAxesCount - 1) * A;

  return {
    clearHeights,
    H_max,
    floor1FloorToFloor,
    floor1FullHeight,
    wallTopElevation,
    totalHeight,
    facadeWidth,
    usesManualTotalHeight,
  };
}

export function buildDefaultLevels(
  floorsCount: number,
  clearH: number,
  groundToFloor1: number
): BuildingLevelsInput {
  const safeCount = Math.max(1, Math.round(floorsCount));
  const slabThickness = 0.35;
  const floors: FloorLevelInput[] = Array.from({ length: safeCount }, (_, idx) => {
    let ch = clearH;
    if (safeCount >= 3 && idx === safeCount - 1) {
      ch = Math.max(2.6, Number((clearH * 0.85).toFixed(3)));
    } else if (safeCount >= 3 && idx >= 2) {
      ch = Math.max(2.8, Number((clearH * 0.94).toFixed(3)));
    }
    return {
      floorToFloor: Number((ch + slabThickness).toFixed(3)),
      slabThickness,
      clearHeight: Number(ch.toFixed(3)),
    };
  });
  return {
    groundToFloor1: Number(groundToFloor1.toFixed(3)),
    floors,
  };
}

export function syncLevelsWithH(
  levels: BuildingLevelsInput,
  targetH: number
): BuildingLevelsInput {
  if (levels.floors.length === 0) {
    return buildDefaultLevels(2, targetH, levels.groundToFloor1);
  }
  const safeTarget = Math.max(2.0, targetH);
  const safeCount = levels.floors.length;
  const updated = levels.floors.map((f, idx) => {
    const slab = Math.max(0.15, f.slabThickness);
    let ch = safeTarget;
    if (safeCount >= 3 && idx === safeCount - 1) {
      ch = Math.max(2.5, Number((safeTarget * 0.85).toFixed(3)));
    } else if (safeCount >= 3 && idx >= 2) {
      ch = Math.max(2.7, Number((safeTarget * 0.94).toFixed(3)));
    }
    return {
      ...f,
      clearHeight: Number(ch.toFixed(3)),
      floorToFloor: Number((ch + slab).toFixed(3)),
    };
  });
  return {
    ...levels,
    floors: updated,
  };
}

// ==================================================
// 3.1. Шаг осей (Axenweite) по высоте комнаты (Zimmerhöhe)
// ==================================================

export function A_from_H(H: number, n: number, m: number): number {
  if (m === 0) return NaN;
  return H * (n / m);
}

export function H_from_A(A: number, n: number, m: number): number {
  if (n === 0) return NaN;
  return A * (m / n);
}

export interface RatioFromAHResult {
  ratio: number;
  n: number;
  m: number;
  nearestStandard: RatioSpec;
  nearestAny: RatioSpec;
  deviation: number;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  explanation: string;
  formula: string;
  page: string;
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function ratio_from_AH(
  A: number,
  H: number,
  tolerance = 0.03,
  buildingType: BuildingTypeId = 'urban_house'
): RatioFromAHResult {
  const ratio = H > 0 ? A / H : NaN;
  const standardList = RULES_DATA.standardAxenRatios;
  const allList = [...standardList, ...RULES_DATA.limitAxenRatios];

  let nearestStandard = standardList[0];
  let minStdDiff = Infinity;
  for (const item of standardList) {
    const target = item.n / item.m;
    const diff = Math.abs(ratio - target);
    if (diff < minStdDiff) {
      minStdDiff = diff;
      nearestStandard = item;
    }
  }

  let nearestAny = allList[0];
  let minAnyDiff = Infinity;
  for (const item of allList) {
    const target = item.n / item.m;
    const diff = Math.abs(ratio - target);
    if (diff < minAnyDiff) {
      minAnyDiff = diff;
      nearestAny = item;
    }
  }

  const scaledN = Math.round(ratio * 100);
  const scaledM = 100;
  const d = gcd(scaledN, scaledM);
  const n = scaledN / d;
  const m = scaledM / d;

  const targetVal =
    buildingType === 'palace' || buildingType === 'rich_columnar'
      ? nearestAny.n / nearestAny.m
      : nearestStandard.n / nearestStandard.m;
  const deviation = targetVal > 0 ? Math.abs(ratio - targetVal) / targetVal : 0;

  const typology = getTypology(buildingType);
  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(ratio) || ratio <= 0) {
    status = 'violation';
    explanation = 'Некорректные положительные значения A или H.';
  } else if (
    ratio >= typology.minRatioAH - EPS &&
    ratio <= typology.maxRatioAH + EPS
  ) {
    status = deviation <= 0.005 ? 'ok' : deviation <= tolerance ? 'approx' : 'ok';
    explanation = `Отношение A:H ≈ ${formatMeters(ratio, 3)} входит в рекомендуемый диапазон для типа «${typology.nameRu}» (${typology.recommendedAH}). Ближайшее отношение: ${(buildingType === 'palace' || buildingType === 'rich_columnar' ? nearestAny : nearestStandard).label}.`;
  } else if (
    ratio >= typology.minRatioAH * (1 - tolerance) - EPS &&
    ratio <= typology.maxRatioAH * (1 + tolerance) + EPS
  ) {
    status = 'approx';
    explanation = `Отношение A:H ≈ ${formatMeters(ratio, 3)} незначительно отклоняется от диапазона «${typology.nameRu}» (${typology.recommendedAH}), но остаётся в пределах допуска ${formatPercent(tolerance, 0)}.`;
  } else {
    status = 'violation';
    explanation = `Отношение A:H ≈ ${formatMeters(ratio, 3)} выходит за пределы диапазона типа «${typology.nameRu}» (${typology.recommendedAH}).`;
  }

  return {
    ratio,
    n,
    m,
    nearestStandard,
    nearestAny,
    deviation,
    status,
    sourceStatus: 'explicit-verified',
    explanation,
    formula: 'A / H_max = n / m',
    page: 'S. 5–6',
  };
}

// ==================================================
// 3.2. Простенки без обрамления
// ==================================================

export interface PierNoFrameResult {
  p: number;
  check: boolean;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function p_from_Aw(
  A: number,
  w: number,
  buildingType: BuildingTypeId = 'urban_house'
): PierNoFrameResult {
  const p = A - w;
  const check = p >= w - EPS && p > 0;
  const isColumnar = buildingType === 'rich_columnar';

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (p <= 0) {
    status = 'violation';
    explanation = `Простенок вырожден (p = ${formatMeters(p)} м ≤ 0): ширина окна w превышает шаг осей A.`;
  } else if (check) {
    const isEquality = Math.abs(p - w) <= 1e-4;
    status = 'ok';
    explanation = isEquality
      ? `Равенство границ: p = ${formatMeters(p)} м = w (${formatMeters(w)} м), требование p ≥ w выполнено.`
      : `Простенок без обрамления p = ${formatMeters(p)} м > w (${formatMeters(w)} м), требование p ≥ w выполнено.`;
  } else if (isColumnar) {
    // P0-3: S. 5 явно отменяет правило p >= w для богатой колонно-пилястровой архитектуры
    status = 'ok';
    explanation = `Простенок p = ${formatMeters(p)} м < w (${formatMeters(w)} м). Правило отменено для богатой колонно-пилястровой архитектуры (S. 5): проём может быть шире промежуточного простенка.`;
  } else {
    status = 'violation';
    explanation = `Нарушение p ≥ w: простенок p = ${formatMeters(p)} м меньше ширины окна w = ${formatMeters(w)} м (минимальный шаг A_min = ${formatMeters(2 * w)} м).`;
  }

  return {
    p,
    check,
    status,
    sourceStatus: 'explicit-verified',
    explanation,
    formula: 'p = A − w; проверка: p ≥ w (отменено для rich_columnar)',
    page: 'S. 5',
  };
}

export function A_from_pw(p: number, w: number): number {
  return p + w;
}

export function w_max_from_A(A: number): number {
  return A / 2;
}

// ==================================================
// 3.3. Простенки с обрамлением
// ==================================================

export interface PierWithFrameResult {
  w_v: number;
  p_c: number;
  check: boolean;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function pc_from_Awu(
  A: number,
  w: number,
  u: number,
  buildingType: BuildingTypeId = 'urban_house'
): PierWithFrameResult {
  const w_v = w + 2 * u;
  const p_c = A - w_v;
  const check = p_c >= w_v - EPS && p_c > 0;
  const isColumnar = buildingType === 'rich_columnar';

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (p_c <= 0) {
    status = 'violation';
    explanation = `Чистый простенок отрицателен или равен нулю (p_c = ${formatMeters(p_c)} м): обрамления перекрывают простенок.`;
  } else if (check) {
    const isEquality = Math.abs(p_c - w_v) <= 1e-4;
    status = 'ok';
    explanation = isEquality
      ? `Равенство границ: чистый простенок p_c = ${formatMeters(p_c)} м равен видимой ширине проёма w_v = ${formatMeters(w_v)} м (p_c ≥ w_v).`
      : `Чистый простенок p_c = ${formatMeters(p_c)} м ≥ видимой ширины проёма w_v = ${formatMeters(w_v)} м.`;
  } else if (isColumnar) {
    // P0-3: S. 5 отменяет p_c >= w_v для богатой колонно-пилястровой архитектуры
    status = 'ok';
    explanation = `Чистый простенок p_c = ${formatMeters(p_c)} м < w_v (${formatMeters(w_v)} м). Правило отменено для богатой колонно-пилястровой архитектуры (S. 5).`;
  } else {
    status = 'violation';
    explanation = `Нарушение p_c ≥ w_v: чистый простенок p_c = ${formatMeters(p_c)} м меньше ширины проёма с обрамлением w_v = ${formatMeters(w_v)} м (требуется A ≥ ${formatMeters(A_min_from_wu(w, u))} м).`;
  }

  return {
    w_v,
    p_c,
    check,
    status,
    sourceStatus: 'explicit-verified',
    explanation,
    formula: 'w_v = w + 2u; p_c = A − (w + 2u); проверка: p_c ≥ w_v',
    page: 'S. 5',
  };
}

export function A_min_from_wu(w: number, u: number): number {
  return 2 * (w + 2 * u);
}

// ==================================================
// 3.4. Угловой простенок (Eckpfeiler)
// ==================================================

export function D_from_A(A: number, k_D = 0.8): number {
  return k_D * A;
}

export function p_corner_from_Dwu(D: number, w: number, u = 0): number {
  return D - w / 2 - u;
}

export interface CornerCheckResult {
  D: number;
  p_corner: number;
  k_D: number;
  kDInRange: boolean;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  explanation: string;
  recommendation: string;
  formula: string;
  page: string;
}

export function check_corner(
  type: BuildingTypeId,
  p_corner: number,
  w: number,
  p_intermediate: number,
  k_D = 0.8,
  D_override?: number,
  isRisalitCentered = false
): CornerCheckResult {
  const kMin = 2 / 3;
  const kMax = 5 / 6;
  const kDInRange = k_D >= kMin - 1e-4 && k_D <= kMax + 1e-4;
  const D = D_override ?? 0;

  if (p_corner <= 0) {
    return {
      D,
      p_corner,
      k_D,
      kDInRange,
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: `Угловой простенок p_corner = ${formatMeters(p_corner)} м ≤ 0 — край проёма выходит за угол здания.`,
      recommendation: 'Увеличьте расстояние D от угла до первой оси или уменьшите ширину окна w и обрамления u.',
      formula: 'p_corner = D − w/2 − u',
      page: 'S. 4–5',
    };
  }

  if (isRisalitCentered) {
    return {
      D,
      p_corner,
      k_D,
      kDInRange: true,
      status: p_corner >= w * 0.5 ? 'ok' : 'approx',
      sourceStatus: 'explicit-verified',
      explanation: `Комната занимает всю ширину ризалита/западающей части: ось окна привязана к середине (D = ширина_ризалита / 2 = ${formatMeters(D)} м), сравнение с A отпадает (S. 4).`,
      recommendation: 'Контролируйте достаточность угла конструктивно по ширине ризалита.',
      formula: 'D = ширина_ризалита / 2; p_corner = D − w/2 − u',
      page: 'S. 4',
    };
  }

  let status: ValidationStatus = 'ok';
  let explanation = '';
  let recommendation = '';

  if (type === 'monumental' || type === 'palace') {
    if (p_corner > p_intermediate + EPS) {
      status = kDInRange ? 'ok' : 'approx';
      explanation = `Монументальное требование выполнено: угловой простенок p_corner = ${formatMeters(p_corner)} м шире промежуточного p = ${formatMeters(p_intermediate)} м (S. 4).`;
      recommendation = kDInRange
        ? 'Угловой массив создаёт выраженную устойчивость фасада.'
        : `Коэффициент k_D = ${formatMeters(k_D, 3)} вне типичного диапазона [2/3, 5/6].`;
    } else {
      status = 'violation';
      explanation = `Нарушение для монументального здания: p_corner (${formatMeters(p_corner)} м) должен быть больше промежуточного простенка (${formatMeters(p_intermediate)} м).`;
      recommendation = 'Увеличьте коэффициент k_D (например, до 5/6 ≈ 0.833) или усильте угловой простенок.';
    }
  } else if (type === 'simple_house' || type === 'villa') {
    if (p_corner > w + EPS) {
      status = kDInRange ? 'ok' : 'approx';
      explanation = `Условие отдельно стоящего жилого дома выполнено: p_corner = ${formatMeters(p_corner)} м > w (${formatMeters(w)} м).`;
      recommendation = kDInRange
        ? 'Стандартный диапазон k_D ∈ [2/3, 5/6] (по умолчанию 4/5) соблюдён.'
        : `Коэффициент k_D = ${formatMeters(k_D, 3)} выходит за типовой интервал [0.667, 0.833].`;
    } else if (p_corner >= w * 0.9 - EPS) {
      status = 'approx';
      explanation = `Угловой простенок p_corner = ${formatMeters(p_corner)} м близок к ширине окна w = ${formatMeters(w)} м, но не превышает её строго (p_corner > w).`;
      recommendation = 'Рекомендуется увеличить k_D ближе к 4/5 или 5/6.';
    } else {
      status = 'violation';
      explanation = `Для отдельно стоящего жилого дома угловой простенок p_corner = ${formatMeters(p_corner)} м меньше ширины окна w = ${formatMeters(w)} м.`;
      recommendation = 'Увеличьте k_D или уменьшите ширину окна w.';
    }
  } else {
    if (p_corner > w + EPS || p_intermediate >= p_corner - EPS) {
      status = kDInRange ? 'ok' : 'approx';
      explanation =
        p_intermediate >= p_corner - EPS
          ? `Для городского дома допускается p_intermediate (${formatMeters(p_intermediate)} м) ≥ p_corner (${formatMeters(p_corner)} м) (S. 4–5).`
          : `Угловой простенок p_corner = ${formatMeters(p_corner)} м > w (${formatMeters(w)} м).`;
      recommendation = kDInRange
        ? 'Рекомендуемое значение k_D = 4/5 (0.800) в пределах [2/3, 5/6].'
        : `Коэффициент k_D = ${formatMeters(k_D, 3)} выходит за типовой интервал [2/3, 5/6].`;
    } else {
      status = 'approx';
      explanation = `Угловой простенок p_corner = ${formatMeters(p_corner)} м допустим для городской застройки, но меньше ширины окна w = ${formatMeters(w)} м.`;
      recommendation = 'При возможности укрепите угол (k_D → 4/5) или введите угловой пилястр.';
    }
  }

  return {
    D,
    p_corner,
    k_D,
    kDInRange,
    status,
    sourceStatus: 'explicit-verified',
    explanation,
    recommendation,
    formula: 'D = k_D × A; p_corner = D − w/2 − u',
    page: 'S. 4–5',
  };
}

// ==================================================
// 3.5. Пропорции окна (Fensterproportionen)
// ==================================================

export function h_from_w_ratio(w: number, n: number, m: number): number {
  if (n === 0) return NaN;
  return (w * m) / n;
}

export function w_from_h_ratio(h: number, n: number, m: number): number {
  if (m === 0) return NaN;
  return (h * n) / m;
}

export interface NearestGoldenResult {
  spec: RatioSpec;
  targetRatio: number;
  actualRatio: number;
  diff: number;
}

export function nearest_golden_approx(w: number, h: number): NearestGoldenResult {
  const actualRatio = w > 0 ? h / w : NaN;
  const list = RULES_DATA.goldenApproximations;
  let best = list[0];
  let minDiff = Infinity;

  for (const item of list) {
    const target = item.m / item.n;
    const diff = Math.abs(target - actualRatio);
    if (diff < minDiff) {
      minDiff = diff;
      best = item;
    }
  }

  return {
    spec: best,
    targetRatio: best.m / best.n,
    actualRatio,
    diff: minDiff,
  };
}

export interface WindowCheckResult {
  ratio: number;
  nearestApprox: NearestGoldenResult;
  goldenDiffPct: number;
  rangeCheck: {
    passed: boolean;
    minH: number;
    maxH: number;
    status: ValidationStatus;
    explanation: string;
  };
  diagCheck: {
    d: number;
    halfD: number;
    strictPassed: boolean;
    knownGoodRatio: boolean;
    deviationPct: number;
    rawShortfallPct: number;
    status: ValidationStatus;
    sourceStatus: SourceStatus;
    explanation: string;
  };
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function check_window(w: number, h: number, tolerance = 0.07): WindowCheckResult {
  const ratio = w > 0 ? h / w : NaN;
  const nearestApprox = nearest_golden_approx(w, h);
  const goldenDiffPct = Math.abs(ratio - PHI) / PHI;

  const minH = 1.5 * w;
  const maxH = 2.0 * w;
  const rangePassed = h >= minH - EPS && h <= maxH + EPS;
  let rangeStatus: ValidationStatus = 'ok';
  let rangeExplanation = '';

  if (!Number.isFinite(ratio) || w <= 0 || h <= 0) {
    rangeStatus = 'violation';
    rangeExplanation = 'Ширина и высота окна должны быть положительными.';
  } else if (rangePassed) {
    rangeStatus = 'ok';
    rangeExplanation = `Отношение h/w = ${formatMeters(ratio, 3)} входит в базовые пределы 1.5w ≤ h ≤ 2w (${formatMeters(minH)}…${formatMeters(maxH)} м).`;
  } else if (h > maxH) {
    rangeStatus = 'violation';
    rangeExplanation = `Нарушение верхнего предела h ≤ 2w: высота h = ${formatMeters(h)} м превышает 2w = ${formatMeters(maxH)} м.`;
  } else {
    rangeStatus = 'violation';
    rangeExplanation = `Нарушение нижнего предела h ≥ 1.5w: высота h = ${formatMeters(h)} м меньше 1.5w = ${formatMeters(minH)} м.`;
  }

  const d = Math.hypot(w, h);
  const halfD = d / 2;
  const strictPassed = w <= halfD + EPS;
  const knownGoodRatio = isKnownGoodRatio(w, h, 1e-3);
  const shortfall = Math.max(0, w - halfD);
  const deviationPct = halfD > 0 ? shortfall / halfD : 0;
  const rawShortfallPct = w > 0 ? shortfall / w : 0;

  let diagStatus: ValidationStatus = 'ok';
  let diagExplanation = '';

  if (!Number.isFinite(d) || w <= 0 || h <= 0) {
    diagStatus = 'violation';
    diagExplanation = 'Невозможно вычислить диагональ окна.';
  } else if (strictPassed) {
    diagStatus = 'ok';
    diagExplanation = `Правило половины диагонали выполнено строго: w = ${formatMeters(w)} м ≤ d/2 = ${formatMeters(halfD)} м (h ≥ √3·w).`;
  } else if (knownGoodRatio) {
    // P0-2: отношения из книги (3:5, 5:8, 5:9, 4:7, Фибоначчи) не могут давать violation
    diagStatus = 'approx';
    diagExplanation = `Отношение ${nearestApprox.spec.label} явно рекомендовано источником (S. 6–7): половина диагонали d/2 = ${formatMeters(halfD)} м чуть меньше w = ${formatMeters(w)} м (отклонение ${(deviationPct * 100).toFixed(1)} %).`;
  } else if (deviationPct <= tolerance + EPS) {
    diagStatus = 'approx';
    diagExplanation = `Практическое приближение (S. 7): половина диагонали d/2 = ${formatMeters(halfD)} м чуть меньше ширины w = ${formatMeters(w)} м (отклонение ${(deviationPct * 100).toFixed(1)} %, в пределах допуска ${(tolerance * 100).toFixed(0)} %).`;
  } else {
    diagStatus = 'violation';
    diagExplanation = `Половина диагонали d/2 = ${formatMeters(halfD)} м меньше w = ${formatMeters(w)} м на ${(deviationPct * 100).toFixed(1)} % (превышает допуск ${(tolerance * 100).toFixed(0)} %).`;
  }

  const status = mergeStatuses(rangeStatus, diagStatus);

  const explanation =
    status === 'ok'
      ? `Окно ${formatMeters(w)} × ${formatMeters(h)} м (h/w = ${formatMeters(ratio, 3)}, ближайшее к золотому сечению: ${nearestApprox.spec.label}) удовлетворяет всем критериям (S. 6–7).`
      : status === 'approx'
        ? `${rangeExplanation} ${diagExplanation}`
        : `${!rangePassed ? rangeExplanation : diagExplanation}`;

  return {
    ratio,
    nearestApprox,
    goldenDiffPct,
    rangeCheck: {
      passed: rangePassed,
      minH,
      maxH,
      status: rangeStatus,
      explanation: rangeExplanation,
    },
    diagCheck: {
      d,
      halfD,
      strictPassed,
      knownGoodRatio,
      deviationPct,
      rawShortfallPct,
      status: diagStatus,
      sourceStatus: knownGoodRatio || strictPassed ? 'explicit-verified' : 'heuristic',
      explanation: diagExplanation,
    },
    status,
    explanation,
    formula: '1.5w ≤ h ≤ 2w; d = √(w² + h²); проверка w ≤ d/2 (допуск 7 % + ряд 3:5, 5:8…)',
    page: 'S. 6–7',
  };
}

// ==================================================
// 3.6. Обрамление и сандрик окна (Rahmen, Fries, Kranz)
// ==================================================

export interface FramingResult {
  R: number;
  F: number;
  K: number;
  T: number;
  scale: number;
  ratioLabel: string;
  requiresIncreasedProjection: boolean;
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function framing_from_T(
  T: number,
  r: number,
  f: number,
  k: number
): FramingResult {
  const sum = r + f + k;
  const s = sum > 0 ? T / sum : 0;
  const R = s * r;
  const F = s * f;
  const K = s * k;
  const ratioLabel = `${r}:${f}:${k}`;
  const requiresIncreasedProjection = f > k;
  const status: ValidationStatus =
    T <= 0 || sum <= 0 ? 'violation' : requiresIncreasedProjection ? 'approx' : 'ok';

  const explanation =
    T <= 0
      ? 'Общая высота сандрика T должна быть положительной.'
      : requiresIncreasedProjection
        ? `Отношение ${ratioLabel} (фриз выше карниза) допустимо по Brausewetter (S. 8) при условии увеличенного выноса венчающего карниза.`
        : `При T = ${formatMeters(T)} м и отношении ${ratioLabel} (сумма ${sum}, модуль s = ${formatMeters(s, 5)} м): R = ${formatMeters(R)} м, F = ${formatMeters(F)} м, K = ${formatMeters(K)} м.`;

  return {
    R,
    F,
    K,
    T,
    scale: s,
    ratioLabel,
    requiresIncreasedProjection,
    status,
    explanation,
    formula: 's = T / (r + f + k); R = s·r, F = s·f, K = s·k',
    page: 'S. 7–8',
  };
}

export function framing_from_module(
  baseValue: number,
  basePart: 'R' | 'F' | 'K',
  r: number,
  f: number,
  k: number
): FramingResult {
  const divisor = basePart === 'R' ? r : basePart === 'F' ? f : k;
  const s = divisor > 0 ? baseValue / divisor : 0;
  const T = s * (r + f + k);
  return framing_from_T(T, r, f, k);
}

export function projection_45(height: number): number {
  return height;
}

export function projection_console(height: number): number {
  return (height * 5) / 6;
}

export interface OffsetCheckResult {
  a_front: number;
  a_side: number;
  diff: number;
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function check_offset(
  a_front: number,
  a_side: number,
  tolerance = 0.005
): OffsetCheckResult {
  const diff = Math.abs(a_front - a_side);
  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (a_front < 0 || a_side < 0) {
    status = 'violation';
    explanation = 'Отступы от верхней плитки консоли до слезника не могут быть отрицательными.';
  } else if (diff <= 1e-4) {
    status = 'ok';
    explanation = `Отступ спереди (a_front = ${formatMeters(a_front)} м) равен отступу с боков (a_side = ${formatMeters(a_side)} м) — требование S. 8 выполнено.`;
  } else if (diff <= tolerance + EPS) {
    status = 'approx';
    explanation = `Разница отступов a_front и a_side составляет ${formatMeters(diff)} м (в пределах допуска ${formatMeters(tolerance)} м).`;
  } else {
    status = 'violation';
    explanation = `Нарушение a_front = a_side: спереди ${formatMeters(a_front)} м, с боков ${formatMeters(a_side)} м (разница ${formatMeters(diff)} м).`;
  }

  return {
    a_front,
    a_side,
    diff,
    status,
    explanation,
    formula: 'a_front = a_side',
    page: 'S. 8',
  };
}

// ==================================================
// 3.7. Пилястры и лопатки (Pilaster / Mauerpfeiler)
// ==================================================

export interface PilasterRangeResult {
  v_max: number;
  v_light_min: number;
  v_light_max: number;
}

export function pilaster_v_range(W_p: number): PilasterRangeResult {
  return {
    v_max: W_p / 4,
    v_light_min: W_p / 6,
    v_light_max: W_p / 5,
  };
}

export interface PilasterCheckResult extends PilasterRangeResult {
  v: number;
  W_p: number;
  status: ValidationStatus;
  explanation: string;
  baseCapitalNote: string;
  formula: string;
  page: string;
}

export function check_pilaster(
  v: number,
  W_p: number,
  character: 'massive' | 'light' = 'light',
  isMauerpfeiler = false
): PilasterCheckResult {
  const { v_max, v_light_min, v_light_max } = pilaster_v_range(W_p);
  const baseCapitalNote = isMauerpfeiler
    ? 'Гладкая лопатка / стенной пилон (Mauerpfeiler) не нуждается в базе и капители (S. 12).'
    : 'Для пилястра и колонны база (Basis) и капитель (Kapitäl) обязательны (S. 12).';

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (W_p <= 0 || v <= 0) {
    status = 'violation';
    explanation = 'Ширина W_p и выступ v должны быть положительными.';
  } else if (v > v_max + EPS) {
    status = 'violation';
    explanation = `Нарушение v ≤ W_p/4: выступ v = ${formatMeters(v)} м превышает предельный максимум v_max = ${formatMeters(v_max)} м.`;
  } else if (character === 'light') {
    if (v >= v_light_min - EPS && v <= v_light_max + EPS) {
      status = 'ok';
      explanation = `Выступ v = ${formatMeters(v)} м попадает в лёгкий декоративный диапазон [${formatMeters(v_light_min)}, ${formatMeters(v_light_max)}] м (1/6…1/5 от W_p).`;
    } else {
      status = 'approx';
      explanation = `Выступ v = ${formatMeters(v)} м допустим (≤ v_max = ${formatMeters(v_max)} м), но выходит за рекомендованный для лёгкого характера интервал [${formatMeters(v_light_min)}, ${formatMeters(v_light_max)}] м.`;
    }
  } else {
    status = 'ok';
    explanation = `Выступ v = ${formatMeters(v)} м не превышает предел v_max = W_p/4 = ${formatMeters(v_max)} м.`;
  }

  return {
    v,
    W_p,
    v_max,
    v_light_min,
    v_light_max,
    status,
    explanation,
    baseCapitalNote,
    formula: 'v_max = W_p / 4; лёгкий: v ∈ [W_p / 6, W_p / 5]',
    page: 'S. 11–12',
  };
}

// ==================================================
// 3.8. Венчающая часть карниза (Kranz)
// ==================================================

export interface CorniceSplitResult {
  T_c: number;
  ratio: number;
  h_u: number;
  h_l: number;
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function cornice_split(
  T_c: number,
  ratio_upper_to_lower = 1
): CorniceSplitResult {
  const ratio = ratio_upper_to_lower;
  const h_u = ratio > 0 ? (T_c * ratio) / (ratio + 1) : 0;
  const h_l = T_c - h_u;

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (T_c <= 0 || ratio <= 0) {
    status = 'violation';
    explanation = 'Высота венчающей части T_c и отношение h_u:h_l должны быть положительными.';
  } else if (ratio >= 0.5 - EPS && ratio <= 2.0 + EPS) {
    status = 'ok';
    explanation = `Отношение верхних и нижних обломов h_u:h_l = ${formatMeters(ratio, 2)} находится в допустимом диапазоне [1:2, 2:1] (отправная норма 1:1): h_u = ${formatMeters(h_u)} м, h_l = ${formatMeters(h_l)} м.`;
  } else {
    status = 'violation';
    explanation = `Отношение h_u:h_l = ${formatMeters(ratio, 2)} выходит за допустимый диапазон [0.50 (1:2), 2.00 (2:1)] (S. 10–11).`;
  }

  return {
    T_c,
    ratio,
    h_u,
    h_l,
    status,
    explanation,
    formula: 'h_u : h_l ∈ [1:2, 2:1], базовое 1:1; h_u + h_l = T_c',
    page: 'S. 10–11',
  };
}

export type CorniceCharacter = 'heavy' | 'light' | 'neutral';

export function cornice_character(plateShare: number): CorniceCharacter {
  const normalized = plateShare > 1 ? plateShare / 100 : plateShare;
  if (normalized >= 0.75 - EPS) return 'heavy';
  if (normalized <= 0.5 + EPS) return 'light';
  return 'neutral';
}

// ==================================================
// 3.10. Цоколь (Sockel), главный и поясной карнизы, рустика (S. 10, 12, 16–17, 22)
// ==================================================

export type SocleMode = 'optimal' | 'typical';

export interface SocleHeightResult {
  h: number;
  range: [number, number];
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function socleHeight(
  totalHeight: number,
  mode: SocleMode = 'optimal'
): SocleHeightResult {
  const h = mode === 'optimal' ? totalHeight / 6 : totalHeight / 8;
  const min = totalHeight / 10;
  const max = totalHeight / 6;
  const status: ValidationStatus =
    !Number.isFinite(totalHeight) || totalHeight <= 0 || h < min - EPS ? 'violation' : 'ok';

  return {
    h,
    range: [min, max],
    status,
    explanation:
      mode === 'optimal'
        ? `Оптимальная высота цоколя (1/6 общей высоты ${formatMeters(totalHeight)} м) = ${formatMeters(h)} м (S. 16).`
        : `Типичная высота цоколя (1/8 общей высоты, диапазон 1/10…1/7) = ${formatMeters(h)} м (S. 16).`,
    formula: 'оптимум: h = H_total / 6; типично: H_total / 10 … H_total / 7',
    page: 'S. 16',
  };
}

export function checkSocleHeight(
  hSocle: number,
  totalHeight: number
): SocleHeightResult {
  const min = totalHeight / 10;
  const max = totalHeight / 6;
  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(hSocle) || !Number.isFinite(totalHeight) || totalHeight <= 0 || hSocle <= 0) {
    status = 'violation';
    explanation = 'Общая высота здания и высота цоколя должны быть положительными.';
  } else if (hSocle < min - EPS) {
    status = 'violation';
    explanation = `Ошибка (S. 16): цоколь ${formatMeters(hSocle)} м меньше 1/10 общей высоты (${formatMeters(min)} м) — здание выглядит неустойчиво и «уходит в землю».`;
  } else if (hSocle <= max + EPS) {
    const isOptimal = Math.abs(hSocle - max) <= 0.02;
    status = 'ok';
    explanation = isOptimal
      ? `Оптимальная высота цоколя: ${formatMeters(hSocle)} м ≈ 1/6 от ${formatMeters(totalHeight)} м (S. 16).`
      : `Высота цоколя ${formatMeters(hSocle)} м в пределах нормы [${formatMeters(min)}, ${formatMeters(max)}] м (1/10…1/6, S. 16).`;
  } else {
    status = 'approx';
    explanation = `Высота цоколя ${formatMeters(hSocle)} м превышает 1/6 общей высоты (${formatMeters(max)} м) — характерно при включении 1-го этажа в цоколь (S. 16, 22).`;
  }

  return {
    h: hSocle,
    range: [min, max],
    status,
    explanation,
    formula: 'H_total / 10 ≤ h_socle ≤ H_total / 6 (оптимум 1/6)',
    page: 'S. 16',
  };
}

export interface MainCorniceCheckResult {
  ok: boolean;
  range: [number, number];
  inRange: boolean;
  belowSocle: boolean;
  status: ValidationStatus;
  note: string | null;
  explanation: string;
  formula: string;
  page: string;
}

export function checkMainCornice(
  hSocle: number,
  hMain: number,
  totalHeight: number,
  floors: number
): MainCorniceCheckResult {
  const range: [number, number] =
    floors <= 2 ? [totalHeight / 12, totalHeight / 8] : [totalHeight / 15, totalHeight / 12];
  const inRange = hMain >= range[0] - EPS && hMain <= range[1] + EPS;
  const belowSocle = hMain < hSocle - EPS;
  const ok = inRange && belowSocle;
  const note = !belowSocle ? 'S. 16: главный карниз должен быть меньше цоколя' : null;

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!belowSocle) {
    status = 'violation';
    explanation = `Нарушение (S. 16): главный карниз h_main = ${formatMeters(hMain)} м должен быть строго меньше высоты цоколя h_socle = ${formatMeters(hSocle)} м.`;
  } else if (inRange) {
    status = 'ok';
    explanation = `Главный карниз h_main = ${formatMeters(hMain)} м входит в диапазон ${floors <= 2 ? '1/12…1/8' : '1/15…1/12'} ([${formatMeters(range[0])}, ${formatMeters(range[1])}] м) и меньше цоколя (${formatMeters(hSocle)} м).`;
  } else {
    status = 'violation';
    explanation = `Главный карниз h_main = ${formatMeters(hMain)} м выходит за диапазон ${floors <= 2 ? '1/12…1/8' : '1/15…1/12'} от общей высоты ([${formatMeters(range[0])}, ${formatMeters(range[1])}] м, S. 16).`;
  }

  return {
    ok,
    range,
    inRange,
    belowSocle,
    status,
    note,
    explanation,
    formula:
      floors <= 2
        ? '≤2 эт.: h_main ∈ [H_total/12, H_total/8]; h_main < h_socle'
        : '>2 эт.: h_main ∈ [H_total/15, H_total/12]; h_main < h_socle',
    page: 'S. 16',
  };
}

export interface GurtCheckResult {
  inRange: boolean;
  belowMain: boolean;
  belowSocle: boolean;
  range: [number, number];
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

// §5.2: Унифицированная проверка высоты поясного карниза (ленты) для checkGurt И beltHeight
export function checkBeltHeight(
  hGurt: number,
  floorHeight: number,
  hSocle: number,
  hMain: number,
  options: { allowModestLowerFloor?: boolean } = {}
): {
  h: number;
  range: [number, number];
  inRange: boolean;
  belowMain: boolean;
  belowSocle: boolean;
  status: ValidationStatus;
  note: string | null;
  explanation: string;
  formula: string;
  page: string;
} {
  const { allowModestLowerFloor = false } = options;
  const range: [number, number] = [floorHeight / 12, floorHeight / 6];
  const inRange = hGurt >= range[0] - EPS && hGurt <= range[1] + EPS;
  const belowMain = hGurt < hMain - EPS;
  const belowSocle = hGurt < hSocle - EPS;

  const note = !belowSocle
    ? 'S. 16: лента должна быть меньше цоколя'
    : !belowMain
      ? 'S. 16: лента должна быть меньше главного карниза'
      : null;

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(hGurt) || floorHeight <= 0 || hGurt <= 0) {
    status = 'violation';
    explanation = 'Высота нижнего этажа и высота ленты должны быть положительными.';
  } else if (!belowSocle || !belowMain) {
    status = 'violation';
    explanation = !belowSocle
      ? `Нарушение (S. 16): поясной карниз (лента) ${formatMeters(hGurt)} м ≥ высоты цоколя ${formatMeters(hSocle)} м.`
      : `Нарушение (S. 16): поясной карниз (лента) ${formatMeters(hGurt)} м ≥ главного карниза ${formatMeters(hMain)} м.`;
  } else if (hGurt > range[1] + EPS) {
    status = 'violation';
    explanation = `Высота ленты h = ${formatMeters(hGurt)} м превышает h_нижн/6 (${formatMeters(range[1])} м, S. 16).`;
  } else if (hGurt < range[0] - EPS) {
    status = allowModestLowerFloor ? 'approx' : 'violation';
    explanation = allowModestLowerFloor
      ? `Высота ленты h = ${formatMeters(hGurt)} м меньше h_нижн/12 (${formatMeters(range[0])} м); по S. 16 при скромном первом этаже допустимы меньшие высоты (порог не задан).`
      : `Высота ленты h = ${formatMeters(hGurt)} м меньше h_нижн/12 (${formatMeters(range[0])} м). Меньшие размеры допустимы лишь при скромном решении 1-го этажа (S. 16).`;
  } else {
    status = 'ok';
    explanation = `Поясной карниз (лента) h = ${formatMeters(hGurt)} м входит в диапазон 1/12…1/6 высоты этажа ([${formatMeters(range[0])}, ${formatMeters(range[1])}] м) и подчинён главному карнизу и цоколю (S. 16).`;
  }

  return {
    h: hGurt,
    range,
    inRange,
    belowMain,
    belowSocle,
    status,
    note,
    explanation,
    formula: 'h ∈ [H_floor/12, H_floor/6]; h < min(h_main, h_socle)',
    page: 'S. 16',
  };
}

export function checkGurt(
  hGurt: number,
  floorHeight: number,
  hSocle: number,
  hMain: number,
  allowModestLowerFloor = true
): GurtCheckResult {
  const res = checkBeltHeight(hGurt, floorHeight, hSocle, hMain, { allowModestLowerFloor });
  return {
    inRange: res.inRange,
    belowMain: res.belowMain,
    belowSocle: res.belowSocle,
    range: res.range,
    status: res.status,
    explanation: res.explanation,
    formula: res.formula,
    page: res.page,
  };
}

export interface ThreePartSocleParts {
  fuss: number;
  rumpf: number;
  deck: number;
}

export interface ThreePartSocleResult {
  fuss: number;
  rumpf: number;
  deck: number;
  total: number;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  note: string;
  isHeuristic: boolean;
  formula: string;
  page: string;
}

export function threePartSocle(
  hSocle: number,
  parts: ThreePartSocleParts = { fuss: 0.25, rumpf: 0.55, deck: 0.2 }
): ThreePartSocleResult {
  const sum = parts.fuss + parts.rumpf + parts.deck;
  const norm = sum > 0 ? sum : 1;
  const fuss = hSocle * (parts.fuss / norm);
  const rumpf = hSocle * (parts.rumpf / norm);
  const deck = hSocle * (parts.deck / norm);
  const status: ValidationStatus =
    hSocle <= 0 ? 'violation' : Math.abs(sum - 1) > 0.02 ? 'approx' : 'ok';

  return {
    fuss,
    rumpf,
    deck,
    total: hSocle,
    status,
    sourceStatus: 'heuristic',
    note: 'S. 10: трёхчастность названа, пропорции не заданы — доли интерпретационные (UX-эвристика)',
    isHeuristic: true,
    formula: 'h_socle = fuss + rumpf + deck (доли — допущение/эвристика)',
    page: 'S. 10',
  };
}

export interface PlateDominantResult {
  dominant: boolean;
  ratio: number;
  threshold: number;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  note: string;
  isHeuristic: boolean;
  formula: string;
  page: string;
}

export function plateDominant(
  hPlate: number,
  hOtherSum: number,
  threshold = 1.2
): PlateDominantResult {
  const ratio = hOtherSum > 0 ? hPlate / hOtherSum : hPlate > 0 ? Infinity : 0;
  const dominant = hPlate >= threshold * hOtherSum - EPS && hPlate > 0;
  let status: ValidationStatus = 'ok';
  if (hPlate <= 0 || hPlate <= hOtherSum + EPS) {
    status = 'violation';
  } else if (!dominant) {
    status = 'approx';
  }

  return {
    dominant,
    ratio,
    threshold,
    status,
    sourceStatus: 'heuristic',
    note: `S. 10: плита должна быть главной по высоте (отношение ${Number.isFinite(ratio) ? formatMeters(ratio, 2) : '∞'}×; порог ${formatMeters(threshold, 2)}× — UX-эвристика).`,
    isHeuristic: true,
    formula: `h_plate > h_other_sum (UX-запас ≥ ${formatMeters(threshold, 2)}×)`,
    page: 'S. 10',
  };
}

export interface DecreasingUpwardResult {
  rustOk: boolean;
  profileOk: boolean;
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function decreasingUpward(
  hSocleRust: number,
  hEgRust: number,
  vSocleProfile: number,
  vEgProfile: number
): DecreasingUpwardResult {
  const rustOk = hEgRust < hSocleRust - EPS;
  const profileOk = vEgProfile < vSocleProfile - EPS;
  const status: ValidationStatus = rustOk && profileOk ? 'ok' : 'violation';

  let explanation = '';
  if (rustOk && profileOk) {
    explanation = `Убывание силы кверху соблюдено (S. 10): руст 1-го этажа (${formatMeters(hEgRust)} м) < цокольного (${formatMeters(hSocleRust)} м), вынос профиля (${formatMeters(vEgProfile)} м) < цокольного (${formatMeters(vSocleProfile)} м).`;
  } else {
    const issues: string[] = [];
    if (!rustOk) issues.push(`высота руста 1-го этажа (${formatMeters(hEgRust)} м) ≥ цокольного (${formatMeters(hSocleRust)} м)`);
    if (!profileOk) issues.push(`вынос профиля 1-го этажа (${formatMeters(vEgProfile)} м) ≥ цокольного (${formatMeters(vSocleProfile)} м)`);
    explanation = `Нарушение (S. 10): грубые формы цоколя не должны повторяться выше (${issues.join('; ')}).`;
  }

  return {
    rustOk,
    profileOk,
    status,
    explanation,
    formula: 'h_rust(EG) < h_rust(Sockel); v_profile(EG) < v_profile(Sockel)',
    page: 'S. 10',
  };
}

export interface AbkroepfungResult {
  status: 'ok' | 'approx';
  note: string;
  formula: string;
  page: string;
}

export function abkroepfungPreference(
  hasKellerfenster: boolean,
  hasLisenen: boolean
): AbkroepfungResult {
  if (hasKellerfenster || hasLisenen) {
    return {
      status: 'approx',
      note: 'S. 10/12: раскреповка допустима, но без неё лучше',
      formula: 'hasKellerfenster ∨ hasLisenen ⇒ раскреповка допустима (approx)',
      page: 'S. 10, 12',
    };
  }
  return {
    status: 'ok',
    note: 'S. 10: сплошной прогон без раскреповок',
    formula: '¬hasKellerfenster ∧ ¬hasLisenen ⇒ сплошной прогон (ok)',
    page: 'S. 10',
  };
}

export interface RusticationRowsResult {
  n: number;
  rowHeight: number;
  oddPreferred: boolean;
  rowRange: [number, number];
  inRowRange: boolean;
  status: ValidationStatus;
  note: string | null;
  explanation: string;
  formula: string;
  page: string;
}

export function rusticationRows(
  socleHeightVal: number,
  rowHeight = 0.35
): RusticationRowsResult {
  const safeTarget = rowHeight > 0 ? rowHeight : 0.35;
  const n = Math.max(1, Math.round(socleHeightVal / safeTarget));
  const actualRowHeight = socleHeightVal / n;
  const oddPreferred = n % 2 === 1;
  const rowRange: [number, number] = [0.3, 0.4];
  const inRowRange =
    actualRowHeight >= rowRange[0] - EPS && actualRowHeight <= rowRange[1] + EPS;
  const note = !oddPreferred ? 'S. 17: нечётное число рядов предпочтительнее' : null;

  let status: ValidationStatus = 'ok';
  if (!inRowRange) {
    status = 'violation';
  } else if (!oddPreferred) {
    status = 'approx';
  }

  const explanation = !inRowRange
    ? `Расчётная высота ряда руста ${formatMeters(actualRowHeight)} м (при n = ${n}) выходит за типовой диапазон 0.300–0.400 м.`
    : oddPreferred
      ? `При высоте цоколя ${formatMeters(socleHeightVal)} м укладывается n = ${n} (нечётное число) рядов по ${formatMeters(actualRowHeight)} м (S. 17).`
      : `При высоте цоколя ${formatMeters(socleHeightVal)} м получается чётное число рядов n = ${n} по ${formatMeters(actualRowHeight)} м — допустимо при фиксированном камне, но нечётное предпочтительнее (S. 17).`;

  return {
    n,
    rowHeight: actualRowHeight,
    oddPreferred,
    rowRange,
    inRowRange,
    status,
    note,
    explanation,
    formula: 'n = round(h_socle / rowHeight); rowHeight ∈ [0.30, 0.40] м; нечётное n лучше',
    page: 'S. 17',
  };
}

export interface FullFloorAsSocleResult {
  applicable: boolean;
  status: ValidationStatus;
  note: string;
  formula: string;
  page: string;
}

export function fullFloorAsSocle(
  firstFloorFullHeight: number,
  requiredSocleHeight: number
): FullFloorAsSocleResult {
  const applicable = firstFloorFullHeight >= requiredSocleHeight - EPS && firstFloorFullHeight > 0;
  return {
    applicable,
    status: applicable ? 'ok' : 'violation',
    note: applicable
      ? `S. 16: при невозможности нужной высоты цоколя включить весь 1-й этаж (${formatMeters(firstFloorFullHeight)} м ≥ требуемых ${formatMeters(requiredSocleHeight)} м).`
      : `Высоты 1-го этажа от земли (${formatMeters(firstFloorFullHeight)} м) недостаточно для требуемого цоколя (${formatMeters(requiredSocleHeight)} м).`,
    formula: 'H_groundToFloor1 + H_floor1 ≥ h_socle_required',
    page: 'S. 16, 22',
  };
}

// ==================================================
// 3.11. Варианты этажности (1-эт., 2-эт., многоэт.: 3 / 4–5 / общий)
// ==================================================

export type BuildingVariant = 'one-story' | 'two-story' | 'multi-story';
export type MultiSub = 'three' | 'four-five' | 'general';
export type FiveStoryScheme = 'standard' | 'rich_1_2_unified';
export type ThreeStoryGurtMode = 'both_gurt' | 'third_sohlbank' | 'unified_upper';
export type CorniceVariantMode = 'full_entablature' | 'crowning_only';
export type EntrancePosition = 'center' | 'left' | 'right' | 'none';
export type EntrancePlacement = 'facade_center' | 'axis';

export interface VariantRules {
  socle: { min: number; max: number; optimum: number };
  mainCornice: { min: number; max: number } | 'extrapolated';
  crowning: { min: number; max: number } | 'extrapolated';
  gurt: { min: number; max: number } | null;
  facadeRect: 'lying' | 'standing' | 'either';
  articulation: 'horizontal' | 'vertical' | 'mixed';
  axisRatio: { min: number; max: number };
  axesPreferred: 'odd' | 'odd-or-even';
  columnsOptional: boolean;
  mainTierFloor?: number;
  upperFloorSmallest?: boolean;
}

export interface VariantPresetMetadata {
  variant: BuildingVariant;
  multiSub: MultiSub;
  id: string;
  labelRu: string;
  shortLabelRu: string;
  pages: string;
  defaultFloors: number;
  rules: VariantRules;
  notesRu: string[];
}

export interface TextGapItem {
  id: string;
  title: string;
  status: string;
  detail: string;
  appliesTo: BuildingVariant[];
}

export const VARIANT_TEXT_GAPS: TextGapItem[] = [
  {
    id: 'gap_one_story_cornice',
    title: 'Числовые пределы главного карниза и венчающей части для 1-этажного дома',
    status: 'Нет в тексте (экстраполяция ≥ норм 2-эт.)',
    detail:
      'На S. 16 заданы числа только для 2-этажного (1/12–1/8; венец 1/16–1/15) и многоэтажного (1/15–1/12; венец 1/20–1/16) дома. Для 1-этажного применяется экстраполяция не ниже норм 2-этажного.',
    appliesTo: ['one-story'],
  },
  {
    id: 'gap_wide_bay_threshold',
    title: 'Пороговое значение «широкого шага осей» для 1–2-этажного дома',
    status: 'Качественно («широкий», A/H → 1)',
    detail:
      'На S. 5 указано, что даже простой 1–2-этажный дом выигрывает от широкого шага осей, но точная граница не названа; по контексту верхний предел A/H приближается к 1.0.',
    appliesTo: ['one-story', 'two-story'],
  },
  {
    id: 'gap_main_tier_floor2',
    title: 'Числовые пороги «главного яруса» (2-й этаж многоэтажного дома)',
    status: 'Качественное правило (S. 22)',
    detail:
      'Сказано, что 2-й этаж «должен заявлять о себе как главный ярус» даже при равной высоте комнат, без числового коэффициента превышения.',
    appliesTo: ['multi-story'],
  },
  {
    id: 'gap_five_story_schemes',
    title: 'Числовые доли высот этажей в 5-этажных схемах (S. 23)',
    status: 'Описательные схемы (S. 23)',
    detail:
      'Стандартная схема (1 = цоколь, 2–4 = ствол, 5+карниз = венчание) и схема богатого особняка (1+2 объединены, 3–5 = ствол, скромный карниз с усиленным выносом) даны описательно без фиксированных долей.',
    appliesTo: ['multi-story'],
  },
  {
    id: 'gap_multi_vs_three_boundary',
    title: 'Формальная граница «многоэтажный» (mehrgeschossig) vs «3-этажный»',
    status: 'Не формализована в тексте (S. 16, 22)',
    detail:
      'На S. 16 текст использует обобщение «несколько этажей», а на S. 22–23 отдельно разбирает 3-этажные и 4–5-этажные дома.',
    appliesTo: ['multi-story'],
  },
  {
    id: 'gap_one_story_socle',
    title: 'Специальные нормы цоколя для 1-этажного дома',
    status: 'Общие 1/10–1/6 (спец. правил нет)',
    detail:
      'Специальных числовых указаний именно для 1-этажного дома нет; в расчёте используются общие нормы 1/10…1/6 (оптимум 1/6, S. 16).',
    appliesTo: ['one-story'],
  },
];

export const VARIANT_PRESETS: Record<string, VariantPresetMetadata> = {
  'one-story': {
    variant: 'one-story',
    multiSub: 'general',
    id: 'one-story',
    labelRu: '1-этажный дом (Ebenerdiges Wohnhaus)',
    shortLabelRu: '1 этаж',
    pages: 'S. 5, 14, 16, 21',
    defaultFloors: 1,
    rules: {
      socle: { min: 0.1, max: 1 / 6, optimum: 1 / 6 },
      mainCornice: 'extrapolated',
      crowning: 'extrapolated',
      gurt: null,
      facadeRect: 'lying',
      articulation: 'horizontal',
      axisRatio: { min: 2 / 3, max: 1.0 },
      axesPreferred: 'odd',
      columnsOptional: true,
    },
    notesRu: [
      'Скромный масштаб (S. 21): колонны и пилястры необязательны.',
      'Преобладает горизонтальное членение и лежачий прямоугольник фасада; при нечётных осях (идеал — 5) вход по центру.',
    ],
  },
  'two-story': {
    variant: 'two-story',
    multiSub: 'general',
    id: 'two-story',
    labelRu: '2-этажный дом (Zweigeschossiges Wohnhaus)',
    shortLabelRu: '2 этажа',
    pages: 'S. 5, 12, 14, 16, 21',
    defaultFloors: 2,
    rules: {
      socle: { min: 0.1, max: 1 / 6, optimum: 1 / 6 },
      mainCornice: { min: 1 / 12, max: 1 / 8 },
      crowning: { min: 1 / 16, max: 1 / 15 },
      gurt: { min: 1 / 12, max: 1 / 6 },
      facadeRect: 'lying',
      articulation: 'horizontal',
      axisRatio: { min: 2 / 3, max: 1.0 },
      axesPreferred: 'odd',
      columnsOptional: false,
    },
    notesRu: [
      'Типовой пример на S. 16 — 2 этажа, 5 осей; главный карниз 1/12…1/8 (либо одна венчающая часть 1/16…1/15).',
      'Поясной карниз (Gurtgesims) 1/12…1/6 высоты этажа и обязательно меньше главного карниза и цоколя.',
    ],
  },
  'multi-story:three': {
    variant: 'multi-story',
    multiSub: 'three',
    id: 'multi-story:three',
    labelRu: 'Многоэтажный: 3 этажа (идеал типа)',
    shortLabelRu: '3 этажа',
    pages: 'S. 6, 15–16, 22',
    defaultFloors: 3,
    rules: {
      socle: { min: 0.1, max: 1 / 6, optimum: 1 / 6 },
      mainCornice: { min: 1 / 15, max: 1 / 12 },
      crowning: { min: 1 / 20, max: 1 / 16 },
      gurt: { min: 1 / 12, max: 1 / 6 },
      facadeRect: 'standing',
      articulation: 'vertical',
      axisRatio: { min: 2 / 3, max: 7 / 8 },
      axesPreferred: 'odd',
      columnsOptional: false,
      mainTierFloor: 2,
      upperFloorSmallest: true,
    },
    notesRu: [
      'Трёхэтажный городской дом назван идеалом всего типа с 3 ясно читаемыми рядами окон (S. 22).',
      '2-й этаж — главный ярус; 3-й этаж наименьший; в доходных домах цоколь ниже либо весь 1-й этаж трактуется как цоколь.',
    ],
  },
  'multi-story:four-five': {
    variant: 'multi-story',
    multiSub: 'four-five',
    id: 'multi-story:four-five',
    labelRu: 'Многоэтажный: 4–5 этажей (S. 23)',
    shortLabelRu: '4–5 этажей',
    pages: 'S. 6, 15–16, 22–23',
    defaultFloors: 5,
    rules: {
      socle: { min: 0.1, max: 1 / 6, optimum: 1 / 6 },
      mainCornice: { min: 1 / 15, max: 1 / 12 },
      crowning: { min: 1 / 20, max: 1 / 16 },
      gurt: { min: 1 / 12, max: 1 / 6 },
      facadeRect: 'standing',
      articulation: 'vertical',
      axisRatio: { min: 2 / 3, max: 7 / 8 },
      axesPreferred: 'odd',
      columnsOptional: false,
      mainTierFloor: 2,
      upperFloorSmallest: true,
    },
    notesRu: [
      'Стандартный 5-эт. дом (S. 23): 1-й эт. = цоколь, 2–4 эт. = ствол, 5-й эт. с главным карнизом = венчание.',
      'Богатый 5-эт. особняк (1+2 объединены): 1+2 эт. = общий нижний ярус, 3–5 эт. = ствол, невысокий главный карниз с усиленным выносом.',
    ],
  },
  'multi-story:general': {
    variant: 'multi-story',
    multiSub: 'general',
    id: 'multi-story:general',
    labelRu: 'Многоэтажный: общий случай (mehrgeschossig)',
    shortLabelRu: 'Многоэт. (общий)',
    pages: 'S. 5–6, 15–16, 22',
    defaultFloors: 4,
    rules: {
      socle: { min: 0.1, max: 1 / 6, optimum: 1 / 6 },
      mainCornice: { min: 1 / 15, max: 1 / 12 },
      crowning: { min: 1 / 20, max: 1 / 16 },
      gurt: { min: 1 / 12, max: 1 / 6 },
      facadeRect: 'standing',
      articulation: 'vertical',
      axisRatio: { min: 2 / 3, max: 7 / 8 },
      axesPreferred: 'odd',
      columnsOptional: false,
      mainTierFloor: 2,
      upperFloorSmallest: true,
    },
    notesRu: [
      'Обобщённый многоэтажный городской дом (S. 16): главный карниз 1/15…1/12 (или венец 1/20…1/16), шаг осей 2:3…7:8 от H_max.',
      'Встроенный фасад тяготеет к стоячему прямоугольнику и вертикальному членению.',
    ],
  },
};

export function getVariantPreset(
  variant: BuildingVariant,
  multiSub: MultiSub = 'three'
): VariantPresetMetadata {
  if (variant === 'one-story') return VARIANT_PRESETS['one-story'];
  if (variant === 'two-story') return VARIANT_PRESETS['two-story'];
  return VARIANT_PRESETS[`multi-story:${multiSub}`] ?? VARIANT_PRESETS['multi-story:general'];
}

// P0-1: единая таблица допустимого диапазона A/H_max с учётом типологии и этажности
export function allowedAxisRatio(
  buildingType: BuildingTypeId | undefined,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three'
): { range: [number, number]; sourceStatus: SourceStatus; isTypologyOverride: boolean; note: string } {
  const preset = getVariantPreset(variant, multiSub);
  if (!buildingType) {
    return {
      range: [preset.rules.axisRatio.min, preset.rules.axisRatio.max],
      sourceStatus: variant === 'one-story' || variant === 'two-story' ? 'heuristic' : 'explicit-verified',
      isTypologyOverride: false,
      note: 'По пресету этажности',
    };
  }
  switch (buildingType) {
    case 'simple_house':
      return {
        range: [2 / 3, 4 / 5],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: false,
        note: 'Простой жилой дом (S. 5): 2:3…4:5',
      };
    case 'urban_house':
    case 'miethaus':
      return {
        range: [2 / 3, 7 / 8],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: false,
        note: 'Городской / доходный дом (S. 5–6): 2:3…7:8',
      };
    case 'villa':
      return {
        range: [0.6, 1.0],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: variant === 'multi-story',
        note: 'Вилла / загородный дом (S. 3, 5): 0.60…1.00',
      };
    case 'monumental':
      return {
        range: [4 / 5, 1.0],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: variant === 'multi-story',
        note: 'Монументальное здание (S. 4–5): 4:5…1:1',
      };
    case 'palace':
      return {
        range: [5 / 6, 1.0],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: variant === 'multi-story',
        note: 'Дворец (S. 5): 5:6…1:1',
      };
    case 'rich_columnar':
      return {
        range: [0.45, 0.6],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: true,
        note: 'Богатая колонно-пилястровая архитектура (S. 5): A:H → 1:2 (0.45…0.60)',
      };
    default:
      return {
        range: [preset.rules.axisRatio.min, preset.rules.axisRatio.max],
        sourceStatus: 'explicit-verified',
        isTypologyOverride: false,
        note: 'По пресету этажности',
      };
  }
}

export interface VariantMainCorniceResult extends MainCorniceCheckResult {
  isExtrapolated: boolean;
  corniceMode: CorniceVariantMode;
}

export function checkMainCorniceWithVariant(
  hSocle: number,
  hMain: number,
  totalHeight: number,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three',
  corniceMode: CorniceVariantMode = 'full_entablature'
): VariantMainCorniceResult {
  const preset = getVariantPreset(variant, multiSub);
  const rawSpec =
    corniceMode === 'crowning_only' ? preset.rules.crowning : preset.rules.mainCornice;
  const isExtrapolated = rawSpec === 'extrapolated';

  const shareRange: [number, number] = isExtrapolated
    ? corniceMode === 'crowning_only'
      ? [1 / 16, 1 / 15]
      : [1 / 12, 1 / 8]
    : [rawSpec.min, rawSpec.max];

  const range: [number, number] = [totalHeight * shareRange[0], totalHeight * shareRange[1]];
  const inRange = isExtrapolated
    ? hMain >= range[0] - EPS
    : hMain >= range[0] - EPS && hMain <= range[1] + EPS;
  const belowSocle = hMain < hSocle - EPS;
  const ok = inRange && belowSocle;
  const note = !belowSocle
    ? 'S. 16: главный карниз должен быть меньше цоколя'
    : isExtrapolated
      ? 'S. 16: для 1-этажного дома числа не заданы — применена экстраполяция от норм 2-этажного'
      : null;

  let status: ValidationStatus = 'ok';
  let explanation = '';
  const modeLabel =
    corniceMode === 'crowning_only' ? 'венчающая часть (Kranz)' : 'главный карниз с фризом/архитравом';

  if (!belowSocle) {
    status = 'violation';
    explanation = `Нарушение (S. 16): ${modeLabel} h_main = ${formatMeters(hMain)} м должен быть строго меньше цоколя h_socle = ${formatMeters(hSocle)} м.`;
  } else if (isExtrapolated) {
    status = inRange ? 'approx' : 'violation';
    explanation = inRange
      ? `Для 1-этажного дома в тексте S. 16 нет числового предела: h_main = ${formatMeters(hMain)} м условно согласован по экстраполяции ≥ норм 2-этажного (${formatMeters(range[0])}…${formatMeters(range[1])} м) и < цоколя.`
      : `Для 1-этажного дома h_main = ${formatMeters(hMain)} м ниже экстраполированного минимума 2-этажного (${formatMeters(range[0])} м).`;
  } else if (inRange) {
    status = 'ok';
    explanation = `${corniceMode === 'crowning_only' ? 'Венчающая часть' : 'Главный карниз'} h_main = ${formatMeters(hMain)} м входит в норму варианта «${preset.shortLabelRu}» ([${formatMeters(range[0])}, ${formatMeters(range[1])}] м) и меньше цоколя (${formatMeters(hSocle)} м).`;
  } else {
    status = 'violation';
    explanation = `${corniceMode === 'crowning_only' ? 'Венчающая часть' : 'Главный карниз'} h_main = ${formatMeters(hMain)} м выходит за диапазон [${formatMeters(range[0])}, ${formatMeters(range[1])}] м для варианта «${preset.shortLabelRu}» (S. 16).`;
  }

  return {
    ok,
    range,
    inRange,
    belowSocle,
    status,
    note,
    isExtrapolated,
    corniceMode,
    explanation,
    formula: isExtrapolated
      ? `1-эт. (экстраполяция): h_main ≥ ${formatMeters(shareRange[0], 4)}·H_total; h_main < h_socle`
      : `${preset.shortLabelRu} (${corniceMode === 'crowning_only' ? 'Kranz' : 'полный'}): h_main ∈ [${formatMeters(shareRange[0], 4)}, ${formatMeters(shareRange[1], 4)}]·H_total; < h_socle`,
    page: 'S. 16',
  };
}

export interface VariantGurtCheckResult extends GurtCheckResult {
  notRequired: boolean;
}

export function checkGurtWithVariant(
  hGurt: number,
  floorHeight: number,
  hSocle: number,
  hMain: number,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three',
  allowModestLowerFloor = true
): VariantGurtCheckResult {
  const preset = getVariantPreset(variant, multiSub);
  if (preset.rules.gurt === null) {
    return {
      inRange: true,
      belowMain: true,
      belowSocle: true,
      range: [0, 0],
      notRequired: true,
      status: 'ok',
      explanation: 'Для 1-этажного дома междуэтажный поясной карниз (Gurtgesims) отсутствует (null).',
      formula: '1-эт.: gurt = null (не требуется)',
      page: 'S. 16, 21',
    };
  }
  const base = checkGurt(hGurt, floorHeight, hSocle, hMain, allowModestLowerFloor);
  return {
    ...base,
    notRequired: false,
  };
}

export interface VariantAxisCheckResult {
  ratio: number;
  range: [number, number];
  isWideBayHeuristic: boolean;
  sourceStatus: SourceStatus;
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function checkVariantAxisRatio(
  A: number,
  H_max: number,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three',
  tolerance = 0.03,
  buildingType?: BuildingTypeId
): VariantAxisCheckResult {
  const preset = getVariantPreset(variant, multiSub);
  const ratio = H_max > 0 ? A / H_max : NaN;
  const resolved = allowedAxisRatio(buildingType, variant, multiSub);
  const [min, max] = resolved.range;
  const isWideBayHeuristic =
    !buildingType && (variant === 'one-story' || variant === 'two-story');

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(ratio) || ratio <= 0) {
    status = 'violation';
    explanation = 'Некорректные значения A или H_max.';
  } else if (ratio >= min - EPS && ratio <= max + EPS) {
    // Проверка расхождения между пресетом этажности и типологией: макс. approx, не violation
    const variantConflict =
      buildingType &&
      buildingType !== 'rich_columnar' &&
      buildingType !== 'palace' &&
      buildingType !== 'monumental' &&
      buildingType !== 'villa' &&
      (ratio < preset.rules.axisRatio.min - EPS || ratio > preset.rules.axisRatio.max + EPS);

    status = variantConflict ? 'approx' : 'ok';
    explanation = variantConflict
      ? `Отношение A:H_max = ${formatMeters(ratio, 3)} соответствует типологии (${resolved.note}), но отличается от общего пресета этажности «${preset.shortLabelRu}».`
      : isWideBayHeuristic
        ? `Отношение A:H_max = ${formatMeters(ratio, 3)} входит в предел ${formatMeters(min, 2)}…${formatMeters(max, 2)} для 1–2-этажного дома (S. 5: широкий шаг допускается к 1:1, точный порог в тексте не задан).`
        : `Отношение A:H_max = ${formatMeters(ratio, 3)} входит в предел [${formatMeters(min, 2)}, ${formatMeters(max, 3)}] (${resolved.note}).`;
  } else if (
    ratio >= min * (1 - tolerance) - EPS &&
    ratio <= max * (1 + tolerance) + EPS
  ) {
    status = 'approx';
    explanation = `Отношение A:H_max = ${formatMeters(ratio, 3)} близко к границам [${formatMeters(min, 2)}, ${formatMeters(max, 3)}] в пределах допуска ${formatPercent(tolerance, 0)}.`;
  } else {
    status = 'violation';
    explanation = `Отношение A:H_max = ${formatMeters(ratio, 3)} выходит за допустимый предел [${formatMeters(min, 2)}, ${formatMeters(max, 3)}] (${resolved.note}).`;
  }

  return {
    ratio,
    range: [min, max],
    isWideBayHeuristic,
    sourceStatus: resolved.sourceStatus,
    status,
    explanation,
    formula: `A / H_max ∈ [${formatMeters(min, 2)}, ${formatMeters(max, 3)}]`,
    page: isWideBayHeuristic ? 'S. 5' : 'S. 5–6',
  };
}

export interface FacadeRectCheckResult {
  width: number;
  height: number;
  aspect: number;
  actualOrientation: 'lying' | 'standing' | 'square';
  expectedOrientation: 'lying' | 'standing' | 'either';
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function checkFacadeRectangle(
  facadeWidth: number,
  totalHeight: number,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three'
): FacadeRectCheckResult {
  const preset = getVariantPreset(variant, multiSub);
  const expectedOrientation = preset.rules.facadeRect;
  const aspect = totalHeight > 0 ? facadeWidth / totalHeight : NaN;
  const diffFromSquare = Number.isFinite(aspect) ? Math.abs(aspect - 1) : NaN;
  // §5.3: смягчение порога квадрата — <= 0.02 violation, <= 0.05 approx
  const strictSquare = Number.isFinite(diffFromSquare) && diffFromSquare <= 0.02;
  const nearSquareWarn = Number.isFinite(diffFromSquare) && diffFromSquare > 0.02 && diffFromSquare <= 0.05;
  const actualOrientation: 'lying' | 'standing' | 'square' = strictSquare
    ? 'square'
    : aspect > 1
      ? 'lying'
      : 'standing';

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(aspect) || facadeWidth <= 0 || totalHeight <= 0) {
    status = 'violation';
    explanation = 'Ширина фасада и общая высота должны быть положительными.';
  } else if (strictSquare) {
    status = 'violation';
    explanation = `Фасад квадратный (W=${formatMeters(facadeWidth, 2)} м ≈ H_total=${formatMeters(totalHeight, 2)} м, W/H=${formatMeters(aspect, 3)}): по S. 14 одинаковых главных размеров длины и высоты следует избегать («квадрат — самая безжизненная форма»; порог ±2 % — UX-эвристика).`;
  } else if (nearSquareWarn) {
    status = 'approx';
    explanation = `Предупреждение: пропорция фасада близка к квадрату (W/H=${formatMeters(aspect, 3)}, отклонение ≤ 5 % — UX-порог). По S. 14 желательно выраженнее отличить длину от высоты.`;
  } else if (expectedOrientation === 'either' || actualOrientation === expectedOrientation) {
    status = 'ok';
    explanation =
      actualOrientation === 'lying'
        ? `Лежачий прямоугольник (W=${formatMeters(facadeWidth, 2)} м > H_total=${formatMeters(totalHeight, 2)} м, W:H=${formatMeters(aspect, 2)}) соответствует невысокому 1–2-этажному дому (S. 14).`
        : `Стоячий прямоугольник (H_total=${formatMeters(totalHeight, 2)} м > W=${formatMeters(facadeWidth, 2)} м, W:H=${formatMeters(aspect, 2)}) соответствует многоэтажному городскому дому (S. 14–15).`;
  } else {
    status = 'approx';
    explanation =
      expectedOrientation === 'lying'
        ? `Ожидался лежачий прямоугольник (W > H_total), фактически фасад вытянут вверх (W=${formatMeters(facadeWidth, 2)} м < H_total=${formatMeters(totalHeight, 2)} м) — характерно лишь при малом числе осей (S. 14–15).`
        : `Ожидался стоячий прямоугольник (H_total > W), фактически фасад шире высоты (W=${formatMeters(facadeWidth, 2)} м > H_total=${formatMeters(totalHeight, 2)} м) — характерно для протяжённой застройки с многими осями (S. 15, 23).`;
  }

  return {
    width: facadeWidth,
    height: totalHeight,
    aspect,
    actualOrientation,
    expectedOrientation,
    status,
    sourceStatus: strictSquare || nearSquareWarn ? 'heuristic' : 'explicit-verified',
    explanation,
    formula:
      expectedOrientation === 'lying'
        ? 'W > H_total (лежачий прямоугольник, |W/H − 1| > 0.02)'
        : expectedOrientation === 'standing'
          ? 'H_total > W (стоячий прямоугольник, |W/H − 1| > 0.02)'
          : '|W/H − 1| > 0.02',
    page: 'S. 14–15',
  };
}

// N7: Подсказка по группировке осей (S. 15–16)
export function getAxesGroupingHint(axesCount: number): string {
  const n = Math.max(1, Math.round(axesCount));
  if (n === 4) {
    return 'Для 4 осей по S. 15 рекомендуется сдвинуть 2 средних окна ближе в группу (3-частный ритм).';
  }
  if (n === 6) {
    return 'Для 6 осей по S. 15 рекомендуется группировка попарно (2+2+2) в три группы.';
  }
  if (n === 8) {
    return 'Для 8 осей по S. 16 лучше объединить 3 центральных окна в сдвоенные группы.';
  }
  if (n >= 9) {
    return `При ${n} осях (длинный фасад, S. 16) рекомендуется выделить среднюю часть или боковые крылья ризалитами.`;
  }
  return 'Рекомендуется нечётное число осей (3, 5, 7) либо сдвоенная группировка проёмов.';
}

export interface AxesCountCheckResult {
  axesCount: number;
  isOdd: boolean;
  axesPreferred: 'odd' | 'odd-or-even';
  entrancePosition: EntrancePosition;
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function checkAxesCount(
  axesCount: number,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three',
  isEmbeddedInRow = false,
  entrancePosition?: EntrancePosition
): AxesCountCheckResult {
  const preset = getVariantPreset(variant, multiSub);
  const n = Math.max(1, Math.round(axesCount));
  const isOdd = n % 2 === 1;
  const resolvedEntrance: EntrancePosition =
    entrancePosition ?? (isEmbeddedInRow && variant === 'multi-story' ? 'right' : 'center');
  const effectivePref: 'odd' | 'odd-or-even' =
    isEmbeddedInRow && variant === 'multi-story' ? 'odd-or-even' : preset.rules.axesPreferred;

  let status: ValidationStatus = 'ok';
  let explanation = '';
  const longHint = n >= 9 ? ` ${getAxesGroupingHint(n)}` : '';

  if (isOdd) {
    if (resolvedEntrance === 'left' || resolvedEntrance === 'right') {
      status = 'approx';
      explanation = `При нечётном числе осей (${n}) вход смещён вбок (${resolvedEntrance === 'left' ? 'слева' : 'справа'}) — для симметричного нечётного фасада естественен центральный вход (S. 14).${longHint}`;
    } else {
      status = 'ok';
      explanation =
        (n === 5
          ? '5 оконных осей — классический идеал симметричного фасада с центральной входной осью (S. 14, 16).'
          : `Нечётное число осей (${n}) обеспечивает ясную центральную ось симметрии (S. 14).`) + longHint;
    }
  } else if (resolvedEntrance === 'center') {
    // §5.5: при центральном входе чётное число осей всегда даёт approx (нет центральной оконной оси!)
    status = 'approx';
    explanation = `Чётное число осей (${n}) конфликтует с центральным входом (S. 14): на оси симметрии оказывается простенок вместо проёма. ${getAxesGroupingHint(n)}`;
  } else if (
    effectivePref === 'odd-or-even' &&
    (resolvedEntrance === 'left' || resolvedEntrance === 'right' || resolvedEntrance === 'none')
  ) {
    status = 'ok';
    explanation = `Чётное число осей (${n}) допустимо во встроенном многоэтажном доме при боковом входе/проезде (S. 14).${longHint}`;
  } else {
    status = 'approx';
    explanation = `Для варианта «${preset.shortLabelRu}» предпочтительно нечётное число осей. ${getAxesGroupingHint(n)}`;
  }

  return {
    axesCount: n,
    isOdd,
    axesPreferred: effectivePref,
    entrancePosition: resolvedEntrance,
    status,
    explanation,
    formula:
      effectivePref === 'odd'
        ? 'axes % 2 === 1 (при центральном входе нечётное обязательно)'
        : 'встроенный дом + боковой вход ⇒ чётное допустимо (S. 14)',
    page: 'S. 14–16',
  };
}

export interface EntranceGeometryResult {
  hasDoor: boolean;
  placement: EntrancePlacement;
  doorCenterX: number;
  doorAxisIndex: number | null;
  doorBottomM: number;
  doorTopM: number;
  doorHeightM: number;
  doorWidthM: number;
}

export function resolveEntrancePositionFromSettings(
  hasEntrance: boolean,
  placement: EntrancePlacement,
  axisIndex: number,
  axesCount: number
): EntrancePosition {
  if (!hasEntrance) return 'none';
  const safeAxes = Math.max(1, Math.round(axesCount));
  if (placement === 'facade_center') return 'center';
  const clamped = Math.min(safeAxes - 1, Math.max(0, Math.round(axisIndex)));
  if (safeAxes % 2 === 1 && clamped === Math.floor(safeAxes / 2)) {
    return 'center';
  }
  return clamped < safeAxes / 2 ? 'left' : 'right';
}

export function resolveEntranceGeometry(
  params: FacadeParameters,
  totalWidthM: number,
  axesM: number[]
): EntranceGeometryResult {
  const safeAxes = axesM.length;
  const doorBottomM = Math.max(0, params.entranceBottomM ?? 0);
  const doorHeightM = Math.max(1.2, params.entranceHeightM ?? 2.4);
  const doorTopM = doorBottomM + doorHeightM;
  const doorWidthM = Math.max(0.6, params.entranceWidthM ?? Math.max(0.95, params.w * 1.05));
  const placement: EntrancePlacement = params.entrancePlacement ?? 'facade_center';

  if (params.hasEntrance === false || params.entrancePosition === 'none') {
    return {
      hasDoor: false,
      placement,
      doorCenterX: totalWidthM / 2,
      doorAxisIndex: null,
      doorBottomM,
      doorTopM,
      doorHeightM,
      doorWidthM,
    };
  }

  if (placement === 'facade_center') {
    if (safeAxes % 2 === 1 && safeAxes > 0) {
      const centerIdx = Math.floor(safeAxes / 2);
      return {
        hasDoor: true,
        placement,
        doorCenterX: axesM[centerIdx] ?? totalWidthM / 2,
        doorAxisIndex: centerIdx,
        doorBottomM,
        doorTopM,
        doorHeightM,
        doorWidthM,
      };
    }
    return {
      hasDoor: true,
      placement,
      doorCenterX: totalWidthM / 2,
      doorAxisIndex: null,
      doorBottomM,
      doorTopM,
      doorHeightM,
      doorWidthM,
    };
  }

  const clampedIdx =
    safeAxes > 0 ? Math.min(safeAxes - 1, Math.max(0, Math.round(params.entranceAxisIndex ?? 0))) : 0;
  return {
    hasDoor: true,
    placement: 'axis',
    doorCenterX: axesM[clampedIdx] ?? totalWidthM / 2,
    doorAxisIndex: safeAxes > 0 ? clampedIdx : null,
    doorBottomM,
    doorTopM,
    doorHeightM,
    doorWidthM,
  };
}

// ==================================================
// 3.12. Межэтажные карнизы / ленты (Gurtgesims, S. 10–11, 16–17, 22)
// ==================================================

export type BeltMode = 'binding' | 'crowning';
export type BeltClassType = 1 | 2 | 3 | 4;
export type BeltEffect = 'neutral' | 'heavy' | 'light';
export type BeltConsoleMode = 'none' | 'lying_lower' | 'standing_frieze';
export type ThreeStoryBeltSchemeNumber = 1 | 2 | 3;

export interface BeltInput {
  hLowerFloor: number;
  hUpperFloor: number;
  H_socle: number;
  H_mainCornice: number;
  mode: BeltMode;
  type: BeltClassType;
  upperToLower?: number;
  hasColumnsBelow?: boolean;
  hasRustication?: boolean;
}

export interface BeltClassMeta {
  type: BeltClassType;
  titleRu: string;
  titleDe: string;
  parts: string[];
  descriptionRu: string;
  recommendedMode: BeltMode;
  crownShareOfBelt: number;
  page: string;
}

export const BELT_CLASSES: BeltClassMeta[] = [
  {
    type: 1,
    titleRu: 'Класс 1: Одна венчающая часть (Kranz)',
    titleDe: 'Gesimse mit einem Kranze allein',
    parts: ['Верхние обломы (h_верх)', 'Нижние обломы (h_низ)'],
    descriptionRu:
      'Простейший поясной карниз из одной венчающей части; подходит при небольшой высоте и скромной трактовке этажей.',
    recommendedMode: 'binding',
    crownShareOfBelt: 1.0,
    page: 'S. 11',
  },
  {
    type: 2,
    titleRu: 'Класс 2: Архитравные полосы под венцом',
    titleDe: 'Mit einer oder mehreren Architravplatten unter dem Kranze',
    parts: ['Венец (Kranz)', 'Архитравные полосы (фасции)'],
    descriptionRu:
      'Ступенчато нависающие одна или несколько архитравных полос под венчающей частью; смягчает переход от стены без потери тектоники.',
    recommendedMode: 'binding',
    crownShareOfBelt: 0.65,
    page: 'S. 10–11',
  },
  {
    type: 3,
    titleRu: 'Класс 3: Шейка и поясок под венцом',
    titleDe: 'Mit Hals und Halsband unter dem Kranze',
    parts: ['Венец (Kranz)', 'Шейка (Hals)', 'Поясок / астрагал (Halsband)'],
    descriptionRu:
      'Введение шейки, пояска и связующей кривой придаёт поясной ленте характерную лёгкость и зримое скрепление этажей (S. 10–11).',
    recommendedMode: 'binding',
    crownShareOfBelt: 0.6,
    page: 'S. 10–11',
  },
  {
    type: 4,
    titleRu: 'Класс 4: Полный антаблемент (архитрав, фриз, венец)',
    titleDe: 'Mit Architrav, Fries und Kranz',
    parts: ['Венец (Kranz)', 'Фриз (Fries)', 'Архитрав (Architrav)'],
    descriptionRu:
      'Развитый пояс-антаблемент для венчания значительного нижнего яруса или этажа с колоннадой/пилястрами (S. 10–11).',
    recommendedMode: 'crowning',
    crownShareOfBelt: 0.42,
    page: 'S. 10–11',
  },
];

export interface BeltTextGapItem {
  id: string;
  title: string;
  tag: 'не из источника' | 'экстраполяция';
  detail: string;
}

// §5.7–5.8: закрыты belt_gap_floor_ref (S. 5 различает пол-пол и в свету) и belt_gap_sill_plate_height (N3: > u, S. 17)
export const BELT_TEXT_GAPS: BeltTextGapItem[] = [
  {
    id: 'belt_gap_ausladung',
    title: 'Числовой вынос (Ausladung) межэтажной ленты',
    tag: 'не из источника',
    detail:
      'На S. 16 сказано лишь, что поясной карниз должен иметь «умеренный вынос» (mäßige Ausladung), а при венчающем завершении — чуть больше (S. 10); формулы 45° и 5/6 даны только для венчающих/оконных карнизов.',
  },
  {
    id: 'belt_gap_fuss_rumpf_deck',
    title: 'Разбивка Fuß : Rumpf : Deckglied для ленты',
    tag: 'не из источника',
    detail:
      'Трёхчастное деление (Fuß, Rumpf, Deckglied) описано в источнике только для цоколя (S. 10); для поясной ленты даны 4 класса состава и деление венчающей части на верхние и нижние обломы (S. 10–11).',
  },
  {
    id: 'belt_gap_modest_lower',
    title: 'Числовые пороги «скромного» нижнего этажа (H_ленты < h/12)',
    tag: 'не из источника',
    detail:
      'На S. 16 отмечено, что высоты меньше 1/12 оправданны, «когда 1-й этаж решён просто и скромно», однако числовой порог такого снижения в тексте не приведён.',
  },
  {
    id: 'belt_gap_colonnade_ratio',
    title: 'Числовые соотношения ленты с колоннадой или пилястрами',
    tag: 'не из источника',
    detail:
      'На S. 16 указано лишь качественное требование «разработать в верном соотношении с ними, не превосходя главный карниз».',
  },
];

export interface BeltHeightResult {
  h: number;
  range: [number, number];
  status: ValidationStatus;
  notRequired?: boolean;
  checks: {
    belowSocle: boolean;
    belowMain: boolean;
    inRange: boolean;
    note: string | null;
  };
  explanation: string;
  formula: string;
  page: string;
}

export function beltHeight(
  inp: BeltInput,
  customHeight?: number,
  options: { allowModestLowerFloor?: boolean } = {}
): BeltHeightResult {
  const min = inp.hLowerFloor / 12;
  const max = inp.hLowerFloor / 6;
  const h = customHeight !== undefined ? customHeight : (min + max) / 2;
  const res = checkBeltHeight(h, inp.hLowerFloor, inp.H_socle, inp.H_mainCornice, options);

  return {
    h: res.h,
    range: res.range,
    status: res.status,
    checks: {
      belowSocle: res.belowSocle,
      belowMain: res.belowMain,
      inRange: res.inRange,
      note: res.note,
    },
    explanation: res.explanation,
    formula: 'h_нижн / 12 ≤ H_ленты ≤ h_нижн / 6; H_ленты < min(H_цоколя, H_гл.к.)',
    page: 'S. 16',
  };
}

export interface BeltCrowningSplitResult {
  hCrown: number;
  hUpper: number;
  hLower: number;
  ratio: number;
  rawRatio: number;
  status: ValidationStatus;
  effect: BeltEffect;
  consoleNote: string | null;
  note: string;
  explanation: string;
  formula: string;
  page: string;
}

export function beltCrowningSplit(
  hCrown: number,
  ratio = 1,
  effect: BeltEffect = 'neutral',
  consoleMode: BeltConsoleMode = 'none'
): BeltCrowningSplitResult {
  const inRange = ratio >= 0.5 - EPS && ratio <= 2 + EPS;
  const r = Math.max(0.5, Math.min(2, Number.isFinite(ratio) && ratio > 0 ? ratio : 1));
  const safeHCrown = Math.max(0.01, hCrown);
  const hLower = safeHCrown / (1 + r);
  const hUpper = safeHCrown - hLower;

  const note =
    effect === 'heavy'
      ? 'S. 11: тяжёлый — верх одна плита, низ отступает'
      : effect === 'light'
        ? 'S. 11: лёгкий — верх выкружка/гусёк'
        : 'S. 11: базовое 1:1';

  let consoleNote: string | null = null;
  let consoleMismatch = false;
  if (consoleMode === 'lying_lower') {
    consoleNote = 'S. 11: лежачие консоли в нижних обломах требуют увеличенной нижней зоны (h_верх < h_низ).';
    if (ratio > 1.0 + EPS) consoleMismatch = true;
  } else if (consoleMode === 'standing_frieze') {
    consoleNote = 'S. 11: стоячие консоли во фризе требуют меньших нижних обломов венчающей части (h_верх > h_низ).';
    if (ratio < 1.0 - EPS) consoleMismatch = true;
  }

  let status: ValidationStatus = 'ok';
  if (!inRange || hCrown <= 0) {
    status = 'violation';
  } else if (consoleMismatch) {
    status = 'approx';
  }

  const explanation = !inRange
    ? `Нарушение (S. 11): отношение верхних и нижних обломов h_верх:h_низ = ${formatMeters(ratio, 2)} выходит за пределы 1:2…2:1 (0.50…2.00).`
    : consoleMismatch && consoleNote
      ? `${note}. Предупреждение по консолям: ${consoleNote}`
      : `${note}. При h_венц = ${formatMeters(safeHCrown)} м: h_верх = ${formatMeters(hUpper)} м, h_низ = ${formatMeters(hLower)} м (отношение ${formatMeters(ratio, 2)}:1).${consoleNote ? ` ${consoleNote}` : ''}`;

  return {
    hCrown: safeHCrown,
    hUpper,
    hLower,
    ratio: r,
    rawRatio: ratio,
    status,
    effect,
    consoleNote,
    note,
    explanation,
    formula: 'h_верх : h_низ ∈ [1:2, 2:1], базовое 1:1; h_верх + h_низ = h_венц',
    page: 'S. 10–11',
  };
}

export interface BeltColumnsResult {
  status: ValidationStatus | 'n/a';
  note: string | null;
  explanation: string;
  formula: string;
  page: string;
}

export function beltWithColumns(
  H_belt: number,
  H_main: number,
  H_socle: number,
  hasColumns: boolean
): BeltColumnsResult {
  if (!hasColumns) {
    return {
      status: 'n/a',
      note: null,
      explanation: 'Колоннада или пилястры в нижнем этаже не заданы.',
      formula: 'без колоннады в нижнем этаже — не применяется',
      page: 'S. 16',
    };
  }
  const ok = H_belt < H_main - EPS && H_belt < H_socle - EPS;
  const note =
    'S. 16: при колоннаде/пилястрах лента разрабатывается в согласии с ними, но не превосходит главный карниз и цоколь';
  return {
    status: ok ? 'ok' : 'violation',
    note,
    explanation: ok
      ? `При опорах нижнего этажа лента H_ленты = ${formatMeters(H_belt)} м согласована по высоте и меньше min(H_цоколя = ${formatMeters(H_socle)} м, H_гл.к. = ${formatMeters(H_main)} м).`
      : `Нарушение (S. 16): при колоннаде/пилястрах H_ленты = ${formatMeters(H_belt)} м ≥ min(H_цоколя = ${formatMeters(H_socle)} м, H_гл.к. = ${formatMeters(H_main)} м) — поясной карниз перебивает главный или цоколь.`,
    formula: 'hasColumnsBelow ⇒ H_ленты < min(H_цоколя, H_гл.к.)',
    page: 'S. 16',
  };
}

export interface BeltRusticationResult {
  status: ValidationStatus;
  note: string;
  explanation: string;
  formula: string;
  page: string;
}

export function beltAsRustication(
  hasBaseProfile: boolean,
  floorHeight: number
): BeltRusticationResult {
  if (!hasBaseProfile) {
    return {
      status: 'violation',
      note: 'S. 15–16: рустовка должна опираться на базовый профиль',
      explanation:
        'Ошибка (S. 16): при замене карнизной ленты рустовкой (Fugenteilung) она обязательно должна опираться на базовый профиль (Fußprofil), хотя бы в виде узкого пояска.',
      formula: 'hasRustication ⇒ hasBaseProfile === true',
      page: 'S. 16',
    };
  }
  const lowFloor = floorHeight < 3.0;
  return {
    status: lowFloor ? 'approx' : 'ok',
    note: 'S. 15–16: сплошная подоконная лента при малой высоте этажа даёт беспокойство',
    explanation: lowFloor
      ? `При высоте этажа ${formatMeters(floorHeight)} м (< 3.0 м — порог UX) замена на рустовку на базовом профиле предпочтительнее сплошной подоконной ленты, которая вносит беспокойство (S. 16).`
      : `Рустовка опирается на базовый профиль (Fußprofil), выражая опору этажа на нижележащую массу без перетягивания стены (S. 16).`,
    formula: 'Fugenteilung + Fußprofil (при H_эт < 3.0 м — предупреждение UX)',
    page: 'S. 16',
  };
}

export function threeStoryBeltScheme(scheme: ThreeStoryBeltSchemeNumber): string {
  switch (scheme) {
    case 1:
      return 'Лента на уровне пола 2-го и 3-го эт.';
    case 2:
      return 'Лента под окнами 3-го эт. как подоконный карниз';
    case 3:
      return 'Без ленты между 2-м и 3-м эт. — единое целое';
  }
}

export function schemeNumberFromGurtMode(
  mode: ThreeStoryGurtMode
): ThreeStoryBeltSchemeNumber {
  if (mode === 'third_sohlbank') return 2;
  if (mode === 'unified_upper') return 3;
  return 1;
}

export function gurtModeFromSchemeNumber(
  scheme: ThreeStoryBeltSchemeNumber
): ThreeStoryGurtMode {
  if (scheme === 2) return 'third_sohlbank';
  if (scheme === 3) return 'unified_upper';
  return 'both_gurt';
}

export interface BeltSpecialCasesResult {
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function checkBeltSpecialCases(options: {
  variant: BuildingVariant;
  multiSub: MultiSub;
  floors: number;
  floorHeight: number;
  totalHeight?: number;
  isAbsent: boolean;
  isSillCornice: boolean;
  onlySillUnderSecond: boolean;
  alignsWithRecesses: boolean;
  hasRustication: boolean;
  hasBaseProfile: boolean;
  threeStoryGurtMode: ThreeStoryGurtMode;
}): BeltSpecialCasesResult {
  const {
    variant,
    multiSub,
    floors,
    floorHeight,
    totalHeight,
    isAbsent,
    isSillCornice,
    onlySillUnderSecond,
    alignsWithRecesses,
    hasRustication,
    hasBaseProfile,
    threeStoryGurtMode,
  } = options;

  if (variant === 'one-story' || floors <= 1) {
    return {
      status: 'ok',
      explanation: 'Для 1-этажного дома межэтажная лента не требуется.',
      formula: '1 этаж ⇒ межэтажный пояс отсутствует',
      page: 'S. 16, 21',
    };
  }

  // P0-5 + N29: S. 22 — «редко и проблематично», формально не запрещено (approx); violation только при вырождении > 0.55*totalHeight
  if (onlySillUnderSecond) {
    const isDegenerate =
      totalHeight !== undefined &&
      totalHeight > 0 &&
      floorHeight > 0.55 * totalHeight + EPS;
    return {
      status: isDegenerate ? 'violation' : 'approx',
      explanation: isDegenerate
        ? `Вырожденная высота 1-го этажа (${formatMeters(floorHeight)} м > 55 % общей высоты ${formatMeters(totalHeight)} м — UX-порог): один подоконный пояс под 2-м этажом разрушает иерархию (S. 22).`
        : 'S. 22: редко и проблематично — при одном подоконном поясе под 2-м этажом 1-й этаж зрительно увеличивается за счёт верхних; рекомендуется подоконный пояс-парапет. Формально не запрещено.',
      formula: 'только Sohlbank под 2-м эт. ⇒ approx (violation при h_1эт > 0.55·H_total)',
      page: 'S. 22',
    };
  }

  if (hasRustication && !hasBaseProfile) {
    return {
      status: 'violation',
      explanation:
        'Нарушение (S. 16): при замене ленты рустовкой отсутствует базовый профиль (Fußprofil) для опирания этажа.',
      formula: 'рустовка без базового профиля ⇒ нарушение',
      page: 'S. 16',
    };
  }

  if (isAbsent) {
    const allowedUnified =
      (variant === 'multi-story' && multiSub === 'three') ||
      (variant === 'multi-story' && multiSub === 'four-five') ||
      threeStoryGurtMode === 'unified_upper';
    if (allowedUnified) {
      return {
        status: 'ok',
        explanation:
          'Лента отсутствует — соседние этажи читаются как единое архитектурное целое (допустимо для 3-этажного по схеме 3, S. 22, либо для 1+2 эт. в богатом 5-этажном особняке, S. 23).',
        formula: 'без ленты ⇒ допустимо при объединении ярусов (S. 22–23)',
        page: 'S. 22–23',
      };
    }
    return {
      status: 'approx',
      explanation:
        'Лента отсутствует: этажи читаются как единое целое. Для обычного 2-этажного дома отказ от поясного карниза требует особенно ясной опоры или рустовки (S. 16, 22).',
      formula: 'без ленты в 2-эт. доме ⇒ требуется иная связка ярусов',
      page: 'S. 16, 22',
    };
  }

  if (isSillCornice && (variant === 'two-story' || floorHeight < 3.3)) {
    return {
      status: 'approx',
      explanation:
        'Предупреждение (S. 16–17): сплошная подоконная лента в малоэтажном доме или при небольшой высоте этажа (< 3.3 м, порог UX) может создавать зрительное беспокойство и «перетягивать» стену; высота её плиты должна превышать ширину наличника (N3).',
      formula: 'Sohlbankgesimse в малоэтажном / невысоком этаже ⇒ риск беспокойства',
      page: 'S. 16–17',
    };
  }

  if (!alignsWithRecesses) {
    return {
      status: 'approx',
      explanation:
        'Предупреждение (S. 17–18): лента не согласована с западающими частями (Rücklagen) и ризалитами — горизонтальные карнизы не должны разрываться.',
      formula: 'alignsWithRecesses === true (согласование с западающими крыльями)',
      page: 'S. 17–18',
    };
  }

  return {
    status: 'ok',
    explanation: isSillCornice
      ? 'Подоконная лента согласована с нижележащим ярусом и западающими частями фасада (S. 17, 22).'
      : 'Специальные условия межэтажной ленты соблюдены: единство с западающими частями, отсутствие визуальной перетяжки (S. 16–17, 22).',
    formula: 'согласование с ярусами и западающими частями (Rücklagen)',
    page: 'S. 16–17, 22',
  };
}

// ==================================================
// 3.13. Новые правила из S. 12–23 (N1–N29)
// ==================================================

export interface SimpleRuleCheckResult {
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  explanation: string;
  formula: string;
  page: string;
}

// N1 (S. 17): ширина обрамления u ∈ [w/6, w/5]
export function checkFramingWidth(u: number, w: number): SimpleRuleCheckResult {
  const min = w / 6;
  const max = w / 5;
  if (!Number.isFinite(u) || !Number.isFinite(w) || w <= 0 || u <= 0) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Ширина обрамления u и окна w должны быть положительными.',
      formula: 'u ∈ [w/6, w/5]',
      page: 'S. 17',
    };
  }
  const inRange = u >= min - EPS && u <= max + EPS;
  return {
    status: inRange ? 'ok' : 'approx',
    sourceStatus: 'explicit-verified',
    explanation: inRange
      ? `Ширина наличника u = ${formatMeters(u)} м входит в норму S. 17: [w/6, w/5] = [${formatMeters(min)}, ${formatMeters(max)}] м.`
      : `Ширина наличника u = ${formatMeters(u)} м выходит за типовой диапазон S. 17 [${formatMeters(min)}, ${formatMeters(max)}] м (1/6…1/5 ширины окна w).`,
    formula: 'u ∈ [w/6, w/5]',
    page: 'S. 17',
  };
}

// N2 (S. 17): подоконная плита h_sill ∈ [w/8, w/7], допуск до w/6
export function checkSillPlateHeight(hSill: number, w: number): SimpleRuleCheckResult {
  const min = w / 8;
  const max = w / 7;
  const absMax = w / 6;
  if (!Number.isFinite(hSill) || !Number.isFinite(w) || w <= 0 || hSill <= 0) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Высота подоконной плиты и ширина окна должны быть положительными.',
      formula: 'h_sill ∈ [w/8, w/7] (допуск до w/6)',
      page: 'S. 17',
    };
  }
  if (hSill >= min - EPS && hSill <= max + EPS) {
    return {
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: `Подоконная плита h_sill = ${formatMeters(hSill)} м входит в норму [${formatMeters(min)}, ${formatMeters(max)}] м (1/8…1/7 от w, S. 17).`,
      formula: 'h_sill ∈ [w/8, w/7]',
      page: 'S. 17',
    };
  }
  if (hSill > max + EPS && hSill <= absMax + EPS) {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: `Подоконная плита h_sill = ${formatMeters(hSill)} м в повышенном пределе (w/7, w/6] = (${formatMeters(max)}, ${formatMeters(absMax)}] м — допустимо по S. 17 при развитом профиле.`,
      formula: 'w/7 < h_sill ≤ w/6 (прибл.)',
      page: 'S. 17',
    };
  }
  return {
    status: 'violation',
    sourceStatus: 'explicit-verified',
    explanation: `Нарушение (S. 17): подоконная плита h_sill = ${formatMeters(hSill)} м выходит за пределы [${formatMeters(min)}, ${formatMeters(absMax)}] м.`,
    formula: 'h_sill ∈ [w/8, w/7] (предел w/6)',
    page: 'S. 17',
  };
}

// N3 (S. 17): сплошной подоконный карниз h_sillCornice > u
export function checkSillCorniceHeight(hSillCornice: number, u: number): SimpleRuleCheckResult {
  if (!Number.isFinite(hSillCornice) || hSillCornice <= 0) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Высота сплошного подоконного карниза должна быть положительной.',
      formula: 'h_sillCornice > u',
      page: 'S. 17',
    };
  }
  const ok = hSillCornice > u + EPS;
  return {
    status: ok ? 'ok' : 'approx',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Высота сплошного подоконного карниза ${formatMeters(hSillCornice)} м больше ширины наличника u = ${formatMeters(u)} м (S. 17).`
      : `Высота сплошного подоконного карниза (${formatMeters(hSillCornice)} м) должна превышать ширину наличника u = ${formatMeters(u)} м (S. 17).`,
    formula: 'h_sillCornice > u',
    page: 'S. 17',
  };
}

// N4 (S. 17): высота окна в рустовке = 7–8 рядов
export function checkWindowRows(
  winH: number,
  rowHeight: number,
  hasWallRustication = true
): SimpleRuleCheckResult & { courses: number } {
  if (!hasWallRustication) {
    return {
      courses: 0,
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: 'Стена без квадровой рустики — привязка высоты окна к рядам не требуется.',
      formula: 'без рустовки стены — не требуется',
      page: 'S. 17',
    };
  }
  const courses = rowHeight > 0 ? winH / rowHeight : NaN;
  const ok = Number.isFinite(courses) && courses >= 6.85 && courses <= 8.15;
  return {
    courses,
    status: ok ? 'ok' : 'approx',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Высота окна ${formatMeters(winH)} м кратна ${formatMeters(courses, 1)} рядам руста по ${formatMeters(rowHeight, 2)} м (норма S. 17: 7–8 рядов).`
      : `На высоту окна ${formatMeters(winH)} м приходится ${formatMeters(courses, 1)} рядов руста (по S. 17 обычно 7–8 рядов; UX-ориентир).`,
    formula: 'h_win / rowHeight ∈ [7, 8]',
    page: 'S. 17',
  };
}

// N5 (S. 15): нечётное число рядов угловой рустовки
export function checkCornerRusticationRows(nRows: number): SimpleRuleCheckResult {
  const n = Math.max(1, Math.round(nRows));
  const isOdd = n % 2 === 1;
  return {
    status: isOdd ? 'ok' : 'approx',
    sourceStatus: 'explicit-verified',
    explanation: isOdd
      ? `Угловая рустовка имеет нечётное число рядов (${n}) — нижний и верхний камни образуют прочную заделку угла (S. 15).`
      : `Угловая рустовка имеет чётное число рядов (${n}) — по S. 15 предпочтительно нечётное число (5, 7, 9…).`,
    formula: 'n_cornerRows % 2 === 1',
    page: 'S. 15',
  };
}

// N6 (S. 15, Fig. 7): отступ угла M vs верхняя высота N
export function checkCornerOffsetVsUpperHeight(
  M: number,
  N: number
): SimpleRuleCheckResult {
  if (M <= 0 || N <= 0) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Величины M и N должны быть положительными.',
      formula: 'M ≤ N (рис. 7, S. 15)',
      page: 'S. 15',
    };
  }
  const ok = M <= N + EPS;
  return {
    status: ok ? 'ok' : 'approx',
    sourceStatus: ok ? 'explicit-verified' : 'heuristic',
    explanation: ok
      ? `Отступ угла M = ${formatMeters(M)} м не превышает верхнюю высоту N = ${formatMeters(N)} м (рис. 7, S. 15).`
      : `Отступ угла M = ${formatMeters(M)} м превосходит верхнюю высоту N = ${formatMeters(N)} м — по рис. 7 (S. 15) рекомендуется пилястровое членение (совет UX).`,
    formula: 'M ≤ N (при M > N — ввести пилястры)',
    page: 'S. 15',
  };
}

// N8 (S. 18): простенок крыла p_wing ≤ p_corner
export function checkWingPierWidth(pWing: number, pCorner: number): SimpleRuleCheckResult {
  const ok = pWing <= pCorner + EPS && pWing > 0;
  return {
    status: ok ? 'ok' : 'violation',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Простенок крыла p_wing = ${formatMeters(pWing)} м ≤ углового простенка ризалита/корпуса p_corner = ${formatMeters(pCorner)} м (S. 18).`
      : `Нарушение (S. 18): простенок крыла p_wing = ${formatMeters(pWing)} м не должен превосходить угловой простенок (${formatMeters(pCorner)} м).`,
    formula: 'p_wing ≤ p_corner',
    page: 'S. 18',
  };
}

// N9 (S. 20): боковой ризалит ≤ 2/3 центрального
export function checkSideRisalitWidth(wSide: number, wCentral: number): SimpleRuleCheckResult {
  if (wSide <= 0 || wCentral <= 0) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Ширины бокового и центрального ризалитов должны быть положительными.',
      formula: 'W_side ≤ (2/3) · W_central',
      page: 'S. 20',
    };
  }
  const ratio = wSide / wCentral;
  if (ratio <= 2 / 3 + EPS) {
    return {
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: `Боковой ризалит (${formatMeters(wSide)} м = ${formatMeters(ratio, 2)}·W_central) укладывается в ≤ 2/3 центрального (S. 20).`,
      formula: 'W_side ≤ (2/3) · W_central',
      page: 'S. 20',
    };
  }
  if (ratio <= 3 / 4 + EPS) {
    return {
      status: 'approx',
      sourceStatus: 'heuristic',
      explanation: `Боковой ризалит (${formatMeters(ratio, 2)}·W_central) слегка превышает 2/3, но остаётся ≤ 3/4 центрального (S. 20, предел approx — UX).`,
      formula: 'W_side ≤ (3/4) · W_central (approx)',
      page: 'S. 20',
    };
  }
  return {
    status: 'violation',
    sourceStatus: 'explicit-verified',
    explanation: `Нарушение (S. 20): боковой ризалит (${formatMeters(wSide)} м) крупнее 3/4 центрального (${formatMeters(wCentral)} м) — спорит с центром фасада.`,
    formula: 'W_side ≤ (2/3) · W_central',
    page: 'S. 20',
  };
}

// N10 (S. 19): крыло ≥ 2 * боковой ризалит
export function checkWingVsSideRisalit(wWing: number, wSide: number): SimpleRuleCheckResult {
  const ok = wWing >= 2 * wSide - EPS && wWing > 0 && wSide > 0;
  return {
    status: ok ? 'ok' : 'violation',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Западающее крыло W_wing = ${formatMeters(wWing)} м ≥ 2 × W_side (${formatMeters(2 * wSide)} м, S. 19).`
      : `Нарушение (S. 19): ширина западающего крыла W_wing = ${formatMeters(wWing)} м меньше удвоенной ширины бокового ризалита (${formatMeters(2 * wSide)} м).`,
    formula: 'W_wing ≥ 2 · W_side',
    page: 'S. 19',
  };
}

// N11 (S. 19, Fig. 9): 5-частный фасад
export function checkFivePartFacade(
  wCentral: number,
  wSide: number,
  wWing: number,
  richCentral = 2,
  richSide = 1,
  richWing = 1
): SimpleRuleCheckResult {
  const widthsOk = wCentral > wSide + EPS && wSide < wWing - EPS;
  const richnessOk = richCentral >= Math.max(richSide, richWing);
  const status: ValidationStatus = !widthsOk ? 'violation' : !richnessOk ? 'approx' : 'ok';
  return {
    status,
    sourceStatus: 'explicit-verified',
    explanation: !widthsOk
      ? `Нарушение 5-частной схемы (S. 19, рис. 9): требуется W_central (${formatMeters(wCentral)}) > W_side (${formatMeters(wSide)}) и W_side < W_wing (${formatMeters(wWing)}).`
      : !richnessOk
        ? 'Ширины 5-частного фасада верны, но центральный ризалит не превосходит боковые части по богатству отделки (S. 19).'
        : '5-частный фасад (S. 19, рис. 9): центральный ризалит доминирует над крыльями и боковыми ризалитами.',
    formula: 'W_central > W_side < W_wing; богатство(central) ≥ max(side, wing)',
    page: 'S. 19',
  };
}

// N12 (S. 20, Fig. 10): 7-частный фасад 1.5 : 3 : 5 : 3 : 1.5 и центр 1 : 2 : 1
export function checkSevenPartFacade(
  parts: [number, number, number, number, number],
  centralSub?: [number, number, number]
): SimpleRuleCheckResult {
  const target = [1.5, 3, 5, 3, 1.5];
  const totalActual = parts.reduce((a, b) => a + b, 0);
  const totalTarget = target.reduce((a, b) => a + b, 0);
  if (totalActual <= 0 || parts.some((p) => p <= 0)) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Все части 7-частного фасада должны быть положительными.',
      formula: '1.5 : 3 : 5 : 3 : 1.5',
      page: 'S. 20',
    };
  }
  const maxRelDev = Math.max(
    ...parts.map((p, i) => {
      const actualShare = p / totalActual;
      const targetShare = target[i] / totalTarget;
      return Math.abs(actualShare - targetShare) / targetShare;
    })
  );
  let centralOk = true;
  if (centralSub) {
    const cSum = centralSub[0] + centralSub[1] + centralSub[2];
    const cTarget = [1, 2, 1];
    const cMaxDev = Math.max(
      ...centralSub.map((c, i) => Math.abs(c / cSum - cTarget[i] / 4) / (cTarget[i] / 4))
    );
    centralOk = cMaxDev <= 0.15;
  }
  const status: ValidationStatus = maxRelDev <= 0.15 && centralOk ? 'ok' : 'approx';
  return {
    status,
    sourceStatus: maxRelDev <= 0.15 && centralOk ? 'explicit-verified' : 'heuristic',
    explanation:
      status === 'ok'
        ? '7-частный фасад близок к каноническому ритму рис. 10 (1.5 : 3 : 5 : 3 : 1.5; центр 1 : 2 : 1, S. 20).'
        : `Отклонение долей 7-частного фасада от схемы 1.5 : 3 : 5 : 3 : 1.5 составляет ${(maxRelDev * 100).toFixed(0)} % (допуск ±15 % — UX-ориентир).`,
    formula: 'доли 1.5 : 3 : 5 : 3 : 1.5; центр 1 : 2 : 1',
    page: 'S. 20',
  };
}

// N13 (S. 18): западающая середина шире бокового ризалита
export function checkMiddleVsSideRisalit(wMiddle: number, wSide: number): SimpleRuleCheckResult {
  const ok = wMiddle > wSide + EPS && wSide > 0;
  return {
    status: ok ? 'ok' : 'violation',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Западающая середина (${formatMeters(wMiddle)} м) шире бокового ризалита (${formatMeters(wSide)} м, S. 18).`
      : `Нарушение (S. 18): западающая середина (${formatMeters(wMiddle)} м) должна быть шире бокового ризалита (${formatMeters(wSide)} м).`,
    formula: 'W_middle > W_side',
    page: 'S. 18',
  };
}

// N14 (S. 19): нечётные оси в центральном ризалите
export function checkCentralRisalitAxes(axes: number): SimpleRuleCheckResult {
  const n = Math.max(1, Math.round(axes));
  const isOdd = n % 2 === 1;
  return {
    status: isOdd ? 'ok' : 'approx',
    sourceStatus: 'explicit-verified',
    explanation: isOdd
      ? `Центральный ризалит имеет нечётное число осей (${n}, S. 19).`
      : `В центральном ризалите чётное число осей (${n}) — по S. 19 предпочтительно нечётное (3, 5).`,
    formula: 'axes_central % 2 === 1',
    page: 'S. 19',
  };
}

// N15 (S. 18): оси в крыле (нечётные лучше, чётные допустимы при группировке)
export function checkWingAxes(axes: number): SimpleRuleCheckResult {
  const n = Math.max(1, Math.round(axes));
  const isOdd = n % 2 === 1;
  return {
    status: isOdd ? 'ok' : 'approx',
    sourceStatus: 'explicit-verified',
    explanation: isOdd
      ? `Крыло имеет нечётное число осей (${n}, S. 18).`
      : `В крыле чётное число осей (${n}) — по S. 18 требуется парная группировка проёмов.`,
    formula: 'axes_wing % 2 === 1 (чётные с группировкой)',
    page: 'S. 18',
  };
}

// N16 (S. 18): запрет пилястра между парой окон в центральном ризалите
export function checkPilasterBetweenWindowPairs(
  hasPilasterBetweenPairedWindows: boolean
): SimpleRuleCheckResult {
  return {
    status: hasPilasterBetweenPairedWindows ? 'violation' : 'ok',
    sourceStatus: 'explicit-verified',
    explanation: hasPilasterBetweenPairedWindows
      ? 'Нарушение (S. 18): пилястр между парой сближенных окон в центральном ризалите удлиняет горизонталь вместо группировки.'
      : 'Проёмы в ризалите не перерезаны промежуточным пилястром (S. 18).',
    formula: '¬hasPilasterBetweenPairedWindows',
    page: 'S. 18',
  };
}

// N17 (S. 18): 2 окна в западающей середине между двумя боковыми ризалитами запрещены
export function checkMiddleAxesInTwoSideRisalits(axes: number): SimpleRuleCheckResult {
  const n = Math.max(1, Math.round(axes));
  if (n === 2) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Нарушение (S. 18): в западающей середине между двумя боковыми ризалитами 2 окна недопустимы (разрывают композицию без центра).',
      formula: 'axes_middle ≠ 2 (при 2 бок. ризалитах)',
      page: 'S. 18',
    };
  }
  if (n % 2 === 0) {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: `В западающей середине чётное число осей (${n}) — по S. 18 требует группировки.`,
      formula: 'axes_middle % 2 === 1 (предпочтительно)',
      page: 'S. 18',
    };
  }
  return {
    status: 'ok',
    sourceStatus: 'explicit-verified',
    explanation: `Западающая середина имеет нечётное число осей (${n}, S. 18).`,
    formula: 'axes_middle % 2 === 1',
    page: 'S. 18',
  };
}

// N18 (S. 13): пилястры в смежных этажах без разницы высот
export function checkPilasterRepetition(
  hasAdjacentPilasters: boolean,
  heightDiffPct: number
): SimpleRuleCheckResult {
  if (!hasAdjacentPilasters) {
    return {
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: 'Смежные этажи не дублируют одинаковые пилястры.',
      formula: 'нет одновысотного повторения пилястр',
      page: 'S. 13',
    };
  }
  const ok = heightDiffPct >= 0.15 - EPS;
  return {
    status: ok ? 'ok' : 'approx',
    sourceStatus: 'heuristic',
    explanation: ok
      ? `Пилястры смежных этажей различаются по высоте на ${(heightDiffPct * 100).toFixed(0)} % (≥ 15 % — UX-ориентир, S. 13).`
      : `Пилястры в смежных этажах повторяются с близкой высотой (разница ${(heightDiffPct * 100).toFixed(0)} % < 15 % — UX-эвристика по S. 13).`,
    formula: 'ΔH_floors ≥ 15 % при ордере в смежных этажах',
    page: 'S. 13',
  };
}

// N19 (S. 13): пилястры только в верхнем этаже
export function checkPilastersOnlyUpper(pilastersOnlyOnUpperFloor: boolean): SimpleRuleCheckResult {
  return {
    status: pilastersOnlyOnUpperFloor ? 'approx' : 'ok',
    sourceStatus: 'explicit-verified',
    explanation: pilastersOnlyOnUpperFloor
      ? 'Предупреждение (S. 13): пилястры только в верхнем этаже над гладким низом нарушают ощущение прочной опоры.'
      : 'Ордерное членение не сосредоточено исключительно в верхнем этаже (S. 13).',
    formula: '¬pilastersOnlyOnUpperFloor',
    page: 'S. 13',
  };
}

// N20 (S. 12, P3): пилястр уже простенка стены
export function checkPilasterNarrowerThanWallPier(
  wpPilaster: number,
  wpWallPier: number
): SimpleRuleCheckResult {
  const ok = wpPilaster > 0 && wpPilaster < wpWallPier - EPS;
  return {
    status: ok ? 'ok' : 'violation',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Ширина пилястра W_p = ${formatMeters(wpPilaster)} м меньше ширины стенового простенка (${formatMeters(wpWallPier)} м, S. 12).`
      : `Нарушение (S. 12): пилястр (${formatMeters(wpPilaster)} м) не должен быть шире или равен стеновому простенку (${formatMeters(wpWallPier)} м).`,
    formula: 'W_p_pilaster < W_p_wallPier',
    page: 'S. 12',
  };
}

// N21 (S. 13, P3): просвет между спаренными пилястрами ∈ (0.2*W_p, W_p)
export function checkPairedPilastersGap(gap: number, wp: number): SimpleRuleCheckResult {
  const min = 0.2 * wp;
  const max = wp;
  const ok = wp > 0 && gap > min + EPS && gap < max - EPS;
  return {
    status: ok ? 'ok' : 'violation',
    sourceStatus: 'explicit-verified',
    explanation: ok
      ? `Просвет между спаренными пилястрами ${formatMeters(gap)} м входит в (0.2·W_p, W_p) = (${formatMeters(min)}, ${formatMeters(max)}) м (S. 13).`
      : `Нарушение (S. 13): просвет между спаренными пилястрами ${formatMeters(gap)} м должен лежать строго между 0.2·W_p (${formatMeters(min)} м) и W_p (${formatMeters(max)} м).`,
    formula: '0.2·W_p < gap < W_p',
    page: 'S. 13',
  };
}

// N22 (S. 13, P3): 3/4 и 2/3 колонна предпочтительнее полуколонны
export type ColumnProfileType = 'none' | 'half' | 'two_thirds' | 'three_quarters';

export function checkColumnProfileType(columnType: ColumnProfileType): SimpleRuleCheckResult {
  if (columnType === 'half') {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: 'S. 13: полуколонна уступает по пластике 2/3 или 3/4 колонне (рекомендуется увеличить выступ).',
      formula: 'columnType ∈ {2/3, 3/4} > half',
      page: 'S. 13',
    };
  }
  return {
    status: 'ok',
    sourceStatus: 'explicit-verified',
    explanation:
      columnType === 'none'
        ? 'Пристенные колонны не применяются.'
        : `Выбранный тип (${columnType === 'three_quarters' ? '3/4' : '2/3'} колонна) отвечает S. 13.`,
    formula: '2/3 или 3/4 колонна (S. 13)',
    page: 'S. 13',
  };
}

// N23 (S. 19): аттик
export function checkAttic(
  atticOverRisalit: boolean,
  atticOverWing: boolean,
  atticRisalitHeavier = true
): SimpleRuleCheckResult {
  if (atticOverRisalit && !atticOverWing) {
    return {
      status: 'violation',
      sourceStatus: 'explicit-verified',
      explanation: 'Нарушение (S. 19): аттик только над ризалитом без аттика над крыльями не допускается.',
      formula: 'atticOverRisalit ⇒ atticOverWing',
      page: 'S. 19',
    };
  }
  if (atticOverRisalit && atticOverWing && !atticRisalitHeavier) {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: 'Предупреждение (S. 19): аттик над центральным ризалитом должен быть массивнее, чем над крыльями.',
      formula: 'atticRisalitHeavier === true',
      page: 'S. 19',
    };
  }
  return {
    status: 'ok',
    sourceStatus: 'explicit-verified',
    explanation: atticOverRisalit
      ? 'Аттик уравновешен и усилен над центральным ризалитом (S. 19).'
      : 'Композиция без конфликтного аттика (S. 19).',
    formula: 'atticOverRisalit ⇒ atticOverWing ∧ heavier',
    page: 'S. 19',
  };
}

// N24 (S. 18–19, P3): фронтон
export type PedimentType = 'none' | 'gentle' | 'steep';

export function checkPedimentChoice(
  pediment: PedimentType,
  isClassical = true
): SimpleRuleCheckResult {
  if (pediment === 'steep' && isClassical) {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: 'Для классического стиля рекомендуется пологий фронтон вместо крутого (S. 18–19).',
      formula: 'классика ⇒ пологий фронтон',
      page: 'S. 18–19',
    };
  }
  return {
    status: 'ok',
    sourceStatus: 'explicit-verified',
    explanation:
      pediment === 'none'
        ? 'Ризалит без фронтонного завершения.'
        : 'Уклон фронтона согласован со стилистическим характером фасада (S. 18–19).',
    formula: 'Giebel по S. 18–19',
    page: 'S. 18–19',
  };
}

// N25 (S. 14): богатство ризалита ≥ богатства крыла
export function checkRisalitRichness(
  risalitRichness: number,
  wingRichness: number,
  isCentralWingBetweenSideRisalits = false
): SimpleRuleCheckResult {
  if (risalitRichness >= wingRichness) {
    return {
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: 'Декоративное богатство ризалита не уступает крыльям (S. 14).',
      formula: 'richness(risalit) ≥ richness(wing)',
      page: 'S. 14',
    };
  }
  if (isCentralWingBetweenSideRisalits) {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: 'При центральной западающей части между двумя боковыми ризалитами допускается её богатое оформление (исключение S. 14).',
      formula: 'исключение при 2 бок. ризалитах (S. 14)',
      page: 'S. 14',
    };
  }
  return {
    status: 'violation',
    sourceStatus: 'explicit-verified',
    explanation: 'Нарушение (S. 14): второстепенное крыло не должно быть богаче главного ризалита.',
    formula: 'richness(risalit) ≥ richness(wing)',
    page: 'S. 14',
  };
}

// N26 (S. 18, P3): при равной ширине ризалита и крыла нужен фронтон
export function checkEqualWidthRisalitWingPediment(
  wRisalit: number,
  wWing: number,
  hasPedimentOnRisalit: boolean
): SimpleRuleCheckResult {
  const maxW = Math.max(wRisalit, wWing, 0.01);
  const equalWidths = Math.abs(wRisalit - wWing) <= 0.05 * maxW;
  if (equalWidths && !hasPedimentOnRisalit) {
    return {
      status: 'approx',
      sourceStatus: 'explicit-verified',
      explanation: 'При почти равной ширине ризалита и крыла рекомендуется выделить ризалит фронтоном (Giebel, S. 18).',
      formula: 'W_risalit ≈ W_wing ⇒ фронтон на ризалите',
      page: 'S. 18',
    };
  }
  return {
    status: 'ok',
    sourceStatus: 'explicit-verified',
    explanation: equalWidths
      ? 'Ризалит равной с крылом ширины отчётливо выделен фронтоном (S. 18).'
      : 'Ризалит и крыло достаточно дифференцированы по ширине (S. 18).',
    formula: 'W_risalit ≈ W_wing ⇒ Giebel',
    page: 'S. 18',
  };
}

// N27–N28 (S. 23): 5-этажные схемы (standard vs rich_1_2_unified)
export function checkFiveStoryScheme(
  scheme: FiveStoryScheme,
  floors: number,
  hMain: number,
  totalHeight: number,
  projectionBoost = 1.0
): SimpleRuleCheckResult {
  if (floors !== 5) {
    return {
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: `5-этажная схема применяется к 5-этажным зданиям (текущая этажность: ${floors}).`,
      formula: 'S. 23 (для 5 этажей)',
      page: 'S. 23',
    };
  }
  if (scheme === 'standard') {
    return {
      status: 'ok',
      sourceStatus: 'explicit-verified',
      explanation: 'Стандартная 5-этажная схема (S. 23): 1-й эт. = цоколь, 2–4 эт. = ствол, 5-й эт. + главный карниз = венчание.',
      formula: '1(цоколь) + 2..4(ствол) + 5+K(венец)',
      page: 'S. 23',
    };
  }
  // rich_1_2_unified: N27
  const modestCeiling = totalHeight > 0 ? totalHeight / 15 : hMain;
  const hModestOk = hMain <= modestCeiling + EPS;
  const boostOk = projectionBoost >= 1.2 - EPS;
  const status: ValidationStatus = hModestOk && boostOk ? 'ok' : 'approx';
  return {
    status,
    sourceStatus: boostOk ? 'heuristic' : 'explicit-verified',
    explanation:
      status === 'ok'
        ? `Богатый 5-этажный особняк (S. 23): 1+2 эт. объединены в нижний ярус, 3–5 эт. = ствол; главный карниз скромной высоты (${formatMeters(hMain)} м ≤ ${formatMeters(modestCeiling)} м) усилен выносом (×${formatMeters(projectionBoost, 2)} — UX-множитель).`
        : `Для богатого 5-этажного особняка (1+2 объединены, S. 23) рекомендуется сдержанная высота главного карниза (≤ ${formatMeters(modestCeiling)} м) при увеличенном выносе (×1.2 UX).`,
    formula: '1+2(низ) + 3..5(ствол) + K(невысокий, вынос ×1.2 UX)',
    page: 'S. 23',
  };
}

// ==================================================
// Сводная оценка фасада (§4.7)
// ==================================================

export type CompositionKind =
  | 'two_part_wing'
  | 'five_part'
  | 'seven_part'
  | 'two_side_risalits';

export interface FacadeParameters {
  buildingType: BuildingTypeId;
  buildingVariant: BuildingVariant;
  multiSub: MultiSub;
  axesCount: number;
  entrancePosition: EntrancePosition;
  hasEntrance: boolean;
  entrancePlacement: EntrancePlacement;
  entranceAxisIndex: number;
  entranceBottomM: number;
  entranceHeightM: number;
  entranceWidthM: number;
  corniceVariantMode: CorniceVariantMode;
  fiveStoryScheme: FiveStoryScheme;
  mainCorniceProjectionBoost: number;
  threeStoryGurtMode: ThreeStoryGurtMode;
  isEmbeddedInRow: boolean;
  // Поэтажная модель (Levels) и базовые размеры
  levels: BuildingLevelsInput;
  useFloorToFloorForBelt: boolean;
  allowModestFirstFloorForBelt: boolean;
  H: number;
  A: number;
  w: number;
  h: number;
  withFraming: boolean;
  u: number;
  hSill: number;
  hSillCornice: number;
  k_D: number;
  isRisalitCentered: boolean;
  risalitWidth: number;
  T: number;
  framingRatio: [number, number, number];
  withConsoles: boolean;
  a_front: number;
  a_side: number;
  Wp: number;
  v: number;
  pilasterCharacter: 'massive' | 'light';
  isMauerpfeiler: boolean;
  Tc: number;
  corniceRatio: number;
  plateShare: number;
  tolerance: number;
  diagTolerance: number;
  // Цоколь и иерархия
  floors: number;
  totalHeight: number;
  socleMode: SocleMode;
  hSocle: number;
  hMain: number;
  hGurt: number;
  socleParts: ThreePartSocleParts;
  hPlate: number;
  hOtherSum: number;
  hSocleRust: number;
  hEgRust: number;
  vSocleProfile: number;
  vEgProfile: number;
  hasKellerfenster: boolean;
  hasLisenen: boolean;
  rustRowHeight: number;
  useFullFloorAsSocle: boolean;
  // Межэтажные карнизы / ленты (Gurtgesims)
  beltMode: BeltMode;
  beltType: BeltClassType;
  beltUpperFloorHeight: number;
  beltCrowningRatio: number;
  beltEffect: BeltEffect;
  beltConsoleMode: BeltConsoleMode;
  beltHasColumnsBelow: boolean;
  beltAsRusticationMode: boolean;
  beltRusticationHasBaseProfile: boolean;
  beltIsAbsent: boolean;
  beltIsSillCornice: boolean;
  beltOnlySillUnderSecond: boolean;
  beltAlignsWithRecesses: boolean;
  // N4–N26 композиция, рустика, ордер и экспертные поля P3
  hasWallRustication: boolean;
  cornerRustRows: number;
  cornerOffsetM: number;
  upperStoryHeightN: number;
  hasCompositionBreakdown: boolean;
  compKind: CompositionKind;
  wCentralRisalit: number;
  wSideRisalit: number;
  wWing: number;
  pWing: number;
  centralRisalitAxes: number;
  wingAxes: number;
  middleAxesBetweenRisalits: number;
  risalitRichness: number;
  wingRichness: number;
  hasPilasterBetweenPairedWindows: boolean;
  pilasterAdjacentSameHeight: boolean;
  pilasterHeightDiffPct: number;
  pilastersOnlyOnUpperFloor: boolean;
  atticOverRisalit: boolean;
  atticOverWing: boolean;
  atticRisalitHeavier: boolean;
  // P3 (Экспертный режим)
  wpWallPier: number;
  hasPairedPilasters: boolean;
  pairedPilastersGap: number;
  columnProfileType: ColumnProfileType;
  pedimentType: PedimentType;
  pedimentClassical: boolean;
}

export interface SummaryCheckItem {
  id: string;
  title: string;
  page: string;
  formula: string;
  valueText: string;
  status: ValidationStatus;
  sourceStatus: SourceStatus;
  priority?: RulePriority;
  isExpertOnly?: boolean;
  explanation: string;
  isHeuristic?: boolean;
  targetElement: FacadeTargetElement;
}

export interface FacadeSummary {
  checks: SummaryCheckItem[];
  okCount: number;
  approxCount: number;
  violationCount: number;
  overallStatus: ValidationStatus;
  derivedGeometry: DerivedGeometry;
  variantInfo: VariantPresetMetadata;
  variantAxisCheck: VariantAxisCheckResult;
  facadeRectCheck: FacadeRectCheckResult;
  axesCountCheck: AxesCountCheckResult;
  ahCheck: RatioFromAHResult;
  pierResult: PierNoFrameResult | PierWithFrameResult;
  cornerCheck: CornerCheckResult;
  windowCheck: WindowCheckResult;
  framingWidthCheck: SimpleRuleCheckResult;
  sillPlateCheck: SimpleRuleCheckResult;
  sillCorniceCheck: SimpleRuleCheckResult;
  windowRowsCheck: SimpleRuleCheckResult & { courses: number };
  cornerRustRowsCheck: SimpleRuleCheckResult;
  cornerOffsetCheck: SimpleRuleCheckResult;
  fiveStorySchemeCheck: SimpleRuleCheckResult;
  framingResult: FramingResult;
  offsetCheck: OffsetCheckResult;
  pilasterCheck: PilasterCheckResult;
  corniceCheck: CorniceSplitResult;
  corniceChar: CorniceCharacter;
  // Проверки цоколя
  socleHeightCheck: SocleHeightResult;
  mainCorniceCheck: VariantMainCorniceResult;
  gurtCheck: VariantGurtCheckResult;
  threePartSocleResult: ThreePartSocleResult;
  plateCheck: PlateDominantResult;
  decreasingCheck: DecreasingUpwardResult;
  abkroepfungCheck: AbkroepfungResult;
  rusticationCheck: RusticationRowsResult;
  fullFloorSocleCheck: FullFloorAsSocleResult;
  // Проверки межэтажной ленты (Gurtgesims)
  beltHeightCheck: BeltHeightResult;
  beltCrowningCheck: BeltCrowningSplitResult;
  beltColumnsCheck: BeltColumnsResult;
  beltRusticationCheck: BeltRusticationResult;
  beltSpecialCheck: BeltSpecialCasesResult;
}

export function evaluateFacadeSummary(
  params: FacadeParameters,
  options: { expertMode?: boolean } = {}
): FacadeSummary {
  const { expertMode = false } = options;
  const variantInfo = getVariantPreset(params.buildingVariant, params.multiSub);
  const safeAxesCount = Math.max(1, Math.round(params.axesCount));
  const D = params.isRisalitCentered
    ? params.risalitWidth / 2
    : D_from_A(params.A, params.k_D);

  const derivedGeometry = computeDerivedGeometry(
    params.levels,
    params.A,
    D,
    safeAxesCount,
    params.hMain
  );

  // Используем поэтажную модель (если задана; обратная совместимость если передан totalHeight вручную)
  const effectiveHMax = derivedGeometry.H_max;
  const effectiveTotalHeight = derivedGeometry.totalHeight;
  const effectiveBeltFloorH = params.useFloorToFloorForBelt
    ? derivedGeometry.floor1FloorToFloor
    : effectiveHMax;
  const effectiveSocleH = params.useFullFloorAsSocle
    ? derivedGeometry.floor1FullHeight
    : params.hSocle;

  const ahCheck = ratio_from_AH(
    params.A,
    effectiveHMax,
    params.tolerance,
    params.buildingType
  );
  const variantAxisCheck = checkVariantAxisRatio(
    params.A,
    effectiveHMax,
    params.buildingVariant,
    params.multiSub,
    params.tolerance,
    params.buildingType
  );

  const effectiveU = params.withFraming ? params.u : 0;
  const pierNoFrame = p_from_Aw(params.A, params.w, params.buildingType);
  const pierWithFrame = pc_from_Awu(params.A, params.w, effectiveU, params.buildingType);
  const pierResult = params.withFraming ? pierWithFrame : pierNoFrame;

  const p_corner = p_corner_from_Dwu(D, params.w, effectiveU);
  const p_intermediate = params.withFraming ? pierWithFrame.p_c : pierNoFrame.p;
  const cornerCheck = check_corner(
    params.buildingType,
    p_corner,
    params.w,
    p_intermediate,
    params.k_D,
    D,
    params.isRisalitCentered
  );

  const facadeRectCheck = checkFacadeRectangle(
    derivedGeometry.facadeWidth,
    effectiveTotalHeight,
    params.buildingVariant,
    params.multiSub
  );
  const effectiveEntrancePos: EntrancePosition = !params.hasEntrance
    ? 'none'
    : params.entrancePosition;
  const axesCountCheck = checkAxesCount(
    safeAxesCount,
    params.buildingVariant,
    params.multiSub,
    params.isEmbeddedInRow,
    effectiveEntrancePos
  );

  const windowCheck = check_window(params.w, params.h, params.diagTolerance);
  const framingWidthCheck = checkFramingWidth(params.u, params.w);
  const sillPlateCheck = checkSillPlateHeight(params.hSill, params.w);
  const sillCorniceCheck = checkSillCorniceHeight(params.hSillCornice, effectiveU);
  const windowRowsCheck = checkWindowRows(
    params.h,
    params.rustRowHeight,
    params.hasWallRustication
  );
  const cornerRustRowsCheck = checkCornerRusticationRows(params.cornerRustRows);
  const cornerOffsetCheck = checkCornerOffsetVsUpperHeight(
    params.cornerOffsetM,
    params.upperStoryHeightN
  );

  const [r, f, k] = params.framingRatio;
  const framingResult = framing_from_T(params.T, r, f, k);
  const offsetCheck = check_offset(params.a_front, params.a_side);

  const pilasterCheck = check_pilaster(
    params.v,
    params.Wp,
    params.pilasterCharacter,
    params.isMauerpfeiler
  );

  const corniceCheck = cornice_split(params.Tc, params.corniceRatio);
  const corniceChar = cornice_character(params.plateShare);

  const socleHeightCheck = checkSocleHeight(effectiveSocleH, effectiveTotalHeight);
  const mainCorniceCheck = checkMainCorniceWithVariant(
    effectiveSocleH,
    params.hMain,
    effectiveTotalHeight,
    params.buildingVariant,
    params.multiSub,
    params.corniceVariantMode
  );
  const gurtCheck = checkGurtWithVariant(
    params.hGurt,
    effectiveBeltFloorH,
    effectiveSocleH,
    params.hMain,
    params.buildingVariant,
    params.multiSub,
    params.allowModestFirstFloorForBelt
  );
  const threePartSocleResult = threePartSocle(effectiveSocleH, params.socleParts);
  const plateCheck = plateDominant(params.hPlate, params.hOtherSum, 1.2);
  const decreasingCheck = decreasingUpward(
    params.hSocleRust,
    params.hEgRust,
    params.vSocleProfile,
    params.vEgProfile
  );
  const abkroepfungCheck = abkroepfungPreference(
    params.hasKellerfenster,
    params.hasLisenen
  );
  const rusticationCheck = rusticationRows(effectiveSocleH, params.rustRowHeight);
  const fullFloorSocleCheck = fullFloorAsSocle(
    derivedGeometry.floor1FullHeight,
    effectiveTotalHeight / 10
  );

  const fiveStorySchemeCheck = checkFiveStoryScheme(
    params.fiveStoryScheme,
    params.levels.floors.length,
    params.hMain,
    effectiveTotalHeight,
    params.mainCorniceProjectionBoost
  );

  const beltInput: BeltInput = {
    hLowerFloor: effectiveBeltFloorH,
    hUpperFloor: params.beltUpperFloorHeight,
    H_socle: effectiveSocleH,
    H_mainCornice: params.hMain,
    mode: params.beltMode,
    type: params.beltType,
    upperToLower: params.beltCrowningRatio,
    hasColumnsBelow: params.beltHasColumnsBelow,
    hasRustication: params.beltAsRusticationMode,
  };
  const beltMeta = BELT_CLASSES.find((c) => c.type === params.beltType) ?? BELT_CLASSES[2];
  const beltHeightCheck: BeltHeightResult =
    params.buildingVariant === 'one-story' ||
    params.levels.floors.length <= 1 ||
    params.beltIsAbsent
      ? {
          h: params.hGurt,
          range: [effectiveBeltFloorH / 12, effectiveBeltFloorH / 6],
          status: 'ok',
          notRequired: true,
          checks: {
            belowSocle: true,
            belowMain: true,
            inRange: true,
            note: null,
          },
          explanation: params.beltIsAbsent
            ? 'Лента отсутствует: смежные этажи читаются как единое целое.'
            : 'Для 1-этажного дома межэтажная лента не применяется.',
          formula: 'не применяется (1 этаж или лента отключена)',
          page: 'S. 16, 22',
        }
      : beltHeight(beltInput, params.hGurt, {
          allowModestLowerFloor: params.allowModestFirstFloorForBelt,
        });

  const beltCrownHeight = Math.max(0.05, params.hGurt * beltMeta.crownShareOfBelt);
  const beltCrowningCheck = beltCrowningSplit(
    beltCrownHeight,
    params.beltCrowningRatio,
    params.beltEffect,
    params.beltConsoleMode
  );
  const beltColumnsCheck =
    params.buildingVariant === 'one-story' ||
    params.levels.floors.length <= 1 ||
    params.beltIsAbsent
      ? beltWithColumns(params.hGurt, params.hMain, effectiveSocleH, false)
      : beltWithColumns(
          params.hGurt,
          params.hMain,
          effectiveSocleH,
          params.beltHasColumnsBelow
        );
  const beltRusticationCheck = beltAsRustication(
    params.beltRusticationHasBaseProfile,
    effectiveBeltFloorH
  );
  const beltSpecialCheck = checkBeltSpecialCases({
    variant: params.buildingVariant,
    multiSub: params.multiSub,
    floors: params.levels.floors.length,
    floorHeight: effectiveBeltFloorH,
    totalHeight: effectiveTotalHeight,
    isAbsent: params.beltIsAbsent,
    isSillCornice: params.beltIsSillCornice,
    onlySillUnderSecond: params.beltOnlySillUnderSecond,
    alignsWithRecesses: params.beltAlignsWithRecesses,
    hasRustication: params.beltAsRusticationMode,
    hasBaseProfile: params.beltRusticationHasBaseProfile,
    threeStoryGurtMode: params.threeStoryGurtMode,
  });

  const beltAggregateStatus = mergeStatuses(
    beltHeightCheck.status,
    beltCrowningCheck.status,
    beltColumnsCheck.status,
    beltSpecialCheck.status
  );

  const checks: SummaryCheckItem[] = [
    {
      id: 'axen_ratio',
      title: 'Шаг осей и высота комнаты (A : H_max)',
      page: ahCheck.page,
      formula: ahCheck.formula,
      valueText: `A = ${formatMeters(params.A)} м, A:H_max = ${formatMeters(ahCheck.ratio, 3)} (ближ. ${ahCheck.nearestAny.label})`,
      status: ahCheck.status,
      sourceStatus: ahCheck.sourceStatus,
      priority: 'P0',
      explanation: ahCheck.explanation,
      targetElement: 'axenweite',
    },
    {
      id: 'variant_axis_ratio',
      title: `Предел A/H_max по типологии и этажности`,
      page: variantAxisCheck.page,
      formula: variantAxisCheck.formula,
      valueText: `A:H_max = ${formatMeters(variantAxisCheck.ratio, 3)} (диапазон ${formatMeters(variantAxisCheck.range[0], 2)}…${formatMeters(variantAxisCheck.range[1], 3)})`,
      status: variantAxisCheck.status,
      sourceStatus: variantAxisCheck.sourceStatus,
      priority: 'P0',
      explanation: variantAxisCheck.explanation,
      isHeuristic: variantAxisCheck.isWideBayHeuristic,
      targetElement: 'axenweite',
    },
    {
      id: 'facade_rectangle',
      title: 'Пропорция прямоугольника фасада (лежачий / стоячий)',
      page: facadeRectCheck.page,
      formula: facadeRectCheck.formula,
      valueText: `W = ${formatMeters(facadeRectCheck.width, 2)} м, H_total = ${formatMeters(facadeRectCheck.height, 2)} м (W/H = ${formatMeters(facadeRectCheck.aspect, 2)})`,
      status: facadeRectCheck.status,
      sourceStatus: facadeRectCheck.sourceStatus,
      priority: 'P0',
      isHeuristic: facadeRectCheck.sourceStatus === 'heuristic',
      explanation: facadeRectCheck.explanation,
      targetElement: 'axenweite',
    },
    {
      id: 'axes_count',
      title: 'Число оконных осей и положение входа',
      page: axesCountCheck.page,
      formula: axesCountCheck.formula,
      valueText: `${axesCountCheck.axesCount} осей (${axesCountCheck.isOdd ? 'нечёт.' : 'чёт.'}, вход: ${params.entrancePosition})`,
      status: axesCountCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: axesCountCheck.explanation,
      targetElement: 'axenweite',
    },
    {
      id: 'pier_width',
      title: params.withFraming
        ? 'Чистый простенок с обрамлением (p_c ≥ w_v)'
        : 'Простенок без обрамления (p ≥ w)',
      page: 'S. 5',
      formula: pierResult.formula,
      valueText: params.withFraming
        ? `w_v = ${formatMeters(pierWithFrame.w_v)} м, p_c = ${formatMeters(pierWithFrame.p_c)} м`
        : `w = ${formatMeters(params.w)} м, p = ${formatMeters(pierNoFrame.p)} м`,
      status: pierResult.status,
      sourceStatus: pierResult.sourceStatus,
      priority: 'P0',
      explanation: pierResult.explanation,
      targetElement: params.withFraming ? 'framing_pier' : 'pier',
    },
    {
      id: 'corner_pier',
      title: 'Угловой простенок (D и p_corner)',
      page: cornerCheck.page,
      formula: cornerCheck.formula,
      valueText: `D = ${formatMeters(D)} м, p_corner = ${formatMeters(p_corner)} м`,
      status: cornerCheck.status,
      sourceStatus: cornerCheck.sourceStatus,
      priority: 'P0',
      explanation: cornerCheck.explanation,
      targetElement: 'corner',
    },
    {
      id: 'window_range',
      title: 'Пропорции окна (1.5w ≤ h ≤ 2w)',
      page: 'S. 6',
      formula: '1.5w ≤ h ≤ 2w',
      valueText: `w = ${formatMeters(params.w)} м, h = ${formatMeters(params.h)} м (h/w = ${formatMeters(windowCheck.ratio, 3)})`,
      status: windowCheck.rangeCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: windowCheck.rangeCheck.explanation,
      targetElement: 'window',
    },
    {
      id: 'window_diag',
      title: 'Правило половины диагонали (w ≤ d/2)',
      page: 'S. 7',
      formula: 'd = √(w² + h²); w ≤ d/2 (или приближения 3:5, 5:8…)',
      valueText: `d = ${formatMeters(windowCheck.diagCheck.d)} м, d/2 = ${formatMeters(windowCheck.diagCheck.halfD)} м`,
      status: windowCheck.diagCheck.status,
      sourceStatus: windowCheck.diagCheck.sourceStatus,
      priority: 'P0',
      explanation: windowCheck.diagCheck.explanation,
      isHeuristic: windowCheck.diagCheck.sourceStatus === 'heuristic',
      targetElement: 'window',
    },
    ...(params.withFraming
      ? [
          {
            id: 'n1_framing_width',
            title: 'N1: Ширина наличника u ∈ [w/6, w/5]',
            page: framingWidthCheck.page,
            formula: framingWidthCheck.formula,
            valueText: `u = ${formatMeters(params.u)} м (норма ${formatMeters(params.w / 6)}…${formatMeters(params.w / 5)} м)`,
            status: framingWidthCheck.status,
            sourceStatus: framingWidthCheck.sourceStatus,
            priority: 'P1' as RulePriority,
            explanation: framingWidthCheck.explanation,
            targetElement: 'framing_pier' as FacadeTargetElement,
          },
          {
            id: 'n2_sill_plate',
            title: 'N2: Подоконная плита h_sill ∈ [w/8, w/7]',
            page: sillPlateCheck.page,
            formula: sillPlateCheck.formula,
            valueText: `h_sill = ${formatMeters(params.hSill)} м`,
            status: sillPlateCheck.status,
            sourceStatus: sillPlateCheck.sourceStatus,
            priority: 'P1' as RulePriority,
            explanation: sillPlateCheck.explanation,
            targetElement: 'window' as FacadeTargetElement,
          },
          {
            id: 'framing_rfk',
            title: 'Сандрик окна (R : F : K и вынос)',
            page: 'S. 7–8',
            formula: params.withConsoles
              ? 'R:F:K; v_console = (5/6)·K'
              : 'R:F:K; v_proj = K (45°)',
            valueText: `R=${formatMeters(framingResult.R)}, F=${formatMeters(framingResult.F)}, K=${formatMeters(framingResult.K)} м`,
            status: framingResult.status,
            sourceStatus: 'explicit-verified' as SourceStatus,
            priority: 'P0' as RulePriority,
            explanation: framingResult.explanation,
            targetElement: 'entablature' as FacadeTargetElement,
          },
          ...(params.withConsoles
            ? [
                {
                  id: 'console_offset',
                  title: 'Отступ консоли до слезника (a_front = a_side)',
                  page: 'S. 8',
                  formula: 'a_front = a_side',
                  valueText: `a_front = ${formatMeters(params.a_front)} м, a_side = ${formatMeters(params.a_side)} м`,
                  status: offsetCheck.status,
                  sourceStatus: 'explicit-verified' as SourceStatus,
                  priority: 'P0' as RulePriority,
                  explanation: offsetCheck.explanation,
                  targetElement: 'entablature' as FacadeTargetElement,
                },
              ]
            : []),
        ]
      : []),
    {
      id: 'pilaster_check',
      title: 'Выступ пилястра / лопатки (v ≤ W_p/4)',
      page: 'S. 11–12',
      formula: pilasterCheck.formula,
      valueText: `W_p = ${formatMeters(params.Wp)} м, v = ${formatMeters(params.v)} м (v_max = ${formatMeters(pilasterCheck.v_max)} м)`,
      status: pilasterCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: pilasterCheck.explanation,
      targetElement: 'pilaster',
    },
    {
      id: 'cornice_split',
      title: 'Венчающий карниз (h_u : h_l)',
      page: 'S. 10–11',
      formula: corniceCheck.formula,
      valueText: `T_c = ${formatMeters(params.Tc)} м → h_u = ${formatMeters(corniceCheck.h_u)} м, h_l = ${formatMeters(corniceCheck.h_l)} м`,
      status: corniceCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: corniceCheck.explanation,
      targetElement: 'cornice',
    },
    {
      id: 'socle_height',
      title: 'Высота цоколя (1/10 … 1/6 общей высоты)',
      page: 'S. 16',
      formula: socleHeightCheck.formula,
      valueText: `h_socle = ${formatMeters(effectiveSocleH)} м (норма ${formatMeters(socleHeightCheck.range[0])}…${formatMeters(socleHeightCheck.range[1])} м)`,
      status: socleHeightCheck.status,
      sourceStatus: params.buildingVariant === 'one-story' ? 'gap' : 'explicit-verified',
      priority: 'P0',
      explanation: socleHeightCheck.explanation,
      isHeuristic: params.buildingVariant === 'one-story',
      targetElement: 'socle',
    },
    {
      id: 'main_cornice_subordination',
      title: 'Подчинённость главного карниза цоколю (h_main < h_socle)',
      page: 'S. 16',
      formula: mainCorniceCheck.formula,
      valueText: `h_main = ${formatMeters(params.hMain)} м vs h_socle = ${formatMeters(effectiveSocleH)} м`,
      status: mainCorniceCheck.status,
      sourceStatus: mainCorniceCheck.isExtrapolated ? 'gap' : 'explicit-verified',
      priority: 'P0',
      explanation: mainCorniceCheck.explanation,
      isHeuristic: mainCorniceCheck.isExtrapolated,
      targetElement: 'socle',
    },
    {
      id: 'gurt_cornice',
      title: 'Поясной карниз (Gurtgesims)',
      page: gurtCheck.page,
      formula: gurtCheck.formula,
      valueText: gurtCheck.notRequired
        ? 'Не требуется (1 этаж)'
        : `h_gurt = ${formatMeters(params.hGurt)} м (норма ${formatMeters(gurtCheck.range[0])}…${formatMeters(gurtCheck.range[1])} м)`,
      status: gurtCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: gurtCheck.explanation,
      targetElement: 'belt',
    },
    {
      id: 'socle_plate_dominant',
      title: 'Плита цоколя главная по высоте',
      page: 'S. 10',
      formula: plateCheck.formula,
      valueText: `h_plate = ${formatMeters(params.hPlate)} м / прочие = ${formatMeters(params.hOtherSum)} м (${Number.isFinite(plateCheck.ratio) ? formatMeters(plateCheck.ratio, 2) : '∞'}×)`,
      status: plateCheck.status,
      sourceStatus: 'heuristic',
      priority: 'P1',
      explanation: plateCheck.note,
      isHeuristic: true,
      targetElement: 'socle',
    },
    {
      id: 'socle_decreasing_upward',
      title: 'Убывание рустики и профилировки вверх',
      page: 'S. 10',
      formula: decreasingCheck.formula,
      valueText: `Руст: ${formatMeters(params.hEgRust)} < ${formatMeters(params.hSocleRust)} м; профиль: ${formatMeters(params.vEgProfile)} < ${formatMeters(params.vSocleProfile)} м`,
      status: decreasingCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: decreasingCheck.explanation,
      targetElement: 'socle',
    },
    {
      id: 'socle_rustication_rows',
      title: 'Ряды рустики цоколя (нечётность и 0.30–0.40 м)',
      page: 'S. 17',
      formula: rusticationCheck.formula,
      valueText: `n = ${rusticationCheck.n} (${rusticationCheck.oddPreferred ? 'нечёт.' : 'чёт.'}) × ${formatMeters(rusticationCheck.rowHeight)} м`,
      status: rusticationCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation: rusticationCheck.explanation,
      targetElement: 'socle',
    },
    {
      id: 'socle_abkroepfung',
      title: 'Раскреповки цокольного карниза',
      page: abkroepfungCheck.page,
      formula: abkroepfungCheck.formula,
      valueText:
        params.hasKellerfenster || params.hasLisenen
          ? 'С подвальными окнами / лопатками'
          : 'Сплошной прогон',
      status: abkroepfungCheck.status,
      sourceStatus: 'explicit-verified',
      priority: 'P1',
      explanation: abkroepfungCheck.note,
      targetElement: 'socle',
    },
    {
      id: 'belt_crowning_and_special',
      title: 'Межэтажная лента: профиль венца, опоры и спецслучаи',
      page: 'S. 10–11, 16–17, 22',
      formula: beltSpecialCheck.formula,
      valueText: `Класс ${params.beltType} (${params.beltMode === 'binding' ? 'связ.' : 'венч.'}), h_в:h_н = ${formatMeters(params.beltCrowningRatio, 2)}:1`,
      status: beltAggregateStatus,
      sourceStatus: 'explicit-verified',
      priority: 'P0',
      explanation:
        beltSpecialCheck.status !== 'ok'
          ? beltSpecialCheck.explanation
          : beltColumnsCheck.status === 'violation'
            ? beltColumnsCheck.explanation
            : beltHeightCheck.status !== 'ok'
              ? beltHeightCheck.explanation
              : beltCrowningCheck.explanation,
      targetElement: 'belt',
    },
    ...(params.beltIsSillCornice
      ? [
          {
            id: 'n3_sill_cornice_over_u',
            title: 'N3: Высота сплошного подоконного пояса (> u)',
            page: sillCorniceCheck.page,
            formula: sillCorniceCheck.formula,
            valueText: `h_подокон. = ${formatMeters(params.hSillCornice)} м vs u = ${formatMeters(effectiveU)} м`,
            status: sillCorniceCheck.status,
            sourceStatus: sillCorniceCheck.sourceStatus,
            priority: 'P1' as RulePriority,
            explanation: sillCorniceCheck.explanation,
            targetElement: 'belt' as FacadeTargetElement,
          },
        ]
      : []),
    ...(params.levels.floors.length === 5
      ? [
          {
            id: 'n27_five_story_scheme',
            title: 'N27–N28: Схема 5-этажного дома (S. 23)',
            page: fiveStorySchemeCheck.page,
            formula: fiveStorySchemeCheck.formula,
            valueText:
              params.fiveStoryScheme === 'rich_1_2_unified'
                ? `1+2 объед., вынос ×${formatMeters(params.mainCorniceProjectionBoost, 2)}`
                : 'Стандарт (1 / 2–4 / 5+K)',
            status: fiveStorySchemeCheck.status,
            sourceStatus: fiveStorySchemeCheck.sourceStatus,
            priority: 'P1' as RulePriority,
            isHeuristic: fiveStorySchemeCheck.sourceStatus === 'heuristic',
            explanation: fiveStorySchemeCheck.explanation,
            targetElement: 'socle' as FacadeTargetElement,
          },
        ]
      : []),
    ...(params.hasWallRustication
      ? [
          {
            id: 'n4_window_rust_rows',
            title: 'N4: Кратность окна рядам руста (7–8 рядов)',
            page: windowRowsCheck.page,
            formula: windowRowsCheck.formula,
            valueText: `${formatMeters(windowRowsCheck.courses, 1)} ряд.`,
            status: windowRowsCheck.status,
            sourceStatus: windowRowsCheck.sourceStatus,
            priority: 'P2' as RulePriority,
            explanation: windowRowsCheck.explanation,
            targetElement: 'window' as FacadeTargetElement,
          },
        ]
      : []),
    {
      id: 'n5_corner_rust_rows',
      title: 'N5: Нечётное число рядов угловой рустовки',
      page: cornerRustRowsCheck.page,
      formula: cornerRustRowsCheck.formula,
      valueText: `n_угл = ${params.cornerRustRows}`,
      status: cornerRustRowsCheck.status,
      sourceStatus: cornerRustRowsCheck.sourceStatus,
      priority: 'P2',
      explanation: cornerRustRowsCheck.explanation,
      targetElement: 'corner',
    },
    {
      id: 'n6_corner_offset_m_n',
      title: 'N6: Отступ угла M и верхняя высота N (рис. 7)',
      page: cornerOffsetCheck.page,
      formula: cornerOffsetCheck.formula,
      valueText: `M = ${formatMeters(params.cornerOffsetM, 2)} м ≤ N = ${formatMeters(params.upperStoryHeightN, 2)} м`,
      status: cornerOffsetCheck.status,
      sourceStatus: cornerOffsetCheck.sourceStatus,
      priority: 'P2',
      isHeuristic: cornerOffsetCheck.sourceStatus === 'heuristic',
      explanation: cornerOffsetCheck.explanation,
      targetElement: 'corner',
    },
  ];

  // N8–N26 при включённой композиции крыльев / ризалитов
  if (params.hasCompositionBreakdown) {
    const n8 = checkWingPierWidth(params.pWing, p_corner);
    const n9 = checkSideRisalitWidth(params.wSideRisalit, params.wCentralRisalit);
    const n10 = checkWingVsSideRisalit(params.wWing, params.wSideRisalit);
    const n13 = checkMiddleVsSideRisalit(params.wWing, params.wSideRisalit);
    const n14 = checkCentralRisalitAxes(params.centralRisalitAxes);
    const n15 = checkWingAxes(params.wingAxes);
    const n16 = checkPilasterBetweenWindowPairs(params.hasPilasterBetweenPairedWindows);
    const n17 = checkMiddleAxesInTwoSideRisalits(params.middleAxesBetweenRisalits);
    const n23 = checkAttic(
      params.atticOverRisalit,
      params.atticOverWing,
      params.atticRisalitHeavier
    );
    const n25 = checkRisalitRichness(
      params.risalitRichness,
      params.wingRichness,
      params.compKind === 'two_side_risalits'
    );

    checks.push(
      {
        id: 'n8_wing_pier',
        title: 'N8: Простенок крыла (p_wing ≤ p_corner)',
        page: n8.page,
        formula: n8.formula,
        valueText: `p_wing = ${formatMeters(params.pWing)} м ≤ p_corner = ${formatMeters(p_corner)} м`,
        status: n8.status,
        sourceStatus: n8.sourceStatus,
        priority: 'P2',
        explanation: n8.explanation,
        targetElement: 'corner',
      },
      {
        id: 'n9_side_risalit',
        title: 'N9: Боковой ризалит ≤ 2/3 центрального',
        page: n9.page,
        formula: n9.formula,
        valueText: `W_side = ${formatMeters(params.wSideRisalit, 2)} м / W_cent = ${formatMeters(params.wCentralRisalit, 2)} м`,
        status: n9.status,
        sourceStatus: n9.sourceStatus,
        priority: 'P2',
        explanation: n9.explanation,
        targetElement: 'axenweite',
      },
      {
        id: 'n10_wing_vs_side',
        title: 'N10/N13: Ширина крыла vs боковой ризалит',
        page: params.compKind === 'two_side_risalits' ? n13.page : n10.page,
        formula: params.compKind === 'two_side_risalits' ? n13.formula : n10.formula,
        valueText: `W_wing = ${formatMeters(params.wWing, 2)} м, W_side = ${formatMeters(params.wSideRisalit, 2)} м`,
        status: params.compKind === 'two_side_risalits' ? n13.status : n10.status,
        sourceStatus: 'explicit-verified',
        priority: 'P2',
        explanation: params.compKind === 'two_side_risalits' ? n13.explanation : n10.explanation,
        targetElement: 'axenweite',
      },
      {
        id: 'n14_n15_comp_axes',
        title: 'N14–N15: Оси центрального ризалита и крыла',
        page: 'S. 18–19',
        formula: 'оси ризалита и крыльев (нечётные предпочтительны)',
        valueText: `Центр: ${params.centralRisalitAxes} ос., крыло: ${params.wingAxes} ос.`,
        status: mergeStatuses(n14.status, n15.status),
        sourceStatus: 'explicit-verified',
        priority: 'P2',
        explanation: `${n14.explanation} ${n15.explanation}`,
        targetElement: 'axenweite',
      },
      {
        id: 'n16_pilaster_pairs',
        title: 'N16: Пилястр между парой окон в ризалите',
        page: n16.page,
        formula: n16.formula,
        valueText: params.hasPilasterBetweenPairedWindows ? 'Присутствует (запрещено)' : 'Нет',
        status: n16.status,
        sourceStatus: n16.sourceStatus,
        priority: 'P2',
        explanation: n16.explanation,
        targetElement: 'pilaster',
      },
      ...(params.compKind === 'two_side_risalits'
        ? [
            {
              id: 'n17_middle_axes',
              title: 'N17: Оси в западающей середине (между 2 бок. ризалитами)',
              page: n17.page,
              formula: n17.formula,
              valueText: `${params.middleAxesBetweenRisalits} ос.`,
              status: n17.status,
              sourceStatus: n17.sourceStatus,
              priority: 'P2' as RulePriority,
              explanation: n17.explanation,
              targetElement: 'axenweite' as FacadeTargetElement,
            },
          ]
        : []),
      {
        id: 'n23_attic',
        title: 'N23: Аттик над ризалитом и крыльями',
        page: n23.page,
        formula: n23.formula,
        valueText: params.atticOverRisalit
          ? params.atticOverWing
            ? 'Над всем корпусом'
            : 'Только над ризалитом'
          : 'Без аттика',
        status: n23.status,
        sourceStatus: n23.sourceStatus,
        priority: 'P2',
        explanation: n23.explanation,
        targetElement: 'cornice',
      },
      {
        id: 'n25_risalit_richness',
        title: 'N25: Богатство отделки ризалита vs крыла',
        page: n25.page,
        formula: n25.formula,
        valueText: `Ризалит ${params.risalitRichness} vs крыло ${params.wingRichness}`,
        status: n25.status,
        sourceStatus: n25.sourceStatus,
        priority: 'P2',
        explanation: n25.explanation,
        targetElement: 'cornice',
      }
    );

    if (params.compKind === 'five_part') {
      const n11 = checkFivePartFacade(
        params.wCentralRisalit,
        params.wSideRisalit,
        params.wWing,
        params.risalitRichness,
        1,
        params.wingRichness
      );
      checks.push({
        id: 'n11_five_part',
        title: 'N11: 5-частная композиция (рис. 9)',
        page: n11.page,
        formula: n11.formula,
        valueText: `Ц=${formatMeters(params.wCentralRisalit, 1)} > Б=${formatMeters(params.wSideRisalit, 1)} < К=${formatMeters(params.wWing, 1)}`,
        status: n11.status,
        sourceStatus: n11.sourceStatus,
        priority: 'P2',
        explanation: n11.explanation,
        targetElement: 'axenweite',
      });
    } else if (params.compKind === 'seven_part') {
      const n12 = checkSevenPartFacade([
        params.wSideRisalit * 0.5,
        params.wWing,
        params.wCentralRisalit,
        params.wWing,
        params.wSideRisalit * 0.5,
      ]);
      checks.push({
        id: 'n12_seven_part',
        title: 'N12: 7-частная композиция 1.5:3:5:3:1.5 (рис. 10)',
        page: n12.page,
        formula: n12.formula,
        valueText: `К=${formatMeters(params.wWing, 1)} : Ц=${formatMeters(params.wCentralRisalit, 1)}`,
        status: n12.status,
        sourceStatus: n12.sourceStatus,
        priority: 'P2',
        isHeuristic: n12.sourceStatus === 'heuristic',
        explanation: n12.explanation,
        targetElement: 'axenweite',
      });
    }
  }

  // N18–N19 (P2): многоярусное размещение пилястр
  if (params.pilasterAdjacentSameHeight || params.pilastersOnlyOnUpperFloor) {
    const n18 = checkPilasterRepetition(
      params.pilasterAdjacentSameHeight,
      params.pilasterHeightDiffPct
    );
    const n19 = checkPilastersOnlyUpper(params.pilastersOnlyOnUpperFloor);
    if (params.pilasterAdjacentSameHeight) {
      checks.push({
        id: 'n18_pilaster_repetition',
        title: 'N18: Повторение пилястр в смежных этажах',
        page: n18.page,
        formula: n18.formula,
        valueText: `ΔH = ${(params.pilasterHeightDiffPct * 100).toFixed(0)} %`,
        status: n18.status,
        sourceStatus: n18.sourceStatus,
        priority: 'P2',
        isHeuristic: true,
        explanation: n18.explanation,
        targetElement: 'pilaster',
      });
    }
    if (params.pilastersOnlyOnUpperFloor) {
      checks.push({
        id: 'n19_pilaster_only_upper',
        title: 'N19: Пилястры только на верхнем этаже',
        page: n19.page,
        formula: n19.formula,
        valueText: 'Только верхний ярус',
        status: n19.status,
        sourceStatus: n19.sourceStatus,
        priority: 'P2',
        explanation: n19.explanation,
        targetElement: 'pilaster',
      });
    }
  }

  // P3 (Экспертный режим): N20, N21, N22, N24, N26 — отображаются при expertMode === true (или в полном отчёте)
  if (expertMode) {
    const n20 = checkPilasterNarrowerThanWallPier(params.Wp, params.wpWallPier);
    checks.push({
      id: 'n20_pilaster_vs_wall',
      title: 'N20 (Эксперт): Пилястр уже простенка стены',
      page: n20.page,
      formula: n20.formula,
      valueText: `W_p = ${formatMeters(params.Wp)} < W_стены = ${formatMeters(params.wpWallPier)} м`,
      status: n20.status,
      sourceStatus: n20.sourceStatus,
      priority: 'P3',
      isExpertOnly: true,
      explanation: n20.explanation,
      targetElement: 'pilaster',
    });

    if (params.hasPairedPilasters) {
      const n21 = checkPairedPilastersGap(params.pairedPilastersGap, params.Wp);
      checks.push({
        id: 'n21_paired_pilasters_gap',
        title: 'N21 (Эксперт): Просвет спаренных пилястр',
        page: n21.page,
        formula: n21.formula,
        valueText: `gap = ${formatMeters(params.pairedPilastersGap)} м`,
        status: n21.status,
        sourceStatus: n21.sourceStatus,
        priority: 'P3',
        isExpertOnly: true,
        explanation: n21.explanation,
        targetElement: 'pilaster',
      });
    }

    if (params.columnProfileType !== 'none') {
      const n22 = checkColumnProfileType(params.columnProfileType);
      checks.push({
        id: 'n22_column_profile',
        title: 'N22 (Эксперт): Тип пристенной колонны',
        page: n22.page,
        formula: n22.formula,
        valueText: params.columnProfileType,
        status: n22.status,
        sourceStatus: n22.sourceStatus,
        priority: 'P3',
        isExpertOnly: true,
        explanation: n22.explanation,
        targetElement: 'pilaster',
      });
    }

    if (params.pedimentType !== 'none' || params.hasCompositionBreakdown) {
      const n24 = checkPedimentChoice(params.pedimentType, params.pedimentClassical);
      const n26 = checkEqualWidthRisalitWingPediment(
        params.wCentralRisalit,
        params.wWing,
        params.pedimentType !== 'none'
      );
      checks.push({
        id: 'n24_n26_pediment',
        title: 'N24/N26 (Эксперт): Фронтон (Giebel) на ризалите',
        page: n24.page,
        formula: n24.formula,
        valueText: `Фронтон: ${params.pedimentType}`,
        status: mergeStatuses(n24.status, params.hasCompositionBreakdown ? n26.status : 'ok'),
        sourceStatus: 'explicit-verified',
        priority: 'P3',
        isExpertOnly: true,
        explanation: params.hasCompositionBreakdown ? `${n24.explanation} ${n26.explanation}` : n24.explanation,
        targetElement: 'cornice',
      });
    }
  }

  const okCount = checks.filter((c) => c.status === 'ok').length;
  const approxCount = checks.filter((c) => c.status === 'approx').length;
  const violationCount = checks.filter((c) => c.status === 'violation').length;
  const overallStatus: ValidationStatus =
    violationCount > 0 ? 'violation' : approxCount > 0 ? 'approx' : 'ok';

  return {
    checks,
    okCount,
    approxCount,
    violationCount,
    overallStatus,
    derivedGeometry,
    variantInfo,
    variantAxisCheck,
    facadeRectCheck,
    axesCountCheck,
    ahCheck,
    pierResult,
    cornerCheck,
    windowCheck,
    framingWidthCheck,
    sillPlateCheck,
    sillCorniceCheck,
    windowRowsCheck,
    cornerRustRowsCheck,
    cornerOffsetCheck,
    fiveStorySchemeCheck,
    framingResult,
    offsetCheck,
    pilasterCheck,
    corniceCheck,
    corniceChar,
    socleHeightCheck,
    mainCorniceCheck,
    gurtCheck,
    threePartSocleResult,
    plateCheck,
    decreasingCheck,
    abkroepfungCheck,
    rusticationCheck,
    fullFloorSocleCheck,
    beltHeightCheck,
    beltCrowningCheck,
    beltColumnsCheck,
    beltRusticationCheck,
    beltSpecialCheck,
  };
}

export function applyBuildingVariantPreset(
  prev: FacadeParameters,
  variant: BuildingVariant,
  multiSub: MultiSub = prev.multiSub
): Partial<FacadeParameters> {
  const preset = getVariantPreset(variant, multiSub);
  const floors = preset.defaultFloors;

  const { range: [axMin, axMax] } = allowedAxisRatio(prev.buildingType, variant, multiSub);
  let A = prev.A;
  const currentRatio = prev.H > 0 ? prev.A / prev.H : 0.8;
  if (currentRatio > axMax) {
    A = prev.H * Math.min(axMax, 0.8);
  } else if (currentRatio < axMin) {
    A = prev.H * axMin;
  }

  // P0-6: настоящая поэтажная геометрия без эвристики H * 0.96
  const groundToFloor1 =
    variant === 'one-story' ? 0.9 : variant === 'two-story' ? 1.45 : 1.35;
  const levels = buildDefaultLevels(floors, prev.H, groundToFloor1);
  const sumFloors = levels.floors.reduce((acc, f) => acc + f.floorToFloor, 0);
  const wallTop = levels.groundToFloor1 + sumFloors;

  const mainShare =
    preset.rules.mainCornice === 'extrapolated'
      ? 0.1
      : (preset.rules.mainCornice.min + preset.rules.mainCornice.max) / 2;
  const crowningShare =
    preset.rules.crowning === 'extrapolated'
      ? 0.065
      : (preset.rules.crowning.min + preset.rules.crowning.max) / 2;
  const activeMainShare =
    prev.corniceVariantMode === 'crowning_only' ? crowningShare : mainShare;

  const totalHeight = wallTop / (1 - activeMainShare);
  const hMain = totalHeight * activeMainShare;
  const hSocle = totalHeight / 6;
  const updatedGround =
    variant === 'one-story' ? Math.max(0.8, hSocle) : Math.max(1.1, hSocle * 0.72);
  const alignedLevels = buildDefaultLevels(floors, prev.H, updatedGround);
  const alignedWall =
    alignedLevels.groundToFloor1 +
    alignedLevels.floors.reduce((acc, f) => acc + f.floorToFloor, 0);
  const alignedTotalHeight = alignedWall / (1 - activeMainShare);
  const alignedHMain = alignedTotalHeight * activeMainShare;
  const alignedHSocle = alignedTotalHeight / 6;

  const floor1F2F = alignedLevels.floors[0]?.floorToFloor ?? prev.H + 0.35;
  const hGurt =
    preset.rules.gurt === null ? 0 : Math.min(floor1F2F / 9, alignedHMain * 0.65);

  const axesCount = variant === 'one-story' || variant === 'two-story' ? 5 : 3;
  const isMiethausFourFive =
    variant === 'multi-story' && multiSub === 'four-five' && prev.buildingType === 'miethaus';

  // §5.4: isEmbeddedInRow по умолчанию true только для urban_house и miethaus
  const isEmbeddedInRow =
    prev.buildingType === 'urban_house' || prev.buildingType === 'miethaus';

  return {
    buildingVariant: variant,
    multiSub,
    floors,
    levels: alignedLevels,
    A,
    axesCount,
    entrancePosition:
      axesCount % 2 === 1 ? 'center' : isEmbeddedInRow ? 'right' : 'center',
    hasEntrance: true,
    entrancePlacement:
      axesCount % 2 === 1 ? 'facade_center' : isEmbeddedInRow ? 'axis' : 'facade_center',
    entranceAxisIndex:
      axesCount % 2 === 1 ? Math.floor(axesCount / 2) : Math.max(0, axesCount - 1),
    totalHeight: alignedTotalHeight,
    hSocle: alignedHSocle,
    hMain: alignedHMain,
    hGurt,
    rustRowHeight: Math.min(0.4, Math.max(0.3, alignedHSocle / 5)),
    useFullFloorAsSocle: isMiethausFourFive,
    isEmbeddedInRow,
    beltIsAbsent: variant === 'one-story',
    beltIsSillCornice: false,
    beltOnlySillUnderSecond: false,
    beltUpperFloorHeight: alignedLevels.floors[1]?.floorToFloor ?? prev.H + 0.35,
  };
}

export function createDefaultParamsForTypology(type: BuildingTypeId): FacadeParameters {
  const preset = getTypology(type);
  const d = preset.defaults;
  const A = A_from_H(d.H, d.ratioN, d.ratioM);

  const buildingVariant: BuildingVariant =
    type === 'simple_house' || type === 'villa' || type === 'monumental'
      ? 'two-story'
      : 'multi-story';
  const multiSub: MultiSub =
    type === 'miethaus' ? 'four-five' : type === 'urban_house' ? 'three' : 'general';
  const variantMeta = getVariantPreset(buildingVariant, multiSub);
  const floors = variantMeta.defaultFloors;
  const useFullFloorAsSocle = type === 'miethaus';
  const isEmbeddedInRow = type === 'urban_house' || type === 'miethaus';

  const groundInitial = useFullFloorAsSocle
    ? 0.45
    : buildingVariant === 'two-story'
      ? 1.35
      : 1.45;
  const levels = buildDefaultLevels(floors, d.H, groundInitial);
  const mainShare =
    variantMeta.rules.mainCornice === 'extrapolated'
      ? 0.1
      : (variantMeta.rules.mainCornice.min + variantMeta.rules.mainCornice.max) / 2;

  const wallTop =
    levels.groundToFloor1 + levels.floors.reduce((acc, f) => acc + f.floorToFloor, 0);
  const totalHeight = wallTop / (1 - mainShare);
  const hMain = totalHeight * mainShare;
  const hSocle = totalHeight / 6;

  const finalLevels = useFullFloorAsSocle
    ? levels
    : buildDefaultLevels(floors, d.H, Math.min(2.2, Math.max(1.1, hSocle * 0.78)));
  const finalWallTop =
    finalLevels.groundToFloor1 +
    finalLevels.floors.reduce((acc, f) => acc + f.floorToFloor, 0);
  const finalTotalHeight = finalWallTop / (1 - mainShare);
  const finalHMain = finalTotalHeight * mainShare;
  const finalHSocle = finalTotalHeight / 6;

  const floor1F2F = finalLevels.floors[0]?.floorToFloor ?? d.H + 0.35;
  const hGurt = Math.min(floor1F2F / 9, finalHMain * 0.65);
  const rustRowHeight = Math.min(0.4, Math.max(0.3, finalHSocle / 5));

  const effectiveU = d.u > 0 ? d.u : Number(((d.w / 6 + d.w / 5) / 2).toFixed(3));
  const hSill = Number(((d.w / 8 + d.w / 7) / 2).toFixed(3));

  const defaultAxesCount = buildingVariant === 'two-story' ? 5 : 3;
  return {
    buildingType: type,
    buildingVariant,
    multiSub,
    axesCount: defaultAxesCount,
    entrancePosition: 'center',
    hasEntrance: true,
    entrancePlacement: 'facade_center',
    entranceAxisIndex: Math.floor(defaultAxesCount / 2),
    entranceBottomM: 0,
    entranceHeightM: Number(Math.max(2.1, Math.min(3.0, d.H * 0.66)).toFixed(2)),
    entranceWidthM: Number(Math.max(1.0, d.w * 1.05).toFixed(2)),
    corniceVariantMode: 'full_entablature',
    fiveStoryScheme: type === 'miethaus' ? 'standard' : 'rich_1_2_unified',
    mainCorniceProjectionBoost: type === 'miethaus' ? 1.0 : 1.2,
    threeStoryGurtMode: 'both_gurt',
    isEmbeddedInRow,
    levels: finalLevels,
    useFloorToFloorForBelt: true,
    allowModestFirstFloorForBelt: true,
    H: d.H,
    A,
    w: d.w,
    h: d.h,
    withFraming: d.u > 0,
    u: effectiveU,
    hSill,
    hSillCornice: Number(Math.max(effectiveU + 0.04, 0.24).toFixed(3)),
    k_D: d.k_D,
    isRisalitCentered: false,
    risalitWidth: 5.0,
    T: d.T,
    framingRatio: [6, 7, 8],
    withConsoles: false,
    a_front: 0.06,
    a_side: 0.06,
    Wp: d.Wp,
    v: d.v,
    pilasterCharacter: type === 'monumental' || type === 'palace' ? 'massive' : 'light',
    isMauerpfeiler: type === 'simple_house',
    Tc: d.Tc,
    corniceRatio: 1,
    plateShare: type === 'monumental' || type === 'palace' ? 0.78 : 0.55,
    tolerance: 0.03,
    diagTolerance: 0.07,
    floors,
    totalHeight: finalTotalHeight,
    socleMode: 'optimal',
    hSocle: finalHSocle,
    hMain: finalHMain,
    hGurt,
    socleParts: { fuss: 0.25, rumpf: 0.55, deck: 0.2 },
    hPlate: 0.16,
    hOtherSum: 0.12,
    hSocleRust: 0.35,
    hEgRust: 0.28,
    vSocleProfile: 0.06,
    vEgProfile: 0.035,
    hasKellerfenster: false,
    hasLisenen: false,
    rustRowHeight,
    useFullFloorAsSocle,
    beltMode: type === 'palace' || type === 'rich_columnar' ? 'crowning' : 'binding',
    beltType:
      type === 'palace' || type === 'rich_columnar'
        ? 4
        : type === 'simple_house'
          ? 1
          : 3,
    beltUpperFloorHeight: finalLevels.floors[1]?.floorToFloor ?? d.H + 0.35,
    beltCrowningRatio: 1.0,
    beltEffect: type === 'monumental' || type === 'palace' ? 'heavy' : 'neutral',
    beltConsoleMode: 'none',
    beltHasColumnsBelow: type === 'palace' || type === 'rich_columnar',
    beltAsRusticationMode: false,
    beltRusticationHasBaseProfile: true,
    beltIsAbsent: false,
    beltIsSillCornice: false,
    beltOnlySillUnderSecond: false,
    beltAlignsWithRecesses: true,
    hasWallRustication: false,
    cornerRustRows: 5,
    cornerOffsetM: 0.45,
    upperStoryHeightN: d.H,
    hasCompositionBreakdown: false,
    compKind: 'five_part',
    wCentralRisalit: 7.5,
    wSideRisalit: 4.5,
    wWing: 9.0,
    pWing: 1.1,
    centralRisalitAxes: 3,
    wingAxes: 3,
    middleAxesBetweenRisalits: 3,
    risalitRichness: 2,
    wingRichness: 1,
    hasPilasterBetweenPairedWindows: false,
    pilasterAdjacentSameHeight: false,
    pilasterHeightDiffPct: 0.18,
    pilastersOnlyOnUpperFloor: false,
    atticOverRisalit: false,
    atticOverWing: false,
    atticRisalitHeavier: true,
    wpWallPier: Number(Math.max(d.Wp + 0.28, 0.9).toFixed(2)),
    hasPairedPilasters: false,
    pairedPilastersGap: Number((d.Wp * 0.5).toFixed(3)),
    columnProfileType: 'none',
    pedimentType: 'none',
    pedimentClassical: true,
  };
}
