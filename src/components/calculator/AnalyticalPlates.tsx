import {
  PHI,
  RULES_DATA,
  formatMeters,
  h_from_w_ratio,
  projection_45,
  projection_console,
  w_from_h_ratio,
  type FacadeParameters,
  type FacadeSummary,
} from '../../calc/rules';

interface AnalyticalPlatesProps {
  activePlate: 'fan' | 'golden' | 'diagonal' | 'cornice';
  onSelectPlate: (plate: 'fan' | 'golden' | 'diagonal' | 'cornice') => void;
  params: FacadeParameters;
  summary: FacadeSummary;
  onUpdateParams: (patch: Partial<FacadeParameters>) => void;
}

export function AnalyticalPlates({
  activePlate,
  onSelectPlate,
  params,
  summary,
  onUpdateParams,
}: AnalyticalPlatesProps) {
  const plateTabs: { id: 'fan' | 'golden' | 'diagonal' | 'cornice'; label: string; ref: string }[] = [
    { id: 'fan', label: 'Веер A : H', ref: 'S. 5–6' },
    { id: 'golden', label: 'Циркуль φ', ref: 'Fig. 2 / 4' },
    { id: 'diagonal', label: 'Диагональ d/2', ref: 'S. 7' },
    { id: 'cornice', label: 'Профиль карниза', ref: 'S. 8, 10–11' },
  ];

  return (
    <section className="border border-[#D6CEBE] bg-[#FBF9F5]">
      <div className="px-4 py-3 border-b border-[#E5DFD3] bg-[#F3EFE6]/60 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Геометрические номограммы и схемы"
          className="inline-flex flex-wrap items-center gap-1"
        >
          {plateTabs.map((tab) => {
            const active = activePlate === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectPlate(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-[#1C1917] text-[#FBF9F5] border-[#1C1917]'
                    : 'bg-[#FBF9F5] text-[#57534E] border-[#D6CEBE] hover:text-[#1C1917]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <span className="font-mono text-[11px] text-[#78716C]">
          {plateTabs.find((t) => t.id === activePlate)?.ref}
        </span>
      </div>

      <div className="p-4">
        {activePlate === 'fan' && <RatioFanPlate params={params} summary={summary} />}
        {activePlate === 'golden' && (
          <GoldenCompassPlate params={params} summary={summary} onUpdateParams={onUpdateParams} />
        )}
        {activePlate === 'diagonal' && <DiagonalTestPlate params={params} summary={summary} />}
        {activePlate === 'cornice' && <CorniceProfilePlate params={params} summary={summary} />}
      </div>
    </section>
  );
}

// 5.2 Веер отношений A:H
function RatioFanPlate({
  params,
  summary,
}: {
  params: FacadeParameters;
  summary: FacadeSummary;
}) {
  const rays = [...RULES_DATA.standardAxenRatios, ...RULES_DATA.limitAxenRatios];
  const W = 560;
  const Hsvg = 300;
  const padL = 56;
  const padR = 64;
  const padT = 24;
  const padB = 42;
  const plotW = W - padL - padR;
  const plotH = Hsvg - padT - padB;

  const maxH = Math.max(6.0, Math.ceil(params.H + 0.5));
  const maxA = Math.max(6.0, Math.ceil(params.A + 0.5));

  const xOf = (hVal: number) => padL + (hVal / maxH) * plotW;
  const yOf = (aVal: number) => padT + plotH - (aVal / maxA) * plotH;

  const nearest = summary.ahCheck.nearestAny;
  const ptX = xOf(Math.min(maxH, Math.max(0, params.H)));
  const ptY = yOf(Math.min(maxA, Math.max(0, params.A)));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
      <div className="xl:col-span-8">
        <svg viewBox={`0 0 ${W} ${Hsvg}`} className="w-full h-auto border border-[#E5DFD3] bg-[#FBF9F5]">
          {/* Grid */}
          {[1, 2, 3, 4, 5, 6].map((tick) => (
            <g key={tick}>
              {tick <= maxH && (
                <>
                  <line
                    x1={xOf(tick)}
                    y1={padT}
                    x2={xOf(tick)}
                    y2={padT + plotH}
                    stroke="#ECE7DC"
                    strokeWidth={1}
                  />
                  <text
                    x={xOf(tick)}
                    y={padT + plotH + 15}
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#78716C"
                  >
                    {tick}м
                  </text>
                </>
              )}
              {tick <= maxA && (
                <>
                  <line
                    x1={padL}
                    y1={yOf(tick)}
                    x2={padL + plotW}
                    y2={yOf(tick)}
                    stroke="#ECE7DC"
                    strokeWidth={1}
                  />
                  <text
                    x={padL - 8}
                    y={yOf(tick) + 3}
                    textAnchor="end"
                    fontSize="10"
                    fontFamily="IBM Plex Mono, monospace"
                    fill="#78716C"
                  >
                    {tick}м
                  </text>
                </>
              )}
            </g>
          ))}

          {/* Axes */}
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="#44403C" strokeWidth={1.2} />
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="#44403C" strokeWidth={1.2} />

          {/* Rays */}
          {rays.map((ray) => {
            const slope = ray.n / ray.m;
            // Intersect ray A = slope * H with box [0, maxH] x [0, maxA]
            const endH = Math.min(maxH, maxA / slope);
            const endA = slope * endH;
            const isNearest = ray.label === nearest.label;
            const isLimit = ray.label === '1:1' || ray.label === '1:2';
            return (
              <g key={ray.label}>
                <line
                  x1={xOf(0)}
                  y1={yOf(0)}
                  x2={xOf(endH)}
                  y2={yOf(endA)}
                  stroke={isNearest ? '#9A3412' : isLimit ? '#78716C' : '#B8AF9E'}
                  strokeWidth={isNearest ? 2 : 1}
                  strokeDasharray={isLimit && !isNearest ? '4 3' : undefined}
                />
                <text
                  x={xOf(endH) + 4}
                  y={yOf(endA) + 3}
                  fontSize="9.5"
                  fontFamily="IBM Plex Mono, monospace"
                  fontWeight={isNearest ? 600 : 400}
                  fill={isNearest ? '#9A3412' : '#57534E'}
                >
                  {ray.label}
                </text>
              </g>
            );
          })}

          {/* User point */}
          <line x1={ptX} y1={ptY} x2={ptX} y2={padT + plotH} stroke="#9A3412" strokeWidth={0.9} strokeDasharray="3 3" />
          <line x1={padL} y1={ptY} x2={ptX} y2={ptY} stroke="#9A3412" strokeWidth={0.9} strokeDasharray="3 3" />
          <circle cx={ptX} cy={ptY} r={5} fill="#9A3412" stroke="#FBF9F5" strokeWidth={1.5} />
          <text
            x={ptX + 8}
            y={ptY - 8}
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight={600}
            fill="#1C1917"
          >
            ({formatMeters(params.H, 2)}; {formatMeters(params.A, 2)})
          </text>

          {/* Axis labels */}
          <text
            x={padL + plotW / 2}
            y={Hsvg - 6}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#44403C"
          >
            Высота комнаты H (Zimmerhöhe), м
          </text>
          <text
            x={14}
            y={padT + plotH / 2}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#44403C"
            transform={`rotate(-90 14 ${padT + plotH / 2})`}
          >
            Шаг осей A (Axenweite), м
          </text>
        </svg>
      </div>

      <div className="xl:col-span-4 space-y-3 text-xs text-[#44403C]">
        <p className="font-display text-lg font-medium text-[#1C1917]">Номограмма лучей A : H</p>
        <dl className="divide-y divide-[#E5DFD3] font-mono tabular-nums">
          <div className="py-2 flex justify-between gap-2">
            <dt className="text-[#78716C]">Текущее A : H</dt>
            <dd className="font-medium text-[#1C1917]">{formatMeters(summary.ahCheck.ratio, 3)}</dd>
          </div>
          <div className="py-2 flex justify-between gap-2">
            <dt className="text-[#78716C]">Ближайший стандарт</dt>
            <dd className="font-medium text-[#9A3412]">{summary.ahCheck.nearestStandard.label}</dd>
          </div>
          <div className="py-2 flex justify-between gap-2">
            <dt className="text-[#78716C]">Ближайший луч (вкл. 1:1, 1:2)</dt>
            <dd className="font-medium text-[#1C1917]">{summary.ahCheck.nearestAny.label}</dd>
          </div>
          <div className="py-2 flex justify-between gap-2">
            <dt className="text-[#78716C]">Отклонение</dt>
            <dd className="font-medium text-[#1C1917]">
              {(summary.ahCheck.deviation * 100).toFixed(2)} %
            </dd>
          </div>
        </dl>
        <p className="text-[11px] leading-relaxed text-[#57534E]">
          Жилой дом: лучи 2:3–8:9; предельные случаи: 1:1 (дворец) и 1:2 (богатая колонная архитектура, S. 5–6).
        </p>
      </div>
    </div>
  );
}

// 5.3 Циркуль золотого сечения (Fig. 2 / Fig. 4)
function GoldenCompassPlate({
  params,
  summary,
  onUpdateParams,
}: {
  params: FacadeParameters;
  summary: FacadeSummary;
  onUpdateParams: (patch: Partial<FacadeParameters>) => void;
}) {
  const w = Math.max(0.4, params.w);
  const h = Math.max(0.5, params.h);
  const a = w; // меньший отрезок w
  const b = h - w; // остаток h - w

  // Чертим в SVG пропорционально
  const svgW = 420;
  const svgH = 260;
  const maxWinH = 190;
  const scale = maxWinH / Math.max(h, w * 1.8);
  const boxW = w * scale;
  const boxH = h * scale;
  const startX = 120;
  const baseY = 225;
  const topY = baseY - boxH;

  // Геометрическое построение по заданной ширине w (Fig. 2):
  // Квадрат на w, середина основания -> гипотенуза к вершине -> дуга вниз до h = w * φ
  const sqTopY = baseY - boxW;
  const midX = startX + boxW / 2;
  const radius = Math.hypot(boxW / 2, boxW);
  const arcEndX = midX + radius;
  const goldenBoxH = w * PHI * scale;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
      <div className="xl:col-span-7">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto border border-[#E5DFD3] bg-[#FBF9F5]">
          {/* Window rectangle w x h */}
          <rect
            x={startX}
            y={topY}
            width={boxW}
            height={boxH}
            fill="#E3EAED"
            stroke="#1C1917"
            strokeWidth={1.5}
          />
          {/* Square w x w */}
          <rect
            x={startX}
            y={sqTopY}
            width={boxW}
            height={boxW}
            fill="none"
            stroke="#9A3412"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {/* Midpoint & hypotenuse for golden section construction */}
          <line
            x1={midX}
            y1={baseY}
            x2={startX + boxW}
            y2={sqTopY}
            stroke="#9A3412"
            strokeWidth={1.1}
          />
          {/* Compass arc (Zirkelschlag) */}
          <path
            d={`M ${startX + boxW} ${sqTopY} A ${radius} ${radius} 0 0 1 ${arcEndX} ${baseY}`}
            fill="none"
            stroke="#9A3412"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
          <line
            x1={startX}
            y1={baseY}
            x2={arcEndX}
            y2={baseY}
            stroke="#57534E"
            strokeWidth={1}
          />
          {/* Ideal φ height marker */}
          <line
            x1={startX - 18}
            y1={baseY - goldenBoxH}
            x2={startX + boxW + 18}
            y2={baseY - goldenBoxH}
            stroke="#15803D"
            strokeWidth={1.1}
            strokeDasharray="5 2"
          />
          <text
            x={startX + boxW + 22}
            y={baseY - goldenBoxH + 3}
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#15803D"
          >
            φ·w = {formatMeters(w * PHI)} м
          </text>

          {/* Division b = h - w vs a = w */}
          <text
            x={startX + boxW / 2}
            y={sqTopY + boxW / 2 + 4}
            textAnchor="middle"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
            fill="#1C1917"
          >
            a = w = {formatMeters(a)}
          </text>
          {b > 0.05 && (
            <text
              x={startX + boxW / 2}
              y={topY + (sqTopY - topY) / 2 + 4}
              textAnchor="middle"
              fontSize="9.5"
              fontFamily="IBM Plex Mono, monospace"
              fill="#57534E"
            >
              b = h−w = {formatMeters(b)}
            </text>
          )}
          <text
            x={startX - 10}
            y={topY + boxH / 2}
            textAnchor="end"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
            fill="#1C1917"
          >
            h = {formatMeters(h)} м
          </text>
        </svg>
      </div>

      <div className="xl:col-span-5 space-y-3 text-xs text-[#44403C]">
        <p className="font-display text-lg font-medium text-[#1C1917]">
          Циркуль золотого сечения (a : b = b : (a + b))
        </p>
        <p className="text-[11px] leading-relaxed text-[#57534E]">
          Построение по Fig. 2 / Fig. 4 (S. 6–7): отрезок основания делится в среднем и крайнем отношении, давая идеальную высоту φ·w ≈ 1.618w.
        </p>

        <div className="grid grid-cols-1 gap-1.5 font-mono tabular-nums text-[11px] border-t border-b border-[#E5DFD3] py-2.5">
          <div className="flex justify-between">
            <span className="text-[#78716C]">Текущее отношение h / w:</span>
            <span className="font-semibold text-[#1C1917]">{formatMeters(summary.windowCheck.ratio, 3)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#78716C]">Ближайшее приближение:</span>
            <span className="font-semibold text-[#9A3412]">{summary.windowCheck.nearestApprox.spec.label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#78716C]">Отклонение от φ (1.618):</span>
            <span className="font-semibold text-[#1C1917]">
              {(summary.windowCheck.goldenDiffPct * 100).toFixed(2)} %
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => onUpdateParams({ h: w * PHI })}
            className="px-2.5 py-2 text-[11px] font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors text-left"
          >
            По ширине → высоту (φ)
          </button>
          <button
            type="button"
            onClick={() => onUpdateParams({ w: h / PHI })}
            className="px-2.5 py-2 text-[11px] font-medium border border-[#D6CEBE] bg-[#F3EFE6] text-[#1C1917] hover:bg-[#EAE3D5] transition-colors text-left"
          >
            По высоте → ширину (φ)
          </button>
          <button
            type="button"
            onClick={() => onUpdateParams({ h: h_from_w_ratio(w, 3, 5) })}
            className="px-2.5 py-2 text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#F3EFE6] transition-colors text-left"
          >
            Проверить 3:5 (h={formatMeters(h_from_w_ratio(w, 3, 5))})
          </button>
          <button
            type="button"
            onClick={() => onUpdateParams({ h: h_from_w_ratio(w, 5, 8) })}
            className="px-2.5 py-2 text-[11px] font-medium border border-[#D6CEBE] bg-[#FBF9F5] text-[#1C1917] hover:bg-[#F3EFE6] transition-colors text-left"
          >
            Проверить 5:8 (h={formatMeters(h_from_w_ratio(w, 5, 8))})
          </button>
        </div>
        <div className="text-[11px] text-[#78716C] font-mono">
          Для w={formatMeters(w_from_h_ratio(h, 3, 5))} м при h={formatMeters(h)} м (3:5)
        </div>
      </div>
    </div>
  );
}

// 5.4 Диагональный тест окна
function DiagonalTestPlate({
  params,
  summary,
}: {
  params: FacadeParameters;
  summary: FacadeSummary;
}) {
  const w = Math.max(0.4, params.w);
  const h = Math.max(0.5, params.h);
  const { d, halfD, strictPassed, deviationPct, status } = summary.windowCheck.diagCheck;
  const isApprox35 = Math.abs(h / w - 5 / 3) < 0.02;

  const svgW = 420;
  const svgH = 260;
  const scale = 185 / Math.max(h, w * 1.6);
  const boxW = w * scale;
  const boxH = h * scale;
  const x0 = 135;
  const y0 = 32;
  const x1 = x0 + boxW;
  const y1 = y0 + boxH;
  const halfR = halfD * scale;

  const statusColor =
    status === 'ok' ? '#15803D' : status === 'approx' ? '#B45309' : '#B91C1C';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
      <div className="xl:col-span-7">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto border border-[#E5DFD3] bg-[#FBF9F5]">
          <rect
            x={x0}
            y={y0}
            width={boxW}
            height={boxH}
            fill="#E3EAED"
            stroke="#1C1917"
            strokeWidth={1.5}
          />
          {/* Diagonal d */}
          <line x1={x0} y1={y1} x2={x1} y2={y0} stroke="#9A3412" strokeWidth={1.6} />
          {/* Midpoint of diagonal */}
          <circle cx={(x0 + x1) / 2} cy={(y0 + y1) / 2} r={3} fill="#9A3412" />
          {/* Arc of radius d/2 from bottom-left corner onto bottom edge */}
          <path
            d={`M ${x0} ${y1 - halfR} A ${halfR} ${halfR} 0 0 1 ${x0 + halfR} ${y1}`}
            fill="none"
            stroke={statusColor}
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />
          <line x1={x0} y1={y1 + 14} x2={x0 + halfR} y2={y1 + 14} stroke={statusColor} strokeWidth={1.5} />
          <line x1={x0} y1={y1 + 26} x2={x1} y2={y1 + 26} stroke="#1C1917" strokeWidth={1.2} />

          <text
            x={x0 + boxW / 2}
            y={y0 + boxH / 2 - 8}
            textAnchor="middle"
            fontSize="10"
            fontFamily="IBM Plex Mono, monospace"
            fill="#9A3412"
          >
            d = {formatMeters(d)} м
          </text>
          <text
            x={x0 + halfR + 8}
            y={y1 + 17}
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill={statusColor}
          >
            d/2 = {formatMeters(halfD)} м
          </text>
          <text
            x={x1 + 8}
            y={y1 + 29}
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#1C1917"
          >
            w = {formatMeters(w)} м
          </text>
        </svg>
      </div>

      <div className="xl:col-span-5 space-y-3 text-xs text-[#44403C]">
        <p className="font-display text-lg font-medium text-[#1C1917]">
          Правило половины диагонали (w ≤ d / 2)
        </p>
        <dl className="divide-y divide-[#E5DFD3] font-mono tabular-nums text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Диагональ d = √(w²+h²):</dt>
            <dd className="font-medium text-[#1C1917]">{formatMeters(d)} м</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Половина диагонали d/2:</dt>
            <dd className="font-medium text-[#1C1917]">{formatMeters(halfD)} м</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Ширина окна w:</dt>
            <dd className="font-medium text-[#1C1917]">{formatMeters(w)} м</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Отклонение от d/2:</dt>
            <dd style={{ color: statusColor }} className="font-semibold">
              {strictPassed ? '0.0 % (строго ok)' : `${(deviationPct * 100).toFixed(1)} %`}
            </dd>
          </div>
        </dl>

        {isApprox35 && (
          <div className="p-2.5 border border-[#D6CEBE] bg-[#F3EFE6]/80 text-[11px] text-[#44403C]">
            Для пропорции 3:5: <strong>практическое приближение, отклонение ≈ 2.9 %</strong> (S. 7). Допуск {(params.diagTolerance * 100).toFixed(0)} % — эвристика интерфейса.
          </div>
        )}
      </div>
    </div>
  );
}

// 5.5 Редактор/сечение профиля карниза
function CorniceProfilePlate({
  params,
  summary,
}: {
  params: FacadeParameters;
  summary: FacadeSummary;
}) {
  const { h_u, h_l } = summary.corniceCheck;
  const char = summary.corniceChar;
  const K = summary.framingResult.K;
  const v45 = projection_45(K);
  const vConsole = projection_console(K);

  const svgW = 540;
  const svgH = 260;
  const wallX = 115;
  const topY = 34;
  const totalPx = 155;
  const huPx = (h_u / Math.max(0.01, params.Tc)) * totalPx;
  const hlPx = totalPx - huPx;
  const platePx = huPx * params.plateShare;
  const cymaPx = Math.max(4, huPx - platePx);

  // Вынос карниза
  const projScale = 140;
  const overhangPx = Math.min(220, Math.max(70, (params.withConsoles ? vConsole : v45) * projScale + 65));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
      <div className="xl:col-span-8">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto border border-[#E5DFD3] bg-[#FBF9F5]">
          {/* Wall section */}
          <rect x={40} y={topY} width={wallX - 40} height={205} fill="#EAE3D3" stroke="#1C1917" strokeWidth={1.2} />

          {/* Upper moldings h_u: Плита (Hängeplatte) + верхний облом (выкружка/гусёк/ионик) */}
          <rect
            x={wallX}
            y={topY}
            width={overhangPx}
            height={Math.max(8, platePx)}
            fill="#DFD6C3"
            stroke="#1C1917"
            strokeWidth={1.3}
          />
          {cymaPx > 3 && (
            <path
              d={`M ${wallX} ${topY + platePx} L ${wallX + overhangPx * 0.78} ${topY + platePx} Q ${wallX + overhangPx * 0.68} ${topY + huPx} ${wallX + overhangPx * 0.55} ${topY + huPx} L ${wallX} ${topY + huPx} Z`}
              fill="#EFE8D7"
              stroke="#1C1917"
              strokeWidth={1.1}
            />
          )}

          {/* Lower moldings h_l: Полочка + вал + бусы + гусёк */}
          <rect
            x={wallX}
            y={topY + huPx}
            width={overhangPx * 0.52}
            height={Math.max(6, hlPx * 0.28)}
            fill="#E6DEC9"
            stroke="#1C1917"
            strokeWidth={1}
          />
          <path
            d={`M ${wallX} ${topY + huPx + hlPx * 0.28} L ${wallX + overhangPx * 0.45} ${topY + huPx + hlPx * 0.28} Q ${wallX + overhangPx * 0.48} ${topY + huPx + hlPx * 0.55} ${wallX + overhangPx * 0.32} ${topY + huPx + hlPx * 0.68} L ${wallX} ${topY + huPx + hlPx * 0.68} Z`}
            fill="#DFD6C3"
            stroke="#1C1917"
            strokeWidth={1}
          />
          <rect
            x={wallX}
            y={topY + huPx + hlPx * 0.68}
            width={overhangPx * 0.26}
            height={Math.max(4, hlPx * 0.32)}
            fill="#EAE3D3"
            stroke="#1C1917"
            strokeWidth={1}
          />

          {/* Console under cornice if active */}
          {params.withConsoles && (
            <g>
              <path
                d={`M ${wallX} ${topY + totalPx} L ${wallX + overhangPx * 0.74} ${topY + totalPx} L ${wallX + overhangPx * 0.64} ${topY + totalPx + 36} Q ${wallX + overhangPx * 0.28} ${topY + totalPx + 42} ${wallX} ${topY + totalPx + 42} Z`}
                fill="#D6CEBE"
                stroke="#9A3412"
                strokeWidth={1.2}
              />
              {/* Отступ a от плитки консоли до слезника */}
              <line
                x1={wallX + overhangPx * 0.74}
                y1={topY + totalPx + 14}
                x2={wallX + overhangPx}
                y2={topY + totalPx + 14}
                stroke="#9A3412"
                strokeWidth={1.3}
              />
              <text
                x={wallX + overhangPx + 6}
                y={topY + totalPx + 17}
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
                fill="#9A3412"
              >
                a_front = {formatMeters(params.a_front)} = a_side ({formatMeters(params.a_side)})
              </text>
            </g>
          )}

          {/* 45° angle guideline */}
          <line
            x1={wallX}
            y1={topY + totalPx}
            x2={wallX + totalPx}
            y2={topY}
            stroke="#9A3412"
            strokeWidth={1.1}
            strokeDasharray="4 3"
          />
          <text
            x={wallX + totalPx * 0.56}
            y={topY + totalPx * 0.52}
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#9A3412"
          >
            45°
          </text>

          {/* Annotations */}
          <text x={wallX + overhangPx + 10} y={topY + huPx / 2 + 3} fontSize="10" fontFamily="IBM Plex Mono, monospace" fill="#1C1917">
            Верхние обломы h_u = {formatMeters(h_u)} м (плита {(params.plateShare * 100).toFixed(0)} %)
          </text>
          <text x={wallX + overhangPx * 0.56 + 10} y={topY + huPx + hlPx / 2 + 3} fontSize="10" fontFamily="IBM Plex Mono, monospace" fill="#57534E">
            Нижние h_l = {formatMeters(h_l)} м (вал, бусы, гусёк, полочка)
          </text>
          <text x={14} y={topY + totalPx / 2} fontSize="9.5" fontFamily="IBM Plex Mono, monospace" fill="#44403C">
            T_c={formatMeters(params.Tc)}
          </text>
        </svg>
      </div>

      <div className="xl:col-span-4 space-y-2.5 text-xs text-[#44403C]">
        <p className="font-display text-lg font-medium text-[#1C1917]">Профиль и вынос карниза</p>
        <dl className="divide-y divide-[#E5DFD3] font-mono tabular-nums text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Деление h_u : h_l</dt>
            <dd className="font-medium text-[#1C1917]">{formatMeters(params.corniceRatio, 2)} : 1</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Вынос по 45° (K):</dt>
            <dd className="font-medium text-[#1C1917]">{formatMeters(v45)} м</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">С консолями (5/6 K):</dt>
            <dd className="font-medium text-[#9A3412]">{formatMeters(vConsole)} м</dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Характер (эвристика):</dt>
            <dd className="font-medium text-[#1C1917]">
              {char === 'heavy' ? 'тяжёлый (≥75 %)' : char === 'light' ? 'лёгкий (≤50 %)' : 'нейтральный'}
            </dd>
          </div>
        </dl>
        <p className="text-[11px] leading-relaxed text-[#57534E]">
          Чередование острого и мягкого: плита, полочка, выкружка, вал, гусёк, ионик, бусы (S. 9–11).
        </p>
      </div>
    </div>
  );
}
