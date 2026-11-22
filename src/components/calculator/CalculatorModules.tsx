import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
  A_from_H,
  A_from_pw,
  A_min_from_wu,
  BELT_CLASSES,
  BELT_TEXT_GAPS,
  H_from_A,
  PHI,
  RULES_DATA,
  VARIANT_TEXT_GAPS,
  applyBuildingVariantPreset,
  beltHeight,
  formatMeters,
  formatPercent,
  framing_from_module,
  gurtModeFromSchemeNumber,
  h_from_w_ratio,
  projection_45,
  projection_console,
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
  type CorniceVariantMode,
  type FacadeParameters,
  type FacadeSummary,
  type FacadeTargetElement,
  type FourFiveScheme,
  type MultiSub,
  type SocleMode,
  type ThreeStoryBeltSchemeNumber,
  type ThreeStoryGurtMode,
  type ValidationStatus,
} from '../../calc/rules';

export type CalculatorModuleId =
  | 'axes'
  | 'variants'
  | 'window'
  | 'corner'
  | 'framing'
  | 'pilaster'
  | 'cornice'
  | 'socle'
  | 'belt'
  | 'summary';

interface CalculatorModulesProps {
  activeModule: CalculatorModuleId;
  onSelectModule: (mod: CalculatorModuleId) => void;
  params: FacadeParameters;
  summary: FacadeSummary;
  onUpdateParams: (patch: Partial<FacadeParameters>) => void;
  onHighlightElement: (el: FacadeTargetElement | null) => void;
  onOpenBookPage?: (pageNum: number) => void;
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
  onChange: (val: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-medium text-[#1C1917]">
          {label}
        </label>
        <div className="flex items-center gap-1.5 shrink-0">
          <input
            id={`${id}-num`}
            type="number"
            value={Number.isFinite(value) ? Number(value.toFixed(3)) : 0}
            min={min}
            max={max * 2}
            step={step}
            disabled={disabled}
            aria-label={`${label} (${unit})`}
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
        disabled={disabled}
        value={Math.min(max, Math.max(min, Number.isFinite(value) ? value : min))}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[#9A3412] cursor-pointer disabled:opacity-45"
      />
      {note && <p className="text-[11px] text-[#78716C]">{note}</p>}
    </div>
  );
}

function WhyBlock({
  status,
  formula,
  page,
  explanation,
  isHeuristic,
  onOpenBookPage,
}: {
  status: ValidationStatus;
  formula: string;
  page: string;
  explanation: string;
  isHeuristic?: boolean;
  onOpenBookPage?: (pageNum: number) => void;
}) {
  const firstPageMatch = page.match(/\d+/);
  const pageNum = firstPageMatch ? parseInt(firstPageMatch[0], 10) : 5;

  return (
    <div className="mt-4 p-3.5 border border-[#D6CEBE] bg-[#F3EFE6]/60 space-y-2 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
            Почему так?
          </span>
          {isHeuristic && (
            <span className="font-mono text-[11px] text-[#9A3412]">· допущение/эвристика</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {onOpenBookPage ? (
            <button
              type="button"
              onClick={() => onOpenBookPage(pageNum)}
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
      <p className="text-xs leading-relaxed text-[#44403C]">{explanation}</p>
    </div>
  );
}

export function CalculatorModules({
  activeModule,
  onSelectModule,
  params,
  summary,
  onUpdateParams,
  onHighlightElement,
  onOpenBookPage,
}: CalculatorModulesProps) {
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
  const [moduleValue, setModuleValue] = useState(0.4);

  const modules: { id: CalculatorModuleId; label: string }[] = [
    { id: 'axes', label: 'Оси и простенки' },
    { id: 'variants', label: 'Этажность' },
    { id: 'window', label: 'Окно' },
    { id: 'corner', label: 'Угол (D)' },
    { id: 'framing', label: 'Обрамление' },
    { id: 'pilaster', label: 'Пилястр' },
    { id: 'cornice', label: 'Карниз' },
    { id: 'socle', label: 'Цоколь' },
    { id: 'belt', label: 'Лента (пояс)' },
    {
      id: 'summary',
      label:
        summary.violationCount > 0
          ? `Сводка (${summary.violationCount} нар.)`
          : 'Сводка',
    },
  ];

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
    <div className="border border-[#D6CEBE] bg-[#FBF9F5]">
      {/* Module tabs */}
      <div className="p-2 border-b border-[#E5DFD3] bg-[#F3EFE6]/70 flex flex-wrap gap-1">
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

      <div className="p-4 sm:p-5 space-y-5">
        {/* 4.1 Оси и простенки */}
        {activeModule === 'axes' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.1. Шаг осей (Axenweite) и простенки
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Выберите целевую величину для расчёта или проверьте текущие параметры (S. 5–6).
              </p>
            </div>

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
              <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-2.5">
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
                          onUpdateParams({ A: A_from_H(params.H, r.n, r.m) });
                        } else {
                          onUpdateParams({ H: H_from_A(params.A, r.n, r.m) });
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

            <div className="space-y-4">
              <MeterControl
                id="calc-H"
                label="Высота комнаты H_max (Zimmerhöhe)"
                value={params.H}
                min={2.2}
                max={6.5}
                disabled={axesSolveMode === 'find_H'}
                note="Для многоэтажного здания расчёт ведётся от наибольшей высоты комнаты (S. 5)."
                onChange={(H) => {
                  if (axesSolveMode === 'find_A') {
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
                onChange={(A) => {
                  if (axesSolveMode === 'find_H') {
                    const [n, m] = getActiveAxRatio();
                    onUpdateParams({ A, H: H_from_A(A, n, m) });
                  } else if (axesSolveMode === 'find_w') {
                    const wMax = params.withFraming ? Math.max(0.4, A / 2 - 2 * params.u) : w_max_from_A(A);
                    onUpdateParams({ A, w: wMax });
                  } else {
                    onUpdateParams({ A });
                  }
                }}
              />

              {axesSolveMode === 'find_p_A' && (
                <MeterControl
                  id="calc-target-p"
                  label="Заданный простенок p (для A = p + w)"
                  value={targetPierInput}
                  min={0.6}
                  max={3.5}
                  onChange={(pVal) => {
                    setTargetPierInput(pVal);
                    onUpdateParams({ A: A_from_pw(pVal, params.w) });
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
                onChange={(w) => {
                  if (axesSolveMode === 'find_p_A') {
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
                  onChange={(u) => onUpdateParams({ u })}
                />
              )}
            </div>

            {axesSolveMode === 'find_w' && (
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
                  {params.withFraming ? 'Видимый проём w_v' : 'Мин. шаг A_min'}
                </span>
                <strong className="text-sm text-[#1C1917]">
                  {params.withFraming
                    ? `${formatMeters('w_v' in summary.pierResult ? summary.pierResult.w_v : params.w)} м (A_min=${formatMeters(A_min_from_wu(params.w, params.u))})`
                    : `${formatMeters(2 * params.w)} м`}
                </strong>
              </div>
            </div>

            <WhyBlock
              status={summary.ahCheck.status}
              formula="A = H × (n/m)"
              page="S. 5–6"
              explanation={summary.ahCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />
            <WhyBlock
              status={summary.pierResult.status}
              formula={summary.pierResult.formula}
              page={summary.pierResult.page}
              explanation={summary.pierResult.explanation}
              onOpenBookPage={onOpenBookPage}
            />
          </div>
        )}

        {/* 4.1b Варианты этажности */}
        {activeModule === 'variants' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                Варианты этажности и пропорция фасада
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Автоматический пересчёт норм карнизов, предела A/H_max, ориентации прямоугольника и рекомендаций по осям (S. 5–6, 14–16, 21–23).
              </p>
            </div>

            {/* Выбор варианта этажности */}
            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-3">
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
                        { id: 'three', label: '3 этажа (идеал)' },
                        { id: 'four-five', label: '4–5 этажей (схемы A/B)' },
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

              {params.buildingVariant === 'multi-story' && params.multiSub === 'three' && (
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                    Вариант поясных тяг 3-этажного дома (S. 22)
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
                        onClick={() => onUpdateParams({ threeStoryGurtMode: m.id })}
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
                <div>
                  <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                    Схема членения 4–5 этажей (S. 23)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      [
                        { id: 'A', label: 'Схема A: 1=Цоколь / 2–4=Ствол / 5+K=Венец' },
                        { id: 'B', label: 'Схема B: 1+2=Нижний ярус / 3–5=Ствол / K' },
                      ] as { id: FourFiveScheme; label: string }[]
                    ).map((sc) => (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => onUpdateParams({ fourFiveScheme: sc.id })}
                        className={`px-2.5 py-1 text-[11px] border text-left ${
                          params.fourFiveScheme === sc.id
                            ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                            : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                        }`}
                      >
                        {sc.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Параметры осей и режима карниза */}
            <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#1C1917]">
                  Число оконных осей фасада (S. 14–16)
                </span>
                <div className="flex flex-wrap gap-1">
                  {[3, 4, 5, 6, 7, 8].map((ax) => (
                    <button
                      key={ax}
                      type="button"
                      onClick={() => onUpdateParams({ axesCount: ax })}
                      className={`px-2 py-1 text-[11px] font-mono border ${
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
                onChange={(val) => onUpdateParams({ axesCount: Math.max(2, Math.round(val)) })}
              />

              <label className="flex items-center gap-2 text-xs text-[#1C1917] cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.isEmbeddedInRow}
                  onChange={(e) => onUpdateParams({ isEmbeddedInRow: e.target.checked })}
                  className="accent-[#9A3412]"
                />
                <span>Встроенный в уличный ряд дом (допускает чётные оси при боковом входе, S. 14)</span>
              </label>

              <div className="pt-2 border-t border-[#E5DFD3]">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                  Режим оценки главного карниза (S. 16)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'full_entablature', label: 'Полный антаблемент (архитрав+фриз+карниз)' },
                      { id: 'crowning_only', label: 'Только венчающая часть (Kranz)' },
                    ] as { id: CorniceVariantMode; label: string }[]
                  ).map((cm) => (
                    <button
                      key={cm.id}
                      type="button"
                      onClick={() => onUpdateParams({ corniceVariantMode: cm.id })}
                      className={`px-2.5 py-1 text-[11px] border ${
                        params.corniceVariantMode === cm.id
                          ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                          : 'bg-[#FBF9F5] text-[#44403C] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {cm.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Паспорт норм выбранного варианта */}
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
                  {formatMeters(summary.variantInfo.rules.axisRatio.min, 2)}…
                  {formatMeters(summary.variantInfo.rules.axisRatio.max, 3)}
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

            {/* Примечания из источника */}
            <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-1.5 text-xs text-[#44403C]">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-[#1C1917]">{summary.variantInfo.labelRu}</strong>
                <span className="font-mono text-[11px] text-[#78716C]">
                  {summary.variantInfo.pages}
                </span>
              </div>
              {summary.variantInfo.notesRu.map((n, i) => (
                <p key={i} className="leading-relaxed">
                  • {n}
                </p>
              ))}
            </div>

            {/* Автоматические проверки варианта */}
            <WhyBlock
              status={summary.variantAxisCheck.status}
              formula={summary.variantAxisCheck.formula}
              page={summary.variantAxisCheck.page}
              isHeuristic={summary.variantAxisCheck.isWideBayHeuristic}
              explanation={summary.variantAxisCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />

            <WhyBlock
              status={summary.facadeRectCheck.status}
              formula={summary.facadeRectCheck.formula}
              page={summary.facadeRectCheck.page}
              explanation={summary.facadeRectCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />

            <WhyBlock
              status={summary.axesCountCheck.status}
              formula={summary.axesCountCheck.formula}
              page={summary.axesCountCheck.page}
              explanation={summary.axesCountCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />

            <WhyBlock
              status={summary.mainCorniceCheck.status}
              formula={summary.mainCorniceCheck.formula}
              page={summary.mainCorniceCheck.page}
              isHeuristic={summary.mainCorniceCheck.isExtrapolated}
              explanation={summary.mainCorniceCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />

            <WhyBlock
              status={summary.gurtCheck.status}
              formula={summary.gurtCheck.formula}
              page={summary.gurtCheck.page}
              explanation={summary.gurtCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />

            {/* Явное сообщение: чего в тексте нет */}
            <div className="p-3.5 border border-[#D6CEBE] bg-[#F3EFE6]/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-lg font-medium text-[#1C1917]">
                  Чего в тексте Brausewetter (1895) нет
                </h4>
                <span className="font-mono text-[11px] text-[#9A3412]">
                  явные пробелы и экстраполяции (6)
                </span>
              </div>
              <div className="divide-y divide-[#E5DFD3] border-t border-[#E5DFD3]">
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
            </div>
          </div>
        )}

        {/* 4.2 Окно */}
        {activeModule === 'window' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.2. Пропорции окна (Fensterproportionen)
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Пределы 1.5w ≤ h ≤ 2w, золотое сечение φ и правило половины диагонали (S. 6–7).
              </p>
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
                        let nextH = params.h;
                        let nextW = params.w;
                        if (opt === 'phi') {
                          if (winSolveMode === 'find_h') nextH = params.w * PHI;
                          else nextW = params.h / PHI;
                        } else if (opt === 'custom') {
                          if (winSolveMode === 'find_h') nextH = h_from_w_ratio(params.w, customWinN, customWinM);
                          else nextW = w_from_h_ratio(params.h, customWinN, customWinM);
                        } else {
                          const found = RULES_DATA.goldenApproximations.find((g) => g.label === opt);
                          if (found) {
                            if (winSolveMode === 'find_h') nextH = h_from_w_ratio(params.w, found.n, found.m);
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
                onChange={(w) => {
                  if (winSolveMode === 'find_h') {
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
                onChange={(h) => {
                  if (winSolveMode === 'find_w') {
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
                label="Допуск правила половины диагонали (допущение/эвристика)"
                value={params.diagTolerance * 100}
                min={1}
                max={10}
                step={0.5}
                unit="%"
                onChange={(pct) => onUpdateParams({ diagTolerance: pct / 100 })}
              />
            </div>

            <WhyBlock
              status={summary.windowCheck.rangeCheck.status}
              formula="1.5w ≤ h ≤ 2w"
              page="S. 6"
              explanation={summary.windowCheck.rangeCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />
            <WhyBlock
              status={summary.windowCheck.diagCheck.status}
              formula="d = √(w² + h²); проверка w ≤ d/2"
              page="S. 7"
              isHeuristic={summary.windowCheck.diagCheck.status === 'approx'}
              explanation={`${summary.windowCheck.diagCheck.explanation} Ближайшее приближение золотого сечения: ${summary.windowCheck.nearestApprox.spec.label}.`}
              onOpenBookPage={onOpenBookPage}
            />
          </div>
        )}

        {/* 4.3 Угловой простенок */}
        {activeModule === 'corner' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.3. Угловой простенок (Eckpfeiler)
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Расстояние от угла дома до первой оси D = k_D × A и чистая ширина угла p_corner (S. 4–5).
              </p>
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
                  onChange={(k_D) => onUpdateParams({ k_D })}
                />
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
                      onClick={() => onUpdateParams({ k_D: preset.val })}
                      className="px-2 py-1 text-[11px] font-mono border border-[#D6CEBE] bg-[#F3EFE6] hover:bg-[#EAE3D5]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
              status={summary.cornerCheck.status}
              formula={summary.cornerCheck.formula}
              page={summary.cornerCheck.page}
              explanation={`${summary.cornerCheck.explanation} ${summary.cornerCheck.recommendation}`}
              onOpenBookPage={onOpenBookPage}
            />
          </div>
        )}

        {/* 4.4 Обрамление окна */}
        {activeModule === 'framing' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.4. Обрамление и сандрик окна (R : F : K)
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Деление наличника (Rahmen), фриза (Fries) и венчающего карниза (Kranz), вынос по 45° и на консолях (S. 7–8).
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { id: 'by_T', label: 'По общей высоте T' },
                  { id: 'by_R', label: 'От модуля R' },
                  { id: 'by_F', label: 'От модуля F' },
                  { id: 'by_K', label: 'От модуля K' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setFramingInputMode(m.id);
                    if (m.id === 'by_R') setModuleValue(summary.framingResult.R);
                    if (m.id === 'by_F') setModuleValue(summary.framingResult.F);
                    if (m.id === 'by_K') setModuleValue(summary.framingResult.K);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium border ${
                    framingInputMode === m.id
                      ? 'bg-[#9A3412] text-[#FBF9F5] border-[#9A3412]'
                      : 'bg-[#F3EFE6] text-[#44403C] border-[#D6CEBE]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-2">
              <label className="block text-xs font-medium text-[#1C1917]">
                Отношение R : F : K (из текста S. 8)
              </label>
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
                      onClick={() => {
                        const nextRatio: [number, number, number] = [fr.r, fr.f, fr.k];
                        if (framingInputMode !== 'by_T') {
                          const part = framingInputMode === 'by_R' ? 'R' : framingInputMode === 'by_F' ? 'F' : 'K';
                          const res = framing_from_module(moduleValue, part, fr.r, fr.f, fr.k);
                          onUpdateParams({ framingRatio: nextRatio, T: res.T });
                        } else {
                          onUpdateParams({ framingRatio: nextRatio });
                        }
                      }}
                      className={`px-2 py-1 text-[11px] font-mono border ${
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
            </div>

            {framingInputMode === 'by_T' ? (
              <MeterControl
                id="calc-T"
                label="Общая высота сандрика T = R + F + K"
                value={params.T}
                min={0.3}
                max={2.0}
                onChange={(T) => onUpdateParams({ T, withFraming: true })}
              />
            ) : (
              <MeterControl
                id="calc-module-val"
                label={`Заданный модуль ${framingInputMode.slice(-1)}`}
                value={moduleValue}
                min={0.1}
                max={1.0}
                onChange={(val) => {
                  setModuleValue(val);
                  const part = framingInputMode === 'by_R' ? 'R' : framingInputMode === 'by_F' ? 'F' : 'K';
                  const [r, f, k] = params.framingRatio;
                  const res = framing_from_module(val, part, r, f, k);
                  onUpdateParams({ T: res.T, withFraming: true });
                }}
              />
            )}

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
                  onChange={(a_front) => onUpdateParams({ a_front })}
                />
                <MeterControl
                  id="calc-a-side"
                  label="Отступ с боков a_side"
                  value={params.a_side}
                  min={0.01}
                  max={0.25}
                  onChange={(a_side) => onUpdateParams({ a_side })}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-xs">
              <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                <span className="block text-[10px] text-[#78716C]">R (Rahmen)</span>
                <strong>{formatMeters(summary.framingResult.R)} м</strong>
              </div>
              <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                <span className="block text-[10px] text-[#78716C]">F (Fries)</span>
                <strong>{formatMeters(summary.framingResult.F)} м</strong>
              </div>
              <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                <span className="block text-[10px] text-[#78716C]">K (Kranz)</span>
                <strong>{formatMeters(summary.framingResult.K)} м</strong>
              </div>
            </div>

            <div className="p-2.5 border border-[#E5DFD3] bg-[#FBF9F5] font-mono text-xs flex flex-wrap justify-between gap-2">
              <span>Вынос 45°: <strong>{formatMeters(projection_45(summary.framingResult.K))} м</strong></span>
              <span>С консолями (5/6 K): <strong>{formatMeters(projection_console(summary.framingResult.K))} м</strong></span>
            </div>

            <WhyBlock
              status={summary.framingResult.status}
              formula={summary.framingResult.formula}
              page={summary.framingResult.page}
              explanation={summary.framingResult.explanation}
              onOpenBookPage={onOpenBookPage}
            />
            {params.withConsoles && (
              <WhyBlock
                status={summary.offsetCheck.status}
                formula={summary.offsetCheck.formula}
                page={summary.offsetCheck.page}
                explanation={summary.offsetCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />
            )}
          </div>
        )}

        {/* 4.5 Пилястр */}
        {activeModule === 'pilaster' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.5. Пилястры и лопатки (Pilaster / Mauerpfeiler)
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Предельный выступ v_max = W_p / 4; лёгкий декоративный диапазон — W_p / 6 … W_p / 5 (S. 11–12).
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'massive', label: 'Массивный характер (до W_p/4)' },
                  { id: 'light', label: 'Лёгкий характер (W_p/6…W_p/5)' },
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
              <span>Гладкая лопатка / стенной пилон (Mauerpfeiler) — без базы и капители</span>
            </label>

            <MeterControl
              id="calc-Wp"
              label="Ширина пилястра / лопатки W_p"
              value={params.Wp}
              min={0.25}
              max={1.4}
              onChange={(Wp) => onUpdateParams({ Wp })}
            />
            <MeterControl
              id="calc-v"
              label="Выступ пилястра v"
              value={params.v}
              min={0.02}
              max={0.45}
              onChange={(v) => onUpdateParams({ v })}
            />

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

            <WhyBlock
              status={summary.pilasterCheck.status}
              formula={summary.pilasterCheck.formula}
              page={summary.pilasterCheck.page}
              explanation={`${summary.pilasterCheck.explanation} ${summary.pilasterCheck.baseCapitalNote}`}
              onOpenBookPage={onOpenBookPage}
            />
          </div>
        )}

        {/* 4.6 Карниз */}
        {activeModule === 'cornice' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.6. Венчающая часть карниза (Kranz)
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Деление на верхние и нижние обломы h_u : h_l в пределах от 1:2 до 2:1 (норма 1:1, S. 10–11).
              </p>
            </div>

            <MeterControl
              id="calc-Tc"
              label="Общая высота венчающей части T_c"
              value={params.Tc}
              min={0.2}
              max={1.2}
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
              onChange={(corniceRatio) => onUpdateParams({ corniceRatio })}
            />

            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#1C1917]">
                  Характер профиля и доля плиты
                </span>
                <span className="font-mono text-[11px] text-[#9A3412]">
                  допущение/эвристика
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Тяжёлый (≥75 %)', share: 0.8 },
                  { label: 'Нейтральный (60 %)', share: 0.6 },
                  { label: 'Лёгкий (≤50 %)', share: 0.42 },
                ].map((pr) => (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => onUpdateParams({ plateShare: pr.share })}
                    className={`px-2.5 py-1 text-[11px] border ${
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
                note="Процентные пороги ≥75 % и ≤50 % — интерпретационное допущение UX поверх качественного описания S. 10–11."
                onChange={(pct) => onUpdateParams({ plateShare: pct / 100 })}
              />
            </div>

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
              status={summary.corniceCheck.status}
              formula={summary.corniceCheck.formula}
              page={summary.corniceCheck.page}
              explanation={summary.corniceCheck.explanation}
              onOpenBookPage={onOpenBookPage}
            />
          </div>
        )}

        {/* 4.7 Цоколь и поэтажная иерархия */}
        {activeModule === 'socle' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.7. Цоколь (Sockel), карнизы и рустика
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Высота цоколя (1/6…1/10 общей высоты), подчинённость главного и поясного карнизов, трёхчастное деление, ряды рустики и убывание вверх (S. 10, 12, 16–17, 22).
              </p>
            </div>

            {/* Этажность и общая высота здания */}
            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#1C1917]">Число этажей здания</span>
                <div className="flex flex-wrap gap-1">
                  {[1, 2, 3, 4, 5].map((fl) => (
                    <button
                      key={fl}
                      type="button"
                      onClick={() => onUpdateParams({ floors: fl })}
                      className={`px-2.5 py-1 text-[11px] font-mono border ${
                        params.floors === fl
                          ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                          : 'bg-[#FBF9F5] text-[#1C1917] border-[#D6CEBE] hover:bg-[#EAE3D5]'
                      }`}
                    >
                      {fl} эт.
                    </button>
                  ))}
                </div>
              </div>

              <MeterControl
                id="calc-total-height"
                label="Общая высота здания H_total"
                value={params.totalHeight}
                min={4.0}
                max={24.0}
                step={0.1}
                onChange={(totalHeight) => onUpdateParams({ totalHeight })}
              />

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
                      onClick={() => {
                        const res = socleHeight(params.totalHeight, mode.id as SocleMode);
                        onUpdateParams({
                          socleMode: mode.id,
                          hSocle: res.h,
                          useFullFloorAsSocle: false,
                        });
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium border transition-colors ${
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

              <MeterControl
                id="calc-h-socle"
                label="Высота цоколя h_socle"
                value={params.useFullFloorAsSocle ? params.H : params.hSocle}
                min={0.3}
                max={5.0}
                disabled={params.useFullFloorAsSocle}
                note={`Допустимый диапазон по S. 16: ${formatMeters(summary.socleHeightCheck.range[0])}–${formatMeters(summary.socleHeightCheck.range[1])} м.`}
                onChange={(hSocle) => onUpdateParams({ hSocle })}
              />

              <label className="flex items-start gap-2 text-xs text-[#1C1917] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={params.useFullFloorAsSocle}
                  onChange={(e) => onUpdateParams({ useFullFloorAsSocle: e.target.checked })}
                  className="accent-[#9A3412] mt-0.5"
                />
                <span>
                  Включить весь 1-й этаж в цоколь (S. 16, 22; H = {formatMeters(params.H)} м) —{' '}
                  <strong className={summary.fullFloorSocleCheck.applicable ? 'text-[#15803D]' : 'text-[#B91C1C]'}>
                    {summary.fullFloorSocleCheck.applicable ? 'применимо' : 'недостаточно высоты'}
                  </strong>
                </span>
              </label>

              <WhyBlock
                status={summary.socleHeightCheck.status}
                formula={summary.socleHeightCheck.formula}
                page={summary.socleHeightCheck.page}
                explanation={summary.socleHeightCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            {/* Главный и поясной карнизы */}
            <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
              <h4 className="font-display text-lg font-medium text-[#1C1917]">
                Иерархия карнизов (h_gurt &lt; h_main &lt; h_socle)
              </h4>

              <MeterControl
                id="calc-h-main"
                label="Главный карниз h_main (Hauptgesims)"
                value={params.hMain}
                min={0.15}
                max={2.5}
                note={
                  summary.mainCorniceCheck.isExtrapolated
                    ? `1-эт. экстраполяция ≥ ${formatMeters(summary.mainCorniceCheck.range[0])} м (в тексте не задано) и строго < h_socle.`
                    : `Диапазон для «${summary.variantInfo.shortLabelRu}»: ${formatMeters(summary.mainCorniceCheck.range[0])}–${formatMeters(summary.mainCorniceCheck.range[1])} м и строго < h_socle.`
                }
                onChange={(hMain) => onUpdateParams({ hMain })}
              />

              <WhyBlock
                status={summary.mainCorniceCheck.status}
                formula={summary.mainCorniceCheck.formula}
                page={summary.mainCorniceCheck.page}
                isHeuristic={summary.mainCorniceCheck.isExtrapolated}
                explanation={summary.mainCorniceCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />

              <MeterControl
                id="calc-h-gurt"
                label="Поясной карниз h_gurt (Gurtgesims)"
                value={params.hGurt}
                min={0.0}
                max={1.2}
                disabled={summary.gurtCheck.notRequired}
                note={
                  summary.gurtCheck.notRequired
                    ? 'Для 1-этажного дома междуэтажный поясной карниз отсутствует (gurt = null).'
                    : `От высоты этажа H=${formatMeters(params.H)} м (1/12…1/6): ${formatMeters(summary.gurtCheck.range[0])}–${formatMeters(summary.gurtCheck.range[1])} м.`
                }
                onChange={(hGurt) => onUpdateParams({ hGurt })}
              />

              <WhyBlock
                status={summary.gurtCheck.status}
                formula={summary.gurtCheck.formula}
                page={summary.gurtCheck.page}
                explanation={summary.gurtCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            {/* Трёхчастность цоколя и доминирование плиты */}
            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-[#1C1917]">
                  Трёхчастное деление цоколя и плита (S. 10)
                </span>
                <span className="font-mono text-[11px] text-[#9A3412]">
                  допущение/эвристика
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <MeterControl
                  id="calc-part-fuss"
                  label="Подножие (Fuß)"
                  value={params.socleParts.fuss * 100}
                  min={10}
                  max={45}
                  step={1}
                  unit="%"
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

              <p className="text-[11px] text-[#57534E]">{summary.threePartSocleResult.note}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DFD3]">
                <MeterControl
                  id="calc-socle-plate"
                  label="Высота плиты карниза цоколя"
                  value={params.hPlate}
                  min={0.04}
                  max={0.45}
                  onChange={(hPlate) => onUpdateParams({ hPlate })}
                />
                <MeterControl
                  id="calc-socle-other"
                  label="Сумма прочих обломов карниза"
                  value={params.hOtherSum}
                  min={0.02}
                  max={0.4}
                  onChange={(hOtherSum) => onUpdateParams({ hOtherSum })}
                />
              </div>

              <WhyBlock
                status={summary.plateCheck.status}
                formula={summary.plateCheck.formula}
                page={summary.plateCheck.page}
                isHeuristic={true}
                explanation={summary.plateCheck.note}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            {/* Рустика, убывание вверх и раскреповки */}
            <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
              <h4 className="font-display text-lg font-medium text-[#1C1917]">
                Рустика, убывание вверх и раскреповки (S. 10, 12, 17)
              </h4>

              <MeterControl
                id="calc-rust-row"
                label="Целевая высота ряда руста (норма 0.30–0.40 м)"
                value={params.rustRowHeight}
                min={0.22}
                max={0.48}
                onChange={(rustRowHeight) => onUpdateParams({ rustRowHeight })}
              />

              <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-xs">
                <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                  <span className="block text-[10px] text-[#78716C]">Число рядов n</span>
                  <strong>
                    {summary.rusticationCheck.n} ({summary.rusticationCheck.oddPreferred ? 'нечёт.' : 'чёт.'})
                  </strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                  <span className="block text-[10px] text-[#78716C]">Шаг ряда</span>
                  <strong>{formatMeters(summary.rusticationCheck.rowHeight)} м</strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#F3EFE6]/45">
                  <span className="block text-[10px] text-[#78716C]">Диапазон</span>
                  <strong>0.300–0.400 м</strong>
                </div>
              </div>

              <WhyBlock
                status={summary.rusticationCheck.status}
                formula={summary.rusticationCheck.formula}
                page={summary.rusticationCheck.page}
                explanation={summary.rusticationCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#E5DFD3]">
                <MeterControl
                  id="calc-rust-socle"
                  label="Высота руста цоколя"
                  value={params.hSocleRust}
                  min={0.2}
                  max={0.55}
                  onChange={(hSocleRust) => onUpdateParams({ hSocleRust })}
                />
                <MeterControl
                  id="calc-rust-eg"
                  label="Высота руста 1-го этажа (EG)"
                  value={params.hEgRust}
                  min={0.15}
                  max={0.5}
                  onChange={(hEgRust) => onUpdateParams({ hEgRust })}
                />
                <MeterControl
                  id="calc-prof-socle"
                  label="Вынос профиля цоколя"
                  value={params.vSocleProfile}
                  min={0.02}
                  max={0.15}
                  onChange={(vSocleProfile) => onUpdateParams({ vSocleProfile })}
                />
                <MeterControl
                  id="calc-prof-eg"
                  label="Вынос профиля 1-го этажа (EG)"
                  value={params.vEgProfile}
                  min={0.01}
                  max={0.15}
                  onChange={(vEgProfile) => onUpdateParams({ vEgProfile })}
                />
              </div>

              <WhyBlock
                status={summary.decreasingCheck.status}
                formula={summary.decreasingCheck.formula}
                page={summary.decreasingCheck.page}
                explanation={summary.decreasingCheck.explanation}
                onOpenBookPage={onOpenBookPage}
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
                status={summary.abkroepfungCheck.status}
                formula={summary.abkroepfungCheck.formula}
                page={summary.abkroepfungCheck.page}
                explanation={summary.abkroepfungCheck.note}
                onOpenBookPage={onOpenBookPage}
              />
            </div>
          </div>
        )}

        {/* 4.8 Межэтажные карнизы / ленты (Gurtgesims) */}
        {activeModule === 'belt' && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                4.8. Межэтажные карнизы — ленты (Gurtgesims)
              </h3>
              <p className="mt-1 text-xs text-[#57534E]">
                Двойственность ленты, диапазон h_нижн/12…h_нижн/6, соподчинение цоколю и главному карнизу, 4 класса профиля, разбивка венца 1:2…2:1 и спецслучаи (S. 10–11, 16–17, 22).
              </p>
            </div>

            {/* Входные высоты и иерархия */}
            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <MeterControl
                  id="calc-belt-h-lower"
                  label="Нижний этаж h_нижн.эт (под лентой)"
                  value={params.H}
                  min={2.2}
                  max={6.5}
                  onChange={(H) => onUpdateParams({ H })}
                />
                <MeterControl
                  id="calc-belt-h-upper"
                  label="Верхний этаж h_верхн.эт (над лентой)"
                  value={params.beltUpperFloorHeight}
                  min={2.2}
                  max={6.0}
                  onChange={(beltUpperFloorHeight) => onUpdateParams({ beltUpperFloorHeight })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono tabular-nums text-xs">
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">H_цоколя</span>
                  <strong>{formatMeters(params.useFullFloorAsSocle ? params.H : params.hSocle)} м</strong>
                </div>
                <div className="p-2 border border-[#E5DFD3] bg-[#FBF9F5]">
                  <span className="block text-[10px] text-[#78716C] uppercase">H_гл. карниза</span>
                  <strong>{formatMeters(params.hMain)} м</strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-[#57534E]">
                  Допустимый диапазон ленты: {formatMeters(summary.beltHeightCheck.range[0])}–{formatMeters(summary.beltHeightCheck.range[1])} м
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const effectiveSocleH = params.useFullFloorAsSocle ? params.H : params.hSocle;
                    const mid = beltHeight({
                      hLowerFloor: params.H,
                      hUpperFloor: params.beltUpperFloorHeight,
                      H_socle: effectiveSocleH,
                      H_mainCornice: params.hMain,
                      mode: params.beltMode,
                      type: params.beltType,
                      upperToLower: params.beltCrowningRatio,
                      hasColumnsBelow: params.beltHasColumnsBelow,
                      hasRustication: params.beltAsRusticationMode,
                    });
                    onUpdateParams({ hGurt: mid.h, beltIsAbsent: false });
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#9A3412] hover:bg-[#EAE3D5]"
                >
                  Установить середину диапазона
                </button>
              </div>

              <MeterControl
                id="calc-belt-height"
                label="Высота ленты H_ленты (Gurtgesims)"
                value={params.hGurt}
                min={0.12}
                max={1.2}
                disabled={params.beltIsAbsent || params.buildingVariant === 'one-story'}
                onChange={(hGurt) => onUpdateParams({ hGurt })}
              />

              <WhyBlock
                status={summary.beltHeightCheck.status}
                formula={summary.beltHeightCheck.formula}
                page={summary.beltHeightCheck.page}
                explanation={summary.beltHeightCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            {/* Режим (связующая / венчающая) и класс 1-4 (B-23) */}
            <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
              <div>
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C] mb-1.5">
                  Функция ленты (двойственность, B-1…B-5)
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
                  Класс по составу (B-23, S. 11)
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
            </div>

            {/* Разбивка венчающей части и консоли (B-15…B-22) */}
            <div className="p-3 border border-[#E5DFD3] bg-[#F3EFE6]/45 space-y-3">
              <h4 className="font-display text-lg font-medium text-[#1C1917]">
                Венчающая часть: h_верх : h_низ и консоли (S. 10–11)
              </h4>

              <MeterControl
                id="calc-belt-crown-ratio"
                label="Отношение h_верх : h_низ (норма 1:1, допустимо 0.50…2.00)"
                value={params.beltCrowningRatio}
                min={0.35}
                max={2.4}
                step={0.05}
                unit=":1"
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
                      onUpdateParams({ beltEffect: ef.id, beltCrowningRatio: ef.ratio })
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
                  Консоли в венчающей части / фризе (B-21…B-22)
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
                formula={summary.beltCrowningCheck.formula}
                page={summary.beltCrowningCheck.page}
                explanation={summary.beltCrowningCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            {/* Спецслучаи, колоннада, рустовка, ризалиты и 3 схемы 3-этажного */}
            <div className="p-3 border border-[#E5DFD3] bg-[#FBF9F5] space-y-3">
              <h4 className="font-display text-lg font-medium text-[#1C1917]">
                Опоры, спецслучаи и схемы 3-этажного дома (B-24…B-37)
              </h4>

              <div className="space-y-2 text-xs text-[#1C1917]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltHasColumnsBelow}
                    onChange={(e) => onUpdateParams({ beltHasColumnsBelow: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>Колоннада или пилястры в нижнем этаже (B-24…B-26)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltAsRusticationMode}
                    onChange={(e) =>
                      onUpdateParams({
                        beltAsRusticationMode: e.target.checked,
                        beltIsAbsent: e.target.checked ? false : params.beltIsAbsent,
                      })
                    }
                    className="accent-[#9A3412]"
                  />
                  <span>Лента заменена рустовкой / шовным членением (B-32…B-34)</span>
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
                    <span>Рустовка опирается на базовый профиль (Fußprofil, S. 16)</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltIsAbsent}
                    onChange={(e) =>
                      onUpdateParams({
                        beltIsAbsent: e.target.checked,
                        beltAsRusticationMode: e.target.checked
                          ? false
                          : params.beltAsRusticationMode,
                      })
                    }
                    className="accent-[#9A3412]"
                  />
                  <span>Лента отсутствует — этажи читаются как единое целое</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltIsSillCornice}
                    onChange={(e) => onUpdateParams({ beltIsSillCornice: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>Лента = сплошной подоконный карниз (Sohlbankgesimse)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={params.beltOnlySillUnderSecond}
                    onChange={(e) =>
                      onUpdateParams({ beltOnlySillUnderSecond: e.target.checked })
                    }
                    className="accent-[#9A3412]"
                  />
                  <span>Только подоконный пояс под 2-м этажом (без поясного, S. 22)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-[#E5DFD3]">
                  <input
                    type="checkbox"
                    checked={params.beltAlignsWithRecesses}
                    onChange={(e) => onUpdateParams({ beltAlignsWithRecesses: e.target.checked })}
                    className="accent-[#9A3412]"
                  />
                  <span>Совпадает с западающими частями / ризалитами (Rücklagen, B-27)</span>
                </label>
              </div>

              {/* Переключатель схем 1–3 для 3-этажного дома (B-37) */}
              <div className="pt-2 border-t border-[#E5DFD3] space-y-1.5">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-[#78716C]">
                  Схемы 1–3 для 3-этажного дома (B-37, S. 22)
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
                            beltIsAbsent: num === 3 ? false : params.beltIsAbsent,
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

              {params.beltHasColumnsBelow && (
                <WhyBlock
                  status={
                    summary.beltColumnsCheck.status === 'n/a'
                      ? 'ok'
                      : summary.beltColumnsCheck.status
                  }
                  formula={summary.beltColumnsCheck.formula}
                  page={summary.beltColumnsCheck.page}
                  explanation={summary.beltColumnsCheck.explanation}
                  onOpenBookPage={onOpenBookPage}
                />
              )}

              {params.beltAsRusticationMode && (
                <WhyBlock
                  status={summary.beltRusticationCheck.status}
                  formula={summary.beltRusticationCheck.formula}
                  page={summary.beltRusticationCheck.page}
                  explanation={summary.beltRusticationCheck.explanation}
                  onOpenBookPage={onOpenBookPage}
                />
              )}

              <WhyBlock
                status={summary.beltSpecialCheck.status}
                formula={summary.beltSpecialCheck.formula}
                page={summary.beltSpecialCheck.page}
                isHeuristic={params.beltIsSillCornice}
                explanation={summary.beltSpecialCheck.explanation}
                onOpenBookPage={onOpenBookPage}
              />
            </div>

            {/* Явный блок 12: Чего в источнике нет */}
            <div className="p-3.5 border border-[#D6CEBE] bg-[#F3EFE6]/70 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-display text-lg font-medium text-[#1C1917]">
                  Чего в источнике нет (межэтажные ленты)
                </h4>
                <span className="font-mono text-[11px] text-[#9A3412]">
                  не из источника / экстраполяция (6)
                </span>
              </div>
              <div className="divide-y divide-[#E5DFD3] border-t border-[#E5DFD3]">
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
            </div>
          </div>
        )}

        {/* 4.9 Сводка фасада */}
        {activeModule === 'summary' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                  4.8. Сводка проверок фасада
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
              {summary.checks.map((item) => (
                <div key={item.id} className="py-3 space-y-1.5">
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
                      <span className="font-mono text-[11px] text-[#78716C]">{item.page}</span>
                    </div>
                  </div>
                  <p className="font-mono text-[11px] text-[#44403C] tabular-nums">
                    {item.valueText} · <span className="text-[#78716C]">{item.formula}</span>
                  </p>
                  <p className="text-xs text-[#57534E] leading-relaxed">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
