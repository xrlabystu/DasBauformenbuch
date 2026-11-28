import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  A_from_H,
  A_from_pier_wu,
  A_from_pw,
  A_min_from_wu,
  BELT_CLASSES,
  BELT_TEXT_GAPS,
  D_from_A,
  D_from_cornerPier,
  H_from_A,
  PHI,
  RULES_DATA,
  VARIANT_PRESETS,
  VARIANT_TEXT_GAPS,
  abkroepfungPreference,
  allowedAxisRatio,
  applyBuildingVariantPreset,
  applyFloorCountPreset,
  beltAsRustication,
  beltCrowningSplit,
  beltHeight,
  beltWithColumns,
  buildDefaultLevels,
  checkAttic,
  checkAxesCount,
  checkBeltHeight,
  checkBeltSpecialCases,
  checkCentralRisalitAxes,
  checkColumnProfileType,
  checkCornerOffsetVsUpperHeight,
  checkCornerRusticationRows,
  checkEqualWidthRisalitWingPediment,
  checkFacadeRectangle,
  checkFivePartFacade,
  checkFiveStoryScheme,
  checkFramingWidth,
  checkGurt,
  checkGurtWithVariant,
  checkMainCornice,
  checkMainCorniceWithVariant,
  checkMiddleAxesInTwoSideRisalits,
  checkMiddleVsSideRisalit,
  checkPairedPilastersGap,
  checkPedimentChoice,
  checkPilasterBetweenWindowPairs,
  checkPilasterNarrowerThanWallPier,
  checkPilasterRepetition,
  checkPilastersOnlyUpper,
  checkRisalitRichness,
  checkSevenPartFacade,
  checkSideRisalitWidth,
  checkSillCorniceHeight,
  checkSillPlateHeight,
  checkSocleHeight,
  checkVariantAxisRatio,
  checkWingAxes,
  checkWingPierWidth,
  checkWingVsSideRisalit,
  checkWindowRows,
  check_corner,
  check_offset,
  check_pilaster,
  check_window,
  computeDerivedGeometry,
  cornice_character,
  cornice_split,
  createDefaultParamsForTypology,
  decreasingUpward,
  evaluateFacadeSummary,
  framing_from_T,
  framing_from_module,
  fullFloorAsSocle,
  getAxesGroupingHint,
  getTypology,
  getVariantPreset,
  h_from_w_ratio,
  hasAnyActiveBelt,
  hasAnySillBelt,
  isBeltEnabledAboveFloor,
  isBeltSillModeAboveFloor,
  isFloorWindowSillBeltActive,
  isKnownGoodRatio,
  kD_from_cornerPier,
  mergeStatuses,
  nearest_golden_approx,
  p_corner_from_Dwu,
  p_from_Aw,
  pc_from_Awu,
  pilaster_v_range,
  plateDominant,
  projection_45,
  projection_console,
  ratio_from_AH,
  resolveBeltFloorsMask,
  resolveBeltVerticalBandM,
  resolveBuildingWidthBounds,
  resolveEntranceGeometry,
  resolveEntrancePositionFromSettings,
  resolveFloorWindowGeometryM,
  resolveMainCorniceLayers,
  resolveOrdinaryPierAxesM,
  resolveOrdinaryPierAxisEdgeOffsetM,
  resolveOrdinaryPierWidthsM,
  resolveParamsPatchForBuildingWidth,
  resolvePilasterElevationSpans,
  resolvePilasterXPositions,
  resolveScaledVerticalGeometry,
  resolveSocleAndPilasterBounds,
  resolveWindowAxesM,
  resolveWindowAxisStepsM,
  resolveWindowSillHeightM,
  rusticationRows,
  socleHeight,
  syncLevelsWithH,
  threePartSocle,
  threeStoryBeltScheme,
  w_from_h_ratio,
  w_max_from_A,
} from './rules.ts';
import {
  computeNextFacadeParams,
  countLockedParams,
  filterUnlockedPatch,
  isFramingRLocked,
  isParamLocked,
  type LockedParamsMap,
} from './paramLocks.ts';
import {
  RULE_BOOK_EXCERPTS,
  getExcerptForCatalogRule,
  getExcerptForCheckId,
} from './ruleBookRefs.ts';
import { BRAUSEWETTER_PAGES } from '../data/brausewetter_1895.ts';
import { countSearchMatches, findGlossaryEntryByTerm } from '../utils/termHighlight.tsx';
import {
  buildDetailPlateCadDocument,
  buildFacadeCadDocument,
  exportDetailPlateToDwg,
  exportFacadeToDwg,
  type DetailPlateId,
} from './dwgExport.ts';
import {
  getExamResultSummary,
  isExamBlindState,
  stripExamNormHints,
} from './examMode.ts';
import {
  BRICK_MASONRY_TECH_WARNING,
  DEFAULT_BRICK_MASONRY_PARAMS,
  calcHorizontalModuleMm,
  calcHorizontalOpeningMm,
  calcVerticalModuleH1Mm,
  calcVerticalModuleH2Mm,
  coordinateFacadeWithBrickMasonry,
} from './brickMasonry.ts';
import {
  FACADE_SETTINGS_FORMAT,
  buildFacadeSettingsFilename,
  exportFacadeSettingsJson,
  parseFacadeSettingsImport,
} from './settingsFile.ts';
import { DwgReader } from '@node-projects/acad-ts';

const TOL = 1e-3;

function assertClose(actual: number, expected: number, message?: string) {
  const diff = Math.abs(actual - expected);
  assert.ok(
    diff <= TOL,
    `${message ?? 'Expected close values'}: actual=${actual}, expected=${expected}, diff=${diff}`
  );
}

describe('Brausewetter 1895 (S. 1–12) — 11 обязательных тест-кейсов', () => {
  it('Кейс 1: H = 3.00, A:H = 2:3 → A = 2.00; w = 1.00 → p = 1.00; p ≥ w — ok', () => {
    const A = A_from_H(3.0, 2, 3);
    assertClose(A, 2.0);
    const res = p_from_Aw(A, 1.0);
    assertClose(res.p, 1.0);
    assert.equal(res.check, true);
    assert.equal(res.status, 'ok');
  });

  it('Кейс 2: H = 4.00, A:H = 2:3 → A = 2.6667; w = 1.15 → p = 1.5167; p ≥ w — ok', () => {
    const A = A_from_H(4.0, 2, 3);
    assertClose(A, 2.6667);
    const res = p_from_Aw(A, 1.15);
    assertClose(res.p, 1.5167);
    assert.equal(res.check, true);
    assert.equal(res.status, 'ok');
  });

  it('Кейс 3: H = 4.00, A:H = 4:5 → A = 3.20; w = 1.15, u = 0.20 → w_v = 1.55; p_c = 1.65; p_c ≥ w_v — ok', () => {
    const A = A_from_H(4.0, 4, 5);
    assertClose(A, 3.2);
    const res = pc_from_Awu(A, 1.15, 0.2);
    assertClose(res.w_v, 1.55);
    assertClose(res.p_c, 1.65);
    assert.equal(res.check, true);
    assert.equal(res.status, 'ok');
  });

  it('Кейс 4: H = 4.00, A:H = 3:4 → A = 3.00; w = 1.10, u = 0.20 → w_v = 1.50; p_c = 1.50; p_c ≥ w_v — ok (равенство)', () => {
    const A = A_from_H(4.0, 3, 4);
    assertClose(A, 3.0);
    const res = pc_from_Awu(A, 1.1, 0.2);
    assertClose(res.w_v, 1.5);
    assertClose(res.p_c, 1.5);
    assert.equal(res.check, true);
    assert.equal(res.status, 'ok');
  });

  it('Кейс 5: w = 1.00, отношение 3:5 → h = 1.6667; d = 1.9437; d/2 = 0.9718; допуск 5 % — approx', () => {
    const w = 1.0;
    const h = h_from_w_ratio(w, 3, 5);
    assertClose(h, 1.6667);
    const win = check_window(w, h, 0.05);
    assertClose(win.diagCheck.d, 1.9437);
    assertClose(win.diagCheck.halfD, 0.9718);
    assert.equal(win.rangeCheck.passed, true);
    assert.equal(win.diagCheck.strictPassed, false);
    assert.equal(win.diagCheck.status, 'approx');
    assert.equal(win.status, 'approx');
  });

  it('Кейс 6: w = 1.00, h = 2.00 → граница 1:2; 1.5 ≤ 2 ≤ 2 — ok', () => {
    const win = check_window(1.0, 2.0, 0.05);
    assert.equal(win.rangeCheck.passed, true);
    assert.equal(win.diagCheck.strictPassed, true);
    assert.equal(win.status, 'ok');
  });

  it('Кейс 7: w = 1.00, h = 2.10 → violation по верхнему пределу', () => {
    const win = check_window(1.0, 2.1, 0.05);
    assert.equal(win.rangeCheck.passed, false);
    assert.equal(win.rangeCheck.status, 'violation');
    assert.equal(win.status, 'violation');
  });

  it('Кейс 8: W_p = 0.60 → v_max = 0.15; лёгкий диапазон 0.10…0.12', () => {
    const range = pilaster_v_range(0.6);
    assertClose(range.v_max, 0.15);
    assertClose(range.v_light_min, 0.1);
    assertClose(range.v_light_max, 0.12);

    const okLight = check_pilaster(0.11, 0.6, 'light');
    assert.equal(okLight.status, 'ok');

    const badPilaster = check_pilaster(0.18, 0.6, 'massive');
    assert.equal(badPilaster.status, 'violation');
  });

  it('Кейс 9: A = 3.20, k_D = 4/5 → D = 2.56; w = 1.15, u = 0.20 → p_corner = 1.785 > w — ok', () => {
    const D = D_from_A(3.2, 4 / 5);
    assertClose(D, 2.56);
    const pCorner = p_corner_from_Dwu(D, 1.15, 0.2);
    assertClose(pCorner, 1.785);
    const corner = check_corner('simple_house', pCorner, 1.15, 1.65, 4 / 5, D);
    assert.equal(corner.status, 'ok');
  });

  it('Кейс 10: T = 1.20, R:F:K = 6:7:8 → сумма 21, s = 0.05714; R = 0.343, F = 0.400, K = 0.457', () => {
    const framing = framing_from_T(1.2, 6, 7, 8);
    assertClose(framing.scale, 1.2 / 21);
    assertClose(framing.R, 0.343);
    assertClose(framing.F, 0.4);
    assertClose(framing.K, 0.457);
    assert.equal(framing.status, 'ok');
  });

  it('Кейс 11: K = 0.457 → вынос по 45° ≈ 0.457; с консолями ≈ 0.381', () => {
    const K = (1.2 * 8) / 21;
    assertClose(projection_45(K), 0.457);
    assertClose(projection_console(K), 0.381);
  });
});

describe('Обратные вычисления и вспомогательные правила (3.1–3.9)', () => {
  it('Обратные функции осей и простенков: H_from_A, ratio_from_AH, A_from_pw, w_max_from_A, A_min_from_wu', () => {
    assertClose(H_from_A(3.2, 4, 5), 4.0);
    const ratioInfo = ratio_from_AH(3.2, 4.0);
    assert.equal(ratioInfo.nearestStandard.label, '4:5');
    assertClose(A_from_pw(1.65, 1.55), 3.2);
    assertClose(w_max_from_A(3.0), 1.5);
    assertClose(A_min_from_wu(1.1, 0.2), 3.0);
  });

  it('Золотое сечение и приближения: w_from_h_ratio, nearest_golden_approx', () => {
    const hPhi = 1.0 * PHI;
    assertClose(hPhi, 1.618);
    const wBack = w_from_h_ratio(1.6, 5, 8);
    assertClose(wBack, 1.0);
    const nearest = nearest_golden_approx(1.0, 1.6);
    assert.equal(nearest.spec.label, '5:8');
  });

  it('Обрамление по модулю и проверка равенства отступов a_front = a_side', () => {
    const mod = framing_from_module(0.4, 'F', 6, 7, 8);
    assertClose(mod.T, 1.2);
    assert.equal(check_offset(0.06, 0.06).status, 'ok');
    assert.equal(check_offset(0.06, 0.08).status, 'violation');
  });

  it('Карниз: деление h_u:h_l и эвристический характер по доле плиты', () => {
    const splitOk = cornice_split(0.6, 1);
    assertClose(splitOk.h_u, 0.3);
    assertClose(splitOk.h_l, 0.3);
    assert.equal(splitOk.status, 'ok');

    const splitBad = cornice_split(0.6, 2.5);
    assert.equal(splitBad.status, 'violation');

    assert.equal(cornice_character(0.75), 'heavy');
    assert.equal(cornice_character(0.5), 'light');
    assert.equal(cornice_character(0.6), 'neutral');
  });

  it('Сводка фасада и типология монументального здания', () => {
    const params = createDefaultParamsForTypology('monumental');
    const summary = evaluateFacadeSummary(params);
    assert.equal(summary.violationCount, 0);

    // Если сделать угловой простенок меньше промежуточного, для монументального здания это violation
    const weakCorner = check_corner('monumental', 1.2, 1.1, 1.5, 0.7, 2.0);
    assert.equal(weakCorner.status, 'violation');
  });
});

describe('Цоколь (Sockel), иерархия карнизов и рустика (S. 10, 12, 16–17, 22)', () => {
  it('socleHeight и checkSocleHeight: 1/6 оптимально, 1/8 типично, < 1/10 — нарушение', () => {
    const opt = socleHeight(12.0, 'optimal');
    assertClose(opt.h, 2.0);
    assertClose(opt.range[0], 1.2);
    assertClose(opt.range[1], 2.0);
    assert.equal(opt.status, 'ok');

    const typ = socleHeight(12.0, 'typical');
    assertClose(typ.h, 1.5);
    assert.equal(typ.status, 'ok');

    assert.equal(checkSocleHeight(1.5, 12.0).status, 'ok');
    assert.equal(checkSocleHeight(1.1, 12.0).status, 'violation');
    assert.equal(checkSocleHeight(2.6, 12.0).status, 'approx');
  });

  it('checkMainCornice: диапазон по этажности и строгое hMain < hSocle', () => {
    const ok2Floors = checkMainCornice(1.6, 1.0, 9.6, 2);
    assert.equal(ok2Floors.ok, true);
    assert.equal(ok2Floors.inRange, true);
    assert.equal(ok2Floors.belowSocle, true);
    assert.equal(ok2Floors.status, 'ok');

    const ok3Floors = checkMainCornice(2.0, 1.0, 13.5, 3);
    assert.equal(ok3Floors.ok, true);
    assert.equal(ok3Floors.status, 'ok');

    const tooBig = checkMainCornice(1.0, 1.1, 9.6, 2);
    assert.equal(tooBig.ok, false);
    assert.equal(tooBig.belowSocle, false);
    assert.equal(tooBig.status, 'violation');
    assert.ok(tooBig.note !== null);
  });

  it('checkGurt: поясной карниз [floor/12, floor/6] и подчинённость главному карнизу и цоколю', () => {
    const ok = checkGurt(0.45, 4.0, 1.8, 0.9);
    assert.equal(ok.inRange, true);
    assert.equal(ok.belowMain, true);
    assert.equal(ok.belowSocle, true);
    assert.equal(ok.status, 'ok');

    const aboveMain = checkGurt(0.65, 4.0, 1.8, 0.6);
    assert.equal(aboveMain.belowMain, false);
    assert.equal(aboveMain.status, 'violation');
  });

  it('threePartSocle и plateDominant: эвристическое деление на 3 части и доминирование плиты', () => {
    const parts = threePartSocle(2.0);
    assertClose(parts.fuss, 0.5);
    assertClose(parts.rumpf, 1.1);
    assertClose(parts.deck, 0.4);
    assertClose(parts.total, 2.0);
    assert.equal(parts.isHeuristic, true);

    const domOk = plateDominant(0.18, 0.12, 1.2);
    assert.equal(domOk.dominant, true);
    assert.equal(domOk.status, 'ok');

    const domApprox = plateDominant(0.13, 0.12, 1.2);
    assert.equal(domApprox.dominant, false);
    assert.equal(domApprox.status, 'approx');

    const domBad = plateDominant(0.1, 0.12, 1.2);
    assert.equal(domBad.status, 'violation');
  });

  it('decreasingUpward, abkroepfungPreference, rusticationRows, fullFloorAsSocle', () => {
    const decOk = decreasingUpward(0.35, 0.28, 0.06, 0.035);
    assert.equal(decOk.rustOk, true);
    assert.equal(decOk.profileOk, true);
    assert.equal(decOk.status, 'ok');

    const decBad = decreasingUpward(0.3, 0.32, 0.05, 0.06);
    assert.equal(decBad.status, 'violation');

    assert.equal(abkroepfungPreference(false, false).status, 'ok');
    assert.equal(abkroepfungPreference(true, false).status, 'approx');
    assert.equal(abkroepfungPreference(false, true).status, 'approx');

    const rustOdd = rusticationRows(1.75, 0.35);
    assert.equal(rustOdd.n, 5);
    assert.equal(rustOdd.oddPreferred, true);
    assertClose(rustOdd.rowHeight, 0.35);
    assert.equal(rustOdd.status, 'ok');

    const rustEven = rusticationRows(1.4, 0.35);
    assert.equal(rustEven.n, 4);
    assert.equal(rustEven.oddPreferred, false);
    assert.equal(rustEven.status, 'approx');
    assert.ok(rustEven.note !== null);

    assert.equal(fullFloorAsSocle(3.8, 1.4).applicable, true);
    assert.equal(fullFloorAsSocle(2.2, 2.5).applicable, false);
  });
});

