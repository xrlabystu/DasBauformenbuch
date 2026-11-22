import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  A_from_H,
  D_from_A,
  RULES_DATA,
  check_corner,
  check_pilaster,
  check_window,
  formatMeters,
  framing_from_T,
  h_from_w_ratio,
  p_corner_from_Dwu,
  p_from_Aw,
  pc_from_Awu,
  pilaster_v_range,
  projection_45,
  projection_console,
  type FacadeParameters,
  type FacadeTargetElement,
  type RuleRecord,
  type RuleType,
} from '../../calc/rules';

interface RuleCardsViewProps {
  onHighlightRuleOnFacade: (rule: RuleRecord) => void;
  onOpenBookPage?: (pageNum: number) => void;
}

const RULE_TYPE_LABELS: Record<'all' | RuleType, string> = {
  all: 'Все правила',
  formula: 'Формулы',
  constraint: 'Ограничения',
  heuristic: 'Эвристики / допущения',
  typology: 'Типология',
  profile_rule: 'Профили карниза',
};

export function RuleCardsView({
  onHighlightRuleOnFacade,
  onOpenBookPage,
}: RuleCardsViewProps) {
  const [filter, setFilter] = useState<'all' | RuleType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return RULES_DATA.rules;
    return RULES_DATA.rules.filter((r) => r.type === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#E5DFD3]">
        <div>
          <h3 className="font-display text-2xl font-medium text-[#1C1917]">
            Свод правил из «Das Bauformenbuch» (1895, S. 1–12)
          </h3>
          <p className="mt-1 text-xs text-[#57534E]">
            Карточки генерируются из единого JSON-реестра правил. Нажмите на правило, чтобы подсветить соответствующий узел на SVG-фасаде.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(['all', 'formula', 'constraint', 'heuristic', 'typology', 'profile_rule'] as const).map(
            (key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  filter === key
                    ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                    : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                }`}
              >
                {RULE_TYPE_LABELS[key]}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((rule) => {
          const firstPageMatch = rule.page.match(/\d+/);
          const pageNum = firstPageMatch ? parseInt(firstPageMatch[0], 10) : 5;
          return (
            <article
              key={rule.id}
              className="border border-[#D6CEBE] bg-[#FBF9F5] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                {/* Quiet unboxed 1-line metadata */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#78716C]">
                  <div className="flex flex-wrap items-center gap-x-2">
                    <span className="text-[#1C1917] font-medium">{rule.id}</span>
                    <span aria-hidden="true">·</span>
                    {onOpenBookPage ? (
                      <button
                        type="button"
                        onClick={() => onOpenBookPage(pageNum)}
                        className="text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
                      >
                        {rule.page}
                      </button>
                    ) : (
                      <span>{rule.page}</span>
                    )}
                    <span aria-hidden="true">·</span>
                    <span>{rule.domain}</span>
                  </div>
                  <span
                    className={
                      rule.confidence === 'heuristic' ? 'text-[#B45309] font-medium' : 'text-[#44403C]'
                    }
                  >
                    {rule.statusLabel}
                  </span>
                </div>

                <h4 className="font-display text-xl font-semibold text-[#1C1917] text-balance">
                  {rule.title}
                </h4>

                <p className="font-mono text-xs text-[#1C1917] bg-[#F3EFE6]/80 border border-[#E5DFD3] px-3 py-2">
                  {rule.expression}
                </p>

                <p className="text-xs leading-relaxed text-[#44403C]">
                  <strong className="font-medium text-[#1C1917]">Пример: </strong>
                  {rule.example}
                </p>

                <p className="text-xs leading-relaxed text-[#57534E]">{rule.note}</p>
              </div>

              <div className="pt-3 border-t border-[#ECE7DC] flex items-center justify-between gap-3">
                <span className="font-mono text-[11px] text-[#78716C]">
                  {rule.confidence === 'heuristic'
                    ? 'Пометка: допущение / эвристика'
                    : 'Источник: Brausewetter 1895'}
                </span>
                <button
                  type="button"
                  onClick={() => onHighlightRuleOnFacade(rule)}
                  className="px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors whitespace-nowrap shrink-0"
                >
                  Показать на фасаде
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// ==================================================
// Интерактивная панель проверки 11 тест-кейсов (§9)
// ==================================================

interface LiveTestCase {
  num: number;
  description: string;
  expectedSummary: string;
  actualSummary: string;
  passed: boolean;
  applyToFacade?: Partial<FacadeParameters>;
  targetElement: FacadeTargetElement;
}

export function TestCasesVerificationView({
  onLoadCaseOnFacade,
}: {
  onLoadCaseOnFacade: (patch: Partial<FacadeParameters>, el: FacadeTargetElement) => void;
}) {
  const cases: LiveTestCase[] = useMemo(() => {
    const near = (a: number, b: number) => Math.abs(a - b) <= 1e-3;

    // 1
    const a1 = A_from_H(3.0, 2, 3);
    const p1 = p_from_Aw(a1, 1.0);
    // 2
    const a2 = A_from_H(4.0, 2, 3);
    const p2 = p_from_Aw(a2, 1.15);
    // 3
    const a3 = A_from_H(4.0, 4, 5);
    const pc3 = pc_from_Awu(a3, 1.15, 0.2);
    // 4
    const a4 = A_from_H(4.0, 3, 4);
    const pc4 = pc_from_Awu(a4, 1.1, 0.2);
    // 5
    const h5 = h_from_w_ratio(1.0, 3, 5);
    const w5 = check_window(1.0, h5, 0.05);
    // 6
    const w6 = check_window(1.0, 2.0, 0.05);
    // 7
    const w7 = check_window(1.0, 2.1, 0.05);
    // 8
    const pil8 = pilaster_v_range(0.6);
    const pil8Chk = check_pilaster(0.11, 0.6, 'light');
    // 9
    const D9 = D_from_A(3.2, 4 / 5);
    const pcorn9 = p_corner_from_Dwu(D9, 1.15, 0.2);
    const corn9 = check_corner('simple_house', pcorn9, 1.15, 1.65, 4 / 5, D9);
    // 10
    const fr10 = framing_from_T(1.2, 6, 7, 8);
    // 11
    const pr45 = projection_45(fr10.K);
    const prCon = projection_console(fr10.K);

    return [
      {
        num: 1,
        description: 'H = 3.00, A:H = 2:3, w = 1.00 (без обрамления)',
        expectedSummary: 'A = 2.000; p = 1.000; p ≥ w — ok',
        actualSummary: `A = ${formatMeters(a1)}; p = ${formatMeters(p1.p)}; status = ${p1.status}`,
        passed: near(a1, 2.0) && near(p1.p, 1.0) && p1.status === 'ok',
        applyToFacade: { buildingType: 'simple_house', H: 3.0, A: a1, w: 1.0, withFraming: false },
        targetElement: 'pier',
      },
      {
        num: 2,
        description: 'H = 4.00, A:H = 2:3, w = 1.15 (без обрамления)',
        expectedSummary: 'A = 2.667; p = 1.517; p ≥ w — ok',
        actualSummary: `A = ${formatMeters(a2)}; p = ${formatMeters(p2.p)}; status = ${p2.status}`,
        passed: near(a2, 2.6667) && near(p2.p, 1.5167) && p2.status === 'ok',
        applyToFacade: { buildingType: 'simple_house', H: 4.0, A: a2, w: 1.15, withFraming: false },
        targetElement: 'pier',
      },
      {
        num: 3,
        description: 'H = 4.00, A:H = 4:5, w = 1.15, u = 0.20',
        expectedSummary: 'A = 3.200; w_v = 1.550; p_c = 1.650; ok',
        actualSummary: `A = ${formatMeters(a3)}; w_v = ${formatMeters(pc3.w_v)}; p_c = ${formatMeters(pc3.p_c)}; status = ${pc3.status}`,
        passed: near(a3, 3.2) && near(pc3.w_v, 1.55) && near(pc3.p_c, 1.65) && pc3.status === 'ok',
        applyToFacade: { buildingType: 'urban_house', H: 4.0, A: a3, w: 1.15, u: 0.2, withFraming: true },
        targetElement: 'framing_pier',
      },
      {
        num: 4,
        description: 'H = 4.00, A:H = 3:4, w = 1.10, u = 0.20 (равенство)',
        expectedSummary: 'A = 3.000; w_v = 1.500; p_c = 1.500; ok',
        actualSummary: `A = ${formatMeters(a4)}; w_v = ${formatMeters(pc4.w_v)}; p_c = ${formatMeters(pc4.p_c)}; status = ${pc4.status}`,
        passed: near(a4, 3.0) && near(pc4.w_v, 1.5) && near(pc4.p_c, 1.5) && pc4.status === 'ok',
        applyToFacade: { buildingType: 'urban_house', H: 4.0, A: a4, w: 1.1, u: 0.2, withFraming: true },
        targetElement: 'framing_pier',
      },
      {
        num: 5,
        description: 'Окно w = 1.00, отношение 3:5, допуск 5 %',
        expectedSummary: 'h = 1.667; d = 1.944; d/2 = 0.972; approx',
        actualSummary: `h = ${formatMeters(h5)}; d = ${formatMeters(w5.diagCheck.d)}; d/2 = ${formatMeters(w5.diagCheck.halfD)}; status = ${w5.status}`,
        passed: near(h5, 1.6667) && near(w5.diagCheck.d, 1.9437) && near(w5.diagCheck.halfD, 0.9718) && w5.status === 'approx',
        applyToFacade: { w: 1.0, h: h5, diagTolerance: 0.05 },
        targetElement: 'window',
      },
      {
        num: 6,
        description: 'Окно w = 1.00, h = 2.00 (граница 1:2)',
        expectedSummary: '1.5 ≤ 2.000 ≤ 2.0; status = ok',
        actualSummary: `h/w = ${formatMeters(w6.ratio)}; status = ${w6.status}`,
        passed: w6.status === 'ok',
        applyToFacade: { w: 1.0, h: 2.0 },
        targetElement: 'window',
      },
      {
        num: 7,
        description: 'Окно w = 1.00, h = 2.10 (превышение 2w)',
        expectedSummary: 'violation по верхнему пределу',
        actualSummary: `h/w = ${formatMeters(w7.ratio)}; status = ${w7.status}`,
        passed: w7.status === 'violation',
        applyToFacade: { w: 1.0, h: 2.1 },
        targetElement: 'window',
      },
      {
        num: 8,
        description: 'Пилястр W_p = 0.60',
        expectedSummary: 'v_max = 0.150; лёгкий 0.100…0.120',
        actualSummary: `v_max = ${formatMeters(pil8.v_max)}; лёгкий ${formatMeters(pil8.v_light_min)}…${formatMeters(pil8.v_light_max)}; status = ${pil8Chk.status}`,
        passed: near(pil8.v_max, 0.15) && near(pil8.v_light_min, 0.1) && near(pil8.v_light_max, 0.12) && pil8Chk.status === 'ok',
        applyToFacade: { Wp: 0.6, v: 0.11, pilasterCharacter: 'light', isMauerpfeiler: false },
        targetElement: 'pilaster',
      },
      {
        num: 9,
        description: 'Угол: A = 3.20, k_D = 4/5, w = 1.15, u = 0.20',
        expectedSummary: 'D = 2.560; p_corner = 1.785 > w; ok',
        actualSummary: `D = ${formatMeters(D9)}; p_corner = ${formatMeters(pcorn9)}; status = ${corn9.status}`,
        passed: near(D9, 2.56) && near(pcorn9, 1.785) && corn9.status === 'ok',
        applyToFacade: { buildingType: 'simple_house', A: 3.2, k_D: 0.8, w: 1.15, u: 0.2, withFraming: true, isRisalitCentered: false },
        targetElement: 'corner',
      },
      {
        num: 10,
        description: 'Сандрик T = 1.20, R:F:K = 6:7:8',
        expectedSummary: 's = 0.057; R = 0.343, F = 0.400, K = 0.457',
        actualSummary: `s = ${formatMeters(fr10.scale)}; R = ${formatMeters(fr10.R)}, F = ${formatMeters(fr10.F)}, K = ${formatMeters(fr10.K)}`,
        passed: near(fr10.R, 0.343) && near(fr10.F, 0.4) && near(fr10.K, 0.457),
        applyToFacade: { withFraming: true, T: 1.2, framingRatio: [6, 7, 8] },
        targetElement: 'entablature',
      },
      {
        num: 11,
        description: 'Вынос карниза при K = 0.457',
        expectedSummary: '45° = 0.457; с консолями = 0.381',
        actualSummary: `45° = ${formatMeters(pr45)}; с консолями = ${formatMeters(prCon)}`,
        passed: near(pr45, 0.457) && near(prCon, 0.381),
        applyToFacade: { withFraming: true, T: 1.2, framingRatio: [6, 7, 8], withConsoles: true },
        targetElement: 'entablature',
      },
    ];
  }, []);

  const passedCount = cases.filter((c) => c.passed).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E5DFD3]">
        <div>
          <h3 className="font-display text-2xl font-medium text-[#1C1917]">
            Верификация 11 контрольных тест-кейсов (допуск 1e-3)
          </h3>
          <p className="mt-1 text-xs text-[#57534E]">
            Живое выполнение чистых функций модуля <code className="font-mono">src/calc/rules.ts</code> по всем примерам из ТЗ и книги 1895 года.
          </p>
        </div>
        <span className="font-mono text-xs font-semibold text-[#15803D] tabular-nums">
          Пройдено: {passedCount}/{cases.length}
        </span>
      </div>

      <div className="divide-y divide-[#E5DFD3] border border-[#D6CEBE] bg-[#FBF9F5]">
        {cases.map((tc) => (
          <div
            key={tc.num}
            className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center text-xs"
          >
            <div className="lg:col-span-4">
              <div className="flex items-center gap-2 font-medium text-[#1C1917]">
                <span className="font-mono text-[#78716C]">#{tc.num}</span>
                <span>{tc.description}</span>
              </div>
            </div>
            <div className="lg:col-span-3 font-mono text-[11px] text-[#57534E] tabular-nums">
              Ожидание: {tc.expectedSummary}
            </div>
            <div className="lg:col-span-3 font-mono text-[11px] text-[#1C1917] tabular-nums">
              Факт: {tc.actualSummary}
            </div>
            <div className="lg:col-span-2 flex items-center justify-between lg:justify-end gap-3">
              {tc.passed ? (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#15803D]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PASS</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#B91C1C]">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>FAIL</span>
                </span>
              )}
              {tc.applyToFacade && (
                <button
                  type="button"
                  onClick={() => onLoadCaseOnFacade(tc.applyToFacade!, tc.targetElement)}
                  className="px-2.5 py-1 text-[11px] border border-[#D6CEBE] bg-[#F3EFE6] hover:bg-[#EAE3D5] whitespace-nowrap"
                >
                  На фасад
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
