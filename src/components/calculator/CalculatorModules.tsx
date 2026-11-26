import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  Unlock,
  XCircle,
} from 'lucide-react';
import { isExamBlindState, stripExamNormHints } from '../../calc/examMode';
import { isFramingRLocked, isParamLocked, type LockedParamsMap } from '../../calc/paramLocks';
import { getExcerptForCheckId, type RuleBookExcerpt } from '../../calc/ruleBookRefs';
import { TextWithGlossaryLinks, type GlossaryLookupEntry } from '../../utils/termHighlight';
import {
  A_from_H,
  A_from_pier_wu,
  A_from_pw,
  A_min_from_wu,
  BELT_CLASSES,
  BELT_TEXT_GAPS,
  D_from_cornerPier,
  H_from_A,
  PHI,
  RULES_DATA,
  SOURCE_STATUS_LABELS,
  VARIANT_TEXT_GAPS,
  applyBuildingVariantPreset,
  applyFloorCountPreset,
  beltHeight,
  formatMeters,
  formatPercent,
  framing_from_module,
  getAxesGroupingHint,
  gurtModeFromSchemeNumber,
  h_from_w_ratio,
  hasAnyActiveBelt,
  hasAnySillBelt,
  isPilasterEnabledOnFloor,
  kD_from_cornerPier,
  projection_45,
  projection_console,
  resolveBeltFloorsMask,
  resolveBeltSillFloorsMask,
  resolveEntranceGeometry,
  resolveEntrancePositionFromSettings,
  resolveOrdinaryPierAxesM,
  resolveOrdinaryPierAxisEdgeOffsetM,
  resolveOrdinaryPierWidthsM,
  resolvePilasterElevationSpans,
  resolveScaledVerticalGeometry,
  resolveSocleAndPilasterBounds,
  resolveWindowAxesM,
  resolveWindowAxisStepsM,
  resolveWindowSillHeightM,
  schemeNumberFromGurtMode,
  socleHeight,
  threeStoryBeltScheme,
  w_from_h_ratio,
  w_max_from_A,
  type BeltClassType,
  type BeltConsoleMode,
  type BeltEffect,
  type BeltMode,
  type BuildingVariant,
  type ColumnProfileType,
  type CompositionKind,
  type CorniceCompositionStyle,
  type CorniceVariantMode,
  type EntrancePlacement,
  type EntrancePosition,
  type FacadeParameters,
  type FacadeSummary,
  type FacadeTargetElement,
  type FiveStoryScheme,
  type MultiSub,
  type PedimentType,
  type PilasterPlacement,
  type SocleMode,
  type SourceStatus,
  type ThreeStoryBeltSchemeNumber,
  type ThreeStoryGurtMode,
  type ValidationStatus,
} from '../../calc/rules';

export type CalculatorModuleId =
  | 'axes'
  | 'variants'
  | 'entrance'
  | 'window'
  | 'corner'
  | 'framing'
  | 'pilaster'
  | 'cornice'
  | 'socle'
  | 'belt'
  | 'summary';

const ExamBlindContext = createContext<boolean>(false);

interface CalculatorModulesProps {
  activeModule: CalculatorModuleId;
  onSelectModule: (mod: CalculatorModuleId) => void;
  params: FacadeParameters;
  summary: FacadeSummary;
  expertMode?: boolean;
  examMode?: boolean;
  examSubmitted?: boolean;
  lockedParams?: LockedParamsMap;
  onToggleLock?: (key: string) => void;
  onUpdateParams: (patch: Partial<FacadeParameters>) => void;
  onHighlightElement: (el: FacadeTargetElement | null) => void;
  onOpenBookPage?: (pageNum: number, excerpt?: RuleBookExcerpt) => void;
  onOpenGlossaryTerm?: (entry: GlossaryLookupEntry) => void;
}

export function StatusBadge({ status, text }: { status: ValidationStatus; text?: string }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#15803D] whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{text ?? 'OK'}</span>
      </span>
    );
  }
  if (status === 'approx') {
    return (
      <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#B45309] whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{text ?? 'ПРИБЛ.'}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#B91C1C] whitespace-nowrap">
      <XCircle className="w-3.5 h-3.5 shrink-0" />
      <span>{text ?? 'НАРУШЕНИЕ'}</span>
    </span>
  );
}

function LockToggleButton({
  lockKey,
  locked,
  onToggleLock,
  label,
}: {
  lockKey: string;
  locked: boolean;
  onToggleLock?: (key: string) => void;
  label?: string;
}) {
  if (!onToggleLock) return null;
  return (
    <button
      type="button"
      onClick={() => onToggleLock(lockKey)}
      aria-pressed={locked}
      title={
        locked
          ? `Параметр «${label ?? lockKey}» закреплён замочком — нажмите, чтобы разрешить изменение`
          : `Закрепить «${label ?? lockKey}» замочком (не будет меняться при пересчётах и пресетах)`
      }
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px] font-mono transition-colors shrink-0 ${
        locked
          ? 'border-[#9A3412]/60 bg-[#9A3412]/12 text-[#9A3412] hover:bg-[#9A3412]/20'
          : 'border-[#D6CEBE] bg-[#FBF9F5] text-[#78716C] hover:text-[#1C1917] hover:bg-[#EAE3D5]'
      }`}
    >
      {locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
      {locked && <span>замок</span>}
    </button>
  );
}

function CollapsibleSection({
  title,
  badge,
  defaultOpen = true,
  subtle = false,
  children,
}: {
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  subtle?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isExamBlind = useContext(ExamBlindContext);
  const displayTitle = isExamBlind ? stripExamNormHints(title) : title;
  const hideBadge =
    isExamBlind && Boolean(badge && (badge === 'эвристика' || /пробел|пункт/i.test(badge)));

  return (
    <div className={`border border-[#E5DFD3] ${subtle ? 'bg-[#F3EFE6]/45' : 'bg-[#FBF9F5]'}`}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left bg-[#F3EFE6]/60 hover:bg-[#EAE3D5]/75 transition-colors"
      >
        <span className="flex items-center gap-1.5 text-xs font-medium text-[#1C1917] min-w-0">
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 text-[#78716C]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#78716C]" />
          )}
          <span className="truncate">{displayTitle}</span>
        </span>
        {badge && !hideBadge && (
          <span className="font-mono text-[10px] text-[#78716C] shrink-0">{badge}</span>
        )}
      </button>
      {isOpen && <div className="p-3 space-y-3 border-t border-[#E5DFD3]">{children}</div>}
    </div>
  );
}

