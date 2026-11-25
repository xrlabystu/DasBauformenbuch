import type { BuildingLevelsInput, FacadeParameters, ThreePartSocleParts } from './rules';

export type LockedParamsMap = Record<string, boolean>;

export function isParamLocked(
  locks: LockedParamsMap | undefined,
  key: string
): boolean {
  return Boolean(locks && locks[key]);
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
    if (value === undefined) continue;
    if (key === 'levels' || key === 'socleParts') continue;
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
