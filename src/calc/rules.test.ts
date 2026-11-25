import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  A_from_H,
  A_from_pw,
  A_min_from_wu,
  BELT_CLASSES,
  BELT_TEXT_GAPS,
  D_from_A,
  H_from_A,
  PHI,
  RULES_DATA,
  VARIANT_PRESETS,
  VARIANT_TEXT_GAPS,
  abkroepfungPreference,
  allowedAxisRatio,
  applyBuildingVariantPreset,
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
  isBeltEnabledAboveFloor,
  isKnownGoodRatio,
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
  resolveEntranceGeometry,
  resolveEntrancePositionFromSettings,
  resolveMainCorniceLayers,
  resolvePilasterElevationSpans,
  resolvePilasterXPositions,
  resolveScaledVerticalGeometry,
  resolveSocleAndPilasterBounds,
  resolveWindowSillHeightM,
  rusticationRows,
  socleHeight,
  syncLevelsWithH,
  threePartSocle,
  threeStoryBeltScheme,
  w_from_h_ratio,
  w_max_from_A,
} from './rules.ts';
import { countLockedParams, filterUnlockedPatch, isParamLocked } from './paramLocks.ts';
import {
  RULE_BOOK_EXCERPTS,
  getExcerptForCatalogRule,
  getExcerptForCheckId,
} from './ruleBookRefs.ts';
import { BRAUSEWETTER_PAGES } from '../data/brausewetter_1895.ts';
import { countSearchMatches, findGlossaryEntryByTerm } from '../utils/termHighlight.tsx';
import {
  buildFacadeCadDocument,
  exportDetailPlateToDwg,
  exportFacadeToDwg,
  type DetailPlateId,
} from './dwgExport.ts';
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
    const base = createDefaultParamsForTypology('miethaus');
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
      const p = { ...urban, hSocle: 2.6, isMauerpfeiler };
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

  it('39. Размерная цепочка высот слева от фасада: уровень пола 1-го этажа = 0.00, земля < 0, этажи 2+ > 0', () => {
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
});


