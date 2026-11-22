import {
  formatMeters,
  type FacadeParameters,
  type FacadeSummary,
  type FacadeTargetElement,
  type ValidationStatus,
} from '../../calc/rules';

interface FacadeSvgProps {
  params: FacadeParameters;
  summary: FacadeSummary;
  highlightedElement: FacadeTargetElement | null;
  onSelectElement?: (el: FacadeTargetElement) => void;
}

const STATUS_STROKE: Record<ValidationStatus, string> = {
  ok: '#15803D',
  approx: '#B45309',
  violation: '#B91C1C',
};

const STATUS_FILL: Record<ValidationStatus, string> = {
  ok: 'rgba(21, 128, 61, 0.10)',
  approx: 'rgba(180, 83, 9, 0.12)',
  violation: 'rgba(185, 28, 28, 0.13)',
};

const STATUS_TAG: Record<ValidationStatus, string> = {
  ok: 'OK',
  approx: 'ПРИБЛ.',
  violation: 'НАРУШЕНИЕ',
};

export function FacadeSvg({
  params,
  summary,
  highlightedElement,
  onSelectElement,
}: FacadeSvgProps) {
  const safeH = Math.max(1.8, params.H);
  const safeA = Math.max(1.0, params.A);
  const safeW = Math.max(0.4, params.w);
  const safeWinH = Math.max(0.6, params.h);
  const effectiveU = params.withFraming ? Math.max(0, params.u) : 0;
  const D = params.isRisalitCentered ? Math.max(0.6, params.risalitWidth / 2) : Math.max(0.5, safeA * params.k_D);

  // 3-осевой фасад: [D] — ось 1 — [A] — ось 2 — [A] — ось 3 — [D]
  const totalWidthM = 2 * D + 2 * safeA;
  const plinthM = 0.65;
  const corniceM = Math.max(0.25, params.Tc);
  // Чтобы окно с сандриком всегда умещалось внутри визуальной высоты этажа при нарушении, берем максимум
  const framingTotalM = params.withFraming ? summary.framingResult.T : 0;
  const wallHeightM = Math.max(safeH, safeWinH + framingTotalM + 0.55);
  const totalHeightM = plinthM + wallHeightM + corniceM;

  const svgW = 860;
  const svgH = 470;
  const padLeft = 78;
  const padRight = 88;
  const padTop = 64;
  const padBottom = 86;
  const drawW = svgW - padLeft - padRight;
  const drawH = svgH - padTop - padBottom;

  const scale = Math.min(drawW / Math.max(totalWidthM, 4), drawH / Math.max(totalHeightM, 3.5));
  const facadePxW = totalWidthM * scale;
  const originX = padLeft + (drawW - facadePxW) / 2;
  const groundY = svgH - padBottom;

  const xM = (meters: number) => originX + meters * scale;
  const yFromGroundM = (metersAboveGround: number) => groundY - metersAboveGround * scale;

  const axesM = [D, D + safeA, D + 2 * safeA];
  const sillAbovePlinthM = Math.max(0.28, (safeH - safeWinH) * 0.34);
  const winBottomM = plinthM + sillAbovePlinthM;
  const winTopM = winBottomM + safeWinH;

  const cornerStatus = summary.cornerCheck.status;
  const pierStatus = summary.pierResult.status;
  const windowStatus = summary.windowCheck.status;
  const corniceStatus = summary.corniceCheck.status;
  const pilasterStatus = summary.pilasterCheck.status;
  const ahStatus = summary.ahCheck.status;
  const entablatureStatus = summary.framingResult.status;

  const p_corner = D - safeW / 2 - effectiveU;
  const p_inter = safeA - safeW - 2 * effectiveU;
  const w_v = safeW + 2 * effectiveU;

  const isHi = (el: FacadeTargetElement) => highlightedElement === el;

  // Координаты карниза
  const wallTopM = plinthM + wallHeightM;
  const corniceTopM = wallTopM + corniceM;
  const corniceOverhangPx = Math.min(26, Math.max(8, corniceM * scale * 0.55));
  const huPx = summary.corniceCheck.h_u * scale;
  const hlPx = summary.corniceCheck.h_l * scale;

  // Позиции пилястров по краям
  const pilasterW = Math.min(params.Wp, Math.max(0.2, p_corner * 0.72));
  const pilasterPxW = pilasterW * scale;

  const renderDimLine = (
    x1: number,
    x2: number,
    y: number,
    label: string,
    status: ValidationStatus,
    onClickEl?: FacadeTargetElement
  ) => {
    const color = STATUS_STROKE[status];
    const midX = (x1 + x2) / 2;
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const widthPx = maxX - minX;
    return (
      <g
        onClick={onClickEl && onSelectElement ? () => onSelectElement(onClickEl) : undefined}
        className={onClickEl ? 'cursor-pointer' : undefined}
      >
        <line x1={minX} y1={y - 5} x2={minX} y2={y + 5} stroke={color} strokeWidth={1.25} />
        <line x1={maxX} y1={y - 5} x2={maxX} y2={y + 5} stroke={color} strokeWidth={1.25} />
        <line x1={minX} y1={y} x2={maxX} y2={y} stroke={color} strokeWidth={1.35} />
        {widthPx > 14 && (
          <>
            <polygon points={`${minX},${y} ${minX + 5},${y - 2.5} ${minX + 5},${y + 2.5}`} fill={color} />
            <polygon points={`${maxX},${y} ${maxX - 5},${y - 2.5} ${maxX - 5},${y + 2.5}`} fill={color} />
          </>
        )}
        <rect
          x={midX - Math.max(28, label.length * 3.4)}
          y={y - 15}
          width={Math.max(56, label.length * 6.8)}
          height={14}
          fill="#FBF9F5"
          fillOpacity={0.92}
        />
        <text
          x={midX}
          y={y - 4.5}
          textAnchor="middle"
          fontSize="10.5"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight={500}
          fill={color}
        >
          {label}
        </text>
      </g>
    );
  };

  return (
    <div className="border border-[#D6CEBE] bg-[#FBF9F5]">
      {/* Header strip inside drafting sheet */}
      <div className="px-4 py-2.5 border-b border-[#E5DFD3] bg-[#F3EFE6]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#44403C]">
          <span className="font-display text-base font-semibold text-[#1C1917]">
            Ортогональный чертёж фасада (3 оси)
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-[#78716C] tabular-nums">
            Ширина {formatMeters(totalWidthM)} м · H={formatMeters(safeH)} м
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] font-mono tabular-nums">
          <span className="text-[#15803D]">■ OK</span>
          <span className="text-[#B45309]">▲ ПРИБЛ.</span>
          <span className="text-[#B91C1C]">✕ НАРУШЕНИЕ</span>
        </div>
      </div>

      <div className="p-2 sm:p-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          role="img"
          aria-label="Параметрическая схема фасада по правилам Brausewetter 1895"
          className="w-full h-auto min-w-[540px] select-none"
        >
          {/* Subtle drafting sheet backdrop */}
          <rect x={0} y={0} width={svgW} height={svgH} fill="#FBF9F5" />

          {/* Ground baseline */}
          <line
            x1={padLeft - 24}
            y1={groundY}
            x2={svgW - padRight + 24}
            y2={groundY}
            stroke="#57534E"
            strokeWidth={1.5}
          />

          {/* Main Wall Body */}
          <rect
            x={xM(0)}
            y={yFromGroundM(wallTopM)}
            width={facadePxW}
            height={(wallHeightM + plinthM) * scale}
            fill="#F4EFE4"
            stroke="#292524"
            strokeWidth={1.4}
          />

          {/* Plinth / Цоколь */}
          <rect
            x={xM(0) - 3}
            y={yFromGroundM(plinthM)}
            width={facadePxW + 6}
            height={plinthM * scale}
            fill="#E6DFD0"
            stroke="#292524"
            strokeWidth={1.2}
          />
          <text
            x={xM(0) + 8}
            y={yFromGroundM(plinthM / 2) + 3}
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            fill="#57534E"
          >
            Цоколь (Sockel)
          </text>

          {/* Reference inner ceiling / H_max dashed line */}
          <line
            x1={xM(0)}
            y1={yFromGroundM(plinthM + safeH)}
            x2={xM(totalWidthM)}
            y2={yFromGroundM(plinthM + safeH)}
            stroke="#78716C"
            strokeWidth={0.9}
            strokeDasharray="4 4"
          />
          <text
            x={xM(totalWidthM) - 6}
            y={yFromGroundM(plinthM + safeH) - 4}
            textAnchor="end"
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            fill="#78716C"
          >
            H = {formatMeters(safeH)} м
          </text>

          {/* Highlight overlay: Corner pier (left) */}
          <rect
            x={xM(0)}
            y={yFromGroundM(wallTopM)}
            width={Math.max(0, p_corner * scale)}
            height={wallHeightM * scale}
            fill={
              isHi('corner')
                ? STATUS_FILL[cornerStatus]
                : cornerStatus === 'violation'
                  ? 'rgba(185, 28, 28, 0.08)'
                  : 'transparent'
            }
            stroke={isHi('corner') ? STATUS_STROKE[cornerStatus] : 'none'}
            strokeWidth={isHi('corner') ? 1.8 : 0}
            className="cursor-pointer"
            onClick={() => onSelectElement?.('corner')}
          />

          {/* Highlight overlay: Intermediate pier (between axis 1 and 2) */}
          <rect
            x={xM(axesM[0] + safeW / 2 + effectiveU)}
            y={yFromGroundM(wallTopM)}
            width={Math.max(0, p_inter * scale)}
            height={wallHeightM * scale}
            fill={
              isHi('pier') || isHi('framing_pier')
                ? STATUS_FILL[pierStatus]
                : pierStatus === 'violation'
                  ? 'rgba(185, 28, 28, 0.08)'
                  : 'transparent'
            }
            stroke={isHi('pier') || isHi('framing_pier') ? STATUS_STROKE[pierStatus] : 'none'}
            strokeWidth={isHi('pier') || isHi('framing_pier') ? 1.8 : 0}
            className="cursor-pointer"
            onClick={() => onSelectElement?.(params.withFraming ? 'framing_pier' : 'pier')}
          />

          {/* Corner Pilasters / Mauerpfeiler */}
          {[0, totalWidthM - pilasterW].map((pxStart, idx) => {
            const xLeft = xM(pxStart);
            const yTop = yFromGroundM(wallTopM);
            const hPx = wallHeightM * scale;
            const capH = params.isMauerpfeiler ? 0 : Math.min(18, hPx * 0.09);
            const baseH = params.isMauerpfeiler ? 0 : Math.min(14, hPx * 0.07);
            const strokeCol = isHi('pilaster') || pilasterStatus === 'violation'
              ? STATUS_STROKE[pilasterStatus]
              : '#57534E';
            return (
              <g
                key={idx}
                className="cursor-pointer"
                onClick={() => onSelectElement?.('pilaster')}
              >
                <rect
                  x={xLeft}
                  y={yTop + capH}
                  width={pilasterPxW}
                  height={Math.max(4, hPx - capH - baseH)}
                  fill={isHi('pilaster') ? STATUS_FILL[pilasterStatus] : '#EAE3D3'}
                  stroke={strokeCol}
                  strokeWidth={isHi('pilaster') ? 1.6 : 1}
                />
                {!params.isMauerpfeiler && (
                  <>
                    {/* Kapitäl */}
                    <rect
                      x={xLeft - 2}
                      y={yTop}
                      width={pilasterPxW + 4}
                      height={capH}
                      fill="#DFD6C3"
                      stroke={strokeCol}
                      strokeWidth={1}
                    />
                    {/* Basis */}
                    <rect
                      x={xLeft - 2}
                      y={yTop + hPx - baseH}
                      width={pilasterPxW + 4}
                      height={baseH}
                      fill="#DFD6C3"
                      stroke={strokeCol}
                      strokeWidth={1}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* Crowning Cornice (Главный карниз) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectElement?.('cornice')}
          >
            {/* Upper molding h_u */}
            <rect
              x={xM(0) - corniceOverhangPx}
              y={yFromGroundM(corniceTopM)}
              width={facadePxW + corniceOverhangPx * 2}
              height={Math.max(4, huPx)}
              fill={isHi('cornice') ? STATUS_FILL[corniceStatus] : '#DFD6C3'}
              stroke={isHi('cornice') || corniceStatus === 'violation' ? STATUS_STROKE[corniceStatus] : '#292524'}
              strokeWidth={1.25}
            />
            {/* Lower molding h_l */}
            <rect
              x={xM(0) - corniceOverhangPx * 0.55}
              y={yFromGroundM(corniceTopM) + Math.max(4, huPx)}
              width={facadePxW + corniceOverhangPx * 1.1}
              height={Math.max(4, hlPx)}
              fill={isHi('cornice') ? STATUS_FILL[corniceStatus] : '#EAE3D3'}
              stroke={isHi('cornice') || corniceStatus === 'violation' ? STATUS_STROKE[corniceStatus] : '#292524'}
              strokeWidth={1.1}
            />
          </g>

          {/* Vertical Window Axes + Windows */}
          {axesM.map((axisM, idx) => {
            const cx = xM(axisM);
            const winX = xM(axisM - safeW / 2);
            const winY = yFromGroundM(winTopM);
            const winWpx = safeW * scale;
            const winHpx = safeWinH * scale;

            const uPx = effectiveU * scale;
            const { R, F, K } = summary.framingResult;
            const rPx = R * scale;
            const fPx = F * scale;
            const kPx = K * scale;
            const kOverhangPx = params.withConsoles
              ? (K * 5) / 6 * scale * 0.55
              : K * scale * 0.55;

            return (
              <g key={idx}>
                {/* Axis vertical centerline */}
                <line
                  x1={cx}
                  y1={padTop - 20}
                  x2={cx}
                  y2={groundY + 18}
                  stroke="#9A3412"
                  strokeOpacity={0.45}
                  strokeWidth={0.9}
                  strokeDasharray="5 3"
                />

                {/* Window framing (Rahmen + Verdachung) */}
                {params.withFraming && (
                  <g
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('entablature')}
                  >
                    {/* Side & sill Rahmen */}
                    <rect
                      x={winX - uPx}
                      y={winY - rPx}
                      width={winWpx + 2 * uPx}
                      height={winHpx + rPx + uPx * 0.6}
                      fill={isHi('entablature') ? STATUS_FILL[entablatureStatus] : '#E6DEC9'}
                      stroke={isHi('entablature') ? STATUS_STROKE[entablatureStatus] : '#44403C'}
                      strokeWidth={1.1}
                    />
                    {/* Fries */}
                    <rect
                      x={winX - uPx}
                      y={winY - rPx - fPx}
                      width={winWpx + 2 * uPx}
                      height={Math.max(2, fPx)}
                      fill="#EFE8D7"
                      stroke={isHi('entablature') ? STATUS_STROKE[entablatureStatus] : '#44403C'}
                      strokeWidth={1}
                    />
                    {/* Consoles if enabled */}
                    {params.withConsoles && (
                      <>
                        <rect
                          x={winX - uPx - 3}
                          y={winY - rPx - fPx * 0.85}
                          width={Math.max(4, uPx * 0.7)}
                          height={Math.max(5, fPx + rPx * 0.5)}
                          fill="#D6CEBE"
                          stroke="#44403C"
                          strokeWidth={0.9}
                        />
                        <rect
                          x={winX + winWpx + uPx + 3 - Math.max(4, uPx * 0.7)}
                          y={winY - rPx - fPx * 0.85}
                          width={Math.max(4, uPx * 0.7)}
                          height={Math.max(5, fPx + rPx * 0.5)}
                          fill="#D6CEBE"
                          stroke="#44403C"
                          strokeWidth={0.9}
                        />
                      </>
                    )}
                    {/* Kranz */}
                    <rect
                      x={winX - uPx - kOverhangPx}
                      y={winY - rPx - fPx - kPx}
                      width={winWpx + 2 * uPx + kOverhangPx * 2}
                      height={Math.max(3, kPx)}
                      fill="#DDD4C0"
                      stroke={isHi('entablature') ? STATUS_STROKE[entablatureStatus] : '#292524'}
                      strokeWidth={1.15}
                    />
                  </g>
                )}

                {/* Glass window opening w × h */}
                <g
                  className="cursor-pointer"
                  onClick={() => onSelectElement?.('window')}
                >
                  <rect
                    x={winX}
                    y={winY}
                    width={winWpx}
                    height={winHpx}
                    fill={
                      isHi('window')
                        ? STATUS_FILL[windowStatus]
                        : windowStatus === 'violation'
                          ? 'rgba(185, 28, 28, 0.16)'
                          : '#D6DEE2'
                    }
                    stroke={
                      isHi('window') || windowStatus !== 'ok'
                        ? STATUS_STROKE[windowStatus]
                        : '#292524'
                    }
                    strokeWidth={isHi('window') ? 2 : 1.3}
                  />
                  {/* Mullion crossbars */}
                  <line
                    x1={cx}
                    y1={winY}
                    x2={cx}
                    y2={winY + winHpx}
                    stroke="#57534E"
                    strokeWidth={0.9}
                  />
                  <line
                    x1={winX}
                    y1={winY + winHpx * 0.36}
                    x2={winX + winWpx}
                    y2={winY + winHpx * 0.36}
                    stroke="#57534E"
                    strokeWidth={0.9}
                  />
                </g>
              </g>
            );
          })}

          {/* TOP DIMENSION LINES: D and A */}
          {renderDimLine(
            xM(0),
            xM(axesM[0]),
            padTop - 26,
            `D = ${formatMeters(D)} (${STATUS_TAG[cornerStatus]})`,
            cornerStatus,
            'corner'
          )}
          {renderDimLine(
            xM(axesM[0]),
            xM(axesM[1]),
            padTop - 26,
            `A = ${formatMeters(safeA)} (${STATUS_TAG[ahStatus]})`,
            ahStatus,
            'axenweite'
          )}

          {/* BOTTOM DIMENSION LINES: p_corner, w / w_v, p / p_c */}
          {renderDimLine(
            xM(0),
            xM(axesM[0] - safeW / 2 - effectiveU),
            groundY + 26,
            `p_cор = ${formatMeters(p_corner)}`,
            cornerStatus,
            'corner'
          )}
          {renderDimLine(
            xM(axesM[0] - safeW / 2 - effectiveU),
            xM(axesM[0] + safeW / 2 + effectiveU),
            groundY + 52,
            params.withFraming
              ? `w_v = ${formatMeters(w_v)} (w=${formatMeters(safeW)})`
              : `w = ${formatMeters(safeW)}`,
            windowStatus,
            'window'
          )}
          {renderDimLine(
            xM(axesM[0] + safeW / 2 + effectiveU),
            xM(axesM[1] - safeW / 2 - effectiveU),
            groundY + 26,
            params.withFraming
              ? `p_c = ${formatMeters(p_inter)} (${STATUS_TAG[pierStatus]})`
              : `p = ${formatMeters(p_inter)} (${STATUS_TAG[pierStatus]})`,
            pierStatus,
            params.withFraming ? 'framing_pier' : 'pier'
          )}

          {/* RIGHT VERTICAL DIMENSION: H & T_c */}
          {(() => {
            const dimX = xM(totalWidthM) + 34;
            const yBot = yFromGroundM(plinthM);
            const yHTop = yFromGroundM(plinthM + safeH);
            const yCTop = yFromGroundM(corniceTopM);
            const yWTop = yFromGroundM(wallTopM);
            return (
              <g>
                <line x1={dimX} y1={yBot} x2={dimX} y2={yHTop} stroke={STATUS_STROKE[ahStatus]} strokeWidth={1.25} />
                <line x1={dimX - 5} y1={yBot} x2={dimX + 5} y2={yBot} stroke={STATUS_STROKE[ahStatus]} strokeWidth={1.25} />
                <line x1={dimX - 5} y1={yHTop} x2={dimX + 5} y2={yHTop} stroke={STATUS_STROKE[ahStatus]} strokeWidth={1.25} />
                <text
                  x={dimX + 8}
                  y={(yBot + yHTop) / 2 + 3}
                  fontSize="10"
                  fontFamily="IBM Plex Mono, monospace"
                  fill={STATUS_STROKE[ahStatus]}
                >
                  H={formatMeters(safeH)}
                </text>

                <line x1={dimX - 14} y1={yWTop} x2={dimX - 14} y2={yCTop} stroke={STATUS_STROKE[corniceStatus]} strokeWidth={1.25} />
                <text
                  x={dimX - 8}
                  y={(yWTop + yCTop) / 2 + 3}
                  fontSize="9.5"
                  fontFamily="IBM Plex Mono, monospace"
                  fill={STATUS_STROKE[corniceStatus]}
                >
                  T_c={formatMeters(corniceM)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
