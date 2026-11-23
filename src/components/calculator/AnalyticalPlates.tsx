import {
  BELT_CLASSES,
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

export type AnalyticalPlateId = 'fan' | 'golden' | 'diagonal' | 'cornice' | 'socle' | 'belt';

interface AnalyticalPlatesProps {
  activePlate: AnalyticalPlateId;
  onSelectPlate: (plate: AnalyticalPlateId) => void;
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
  const plateTabs: { id: AnalyticalPlateId; label: string; ref: string }[] = [
    { id: 'fan', label: 'Веер A : H', ref: 'S. 5–6' },
    { id: 'golden', label: 'Циркуль φ', ref: 'Fig. 2 / 4' },
    { id: 'diagonal', label: 'Диагональ d/2', ref: 'S. 7' },
    { id: 'cornice', label: 'Профиль карниза', ref: 'S. 8, 10–11' },
    { id: 'socle', label: 'Иерархия и цоколь', ref: 'S. 10, 16–17' },
    { id: 'belt', label: 'Разрез ленты (Gurt)', ref: 'S. 10–11, 16–17, 22' },
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
        {activePlate === 'socle' && <SocleHierarchyPlate params={params} summary={summary} />}
        {activePlate === 'belt' && <BeltProfilePlate params={params} summary={summary} />}
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

// 5.6 Иерархия цоколя и карнизов (S. 10, 16–17)
function SocleHierarchyPlate({
  params,
  summary,
}: {
  params: FacadeParameters;
  summary: FacadeSummary;
}) {
  const effectiveSocleH = params.useFullFloorAsSocle
    ? summary.derivedGeometry.floor1FullHeight
    : params.hSocle;
  const { fuss, rumpf, deck } = summary.threePartSocleResult;
  const totalParts = Math.max(0.01, fuss + rumpf + deck);
  const { n, rowHeight, oddPreferred } = summary.rusticationCheck;

  const svgW = 540;
  const svgH = 260;

  // Левая половина: 3-частный цоколь с рядами руста
  const secX = 48;
  const secW = 110;
  const secTopY = 30;
  const secH = 195;
  const deckH = Math.max(14, (deck / totalParts) * secH);
  const fussH = Math.max(14, (fuss / totalParts) * secH);
  const rumpfH = Math.max(24, secH - deckH - fussH);
  const nCourses = Math.min(12, Math.max(1, n));

  // Правая половина: сравнение шкал h_socle, h_main, h_gurt + [min, max]
  const chartX = 240;
  const chartW = 250;
  const maxBarM = Math.max(
    effectiveSocleH,
    summary.socleHeightCheck.range[1],
    params.hMain,
    summary.mainCorniceCheck.range[1],
    params.hGurt,
    0.5
  ) * 1.12;
  const barX = (valM: number) => (Math.max(0, valM) / maxBarM) * chartW;

  const bars = [
    {
      label: `Цоколь h_socle (${formatMeters(effectiveSocleH)} м)`,
      val: effectiveSocleH,
      range: summary.socleHeightCheck.range,
      status: summary.socleHeightCheck.status,
      y: 52,
    },
    {
      label: `Главный карниз h_main (${formatMeters(params.hMain)} м)`,
      val: params.hMain,
      range: summary.mainCorniceCheck.range,
      status: summary.mainCorniceCheck.status,
      y: 118,
    },
    {
      label: `Поясной карниз h_gurt (${formatMeters(params.hGurt)} м)`,
      val: params.hGurt,
      range: summary.gurtCheck.range,
      status: summary.gurtCheck.status,
      y: 184,
    },
  ];

  const colorOf = (s: 'ok' | 'approx' | 'violation') =>
    s === 'ok' ? '#15803D' : s === 'approx' ? '#B45309' : '#B91C1C';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
      <div className="xl:col-span-8">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto border border-[#E5DFD3] bg-[#FBF9F5]">
          {/* 3-part socle section */}
          <rect
            x={secX - 8}
            y={secTopY}
            width={secW + 16}
            height={deckH}
            fill="#DFD6C3"
            stroke="#1C1917"
            strokeWidth={1.2}
          />
          <rect
            x={secX}
            y={secTopY + deckH}
            width={secW}
            height={rumpfH}
            fill="#EAE3D3"
            stroke="#1C1917"
            strokeWidth={1.2}
          />
          {Array.from({ length: Math.max(0, nCourses - 1) }).map((_, i) => {
            const ry = secTopY + deckH + ((i + 1) / nCourses) * rumpfH;
            return (
              <line
                key={i}
                x1={secX}
                y1={ry}
                x2={secX + secW}
                y2={ry}
                stroke="#57534E"
                strokeWidth={0.9}
              />
            );
          })}
          <rect
            x={secX - 10}
            y={secTopY + deckH + rumpfH}
            width={secW + 20}
            height={fussH}
            fill="#D6CEBE"
            stroke="#1C1917"
            strokeWidth={1.2}
          />

          <text
            x={secX + secW / 2}
            y={secTopY + deckH / 2 + 3}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#1C1917"
          >
            Deck {formatMeters(deck, 2)} м
          </text>
          <text
            x={secX + secW / 2}
            y={secTopY + deckH + rumpfH / 2 + 3}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#1C1917"
          >
            Rumpf ({n} ряд.)
          </text>
          <text
            x={secX + secW / 2}
            y={secTopY + deckH + rumpfH + fussH / 2 + 3}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#1C1917"
          >
            Fuß {formatMeters(fuss, 2)} м
          </text>
          <text
            x={secX + secW / 2}
            y={svgH - 12}
            textAnchor="middle"
            fontSize="9.5"
            fontFamily="IBM Plex Mono, monospace"
            fill="#57534E"
          >
            3 части (эвристика)
          </text>

          {/* Hierarchy Bars */}
          <text
            x={chartX}
            y={28}
            fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight={600}
            fill="#1C1917"
          >
            Шкала иерархии и допусков [min…max]
          </text>

          {bars.map((b) => {
            const bandX = chartX + barX(b.range[0]);
            const bandW = Math.max(4, barX(b.range[1]) - barX(b.range[0]));
            const valW = Math.max(4, barX(b.val));
            const col = colorOf(b.status);
            return (
              <g key={b.label}>
                <text
                  x={chartX}
                  y={b.y - 7}
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#44403C"
                >
                  {b.label}
                </text>
                {/* Track */}
                <rect x={chartX} y={b.y} width={chartW} height={18} fill="#F3EFE6" stroke="#E5DFD3" strokeWidth={1} />
                {/* Allowed range band */}
                <rect
                  x={bandX}
                  y={b.y - 3}
                  width={bandW}
                  height={24}
                  fill="#9A3412"
                  fillOpacity={0.14}
                  stroke="#9A3412"
                  strokeWidth={1}
                  strokeDasharray="3 2"
                />
                {/* Actual bar */}
                <rect x={chartX} y={b.y + 3} width={valW} height={12} fill={col} />
                <text
                  x={chartX}
                  y={b.y + 31}
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#78716C"
                >
                  Норма: [{formatMeters(b.range[0], 2)} … {formatMeters(b.range[1], 2)}] м
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="xl:col-span-4 space-y-2.5 text-xs text-[#44403C]">
        <p className="font-display text-lg font-medium text-[#1C1917]">Цоколь и соподчинение</p>
        <dl className="divide-y divide-[#E5DFD3] font-mono tabular-nums text-[11px]">
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">h_socle / H_total:</dt>
            <dd className="font-medium text-[#1C1917]">
              {(effectiveSocleH / Math.max(0.01, summary.derivedGeometry.totalHeight) * 100).toFixed(1)} % (1/{formatMeters(summary.derivedGeometry.totalHeight / Math.max(0.01, effectiveSocleH), 1)})
            </dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">h_gurt &lt; h_main &lt; h_socle:</dt>
            <dd className="font-medium text-[#1C1917]">
              {formatMeters(params.hGurt, 2)} &lt; {formatMeters(params.hMain, 2)} &lt; {formatMeters(effectiveSocleH, 2)}
            </dd>
          </div>
          <div className="py-1.5 flex justify-between">
            <dt className="text-[#78716C]">Ряды руста:</dt>
            <dd className="font-medium text-[#9A3412]">
              {n} ({oddPreferred ? 'нечёт.' : 'чёт.'}) × {formatMeters(rowHeight)} м
            </dd>
          </div>
        </dl>
        <p className="text-[11px] leading-relaxed text-[#57534E]">
          Главный карниз должен быть меньше цоколя, а поясной — меньше главного карниза; рустика и профили смягчаются кверху (S. 10, 16–17).
        </p>
      </div>
    </div>
  );
}

// 5.7 Разрез межэтажной ленты (Gurtgesims, S. 10–11, 16–17, 22)
function BeltProfilePlate({
  params,
  summary,
}: {
  params: FacadeParameters;
  summary: FacadeSummary;
}) {
  const beltMeta = BELT_CLASSES.find((c) => c.type === params.beltType) ?? BELT_CLASSES[2];
  const { hUpper, hLower, hCrown, effect } = summary.beltCrowningCheck;
  const beltStatus: 'ok' | 'approx' | 'violation' =
    summary.beltHeightCheck.status === 'violation' ||
    summary.beltCrowningCheck.status === 'violation' ||
    summary.beltColumnsCheck.status === 'violation' ||
    summary.beltSpecialCheck.status === 'violation'
      ? 'violation'
      : summary.beltCrowningCheck.status === 'approx' ||
          summary.beltSpecialCheck.status === 'approx'
        ? 'approx'
        : 'ok';

  const accentStroke =
    beltStatus === 'violation'
      ? '#B91C1C'
      : beltStatus === 'approx'
        ? '#B45309'
        : '#1C1917';

  const svgW = 540;
  const svgH = 270;
  const wallX = 72;
  const wallW = 86;
  const totalBeltPx = 148;
  const topY = 48;
  const crownPx = totalBeltPx * beltMeta.crownShareOfBelt;
  const subPx = totalBeltPx - crownPx;
  const upperPx = (hUpper / Math.max(0.01, hCrown)) * crownPx;
  const lowerPx = crownPx - upperPx;

  // Условный «умеренный вынос» для схематического разреза (число в книге не задано)
  const outX = wallX + wallW;
  const crownReach = params.beltMode === 'crowning' ? 102 : 78;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-center">
      <div className="xl:col-span-8">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto border border-[#E5DFD3] bg-[#FBF9F5]">
          {/* Заголовок разреза */}
          <text
            x={16}
            y={22}
            fontSize="10.5"
            fontFamily="IBM Plex Mono, monospace"
            fontWeight={600}
            fill={accentStroke}
          >
            Разрез пояса · {beltMeta.titleRu} ({params.beltMode === 'binding' ? 'связующая' : 'венчающая'})
          </text>

          {/* Тело стены (верхний и нижний этажи) */}
          <rect x={wallX} y={32} width={wallW} height={212} fill="#EAE3D3" stroke="#44403C" strokeWidth={1.2} />
          <line x1={wallX} y1={32} x2={outX} y2={32} stroke="#44403C" strokeDasharray="3 3" strokeWidth={0.9} />
          <text
            x={wallX + 6}
            y={44}
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            fill="#57534E"
          >
            Верхн. этаж ({formatMeters(params.beltUpperFloorHeight, 2)}м)
          </text>
          <text
            x={wallX + 6}
            y={236}
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            fill="#57534E"
          >
            Нижн. этаж ({formatMeters(params.useFloorToFloorForBelt ? summary.derivedGeometry.floor1FloorToFloor : summary.derivedGeometry.H_max, 2)}м)
          </text>

          {/* Режим замены рустовкой */}
          {params.beltAsRusticationMode ? (
            <g>
              {[0, 1, 2].map((rIdx) => (
                <rect
                  key={rIdx}
                  x={outX}
                  y={topY + rIdx * 34}
                  width={22}
                  height={28}
                  fill="#DFD6C3"
                  stroke={accentStroke}
                  strokeWidth={1}
                />
              ))}
              {params.beltRusticationHasBaseProfile ? (
                <path
                  d={`M ${outX} ${topY + 104} H ${outX + 42} V ${topY + 120} Q ${outX + 18} ${topY + 122} ${outX} ${topY + 132} Z`}
                  fill="#D6CEBE"
                  stroke={accentStroke}
                  strokeWidth={1.3}
                />
              ) : (
                <text
                  x={outX + 16}
                  y={topY + 122}
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#B91C1C"
                  fontWeight={600}
                >
                  ✕ Отсутствует базовый профиль (Fußprofil, S. 16)
                </text>
              )}
              <text
                x={outX + 54}
                y={topY + 46}
                fontSize="10"
                fontFamily="IBM Plex Mono, monospace"
                fill="#1C1917"
              >
                Шовное членение (Fugenteilung)
              </text>
              <text
                x={outX + 54}
                y={topY + 118}
                fontSize="10"
                fontFamily="IBM Plex Mono, monospace"
                fill={params.beltRusticationHasBaseProfile ? '#15803D' : '#B91C1C'}
              >
                {params.beltRusticationHasBaseProfile ? 'Опора: базовый профиль (Fußprofil)' : 'Ошибка опоры!'}
              </text>
            </g>
          ) : params.beltIsAbsent ? (
            <g>
              <line
                x1={outX - 10}
                y1={topY + totalBeltPx / 2}
                x2={outX + 140}
                y2={topY + totalBeltPx / 2}
                stroke={accentStroke}
                strokeWidth={1.2}
                strokeDasharray="5 4"
              />
              <text
                x={outX + 16}
                y={topY + totalBeltPx / 2 - 10}
                fontSize="10"
                fontFamily="IBM Plex Mono, monospace"
                fill={accentStroke}
                fontWeight={600}
              >
                Лента отсутствует — этажи единым целым
              </text>
              <text
                x={outX + 16}
                y={topY + totalBeltPx / 2 + 16}
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
                fill="#57534E"
              >
                {params.beltOnlySillUnderSecond
                  ? '▲ Только подоконник под 2 эт. (редко и проблем., S. 22)'
                  : 'Допустимо в 3-эт. (схема 3) или схеме 5-эт. дома (S. 22–23)'}
              </text>
            </g>
          ) : (
            <g>
              {/* Зона 1: Верхние обломы венчающей части (h_верх) */}
              <rect
                x={outX + 160}
                y={topY}
                width={150}
                height={upperPx}
                fill="rgba(154, 52, 18, 0.08)"
                stroke="#9A3412"
                strokeWidth={0.8}
                strokeDasharray="3 2"
              />
              {/* Зона 2: Нижние обломы венчающей части (h_низ) */}
              <rect
                x={outX + 160}
                y={topY + upperPx}
                width={150}
                height={lowerPx}
                fill="rgba(21, 128, 61, 0.08)"
                stroke="#15803D"
                strokeWidth={0.8}
                strokeDasharray="3 2"
              />

              {/* Геометрия верхних обломов в зависимости от effect (heavy/light/neutral) */}
              {effect === 'heavy' ? (
                /* Тяжёлый: одна массивная плита + микрополочка */
                <path
                  d={`M ${outX} ${topY} H ${outX + crownReach} V ${topY + upperPx * 0.22} H ${outX + crownReach - 4} V ${topY + upperPx} H ${outX} Z`}
                  fill="#D6CEBE"
                  stroke={accentStroke}
                  strokeWidth={1.3}
                />
              ) : effect === 'light' ? (
                /* Лёгкий: выкружка/гусёк над плитой */
                <path
                  d={`M ${outX} ${topY} Q ${outX + crownReach * 0.85} ${topY + 2} ${outX + crownReach} ${topY + upperPx * 0.52} L ${outX + crownReach - 12} ${topY + upperPx * 0.58} V ${topY + upperPx} H ${outX} Z`}
                  fill="#DFD6C3"
                  stroke={accentStroke}
                  strokeWidth={1.3}
                />
              ) : (
                /* Нейтральный 1:1 */
                <path
                  d={`M ${outX} ${topY} L ${outX + crownReach} ${topY + upperPx * 0.35} V ${topY + upperPx} H ${outX} Z`}
                  fill="#DFD6C3"
                  stroke={accentStroke}
                  strokeWidth={1.3}
                />
              )}

              {/* Геометрия нижних обломов венца (связующая кривая к стене) */}
              <path
                d={`M ${outX} ${topY + upperPx} H ${outX + crownReach * 0.72} Q ${outX + crownReach * 0.44} ${topY + upperPx + lowerPx * 0.55} ${outX + crownReach * 0.3} ${topY + crownPx} H ${outX} Z`}
                fill="#EAE3D3"
                stroke={accentStroke}
                strokeWidth={1.25}
              />

              {/* Консоли при наличии */}
              {params.beltConsoleMode === 'lying_lower' && (
                <path
                  d={`M ${outX + 18} ${topY + upperPx + 2} H ${outX + crownReach * 0.66} Q ${outX + crownReach * 0.45} ${topY + crownPx - 2} ${outX + 18} ${topY + crownPx - 2} Z`}
                  fill="#9A3412"
                  fillOpacity={0.25}
                  stroke="#9A3412"
                  strokeWidth={1}
                />
              )}

              {/* Подвенцовые элементы по Классам 2, 3, 4 */}
              {params.beltType === 2 && (
                /* Класс 2: архитравные полосы */
                <g>
                  <rect
                    x={outX}
                    y={topY + crownPx}
                    width={crownReach * 0.3}
                    height={subPx * 0.55}
                    fill="#E5DFD3"
                    stroke={accentStroke}
                    strokeWidth={1.1}
                  />
                  <rect
                    x={outX}
                    y={topY + crownPx + subPx * 0.55}
                    width={crownReach * 0.2}
                    height={subPx * 0.45}
                    fill="#DFD6C3"
                    stroke={accentStroke}
                    strokeWidth={1.1}
                  />
                </g>
              )}

              {params.beltType === 3 && (
                /* Класс 3: Шейка (Hals) и поясок (Halsband) */
                <g>
                  <path
                    d={`M ${outX} ${topY + crownPx} H ${outX + crownReach * 0.28} Q ${outX + crownReach * 0.14} ${topY + crownPx + subPx * 0.4} ${outX + crownReach * 0.16} ${topY + crownPx + subPx * 0.78} H ${outX} Z`}
                    fill="#F3EFE6"
                    stroke={accentStroke}
                    strokeWidth={1.1}
                  />
                  <rect
                    x={outX}
                    y={topY + crownPx + subPx * 0.78}
                    width={crownReach * 0.24}
                    height={Math.max(7, subPx * 0.22)}
                    fill="#D6CEBE"
                    stroke={accentStroke}
                    strokeWidth={1.1}
                  />
                </g>
              )}

              {params.beltType === 4 && (
                /* Класс 4: Фриз и архитрав */
                <g>
                  <rect
                    x={outX}
                    y={topY + crownPx}
                    width={crownReach * 0.26}
                    height={subPx * 0.62}
                    fill="#F3EFE6"
                    stroke={accentStroke}
                    strokeWidth={1.1}
                  />
                  {params.beltConsoleMode === 'standing_frieze' && (
                    <rect
                      x={outX + 4}
                      y={topY + crownPx + 4}
                      width={crownReach * 0.2}
                      height={Math.max(10, subPx * 0.62 - 8)}
                      fill="#9A3412"
                      fillOpacity={0.25}
                      stroke="#9A3412"
                      strokeWidth={0.9}
                    />
                  )}
                  <rect
                    x={outX}
                    y={topY + crownPx + subPx * 0.62}
                    width={crownReach * 0.34}
                    height={subPx * 0.38}
                    fill="#DFD6C3"
                    stroke={accentStroke}
                    strokeWidth={1.1}
                  />
                </g>
              )}

              {/* Подписи зон */}
              <text
                x={outX + 168}
                y={topY + Math.max(12, upperPx / 2 + 3)}
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
                fill="#9A3412"
              >
                Верхние обломы h_в = {formatMeters(hUpper)}м
              </text>
              <text
                x={outX + 168}
                y={topY + upperPx + Math.max(12, lowerPx / 2 + 3)}
                fontSize="9.5"
                fontFamily="IBM Plex Mono, monospace"
                fill="#15803D"
              >
                Нижние обломы h_н = {formatMeters(hLower)}м
              </text>

              {subPx > 8 && (
                <text
                  x={outX + 168}
                  y={topY + crownPx + subPx / 2 + 3}
                  fontSize="9.5"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#44403C"
                >
                  {params.beltType === 2
                    ? 'Архитравные полосы'
                    : params.beltType === 3
                      ? 'Шейка (Hals) + поясок'
                      : 'Фриз + архитрав'}
                </text>
              )}

              {/* Пометка про вынос */}
              <text
                x={outX + 4}
                y={svgH - 14}
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
                fill="#78716C"
              >
                Вынос (Ausladung): умеренный — число в источнике не задано (S. 16)
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="xl:col-span-4 space-y-2.5 text-xs text-[#44403C]">
        <p className="font-display text-lg font-medium text-[#1C1917]">Параметры разреза ленты</p>
        <dl className="divide-y divide-[#E5DFD3] font-mono tabular-nums text-[11px]">
          <div className="py-1.5 flex justify-between gap-2">
            <dt className="text-[#78716C]">H_ленты / норма:</dt>
            <dd className="font-medium text-[#1C1917]">
              {formatMeters(params.hGurt)} м [{formatMeters(summary.beltHeightCheck.range[0], 2)}…{formatMeters(summary.beltHeightCheck.range[1], 2)}]
            </dd>
          </div>
          <div className="py-1.5 flex justify-between gap-2">
            <dt className="text-[#78716C]">h_верх : h_низ:</dt>
            <dd className="font-medium text-[#9A3412]">
              {formatMeters(params.beltCrowningRatio, 2)} : 1 (доп. 0.5…2.0)
            </dd>
          </div>
          <div className="py-1.5 flex justify-between gap-2">
            <dt className="text-[#78716C]">Иерархия S. 16:</dt>
            <dd className="font-medium text-[#1C1917]">
              {formatMeters(params.hGurt, 2)} &lt; min({formatMeters(params.hMain, 2)}, {formatMeters(params.useFullFloorAsSocle ? summary.derivedGeometry.floor1FullHeight : params.hSocle, 2)})
            </dd>
          </div>
        </dl>
        <p className="text-[11px] leading-relaxed text-[#57534E]">
          {beltMeta.descriptionRu}
        </p>
      </div>
    </div>
  );
}

