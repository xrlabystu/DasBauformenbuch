import rulesDataJson from './rulesData.json';

export type ValidationStatus = 'ok' | 'approx' | 'violation';

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
  deviation: number; // относительное отклонение (доля)
  status: ValidationStatus;
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

  // Выделяем ориентировочное целое отношение
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
    explanation,
    formula: 'A / H = n / m',
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
    status = 'approx';
    explanation = `Простенок p = ${formatMeters(p)} м < w (${formatMeters(w)} м). По источнику (S. 5) для богатой колонно-пилястровой архитектуры проём допустимо делать шире промежуточного простенка.`;
  } else {
    status = 'violation';
    explanation = `Нарушение p ≥ w: простенок p = ${formatMeters(p)} м меньше ширины окна w = ${formatMeters(w)} м (минимальный шаг A_min = ${formatMeters(2 * w)} м).`;
  }

  return {
    p,
    check,
    status,
    explanation,
    formula: 'p = A − w; проверка: p ≥ w',
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
    status = 'approx';
    explanation = `Чистый простенок p_c = ${formatMeters(p_c)} м < w_v (${formatMeters(w_v)} м). Для колонно-пилястровой архитектуры допустимо преобладание проёма над промежуточным простенком (S. 5).`;
  } else {
    status = 'violation';
    explanation = `Нарушение p_c ≥ w_v: чистый простенок p_c = ${formatMeters(p_c)} м меньше ширины проёма с обрамлением w_v = ${formatMeters(w_v)} м (требуется A ≥ ${formatMeters(A_min_from_wu(w, u))} м).`;
  }

  return {
    w_v,
    p_c,
    check,
    status,
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
    // urban_house, miethaus, rich_columnar
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
    const target = item.m / item.n; // h / w
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
  ratio: number; // h / w
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
    deviationPct: number; // (w - d/2) / (d/2) или 0 если w <= d/2
    rawShortfallPct: number; // (w - d/2) / w
    status: ValidationStatus;
    explanation: string;
  };
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function check_window(w: number, h: number, tolerance = 0.05): WindowCheckResult {
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
  const shortfall = Math.max(0, w - halfD);
  // Для 3:5: w=1, h=5/3 => d/2 = 0.971825 => (w - d/2)/(d/2) ≈ 0.02899 (2.9 %), (w - d/2)/w ≈ 0.02817 (2.8 %)
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
  } else if (deviationPct <= tolerance + EPS) {
    diagStatus = 'approx';
    diagExplanation = `Практическое приближение (S. 7): половина диагонали d/2 = ${formatMeters(halfD)} м чуть меньше ширины w = ${formatMeters(w)} м (отклонение ${(deviationPct * 100).toFixed(1)} %, в пределах допуска ${(tolerance * 100).toFixed(0)} %).`;
  } else {
    diagStatus = 'violation';
    diagExplanation = `Половина диагонали d/2 = ${formatMeters(halfD)} м меньше w = ${formatMeters(w)} м на ${(deviationPct * 100).toFixed(1)} % (превышает допуск ${(tolerance * 100).toFixed(0)} %).`;
  }

  let status: ValidationStatus = 'ok';
  if (rangeStatus === 'violation') {
    status = 'violation';
  } else if (diagStatus === 'violation') {
    status = 'violation';
  } else if (diagStatus === 'approx') {
    status = 'approx';
  }

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
      deviationPct,
      rawShortfallPct,
      status: diagStatus,
      explanation: diagExplanation,
    },
    status,
    explanation,
    formula: '1.5w ≤ h ≤ 2w; d = √(w² + h²); проверка w ≤ d/2',
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
  // plateShare в диапазоне 0..1 (или процентах, нормализуем при > 1)
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

