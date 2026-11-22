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
  const D = params.isRisalitCentered
    ? Math.max(0.6, params.risalitWidth / 2)
    : Math.max(0.5, safeA * params.k_D);

  const safeAxesCount = Math.min(10, Math.max(2, Math.round(params.axesCount)));
  const safeFloors = Math.min(5, Math.max(1, Math.round(params.floors)));
  const axesM = Array.from({ length: safeAxesCount }, (_, i) => D + i * safeA);

  // Общая ширина фасада с заданным числом осей
  const totalWidthM = 2 * D + Math.max(0, safeAxesCount - 1) * safeA;

  // Высота цоколя и этажей
  const effectiveSocleH = params.useFullFloorAsSocle ? safeH : Math.max(0.25, params.hSocle);
  const plinthM = params.useFullFloorAsSocle ? 0.35 : Math.min(effectiveSocleH, safeH * 0.72);
  const corniceM = Math.max(0.25, params.Tc);
  const framingTotalM = params.withFraming ? summary.framingResult.T : 0;
  const baseFloorM = Math.max(safeH, safeWinH + framingTotalM + 0.52);

  // Высоты каждого этажа снизу вверх (floorIdx 0 = 1-й этаж EG)
  const floorHeightsM = Array.from({ length: safeFloors }, (_, flIdx) => {
    if (safeFloors >= 3 && flIdx === safeFloors - 1 && summary.variantInfo.rules.upperFloorSmallest) {
      return Math.max(2.3, baseFloorM * 0.84);
    }
    if (safeFloors >= 3 && flIdx === 1 && summary.variantInfo.rules.mainTierFloor === 2) {
      return baseFloorM * 1.04;
    }
    return baseFloorM;
  });

  const floorOffsetsM: number[] = [];
  let cursorM = plinthM;
  for (let i = 0; i < safeFloors; i++) {
    floorOffsetsM.push(cursorM);
    cursorM += floorHeightsM[i];
  }
  const wallHeightM = cursorM - plinthM;
  const wallTopM = cursorM;
  const corniceTopM = wallTopM + corniceM;
  const totalHeightM = corniceTopM;

  const svgW = 860;
  const svgH = safeFloors >= 4 ? 540 : 470;
  const padLeft = 84;
  const padRight = 104;
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

  const cornerStatus = summary.cornerCheck.status;
  const pierStatus = summary.pierResult.status;
  const windowStatus = summary.windowCheck.status;
  const corniceStatus = summary.corniceCheck.status;
  const pilasterStatus = summary.pilasterCheck.status;
  const ahStatus = summary.ahCheck.status;
  const entablatureStatus = summary.framingResult.status;
  const socleStatus: ValidationStatus =
    summary.socleHeightCheck.status === 'violation' ||
    summary.mainCorniceCheck.status === 'violation' ||
    summary.decreasingCheck.status === 'violation'
      ? 'violation'
      : summary.socleHeightCheck.status === 'approx' ||
          summary.rusticationCheck.status !== 'ok' ||
          summary.abkroepfungCheck.status === 'approx'
        ? 'approx'
        : 'ok';

  const beltStatus: ValidationStatus =
    summary.beltHeightCheck.status === 'violation' ||
    summary.beltCrowningCheck.status === 'violation' ||
    summary.beltColumnsCheck.status === 'violation' ||
    summary.beltSpecialCheck.status === 'violation' ||
    summary.gurtCheck.status === 'violation'
      ? 'violation'
      : summary.beltCrowningCheck.status === 'approx' ||
          summary.beltSpecialCheck.status === 'approx'
        ? 'approx'
        : 'ok';

  const p_corner = D - safeW / 2 - effectiveU;
  const p_inter = safeA - safeW - 2 * effectiveU;
  const w_v = safeW + 2 * effectiveU;

  const isHi = (el: FacadeTargetElement) => highlightedElement === el;

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
          x={midX - Math.max(28, label.length * 3.2)}
          y={y - 15}
          width={Math.max(56, label.length * 6.4)}
          height={14}
          fill="#FBF9F5"
          fillOpacity={0.92}
        />
        <text
          x={midX}
          y={y - 4.5}
          textAnchor="middle"
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          fontWeight={500}
          fill={color}
        >
          {label}
        </text>
      </g>
    );
  };

  // Доли трёхчастного цоколя
  const partsSum = Math.max(
    0.01,
    summary.threePartSocleResult.fuss +
      summary.threePartSocleResult.rumpf +
      summary.threePartSocleResult.deck
  );
  const visualSocleTopM = params.useFullFloorAsSocle ? plinthM + floorHeightsM[0] : plinthM;
  const plinthPxH = visualSocleTopM * scale;
  const deckPxH = Math.max(3, (summary.threePartSocleResult.deck / partsSum) * plinthPxH);
  const fussPxH = Math.max(3, (summary.threePartSocleResult.fuss / partsSum) * plinthPxH);
  const rumpfPxH = Math.max(4, plinthPxH - deckPxH - fussPxH);
  const rustCourses = Math.min(12, Math.max(1, summary.rusticationCheck.n));

  // Главный ярус для подробного показа сандрика
  const activeFramingFloor = safeFloors >= 2 ? 1 : 0;
  const rectOriRu =
    summary.facadeRectCheck.actualOrientation === 'lying'
      ? 'лежачий прямоугольник'
      : summary.facadeRectCheck.actualOrientation === 'standing'
        ? 'стоячий прямоугольник'
        : 'квадрат (избегать)';

  return (
    <div className="border border-[#D6CEBE] bg-[#FBF9F5]">
      {/* Header strip inside drafting sheet */}
      <div className="px-4 py-2.5 border-b border-[#E5DFD3] bg-[#F3EFE6]/70 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#44403C]">
          <span className="font-display text-base font-semibold text-[#1C1917]">
            Ортогональный чертёж ({safeFloors} эт. · {safeAxesCount} осей)
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-[11px] text-[#78716C] tabular-nums">
            W={formatMeters(totalWidthM, 2)} м × H_зд={formatMeters(params.totalHeight, 2)} м ({rectOriRu})
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

          {/* Plinth / Цоколь (Sockel) */}
          <g className="cursor-pointer" onClick={() => onSelectElement?.('socle')}>
            <rect
              x={xM(0) - 3}
              y={yFromGroundM(visualSocleTopM)}
              width={facadePxW + 6}
              height={plinthPxH}
              fill={
                isHi('socle')
                  ? STATUS_FILL[socleStatus]
                  : socleStatus === 'violation'
                    ? 'rgba(185, 28, 28, 0.08)'
                    : '#E6DFD0'
              }
              stroke={
                isHi('socle') || socleStatus === 'violation' ? STATUS_STROKE[socleStatus] : '#292524'
              }
              strokeWidth={isHi('socle') ? 1.8 : 1.2}
            />
            {!params.useFullFloorAsSocle && (
              <>
                <rect
                  x={xM(0) - 5}
                  y={yFromGroundM(visualSocleTopM)}
                  width={facadePxW + 10}
                  height={deckPxH}
                  fill="#DDD4C0"
                  stroke={isHi('socle') ? STATUS_STROKE[socleStatus] : '#44403C'}
                  strokeWidth={0.95}
                />
                {Array.from({ length: Math.max(0, rustCourses - 1) }).map((_, rIdx) => {
                  const lineY =
                    yFromGroundM(visualSocleTopM) + deckPxH + ((rIdx + 1) / rustCourses) * rumpfPxH;
                  return (
                    <line
                      key={rIdx}
                      x1={xM(0) - 2}
                      y1={lineY}
                      x2={xM(0) + facadePxW + 2}
                      y2={lineY}
                      stroke="#78716C"
                      strokeOpacity={0.55}
                      strokeWidth={0.8}
                    />
                  );
                })}
                <rect
                  x={xM(0) - 5}
                  y={groundY - fussPxH}
                  width={facadePxW + 10}
                  height={fussPxH}
                  fill="#D6CEBE"
                  stroke={isHi('socle') ? STATUS_STROKE[socleStatus] : '#44403C'}
                  strokeWidth={0.95}
                />
                <rect
                  x={xM(0) + 6}
                  y={yFromGroundM(visualSocleTopM / 2) - 6}
                  width={185}
                  height={12}
                  fill="#FBF9F5"
                  fillOpacity={0.82}
                />
                <text
                  x={xM(0) + 10}
                  y={yFromGroundM(visualSocleTopM / 2) + 3}
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                  fill={isHi('socle') ? STATUS_STROKE[socleStatus] : '#44403C'}
                >
                  Цоколь {formatMeters(effectiveSocleH)} м ({summary.rusticationCheck.n} ряд.)
                </text>
              </>
            )}
          </g>

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

          {/* Highlight overlay: Intermediate pier (between axis 0 and 1) */}
          {axesM.length >= 2 && (
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
          )}

          {/* Lower-floor colonnade / pilasters hint when beltHasColumnsBelow is enabled (B-24…B-26) */}
          {params.beltHasColumnsBelow && safeFloors >= 2 && (
            <g opacity={0.75}>
              {axesM.slice(0, -1).map((axX, idx) => {
                const colX = xM(axX + safeA / 2);
                const yBot = yFromGroundM(floorOffsetsM[0]);
                const yTop = yFromGroundM(floorOffsetsM[1]);
                return (
                  <g key={`col-hint-${idx}`}>
                    <rect
                      x={colX - 4}
                      y={yTop + 4}
                      width={8}
                      height={Math.max(8, yBot - yTop - 8)}
                      fill="#EAE3D3"
                      stroke="#78716C"
                      strokeWidth={0.85}
                    />
                    <rect
                      x={colX - 6}
                      y={yTop + 4}
                      width={12}
                      height={4}
                      fill="#D6CEBE"
                      stroke="#57534E"
                      strokeWidth={0.75}
                    />
                    <rect
                      x={colX - 6}
                      y={yBot - 6}
                      width={12}
                      height={4}
                      fill="#D6CEBE"
                      stroke="#57534E"
                      strokeWidth={0.75}
                    />
                  </g>
                );
              })}
            </g>
          )}

          {/* Belt Cornices / Gurtgesimse (B-1…B-37) */}
          {safeFloors >= 2 &&
            floorOffsetsM.slice(1).map((floorStartM, idx) => {
              const upperFloorNum = idx + 2; // 2nd, 3rd...
              const upperFloorH = floorHeightsM[idx + 1] ?? baseFloorM;
              const isUpperBelt = upperFloorNum === 3;

              // При 3-этажном режиме вариант 'unified_upper' не прерывает 2 и 3 этажи карнизом
              if (
                params.buildingVariant === 'multi-story' &&
                params.multiSub === 'three' &&
                isUpperBelt &&
                params.threeStoryGurtMode === 'unified_upper'
              ) {
                return (
                  <g
                    key={`gurt-absent-${upperFloorNum}`}
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('belt')}
                  >
                    <line
                      x1={xM(0)}
                      y1={yFromGroundM(floorStartM)}
                      x2={xM(0) + facadePxW}
                      y2={yFromGroundM(floorStartM)}
                      stroke={isHi('belt') ? STATUS_STROKE[beltStatus] : '#A8A29E'}
                      strokeWidth={0.9}
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              }

              // Если лента полностью отключена ('без ленты')
              if (params.beltIsAbsent) {
                return (
                  <g
                    key={`gurt-off-${upperFloorNum}`}
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('belt')}
                  >
                    <line
                      x1={xM(0)}
                      y1={yFromGroundM(floorStartM)}
                      x2={xM(0) + facadePxW}
                      y2={yFromGroundM(floorStartM)}
                      stroke={
                        isHi('belt') || beltStatus !== 'ok'
                          ? STATUS_STROKE[beltStatus]
                          : '#A8A29E'
                      }
                      strokeWidth={1}
                      strokeDasharray="5 4"
                    />
                    {upperFloorNum === 2 && (
                      <text
                        x={xM(0) + facadePxW / 2}
                        y={yFromGroundM(floorStartM) - 4}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fill={beltStatus === 'violation' ? '#B91C1C' : '#57534E'}
                      >
                        {params.beltOnlySillUnderSecond
                          ? '✕ только подоконник под 2 эт. (нарушение S. 22)'
                          : 'Без ленты — этажи единым целым'}
                      </text>
                    )}
                  </g>
                );
              }

              const isThirdSohlbank =
                params.buildingVariant === 'multi-story' &&
                params.multiSub === 'three' &&
                isUpperBelt &&
                params.threeStoryGurtMode === 'third_sohlbank';

              const isSillMode = params.beltIsSillCornice || isThirdSohlbank;
              const sillShiftM = isSillMode ? Math.min(0.45, upperFloorH * 0.16) : 0;
              const yBelt = yFromGroundM(floorStartM + sillShiftM);

              const beltThicknessPx = isSillMode
                ? 4.5
                : Math.min(11, Math.max(4, params.hGurt * scale));

              const beltStroke =
                isHi('belt') || beltStatus !== 'ok'
                  ? STATUS_STROKE[beltStatus]
                  : '#57534E';
              const beltFill =
                isHi('belt') || beltStatus === 'violation'
                  ? STATUS_FILL[beltStatus]
                  : params.beltMode === 'crowning'
                    ? '#D6CEBE'
                    : '#DFD6C3';

              // Замена ленты рустовкой (Fugenteilung + Fußprofil)
              if (params.beltAsRusticationMode) {
                return (
                  <g
                    key={`gurt-rust-${upperFloorNum}`}
                    className="cursor-pointer"
                    onClick={() => onSelectElement?.('belt')}
                  >
                    <rect
                      x={xM(0)}
                      y={yBelt - 10}
                      width={facadePxW}
                      height={14}
                      fill={isHi('belt') ? STATUS_FILL[beltStatus] : 'rgba(214, 206, 190, 0.35)'}
                      stroke="none"
                    />
                    <line
                      x1={xM(0)}
                      y1={yBelt - 6}
                      x2={xM(0) + facadePxW}
                      y2={yBelt - 6}
                      stroke="#78716C"
                      strokeWidth={0.75}
                      strokeDasharray="6 3"
                    />
                    <line
                      x1={xM(0)}
                      y1={yBelt - 2}
                      x2={xM(0) + facadePxW}
                      y2={yBelt - 2}
                      stroke="#78716C"
                      strokeWidth={0.75}
                      strokeDasharray="6 3"
                    />
                    {params.beltRusticationHasBaseProfile && (
                      <rect
                        x={xM(0) - 3}
                        y={yBelt + 2}
                        width={facadePxW + 6}
                        height={3.5}
                        fill="#D6CEBE"
                        stroke={beltStroke}
                        strokeWidth={0.9}
                      />
                    )}
                    {!params.beltRusticationHasBaseProfile && upperFloorNum === 2 && (
                      <text
                        x={xM(0) + facadePxW / 2}
                        y={yBelt + 12}
                        textAnchor="middle"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fill="#B91C1C"
                      >
                        ✕ рустовка без базового профиля (S. 16)
                      </text>
                    )}
                  </g>
                );
              }

              return (
                <g
                  key={`gurt-${upperFloorNum}`}
                  className="cursor-pointer"
                  onClick={() => onSelectElement?.('belt')}
                >
                  <rect
                    x={xM(0) - (params.beltMode === 'crowning' ? 7 : 5)}
                    y={yBelt - beltThicknessPx / 2}
                    width={facadePxW + (params.beltMode === 'crowning' ? 14 : 10)}
                    height={beltThicknessPx}
                    fill={beltFill}
                    stroke={beltStroke}
                    strokeWidth={isHi('belt') || beltStatus === 'violation' ? 1.5 : 1}
                    strokeDasharray={isSillMode ? '4 2' : undefined}
                  />
                  {upperFloorNum === 2 && (
                    <g>
                      <rect
                        x={xM(0) + facadePxW - 142}
                        y={yBelt - beltThicknessPx / 2 - 12}
                        width={138}
                        height={11}
                        fill="#FBF9F5"
                        fillOpacity={0.9}
                      />
                      <text
                        x={xM(0) + facadePxW - 6}
                        y={yBelt - beltThicknessPx / 2 - 4}
                        textAnchor="end"
                        fontSize="8.5"
                        fontFamily="IBM Plex Mono, monospace"
                        fontWeight={isHi('belt') || beltStatus !== 'ok' ? 600 : 400}
                        fill={beltStroke}
                      >
                        {isSillMode ? 'Подокон. ' : 'Лента '}
                        {formatMeters(params.hGurt, 2)}м ({STATUS_TAG[beltStatus]})
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* Corner Pilasters / Mauerpfeiler (hidden only if optional 1-story & user turned Mauerpfeiler off? keep visible by pilaster props) */}
          {[0, totalWidthM - pilasterW].map((pxStart, idx) => {
            const xLeft = xM(pxStart);
            const yTop = yFromGroundM(wallTopM);
            const hPx = wallHeightM * scale;
            const capH = params.isMauerpfeiler ? 0 : Math.min(18, hPx * 0.08);
            const baseH = params.isMauerpfeiler ? 0 : Math.min(14, hPx * 0.06);
            const strokeCol =
              isHi('pilaster') || pilasterStatus === 'violation'
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
                    <rect
                      x={xLeft - 2}
                      y={yTop}
                      width={pilasterPxW + 4}
                      height={capH}
                      fill="#DFD6C3"
                      stroke={strokeCol}
                      strokeWidth={1}
                    />
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
          <g className="cursor-pointer" onClick={() => onSelectElement?.('cornice')}>
            <rect
              x={xM(0) - corniceOverhangPx}
              y={yFromGroundM(corniceTopM)}
              width={facadePxW + corniceOverhangPx * 2}
              height={Math.max(4, huPx)}
              fill={isHi('cornice') ? STATUS_FILL[corniceStatus] : '#DFD6C3'}
              stroke={
                isHi('cornice') || corniceStatus === 'violation'
                  ? STATUS_STROKE[corniceStatus]
                  : '#292524'
              }
              strokeWidth={1.25}
            />
            <rect
              x={xM(0) - corniceOverhangPx * 0.55}
              y={yFromGroundM(corniceTopM) + Math.max(4, huPx)}
              width={facadePxW + corniceOverhangPx * 1.1}
              height={Math.max(4, hlPx)}
              fill={isHi('cornice') ? STATUS_FILL[corniceStatus] : '#EAE3D3'}
              stroke={
                isHi('cornice') || corniceStatus === 'violation'
                  ? STATUS_STROKE[corniceStatus]
                  : '#292524'
              }
              strokeWidth={1.1}
            />
          </g>

          {/* Vertical Window Axes + Windows per floor */}
          {axesM.map((axisM, axIdx) => {
            const cx = xM(axisM);
            return (
              <g key={`axis-${axIdx}`}>
                <line
                  x1={cx}
                  y1={padTop - 20}
                  x2={cx}
                  y2={groundY + 18}
                  stroke="#9A3412"
                  strokeOpacity={0.4}
                  strokeWidth={0.85}
                  strokeDasharray="5 3"
                />
                {floorOffsetsM.map((floorStartM, flIdx) => {
                  const flH = floorHeightsM[flIdx];
                  const isTopSmallest =
                    safeFloors >= 3 &&
                    flIdx === safeFloors - 1 &&
                    summary.variantInfo.rules.upperFloorSmallest;
                  const winHThisFloor = isTopSmallest
                    ? Math.min(safeWinH * 0.78, flH * 0.62)
                    : Math.min(safeWinH, flH * 0.68);
                  const sillM = Math.max(0.22, (flH - winHThisFloor) * 0.34);
                  const winTopThisM = floorStartM + sillM + winHThisFloor;

                  const winX = xM(axisM - safeW / 2);
                  const winY = yFromGroundM(winTopThisM);
                  const winWpx = safeW * scale;
                  const winHpx = winHThisFloor * scale;

                  const showRichFraming = params.withFraming && flIdx === activeFramingFloor;
                  const uPx = effectiveU * scale;
                  const { R, F, K } = summary.framingResult;
                  const rPx = R * scale;
                  const fPx = F * scale;
                  const kPx = K * scale;
                  const kOverhangPx = params.withConsoles
                    ? ((K * 5) / 6) * scale * 0.55
                    : K * scale * 0.55;

                  return (
                    <g key={`win-${axIdx}-${flIdx}`}>
                      {showRichFraming && (
                        <g
                          className="cursor-pointer"
                          onClick={() => onSelectElement?.('entablature')}
                        >
                          <rect
                            x={winX - uPx}
                            y={winY - rPx}
                            width={winWpx + 2 * uPx}
                            height={winHpx + rPx + uPx * 0.5}
                            fill={isHi('entablature') ? STATUS_FILL[entablatureStatus] : '#E6DEC9'}
                            stroke={isHi('entablature') ? STATUS_STROKE[entablatureStatus] : '#44403C'}
                            strokeWidth={1.05}
                          />
                          <rect
                            x={winX - uPx}
                            y={winY - rPx - fPx}
                            width={winWpx + 2 * uPx}
                            height={Math.max(2, fPx)}
                            fill="#EFE8D7"
                            stroke={isHi('entablature') ? STATUS_STROKE[entablatureStatus] : '#44403C'}
                            strokeWidth={0.95}
                          />
                          {params.withConsoles && (
                            <>
                              <rect
                                x={winX - uPx - 3}
                                y={winY - rPx - fPx * 0.85}
                                width={Math.max(4, uPx * 0.7)}
                                height={Math.max(4, fPx + rPx * 0.5)}
                                fill="#D6CEBE"
                                stroke="#44403C"
                                strokeWidth={0.85}
                              />
                              <rect
                                x={winX + winWpx + uPx + 3 - Math.max(4, uPx * 0.7)}
                                y={winY - rPx - fPx * 0.85}
                                width={Math.max(4, uPx * 0.7)}
                                height={Math.max(4, fPx + rPx * 0.5)}
                                fill="#D6CEBE"
                                stroke="#44403C"
                                strokeWidth={0.85}
                              />
                            </>
                          )}
                          <rect
                            x={winX - uPx - kOverhangPx}
                            y={winY - rPx - fPx - kPx}
                            width={winWpx + 2 * uPx + kOverhangPx * 2}
                            height={Math.max(3, kPx)}
                            fill="#DDD4C0"
                            stroke={isHi('entablature') ? STATUS_STROKE[entablatureStatus] : '#292524'}
                            strokeWidth={1.1}
                          />
                        </g>
                      )}

                      {params.withFraming && flIdx !== activeFramingFloor && (
                        <rect
                          x={winX - uPx * 0.65}
                          y={winY - uPx * 0.65}
                          width={winWpx + uPx * 1.3}
                          height={winHpx + uPx * 1.1}
                          fill="#EAE3D3"
                          stroke="#57534E"
                          strokeWidth={0.8}
                        />
                      )}

                      <g className="cursor-pointer" onClick={() => onSelectElement?.('window')}>
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
                          strokeWidth={isHi('window') ? 1.8 : 1.1}
                        />
                        <line
                          x1={cx}
                          y1={winY}
                          x2={cx}
                          y2={winY + winHpx}
                          stroke="#57534E"
                          strokeWidth={0.75}
                        />
                        <line
                          x1={winX}
                          y1={winY + winHpx * 0.36}
                          x2={winX + winWpx}
                          y2={winY + winHpx * 0.36}
                          stroke="#57534E"
                          strokeWidth={0.75}
                        />
                      </g>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* LEFT FLOOR TAGS & 4–5 STORY SCHEME BRACKETS */}
          {floorOffsetsM.map((floorStartM, flIdx) => {
            const flMidY = yFromGroundM(floorStartM + floorHeightsM[flIdx] / 2);
            const flNum = flIdx + 1;
            const isMainTier =
              safeFloors >= 3 && summary.variantInfo.rules.mainTierFloor === flNum;
            const isFullSocle = flNum === 1 && params.useFullFloorAsSocle;
            let tag = `${flNum} эт.`;
            if (isFullSocle) tag = '1 эт. (цоколь)';
            else if (isMainTier) tag = '2 эт. (главн.)';
            else if (safeFloors >= 3 && flNum === safeFloors && summary.variantInfo.rules.upperFloorSmallest) {
              tag = `${flNum} эт. (мал.)`;
            }
            return (
              <text
                key={`fl-tag-${flNum}`}
                x={xM(0) - 10}
                y={flMidY + 3}
                textAnchor="end"
                fontSize="9"
                fontFamily="IBM Plex Mono, monospace"
                fontWeight={isMainTier || isFullSocle ? 600 : 400}
                fill={isMainTier ? '#9A3412' : '#57534E'}
              >
                {tag}
              </text>
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
          {axesM.length >= 2 &&
            renderDimLine(
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
          {axesM.length >= 2 &&
            renderDimLine(
              xM(axesM[0] + safeW / 2 + effectiveU),
              xM(axesM[1] - safeW / 2 - effectiveU),
              groundY + 26,
              params.withFraming
                ? `p_c = ${formatMeters(p_inter)} (${STATUS_TAG[pierStatus]})`
                : `p = ${formatMeters(p_inter)} (${STATUS_TAG[pierStatus]})`,
              pierStatus,
              params.withFraming ? 'framing_pier' : 'pier'
            )}

          {/* RIGHT VERTICAL DIMENSION: h_socle, H_max & H_total */}
          {(() => {
            const dimX = xM(totalWidthM) + 28;
            const yGround = groundY;
            const ySocTop = yFromGroundM(visualSocleTopM);
            const yFloor1Top = yFromGroundM(floorOffsetsM[0] + floorHeightsM[0]);
            const yCTop = yFromGroundM(corniceTopM);
            return (
              <g>
                {/* Socle vertical dimension */}
                <g className="cursor-pointer" onClick={() => onSelectElement?.('socle')}>
                  <line x1={dimX} y1={yGround} x2={dimX} y2={ySocTop} stroke={STATUS_STROKE[socleStatus]} strokeWidth={1.25} />
                  <line x1={dimX - 4} y1={yGround} x2={dimX + 4} y2={yGround} stroke={STATUS_STROKE[socleStatus]} strokeWidth={1.25} />
                  <line x1={dimX - 4} y1={ySocTop} x2={dimX + 4} y2={ySocTop} stroke={STATUS_STROKE[socleStatus]} strokeWidth={1.25} />
                  <text
                    x={dimX + 7}
                    y={(yGround + ySocTop) / 2 + 3}
                    fontSize="9"
                    fontFamily="IBM Plex Mono, monospace"
                    fill={STATUS_STROKE[socleStatus]}
                  >
                    h_s={formatMeters(effectiveSocleH, 2)}
                  </text>
                </g>

                {/* Total building height H_total */}
                <line x1={dimX + 54} y1={yGround} x2={dimX + 54} y2={yCTop} stroke="#44403C" strokeWidth={1.1} />
                <line x1={dimX + 50} y1={yGround} x2={dimX + 58} y2={yGround} stroke="#44403C" strokeWidth={1.1} />
                <line x1={dimX + 50} y1={yCTop} x2={dimX + 58} y2={yCTop} stroke="#44403C" strokeWidth={1.1} />
                <text
                  x={dimX + 58}
                  y={(yGround + yCTop) / 2 + 3}
                  fontSize="9"
                  fontFamily="IBM Plex Mono, monospace"
                  fill="#44403C"
                >
                  H_зд={formatMeters(params.totalHeight, 1)}
                </text>

                {/* Main floor height */}
                {!params.useFullFloorAsSocle && (
                  <>
                    <line
                      x1={dimX}
                      y1={yFromGroundM(floorOffsetsM[0])}
                      x2={dimX}
                      y2={yFloor1Top}
                      stroke={STATUS_STROKE[ahStatus]}
                      strokeWidth={1.2}
                    />
                    <text
                      x={dimX + 7}
                      y={(yFromGroundM(floorOffsetsM[0]) + yFloor1Top) / 2 + 3}
                      fontSize="9"
                      fontFamily="IBM Plex Mono, monospace"
                      fill={STATUS_STROKE[ahStatus]}
                    >
                      H={formatMeters(safeH, 2)}
                    </text>
                  </>
                )}
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
