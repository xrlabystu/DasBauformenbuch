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
  rusticationRows,
  socleHeight,
  syncLevelsWithH,
  threePartSocle,
  threeStoryBeltScheme,
  w_from_h_ratio,
  w_max_from_A,
} from './rules.ts';

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
    assert.equal(tooSmall.status, 'violation');
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
    assert.equal(colRange.sourceStatus, 'explicit-verified');
    assertClose(colRange.range[0], 0.45);
    assertClose(colRange.range[1], 0.6);

    assert.equal(
      checkVariantAxisRatio(2.0, 4.0, 'multi-story', 'general', 0.03, 'rich_columnar').status,
      'ok'
    );
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

  it('9. P1-N2: подоконная плита h_sill ∈ [w/8, w/7], w/6 — approx, вне пределов — violation', () => {
    assert.equal(checkSillPlateHeight(0.16, 1.2).status, 'ok');
    assert.equal(checkSillPlateHeight(0.2, 1.2).status, 'approx');
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

  it('18. P2-N23/N25: аттик и богатство отделки ризалита vs крыла', () => {
    assert.equal(checkAttic(true, true, true).status, 'ok');
    assert.equal(checkAttic(true, true, false).status, 'approx');
    assert.equal(checkAttic(true, false, true).status, 'violation');
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
    assert.equal(checkPedimentChoice('steep', true).status, 'approx');
    assert.equal(checkPedimentChoice('gentle', true).status, 'ok');
    assert.equal(checkEqualWidthRisalitWingPediment(4.0, 4.0, false).status, 'approx');
    assert.equal(checkEqualWidthRisalitWingPediment(4.0, 4.0, true).status, 'ok');

    const base = createDefaultParamsForTypology('urban_house');
    const stdSummary = evaluateFacadeSummary(base, { expertMode: false });
    const expSummary = evaluateFacadeSummary(base, { expertMode: true });
    assert.equal(stdSummary.checks.some((c) => c.isExpertOnly), false);
    assert.equal(expSummary.checks.some((c) => c.isExpertOnly), true);
  });
});