export function checkGurt(
  hGurt: number,
  floorHeight: number,
  hSocle: number,
  hMain: number
): GurtCheckResult {
  const range: [number, number] = [floorHeight / 12, floorHeight / 6];
  const inRange = hGurt >= range[0] - EPS && hGurt <= range[1] + EPS;
  const belowMain = hGurt < hMain - EPS;
  const belowSocle = hGurt < hSocle - EPS;

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!belowMain || !belowSocle) {
    status = 'violation';
    explanation = `Нарушение иерархии (S. 16): поясной карниз h_gurt = ${formatMeters(hGurt)} м должен быть меньше и главного карниза (${formatMeters(hMain)} м), и цоколя (${formatMeters(hSocle)} м).`;
  } else if (inRange) {
    status = 'ok';
    explanation = `Поясной карниз (Gurtgesims) h_gurt = ${formatMeters(hGurt)} м входит в диапазон 1/12…1/6 высоты этажа ([${formatMeters(range[0])}, ${formatMeters(range[1])}] м) и подчинён главному карнизу и цоколю.`;
  } else {
    status = hGurt < range[0] ? 'approx' : 'violation';
    explanation =
      hGurt < range[0]
        ? `Поясной карниз h_gurt = ${formatMeters(hGurt)} м меньше 1/12 этажа (${formatMeters(range[0])} м); по S. 16 при скромном первом этаже допустимы меньшие высоты.`
        : `Поясной карниз h_gurt = ${formatMeters(hGurt)} м превышает 1/6 высоты этажа (${formatMeters(range[1])} м).`;
  }

  return {
    inRange,
    belowMain,
    belowSocle,
    range,
    status,
    explanation,
    formula: 'h_gurt ∈ [H_floor/12, H_floor/6]; h_gurt < h_main; h_gurt < h_socle',
    page: 'S. 16',
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
    note: 'S. 10: трёхчастность названа, пропорции не заданы — доли интерпретационные',
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
    note: `S. 10: плита должна быть главной по высоте (отношение ${Number.isFinite(ratio) ? formatMeters(ratio, 2) : '∞'}×; порог ${formatMeters(threshold, 2)}× — допущение/эвристика).`,
    isHeuristic: true,
    formula: `h_plate ≥ ${formatMeters(threshold, 2)} × h_other_sum`,
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
  firstFloorHeight: number,
  requiredSocleHeight: number
): FullFloorAsSocleResult {
  const applicable = firstFloorHeight >= requiredSocleHeight - EPS && firstFloorHeight > 0;
  return {
    applicable,
    status: applicable ? 'ok' : 'violation',
    note: applicable
      ? `S. 16: при невозможности нужной высоты цоколя включить весь 1-й этаж (${formatMeters(firstFloorHeight)} м ≥ требуемых ${formatMeters(requiredSocleHeight)} м).`
      : `Высоты 1-го этажа (${formatMeters(firstFloorHeight)} м) недостаточно для требуемого цоколя (${formatMeters(requiredSocleHeight)} м).`,
    formula: 'H_floor1 ≥ h_socle_required',
    page: 'S. 16, 22',
  };
}

// ==================================================
// 3.11. Варианты этажности (1-эт., 2-эт., многоэт.: 3 / 4–5 / общий)
// ==================================================

export type BuildingVariant = 'one-story' | 'two-story' | 'multi-story';
export type MultiSub = 'three' | 'four-five' | 'general';
export type FourFiveScheme = 'A' | 'B';
export type ThreeStoryGurtMode = 'both_gurt' | 'third_sohlbank' | 'unified_upper';
export type CorniceVariantMode = 'full_entablature' | 'crowning_only';

export interface VariantRules {
  socle: { min: number; max: number; optimum: number }; // доли H_зд
  mainCornice: { min: number; max: number } | 'extrapolated';
  crowning: { min: number; max: number } | 'extrapolated';
  gurt: { min: number; max: number } | null; // доли h_этажа
  facadeRect: 'lying' | 'standing' | 'either';
  articulation: 'horizontal' | 'vertical' | 'mixed';
  axisRatio: { min: number; max: number }; // A/H_max
  axesPreferred: 'odd' | 'odd-or-even';
  columnsOptional: boolean;
  mainTierFloor?: number; // для многоэтажных
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
    id: 'gap_four_five_schemes',
    title: 'Числовые доли высот этажей в схемах A и B (4–5 этажей)',
    status: 'Описательные схемы (S. 23)',
    detail:
      'Схема A (1 = цоколь, 2–4 = ствол, 5+карниз = венчание) и схема B (1+2 = единый нижний ярус, 3–5 = ствол) даны описательно без долей высот каждого этажа.',
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
      'Скромный масштаб (Табл. 21–25): колонны и пилястры необязательны (Табл. 24).',
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
      'Трёхэтажный городской дом (Табл. 52–57) назван идеалом всего типа с 3 легко считываемыми рядами окон (S. 22).',
      '2-й этаж — главный ярус; 3-й этаж наименьший; в доходных домах цоколь ниже либо весь 1-й этаж трактуется как цоколь.',
    ],
  },
  'multi-story:four-five': {
    variant: 'multi-story',
    multiSub: 'four-five',
    id: 'multi-story:four-five',
    labelRu: 'Многоэтажный: 4–5 этажей (схемы A / B)',
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
      'Схема A (доходный дом): 1-й эт. = цоколь, 2–4 эт. = ствол, 5-й эт. с главным карнизом = венчание (S. 23).',
      'Схема B (богатый особняк): 1+2 эт. объединены в нижний ярус, 3–5 эт. = ствол, главный карниз скромной высоты с мощным выносом.',
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

  // Для 1-этажного экстраполируем диапазон 2-этажного (как нижний ориентир ≥)
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
  multiSub: MultiSub = 'three'
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
  const base = checkGurt(hGurt, floorHeight, hSocle, hMain);
  return {
    ...base,
    notRequired: false,
  };
}