function MeterControl({
  id,
  label,
  value,
  min,
  max,
  step = 0.01,
  unit = 'м',
  disabled = false,
  note,
  lockKey,
  locked = false,
  onToggleLock,
  onOpenGlossaryTerm,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  note?: string;
  lockKey?: string;
  locked?: boolean;
  onToggleLock?: (key: string) => void;
  onOpenGlossaryTerm?: (entry: GlossaryLookupEntry) => void;
  onChange: (val: number) => void;
}) {
  const isExamBlind = useContext(ExamBlindContext);
  const displayLabel = isExamBlind ? stripExamNormHints(label) : label;
  const displayNote = isExamBlind ? undefined : note;
  const isLocked = Boolean(lockKey && locked);
  const inputDisabled = disabled || isLocked;

  return (
    <div
      className={`space-y-1.5 ${
        isLocked ? 'p-2 -mx-2 border border-[#9A3412]/35 bg-[#9A3412]/[0.04]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <label htmlFor={id} className="text-xs font-medium text-[#1C1917]">
            <TextWithGlossaryLinks
              text={displayLabel}
              onOpenGlossaryTerm={onOpenGlossaryTerm}
              insideLabel={true}
            />
          </label>
          {lockKey && (
            <LockToggleButton
              lockKey={lockKey}
              locked={isLocked}
              onToggleLock={onToggleLock}
              label={displayLabel}
            />
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            id={`${id}-num`}
            type="number"
            value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0}
            min={min}
            max={max * 2}
            step={step}
            disabled={inputDisabled}
            aria-label={`${displayLabel} (${unit})`}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (Number.isFinite(parsed)) onChange(parsed);
            }}
            className="w-20 px-2 py-1 text-xs font-mono tabular-nums text-right border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] disabled:bg-[#F3EFE6] disabled:text-[#78716C] focus-visible:outline-2 focus-visible:outline-[#9A3412]"
          />
          <span className="text-[11px] font-mono text-[#78716C]">{unit}</span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        disabled={inputDisabled}
        value={Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))}
        aria-label={displayLabel}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#9A3412] cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
      />
      {displayNote && (
        <p className="text-[11px] text-[#78716C]">
          <TextWithGlossaryLinks text={displayNote} onOpenGlossaryTerm={onOpenGlossaryTerm} />
        </p>
      )}
    </div>
  );
}

function WhyBlock({
  ruleId,
  status,
  formula,
  page,
  explanation,
  isHeuristic,
  sourceStatus,
  onOpenBookPage,
  onOpenGlossaryTerm,
}: {
  ruleId?: string;
  status: ValidationStatus;
  formula: string;
  page: string;
  explanation: string;
  isHeuristic?: boolean;
  sourceStatus?: SourceStatus;
  onOpenBookPage?: (pageNum: number, excerpt?: RuleBookExcerpt) => void;
  onOpenGlossaryTerm?: (entry: GlossaryLookupEntry) => void;
}) {
  const isExamBlind = useContext(ExamBlindContext);
  if (isExamBlind) return null;

  const firstPageMatch = page.match(/\d+/);
  const pageNum = firstPageMatch ? parseInt(firstPageMatch[0], 10) : 5;
  const excerpt = ruleId ? getExcerptForCheckId(ruleId, page) : undefined;
  const provenanceText = sourceStatus
    ? SOURCE_STATUS_LABELS[sourceStatus]
    : isHeuristic
      ? SOURCE_STATUS_LABELS.heuristic
      : SOURCE_STATUS_LABELS['explicit-verified'];
  const isAccentProv =
    isHeuristic || sourceStatus === 'heuristic' || sourceStatus === 'gap';

  return (
    <div
      className={`mt-4 p-3.5 border space-y-2 text-xs ${
        status === 'violation'
          ? 'border-[#B91C1C]/60 bg-[#B91C1C]/[0.05]'
          : 'border-[#D6CEBE] bg-[#F3EFE6]/60'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
            Почему так?
          </span>
          <span
            className={`font-mono text-[11px] ${
              isAccentProv ? 'text-[#9A3412]' : 'text-[#78716C]'
            }`}
          >
            · {provenanceText}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {onOpenBookPage ? (
            <button
              type="button"
              onClick={() => onOpenBookPage(excerpt?.pageNumber ?? pageNum, excerpt)}
              title="Открыть правило в читальном зале с подсветкой текста"
              className="font-mono text-[11px] text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
            >
              {page}
            </button>
          ) : (
            <span className="font-mono text-[11px] text-[#78716C]">{page}</span>
          )}
        </div>
      </div>
      <p className="font-mono text-[11px] text-[#1C1917] bg-[#FBF9F5] px-2.5 py-1.5 border border-[#E5DFD3]">
        {formula}
      </p>
      <p className="text-xs leading-relaxed text-[#44403C]">
        <TextWithGlossaryLinks text={explanation} onOpenGlossaryTerm={onOpenGlossaryTerm} />
      </p>
    </div>
  );
}

export function CalculatorModules({
  activeModule,
  onSelectModule,
  params,
  summary,
  expertMode = false,
  examMode = false,
  examSubmitted = false,
  lockedParams = {},
  onToggleLock,
  onUpdateParams,
  onHighlightElement,
  onOpenBookPage,
  onOpenGlossaryTerm,
}: CalculatorModulesProps) {
  const isExamBlind = isExamBlindState(examMode, examSubmitted);
  const effectiveOpenBookPage = examMode ? undefined : onOpenBookPage;
  const effectiveOpenGlossaryTerm = examMode ? undefined : onOpenGlossaryTerm;

  // Локальные настройки режимов решателя внутри каждого модуля
  const [axesSolveMode, setAxesSolveMode] = useState<'find_A' | 'find_H' | 'find_w' | 'find_p_A' | 'check'>('find_A');
  const [axesRatioChoice, setAxesRatioChoice] = useState<string>('4:5');
  const [customAxN, setCustomAxN] = useState(4);
  const [customAxM, setCustomAxM] = useState(5);
  const [targetPierInput, setTargetPierInput] = useState(1.5);

  const [winSolveMode, setWinSolveMode] = useState<'find_h' | 'find_w' | 'check'>('find_h');
  const [winRatioChoice, setWinRatioChoice] = useState<string>('3:5');
  const [customWinN, setCustomWinN] = useState(3);
  const [customWinM, setCustomWinM] = useState(5);

  const [framingInputMode, setFramingInputMode] = useState<'by_T' | 'by_R' | 'by_F' | 'by_K'>('by_T');
  const framingRLocked = isFramingRLocked(lockedParams);

  const [isEditingManualHeight, setIsEditingManualHeight] = useState(false);
  const [manualHeightDraft, setManualHeightDraft] = useState<string>(() =>
    params.levels.manualTotalHeight !== undefined
      ? String(Number(params.levels.manualTotalHeight.toFixed(2)))
      : ''
  );

  useEffect(() => {
    if (!isEditingManualHeight) {
      setManualHeightDraft(
        params.levels.manualTotalHeight !== undefined
          ? String(Number(params.levels.manualTotalHeight.toFixed(2)))
          : ''
      );
    }
  }, [params.levels.manualTotalHeight, isEditingManualHeight]);

  const modules: { id: CalculatorModuleId; label: string }[] = [
    { id: 'axes', label: 'Оси и простенки' },
    { id: 'variants', label: 'Этажность' },
    { id: 'entrance', label: 'Вход (дверь)' },
    { id: 'window', label: 'Окно' },
    { id: 'corner', label: 'Угол (D)' },
    { id: 'framing', label: 'Обрамление' },
    { id: 'pilaster', label: 'Пилястр' },
    { id: 'cornice', label: 'Главный карниз' },
    { id: 'socle', label: 'Цоколь' },
    { id: 'belt', label: 'Лента (пояс)' },
    ...(!isExamBlind
      ? [
          {
            id: 'summary' as const,
            label:
              summary.violationCount > 0
                ? `Сводка (${summary.violationCount} нар.)`
                : 'Сводка',
          },
        ]
      : []),
  ];

  const safeAxesCount = Math.min(10, Math.max(2, Math.round(params.axesCount)));
  const doorD = params.isRisalitCentered
    ? Math.max(0.6, params.risalitWidth / 2)
    : Math.max(0.5, params.A * params.k_D);
  const doorAxesM = Array.from({ length: safeAxesCount }, (_, i) => doorD + i * params.A);
  const entranceGeo = resolveEntranceGeometry(
    params,
    summary.derivedGeometry.facadeWidth,
    doorAxesM
  );

  const getActiveAxRatio = (): [number, number] => {
    if (axesRatioChoice === 'custom') return [customAxN, customAxM];
    const all = [...RULES_DATA.standardAxenRatios, ...RULES_DATA.limitAxenRatios];
    const found = all.find((r) => r.label === axesRatioChoice);
    return found ? [found.n, found.m] : [4, 5];
  };

  const getActiveWinRatio = (): { type: 'phi' | 'nm'; n: number; m: number } => {
    if (winRatioChoice === 'phi') return { type: 'phi', n: 1, m: PHI };
    if (winRatioChoice === 'custom') return { type: 'nm', n: customWinN, m: customWinM };
    const found = RULES_DATA.goldenApproximations.find((r) => r.label === winRatioChoice);
    return found ? { type: 'nm', n: found.n, m: found.m } : { type: 'nm', n: 3, m: 5 };
  };

  return (
    <ExamBlindContext.Provider value={isExamBlind}>
    <div className="border border-[#D6CEBE] bg-[#FBF9F5] flex flex-col min-h-0 flex-1">
      {/* Module tabs */}
      <div className="p-2 border-b border-[#E5DFD3] bg-[#F3EFE6]/70 flex flex-wrap gap-1 shrink-0">
        {modules.map((m) => {
          const active = activeModule === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                onSelectModule(m.id);
                if (m.id === 'axes' || m.id === 'variants') onHighlightElement('axenweite');
                else if (m.id === 'window') onHighlightElement('window');
                else if (m.id === 'corner') onHighlightElement('corner');
                else if (m.id === 'framing') onHighlightElement('entablature');
                else if (m.id === 'pilaster') onHighlightElement('pilaster');
                else if (m.id === 'cornice') onHighlightElement('cornice');
                else if (m.id === 'socle') onHighlightElement('socle');
                else if (m.id === 'belt') onHighlightElement('belt');
                else onHighlightElement(null);
              }}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
                active
                  ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                  : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 min-h-0">
        {/* 4.1 Оси и простенки */}
        {activeModule === 'axes' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                <TextWithGlossaryLinks
                  text="4.1. Шаг осей (Axenweite) и простенки"
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  Выберите целевую величину для расчёта или проверьте текущие параметры (S. 5–6).
                </p>
              )}
            </div>

            <CollapsibleSection title="Режим расчёта и отношение A : H" subtle>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'find_A', label: 'Найти A (из H)' },
                    { id: 'find_H', label: 'Найти H (из A)' },
                    { id: 'find_w', label: 'Макс. w (из A)' },
                    { id: 'find_p_A', label: 'Найти A (из p и w)' },
                    { id: 'check', label: 'Проверить A, H, w, u' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setAxesSolveMode(mode.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                      axesSolveMode === mode.id
                        ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                        : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {(axesSolveMode === 'find_A' || axesSolveMode === 'find_H') && (
                <div className="pt-2 border-t border-[#E5DFD3] space-y-2.5">
                  <label className="block text-xs font-medium text-[#1C1917]">
                    Отношение A : H (n : m)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[...RULES_DATA.standardAxenRatios, ...RULES_DATA.limitAxenRatios].map((r) => (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => {
                          setAxesRatioChoice(r.label);
                          if (axesSolveMode === 'find_A') {
                            if (isParamLocked(lockedParams, 'A') && !isParamLocked(lockedParams, 'H')) {
                              onUpdateParams({ H: H_from_A(params.A, r.n, r.m) });
                            } else {
                              onUpdateParams({ A: A_from_H(params.H, r.n, r.m) });
                            }
                          } else {
                            if (isParamLocked(lockedParams, 'H') && !isParamLocked(lockedParams, 'A')) {
                              onUpdateParams({ A: A_from_H(params.H, r.n, r.m) });
                            } else {
                              onUpdateParams({ H: H_from_A(params.A, r.n, r.m) });
                            }
                          }
                        }}
                        className={`px-2 py-1 text-[11px] font-mono border transition-colors ${
                          axesRatioChoice === r.label
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAxesRatioChoice('custom')}
                      className={`px-2 py-1 text-[11px] font-mono border transition-colors ${
                        axesRatioChoice === 'custom'
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE]'
                      }`}
                    >
                      n:m
                    </button>
                  </div>

                  {axesRatioChoice === 'custom' && (
                    <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                      <span>n =</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={customAxN}
                        aria-label="Числитель отношения A:H"
                        onChange={(e) => {
                          const n = Math.max(1, parseFloat(e.target.value) || 1);
                          setCustomAxN(n);
                          if (axesSolveMode === 'find_A') {
                            onUpdateParams({ A: A_from_H(params.H, n, customAxM) });
                          } else {
                            onUpdateParams({ H: H_from_A(params.A, n, customAxM) });
                          }
                        }}
                        className="w-16 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5]"
                      />
                      <span>: m =</span>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={customAxM}
                        aria-label="Знаменатель отношения A:H"
                        onChange={(e) => {
                          const m = Math.max(1, parseFloat(e.target.value) || 1);
                          setCustomAxM(m);
                          if (axesSolveMode === 'find_A') {
                            onUpdateParams({ A: A_from_H(params.H, customAxN, m) });
                          } else {
                            onUpdateParams({ H: H_from_A(params.A, customAxN, m) });
                          }
                        }}
                        className="w-16 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5]"
                      />
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            <CollapsibleSection title="Параметры осей, окон и обрамления">
              <div className="space-y-4">
                <MeterControl
                  id="calc-H"
                  label="Высота комнаты H_max (Zimmerhöhe)"
                  value={params.H}
                  min={2.2}
                  max={6.5}
                  disabled={axesSolveMode === 'find_H'}
                  lockKey="H"
                  locked={isParamLocked(lockedParams, 'H')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={onOpenGlossaryTerm}
                  note="Для многоэтажного здания расчёт ведётся от наибольшей высоты комнаты (S. 5)."
                  onChange={(H) => {
                    if (axesSolveMode === 'find_A' && !isParamLocked(lockedParams, 'A')) {
                      const [n, m] = getActiveAxRatio();
                      onUpdateParams({ H, A: A_from_H(H, n, m) });
                    } else {
                      onUpdateParams({ H });
                    }
                  }}
                />

                <MeterControl
                  id="calc-A"
                  label="Шаг осей A (Axenweite)"
                  value={params.A}
                  min={1.4}
                  max={6.0}
                  disabled={axesSolveMode === 'find_A' || axesSolveMode === 'find_p_A'}
                  lockKey="A"
                  locked={isParamLocked(lockedParams, 'A')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={onOpenGlossaryTerm}
                  onChange={(A) => {
                    if (axesSolveMode === 'find_H' && !isParamLocked(lockedParams, 'H')) {
                      const [n, m] = getActiveAxRatio();
                      onUpdateParams({ A, H: H_from_A(A, n, m), ordinaryPierAxisSpacings: [] });
                    } else if (axesSolveMode === 'find_w' && !isParamLocked(lockedParams, 'w')) {
                      const wMax = params.withFraming ? Math.max(0.4, A / 2 - 2 * params.u) : w_max_from_A(A);
                      onUpdateParams({ A, w: wMax, ordinaryPierAxisSpacings: [] });
                    } else {
                      onUpdateParams({ A, ordinaryPierAxisSpacings: [] });
                    }
                  }}
                />

                {axesSolveMode === 'find_p_A' && (
                  <MeterControl
                    id="calc-target-p"
                    label={
                      params.withFraming
                        ? 'Заданный простенок p_c (для A = p_c + w + 2u)'
                        : 'Заданный простенок p (для A = p + w)'
                    }
                    value={targetPierInput}
                    min={0.4}
                    max={3.5}
                    disabled={isParamLocked(lockedParams, 'A')}
                    onOpenGlossaryTerm={onOpenGlossaryTerm}
                    onChange={(pVal) => {
                      setTargetPierInput(pVal);
                      onUpdateParams({
                        A: Number(
                          A_from_pier_wu(pVal, params.w, params.u, params.withFraming).toFixed(3)
                        ),
                      });
                    }}
                  />
                )}

                <MeterControl
                  id="calc-w-axes"
                  label="Ширина окна в свету w (lichte Fensterbreite)"
                  value={params.w}
                  min={0.6}
                  max={2.4}
                  disabled={axesSolveMode === 'find_w'}
                  lockKey="w"
                  locked={isParamLocked(lockedParams, 'w')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={onOpenGlossaryTerm}
                  onChange={(w) => {
                    if (axesSolveMode === 'find_p_A' && !isParamLocked(lockedParams, 'A')) {
                      onUpdateParams({ w, A: A_from_pw(targetPierInput, w) });
                    } else {
                      onUpdateParams({ w });
                    }
                  }}
                />

                {params.withFraming && (
                  <MeterControl
                    id="calc-u"
                    label="Ширина обрамления с одной стороны u (Rahmen)"
                    value={params.u}
                    min={0.05}
                    max={0.45}
                    disabled={isParamLocked(lockedParams, 'T')}
                    lockKey="u"
                    locked={framingRLocked}
                    onToggleLock={onToggleLock}
                    onOpenGlossaryTerm={onOpenGlossaryTerm}
                    note={
                      isParamLocked(lockedParams, 'T')
                        ? 'Высота сандрика T в разделе 4.4 закреплена замком — снимите замок с T, чтобы менять u (= R).'
                        : 'Равна высоте элемента R в разделе 4.4 (одно и то же число и общий замок); норма S. 17: w/6…w/5.'
                    }
                    onChange={(u) => onUpdateParams({ u })}
                  />
                )}
              </div>

              {!isExamBlind && axesSolveMode === 'find_w' && (
                <div className="p-2.5 border border-[#D6CEBE] bg-[#FBF9F5] font-mono text-xs flex justify-between">
                  <span>Предельная ширина w_max = A/2{params.withFraming ? ' − 2u' : ''}:</span>
                  <strong className="text-[#9A3412]">
                    {formatMeters(params.withFraming ? w_max_from_A(params.A) - 2 * params.u : w_max_from_A(params.A))} м
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1 font-mono tabular-nums text-xs">
                <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">
                    {params.withFraming ? 'Чистый простенок p_c' : 'Простенок p'}
                  </span>
                  <strong className="text-sm text-[#1C1917]">
                    {formatMeters('p_c' in summary.pierResult ? summary.pierResult.p_c : summary.pierResult.p)} м
                  </strong>
                </div>
                <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">
                    {params.withFraming ? 'Видимый проём w_v' : isExamBlind ? 'Ширина окна w' : 'Мин. шаг A_min'}
                  </span>
                  <strong className="text-sm text-[#1C1917]">
                    {params.withFraming
                      ? isExamBlind
                        ? `${formatMeters('w_v' in summary.pierResult ? summary.pierResult.w_v : params.w)} м`
                        : `${formatMeters('w_v' in summary.pierResult ? summary.pierResult.w_v : params.w)} м (A_min=${formatMeters(A_min_from_wu(params.w, params.u))})`
                      : isExamBlind
                        ? `${formatMeters(params.w)} м`
                        : `${formatMeters(2 * params.w)} м`}
                  </strong>
                </div>
              </div>
            </CollapsibleSection>

            <CollapsibleSection title="Рядовой и угловой простенки">
              {(() => {
                const currentOrdinaryPier =
                  'p_c' in summary.pierResult ? summary.pierResult.p_c : summary.pierResult.p;
                const currentCornerPier = summary.cornerCheck.p_corner;
                const aLocked = isParamLocked(lockedParams, 'A');
                const wLocked = isParamLocked(lockedParams, 'w');
                const cornerLockKey = params.isRisalitCentered ? 'risalitWidth' : 'k_D';
                const cornerLocked = isParamLocked(lockedParams, cornerLockKey);

                return (
                  <div className="space-y-4">
                    <MeterControl
                      id="calc-ordinary-pier"
                      label={
                        params.withFraming
                          ? 'Величина рядового простенка p_c (между наличниками)'
                          : 'Величина рядового простенка p (между окнами)'
                      }
                      value={currentOrdinaryPier}
                      min={0.3}
                      max={4.0}
                      disabled={aLocked && wLocked}
                      onOpenGlossaryTerm={onOpenGlossaryTerm}
                      note={
                        aLocked
                          ? `Шаг осей A закреплён — изменение рядового простенка пересчитывает ширину окна w (${params.withFraming ? 'w = A − p_c − 2u' : 'w = A − p'}).`
                          : params.withFraming
                            ? `Пересчитывает шаг осей A = p_c + w + 2u (норма p_c ≥ w_v = ${formatMeters(params.w + 2 * params.u)} м, S. 5).`
                            : `Пересчитывает шаг осей A = p + w (норма p ≥ w = ${formatMeters(params.w)} м, S. 5).`
                      }
                      onChange={(pierVal) => {
                        const safePier = Math.max(0.1, pierVal);
                        setTargetPierInput(safePier);
                        if (!aLocked) {
                          const nextA = Number(
                            Math.max(
                              0.8,
                              A_from_pier_wu(safePier, params.w, params.u, params.withFraming)
                            ).toFixed(3)
                          );
                          onUpdateParams({ A: nextA, ordinaryPierAxisSpacings: [] });
                        } else if (!wLocked) {
                          const nextW = Number(
                            Math.max(
                              0.4,
                              params.A - safePier - (params.withFraming ? 2 * params.u : 0)
                            ).toFixed(3)
                          );
                          onUpdateParams({ w: nextW });
                        }
                      }}
                    />

                    <MeterControl
                      id="calc-corner-pier"
                      label="Величина углового простенка p_corner (от угла до крайнего проёма)"
                      value={currentCornerPier}
                      min={0.3}
                      max={4.5}
                      disabled={cornerLocked}
                      onOpenGlossaryTerm={onOpenGlossaryTerm}
                      note={
                        params.isRisalitCentered
                          ? `Ось привязана к центру ризалита: D = ${formatMeters(summary.cornerCheck.D)} м (ширина = ${formatMeters(params.risalitWidth)} м).`
                          : `Пересчитывает отступ до 1-й оси D = ${formatMeters(summary.cornerCheck.D)} м и k_D = ${formatMeters(params.k_D, 3)} (норма k_D ∈ 2/3…5/6, S. 4–5).`
                      }
                      onChange={(cornerVal) => {
                        const safeCorner = Math.max(0.1, cornerVal);
                        const effU = params.withFraming ? params.u : 0;
                        if (params.isRisalitCentered) {
                          const nextRisalit = Number(
                            Math.max(
                              1.0,
                              D_from_cornerPier(safeCorner, params.w, effU, params.withFraming) * 2
                            ).toFixed(3)
                          );
                          onUpdateParams({ risalitWidth: nextRisalit });
                        } else {
                          const nextKD = Number(
                            Math.max(
                              0.15,
                              kD_from_cornerPier(
                                safeCorner,
                                params.A,
                                params.w,
                                effU,
                                params.withFraming
                              )
                            ).toFixed(4)
                          );
                          onUpdateParams({ k_D: nextKD });
                        }
                      }}
                    />

                    <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
                      <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">Рядовой простенок</span>
                        <strong>{formatMeters(currentOrdinaryPier)} м</strong>
                      </div>
                      <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">Угловой p_corner</span>
                        <strong>{formatMeters(currentCornerPier)} м</strong>
                      </div>
                      <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">До 1-й оси D (k_D)</span>
                        <strong>
                          {formatMeters(summary.cornerCheck.D)} м ({formatMeters(params.k_D, 2)})
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CollapsibleSection>

            <CollapsibleSection title="Оси рядовых простенков">
              {(() => {
                const axisStepsM = resolveWindowAxisStepsM(params);
                const axesM = resolveWindowAxesM(summary.cornerCheck.D, axisStepsM);
                const ordinaryPierAxesM = resolveOrdinaryPierAxesM(axesM);
                const pierAxesCount = ordinaryPierAxesM.length;
                const pierWidthsM = resolveOrdinaryPierWidthsM(
                  axisStepsM,
                  params.w,
                  params.u,
                  params.withFraming
                );
                const pierAxisSpacingsM = ordinaryPierAxesM
                  .slice(0, -1)
                  .map((x, idx) => Number((ordinaryPierAxesM[idx + 1] - x).toFixed(3)));
                const hasVariedPierSpacings =
                  pierAxisSpacingsM.length >= 2 &&
                  pierAxisSpacingsM.some((s) => Math.abs(s - pierAxisSpacingsM[0]) > 1e-3);
                const effU = params.withFraming ? Math.max(0, params.u) : 0;
                const minPierStep = Math.max(
                  1.0,
                  Number((params.w + 2 * effU + 0.1).toFixed(2))
                );
                const pierEdgeOffsetM = resolveOrdinaryPierAxisEdgeOffsetM(
                  summary.cornerCheck.D,
                  axisStepsM[0] ?? params.A
                );
                return (
                  <div className="space-y-3.5">
                    <label className="flex items-start gap-2 text-xs text-[#1C1917] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(params.showOrdinaryPierAxes)}
                        onChange={(e) =>
                          onUpdateParams({ showOrdinaryPierAxes: e.target.checked })
                        }
                        className="mt-0.5 accent-[#0F766E]"
                      />
                      <span>
                        Показать оси рядовых простенков (вертикальные линии по центру каждого
                        рядового простенка, видны ниже уровня земли со своей размерной цепочкой)
                      </span>
                    </label>

                    <MeterControl
                      id="calc-ordinary-pier-axes-spacing"
                      label="Единое расстояние между осями рядовых простенков"
                      value={params.A}
                      min={minPierStep}
                      max={6.0}
                      lockKey="A"
                      locked={isParamLocked(lockedParams, 'A')}
                      onToggleLock={onToggleLock}
                      onOpenGlossaryTerm={onOpenGlossaryTerm}
                      note="Задаёт одинаковое расстояние между всеми осями рядовых простенков и пересчитывает ширину простенков."
                      onChange={(nextDist) => {
                        if (axesSolveMode === 'find_A' || axesSolveMode === 'find_p_A') {
                          setAxesSolveMode('check');
                        }
                        if (axesSolveMode === 'find_H' && !isParamLocked(lockedParams, 'H')) {
                          const [n, m] = getActiveAxRatio();
                          onUpdateParams({
                            A: nextDist,
                            H: H_from_A(nextDist, n, m),
                            ordinaryPierAxisSpacings: [],
                          });
                        } else if (
                          axesSolveMode === 'find_w' &&
                          !isParamLocked(lockedParams, 'w')
                        ) {
                          const wMax = params.withFraming
                            ? Math.max(0.4, nextDist / 2 - 2 * params.u)
                            : w_max_from_A(nextDist);
                          onUpdateParams({
                            A: nextDist,
                            w: wMax,
                            ordinaryPierAxisSpacings: [],
                          });
                        } else {
                          onUpdateParams({ A: nextDist, ordinaryPierAxisSpacings: [] });
                        }
                      }}
                    />

                    {pierAxisSpacingsM.length > 0 && (
                      <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium uppercase tracking-wider text-[#57534E]">
                            Индивидуальные расстояния между осями простенков
                          </span>
                          {hasVariedPierSpacings && (
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateParams({ ordinaryPierAxisSpacings: [] })
                              }
                              className="px-2 py-0.5 text-[10px] font-mono border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors"
                            >
                              Выровнять
                            </button>
                          )}
                        </div>
                        <div className="space-y-3">
                          {pierAxisSpacingsM.map((spacingM, idx) => (
                            <MeterControl
                              key={`pier-axis-gap-${idx}`}
                              id={`calc-pier-axis-gap-${idx}`}
                              label={`Расстояние П${idx + 1} — П${idx + 2}`}
                              value={spacingM}
                              min={minPierStep}
                              max={6.0}
                              locked={isParamLocked(lockedParams, 'A')}
                              onOpenGlossaryTerm={onOpenGlossaryTerm}
                              onChange={(val) => {
                                if (
                                  axesSolveMode === 'find_A' ||
                                  axesSolveMode === 'find_p_A'
                                ) {
                                  setAxesSolveMode('check');
                                }
                                const nextSpacings = pierAxisSpacingsM.map((cur, sIdx) =>
                                  sIdx === idx ? val : cur
                                );
                                const nextSteps = resolveWindowAxisStepsM({
                                  ...params,
                                  ordinaryPierAxisSpacings: nextSpacings,
                                });
                                const avgA = Number(
                                  (
                                    nextSteps.reduce((s, step) => s + step, 0) /
                                    Math.max(1, nextSteps.length)
                                  ).toFixed(4)
                                );
                                const isNowUniform = nextSpacings.every(
                                  (s) => Math.abs(s - avgA) < 1e-4
                                );
                                onUpdateParams({
                                  A: avgA,
                                  ordinaryPierAxisSpacings: isNowUniform ? [] : nextSpacings,
                                });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
                      <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">
                          Осей простенков
                        </span>
                        <strong>{pierAxesCount}</strong>
                      </div>
                      <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">
                          От угла до П1
                        </span>
                        <strong>{formatMeters(pierEdgeOffsetM)} м</strong>
                      </div>
                      <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">
                          Ширина фасада W
                        </span>
                        <strong>{formatMeters(summary.derivedGeometry.facadeWidth)} м</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
                      {pierWidthsM.map((pw, idx) => (
                        <div
                          key={`pier-width-readout-${idx}`}
                          className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]"
                        >
                          <span className="block text-[10px] text-[#78716C] uppercase">
                            {params.withFraming
                              ? `Простенок ${idx + 1} (p_c)`
                              : `Простенок ${idx + 1} (p)`}
                          </span>
                          <strong>{formatMeters(pw)} м</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </CollapsibleSection>

            {!isExamBlind && (
              <CollapsibleSection title="Проверки шага осей и простенков" subtle>
                <WhyBlock
                  ruleId="axen_ratio"
                  status={summary.ahCheck.status}
                  sourceStatus={summary.ahCheck.sourceStatus}
                  formula="A = H × (n/m)"
                  page="S. 5–6"
                  explanation={summary.ahCheck.explanation}
                  onOpenBookPage={effectiveOpenBookPage}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
                <WhyBlock
                  ruleId="pier_width"
                  status={summary.pierResult.status}
                  sourceStatus={summary.pierResult.sourceStatus}
                  formula={summary.pierResult.formula}
                  page={summary.pierResult.page}
                  explanation={summary.pierResult.explanation}
                  onOpenBookPage={effectiveOpenBookPage}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
                <WhyBlock
                  ruleId="corner_pier"
                  status={summary.cornerCheck.status}
                  sourceStatus={summary.cornerCheck.sourceStatus}
                  isHeuristic={summary.cornerCheck.sourceStatus === 'heuristic'}
                  formula={summary.cornerCheck.formula}
                  page={summary.cornerCheck.page}
                  explanation={`${summary.cornerCheck.explanation} ${summary.cornerCheck.recommendation}`}
                  onOpenBookPage={effectiveOpenBookPage}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
                {params.withFraming && (
                  <WhyBlock
                    ruleId="n1_framing_width"
                    status={summary.framingWidthCheck.status}
                    sourceStatus={summary.framingWidthCheck.sourceStatus}
                    formula={summary.framingWidthCheck.formula}
                    page={summary.framingWidthCheck.page}
                    explanation={summary.framingWidthCheck.explanation}
                    onOpenBookPage={effectiveOpenBookPage}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                )}
              </CollapsibleSection>
            )}
          </div>
        )}

        {/* 4.1b Варианты этажности */}
        {activeModule === 'variants' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                Варианты этажности и пропорция фасада
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  Автоматический пересчёт норм карнизов, предела A/H_max, ориентации прямоугольника и рекомендаций по осям (S. 5–6, 14–16, 21–23).
                </p>
              )}
            </div>

            {/* Выбор варианта этажности */}
            <CollapsibleSection title="Этажность и подтип здания" subtle>
              <div>
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                  Этажность (BuildingVariant)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'one-story', label: '1-этажный' },
                      { id: 'two-story', label: '2-этажный' },
                      { id: 'multi-story', label: 'Многоэтажный' },
                    ] as { id: BuildingVariant; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        onUpdateParams(applyBuildingVariantPreset(params, item.id, params.multiSub))
                      }
                      className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                        params.buildingVariant === item.id
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {params.buildingVariant === 'multi-story' && (
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                    Подтип многоэтажного дома (MultiSub)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'three', label: isExamBlind ? '3 этажа' : '3 этажа (идеал)' },
                        { id: 'four-five', label: isExamBlind ? '4–5 этажей' : '4–5 этажей (S. 23)' },
                        { id: 'general', label: 'Общий (mehrgeschossig)' },
                      ] as { id: MultiSub; label: string }[]
                    ).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          onUpdateParams(
                            applyBuildingVariantPreset(params, 'multi-story', sub.id)
                          )
                        }
                        className={`px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                          params.multiSub === sub.id
                            ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2 border-t border-[#E5DFD3]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                    <span>Количество этажей (1–10)</span>
                    <LockToggleButton
                      lockKey="floors"
                      locked={isParamLocked(lockedParams, 'floors')}
                      onToggleLock={onToggleLock}
                      label="Количество этажей"
                    />
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#1C1917] tabular-nums">
                    {params.levels.floors.length} эт.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="range"
                    aria-label="Количество этажей от 1 до 10"
                    min={1}
                    max={10}
                    step={1}
                    disabled={isParamLocked(lockedParams, 'floors')}
                    value={params.levels.floors.length}
                    onChange={(e) =>
                      onUpdateParams(applyFloorCountPreset(params, Number(e.target.value)))
                    }
                    className="w-full accent-[#9A3412] disabled:opacity-45"
                  />
                  <input
                    type="number"
                    aria-label="Точное количество этажей"
                    min={1}
                    max={10}
                    step={1}
                    disabled={isParamLocked(lockedParams, 'floors')}
                    value={params.levels.floors.length}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (Number.isFinite(val)) {
                        onUpdateParams(applyFloorCountPreset(params, val));
                      }
                    }}
                    className="w-14 px-2 py-1 text-xs font-mono text-right border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] disabled:bg-[#F3EFE6] disabled:text-[#78716C]"
                  />
                </div>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      disabled={isParamLocked(lockedParams, 'floors')}
                      onClick={() => onUpdateParams(applyFloorCountPreset(params, fl))}
                      className={`px-2 py-1 text-[11px] font-mono border transition-colors disabled:opacity-45 ${
                        params.levels.floors.length === fl
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {fl} эт.
                    </button>
                  ))}
                </div>
              </div>

              {params.buildingVariant === 'multi-story' && params.multiSub === 'three' && (
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                    {isExamBlind ? 'Вариант поясных тяг 3-этажного дома' : 'Вариант поясных тяг 3-этажного дома (S. 22)'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'both_gurt', label: 'Пояса 1–2 и 2–3 эт.' },
                        { id: 'third_sohlbank', label: '3-й эт. с подоконным поясом' },
                        { id: 'unified_upper', label: '2–3 эт. объединены' },
                      ] as { id: ThreeStoryGurtMode; label: string }[]
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() =>
                          onUpdateParams({
                            threeStoryGurtMode: m.id,
                            beltIsAbsent: false,
                            beltFloors: m.id === 'unified_upper' ? [true, false] : [true, true],
                            beltSillFloors: m.id === 'third_sohlbank' ? [false, true] : [false, false],
                            beltIsSillCornice: m.id === 'third_sohlbank',
                          })
                        }
                        className={`px-2.5 py-1 text-[11px] border ${
                          params.threeStoryGurtMode === m.id
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {params.buildingVariant === 'multi-story' && params.multiSub === 'four-five' && (
                <div className="space-y-2.5">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                    {isExamBlind ? '5-этажные схемы членения' : '5-этажные схемы членения (S. 23)'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'standard', label: 'Стандарт (доходный): 1=Цоколь / 2–4=Ствол / 5+K=Венец' },
                        { id: 'rich_1_2_unified', label: 'Богатый особняк: 1+2 объед. / 3–5=Ствол / K' },
                      ] as { id: FiveStoryScheme; label: string }[]
                    ).map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => onUpdateParams({ fiveStoryScheme: sc.id })}
                        className={`px-2.5 py-1 text-[11px] border text-left ${
                          params.fiveStoryScheme === sc.id
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>

                  {params.fiveStoryScheme === 'rich_1_2_unified' && (
                    <MeterControl
                      id="calc-cornice-proj-boost"
                      label="Усиление выноса главного карниза (UX-множитель, S. 23)"
                      value={params.mainCorniceProjectionBoost}
                      min={1.0}
                      max={1.5}
                      step={0.05}
                      unit="×"
                      lockKey="mainCorniceProjectionBoost"
                      locked={isParamLocked(lockedParams, 'mainCorniceProjectionBoost')}
                      onToggleLock={onToggleLock}
                      note="N27: при невысоком карнизе богатого 5-эт. особняка вынос усиливается (≥1.2× — UX-эвристика)."
                      onChange={(mainCorniceProjectionBoost) =>
                        onUpdateParams({ mainCorniceProjectionBoost })
                      }
                    />
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* Поэтажная модель (Levels: отметки от земли до карниза) */}
            <CollapsibleSection
              title="Поэтажная модель высот (Levels, S. 5, 16)"
              badge={`H_зд=${formatMeters(summary.derivedGeometry.totalHeight, 2)} м`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-[#78716C] tabular-nums">
                  H_max={formatMeters(summary.derivedGeometry.H_max, 2)} м · H_зд={formatMeters(summary.derivedGeometry.totalHeight, 2)} м
                </span>
              </div>

              <MeterControl
                id="calc-ground-floor1"
                label="От земли до пола 1-го этажа (groundToFloor1)"
                value={params.levels.groundToFloor1}
                min={0.2}
                max={2.6}
                step={0.05}
                lockKey="levels.groundToFloor1"
                locked={isParamLocked(lockedParams, 'levels.groundToFloor1')}
                onToggleLock={onToggleLock}
                onChange={(val) =>
                  onUpdateParams({
                    levels: { ...params.levels, groundToFloor1: val },
                  })
                }
              />

              <div className="space-y-2 pt-1 border-t border-[#E5DFD3]">
                {(() => {
                  const vgLevels = resolveScaledVerticalGeometry(params, summary.derivedGeometry);
                  const datum0 = vgLevels.floorOffsetsM[0] ?? vgLevels.groundToFloor1;
                  return params.levels.floors.map((fl, idx) => {
                  const derivedClear = fl.floorToFloor - fl.slabThickness;
                  const flElev = (vgLevels.floorOffsetsM[idx] ?? datum0) - datum0;
                  const flDatumText =
                    Math.abs(flElev) < 0.005 ? '0.00' : `+${formatMeters(flElev, 2)}`;
                  const f2fKey = `levels.floor.${idx}.floorToFloor`;
                  const slabKey = `levels.floor.${idx}.slabThickness`;
                  const f2fLocked = isParamLocked(lockedParams, f2fKey) || isParamLocked(lockedParams, 'H');
                  const slabLocked = isParamLocked(lockedParams, slabKey);
                  return (
                    <div
                      key={idx}
                      className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/35 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center text-[11px] font-mono"
                    >
                      <span className="font-medium text-[#1C1917]">
                        Этаж {idx + 1} (отм. {flDatumText}, в свету {formatMeters(derivedClear, 2)} м)
                      </span>
                      <div className="flex items-center justify-between gap-1 text-[#57534E]">
                        <span className="inline-flex items-center gap-1">
                          <span>пол–пол:</span>
                          <LockToggleButton
                            lockKey={f2fKey}
                            locked={f2fLocked}
                            onToggleLock={onToggleLock}
                            label={`Этаж ${idx + 1} пол–пол`}
                          />
                        </span>
                        <input
                          type="number"
                          min={2.2}
                          max={7.5}
                          step={0.05}
                          disabled={f2fLocked}
                          value={Number(fl.floorToFloor.toFixed(2))}
                          onChange={(e) => {
                            const nextF2F = Math.max(2.0, parseFloat(e.target.value) || fl.floorToFloor);
                            const nextFloors = params.levels.floors.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    floorToFloor: nextF2F,
                                    clearHeight: Number((nextF2F - item.slabThickness).toFixed(3)),
                                  }
                                : item
                            );
                            onUpdateParams({
                              levels: { ...params.levels, floors: nextFloors },
                            });
                          }}
                          className="w-16 px-1.5 py-0.5 border border-[#D6CEBE] bg-[#FBF9F5] text-right text-[#1C1917] disabled:bg-[#F3EFE6] disabled:text-[#78716C]"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[#57534E]">
                        <span className="inline-flex items-center gap-1">
                          <span>перекр.:</span>
                          <LockToggleButton
                            lockKey={slabKey}
                            locked={slabLocked}
                            onToggleLock={onToggleLock}
                            label={`Этаж ${idx + 1} перекр.`}
                          />
                        </span>
                        <input
                          type="number"
                          min={0.15}
                          max={0.8}
                          step={0.05}
                          disabled={slabLocked}
                          value={Number(fl.slabThickness.toFixed(2))}
                          onChange={(e) => {
                            const nextSlab = Math.max(0.1, parseFloat(e.target.value) || fl.slabThickness);
                            const nextFloors = params.levels.floors.map((item, i) =>
                              i === idx
                                ? {
                                    ...item,
                                    slabThickness: nextSlab,
                                    clearHeight: Number((item.floorToFloor - nextSlab).toFixed(3)),
                                  }
                                : item
                            );
                            onUpdateParams({
                              levels: { ...params.levels, floors: nextFloors },
                            });
                          }}
                          className="w-16 px-1.5 py-0.5 border border-[#D6CEBE] bg-[#FBF9F5] text-right text-[#1C1917] disabled:bg-[#F3EFE6] disabled:text-[#78716C]"
                        />
                      </div>
                    </div>
                  );
                });
                })()}
              </div>

              <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-[#1C1917]">
                    <input
                      type="checkbox"
                      disabled={isParamLocked(lockedParams, 'levels.manualTotalHeight')}
                      checked={params.levels.manualTotalHeight !== undefined}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        const initH = Number(summary.derivedGeometry.totalHeight.toFixed(2));
                        if (checked) {
                          setManualHeightDraft(String(initH));
                        } else {
                          setManualHeightDraft('');
                        }
                        onUpdateParams({
                          levels: {
                            ...params.levels,
                            manualTotalHeight: checked ? initH : undefined,
                          },
                        });
                      }}
                      className="accent-[#9A3412]"
                    />
                    <span>Задать H_зд вручную</span>
                  </label>
                  <LockToggleButton
                    lockKey="levels.manualTotalHeight"
                    locked={isParamLocked(lockedParams, 'levels.manualTotalHeight')}
                    onToggleLock={onToggleLock}
                    label="H_зд"
                  />
                </div>
                {params.levels.manualTotalHeight !== undefined && (
                  <input
                    type="number"
                    min={3.0}
                    max={40.0}
                    step={0.1}
                    aria-label="Общая высота здания H_зд вручную, м"
                    disabled={isParamLocked(lockedParams, 'levels.manualTotalHeight')}
                    value={manualHeightDraft}
                    onFocus={() => setIsEditingManualHeight(true)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setManualHeightDraft(raw);
                      const normalized = raw.replace(',', '.').trim();
                      if (normalized === '') return;
                      const parsed = parseFloat(normalized);
                      if (Number.isFinite(parsed) && parsed >= 3.0) {
                        onUpdateParams({
                          levels: {
                            ...params.levels,
                            manualTotalHeight: Math.min(40.0, parsed),
                          },
                        });
                      }
                    }}
                    onBlur={() => {
                      setIsEditingManualHeight(false);
                      const normalized = manualHeightDraft.replace(',', '.').trim();
                      const parsed = parseFloat(normalized);
                      if (Number.isFinite(parsed)) {
                        const clamped = Math.min(40.0, Math.max(3.0, parsed));
                        setManualHeightDraft(String(Number(clamped.toFixed(2))));
                        onUpdateParams({
                          levels: { ...params.levels, manualTotalHeight: clamped },
                        });
                      } else if (params.levels.manualTotalHeight !== undefined) {
                        setManualHeightDraft(
                          String(Number(params.levels.manualTotalHeight.toFixed(2)))
                        );
                      }
                    }}
                    className="w-24 px-2 py-1 text-xs font-mono border border-[#D6CEBE] bg-[#FBF9F5] text-right disabled:bg-[#F3EFE6] disabled:text-[#78716C]"
                  />
                )}
              </div>
            </CollapsibleSection>

            {/* Параметры осей, положения входа (N7) и режима карниза */}
            <CollapsibleSection title="Оси фасада, положение входа и режим карниза">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1C1917]">
                  <span>Число оконных осей фасада (S. 14–16)</span>
                  <LockToggleButton
                    lockKey="axesCount"
                    locked={isParamLocked(lockedParams, 'axesCount')}
                    onToggleLock={onToggleLock}
                    label="Число осей"
                  />
                </span>
                <div className="flex flex-wrap gap-1">
                  {[3, 4, 5, 6, 7, 8].map((ax) => (
                    <button
                      key={ax}
                      type="button"
                      disabled={isParamLocked(lockedParams, 'axesCount')}
                      onClick={() => onUpdateParams({ axesCount: ax })}
                      className={`px-2 py-1 text-[11px] font-mono border disabled:opacity-45 ${
                        params.axesCount === ax
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {ax}
                    </button>
                  ))}
                </div>
              </div>

              <MeterControl
                id="calc-axes-count"
                label="Осей на главном фасаде"
                value={params.axesCount}
                min={2}
                max={10}
                step={1}
                unit="ос."
                lockKey="axesCount"
                locked={isParamLocked(lockedParams, 'axesCount')}
                onToggleLock={onToggleLock}
                onChange={(val) => onUpdateParams({ axesCount: Math.max(2, Math.round(val)) })}
              />

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                      Положение главного входа (S. 14–16)
                    </span>
                    <LockToggleButton
                      lockKey="entrancePosition"
                      locked={isParamLocked(lockedParams, 'entrancePosition')}
                      onToggleLock={onToggleLock}
                      label="Положение входа"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectModule('entrance');
                      onHighlightElement(null);
                    }}
                    className="text-[11px] font-mono text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
                  >
                    Размеры и отметки двери →
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'center', label: 'По центру' },
                      { id: 'left', label: 'Слева (сбоку)' },
                      { id: 'right', label: 'Справа (сбоку)' },
                      { id: 'none', label: 'Без входа' },
                    ] as { id: EntrancePosition; label: string }[]
                  ).map((ep) => {
                    const isSelected =
                      ep.id === 'none'
                        ? !params.hasEntrance || params.entrancePosition === 'none'
                        : params.hasEntrance && params.entrancePosition === ep.id;
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        disabled={isParamLocked(lockedParams, 'entrancePosition')}
                        onClick={() => {
                          if (ep.id === 'none') {
                            onUpdateParams({ hasEntrance: false, entrancePosition: 'none' });
                          } else if (ep.id === 'center') {
                            const midIdx = Math.floor(safeAxesCount / 2);
                            onUpdateParams({
                              hasEntrance: true,
                              entrancePlacement: 'facade_center',
                              entranceAxisIndex: midIdx,
                              entrancePosition: 'center',
                            });
                          } else {
                            const axIdx = ep.id === 'left' ? 0 : safeAxesCount - 1;
                            onUpdateParams({
                              hasEntrance: true,
                              entrancePlacement: 'axis',
                              entranceAxisIndex: axIdx,
                              entrancePosition: resolveEntrancePositionFromSettings(
                                true,
                                'axis',
                                axIdx,
                                safeAxesCount
                              ),
                            });
                          }
                        }}
                        className={`px-2.5 py-1 text-[11px] border disabled:opacity-50 ${
                          isSelected
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE]'
                        }`}
                      >
                        {ep.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.isEmbeddedInRow}
                  onChange={(e) => onUpdateParams({ isEmbeddedInRow: e.target.checked })}
                  className="accent-[#9A3412]"
                />
                <span>
                  {isExamBlind
                    ? 'Встроенный в уличный ряд дом'
                    : 'Встроенный в уличный ряд дом (допускает чётные оси при боковом входе, S. 14)'}
                </span>
              </label>

              {!isExamBlind && (params.axesCount % 2 === 0 || params.axesCount >= 9) && (
                <div className="p-2.5 border border-[#E5DFD3] bg-[#F3EFE6]/55 space-y-1 text-[11px] text-[#44403C]">
                  <span className="font-mono uppercase text-[10px] text-[#9A3412]">
                    Схемы группировки (N7, S. 15–16):
                  </span>
                  <p>• {getAxesGroupingHint(params.axesCount)}</p>
                </div>
              )}

              <div className="pt-2 border-t border-[#E5DFD3]">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                  {isExamBlind ? 'Состав главного карниза' : 'Состав и режим оценки главного карниза (S. 16)'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      {
                        label: 'С фризом и архитравом (1 вар.)',
                        mode: 'full_entablature',
                        style: 'frieze_architrave',
                      },
                      {
                        label: 'С шейкой и пояском (2 вар.)',
                        mode: 'full_entablature',
                        style: 'neck_band',
                      },
                      {
                        label: 'Только венчающая часть (Kranz)',
                        mode: 'crowning_only',
                      },
                    ] as {
                      label: string;
                      mode: CorniceVariantMode;
                      style?: CorniceCompositionStyle;
                    }[]
                  ).map((cm) => {
                    const activeStyle = params.corniceFullStyle ?? 'frieze_architrave';
                    const isSelected =
                      cm.mode === 'crowning_only'
                        ? params.corniceVariantMode === 'crowning_only'
                        : params.corniceVariantMode === 'full_entablature' &&
                          activeStyle === cm.style;
                    return (
                      <button
                        key={cm.label}
                        type="button"
                        onClick={() =>
                          onUpdateParams({
                            corniceVariantMode: cm.mode,
                            ...(cm.style ? { corniceFullStyle: cm.style } : {}),
                          })
                        }
                        className={`px-2.5 py-1 text-[11px] border ${
                          isSelected
                            ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {cm.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CollapsibleSection>

            {/* Композиция фасада: ризалиты, крылья, аттик, фронтон (N8–N17, N23–N26) */}
            <CollapsibleSection
              title="Композиция крыльев, ризалитов, аттика и фронтона"
              defaultOpen={params.hasCompositionBreakdown}
              subtle
            >
              <label className="flex items-center gap-2 text-xs font-medium text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.hasCompositionBreakdown}
                  onChange={(e) => onUpdateParams({ hasCompositionBreakdown: e.target.checked })}
                  className="accent-[#9A3412]"
                />
                <span>
                  {isExamBlind
                    ? 'Композиция крыльев и ризалитов'
                    : 'Композиция крыльев и ризалитов (N8–N17, N23–N26, S. 13–14, 18–20)'}
                </span>
              </label>

              {params.hasCompositionBreakdown && (
                <div className="space-y-3 pt-2 border-t border-[#E5DFD3]">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'two_part_wing', label: '2-частн. (ризалит+крыло)' },
                        { id: 'five_part', label: isExamBlind ? '5-частн.' : '5-частн. (рис. 9)' },
                        { id: 'seven_part', label: isExamBlind ? '7-частн. 1.5:3:5:3:1.5' : '7-частн. 1.5:3:5:3:1.5 (рис. 10)' },
                        { id: 'two_side_risalits', label: isExamBlind ? '2 боковых ризалита' : '2 боковых ризалита (рис. 11)' },
                      ] as { id: CompositionKind; label: string }[]
                    ).map((ck) => (
                      <button
                        key={ck.id}
                        type="button"
                        onClick={() => onUpdateParams({ compKind: ck.id })}
                        className={`px-2 py-1 text-[11px] border ${
                          params.compKind === ck.id
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE]'
                        }`}
                      >
                        {ck.label}
                      </button>
                    ))}
                  </div>

                  {params.compKind === 'seven_part' && (
                    <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5] space-y-1.5">
                      <span className="block text-[11px] font-mono text-[#57534E]">
                        {isExamBlind
                          ? 'Схема средней группы 7-частного фасада:'
                          : 'Схема средней группы 7-частного фасада (N12, S. 19):'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            {
                              id: 'two_side_risalits',
                              label: isExamBlind
                                ? '2 боковых ризалита в центре'
                                : '2 боковых ризалита в центре (предпочтительно)',
                            },
                            { id: 'one_middle_risalit', label: '1 средний ризалит (вариант)' },
                          ] as const
                        ).map((sc) => {
                          const active = (params.sevenPartCentralScheme ?? 'two_side_risalits') === sc.id;
                          return (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => onUpdateParams({ sevenPartCentralScheme: sc.id })}
                              className={`px-2 py-1 text-[11px] border ${
                                active
                                  ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                                  : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE]'
                              }`}
                            >
                              {sc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MeterControl
                      id="calc-w-central-ris"
                      label="Ширина центр. ризалита"
                      value={params.wCentralRisalit}
                      min={2.5}
                      max={18.0}
                      step={0.1}
                      lockKey="wCentralRisalit"
                      locked={isParamLocked(lockedParams, 'wCentralRisalit')}
                      onToggleLock={onToggleLock}
                      onChange={(wCentralRisalit) => onUpdateParams({ wCentralRisalit })}
                    />
                    <MeterControl
                      id="calc-w-side-ris"
                      label="Ширина бок. ризалита"
                      value={params.wSideRisalit}
                      min={1.5}
                      max={12.0}
                      step={0.1}
                      lockKey="wSideRisalit"
                      locked={isParamLocked(lockedParams, 'wSideRisalit')}
                      onToggleLock={onToggleLock}
                      onChange={(wSideRisalit) => onUpdateParams({ wSideRisalit })}
                    />
                    <MeterControl
                      id="calc-w-wing"
                      label="Ширина крыла / середины"
                      value={params.wWing}
                      min={1.5}
                      max={14.0}
                      step={0.1}
                      lockKey="wWing"
                      locked={isParamLocked(lockedParams, 'wWing')}
                      onToggleLock={onToggleLock}
                      onChange={(wWing) => onUpdateParams({ wWing })}
                    />
                    <MeterControl
                      id="calc-p-wing"
                      label="Угловой простенок крыла p_wing"
                      value={params.pWing}
                      min={0.4}
                      max={4.0}
                      step={0.05}
                      lockKey="pWing"
                      locked={isParamLocked(lockedParams, 'pWing')}
                      onToggleLock={onToggleLock}
                      onChange={(pWing) => onUpdateParams({ pWing })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center justify-between gap-1.5 p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <span className="truncate">Оси центр. риз.:</span>
                        <LockToggleButton
                          lockKey="centralRisalitAxes"
                          locked={isParamLocked(lockedParams, 'centralRisalitAxes')}
                          onToggleLock={onToggleLock}
                          label="Оси центр. ризалита"
                        />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        disabled={isParamLocked(lockedParams, 'centralRisalitAxes')}
                        value={params.centralRisalitAxes}
                        onChange={(e) =>
                          onUpdateParams({ centralRisalitAxes: Math.max(1, parseInt(e.target.value, 10) || 1) })
                        }
                        className="w-12 px-1 py-0.5 font-mono border border-[#D6CEBE] text-right disabled:bg-[#F3EFE6]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1.5 p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <span className="truncate">Оси крыла:</span>
                        <LockToggleButton
                          lockKey="wingAxes"
                          locked={isParamLocked(lockedParams, 'wingAxes')}
                          onToggleLock={onToggleLock}
                          label="Оси крыла"
                        />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={7}
                        disabled={isParamLocked(lockedParams, 'wingAxes')}
                        value={params.wingAxes}
                        onChange={(e) =>
                          onUpdateParams({ wingAxes: Math.max(1, parseInt(e.target.value, 10) || 1) })
                        }
                        className="w-12 px-1 py-0.5 font-mono border border-[#D6CEBE] text-right disabled:bg-[#F3EFE6]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-1.5 p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                      <span className="inline-flex items-center gap-1 min-w-0">
                        <span className="truncate">Оси середины:</span>
                        <LockToggleButton
                          lockKey="middleAxesBetweenRisalits"
                          locked={isParamLocked(lockedParams, 'middleAxesBetweenRisalits')}
                          onToggleLock={onToggleLock}
                          label="Оси середины"
                        />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={9}
                        disabled={isParamLocked(lockedParams, 'middleAxesBetweenRisalits')}
                        value={params.middleAxesBetweenRisalits}
                        onChange={(e) =>
                          onUpdateParams({
                            middleAxesBetweenRisalits: Math.max(1, parseInt(e.target.value, 10) || 1),
                          })
                        }
                        className="w-12 px-1 py-0.5 font-mono border border-[#D6CEBE] text-right disabled:bg-[#F3EFE6]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between gap-2 p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                      <span className="inline-flex items-center gap-1">
                        <span>Богатство ризалита (1–5):</span>
                        <LockToggleButton
                          lockKey="risalitRichness"
                          locked={isParamLocked(lockedParams, 'risalitRichness')}
                          onToggleLock={onToggleLock}
                          label="Богатство ризалита"
                        />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        disabled={isParamLocked(lockedParams, 'risalitRichness')}
                        value={params.risalitRichness}
                        onChange={(e) =>
                          onUpdateParams({ risalitRichness: Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)) })
                        }
                        className="w-12 px-1 py-0.5 font-mono border border-[#D6CEBE] text-right disabled:bg-[#F3EFE6]"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                      <span className="inline-flex items-center gap-1">
                        <span>Богатство крыла (1–5):</span>
                        <LockToggleButton
                          lockKey="wingRichness"
                          locked={isParamLocked(lockedParams, 'wingRichness')}
                          onToggleLock={onToggleLock}
                          label="Богатство крыла"
                        />
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        disabled={isParamLocked(lockedParams, 'wingRichness')}
                        value={params.wingRichness}
                        onChange={(e) =>
                          onUpdateParams({ wingRichness: Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)) })
                        }
                        className="w-12 px-1 py-0.5 font-mono border border-[#D6CEBE] text-right disabled:bg-[#F3EFE6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#1C1917]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={params.hasPilasterBetweenPairedWindows}
                        onChange={(e) =>
                          onUpdateParams({ hasPilasterBetweenPairedWindows: e.target.checked })
                        }
                        className="accent-[#9A3412]"
                      />
                      <span>Пилястр между парой сближенных окон в ризалите (N16)</span>
                    </label>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={params.atticOverRisalit}
                          onChange={(e) => onUpdateParams({ atticOverRisalit: e.target.checked })}
                          className="accent-[#9A3412]"
                        />
                        <span>Аттик над ризалитом</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={params.atticOverWing}
                          onChange={(e) => onUpdateParams({ atticOverWing: e.target.checked })}
                          className="accent-[#9A3412]"
                        />
                        <span>Аттик над крылом</span>
                      </label>
                      {params.atticOverRisalit && params.atticOverWing && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={params.atticRisalitHeavier}
                            onChange={(e) => onUpdateParams({ atticRisalitHeavier: e.target.checked })}
                            className="accent-[#9A3412]"
                          />
                          <span>Аттик над ризалитом массивнее / выше, чем над крыльями (N23, S. 19)</span>
                        </label>
                      )}
                    </div>
                  </div>

                  {expertMode && (
                    <div className="pt-2 border-t border-[#E5DFD3] space-y-2">
                      <span className="block font-mono text-[10px] uppercase tracking-wider text-[#9A3412]">
                        Эксперт P3 · Фронтон ризалита (N24, N26)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { id: 'none', label: 'Без фронтона' },
                            { id: 'gentle', label: 'Пологий (классика)' },
                            { id: 'steep', label: 'Крутой (готика/север)' },
                          ] as { id: PedimentType; label: string }[]
                        ).map((pd) => (
                          <button
                            key={pd.id}
                            type="button"
                            onClick={() => onUpdateParams({ pedimentType: pd.id })}
                            className={`px-2 py-1 text-[11px] border ${
                              params.pedimentType === pd.id
                                ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                                : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE]'
                            }`}
                          >
                            {pd.label}
                          </button>
                        ))}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={params.pedimentClassical}
                          onChange={(e) => onUpdateParams({ pedimentClassical: e.target.checked })}
                          className="accent-[#9A3412]"
                        />
                        <span>Стилистическое предпочтение классики (N24: редакционное UX-допущение, не из S. 1–23)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </CollapsibleSection>

            {/* Паспорт норм выбранного варианта и блок пробелов источника */}
            {!isExamBlind && (
              <>
                <CollapsibleSection title="Паспорт норм и проверки варианта" subtle>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-xs">
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Прямоугольник</span>
                      <strong>
                        {summary.variantInfo.rules.facadeRect === 'lying'
                          ? 'Лежачий (W > H)'
                          : summary.variantInfo.rules.facadeRect === 'standing'
                            ? 'Стоячий (H > W)'
                            : 'Любой (≉ квадрату)'}
                      </strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Членение</span>
                      <strong>
                        {summary.variantInfo.rules.articulation === 'horizontal'
                          ? 'Горизонтальное'
                          : summary.variantInfo.rules.articulation === 'vertical'
                            ? 'Вертикальное'
                            : 'Смешанное'}
                      </strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Предел A/H_max</span>
                      <strong>
                        {formatMeters(summary.variantAxisCheck.range[0], 2)}…
                        {formatMeters(summary.variantAxisCheck.range[1], 3)}
                      </strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Колонны / пилястры</span>
                      <strong>
                        {summary.variantInfo.rules.columnsOptional ? 'Необязательны' : 'Обычно нужны'}
                      </strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Главный ярус</span>
                      <strong>
                        {summary.variantInfo.rules.mainTierFloor
                          ? `${summary.variantInfo.rules.mainTierFloor}-й этаж`
                          : '1-й (основной)'}
                      </strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Верхний этаж</span>
                      <strong>
                        {summary.variantInfo.rules.upperFloorSmallest ? 'Наименьший' : 'Стандартный'}
                      </strong>
                    </div>
                  </div>

                  <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-1.5 text-xs text-[#44403C]">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-[#1C1917]">{summary.variantInfo.labelRu}</strong>
                      <span className="font-mono text-[11px] text-[#78716C]">
                        {summary.variantInfo.pages}
                      </span>
                    </div>
                    {summary.variantInfo.notesRu.map((n, i) => (
                      <p key={i} className="leading-relaxed">
                        • <TextWithGlossaryLinks text={n} onOpenGlossaryTerm={effectiveOpenGlossaryTerm} />
                      </p>
                    ))}
                  </div>

                  <WhyBlock
                    ruleId="variant_axis_ratio"
                    status={summary.variantAxisCheck.status}
                    sourceStatus={summary.variantAxisCheck.sourceStatus}
                    formula={summary.variantAxisCheck.formula}
                    page={summary.variantAxisCheck.page}
                    isHeuristic={
                      summary.variantAxisCheck.isWideBayHeuristic ||
                      summary.variantAxisCheck.sourceStatus === 'heuristic'
                    }
                    explanation={summary.variantAxisCheck.explanation}
                    onOpenBookPage={effectiveOpenBookPage}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />

                  <WhyBlock
                    ruleId="facade_rectangle"
                    status={summary.facadeRectCheck.status}
                    sourceStatus={summary.facadeRectCheck.sourceStatus}
                    formula={summary.facadeRectCheck.formula}
                    page={summary.facadeRectCheck.page}
                    explanation={summary.facadeRectCheck.explanation}
                    onOpenBookPage={effectiveOpenBookPage}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />

                  <WhyBlock
                    ruleId="axes_count"
                    status={summary.axesCountCheck.status}
                    sourceStatus="explicit-verified"
                    formula={summary.axesCountCheck.formula}
                    page={summary.axesCountCheck.page}
                    explanation={summary.axesCountCheck.explanation}
                    onOpenBookPage={effectiveOpenBookPage}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />

                  {params.levels.floors.length === 5 && (
                    <WhyBlock
                      ruleId="n27_five_story_scheme"
                      status={summary.fiveStorySchemeCheck.status}
                      sourceStatus={summary.fiveStorySchemeCheck.sourceStatus}
                      formula={summary.fiveStorySchemeCheck.formula}
                      page={summary.fiveStorySchemeCheck.page}
                      explanation={summary.fiveStorySchemeCheck.explanation}
                      onOpenBookPage={effectiveOpenBookPage}
                      onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                    />
                  )}

                  <WhyBlock
                    ruleId="main_cornice_subordination"
                    status={summary.mainCorniceCheck.status}
                    sourceStatus={summary.mainCorniceCheck.isExtrapolated ? 'gap' : 'explicit-verified'}
                    formula={summary.mainCorniceCheck.formula}
                    page={summary.mainCorniceCheck.page}
                    isHeuristic={summary.mainCorniceCheck.isExtrapolated}
                    explanation={summary.mainCorniceCheck.explanation}
                    onOpenBookPage={effectiveOpenBookPage}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />

                  <WhyBlock
                    ruleId="gurt_cornice"
                    status={summary.gurtCheck.status}
                    sourceStatus={
                      !summary.gurtCheck.notRequired && !params.useFloorToFloorForBelt
                        ? 'heuristic'
                        : 'explicit-verified'
                    }
                    isHeuristic={!summary.gurtCheck.notRequired && !params.useFloorToFloorForBelt}
                    formula={summary.gurtCheck.formula}
                    page={summary.gurtCheck.page}
                    explanation={summary.gurtCheck.explanation}
                    onOpenBookPage={effectiveOpenBookPage}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </CollapsibleSection>

                {/* Явное сообщение: чего в тексте нет */}
                <CollapsibleSection
                  title="Чего в тексте Brausewetter (1895) нет"
                  badge={`${VARIANT_TEXT_GAPS.length} пробела`}
                  defaultOpen={false}
                  subtle
                >
                  <div className="divide-y divide-[#E5DFD3]">
                    {VARIANT_TEXT_GAPS.map((gap) => {
                      const relevant = gap.appliesTo.includes(params.buildingVariant);
                      return (
                        <div
                          key={gap.id}
                          className={`py-2.5 space-y-1 text-xs ${
                            relevant ? 'opacity-100' : 'opacity-60'
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="font-medium text-[#1C1917]">{gap.title}</span>
                            <span
                              className={`font-mono text-[10px] px-1.5 py-0.5 border ${
                                relevant
                                  ? 'border-[#9A3412]/40 bg-[#9A3412]/10 text-[#9A3412]'
                                  : 'border-[#D6CEBE] bg-[#FBF9F5] text-[#78716C]'
                              }`}
                            >
                              {gap.status}
                            </span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-[#57534E]">{gap.detail}</p>
                        </div>
                      );
                    })}
                  </div>
                  <p className="font-mono text-[10px] text-[#78716C]">
                    Доля пересчитанных проверок в текущей сводке: OK {formatPercent(summary.okCount / Math.max(1, summary.checks.length), 0)}.
                  </p>
                </CollapsibleSection>
              </>
            )}
          </div>
        )}

        {/* 4.2b Вход (дверной проём) */}
        {activeModule === 'entrance' && (() => {
          const presenceLocked =
            isParamLocked(lockedParams, 'hasEntrance') ||
            isParamLocked(lockedParams, 'entrancePosition');
          const placementLocked = isParamLocked(lockedParams, 'entrancePosition');
          const floor1Level = params.levels.floors[0];
          const floor1ClearH =
            floor1Level?.clearHeight ?? Math.max(2.2, params.H - (floor1Level?.slabThickness ?? 0.35));
          const floor1WinH = Math.min(params.h, floor1ClearH * 0.72);
          const floor1SillM = Math.max(0.22, (floor1ClearH - floor1WinH) * 0.36);
          const floor1TopM = summary.derivedGeometry.floor1FullHeight;
          const floor1WinTopM = Number(
            (params.levels.groundToFloor1 + floor1SillM + floor1WinH).toFixed(3)
          );
          const socleTopPresetM = Number(
            (params.useFullFloorAsSocle ? floor1TopM : params.hSocle).toFixed(3)
          );
          const exceedsFloor1 = entranceGeo.hasDoor && entranceGeo.doorTopM > floor1TopM + 0.02;

          return (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                  Вход и дверной проём
                </h3>
                <p className="mt-1 text-xs text-[#57534E]">
                  Наличие входа на главном фасаде, отметки низа и верха, габариты проёма и привязка к середине фасада или оконной оси.
                </p>
              </div>

              {/* 1. Наличие входа на фасаде */}
              <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                    1. Наличие входа на фасаде
                  </span>
                  <LockToggleButton
                    lockKey="hasEntrance"
                    locked={isParamLocked(lockedParams, 'hasEntrance')}
                    onToggleLock={onToggleLock}
                    label="Наличие входа"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={presenceLocked}
                    onClick={() => {
                      const nextPlacement: EntrancePlacement = params.entrancePlacement ?? 'facade_center';
                      const nextAxisIdx = Math.min(
                        safeAxesCount - 1,
                        Math.max(0, Math.round(params.entranceAxisIndex ?? Math.floor(safeAxesCount / 2)))
                      );
                      onUpdateParams({
                        hasEntrance: true,
                        entrancePosition: resolveEntrancePositionFromSettings(
                          true,
                          nextPlacement,
                          nextAxisIdx,
                          safeAxesCount
                        ),
                      });
                    }}
                    className={`px-3 py-2 text-xs font-medium border disabled:opacity-50 transition-colors ${
                      params.hasEntrance
                        ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                        : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                    }`}
                  >
                    Есть на фасаде
                  </button>
                  <button
                    type="button"
                    disabled={presenceLocked}
                    onClick={() =>
                      onUpdateParams({
                        hasEntrance: false,
                        entrancePosition: 'none',
                      })
                    }
                    className={`px-3 py-2 text-xs font-medium border disabled:opacity-50 transition-colors ${
                      !params.hasEntrance
                        ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                        : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                    }`}
                  >
                    Нет (без входа)
                  </button>
                </div>
              </div>

              {!params.hasEntrance ? (
                <div className="p-3.5 border border-[#D6CEBE] bg-[#F3EFE6]/60 text-xs text-[#57534E] leading-relaxed">
                  Вход на данном фасаде отключён — первый этаж отображается со сплошным рядом окон без дверного проёма. Включите «Есть на фасаде», чтобы задать отметки и габариты двери.
                </div>
              ) : (
                <>
                  {/* 2. Размещение на фасаде */}
                  <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                        2. Размещение на фасаде
                      </span>
                      <LockToggleButton
                        lockKey="entrancePosition"
                        locked={placementLocked}
                        onToggleLock={onToggleLock}
                        label="Размещение входа"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={placementLocked}
                        onClick={() =>
                          onUpdateParams({
                            entrancePlacement: 'facade_center',
                            entrancePosition: resolveEntrancePositionFromSettings(
                              true,
                              'facade_center',
                              params.entranceAxisIndex,
                              safeAxesCount
                            ),
                          })
                        }
                        className={`px-3 py-2 text-xs font-medium border disabled:opacity-50 transition-colors ${
                          params.entrancePlacement === 'facade_center'
                            ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                            : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        По середине фасада
                      </button>
                      <button
                        type="button"
                        disabled={placementLocked}
                        onClick={() => {
                          const clampedIdx = Math.min(
                            safeAxesCount - 1,
                            Math.max(0, Math.round(params.entranceAxisIndex ?? 0))
                          );
                          onUpdateParams({
                            entrancePlacement: 'axis',
                            entranceAxisIndex: clampedIdx,
                            entrancePosition: resolveEntrancePositionFromSettings(
                              true,
                              'axis',
                              clampedIdx,
                              safeAxesCount
                            ),
                          });
                        }}
                        className={`px-3 py-2 text-xs font-medium border disabled:opacity-50 transition-colors ${
                          params.entrancePlacement === 'axis'
                            ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                            : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        По оси окон
                      </button>
                    </div>

                    {params.entrancePlacement === 'facade_center' ? (
                      <p className="text-[11px] text-[#57534E] leading-relaxed">
                        {safeAxesCount % 2 === 1 ? (
                          <>
                            При нечётном числе осей ({safeAxesCount}) середина фасада совпадает со средней осью{' '}
                            <strong className="font-mono text-[#1C1917]">
                              №{Math.floor(safeAxesCount / 2) + 1}
                            </strong>{' '}
                            (X = {formatMeters(entranceGeo.doorCenterX, 2)} м) — дверь заменяет центральное окно 1-го этажа.
                          </>
                        ) : (
                          <>
                            При чётном числе осей ({safeAxesCount}) дверь стоит строго по геометрическому центру фасада (
                            <strong className="font-mono text-[#1C1917]">
                              X = {formatMeters(entranceGeo.doorCenterX, 2)} м
                            </strong>
                            , в простенке между осями {safeAxesCount / 2} и {safeAxesCount / 2 + 1}); все окна 1-го этажа сохраняются.
                          </>
                        )}
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <span className="block text-[11px] text-[#57534E]">
                          Выберите оконную ось для двери (заменяет окно 1-го этажа на выбранной оси):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {Array.from({ length: safeAxesCount }, (_, axIdx) => {
                            const isMiddleOdd =
                              safeAxesCount % 2 === 1 && axIdx === Math.floor(safeAxesCount / 2);
                            const isSelected = entranceGeo.doorAxisIndex === axIdx;
                            return (
                              <button
                                key={`ent-ax-${axIdx}`}
                                type="button"
                                disabled={placementLocked}
                                onClick={() =>
                                  onUpdateParams({
                                    entrancePlacement: 'axis',
                                    entranceAxisIndex: axIdx,
                                    entrancePosition: resolveEntrancePositionFromSettings(
                                      true,
                                      'axis',
                                      axIdx,
                                      safeAxesCount
                                    ),
                                  })
                                }
                                className={`px-2.5 py-1 text-[11px] font-mono border disabled:opacity-50 ${
                                  isSelected
                                    ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                                    : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                                }`}
                              >
                                Ось {axIdx + 1}
                                {isMiddleOdd ? ' (центр)' : ''}
                              </button>
                            );
                          })}
                        </div>
                        <p className="font-mono text-[11px] text-[#78716C]">
                          Координата центра двери: X = {formatMeters(entranceGeo.doorCenterX, 3)} м
                        </p>
                      </div>
                    )}

                    {!isExamBlind && safeAxesCount % 2 === 0 && (
                      <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/55 text-[11px] text-[#57534E]">
                        <span className="font-mono text-[#9A3412]">S. 14–16:</span>{' '}
                        {summary.axesCountCheck.explanation}
                      </div>
                    )}
                  </div>

                  {/* 3. Отметки и размеры дверного проёма */}
                  <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                      3. Отметки и размеры дверного проёма
                    </span>

                    <MeterControl
                      id="entrance-bottom"
                      label="Отметка низа (от земли)"
                      value={entranceGeo.doorBottomM}
                      min={0}
                      max={2.5}
                      step={0.05}
                      lockKey="entranceBottomM"
                      locked={isParamLocked(lockedParams, 'entranceBottomM')}
                      onToggleLock={onToggleLock}
                      note="0.00 м — вход с уровня земли; > 0.05 м — приподнятый вход со ступенями крыльца."
                      onChange={(val) =>
                        onUpdateParams({
                          entranceBottomM: Math.max(0, Number(val.toFixed(3))),
                        })
                      }
                    />

                    <MeterControl
                      id="entrance-top"
                      label="Отметка верха дверного проёма"
                      value={entranceGeo.doorTopM}
                      min={1.4}
                      max={Math.max(5.5, Number((floor1TopM + 1).toFixed(2)))}
                      step={0.05}
                      disabled={
                        isParamLocked(lockedParams, 'entranceBottomM') &&
                        isParamLocked(lockedParams, 'entranceHeightM')
                      }
                      lockKey="entranceTopM"
                      locked={isParamLocked(lockedParams, 'entranceTopM')}
                      onToggleLock={onToggleLock}
                      note="Отметка верха = отметка низа + высота двери. При смене корректирует высоту (или низ, если высота под замком)."
                      onChange={(val) => {
                        const targetTop = Math.max(1.2, Number(val.toFixed(3)));
                        const heightLocked = isParamLocked(lockedParams, 'entranceHeightM');
                        const bottomLocked = isParamLocked(lockedParams, 'entranceBottomM');
                        if (heightLocked && !bottomLocked) {
                          const nextBottom = Math.max(
                            0,
                            Number((targetTop - entranceGeo.doorHeightM).toFixed(3))
                          );
                          onUpdateParams({ entranceBottomM: nextBottom });
                        } else if (!heightLocked) {
                          const nextHeight = Math.max(
                            1.2,
                            Number((targetTop - entranceGeo.doorBottomM).toFixed(3))
                          );
                          onUpdateParams({ entranceHeightM: nextHeight });
                        }
                      }}
                    />

                    <MeterControl
                      id="entrance-height"
                      label="Высота дверного проёма"
                      value={entranceGeo.doorHeightM}
                      min={1.2}
                      max={4.5}
                      step={0.05}
                      disabled={
                        isParamLocked(lockedParams, 'entranceTopM') &&
                        isParamLocked(lockedParams, 'entranceBottomM')
                      }
                      lockKey="entranceHeightM"
                      locked={isParamLocked(lockedParams, 'entranceHeightM')}
                      onToggleLock={onToggleLock}
                      note="Чистая высота проёма от отметки низа до перемычки."
                      onChange={(val) =>
                        onUpdateParams({
                          entranceHeightM: Math.max(1.2, Number(val.toFixed(3))),
                        })
                      }
                    />

                    <MeterControl
                      id="entrance-width"
                      label="Ширина дверного проёма"
                      value={entranceGeo.doorWidthM}
                      min={0.6}
                      max={3.5}
                      step={0.05}
                      lockKey="entranceWidthM"
                      locked={isParamLocked(lockedParams, 'entranceWidthM')}
                      onToggleLock={onToggleLock}
                      note={`Для сравнения: ширина окна w = ${formatMeters(params.w, 2)} м.`}
                      onChange={(val) =>
                        onUpdateParams({
                          entranceWidthM: Math.max(0.6, Number(val.toFixed(3))),
                        })
                      }
                    />

                    {/* Быстрые пресеты отметок */}
                    <div className="pt-2 border-t border-[#E5DFD3] space-y-1.5">
                      <span className="block text-[10px] font-mono uppercase tracking-wider text-[#78716C]">
                        Быстрые привязки отметок
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateParams({ entranceBottomM: 0 })}
                          className="px-2 py-1 text-[11px] font-mono border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5]"
                        >
                          От земли (низ = 0.00 м)
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateParams({ entranceBottomM: socleTopPresetM })}
                          className="px-2 py-1 text-[11px] font-mono border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5]"
                        >
                          По верху цоколя ({formatMeters(socleTopPresetM, 2)} м)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const heightLocked = isParamLocked(lockedParams, 'entranceHeightM');
                            if (heightLocked) {
                              onUpdateParams({
                                entranceBottomM: Math.max(
                                  0,
                                  Number((floor1WinTopM - entranceGeo.doorHeightM).toFixed(3))
                                ),
                              });
                            } else {
                              onUpdateParams({
                                entranceHeightM: Math.max(
                                  1.2,
                                  Number((floor1WinTopM - entranceGeo.doorBottomM).toFixed(3))
                                ),
                              });
                            }
                          }}
                          className="px-2 py-1 text-[11px] font-mono border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5]"
                        >
                          Верх по окнам 1 эт. ({formatMeters(floor1WinTopM, 2)} м)
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Сводная карточка проёма */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs tabular-nums">
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Низ (от земли)</span>
                      <strong>{formatMeters(entranceGeo.doorBottomM, 2)} м</strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Верх проёма</span>
                      <strong>{formatMeters(entranceGeo.doorTopM, 2)} м</strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Высота</span>
                      <strong>{formatMeters(entranceGeo.doorHeightM, 2)} м</strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C] uppercase">Ширина</span>
                      <strong>{formatMeters(entranceGeo.doorWidthM, 2)} м</strong>
                    </div>
                  </div>

                  {!isExamBlind && exceedsFloor1 && (
                    <div className="p-2.5 border border-[#B45309]/50 bg-[#B45309]/10 text-xs text-[#92400E]">
                      Внимание: отметка верха двери ({formatMeters(entranceGeo.doorTopM, 2)} м) превышает полную отметку перекрытия 1-го этажа ({formatMeters(floor1TopM, 2)} м).
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}

        {/* 4.2 Окно */}
        {activeModule === 'window' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                <TextWithGlossaryLinks
                  text="4.2. Пропорции окна (Fensterproportionen)"
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  Пределы 1.5w ≤ h ≤ 2w, золотое сечение φ и правило половины диагонали (S. 6–7).
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'find_h', label: 'Найти h (по w)' },
                  { id: 'find_w', label: 'Найти w (по h)' },
                  { id: 'check', label: 'Проверить w и h' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setWinSolveMode(mode.id)}
                  className={`px-2.5 py-1 text-[11px] font-medium border transition-colors ${
                    winSolveMode === mode.id
                      ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                      : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {winSolveMode !== 'check' && (
              <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-2.5">
                <label className="block text-xs font-medium text-[#1C1917]">
                  Желаемое отношение w : h
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['3:5', '5:8', '5:9', '4:7', '8:13', 'phi', 'custom'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setWinRatioChoice(opt);
                        const wLocked = isParamLocked(lockedParams, 'w');
                        const hLocked = isParamLocked(lockedParams, 'h');
                        const effectiveMode =
                          winSolveMode === 'find_h' && hLocked && !wLocked
                            ? 'find_w'
                            : winSolveMode === 'find_w' && wLocked && !hLocked
                              ? 'find_h'
                              : winSolveMode;
                        let nextH = params.h;
                        let nextW = params.w;
                        if (opt === 'phi') {
                          if (effectiveMode === 'find_h') nextH = params.w * PHI;
                          else nextW = params.h / PHI;
                        } else if (opt === 'custom') {
                          if (effectiveMode === 'find_h') nextH = h_from_w_ratio(params.w, customWinN, customWinM);
                          else nextW = w_from_h_ratio(params.h, customWinN, customWinM);
                        } else {
                          const found = RULES_DATA.goldenApproximations.find((g) => g.label === opt);
                          if (found) {
                            if (effectiveMode === 'find_h') nextH = h_from_w_ratio(params.w, found.n, found.m);
                            else nextW = w_from_h_ratio(params.h, found.n, found.m);
                          }
                        }
                        onUpdateParams({ w: nextW, h: nextH });
                      }}
                      className={`px-2 py-1 text-[11px] font-mono border transition-colors ${
                        winRatioChoice === opt
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {opt === 'phi' ? 'φ (1:1.618)' : opt === 'custom' ? 'n:m' : opt}
                    </button>
                  ))}
                </div>

                {winRatioChoice === 'custom' && (
                  <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                    <span>w : h =</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customWinN}
                      aria-label="Числитель отношения окна"
                      onChange={(e) => {
                        const n = Math.max(1, parseFloat(e.target.value) || 1);
                        setCustomWinN(n);
                        if (winSolveMode === 'find_h') {
                          onUpdateParams({ h: h_from_w_ratio(params.w, n, customWinM) });
                        } else {
                          onUpdateParams({ w: w_from_h_ratio(params.h, n, customWinM) });
                        }
                      }}
                      className="w-16 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5]"
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={customWinM}
                      aria-label="Знаменатель отношения окна"
                      onChange={(e) => {
                        const m = Math.max(1, parseFloat(e.target.value) || 1);
                        setCustomWinM(m);
                        if (winSolveMode === 'find_h') {
                          onUpdateParams({ h: h_from_w_ratio(params.w, customWinN, m) });
                        } else {
                          onUpdateParams({ w: w_from_h_ratio(params.h, customWinN, m) });
                        }
                      }}
                      className="w-16 px-2 py-1 border border-[#D6CEBE] bg-[#FBF9F5]"
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <MeterControl
                id="calc-win-w"
                label="Ширина окна в свету w"
                value={params.w}
                min={0.5}
                max={2.4}
                disabled={winSolveMode === 'find_w'}
                lockKey="w"
                locked={isParamLocked(lockedParams, 'w')}
                onToggleLock={onToggleLock}
                onChange={(w) => {
                  if (winSolveMode === 'find_h' && !isParamLocked(lockedParams, 'h')) {
                    const r = getActiveWinRatio();
                    const h = r.type === 'phi' ? w * PHI : h_from_w_ratio(w, r.n, r.m);
                    onUpdateParams({ w, h });
                  } else {
                    onUpdateParams({ w });
                  }
                }}
              />

              <MeterControl
                id="calc-win-h"
                label="Высота окна h"
                value={params.h}
                min={0.8}
                max={4.0}
                disabled={winSolveMode === 'find_h'}
                lockKey="h"
                locked={isParamLocked(lockedParams, 'h')}
                onToggleLock={onToggleLock}
                onChange={(h) => {
                  if (winSolveMode === 'find_w' && !isParamLocked(lockedParams, 'w')) {
                    const r = getActiveWinRatio();
                    const w = r.type === 'phi' ? h / PHI : w_from_h_ratio(h, r.n, r.m);
                    onUpdateParams({ w, h });
                  } else {
                    onUpdateParams({ h });
                  }
                }}
              />

              <MeterControl
                id="calc-win-tol"
                label={isExamBlind ? 'Допуск диагонали' : 'Допуск правила половины диагонали (по умолчанию 7%)'}
                value={params.diagTolerance * 100}
                min={1}
                max={12}
                step={0.5}
                unit="%"
                lockKey="diagTolerance"
                locked={isParamLocked(lockedParams, 'diagTolerance')}
                onToggleLock={onToggleLock}
                onChange={(pct) => onUpdateParams({ diagTolerance: pct / 100 })}
              />

              {params.withFraming && (
                <MeterControl
                  id="calc-win-sill"
                  label="Высота подоконной плиты h_sill (N2, норма w/8…w/7, до w/5 approx)"
                  value={params.hSill}
                  min={0.08}
                  max={0.35}
                  lockKey="hSill"
                  locked={isParamLocked(lockedParams, 'hSill')}
                  onToggleLock={onToggleLock}
                  onChange={(hSill) => onUpdateParams({ hSill })}
                />
              )}

              <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.hasWallRustication}
                  onChange={(e) => onUpdateParams({ hasWallRustication: e.target.checked })}
                  className="accent-[#9A3412]"
                />
                <span>
                  {isExamBlind
                    ? 'Стена с рустовкой'
                    : 'Стена с рустовкой (N4, S. 17: окно = 7–8 рядов руста)'}
                </span>
              </label>
            </div>

            <CollapsibleSection
              title="Высота окон относительно уровня пола по этажам"
              badge={`${params.levels.floors.length} эт.`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#57534E]">
                <span>
                  Отметка низа окна (подоконника) от уровня пола каждого этажа. Отметка 0.00 — пол 1-го этажа.
                </span>
                {params.windowSillHeights?.some((v) => v !== undefined) && (
                  <button
                    type="button"
                    onClick={() => onUpdateParams({ windowSillHeights: undefined })}
                    className="font-mono text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12] shrink-0"
                  >
                    Сбросить все (авто)
                  </button>
                )}
              </div>

              <div className="space-y-2.5">
                {(() => {
                  const vgWin = resolveScaledVerticalGeometry(params, summary.derivedGeometry);
                  const datum0 = vgWin.floorOffsetsM[0] ?? vgWin.groundToFloor1;
                  const totalFl = params.levels.floors.length;
                  return params.levels.floors.map((fl, flIdx) => {
                    const flH = vgWin.floorHeightsM[flIdx] ?? fl.floorToFloor;
                    const clearH =
                      fl.clearHeight ?? Math.max(2.0, fl.floorToFloor - fl.slabThickness);
                    const scaledClearH = clearH * vgWin.verticalScale;
                    const isTopSmallest =
                      totalFl >= 3 &&
                      flIdx === totalFl - 1 &&
                      summary.variantInfo.rules.upperFloorSmallest;
                    const winHThisFloor = isTopSmallest
                      ? Math.min(params.h * 0.78, scaledClearH * 0.64)
                      : Math.min(params.h, scaledClearH * 0.72);
                    const maxSillM = Math.max(0.1, clearH - winHThisFloor / Math.max(0.2, vgWin.verticalScale));
                    const effectiveSillScaled = resolveWindowSillHeightM(
                      params,
                      flIdx,
                      scaledClearH,
                      winHThisFloor,
                      vgWin.verticalScale
                    );
                    const customVal = params.windowSillHeights?.[flIdx];
                    const displaySillM =
                      customVal !== undefined && Number.isFinite(customVal)
                        ? customVal
                        : effectiveSillScaled / Math.max(0.2, vgWin.verticalScale);
                    const flDatumM = (vgWin.floorOffsetsM[flIdx] ?? datum0) - datum0;
                    const flDatumLabel =
                      Math.abs(flDatumM) < 0.005 ? '0.00' : `+${formatMeters(flDatumM, 2)}`;
                    const sillLockKey = `windowSillHeights.${flIdx}`;
                    const sillLocked = isParamLocked(lockedParams, sillLockKey);
                    const winTopRelFloorM = effectiveSillScaled + winHThisFloor;

                    return (
                      <div
                        key={`win-sill-${flIdx}`}
                        className={`p-2.5 border text-xs space-y-1.5 ${
                          sillLocked
                            ? 'border-[#9A3412]/40 bg-[#9A3412]/[0.04]'
                            : 'border-[#E5DFD3] bg-[#F3EFE6]/35'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-[#1C1917]">
                              {flIdx + 1}-й этаж
                            </span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[#D6CEBE] bg-[#FBF9F5] text-[#57534E]">
                              пол {flDatumLabel} м
                            </span>
                            <LockToggleButton
                              lockKey={sillLockKey}
                              locked={sillLocked}
                              onToggleLock={onToggleLock}
                              label={`Высота окна от пола (${flIdx + 1} эт.)`}
                            />
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <input
                              type="number"
                              min={0}
                              max={Number(maxSillM.toFixed(2))}
                              step={0.05}
                              disabled={sillLocked}
                              aria-label={`Высота окна от уровня пола, ${flIdx + 1}-й этаж (м)`}
                              value={Number(displaySillM.toFixed(2))}
                              onChange={(e) => {
                                const parsed = parseFloat(e.target.value);
                                if (!Number.isFinite(parsed)) return;
                                const clamped = Math.min(Math.max(0, parsed), maxSillM);
                                const nextArr = Array.from({ length: totalFl }, (_, idx) =>
                                  idx === flIdx ? Number(clamped.toFixed(2)) : params.windowSillHeights?.[idx]
                                );
                                onUpdateParams({ windowSillHeights: nextArr });
                              }}
                              className="w-20 px-2 py-0.5 border border-[#D6CEBE] bg-[#FBF9F5] text-right text-[#1C1917] disabled:bg-[#F3EFE6] disabled:text-[#78716C]"
                            />
                            <span className="text-[#78716C]">м от пола</span>
                            {customVal !== undefined && !sillLocked && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextArr = Array.from({ length: totalFl }, (_, idx) =>
                                    idx === flIdx ? undefined : params.windowSillHeights?.[idx]
                                  );
                                  const hasAny = nextArr.some((v) => v !== undefined);
                                  onUpdateParams({
                                    windowSillHeights: hasAny ? nextArr : undefined,
                                  });
                                }}
                                className="text-[10px] text-[#9A3412] underline underline-offset-2"
                              >
                                авто
                              </button>
                            )}
                          </div>
                        </div>

                        <input
                          type="range"
                          min={0}
                          max={Number(maxSillM.toFixed(2))}
                          step={0.05}
                          disabled={sillLocked}
                          aria-label={`Ползунок высоты окна от пола, ${flIdx + 1}-й этаж`}
                          value={Math.min(Math.max(0, displaySillM), maxSillM)}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const nextArr = Array.from({ length: totalFl }, (_, idx) =>
                              idx === flIdx ? Number(val.toFixed(2)) : params.windowSillHeights?.[idx]
                            );
                            onUpdateParams({ windowSillHeights: nextArr });
                          }}
                          className="w-full accent-[#9A3412] cursor-pointer disabled:opacity-50"
                        />

                        <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[10px] text-[#78716C]">
                          <span>
                            низ: +{formatMeters(effectiveSillScaled, 2)} м · верх: +{formatMeters(winTopRelFloorM, 2)} м от пола эт. (высота эт. {formatMeters(flH, 2)} м)
                          </span>
                          <span>{customVal === undefined ? 'авто' : 'вручную'}</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </CollapsibleSection>

            <WhyBlock
              ruleId="window_range"
              status={summary.windowCheck.rangeCheck.status}
              sourceStatus="explicit-verified"
              formula="1.5w ≤ h ≤ 2w"
              page="S. 6"
              explanation={summary.windowCheck.rangeCheck.explanation}
              onOpenBookPage={effectiveOpenBookPage}
            />
            <WhyBlock
              ruleId="window_diag"
              status={summary.windowCheck.diagCheck.status}
              sourceStatus={summary.windowCheck.diagCheck.sourceStatus}
              formula="d = √(w² + h²); проверка w ≤ d/2"
              page="S. 7"
              isHeuristic={summary.windowCheck.diagCheck.sourceStatus === 'heuristic'}
              explanation={`${summary.windowCheck.diagCheck.explanation} Ближайшее приближение золотого сечения: ${summary.windowCheck.nearestApprox.spec.label}.`}
              onOpenBookPage={effectiveOpenBookPage}
            />
            {params.withFraming && (
              <WhyBlock
                ruleId="n2_sill_plate"
                status={summary.sillPlateCheck.status}
                sourceStatus={summary.sillPlateCheck.sourceStatus}
                formula={summary.sillPlateCheck.formula}
                page={summary.sillPlateCheck.page}
                explanation={summary.sillPlateCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
              />
            )}
            {params.hasWallRustication && (
              <WhyBlock
                ruleId="n4_window_rust_rows"
                status={summary.windowRowsCheck.status}
                sourceStatus={summary.windowRowsCheck.sourceStatus}
                formula={summary.windowRowsCheck.formula}
                page={summary.windowRowsCheck.page}
                explanation={summary.windowRowsCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
              />
            )}
          </div>
        )}

        {/* 4.3 Угловой простенок */}
        {activeModule === 'corner' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                <TextWithGlossaryLinks
                  text="4.3. Угловой простенок (Eckpfeiler)"
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  <TextWithGlossaryLinks
                    text="Расстояние от угла дома до первой оси D = k_D × A и чистая ширина угла p_corner (S. 4–5)."
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
              <input
                type="checkbox"
                checked={params.isRisalitCentered}
                onChange={(e) => onUpdateParams({ isRisalitCentered: e.target.checked })}
                className="accent-[#9A3412]"
              />
              <span>Комната занимает всю ширину ризалита / западающей части (D = ширина / 2)</span>
            </label>

            {params.isRisalitCentered ? (
              <MeterControl
                id="calc-risalit-w"
                label="Ширина ризалита / комнаты"
                value={params.risalitWidth}
                min={2.2}
                max={8.0}
                lockKey="risalitWidth"
                locked={isParamLocked(lockedParams, 'risalitWidth')}
                onToggleLock={onToggleLock}
                onChange={(risalitWidth) => onUpdateParams({ risalitWidth })}
              />
            ) : (
              <div className="space-y-3">
                <MeterControl
                  id="calc-kD"
                  label="Коэффициент k_D = D / A (норма 2/3 … 5/6, по умолчанию 4/5)"
                  value={params.k_D}
                  min={0.5}
                  max={1.1}
                  step={0.01}
                  unit="×A"
                  lockKey="k_D"
                  locked={isParamLocked(lockedParams, 'k_D')}
                  onToggleLock={onToggleLock}
                  onChange={(k_D) => onUpdateParams({ k_D })}
                />
                {!isExamBlind && (
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '2/3 (0.667)', val: 2 / 3 },
                      { label: '3/4 (0.750)', val: 0.75 },
                      { label: '4/5 (0.800)', val: 0.8 },
                      { label: '5/6 (0.833)', val: 5 / 6 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        disabled={isParamLocked(lockedParams, 'k_D')}
                        onClick={() => onUpdateParams({ k_D: preset.val })}
                        className="px-2 py-1 text-[11px] font-mono border border-[#D6CEBE] bg-[#F3EFE6] hover:bg-[#EAE3D5] disabled:opacity-45"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 font-mono tabular-nums text-xs">
              <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                <span className="block text-[10px] text-[#78716C] uppercase">До 1-й оси D</span>
                <strong className="text-sm text-[#1C1917]">{formatMeters(summary.cornerCheck.D)} м</strong>
              </div>
              <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                <span className="block text-[10px] text-[#78716C] uppercase">Угловой простенок p_corner</span>
                <strong className="text-sm text-[#1C1917]">{formatMeters(summary.cornerCheck.p_corner)} м</strong>
              </div>
            </div>

            <WhyBlock
              ruleId="corner_pier"
              status={summary.cornerCheck.status}
              sourceStatus={summary.cornerCheck.sourceStatus}
              isHeuristic={summary.cornerCheck.sourceStatus === 'heuristic'}
              formula={summary.cornerCheck.formula}
              page={summary.cornerCheck.page}
              explanation={`${summary.cornerCheck.explanation} ${summary.cornerCheck.recommendation}`}
              onOpenBookPage={effectiveOpenBookPage}
            />

            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-3">
              <h4 className="font-display text-base font-medium text-[#1C1917]">
                {isExamBlind
                  ? 'Угловая рустовка и отступ угла'
                  : 'Угловая рустовка и отступ угла (N5–N6, S. 12, 17)'}
              </h4>
              <MeterControl
                id="calc-corner-rust-rows"
                label="Число рядов угловой рустовки (N5, нечётное)"
                value={params.cornerRustRows}
                min={3}
                max={15}
                step={1}
                unit="ряд."
                lockKey="cornerRustRows"
                locked={isParamLocked(lockedParams, 'cornerRustRows')}
                onToggleLock={onToggleLock}
                onChange={(val) => onUpdateParams({ cornerRustRows: Math.max(1, Math.round(val)) })}
              />
              <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.cornerRustStartsEndsLong ?? true}
                  onChange={(e) => onUpdateParams({ cornerRustStartsEndsLong: e.target.checked })}
                  className="accent-[#9A3412]"
                />
                <span>
                  {isExamBlind
                    ? 'Начинается и заканчивается длинными квадрами'
                    : 'Начинается и заканчивается длинными квадрами (S. 15)'}
                </span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MeterControl
                  id="calc-corner-m"
                  label="Угловой отступ M (рис. 7)"
                  value={params.cornerOffsetM}
                  min={0.5}
                  max={5.0}
                  step={0.05}
                  lockKey="cornerOffsetM"
                  locked={isParamLocked(lockedParams, 'cornerOffsetM')}
                  onToggleLock={onToggleLock}
                  onChange={(cornerOffsetM) => onUpdateParams({ cornerOffsetM })}
                />
                <MeterControl
                  id="calc-upper-n"
                  label="Высота верхнего этажа N (рис. 7)"
                  value={params.upperStoryHeightN}
                  min={2.2}
                  max={5.5}
                  step={0.05}
                  lockKey="upperStoryHeightN"
                  locked={isParamLocked(lockedParams, 'upperStoryHeightN')}
                  onToggleLock={onToggleLock}
                  onChange={(upperStoryHeightN) => onUpdateParams({ upperStoryHeightN })}
                />
              </div>
              <WhyBlock
                ruleId="n5_corner_rust_rows"
                status={summary.cornerRustRowsCheck.status}
                sourceStatus={summary.cornerRustRowsCheck.sourceStatus}
                formula={summary.cornerRustRowsCheck.formula}
                page={summary.cornerRustRowsCheck.page}
                explanation={summary.cornerRustRowsCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
              />
              <WhyBlock
                ruleId="n6_corner_offset_m_n"
                status={summary.cornerOffsetCheck.status}
                sourceStatus={summary.cornerOffsetCheck.sourceStatus}
                formula={summary.cornerOffsetCheck.formula}
                page={summary.cornerOffsetCheck.page}
                explanation={summary.cornerOffsetCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
              />
            </div>
          </div>
        )}

        {/* 4.4 Обрамление окна */}
        {activeModule === 'framing' && (() => {
          const isSandrikDisabled = Boolean(params.withoutSandrik) || params.framingRatio[2] === 0;
          return (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                <TextWithGlossaryLinks
                  text="4.4. Обрамление и сандрик окна (R : F : K)"
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  <TextWithGlossaryLinks
                    text="Деление наличника (Rahmen), фриза (Fries) и венчающего карниза (Kranz), вынос по 45° и на консолях (S. 7–8)."
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'by_T', label: 'По общей высоте T' },
                  { id: 'by_R', label: 'От модуля R (= u)' },
                  { id: 'by_F', label: 'От модуля F' },
                  { id: 'by_K', label: 'От модуля K' },
                ] as const
              ).map((m) => {
                const isDisabled =
                  (m.id === 'by_F' && params.framingRatio[1] === 0) ||
                  (m.id === 'by_K' && isSandrikDisabled);
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setFramingInputMode(m.id)}
                    className={`px-2.5 py-1 text-[11px] font-medium border disabled:opacity-45 ${
                      framingInputMode === m.id
                        ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                        : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-2.5">
              <div className="flex items-center gap-2">
                <label className="block text-xs font-medium text-[#1C1917]">
                  {isExamBlind ? 'Отношение R : F : K' : 'Отношение R : F : K (из текста S. 8)'}
                </label>
                <LockToggleButton
                  lockKey="framingRatio"
                  locked={isParamLocked(lockedParams, 'framingRatio')}
                  onToggleLock={onToggleLock}
                  label="Отношение R:F:K"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RULES_DATA.framingRatios.map((fr) => {
                  const isCurrent =
                    params.framingRatio[0] === fr.r &&
                    params.framingRatio[1] === fr.f &&
                    params.framingRatio[2] === fr.k;
                  return (
                    <button
                      key={fr.label}
                      type="button"
                      disabled={
                        isParamLocked(lockedParams, 'framingRatio') ||
                        (framingRLocked && isParamLocked(lockedParams, 'T'))
                      }
                      onClick={() => {
                        const nextRatio: [number, number, number] = [fr.r, fr.f, fr.k];
                        const effectiveK = params.withoutSandrik ? 0 : fr.k;
                        if (framingInputMode === 'by_F' && fr.f === 0) {
                          setFramingInputMode('by_T');
                          onUpdateParams({ framingRatio: nextRatio });
                          return;
                        }
                        if (
                          (framingInputMode === 'by_F' || framingInputMode === 'by_K') &&
                          !isParamLocked(lockedParams, 'T') &&
                          !framingRLocked
                        ) {
                          const part = framingInputMode === 'by_F' ? 'F' : 'K';
                          const anchorVal =
                            framingInputMode === 'by_F'
                              ? summary.framingResult.F
                              : summary.framingResult.K;
                          const res = framing_from_module(anchorVal, part, fr.r, fr.f, effectiveK);
                          onUpdateParams({
                            framingRatio: nextRatio,
                            u: Number(res.R.toFixed(4)),
                            T: Number(res.T.toFixed(4)),
                          });
                        } else {
                          onUpdateParams({ framingRatio: nextRatio });
                        }
                      }}
                      className={`px-2 py-1 text-[11px] font-mono border disabled:opacity-45 ${
                        isCurrent
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {fr.label}
                    </button>
                  );
                })}
              </div>

              <label className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5DFD3] text-xs text-[#1C1917] cursor-pointer">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isSandrikDisabled}
                    disabled={
                      isParamLocked(lockedParams, 'withoutSandrik') ||
                      (framingRLocked && isParamLocked(lockedParams, 'T'))
                    }
                    onChange={(e) => {
                      const disableK = e.target.checked;
                      const [r, f, k] = params.framingRatio;
                      if (disableK && framingInputMode === 'by_K') {
                        setFramingInputMode('by_T');
                      }
                      if (!disableK && k === 0) {
                        onUpdateParams({
                          withoutSandrik: false,
                          framingRatio: [r, f, 8],
                        });
                        return;
                      }
                      if (
                        framingInputMode === 'by_F' &&
                        !isParamLocked(lockedParams, 'T') &&
                        !framingRLocked
                      ) {
                        const res = framing_from_module(
                          summary.framingResult.F,
                          'F',
                          r,
                          f,
                          disableK ? 0 : k
                        );
                        onUpdateParams({
                          withoutSandrik: disableK,
                          u: Number(res.R.toFixed(4)),
                          T: Number(res.T.toFixed(4)),
                        });
                      } else {
                        onUpdateParams({ withoutSandrik: disableK });
                      }
                    }}
                    className="accent-[#9A3412]"
                  />
                  <span>Отключить сандрик (K = 0 — без венчающего карниза)</span>
                </span>
                <LockToggleButton
                  lockKey="withoutSandrik"
                  locked={isParamLocked(lockedParams, 'withoutSandrik')}
                  onToggleLock={onToggleLock}
                  label="Отключение сандрика (K=0)"
                />
              </label>
            </div>

            {framingInputMode === 'by_T' ? (
              <MeterControl
                id="calc-T"
                label={
                  isSandrikDisabled
                    ? 'Общая высота обрамления T = R + F (K = 0)'
                    : 'Общая высота сандрика T = R + F + K'
                }
                value={summary.framingResult.T}
                min={0.15}
                max={2.0}
                disabled={framingRLocked}
                lockKey="T"
                locked={isParamLocked(lockedParams, 'T')}
                onToggleLock={onToggleLock}
                note={
                  framingRLocked
                    ? 'Наличник R (= u) закреплён замком — снимите замок с R / u, чтобы менять общую высоту T.'
                    : 'Элемент R всегда равен ширине обрамления u (раздел 4.1); изменение T пересчитывает u = R.'
                }
                onChange={(T) => onUpdateParams({ T, withFraming: true })}
              />
            ) : framingInputMode === 'by_R' ? (
              <MeterControl
                id="calc-R-u"
                label="Высота/ширина наличника R (= u, Rahmen)"
                value={params.u}
                min={0.05}
                max={0.45}
                disabled={isParamLocked(lockedParams, 'T')}
                lockKey="u"
                locked={framingRLocked}
                onToggleLock={onToggleLock}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                note={
                  isParamLocked(lockedParams, 'T')
                    ? 'Общая высота сандрика T закреплена замком — снимите замок с T, чтобы менять R (= u).'
                    : 'То же число, что и «Ширина обрамления с одной стороны u» в разделе 4.1 (общий замок).'
                }
                onChange={(u) => onUpdateParams({ u, withFraming: true })}
              />
            ) : (
              <MeterControl
                id="calc-module-val"
                label={`Заданный модуль ${framingInputMode === 'by_F' ? 'F (Fries)' : 'K (Kranz)'}`}
                value={
                  framingInputMode === 'by_F'
                    ? summary.framingResult.F
                    : summary.framingResult.K
                }
                min={0.05}
                max={1.0}
                disabled={isParamLocked(lockedParams, 'T') || framingRLocked}
                note={
                  framingRLocked
                    ? 'Наличник R (= u) закреплён замком — снимите замок с R / u, чтобы масштабировать модули.'
                    : isParamLocked(lockedParams, 'T')
                      ? 'Общая высота T закреплена замком — снимите замок с T, чтобы менять модуль.'
                      : undefined
                }
                onChange={(val) => {
                  const part = framingInputMode === 'by_F' ? 'F' : 'K';
                  const [r, f, k] = params.framingRatio;
                  const effectiveK = params.withoutSandrik ? 0 : k;
                  const res = framing_from_module(val, part, r, f, effectiveK);
                  onUpdateParams({
                    u: Number(res.R.toFixed(4)),
                    T: Number(res.T.toFixed(4)),
                    withFraming: true,
                  });
                }}
              />
            )}

            {!isSandrikDisabled ? (
              <>
                <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.withConsoles}
                    onChange={(e) => onUpdateParams({ withConsoles: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>Поддержка карниза консолями (вынос уменьшается до 5/6 · K)</span>
                </label>

                {params.withConsoles && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <MeterControl
                      id="calc-a-front"
                      label="Отступ спереди a_front"
                      value={params.a_front}
                      min={0.01}
                      max={0.25}
                      lockKey="a_front"
                      locked={isParamLocked(lockedParams, 'a_front')}
                      onToggleLock={onToggleLock}
                      onChange={(a_front) => onUpdateParams({ a_front })}
                    />
                    <MeterControl
                      id="calc-a-side"
                      label="Отступ с боков a_side"
                      value={params.a_side}
                      min={0.01}
                      max={0.25}
                      lockKey="a_side"
                      locked={isParamLocked(lockedParams, 'a_side')}
                      onToggleLock={onToggleLock}
                      onChange={(a_side) => onUpdateParams({ a_side })}
                    />
                  </div>
                )}
              </>
            ) : (
              <p className="text-[11px] text-[#78716C] bg-[#FBF9F5] border border-[#E5DFD3] px-2.5 py-1.5">
                Сандрик отключён (K = 0): вынос венчающего карниза и консоли не применяются.
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-xs">
              <div
                className={`p-2 border ${
                  framingRLocked
                    ? 'border-[#9A3412]/45 bg-[#9A3412]/[0.05]'
                    : 'border-[#E5DFD3] bg-[#FBF9F5]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-[10px] text-[#78716C]">R = u (Rahmen)</span>
                  <LockToggleButton
                    lockKey="u"
                    locked={framingRLocked}
                    onToggleLock={onToggleLock}
                    label="Наличник R (= u, Rahmen)"
                  />
                </div>
                <strong>{formatMeters(summary.framingResult.R)} м</strong>
              </div>
              <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5] flex flex-col justify-between">
                <span className="block text-[10px] text-[#78716C]">F (Fries)</span>
                <strong>{formatMeters(summary.framingResult.F)} м</strong>
              </div>
              <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5] flex flex-col justify-between">
                <span className="block text-[10px] text-[#78716C]">K (Kranz)</span>
                <strong>
                  {formatMeters(summary.framingResult.K)} м
                  {isSandrikDisabled && <span className="ml-1 text-[10px] text-[#78716C]">(откл.)</span>}
                </strong>
              </div>
            </div>

            {!isSandrikDisabled && (
              <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5] font-mono text-xs flex flex-wrap justify-between gap-2">
                <span>Вынос 45°: <strong>{formatMeters(projection_45(summary.framingResult.K))} м</strong></span>
                <span>С консолями (5/6 K): <strong>{formatMeters(projection_console(summary.framingResult.K))} м</strong></span>
              </div>
            )}

            <WhyBlock
              ruleId="framing_rfk"
              status={summary.framingResult.status}
              formula={summary.framingResult.formula}
              page={summary.framingResult.page}
              explanation={summary.framingResult.explanation}
              onOpenBookPage={effectiveOpenBookPage}
            />
            {params.withConsoles && !isSandrikDisabled && (
              <WhyBlock
                ruleId="console_offset"
                status={summary.offsetCheck.status}
                formula={summary.offsetCheck.formula}
                page={summary.offsetCheck.page}
                explanation={summary.offsetCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
              />
            )}
          </div>
          );
        })()}

        {/* 4.5 Пилястр */}
        {activeModule === 'pilaster' && (() => {
          const floorCount = Math.max(1, params.levels.floors.length);
          const bounds = resolveSocleAndPilasterBounds(params, summary.derivedGeometry);
          const pilasterSpans = resolvePilasterElevationSpans(params, summary.derivedGeometry);
          const scaledGeo = resolveScaledVerticalGeometry(params, summary.derivedGeometry);
          const activePlacement: PilasterPlacement = params.pilasterPlacement ?? 'edges';

          return (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                  <TextWithGlossaryLinks
                    text="4.5. Пилястры и лопатки (Pilaster / Mauerpfeiler)"
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </h3>
                {!isExamBlind && (
                  <p className="mt-1 text-xs text-[#57534E]">
                    <TextWithGlossaryLinks
                      text="Предельный выступ v_max = W_p / 4; лёгкий декоративный диапазон — W_p / 6 … W_p / 5 (S. 11–12)."
                      onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                    />
                  </p>
                )}
              </div>

              <CollapsibleSection title="Размещение пилястр / лопаток по этажам и в плане">
                <div className="space-y-2">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                    Горизонтальное размещение на фасаде
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {(
                      [
                        { id: 'edges', label: 'а) По краям здания' },
                        { id: 'every_pier', label: 'б) В каждом простенке' },
                      ] as { id: PilasterPlacement; label: string }[]
                    ).map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => onUpdateParams({ pilasterPlacement: pl.id })}
                        className={`px-2.5 py-1.5 text-xs font-medium border text-left transition-colors ${
                          activePlacement === pl.id
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {pl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#E5DFD3] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                      Включение по этажам (низ ≥ верха цоколя)
                    </span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateParams({
                            pilasterFloors: Array.from({ length: floorCount }, () => true),
                            pilastersOnlyOnUpperFloor: false,
                          })
                        }
                        className="text-[11px] font-mono text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
                      >
                        Все этажи
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateParams({
                            pilasterFloors: Array.from({ length: floorCount }, () => false),
                            pilastersOnlyOnUpperFloor: false,
                          })
                        }
                        className="text-[11px] font-mono text-[#78716C] underline underline-offset-4 hover:text-[#1C1917]"
                      >
                        Без пилястр
                      </button>
                    </div>
                  </div>

                  {!Array.from({ length: floorCount }, (_, idx) =>
                    isPilasterEnabledOnFloor(params, idx, floorCount)
                  ).some(Boolean) && (
                    <p className="text-[11px] text-[#78716C] bg-[#FBF9F5] border border-[#E5DFD3] px-2.5 py-1.5">
                      Пилястры и лопатки отключены на всех этажах. Отметьте нужные этажи или нажмите «Все этажи».
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {Array.from({ length: floorCount }, (_, flIdx) => {
                      const enabled = isPilasterEnabledOnFloor(params, flIdx, floorCount);
                      const floorBase = scaledGeo.floorOffsetsM[flIdx];
                      const floorH = scaledGeo.floorHeightsM[flIdx];
                      const floorTopM =
                        floorBase !== undefined && floorH !== undefined
                          ? floorBase + floorH
                          : bounds.socleTopM + 1;
                      const hiddenBySocle = floorTopM <= bounds.socleTopM + 1e-4;
                      return (
                        <label
                          key={`pil-fl-${flIdx}`}
                          className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs border cursor-pointer transition-colors ${
                            enabled
                              ? 'border-[#1C1917]/40 bg-[#F3EFE6]/80 text-[#1C1917]'
                              : 'border-[#E5DFD3] bg-[#FBF9F5] text-[#78716C]'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => {
                                const nextMask = Array.from({ length: floorCount }, (__, idx) =>
                                  idx === flIdx
                                    ? !enabled
                                    : isPilasterEnabledOnFloor(params, idx, floorCount)
                                );
                                const onlyTop =
                                  floorCount >= 2 &&
                                  nextMask.slice(0, floorCount - 1).every((v) => !v) &&
                                  nextMask[floorCount - 1];
                                onUpdateParams({
                                  pilasterFloors: nextMask,
                                  pilastersOnlyOnUpperFloor: onlyTop,
                                });
                              }}
                              className="accent-[#9A3412]"
                            />
                            <span>{flIdx + 1}-й этаж</span>
                          </span>
                          {hiddenBySocle && (
                            <span className="font-mono text-[10px] text-[#9A3412]">в цоколе</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Характер, ширина W_p и выступ v">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      {
                        id: 'massive',
                        label: isExamBlind ? 'Массивный характер' : 'Массивный характер (до W_p/4)',
                      },
                      {
                        id: 'light',
                        label: isExamBlind ? 'Лёгкий характер' : 'Лёгкий характер (W_p/6…W_p/5)',
                      },
                    ] as const
                  ).map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => onUpdateParams({ pilasterCharacter: ch.id })}
                      className={`px-2.5 py-1 text-[11px] font-medium border ${
                        params.pilasterCharacter === ch.id
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE]'
                      }`}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.isMauerpfeiler}
                    onChange={(e) => onUpdateParams({ isMauerpfeiler: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    <TextWithGlossaryLinks
                      text="Гладкая лопатка / стенной пилон (Mauerpfeiler) — без базы и капители"
                      onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                      insideLabel={true}
                    />
                  </span>
                </label>

                <MeterControl
                  id="calc-Wp"
                  label="Ширина пилястра / лопатки W_p"
                  value={params.Wp}
                  min={0.25}
                  max={1.4}
                  lockKey="Wp"
                  locked={isParamLocked(lockedParams, 'Wp')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  onChange={(Wp) => onUpdateParams({ Wp })}
                />
                <MeterControl
                  id="calc-v"
                  label="Выступ пилястра v"
                  value={params.v}
                  min={0.02}
                  max={0.45}
                  lockKey="v"
                  locked={isParamLocked(lockedParams, 'v')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  onChange={(v) => onUpdateParams({ v })}
                />

                {!isExamBlind && (
                  <>
                    <div className="grid grid-cols-2 gap-3 font-mono tabular-nums text-xs">
                      <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">Макс. выступ v_max = W_p/4</span>
                        <strong>{formatMeters(summary.pilasterCheck.v_max)} м</strong>
                      </div>
                      <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                        <span className="block text-[10px] text-[#78716C] uppercase">Лёгкий диапазон (1/6…1/5)</span>
                        <strong>
                          {formatMeters(summary.pilasterCheck.v_light_min)}–{formatMeters(summary.pilasterCheck.v_light_max)} м
                        </strong>
                      </div>
                    </div>

                    <div className="p-2.5 border border-[#E5DFD3] bg-[#F3EFE6]/55 text-xs text-[#44403C] space-y-1">
                      <div className="font-mono text-[11px] text-[#1C1917]">
                        Отметки пилястр ({params.isMauerpfeiler ? 'без базы' : 'с базой'}):{' '}
                        {bounds.hasUpperPilasters
                          ? `${formatMeters(bounds.pilasterBottomM, 2)} м … ${formatMeters(bounds.pilasterTopM, 2)} м`
                          : 'скрыты (цоколь или все этажи отключены)'}
                      </div>
                      {pilasterSpans.length > 0 && (
                        <div className="font-mono text-[10px] text-[#57534E]">
                          Участки по высоте:{' '}
                          {pilasterSpans
                            .map(
                              (sp) =>
                                `${formatMeters(sp.bottomM, 2)}–${formatMeters(sp.topM, 2)} м (H=${formatMeters(sp.topM - sp.bottomM, 2)} м)`
                            )
                            .join(' · ')}
                        </div>
                      )}
                      <p className="text-[11px] text-[#57534E]">
                        Правило привязки: низ пилястр (с базой или без базы) не может быть ниже верха цоколя (
                        {formatMeters(bounds.socleTopM, 2)} м), а при наличии межэтажной ленты высота пилястра подрезается сверху и/или снизу, чтобы не пересекать ленту.
                      </p>
                    </div>
                  </>
                )}

                <WhyBlock
                  ruleId="pilaster_check"
                  status={summary.pilasterCheck.status}
                  sourceStatus="explicit-verified"
                  formula={summary.pilasterCheck.formula}
                  page={summary.pilasterCheck.page}
                  explanation={`${summary.pilasterCheck.explanation} ${summary.pilasterCheck.baseCapitalNote}`}
                  onOpenBookPage={effectiveOpenBookPage}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </CollapsibleSection>

              {/* N18–N19 Многоярусное применение пилястр (P2) */}
              <CollapsibleSection title="Многоярусное применение пилястр (N18–N19, S. 12–13)" subtle>
                <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.pilasterAdjacentSameHeight}
                    onChange={(e) =>
                      onUpdateParams({ pilasterAdjacentSameHeight: e.target.checked })
                    }
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Повторение ордера в смежных этажах близкой высоты'
                      : 'Повторение ордера в смежных этажах близкой высоты (N18)'}
                  </span>
                </label>
                {params.pilasterAdjacentSameHeight && (
                  <MeterControl
                    id="calc-pil-diff-pct"
                    label="Разница высот смежных этажей ΔH (UX-порог ≤10%)"
                    value={params.pilasterHeightDiffPct * 100}
                    min={0}
                    max={35}
                    step={1}
                    unit="%"
                    lockKey="pilasterHeightDiffPct"
                    locked={isParamLocked(lockedParams, 'pilasterHeightDiffPct')}
                    onToggleLock={onToggleLock}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                    onChange={(pct) => onUpdateParams({ pilasterHeightDiffPct: pct / 100 })}
                  />
                )}
                <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.pilastersOnlyOnUpperFloor}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const nextMask = Array.from({ length: floorCount }, (_, idx) =>
                        checked ? idx === floorCount - 1 : true
                      );
                      onUpdateParams({
                        pilastersOnlyOnUpperFloor: checked,
                        pilasterFloors: nextMask,
                      });
                    }}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Пилястры применены только на верхнем этаже'
                      : 'Пилястры применены только на верхнем этаже (N19, нежелательно)'}
                  </span>
                </label>
              </CollapsibleSection>

              {expertMode ? (
                <CollapsibleSection title="Экспертные проверки ордера P3 (N20–N22, S. 12–13)">
                  <MeterControl
                    id="calc-wp-wall-pier"
                    label="Ширина стенового простенка W_стены (N20: W_p < W_стены)"
                    value={params.wpWallPier}
                    min={0.3}
                    max={2.4}
                    lockKey="wpWallPier"
                    locked={isParamLocked(lockedParams, 'wpWallPier')}
                    onToggleLock={onToggleLock}
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                    onChange={(wpWallPier) => onUpdateParams({ wpWallPier })}
                  />
                  <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={params.hasPairedPilasters}
                      onChange={(e) => onUpdateParams({ hasPairedPilasters: e.target.checked })}
                      className="accent-[#9A3412]"
                    />
                    <span>Спаренные пилястры (N21: gap &lt; W_p, &gt; 0.2·W_p — UX-порог)</span>
                  </label>
                  {params.hasPairedPilasters && (
                    <MeterControl
                      id="calc-paired-gap"
                      label="Просвет между спаренными пилястрами"
                      value={params.pairedPilastersGap}
                      min={0.05}
                      max={1.2}
                      lockKey="pairedPilastersGap"
                      locked={isParamLocked(lockedParams, 'pairedPilastersGap')}
                      onToggleLock={onToggleLock}
                      onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                      onChange={(pairedPilastersGap) => onUpdateParams({ pairedPilastersGap })}
                    />
                  )}
                  <div className="space-y-1">
                    <span className="block text-[11px] font-mono text-[#78716C]">
                      Тип пристенной колонны (N22, S. 12):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'none', label: 'Только пилястр' },
                          { id: 'half', label: 'Полуколонна (1/2)' },
                          { id: 'two_thirds', label: '2/3-колонна (S. 13)' },
                          { id: 'three_quarters', label: '3/4-колонна (S. 13)' },
                        ] as { id: ColumnProfileType; label: string }[]
                      ).map((cp) => (
                        <button
                          key={cp.id}
                          type="button"
                          onClick={() => onUpdateParams({ columnProfileType: cp.id })}
                          className={`px-2 py-1 text-[11px] border ${
                            params.columnProfileType === cp.id
                              ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                              : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE]'
                          }`}
                        >
                          {cp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>
              ) : !isExamBlind ? (
                <p className="font-mono text-[11px] text-[#78716C]">
                  Доп. проверки ордера N20–N22 доступны при включении «Эксперт P3».
                </p>
              ) : null}
            </div>
          );
        })()}

        {/* 4.6 Главный карниз */}
        {activeModule === 'cornice' && (() => {
          const totalH = Math.max(0.01, summary.derivedGeometry.totalHeight);
          const effectiveSocleH = params.useFullFloorAsSocle
            ? summary.derivedGeometry.floor1FullHeight
            : params.hSocle;
          const activeStyle = params.corniceFullStyle ?? 'frieze_architrave';
          const corniceBotM = Math.max(0, totalH - params.hMain);
          const shareDenom = totalH / Math.max(0.01, params.hMain);
          const [rMin, rMax] = summary.mainCorniceCheck.range;
          const midTarget = (() => {
            const mid = (rMin + rMax) / 2;
            const capped = params.useFullFloorAsSocle
              ? mid
              : Math.min(mid, Math.max(rMin, effectiveSocleH - 0.05));
            return Number(Math.max(0.15, Math.min(2.5, capped)).toFixed(3));
          })();

          return (
            <div className="space-y-4">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                  <TextWithGlossaryLinks
                    text="4.6. Главный карниз (Hauptgesims)"
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </h3>
                {!isExamBlind && (
                  <p className="mt-1 text-xs text-[#57534E]">
                    Выбор состава, общей высоты главного карниза h_main от H_зд вниз (S. 9, 16) и деления венчающей части h_u : h_l (S. 10–11).
                  </p>
                )}
              </div>

              <CollapsibleSection title="Общая высота главного карниза">
                <div className="space-y-2">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                    Выбор варианта состава главного карниза
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {(
                      [
                        {
                          key: 'frieze_architrave',
                          label: 'Венчающая часть с фризом и архитравом (1 вариант)',
                          desc: 'Полный главный карниз: 1/8–1/12 H_зд (2 эт.) или 1/12–1/15 H_зд (многоэт.) и < цоколя.',
                          mode: 'full_entablature',
                          style: 'frieze_architrave',
                        },
                        {
                          key: 'neck_band',
                          label: 'Венчающая часть с шейкой и пояском (2 вариант)',
                          desc: 'Полный главный карниз (Hals и Halsband): 1/8–1/12 H_зд (2 эт.) или 1/12–1/15 H_зд (многоэт.) и < цоколя.',
                          mode: 'full_entablature',
                          style: 'neck_band',
                        },
                        {
                          key: 'crowning_only',
                          label: isExamBlind
                            ? 'Только венчающая часть (Kranz)'
                            : 'Только венчающая часть (Kranz — при небольшой высоте)',
                          desc: 'Дом 1–2 эт.: 1/15–1/16 высоты; многоэтажный городской дом: 1/16–1/20 высоты до верхнего обреза.',
                          mode: 'crowning_only',
                        },
                      ] as {
                        key: string;
                        label: string;
                        desc: string;
                        mode: CorniceVariantMode;
                        style?: CorniceCompositionStyle;
                      }[]
                    ).map((opt) => {
                      const isSelected =
                        opt.mode === 'crowning_only'
                          ? params.corniceVariantMode === 'crowning_only'
                          : params.corniceVariantMode === 'full_entablature' &&
                            activeStyle === opt.style;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() =>
                            onUpdateParams({
                              corniceVariantMode: opt.mode,
                              ...(opt.style ? { corniceFullStyle: opt.style } : {}),
                            })
                          }
                          className={`text-left px-3 py-2 border transition-colors ${
                            isSelected
                              ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                              : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                          }`}
                        >
                          <div className="text-xs font-medium">{opt.label}</div>
                          {!isExamBlind && (
                            <div
                              className={`mt-0.5 text-[10px] ${
                                isSelected ? 'text-[#E7E5E4]' : 'text-[#78716C]'
                              }`}
                            >
                              {opt.desc}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <MeterControl
                  id="calc-cornice-h-main"
                  label="Высота главного карниза h_main (отсчитывается от H_зд вниз)"
                  value={params.hMain}
                  min={0.15}
                  max={2.5}
                  lockKey="hMain"
                  locked={isParamLocked(lockedParams, 'hMain')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  note={
                    summary.mainCorniceCheck.notApplicable
                      ? 'Весь 1-й этаж включён в цоколь — правило главного карниза (1/8–1/12, 1/12–1/15 и < цоколя) не работает (S. 16, 22).'
                      : summary.mainCorniceCheck.isExtrapolated
                        ? `1-эт. экстраполяция от 2-эт. (≥ ${formatMeters(rMin)} м) и строго < цоколя (${formatMeters(effectiveSocleH)} м).`
                        : `Норма «${summary.variantInfo.shortLabelRu}»: ${formatMeters(rMin)}–${formatMeters(rMax)} м и строго < цоколя (${formatMeters(effectiveSocleH)} м).`
                  }
                  onChange={(hMain) => onUpdateParams({ hMain })}
                />

                <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-[11px]">
                  <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                    <span className="block text-[10px] text-[#78716C] uppercase">Верх (H_зд)</span>
                    <strong>{formatMeters(totalH)} м</strong>
                  </div>
                  <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                    <span className="block text-[10px] text-[#78716C] uppercase">Низ (H_зд − h_main)</span>
                    <strong>{formatMeters(corniceBotM)} м</strong>
                  </div>
                  <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                    <span className="block text-[10px] text-[#78716C] uppercase">Доля от H_зд</span>
                    <strong>
                      1 / {shareDenom.toFixed(1)} ({((params.hMain / totalH) * 100).toFixed(1)} %)
                    </strong>
                  </div>
                </div>

                {!isExamBlind && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        disabled={isParamLocked(lockedParams, 'hMain')}
                        onClick={() => onUpdateParams({ hMain: midTarget })}
                        className="px-2.5 py-1 text-[11px] border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#EAE3D5] disabled:opacity-45"
                      >
                        Подогнать h_main к середине нормы ({formatMeters(midTarget)} м)
                      </button>
                    </div>

                    <div className="p-2.5 border border-[#E5DFD3] bg-[#F3EFE6]/55 text-[11px] text-[#44403C] space-y-1">
                      <div className="font-mono uppercase text-[10px] text-[#9A3412]">
                        Нормы высоты главного карниза (S. 16):
                      </div>
                      <p>
                        • Полный главный карниз (1 или 2 вариант): меньше цоколя; в 2-этажном доме 1/8–1/12, в многоэтажном 1/12–1/15 общей высоты H_зд (не применяется, если весь 1-й этаж включён в цоколь).
                      </p>
                      <p>
                        • При небольшой высоте (1–2 этажный дом), одна венчающая часть: 1/15–1/16 высоты (для 1 этажа — экстраполяция от 2-этажного).
                      </p>
                      <p>
                        • В многоэтажном городском доме одна венчающая часть: 1/16–1/20 высоты от уровня земли до верхнего обреза главного карниза (H_зд).
                      </p>
                    </div>
                  </>
                )}

                <WhyBlock
                  ruleId="main_cornice_subordination"
                  status={summary.mainCorniceCheck.status}
                  sourceStatus={summary.mainCorniceCheck.isExtrapolated ? 'gap' : 'explicit-verified'}
                  formula={summary.mainCorniceCheck.formula}
                  page={summary.mainCorniceCheck.page}
                  isHeuristic={summary.mainCorniceCheck.isExtrapolated}
                  explanation={summary.mainCorniceCheck.explanation}
                  onOpenBookPage={effectiveOpenBookPage}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </CollapsibleSection>

              <CollapsibleSection title="Пропорции T_c и отношение h_u:h_1">
                <MeterControl
                  id="calc-Tc"
                  label="Общая высота венчающей части T_c"
                  value={params.Tc}
                  min={0.2}
                  max={1.2}
                  lockKey="Tc"
                  locked={isParamLocked(lockedParams, 'Tc')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  note={
                    params.corniceVariantMode === 'full_entablature' && params.Tc >= params.hMain - 0.02
                      ? `В полном карнизе венчающая часть T_c обычно меньше h_main (${formatMeters(params.hMain)} м), оставляя место для нижних элементов.`
                      : undefined
                  }
                  onChange={(Tc) => onUpdateParams({ Tc })}
                />

                <MeterControl
                  id="calc-cornice-ratio"
                  label="Отношение h_u : h_l (норма 1:1, допустимо 0.50…2.00)"
                  value={params.corniceRatio}
                  min={0.3}
                  max={2.5}
                  step={0.05}
                  unit=":1"
                  lockKey="corniceRatio"
                  locked={isParamLocked(lockedParams, 'corniceRatio')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  onChange={(corniceRatio) => onUpdateParams({ corniceRatio })}
                />
              </CollapsibleSection>

              <CollapsibleSection title="Характер профиля и доля плиты" badge="эвристика" subtle>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: isExamBlind ? 'Тяжёлый' : 'Тяжёлый (≥75 %)', share: 0.8 },
                    { label: isExamBlind ? 'Нейтральный' : 'Нейтральный (60 %)', share: 0.6 },
                    { label: isExamBlind ? 'Лёгкий' : 'Лёгкий (≤50 %)', share: 0.42 },
                  ].map((pr) => (
                    <button
                      key={pr.label}
                      type="button"
                      disabled={isParamLocked(lockedParams, 'plateShare')}
                      onClick={() => onUpdateParams({ plateShare: pr.share })}
                      className={`px-2.5 py-1 text-[11px] border disabled:opacity-45 ${
                        Math.abs(params.plateShare - pr.share) < 0.05
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE]'
                      }`}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
                <MeterControl
                  id="calc-plate-share"
                  label="Доля плиты в верхнем обломе (UX-пресет)"
                  value={params.plateShare * 100}
                  min={20}
                  max={95}
                  step={1}
                  unit="%"
                  lockKey="plateShare"
                  locked={isParamLocked(lockedParams, 'plateShare')}
                  onToggleLock={onToggleLock}
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  note="Процентные пороги ≥75 % и ≤50 % — интерпретационное допущение UX поверх качественного описания S. 10–11."
                  onChange={(pct) => onUpdateParams({ plateShare: pct / 100 })}
                />
              </CollapsibleSection>

              <div className="grid grid-cols-2 gap-3 font-mono tabular-nums text-xs">
                <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Верхние обломы h_u</span>
                  <strong>{formatMeters(summary.corniceCheck.h_u)} м</strong>
                </div>
                <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Нижние обломы h_l</span>
                  <strong>{formatMeters(summary.corniceCheck.h_l)} м</strong>
                </div>
              </div>

              <WhyBlock
                ruleId="cornice_split"
                status={summary.corniceCheck.status}
                formula={summary.corniceCheck.formula}
                page={summary.corniceCheck.page}
                explanation={summary.corniceCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </div>
          );
        })()}

        {/* 4.7 Цоколь и поэтажная иерархия */}
        {activeModule === 'socle' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                <TextWithGlossaryLinks
                  text="4.7. Цоколь (Sockel), карнизы и рустика"
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  <TextWithGlossaryLinks
                    text="Высота цоколя (1/6…1/10 общей высоты), подчинённость главного и поясного карнизов, трёхчастное деление, ряды рустики и убывание вверх (S. 10, 12, 16–17, 22)."
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </p>
              )}
            </div>

            {/* Высота цоколя и общая высота здания */}
            <CollapsibleSection title="Высота цоколя" subtle>

              <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5] font-mono text-xs flex flex-wrap justify-between gap-2">
                <span>
                  H_зд (по этажам): <strong>{formatMeters(summary.derivedGeometry.totalHeight, 2)} м</strong>
                </span>
                <span>
                  1-й эт. полн.: <strong>{formatMeters(summary.derivedGeometry.floor1FullHeight, 2)} м</strong>
                </span>
              </div>

              {!isExamBlind && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'optimal', label: 'Оптимум 1/6 H_total' },
                        { id: 'typical', label: 'Типично 1/8 H_total (1/7…1/10)' },
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode.id}
                        type="button"
                        disabled={isParamLocked(lockedParams, 'hSocle')}
                        onClick={() => {
                          const res = socleHeight(summary.derivedGeometry.totalHeight, mode.id as SocleMode);
                          onUpdateParams({
                            socleMode: mode.id,
                            hSocle: res.h,
                            useFullFloorAsSocle: false,
                          });
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium border transition-colors disabled:opacity-45 ${
                          params.socleMode === mode.id && !params.useFullFloorAsSocle
                            ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <MeterControl
                id="calc-h-socle"
                label="Высота цоколя h_socle"
                value={params.useFullFloorAsSocle ? summary.derivedGeometry.floor1FullHeight : params.hSocle}
                min={0.3}
                max={6.5}
                disabled={params.useFullFloorAsSocle}
                lockKey="hSocle"
                locked={isParamLocked(lockedParams, 'hSocle')}
                onToggleLock={onToggleLock}
                note={`Допустимый диапазон по S. 16: ${formatMeters(summary.socleHeightCheck.range[0])}–${formatMeters(summary.socleHeightCheck.range[1])} м.`}
                onChange={(hSocle) => onUpdateParams({ hSocle })}
              />

              <div className="flex items-start justify-between gap-2 pt-1">
                <label className="flex items-start gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isParamLocked(lockedParams, 'useFullFloorAsSocle')}
                    checked={params.useFullFloorAsSocle}
                    onChange={(e) => onUpdateParams({ useFullFloorAsSocle: e.target.checked })}
                    className="accent-[#9A3412] mt-0.5"
                  />
                  <span>
                    {isExamBlind ? (
                      <>
                        Включить весь 1-й этаж в цоколь (полн. высота ={' '}
                        {formatMeters(summary.derivedGeometry.floor1FullHeight)} м)
                      </>
                    ) : (
                      <>
                        Включить весь 1-й этаж в цоколь (S. 16, 22; полн. высота ={' '}
                        {formatMeters(summary.derivedGeometry.floor1FullHeight)} м) —{' '}
                        <strong
                          className={
                            summary.fullFloorSocleCheck.applicable
                              ? 'text-[#15803D]'
                              : 'text-[#B91C1C]'
                          }
                        >
                          {summary.fullFloorSocleCheck.applicable ? 'применимо' : 'недостаточно высоты'}
                        </strong>
                      </>
                    )}
                  </span>
                </label>
                <LockToggleButton
                  lockKey="useFullFloorAsSocle"
                  locked={isParamLocked(lockedParams, 'useFullFloorAsSocle')}
                  onToggleLock={onToggleLock}
                  label="1-й этаж как цоколь"
                />
              </div>

              <WhyBlock
                ruleId="socle_height"
                status={summary.socleHeightCheck.status}
                sourceStatus={params.buildingVariant === 'one-story' ? 'gap' : 'explicit-verified'}
                formula={summary.socleHeightCheck.formula}
                page={summary.socleHeightCheck.page}
                explanation={summary.socleHeightCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>

            {/* Главный и поясной карнизы */}
            <CollapsibleSection title="Иерархия карнизов (h_gurt < h_main < h_socle)">

              <MeterControl
                id="calc-h-main"
                label="Главный карниз h_main (Hauptgesims)"
                value={params.hMain}
                min={0.15}
                max={2.5}
                lockKey="hMain"
                locked={isParamLocked(lockedParams, 'hMain')}
                onToggleLock={onToggleLock}
                note={
                  summary.mainCorniceCheck.notApplicable
                    ? 'Весь 1-й этаж включён в цоколь — правило соотношения главного карниза с цоколем и долями 1/8–1/12 (1/12–1/15) не работает (S. 16, 22).'
                    : summary.mainCorniceCheck.isExtrapolated
                      ? `1-эт. экстраполяция ≥ ${formatMeters(summary.mainCorniceCheck.range[0])} м (в тексте не задано) и строго < h_socle.`
                      : `Диапазон для «${summary.variantInfo.shortLabelRu}»: ${formatMeters(summary.mainCorniceCheck.range[0])}–${formatMeters(summary.mainCorniceCheck.range[1])} м и строго < h_socle.`
                }
                onChange={(hMain) => onUpdateParams({ hMain })}
              />

              <WhyBlock
                ruleId="main_cornice_subordination"
                status={summary.mainCorniceCheck.status}
                sourceStatus={summary.mainCorniceCheck.isExtrapolated ? 'gap' : 'explicit-verified'}
                formula={summary.mainCorniceCheck.formula}
                page={summary.mainCorniceCheck.page}
                isHeuristic={summary.mainCorniceCheck.isExtrapolated}
                explanation={summary.mainCorniceCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
              />

              <MeterControl
                id="calc-h-gurt"
                label="Поясной карниз h_gurt (Gurtgesims)"
                value={params.hGurt}
                min={0.0}
                max={1.2}
                disabled={summary.gurtCheck.notRequired}
                lockKey="hGurt"
                locked={isParamLocked(lockedParams, 'hGurt')}
                onToggleLock={onToggleLock}
                note={
                  summary.gurtCheck.notRequired
                    ? summary.gurtCheck.explanation
                    : `От высоты 1-го этажа ${formatMeters(params.useFloorToFloorForBelt ? summary.derivedGeometry.floor1FloorToFloor : summary.derivedGeometry.H_max)} м (1/12…1/6): ${formatMeters(summary.gurtCheck.range[0])}–${formatMeters(summary.gurtCheck.range[1])} м.`
                }
                onChange={(hGurt) => onUpdateParams({ hGurt })}
              />

              <WhyBlock
                ruleId="gurt_cornice"
                status={summary.gurtCheck.status}
                sourceStatus={
                  !summary.gurtCheck.notRequired && !params.useFloorToFloorForBelt
                    ? 'heuristic'
                    : 'explicit-verified'
                }
                isHeuristic={!summary.gurtCheck.notRequired && !params.useFloorToFloorForBelt}
                formula={summary.gurtCheck.formula}
                page={summary.gurtCheck.page}
                explanation={summary.gurtCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>

            {/* Трёхчастность цоколя и доминирование плиты */}
            <CollapsibleSection title="Трёхчастное деление цоколя и плита (S. 10)" badge="эвристика" subtle>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MeterControl
                  id="calc-part-fuss"
                  label="Подножие (Fuß)"
                  value={params.socleParts.fuss * 100}
                  min={10}
                  max={45}
                  step={1}
                  unit="%"
                  lockKey="socleParts.fuss"
                  locked={isParamLocked(lockedParams, 'socleParts.fuss')}
                  onToggleLock={onToggleLock}
                  onChange={(pct) =>
                    onUpdateParams({ socleParts: { ...params.socleParts, fuss: pct / 100 } })
                  }
                />
                <MeterControl
                  id="calc-part-rumpf"
                  label="Тело (Rumpf)"
                  value={params.socleParts.rumpf * 100}
                  min={25}
                  max={75}
                  step={1}
                  unit="%"
                  lockKey="socleParts.rumpf"
                  locked={isParamLocked(lockedParams, 'socleParts.rumpf')}
                  onToggleLock={onToggleLock}
                  onChange={(pct) =>
                    onUpdateParams({ socleParts: { ...params.socleParts, rumpf: pct / 100 } })
                  }
                />
                <MeterControl
                  id="calc-part-deck"
                  label="Карниз (Deck)"
                  value={params.socleParts.deck * 100}
                  min={10}
                  max={40}
                  step={1}
                  unit="%"
                  lockKey="socleParts.deck"
                  locked={isParamLocked(lockedParams, 'socleParts.deck')}
                  onToggleLock={onToggleLock}
                  onChange={(pct) =>
                    onUpdateParams({ socleParts: { ...params.socleParts, deck: pct / 100 } })
                  }
                />
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-xs">
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C]">Fuß</span>
                  <strong>{formatMeters(summary.threePartSocleResult.fuss)} м</strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C]">Rumpf</span>
                  <strong>{formatMeters(summary.threePartSocleResult.rumpf)} м</strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C]">Deckgesims</span>
                  <strong>{formatMeters(summary.threePartSocleResult.deck)} м</strong>
                </div>
              </div>

              {!isExamBlind && (
                <p className="text-[11px] text-[#57534E]">{summary.threePartSocleResult.note}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DFD3]">
                <MeterControl
                  id="calc-socle-plate"
                  label="Высота плиты карниза цоколя"
                  value={params.hPlate}
                  min={0.04}
                  max={0.45}
                  lockKey="hPlate"
                  locked={isParamLocked(lockedParams, 'hPlate')}
                  onToggleLock={onToggleLock}
                  onChange={(hPlate) => onUpdateParams({ hPlate })}
                />
                <MeterControl
                  id="calc-socle-other"
                  label="Сумма прочих обломов карниза"
                  value={params.hOtherSum}
                  min={0.02}
                  max={0.4}
                  lockKey="hOtherSum"
                  locked={isParamLocked(lockedParams, 'hOtherSum')}
                  onToggleLock={onToggleLock}
                  onChange={(hOtherSum) => onUpdateParams({ hOtherSum })}
                />
              </div>

              <WhyBlock
                ruleId="socle_plate_dominant"
                status={summary.plateCheck.status}
                formula={summary.plateCheck.formula}
                page={summary.plateCheck.page}
                isHeuristic={true}
                explanation={summary.plateCheck.note}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>

            {/* Рустика, убывание вверх и раскреповки */}
            <CollapsibleSection title="Рустика, убывание вверх и раскреповки (S. 10, 12, 17)">
              <div className="flex items-start justify-between gap-2 p-2.5 border border-[#E5DFD3] bg-[#FBF9F5]">
                <label className="flex items-start gap-2.5 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isParamLocked(lockedParams, 'hasSocleRustication')}
                    checked={params.hasSocleRustication !== false}
                    onChange={(e) => onUpdateParams({ hasSocleRustication: e.target.checked })}
                    className="accent-[#9A3412] mt-0.5"
                  />
                  <span className="leading-snug">
                    <span className="font-medium block">
                      <TextWithGlossaryLinks
                        text="Рустовка тулова цоколя (ряды руста)"
                        onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                        insideLabel
                      />
                    </span>
                    <span className="text-[11px] text-[#57534E]">
                      Можно отключить, чтобы выполнить тулово цоколя гладким без рустовки{isExamBlind ? '' : ' (S. 10)'}. Трёхчастное деление цоколя при этом сохраняется.
                    </span>
                  </span>
                </label>
                <LockToggleButton
                  lockKey="hasSocleRustication"
                  locked={isParamLocked(lockedParams, 'hasSocleRustication')}
                  onToggleLock={onToggleLock}
                  label="Рустовка цоколя"
                />
              </div>

              {params.hasSocleRustication !== false ? (
                <>
                  <MeterControl
                    id="calc-rust-row"
                    label="Целевая высота ряда руста (норма 0.30–0.40 м)"
                    value={params.rustRowHeight}
                    min={0.22}
                    max={0.48}
                    lockKey="rustRowHeight"
                    locked={isParamLocked(lockedParams, 'rustRowHeight')}
                    onToggleLock={onToggleLock}
                    onChange={(rustRowHeight) => onUpdateParams({ rustRowHeight })}
                  />

                  <div className={`grid ${isExamBlind ? 'grid-cols-2' : 'grid-cols-3'} gap-2 font-mono tabular-nums text-xs`}>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C]">Число рядов n</span>
                      <strong>
                        {summary.rusticationCheck.n}
                        {!isExamBlind
                          ? ` (${summary.rusticationCheck.oddPreferred ? 'нечёт.' : 'чёт.'})`
                          : ''}
                      </strong>
                    </div>
                    <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                      <span className="block text-[10px] text-[#78716C]">Шаг ряда</span>
                      <strong>{formatMeters(summary.rusticationCheck.rowHeight)} м</strong>
                    </div>
                    {!isExamBlind && (
                      <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                        <span className="block text-[10px] text-[#78716C]">Диапазон</span>
                        <strong>0.300–0.400 м</strong>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-2.5 border border-[#E5DFD3] bg-[#F3EFE6]/55 text-xs text-[#44403C]">
                  Тулово цоколя (<span className="font-mono">Rumpf</span>) выполняется{' '}
                  <strong>гладким без рядов рустовки</strong>{isExamBlind ? '' : ' (S. 10)'}. Деление на{' '}
                  <span className="font-mono">Fuß / Rumpf / Deckgesims</span> сохраняется.
                </div>
              )}

              <WhyBlock
                ruleId="socle_rustication_rows"
                status={summary.rusticationCheck.status}
                sourceStatus={summary.rusticationCheck.sourceStatus}
                isHeuristic={summary.rusticationCheck.sourceStatus === 'heuristic'}
                formula={summary.rusticationCheck.formula}
                page={summary.rusticationCheck.page}
                explanation={summary.rusticationCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DFD3]">
                {params.hasSocleRustication !== false && (
                  <MeterControl
                    id="calc-rust-socle"
                    label="Высота руста цоколя"
                    value={params.hSocleRust}
                    min={0.2}
                    max={0.55}
                    lockKey="hSocleRust"
                    locked={isParamLocked(lockedParams, 'hSocleRust')}
                    onToggleLock={onToggleLock}
                    onChange={(hSocleRust) => onUpdateParams({ hSocleRust })}
                  />
                )}
                <MeterControl
                  id="calc-rust-eg"
                  label="Высота руста 1-го этажа (EG)"
                  value={params.hEgRust}
                  min={0.15}
                  max={0.5}
                  lockKey="hEgRust"
                  locked={isParamLocked(lockedParams, 'hEgRust')}
                  onToggleLock={onToggleLock}
                  onChange={(hEgRust) => onUpdateParams({ hEgRust })}
                />
                <MeterControl
                  id="calc-prof-socle"
                  label="Вынос профиля цоколя"
                  value={params.vSocleProfile}
                  min={0.02}
                  max={0.15}
                  lockKey="vSocleProfile"
                  locked={isParamLocked(lockedParams, 'vSocleProfile')}
                  onToggleLock={onToggleLock}
                  onChange={(vSocleProfile) => onUpdateParams({ vSocleProfile })}
                />
                <MeterControl
                  id="calc-prof-eg"
                  label="Вынос профиля 1-го этажа (EG)"
                  value={params.vEgProfile}
                  min={0.01}
                  max={0.15}
                  lockKey="vEgProfile"
                  locked={isParamLocked(lockedParams, 'vEgProfile')}
                  onToggleLock={onToggleLock}
                  onChange={(vEgProfile) => onUpdateParams({ vEgProfile })}
                />
              </div>

              <WhyBlock
                ruleId="socle_decreasing_upward"
                status={summary.decreasingCheck.status}
                formula={summary.decreasingCheck.formula}
                page={summary.decreasingCheck.page}
                explanation={summary.decreasingCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />

              <div className="space-y-2 pt-2 border-t border-[#E5DFD3]">
                <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.hasKellerfenster}
                    onChange={(e) => onUpdateParams({ hasKellerfenster: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>В цоколе есть подвальные окна (Kellerfenster)</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.hasLisenen}
                    onChange={(e) => onUpdateParams({ hasLisenen: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>На цоколе есть лопатки или пилястры (Lisenen / Pilaster)</span>
                </label>
              </div>

              <WhyBlock
                ruleId="socle_abkroepfung"
                status={summary.abkroepfungCheck.status}
                sourceStatus={summary.abkroepfungCheck.sourceStatus}
                isHeuristic={summary.abkroepfungCheck.sourceStatus === 'heuristic'}
                formula={summary.abkroepfungCheck.formula}
                page={summary.abkroepfungCheck.page}
                explanation={summary.abkroepfungCheck.note}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>
          </div>
        )}

        {/* 4.8 Межэтажные карнизы / ленты (Gurtgesims) */}
        {activeModule === 'belt' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                <TextWithGlossaryLinks
                  text="4.8. Межэтажные карнизы — ленты (Gurtgesims)"
                  onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                />
              </h3>
              {!isExamBlind && (
                <p className="mt-1 text-xs text-[#57534E]">
                  <TextWithGlossaryLinks
                    text="Двойственность ленты, диапазон h_нижн/12…h_нижн/6, соподчинение цоколю и главному карнизу, 4 класса профиля, разбивка венца 1:2…2:1 и спецслучаи (S. 10–11, 16–17, 22)."
                    onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
                  />
                </p>
              )}
            </div>

            {/* Размещение лент по этажам (над каждым, кроме верхнего) */}
            <CollapsibleSection
              title="Размещение лент по этажам (кроме верхнего)"
              badge={
                params.levels.floors.length <= 1 || params.buildingVariant === 'one-story'
                  ? '1 этаж'
                  : `${resolveBeltFloorsMask(params).filter(Boolean).length} из ${Math.max(0, params.levels.floors.length - 1)}`
              }
            >
              {(() => {
                const floorCount = Math.max(1, params.levels.floors.length);
                const boundaryCount = Math.max(0, floorCount - 1);
                const currentMask = resolveBeltFloorsMask(params, floorCount);
                const sillMask = resolveBeltSillFloorsMask(params, floorCount);
                const anySillActive = hasAnySillBelt(params, floorCount);

                if (boundaryCount === 0 || params.buildingVariant === 'one-story') {
                  return (
                    <p className="text-xs text-[#57534E]">
                      Для 1-этажного здания межэтажные ленты не предусмотрены — над единственным этажом располагается главный венчающий карниз.
                    </p>
                  );
                }

                const activeBeltIndices = currentMask
                  .map((on, idx) => (on ? idx : -1))
                  .filter((idx) => idx >= 0);

                const toggleSingleBeltSillMode = (flIdx: number) => {
                  const isSillHere = Boolean(sillMask[flIdx]);
                  const nextSillMask = sillMask.map((v, idx) =>
                    idx === flIdx ? !isSillHere : v
                  );
                  const anySillNext = nextSillMask.some(Boolean);
                  onUpdateParams({
                    beltSillFloors: nextSillMask,
                    beltIsSillCornice: anySillNext,
                    ...(anySillNext ? { hSillCornice: params.hGurt } : {}),
                    ...(flIdx === 1 &&
                    isSillHere &&
                    params.threeStoryGurtMode === 'third_sohlbank'
                      ? { threeStoryGurtMode: 'both_gurt' as ThreeStoryGurtMode }
                      : {}),
                  });
                };

                return (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-[#57534E]">
                        Выберите этажи, над которыми проходит межэтажный карниз (лента):
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            const nextBeltMask = Array.from({ length: boundaryCount }, () => true);
                            const nextSillMask = Array.from(
                              { length: boundaryCount },
                              (_, idx) => Boolean(sillMask[idx])
                            );
                            onUpdateParams({
                              beltFloors: nextBeltMask,
                              beltSillFloors: nextSillMask,
                              beltIsSillCornice: nextSillMask.some(Boolean),
                              beltIsAbsent: false,
                            });
                          }}
                          className="text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
                        >
                          Включить все
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateParams({
                              beltFloors: Array.from({ length: boundaryCount }, () => false),
                              beltSillFloors: Array.from({ length: boundaryCount }, () => false),
                              beltIsSillCornice: false,
                              beltIsAbsent: true,
                              beltAsRusticationMode: false,
                            })
                          }
                          className="text-[#57534E] underline underline-offset-4 hover:text-[#1C1917]"
                        >
                          Отключить все
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Array.from({ length: boundaryCount }, (_, flIdx) => {
                        const enabled = Boolean(currentMask[flIdx]);
                        const isSillHere = Boolean(sillMask[flIdx]);
                        const lockKey = `beltFloors.${flIdx}`;
                        const locked = isParamLocked(lockedParams, lockKey);
                        return (
                          <div
                            key={`belt-fl-${flIdx}`}
                            className={`flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs border transition-colors ${
                              enabled
                                ? 'border-[#1C1917]/40 bg-[#F3EFE6]/80 text-[#1C1917]'
                                : 'border-[#E5DFD3] bg-[#FBF9F5] text-[#78716C]'
                            }`}
                          >
                            <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                              <input
                                type="checkbox"
                                disabled={locked}
                                checked={enabled}
                                onChange={() => {
                                  const nextMask = currentMask.map((v, idx) =>
                                    idx === flIdx ? !enabled : v
                                  );
                                  const nextSillMask = sillMask.map((v, idx) =>
                                    idx === flIdx ? (!enabled ? v : false) : v
                                  );
                                  const anyOn = nextMask.some(Boolean);
                                  const anySillOn = nextSillMask.some(Boolean);
                                  onUpdateParams({
                                    beltFloors: nextMask,
                                    beltSillFloors: nextSillMask,
                                    beltIsSillCornice: anySillOn,
                                    beltIsAbsent: !anyOn,
                                    beltAsRusticationMode: anyOn ? params.beltAsRusticationMode : false,
                                  });
                                }}
                                className="accent-[#9A3412]"
                              />
                              <span className="truncate">
                                Над {flIdx + 1}-м эт. ({flIdx + 1}→{flIdx + 2})
                              </span>
                            </label>
                            <div className="flex items-center gap-1 shrink-0">
                              {enabled && isSillHere && (
                                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-[#9A3412]/15 text-[#9A3412] border border-[#9A3412]/30">
                                  подоконный
                                </span>
                              )}
                              <LockToggleButton
                                lockKey={lockKey}
                                locked={locked}
                                onToggleLock={onToggleLock}
                                label={`Лента над ${flIdx + 1}-м эт.`}
                              />
                            </div>
                          </div>
                        );
                      })}

                      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs border border-dashed border-[#D6CEBE] bg-[#F3EFE6]/30 text-[#78716C]">
                        <span>Над {floorCount}-м эт. (верхний)</span>
                        <span className="font-mono text-[10px]">венчающий карниз</span>
                      </div>
                    </div>

                    {/* Независимое превращение каждой созданной ленты в подоконный карниз */}
                    <div className="p-2.5 border border-[#D6CEBE] bg-[#F3EFE6]/55 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-[#57534E]">
                          Превращение лент в подоконный карниз (независимо по этажам)
                        </span>
                        {activeBeltIndices.length > 1 && (
                          <div className="flex items-center gap-3 font-mono text-[11px]">
                            <button
                              type="button"
                              onClick={() => {
                                const nextSillMask = currentMask.map(Boolean);
                                onUpdateParams({
                                  beltSillFloors: nextSillMask,
                                  beltIsSillCornice: true,
                                  hSillCornice: params.hGurt,
                                });
                              }}
                              className="text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
                            >
                              Превратить все
                            </button>
                            {anySillActive && (
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateParams({
                                    beltSillFloors: Array.from({ length: boundaryCount }, () => false),
                                    beltIsSillCornice: false,
                                    ...(params.threeStoryGurtMode === 'third_sohlbank'
                                      ? { threeStoryGurtMode: 'both_gurt' as ThreeStoryGurtMode }
                                      : {}),
                                  })
                                }
                                className="text-[#57534E] underline underline-offset-4 hover:text-[#1C1917]"
                              >
                                Вернуть все
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {activeBeltIndices.length === 0 ? (
                        <p className="text-[11px] text-[#78716C]">
                          Включите хотя бы одну ленту выше — для каждой созданной ленты станет доступна отдельная кнопка «Превратить ленту в подоконный карниз».
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeBeltIndices.map((flIdx) => {
                            const isSillHere = Boolean(sillMask[flIdx]);
                            return (
                              <div
                                key={`belt-sill-ctrl-${flIdx}`}
                                className={`flex flex-wrap items-center justify-between gap-2 p-2 border transition-colors ${
                                  isSillHere
                                    ? 'border-[#9A3412]/50 bg-[#FBF9F5]'
                                    : 'border-[#D6CEBE] bg-[#FBF9F5]/80'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-[#1C1917]">
                                    Лента над {flIdx + 1}-м этажом ({flIdx + 1}→{flIdx + 2} эт.)
                                  </div>
                                  <div className="text-[11px] text-[#57534E]">
                                    {isSillHere
                                      ? `Подоконный карниз ${flIdx + 2}-го этажа · привязан к низу окна · низ обрамления = 0`
                                      : 'Поясная лента на уровне межэтажного перекрытия'}
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  aria-pressed={isSillHere}
                                  onClick={() => toggleSingleBeltSillMode(flIdx)}
                                  className={`px-2.5 py-1 text-xs font-medium border transition-colors shrink-0 ${
                                    isSillHere
                                      ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412] hover:bg-[#7C2D12]'
                                      : 'bg-[#FBF9F5] text-[#1C1917] border-[#1C1917]/40 hover:bg-[#EAE3D5]'
                                  }`}
                                >
                                  {isSillHere
                                    ? 'Подоконный карниз активен — вернуть ленту'
                                    : 'Превратить ленту в подоконный карниз'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <p className="text-[11px] text-[#57534E] leading-relaxed">
                        Каждая включённая лента настраивается отдельно: при активации она поднимается до низа оконного проёма следующего этажа и следует за его отметкой, а нижняя часть обрамления окна на этом этаже исчезает (= 0).
                        {!isExamBlind &&
                          ' Высота: 1/12–1/6 высоты этажа, обязательно меньше главного карниза и цоколя (S. 16).'}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </CollapsibleSection>

            {/* Входные высоты и иерархия */}
            <CollapsibleSection title="Входные высоты и иерархия ленты" subtle>
              <div className="flex flex-wrap gap-4 text-xs text-[#1C1917]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.useFloorToFloorForBelt}
                    onChange={(e) => onUpdateParams({ useFloorToFloorForBelt: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Высота нижнего этажа от пола до пола'
                      : 'Высота нижнего этажа от пола до пола (S. 5)'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.allowModestFirstFloorForBelt}
                    onChange={(e) =>
                      onUpdateParams({ allowModestFirstFloorForBelt: e.target.checked })
                    }
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Скромный 1-й этаж'
                      : 'Скромный 1-й этаж: мягче порог < h/12 (S. 16)'}
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5] font-mono tabular-nums text-xs">
                  <span className="block text-[10px] text-[#78716C] uppercase">
                    Нижний этаж ({params.useFloorToFloorForBelt ? 'пол–пол' : 'в свету'})
                  </span>
                  <strong>
                    {formatMeters(
                      params.useFloorToFloorForBelt
                        ? summary.derivedGeometry.floor1FloorToFloor
                        : summary.derivedGeometry.H_max
                    )}{' '}
                    м
                  </strong>
                </div>
                <MeterControl
                  id="calc-belt-h-upper"
                  label="Верхний этаж h_верхн.эт (над лентой)"
                  value={params.beltUpperFloorHeight}
                  min={2.2}
                  max={6.0}
                  lockKey="beltUpperFloorHeight"
                  locked={isParamLocked(lockedParams, 'beltUpperFloorHeight')}
                  onToggleLock={onToggleLock}
                  onChange={(beltUpperFloorHeight) => onUpdateParams({ beltUpperFloorHeight })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-xs">
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">H_цоколя</span>
                  <strong>
                    {formatMeters(
                      params.useFullFloorAsSocle
                        ? summary.derivedGeometry.floor1FullHeight
                        : params.hSocle
                    )}{' '}
                    м
                  </strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">H_гл. карниза</span>
                  <strong>{formatMeters(params.hMain)} м</strong>
                </div>
              </div>

              {!isExamBlind && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-[#57534E]">
                    Допустимый диапазон ленты: {formatMeters(summary.beltHeightCheck.range[0])}–{formatMeters(summary.beltHeightCheck.range[1])} м
                  </span>
                  <button
                    type="button"
                    disabled={isParamLocked(lockedParams, 'hGurt')}
                    onClick={() => {
                      const effectiveSocleH = params.useFullFloorAsSocle
                        ? summary.derivedGeometry.floor1FullHeight
                        : params.hSocle;
                      const effectiveLowerH = params.useFloorToFloorForBelt
                        ? summary.derivedGeometry.floor1FloorToFloor
                        : summary.derivedGeometry.H_max;
                      const sillActive = hasAnySillBelt(params);
                      const mid = beltHeight(
                        {
                          hLowerFloor: effectiveLowerH,
                          hUpperFloor: params.beltUpperFloorHeight,
                          H_socle: effectiveSocleH,
                          H_mainCornice: params.hMain,
                          mode: params.beltMode,
                          type: params.beltType,
                          upperToLower: params.beltCrowningRatio,
                          hasColumnsBelow: params.beltHasColumnsBelow,
                          hasRustication: params.beltAsRusticationMode,
                        },
                        undefined,
                        { isSillCornice: sillActive }
                      );
                      onUpdateParams({
                        hGurt: mid.h,
                        ...(sillActive ? { hSillCornice: mid.h } : {}),
                        beltIsAbsent: false,
                        beltFloors:
                          hasAnyActiveBelt(params)
                            ? resolveBeltFloorsMask(params)
                            : Array.from({ length: Math.max(0, params.levels.floors.length - 1) }, () => true),
                      });
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#9A3412] hover:bg-[#EAE3D5] disabled:opacity-45"
                  >
                    Установить середину диапазона
                  </button>
                </div>
              )}

              <MeterControl
                id="calc-belt-height"
                label="Высота ленты H_ленты (Gurtgesims)"
                value={params.hGurt}
                min={0.10}
                max={1.2}
                disabled={!hasAnyActiveBelt(params) || params.buildingVariant === 'one-story'}
                lockKey="hGurt"
                locked={isParamLocked(lockedParams, 'hGurt')}
                onToggleLock={onToggleLock}
                onChange={(hGurt) =>
                  onUpdateParams({
                    hGurt,
                    ...(hasAnySillBelt(params) ? { hSillCornice: hGurt } : {}),
                  })
                }
              />

              <WhyBlock
                ruleId="gurt_cornice"
                status={summary.beltHeightCheck.status}
                sourceStatus={
                  !summary.gurtCheck.notRequired && !params.useFloorToFloorForBelt
                    ? 'heuristic'
                    : 'explicit-verified'
                }
                isHeuristic={!summary.gurtCheck.notRequired && !params.useFloorToFloorForBelt}
                formula={summary.beltHeightCheck.formula}
                page={summary.beltHeightCheck.page}
                explanation={summary.beltHeightCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>

            {/* Режим (связующая / венчающая) и класс 1-4 (S. 10–11) */}
            <CollapsibleSection title="Функция ленты и класс профиля (S. 10–11)">
              <div>
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                  Функция ленты (двойственность, S. 10)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'binding', label: 'Связующая (binding)' },
                      { id: 'crowning', label: 'Венчающая нижний этаж (crowning)' },
                    ] as { id: BeltMode; label: string }[]
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => onUpdateParams({ beltMode: m.id })}
                      className={`px-2.5 py-1 text-xs border ${
                        params.beltMode === m.id
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5DFD3] space-y-2">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                  Класс по составу профиля (S. 11)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {BELT_CLASSES.map((cls) => (
                    <button
                      key={cls.type}
                      type="button"
                      onClick={() => onUpdateParams({ beltType: cls.type as BeltClassType })}
                      className={`p-2 text-left text-[11px] border transition-colors ${
                        params.beltType === cls.type
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#F3EFE6]/45 text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      <strong className="block">{cls.titleRu}</strong>
                      <span className={params.beltType === cls.type ? 'text-[#D6CEBE]' : 'text-[#57534E]'}>
                        {cls.parts.join(' · ')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleSection>

            {/* Разбивка венчающей части и консоли (S. 10–11) */}
            <CollapsibleSection title="Венчающая часть: h_верх : h_низ и консоли (S. 10–11)" subtle>

              <MeterControl
                id="calc-belt-crown-ratio"
                label="Отношение h_верх : h_низ (норма 1:1, допустимо 0.50…2.00)"
                value={params.beltCrowningRatio}
                min={0.35}
                max={2.4}
                step={0.05}
                unit=":1"
                lockKey="beltCrowningRatio"
                locked={isParamLocked(lockedParams, 'beltCrowningRatio')}
                onToggleLock={onToggleLock}
                onChange={(beltCrowningRatio) => onUpdateParams({ beltCrowningRatio })}
              />

              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'neutral', label: 'Базовое 1:1', ratio: 1.0 },
                    { id: 'heavy', label: 'Тяжёлый (плита сверху)', ratio: 1.35 },
                    { id: 'light', label: 'Лёгкий (выкружка/гусёк)', ratio: 0.8 },
                  ] as { id: BeltEffect; label: string; ratio: number }[]
                ).map((ef) => (
                  <button
                    key={ef.id}
                    type="button"
                    onClick={() =>
                      onUpdateParams({
                        beltEffect: ef.id,
                        ...(isParamLocked(lockedParams, 'beltCrowningRatio')
                          ? {}
                          : { beltCrowningRatio: ef.ratio }),
                      })
                    }
                    className={`px-2.5 py-1 text-[11px] border ${
                      params.beltEffect === ef.id
                        ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                        : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE]'
                    }`}
                  >
                    {ef.label}
                  </button>
                ))}
              </div>

              <div>
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1">
                  Консоли в венчающей части / фризе (S. 10–11)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'none', label: 'Без консолей' },
                      { id: 'lying_lower', label: 'Лежачие в нижних обломах' },
                      { id: 'standing_frieze', label: 'Стоячие во фризе' },
                    ] as { id: BeltConsoleMode; label: string }[]
                  ).map((cm) => (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => onUpdateParams({ beltConsoleMode: cm.id })}
                      className={`px-2 py-1 text-[11px] border ${
                        params.beltConsoleMode === cm.id
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE]'
                      }`}
                    >
                      {cm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-xs">
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Верхние обломы h_верх</span>
                  <strong>{formatMeters(summary.beltCrowningCheck.hUpper)} м</strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">Нижние обломы h_низ</span>
                  <strong>{formatMeters(summary.beltCrowningCheck.hLower)} м</strong>
                </div>
              </div>

              <WhyBlock
                status={summary.beltCrowningCheck.status}
                sourceStatus="explicit-verified"
                formula={summary.beltCrowningCheck.formula}
                page={summary.beltCrowningCheck.page}
                explanation={summary.beltCrowningCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>

            {/* Спецслучаи, колоннада, рустовка, ризалиты и 3 схемы 3-этажного */}
            <CollapsibleSection title="Опоры, спецслучаи и схемы 3-этажного дома (S. 16–17, 22)">

              <div className="space-y-2 text-xs text-[#1C1917]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltHasColumnsBelow}
                    onChange={(e) => onUpdateParams({ beltHasColumnsBelow: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Колоннада или пилястры в нижнем этаже'
                      : 'Колоннада или пилястры в нижнем этаже (S. 17)'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltAsRusticationMode}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const boundaryCount = Math.max(0, params.levels.floors.length - 1);
                      const ensureMask = hasAnyActiveBelt(params)
                        ? resolveBeltFloorsMask(params)
                        : Array.from({ length: boundaryCount }, () => true);
                      onUpdateParams({
                        beltAsRusticationMode: checked,
                        ...(checked
                          ? { beltIsAbsent: false, beltFloors: ensureMask }
                          : {}),
                      });
                    }}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Лента заменена рустовкой / шовным членением'
                      : 'Лента заменена рустовкой / шовным членением (S. 16)'}
                  </span>
                </label>

                {params.beltAsRusticationMode && (
                  <label className="flex items-center gap-2 pl-5 cursor-pointer text-[#44403C]">
                    <input
                      type="checkbox"
                      checked={params.beltRusticationHasBaseProfile}
                      onChange={(e) =>
                        onUpdateParams({ beltRusticationHasBaseProfile: e.target.checked })
                      }
                      className="accent-[#9A3412]"
                    />
                    <span>
                      {isExamBlind
                        ? 'Рустовка опирается на базовый профиль (Fußprofil)'
                        : 'Рустовка опирается на базовый профиль (Fußprofil, S. 16)'}
                    </span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!hasAnyActiveBelt(params)}
                    onChange={(e) => {
                      const absent = e.target.checked;
                      const boundaryCount = Math.max(0, params.levels.floors.length - 1);
                      onUpdateParams({
                        beltIsAbsent: absent,
                        beltFloors: Array.from({ length: boundaryCount }, () => !absent),
                        ...(absent
                          ? {
                              beltSillFloors: Array.from({ length: boundaryCount }, () => false),
                              beltIsSillCornice: false,
                              beltAsRusticationMode: false,
                            }
                          : {}),
                      });
                    }}
                    className="accent-[#9A3412]"
                  />
                  <span>Все ленты отключены — этажи читаются как единое целое</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAnySillBelt(params)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const boundaryCount = Math.max(0, params.levels.floors.length - 1);
                      if (checked) {
                        const currentMask = resolveBeltFloorsMask(params);
                        const nextBeltMask = currentMask.some(Boolean)
                          ? currentMask
                          : Array.from({ length: boundaryCount }, (_, idx) => idx === 0);
                        onUpdateParams({
                          beltIsAbsent: false,
                          beltFloors: nextBeltMask,
                          beltSillFloors: nextBeltMask.map(Boolean),
                          beltIsSillCornice: true,
                          hSillCornice: params.hGurt,
                        });
                      } else {
                        onUpdateParams({
                          beltSillFloors: Array.from({ length: boundaryCount }, () => false),
                          beltIsSillCornice: false,
                          ...(params.threeStoryGurtMode === 'third_sohlbank'
                            ? { threeStoryGurtMode: 'both_gurt' as ThreeStoryGurtMode }
                            : {}),
                        });
                      }
                    }}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Лента = сплошной подоконный карниз (Sohlbankgesimse)'
                      : 'Лента = сплошной подоконный карниз (Sohlbankgesimse, N3)'}
                  </span>
                </label>

                {hasAnySillBelt(params) && (
                  <div className="pl-5 pt-1">
                    <MeterControl
                      id="calc-belt-sill-h"
                      label="Высота сплошного подоконного пояса h_подокон (N3 > u)"
                      value={params.hGurt}
                      min={0.1}
                      max={0.8}
                      lockKey="hSillCornice"
                      locked={isParamLocked(lockedParams, 'hSillCornice')}
                      onToggleLock={onToggleLock}
                      onChange={(val) => onUpdateParams({ hSillCornice: val, hGurt: val })}
                    />
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltOnlySillUnderSecond}
                    onChange={(e) =>
                      onUpdateParams({ beltOnlySillUnderSecond: e.target.checked })
                    }
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Только подоконный пояс под 2-м этажом'
                      : 'Только подоконный пояс под 2-м этажом (редко и проблем., S. 22)'}
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#E5DFD3]">
                  <input
                    type="checkbox"
                    checked={params.beltAlignsWithRecesses}
                    onChange={(e) => onUpdateParams({ beltAlignsWithRecesses: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>
                    {isExamBlind
                      ? 'Совпадает с западающими частями / ризалитами (Rücklagen)'
                      : 'Совпадает с западающими частями / ризалитами (Rücklagen, S. 22)'}
                  </span>
                </label>
              </div>

              {/* Переключатель схем 1–3 для 3-этажного дома (S. 22) */}
              {!isExamBlind && (
                <div className="pt-2 border-t border-[#E5DFD3] space-y-1.5">
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                    Схемы 1–3 для 3-этажного дома (S. 22)
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {([1, 2, 3] as ThreeStoryBeltSchemeNumber[]).map((num) => {
                      const activeScheme = schemeNumberFromGurtMode(params.threeStoryGurtMode) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() =>
                            onUpdateParams({
                              buildingVariant: 'multi-story',
                              multiSub: 'three',
                              floors: 3,
                              threeStoryGurtMode: gurtModeFromSchemeNumber(num),
                              beltIsAbsent: false,
                              beltFloors: num === 3 ? [true, false] : [true, true],
                              beltSillFloors: num === 2 ? [false, true] : [false, false],
                              beltIsSillCornice: num === 2,
                            })
                          }
                          className={`px-2.5 py-1.5 text-left text-[11px] border transition-colors ${
                            activeScheme
                              ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                              : 'bg-[#F3EFE6]/45 text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                          }`}
                        >
                          <strong>Схема {num}:</strong> {threeStoryBeltScheme(num)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {params.beltHasColumnsBelow && (
                <WhyBlock
                  ruleId="belt_crowning_and_special"
                  status={
                    summary.beltColumnsCheck.status === 'n/a'
                      ? 'ok'
                      : summary.beltColumnsCheck.status
                  }
                  sourceStatus="explicit-verified"
                  formula={summary.beltColumnsCheck.formula}
                  page={summary.beltColumnsCheck.page}
                  explanation={summary.beltColumnsCheck.explanation}
                  onOpenBookPage={effectiveOpenBookPage}
                />
              )}

              {params.beltAsRusticationMode && (
                <WhyBlock
                  ruleId="belt_crowning_and_special"
                  status={summary.beltRusticationCheck.status}
                  sourceStatus="explicit-verified"
                  formula={summary.beltRusticationCheck.formula}
                  page={summary.beltRusticationCheck.page}
                  explanation={summary.beltRusticationCheck.explanation}
                  onOpenBookPage={effectiveOpenBookPage}
                />
              )}

              {hasAnySillBelt(params) && (
                <WhyBlock
                  ruleId="n3_sill_cornice_over_u"
                  status={summary.sillCorniceCheck.status}
                  sourceStatus={summary.sillCorniceCheck.sourceStatus}
                  formula={summary.sillCorniceCheck.formula}
                  page={summary.sillCorniceCheck.page}
                  explanation={summary.sillCorniceCheck.explanation}
                  onOpenBookPage={effectiveOpenBookPage}
                />
              )}

              <WhyBlock
                ruleId="belt_crowning_and_special"
                status={summary.beltSpecialCheck.status}
                sourceStatus="explicit-verified"
                formula={summary.beltSpecialCheck.formula}
                page={summary.beltSpecialCheck.page}
                explanation={summary.beltSpecialCheck.explanation}
                onOpenBookPage={effectiveOpenBookPage}
                onOpenGlossaryTerm={effectiveOpenGlossaryTerm}
              />
            </CollapsibleSection>

            {/* Явное блок 12: Чего в источнике нет */}
            {!isExamBlind && (
              <CollapsibleSection
                title="Чего в источнике нет (межэтажные ленты)"
                badge={`${BELT_TEXT_GAPS.length} пункта`}
                defaultOpen={false}
                subtle
              >
                <div className="divide-y divide-[#E5DFD3]">
                  {BELT_TEXT_GAPS.map((gap) => (
                    <div key={gap.id} className="py-2.5 space-y-1 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-[#1C1917]">{gap.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 border border-[#9A3412]/40 bg-[#9A3412]/10 text-[#9A3412]">
                          {gap.tag}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#57534E]">{gap.detail}</p>
                    </div>
                  ))}
                </div>
              </CollapsibleSection>
            )}
          </div>
        )}

        {/* 4.9 Сводка фасада */}
        {!isExamBlind && activeModule === 'summary' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                  4.9. Сводка проверок фасада
                </h3>
                <p className="mt-1 text-xs text-[#57534E] font-mono tabular-nums">
                  OK: {summary.okCount} · Приближ.: {summary.approxCount} · Нарушения: {summary.violationCount}
                </p>
              </div>
              <StatusBadge
                status={summary.overallStatus}
                text={
                  summary.overallStatus === 'ok'
                    ? 'ФАСАД СОГЛАСОВАН'
                    : summary.overallStatus === 'approx'
                      ? 'ЕСТЬ ПРИБЛИЖЕНИЯ'
                      : `НАРУШЕНИЙ: ${summary.violationCount}`
                }
              />
            </div>

            <div className="divide-y divide-[#E5DFD3] border-t border-b border-[#E5DFD3]">
              {summary.checks.map((item) => {
                const excerpt = getExcerptForCheckId(item.id, item.page);
                const isViolation = item.status === 'violation';
                return (
                  <div
                    key={item.id}
                    className={`py-3 space-y-1.5 ${
                      isViolation
                        ? 'pl-3 -ml-1 border-l-4 border-l-[#B91C1C] bg-[#B91C1C]/[0.05] pr-2'
                        : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onHighlightElement(item.targetElement)}
                        className="text-left text-xs font-semibold text-[#1C1917] hover:text-[#9A3412] underline decoration-transparent hover:decoration-[#9A3412]/50 underline-offset-4 transition-colors"
                      >
                        {item.title}
                      </button>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={item.status} />
                        {effectiveOpenBookPage ? (
                          <button
                            type="button"
                            onClick={() => effectiveOpenBookPage(excerpt.pageNumber, excerpt)}
                            title="Открыть правило в читальном зале с подсветкой текста"
                            className="font-mono text-[11px] text-[#9A3412] underline underline-offset-4 hover:text-[#7C2D12]"
                          >
                            {item.page}
                          </button>
                        ) : (
                          <span className="font-mono text-[11px] text-[#78716C]">{item.page}</span>
                        )}
                      </div>
                    </div>
                    <p className="font-mono text-[11px] text-[#44403C] tabular-nums">
                      {item.valueText} · <span className="text-[#78716C]">{item.formula}</span>
                    </p>
                    <p className="font-mono text-[10px] text-[#78716C]">
                      {SOURCE_STATUS_LABELS[item.sourceStatus]}
                      {item.priority ? ` · ${item.priority}` : ''}
                      {item.isExpertOnly ? ' (Экспертный режим)' : ''}
                    </p>
                    <p className="text-xs text-[#57534E] leading-relaxed">{item.explanation}</p>
                    {isViolation && effectiveOpenBookPage && (
                      <button
                        type="button"
                        onClick={() => effectiveOpenBookPage(excerpt.pageNumber, excerpt)}
                        className="mt-1 inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium border border-[#B91C1C]/40 bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2] transition-colors"
                      >
                        <span>Открыть нарушенное правило в читальном зале (Стр. {excerpt.pageNumber}) →</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
    </ExamBlindContext.Provider>
  );
}
