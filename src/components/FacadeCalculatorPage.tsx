import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  RULES_DATA,
  createDefaultParamsForTypology,
  evaluateFacadeSummary,
  formatMeters,
  getTypology,
  type BuildingTypeId,
  type FacadeParameters,
  type FacadeTargetElement,
  type RuleRecord,
} from '../calc/rules';
import { FacadeSvg } from './calculator/FacadeSvg';
import { AnalyticalPlates } from './calculator/AnalyticalPlates';
import {
  CalculatorModules,
  StatusBadge,
  type CalculatorModuleId,
} from './calculator/CalculatorModules';
import { RuleCardsView, TestCasesVerificationView } from './calculator/RuleCardsPanel';

interface FacadeCalculatorPageProps {
  onOpenBookPage?: (pageNum: number) => void;
}

type CalculatorSubpage = 'workspace' | 'rules' | 'tests';

const ELEMENT_TO_MODULE: Record<FacadeTargetElement, CalculatorModuleId> = {
  axenweite: 'axes',
  pier: 'axes',
  framing_pier: 'axes',
  corner: 'corner',
  window: 'window',
  entablature: 'framing',
  pilaster: 'pilaster',
  cornice: 'cornice',
};

const ELEMENT_TO_PLATE: Partial<Record<FacadeTargetElement, 'fan' | 'golden' | 'diagonal' | 'cornice'>> = {
  axenweite: 'fan',
  window: 'golden',
  entablature: 'cornice',
  cornice: 'cornice',
};