export interface VariantAxisCheckResult {
  ratio: number;
  range: [number, number];
  isWideBayHeuristic: boolean;
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
  tolerance = 0.03
): VariantAxisCheckResult {
  const preset = getVariantPreset(variant, multiSub);
  const ratio = H_max > 0 ? A / H_max : NaN;
  const { min, max } = preset.rules.axisRatio;
  const isWideBayHeuristic = variant === 'one-story' || variant === 'two-story';

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(ratio) || ratio <= 0) {
    status = 'violation';
    explanation = 'Некорректные значения A или H_max.';
  } else if (ratio >= min - EPS && ratio <= max + EPS) {
    status = 'ok';
    explanation = isWideBayHeuristic
      ? `Отношение A:H_max = ${formatMeters(ratio, 3)} входит в предел ${formatMeters(min, 2)}…${formatMeters(max, 2)} для 1–2-этажного дома (S. 5: широкий шаг допускается к 1:1, точный порог в тексте не задан).`
      : `Отношение A:H_max = ${formatMeters(ratio, 3)} входит в предел ${formatMeters(min, 2)}…${formatMeters(max, 3)} (2:3…7:8) для многоэтажного городского дома (S. 6).`;
  } else if (
    ratio >= min * (1 - tolerance) - EPS &&
    ratio <= max * (1 + tolerance) + EPS
  ) {
    status = 'approx';
    explanation = `Отношение A:H_max = ${formatMeters(ratio, 3)} близко к границам варианта [${formatMeters(min, 2)}, ${formatMeters(max, 3)}] в пределах допуска ${formatPercent(tolerance, 0)}.`;
  } else {
    status = 'violation';
    explanation = `Отношение A:H_max = ${formatMeters(ratio, 3)} выходит за допустимый предел [${formatMeters(min, 2)}, ${formatMeters(max, 3)}] для варианта «${preset.shortLabelRu}».`;
  }

  return {
    ratio,
    range: [min, max],
    isWideBayHeuristic,
    status,
    explanation,
    formula: `A / H_max ∈ [${formatMeters(min, 2)}, ${formatMeters(max, 3)}]`,
    page: isWideBayHeuristic ? 'S. 5' : 'S. 5–6',
  };
}

export interface FacadeRectCheckResult {
  width: number;
  height: number;
  aspect: number; // W / H_total
  actualOrientation: 'lying' | 'standing' | 'square';
  expectedOrientation: 'lying' | 'standing' | 'either';
  status: ValidationStatus;
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
  const nearSquare = Number.isFinite(aspect) && Math.abs(aspect - 1) <= 0.05;
  const actualOrientation: 'lying' | 'standing' | 'square' = nearSquare
    ? 'square'
    : aspect > 1
      ? 'lying'
      : 'standing';

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(aspect) || facadeWidth <= 0 || totalHeight <= 0) {
    status = 'violation';
    explanation = 'Ширина фасада и общая высота должны быть положительными.';
  } else if (nearSquare) {
    status = 'violation';
    explanation = `Фасад близок к квадрату (W=${formatMeters(facadeWidth, 2)} м ≈ H_total=${formatMeters(totalHeight, 2)} м, W/H=${formatMeters(aspect, 2)}): по S. 14 одинаковых главных размеров длины и высоты следует избегать («квадрат — самая безжизненная форма»).`;
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
    explanation,
    formula:
      expectedOrientation === 'lying'
        ? 'W > H_total (лежачий прямоугольник, W ≉ H)'
        : expectedOrientation === 'standing'
          ? 'H_total > W (стоячий прямоугольник, W ≉ H)'
          : 'W ≉ H_total',
    page: 'S. 14–15',
  };
}

export interface AxesCountCheckResult {
  axesCount: number;
  isOdd: boolean;
  axesPreferred: 'odd' | 'odd-or-even';
  status: ValidationStatus;
  explanation: string;
  formula: string;
  page: string;
}

