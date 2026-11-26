import { useMemo, useState } from 'react';
import { Award, CheckCircle2, GraduationCap, Lock, LogOut, RotateCcw } from 'lucide-react';
import {
  D_from_A,
  RULES_DATA,
  applyBuildingVariantPreset,
  createDefaultParamsForTypology,
  evaluateFacadeSummary,
  formatMeters,
  getTypology,
  type BuildingTypeId,
  type BuildingVariant,
  type FacadeParameters,
  type FacadeTargetElement,
  type MultiSub,
  type RuleRecord,
} from '../calc/rules';
import {
  getExamResultSummary,
  isExamBlindState,
} from '../calc/examMode';
import {
  computeNextFacadeParams,
  countLockedParams,
  type LockedParamsMap,
} from '../calc/paramLocks';
import type { RuleBookExcerpt } from '../calc/ruleBookRefs';
import { TextWithGlossaryLinks, type GlossaryLookupEntry } from '../utils/termHighlight';
import { FacadeSvg } from './calculator/FacadeSvg';
import { AnalyticalPlates, type AnalyticalPlateId } from './calculator/AnalyticalPlates';
import {
  CalculatorModules,
  StatusBadge,
  type CalculatorModuleId,
} from './calculator/CalculatorModules';
import { RuleCardsView, TestCasesVerificationView } from './calculator/RuleCardsPanel';

export type CalculatorSubpage = 'workspace' | 'rules' | 'tests';

export interface CalcSessionSnapshot {
  params: FacadeParameters;
  lockedParams: LockedParamsMap;
}

interface FacadeCalculatorPageProps {
  onOpenBookPage?: (pageNum: number, excerpt?: RuleBookExcerpt) => void;
  onOpenGlossaryTerm?: (entry: GlossaryLookupEntry) => void;
  subpage?: CalculatorSubpage;
  onChangeSubpage?: (sub: CalculatorSubpage) => void;
  expertMode?: boolean;
  onChangeExpertMode?: (val: boolean) => void;
  examMode?: boolean;
  examSubmitted?: boolean;
  onEnterExamMode?: () => void;
  onSubmitExam?: () => void;
  onRestartExam?: () => void;
  onExitExamMode?: () => void;
  activeModule?: CalculatorModuleId;
  onChangeActiveModule?: (mod: CalculatorModuleId) => void;
  activePlate?: AnalyticalPlateId;
  onChangeActivePlate?: (plate: AnalyticalPlateId) => void;
  highlightedElement?: FacadeTargetElement | null;
  onChangeHighlightedElement?: (el: FacadeTargetElement | null) => void;
  params?: FacadeParameters;
  lockedParams?: LockedParamsMap;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetSession?: () => void;
  onCommitSnapshot?: (
    updater: (prev: CalcSessionSnapshot) => CalcSessionSnapshot,
    burstKey?: string
  ) => void;
}

const ELEMENT_TO_MODULE: Record<FacadeTargetElement, CalculatorModuleId> = {
  axenweite: 'axes',
  pier: 'axes',
  framing_pier: 'axes',
  corner: 'corner',
  window: 'window',
  entablature: 'framing',
  pilaster: 'pilaster',
  cornice: 'cornice',
  socle: 'socle',
  belt: 'belt',
};

const ELEMENT_TO_PLATE: Partial<Record<FacadeTargetElement, AnalyticalPlateId>> = {
  axenweite: 'fan',
  window: 'golden',
  entablature: 'cornice',
  cornice: 'cornice',
  socle: 'socle',
  belt: 'belt',
};

const computeNextParams = computeNextFacadeParams;

