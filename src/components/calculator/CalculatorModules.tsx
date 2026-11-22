import { useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
  A_from_H,
  A_from_pw,
  A_min_from_wu,
  H_from_A,
  PHI,
  RULES_DATA,
  formatMeters,
  framing_from_module,
  h_from_w_ratio,
  projection_45,
  projection_console,
  w_from_h_ratio,
  w_max_from_A,
  type FacadeParameters,
  type FacadeSummary,
  type FacadeTargetElement,
  type ValidationStatus,
} from '../../calc/rules';

export type CalculatorModuleId =
  | 'axes'
  | 'window'
  | 'corner'
  | 'framing'
  | 'pilaster'
  | 'cornice'
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
    { id: 'window', label: 'Окно' },
    { id: 'corner', label: 'Угол (D)' },
    { id: 'framing', label: 'Обрамление' },
    { id: 'pilaster', label: 'Пилястр' },
    { id: 'cornice', label: 'Карниз' },
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
                if (m.id === 'axes') onHighlightElement('axenweite');
                else if (m.id === 'window') onHighlightElement('window');
                else if (m.id === 'corner') onHighlightElement('corner');
                else if (m.id === 'framing') onHighlightElement('entablature');
                else if (m.id === 'pilaster') onHighlightElement('pilaster');
                else if (m.id === 'cornice') onHighlightElement('cornice');
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

        {/* 4.7 Сводка фасада */}
        {activeModule === 'summary' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-2xl font-medium text-[#1C1917]">
                  4.7. Сводка проверок фасада
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