export function checkAxesCount(
  axesCount: number,
  variant: BuildingVariant,
  multiSub: MultiSub = 'three',
  isEmbeddedInRow = false
): AxesCountCheckResult {
  const preset = getVariantPreset(variant, multiSub);
  const n = Math.max(1, Math.round(axesCount));
  const isOdd = n % 2 === 1;
  const effectivePref: 'odd' | 'odd-or-even' =
    isEmbeddedInRow && variant === 'multi-story' ? 'odd-or-even' : preset.rules.axesPreferred;

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (isOdd) {
    status = 'ok';
    explanation =
      n === 5
        ? '5 оконных осей — классический идеал симметричного фасада с центральной входной осью (S. 14, 16).'
        : `Нечётное число осей (${n}) обеспечивает ясную центральную ось симметрии (S. 14).`;
  } else if (effectivePref === 'odd-or-even') {
    status = 'ok';
    explanation = `Чётное число осей (${n}) допустимо во встроенном многоэтажном доме при боковом входе (S. 14) либо при парной группировке окон (S. 15–16).`;
  } else {
    status = 'approx';
    const groupingHint =
      n === 4
        ? 'Для 4 осей по S. 15 рекомендуется сдвинуть 2 средних окна ближе в группу (3-частный ритм).'
        : n === 6
          ? 'Для 6 осей по S. 15 рекомендуется группировка попарно (2+2+2) в три группы.'
          : n === 8
            ? 'Для 8 осей по S. 16 лучше объединить 3 центральных окна в сдвоенные группы.'
            : 'Рекомендуется нечётное число осей (3, 5, 7) либо группировка проёмов.';
    explanation = `Для варианта «${preset.shortLabelRu}» предпочтительно нечётное число осей. ${groupingHint}`;
  }

  return {
    axesCount: n,
    isOdd,
    axesPreferred: effectivePref,
    status,
    explanation,
    formula:
      effectivePref === 'odd'
        ? 'axes % 2 === 1 (предпочтительно нечётное: 3, 5, 7)'
        : 'odd-or-even (во встроенном доме при боковом входе)',
    page: 'S. 14–16',
  };
}

// ==================================================
// 3.12. Межэтажные карнизы / ленты (Gurtgesims, B-1…B-37)
// ==================================================

export type BeltMode = 'binding' | 'crowning';
export type BeltClassType = 1 | 2 | 3 | 4;
export type BeltEffect = 'neutral' | 'heavy' | 'light';
export type BeltConsoleMode = 'none' | 'lying_lower' | 'standing_frieze';
export type ThreeStoryBeltSchemeNumber = 1 | 2 | 3;

export interface BeltInput {
  hLowerFloor: number; // высота нижнего этажа (под лентой)
  hUpperFloor: number; // высота верхнего этажа (над лентой)
  H_socle: number; // высота цоколя
  H_mainCornice: number; // высота главного карниза
  mode: BeltMode; // связующая | венчающая нижний этаж
  type: BeltClassType; // класс по составу (B-23)
  upperToLower?: number; // отношение верх/низ венчающей части, по умолч. 1
  hasColumnsBelow?: boolean; // колоннада/пилястры в нижнем этаже
  hasRustication?: boolean; // лента заменена рустовкой
}

