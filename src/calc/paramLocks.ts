import {
  D_from_A,
  buildDefaultLevels,
  computeDerivedGeometry,
  framing_from_T,
  framing_from_module,
  resolveWindowAxisStepsM,
  syncLevelsWithH,
  type BuildingLevelsInput,
  type FacadeParameters,
  type ThreePartSocleParts,
} from './rules';
import {
  captureBrickMasonryBaseArch,
  coordinateFacadeWithBrickMasonry,
  restoreBrickMasonryBaseArch,
  sanitizeBrickParams,
} from './brickMasonry';

export type LockedParamsMap = Record<string, boolean>;

export function isParamLocked(
  locks: LockedParamsMap | undefined,
  key: string
): boolean {
  return Boolean(locks && locks[key]);
}

/**
 * Единый замок для ширины обрамления u (раздел 4.1) и высоты элемента R (раздел 4.4),
 * так как R и u — одно и то же число.
 */
export function isFramingRLocked(locks: LockedParamsMap | undefined): boolean {
  return Boolean(locks && (locks['u'] || locks['R']));
}

export function countLockedParams(locks: LockedParamsMap | undefined): number {
  if (!locks) return 0;
  return Object.values(locks).filter(Boolean).length;
}

/**
 * Фильтрует обновление параметров FacadeParameters так, чтобы ни один
 * закреплённый замочком параметр не был изменён (включая поэтажные отметки
 * Levels, доли трёхчастного цоколя и пресеты типологии / этажности).
 */
export function filterUnlockedPatch(
  prev: FacadeParameters,
  patch: Partial<FacadeParameters>,
  locks: LockedParamsMap
): Partial<FacadeParameters> {
  if (!locks || countLockedParams(locks) === 0) {
    return patch;
  }

  const nextPatch: Partial<FacadeParameters> = {};
  const mutable = nextPatch as Record<string, unknown>;

  for (const [key, value] of Object.entries(patch)) {
    if (
      value === undefined &&
      key !== 'ordinaryPierAxisSpacings' &&
      key !== 'corniceBottomOffsetM'
    ) {
      continue;
    }
    if (key === 'levels' || key === 'socleParts') continue;
    if (key === 'u' && (locks['u'] || locks['R'])) {
      continue;
    }
    if (key === 'ordinaryPierAxisSpacings' && locks['A']) {
      continue;
    }
    if (locks[key]) {
      continue;
    }
    mutable[key] = value;
  }

  // Защита долей трёхчастного цоколя
  if (patch.socleParts) {
    const mergedParts: ThreePartSocleParts = {
      fuss: locks['socleParts.fuss'] ? prev.socleParts.fuss : patch.socleParts.fuss,
      rumpf: locks['socleParts.rumpf'] ? prev.socleParts.rumpf : patch.socleParts.rumpf,
      deck: locks['socleParts.deck'] ? prev.socleParts.deck : patch.socleParts.deck,
    };
    nextPatch.socleParts = mergedParts;
  }

  // Защита поэтажной модели Levels (groundToFloor1, manualTotalHeight, этажи)
  if (patch.levels) {
    const incomingLevels = patch.levels;
    const keepFloorCount = Boolean(locks['floors']);
    const targetCount = keepFloorCount
      ? prev.levels.floors.length
      : incomingLevels.floors.length;

    const mergedFloors = Array.from({ length: targetCount }, (_, idx) => {
      const prevFloor = prev.levels.floors[idx];
      const incFloor = incomingLevels.floors[idx] ?? prevFloor ?? prev.levels.floors[0];
      const f2fLocked =
        Boolean(locks[`levels.floor.${idx}.floorToFloor`]) || Boolean(locks['H']);
      const slabLocked = Boolean(locks[`levels.floor.${idx}.slabThickness`]);

      const floorToFloor =
        f2fLocked && prevFloor ? prevFloor.floorToFloor : incFloor.floorToFloor;
      const slabThickness =
        slabLocked && prevFloor ? prevFloor.slabThickness : incFloor.slabThickness;

      return {
        floorToFloor,
        slabThickness,
        clearHeight: Number(Math.max(1.5, floorToFloor - slabThickness).toFixed(3)),
      };
    });

    const manualTotalHeight =
      locks['levels.manualTotalHeight'] || locks['totalHeight']
        ? prev.levels.manualTotalHeight
        : incomingLevels.manualTotalHeight;

    const mergedLevels: BuildingLevelsInput = {
      groundToFloor1: locks['levels.groundToFloor1']
        ? prev.levels.groundToFloor1
        : incomingLevels.groundToFloor1,
      floors: mergedFloors,
      ...(manualTotalHeight !== undefined ? { manualTotalHeight } : {}),
    };

    nextPatch.levels = mergedLevels;
  }

  if (locks['floors'] && nextPatch.floors !== undefined) {
    delete nextPatch.floors;
  }

  if (locks['totalHeight'] && nextPatch.totalHeight !== undefined) {
    delete nextPatch.totalHeight;
  }

  if (locks['H'] && nextPatch.H !== undefined) {
    delete nextPatch.H;
  }

  if (locks['entrancePosition']) {
    delete nextPatch.hasEntrance;
    delete nextPatch.entrancePlacement;
    delete nextPatch.entranceAxisIndex;
  }

  if (locks['entranceTopM']) {
    const prevTop = (prev.entranceBottomM ?? 0) + (prev.entranceHeightM ?? 2.4);
    if (!locks['entranceHeightM'] && nextPatch.entranceBottomM !== undefined) {
      const clampedBottom = Math.min(
        Math.max(0, nextPatch.entranceBottomM),
        Math.max(0, prevTop - 1.2)
      );
      nextPatch.entranceBottomM = Number(clampedBottom.toFixed(3));
      nextPatch.entranceHeightM = Number(Math.max(1.2, prevTop - clampedBottom).toFixed(3));
    } else if (!locks['entranceBottomM'] && nextPatch.entranceHeightM !== undefined) {
      const clampedH = Math.min(
        Math.max(1.2, nextPatch.entranceHeightM),
        Math.max(1.2, prevTop)
      );
      nextPatch.entranceHeightM = Number(clampedH.toFixed(3));
      nextPatch.entranceBottomM = Number(Math.max(0, prevTop - clampedH).toFixed(3));
    } else {
      delete nextPatch.entranceBottomM;
      delete nextPatch.entranceHeightM;
    }
  }

  if (patch.windowSillHeights) {
    nextPatch.windowSillHeights = patch.windowSillHeights.map((val, idx) =>
      locks[`windowSillHeights.${idx}`] ? prev.windowSillHeights?.[idx] : val
    );
  }

  if (patch.beltFloors) {
    nextPatch.beltFloors = patch.beltFloors.map((val, idx) =>
      locks[`beltFloors.${idx}`] ? Boolean(prev.beltFloors?.[idx]) : val
    );
  }

  return nextPatch;
}

