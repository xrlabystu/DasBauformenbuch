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
  | 'cornice';

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
// Сводная оценка фасада (§4.7)
// ==================================================

export interface FacadeParameters {
  buildingType: BuildingTypeId;
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
  ahCheck: RatioFromAHResult;
  pierResult: PierNoFrameResult | PierWithFrameResult;
  cornerCheck: CornerCheckResult;
  windowCheck: WindowCheckResult;
  framingResult: FramingResult;
  offsetCheck: OffsetCheckResult;
  pilasterCheck: PilasterCheckResult;
  corniceCheck: CorniceSplitResult;
  corniceChar: CorniceCharacter;
}

export function evaluateFacadeSummary(params: FacadeParameters): FacadeSummary {
  const ahCheck = ratio_from_AH(params.A, params.H, params.tolerance, params.buildingType);

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
    ahCheck,
    pierResult,
    cornerCheck,
    windowCheck,
    framingResult,
    offsetCheck,
    pilasterCheck,
    corniceCheck,
    corniceChar,
  };
}

export function createDefaultParamsForTypology(type: BuildingTypeId): FacadeParameters {
  const preset = getTypology(type);
  const d = preset.defaults;
  const A = A_from_H(d.H, d.ratioN, d.ratioM);
  return {
    buildingType: type,
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
  };
}
