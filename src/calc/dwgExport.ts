import {
  ACadVersion,
  CadDocument,
  Color,
  DwgWriter,
  Layer,
  Line,
  LineType,
  LineTypeSegment,
  LwPolyline,
  LwPolylineVertex,
  MeasurementUnits,
  TextEntity,
  TextHorizontalAlignment,
  TextVerticalAlignmentType,
  UnitsType,
  XY,
  XYZ,
} from '@node-projects/acad-ts';
import {
  formatMeters,
  resolveEntranceGeometry,
  type FacadeParameters,
  type FacadeSummary,
} from './rules';

const MM = 1000;

function addRect(
  doc: CadDocument,
  layer: Layer,
  xMm: number,
  yMm: number,
  wMm: number,
  hMm: number,
  color?: Color
) {
  if (wMm <= 0 || hMm <= 0) return;
  const poly = new LwPolyline([
    new LwPolylineVertex(new XY(xMm, yMm)),
    new LwPolylineVertex(new XY(xMm + wMm, yMm)),
    new LwPolylineVertex(new XY(xMm + wMm, yMm + hMm)),
    new LwPolylineVertex(new XY(xMm, yMm + hMm)),
  ]);
  poly.isClosed = true;
  poly.layer = layer;
  if (color) poly.color = color;
  doc.modelSpace?.entities.add(poly);
}

function addLine(
  doc: CadDocument,
  layer: Layer,
  x1Mm: number,
  y1Mm: number,
  x2Mm: number,
  y2Mm: number,
  color?: Color
) {
  const line = new Line(new XYZ(x1Mm, y1Mm, 0), new XYZ(x2Mm, y2Mm, 0));
  line.layer = layer;
  if (color) line.color = color;
  doc.modelSpace?.entities.add(line);
}

function addText(
  doc: CadDocument,
  layer: Layer,
  text: string,
  xMm: number,
  yMm: number,
  heightMm: number,
  options?: {
    hAlign?: TextHorizontalAlignment;
    vAlign?: TextVerticalAlignmentType;
    rotationDeg?: number;
    color?: Color;
  }
) {
  const entity = new TextEntity(text);
  entity.insertPoint = new XYZ(xMm, yMm, 0);
  entity.alignmentPoint = new XYZ(xMm, yMm, 0);
  entity.height = heightMm;
  entity.horizontalAlignment = options?.hAlign ?? TextHorizontalAlignment.Left;
  entity.verticalAlignment = options?.vAlign ?? TextVerticalAlignmentType.Baseline;
  if (options?.rotationDeg) {
    entity.rotation = (options.rotationDeg * Math.PI) / 180;
  }
  entity.layer = layer;
  if (options?.color) entity.color = options.color;
  doc.modelSpace?.entities.add(entity);
}

function addHorizontalDimension(
  doc: CadDocument,
  layer: Layer,
  x1Mm: number,
  x2Mm: number,
  yLineMm: number,
  yRefMm: number,
  label: string,
  color?: Color
) {
  const minX = Math.min(x1Mm, x2Mm);
  const maxX = Math.max(x1Mm, x2Mm);
  const tick = 70;
  const dir = yLineMm >= yRefMm ? 1 : -1;

  // Выносные линии
  addLine(doc, layer, minX, yRefMm, minX, yLineMm + dir * 120, color);
  addLine(doc, layer, maxX, yRefMm, maxX, yLineMm + dir * 120, color);
  // Размерная линия
  addLine(doc, layer, minX - 100, yLineMm, maxX + 100, yLineMm, color);
  // Архитектурные засечки 45°
  addLine(doc, layer, minX - tick, yLineMm - tick, minX + tick, yLineMm + tick, color);
  addLine(doc, layer, maxX - tick, yLineMm - tick, maxX + tick, yLineMm + tick, color);

  addText(doc, layer, label, (minX + maxX) / 2, yLineMm + 95, 130, {
    hAlign: TextHorizontalAlignment.Center,
    vAlign: TextVerticalAlignmentType.Bottom,
    color,
  });
}