/**
 * Применяет обновление параметров с учётом всех замков и взаимной
 * синхронизации уровней, проёмов и пары R (= u) / T.
 */
export function computeNextFacadeParams(
  prev: FacadeParameters,
  rawPatch: Partial<FacadeParameters>,
  lockedParams: LockedParamsMap
): FacadeParameters {
  const patch = filterUnlockedPatch(prev, rawPatch, lockedParams);
  if (Object.keys(patch).length === 0) return prev;

  const next: FacadeParameters = { ...prev, ...patch };
  const isHLocked = isParamLocked(lockedParams, 'H');
  const isFloorsLocked = isParamLocked(lockedParams, 'floors');
  const isTotalHeightLocked =
    isParamLocked(lockedParams, 'totalHeight') ||
    isParamLocked(lockedParams, 'levels.manualTotalHeight');

  if (patch.levels === undefined) {
    if (!isFloorsLocked && patch.floors !== undefined && patch.floors !== prev.floors) {
      const baseLevels = buildDefaultLevels(
        Math.max(1, Math.round(patch.floors)),
        isHLocked ? prev.H : next.H,
        prev.levels.groundToFloor1
      );
      next.levels =
        filterUnlockedPatch(prev, { levels: baseLevels }, lockedParams).levels ?? baseLevels;
    } else if (!isHLocked && patch.H !== undefined && patch.H !== prev.H) {
      const synced = syncLevelsWithH(prev.levels, patch.H);
      next.levels = filterUnlockedPatch(prev, { levels: synced }, lockedParams).levels ?? synced;
    }

    if (
      !isTotalHeightLocked &&
      patch.totalHeight !== undefined &&
      patch.totalHeight !== prev.totalHeight
    ) {
      next.levels = {
        ...next.levels,
        manualTotalHeight: patch.totalHeight,
      };
    }
  }

  if (
    !isParamLocked(lockedParams, 'A') &&
    'ordinaryPierAxisSpacings' in rawPatch &&
    rawPatch.ordinaryPierAxisSpacings === undefined
  ) {
    next.ordinaryPierAxisSpacings = undefined;
  }

  if (
    !isParamLocked(lockedParams, 'corniceBottomOffsetM') &&
    'corniceBottomOffsetM' in rawPatch &&
    rawPatch.corniceBottomOffsetM === undefined
  ) {
    next.corniceBottomOffsetM = undefined;
  }

  if (
    patch.axesCount !== undefined &&
    patch.axesCount !== prev.axesCount &&
    !('ordinaryPierAxisSpacings' in rawPatch) &&
    next.ordinaryPierAxisSpacings &&
    next.ordinaryPierAxisSpacings.length > 0
  ) {
    const nextGapCount = Math.max(0, Math.round(next.axesCount) - 2);
    next.ordinaryPierAxisSpacings =
      nextGapCount > 0
        ? Array.from(
            { length: nextGapCount },
            (_, idx) => next.ordinaryPierAxisSpacings?.[idx] ?? next.A
          )
        : undefined;
  }

  const axisStepsM = next.axesCount >= 2 ? resolveWindowAxisStepsM(next) : [];
  const effectiveAForD = axisStepsM[0] ?? next.A;
  const D = next.isRisalitCentered
    ? next.risalitWidth / 2
    : D_from_A(effectiveAForD, next.k_D);
  const dg = computeDerivedGeometry(
    next.levels,
    next.A,
    D,
    next.axesCount,
    next.hMain,
    axisStepsM,
    next.corniceBottomOffsetM
  );

  if (!isHLocked && (patch.levels !== undefined || patch.floors !== undefined)) {
    next.H = dg.H_max;
  }
  if (!isFloorsLocked && (patch.levels !== undefined || patch.floors !== undefined)) {
    next.floors = next.levels.floors.length;
  }
  if (!isTotalHeightLocked && (patch.totalHeight === undefined || patch.levels !== undefined)) {
    next.totalHeight = dg.totalHeight;
  }
  if (
    !isParamLocked(lockedParams, 'beltUpperFloorHeight') &&
    next.levels.floors[1] &&
    patch.beltUpperFloorHeight === undefined
  ) {
    next.beltUpperFloorHeight = next.levels.floors[1].floorToFloor;
  }

  // Синхронизируем u (= R) и общую высоту сандрика T = R + F + K с учётом общего замка
  const uLocked = isFramingRLocked(lockedParams);
  const tLocked = isParamLocked(lockedParams, 'T');
  const [r, f, k] = next.framingRatio;
  const effK = next.withoutSandrik ? 0 : k;
  const uChanged = patch.u !== undefined && Math.abs(patch.u - prev.u) > 1e-7;
  const tChanged = patch.T !== undefined && Math.abs(patch.T - prev.T) > 1e-7;
  const ratioOrSandrikChanged =
    patch.framingRatio !== undefined || patch.withoutSandrik !== undefined;

  if (r > 0 && (uChanged || tChanged || ratioOrSandrikChanged)) {
    if (uChanged && !tChanged) {
      if (tLocked) {
        next.T = prev.T;
        const res = framing_from_T(prev.T, r, f, effK);
        next.u = ratioOrSandrikChanged && res.R > 0 ? Number(res.R.toFixed(4)) : prev.u;
      } else {
        next.T = Number(framing_from_module(next.u, 'R', r, f, effK).T.toFixed(4));
      }
    } else if (tChanged && !uChanged) {
      if (uLocked) {
        next.u = prev.u;
        next.T = Number(framing_from_module(prev.u, 'R', r, f, effK).T.toFixed(4));
      } else {
        const res = framing_from_T(next.T, r, f, effK);
        if (res.R > 0) next.u = Number(res.R.toFixed(4));
      }
    } else if (uChanged && tChanged) {
      if (uLocked) {
        next.u = prev.u;
        next.T = Number(framing_from_module(prev.u, 'R', r, f, effK).T.toFixed(4));
      } else if (tLocked) {
        next.T = prev.T;
        const res = framing_from_T(prev.T, r, f, effK);
        if (res.R > 0) next.u = Number(res.R.toFixed(4));
      } else {
        next.T = Number(framing_from_module(next.u, 'R', r, f, effK).T.toFixed(4));
      }
    } else if (ratioOrSandrikChanged) {
      if (tLocked && !uLocked) {
        next.T = prev.T;
        const res = framing_from_T(prev.T, r, f, effK);
        if (res.R > 0) next.u = Number(res.R.toFixed(4));
      } else {
        next.T = Number(framing_from_module(next.u, 'R', r, f, effK).T.toFixed(4));
      }
    }
  }

  // Синхронизируем массив пилястр по этажам при изменении этажности
  if (next.pilasterFloors && next.pilasterFloors.length !== next.levels.floors.length) {
    const hasActivePilaster = next.pilasterFloors.some(Boolean);
    const resized = Array.from({ length: next.levels.floors.length }, (_, idx) => {
      if (next.pilastersOnlyOnUpperFloor && next.levels.floors.length >= 2) {
        return idx === next.levels.floors.length - 1;
      }
      if (idx < next.pilasterFloors!.length) return next.pilasterFloors![idx];
      return hasActivePilaster;
    });
    next.pilasterFloors = resized;
  }

  // Синхронизируем поэтажные межэтажные ленты (только между этажами: длина floors - 1)
  const boundaryCount = Math.max(0, next.levels.floors.length - 1);
  if (next.beltFloors && next.beltFloors.length !== boundaryCount) {
    const resizedBelts = Array.from({ length: boundaryCount }, (_, idx) =>
      idx < next.beltFloors!.length ? Boolean(next.beltFloors![idx]) : false
    );
    next.beltFloors = resizedBelts;
    if (patch.beltIsAbsent === undefined && patch.beltFloors === undefined) {
      next.beltIsAbsent = !resizedBelts.some(Boolean);
    }
  }
  if (next.beltSillFloors && next.beltSillFloors.length !== boundaryCount) {
    const resizedSillBelts = Array.from({ length: boundaryCount }, (_, idx) =>
      idx < next.beltSillFloors!.length
        ? Boolean(next.beltSillFloors![idx]) && Boolean(next.beltFloors ? next.beltFloors[idx] : !next.beltIsAbsent)
        : false
    );
    next.beltSillFloors = resizedSillBelts;
    if (patch.beltIsSillCornice === undefined && patch.beltSillFloors === undefined) {
      next.beltIsSillCornice = resizedSillBelts.some(Boolean);
    }
  }

  // Синхронизируем поэтажные высоты подоконников окон
  if (next.windowSillHeights && next.windowSillHeights.length !== next.levels.floors.length) {
    next.windowSillHeights = Array.from({ length: next.levels.floors.length }, (_, idx) =>
      idx < next.windowSillHeights!.length ? next.windowSillHeights![idx] : undefined
    );
  }

  // Режим «Лицевая кирпичная кладка»: модульная координация размеров с точностью до 1 мм
  const wasBrickEnabled = Boolean(prev.brickMasonry?.enabled);
  const willBrickEnabled = Boolean(next.brickMasonry?.enabled);

  if (!wasBrickEnabled && willBrickEnabled) {
    const baseArch = captureBrickMasonryBaseArch(next);
    return coordinateFacadeWithBrickMasonry(next, baseArch, lockedParams).coordinatedParams;
  }

  if (wasBrickEnabled && !willBrickEnabled) {
    const cleanBrick = sanitizeBrickParams(next.brickMasonry?.brick ?? prev.brickMasonry?.brick);
    const restored = prev.brickMasonry?.baseArch
      ? restoreBrickMasonryBaseArch(next, prev.brickMasonry.baseArch, lockedParams)
      : next;
    return {
      ...restored,
      brickMasonry: {
        enabled: false,
        brick: cleanBrick,
      },
    };
  }

  if (wasBrickEnabled && willBrickEnabled) {
    const incomingBaseArch = rawPatch.brickMasonry?.baseArch;
    let baseArch = incomingBaseArch
      ? {
          ...incomingBaseArch,
          levels: {
            groundToFloor1: incomingBaseArch.levels.groundToFloor1,
            floors: incomingBaseArch.levels.floors.map((fl) => ({ ...fl })),
            ...(incomingBaseArch.levels.manualTotalHeight !== undefined
              ? { manualTotalHeight: incomingBaseArch.levels.manualTotalHeight }
              : {}),
          },
        }
      : prev.brickMasonry?.baseArch
        ? {
            ...prev.brickMasonry.baseArch,
            levels: {
              groundToFloor1: prev.brickMasonry.baseArch.levels.groundToFloor1,
              floors: prev.brickMasonry.baseArch.levels.floors.map((fl) => ({ ...fl })),
              ...(prev.brickMasonry.baseArch.levels.manualTotalHeight !== undefined
                ? { manualTotalHeight: prev.brickMasonry.baseArch.levels.manualTotalHeight }
                : {}),
            },
          }
        : captureBrickMasonryBaseArch(prev);

    if (patch.buildingType !== undefined && patch.buildingType !== prev.buildingType) {
      baseArch = captureBrickMasonryBaseArch(next);
    } else {
      if (patch.A !== undefined) baseArch.A = next.A;
      if (patch.w !== undefined) baseArch.w = next.w;
      if (patch.h !== undefined) baseArch.h = next.h;
      if (patch.k_D !== undefined) baseArch.k_D = next.k_D;
      if (patch.isRisalitCentered !== undefined) baseArch.isRisalitCentered = next.isRisalitCentered;
      if (patch.risalitWidth !== undefined) baseArch.risalitWidth = next.risalitWidth;
      if (patch.hSocle !== undefined) baseArch.hSocle = next.hSocle;
      if (patch.useFullFloorAsSocle !== undefined) {
        baseArch.useFullFloorAsSocle = next.useFullFloorAsSocle;
      }
      if (patch.hMain !== undefined) baseArch.hMain = next.hMain;
      if (patch.hGurt !== undefined) baseArch.hGurt = next.hGurt;
      if (
        patch.corniceBottomOffsetM !== undefined ||
        ('corniceBottomOffsetM' in rawPatch && rawPatch.corniceBottomOffsetM === undefined)
      ) {
        baseArch.corniceBottomOffsetM = next.corniceBottomOffsetM;
      }
      if (patch.hasEntrance !== undefined) baseArch.hasEntrance = next.hasEntrance;
      if (patch.entranceWidthM !== undefined) baseArch.entranceWidthM = next.entranceWidthM;
      if (patch.entranceHeightM !== undefined) baseArch.entranceHeightM = next.entranceHeightM;
      if (patch.entranceBottomM !== undefined) baseArch.entranceBottomM = next.entranceBottomM;
      if (
        patch.ordinaryPierAxisSpacings !== undefined ||
        ('ordinaryPierAxisSpacings' in rawPatch && rawPatch.ordinaryPierAxisSpacings === undefined)
      ) {
        baseArch.ordinaryPierAxisSpacings = next.ordinaryPierAxisSpacings
          ? [...next.ordinaryPierAxisSpacings]
          : undefined;
      }
      if (patch.windowSillHeights !== undefined) {
        baseArch.windowSillHeights = next.windowSillHeights
          ? [...next.windowSillHeights]
          : undefined;
      }
      if (patch.levels !== undefined || patch.floors !== undefined || patch.H !== undefined) {
        baseArch.levels = {
          groundToFloor1: next.levels.groundToFloor1,
          floors: next.levels.floors.map((fl) => ({ ...fl })),
          ...(next.levels.manualTotalHeight !== undefined
            ? { manualTotalHeight: next.levels.manualTotalHeight }
            : {}),
        };
        baseArch.H = next.H;
        if (baseArch.windowSillHeights && baseArch.windowSillHeights.length !== next.levels.floors.length) {
          baseArch.windowSillHeights = Array.from(
            { length: next.levels.floors.length },
            (_, idx) => baseArch.windowSillHeights?.[idx]
          );
        }
      }
    }

    return coordinateFacadeWithBrickMasonry(next, baseArch, lockedParams).coordinatedParams;
  }

  return next;
}