describe('Варианты этажности (1-эт., 2-эт., 3 / 4–5 / общий многоэт.) и пробелы текста', () => {
  it('5 пресетов соответствуют заданным нормам и включают 6 явных пробелов текста', () => {
    assert.equal(VARIANT_TEXT_GAPS.length, 6);

    const one = getVariantPreset('one-story');
    assert.equal(one.rules.mainCornice, 'extrapolated');
    assert.equal(one.rules.crowning, 'extrapolated');
    assert.equal(one.rules.gurt, null);
    assert.equal(one.rules.facadeRect, 'lying');
    assert.equal(one.rules.articulation, 'horizontal');
    assert.equal(one.rules.columnsOptional, true);
    assertClose(one.rules.axisRatio.max, 1.0);

    const two = getVariantPreset('two-story');
    assert.notEqual(two.rules.mainCornice, 'extrapolated');
    if (two.rules.mainCornice !== 'extrapolated' && two.rules.crowning !== 'extrapolated') {
      assertClose(two.rules.mainCornice.min, 1 / 12);
      assertClose(two.rules.mainCornice.max, 1 / 8);
      assertClose(two.rules.crowning.min, 1 / 16);
      assertClose(two.rules.crowning.max, 1 / 15);
    }
    assert.equal(two.rules.columnsOptional, false);

    const three = getVariantPreset('multi-story', 'three');
    assert.equal(three.rules.facadeRect, 'standing');
    assert.equal(three.rules.articulation, 'vertical');
    assertClose(three.rules.axisRatio.max, 7 / 8);
    assert.equal(three.rules.mainTierFloor, 2);
    assert.equal(three.rules.upperFloorSmallest, true);

    assert.ok(VARIANT_PRESETS['multi-story:four-five']);
    assert.ok(VARIANT_PRESETS['multi-story:general']);
  });

  it('checkMainCorniceWithVariant и checkGurtWithVariant: пересчёт по варианту и режиму карниза', () => {
    // 1-эт.: экстраполяция + поясной карниз null
    const c1 = checkMainCorniceWithVariant(1.2, 0.7, 6.0, 'one-story', 'general', 'full_entablature');
    assert.equal(c1.isExtrapolated, true);
    assert.equal(c1.status, 'approx');
    const g1 = checkGurtWithVariant(0.3, 3.6, 1.2, 0.7, 'one-story');
    assert.equal(g1.notRequired, true);
    assert.equal(g1.status, 'ok');

    // 2-эт.: только венец (1/16..1/15)
    const c2Crown = checkMainCorniceWithVariant(1.6, 0.62, 9.6, 'two-story', 'general', 'crowning_only');
    assert.equal(c2Crown.isExtrapolated, false);
    assert.equal(c2Crown.status, 'ok');

    // 3-эт.: полный главный карниз (1/15..1/12)
    const c3Full = checkMainCorniceWithVariant(2.2, 1.0, 13.5, 'multi-story', 'three', 'full_entablature');
    assert.equal(c3Full.status, 'ok');
    // Превышение цоколя -> violation
    const c3Bad = checkMainCorniceWithVariant(0.9, 1.0, 13.5, 'multi-story', 'three', 'full_entablature');
    assert.equal(c3Bad.belowSocle, false);
    assert.equal(c3Bad.status, 'violation');
  });

  it('checkVariantAxisRatio, checkFacadeRectangle и checkAxesCount', () => {
    // Для 2-эт. широкий шаг A/H = 0.95 допустим, для 3-эт. — нет
    assert.equal(checkVariantAxisRatio(3.8, 4.0, 'two-story').status, 'ok');
    assert.equal(checkVariantAxisRatio(3.8, 4.0, 'multi-story', 'three').status, 'violation');

    // Ориентация прямоугольника фасада и запрет квадрата
    assert.equal(checkFacadeRectangle(16, 8, 'two-story').actualOrientation, 'lying');
    assert.equal(checkFacadeRectangle(16, 8, 'two-story').status, 'ok');
    assert.equal(checkFacadeRectangle(11, 14, 'multi-story', 'three').status, 'ok');
    assert.equal(checkFacadeRectangle(10, 10, 'two-story').actualOrientation, 'square');
    assert.equal(checkFacadeRectangle(10, 10, 'two-story').status, 'violation');

    // Оси: 5 -> ok; 4 отдельно -> approx; 4 во встроенном многоэт. доме -> ok
    assert.equal(checkAxesCount(5, 'two-story', 'general', false).status, 'ok');
    assert.equal(checkAxesCount(4, 'two-story', 'general', false).status, 'approx');
    assert.equal(checkAxesCount(4, 'multi-story', 'three', true).status, 'ok');
  });

  it('applyBuildingVariantPreset и evaluateFacadeSummary автоматически пересчитывают проверки', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const patch1 = applyBuildingVariantPreset(base, 'one-story', 'general');
    const summary1 = evaluateFacadeSummary({ ...base, ...patch1 });
    assert.equal(summary1.variantInfo.id, 'one-story');
    assert.equal(summary1.gurtCheck.notRequired, true);
    assert.equal(summary1.mainCorniceCheck.isExtrapolated, true);
    assert.equal(summary1.facadeRectCheck.actualOrientation, 'lying');

    const miethaus = createDefaultParamsForTypology('miethaus');
    const patch45 = applyBuildingVariantPreset(miethaus, 'multi-story', 'four-five');
    const summary45 = evaluateFacadeSummary({ ...miethaus, ...patch45 });
    assert.equal(summary45.variantInfo.id, 'multi-story:four-five');
    assert.equal(patch45.useFullFloorAsSocle, true);
    assert.equal(summary45.facadeRectCheck.actualOrientation, 'standing');
  });
});

describe('Межэтажные карнизы — ленты (Gurtgesims, B-1…B-37)', () => {
  it('beltHeight: диапазон [hLower/12, hLower/6], середина и проверка < цоколя и < главного карниза', () => {
    const ok = beltHeight({
      hLowerFloor: 3.6,
      hUpperFloor: 3.3,
      H_socle: 1.6,
      H_mainCornice: 0.9,
      mode: 'binding',
      type: 3,
    });
    assertClose(ok.range[0], 0.3);
    assertClose(ok.range[1], 0.6);
    assertClose(ok.h, 0.45);
    assert.equal(ok.status, 'ok');
    assert.equal(ok.checks.belowSocle, true);
    assert.equal(ok.checks.belowMain, true);

    const aboveMain = beltHeight(
      {
        hLowerFloor: 3.6,
        hUpperFloor: 3.3,
        H_socle: 1.6,
        H_mainCornice: 0.42,
        mode: 'binding',
        type: 2,
      },
      0.45
    );
    assert.equal(aboveMain.status, 'violation');
    assert.equal(aboveMain.checks.belowMain, false);

    const tooSmall = beltHeight(
      {
        hLowerFloor: 3.6,
        hUpperFloor: 3.3,
        H_socle: 1.6,
        H_mainCornice: 0.9,
        mode: 'binding',
        type: 1,
      },
      0.24
    );
    // A3: меньшая высота допустима при скромном первом этаже (S. 16) -> approx, не violation
    assert.equal(tooSmall.status, 'approx');
    const modestOk = checkBeltHeight(0.24, 3.6, 1.6, 0.9, { allowModestLowerFloor: true });
    assert.equal(modestOk.status, 'ok');
  });

  it('beltCrowningSplit: разбивка 1:1, пределы 0.5…2, эффекты heavy/light и перекос при консолях', () => {
    const base = beltCrowningSplit(0.3, 1, 'neutral');
    assertClose(base.hUpper, 0.15);
    assertClose(base.hLower, 0.15);
    assert.equal(base.status, 'ok');

    const badRatio = beltCrowningSplit(0.3, 2.5, 'heavy');
    assert.equal(badRatio.status, 'violation');

    const consoleSkew = beltCrowningSplit(0.3, 1.5, 'neutral', 'lying_lower');
    assert.equal(consoleSkew.status, 'approx');
    assert.ok(consoleSkew.consoleNote !== null);
  });

  it('beltWithColumns, beltAsRustication, threeStoryBeltScheme, BELT_CLASSES и BELT_TEXT_GAPS', () => {
    assert.equal(BELT_CLASSES.length, 4);
    assert.equal(BELT_TEXT_GAPS.length, 4);

    assert.equal(beltWithColumns(0.45, 0.9, 1.5, false).status, 'n/a');
    assert.equal(beltWithColumns(0.45, 0.9, 1.5, true).status, 'ok');
    assert.equal(beltWithColumns(0.95, 0.9, 1.5, true).status, 'violation');

    assert.equal(beltAsRustication(false, 3.4).status, 'violation');
    assert.equal(beltAsRustication(true, 2.8).status, 'approx');
    assert.equal(beltAsRustication(true, 3.5).status, 'ok');

    assert.ok(threeStoryBeltScheme(1).includes('пола 2-го и 3-го'));
    assert.ok(threeStoryBeltScheme(2).includes('подоконный'));
    assert.ok(threeStoryBeltScheme(3).includes('единое целое'));
  });

  it('checkBeltSpecialCases и evaluateFacadeSummary: спецслучаи подоконника и отсутствия ленты', () => {
    const rareSill = checkBeltSpecialCases({
      variant: 'multi-story',
      multiSub: 'three',
      floors: 3,
      floorHeight: 3.6,
      totalHeight: 12.0,
      isAbsent: true,
      isSillCornice: false,
      onlySillUnderSecond: true,
      alignsWithRecesses: true,
      hasRustication: false,
      hasBaseProfile: true,
      threeStoryGurtMode: 'both_gurt',
    });
    assert.equal(rareSill.status, 'approx');

    const extremeSill = checkBeltSpecialCases({
      variant: 'two-story',
      multiSub: 'general',
      floors: 2,
      floorHeight: 4.5,
      totalHeight: 7.5,
      isAbsent: true,
      isSillCornice: false,
      onlySillUnderSecond: true,
      alignsWithRecesses: true,
      hasRustication: false,
      hasBaseProfile: true,
      threeStoryGurtMode: 'both_gurt',
    });
    assert.equal(extremeSill.status, 'violation');

    const allowedUnified = checkBeltSpecialCases({
      variant: 'multi-story',
      multiSub: 'three',
      floors: 3,
      floorHeight: 3.6,
      isAbsent: true,
      isSillCornice: false,
      onlySillUnderSecond: false,
      alignsWithRecesses: true,
      hasRustication: false,
      hasBaseProfile: true,
      threeStoryGurtMode: 'unified_upper',
    });
    assert.equal(allowedUnified.status, 'ok');

    const base = createDefaultParamsForTypology('urban_house');
    const summaryWithApproxSill = evaluateFacadeSummary({
      ...base,
      beltOnlySillUnderSecond: true,
    });
    assert.equal(summaryWithApproxSill.beltSpecialCheck.status, 'approx');
    assert.ok(summaryWithApproxSill.approxCount >= 1);
  });
});