function addVerticalDimension(
  doc: CadDocument,
  layer: Layer,
  y1Mm: number,
  y2Mm: number,
  xLineMm: number,
  xRefMm: number,
  label: string,
  color?: Color
) {
  const minY = Math.min(y1Mm, y2Mm);
  const maxY = Math.max(y1Mm, y2Mm);
  const tick = 70;
  const dir = xLineMm >= xRefMm ? 1 : -1;

  addLine(doc, layer, xRefMm, minY, xLineMm + dir * 120, minY, color);
  addLine(doc, layer, xRefMm, maxY, xLineMm + dir * 120, maxY, color);
  addLine(doc, layer, xLineMm, minY - 100, xLineMm, maxY + 100, color);
  addLine(doc, layer, xLineMm - tick, minY - tick, xLineMm + tick, minY + tick, color);
  addLine(doc, layer, xLineMm - tick, maxY - tick, xLineMm + tick, maxY + tick, color);

  addText(doc, layer, label, xLineMm + 130, (minY + maxY) / 2, 130, {
    hAlign: TextHorizontalAlignment.Left,
    vAlign: TextVerticalAlignmentType.Middle,
    color,
  });
}

function ensureLayer(
  doc: CadDocument,
  name: string,
  colorIndex: number,
  lineType?: LineType
): Layer {
  const existing = doc.layers?.tryGetValue(name);
  if (existing) return existing;
  const layer = new Layer(name);
  layer.color = new Color(colorIndex);
  if (lineType) {
    layer.lineType = lineType;
  }
  doc.layers?.add(layer);
  return layer;
}

/**
 * Формирует CAD-документ (CadDocument) ортогонального чертежа фасада
 * в миллиметрах (1 м = 1000 ед.) по текущим параметрам Brausewetter 1895.
 */