export interface BeltClassMeta {
  type: BeltClassType;
  titleRu: string;
  titleDe: string;
  parts: string[];
  descriptionRu: string;
  recommendedMode: BeltMode;
  crownShareOfBelt: number; // эвристическая доля венчающей части для визуализации разреза
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
      'Введение шейки, пояска и связующей кривой придаёт поясной ленте характерную лёгкость и зримое скрепление этажей (B-10…B-14).',
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
      'Развитый пояс-антаблемент для венчания значительного нижнего яруса или этажа с колоннадой/пилястрами (B-3, B-5, B-23).',
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

export const BELT_TEXT_GAPS: BeltTextGapItem[] = [
  {
    id: 'belt_gap_ausladung',
    title: 'Числовой вынос (Ausladung) межэтажной ленты',
    tag: 'не из источника',
    detail:
      'На S. 16 сказано лишь, что поясной карниз должен иметь «умеренный вынос» (mäßige Ausladung), а при венчающем завершении — чуть больше (S. 10); формулы 45° и 5/6 даны только для венчающих/оконных карнизов.',
  },
  {
    id: 'belt_gap_floor_ref',
    title: 'Точная база отсчёта h_нижн.эт (пол-пол или в свету)',
    tag: 'экстраполяция',
    detail:
      'Текст S. 16 оперирует «высотой этажа» (Geschosshöhe) без уточнения границы обмера; по контексту поэтажных отметок принята высота от уровня пола до уровня пола (S. 16, 22).',
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
  {
    id: 'belt_gap_sill_plate_height',
    title: 'Высота подоконной плиты, ставшей сплошным карнизом',
    tag: 'не из источника',
    detail:
      'На S. 17 указано, что она «согласуется с лежащей под ней частью стены и обычно превышает ширину наличника», без конкретной доли.',
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
  customHeight?: number
): BeltHeightResult {
  const min = inp.hLowerFloor / 12;
  const max = inp.hLowerFloor / 6;
  const h = customHeight !== undefined ? customHeight : (min + max) / 2;
  const inRange = h >= min - EPS && h <= max + EPS;
  const belowSocle = h < inp.H_socle - EPS;
  const belowMain = h < inp.H_mainCornice - EPS;

  const note = !belowSocle
    ? 'S. 16: лента должна быть меньше цоколя'
    : !belowMain
      ? 'S. 16: лента должна быть меньше главного карниза'
      : null;

  let status: ValidationStatus = 'ok';
  let explanation = '';

  if (!Number.isFinite(h) || inp.hLowerFloor <= 0 || h <= 0) {
    status = 'violation';
    explanation = 'Высота нижнего этажа и высота ленты должны быть положительными.';
  } else if (h < min - EPS) {
    status = 'violation';
    explanation = `Высота ленты H_ленты = ${formatMeters(h)} м меньше h_нижн/12 (${formatMeters(min)} м). Меньшие размеры допустимы лишь как исключение при скромном решении 1-го этажа (S. 16, порог не задан).`;
  } else if (!belowSocle || !belowMain) {
    status = 'violation';
    explanation = !belowSocle
      ? `Нарушение (S. 16): лента ${formatMeters(h)} м ≥ цоколя ${formatMeters(inp.H_socle)} м.`
      : `Нарушение (S. 16): лента ${formatMeters(h)} м ≥ главного карниза ${formatMeters(inp.H_mainCornice)} м.`;
  } else if (h > max + EPS) {
    status = 'violation';
    explanation = `Высота ленты H_ленты = ${formatMeters(h)} м превышает h_нижн/6 (${formatMeters(max)} м, S. 16).`;
  } else {
    status = 'ok';
    explanation = `Высота ленты H_ленты = ${formatMeters(h)} м входит в диапазон [${formatMeters(min)}, ${formatMeters(max)}] м (1/12…1/6 от h_нижн = ${formatMeters(inp.hLowerFloor)} м) и уступает главному карнизу и цоколю (S. 16).`;
  }

  return {
    h,
    range: [min, max],
    status,
    checks: {
      belowSocle,
      belowMain,
      inRange,
      note,
    },
    explanation,
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
      ? `При опорах нижнего этажа лента H_ленты = ${formatMeters(H_belt)} м согласована по высоте и меньше min(H_цоколя = ${formatMeters(H_socle)} м, H_гл.к. = ${formatMeters(H_main)} м) (числовое соотношение к ордеру в тексте не задано).`
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
    formula: 'Fugenteilung + Fußprofil (при H_эт < 3.0 м избегать сплошной подоконной ленты)',
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

  if (onlySillUnderSecond) {
    return {
      status: 'violation',
      explanation:
        'Недопустимо (S. 22): при «только подоконник под 2-м этажом» без поясного карниза 1-й этаж излишне раздувается за счёт верхних этажей и ломает разбивку высот.',
      formula: 'только Sohlbank под 2-м эт. ⇒ запрещено (нарушает иерархию)',
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
          'Лента отсутствует — соседние этажи читаются как единое архитектурное целое (допустимо для 3-этажного по схеме 3, S. 22, либо для 1+2 эт. по схеме B, S. 23).',
        formula: 'без ленты ⇒ допустимо при объединении ярусов (3 эт. схема 3 / схема B)',
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
        'Предупреждение (S. 16–17): сплошная подоконная лента в малоэтажном доме или при небольшой высоте этажа (< 3.3 м, порог UX) может создавать зрительное беспокойство и «перетягивать» стену; высота её плиты должна превосходить ширину наличника (числовой формулы в источнике нет).',
      formula: 'Sohlbankgesimse в малоэтажном / невысоком этаже ⇒ риск беспокойства',
      page: 'S. 16–17',
    };
  }

  if (!alignsWithRecesses) {
    return {
      status: 'approx',
      explanation:
        'Предупреждение (B-27 / S. 17–18): лента не согласована с западающими частями (Rücklagen) и ризалитами — обрезные линии горизонтальных карнизов не должны разрываться.',
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
// Сводная оценка фасада (§4.7)
// ==================================================

export interface FacadeParameters {
  buildingType: BuildingTypeId;
  buildingVariant: BuildingVariant;
  multiSub: MultiSub;
  axesCount: number;
  corniceVariantMode: CorniceVariantMode;
  fourFiveScheme: FourFiveScheme;
  threeStoryGurtMode: ThreeStoryGurtMode;
  isEmbeddedInRow: boolean;
  H: number;
  A: number;
  w: number;
  h: number;
  withFraming: boolean;
  u: number;
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
  corniceRatio: number; // h_u / h_l
  plateShare: number; // 0..1
  tolerance: number; // 0.03 default
  diagTolerance: number; // 0.05 default
  // Параметры цоколя и общей поэтажной иерархии
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
  // Параметры межэтажных карнизов / лент (Gurtgesims, B-1…B-37)
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
}

export interface SummaryCheckItem {
  id: string;
  title: string;
  page: string;
  formula: string;
  valueText: string;
  status: ValidationStatus;
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
  variantInfo: VariantPresetMetadata;
  variantAxisCheck: VariantAxisCheckResult;
  facadeRectCheck: FacadeRectCheckResult;
  axesCountCheck: AxesCountCheckResult;
  ahCheck: RatioFromAHResult;
  pierResult: PierNoFrameResult | PierWithFrameResult;
  cornerCheck: CornerCheckResult;
  windowCheck: WindowCheckResult;
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

export function evaluateFacadeSummary(params: FacadeParameters): FacadeSummary {
  const variantInfo = getVariantPreset(params.buildingVariant, params.multiSub);
  const ahCheck = ratio_from_AH(params.A, params.H, params.tolerance, params.buildingType);
  const variantAxisCheck = checkVariantAxisRatio(
    params.A,
    params.H,
    params.buildingVariant,
    params.multiSub,
    params.tolerance
  );

  const effectiveU = params.withFraming ? params.u : 0;
  const pierNoFrame = p_from_Aw(params.A, params.w, params.buildingType);
  const pierWithFrame = pc_from_Awu(params.A, params.w, effectiveU, params.buildingType);
  const pierResult = params.withFraming ? pierWithFrame : pierNoFrame;

  const D = params.isRisalitCentered
    ? params.risalitWidth / 2
    : D_from_A(params.A, params.k_D);
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

  const safeAxesCount = Math.max(1, Math.round(params.axesCount));
  const facadeWidth = 2 * D + Math.max(0, safeAxesCount - 1) * params.A;
  const facadeRectCheck = checkFacadeRectangle(
    facadeWidth,
    params.totalHeight,
    params.buildingVariant,
    params.multiSub
  );
  const axesCountCheck = checkAxesCount(
    safeAxesCount,
    params.buildingVariant,
    params.multiSub,
    params.isEmbeddedInRow
  );

  const windowCheck = check_window(params.w, params.h, params.diagTolerance);

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

  // Вычисления цоколя и карнизов с учётом варианта этажности
  const effectiveSocleH = params.useFullFloorAsSocle ? params.H : params.hSocle;
  const socleHeightCheck = checkSocleHeight(effectiveSocleH, params.totalHeight);
  const mainCorniceCheck = checkMainCorniceWithVariant(
    effectiveSocleH,
    params.hMain,
    params.totalHeight,
    params.buildingVariant,
    params.multiSub,
    params.corniceVariantMode
  );
  const gurtCheck = checkGurtWithVariant(
    params.hGurt,
    params.H,
    effectiveSocleH,
    params.hMain,
    params.buildingVariant,
    params.multiSub
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
  const fullFloorSocleCheck = fullFloorAsSocle(params.H, params.totalHeight / 10);

  // Вычисления межэтажного карниза (ленты)
  const beltInput: BeltInput = {
    hLowerFloor: params.H,
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
    params.buildingVariant === 'one-story' || params.floors <= 1 || params.beltIsAbsent
      ? {
          h: params.hGurt,
          range: [params.H / 12, params.H / 6],
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
      : beltHeight(beltInput, params.hGurt);

  const beltCrownHeight = Math.max(0.05, params.hGurt * beltMeta.crownShareOfBelt);
  const beltCrowningCheck = beltCrowningSplit(
    beltCrownHeight,
    params.beltCrowningRatio,
    params.beltEffect,
    params.beltConsoleMode
  );
  const beltColumnsCheck =
    params.buildingVariant === 'one-story' || params.floors <= 1 || params.beltIsAbsent
      ? beltWithColumns(params.hGurt, params.hMain, effectiveSocleH, false)
      : beltWithColumns(params.hGurt, params.hMain, effectiveSocleH, params.beltHasColumnsBelow);
  const beltRusticationCheck = beltAsRustication(
    params.beltRusticationHasBaseProfile,
    params.H
  );
  const beltSpecialCheck = checkBeltSpecialCases({
    variant: params.buildingVariant,
    multiSub: params.multiSub,
    floors: params.floors,
    floorHeight: params.H,
    isAbsent: params.beltIsAbsent,
    isSillCornice: params.beltIsSillCornice,
    onlySillUnderSecond: params.beltOnlySillUnderSecond,
    alignsWithRecesses: params.beltAlignsWithRecesses,
    hasRustication: params.beltAsRusticationMode,
    hasBaseProfile: params.beltRusticationHasBaseProfile,
    threeStoryGurtMode: params.threeStoryGurtMode,
  });

  const checks: SummaryCheckItem[] = [
    {
      id: 'axen_ratio',
      title: 'Шаг осей и высота комнаты (A : H)',
      page: ahCheck.page,
      formula: 'A / H = n / m',
      valueText: `A = ${formatMeters(params.A)} м, A:H = ${formatMeters(ahCheck.ratio, 3)} (ближ. ${ahCheck.nearestAny.label})`,
      status: ahCheck.status,
      explanation: ahCheck.explanation,
      targetElement: 'axenweite',
    },
    {
      id: 'variant_axis_ratio',
      title: `Предел A/H по этажности (${variantInfo.shortLabelRu})`,
      page: variantAxisCheck.page,
      formula: variantAxisCheck.formula,
      valueText: `A:H_max = ${formatMeters(variantAxisCheck.ratio, 3)} (диапазон ${formatMeters(variantAxisCheck.range[0], 2)}…${formatMeters(variantAxisCheck.range[1], 3)})`,
      status: variantAxisCheck.status,
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
      explanation: facadeRectCheck.explanation,
      targetElement: 'axenweite',
    },
    {
      id: 'axes_count',
      title: 'Число оконных осей фасада',
      page: axesCountCheck.page,
      formula: axesCountCheck.formula,
      valueText: `${axesCountCheck.axesCount} осей (${axesCountCheck.isOdd ? 'нечёт.' : 'чёт.'})`,
      status: axesCountCheck.status,
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
      explanation: windowCheck.rangeCheck.explanation,
      targetElement: 'window',
    },
    {
      id: 'window_diag',
      title: 'Правило половины диагонали (w ≤ d/2)',
      page: 'S. 7',
      formula: 'd = √(w² + h²); w ≤ d/2',
      valueText: `d = ${formatMeters(windowCheck.diagCheck.d)} м, d/2 = ${formatMeters(windowCheck.diagCheck.halfD)} м`,
      status: windowCheck.diagCheck.status,
      explanation: windowCheck.diagCheck.explanation,
      isHeuristic: windowCheck.diagCheck.status === 'approx',
      targetElement: 'window',
    },
    ...(params.withFraming
      ? [
          {
            id: 'framing_rfk',
            title: 'Сандрик окна (R : F : K и вынос)',
            page: 'S. 7–8',
            formula: params.withConsoles
              ? 'R:F:K; v_console = (5/6)·K'
              : 'R:F:K; v_proj = K (45°)',
            valueText: `R=${formatMeters(framingResult.R)}, F=${formatMeters(framingResult.F)}, K=${formatMeters(framingResult.K)} м`,
            status: framingResult.status,
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
      explanation: gurtCheck.explanation,
      targetElement: 'socle',
    },
    {
      id: 'socle_plate_dominant',
      title: 'Плита цоколя главная по высоте',
      page: 'S. 10',
      formula: plateCheck.formula,
      valueText: `h_plate = ${formatMeters(params.hPlate)} м / прочие = ${formatMeters(params.hOtherSum)} м (${Number.isFinite(plateCheck.ratio) ? formatMeters(plateCheck.ratio, 2) : '∞'}×)`,
      status: plateCheck.status,
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
      explanation: abkroepfungCheck.note,
      targetElement: 'socle',
    },
    {
      id: 'belt_crowning_and_special',
      title: 'Межэтажная лента: профиль венца, опоры и спецслучаи',
      page: 'S. 10–11, 16–17, 22',
      formula: beltSpecialCheck.formula,
      valueText: `Класс ${params.beltType} (${params.beltMode === 'binding' ? 'связ.' : 'венч.'}), h_в:h_н = ${formatMeters(params.beltCrowningRatio, 2)}:1`,
      status:
        beltHeightCheck.status === 'violation' ||
        beltCrowningCheck.status === 'violation' ||
        beltColumnsCheck.status === 'violation' ||
        beltSpecialCheck.status === 'violation'
          ? 'violation'
          : beltCrowningCheck.status === 'approx' || beltSpecialCheck.status === 'approx'
            ? 'approx'
            : 'ok',
      explanation:
        beltSpecialCheck.status !== 'ok'
          ? beltSpecialCheck.explanation
          : beltColumnsCheck.status === 'violation'
            ? beltColumnsCheck.explanation
            : beltCrowningCheck.explanation,
      targetElement: 'belt',
    },
  ];

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
    variantInfo,
    variantAxisCheck,
    facadeRectCheck,
    axesCountCheck,
    ahCheck,
    pierResult,
    cornerCheck,
    windowCheck,
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

  let A = prev.A;
  // Подстраиваем A:H в предел варианта, если вышли за диапазон
  const currentRatio = prev.H > 0 ? prev.A / prev.H : 0.8;
  if (currentRatio > preset.rules.axisRatio.max) {
    A = prev.H * Math.min(preset.rules.axisRatio.max, 0.8);
  } else if (currentRatio < preset.rules.axisRatio.min) {
    A = prev.H * preset.rules.axisRatio.min;
  }

  // Высота здания: цоколь + этажи + карниз
  const socleShare = 1 / 6;
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

  const estFloorsHeight =
    variant === 'one-story'
      ? prev.H + 0.65
      : variant === 'two-story'
        ? prev.H * 2 * 0.96
        : floors * Math.min(prev.H, 3.6) * 0.96;
  const totalHeight = Math.max(4.6, estFloorsHeight / (1 - socleShare - activeMainShare));
  const hSocle = totalHeight * socleShare;
  const hMain = totalHeight * activeMainShare;
  const hGurt = preset.rules.gurt === null ? 0 : Math.min(prev.H / 9, hMain * 0.65);

  const axesCount =
    variant === 'one-story' || variant === 'two-story'
      ? 5
      : floors >= 4
        ? 3
        : 3;

  const isMiethausFourFive =
    variant === 'multi-story' && multiSub === 'four-five' && prev.buildingType === 'miethaus';

  return {
    buildingVariant: variant,
    multiSub,
    floors,
    A,
    axesCount,
    totalHeight,
    hSocle,
    hMain,
    hGurt,
    rustRowHeight: Math.min(0.4, Math.max(0.3, hSocle / 5)),
    useFullFloorAsSocle: isMiethausFourFive ? true : false,
    isEmbeddedInRow: variant === 'multi-story',
    beltIsAbsent: variant === 'one-story' ? true : false,
    beltIsSillCornice: false,
    beltOnlySillUnderSecond: false,
    beltUpperFloorHeight: Math.max(2.6, prev.H * 0.92),
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

  const totalHeight =
    type === 'simple_house'
      ? 7.2
      : type === 'villa'
        ? 8.4
        : type === 'monumental'
          ? 11.4
          : type === 'miethaus'
            ? 19.2
            : type === 'palace'
              ? 18.0
              : 13.5;

  const hSocle = totalHeight / 6;
  const mainShare =
    variantMeta.rules.mainCornice === 'extrapolated'
      ? 0.1
      : (variantMeta.rules.mainCornice.min + variantMeta.rules.mainCornice.max) / 2;
  const hMain = totalHeight * mainShare;
  const hGurt = d.H / 9;
  const rustRowHeight = Math.min(0.4, Math.max(0.3, hSocle / 5));

  return {
    buildingType: type,
    buildingVariant,
    multiSub,
    axesCount: buildingVariant === 'two-story' ? 5 : 3,
    corniceVariantMode: 'full_entablature',
    fourFiveScheme: 'A',
    threeStoryGurtMode: 'both_gurt',
    isEmbeddedInRow: buildingVariant === 'multi-story',
    H: d.H,
    A,
    w: d.w,
    h: d.h,
    withFraming: d.u > 0,
    u: d.u > 0 ? d.u : 0.2,
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
    diagTolerance: 0.05,
    floors,
    totalHeight,
    socleMode: 'optimal',
    hSocle,
    hMain,
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
    useFullFloorAsSocle: type === 'miethaus',
    beltMode: type === 'palace' || type === 'rich_columnar' ? 'crowning' : 'binding',
    beltType: type === 'palace' || type === 'rich_columnar' ? 4 : type === 'simple_house' ? 1 : 3,
    beltUpperFloorHeight: Math.max(2.6, d.H * 0.92),
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
  };
}