export function FacadeCalculatorPage({ onOpenBookPage }: FacadeCalculatorPageProps) {
  const [subpage, setSubpage] = useState<CalculatorSubpage>('workspace');
  const [params, setParams] = useState<FacadeParameters>(() =>
    createDefaultParamsForTypology('urban_house')
  );
  const [activeModule, setActiveModule] = useState<CalculatorModuleId>('axes');
  const [activePlate, setActivePlate] = useState<'fan' | 'golden' | 'diagonal' | 'cornice'>('fan');
  const [highlightedElement, setHighlightedElement] = useState<FacadeTargetElement | null>(null);

  const summary = useMemo(() => evaluateFacadeSummary(params), [params]);
  const currentTypology = useMemo(() => getTypology(params.buildingType), [params.buildingType]);

  const handleUpdateParams = (patch: Partial<FacadeParameters>) => {
    setParams((prev) => ({ ...prev, ...patch }));
  };

  const handleChangeBuildingType = (type: BuildingTypeId) => {
    const preset = createDefaultParamsForTypology(type);
    setParams(preset);
  };

  const handleResetToBookExample = () => {
    // Классический пример из текста S. 5: H = 4.00 м, A:H = 4:5 (A = 3.20 м), w = 1.15 м, u = 0.20 м, k_D = 4/5
    setParams(createDefaultParamsForTypology('urban_house'));
    setHighlightedElement(null);
  };

  const handleSelectElementFromSvg = (el: FacadeTargetElement) => {
    setHighlightedElement(el);
    setActiveModule(ELEMENT_TO_MODULE[el]);
    const targetPlate = ELEMENT_TO_PLATE[el];
    if (targetPlate) setActivePlate(targetPlate);
  };

  const handleHighlightRuleOnFacade = (rule: RuleRecord) => {
    setSubpage('workspace');
    setHighlightedElement(rule.targetElement);
    setActiveModule(ELEMENT_TO_MODULE[rule.targetElement]);
    const targetPlate = ELEMENT_TO_PLATE[rule.targetElement];
    if (targetPlate) setActivePlate(targetPlate);
  };

  const handleLoadCaseOnFacade = (
    patch: Partial<FacadeParameters>,
    el: FacadeTargetElement
  ) => {
    setParams((prev) => ({ ...prev, ...patch }));
    setSubpage('workspace');
    setHighlightedElement(el);
    setActiveModule(ELEMENT_TO_MODULE[el]);
    const targetPlate = ELEMENT_TO_PLATE[el];
    if (targetPlate) setActivePlate(targetPlate);
  };

  return (
    <section aria-labelledby="calculator-heading" className="py-8 space-y-6">
      {/* Subpage Header & Internal Sub-navigation */}
      <div className="pb-6 border-b border-[#E5DFD3] flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <p className="text-xs tracking-widest uppercase text-[#78716C] font-mono">
            Параметрический модуль · Brausewetter 1895 (S. 1–12)
          </p>
          <h2
            id="calculator-heading"
            className="mt-1 font-display text-3xl lg:text-4xl font-medium text-[#1C1917] text-balance"
          >
            Интерактивный пропорциональный калькулятор фасада
          </h2>
          <p className="mt-2 text-sm text-[#57534E] max-w-2xl">
            Вычисление шага осей (Axenweite), простенков, окон, сандриков, пилястров и карнизов без округления промежуточных значений; все допущения помечены явно.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Подстраницы калькулятора"
          className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#F3EFE6] border border-[#E5DFD3] shrink-0"
        >
          {(
            [
              { id: 'workspace', label: 'Фасад и калькуляторы' },
              { id: 'rules', label: `Правила и нормы (${RULES_DATA.rules.length})` },
              { id: 'tests', label: 'Тесты (11 кейсов)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={subpage === tab.id}
              onClick={() => setSubpage(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                subpage === tab.id
                  ? 'bg-[#FBF9F5] text-[#1C1917] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {subpage === 'workspace' && (
        <div className="space-y-6">
          {/* Typology & Global Facade Bar */}
          <div className="p-4 border border-[#D6CEBE] bg-[#F3EFE6]/55 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="building-type-select"
                  className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]"
                >
                  Тип здания (Typologie)
                </label>
                <select
                  id="building-type-select"
                  value={params.buildingType}
                  onChange={(e) => handleChangeBuildingType(e.target.value as BuildingTypeId)}
                  className="px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] focus-visible:outline-2 focus-visible:outline-[#9A3412]"
                >
                  {RULES_DATA.typologies.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameRu} ({t.nameDe}) — {t.recommendedAH}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1 p-1 bg-[#FBF9F5] border border-[#D6CEBE]">
                <button
                  type="button"
                  onClick={() => handleUpdateParams({ withFraming: true })}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    params.withFraming
                      ? 'bg-[#1C1917] text-[#FBF9F5]'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  С обрамлением
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateParams({ withFraming: false })}
                  className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                    !params.withFraming
                      ? 'bg-[#1C1917] text-[#FBF9F5]'
                      : 'text-[#57534E] hover:text-[#1C1917]'
                  }`}
                >
                  Без обрамления
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge
                status={summary.overallStatus}
                text={
                  summary.overallStatus === 'ok'
                    ? `Все проверки OK (${summary.okCount}/${summary.checks.length})`
                    : summary.overallStatus === 'approx'
                      ? `Приближения (${summary.approxCount})`
                      : `Нарушения: ${summary.violationCount}`
                }
              />
              <button
                type="button"
                onClick={handleResetToBookExample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сбросить к примеру из книги</span>
              </button>
            </div>
          </div>

          {/* Typology Guidance Line */}
          <div className="px-4 py-2.5 border border-[#E5DFD3] bg-[#FBF9F5] flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#44403C]">
            <div>
              <strong className="text-[#1C1917]">{currentTypology.nameRu}</strong>{' '}
              <span className="text-[#78716C]">({currentTypology.nameDe}, {currentTypology.page}):</span>{' '}
              <span>{currentTypology.summary}</span>
            </div>
            <span className="font-mono text-[11px] text-[#9A3412] shrink-0">
              A:H {currentTypology.recommendedAH} · {currentTypology.cornerRule}
            </span>
          </div>

          {/* Two-Column Split: Left = Calculators (5 cols), Right = SVG Facade & Analytical Plates (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5">
              <CalculatorModules
                activeModule={activeModule}
                onSelectModule={(m) => {
                  setActiveModule(m);
                  if (m === 'window') setActivePlate('diagonal');
                  else if (m === 'axes') setActivePlate('fan');
                  else if (m === 'framing' || m === 'cornice') setActivePlate('cornice');
                }}
                params={params}
                summary={summary}
                onUpdateParams={handleUpdateParams}
                onHighlightElement={setHighlightedElement}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <FacadeSvg
                params={params}
                summary={summary}
                highlightedElement={highlightedElement}
                onSelectElement={handleSelectElementFromSvg}
              />

              {/* Compact Tabular Readout Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums text-xs">
                <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Шаг осей A</span>
                  <strong className="text-sm text-[#1C1917]">{formatMeters(params.A)} м</strong>
                  <span className="block text-[11px] text-[#57534E]">
                    A:H = {formatMeters(summary.ahCheck.ratio, 3)}
                  </span>
                </div>
                <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">
                    {params.withFraming ? 'Чистый простенок p_c' : 'Простенок p'}
                  </span>
                  <strong className="text-sm text-[#1C1917]">
                    {formatMeters(
                      'p_c' in summary.pierResult ? summary.pierResult.p_c : summary.pierResult.p
                    )}{' '}
                    м
                  </strong>
                  <span className="block text-[11px] text-[#57534E]">
                    {params.withFraming
                      ? `w_v = ${formatMeters(params.w + 2 * params.u)} м`
                      : `w = ${formatMeters(params.w)} м`}
                  </span>
                </div>
                <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Угол p_corner</span>
                  <strong className="text-sm text-[#1C1917]">
                    {formatMeters(summary.cornerCheck.p_corner)} м
                  </strong>
                  <span className="block text-[11px] text-[#57534E]">
                    D = {formatMeters(summary.cornerCheck.D)} м
                  </span>
                </div>
                <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Окно w × h</span>
                  <strong className="text-sm text-[#1C1917]">
                    {formatMeters(params.w, 2)} × {formatMeters(params.h, 2)}
                  </strong>
                  <span className="block text-[11px] text-[#57534E]">
                    ближ. {summary.windowCheck.nearestApprox.spec.label}
                  </span>
                </div>
              </div>

              <AnalyticalPlates
                activePlate={activePlate}
                onSelectPlate={setActivePlate}
                params={params}
                summary={summary}
                onUpdateParams={handleUpdateParams}
              />
            </div>
          </div>
        </div>
      )}

      {subpage === 'rules' && (
        <RuleCardsView
          onHighlightRuleOnFacade={handleHighlightRuleOnFacade}
          onOpenBookPage={onOpenBookPage}
        />
      )}

      {subpage === 'tests' && (
        <TestCasesVerificationView onLoadCaseOnFacade={handleLoadCaseOnFacade} />
      )}
    </section>
  );
}