export function buildFacadeCadDocument(
  params: FacadeParameters,
  summary: FacadeSummary
): CadDocument {
  const doc = new CadDocument(ACadVersion.AC1027);
  doc.header!.insUnits = UnitsType.Millimeters;
  doc.header!.measurementUnits = MeasurementUnits.Metric;
  doc.summaryInfo!.title = 'Brausewetter (1895) — Ортогональный чертёж фасада';
  doc.summaryInfo!.comments = 'Экспортировано из калькулятора пропорций фасада (Das Bauformenbuch, Bd. 1)';

  // Осевой штрихпунктир для вертикальных осей
  const axisLineType = new LineType('DASHDOT_AXES');
  axisLineType.description = 'Осевая линия __ . __ . __';
  const dashSeg = new LineTypeSegment();
  dashSeg.length = 450;
  const gap1Seg = new LineTypeSegment();
  gap1Seg.length = -120;
  const dotSeg = new LineTypeSegment();
  dotSeg.length = 20;
  const gap2Seg = new LineTypeSegment();
  gap2Seg.length = -120;
  axisLineType.addSegment(dashSeg);
  axisLineType.addSegment(gap1Seg);
  axisLineType.addSegment(dotSeg);
  axisLineType.addSegment(gap2Seg);
  doc.lineTypes?.add(axisLineType);

  const layerWalls = ensureLayer(doc, '01_WALL_FACADE', 7);
  const layerSocle = ensureLayer(doc, '02_SOCLE', 34);
  const layerCornice = ensureLayer(doc, '03_CORNICE', 30);
  const layerBelts = ensureLayer(doc, '04_BELTS', 40);
  const layerOpenings = ensureLayer(doc, '05_WINDOWS_DOORS', 4);
  const layerPilasters = ensureLayer(doc, '06_PILASTERS', 8);
  const layerAxes = ensureLayer(doc, '07_AXES', 1, axisLineType);
  const layerDims = ensureLayer(doc, '08_DIMENSIONS', 3);
  const layerNotes = ensureLayer(doc, '09_ANNOTATIONS', 7);

  // Расчёт геометрии в метрах (аналогично FacadeSvg)
  const safeH = Math.max(1.8, summary.derivedGeometry.H_max);
  const safeA = Math.max(1.0, params.A);
  const safeW = Math.max(0.4, params.w);
  const safeWinH = Math.max(0.6, params.h);
  const effectiveU = params.withFraming ? Math.max(0, params.u) : 0;
  const D = params.isRisalitCentered
    ? Math.max(0.6, params.risalitWidth / 2)
    : Math.max(0.5, safeA * params.k_D);

  const safeAxesCount = Math.min(10, Math.max(2, Math.round(params.axesCount)));
  const levelFloors = params.levels.floors;
  const safeFloors = Math.min(6, Math.max(1, levelFloors.length));
  const axesM = Array.from({ length: safeAxesCount }, (_, i) => D + i * safeA);
  const totalWidthM = summary.derivedGeometry.facadeWidth;

  const groundToFloor1 = Math.max(0.25, params.levels.groundToFloor1);
  const effectiveSocleH = params.useFullFloorAsSocle
    ? summary.derivedGeometry.floor1FullHeight
    : Math.max(0.25, params.hSocle);
  const corniceM = Math.max(0.2, params.hMain);

  const floorHeightsM = levelFloors
    .slice(0, safeFloors)
    .map((fl) => Math.max(1.8, fl.floorToFloor));

  const floorOffsetsM: number[] = [];
  let cursorM = groundToFloor1;
  for (let i = 0; i < safeFloors; i++) {
    floorOffsetsM.push(cursorM);
    cursorM += floorHeightsM[i];
  }
  const wallTopM = cursorM;
  const wallHeightM = wallTopM - groundToFloor1;
  const corniceTopM = wallTopM + corniceM;
  const totalHeightM = summary.derivedGeometry.totalHeight;
  const plinthM = params.useFullFloorAsSocle
    ? summary.derivedGeometry.floor1FullHeight
    : Math.min(effectiveSocleH, wallTopM * 0.48);

  const visualSocleTopM = params.useFullFloorAsSocle ? plinthM + floorHeightsM[0] : plinthM;

  // 1. Линия земли и основной контур стены фасада
  addLine(doc, layerWalls, -1000, 0, totalWidthM * MM + 1000, 0);
  addRect(doc, layerWalls, 0, 0, totalWidthM * MM, wallTopM * MM);

  // 2. Цоколь и рустовка
  const partsSum = Math.max(
    0.01,
    summary.threePartSocleResult.fuss +
      summary.threePartSocleResult.rumpf +
      summary.threePartSocleResult.deck
  );
  const deckM = (summary.threePartSocleResult.deck / partsSum) * visualSocleTopM;
  const fussM = (summary.threePartSocleResult.fuss / partsSum) * visualSocleTopM;
  const rumpfM = Math.max(0.05, visualSocleTopM - deckM - fussM);
  const rustCourses = Math.min(12, Math.max(1, summary.rusticationCheck.n));

  addRect(doc, layerSocle, -30, 0, totalWidthM * MM + 60, visualSocleTopM * MM);
  if (!params.useFullFloorAsSocle) {
    addRect(doc, layerSocle, -45, 0, totalWidthM * MM + 90, fussM * MM);
    addRect(
      doc,
      layerSocle,
      -45,
      (visualSocleTopM - deckM) * MM,
      totalWidthM * MM + 90,
      deckM * MM
    );
    for (let r = 1; r < rustCourses; r++) {
      const yRust = (fussM + (r / rustCourses) * rumpfM) * MM;
      addLine(doc, layerSocle, -20, yRust, totalWidthM * MM + 20, yRust);
    }
  }

  // 3. Колоннада нижнего яруса (если включена)
  if (params.beltHasColumnsBelow && safeFloors >= 2) {
    const yBot = floorOffsetsM[0] * MM;
    const yTop = floorOffsetsM[1] * MM;
    const colH = Math.max(200, yTop - yBot);
    for (let i = 0; i < axesM.length - 1; i++) {
      const colCenterMm = (axesM[i] + safeA / 2) * MM;
      addRect(doc, layerPilasters, colCenterMm - 140, yBot + 120, 280, Math.max(200, colH - 240));
      addRect(doc, layerPilasters, colCenterMm - 190, yBot, 380, 120);
      addRect(doc, layerPilasters, colCenterMm - 190, yTop - 120, 380, 120);
    }
  }

  // 4. Межэтажные карнизы-ленты (Gurtgesimse)
  if (safeFloors >= 2) {
    floorOffsetsM.slice(1).forEach((floorStartM, idx) => {
      const upperFloorNum = idx + 2;
      const upperFloorH = floorHeightsM[idx + 1] ?? floorHeightsM[0] ?? safeH;
      const isUpperBelt = upperFloorNum === 3;

      if (
        params.buildingVariant === 'multi-story' &&
        params.multiSub === 'three' &&
        isUpperBelt &&
        params.threeStoryGurtMode === 'unified_upper'
      ) {
        addLine(doc, layerBelts, 0, floorStartM * MM, totalWidthM * MM, floorStartM * MM);
        return;
      }

      if (params.beltIsAbsent) {
        addLine(doc, layerBelts, 0, floorStartM * MM, totalWidthM * MM, floorStartM * MM);
        return;
      }

      const isThirdSohlbank =
        params.buildingVariant === 'multi-story' &&
        params.multiSub === 'three' &&
        isUpperBelt &&
        params.threeStoryGurtMode === 'third_sohlbank';
      const isSillMode = params.beltIsSillCornice || isThirdSohlbank;
      const sillShiftM = isSillMode ? Math.min(0.45, upperFloorH * 0.16) : 0;
      const yBeltMm = (floorStartM + sillShiftM) * MM;

      if (params.beltAsRusticationMode) {
        addLine(doc, layerBelts, 0, yBeltMm + 60, totalWidthM * MM, yBeltMm + 60);
        addLine(doc, layerBelts, 0, yBeltMm + 140, totalWidthM * MM, yBeltMm + 140);
        if (params.beltRusticationHasBaseProfile) {
          addRect(doc, layerBelts, -35, yBeltMm - 70, totalWidthM * MM + 70, 70);
        }
        return;
      }

      const beltThicknessMm = isSillMode ? 120 : Math.max(80, params.hGurt * MM);
      const overhangMm = params.beltMode === 'crowning' ? 110 : 75;
      addRect(
        doc,
        layerBelts,
        -overhangMm,
        yBeltMm - beltThicknessMm / 2,
        totalWidthM * MM + overhangMm * 2,
        beltThicknessMm
      );
    });
  }

  // 5. Угловые пилястры / Mauerpfeiler
  const p_corner = D - safeW / 2 - effectiveU;
  const pilasterW = Math.min(params.Wp, Math.max(0.2, p_corner * 0.72));
  [0, totalWidthM - pilasterW].forEach((pxStart) => {
    const capH = params.isMauerpfeiler ? 0 : Math.min(0.45, wallHeightM * 0.08);
    const baseH = params.isMauerpfeiler ? 0 : Math.min(0.35, wallHeightM * 0.06);
    addRect(
      doc,
      layerPilasters,
      pxStart * MM,
      (groundToFloor1 + baseH) * MM,
      pilasterW * MM,
      Math.max(0.2, wallHeightM - capH - baseH) * MM
    );
    if (!params.isMauerpfeiler) {
      addRect(
        doc,
        layerPilasters,
        pxStart * MM - 40,
        (wallTopM - capH) * MM,
        pilasterW * MM + 80,
        capH * MM
      );
      addRect(
        doc,
        layerPilasters,
        pxStart * MM - 40,
        groundToFloor1 * MM,
        pilasterW * MM + 80,
        baseH * MM
      );
    }
  });

  // 6. Главный карниз (Hauptgesims) — строго от wallTopM до corniceTopM
  const boostMult =
    safeFloors === 5 && params.fiveStoryScheme === 'rich_1_2_unified'
      ? Math.max(1, params.mainCorniceProjectionBoost)
      : 1;
  const corniceOverhangMm = Math.min(600, Math.max(160, corniceM * MM * 0.55)) * boostMult;
  const tcSumM = Math.max(0.05, summary.corniceCheck.h_u + summary.corniceCheck.h_l);
  const hasCorniceFrieze = corniceM > tcSumM + 0.04;
  const corniceFriezeMm = hasCorniceFrieze ? (corniceM - tcSumM) * MM : 0;
  const huMm = Math.max(
    40,
    (hasCorniceFrieze ? summary.corniceCheck.h_u : corniceM * (summary.corniceCheck.h_u / tcSumM)) * MM
  );
  const hlMm = Math.max(40, corniceM * MM - corniceFriezeMm - huMm);

  const friezeBottomMm = wallTopM * MM;
  if (corniceFriezeMm > 0) {
    addRect(
      doc,
      layerCornice,
      -corniceOverhangMm * 0.16,
      friezeBottomMm,
      totalWidthM * MM + corniceOverhangMm * 0.32,
      corniceFriezeMm
    );
  }
  const hlBottomMm = friezeBottomMm + corniceFriezeMm;
  const huBottomMm = hlBottomMm + hlMm;

  addRect(
    doc,
    layerCornice,
    -corniceOverhangMm * 0.55,
    hlBottomMm,
    totalWidthM * MM + corniceOverhangMm * 1.1,
    hlMm
  );
  addRect(
    doc,
    layerCornice,
    -corniceOverhangMm,
    huBottomMm,
    totalWidthM * MM + corniceOverhangMm * 2,
    huMm
  );

  // 7. Оси, окна, двери и обрамления (наличники / сандрики)
  const entranceGeo = resolveEntranceGeometry(params, totalWidthM, axesM);
  const activeFramingFloor = safeFloors >= 2 ? 1 : 0;

  axesM.forEach((axisM, axIdx) => {
    const cxMm = axisM * MM;
    addLine(doc, layerAxes, cxMm, -300, cxMm, corniceTopM * MM + 350);

    floorOffsetsM.forEach((floorStartM, flIdx) => {
      const isDoorReplacedWindow =
        entranceGeo.hasDoor && flIdx === 0 && axIdx === entranceGeo.doorAxisIndex;
      if (isDoorReplacedWindow) {
        return;
      }
      const flH = floorHeightsM[flIdx];
      const clearH =
        levelFloors[flIdx]?.clearHeight ??
        Math.max(2.0, flH - (levelFloors[flIdx]?.slabThickness ?? 0.35));
      const isTopSmallest =
        safeFloors >= 3 &&
        flIdx === safeFloors - 1 &&
        summary.variantInfo.rules.upperFloorSmallest;
      const winHThisFloor = isTopSmallest
        ? Math.min(safeWinH * 0.78, clearH * 0.64)
        : Math.min(safeWinH, clearH * 0.72);
      const sillM = Math.max(0.22, (clearH - winHThisFloor) * 0.36);
      const winBotM = floorStartM + sillM;

      const winXMm = (axisM - safeW / 2) * MM;
      const winYMm = winBotM * MM;
      const winWMm = safeW * MM;
      const winHMm = winHThisFloor * MM;

      const showRichFraming = params.withFraming && flIdx === activeFramingFloor;
      const uMm = effectiveU * MM;
      const { R, F, K } = summary.framingResult;
      const rMm = R * MM;
      const fMm = F * MM;
      const kMm = K * MM;
      const kOverhangMm = params.withConsoles
        ? ((K * 5) / 6) * MM * 0.55
        : K * MM * 0.55;

      if (showRichFraming) {
        // Наличник + архитрав
        addRect(
          doc,
          layerOpenings,
          winXMm - uMm,
          winYMm - uMm * 0.5,
          winWMm + 2 * uMm,
          winHMm + uMm * 0.5 + rMm
        );
        // Фриз
        addRect(
          doc,
          layerOpenings,
          winXMm - uMm,
          winYMm + winHMm + rMm,
          winWMm + 2 * uMm,
          Math.max(40, fMm)
        );
        // Консоли
        if (params.withConsoles) {
          const consW = Math.max(70, uMm * 0.7);
          const consH = Math.max(80, fMm + rMm * 0.5);
          const consY = winYMm + winHMm + rMm + fMm - consH;
          addRect(doc, layerOpenings, winXMm - uMm - consW * 0.4, consY, consW, consH);
          addRect(
            doc,
            layerOpenings,
            winXMm + winWMm + uMm + consW * 0.4 - consW,
            consY,
            consW,
            consH
          );
        }
        // Карниз сандрика
        addRect(
          doc,
          layerOpenings,
          winXMm - uMm - kOverhangMm,
          winYMm + winHMm + rMm + fMm,
          winWMm + 2 * uMm + kOverhangMm * 2,
          Math.max(50, kMm)
        );
      } else if (params.withFraming && uMm > 0) {
        addRect(
          doc,
          layerOpenings,
          winXMm - uMm * 0.65,
          winYMm - uMm * 0.45,
          winWMm + uMm * 1.3,
          winHMm + uMm * 1.1
        );
      }

      // Проём окна и переплёт
      addRect(doc, layerOpenings, winXMm, winYMm, winWMm, winHMm);
      addLine(doc, layerOpenings, cxMm, winYMm, cxMm, winYMm + winHMm);
      addLine(
        doc,
        layerOpenings,
        winXMm,
        winYMm + winHMm * 0.64,
        winXMm + winWMm,
        winYMm + winHMm * 0.64
      );
    });
  });

  if (entranceGeo.hasDoor) {
    const doorCxMm = entranceGeo.doorCenterX * MM;
    const doorWMm = Math.max(600, entranceGeo.doorWidthM * MM);
    const doorXMm = doorCxMm - doorWMm / 2;
    const doorBotMm = Math.max(0, entranceGeo.doorBottomM * MM);
    const doorHMm = Math.max(1200, entranceGeo.doorHeightM * MM);
    addRect(doc, layerOpenings, doorXMm - 70, doorBotMm, doorWMm + 140, doorHMm + 70);
    addRect(doc, layerOpenings, doorXMm, doorBotMm, doorWMm, doorHMm);
    addLine(doc, layerOpenings, doorCxMm, doorBotMm, doorCxMm, doorBotMm + doorHMm);
    if (entranceGeo.doorBottomM > 0.05) {
      const stepCount = Math.min(6, Math.max(2, Math.round(entranceGeo.doorBottomM / 0.16)));
      for (let sIdx = 0; sIdx < stepCount; sIdx++) {
        const y0 = doorBotMm * (1 - (sIdx + 1) / stepCount);
        const stepH = doorBotMm / stepCount;
        const stepGrowMm = (sIdx + 1) * 180;
        addRect(
          doc,
          layerOpenings,
          doorXMm - 70 - stepGrowMm,
          y0,
          doorWMm + 140 + stepGrowMm * 2,
          stepH
        );
      }
    }
  }

  // 8. Отметки этажей слева
  floorOffsetsM.forEach((floorStartM, flIdx) => {
    const flNum = flIdx + 1;
    const midYMm = (floorStartM + floorHeightsM[flIdx] / 2) * MM;
    const isMainTier = safeFloors >= 3 && summary.variantInfo.rules.mainTierFloor === flNum;
    const isFullSocle = flNum === 1 && params.useFullFloorAsSocle;
    const isUnified12 =
      safeFloors === 5 &&
      params.fiveStoryScheme === 'rich_1_2_unified' &&
      (flNum === 1 || flNum === 2);
    let tag = `${flNum} эт.`;
    if (isUnified12) tag = `${flNum} эт. (объед.)`;
    else if (isFullSocle) tag = '1 эт. (цоколь)';
    else if (isMainTier) tag = '2 эт. (главн.)';
    else if (safeFloors >= 3 && flNum === safeFloors && summary.variantInfo.rules.upperFloorSmallest) {
      tag = `${flNum} эт. (мал.)`;
    }
    addText(doc, layerNotes, tag, -350, midYMm, 140, {
      hAlign: TextHorizontalAlignment.Right,
      vAlign: TextVerticalAlignmentType.Middle,
    });
  });

  // 9. Размерные цепи
  const topDimY = corniceTopM * MM + 550;
  addHorizontalDimension(
    doc,
    layerDims,
    0,
    axesM[0] * MM,
    topDimY,
    wallTopM * MM,
    `D = ${formatMeters(D, 2)} м`
  );
  if (axesM.length >= 2) {
    addHorizontalDimension(
      doc,
      layerDims,
      axesM[0] * MM,
      axesM[1] * MM,
      topDimY,
      wallTopM * MM,
      `A = ${formatMeters(safeA, 2)} м`
    );
  }
  addHorizontalDimension(
    doc,
    layerDims,
    0,
    totalWidthM * MM,
    topDimY + 480,
    wallTopM * MM,
    `W = ${formatMeters(totalWidthM, 2)} м`
  );

  // Нижние размеры: p_cor, w / w_v, p / p_c
  const p_inter = safeA - safeW - 2 * effectiveU;
  const w_v = safeW + 2 * effectiveU;
  const botDimY1 = -550;
  const botDimY2 = -1050;

  addHorizontalDimension(
    doc,
    layerDims,
    0,
    (axesM[0] - safeW / 2 - effectiveU) * MM,
    botDimY1,
    0,
    `p_cor = ${formatMeters(p_corner, 2)} м`
  );
  addHorizontalDimension(
    doc,
    layerDims,
    (axesM[0] - safeW / 2 - effectiveU) * MM,
    (axesM[0] + safeW / 2 + effectiveU) * MM,
    botDimY2,
    0,
    params.withFraming
      ? `w_v = ${formatMeters(w_v, 2)} (w=${formatMeters(safeW, 2)}) м`
      : `w = ${formatMeters(safeW, 2)} м`
  );
  if (axesM.length >= 2) {
    addHorizontalDimension(
      doc,
      layerDims,
      (axesM[0] + safeW / 2 + effectiveU) * MM,
      (axesM[1] - safeW / 2 - effectiveU) * MM,
      botDimY1,
      0,
      params.withFraming
        ? `p_c = ${formatMeters(p_inter, 2)} м`
        : `p = ${formatMeters(p_inter, 2)} м`
    );
  }

  // Правые высотные размеры: цоколь, этаж H, общая высота H_зд
  const rightDimX1 = totalWidthM * MM + 550;
  const rightDimX2 = totalWidthM * MM + 1450;
  addVerticalDimension(
    doc,
    layerDims,
    0,
    visualSocleTopM * MM,
    rightDimX1,
    totalWidthM * MM,
    `h_s = ${formatMeters(effectiveSocleH, 2)} м`
  );
  if (!params.useFullFloorAsSocle) {
    addVerticalDimension(
      doc,
      layerDims,
      floorOffsetsM[0] * MM,
      (floorOffsetsM[0] + floorHeightsM[0]) * MM,
      rightDimX1,
      totalWidthM * MM,
      `H = ${formatMeters(safeH, 2)} м`
    );
  }
  addVerticalDimension(
    doc,
    layerDims,
    0,
    corniceTopM * MM,
    rightDimX2,
    totalWidthM * MM,
    `H_зд = ${formatMeters(totalHeightM, 2)} м`
  );

  // 10. Подпись чертежа и сводка параметров снизу
  const footerY = -1700;
  addText(
    doc,
    layerNotes,
    `Brausewetter (1895) · Ортогональный чертёж фасада (${safeFloors} эт., ${safeAxesCount} осей) · 1 ед. = 1 мм`,
    0,
    footerY,
    180
  );
  addText(
    doc,
    layerNotes,
    `W = ${formatMeters(totalWidthM, 2)} м | H_зд = ${formatMeters(totalHeightM, 2)} м | A:H = ${formatMeters(summary.ahCheck.ratio, 3)} | Окно = ${formatMeters(safeW, 2)} x ${formatMeters(safeWinH, 2)} м | Гл. карниз = ${formatMeters(corniceM, 2)} м`,
    0,
    footerY - 300,
    135
  );

  return doc;
}

/**
 * Сериализует чертёж в бинарный формат AutoCAD DWG (AC1027 / R2013).
 */
export function exportFacadeToDwg(
  params: FacadeParameters,
  summary: FacadeSummary
): Uint8Array {
  const doc = buildFacadeCadDocument(params, summary);
  return DwgWriter.writeToBuffer(doc);
}

/**
 * Генерирует .dwg файл и запускает скачивание в браузере.
 */
export function downloadFacadeDwg(
  params: FacadeParameters,
  summary: FacadeSummary
): void {
  const bytes = exportFacadeToDwg(params, summary);
  const safeFloors = Math.min(6, Math.max(1, params.levels.floors.length));
  const safeAxesCount = Math.min(10, Math.max(2, Math.round(params.axesCount)));
  const fileName = `brausewetter-facade-${safeFloors}et-${safeAxesCount}ax.dwg`;

  const blob = new Blob([bytes.slice().buffer], { type: 'application/acad' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
