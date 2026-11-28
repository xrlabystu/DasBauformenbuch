import {
  D_from_A,
  computeDerivedGeometry,
  createDefaultParamsForTypology,
  evaluateFacadeSummary,
  resolveWindowAxisStepsM,
  type BeltClassType,
  type BeltConsoleMode,
  type BeltEffect,
  type BeltMode,
  type BuildingLevelsInput,
  type BuildingTypeId,
  type BuildingVariant,
  type ColumnProfileType,
  type CompositionKind,
  type CorniceCompositionStyle,
  type CorniceVariantMode,
  type EntrancePlacement,
  type EntrancePosition,
  type FacadeParameters,
  type FiveStoryScheme,
  type MultiSub,
  type PedimentType,
  type PilasterPlacement,
  type SocleMode,
  type ThreePartSocleParts,
  type ThreeStoryGurtMode,
} from './rules';
import type { LockedParamsMap } from './paramLocks';
import {
  captureBrickMasonryBaseArch,
  sanitizeBrickParams,
  type BrickMasonryArchSnapshot,
  type BrickMasonryConfig,
} from './brickMasonry';

export const FACADE_SETTINGS_FORMAT = 'brausewetter-facade-settings' as const;
export const FACADE_SETTINGS_VERSION = 1 as const;

export interface FacadeSettingsFileV1 {
  format: typeof FACADE_SETTINGS_FORMAT;
  version: typeof FACADE_SETTINGS_VERSION;
  exportedAt: string;
  meta: {
    buildingType: BuildingTypeId;
    floors: number;
    axesCount: number;
    facadeWidthM: number;
    totalHeightM: number;
    brickMasonryEnabled: boolean;
  };
  params: FacadeParameters;
  lockedParams: LockedParamsMap;
}

export type FacadeSettingsImportResult =
  | {
      ok: true;
      params: FacadeParameters;
      lockedParams: LockedParamsMap;
      warnings: string[];
    }
  | {
      ok: false;
      error: string;
    };

const VALID_BUILDING_TYPES: ReadonlySet<BuildingTypeId> = new Set([
  'simple_house',
  'urban_house',
  'miethaus',
  'villa',
  'monumental',
  'palace',
  'rich_columnar',
]);

const VALID_VARIANTS: ReadonlySet<BuildingVariant> = new Set([
  'one-story',
  'two-story',
  'multi-story',
]);

const VALID_MULTI_SUBS: ReadonlySet<MultiSub> = new Set(['three', 'four-five', 'general']);
const VALID_ENTRANCE_POS: ReadonlySet<EntrancePosition> = new Set(['center', 'left', 'right', 'none']);
const VALID_ENTRANCE_PLACEMENT: ReadonlySet<EntrancePlacement> = new Set(['facade_center', 'axis']);
const VALID_CORNICE_MODES: ReadonlySet<CorniceVariantMode> = new Set(['full_entablature', 'crowning_only']);
const VALID_CORNICE_STYLES: ReadonlySet<CorniceCompositionStyle> = new Set(['frieze_architrave', 'neck_band']);
const VALID_FIVE_SCHEMES: ReadonlySet<FiveStoryScheme> = new Set(['standard', 'rich_1_2_unified']);
const VALID_THREE_GURT: ReadonlySet<ThreeStoryGurtMode> = new Set([
  'both_gurt',
  'third_sohlbank',
  'unified_upper',
]);
const VALID_SOCLE_MODES: ReadonlySet<SocleMode> = new Set(['optimal', 'typical']);
const VALID_BELT_MODES: ReadonlySet<BeltMode> = new Set(['binding', 'crowning']);
const VALID_BELT_TYPES: ReadonlySet<BeltClassType> = new Set([1, 2, 3, 4]);
const VALID_BELT_EFFECTS: ReadonlySet<BeltEffect> = new Set(['neutral', 'heavy', 'light']);
const VALID_BELT_CONSOLES: ReadonlySet<BeltConsoleMode> = new Set([
  'none',
  'lying_lower',
  'standing_frieze',
]);
const VALID_PILASTER_CHAR: ReadonlySet<'massive' | 'light'> = new Set(['massive', 'light']);
const VALID_PILASTER_PLACEMENT: ReadonlySet<PilasterPlacement> = new Set(['edges', 'every_pier']);
const VALID_COMP_KINDS: ReadonlySet<CompositionKind> = new Set([
  'two_part_wing',
  'five_part',
  'seven_part',
  'two_side_risalits',
]);
const VALID_SEVEN_PART_SCHEMES: ReadonlySet<'two_side_risalits' | 'one_middle_risalit'> = new Set([
  'two_side_risalits',
  'one_middle_risalit',
]);
const VALID_COLUMN_PROFILES: ReadonlySet<ColumnProfileType> = new Set([
  'none',
  'half',
  'two_thirds',
  'three_quarters',
]);
const VALID_PEDIMENT_TYPES: ReadonlySet<PedimentType> = new Set(['none', 'gentle', 'steep']);

function isPlainRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function finiteNum(val: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, val));
}

function optionalFiniteNum(val: unknown, min = -Infinity, max = Infinity): number | undefined {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'number' || !Number.isFinite(val)) return undefined;
  return Math.min(max, Math.max(min, val));
}

function boolOr(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

function enumOr<T extends string | number>(val: unknown, allowed: ReadonlySet<T>, fallback: T): T {
  return allowed.has(val as T) ? (val as T) : fallback;
}

function sanitizeLevels(raw: unknown, fallback: BuildingLevelsInput): BuildingLevelsInput {
  if (!isPlainRecord(raw)) {
    return {
      groundToFloor1: fallback.groundToFloor1,
      floors: fallback.floors.map((f) => ({ ...f })),
      ...(fallback.manualTotalHeight !== undefined
        ? { manualTotalHeight: fallback.manualTotalHeight }
        : {}),
    };
  }
  const groundToFloor1 = finiteNum(raw.groundToFloor1, fallback.groundToFloor1, 0, 8);
  const rawFloors = Array.isArray(raw.floors) ? raw.floors.slice(0, 10) : [];
  const floors =
    rawFloors.length > 0
      ? rawFloors.map((fl, idx) => {
          const fb = fallback.floors[idx] ?? fallback.floors[0] ?? {
            floorToFloor: 3.6,
            slabThickness: 0.35,
            clearHeight: 3.25,
          };
          if (!isPlainRecord(fl)) return { ...fb };
          const floorToFloor = finiteNum(fl.floorToFloor, fb.floorToFloor, 2.0, 12.0);
          const slabThickness = finiteNum(fl.slabThickness, fb.slabThickness, 0.1, 1.5);
          const clearHeight = finiteNum(
            fl.clearHeight,
            Number(Math.max(1.5, floorToFloor - slabThickness).toFixed(3)),
            1.5,
            11.0
          );
          return { floorToFloor, slabThickness, clearHeight };
        })
      : fallback.floors.map((f) => ({ ...f }));
  const manualTotalHeight = optionalFiniteNum(raw.manualTotalHeight, 3.0, 80.0);
  return {
    groundToFloor1,
    floors,
    ...(manualTotalHeight !== undefined ? { manualTotalHeight } : {}),
  };
}

function sanitizeSocleParts(raw: unknown, fallback: ThreePartSocleParts): ThreePartSocleParts {
  if (!isPlainRecord(raw)) return { ...fallback };
  return {
    fuss: finiteNum(raw.fuss, fallback.fuss, 0.05, 0.9),
    rumpf: finiteNum(raw.rumpf, fallback.rumpf, 0.05, 0.9),
    deck: finiteNum(raw.deck, fallback.deck, 0.05, 0.9),
  };
}

function sanitizeFramingRatio(
  raw: unknown,
  fallback: [number, number, number]
): [number, number, number] {
  if (!Array.isArray(raw) || raw.length < 3) return [...fallback] as [number, number, number];
  return [
    finiteNum(raw[0], fallback[0], 0.5, 20),
    finiteNum(raw[1], fallback[1], 0, 20),
    finiteNum(raw[2], fallback[2], 0, 20),
  ];
}

function sanitizeBaseArch(
  raw: unknown,
  fallbackParams: FacadeParameters
): BrickMasonryArchSnapshot {
  const defaultSnapshot = captureBrickMasonryBaseArch(fallbackParams);
  if (!isPlainRecord(raw)) return defaultSnapshot;
  const levels = sanitizeLevels(raw.levels, defaultSnapshot.levels);
  const gapCount = Math.max(0, Math.round(fallbackParams.axesCount) - 2);
  const rawSpacings = Array.isArray(raw.ordinaryPierAxisSpacings)
    ? raw.ordinaryPierAxisSpacings
        .slice(0, gapCount)
        .filter((n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0.8 && n <= 12)
    : undefined;
  const rawSillsArr = Array.isArray(raw.windowSillHeights) ? raw.windowSillHeights : null;
  const rawSills = rawSillsArr
    ? Array.from({ length: levels.floors.length }, (_, idx) =>
        optionalFiniteNum(rawSillsArr[idx], 0, 4)
      )
    : undefined;

  return {
    A: finiteNum(raw.A, defaultSnapshot.A, 0.8, 12),
    H: finiteNum(raw.H, defaultSnapshot.H, 1.5, 12),
    w: finiteNum(raw.w, defaultSnapshot.w, 0.3, 6),
    h: finiteNum(raw.h, defaultSnapshot.h, 0.5, 8),
    k_D: finiteNum(raw.k_D, defaultSnapshot.k_D, 0.15, 3),
    isRisalitCentered: boolOr(raw.isRisalitCentered, defaultSnapshot.isRisalitCentered),
    risalitWidth: finiteNum(raw.risalitWidth, defaultSnapshot.risalitWidth, 0.5, 20),
    hSocle: finiteNum(raw.hSocle, defaultSnapshot.hSocle, 0.2, 12),
    hMain: finiteNum(raw.hMain, defaultSnapshot.hMain, 0.2, 6),
    hGurt: finiteNum(raw.hGurt, defaultSnapshot.hGurt, 0, 4),
    useFullFloorAsSocle: boolOr(raw.useFullFloorAsSocle, defaultSnapshot.useFullFloorAsSocle),
    ...(optionalFiniteNum(raw.corniceBottomOffsetM, -5, 5) !== undefined
      ? { corniceBottomOffsetM: optionalFiniteNum(raw.corniceBottomOffsetM, -5, 5) }
      : {}),
    ...(typeof raw.hasEntrance === 'boolean' ? { hasEntrance: raw.hasEntrance } : {}),
    ...(optionalFiniteNum(raw.entranceWidthM, 0.6, 5) !== undefined
      ? { entranceWidthM: optionalFiniteNum(raw.entranceWidthM, 0.6, 5) }
      : {}),
    ...(optionalFiniteNum(raw.entranceHeightM, 1.2, 6) !== undefined
      ? { entranceHeightM: optionalFiniteNum(raw.entranceHeightM, 1.2, 6) }
      : {}),
    ...(optionalFiniteNum(raw.entranceBottomM, 0, 5) !== undefined
      ? { entranceBottomM: optionalFiniteNum(raw.entranceBottomM, 0, 5) }
      : {}),
    ...(rawSpacings && rawSpacings.length === gapCount && gapCount > 0
      ? { ordinaryPierAxisSpacings: rawSpacings }
      : {}),
    ...(rawSills ? { windowSillHeights: rawSills } : {}),
    levels,
  };
}

function cleanLocksMap(raw: unknown): LockedParamsMap {
  if (!isPlainRecord(raw)) return {};
  const result: LockedParamsMap = {};
  for (const [k, v] of Object.entries(raw)) {
    if (v === true && k.trim().length > 0 && k.length <= 80) {
      result[k] = true;
    }
  }
  return result;
}

export function buildFacadeSettingsPayload(
  params: FacadeParameters,
  lockedParams: LockedParamsMap = {}
): FacadeSettingsFileV1 {
  const axisStepsM = params.axesCount >= 2 ? resolveWindowAxisStepsM(params) : [];
  const D = params.isRisalitCentered
    ? params.risalitWidth / 2
    : D_from_A(axisStepsM[0] ?? params.A, params.k_D);
  const dg = computeDerivedGeometry(
    params.levels,
    params.A,
    D,
    params.axesCount,
    params.hMain,
    axisStepsM,
    params.corniceBottomOffsetM
  );

  return {
    format: FACADE_SETTINGS_FORMAT,
    version: FACADE_SETTINGS_VERSION,
    exportedAt: new Date().toISOString(),
    meta: {
      buildingType: params.buildingType,
      floors: params.levels.floors.length,
      axesCount: Math.round(params.axesCount),
      facadeWidthM: Number(dg.facadeWidth.toFixed(3)),
      totalHeightM: Number(dg.totalHeight.toFixed(3)),
      brickMasonryEnabled: Boolean(params.brickMasonry?.enabled),
    },
    params: JSON.parse(JSON.stringify(params)) as FacadeParameters,
    lockedParams: cleanLocksMap(lockedParams),
  };
}

export function exportFacadeSettingsJson(
  params: FacadeParameters,
  lockedParams: LockedParamsMap = {}
): string {
  return JSON.stringify(buildFacadeSettingsPayload(params, lockedParams), null, 2);
}

export function buildFacadeSettingsFilename(params: FacadeParameters): string {
  const floors = params.levels?.floors?.length ?? params.floors ?? 1;
  const axes = Math.max(2, Math.round(params.axesCount));
  return `brausewetter-facade-${params.buildingType}-${floors}f-${axes}ax.json`;
}

export function downloadFacadeSettings(
  params: FacadeParameters,
  lockedParams: LockedParamsMap = {}
): void {
  const json = exportFacadeSettingsJson(params, lockedParams);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildFacadeSettingsFilename(params);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseFacadeSettingsImport(rawText: string): FacadeSettingsImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return {
      ok: false,
      error: 'Не удалось прочитать файл: содержимое не является корректным JSON.',
    };
  }

  if (!isPlainRecord(parsed)) {
    return {
      ok: false,
      error: 'Некорректная структура файла настроек: ожидается JSON-объект.',
    };
  }

  let rawParams: unknown = parsed;
  let rawLocks: unknown = undefined;

  if ('params' in parsed || 'format' in parsed || 'version' in parsed) {
    if (parsed.format !== undefined && parsed.format !== FACADE_SETTINGS_FORMAT) {
      return {
        ok: false,
        error: `Неподдерживаемый формат файла («${String(parsed.format)}»). Выберите файл экспорта настроек фасада.`,
      };
    }
    if (
      parsed.version !== undefined &&
      (typeof parsed.version !== 'number' ||
        !Number.isInteger(parsed.version) ||
        parsed.version < 1 ||
        parsed.version > FACADE_SETTINGS_VERSION)
    ) {
      return {
        ok: false,
        error: `Неподдерживаемая версия файла настроек (${String(parsed.version)}).`,
      };
    }
    if (!isPlainRecord(parsed.params)) {
      return {
        ok: false,
        error: 'В файле настроек отсутствует раздел параметров фасада («params»).',
      };
    }
    rawParams = parsed.params;
    rawLocks = parsed.lockedParams;
  }

  if (!isPlainRecord(rawParams)) {
    return {
      ok: false,
      error: 'Раздел параметров фасада имеет неверный формат.',
    };
  }

  const recognizedKeys = ['buildingType', 'A', 'H', 'w', 'h', 'axesCount', 'levels', 'hSocle', 'hMain'];
  const hasAnyRecognized = recognizedKeys.some((k) => k in rawParams);
  if (!hasAnyRecognized) {
    return {
      ok: false,
      error: 'Файл не содержит параметров фасада калькулятора.',
    };
  }

  const warnings: string[] = [];
  const buildingType = enumOr(rawParams.buildingType, VALID_BUILDING_TYPES, 'urban_house');
  if (rawParams.buildingType !== undefined && rawParams.buildingType !== buildingType) {
    warnings.push('Неизвестный тип здания заменён на стандартный.');
  }

  const base = createDefaultParamsForTypology(buildingType);
  const levels = sanitizeLevels(rawParams.levels, base.levels);
  const floorCount = levels.floors.length;
  const axesCount = Math.round(finiteNum(rawParams.axesCount, base.axesCount, 2, 10));
  const gapCount = Math.max(0, axesCount - 2);
  const boundaryCount = Math.max(0, floorCount - 1);

  const ordinaryPierAxisSpacings =
    Array.isArray(rawParams.ordinaryPierAxisSpacings) && gapCount > 0
      ? (() => {
          const valid = rawParams.ordinaryPierAxisSpacings
            .slice(0, gapCount)
            .filter(
              (n): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0.8 && n <= 12
            );
          if (valid.length === 0) return undefined;
          return Array.from({ length: gapCount }, (_, idx) => valid[idx] ?? valid[0]);
        })()
      : undefined;

  const rawBeltFloors = Array.isArray(rawParams.beltFloors) ? rawParams.beltFloors : null;
  const beltFloors = rawBeltFloors
    ? Array.from({ length: boundaryCount }, (_, idx) => Boolean(rawBeltFloors[idx]))
    : Array.from({ length: boundaryCount }, (_, idx) => Boolean(base.beltFloors?.[idx]));

  const rawBeltSillFloors = Array.isArray(rawParams.beltSillFloors)
    ? rawParams.beltSillFloors
    : null;
  const beltSillFloors = rawBeltSillFloors
    ? Array.from(
        { length: boundaryCount },
        (_, idx) => Boolean(rawBeltSillFloors[idx]) && Boolean(beltFloors[idx])
      )
    : Array.from({ length: boundaryCount }, () => false);

  const rawPilasterFloors = Array.isArray(rawParams.pilasterFloors)
    ? rawParams.pilasterFloors
    : null;
  const pilasterFloors = rawPilasterFloors
    ? Array.from({ length: floorCount }, (_, idx) => Boolean(rawPilasterFloors[idx]))
    : Array.from({ length: floorCount }, (_, idx) => Boolean(base.pilasterFloors?.[idx]));

  const rawWindowSillHeights = Array.isArray(rawParams.windowSillHeights)
    ? rawParams.windowSillHeights
    : null;
  const windowSillHeights = rawWindowSillHeights
    ? Array.from({ length: floorCount }, (_, idx) =>
        optionalFiniteNum(rawWindowSillHeights[idx], 0, 4)
      )
    : undefined;

  const merged: FacadeParameters = {
    buildingType,
    buildingVariant: enumOr(rawParams.buildingVariant, VALID_VARIANTS, base.buildingVariant),
    multiSub: enumOr(rawParams.multiSub, VALID_MULTI_SUBS, base.multiSub),
    axesCount,
    showOrdinaryPierAxes: boolOr(rawParams.showOrdinaryPierAxes, Boolean(base.showOrdinaryPierAxes)),
    ...(ordinaryPierAxisSpacings ? { ordinaryPierAxisSpacings } : {}),
    entrancePosition: enumOr(rawParams.entrancePosition, VALID_ENTRANCE_POS, base.entrancePosition),
    hasEntrance: boolOr(rawParams.hasEntrance, base.hasEntrance),
    entrancePlacement: enumOr(
      rawParams.entrancePlacement,
      VALID_ENTRANCE_PLACEMENT,
      base.entrancePlacement
    ),
    entranceAxisIndex: Math.round(
      finiteNum(rawParams.entranceAxisIndex, base.entranceAxisIndex, 0, Math.max(0, axesCount - 1))
    ),
    entranceBottomM: finiteNum(rawParams.entranceBottomM, base.entranceBottomM, 0, 5),
    entranceHeightM: finiteNum(rawParams.entranceHeightM, base.entranceHeightM, 1.2, 6),
    entranceWidthM: finiteNum(rawParams.entranceWidthM, base.entranceWidthM, 0.6, 5),
    corniceVariantMode: enumOr(
      rawParams.corniceVariantMode,
      VALID_CORNICE_MODES,
      base.corniceVariantMode
    ),
    corniceFullStyle: enumOr(
      rawParams.corniceFullStyle,
      VALID_CORNICE_STYLES,
      base.corniceFullStyle ?? 'frieze_architrave'
    ),
    fiveStoryScheme: enumOr(rawParams.fiveStoryScheme, VALID_FIVE_SCHEMES, base.fiveStoryScheme),
    mainCorniceProjectionBoost: finiteNum(
      rawParams.mainCorniceProjectionBoost,
      base.mainCorniceProjectionBoost,
      0.5,
      2.5
    ),
    threeStoryGurtMode: enumOr(
      rawParams.threeStoryGurtMode,
      VALID_THREE_GURT,
      base.threeStoryGurtMode
    ),
    isEmbeddedInRow: boolOr(rawParams.isEmbeddedInRow, base.isEmbeddedInRow),
    levels,
    useFloorToFloorForBelt: boolOr(
      rawParams.useFloorToFloorForBelt,
      base.useFloorToFloorForBelt
    ),
    allowModestFirstFloorForBelt: boolOr(
      rawParams.allowModestFirstFloorForBelt,
      base.allowModestFirstFloorForBelt
    ),
    H: finiteNum(rawParams.H, base.H, 1.5, 12),
    A: finiteNum(rawParams.A, base.A, 0.8, 12),
    w: finiteNum(rawParams.w, base.w, 0.3, 6),
    h: finiteNum(rawParams.h, base.h, 0.5, 8),
    withFraming: boolOr(rawParams.withFraming, base.withFraming),
    u: finiteNum(rawParams.u, base.u, 0.02, 1),
    hSill: finiteNum(rawParams.hSill, base.hSill, 0.1, 3),
    hSillCornice: finiteNum(rawParams.hSillCornice, base.hSillCornice, 0.05, 1.5),
    k_D: finiteNum(rawParams.k_D, base.k_D, 0.15, 3),
    isRisalitCentered: boolOr(rawParams.isRisalitCentered, base.isRisalitCentered),
    risalitWidth: finiteNum(rawParams.risalitWidth, base.risalitWidth, 0.5, 20),
    T: finiteNum(rawParams.T, base.T, 0.05, 2.5),
    framingRatio: sanitizeFramingRatio(rawParams.framingRatio, base.framingRatio),
    withoutSandrik: boolOr(rawParams.withoutSandrik, Boolean(base.withoutSandrik)),
    withConsoles: boolOr(rawParams.withConsoles, base.withConsoles),
    a_front: finiteNum(rawParams.a_front, base.a_front, 0.02, 1),
    a_side: finiteNum(rawParams.a_side, base.a_side, 0.02, 1),
    Wp: finiteNum(rawParams.Wp, base.Wp, 0.1, 3),
    v: finiteNum(rawParams.v, base.v, 0, 1),
    pilasterCharacter: enumOr(
      rawParams.pilasterCharacter,
      VALID_PILASTER_CHAR,
      base.pilasterCharacter
    ),
    isMauerpfeiler: boolOr(rawParams.isMauerpfeiler, base.isMauerpfeiler),
    Tc: finiteNum(rawParams.Tc, base.Tc, 0.05, 2),
    corniceRatio: finiteNum(rawParams.corniceRatio, base.corniceRatio, 0.05, 0.6),
    plateShare: finiteNum(rawParams.plateShare, base.plateShare, 0.05, 0.6),
    tolerance: finiteNum(rawParams.tolerance, base.tolerance, 0.001, 0.25),
    diagTolerance: finiteNum(rawParams.diagTolerance, base.diagTolerance, 0.001, 0.25),
    floors: floorCount,
    totalHeight: finiteNum(rawParams.totalHeight, base.totalHeight, 3, 80),
    socleMode: enumOr(rawParams.socleMode, VALID_SOCLE_MODES, base.socleMode),
    hSocle: finiteNum(rawParams.hSocle, base.hSocle, 0.2, 12),
    hMain: finiteNum(rawParams.hMain, base.hMain, 0.2, 6),
    ...(optionalFiniteNum(rawParams.corniceBottomOffsetM, -5, 5) !== undefined
      ? { corniceBottomOffsetM: optionalFiniteNum(rawParams.corniceBottomOffsetM, -5, 5) }
      : {}),
    hGurt: finiteNum(rawParams.hGurt, base.hGurt, 0, 4),
    isSimpleSocle: boolOr(rawParams.isSimpleSocle, Boolean(base.isSimpleSocle)),
    socleParts: sanitizeSocleParts(rawParams.socleParts, base.socleParts),
    hPlate: finiteNum(rawParams.hPlate, base.hPlate, 0.02, 1.5),
    hOtherSum: finiteNum(rawParams.hOtherSum, base.hOtherSum, 0.05, 3),
    hSocleRust: finiteNum(rawParams.hSocleRust, base.hSocleRust, 0.02, 1),
    hEgRust: finiteNum(rawParams.hEgRust, base.hEgRust, 0.02, 1),
    vSocleProfile: finiteNum(rawParams.vSocleProfile, base.vSocleProfile, 0, 0.5),
    vEgProfile: finiteNum(rawParams.vEgProfile, base.vEgProfile, 0, 0.5),
    hasKellerfenster: boolOr(rawParams.hasKellerfenster, base.hasKellerfenster),
    hasLisenen: boolOr(rawParams.hasLisenen, base.hasLisenen),
    hasSocleRustication: boolOr(rawParams.hasSocleRustication, Boolean(base.hasSocleRustication)),
    rustRowHeight: finiteNum(rawParams.rustRowHeight, base.rustRowHeight, 0.1, 1.5),
    useFullFloorAsSocle: boolOr(rawParams.useFullFloorAsSocle, base.useFullFloorAsSocle),
    beltMode: enumOr(rawParams.beltMode, VALID_BELT_MODES, base.beltMode),
    beltType: enumOr(rawParams.beltType, VALID_BELT_TYPES, base.beltType),
    beltUpperFloorHeight: finiteNum(rawParams.beltUpperFloorHeight, base.beltUpperFloorHeight, 2, 10),
    beltCrowningRatio: finiteNum(rawParams.beltCrowningRatio, base.beltCrowningRatio, 0.2, 0.9),
    beltEffect: enumOr(rawParams.beltEffect, VALID_BELT_EFFECTS, base.beltEffect),
    beltConsoleMode: enumOr(rawParams.beltConsoleMode, VALID_BELT_CONSOLES, base.beltConsoleMode),
    beltHasColumnsBelow: boolOr(rawParams.beltHasColumnsBelow, base.beltHasColumnsBelow),
    beltAsRusticationMode: boolOr(rawParams.beltAsRusticationMode, base.beltAsRusticationMode),
    beltRusticationHasBaseProfile: boolOr(
      rawParams.beltRusticationHasBaseProfile,
      base.beltRusticationHasBaseProfile
    ),
    beltIsAbsent:
      boundaryCount === 0
        ? true
        : boolOr(rawParams.beltIsAbsent, !beltFloors.some(Boolean)),
    beltFloors,
    beltSillFloors,
    beltIsSillCornice: boolOr(rawParams.beltIsSillCornice, beltSillFloors.some(Boolean)),
    beltOnlySillUnderSecond: boolOr(
      rawParams.beltOnlySillUnderSecond,
      base.beltOnlySillUnderSecond
    ),
    ...(windowSillHeights ? { windowSillHeights } : {}),
    beltAlignsWithRecesses: boolOr(rawParams.beltAlignsWithRecesses, base.beltAlignsWithRecesses),
    hasWallRustication: boolOr(rawParams.hasWallRustication, base.hasWallRustication),
    cornerRustRows: Math.round(finiteNum(rawParams.cornerRustRows, base.cornerRustRows, 0, 50)),
    cornerRustStartsEndsLong: boolOr(
      rawParams.cornerRustStartsEndsLong,
      Boolean(base.cornerRustStartsEndsLong)
    ),
    cornerOffsetM: finiteNum(rawParams.cornerOffsetM, base.cornerOffsetM, 0, 2),
    upperStoryHeightN: finiteNum(rawParams.upperStoryHeightN, base.upperStoryHeightN, 2, 10),
    hasCompositionBreakdown: boolOr(rawParams.hasCompositionBreakdown, base.hasCompositionBreakdown),
    compKind: enumOr(rawParams.compKind, VALID_COMP_KINDS, base.compKind),
    sevenPartCentralScheme: enumOr(
      rawParams.sevenPartCentralScheme,
      VALID_SEVEN_PART_SCHEMES,
      base.sevenPartCentralScheme ?? 'two_side_risalits'
    ),
    wCentralRisalit: finiteNum(rawParams.wCentralRisalit, base.wCentralRisalit, 1, 30),
    wSideRisalit: finiteNum(rawParams.wSideRisalit, base.wSideRisalit, 1, 20),
    wWing: finiteNum(rawParams.wWing, base.wWing, 1, 30),
    pWing: finiteNum(rawParams.pWing, base.pWing, 0.2, 6),
    centralRisalitAxes: Math.round(
      finiteNum(rawParams.centralRisalitAxes, base.centralRisalitAxes, 1, 8)
    ),
    wingAxes: Math.round(finiteNum(rawParams.wingAxes, base.wingAxes, 1, 8)),
    middleAxesBetweenRisalits: Math.round(
      finiteNum(rawParams.middleAxesBetweenRisalits, base.middleAxesBetweenRisalits, 1, 8)
    ),
    risalitRichness: finiteNum(rawParams.risalitRichness, base.risalitRichness, 0.5, 5),
    wingRichness: finiteNum(rawParams.wingRichness, base.wingRichness, 0.5, 5),
    hasPilasterBetweenPairedWindows: boolOr(
      rawParams.hasPilasterBetweenPairedWindows,
      base.hasPilasterBetweenPairedWindows
    ),
    pilasterAdjacentSameHeight: boolOr(
      rawParams.pilasterAdjacentSameHeight,
      base.pilasterAdjacentSameHeight
    ),
    pilasterHeightDiffPct: finiteNum(
      rawParams.pilasterHeightDiffPct,
      base.pilasterHeightDiffPct,
      0,
      100
    ),
    pilastersOnlyOnUpperFloor: boolOr(
      rawParams.pilastersOnlyOnUpperFloor,
      base.pilastersOnlyOnUpperFloor
    ),
    pilasterFloors,
    pilasterPlacement: enumOr(
      rawParams.pilasterPlacement,
      VALID_PILASTER_PLACEMENT,
      base.pilasterPlacement ?? 'edges'
    ),
    atticOverRisalit: boolOr(rawParams.atticOverRisalit, base.atticOverRisalit),
    atticOverWing: boolOr(rawParams.atticOverWing, base.atticOverWing),
    atticRisalitHeavier: boolOr(rawParams.atticRisalitHeavier, base.atticRisalitHeavier),
    ...(optionalFiniteNum(rawParams.hAtticRisalit, 0.2, 6) !== undefined
      ? { hAtticRisalit: optionalFiniteNum(rawParams.hAtticRisalit, 0.2, 6) }
      : {}),
    ...(optionalFiniteNum(rawParams.hAtticWing, 0.2, 6) !== undefined
      ? { hAtticWing: optionalFiniteNum(rawParams.hAtticWing, 0.2, 6) }
      : {}),
    wpWallPier: finiteNum(rawParams.wpWallPier, base.wpWallPier, 0.1, 3),
    hasPairedPilasters: boolOr(rawParams.hasPairedPilasters, base.hasPairedPilasters),
    pairedPilastersGap: finiteNum(rawParams.pairedPilastersGap, base.pairedPilastersGap, 0.05, 3),
    columnProfileType: enumOr(
      rawParams.columnProfileType,
      VALID_COLUMN_PROFILES,
      base.columnProfileType
    ),
    pedimentType: enumOr(rawParams.pedimentType, VALID_PEDIMENT_TYPES, base.pedimentType),
    pedimentClassical: boolOr(rawParams.pedimentClassical, base.pedimentClassical),
  };

  if (isPlainRecord(rawParams.brickMasonry)) {
    const enabled = Boolean(rawParams.brickMasonry.enabled);
    const brick = sanitizeBrickParams(
      isPlainRecord(rawParams.brickMasonry.brick)
        ? (rawParams.brickMasonry.brick as Partial<BrickMasonryConfig['brick']>)
        : undefined
    );
    const brickConfig: BrickMasonryConfig = {
      enabled,
      brick,
      ...(enabled
        ? {
            baseArch: isPlainRecord(rawParams.brickMasonry.baseArch)
              ? sanitizeBaseArch(rawParams.brickMasonry.baseArch, merged)
              : captureBrickMasonryBaseArch(merged),
          }
        : {}),
    };
    merged.brickMasonry = brickConfig;
  }

  const axisStepsM = merged.axesCount >= 2 ? resolveWindowAxisStepsM(merged) : [];
  const D = merged.isRisalitCentered
    ? merged.risalitWidth / 2
    : D_from_A(axisStepsM[0] ?? merged.A, merged.k_D);
  const dg = computeDerivedGeometry(
    merged.levels,
    merged.A,
    D,
    merged.axesCount,
    merged.hMain,
    axisStepsM,
    merged.corniceBottomOffsetM
  );
  merged.H = dg.H_max;
  merged.floors = merged.levels.floors.length;
  merged.totalHeight = dg.totalHeight;

  try {
    evaluateFacadeSummary(merged, { expertMode: true });
  } catch {
    return {
      ok: false,
      error: 'Не удалось построить геометрию фасада по импортируемым параметрам.',
    };
  }

  return {
    ok: true,
    params: merged,
    lockedParams: cleanLocksMap(rawLocks),
    warnings,
  };
}
