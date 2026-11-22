import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  A_from_H,
  A_from_pw,
  A_min_from_wu,
  D_from_A,
  H_from_A,
  PHI,
  check_corner,
  check_offset,
  check_pilaster,
  check_window,
  cornice_character,
  cornice_split,
  createDefaultParamsForTypology,
  evaluateFacadeSummary,
  framing_from_T,
  framing_from_module,
  h_from_w_ratio,
  nearest_golden_approx,
  p_corner_from_Dwu,
  p_from_Aw,
  pc_from_Awu,
  pilaster_v_range,
  projection_45,
  projection_console,
  ratio_from_AH,
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