describe('Аудит-фиксы P0, P1, P2, P3 и новые правила S. 12–23 (N1–N29)', () => {
  it('1. P0-1: checkVariantAxisRatio зависит от типологии (rich_columnar 1:2, palace 5:6)', () => {
    const colRange = allowedAxisRatio('rich_columnar', 'multi-story', 'general');
    assert.equal(colRange.sourceStatus, 'heuristic');
    assertClose(colRange.range[0], 0.45);
    assertClose(colRange.range[1], 0.6);

    const exactRichCol = checkVariantAxisRatio(2.0, 4.0, 'multi-story', 'general', 0.03, 'rich_columnar');
    assert.equal(exactRichCol.status, 'ok');
    assert.equal(exactRichCol.sourceStatus, 'explicit-verified');
    assert.equal(
      checkVariantAxisRatio(3.4, 4.0, 'multi-story', 'general', 0.03, 'palace').status,
      'ok'
    );
    assert.equal(
      checkVariantAxisRatio(3.9, 4.0, 'multi-story', 'three', 0.03, 'urban_house').status,
      'violation'
    );
  });

  it('2. P0-2: check_window 5:8 не violation, 3:5 с допуском 7% — approx, 1:2.1 — violation', () => {
    assert.equal(isKnownGoodRatio(1.0, 1.6), true);
    const w58 = check_window(1.0, 1.6);
    assert.notEqual(w58.status, 'violation');
    assert.equal(w58.status, 'approx');

    const w35 = check_window(1.0, h_from_w_ratio(1.0, 3, 5));
    assert.equal(w35.status, 'approx');

    const wBad = check_window(1.0, 2.1);
    assert.equal(wBad.status, 'violation');
  });

  it('3. P0-3: rich_columnar отменяет правило p >= w (S. 5)', () => {
    const noFrameCol = p_from_Aw(2.0, 1.2, 'rich_columnar');
    assert.equal(noFrameCol.status, 'ok');
    const withFrameCol = pc_from_Awu(2.2, 1.1, 0.2, 'rich_columnar');
    assert.equal(withFrameCol.status, 'ok');

    // Для обычного городского дома это нарушение
    assert.equal(p_from_Aw(2.0, 1.2, 'urban_house').status, 'violation');
  });

  it('4. P0-4: palace в typologies имеет диапазон [5/6, 1.0]', () => {
    const palace = getTypology('palace');
    assertClose(palace.minRatioAH, 5 / 6);
    assertClose(palace.maxRatioAH, 1.0);
    assert.equal(palace.recommendedAH, '5:6 … 1:1');
  });

  it('5. P0-5: beltOnlySillUnderSecond — approx (S. 22), violation только при > 0.55 H_total', () => {
    const resNormal = checkBeltSpecialCases({
      variant: 'multi-story',
      multiSub: 'three',
      floors: 3,
      floorHeight: 3.6,
      totalHeight: 12.0,
      isAbsent: true,
      isSillCornice: false,
      onlySillUnderSecond: true,
      alignsWithRecesses: true,
      hasRustication: false,
      hasBaseProfile: true,
      threeStoryGurtMode: 'both_gurt',
    });
    assert.equal(resNormal.status, 'approx');

    const resExtreme = checkBeltSpecialCases({
      variant: 'two-story',
      multiSub: 'general',
      floors: 2,
      floorHeight: 5.0,
      totalHeight: 8.5,
      isAbsent: true,
      isSillCornice: false,
      onlySillUnderSecond: true,
      alignsWithRecesses: true,
      hasRustication: false,
      hasBaseProfile: true,
      threeStoryGurtMode: 'both_gurt',
    });
    assert.equal(resExtreme.status, 'violation');
  });

  it('6. P0-6: поэтажная модель Levels и fullFloorAsSocle без эвристики H * 0.96', () => {
    const levels = buildDefaultLevels(3, 4.0, 1.35);
    const dg = computeDerivedGeometry(levels, 3.2, 2.56, 3, 1.0);
    assertClose(dg.H_max, 4.0);
    assertClose(dg.floor1FullHeight, 1.35 + 4.35);
    assertClose(dg.totalHeight, dg.wallTopElevation + 1.0);

    const synced = syncLevelsWithH(levels, 3.6);
    assertClose(synced.floors[0].clearHeight ?? 0, 3.6);

    const miethaus = createDefaultParamsForTypology('miethaus');
    const summary = evaluateFacadeSummary(miethaus);
    assert.equal(summary.derivedGeometry.usesManualTotalHeight, false);
    assert.ok(summary.socleHeightCheck.h > miethaus.H);
  });

  it('7. P0-7: согласованность числа правил в RULES_DATA и helper-функций §5', () => {
    assert.equal(RULES_DATA.rules.length, 41);
    assert.equal(mergeStatuses('ok', 'approx', 'ok'), 'approx');
    assert.equal(mergeStatuses('approx', 'violation'), 'violation');
    const unifiedBelt = checkBeltHeight(0.45, 4.0, 1.8, 0.9, { allowModestLowerFloor: false });
    assert.equal(unifiedBelt.status, 'ok');
  });

  it('8. P1-N1: ширина наличника u ∈ [w/6, w/5]', () => {
    assert.equal(checkFramingWidth(0.22, 1.2).status, 'ok');
    assert.equal(checkFramingWidth(0.18, 1.2).status, 'approx');
    assert.equal(checkFramingWidth(0.32, 1.2).status, 'approx');
  });

  it('9. P1-N2: подоконная плита h_sill ∈ [w/8, w/7], (w/7, w/5] — approx, вне пределов — violation', () => {
    assert.equal(checkSillPlateHeight(0.16, 1.2).status, 'ok');
    assert.equal(checkSillPlateHeight(0.2, 1.2).status, 'approx');
    assert.equal(checkSillPlateHeight(0.24, 1.2).status, 'approx');
    assert.equal(checkSillPlateHeight(0.25, 1.2).status, 'violation');
    assert.equal(checkSillPlateHeight(0.08, 1.2).status, 'violation');
    assert.equal(checkSillPlateHeight(0.35, 1.2).status, 'violation');
  });

  it('10. P1-N3: сплошной подоконный пояс > u', () => {
    assert.equal(checkSillCorniceHeight(0.26, 0.2).status, 'ok');
    assert.equal(checkSillCorniceHeight(0.18, 0.2).status, 'approx');
  });

  it('11. P1-N27/N28: 5-этажные схемы standard vs rich_1_2_unified', () => {
    assert.equal(checkFiveStoryScheme('standard', 5, 1.2, 20.0, 1.0).status, 'ok');
    assert.equal(checkFiveStoryScheme('rich_1_2_unified', 5, 1.2, 20.0, 1.2).status, 'ok');
    assert.equal(checkFiveStoryScheme('rich_1_2_unified', 5, 1.6, 20.0, 1.0).status, 'approx');
  });

  it('12. P2-N4/N5: кратность окна 7–8 рядам руста и нечётность угловой рустовки', () => {
    assert.equal(checkWindowRows(2.4, 0.32, true).status, 'ok');
    assert.equal(checkWindowRows(1.8, 0.35, true).status, 'approx');
    assert.equal(checkCornerRusticationRows(7).status, 'ok');
    assert.equal(checkCornerRusticationRows(6).status, 'approx');
  });

  it('13. P2-N6: угловой отступ M ≤ N (рис. 7, UX-эвристика)', () => {
    assert.equal(checkCornerOffsetVsUpperHeight(2.6, 3.2).status, 'ok');
    assert.equal(checkCornerOffsetVsUpperHeight(3.6, 3.2).status, 'approx');
  });

  it('14. P2-N8/N9/N10/N13: крылья и ризалиты (ширина и простенки)', () => {
    assert.equal(checkWingPierWidth(1.2, 1.5).status, 'ok');
    assert.equal(checkWingPierWidth(1.7, 1.5).status, 'violation');
    assert.equal(checkSideRisalitWidth(3.0, 5.0).status, 'ok');
    assert.equal(checkSideRisalitWidth(4.0, 5.0).status, 'violation');
    assert.equal(checkWingVsSideRisalit(6.5, 3.0).status, 'ok');
    assert.equal(checkWingVsSideRisalit(2.5, 3.0).status, 'violation');
    assert.equal(checkMiddleVsSideRisalit(5.0, 3.0).status, 'ok');
  });

  it('15. P2-N11/N12: 5-частная и 7-частная композиция 1.5:3:5:3:1.5', () => {
    assert.equal(checkFivePartFacade(6.0, 3.5, 4.5, 3, 2, 1).status, 'ok');
    assert.equal(checkFivePartFacade(3.5, 4.0, 4.5, 3, 2, 1).status, 'violation');
    assert.equal(checkSevenPartFacade([1.5, 3.0, 5.0, 3.0, 1.5]).status, 'ok');
    assert.equal(checkSevenPartFacade([2.5, 3.0, 4.0, 3.0, 2.5]).status, 'approx');
  });

  it('16. P2-N14..N17: оси ризалита, запрет пилястра между парой окон и 2 окна середины', () => {
    assert.equal(checkCentralRisalitAxes(3).status, 'ok');
    assert.equal(checkCentralRisalitAxes(2).status, 'approx');
    assert.equal(checkWingAxes(1).status, 'ok');
    assert.equal(checkPilasterBetweenWindowPairs(false).status, 'ok');
    assert.equal(checkPilasterBetweenWindowPairs(true).status, 'violation');
    assert.equal(checkMiddleAxesInTwoSideRisalits(3).status, 'ok');
    assert.equal(checkMiddleAxesInTwoSideRisalits(2).status, 'violation');
  });

  it('17. P2-N18/N19: многоярусные пилястры', () => {
    assert.equal(checkPilasterRepetition(true, 0.2).status, 'ok');
    assert.equal(checkPilasterRepetition(true, 0.05).status, 'approx');
    assert.equal(checkPilastersOnlyUpper(false).status, 'ok');
    assert.equal(checkPilastersOnlyUpper(true).status, 'approx');
  });

  it('18. P2-N23/N25: аттик (approx только над ризалитом) и богатство отделки ризалита vs крыла', () => {
    assert.equal(checkAttic(true, true, true).status, 'ok');
    assert.equal(checkAttic(true, true, false).status, 'approx');
    assert.equal(checkAttic(true, false, true).status, 'approx');
    assert.equal(checkAttic(true, true, true, 0.8, 0.9).status, 'approx');
    assert.equal(checkAttic(true, true, true, 1.1, 0.8).status, 'ok');
    assert.equal(checkRisalitRichness(4, 2, false).status, 'ok');
    assert.equal(checkRisalitRichness(1, 3, false).status, 'violation');
    assert.equal(checkRisalitRichness(1, 3, true).status, 'approx');
  });

  it('19. N7 и entrancePosition: чётные оси при центральном входе — approx, при боковом во встроенном — ok', () => {
    const centerEven = checkAxesCount(4, 'multi-story', 'three', true, 'center');
    assert.equal(centerEven.status, 'approx');
    const rightEmbedded = checkAxesCount(4, 'multi-story', 'three', true, 'right');
    assert.equal(rightEmbedded.status, 'ok');
    assert.ok(checkAxesCount(6, 'two-story', 'general', false, 'center').explanation.includes('2+2+2'));
    assert.ok(getAxesGroupingHint(6).length >= 10);
  });

  it('20. P3-N20..N22: экспертные проверки пилястра и колонн', () => {
    assert.equal(checkPilasterNarrowerThanWallPier(0.45, 0.7).status, 'ok');
    assert.equal(checkPilasterNarrowerThanWallPier(0.75, 0.7).status, 'violation');
    assert.equal(checkPairedPilastersGap(0.3, 0.5).status, 'ok');
    assert.equal(checkPairedPilastersGap(0.05, 0.5).status, 'violation');
    assert.equal(checkColumnProfileType('three_quarters').status, 'ok');
    assert.equal(checkColumnProfileType('half').status, 'approx');
  });

  it('21. P3-N24/N26 и expertMode: фронтон и переключение видимости P3 в evaluateFacadeSummary', () => {
    assert.equal(checkPedimentChoice('steep').status, 'ok');
    const steepClassical = checkPedimentChoice('steep', true);
    assert.equal(steepClassical.status, 'approx');
    assert.equal(steepClassical.sourceStatus, 'heuristic');
    assert.equal(checkPedimentChoice('gentle', true).status, 'ok');
    assert.equal(checkEqualWidthRisalitWingPediment(4.0, 4.0, false).status, 'approx');
    assert.equal(checkEqualWidthRisalitWingPediment(4.0, 4.0, true).status, 'ok');

    const base = createDefaultParamsForTypology('urban_house');
    const stdSummary = evaluateFacadeSummary(base, { expertMode: false });
    const expSummary = evaluateFacadeSummary(base, { expertMode: true });
    assert.equal(stdSummary.checks.some((c) => c.isExpertOnly), false);
    assert.equal(expSummary.checks.some((c) => c.isExpertOnly), true);
  });

  it('22. Замочки параметров: filterUnlockedPatch сохраняет заблокированные поля (скаляры, socleParts, levels)', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const locks = {
      w: true,
      hMain: true,
      'socleParts.rumpf': true,
      'levels.groundToFloor1': true,
      'levels.floor.0.floorToFloor': true,
    };

    assert.equal(isParamLocked(locks, 'w'), true);
    assert.equal(isParamLocked(locks, 'h'), false);
    assert.equal(countLockedParams(locks), 5);

    const presetPatch = applyBuildingVariantPreset(base, 'two-story', 'general');
    const filtered = filterUnlockedPatch(base, presetPatch, locks);
    const next = { ...base, ...filtered };

    assert.equal(next.w, base.w);
    assert.equal(next.hMain, base.hMain);
    assert.equal(next.socleParts.rumpf, base.socleParts.rumpf);
    assert.equal(next.levels.groundToFloor1, base.levels.groundToFloor1);
    assert.equal(next.levels.floors[0].floorToFloor, base.levels.floors[0].floorToFloor);
    // Незаблокированный параметр меняется свободно
    assert.equal(next.floors, 2);

    // Блокировка H защищает также levels.floors[*].floorToFloor от синхронизации, если меняется H
    const hLocked = filterUnlockedPatch(base, { H: 5.5, w: 2.0 }, { H: true });
    assert.equal(hLocked.H, undefined);
    assert.equal(hLocked.w, 2.0);
  });

  it('23. Нарушения и читальный зал: все ID проверок покрыты RULE_BOOK_EXCERPTS и цитаты дословно совпадают со страницами', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const variants: typeof base[] = [
      base,
      {
        ...base,
        compKind: 'five_part',
        beltIsSillCornice: true,
        hasWallRustication: true,
        withConsoles: true,
        hasPairedPilasters: true,
        columnProfileType: 'half',
      },
      {
        ...base,
        compKind: 'seven_part',
      },
      {
        ...base,
        compKind: 'two_side_risalits',
      },
    ];

    for (const v of variants) {
      const summary = evaluateFacadeSummary(v, { expertMode: true });
      for (const check of summary.checks) {
        const direct = RULE_BOOK_EXCERPTS[check.id];
        assert.ok(direct, `Missing RULE_BOOK_EXCERPTS entry for check.id=${check.id}`);
        const excerpt = getExcerptForCheckId(check.id, check.page);
        assert.equal(excerpt.id, check.id);
        assert.ok(excerpt.bookQuoteRu.length > 0 && excerpt.bookQuoteDe.length > 0);
      }
    }

    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    for (const [key, excerpt] of Object.entries(RULE_BOOK_EXCERPTS)) {
      const page = BRAUSEWETTER_PAGES.find((p) => p.pageNumber === String(excerpt.pageNumber));
      assert.ok(page, `Missing BRAUSEWETTER_PAGES entry for ${key} (page ${excerpt.pageNumber})`);
      const ruFull = normalize(
        [
          page.sectionTitleRu,
          ...page.paragraphs.flatMap((p) => [p.subheadingRu ?? '', p.subsubheadingRu ?? '', p.ru]),
          ...(page.figures?.map((f) => f.captionRu) ?? []),
        ].join(' ')
      );
      const deFull = normalize(
        [
          page.sectionTitleDe,
          ...page.paragraphs.flatMap((p) => [p.subheadingDe ?? '', p.subsubheadingDe ?? '', p.de]),
          ...(page.figures?.map((f) => f.captionDe) ?? []),
        ].join(' ')
      );
      assert.ok(
        ruFull.includes(normalize(excerpt.bookQuoteRu)),
        `RU quote mismatch for ${key} on page ${excerpt.pageNumber}: "${excerpt.bookQuoteRu}"`
      );
      assert.ok(
        deFull.includes(normalize(excerpt.bookQuoteDe)),
        `DE quote mismatch for ${key} on page ${excerpt.pageNumber}: "${excerpt.bookQuoteDe}"`
      );
    }
  });

  it('24. Экспорт ортогонального чертежа в DWG: корректный бинарный AC1027 со слоями и геометрией', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const summary = evaluateFacadeSummary(base, { expertMode: true });
    const dwgBytes = exportFacadeToDwg(base, summary);

    assert.ok(dwgBytes instanceof Uint8Array);
    assert.ok(dwgBytes.byteLength > 2000, 'DWG buffer should not be empty');
    const magic = new TextDecoder('ascii').decode(dwgBytes.slice(0, 6));
    assert.equal(magic, 'AC1027');

    // Проверяем обратное чтение DWG библиотекой
    const arrayBuffer = new Uint8Array(dwgBytes).buffer;
    const parsedDoc = DwgReader.readFromStream(arrayBuffer);
    assert.ok(parsedDoc.layers?.tryGetValue('01_WALL_FACADE'));
    assert.ok(parsedDoc.layers?.tryGetValue('02_SOCLE'));
    assert.ok(parsedDoc.layers?.tryGetValue('05_WINDOWS_DOORS'));
    assert.ok(parsedDoc.layers?.tryGetValue('08_DIMENSIONS'));
    assert.ok((parsedDoc.modelSpace?.entities.count ?? 0) > 25);
  });

  it('25. Настройки входа (двери): наличие, отметки низа/верха, ширина, высота, середина vs ось и DWG', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const D = D_from_A(base.A, base.k_D);

    // 1. Нет входа на фасаде
    const noDoorParams = { ...base, hasEntrance: false };
    const noDoorAxes = Array.from({ length: noDoorParams.axesCount }, (_, i) => D + i * noDoorParams.A);
    const noDoorWidth = 2 * D + (noDoorParams.axesCount - 1) * noDoorParams.A;
    const noDoorGeo = resolveEntranceGeometry(noDoorParams, noDoorWidth, noDoorAxes);
    assert.equal(noDoorGeo.hasDoor, false);
    assert.equal(resolveEntrancePositionFromSettings(false, 'facade_center', 0, 5), 'none');

    // 2. По середине фасада: нечётное число осей (5) -> совпадает со средней осью (idx 2)
    const oddGeo = resolveEntranceGeometry(
      { ...base, hasEntrance: true, axesCount: 5, entrancePlacement: 'facade_center' },
      2 * D + 4 * base.A,
      Array.from({ length: 5 }, (_, i) => D + i * base.A)
    );
    assert.equal(oddGeo.hasDoor, true);
    assert.equal(oddGeo.doorAxisIndex, 2);
    assertClose(oddGeo.doorCenterX, D + 2 * base.A);

    // 3. По середине фасада: чётное число осей (4) -> строго по центру фасада, окна сохраняются (doorAxisIndex === null)
    const evenWidth = 2 * D + 3 * base.A;
    const evenAxes = Array.from({ length: 4 }, (_, i) => D + i * base.A);
    const evenGeo = resolveEntranceGeometry(
      { ...base, hasEntrance: true, axesCount: 4, entrancePlacement: 'facade_center' },
      evenWidth,
      evenAxes
    );
    assert.equal(evenGeo.hasDoor, true);
    assert.equal(evenGeo.doorAxisIndex, null);
    assertClose(evenGeo.doorCenterX, evenWidth / 2);

    // 4. По конкретной оси окон (Ось 2 -> index 1)
    const axisGeo = resolveEntranceGeometry(
      {
        ...base,
        hasEntrance: true,
        axesCount: 4,
        entrancePlacement: 'axis',
        entranceAxisIndex: 1,
        entranceBottomM: 0.9,
        entranceHeightM: 2.3,
        entranceWidthM: 1.4,
      },
      evenWidth,
      evenAxes
    );
    assert.equal(axisGeo.hasDoor, true);
    assert.equal(axisGeo.doorAxisIndex, 1);
    assertClose(axisGeo.doorCenterX, evenAxes[1]);
    assertClose(axisGeo.doorBottomM, 0.9);
    assertClose(axisGeo.doorHeightM, 2.3);
    assertClose(axisGeo.doorTopM, 3.2);
    assertClose(axisGeo.doorWidthM, 1.4);

    // 5. Связанный замочек на отметке верха двери (entranceTopM)
    const topLockedState = { ...base, hasEntrance: true, entranceBottomM: 0.6, entranceHeightM: 2.4 }; // top = 3.0
    const patchMoveBottom = filterUnlockedPatch(
      topLockedState,
      { entranceBottomM: 1.0 },
      { entranceTopM: true }
    );
    assertClose(patchMoveBottom.entranceBottomM ?? -1, 1.0);
    assertClose(patchMoveBottom.entranceHeightM ?? -1, 2.0);

    const patchMoveHeight = filterUnlockedPatch(
      topLockedState,
      { entranceHeightM: 2.0 },
      { entranceTopM: true }
    );
    assertClose(patchMoveHeight.entranceHeightM ?? -1, 2.0);
    assertClose(patchMoveHeight.entranceBottomM ?? -1, 1.0);

    // 6. DWG-экспорт без двери и с приподнятой дверью (ступени крыльца)
    const noDoorSummary = evaluateFacadeSummary(noDoorParams, { expertMode: true });
    const noDoorDwg = exportFacadeToDwg(noDoorParams, noDoorSummary);
    const parsedNoDoor = DwgReader.readFromStream(new Uint8Array(noDoorDwg).buffer);

    const raisedDoorParams = {
      ...base,
      hasEntrance: true,
      axesCount: 4,
      entrancePlacement: 'facade_center' as const,
      entranceBottomM: 1.2,
      entranceHeightM: 2.5,
      entranceWidthM: 1.4,
    };
    const raisedSummary = evaluateFacadeSummary(raisedDoorParams, { expertMode: true });
    const raisedDwg = exportFacadeToDwg(raisedDoorParams, raisedSummary);
    const parsedRaised = DwgReader.readFromStream(new Uint8Array(raisedDwg).buffer);
    assert.ok(
      (parsedRaised.modelSpace?.entities.count ?? 0) >
        (parsedNoDoor.modelSpace?.entities.count ?? 0)
    );
  });

  it('26. Весь 1-й этаж в цоколь занимает только 1-й этаж, а низ пилястр (с базой и без) не ниже верха цоколя', () => {
    const base = {
      ...createDefaultParamsForTypology('miethaus'),
      pilasterFloors: [true, true, true, true],
    };
    const summaryFull = evaluateFacadeSummary(base, { expertMode: true });
    const fullBounds = resolveSocleAndPilasterBounds(base, summaryFull.derivedGeometry);

    const expectedFloor1Top =
      Math.max(0.25, base.levels.groundToFloor1) + base.levels.floors[0].floorToFloor;
    const expectedFloor2Top = expectedFloor1Top + base.levels.floors[1].floorToFloor;

    // 1. При useFullFloorAsSocle=true цоколь заканчивается ровно по верху 1-го этажа, не захватывая 2-й
    assert.equal(base.useFullFloorAsSocle, true);
    assertClose(fullBounds.socleTopM, expectedFloor1Top);
    assert.ok(fullBounds.socleTopM < expectedFloor2Top - 1.0);
    assert.ok(fullBounds.pilasterBottomM >= fullBounds.socleTopM - 1e-6);
    assertClose(fullBounds.pilasterBottomM, expectedFloor1Top);

    // 2. С обычным цоколем (hSocle=2.60 > groundToFloor1=0.70), с базой и без базы (Mauerpfeiler)
    const urban = createDefaultParamsForTypology('urban_house');
    for (const isMauerpfeiler of [false, true]) {
      const p = { ...urban, hSocle: 2.6, isMauerpfeiler, pilasterFloors: [true, true, true] };
      const sum = evaluateFacadeSummary(p, { expertMode: true });
      const bounds = resolveSocleAndPilasterBounds(p, sum.derivedGeometry);
      assertClose(bounds.socleTopM, 2.6);
      assert.ok(bounds.pilasterBottomM >= bounds.socleTopM - 1e-6);
      assertClose(bounds.pilasterBottomM, 2.6);

      // Проверка DWG: все сущности слоя 06_PILASTERS не опускаются ниже верха цоколя (2600 мм)
      const cad = buildFacadeCadDocument(p, sum);
      const pilasterEntities = Array.from(cad.modelSpace?.entities ?? []).filter(
        (ent) => ent.layer?.name === '06_PILASTERS'
      );
      assert.ok(pilasterEntities.length > 0);
      for (const ent of pilasterEntities) {
        const verts = (ent as { vertices?: Array<{ location: { y: number } }> }).vertices;
        if (verts) {
          for (const v of verts) {
            assert.ok(
              v.location.y >= 2600 - 1,
              `Pilaster vertex y=${v.location.y} below socle top 2600mm (isMauerpfeiler=${isMauerpfeiler})`
            );
          }
        }
      }
    }
  });

  it('27. Сверка с Brausewetter (S. 1–23): A1–A6, B1–B4, C1–C10 (источник, статусы и DWG F=0)', () => {
    // A4 & A5: встроенный дом любой этажности с боковым входом — ok и при чётном, и при нечётном числе осей; отдельно стоящий — approx
    assert.equal(checkAxesCount(5, 'two-story', 'general', true, 'right').status, 'ok');
    assert.equal(checkAxesCount(4, 'two-story', 'general', true, 'left').status, 'ok');
    assert.equal(checkAxesCount(5, 'multi-story', 'three', false, 'right').status, 'approx');

    // B1 & B4 & C4: villa/monumental/rich_columnar помечены heuristic; villa p_corner <= w даёт approx (не violation)
    assert.equal(allowedAxisRatio('villa', 'two-story', 'general').sourceStatus, 'heuristic');
    assert.equal(allowedAxisRatio('monumental', 'multi-story', 'general').sourceStatus, 'heuristic');
    const villaCorner = check_corner('villa', 0.9, 1.1, 0.8, 0.75, 1.65, false);
    assert.equal(villaCorner.status, 'approx');
    assert.equal(villaCorner.sourceStatus, 'heuristic');
    const simpleCorner = check_corner('simple_house', 0.9, 1.1, 0.8, 0.75, 1.65, false);
    assert.equal(simpleCorner.status, 'violation');
    assert.equal(check_corner('rich_columnar', 1.2, 1.1, 0.8, 0.8, 1.95, false).sourceStatus, 'heuristic');

    // B2 & B3: нечётность рустовки цоколя и Abkröpfung на цоколе при лопатках -> heuristic
    const evenRust = rusticationRows(1.4, 0.35); // n=4 (чётное, шаг 0.35 в [0.3, 0.4])
    assert.equal(evenRust.status, 'approx');
    assert.equal(evenRust.sourceStatus, 'heuristic');
    assert.equal(abkroepfungPreference(true, false).sourceStatus, 'explicit-verified');
    assert.equal(abkroepfungPreference(false, true).sourceStatus, 'heuristic');

    // C1: угловая рустовка — проверка начала и конца длинными квадрами (S. 15)
    assert.equal(checkCornerRusticationRows(7, true).status, 'ok');
    assert.equal(checkCornerRusticationRows(7, false).status, 'approx');

    // C5: без useFloorToFloorForBelt высота ленты от H_в_свету помечается approx + heuristic
    const urban = createDefaultParamsForTypology('urban_house');
    const summaryClearBelt = evaluateFacadeSummary({
      ...urban,
      beltIsAbsent: false,
      beltFloors: [true, true],
      useFloorToFloorForBelt: false,
      hGurt: 0.4,
    });
    assert.equal(summaryClearBelt.beltHeightCheck.status, 'approx');
    assert.equal(summaryClearBelt.beltHeightCheck.sourceStatus, 'heuristic');

    // C6: прямое опирание карниза без фриза (F=0, например 4:0:5) и экспорт в DWG
    const directFraming = framing_from_T(0.45, 4, 0, 5);
    assertClose(directFraming.F, 0);
    assert.equal(directFraming.status, 'ok');
    assert.equal(framing_from_T(0.45, 5, 0, 4).status, 'approx');
    const f0Params = { ...urban, withFraming: true, framingRatio: [4, 0, 5] as [number, number, number] };
    const f0Summary = evaluateFacadeSummary(f0Params, { expertMode: true });
    assertClose(f0Summary.framingResult.F, 0);
    const f0Dwg = exportFacadeToDwg(f0Params, f0Summary);
    assert.equal(new TextDecoder('ascii').decode(f0Dwg.slice(0, 6)), 'AC1027');

    // C8: 7-частный фасад — 2 боковых ризалита в центре предпочтительнее 1 среднего
    assert.equal(checkSevenPartFacade([1.5, 3, 5, 3, 1.5], undefined, 'two_side_risalits').status, 'ok');
    assert.equal(checkSevenPartFacade([1.5, 3, 5, 3, 1.5], undefined, 'one_middle_risalit').status, 'approx');

    // C9: отдельно стоящий многоэтажный дом с лежачим прямоугольником допустим (S. 14)
    assert.equal(checkFacadeRectangle(18, 13, 'multi-story', 'three', false).status, 'ok');
    assert.equal(checkFacadeRectangle(18, 13, 'multi-story', 'three', true).status, 'approx');

    // C10: нижний порог gap <= 0.2*W_p — heuristic, тогда как gap >= W_p — explicit-verified
    assert.equal(checkPairedPilastersGap(0.05, 0.5).sourceStatus, 'heuristic');
    assert.equal(checkPairedPilastersGap(0.6, 0.5).sourceStatus, 'explicit-verified');

    // Поиск по тексту Читального зала и Терминологии
    assert.equal(countSearchMatches('Hauptgesims und Hauptgesims', 'hauptgesims'), 2);
    assert.equal(countSearchMatches('Высота цоколя и высота этажа', 'цокол'), 1);
    assert.equal(countSearchMatches('Текст без совпадений', ''), 0);
  });

  it('28. Полный 1-й этаж в цоколе сохраняет трёхчастное деление и рустовку в DWG', () => {
    const base = { ...createDefaultParamsForTypology('miethaus'), hasSocleRustication: true };
    assert.equal(base.useFullFloorAsSocle, true);
    const sum = evaluateFacadeSummary(base, { expertMode: true });
    const cad = buildFacadeCadDocument(base, sum);
    const socleEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '02_SOCLE'
    );
    // Должны присутствовать контур цоколя, Deckgesims, Fuß, а также швы рустовки
    assert.ok(socleEnts.length >= 6, `Expected >=6 entities in 02_SOCLE for 3-part full-floor socle, got ${socleEnts.length}`);
  });

  it('29. Пилястры и лопатки: включение по этажам, края vs каждый простенок и соблюдение низа >= цоколя', () => {
    const urban = createDefaultParamsForTypology('urban_house');
    // 3-этажный фасад, 4 оси -> 5 вертикальных позиций в режиме every_pier (2 края + 3 внутренних простенка)
    const paramsEveryPier = {
      ...urban,
      floors: 3,
      axesCount: 4,
      levels: buildDefaultLevels(3, urban.H, urban.levels.groundToFloor1),
      hSocle: 2.2,
      useFullFloorAsSocle: false,
      pilasterPlacement: 'every_pier' as const,
      pilasterFloors: [true, false, true],
    };
    const sum = evaluateFacadeSummary(paramsEveryPier, { expertMode: true });
    const dg = sum.derivedGeometry;
    const cornerD = D_from_A(paramsEveryPier.A, paramsEveryPier.k_D);
    const axesM = Array.from({ length: paramsEveryPier.axesCount }, (_, idx) => cornerD + idx * paramsEveryPier.A);
    const xPosEdges = resolvePilasterXPositions(
      { ...paramsEveryPier, pilasterPlacement: 'edges' },
      dg.facadeWidth,
      axesM,
      paramsEveryPier.Wp
    );
    const xPosPier = resolvePilasterXPositions(paramsEveryPier, dg.facadeWidth, axesM, paramsEveryPier.Wp);
    assert.equal(xPosEdges.length, 2);
    assert.equal(xPosPier.length, 5);

    const spans = resolvePilasterElevationSpans(paramsEveryPier, dg);
    assert.equal(spans.length, 2); // 1-й и 3-й этажи
    const bounds = resolveSocleAndPilasterBounds(paramsEveryPier, dg);
    for (const sp of spans) {
      assert.ok(sp.bottomM >= bounds.socleTopM - 1e-6);
    }

    const cad = buildFacadeCadDocument(paramsEveryPier, sum);
    const pilEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '06_PILASTERS'
    );
    // 5 позиций × 2 этажа => как минимум 10 полилиний тел + базы/капители
    assert.ok(pilEnts.length >= 10, `Expected >=10 pilaster entities, got ${pilEnts.length}`);
  });

  it('30. Ручная общая высота здания (manualTotalHeight) масштабирует вертикальную геометрию и DWG', () => {
    const urban = createDefaultParamsForTypology('urban_house');
    const targetH = 18.0;
    const manualParams = {
      ...urban,
      levels: { ...urban.levels, manualTotalHeight: targetH },
    };
    const sum = evaluateFacadeSummary(manualParams, { expertMode: true });
    const scaled = resolveScaledVerticalGeometry(manualParams, sum.derivedGeometry);
    assertClose(scaled.corniceTopM, targetH);
    assertClose(scaled.totalHeightM, targetH);

    const cad = buildFacadeCadDocument(manualParams, sum);
    const wallEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '01_WALL_FACADE'
    );
    assert.ok(wallEnts.length > 0);
    let maxWallY = 0;
    for (const ent of wallEnts) {
      const verts = (ent as { vertices?: Array<{ location: { y: number } }> }).vertices;
      if (verts) {
        for (const v of verts) {
          if (v.location.y > maxWallY) maxWallY = v.location.y;
        }
      }
    }
    assertClose(maxWallY / 1000, scaled.wallTopM);
  });

  it('31. Кнопка «Показать в тексте» и ссылки на терминологию: все 41 правило привязаны к первоисточнику', () => {
    assert.equal(RULES_DATA.rules.length, 41);
    for (const rule of RULES_DATA.rules) {
      const excerpt = getExcerptForCatalogRule(rule);
      assert.ok(excerpt.pageNumber >= 1 && excerpt.pageNumber <= 23, `Rule ${rule.id} page out of bounds`);
      assert.ok(excerpt.bookQuoteDe.length > 5 && excerpt.bookQuoteRu.length > 5);
    }
    const gurtTerm = findGlossaryEntryByTerm('Gurtgesims');
    assert.ok(gurtTerm && typeof gurtTerm.pageNumber === 'string' && parseInt(gurtTerm.pageNumber, 10) >= 1);
    const sockelTerm = findGlossaryEntryByTerm('цоколь');
    assert.ok(sockelTerm && typeof sockelTerm.pageNumber === 'string' && parseInt(sockelTerm.pageNumber, 10) >= 1);
  });

  it('32. Экспорт чертежей блока «Деталь» в формат DWG: все 6 схем валидны в AC1027', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const summary = evaluateFacadeSummary(base, { expertMode: true });
    const plateIds: DetailPlateId[] = ['fan', 'golden', 'diagonal', 'cornice', 'socle', 'belt'];
    for (const plateId of plateIds) {
      const dwgBytes = exportDetailPlateToDwg(plateId, base, summary);
      assert.ok(dwgBytes instanceof Uint8Array && dwgBytes.byteLength > 1500, `Plate ${plateId} DWG empty`);
      const magic = new TextDecoder('ascii').decode(dwgBytes.slice(0, 6));
      assert.equal(magic, 'AC1027', `Plate ${plateId} header mismatch`);
      const parsed = DwgReader.readFromStream(new Uint8Array(dwgBytes).buffer);
      assert.ok((parsed.modelSpace?.entities.count ?? 0) >= 8, `Plate ${plateId} should contain geometry`);
    }
  });

  it('33. Карниз сандрика экспортируется и отображается как трапеция (верхнее основание шире нижнего)', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const richParams = { ...base, withFraming: true };
    const summary = evaluateFacadeSummary(richParams, { expertMode: true });
    const cad = buildFacadeCadDocument(richParams, summary);
    const openingPolys = Array.from(cad.modelSpace?.entities ?? []).filter((ent) => {
      if (ent.layer?.name !== '05_WINDOWS_DOORS') return false;
      const verts = (ent as unknown as { vertices?: Array<{ location: { x: number; y: number } }> }).vertices;
      return Boolean(verts && verts.length === 4);
    });
    const trapezoids = openingPolys.filter((ent) => {
      const verts = (ent as unknown as { vertices: Array<{ location: { x: number; y: number } }> }).vertices;
      const ys = verts.map((v) => v.location.y);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const botPts = verts.filter((v) => Math.abs(v.location.y - minY) < 1e-3);
      const topPts = verts.filter((v) => Math.abs(v.location.y - maxY) < 1e-3);
      if (botPts.length !== 2 || topPts.length !== 2) return false;
      const botW = Math.abs(botPts[1].location.x - botPts[0].location.x);
      const topW = Math.abs(topPts[1].location.x - topPts[0].location.x);
      return topW > botW + 10;
    });
    assert.equal(trapezoids.length, richParams.axesCount);
  });

  it('34. Гладкий цоколь (hasSocleRustication=false): отключает ряды руста в проверке и DWG, сохраняя 3-частное деление', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const smoothParams = {
      ...base,
      hasSocleRustication: false,
      rustRowHeight: 0.22, // вне диапазона [0.30, 0.40], но при отключённой рустовке нарушений быть не должно
    };
    const sum = evaluateFacadeSummary(smoothParams, { expertMode: true });
    assert.equal(sum.rusticationCheck.enabled, false);
    assert.equal(sum.rusticationCheck.n, 0);
    assert.equal(sum.rusticationCheck.status, 'ok');
    assert.equal(sum.rusticationCheck.sourceStatus, 'explicit-verified');
    assert.ok(sum.threePartSocleResult.fuss > 0 && sum.threePartSocleResult.rumpf > 0 && sum.threePartSocleResult.deck > 0);

    const cad = buildFacadeCadDocument(smoothParams, sum);
    const socleEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '02_SOCLE'
    );
    // Только 3 замкнутых прямоугольника (контур цоколя, Fuß, Deckgesims) без горизонтальных линий руста
    assert.equal(socleEnts.length, 3);

    const detailBytes = exportDetailPlateToDwg('socle', smoothParams, sum);
    assert.ok(detailBytes.byteLength > 1500);
  });

  it('35. На всех типах зданий по умолчанию вход отключён и рустовка тулова цоколя выключена', () => {
    const types = ['simple_house', 'urban_house', 'miethaus', 'villa', 'rich_columnar', 'monumental', 'palace'] as const;
    for (const typeId of types) {
      const def = createDefaultParamsForTypology(typeId);
      assert.equal(def.hasEntrance, false, `${typeId} must default to hasEntrance=false`);
      assert.equal(def.entrancePosition, 'none', `${typeId} must default to entrancePosition=none`);
      assert.equal(def.hasSocleRustication, false, `${typeId} must default to hasSocleRustication=false`);
    }
  });

  it('36. При включении всего 1-го этажа в цоколь правило главного карниза (1/8–1/12, 1/12–1/15 и < цоколя) не работает', () => {
    const urban = createDefaultParamsForTypology('urban_house');
    // Заведомо малое и заведомо большое значение hMain при обычном цоколе дают violation,
    // но при useFullFloorAsSocle=true правило не применяется (status='ok', notApplicable=true).
    const smallOffSocle = evaluateFacadeSummary({ ...urban, useFullFloorAsSocle: false, hMain: 0.45 }, { expertMode: true });
    assert.equal(smallOffSocle.mainCorniceCheck.status, 'violation');
    assert.equal(smallOffSocle.mainCorniceCheck.notApplicable, false);

    const smallFullSocle = evaluateFacadeSummary({ ...urban, useFullFloorAsSocle: true, hMain: 0.45 }, { expertMode: true });
    assert.equal(smallFullSocle.mainCorniceCheck.status, 'ok');
    assert.equal(smallFullSocle.mainCorniceCheck.notApplicable, true);

    const largeFullSocle = evaluateFacadeSummary({ ...urban, useFullFloorAsSocle: true, hMain: 2.3 }, { expertMode: true });
    assert.equal(largeFullSocle.mainCorniceCheck.status, 'ok');
    assert.equal(largeFullSocle.mainCorniceCheck.notApplicable, true);
  });

  it('37. По умолчанию у всех типов зданий межэтажные ленты отключены без ложных нарушений', () => {
    const types = ['simple_house', 'urban_house', 'miethaus', 'villa', 'rich_columnar', 'monumental', 'palace'] as const;
    for (const typeId of types) {
      const def = createDefaultParamsForTypology(typeId);
      assert.equal(def.beltIsAbsent, true, `${typeId} must default to beltIsAbsent=true`);
      assert.equal(hasAnyActiveBelt(def), false, `${typeId} must default to no active belts`);
      const mask = resolveBeltFloorsMask(def);
      assert.equal(mask.length, Math.max(0, def.levels.floors.length - 1));
      assert.ok(mask.every((v) => !v), `${typeId} beltFloors must all be false`);
      const sum = evaluateFacadeSummary(def, { expertMode: true });
      assert.equal(sum.beltHeightCheck.notRequired, true);
      assert.equal(sum.gurtCheck.notRequired, true);
    }
  });

  it('38. Поэтажные ленты: настройка над каждым этажом кроме верхнего и экспорт в DWG', () => {
    const urban = createDefaultParamsForTypology('urban_house'); // 3 этажа -> 2 межэтажные границы
    const customBeltParams = {
      ...urban,
      beltIsAbsent: false,
      beltFloors: [false, true], // лента только над 2-м этажом (между 2 и 3), над 3-м (верхним) никогда нет
    };
    assert.equal(isBeltEnabledAboveFloor(customBeltParams, 0, 3), false);
    assert.equal(isBeltEnabledAboveFloor(customBeltParams, 1, 3), true);
    assert.equal(isBeltEnabledAboveFloor(customBeltParams, 2, 3), false); // верхний этаж: запрещено
    assert.equal(hasAnyActiveBelt(customBeltParams, 3), true);

    const sum = evaluateFacadeSummary(customBeltParams, { expertMode: true });
    const cad = buildFacadeCadDocument(customBeltParams, sum);
    const beltEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '04_BELTS'
    );
    // 1 граница без ленты (линия) + 1 граница с лентой (прямоугольник-полилиния)
    assert.equal(beltEnts.length, 2);
    const closedBeltPolys = beltEnts.filter((ent) => {
      const verts = (ent as unknown as { vertices?: unknown[] }).vertices;
      return Boolean(verts && verts.length === 4);
    });
    assert.equal(closedBeltPolys.length, 1);
  });

  it('39. Размерная цепочка высот слева от фасада: уровень пола 1-го этажа = 0.00, верх верхнего этажа и высоты всех этажей (в т.ч. в 1-этажном)', () => {
    const urban = createDefaultParamsForTypology('urban_house');
    const sum = evaluateFacadeSummary(urban, { expertMode: true });
    const vg = resolveScaledVerticalGeometry(urban, sum.derivedGeometry);
    const cad = buildFacadeCadDocument(urban, sum);
    const dimTexts = Array.from(cad.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '08_DIMENSIONS')
      .map((ent) => (ent as unknown as { value?: string }).value)
      .filter((val): val is string => typeof val === 'string');

    assert.ok(dimTexts.includes('0.00'), 'Left datum chain must include 0.00 at 1st floor');
    const expectedGround = `-${vg.groundToFloor1.toFixed(2)} (земля)`;
    assert.ok(
      dimTexts.some((t) => t.startsWith(`-${vg.groundToFloor1.toFixed(2)}`)),
      `Left datum chain must include ground elevation ${expectedGround}, got: ${dimTexts.join(', ')}`
    );
    const floor2Rel = vg.floorOffsetsM[1] - vg.floorOffsetsM[0];
    assert.ok(
      dimTexts.includes(`+${floor2Rel.toFixed(2)}`),
      `Left datum chain must include 2nd floor +${floor2Rel.toFixed(2)}, got: ${dimTexts.join(', ')}`
    );
    const wallTopRel = vg.wallTopM - vg.floorOffsetsM[0];
    assert.ok(
      dimTexts.includes(`+${wallTopRel.toFixed(2)}`),
      `Left datum chain must include top of upper floor +${wallTopRel.toFixed(2)}, got: ${dimTexts.join(', ')}`
    );
    for (let flIdx = 0; flIdx < vg.floorHeightsM.length; flIdx += 1) {
      const flLabel = `${vg.floorHeightsM[flIdx].toFixed(2)} м`;
      assert.ok(
        dimTexts.includes(flLabel),
        `Left floor chain must include floor ${flIdx + 1} height ${flLabel}, got: ${dimTexts.join(', ')}`
      );
    }

    // Одноэтажный дом: цепочка также доходит до верха 1-го этажа и содержит размер 1-го этажа
    const oneStory = {
      ...urban,
      ...applyBuildingVariantPreset(urban, 'one-story', 'general'),
    };
    const oneSum = evaluateFacadeSummary(oneStory, { expertMode: true });
    const oneVg = resolveScaledVerticalGeometry(oneStory, oneSum.derivedGeometry);
    const oneCad = buildFacadeCadDocument(oneStory, oneSum);
    const oneDimTexts = Array.from(oneCad.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '08_DIMENSIONS')
      .map((ent) => (ent as unknown as { value?: string }).value)
      .filter((val): val is string => typeof val === 'string');

    assert.ok(oneDimTexts.includes('0.00'));
    const oneTopRel = oneVg.wallTopM - oneVg.floorOffsetsM[0];
    assert.ok(
      oneDimTexts.includes(`+${oneTopRel.toFixed(2)}`),
      `One-story left chain must include top of 1st floor +${oneTopRel.toFixed(2)}, got: ${oneDimTexts.join(', ')}`
    );
    const oneFloor1Label = `${oneVg.floorHeightsM[0].toFixed(2)} м`;
    assert.ok(
      oneDimTexts.includes(oneFloor1Label),
      `One-story left chain must include 1st floor height ${oneFloor1Label}, got: ${oneDimTexts.join(', ')}`
    );
  });

  it('40. Поэтажная настройка высоты окна относительно уровня пола этажа (SVG/DWG и замочки)', () => {
    const urban = createDefaultParamsForTypology('urban_house'); // 3 этажа, 3 оси
    const customSillParams = {
      ...urban,
      windowSillHeights: [0.4, 0.9, 1.1],
    };
    const sum = evaluateFacadeSummary(customSillParams, { expertMode: true });
    const vg = resolveScaledVerticalGeometry(customSillParams, sum.derivedGeometry);
    const cad = buildFacadeCadDocument(customSillParams, sum);

    // Обычные 4-вершинные прямоугольники проёмов (переплёты — Line, обрамления шире w)
    const winFrameRects = Array.from(cad.modelSpace?.entities ?? []).filter((ent) => {
      if (ent.layer?.name !== '05_WINDOWS_DOORS') return false;
      const verts = (ent as unknown as { vertices?: Array<{ location: { x: number; y: number } }> }).vertices;
      if (!verts || verts.length !== 4) return false;
      const xs = verts.map((v) => v.location.x);
      const widthMm = Math.max(...xs) - Math.min(...xs);
      return Math.abs(widthMm - customSillParams.w * 1000) < 5;
    });

    // На первой оси должно быть 3 окна с разными низами: floorStartM + sillM
    const ysBotMm = Array.from(
      new Set(
        winFrameRects.map((ent) => {
          const verts = (ent as unknown as { vertices: Array<{ location: { y: number } }> }).vertices;
          return Math.round(Math.min(...verts.map((v) => v.location.y)));
        })
      )
    ).sort((a, b) => a - b);

    assert.equal(ysBotMm.length, 3);
    assertClose(ysBotMm[0] / 1000, vg.floorOffsetsM[0] + 0.4);
    assertClose(ysBotMm[1] / 1000, vg.floorOffsetsM[1] + 0.9);
    // 3-й этаж проверяем через helper на клампинг
    const fl3Clear = customSillParams.levels.floors[2].clearHeight ?? 3.5;
    const fl3WinH = Math.min(customSillParams.h * 0.78, fl3Clear * 0.64);
    const expectedFl3Sill = resolveWindowSillHeightM(customSillParams, 2, fl3Clear, fl3WinH, 1);
    assertClose(ysBotMm[2] / 1000, vg.floorOffsetsM[2] + expectedFl3Sill);

    // Замочек поэтажной высоты окна защищает конкретный этаж при обновлении
    const lockedPatch = filterUnlockedPatch(
      customSillParams,
      { windowSillHeights: [1.2, 1.2, 1.2] },
      { 'windowSillHeights.1': true }
    );
    assert.equal(lockedPatch.windowSillHeights?.[0], 1.2);
    assert.equal(lockedPatch.windowSillHeights?.[1], 0.9);
    assert.equal(lockedPatch.windowSillHeights?.[2], 1.2);
  });

  it('41. Главный карниз: 1 и 2 варианты состава, одна венчающая часть (1/15–1/16, 1/16–1/20), отсчёт от H_зд вниз и DWG', () => {
    // 1) Два этажа, полный главный карниз (1 вариант: фриз+архитрав, 2 вариант: шейка+поясок): 1/12..1/8 H_зд и < цоколя
    const twoFrieze = checkMainCorniceWithVariant(1.6, 1.0, 9.6, 'two-story', 'general', 'full_entablature', false, 'frieze_architrave');
    assert.equal(twoFrieze.status, 'ok');
    assert.equal(twoFrieze.corniceFullStyle, 'frieze_architrave');
    assert.ok(twoFrieze.explanation.includes('1 вариант'));

    const twoNeck = checkMainCorniceWithVariant(1.6, 1.0, 9.6, 'two-story', 'general', 'full_entablature', false, 'neck_band');
    assert.equal(twoNeck.status, 'ok');
    assert.equal(twoNeck.corniceFullStyle, 'neck_band');
    assert.ok(twoNeck.explanation.includes('2 вариант'));

    // Превышение цоколя (hMain >= hSocle) даёт violation даже в диапазоне 1/8–1/12
    const twoOverSocle = checkMainCorniceWithVariant(0.95, 1.0, 9.6, 'two-story', 'general', 'full_entablature', false, 'neck_band');
    assert.equal(twoOverSocle.belowSocle, false);
    assert.equal(twoOverSocle.status, 'violation');

    // 2) Одна венчающая часть: 2 этажа -> 1/15..1/16; многоэтажный -> 1/16..1/20
    const twoCrownOk = checkMainCorniceWithVariant(1.6, 0.62, 9.6, 'two-story', 'general', 'crowning_only');
    assert.equal(twoCrownOk.status, 'ok');
    const twoCrownBad = checkMainCorniceWithVariant(1.6, 0.9, 9.6, 'two-story', 'general', 'crowning_only');
    assert.equal(twoCrownBad.status, 'violation');

    const multiCrownOk = checkMainCorniceWithVariant(2.5, 0.9, 16.0, 'multi-story', 'general', 'crowning_only');
    assert.equal(multiCrownOk.status, 'ok'); // 16/20=0.80 .. 16/16=1.00
    const multiCrownBad = checkMainCorniceWithVariant(2.5, 1.2, 16.0, 'multi-story', 'general', 'crowning_only');
    assert.equal(multiCrownBad.status, 'violation');

    // 3) Раскладка слоёв главного карниза и отсчёт от H_зд вниз
    const layersVar1 = resolveMainCorniceLayers(1.1, 0.275, 0.275, 'full_entablature', 'frieze_architrave');
    const layersVar2 = resolveMainCorniceLayers(1.1, 0.275, 0.275, 'full_entablature', 'neck_band');
    const layersCrown = resolveMainCorniceLayers(0.62, 0.275, 0.275, 'crowning_only', 'frieze_architrave');
    assertClose(layersVar1.huM + layersVar1.hlM + layersVar1.middleM + layersVar1.bottomBandM, 1.1);
    assertClose(layersVar2.huM + layersVar2.hlM + layersVar2.middleM + layersVar2.bottomBandM, 1.1);
    assert.ok(layersVar1.middleM > 0 && layersVar1.bottomBandM > 0);
    assert.ok(layersVar2.middleM > layersVar1.middleM); // у шейки доля чуть больше
    assert.equal(layersCrown.middleM, 0);
    assert.equal(layersCrown.bottomBandM, 0);
    assertClose(layersCrown.huM + layersCrown.hlM, 0.62);

    // 4) Отсчёт главного карниза от H_зд вниз при фиксированной manualTotalHeight и экспорт в DWG
    const base = createDefaultParamsForTypology('urban_house');
    const fixedTotalParams = {
      ...base,
      corniceVariantMode: 'full_entablature' as const,
      corniceFullStyle: 'neck_band' as const,
      hMain: 1.0,
      levels: { ...base.levels, manualTotalHeight: 14.0 },
    };
    const sum = evaluateFacadeSummary(fixedTotalParams, { expertMode: true });
    const vg = resolveScaledVerticalGeometry(fixedTotalParams, sum.derivedGeometry);
    assertClose(vg.totalHeightM, 14.0);
    assertClose(vg.corniceTopM, 14.0);
    assertClose(vg.wallTopM, 13.0);

    const cad = buildFacadeCadDocument(fixedTotalParams, sum);
    const corniceRects = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '03_CORNICE'
    );
    // В полном варианте (шейка+поясок) на слое 03_CORNICE: поясок, шейка, h_l, h_u = 4 прямоугольника
    assert.equal(corniceRects.length, 4);

    const crownParams = { ...fixedTotalParams, corniceVariantMode: 'crowning_only' as const, hMain: 0.8 };
    const crownSum = evaluateFacadeSummary(crownParams, { expertMode: true });
    const crownCad = buildFacadeCadDocument(crownParams, crownSum);
    const crownRects = Array.from(crownCad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '03_CORNICE'
    );
    // При одной венчающей части: только h_l и h_u = 2 прямоугольника
    assert.equal(crownRects.length, 2);
  });

  it('42. Прямое задание величин рядового и углового простенков (с обрамлением и без)', () => {
    const base = createDefaultParamsForTypology('urban_house');

    // Без обрамления: p = 1.45, p_corner = 1.90
    const nextANoFrame = A_from_pier_wu(1.45, base.w, base.u, false);
    const nextKDNoFrame = kD_from_cornerPier(1.9, nextANoFrame, base.w, base.u, false);
    const sumNoFrame = evaluateFacadeSummary({
      ...base,
      withFraming: false,
      A: nextANoFrame,
      k_D: nextKDNoFrame,
    });
    assertClose('p' in sumNoFrame.pierResult ? sumNoFrame.pierResult.p : 0, 1.45);
    assertClose(sumNoFrame.cornerCheck.p_corner, 1.9);

    // С обрамлением: p_c = 1.55, p_corner = 2.05
    const nextAWithFrame = A_from_pier_wu(1.55, base.w, base.u, true);
    const nextKDWithFrame = kD_from_cornerPier(2.05, nextAWithFrame, base.w, base.u, true);
    const sumWithFrame = evaluateFacadeSummary({
      ...base,
      withFraming: true,
      A: nextAWithFrame,
      k_D: nextKDWithFrame,
    });
    assertClose('p_c' in sumWithFrame.pierResult ? sumWithFrame.pierResult.p_c : 0, 1.55);
    assertClose(sumWithFrame.cornerCheck.p_corner, 2.05);

    // При ризалите по центру: p_corner -> risalitWidth = 2 * D
    const targetD = D_from_cornerPier(1.75, base.w, base.u, true);
    const sumRisalit = evaluateFacadeSummary({
      ...base,
      withFraming: true,
      isRisalitCentered: true,
      risalitWidth: targetD * 2,
    });
    assertClose(sumRisalit.cornerCheck.p_corner, 1.75);
  });

  it('43. Во всех типах зданий (Typologie) по умолчанию отсутствуют и межэтажные ленты, и пилястры', () => {
    const types = [
      'simple_house',
      'urban_house',
      'miethaus',
      'villa',
      'rich_columnar',
      'monumental',
      'palace',
    ] as const;

    for (const typeId of types) {
      const def = createDefaultParamsForTypology(typeId);
      assert.equal(def.beltIsAbsent, true, `${typeId} must default to beltIsAbsent=true`);
      assert.equal(def.beltHasColumnsBelow, false, `${typeId} must default to beltHasColumnsBelow=false`);
      assert.equal(hasAnyActiveBelt(def), false, `${typeId} must have no active belts`);
      assert.ok(resolveBeltFloorsMask(def).every((v) => !v), `${typeId} beltFloors must all be false`);

      assert.equal(def.pilastersOnlyOnUpperFloor, false, `${typeId} must have pilastersOnlyOnUpperFloor=false`);
      assert.ok(Array.isArray(def.pilasterFloors), `${typeId} must define pilasterFloors array`);
      assert.equal(def.pilasterFloors.length, def.levels.floors.length);
      assert.ok(def.pilasterFloors.every((v) => !v), `${typeId} pilasterFloors must all be false`);

      const sum = evaluateFacadeSummary(def, { expertMode: true });
      assert.equal(resolvePilasterElevationSpans(def, sum.derivedGeometry).length, 0);

      const cad = buildFacadeCadDocument(def, sum);
      const pilEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
        (ent) => ent.layer?.name === '06_PILASTERS'
      );
      assert.equal(pilEnts.length, 0, `${typeId} DWG must have 0 pilaster entities by default`);

      const closedBelts = Array.from(cad.modelSpace?.entities ?? []).filter((ent) => {
        if (ent.layer?.name !== '04_BELTS') return false;
        const verts = (ent as unknown as { vertices?: unknown[] }).vertices;
        return Boolean(verts && verts.length === 4);
      });
      assert.equal(closedBelts.length, 0, `${typeId} DWG must have 0 active closed belts by default`);

      // Смена пресета этажности сохраняет отключённые ленты и пилястры
      const patch45 = applyBuildingVariantPreset(def, 'multi-story', 'four-five');
      assert.equal(patch45.beltIsAbsent, true);
      assert.ok(patch45.beltFloors?.every((v) => !v));
      assert.ok(patch45.pilasterFloors?.every((v) => !v));
    }
  });

  it('44. Отдельное отключение сандрика (K = 0): расчёт R и F, отсутствие ложных нарушений и трапеций в DWG', () => {
    const noSandrikWithF = framing_from_T(1.3, 6, 7, 0);
    assertClose(noSandrikWithF.R, 0.6);
    assertClose(noSandrikWithF.F, 0.7);
    assertClose(noSandrikWithF.K, 0);
    assert.equal(noSandrikWithF.status, 'ok');

    const noSandrikOnlyR = framing_from_T(0.8, 4, 0, 0);
    assertClose(noSandrikOnlyR.R, 0.8);
    assertClose(noSandrikOnlyR.F, 0);
    assertClose(noSandrikOnlyR.K, 0);
    assert.equal(noSandrikOnlyR.status, 'ok');

    const urban = createDefaultParamsForTypology('urban_house');
    const paramsNoSandrik = {
      ...urban,
      withFraming: true,
      withoutSandrik: true,
      u: 0.6,
      T: 1.3,
      framingRatio: [6, 7, 8] as [number, number, number],
      withConsoles: true,
      a_front: 0.02,
      a_side: 0.08, // не должно давать console_offset при K=0
    };
    const sum = evaluateFacadeSummary(paramsNoSandrik, { expertMode: true });
    assertClose(sum.framingResult.K, 0);
    assertClose(sum.framingResult.R, 0.6);
    assertClose(sum.framingResult.F, 0.7);
    assert.equal(sum.framingResult.status, 'ok');
    assert.equal(sum.checks.some((c) => c.id === 'console_offset'), false);

    const cad = buildFacadeCadDocument(paramsNoSandrik, sum);
    const openingPolys = Array.from(cad.modelSpace?.entities ?? []).filter((ent) => {
      if (ent.layer?.name !== '05_WINDOWS_DOORS') return false;
      const verts = (ent as unknown as { vertices?: Array<{ location: { x: number; y: number } }> }).vertices;
      return Boolean(verts && verts.length === 4);
    });
    const trapezoids = openingPolys.filter((ent) => {
      const verts = (ent as unknown as { vertices: Array<{ location: { x: number; y: number } }> }).vertices;
      const ys = verts.map((v) => v.location.y);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const botPts = verts.filter((v) => Math.abs(v.location.y - minY) < 1e-3);
      const topPts = verts.filter((v) => Math.abs(v.location.y - maxY) < 1e-3);
      if (botPts.length !== 2 || topPts.length !== 2) return false;
      const botW = Math.abs(botPts[1].location.x - botPts[0].location.x);
      const topW = Math.abs(topPts[1].location.x - topPts[0].location.x);
      return topW > botW + 10;
    });
    assert.equal(trapezoids.length, 0, 'With K=0 no sandrik trapezoids should be emitted in DWG');
  });

  it('45. Изменение этажности от 1 до 10 этажей (applyFloorCountPreset, геометрия и DWG)', () => {
    const base = createDefaultParamsForTypology('urban_house');

    // Кламп за пределами 1..10
    assert.equal(applyFloorCountPreset(base, 0).floors, 1);
    assert.equal(applyFloorCountPreset(base, 15).floors, 10);

    // 1 этаж
    const p1 = { ...base, ...applyFloorCountPreset(base, 1) };
    assert.equal(p1.floors, 1);
    assert.equal(p1.buildingVariant, 'one-story');
    assert.equal(p1.levels.floors.length, 1);
    assert.equal(p1.beltIsAbsent, true);

    // 7 этажей (ранее было ограничено 6 этажами)
    const p7 = { ...base, ...applyFloorCountPreset(base, 7) };
    assert.equal(p7.floors, 7);
    assert.equal(p7.buildingVariant, 'multi-story');
    assert.equal(p7.multiSub, 'general');
    const sum7 = evaluateFacadeSummary(p7, { expertMode: true });
    const vg7 = resolveScaledVerticalGeometry(p7, sum7.derivedGeometry);
    assert.equal(vg7.floorOffsetsM.length, 7);
    assert.equal(vg7.floorHeightsM.length, 7);

    // 10 этажей: все 10 этажей строятся и экспортируются в DWG
    const p10 = { ...base, ...applyFloorCountPreset(base, 10) };
    assert.equal(p10.floors, 10);
    assert.equal(p10.levels.floors.length, 10);
    assert.equal(p10.pilasterFloors?.length, 10);
    assert.ok(p10.pilasterFloors?.every((v) => !v));
    assert.equal(p10.beltFloors?.length, 9);
    assert.ok(p10.beltFloors?.every((v) => !v));

    const sum10 = evaluateFacadeSummary(p10, { expertMode: true });
    const vg10 = resolveScaledVerticalGeometry(p10, sum10.derivedGeometry);
    assert.equal(vg10.floorOffsetsM.length, 10);
    assert.equal(vg10.floorHeightsM.length, 10);

    const cad10 = buildFacadeCadDocument(p10, sum10);
    const noteTexts = Array.from(cad10.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '09_ANNOTATIONS')
      .map((ent) => (ent as unknown as { value?: string }).value)
      .filter((val): val is string => typeof val === 'string');
    assert.ok(noteTexts.some((t) => t.includes('10 эт.')), 'DWG must include 10th floor tag');
    assert.ok(noteTexts.some((t) => t.includes('(10 эт.,')), 'DWG footer must state 10 floors');
  });

  it('46. Элемент R (4.4) всегда равен ширине обрамления u (4.1) в расчётах, пресетах и общих замках', () => {
    // 1. Все типологии по умолчанию имеют согласованные R === u и T === R + F + K
    for (const typo of RULES_DATA.typologies) {
      const def = createDefaultParamsForTypology(typo.id);
      const sum = evaluateFacadeSummary(def, { expertMode: true });
      assertClose(sum.framingResult.R, def.u);
      assertClose(sum.framingResult.T, def.T);
    }

    // 2. Прямое вычисление в evaluateFacadeSummary всегда берёт R = params.u
    const base = createDefaultParamsForTypology('urban_house');
    const directU = { ...base, withFraming: true, u: 0.24 };
    const directSum = evaluateFacadeSummary(directU, { expertMode: true });
    assertClose(directSum.framingResult.R, 0.24);
    assertClose(directSum.framingResult.F, 0.28);
    assertClose(directSum.framingResult.K, 0.32);
    assertClose(directSum.framingResult.T, 0.84);

    // 3. Изменение u (4.1 / 4.4) обновляет T; изменение T (4.4) обновляет u = R
    const afterU = computeNextFacadeParams(base, { u: 0.3 }, {});
    assertClose(afterU.u, 0.3);
    assertClose(afterU.T, 1.05);
    assertClose(evaluateFacadeSummary(afterU).framingResult.R, 0.3);

    const afterT = computeNextFacadeParams(afterU, { T: 1.26 }, {});
    assertClose(afterT.u, 0.36);
    assertClose(evaluateFacadeSummary(afterT).framingResult.R, 0.36);

    // 4. Отключение сандрика (K=0) при незакреплённом T сохраняет u = R и уменьшает T до R + F
    const noSandrik = computeNextFacadeParams(afterU, { withoutSandrik: true }, {});
    assertClose(noSandrik.u, 0.3);
    assertClose(noSandrik.T, 0.65);
    const noSandrikSum = evaluateFacadeSummary(noSandrik);
    assertClose(noSandrikSum.framingResult.R, 0.3);
    assertClose(noSandrikSum.framingResult.F, 0.35);
    assertClose(noSandrikSum.framingResult.K, 0);

    // 5. Общий замок на u / R блокирует изменение и через u, и через T, и при смене типологии
    const sharedLocks = { u: true };
    assert.equal(isFramingRLocked(sharedLocks), true);
    assert.equal(isFramingRLocked({ R: true }), true);

    const lockedTryU = computeNextFacadeParams(afterU, { u: 0.15 }, sharedLocks);
    assertClose(lockedTryU.u, 0.3);

    const lockedTryT = computeNextFacadeParams(afterU, { T: 1.4 }, sharedLocks);
    assertClose(lockedTryT.u, 0.3);
    assertClose(lockedTryT.T, 1.05);

    const palacePreset = createDefaultParamsForTypology('palace');
    const lockedSwitchTypo = computeNextFacadeParams(afterU, palacePreset, sharedLocks);
    assertClose(lockedSwitchTypo.u, 0.3);
    assertClose(lockedSwitchTypo.T, 1.05);
    assertClose(evaluateFacadeSummary(lockedSwitchTypo).framingResult.R, 0.3);

    // 6. При закреплённом T и свободном u: смена пропорции R:F:K пересчитывает u = R, сохраняя T
    const tLockedState = computeNextFacadeParams(
      afterU,
      { framingRatio: [1, 1, 1] },
      { T: true }
    );
    assertClose(tLockedState.T, 1.05);
    assertClose(tLockedState.u, 0.35);
    assertClose(evaluateFacadeSummary(tLockedState).framingResult.R, 0.35);
  });

  it('47. Режим «Экзамен»: скрытие подсказок до завершения, сохранение терминов и расчёт итога после проверки', () => {
    // 1. Слепой режим активен только когда examMode=true и examSubmitted=false
    assert.equal(isExamBlindState(false, false), false);
    assert.equal(isExamBlindState(false, true), false);
    assert.equal(isExamBlindState(true, false), true);
    assert.equal(isExamBlindState(true, true), false);

    // 2. Очистка нормативных подсказок сохраняет архитектурные термины и обозначения
    assert.equal(stripExamNormHints('Шаг осей A (Axenweite)'), 'Шаг осей A (Axenweite)');
    assert.equal(
      stripExamNormHints('Ширина обрамления с одной стороны u (Rahmen)'),
      'Ширина обрамления с одной стороны u (Rahmen)'
    );
    assert.equal(
      stripExamNormHints('Высота элемента R (= u, Rahmen)'),
      'Высота элемента R (= u, Rahmen)'
    );
    assert.equal(
      stripExamNormHints('Без сандрика (K = 0)'),
      'Без сандрика (K = 0)'
    );

    assert.equal(
      stripExamNormHints('Высота подоконной плиты h_sill (N2, норма w/8…w/7, до w/5 approx)'),
      'Высота подоконной плиты h_sill'
    );
    assert.equal(
      stripExamNormHints('Коэффициент k_D = D / A (норма 2/3 … 5/6, по умолчанию 4/5)'),
      'Коэффициент k_D = D / A'
    );
    assert.equal(
      stripExamNormHints('Обычный цоколь (S. 10, 12, 17)'),
      'Обычный цоколь'
    );
    assert.equal(
      stripExamNormHints('Цоколь высотой h_цок (из текста S. 8)'),
      'Цоколь высотой h_цок'
    );
    assert.equal(
      stripExamNormHints('Пилястры только на верхнем этаже (N19, нежелательно)'),
      'Пилястры только на верхнем этаже'
    );

    // 3. Итог экзамена отражает нарушения после завершения настройки
    const validBase = createDefaultParamsForTypology('urban_house');
    const validSummary = evaluateFacadeSummary(validBase, { expertMode: false });
    const validResult = getExamResultSummary(validSummary);
    assert.equal(validResult.violationCount, 0);
    assert.equal(validResult.passed, true);
    assert.equal(validResult.totalChecks, validSummary.checks.length);

    const badFacade = {
      ...validBase,
      useFullFloorAsSocle: false,
      hMain: 0.25, // заведомо слишком малый главный карниз -> нарушение
      h: validBase.w * 1.1, // слишком низкое окно -> нарушение 1.5w <= h <= 2w
    };
    const badSummary = evaluateFacadeSummary(badFacade, { expertMode: false });
    const badResult = getExamResultSummary(badSummary);
    assert.ok(badResult.violationCount >= 2);
    assert.equal(badResult.passed, false);
    assert.equal(badResult.overallStatus, 'violation');
  });

  it('48. Высота пилястр уменьшается сверху/снизу при наличии межэтажных лент (пилястра не пересекает ленты)', () => {
    const base = createDefaultParamsForTypology('urban_house'); // 3 этажа
    const allFloorsPilasters = {
      ...base,
      hSocle: 1.5,
      useFullFloorAsSocle: false,
      hGurt: 0.4,
      beltAsRusticationMode: false,
      beltIsSillCornice: false,
      pilasterFloors: [true, true, true],
      beltIsAbsent: true,
      beltFloors: [false, false],
    };

    const sumNoBelts = evaluateFacadeSummary(allFloorsPilasters, { expertMode: true });
    const vg = resolveScaledVerticalGeometry(allFloorsPilasters, sumNoBelts.derivedGeometry);
    const spansNoBelts = resolvePilasterElevationSpans(allFloorsPilasters, sumNoBelts.derivedGeometry);
    // Без лент все 3 этажа объединяются в один сплошной пилястр от верха цоколя до wallTopM
    assert.equal(spansNoBelts.length, 1);
    assertClose(spansNoBelts[0].bottomM, 1.5);
    assertClose(spansNoBelts[0].topM, vg.wallTopM);

    // 1. Включаем ленты над 1-м и 2-м этажами -> пилястры режутся на 3 непересекающихся участка
    const withBothBelts = {
      ...allFloorsPilasters,
      beltIsAbsent: false,
      beltFloors: [true, true],
    };
    const sumBothBelts = evaluateFacadeSummary(withBothBelts, { expertMode: true });
    const spansBoth = resolvePilasterElevationSpans(withBothBelts, sumBothBelts.derivedGeometry);
    const band0 = resolveBeltVerticalBandM(withBothBelts, vg, 0)!;
    const band1 = resolveBeltVerticalBandM(withBothBelts, vg, 1)!;

    assert.equal(spansBoth.length, 3);
    // 1-й этаж: только лента над ним -> уменьшение сверху до band0.bottomM
    assertClose(spansBoth[0].bottomM, 1.5);
    assertClose(spansBoth[0].topM, band0.bottomM);
    assert.ok(spansBoth[0].topM < vg.floorOffsetsM[1]);

    // 2-й этаж: лента под ним и лента над ним -> уменьшение и снизу (band0.topM), и сверху (band1.bottomM)
    assertClose(spansBoth[1].bottomM, band0.topM);
    assertClose(spansBoth[1].topM, band1.bottomM);
    assert.ok(spansBoth[1].bottomM > vg.floorOffsetsM[1]);
    assert.ok(spansBoth[1].topM < vg.floorOffsetsM[2]);
    assertClose(spansBoth[1].topM - spansBoth[1].bottomM, vg.floorHeightsM[1] - withBothBelts.hGurt);

    // 3-й этаж: лента под ним -> уменьшение снизу до band1.topM
    assertClose(spansBoth[2].bottomM, band1.topM);
    assertClose(spansBoth[2].topM, vg.wallTopM);
    assert.ok(spansBoth[2].bottomM > vg.floorOffsetsM[2]);

    // 2. DWG-проверка: ни один прямоугольник пилястр не пересекает диапазоны лент
    const cadBoth = buildFacadeCadDocument(withBothBelts, sumBothBelts);
    const pilEnts = Array.from(cadBoth.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '06_PILASTERS'
    );
    assert.ok(pilEnts.length >= 6);
    for (const ent of pilEnts) {
      const verts = (ent as { vertices?: Array<{ location: { y: number } }> }).vertices;
      if (!verts || verts.length === 0) continue;
      const ysM = verts.map((v) => v.location.y / 1000);
      const minY = Math.min(...ysM);
      const maxY = Math.max(...ysM);
      for (const band of [band0, band1]) {
        const overlapsBand = maxY > band.bottomM + 1e-4 && minY < band.topM - 1e-4;
        assert.equal(
          overlapsBand,
          false,
          `Pilaster [${minY.toFixed(3)}, ${maxY.toFixed(3)}] must not intersect belt [${band.bottomM.toFixed(3)}, ${band.topM.toFixed(3)}]`
        );
      }
    }

    // 3. Лента только над 1-м этажом ([true, false]): 1-й этаж подрезан сверху, 2-й и 3-й объединены и подрезаны снизу
    const onlyLowerBelt = {
      ...allFloorsPilasters,
      beltIsAbsent: false,
      beltFloors: [true, false],
    };
    const sumOnlyLower = evaluateFacadeSummary(onlyLowerBelt, { expertMode: true });
    const spansOnlyLower = resolvePilasterElevationSpans(onlyLowerBelt, sumOnlyLower.derivedGeometry);
    assert.equal(spansOnlyLower.length, 2);
    assertClose(spansOnlyLower[0].topM, band0.bottomM);
    assertClose(spansOnlyLower[1].bottomM, band0.topM);
    assertClose(spansOnlyLower[1].topM, vg.wallTopM);
  });

  it('49. Превращение ленты в подоконный карниз: 1/12..1/6, < гл. карниза и цоколя, привязка к низу окна и обнуление низа обрамления', () => {
    const base = createDefaultParamsForTypology('urban_house'); // 3 этажа
    const sillBase = {
      ...base,
      withFraming: true,
      useFullFloorAsSocle: false,
      hSocle: 1.4,
      hMain: 0.72,
      hGurt: 0.36, // внутри [3.6/12=0.30, 3.6/6=0.60] и < min(0.72, 1.4)
      useFloorToFloorForBelt: true,
      beltAsRusticationMode: false,
      beltIsAbsent: false,
      beltFloors: [true, false],
      beltSillFloors: [true, false],
      beltIsSillCornice: true,
      hSillCornice: 0.36,
      pilasterFloors: [true, true, true],
    };

    assert.equal(hasAnySillBelt(sillBase), true);
    assert.equal(isBeltSillModeAboveFloor(sillBase, 0), true);
    assert.equal(isBeltSillModeAboveFloor(sillBase, 1), false);
    assert.equal(isFloorWindowSillBeltActive(sillBase, 0), false);
    assert.equal(isFloorWindowSillBeltActive(sillBase, 1), true);
    assert.equal(isFloorWindowSillBeltActive(sillBase, 2), false);

    // 1. Нормативная валидация: диапазон 1/12..1/6 и обязательно < hMain, < hSocle
    const okSummary = evaluateFacadeSummary(sillBase, { expertMode: true });
    assert.equal(okSummary.beltHeightCheck.status, 'ok');

    const tooTallForCornice = {
      ...sillBase,
      hMain: 0.35, // hGurt = 0.36 >= hMain (0.35), даже будучи в 1/12..1/6!
    };
    assert.equal(
      evaluateFacadeSummary(tooTallForCornice, { expertMode: true }).beltHeightCheck.status,
      'violation'
    );

    const tooTallForSocle = {
      ...sillBase,
      hSocle: 0.34, // hGurt = 0.36 >= hSocle (0.34)
    };
    assert.equal(
      evaluateFacadeSummary(tooTallForSocle, { expertMode: true }).beltHeightCheck.status,
      'violation'
    );

    const outOfRangeSixth = {
      ...sillBase,
      hMain: 1.1,
      hSocle: 1.5,
      hGurt: Number((okSummary.beltHeightCheck.range[1] + 0.05).toFixed(3)),
    };
    assert.equal(
      evaluateFacadeSummary(outOfRangeSixth, { expertMode: true }).beltHeightCheck.status,
      'violation'
    );

    // 2. Геометрия: лента поднята до низа окна 2-го этажа и двигается при изменении отметки низа окна
    const vg = resolveScaledVerticalGeometry(sillBase, okSummary.derivedGeometry);
    const winGeo1 = resolveFloorWindowGeometryM(sillBase, vg, 1);
    const band0 = resolveBeltVerticalBandM(sillBase, vg, 0)!;
    assert.equal(band0.isSillMode, true);
    assertClose(band0.topM, winGeo1.windowBottomM);
    assertClose(band0.bottomM, winGeo1.windowBottomM - 0.36);
    assert.ok(band0.topM > vg.floorOffsetsM[1] + 0.15);

    const movedSillParams = {
      ...sillBase,
      windowSillHeights: [undefined, 0.95],
    };
    const movedSummary = evaluateFacadeSummary(movedSillParams, { expertMode: true });
    const vgMoved = resolveScaledVerticalGeometry(movedSillParams, movedSummary.derivedGeometry);
    const winGeoMoved = resolveFloorWindowGeometryM(movedSillParams, vgMoved, 1);
    const bandMoved = resolveBeltVerticalBandM(movedSillParams, vgMoved, 0)!;
    assertClose(winGeoMoved.sillM, 0.95);
    assertClose(bandMoved.topM, winGeoMoved.windowBottomM);
    assertClose(bandMoved.bottomM, winGeoMoved.windowBottomM - 0.36);
    assert.ok(bandMoved.topM > band0.topM);

    // Пилястры подрезаются ровно по смещённому подоконному карнизу без пересечения
    const spansMoved = resolvePilasterElevationSpans(movedSillParams, movedSummary.derivedGeometry);
    assert.equal(spansMoved.length, 2);
    assert.ok(spansMoved[0].topM <= bandMoved.bottomM + 1e-4);
    assertClose(spansMoved[0].topM, Math.min(vgMoved.floorOffsetsM[1], bandMoved.bottomM));
    assertClose(spansMoved[1].bottomM, bandMoved.topM);

    // 3. DWG-проверка: на 2-м этаже нижняя часть обрамления = 0 (равна winBottomM), а на 1-м/3-м с обычной границей выступает вниз
    const cad = buildFacadeCadDocument(movedSillParams, movedSummary);
    const beltEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '04_BELTS'
    );
    const beltRects = beltEnts
      .map((ent) => (ent as { vertices?: Array<{ location: { y: number } }> }).vertices)
      .filter((v): v is Array<{ location: { y: number } }> => Boolean(v && v.length >= 4));
    assert.equal(beltRects.length, 1);
    const beltMaxYM = Math.max(...beltRects[0].map((v) => v.location.y / 1000));
    const beltMinYM = Math.min(...beltRects[0].map((v) => v.location.y / 1000));
    assertClose(beltMaxYM, winGeoMoved.windowBottomM);
    assertClose(beltMinYM, winGeoMoved.windowBottomM - 0.36);

    // На 2-м этаже (flIdx=1) все прямоугольники обрамления окна должны иметь minY >= winGeoMoved.windowBottomM (нижняя часть обрамления = 0)
    const openEnts = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '05_WINDOWS_DOORS'
    );
    const floor2WindowTopMax = winGeoMoved.windowTopM + movedSummary.framingResult.T + 0.1;
    const floor2OpenRects = openEnts
      .map((ent) => (ent as { vertices?: Array<{ location: { y: number } }> }).vertices)
      .filter((v): v is Array<{ location: { y: number } }> => Boolean(v && v.length >= 4))
      .map((verts) => {
        const ys = verts.map((v) => v.location.y / 1000);
        return { minY: Math.min(...ys), maxY: Math.max(...ys) };
      })
      .filter((r) => r.minY >= vgMoved.floorOffsetsM[1] && r.maxY <= floor2WindowTopMax);
    assert.ok(floor2OpenRects.length >= 2);
    for (const r of floor2OpenRects) {
      assert.ok(
        r.minY >= winGeoMoved.windowBottomM - 1e-4,
        `Floor 2 framing minY (${r.minY.toFixed(4)}) must not go below window bottom (${winGeoMoved.windowBottomM.toFixed(4)}) when sill belt is active`
      );
    }

    // Без подоконного карниза на 2-м этаже (обычная лента) обрамление выступает ниже низа окна на 0.5 * u
    const normalBeltParams = {
      ...movedSillParams,
      beltSillFloors: [false, false],
      beltIsSillCornice: false,
    };
    const normalSummary = evaluateFacadeSummary(normalBeltParams, { expertMode: true });
    const cadNormal = buildFacadeCadDocument(normalBeltParams, normalSummary);
    const normalFloor2MinYs = Array.from(cadNormal.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '05_WINDOWS_DOORS')
      .map((ent) => (ent as { vertices?: Array<{ location: { y: number } }> }).vertices)
      .filter((v): v is Array<{ location: { y: number } }> => Boolean(v && v.length >= 4))
      .map((verts) => {
        const ys = verts.map((v) => v.location.y / 1000);
        return { minY: Math.min(...ys), maxY: Math.max(...ys) };
      })
      .filter((r) => r.minY >= vgMoved.floorOffsetsM[1] && r.maxY <= floor2WindowTopMax)
      .map((r) => r.minY);
    assert.ok(normalFloor2MinYs.some((y) => Math.abs(y - (winGeoMoved.windowBottomM - normalBeltParams.u * 0.5)) < 1e-3));

    // 4. Независимая активация для любой из нескольких созданных лент:
    // Включаем обе ленты ([true, true]), но превращаем в подоконный карниз ТОЛЬКО верхнюю ленту ([false, true]), даже при legacy-флаге third_sohlbank
    const onlySecondBeltSill = {
      ...movedSillParams,
      threeStoryGurtMode: 'both_gurt' as const,
      beltFloors: [true, true],
      beltSillFloors: [false, true],
      beltIsSillCornice: true,
    };
    assert.equal(isBeltSillModeAboveFloor(onlySecondBeltSill, 0), false);
    assert.equal(isBeltSillModeAboveFloor(onlySecondBeltSill, 1), true);
    assert.equal(isFloorWindowSillBeltActive(onlySecondBeltSill, 1), false);
    assert.equal(isFloorWindowSillBeltActive(onlySecondBeltSill, 2), true);

    const mixedSummary = evaluateFacadeSummary(onlySecondBeltSill, { expertMode: true });
    const vgMixed = resolveScaledVerticalGeometry(onlySecondBeltSill, mixedSummary.derivedGeometry);
    const mixedBand0 = resolveBeltVerticalBandM(onlySecondBeltSill, vgMixed, 0)!;
    const mixedBand1 = resolveBeltVerticalBandM(onlySecondBeltSill, vgMixed, 1)!;
    const winGeoFloor3 = resolveFloorWindowGeometryM(onlySecondBeltSill, vgMixed, 2);

    // Нижняя лента остаётся на отметке перекрытия 1→2 этажа
    assert.equal(mixedBand0.isSillMode, false);
    assertClose(mixedBand0.centerM, vgMixed.floorOffsetsM[1]);
    // Верхняя лента поднимается к низу окон 3-го этажа
    assert.equal(mixedBand1.isSillMode, true);
    assertClose(mixedBand1.topM, winGeoFloor3.windowBottomM);
    assertClose(mixedBand1.bottomM, winGeoFloor3.windowBottomM - 0.36);

    // Проверка DWG: на 2-м этаже обрамление выступает ниже окна, а на 3-м этаже низ обрамления = 0
    const cadMixed = buildFacadeCadDocument(onlySecondBeltSill, mixedSummary);
    const mixedOpenRects = Array.from(cadMixed.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '05_WINDOWS_DOORS')
      .map((ent) => (ent as { vertices?: Array<{ location: { y: number } }> }).vertices)
      .filter((v): v is Array<{ location: { y: number } }> => Boolean(v && v.length >= 4))
      .map((verts) => {
        const ys = verts.map((v) => v.location.y / 1000);
        return { minY: Math.min(...ys), maxY: Math.max(...ys) };
      });
    const f2Rects = mixedOpenRects.filter(
      (r) => r.minY >= vgMixed.floorOffsetsM[1] && r.maxY <= winGeoMoved.windowTopM + mixedSummary.framingResult.T + 0.1
    );
    const f3Rects = mixedOpenRects.filter(
      (r) => r.minY >= vgMixed.floorOffsetsM[2] && r.maxY <= winGeoFloor3.windowTopM + onlySecondBeltSill.u + 0.1
    );
    assert.ok(f2Rects.some((r) => Math.abs(r.minY - (winGeoMoved.windowBottomM - onlySecondBeltSill.u * 0.5)) < 1e-3));
    assert.ok(f3Rects.length >= 2);
    for (const r of f3Rects) {
      assert.ok(
        r.minY >= winGeoFloor3.windowBottomM - 1e-4,
        `Floor 3 framing minY (${r.minY.toFixed(4)}) must not go below window bottom (${winGeoFloor3.windowBottomM.toFixed(4)})`
      );
    }

    // Проверка приоритета beltSillFloors над legacy-полем threeStoryGurtMode = 'third_sohlbank'
    const overrideLegacy = {
      ...onlySecondBeltSill,
      threeStoryGurtMode: 'third_sohlbank' as const,
      beltSillFloors: [true, false],
    };
    assert.equal(isBeltSillModeAboveFloor(overrideLegacy, 0), true);
    assert.equal(isBeltSillModeAboveFloor(overrideLegacy, 1), false);
    assert.equal(resolveBeltVerticalBandM(overrideLegacy, vgMixed, 0)!.isSillMode, true);
    assert.equal(resolveBeltVerticalBandM(overrideLegacy, vgMixed, 1)!.isSillMode, false);
  });

  it('50. Оси рядовых простенков: середина простенков, видимость только ниже уровня земли и своя размерная цепочка в DWG', () => {
    const base = createDefaultParamsForTypology('urban_house');
    assert.equal(base.showOrdinaryPierAxes, false);

    // По умолчанию (showOrdinaryPierAxes = false) в DWG нет слоя осей рядовых простенков
    const defaultSum = evaluateFacadeSummary(base, { expertMode: true });
    const defaultCad = buildFacadeCadDocument(base, defaultSum);
    const defaultPierLines = Array.from(defaultCad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '07B_PIER_AXES'
    );
    assert.equal(defaultPierLines.length, 0);

    // 4 оконные оси -> 3 рядовых простенка и 3 оси рядовых простенков
    const withPierAxes = {
      ...base,
      axesCount: 4,
      A: 3.2,
      k_D: 0.75,
      w: 1.2,
      u: 0.2,
      withFraming: true,
      showOrdinaryPierAxes: true,
    };
    const D = D_from_A(withPierAxes.A, withPierAxes.k_D); // 2.4
    const axesM = Array.from({ length: withPierAxes.axesCount }, (_, i) => D + i * withPierAxes.A);
    const pierAxesM = resolveOrdinaryPierAxesM(axesM);
    assert.equal(pierAxesM.length, 3);

    // Каждая ось делит рядовой простенок [axesM[i] + w/2 + u, axesM[i+1] - w/2 - u] строго пополам
    for (let i = 0; i < pierAxesM.length; i += 1) {
      const pierLeft = axesM[i] + withPierAxes.w / 2 + withPierAxes.u;
      const pierRight = axesM[i + 1] - withPierAxes.w / 2 - withPierAxes.u;
      assertClose(pierAxesM[i], (pierLeft + pierRight) / 2);
    }

    // Расстояние между соседними осями рядовых простенков равно шагу A, а от угла до П1 = D + A/2
    assertClose(pierAxesM[1] - pierAxesM[0], withPierAxes.A);
    assertClose(pierAxesM[2] - pierAxesM[1], withPierAxes.A);
    assertClose(pierAxesM[0], resolveOrdinaryPierAxisEdgeOffsetM(D, withPierAxes.A));

    // DWG: вертикальные линии 07B_PIER_AXES строго ниже уровня земли (y <= 0) и своя размерная цепочка
    const sum = evaluateFacadeSummary(withPierAxes, { expertMode: true });
    const cad = buildFacadeCadDocument(withPierAxes, sum);
    const pierEntities = Array.from(cad.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '07B_PIER_AXES'
    );
    const pierLines = pierEntities.filter((ent) => {
      const e = ent as unknown as {
        startPoint?: { x: number; y: number };
        endPoint?: { x: number; y: number };
      };
      return e.startPoint !== undefined && e.endPoint !== undefined;
    }) as unknown as Array<{
      startPoint: { x: number; y: number };
      endPoint: { x: number; y: number };
    }>;

    assert.equal(pierLines.length, 3);
    pierLines.forEach((line, idx) => {
      assertClose(line.startPoint.x / 1000, pierAxesM[idx]);
      assertClose(line.endPoint.x / 1000, pierAxesM[idx]);
      const maxY = Math.max(line.startPoint.y, line.endPoint.y);
      const minY = Math.min(line.startPoint.y, line.endPoint.y);
      assert.ok(maxY <= 0, `Pier axis line must not extend above ground (y=0), got maxY=${maxY}`);
      assert.ok(minY < 0, `Pier axis line must extend below ground (y=0), got minY=${minY}`);
    });

    const dimTexts = Array.from(cad.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '08_DIMENSIONS')
      .map((ent) => (ent as { value?: string }).value)
      .filter((v): v is string => typeof v === 'string');

    assert.ok(
      dimTexts.some((t) => t.includes(`A_п = ${withPierAxes.A.toFixed(2)} м`)),
      `DWG dimensions must contain pier axes spacing A_п = ${withPierAxes.A.toFixed(2)} м, got: ${dimTexts.join(', ')}`
    );
    assert.ok(
      dimTexts.some((t) => t === `${pierAxesM[0].toFixed(2)} м`),
      `DWG dimensions must contain edge-to-pier-axis offset ${pierAxesM[0].toFixed(2)} м`
    );
  });

  it('51. Задание размеров между осями рядовых простенков: пересчёт ширин простенков, геометрии фасада и DWG', () => {
    const base = createDefaultParamsForTypology('urban_house');
    // 5 оконных осей -> 4 рядовых простенка (П1..П4) и 3 интервала между осями простенков
    const custom = {
      ...base,
      axesCount: 5,
      A: 3.2,
      k_D: 0.75,
      w: 1.0,
      u: 0.15,
      withFraming: true,
      showOrdinaryPierAxes: true,
      ordinaryPierAxisSpacings: [3.0, 3.8, 3.0],
    };

    const steps = resolveWindowAxisStepsM(custom);
    assert.equal(steps.length, 4);
    assertClose(steps[0], 2.2);
    assertClose(steps[1], 3.8);
    assertClose(steps[2], 3.8);
    assertClose(steps[3], 2.2);

    const D = D_from_A(steps[0], custom.k_D);
    const axesM = resolveWindowAxesM(D, steps);
    const pierAxesM = resolveOrdinaryPierAxesM(axesM);
    assert.equal(pierAxesM.length, 4);

    // Расстояния между осями рядовых простенков точно соответствуют заданным [3.0, 3.8, 3.0]
    assertClose(pierAxesM[1] - pierAxesM[0], 3.0);
    assertClose(pierAxesM[2] - pierAxesM[1], 3.8);
    assertClose(pierAxesM[3] - pierAxesM[2], 3.0);

    // Ширины простенков меняются соответственно: w_v = 1.0 + 2*0.15 = 1.3
    const pierWidths = resolveOrdinaryPierWidthsM(steps, custom.w, custom.u, custom.withFraming);
    assertClose(pierWidths[0], 0.9);
    assertClose(pierWidths[1], 2.5);
    assertClose(pierWidths[2], 2.5);
    assertClose(pierWidths[3], 0.9);

    // Проверка пересчёта ширины фасада и DWG-размеров
    const sum = evaluateFacadeSummary(custom, { expertMode: true });
    assertClose(sum.derivedGeometry.facadeWidth, 2 * D + 2.2 + 3.8 + 3.8 + 2.2);

    const cad = buildFacadeCadDocument(custom, sum);
    const dimTexts = Array.from(cad.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '08_DIMENSIONS')
      .map((ent) => (ent as { value?: string }).value)
      .filter((v): v is string => typeof v === 'string');

    assert.ok(dimTexts.includes('A_п = 3.00 м'));
    assert.ok(dimTexts.includes('A_п = 3.80 м'));
    assert.ok(dimTexts.includes('p_c1 = 0.90 м'));
    assert.ok(dimTexts.includes('p_c2 = 2.50 м'));
  });

  it('52. Размер высоты главного карниза справа и независимая отметка низа карниза от потолка верхнего этажа', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const sumBase = evaluateFacadeSummary(base, { expertMode: true });
    const vgBase = resolveScaledVerticalGeometry(base, sumBase.derivedGeometry);

    // По умолчанию потолок верхнего этажа ниже верха стен/карниза на толщину перекрытия
    const lastSlab = base.levels.floors[base.levels.floors.length - 1]?.slabThickness ?? 0.35;
    assertClose(vgBase.topFloorTopM - vgBase.topFloorCeilingM, lastSlab);
    assertClose(vgBase.corniceBottomM, vgBase.topFloorTopM);

    // DWG содержит размер высоты главного карниза h_гк = ... м
    const cadBase = buildFacadeCadDocument(base, sumBase);
    const dimTextsBase = Array.from(cadBase.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '08_DIMENSIONS')
      .map((ent) => (ent as { value?: string }).value)
      .filter((v): v is string => typeof v === 'string');
    assert.ok(
      dimTextsBase.includes(`h_гк = ${base.hMain.toFixed(2)} м`),
      `DWG must include main cornice height dimension h_гк = ${base.hMain.toFixed(2)} м`
    );

    // Поднимаем низ главного карниза на +0.90 м (аттиковая стенка) с включёнными пилястрами на верхнем этаже
    const raised = computeNextFacadeParams(
      {
        ...base,
        pilasterFloors: base.levels.floors.map((_, idx) => idx === base.levels.floors.length - 1),
      },
      { corniceBottomOffsetM: 0.9 },
      { A: true }
    );
    const sumRaised = evaluateFacadeSummary(raised, { expertMode: true });
    const vgRaised = resolveScaledVerticalGeometry(raised, sumRaised.derivedGeometry);

    // Потолок и высота верхнего этажа НЕ изменились
    assertClose(vgRaised.topFloorCeilingM, vgBase.topFloorCeilingM);
    assertClose(vgRaised.topFloorTopM, vgBase.topFloorTopM);
    assertClose(
      vgRaised.floorHeightsM[vgRaised.floorHeightsM.length - 1],
      vgBase.floorHeightsM[vgBase.floorHeightsM.length - 1]
    );
    // А низ, верх карниза, стена и общая высота поднялись на +0.90 м
    assertClose(vgRaised.corniceBottomM, vgBase.topFloorTopM + 0.9);
    assertClose(vgRaised.wallTopM, vgRaised.corniceBottomM);
    assertClose(vgRaised.corniceTopM, vgRaised.corniceBottomM + raised.hMain);
    assertClose(sumRaised.derivedGeometry.totalHeight, vgRaised.corniceTopM);

    // Пилястры верхнего этажа дотягиваются до низа главного карниза
    const pilSpans = resolvePilasterElevationSpans(raised, sumRaised.derivedGeometry);
    assert.equal(pilSpans.length, 1);
    assertClose(pilSpans[0].topM, vgRaised.corniceBottomM);

    // В DWG есть отметка потолка верхнего этажа, низа гл. карниза и размер h_гк
    const cadRaised = buildFacadeCadDocument(raised, sumRaised);
    const dimTextsRaised = Array.from(cadRaised.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '08_DIMENSIONS')
      .map((ent) => (ent as { value?: string }).value)
      .filter((v): v is string => typeof v === 'string');
    assert.ok(dimTextsRaised.some((t) => t.includes('потолок верхн. эт.')));
    assert.ok(dimTextsRaised.some((t) => t.includes('(низ гл.к.)')));
    assert.ok(dimTextsRaised.includes(`h_гк = ${raised.hMain.toFixed(2)} м`));

    // Сброс offset обратно в undefined работает даже при заблокированном другом параметре (A: true)
    const reset = computeNextFacadeParams(raised, { corniceBottomOffsetM: undefined }, { A: true });
    assert.equal(reset.corniceBottomOffsetM, undefined);
    const sumReset = evaluateFacadeSummary(reset, { expertMode: true });
    const vgReset = resolveScaledVerticalGeometry(reset, sumReset.derivedGeometry);
    assertClose(vgReset.corniceBottomM, vgReset.topFloorTopM);
  });

  it('53. Кнопка «Простой цоколь»: цоколь становится единым прямоугольником в фасаде и деталировке без Fuß/Rumpf/Deck', () => {
    const base = createDefaultParamsForTypology('urban_house');
    assert.equal(base.isSimpleSocle, false);

    // По умолчанию (трёхчастный цоколь): 3 прямоугольника на слое 02_SOCLE и Fuß/Rumpf/Deck в деталировке
    const sum3 = evaluateFacadeSummary(base, { expertMode: true });
    const cad3 = buildFacadeCadDocument(base, sum3);
    const socleEnts3 = Array.from(cad3.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '02_SOCLE'
    );
    assert.equal(socleEnts3.length, 3);

    const detail3 = buildDetailPlateCadDocument('socle', base, sum3);
    const detail3Dims = Array.from(detail3.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '04_DIMENSIONS')
      .map((ent) => (ent as { value?: string }).value)
      .filter((v): v is string => typeof v === 'string');
    assert.ok(detail3Dims.some((t) => t.startsWith('Fuß ')));
    assert.ok(detail3Dims.some((t) => t.startsWith('Deck ')));

    // Активируем «Простой цоколь» (даже при включённой рустовке должен рисоваться простой прямоугольник)
    const simple = computeNextFacadeParams(
      { ...base, hasSocleRustication: true },
      { isSimpleSocle: true },
      {}
    );
    assert.equal(simple.isSimpleSocle, true);

    const sumSimple = evaluateFacadeSummary(simple, { expertMode: true });
    const cadSimple = buildFacadeCadDocument(simple, sumSimple);
    const socleEntsSimple = Array.from(cadSimple.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '02_SOCLE'
    );
    assert.equal(socleEntsSimple.length, 1, 'Simple socle must emit a single rectangle in DWG');
    const rectVerts = (
      socleEntsSimple[0] as unknown as {
        vertices?: Array<{ location: { x: number; y: number } }>;
      }
    ).vertices;
    assert.equal(rectVerts?.length, 4);
    assertClose(Math.min(...rectVerts!.map((v) => v.location.x)), 0);
    assertClose(
      Math.max(...rectVerts!.map((v) => v.location.x)) / 1000,
      sumSimple.derivedGeometry.facadeWidth
    );

    const detailSimple = buildDetailPlateCadDocument('socle', simple, sumSimple);
    const detailSimpleGeom = Array.from(detailSimple.modelSpace?.entities ?? []).filter(
      (ent) => ent.layer?.name === '01_DETAIL_GEOMETRY'
    );
    assert.equal(detailSimpleGeom.length, 1, 'Simple socle detail plate must emit 1 rectangle');
    const detailSimpleDims = Array.from(detailSimple.modelSpace?.entities ?? [])
      .filter((ent) => ent.layer?.name === '04_DIMENSIONS')
      .map((ent) => (ent as { value?: string }).value)
      .filter((v): v is string => typeof v === 'string');
    assert.equal(detailSimpleDims.some((t) => t.includes('Fuß') || t.includes('Rumpf') || t.includes('Deck')), false);
    assert.ok(detailSimpleDims.some((t) => t.startsWith('h_s = ')));

    // Замок на isSimpleSocle защищает от изменения
    const locked = computeNextFacadeParams(simple, { isSimpleSocle: false }, { isSimpleSocle: true });
    assert.equal(locked.isSimpleSocle, true);
  });

  it('54. Лицевая кирпичная кладка: горизонтальная и вертикальная модульные формулы, проёмы и пересчёт для нестандартного кирпича', () => {
    const b = DEFAULT_BRICK_MASONRY_PARAMS; // L=250, W=120, H=65, Jh=10, Jv=10
    assert.equal(calcHorizontalModuleMm(0.5, b), 120);
    assert.equal(calcHorizontalModuleMm(1, b), 250);
    assert.equal(calcHorizontalModuleMm(1.5, b), 380);
    assert.equal(calcHorizontalModuleMm(2, b), 510);
    assert.equal(calcHorizontalModuleMm(2.5, b), 640);
    assert.equal(calcHorizontalModuleMm(3, b), 770);
    assert.equal(calcHorizontalModuleMm(58, b), 15070);
    assert.equal(calcHorizontalModuleMm(72, b), 18710);

    // Проёмы между простенками: S(m) + 2*Jv (4 мод = 1050 мм, 6 мод = 1570 мм)
    assert.equal(calcHorizontalOpeningMm(4, b), 1050);
    assert.equal(calcHorizontalOpeningMm(6, b), 1570);

    // Сумма простенков и проёмов примера из таблицы (стр. 1): 1290+1050+1290+1050+2070+1570+2070+1050+1290+1050+1290 = 15070
    const sumFacadeMm =
      calcHorizontalModuleMm(5, b) +
      calcHorizontalOpeningMm(4, b) +
      calcHorizontalModuleMm(5, b) +
      calcHorizontalOpeningMm(4, b) +
      calcHorizontalModuleMm(8, b) +
      calcHorizontalOpeningMm(6, b) +
      calcHorizontalModuleMm(8, b) +
      calcHorizontalOpeningMm(4, b) +
      calcHorizontalModuleMm(5, b) +
      calcHorizontalOpeningMm(4, b) +
      calcHorizontalModuleMm(5, b);
    assert.equal(sumFacadeMm, 15070);

    // Вертикальная система: H1 = N*(H+Jh), H2 = H1 - H
    assert.equal(calcVerticalModuleH1Mm(1, b), 75);
    assert.equal(calcVerticalModuleH2Mm(1, b), 10);
    assert.equal(calcVerticalModuleH1Mm(2, b), 150);
    assert.equal(calcVerticalModuleH2Mm(2, b), 85);
    assert.equal(calcVerticalModuleH1Mm(3, b), 225);
    assert.equal(calcVerticalModuleH2Mm(3, b), 160);
    assert.equal(calcVerticalModuleH1Mm(4, b), 300);
    assert.equal(calcVerticalModuleH2Mm(4, b), 235);
    assert.equal(calcVerticalModuleH1Mm(5, b), 375);
    assert.equal(calcVerticalModuleH2Mm(5, b), 310);

    // Динамический расчёт при произвольных параметрах кирпича (без зашитых таблиц)
    const customBrick = { L: 240, W: 115, H: 71, Jh: 12, Jv: 10 };
    assert.equal(calcHorizontalModuleMm(0.5, customBrick), 115);
    assert.equal(calcHorizontalModuleMm(1, customBrick), 240);
    assert.equal(calcHorizontalModuleMm(1.5, customBrick), 365); // 1*(240+10)+115
    assert.equal(calcHorizontalOpeningMm(4, customBrick), 4 * 240 + 3 * 10 + 20); // 1010
    assert.equal(calcVerticalModuleH1Mm(3, customBrick), 3 * (71 + 12)); // 249
    assert.equal(calcVerticalModuleH2Mm(3, customBrick), 249 - 71); // 178
  });

  it('55. Режим «Лицевая кирпичная кладка»: полная координация фасада (1 мм), сохранность slabThickness, симметрия, отчёт и откат при выключении', () => {
    const base = createDefaultParamsForTypology('urban_house');
    const originalSlabs = base.levels.floors.map((fl) => fl.slabThickness);
    const baseWithEntryAndCustomAxes = computeNextFacadeParams(
      {
        ...base,
        axesCount: 5,
        hasEntrance: true,
        entranceWidthM: 1.42,
        entranceHeightM: 2.55,
        ordinaryPierAxisSpacings: [2.83, 3.31, 2.83],
      },
      {},
      {}
    );

    // Включаем режим кирпичной кладки
    const enabled = computeNextFacadeParams(
      baseWithEntryAndCustomAxes,
      {
        brickMasonry: {
          enabled: true,
          brick: { ...DEFAULT_BRICK_MASONRY_PARAMS },
        },
      },
      {}
    );

    assert.equal(enabled.brickMasonry?.enabled, true);
    assert.ok(enabled.brickMasonry?.baseArch);

    // 1. Толщины перекрытий (конструктивные несущие слои) НЕ изменяются
    enabled.levels.floors.forEach((fl, idx) => {
      assertClose(fl.slabThickness, originalSlabs[idx]);
    });

    // 2. Горизонтальная точность 1 мм: w = S(m)+2*Jv, простенки = S(m), симметрия сохраняется
    const wMm = Math.round(enabled.w * 1000);
    assert.equal((wMm - 20 + 10) % 130, 0); // (w - 2*Jv + Jv) должно делиться на 130 или 130+120
    const steps = resolveWindowAxisStepsM(enabled);
    assert.equal(steps.length, 4);
    assertClose(steps[0], steps[3]);
    assertClose(steps[1], steps[2]);
    for (const s of steps) {
      const pierMm = Math.round(s * 1000) - wMm;
      const rem = (pierMm + 10) % 130;
      assert.ok(rem === 0 || rem === 120 || pierMm === 120, `Pier ${pierMm}mm must match horizontal module`);
    }

    // 3. Вертикальные отметки H2 и высоты H1 согласованы с 75 / 65 мм
    const hMm = Math.round(enabled.h * 1000);
    assert.equal(hMm % 75, 0);
    const hSocleMm = Math.round(enabled.hSocle * 1000);
    assert.equal((hSocleMm + 65) % 75, 0);
    const hMainMm = Math.round(enabled.hMain * 1000);
    assert.equal(hMainMm % 75, 0);
    const g1Mm = Math.round(enabled.levels.groundToFloor1 * 1000);
    assert.equal(g1Mm % 75, 0);
    const sill1FromGroundMm =
      g1Mm + Math.round((enabled.windowSillHeights?.[0] ?? 0) * 1000);
    assert.equal((sill1FromGroundMm + 65) % 75, 0);

    // 4. Меняем параметры кирпича на 240x115x71, Jh=12, Jv=10 -> динамический пересчёт от baseArch
    const customRecomputed = computeNextFacadeParams(
      enabled,
      {
        brickMasonry: {
          enabled: true,
          brick: { L: 240, W: 115, H: 71, Jh: 12, Jv: 10 },
        },
      },
      {}
    );
    const customHMm = Math.round(customRecomputed.h * 1000);
    assert.equal(customHMm % (71 + 12), 0);
    const customSocleMm = Math.round(customRecomputed.hSocle * 1000);
    assert.equal((customSocleMm + 71) % (71 + 12), 0);

    // 5. Отчёт содержит отклонения, модули, формулы и технологическое предупреждение
    const report = coordinateFacadeWithBrickMasonry(
      customRecomputed,
      customRecomputed.brickMasonry?.baseArch
    );
    assert.ok(report.items.length >= 10);
    assert.ok(report.items.every((it) => it.modularMm - it.originalMm === it.deltaMm));
    assert.ok(BRICK_MASONRY_TECH_WARNING.includes('технологической реализуемости'));

    // 6. Выключение режима возвращает исходные архитектурные размеры baseArch
    const disabled = computeNextFacadeParams(
      customRecomputed,
      {
        brickMasonry: {
          enabled: false,
          brick: { L: 240, W: 115, H: 71, Jh: 12, Jv: 10 },
        },
      },
      {}
    );
    assert.equal(disabled.brickMasonry?.enabled, false);
    assertClose(disabled.w, baseWithEntryAndCustomAxes.w);
    assertClose(disabled.h, baseWithEntryAndCustomAxes.h);
    assertClose(disabled.A, baseWithEntryAndCustomAxes.A);
  });

  it('56. Задание общей ширины здания W в разделе «Оси и простенки» с учётом замков, ризалита, индивидуальных шагов и кладки', () => {
    const base = createDefaultParamsForTypology('urban_house'); // 3 оси, k_D = 0.8
    const bounds = resolveBuildingWidthBounds(base);
    assert.ok(bounds.minWidth > 2.0 && bounds.maxSliderWidth >= 20);

    // 1. Обычный пересчёт шага осей A из целевой ширины W = 14.40 м
    const patchStd = resolveParamsPatchForBuildingWidth(base, 14.4, {});
    const stdUpdated = computeNextFacadeParams(base, patchStd, {});
    const sumStd = evaluateFacadeSummary(stdUpdated, { expertMode: true });
    assertClose(sumStd.derivedGeometry.facadeWidth, 14.4);
    assertClose(stdUpdated.k_D, base.k_D);
    assertClose(stdUpdated.A, 14.4 / (2 + 2 * base.k_D));

    // 2. При закреплённом замком A пересчитывается угловой отступ k_D (D)
    const patchLockedA = resolveParamsPatchForBuildingWidth(stdUpdated, 16.0, { A: true });
    const lockedAUpdated = computeNextFacadeParams(stdUpdated, patchLockedA, { A: true });
    const sumLockedA = evaluateFacadeSummary(lockedAUpdated, { expertMode: true });
    assertClose(lockedAUpdated.A, stdUpdated.A);
    assertClose(sumLockedA.derivedGeometry.facadeWidth, 16.0);

    // 3. При закреплённых одновременно A и k_D ширина не меняется
    const patchAllLocked = resolveParamsPatchForBuildingWidth(stdUpdated, 12.0, {
      A: true,
      k_D: true,
    });
    assert.deepEqual(patchAllLocked, {});

    // 4. Индивидуальные шаги осей масштабируются пропорционально при задании новой ширины W
    const customAxes = computeNextFacadeParams(
      {
        ...base,
        axesCount: 5,
        ordinaryPierAxisSpacings: [2.8, 3.4, 2.8],
      },
      {},
      {}
    );
    const patchCustom = resolveParamsPatchForBuildingWidth(customAxes, 18.0, {});
    const customUpdated = computeNextFacadeParams(customAxes, patchCustom, {});
    const sumCustom = evaluateFacadeSummary(customUpdated, { expertMode: true });
    assert.ok(Math.abs(sumCustom.derivedGeometry.facadeWidth - 18.0) < 5e-3);
    const customSteps = resolveWindowAxisStepsM(customUpdated);
    assertClose(customSteps[0], customSteps[3]);
    assertClose(customSteps[1], customSteps[2]);

    // 5. Центрированный ризалит (D = risalitWidth/2) сохраняет ширину ризалита и пересчитывает A
    const risalitBase = { ...base, isRisalitCentered: true, risalitWidth: 4.0 };
    const patchRis = resolveParamsPatchForBuildingWidth(risalitBase, 12.0, {});
    const risUpdated = computeNextFacadeParams(risalitBase, patchRis, {});
    const sumRis = evaluateFacadeSummary(risUpdated, { expertMode: true });
    assertClose(risUpdated.risalitWidth, 4.0);
    assertClose(sumRis.derivedGeometry.facadeWidth, 12.0);

    // 6. При включённой лицевой кирпичной кладке целевая ширина согласуется с модулем без подрезки
    const masonryOn = computeNextFacadeParams(
      base,
      { brickMasonry: { enabled: true, brick: { ...DEFAULT_BRICK_MASONRY_PARAMS } } },
      {}
    );
    const patchBrick = resolveParamsPatchForBuildingWidth(masonryOn, 13.5, {});
    const brickUpdated = computeNextFacadeParams(masonryOn, patchBrick, {});
    const sumBrick = evaluateFacadeSummary(brickUpdated, { expertMode: true });
    assert.equal(brickUpdated.brickMasonry?.enabled, true);
    assert.ok(Math.abs(sumBrick.derivedGeometry.facadeWidth - 13.5) < 0.6);
  });

  it('57. Замок на ширине здания W (facadeWidth) сохраняет общую ширину при изменении осей, k_D, A, ризалита и типологии', () => {
    const base = createDefaultParamsForTypology('urban_house'); // 3 оси, k_D = 0.8
    const width14 = computeNextFacadeParams(
      base,
      resolveParamsPatchForBuildingWidth(base, 14.4, {}),
      {}
    );
    const locksW: LockedParamsMap = { facadeWidth: true };
    assert.equal(isParamLocked(locksW, 'facadeWidth'), true);
    assert.equal(countLockedParams(locksW), 1);

    // 1. Изменение числа осей 3 -> 5 при замке на W сохраняет W = 14.4 м, пересчитывая шаг A
    const fiveAxes = computeNextFacadeParams(width14, { axesCount: 5 }, locksW);
    const sumFive = evaluateFacadeSummary(fiveAxes, { expertMode: true });
    assert.equal(fiveAxes.axesCount, 5);
    assertClose(sumFive.derivedGeometry.facadeWidth, 14.4);
    assertClose(fiveAxes.k_D, width14.k_D);

    // 2. Изменение k_D (или risalitWidth) при замке на W сохраняет W = 14.4 м, пересчитывая A
    const changedKD = computeNextFacadeParams(width14, { k_D: 0.7 }, locksW);
    const sumKD = evaluateFacadeSummary(changedKD, { expertMode: true });
    assertClose(changedKD.k_D, 0.7);
    assertClose(sumKD.derivedGeometry.facadeWidth, 14.4);

    // 3. Изменение A при замке на W сохраняет W = 14.4 м, пересчитывая k_D (или risalitWidth)
    const changedA = computeNextFacadeParams(
      width14,
      { A: 4.5, ordinaryPierAxisSpacings: [] },
      locksW
    );
    const sumChangedA = evaluateFacadeSummary(changedA, { expertMode: true });
    assertClose(changedA.A, 4.5);
    assertClose(sumChangedA.derivedGeometry.facadeWidth, 14.4);

    const risalitBase = { ...width14, isRisalitCentered: true, risalitWidth: 4.0 };
    const risalitW = evaluateFacadeSummary(risalitBase, { expertMode: true }).derivedGeometry.facadeWidth;
    const risalitChangedA = computeNextFacadeParams(
      risalitBase,
      { A: 4.6, ordinaryPierAxisSpacings: [] },
      locksW
    );
    const sumRisA = evaluateFacadeSummary(risalitChangedA, { expertMode: true });
    assertClose(risalitChangedA.A, 4.6);
    assertClose(sumRisA.derivedGeometry.facadeWidth, risalitW);

    // 4. Применение пресета другой типологии с замком на W сохраняет исходную ширину 14.4 м
    const villaPreset = createDefaultParamsForTypology('villa');
    const appliedPreset = computeNextFacadeParams(width14, villaPreset, locksW);
    const sumPreset = evaluateFacadeSummary(appliedPreset, { expertMode: true });
    assertClose(sumPreset.derivedGeometry.facadeWidth, 14.4);

    // 5. Комбинации замков: { facadeWidth, k_D } блокирует A; { facadeWidth, A, k_D } блокирует axesCount
    const lockedWKd = computeNextFacadeParams(
      width14,
      { A: 5.0 },
      { facadeWidth: true, k_D: true }
    );
    assertClose(lockedWKd.A, width14.A);
    assertClose(
      evaluateFacadeSummary(lockedWKd, { expertMode: true }).derivedGeometry.facadeWidth,
      14.4
    );

    const lockedAllHoriz = computeNextFacadeParams(
      width14,
      { axesCount: 5 },
      { facadeWidth: true, A: true, k_D: true }
    );
    assert.equal(lockedAllHoriz.axesCount, width14.axesCount);
    assertClose(
      evaluateFacadeSummary(lockedAllHoriz, { expertMode: true }).derivedGeometry.facadeWidth,
      14.4
    );
  });

  it('58. Экспорт настроек и импорт настроек (.json): полный цикл сохранения и восстановления фасада с замками и проверкой ошибок', () => {
    const base = createDefaultParamsForTypology('villa');
    const configured = computeNextFacadeParams(
      base,
      {
        axesCount: 5,
        ordinaryPierAxisSpacings: [2.75, 3.35, 2.75],
        showOrdinaryPierAxes: true,
        isSimpleSocle: true,
        corniceBottomOffsetM: -0.15,
        beltIsAbsent: false,
        beltFloors: [true, false],
        beltSillFloors: [true, false],
        brickMasonry: {
          enabled: true,
          brick: { L: 250, W: 120, H: 65, Jh: 10, Jv: 10 },
        },
      },
      {}
    );
    const locks: LockedParamsMap = {
      facadeWidth: true,
      hMain: true,
      'beltFloors.0': true,
    };

    const filename = buildFacadeSettingsFilename(configured);
    assert.ok(filename.endsWith('.json'));
    assert.ok(filename.includes('villa'));

    const jsonText = exportFacadeSettingsJson(configured, locks);
    const rawObj = JSON.parse(jsonText) as Record<string, unknown>;
    assert.equal(rawObj.format, FACADE_SETTINGS_FORMAT);
    assert.equal(rawObj.version, 1);

    const imported = parseFacadeSettingsImport(jsonText);
    assert.equal(imported.ok, true);
    if (imported.ok) {
      assert.equal(imported.params.buildingType, 'villa');
      assert.equal(imported.params.axesCount, 5);
      assert.equal(imported.params.showOrdinaryPierAxes, true);
      assert.equal(imported.params.isSimpleSocle, true);
      assertClose(
        imported.params.corniceBottomOffsetM ?? 0,
        configured.corniceBottomOffsetM ?? 0
      );
      assertClose(imported.params.brickMasonry?.baseArch?.corniceBottomOffsetM ?? 0, -0.15);
      assert.deepEqual(imported.params.beltFloors, configured.beltFloors);
      assert.deepEqual(imported.params.beltSillFloors, configured.beltSillFloors);
      assert.equal(imported.params.brickMasonry?.enabled, true);
      assert.ok(imported.params.brickMasonry?.baseArch);
      assert.deepEqual(imported.lockedParams, locks);

      const sumBefore = evaluateFacadeSummary(configured, { expertMode: true });
      const sumAfter = evaluateFacadeSummary(imported.params, { expertMode: true });
      assertClose(sumAfter.derivedGeometry.facadeWidth, sumBefore.derivedGeometry.facadeWidth);
      assertClose(sumAfter.derivedGeometry.totalHeight, sumBefore.derivedGeometry.totalHeight);
    }

    // Проверка отклонения некорректных файлов
    assert.equal(parseFacadeSettingsImport('not valid json').ok, false);
    assert.equal(parseFacadeSettingsImport('{}').ok, false);
    assert.equal(
      parseFacadeSettingsImport(
        JSON.stringify({ format: 'other-app', version: 1, params: configured })
      ).ok,
      false
    );
    assert.equal(
      parseFacadeSettingsImport(
        JSON.stringify({ format: FACADE_SETTINGS_FORMAT, version: 99, params: configured })
      ).ok,
      false
    );

    // Совместимость с «сырым» JSON параметров
    const rawImport = parseFacadeSettingsImport(
      JSON.stringify({ buildingType: 'miethaus', A: 3.1, axesCount: 4 })
    );
    assert.equal(rawImport.ok, true);
    if (rawImport.ok) {
      assert.equal(rawImport.params.buildingType, 'miethaus');
      assert.equal(rawImport.params.axesCount, 4);
      assertClose(rawImport.params.A, 3.1);
    }
  });
});