export function FacadeCalculatorPage({
  onOpenBookPage,
  onOpenGlossaryTerm,
  subpage: controlledSubpage,
  onChangeSubpage,
  expertMode: controlledExpertMode,
  onChangeExpertMode,
  examMode: controlledExamMode,
  examSubmitted: controlledExamSubmitted,
  onEnterExamMode,
  onSubmitExam,
  onRestartExam,
  onExitExamMode,
  activeModule: controlledActiveModule,
  onChangeActiveModule,
  activePlate: controlledActivePlate,
  onChangeActivePlate,
  highlightedElement: controlledHighlightedElement,
  onChangeHighlightedElement,
  params: controlledParams,
  lockedParams: controlledLockedParams,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onResetSession,
  onCommitSnapshot,
}: FacadeCalculatorPageProps) {
  const [localSubpage, setLocalSubpage] = useState<CalculatorSubpage>('workspace');
  const [localExpertMode, setLocalExpertMode] = useState<boolean>(false);
  const [localExamMode, setLocalExamMode] = useState<boolean>(false);
  const [localExamSubmitted, setLocalExamSubmitted] = useState<boolean>(false);
  const [localActiveModule, setLocalActiveModule] = useState<CalculatorModuleId>('axes');
  const [localActivePlate, setLocalActivePlate] = useState<AnalyticalPlateId>('fan');
  const [localHighlightedElement, setLocalHighlightedElement] =
    useState<FacadeTargetElement | null>(null);
  const [localParams, setLocalParams] = useState<FacadeParameters>(() =>
    createDefaultParamsForTypology('urban_house')
  );
  const [localLockedParams, setLocalLockedParams] = useState<LockedParamsMap>({});

  const examMode = controlledExamMode ?? localExamMode;
  const examSubmitted = controlledExamSubmitted ?? localExamSubmitted;
  const isExamBlind = isExamBlindState(examMode, examSubmitted);

  const subpage = examMode ? 'workspace' : (controlledSubpage ?? localSubpage);
  const setSubpage = (next: CalculatorSubpage) => {
    if (examMode && next !== 'workspace') return;
    if (onChangeSubpage) onChangeSubpage(next);
    else setLocalSubpage(next);
  };

  const expertMode = isExamBlind ? false : (controlledExpertMode ?? localExpertMode);
  const setExpertMode = (valOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    if (isExamBlind) return;
    const resolved =
      typeof valOrUpdater === 'function' ? valOrUpdater(expertMode) : valOrUpdater;
    if (onChangeExpertMode) onChangeExpertMode(resolved);
    else setLocalExpertMode(resolved);
  };

  const activeModule =
    isExamBlind && (controlledActiveModule ?? localActiveModule) === 'summary'
      ? 'axes'
      : (controlledActiveModule ?? localActiveModule);
  const setActiveModule = (mod: CalculatorModuleId) => {
    if (isExamBlind && mod === 'summary') return;
    if (onChangeActiveModule) onChangeActiveModule(mod);
    else setLocalActiveModule(mod);
  };

  const handleEnterExam = () => {
    if (onEnterExamMode) {
      onEnterExamMode();
      return;
    }
    setLocalExamMode(true);
    setLocalExamSubmitted(false);
    setLocalExpertMode(false);
    setLocalSubpage('workspace');
    if (localActiveModule === 'summary') setLocalActiveModule('axes');
    setLocalHighlightedElement(null);
  };

  const handleSubmitExamClick = () => {
    if (onSubmitExam) {
      onSubmitExam();
      return;
    }
    setLocalExamSubmitted(true);
    setLocalSubpage('workspace');
    setLocalActiveModule('summary');
  };

  const handleRestartExamClick = () => {
    if (onRestartExam) {
      onRestartExam();
      return;
    }
    setLocalExamSubmitted(false);
    setLocalSubpage('workspace');
    if (localActiveModule === 'summary') setLocalActiveModule('axes');
    setLocalHighlightedElement(null);
  };

  const handleExitExamClick = () => {
    if (onExitExamMode) {
      onExitExamMode();
      return;
    }
    setLocalExamMode(false);
    setLocalExamSubmitted(false);
  };

  const activePlate = controlledActivePlate ?? localActivePlate;
  const setActivePlate = onChangeActivePlate ?? setLocalActivePlate;

  const highlightedElement =
    controlledHighlightedElement !== undefined
      ? controlledHighlightedElement
      : localHighlightedElement;
  const setHighlightedElement = onChangeHighlightedElement ?? setLocalHighlightedElement;

  const params = controlledParams ?? localParams;
  const lockedParams = controlledLockedParams ?? localLockedParams;

  const summary = useMemo(
    () => evaluateFacadeSummary(params, { expertMode }),
    [params, expertMode]
  );
  const examResult = useMemo(() => getExamResultSummary(summary), [summary]);
  const currentTypology = useMemo(() => getTypology(params.buildingType), [params.buildingType]);
  const lockedCount = useMemo(() => countLockedParams(lockedParams), [lockedParams]);
  const effectiveOpenBookPage = examMode ? undefined : onOpenBookPage;
  const effectiveOpenGlossaryTerm = examMode ? undefined : onOpenGlossaryTerm;

  const handleToggleLock = (key: string) => {
    if (onCommitSnapshot) {
      onCommitSnapshot((prev) => {
        const nextLocks = { ...prev.lockedParams };
        if (nextLocks[key]) delete nextLocks[key];
        else nextLocks[key] = true;
        return { params: prev.params, lockedParams: nextLocks };
      });
      return;
    }
    setLocalLockedParams((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  };

  const handleUpdateParams = (rawPatch: Partial<FacadeParameters>) => {
    const burstKey = Object.keys(rawPatch).sort().join(',');
    if (onCommitSnapshot) {
      onCommitSnapshot((prev) => {
        const nextParams = computeNextParams(prev.params, rawPatch, prev.lockedParams);
        if (nextParams === prev.params) return prev;
        return { params: nextParams, lockedParams: prev.lockedParams };
      }, burstKey);
      return;
    }
    setLocalParams((prev) => computeNextParams(prev, rawPatch, localLockedParams));
  };

  const handleChangeBuildingType = (type: BuildingTypeId) => {
    const preset = createDefaultParamsForTypology(type);
    handleUpdateParams(preset);
  };

  const handleResetToBookExample = () => {
    if (onResetSession) {
      onResetSession();
      return;
    }
    setLocalLockedParams({});
    setLocalParams(createDefaultParamsForTypology('urban_house'));
    setHighlightedElement(null);
  };

  const handleClearAllLocks = () => {
    if (onCommitSnapshot) {
      onCommitSnapshot((prev) => ({ params: prev.params, lockedParams: {} }));
      return;
    }
    setLocalLockedParams({});
  };

  const handleSelectElementFromSvg = (el: FacadeTargetElement) => {
    setHighlightedElement(el);
    setActiveModule(ELEMENT_TO_MODULE[el]);
    const targetPlate = ELEMENT_TO_PLATE[el];
    if (targetPlate) setActivePlate(targetPlate);
  };

  const handleHighlightRuleOnFacade = (rule: RuleRecord) => {
    if (rule.priority === 'P3' && !expertMode) {
      setExpertMode(true);
    }
    setSubpage('workspace');
    setHighlightedElement(rule.targetElement);
    setActiveModule(ELEMENT_TO_MODULE[rule.targetElement]);
    const targetPlate = ELEMENT_TO_PLATE[rule.targetElement];
    if (targetPlate) setActivePlate(targetPlate);
  };

  const handleHighlightElementOnFacade = (el: FacadeTargetElement) => {
    setSubpage('workspace');
    setHighlightedElement(el);
    setActiveModule(ELEMENT_TO_MODULE[el]);
    const targetPlate = ELEMENT_TO_PLATE[el];
    if (targetPlate) setActivePlate(targetPlate);
  };

  const handleLoadCaseOnFacade = (
    patch: Partial<FacadeParameters>,
    el: FacadeTargetElement
  ) => {
    handleUpdateParams(patch);
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
            {examMode
              ? 'Режим «Экзамен» · Самостоятельная настройка фасада'
              : 'Параметрический модуль · Brausewetter 1895 (S. 1–23)'}
          </p>
          <h2
            id="calculator-heading"
            className="mt-1 font-display text-3xl lg:text-4xl font-medium text-[#1C1917] text-balance"
          >
            Интерактивный пропорциональный калькулятор фасада
          </h2>
          <p className="mt-2 text-sm text-[#57534E] max-w-2xl">
            {isExamBlind ? (
              'Настройте параметры фасада интуитивно без подсказок. Когда завершите, нажмите «Завершить создание и узнать результат».'
            ) : (
              <TextWithGlossaryLinks
                text="Вычисление шага осей (Axenweite), простенков, окон, сандриков, пилястров, карнизов, цоколя и поэтажных отметок без округления промежуточных значений; проверенные нормы книги отделены от UX-эвристик."
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            )}
          </p>
        </div>

        {!examMode && (
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
        )}
      </div>

      {subpage === 'workspace' && (
        <div className="space-y-6">
          {/* Exam Mode Banner */}
          {examMode && !examSubmitted && (
            <div className="p-4 border-2 border-[#9A3412]/70 bg-[#9A3412]/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#9A3412] font-semibold">
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span>Режим «Экзамен» активен</span>
                </div>
                <p className="text-xs text-[#44403C] max-w-2xl leading-relaxed">
                  Все подсказки, нормы и индикаторы нарушений скрыты, а переход к тексту трактата и терминам заблокирован.
                  Меняйте любые параметры фасада, затем проверьте результат.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleSubmitExamClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#9A3412] text-[#FBF9F5] hover:bg-[#7C2D12] transition-colors whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Завершить создание и узнать результат</span>
                </button>
                <button
                  type="button"
                  onClick={handleExitExamClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#44403C] hover:bg-[#EAE3D5] transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Выйти из режима «Экзамен»</span>
                </button>
              </div>
            </div>
          )}

          {examMode && examSubmitted && (
            <div
              className={`p-4 border-2 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                examResult.passed
                  ? 'border-[#15803D]/60 bg-[#15803D]/[0.06]'
                  : 'border-[#B91C1C]/60 bg-[#FEF2F2]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider font-semibold ${
                      examResult.passed ? 'text-[#15803D]' : 'text-[#B91C1C]'
                    }`}
                  >
                    <Award className="w-4 h-4 shrink-0" />
                    <span>
                      {examResult.passed
                        ? 'Результат экзамена: нарушений не обнаружено'
                        : `Результат экзамена: выявлено нарушений — ${examResult.violationCount}`}
                    </span>
                  </span>
                  <span className="font-mono text-[11px] text-[#44403C] tabular-nums">
                    OK: {examResult.okCount}/{examResult.totalChecks} · Приближ.: {examResult.approxCount} · Нарушения: {examResult.violationCount}
                  </span>
                </div>
                <p className="text-xs text-[#44403C] max-w-2xl leading-relaxed">
                  Нарушения теперь отображаются на чертеже фасада и в разделе «Сводка». Переход к тексту и терминам станет доступен после выхода из режима «Экзамен».
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRestartExamClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#9A3412]/50 bg-[#FBF9F5] text-[#9A3412] hover:bg-[#9A3412]/10 transition-colors whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Повторить экзамен</span>
                </button>
                <button
                  type="button"
                  onClick={handleExitExamClick}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-[#1C1917] text-[#FBF9F5] hover:bg-[#292524] transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span>Выйти из режима «Экзамен»</span>
                </button>
              </div>
            </div>
          )}

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
                      {isExamBlind
                        ? `${t.nameRu} (${t.nameDe})`
                        : `${t.nameRu} (${t.nameDe}) — ${t.recommendedAH}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                  Этажность (пресет)
                </span>
                <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FBF9F5] border border-[#D6CEBE]">
                  {(
                    [
                      { variant: 'one-story', sub: 'general', label: '1 эт.' },
                      { variant: 'two-story', sub: 'general', label: '2 эт.' },
                      { variant: 'multi-story', sub: 'three', label: '3 эт.' },
                      { variant: 'multi-story', sub: 'four-five', label: '4–5 эт.' },
                      { variant: 'multi-story', sub: 'general', label: 'Многоэт.' },
                    ] as { variant: BuildingVariant; sub: MultiSub; label: string }[]
                  ).map((item) => {
                    const isActive =
                      item.variant !== 'multi-story'
                        ? params.buildingVariant === item.variant
                        : params.buildingVariant === 'multi-story' && params.multiSub === item.sub;
                    return (
                      <button
                        key={`${item.variant}-${item.sub}`}
                        type="button"
                        onClick={() =>
                          handleUpdateParams(
                            applyBuildingVariantPreset(params, item.variant, item.sub)
                          )
                        }
                        className={`px-2 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-[#9A3412] text-[#FBF9F5]'
                            : 'text-[#57534E] hover:text-[#1C1917]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
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
              {!isExamBlind && (
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
              )}
              {lockedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllLocks}
                  title="Нажмите, чтобы снять замочки со всех закреплённых параметров"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-[#9A3412]/50 bg-[#9A3412]/10 text-[#9A3412] hover:bg-[#9A3412]/15 transition-colors whitespace-nowrap shrink-0"
                >
                  <Lock className="w-3 h-3" />
                  <span>Замочков: {lockedCount} · Снять все</span>
                </button>
              )}
              {!examMode && (
                <button
                  type="button"
                  aria-pressed={expertMode}
                  onClick={() => setExpertMode((v) => !v)}
                  className={`px-3 py-1.5 text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                    expertMode
                      ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                      : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                  }`}
                >
                  {expertMode ? 'Эксперт P3: вкл.' : 'Эксперт P3: выкл.'}
                </button>
              )}
              {!examMode && (
                <button
                  type="button"
                  onClick={handleEnterExam}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#9A3412]/60 bg-[#9A3412]/10 text-[#9A3412] hover:bg-[#9A3412]/15 transition-colors whitespace-nowrap shrink-0"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Режим «Экзамен»</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleResetToBookExample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isExamBlind ? 'Сбросить фасад' : 'Сбросить к примеру из книги'}</span>
              </button>
            </div>
          </div>

          {/* Typology Guidance Line */}
          {!isExamBlind && (
            <div className="px-4 py-2.5 border border-[#E5DFD3] bg-[#FBF9F5] flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#44403C]">
              <div>
                <strong className="text-[#1C1917]">{currentTypology.nameRu}</strong>{' '}
                <span className="text-[#78716C]">
                  ({currentTypology.nameDe}, {currentTypology.page}):
                </span>{' '}
                <TextWithGlossaryLinks
                  text={currentTypology.summary}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </div>
              <span className="font-mono text-[11px] text-[#9A3412] shrink-0">
                A:H {currentTypology.recommendedAH} ·{' '}
                <TextWithGlossaryLinks
                  text={currentTypology.cornerRule}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </span>
            </div>
          )}

          {/* Two-Column Split: Left = Independent Scrollable Calculators (5 cols), Right = SVG Facade & Detail Plate (7 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] flex flex-col">
              <CalculatorModules
                activeModule={activeModule}
                onSelectModule={(m) => {
                  setActiveModule(m);
                  if (m === 'window') setActivePlate('diagonal');
                  else if (m === 'axes' || m === 'variants') setActivePlate('fan');
                  else if (m === 'framing' || m === 'cornice') setActivePlate('cornice');
                  else if (m === 'socle') setActivePlate('socle');
                  else if (m === 'belt') setActivePlate('belt');
                }}
                params={params}
                summary={summary}
                expertMode={expertMode}
                examMode={examMode}
                examSubmitted={examSubmitted}
                lockedParams={lockedParams}
                onToggleLock={handleToggleLock}
                onUpdateParams={handleUpdateParams}
                onHighlightElement={setHighlightedElement}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </div>

            <div className="lg:col-span-7 space-y-6">
              <FacadeSvg
                params={params}
                summary={summary}
                highlightedElement={highlightedElement}
                hideValidation={isExamBlind}
                onSelectElement={handleSelectElementFromSvg}
                onSelectEntrance={() => {
                  setHighlightedElement(null);
                  setActiveModule('entrance');
                }}
                onOpenBookPage={effectiveOpenBookPage}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={onUndo}
                onRedo={onRedo}
              />

              {/* Compact Tabular Readout Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono tabular-nums text-xs">
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
                    {isExamBlind
                      ? `w:h = 1:${formatMeters(params.h / Math.max(0.1, params.w), 2)}`
                      : `ближ. ${summary.windowCheck.nearestApprox.spec.label}`}
                  </span>
                </div>
                <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Цоколь / H_зд</span>
                  <strong className="text-sm text-[#1C1917]">
                    {formatMeters(
                      params.useFullFloorAsSocle
                        ? summary.derivedGeometry.floor1FullHeight
                        : params.hSocle,
                      2
                    )}{' '}
                    м
                  </strong>
                  <span className="block text-[11px] text-[#57534E]">
                    H_зд={formatMeters(summary.derivedGeometry.totalHeight, 2)} · H_max={formatMeters(summary.derivedGeometry.H_max, 2)}
                  </span>
                </div>
              </div>

              {isExamBlind ? (
                <div className="p-4 border border-dashed border-[#D6CEBE] bg-[#F3EFE6]/45 text-xs text-[#57534E]">
                  Геометрические таблицы с нормативными проверками скрыты в режиме «Экзамен» и откроются после нажатия «Завершить создание и узнать результат».
                </div>
              ) : (
                <AnalyticalPlates
                  activePlate={activePlate}
                  onSelectPlate={setActivePlate}
                  params={params}
                  summary={summary}
                  onUpdateParams={handleUpdateParams}
                  lockedParams={lockedParams}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {subpage === 'rules' && !examMode && (
        <RuleCardsView
          expertMode={expertMode}
          onToggleExpertMode={() => setExpertMode((v) => !v)}
          onHighlightRuleOnFacade={handleHighlightRuleOnFacade}
          onOpenBookPage={effectiveOpenBookPage}
        />
      )}

      {subpage === 'tests' && !examMode && (
        <TestCasesVerificationView
          summary={summary}
          onLoadCaseOnFacade={handleLoadCaseOnFacade}
          onHighlightElementOnFacade={handleHighlightElementOnFacade}
          onOpenBookPage={effectiveOpenBookPage}
        />
      )}
    </section>
  );
}
