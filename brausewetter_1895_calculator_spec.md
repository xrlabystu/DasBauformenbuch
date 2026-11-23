# Спецификация логики, правил и возможностей фасадного калькулятора (Brausewetter, 1895)

> **Назначение документа:** единый исчерпывающий паспорт расчётного ядра, правил валидации, допущений и возможностей интерактивного калькулятора фасада для независимой сверки с оригинальным текстом *Brausewetter, «Das Bauformenbuch», Bd. 1 (1895)* (русский перевод фрагмента — в файле `brausewetter_1895_ru.txt`).
>
> **Источники правды в коде:**
> - Чистые формулы, пресеты этажности и проверки: `src/calc/rules.ts`
> - Реестр правил, типологий и табличных отношений: `src/calc/rulesData.json`
> - Модули интерфейса и пределы ползунков: `src/components/calculator/CalculatorModules.tsx`
> - Ортогональная SVG-схема фасада: `src/components/calculator/FacadeSvg.tsx`
> - Аналитические чертежи и разрезы (6 пластин): `src/components/calculator/AnalyticalPlates.tsx`
> - Карточки правил и 11 контрольных кейсов: `src/components/calculator/RuleCardsPanel.tsx`
> - Автотесты (50 unit-тестов): `src/calc/rules.test.ts`

---

## 1. Общие принципы расчёта и система статусов

1. **Охват первоисточника:** страницы **S. 1–23** (*Bd. 1, 1895*, источник сканов: `https://gateway-bayern.de/BV014442283`).
2. **Точность вычислений:**
   - Все промежуточные вычисления выполняются в числах с плавающей точкой (`number`, IEEE-754) **без округления** (включая точные дроби вроде `2/3`, `4/5`, `5/6`, `7/8`, `φ = (1 + √5) / 2 ≈ 1.618033988749895`).
   - Округление до `3` знаков (или `2` знаков для долей/соотношений) применяется **только при форматировании вывода** (`formatMeters`, `formatPercent`).
   - Для граничных сравнений используется допуск машинной точности `EPS = 1e-9` (для равенств вида `p === w` в пояснениях — `1e-4`).
3. **Статусы валидации (`ValidationStatus`):**
   - `ok` — правило / ограничение источника выполнено строго (включая явные отмены правил в источнике, например `p < w` для `rich_columnar` на S. 5);
   - `approx` — приближение в пределах допуска, условное допущение по исключению текста, качественное предупреждение, редкий/проблематичный приём (`onlySillUnderSecond`) или эвристика/экстраполяция (например, для 1-этажного дома);
   - `violation` — прямое нарушение ограничения источника или математически вырожденные входные данные (`<= 0`);
   - `'n/a'` (только для `beltWithColumns`) — условие не применяется (нет колоннады/пилястр в 1-м этаже).
4. **Классификация происхождения (`SourceStatus` + приоритет `RulePriority`):**
   - Каждое правило в `rulesData.json`, каждая проверка в `evaluateFacadeSummary` и все элементы интерфейса помечены полем `sourceStatus`:
     - `explicit-verified` — *Из книги (проверено S. 1–23)*;
     - `explicit-unverified` — *Из книги (требует сверки)*;
     - `heuristic` — *UX-эвристика (допущение)*;
     - `editorial` — *Редакционная разметка*;
     - `gap` — *Пробел / экстраполяция*.
   - Приоритеты правил (`priority`): `P0` (ядро и критические ограничения), `P1` (ключевые правила S. 12–23), `P2` (рустика, ризалиты и композиция фасада), `P3` (экспертные проверки, скрытые до включения `expertMode`).
   - Всё, что введено для удобства UX поверх качественного описания текста, явно сведено в **Раздел 8** (включая 6 пробелов по этажности и 4 пробела по межэтажным лентам).

---

## 2. Полная модель входных параметров (`FacadeParameters`)

| Поле | Тип | Назначение / смысл | Ед. | Диапазон в UI (ползунок) | Источник / примечание |
|---|---|---|---|---|---|
| `buildingType` | `BuildingTypeId` | Типология здания (7 вариантов) | — | select | S. 2–6, 11–12 |
| `buildingVariant` | `'one-story' \| 'two-story' \| 'multi-story'` | Вариант этажности | — | 3 кнопки / пресеты | S. 5–6, 14–16, 21–23 |
| `multiSub` | `'three' \| 'four-five' \| 'general'` | Подтип многоэтажного дома | — | 3 кнопки | S. 16, 22–23 |
| `axesCount` | `number` | Число оконных осей на главном фасаде | ос. | `2 … 10` (шаг `1`, кнопки `3..8`) | S. 14–16 |
| `entrancePosition` | `'center' \| 'left' \| 'right' \| 'none'` | Положение главного входа (влияет на допустимость чётных осей) | — | 4 кнопки | S. 14 |
| `corniceVariantMode` | `'full_entablature' \| 'crowning_only'` | Режим оценки главного карниза (полный антаблемент или только `Kranz`) | — | 2 кнопки | S. 16 |
| `fiveStoryScheme` | `'standard' \| 'rich_1_2_unified'` | Схема 5-этажного дома (`1/2–4/5+K` vs особняк `1+2 объед.`) | — | 2 кнопки | S. 23 (N27–N28) |
| `mainCorniceProjectionBoost` | `number` | Множитель усиленного выноса главного карниза (для особняка `1+2`) | × | `1.0 … 1.5` | S. 23 (UX) |
| `threeStoryGurtMode` | `'both_gurt' \| 'third_sohlbank' \| 'unified_upper'` | Вариант поясных тяг для 3-этажного дома (Схемы 1, 2, 3) | — | 3 кнопки | S. 22 |
| `isEmbeddedInRow` | `boolean` | Встроенный в уличный ряд дом (авто-дефолт только для `urban_house` и `miethaus`) | — | checkbox | S. 14 |
| `levels` | `BuildingLevelsInput` | Поэтажная модель (`groundToFloor1`, `floors[]` с `floorToFloor`, `slabThickness`, `clearHeight`, `manualTotalHeight`) | м | Поэтажный редактор | S. 5, 16, 22–23 |
| `useFloorToFloorForBelt` | `boolean` | Использовать высоту 1-го этажа пол-до-пола для ленты (вместо `H_max`) | — | checkbox | S. 5, 16 |
| `allowModestFirstFloorForBelt` | `boolean` | Допускать `H_ленты < h/12` как исключение скромного 1-го этажа (`approx`) | — | checkbox | S. 16 |
| `H` | `number` | Высота комнаты `H_max` (синхронизируется с `levels` → `derivedGeometry.H_max`) | м | `2.2 … 6.5` | S. 5–6, 16 |
| `A` | `number` | Шаг осей `Axenweite` | м | `1.4 … 6.0` | S. 4–6 |
| `w` | `number` | Ширина окна в свету `lichte Fensterbreite` | м | `0.5 … 2.4` | S. 5–7 |
| `h` | `number` | Высота окна в свету | м | `0.8 … 4.0` | S. 6–7 |
| `withFraming` | `boolean` | Наличие профилированного обрамления (наличника) и сандрика | — | toggle | S. 5, 7–8 |
| `u` | `number` | Ширина бокового обрамления с одной стороны `Rahmen` | м | `0.05 … 0.45` (норма `w/6..w/5`) | S. 5, 17 (N1) |
| `hSill` | `number` | Высота подоконной плиты `Sohlbank` | м | `0.06 … 0.40` (норма `w/8..w/7`) | S. 17 (N2) |
| `hSillCornice` | `number` | Высота сплошного подоконного пояса (`Sohlbankgesimse > u`) | м | `0.10 … 0.60` | S. 17 (N3) |
| `k_D` | `number` | Отношение отступа первой оси от угла `D / A` | ×A | `0.50 … 1.10` (норма `2/3..5/6`) | S. 4–5 |
| `isRisalitCentered` | `boolean` | Комната занимает всю ширину ризалита/западающей части (`D = W_risalit / 2`) | — | checkbox | S. 4 |
| `risalitWidth` | `number` | Ширина ризалита / комнаты (при `isRisalitCentered = true`) | м | `2.2 … 8.0` | S. 4 |
| `T` | `number` | Общая высота сандрика `R + F + K` | м | `0.3 … 2.0` | S. 7–8 |
| `framingRatio` | `[number, number, number]` | Пропорция `r : f : k` (наличник : фриз : карниз) | — | 6 пресетов | S. 8 |
| `withConsoles` | `boolean` | Наличие консолей под сандриком (уменьшает вынос до `5/6 · K`) | — | checkbox | S. 8 |
| `a_front` | `number` | Отступ от верхней плитки консоли до слезника спереди | м | `0.01 … 0.25` | S. 8 |
| `a_side` | `number` | Отступ от верхней плитки консоли до слезника сбоку | м | `0.01 … 0.25` | S. 8 |
| `Wp` | `number` | Ширина пилястра / лопатки | м | `0.25 … 1.40` | S. 11–12 |
| `v` | `number` | Выступ пилястра / лопатки | м | `0.02 … 0.45` | S. 11–12 |
| `pilasterCharacter` | `'massive' \| 'light'` | Характер ордерного выступа | — | 2 кнопки | S. 11–12 |
| `isMauerpfeiler` | `boolean` | Гладкая лопатка / стенной пилон (без базы и капители) | — | checkbox | S. 12 |
| `Tc` | `number` | Общая высота венчающей части главного карниза (`Kranz`) | м | `0.2 … 1.2` | S. 10–11 |
| `corniceRatio` | `number` | Отношение верхних обломов к нижним `h_u : h_l` | `:1` | `0.3 … 2.5` (шаг `0.05`) | S. 10–11 |
| `plateShare` | `number` | Доля крупной плиты в верхнем обломе (`0..1`) | % | `20 … 95 %` | Эвристика UX по S. 10–11 |
| `tolerance` | `number` | Допуск отклонения шага осей `A:H` (по умолчанию `0.03` = 3 %) | доля | — (константа `0.03`) | Эвристика UX |
| `diagTolerance` | `number` | Допуск правила половины диагонали окна (по умолчанию `0.07` = 7 %) | % | `1 … 10 %` | Эвристика UX для 3:5, 5:8 (S. 7) |
| `floors` | `number` | Число этажей здания (в UI `1..5`, синхронизировано с `levels.floors.length`) | эт. | `1 … 5` | S. 16, 21–23 |
| `totalHeight` | `number` | Вычисляется из `levels` (`derivedGeometry.totalHeight`) либо задаётся вручную (`manualTotalHeight`) | м | авто / ручной ввод | S. 14–16 |
| `socleMode` | `'optimal' \| 'typical'` | Пресет расчёта цоколя (`1/6` или `1/8`) | — | 2 кнопки | S. 16 |
| `hSocle` | `number` | Высота цоколя `Sockel` | м | `0.3 … 5.0` | S. 16 |
| `hMain` | `number` | Полная высота главного карниза / венца `Hauptgesims` | м | `0.15 … 2.50` | S. 16 |
| `hGurt` | `number` | Высота поясного (межэтажного) карниза / ленты `Gurtgesims` | м | `0.0 … 1.2` (`0.12..1.2` в «Лента») | S. 16 |
| `socleParts` | `{ fuss, rumpf, deck }` | Доли 3-частного цоколя (`0.25 / 0.55 / 0.20` по умолчанию) | % | `10..45 / 25..75 / 10..40 %` | Эвристика UX по S. 10 |
| `hPlate` | `number` | Высота главной плиты цокольного карниза | м | `0.04 … 0.45` | S. 10 |
| `hOtherSum` | `number` | Суммарная высота прочих мелких обломов цокольного карниза | м | `0.02 … 0.40` | S. 10 |
| `hSocleRust` | `number` | Высота камня/руста в цоколе | м | `0.20 … 0.55` | S. 10 |
| `hEgRust` | `number` | Высота камня/руста в 1-м этаже (`EG`) | м | `0.15 … 0.50` | S. 10 |
| `vSocleProfile` | `number` | Вынос профилировки в цоколе | м | `0.02 … 0.15` | S. 10 |
| `vEgProfile` | `number` | Вынос профилировки в 1-м этаже (`EG`) | м | `0.01 … 0.15` | S. 10 |
| `hasKellerfenster` | `boolean` | Наличие подвальных окон (обоснование раскреповки) | — | checkbox | S. 10, 12 |
| `hasLisenen` | `boolean` | Наличие лопаток/пилястр на цоколе (обоснование раскреповки) | — | checkbox | S. 10, 12 |
| `rustRowHeight` | `number` | Целевая высота ряда квадровой рустики цоколя / стены | м | `0.22 … 0.48` | S. 17 |
| `useFullFloorAsSocle` | `boolean` | Трактовка всего 1-го этажа как цоколя (`effectiveSocleH = floor1FullHeight`) | — | checkbox | S. 16, 22 |
| `beltMode` | `'binding' \| 'crowning'` | Функция ленты: связующая vs венчающая нижний этаж | — | 2 кнопки | S. 10–11 |
| `beltType` | `1 \| 2 \| 3 \| 4` | Класс состава ленты | — | 4 карточки | S. 10–11 |
| `beltUpperFloorHeight` | `number` | Высота верхнего этажа над лентой | м | `2.2 … 6.0` | S. 16, 22 |
| `beltCrowningRatio` | `number` | Отношение `h_верх : h_низ` в венчающей части ленты | `:1` | `0.35 … 2.40` | S. 10–11 |
| `beltEffect` | `'neutral' \| 'heavy' \| 'light'` | Эффект венца ленты (`1:1`, тяжёлый, лёгкий) | — | 3 кнопки | S. 11 |
| `beltConsoleMode` | `'none' \| 'lying_lower' \| 'standing_frieze'` | Позиция консолей в ленте | — | 3 кнопки | S. 11 |
| `beltHasColumnsBelow` | `boolean` | Колоннада или пилястры в нижнем этаже под лентой | — | checkbox | S. 16 |
| `beltAsRusticationMode` | `boolean` | Замена карнизной ленты рустовкой (`Fugenteilung`) | — | checkbox | S. 15–16 |
| `beltRusticationHasBaseProfile` | `boolean` | Наличие базового профиля (`Fußprofil`) под рустовкой | — | checkbox | S. 16 |
| `beltIsAbsent` | `boolean` | Отсутствие межэтажной ленты (объединение смежных этажей) | — | checkbox | S. 22–23 |
| `beltIsSillCornice` | `boolean` | Лента выполнена как сплошной подоконный карниз (`Sohlbankgesimse`) | — | checkbox | S. 16–17, 22 |
| `beltOnlySillUnderSecond` | `boolean` | Сценарий «только подоконный пояс под 2-м этажом» (`approx`; `violation` при `h1 > 0.55·H_total`) | — | checkbox | S. 22 (N29) |
| `beltAlignsWithRecesses` | `boolean` | Согласование ленты с западающими частями и ризалитами (`Rücklagen`) | — | checkbox | S. 17–18 |
| `hasWallRustication`, `cornerRustRows`, `cornerOffsetM`, `upperStoryHeightN` | `boolean / number` | Рустовка стены (7–8 рядов), ряды угловой рустовки, отступ угла `M` vs `N` | ряды / м | чекбокс + слайдеры | S. 15, 17 (N4–N6) |
| `hasCompositionBreakdown`, `compKind`, `wCentralRisalit`, `wSideRisalit`, `wWing`, `pWing`, `centralRisalitAxes`, `wingAxes`, `middleAxesBetweenRisalits`, `risalitRichness`, `wingRichness`, `hasPilasterBetweenPairedWindows`, `pilasterAdjacentSameHeight`, `pilasterHeightDiffPct`, `pilastersOnlyOnUpperFloor`, `atticOverRisalit`, `atticOverWing`, `atticRisalitHeavier` | `mixed` | Декомпозиция крыльев, ризалитов (5-/7-частные схемы), многоярусные пилястры и аттики | м / ос. / bool | блок «Крылья и ризалиты» | S. 13–14, 18–20 (N8–N19, N23, N25) |
| `wpWallPier`, `hasPairedPilasters`, `pairedPilastersGap`, `columnProfileType`, `pedimentType`, `pedimentClassical` | `mixed` | Экспертный режим `P3` (`expertMode`): пилястры, спаренные пары, колонны `2/3`–`3/4`, фронтон | м / enum | отображаются при `expertMode` | S. 12–13, 18–19 (N20–N22, N24, N26) |

---

## 3. Типологии зданий (`typologies` в `rulesData.json` + дефолты)

Отношения `A:H` в таблицах источника:
- **Стандартные (жилые):** `2:3`, `3:4`, `4:5`, `5:6`, `6:7`, `7:8`, `8:9`
- **Предельные:** `1:1` (Дворцовая архитектура), `1:2` (Богатая колонно-пилястровая архитектура)

| ID | Название (RU / DE) | Стр. | Диапазон `A:H` (`min..max`) | Правило угла (`check_corner`) | Правило простенка | Авто-этажность и дефолты (`H`, `A`, `w`, `h`, `u`, `k_D`, `T`, `Wp`, `v`, `Tc`, `H_total`) |
|---|---|---|---|---|---|---|
| `simple_house` | Простой жилой дом (`Einfaches Wohnhaus`) | S. 5 | `2:3 … 4:5` (`0.667..0.800`) | `p_corner > w` (строго; `≥ 0.9w` → `approx`) | `p ≥ w`, `p_c ≥ w_v` | `two-story` (`2` эт.), `H=3.0`, `A=2.0 (2:3)`, `w=1.0`, `h=1.6667`, `u=0` (`withFraming=false`), `k_D=0.8`, `T=0.9`, `Wp=0.5`, `v=0.1`, `Tc=0.45`, `H_total=7.2`, `isMauerpfeiler=true`, `beltType=1` |
| `urban_house` | Городской жилой дом (`Städtisches Wohnhaus`) | S. 4–6 | `2:3 … 7:8` (`0.667..0.875`) | Допускается `p_intermediate ≥ p_corner` (или `p_corner > w`) | `p ≥ w`, `p_c ≥ w_v` | `multi-story:three` (`3` эт.), `H=4.0`, `A=3.2 (4:5)`, `w=1.15`, `h=1.84`, `u=0.20`, `k_D=0.8`, `T=1.2`, `Wp=0.6`, `v=0.11`, `Tc=0.55`, `H_total=13.5`, `beltType=3` |
| `miethaus` | Доходный дом (`Miethaus`) | S. 3, 5–6 | `2:3 … 7:8` (`0.667..0.875`) | Допускается `p_intermediate ≥ p_corner` | `p ≥ w`, `p_c ≥ w_v` | `multi-story:four-five` (`5` эт.), `H=3.4`, `A=2.267 (2:3)`, `w=1.0`, `h=1.6667`, `u=0.16`, `k_D=0.75`, `T=0.96`, `Wp=0.48`, `v=0.09`, `Tc=0.5`, `H_total=19.2`, `useFullFloorAsSocle=true`, `beltType=3` |
| `villa` | Загородный дом / вилла (`Landhaus / Villa`) | S. 3, 5 | `0.600 … 1.000` (рек. `2:3…8:9`) | `p_corner > w` (или `D = width/2` при ризалите) | Свободная трактовка, в коде `p ≥ w` | `two-story` (`2` эт.), `H=3.6`, `A=3.0 (5:6)`, `w=1.1`, `h=1.8`, `u=0.18`, `k_D=0.8333`, `T=1.05`, `Wp=0.55`, `v=0.11`, `Tc=0.48`, `H_total=8.4`, `beltType=3` |
| `monumental` | Монументальное здание (`Monumentalbau`) | S. 4–5, 11 | `4:5 … 1:1` (`0.800..1.000`) | Строго `p_corner > p_intermediate` | `p ≥ w`, `p_c ≥ w_v` | `two-story` (`2` эт.), `H=4.8`, `A=4.2 (7:8)`, `w=1.3`, `h=2.25`, `u=0.25`, `k_D=0.8333`, `T=1.47`, `Wp=0.8`, `v=0.18`, `Tc=0.7`, `massive`, `plateShare=0.78`, `beltEffect='heavy'` |
| `palace` | Дворец (`Palastarchitektur`) | S. 5 | `5:6 … 1:1` (`0.8333..1.000`) | Строго `p_corner > p_intermediate` | `p ≥ w`, `p_c ≥ w_v` | `multi-story:general` (`4` эт.), `H=5.0`, `A=5.0 (1:1)`, `w=1.4`, `h=2.45`, `u=0.28`, `k_D=0.8333`, `T=1.68`, `Wp=0.9`, `v=0.2`, `Tc=0.8`, `massive`, `plateShare=0.78`, `beltMode='crowning'`, `beltType=4`, `beltHasColumnsBelow=true` |
| `rich_columnar` | Богатая колонно-пилястровая архитектура | S. 5, 12 | `0.450 … 0.600` (`A:H → 1:2`) | Как у городского дома (`p_inter ≥ p_corner` или `p_corner > w`) | Правило `p ≥ w` отменено (S. 5): при `p > 0` статус **`ok`** | `multi-story:general` (`4` эт.), `H=5.2`, `A=2.6 (1:2)`, `w=1.45`, `h=2.5`, `u=0.22`, `k_D=0.75`, `T=1.4`, `Wp=0.72`, `v=0.16`, `Tc=0.72`, `beltMode='crowning'`, `beltType=4`, `beltHasColumnsBelow=true` |

---

## 4. Пресеты этажности (`VARIANT_PRESETS` и `applyBuildingVariantPreset`)

### 4.1. Нормативная матрица (`VariantRules`)

| Пресет (`id`) | Стр. | `defaultFloors` | Цоколь (`H_total`) | Главный карниз (`full_entablature`) | Один венец (`crowning_only`) | Поясной карниз (`gurt`, от `h_эт`) | Прямоугольник фасада | Членение | `A / H_max` | Оси | Колонны необязат. | Спецфлаги |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `one-story` | S. 5, 14, 16, 21 | `1` | `0.10 … 1/6` (опт. `1/6`) | `'extrapolated'` (проверка `≥ 1/12` как 2-эт.) | `'extrapolated'` (проверка `≥ 1/16`) | `null` (не требуется) | `lying` (`W > H_total`) | `horizontal` | `2/3 … 1.0` | `odd` | `true` | — |
| `two-story` | S. 5, 12, 14, 16, 21 | `2` | `0.10 … 1/6` (опт. `1/6`) | `1/12 … 1/8` (`0.0833..0.125`) | `1/16 … 1/15` (`0.0625..0.0667`) | `1/12 … 1/6` | `lying` (`W > H_total`) | `horizontal` | `2/3 … 1.0` | `odd` | `false` | — |
| `multi-story:three` | S. 6, 15–16, 22 | `3` | `0.10 … 1/6` (опт. `1/6`) | `1/15 … 1/12` (`0.0667..0.0833`) | `1/20 … 1/16` (`0.0500..0.0625`) | `1/12 … 1/6` | `standing` (`H_total > W`) | `vertical` | `2/3 … 7/8` (`0.875`) | `odd` | `false` | `mainTierFloor=2`, `upperFloorSmallest=true` |
| `multi-story:four-five` | S. 6, 15–16, 22–23 | `5` | `0.10 … 1/6` (опт. `1/6`) | `1/15 … 1/12` | `1/20 … 1/16` | `1/12 … 1/6` | `standing` | `vertical` | `2/3 … 7/8` | `odd` | `false` | `fiveStoryScheme`: `standard` / `rich_1_2_unified`; `mainTierFloor=2`, `upperFloorSmallest=true` |
| `multi-story:general` | S. 5–6, 15–16, 22 | `4` | `0.10 … 1/6` (опт. `1/6`) | `1/15 … 1/12` | `1/20 … 1/16` | `1/12 … 1/6` | `standing` | `vertical` | `2/3 … 7/8` | `odd` | `false` | `mainTierFloor=2`, `upperFloorSmallest=true` |

### 4.2. Поэтажная модель (`Levels` & `DerivedGeometry`) и `applyBuildingVariantPreset`
Эвристика `H * 0.96` полностью удалена (`P0-6`). Геометрия вычисляется поэтажно через `computeDerivedGeometry(levels, A, D, axesCount, hMain)`:
- `levels: BuildingLevelsInput` хранит `groundToFloor1` (отметка пола 1-го этажа от земли) и массив `floors[]` (`{ floorToFloor, slabThickness, clearHeight }`, где для ≥3 этажей верхние этажи уменьшаются: `×0.94`, самый верхний — `×0.85`).
- `H_max = max(clearHeight_i)` — наибольшая высота комнаты в свету (S. 5–6).
- `floor1FloorToFloor = floors[0].floorToFloor` — высота нижнего этажа от пола до пола для проверки поясного карниза (S. 5, 16).
- `floor1FullHeight = groundToFloor1 + floor1FloorToFloor` — высота от земли до перекрытия над 1-м этажом (используется в `useFullFloorAsSocle`, S. 16, 22).
- `wallTopElevation = groundToFloor1 + Σ floorToFloor_i`; итоговая высота `totalHeight = manualTotalHeight ?? (wallTopElevation + hMain)`.

`applyBuildingVariantPreset(prev, variant, multiSub)` пересчитывает:
1. Устанавливает `floors = preset.defaultFloors`, строит `levels = buildDefaultLevels(floors, prev.H, updatedGround)`, устанавливает `axesCount = (variant === 'one-story' || variant === 'two-story') ? 5 : 3` и согласованное `entrancePosition`.
2. Корректирует `A` по объединённому диапазону `allowedAxisRatio(prev.buildingType, variant, multiSub)`.
3. Вычисляет согласованные `totalHeight = wallTop / (1 - activeMainShare)`, `hSocle = totalHeight / 6`, `hMain = totalHeight * activeMainShare`, `hGurt = gurt === null ? 0 : min(floor1F2F / 9, hMain * 0.65)`, `rustRowHeight = clamp(hSocle / 5, 0.30, 0.40)`.
4. Включает `useFullFloorAsSocle = true` для `miethaus` + `four-five`; `isEmbeddedInRow = (buildingType === 'urban_house' || buildingType === 'miethaus')`.
5. Сбрасывает `beltIsAbsent = (variant === 'one-story')`, `beltIsSillCornice = false`, `beltOnlySillUnderSecond = false`, обновляет `beltUpperFloorHeight = levels.floors[1]?.floorToFloor ?? prev.H + 0.35`.

---

## 5. Детальная логика всех расчётных функций и правил (`src/calc/rules.ts`)

### 5.1. Шаг осей (`Axenweite`) и высота комнаты (`Zimmerhöhe`) — S. 5–6
- `A_from_H(H, n, m) = H * (n / m)`
- `H_from_A(A, n, m) = A * (m / n)`
- `ratio_from_AH(A, H, tolerance = 0.03, buildingType = 'urban_house')`:
  - Ищет ближайшую дробь в `standardAxenRatios` (для `palace`/`rich_columnar` — в `standard + limit`), считает относительное отклонение `deviation = |ratio - targetVal| / targetVal`.
  - Если `ratio <= 0` или `!isFinite`: `violation`.
  - Если `ratio ∈ [typology.minRatioAH, typology.maxRatioAH]` (с `EPS`): `approx` если `0.005 < deviation <= tolerance`, иначе `ok`.
  - Если в расширенном интервале `[min * (1 - tolerance), max * (1 + tolerance)]`: `approx`.
  - Иначе: `violation`.

### 5.2. Простенки с обрамлением и без (`p`, `p_c`, `w_v`) — S. 5
- `A_from_pw(p, w) = p + w`, `w_max_from_A(A) = A / 2`, `A_min_from_wu(w, u) = 2 * (w + 2u)`.
- `p_from_Aw(A, w, buildingType)`: `p = A - w`.
  - `p <= 0` → `violation`.
  - `p >= w - EPS` → `ok` (отдельно отмечает равенство `|p - w| <= 1e-4`).
  - `p < w` при `buildingType === 'rich_columnar'` → **`ok`** (P0-3: на S. 5 правило `p ≥ w` для богатой колонно-пилястровой архитектуры явно отменено).
  - Иначе → `violation`.
- `pc_from_Awu(A, w, u, buildingType)`: `w_v = w + 2u`, `p_c = A - w_v`.
  - `p_c <= 0` → `violation`.
  - `p_c >= w_v - EPS` → `ok`.
  - `p_c < w_v` при `rich_columnar` → **`ok`** (P0-3: отмена правила на S. 5).
  - Иначе → `violation`.

### 5.3. Угловой простенок (`Eckpfeiler`) — S. 4–5
- `D_from_A(A, k_D = 0.8) = k_D * A` (нормативный интервал `k_D ∈ [2/3, 5/6]`, т.е. `0.6667..0.8333` с допуском `1e-4`).
- `p_corner_from_Dwu(D, w, u = 0) = D - w / 2 - u`.
- `check_corner(type, p_corner, w, p_intermediate, k_D, D_override, isRisalitCentered)`:
  - Если `p_corner <= 0`: `violation`.
  - Если `isRisalitCentered === true`: `D = risalitWidth / 2`; `ok` если `p_corner >= 0.5 * w`, иначе `approx` (сравнение `k_D` с `A` отключается, S. 4).
  - Если `type` ∈ `{monumental, palace}`: требуется строго `p_corner > p_intermediate + EPS`. Если выполнено → `ok` (если `k_D` в `[2/3, 5/6]`, иначе `approx`); иначе → `violation`.
  - Если `type` ∈ `{simple_house, villa}`: требуется `p_corner > w + EPS` → `ok`/`approx` (по `k_D`); если `p_corner >= 0.9 * w - EPS` → `approx`; иначе → `violation`.
  - Если `type` ∈ `{urban_house, miethaus, rich_columnar}`: допускается `p_intermediate >= p_corner - EPS` ИЛИ `p_corner > w + EPS` → `ok`/`approx` (по `k_D`); иначе → `approx` (в городе допустимо с рекомендацией усилить угол).

### 5.4. Пропорции окна (`Fensterproportionen`) — S. 6–7
- `h_from_w_ratio(w, n, m) = w * m / n`, `w_from_h_ratio(h, n, m) = h * n / m`.
- `nearest_golden_approx(w, h)`: ближайшее из 10 приближений (`3:5, 5:8, 8:13, 13:21, 21:34, 34:55, 55:89, 89:144, 5:9, 4:7`) по `|m/n - h/w|`.
- `isKnownGoodRatio(w, h, eps = 1e-3)`: проверяет попадание `h/w` в перечень книжных приближений `KNOWN_GOOD_RATIOS` (`3:5`, `5:8`, `5:9`, `4:7`, ряд Фибоначчи).
- `check_window(w, h, tolerance = 0.07)` *(P0-2)*:
  - **Проверка 1 (`rangeCheck`):** `1.5w <= h <= 2w` → `ok` или `violation`.
  - **Проверка 2 (`diagCheck`):** `d = hypot(w, h)`, `halfD = d / 2`.
    - `w <= d/2 + EPS` (т.е. `h >= √3·w ≈ 1.732w`) → `ok` (`sourceStatus: 'explicit-verified'`).
    - `isKnownGoodRatio(w, h)` (в частности `3:5`, `5:8`) → **`approx`** (`sourceStatus: 'explicit-verified'` — книжные приближения не могут давать `violation`).
    - Иначе `deviationPct = (w - d/2) / (d/2)`: если `deviationPct <= tolerance + EPS` (`7 %` по умолчанию) → `approx` (`sourceStatus: 'heuristic'`); иначе → `violation`.
  - **Итог окна:** `mergeStatuses(rangeStatus, diagStatus)`.

### 5.5. Обрамление и сандрик окна (`R : F : K`) — S. 7–8
- Пресеты `framingRatios`: `1:1:1`, `6:7:8`, `4:5:6`, `3:4:4`, `2:3:3`, `3:5:4`.
- `framing_from_T(T, r, f, k)`: `s = T / (r + f + k)`, `R = s*r`, `F = s*f`, `K = s*k`.
  - Если `T <= 0` или `sum <= 0` → `violation`.
  - Если `f > k` (например, `3:5:4`) → `approx` (`requiresIncreasedProjection = true`, S. 8: допустимо при увеличенном выносе венчающего карниза).
  - Иначе → `ok`.
- `framing_from_module(baseValue, 'R'|'F'|'K', r, f, k)`: обратный пересчёт `T` от одного модуля.
- `projection_45(K) = K`; `projection_console(K) = (5 / 6) * K`.
- `check_offset(a_front, a_side, tolerance = 0.005)`: `diff = |a_front - a_side|`.
  - Отрицательные → `violation`; `diff <= 1e-4` → `ok`; `diff <= tolerance` → `approx`; иначе → `violation`.

### 5.6. Пилястры и лопатки (`Pilaster / Mauerpfeiler`) — S. 11–12
- `pilaster_v_range(W_p)`: `v_max = W_p / 4`, `v_light_min = W_p / 6`, `v_light_max = W_p / 5`.
- `check_pilaster(v, W_p, character, isMauerpfeiler)`:
  - `W_p <= 0` или `v <= 0` → `violation`.
  - `v > W_p / 4 + EPS` → `violation`.
  - Если `character === 'light'`: `ok` внутри `[W_p/6, W_p/5]`, иначе `approx` (не превышает `v_max`, но вне лёгкого диапазона).
  - Если `character === 'massive'`: `ok` при `v <= v_max`.
  - Примечание по `isMauerpfeiler`: гладкая лопатка без базы и капители (S. 12); для пилястра и колонны база и капитель обязательны.

### 5.7. Венчающая часть карниза (`Kranz`) — S. 10–11
- `cornice_split(T_c, ratio_upper_to_lower = 1)`:
  - `h_u = T_c * ratio / (ratio + 1)`, `h_l = T_c - h_u`.
  - Допустимый диапазон `ratio ∈ [0.5, 2.0]` (`1:2 … 2:1`) → `ok`, иначе `violation` (при `T_c <= 0` или `ratio <= 0` тоже `violation`).
- `cornice_character(plateShare)` *(UX-эвристика)*: `plateShare >= 0.75` → `'heavy'`; `plateShare <= 0.50` → `'light'`; иначе `'neutral'`.

### 5.8. Цоколь (`Sockel`), карнизы и рустика — S. 10, 12, 16–17, 22
- `socleHeight(totalHeight, mode)`: `optimal = totalHeight / 6`, `typical = totalHeight / 8`, диапазон `[totalHeight / 10, totalHeight / 6]`.
- `checkSocleHeight(hSocle, totalHeight)`:
  - `hSocle <= 0` или `totalHeight <= 0` → `violation`.
  - `hSocle < totalHeight / 10 - EPS` → `violation` (S. 16: здание «уходит в землю»).
  - `hSocle <= totalHeight / 6 + EPS` → `ok` (при `|hSocle - max| <= 0.02` отмечается оптимум `1/6`).
  - `hSocle > totalHeight / 6 + EPS` → `approx` (характерно при включении 1-го этажа в цоколь, S. 16, 22).
  - *Важно:* если в параметрах включён флаг `useFullFloorAsSocle`, в сводке и расчётах подставляется `effectiveSocleH = derivedGeometry.floor1FullHeight` (`groundToFloor1 + floor1FloorToFloor`, P0-6).
- `checkMainCornice(hSocle, hMain, totalHeight, floors)` *(базовая без пресетов)*:
  - `floors <= 2` → `[totalHeight / 12, totalHeight / 8]`; `floors > 2` → `[totalHeight / 15, totalHeight / 12]`.
  - Требует строго `hMain < hSocle - EPS` И попадание в диапазон → `ok`, иначе `violation`.
- `checkBeltHeight(hGurt, floorHeight, hSocle, hMain, { allowModestLowerFloor })` и `checkGurt(...)` *(P0-7: единая унифицированная функция)*:
  - Диапазон `[floorHeight / 12, floorHeight / 6]`.
  - `!belowMain || !belowSocle` (`hGurt >= min(hMain, hSocle)`) → `violation`.
  - `hGurt > floorHeight / 6` → `violation`.
  - `hGurt < floorHeight / 12` → `approx` при `allowModestLowerFloor = true`, иначе `violation` (S. 16: меньшие высоты допустимы при скромном первом этаже).
  - `inRange` → `ok`.
- `threePartSocle(hSocle, parts = { fuss: 0.25, rumpf: 0.55, deck: 0.20 })` *(эвристика, `isHeuristic: true`)*:
  - Нормализует доли на их сумму `sum`; `ok`, если `|sum - 1| <= 0.02`, иначе `approx` (`hSocle <= 0` → `violation`).
- `plateDominant(hPlate, hOtherSum, threshold = 1.2)` *(эвристика, `isHeuristic: true`)*:
  - `hPlate <= 0 || hPlate <= hOtherSum + EPS` → `violation`; `hPlate >= 1.2 * hOtherSum` → `ok`; между `1.0×` и `1.2×` → `approx`.
- `decreasingUpward(hSocleRust, hEgRust, vSocleProfile, vEgProfile)`:
  - `rustOk = hEgRust < hSocleRust - EPS` и `profileOk = vEgProfile < vSocleProfile - EPS`; оба `true` → `ok`, иначе `violation`.
- `abkroepfungPreference(hasKellerfenster, hasLisenen)`:
  - Если `hasKellerfenster || hasLisenen` → `approx` (раскреповка допустима, но без неё лучше); иначе → `ok` (сплошной прогон).
- `rusticationRows(socleHeightVal, rowHeight = 0.35)`:
  - `n = max(1, round(socleHeightVal / rowHeight))`, `actualRowHeight = socleHeightVal / n`.
  - `inRowRange = actualRowHeight ∈ [0.30, 0.40]`; `oddPreferred = (n % 2 === 1)`.
  - `!inRowRange` → `violation`; `inRowRange && !oddPreferred` → `approx` (чётное число рядов); иначе → `ok`.
- `fullFloorAsSocle(firstFloorFullHeight, requiredSocleHeight)`:
  - `applicable = firstFloorFullHeight >= requiredSocleHeight - EPS && firstFloorFullHeight > 0` (`ok` / `violation`; в `evaluateFacadeSummary` передаётся `derivedGeometry.floor1FullHeight` и `requiredSocleHeight = totalHeight / 10`).

### 5.9. Вариантные проверки этажности — S. 5–6, 14–16, 21–23
- `checkMainCorniceWithVariant(hSocle, hMain, totalHeight, variant, multiSub, corniceMode)`:
  - Для `two-story` и `multi-story` берёт точные доли (`1/12..1/8` или `1/16..1/15`; `1/15..1/12` или `1/20..1/16`).
  - Для `one-story` (`'extrapolated'`): применяет **экстраполяцию ≥ нижнего предела 2-этажного** (`hMain >= totalHeight / 12` для `full_entablature` или `>= totalHeight / 16` для `crowning_only`). При соблюдении `hMain < hSocle` и нижнего предела возвращает **`approx`** (явная пометка экстраполяции); иначе `violation`.
- `checkGurtWithVariant(...)`: для `one-story` (`gurt === null`) возвращает `notRequired: true, status: 'ok'`, для остальных вызывает `checkGurt`.
- `allowedAxisRatio(buildingType, variant, multiSub)` и `checkVariantAxisRatio(A, H_max, variant, multiSub, tolerance = 0.03, buildingType?)` *(P0-1)*:
  - Использует единую матрицу `allowedAxisRatio`: `simple_house` `[2/3, 4/5]`, `urban_house/miethaus` `[2/3, 7/8]`, `villa` `[0.60, 1.00]`, `monumental` `[4/5, 1.00]`, `palace` `[5/6, 1.00]`, `rich_columnar` `[0.45, 0.60]`.
  - Внутри интервала → `ok` (при расхождении со стандартным пресетом этажности у жилых типологий → `approx`, для `rich_columnar / palace / monumental / villa` конфликт не возникает); в допуске `±3%` → `approx`; иначе → `violation`.
- `checkFacadeRectangle(facadeWidth, totalHeight, variant, multiSub)`:
  - `facadeWidth` берётся из `derivedGeometry.facadeWidth` (`2 * D + (axesCount - 1) * A` или override).
  - `aspect = facadeWidth / totalHeight`.
  - Если `|aspect - 1| <= 0.02` (`strictSquare`, §5.3) → **`violation`** (S. 14: «квадрат — самая безжизненная форма»); если `0.02 < |aspect - 1| <= 0.05` (`nearSquareWarn`) → **`approx`** (предупреждение о близости к квадрату).
  - Если `actualOrientation === expectedOrientation` (`'lying'` при `aspect > 1`, `'standing'` при `aspect < 1`) → `ok`; иначе → `approx` (S. 14–15: исключения при малом/большом числе осей).
- `checkAxesCount(axesCount, variant, multiSub, isEmbeddedInRow, entrancePosition)`:
  - Нечётное `axesCount % 2 === 1` с центральным входом → `ok` (отдельно хвалит `5` осей как идеал, S. 14, 16); нечётное со смещённым входом (`left`/`right`) → `approx`.
  - Чётное при `entrancePosition === 'center'` → **`approx`** (конфликт простенка с центральной входной осью, S. 14) с подсказками по группировке из `getAxesGroupingHint(n)` (N7: `4`, `6`, `8`, `≥9` осей).
  - Чётное при `isEmbeddedInRow && variant === 'multi-story'` и боковом входе (`left`/`right`/`none`) → `ok` (боковой проезд/вход во встроенном доме, S. 14).

### 5.10. Межэтажные карнизы / ленты (`Gurtgesims`) — S. 10–11, 15–17, 22–23
- **4 класса состава (`BELT_CLASSES`):**
  1. `1` — Одна венчающая часть (`Kranz`), рек. режим `'binding'`, визуальная доля венца `crownShareOfBelt = 1.0` *(эвристика разреза)*.
  2. `2` — Архитравные полосы под венцом (`Architravplatten`), рек. `'binding'`, `crownShareOfBelt = 0.65`.
  3. `3` — Шейка (`Hals`) и поясок (`Halsband`) под венцом, рек. `'binding'`, `crownShareOfBelt = 0.60`.
  4. `4` — Полный антаблемент (`Architrav + Fries + Kranz`), рек. `'crowning'`, `crownShareOfBelt = 0.42`.
- `beltHeight(inp, customHeight?, { allowModestLowerFloor })`: делегирует в единую функцию `checkBeltHeight(...)` (P0-7); по умолчанию дефолт `h = (min + max) / 2`. В `evaluateFacadeSummary` при `one-story || floors <= 1 || beltIsAbsent` возвращается `notRequired: true, status: 'ok'`.
- `beltCrowningSplit(hCrown, ratio = 1, effect = 'neutral', consoleMode = 'none')`:
  - Проверяет `inRange = (ratio >= 0.5 - EPS && ratio <= 2.0 + EPS)` **до** клампинга `r = clamp(ratio, 0.5, 2.0)`.
  - `hLower = hCrown / (1 + r)`, `hUpper = hCrown - hLower`.
  - `consoleMismatch`: при `'lying_lower'` (лежачие консоли в нижних обломах) ожидается `ratio <= 1` (`h_верх < h_низ`), иначе `approx`; при `'standing_frieze'` (стоячие консоли во фризе) ожидается `ratio >= 1` (`h_верх > h_низ`), иначе `approx`.
  - Если `!inRange || hCrown <= 0` → `violation`; else if `consoleMismatch` → `approx`; else → `ok`.
- `beltWithColumns(H_belt, H_main, H_socle, hasColumns)`:
  - `!hasColumns` → `'n/a'`.
  - Иначе `H_belt < min(H_main, H_socle)` → `ok`, иначе → `violation`.
- `beltAsRustication(hasBaseProfile, floorHeight)`:
  - `!hasBaseProfile` → `violation` (S. 16: обязателен базовый профиль `Fußprofil`).
  - `hasBaseProfile && floorHeight < 3.0` *(порог 3.0 м — UX)* → `approx` (риск беспокойства от сплошной подоконной ленты при малой высоте этажа).
  - Иначе → `ok`.
- `threeStoryBeltScheme(scheme: 1 | 2 | 3)`:
  - `1` (`both_gurt`): лента на уровне пола 2-го и 3-го этажей;
  - `2` (`third_sohlbank`): лента под окнами 3-го этажа как подоконный карниз;
  - `3` (`unified_upper`): без ленты между 2-м и 3-м этажами — единое целое.
- `checkBeltSpecialCases(options)` (порядок приоритета проверок):
  1. `variant === 'one-story' || floors <= 1` → `ok` (лента не нужна).
  2. `onlySillUnderSecond === true` → **`approx`** (P0-5 / N29: на S. 22 приём назван редким и проблематичным, с советом подоконного парапета); **`violation`** только при вырождении `floorHeight > 0.55 * totalHeight`.
  3. `hasRustication && !hasBaseProfile` → **`violation`** (S. 16: нет `Fußprofil`).
  4. `isAbsent === true` → `ok`, если `3-эт.` / `4–5-эт.` / `threeStoryGurtMode === 'unified_upper'`; иначе для 2-этажного дома → `approx`.
  5. `isSillCornice && (variant === 'two-story' || floorHeight < 3.3)` → `approx` (S. 16–17: риск беспокойства подоконной ленты; порог `3.3 м` — UX).
  6. `!alignsWithRecesses` → `approx` (S. 17–18: лента не должна разрываться на ризалитах/западающих частях `Rücklagen`).
  7. Иначе → `ok`.

---

## 6. Сводная оценка фасада (`evaluateFacadeSummary`)

Функция `evaluateFacadeSummary(params, { expertMode = false })` формирует массив `checks: SummaryCheckItem[]` (базовые проверки ядра P0–P1, дополнительные P2 при включённом `hasWallRustication` / `hasCompositionBreakdown` / 5 этажах / смежных пилястрах и экспертные P3 при `expertMode: true`):

1. `axen_ratio` — шаг осей `A : H_max` по типологии (`ratio_from_AH`).
2. `variant_axis_ratio` — предел `A / H_max` через единую матрицу `allowedAxisRatio` (`checkVariantAxisRatio`).
3. `facade_rectangle` — ориентация прямоугольника фасада `W / H_total` (`checkFacadeRectangle`).
4. `axes_count` — чётность/нечётность числа осей и положение входа `entrancePosition` (`checkAxesCount`).
5. `pier_width` — `p_c ≥ w_v` (если `withFraming`) или `p ≥ w` (если без обрамления; для `rich_columnar` `ok` при `p > 0`).
6. `corner_pier` — `D` и `p_corner` (`check_corner`).
7. `window_range` — `1.5w ≤ h ≤ 2w`.
8. `window_diag` — правило половины диагонали `w ≤ d/2` (допуск `7 %` + `KNOWN_GOOD_RATIOS`).
9. *(если `withFraming`)* `n1_framing_width` (`u ∈ [w/6, w/5]`), `n2_sill_plate` (`h_sill ∈ [w/8, w/7]`), `framing_rfk` (`R : F : K` и вынос), *(если `withConsoles`)* `console_offset` (`a_front = a_side`).
10. `pilaster_check` — выступ пилястра/лопатки `v ≤ W_p/4`.
11. `cornice_split` — деление венчающего карниза `h_u : h_l`.
12. `socle_height` — высота цоколя `1/10 … 1/6 H_total` (при `useFullFloorAsSocle` берётся `derivedGeometry.floor1FullHeight`).
13. `main_cornice_subordination` — `h_main < h_socle` и диапазон по этажности/режиму (`checkMainCorniceWithVariant`).
14. `gurt_cornice` — поясной карниз (`checkGurtWithVariant`, с учётом `useFloorToFloorForBelt` и `allowModestFirstFloorForBelt`).
15. `socle_plate_dominant` — доминирование плиты цоколя (`plateDominant`, порог `1.2×`).
16. `socle_decreasing_upward` — убывание высоты руста и профиля от цоколя к 1-му этажу (`decreasingUpward`).
17. `socle_rustication_rows` — число рядов рустики цоколя (нечётное, шаг `0.30–0.40 м`).
18. `socle_abkroepfung` — раскреповки цокольного карниза (`abkroepfungPreference`).
19. `belt_crowning_and_special` — агрегированная проверка межэтажной ленты (`mergeStatuses` от `beltHeightCheck`, `beltCrowningCheck`, `beltColumnsCheck`, `beltSpecialCheck`).
20. *(условные P1/P2)* `n3_sill_cornice_over_u`, `n27_five_story_scheme` (при 5 этажах), `n4_window_rust_rows` (при рустовке стен), `n5_corner_rust_rows`, `n6_corner_offset_m_n`, а при `hasCompositionBreakdown` — `n8_wing_pier`, `n9_side_risalit`, `n10_wing_vs_side`, `n14_n15_comp_axes`, `n16_pilaster_pairs`, `n17_middle_axes`, `n23_attic`, `n25_risalit_richness`, `n11_five_part` / `n12_seven_part`, а при смежных/верхних пилястрах — `n18_pilaster_repetition`, `n19_pilaster_only_upper`.
21. *(только при `expertMode: true`, P3)* `n20_pilaster_vs_wall`, `n21_paired_pilasters_gap`, `n22_column_profile`, `n24_n26_pediment`.

> **Общий итог `overallStatus`:** `'violation'` при `violationCount > 0`; иначе `'approx'` при `approxCount > 0`; иначе `'ok'`.

---

## 7. Единый реестр правил (`src/calc/rulesData.json` — 41 запись)

В массиве `RULES_DATA.rules` зарегистрирована **41 запись**: **23 базовых правила ядра** (включая S. 1–17, 21–23) и **18 сгруппированных записей новых правил S. 12–23 (`N1–N29`)**. Полное сопоставление с первоисточником и приоритетами сведено в **Разделы 11 и 12**.

| # | `id` | Страница | Приоритет | Происхождение (`sourceStatus`) | `targetElement` | Формула / суть |
|---|---|---|---|---|---|---|
| 1 | `axenweite_zimmerhoehe` | S. 5–6 | `P0` | `explicit-verified` | `axenweite` | `A = H_max × (n / m)`, жилой дом `2:3…8:9`, пределы `1:1`, `1:2` |
| 2 | `pfeiler_ohne_umrahmung` | S. 5 | `P0` | `explicit-verified` | `pier` | `p = A − w; p ≥ w (A ≥ 2w)`; для `rich_columnar` отменено (`ok`) |
| 3 | `pfeiler_mit_umrahmung` | S. 5 | `P0` | `explicit-verified` | `framing_pier` | `w_v = w + 2u; p_c = A − (w + 2u); p_c ≥ w_v` |
| 4 | `eckpfeiler_abstand` | S. 4–5 | `P0` | `explicit-verified` | `corner` | `D = k_D × A (k_D ∈ [2/3, 5/6]); p_corner = D − w/2 − u` |
| 5 | `fenster_hoehen_grenzen` | S. 6 | `P0` | `explicit-verified` | `window` | `1.5w ≤ h ≤ 2w` |
| 6 | `fenster_goldener_schnitt` | S. 6–7 | `P0` | `explicit-verified` | `window` | `h = φ × w`, ряды `3:5 … 89:144`, близкие `5:9, 4:7` |
| 7 | `fenster_halbe_diagonale` | S. 7 | `P0` | `heuristic` | `window` | `d = √(w² + h²); w ≤ d / 2` (допуск `7 %` + `KNOWN_GOOD_RATIOS`) |
| 8 | `fenster_verdachung_rfk` | S. 7–8 | `P0` | `explicit-verified` | `entablature` | `R:F:K ∈ {1:1:1, 6:7:8, 4:5:6, 3:4:4, 2:3:3, 3:5:4}; s = T / (r+f+k)` |
| 9 | `ausladung_45_und_konsolen` | S. 8 | `P0` | `explicit-verified` | `entablature` | `v_proj = K (45°); с консолями v_console = (5/6)×K; a_front = a_side` |
| 10 | `pilaster_vorsprung` | S. 11–12 | `P0` | `explicit-verified` | `pilaster` | `v_max = W_p / 4; лёгкий v ∈ [W_p/6, W_p/5]` |
| 11 | `kranz_gliederung` | S. 10–11 | `P0` | `explicit-verified` | `cornice` | `h_u : h_l = 1:1` (допустимо `1:2 … 2:1`), `h_u + h_l = T_c` |
| 12 | `kranz_charakter_preset` | S. 10–11 | `P1` | `heuristic` | `cornice` | Тяжёлый: доля плиты `≥ 75 %`; лёгкий: `≤ 50 %` (UX-пороги) |
| 13 | `typologie_auswahl` | S. 2–6 | `P0` | `explicit-verified` | `axenweite` | Типологии, дворец `5:6..1:1`, колонный строй `1:2` |
| 14 | `sockel_gesammthoehe` | S. 16 | `P0` | `explicit-verified` | `socle` | Оптимум `H_total/6`, типично `1/10…1/7`, `< 1/10` — ошибка |
| 15 | `hauptgesims_unterordnung` | S. 16 | `P0` | `explicit-verified` | `socle` | `≤2 эт.: [1/12, 1/8]`, `>2 эт.: [1/15, 1/12]`; строго `h_main < h_socle` |
| 16 | `gurtgesims_abmessung` | S. 16 | `P0` | `explicit-verified` | `belt` | `h_gurt ∈ [H_floor/12, H_floor/6]; h_gurt < min(h_main, h_socle)` |
| 17 | `sockel_dreiteilig` | S. 10 | `P1` | `heuristic` | `socle` | `h_socle = fuss + rumpf + deck`; доминирование плиты |
| 18 | `sockel_abnahme_nach_oben` | S. 10 | `P0` | `explicit-verified` | `socle` | `h_rust(EG) < h_rust(Sockel); v_profile(EG) < v_profile(Sockel)` |
| 19 | `sockel_abkroepfung` | S. 10, 12 | `P1` | `explicit-verified` | `socle` | Сплошной прогон лучше раскреповки при подвальных окнах/лопатках |
| 20 | `sockel_quader_schichten` | S. 17 | `P0` | `explicit-verified` | `socle` | `rowHeight ∈ [0.30, 0.40]` м; предпочтительно нечётное `n` |
| 21 | `erdgeschoss_als_sockel` | S. 16, 22 | `P0` | `explicit-verified` | `socle` | Весь 1-й этаж как цоколь (`groundToFloor1 + floor1.floorToFloor ≥ h_socle_req`) |
| 22 | `varianty_etazhnosti_i_pryamougolnik` | S. 5–6, 14–16, 21 | `P0` | `heuristic` | `axenweite` | Лежачий/стоячий прямоугольник (`±2%` / `±5%`), чётные оси и вход |
| 23 | `gurtgesims_lenta_pravila` | S. 10–11, 16–17, 22 | `P0` | `explicit-verified` | `belt` | Ленты: `h_нижн/12…1/6`, `< min(H_ц, H_гл)`, 4 класса, венец `1:2…2:1`, 3 схемы |
| 24–41 | `n1_...` … `n24_n26_...` | S. 12–23 | `P1–P3` | `explicit-verified` / `heuristic` | разные | 18 записей, покрывающих правила **N1–N29** (см. §12) |

---

## 8. Полный перечень допущений, эвристик, пробелов источника и технических нюансов для аудита

Этот раздел — ключевой для сверки с оригиналом, так как фиксирует все места, где код дополняет текст числами или модельными упрощениями.

### 8.1. Числовые UX-эвристики (введены поверх качественных указаний)
1. **Допуск `tolerance = 0.03` (3 %)** и порог точного совпадения **`0.005` (0.5 %)** в `ratio_from_AH` и `checkVariantAxisRatio` — в книге не заданы, введены чтобы отличать точные дроби от небольшого отклонения слайдера.
2. **Допуск `diagTolerance = 0.07` (7 %)** в `check_window` (`P0-2`) — дополнен проверкой `isKnownGoodRatio`: все классические приближения книги (`3:5`, `5:8`, `5:9`, `4:7`, ряд Фибоначчи) получают `'approx'` со статусом `'explicit-verified'`, не эскалируя в `'violation'`.
3. **Пороги `plateShare` (`≥ 75 %` тяжёлый, `≤ 50 %` лёгкий)** в `cornice_character` — числовая формализация качественного описания S. 10–11.
4. **Доли 3-частного цоколя (`0.25 / 0.55 / 0.20`)** и **порог доминирования плиты (`1.2×`)** в `threePartSocle` / `plateDominant` — числовое представление тезиса S. 10.
5. **Порог квадрата фасада:** `|W / H_total - 1| <= 0.02` (`violation`) и `0.02 < |W / H_total - 1| <= 0.05` (`approx`) в `checkFacadeRectangle` — формализация запрета квадрата на S. 14.
6. **Отступ консолей `check_offset`: `tolerance = 0.005 м`** (допуск `5 мм` на `approx`, `1e-4 м` на `ok`) — UX-допуск поверх `a_front = a_side` (S. 8).
7. **Близкие границы для `check_corner` (`p_corner >= 0.9 * w`)** у отдельно стоящего дома и **точность оптимума цоколя (`±0.02 м` от `H_total/6`)** — UX-границы.
8. **Доли венца по 4 классам ленты (`crownShareOfBelt`: `1.0 / 0.65 / 0.60 / 0.42`)** — оценочные пропорции для построения разреза `BeltProfilePlate`.
9. **Пороги малой высоты этажа для ленты (`< 3.0 м`, `< 3.3 м`), вырождения при `onlySillUnderSecond` (`> 0.55 · H_total`), множителя выноса `×1.2` (`rich_1_2_unified`), ±15 % для 7-частного фасада (`N12`) и `ΔH ≥ 15 %` для смежных пилястр (`N18`)** — явные UX-ориентиры (`sourceStatus: 'heuristic'`).

### 8.2. 6 явных пробелов по этажности (`VARIANT_TEXT_GAPS`)
1. `gap_one_story_cornice`: числовые пределы главного карниза и венчающей части для **1-этажного дома** отсутствуют на S. 16 — применена экстраполяция `≥` нижних норм 2-этажного дома (`'approx'`).
2. `gap_wide_bay_threshold`: порог «широкого шага осей» для 1–2-этажного дома на S. 5 не задан числом (`A/H → 1.0`).
3. `gap_main_tier_floor2`: требование S. 22 выделять **2-й этаж** многоэтажного дома как «главный ярус» описано качественно без числового коэффициента.
4. `gap_five_story_schemes`: 5-этажные схемы S. 23 (`standard`: 1-й = цоколь, 2–4 = ствол, 5+карниз = венчание; `rich_1_2_unified`: особняк 1+2 объединены) даны описательно без долей высот этажей.
5. `gap_multi_vs_three_boundary`: формальная граница между «многоэтажный» (S. 16) и «3-этажный» / «4–5-этажный» (S. 22–23) в тексте не формализована.
6. `gap_one_story_socle`: специальные нормы цоколя для 1-этажного дома не приведены (применяются общие `1/10 … 1/6`).

### 8.3. 4 явных пробела по межэтажным лентам (`BELT_TEXT_GAPS`)
Два прежних пробела закрыты первоисточником: база высоты этажа пол-до-пола (`S. 5` чётко различает высоту этажа и высоту комнаты в свету, переключатель `useFloorToFloorForBelt`) и высота сплошной подоконной плиты (`N3: h_sillCornice > u`, `S. 17`). В `BELT_TEXT_GAPS` остаются **4 открытых пробела**:
1. `belt_gap_ausladung`: числовой **вынос (`Ausladung`)** межэтажной ленты в книге не указан (на S. 16 сказано лишь «умеренный», `mäßige Ausladung`).
2. `belt_gap_fuss_rumpf_deck`: трёхчастность `Fuß : Rumpf : Deckglied` дана в источнике только для цоколя (S. 10), но не для поясных лент.
3. `belt_gap_modest_lower`: числовой порог «скромного» 1-го этажа для допустимого `H_ленты < h/12` (S. 16) отсутствует.
4. `belt_gap_colonnade_ratio`: пропорциональная связь ленты с колоннадой/пилястрами нижнего этажа на S. 16 дана только качественно.

### 8.4. Устранённые конфликты и технические детали реализации
1. **Единая высота здания через `BuildingLevelsInput` / `DerivedGeometry` (`P0-6`):** удалена эвристика `H * 0.96`; и расчёты, и SVG-чертёж используют общие поэтажные отметки (`H_max`, `floor1FloorToFloor`, `floor1FullHeight`, `wallTopElevation`, `totalHeight`).
2. **Единая проверка высоты поясного карниза (`P0-7`):** `checkGurt` и `beltHeight` делегируют в общую функцию `checkBeltHeight(...)` с флагом `allowModestLowerFloor`.
3. **Согласование типологии и этажности (`P0-1`):** `checkVariantAxisRatio` использует `allowedAxisRatio(buildingType, variant, multiSub)` — конфликт `rich_columnar` (`1:2`), `palace` (`5:6..1:1`) и `monumental` (`4:5..1:1`) с пресетами многоэтажности устранён.
4. **Экспертный режим (`expertMode`):** скрывает/раскрывает правила приоритета `P3` (`N20`, `N21`, `N22`, `N24`, `N26`) в сводке `evaluateFacadeSummary`, панелях ввода и картотеке правил.

---

## 9. Возможности интерфейса и графической визуализации

1. **Три подстраницы раздела «Калькулятор»:**
   - *Фасад и калькуляторы* (2-колоночный макет: панель параметров + живой SVG-чертёж, поэтажный редактор `Levels`, переключатель `Эксперт (P3)`, аналитические пластины).
   - *Правила и нормы* (фильтрация по 5 типам правил, статусам происхождения `sourceStatus` и видимости `P3`, ссылки на страницы книги, кнопка «Показать на фасаде»).
   - *Тесты (11 кейсов)* (живое вычисление 11 примеров из текста S. 4–12 с допуском `1e-3` и кнопкой загрузки параметров каждого кейса на фасад).
2. **10 модулей калькулятора и обратные решатели:**
   - *Оси и простенки:* 5 режимов (`Найти A из H`, `Найти H из A`, `Макс. w из A`, `Найти A из p и w`, `Проверить`), учёт `rich_columnar` (`p < w` → `ok`).
   - *Этажность:* 5 пресетов, число осей `2–10`, положение входа (`entrancePosition`), встроенный/отдельно стоящий дом, подсказки группировки `N7`, режим главного карниза, 5-этажные схемы `standard` / `rich_1_2_unified` + усиленный вынос, схемы тяг 3-этажного дома.
   - *Окно:* 3 режима (`Найти h по w`, `Найти w по h`, `Проверить`), пресеты приближений `φ` и `n:m`, допуск диагонали `1–10 %` (дефолт `7 %`), рустовка стен (`N4`: 7–8 рядов), подоконная плита (`N2`).
   - *Угол (D):* пресеты `k_D`, ризалит на ширину комнаты, угловая рустовка (`N5`), уступ `M ≤ N` (`N6`), декомпозиция крыльев/ризалитов (`N8–N17`, `N23`, `N25`, 5- и 7-частный фасад).
   - *Обрамление:* 4 режима ввода (`по T`, `по R`, `по F`, `по K`), 6 отношений `R:F:K`, ширина наличника (`N1`: `w/6..w/5`), консоли с отступами `a_front / a_side`.
   - *Пилястр:* массивный/лёгкий характер, `Mauerpfeiler`, многоярусные пилястры (`N18–N19`) и экспертные проверки `P3` (`N20–N22`: ширина пилястра < стенового простенка, просвет спаренных `0.2·W_p..W_p`, `2/3` и `3/4` колонны).
   - *Карниз:* `T_c`, `h_u : h_l`, UX-пресет доли плиты, экспертная настройка фронтона (`N24`, `N26`).
   - *Цоколь:* поэтажный редактор `Levels` (`groundToFloor1`, `floorToFloor`, `slabThickness`, ручной `H_total`), пресеты `1/6` и `1/8`, включение 1-го этажа (`floor1FullHeight`), 3-частные доли, доминирование плиты, ряды рустики, убывание к 1-му этажу, раскреповки.
   - *Лента (пояс):* выбор базы (`floor1FloorToFloor` vs `H_max`), флаг скромного 1-го этажа (`< h/12`), сплошной подоконный пояс (`N3: h_sillCornice > u`), режим `binding / crowning`, 4 класса профиля, `h_верх : h_низ`, эффекты, консоли, спецслучаи (включая `onlySillUnderSecond` как `approx`, S. 22).
   - *Сводка:* табличный отчёт по всем проверкам с метками `sourceStatus` (`Из книги`, `UX-эвристика`, `Пробел`), приоритетом (`P0–P3`) и кликабельной подсветкой элемента на чертеже.
3. **Интерактивный `FacadeSvg` и 6 аналитических пластин (`AnalyticalPlates`):** клик по элементу чертежа переключает модуль; `FacadeSvg` рисует дверь по `entrancePosition`, крышу и карниз с учётом `mainCorniceProjectionBoost`, объединение `1+2 объед.` для `rich_1_2_unified` и поэтажные отметки из `derivedGeometry`.
4. **Верификация автотестами:** `src/calc/rules.test.ts` содержит **50 unit-тестов** (11 обязательных кейсов по книге, 5 обратных/типологических, 5 цоколя/иерархии, 4 этажности/пробелов, 4 межэтажных лент и 21 тест аудит-фиксов P0–P3 и правил S. 12–23).

---

## 10. Рекомендуемый порядок сверки с оригиналом (для ИИ-анализа)

При передаче этого файла и текста оригинала (`brausewetter_1895_ru.txt` / `brausewetter_1895_de.txt`) в ИИ удобно проверять:
1. **Точность формул (Раздел 5 + Разделы 11–12 vs `brausewetter_1895_ru.txt`):** дроби, неравенства (`<` vs `≤`) и типологические исключения (`palace 5:6..1:1`, `rich_columnar`).
2. **Метки происхождения (`sourceStatus`):** все ли числовые пороги, отсутствующие в книге, помечены как `heuristic` или `gap`.
3. **Неучтённые правила оригинала:** см. Раздел 13 (границы области применения).

---

## 11. Матрица трассируемости (`rules.ts` / `rulesData.json` ↔ S. 1–23)

| Модуль / ID в `rulesData.json` | Функции в `src/calc/rules.ts` | Страницы | `sourceStatus` | Приоритет |
|---|---|---|---|---|
| `axenweite_zimmerhoehe`, `typologie_auswahl` | `A_from_H`, `H_from_A`, `ratio_from_AH`, `allowedAxisRatio`, `checkVariantAxisRatio` | S. 2–6 | `explicit-verified` | `P0` |
| `pfeiler_ohne_umrahmung`, `pfeiler_mit_umrahmung` | `p_from_Aw`, `pc_from_Awu`, `A_from_pw`, `w_max_from_A`, `A_min_from_wu` | S. 5 | `explicit-verified` | `P0` |
| `eckpfeiler_abstand` | `D_from_A`, `p_corner_from_Dwu`, `check_corner` | S. 4–5 | `explicit-verified` | `P0` |
| `fenster_hoehen_grenzen`, `fenster_goldener_schnitt`, `fenster_halbe_diagonale` | `check_window`, `isKnownGoodRatio`, `nearest_golden_approx` | S. 6–7 | `explicit-verified` / `heuristic` (`diagTolerance`) | `P0` |
| `fenster_verdachung_rfk`, `ausladung_45_und_konsolen` | `framing_from_T`, `framing_from_module`, `projection_45`, `projection_console`, `check_offset` | S. 7–8 | `explicit-verified` | `P0` |
| `pilaster_vorsprung` | `pilaster_v_range`, `check_pilaster` | S. 11–12 | `explicit-verified` | `P0` |
| `kranz_gliederung`, `kranz_charakter_preset` | `cornice_split`, `cornice_character` | S. 10–11 | `explicit-verified` / `heuristic` | `P0` / `P1` |
| `sockel_gesammthoehe`, `hauptgesims_unterordnung`, `erdgeschoss_als_sockel` | `socleHeight`, `checkSocleHeight`, `checkMainCorniceWithVariant`, `fullFloorAsSocle` | S. 16, 22 | `explicit-verified` (1-эт.: `gap`) | `P0` |
| `sockel_dreiteilig`, `sockel_abnahme_nach_oben`, `sockel_abkroepfung`, `sockel_quader_schichten` | `threePartSocle`, `plateDominant`, `decreasingUpward`, `abkroepfungPreference`, `rusticationRows` | S. 10, 12, 17 | `heuristic` (`threePart`, `plate`) / `explicit-verified` | `P0–P1` |
| `gurtgesims_abmessung`, `gurtgesims_lenta_pravila` | `checkBeltHeight`, `checkGurt`, `beltHeight`, `beltCrowningSplit`, `beltWithColumns`, `beltAsRustication`, `checkBeltSpecialCases` | S. 10–11, 15–17, 22 | `explicit-verified` (UX-пороги `heuristic`) | `P0` |
| `varianty_etazhnosti_i_pryamougolnik` | `checkFacadeRectangle`, `checkAxesCount`, `getAxesGroupingHint`, `computeDerivedGeometry` | S. 5–6, 14–16, 21 | `explicit-verified` / `heuristic` (`±2%/5%`) | `P0` |
| `n1_...` … `n24_n26_...` (18 записей) | `checkFramingWidth` … `checkFiveStoryScheme` (см. §12) | S. 12–23 | `explicit-verified` / `heuristic` | `P1–P3` |

---

## 12. Новые правила из S. 12–23 (`N1–N29`)

| Код | Приоритет | Функция в `src/calc/rules.ts` | Страница | Содержание и статус |
|---|---|---|---|---|
| `N1` | `P1` | `checkFramingWidth(u, w)` | S. 17 | Ширина бокового наличника `u ∈ [w/6, w/5]` (`ok` внутри, `approx` вне) |
| `N2` | `P1` | `checkSillPlateHeight(hSill, w)` | S. 17 | Подоконная плита `h_sill ∈ [w/8, w/7]` (`ok`), `(w/7, w/6]` (`approx`), иначе `violation` |
| `N3` | `P1` | `checkSillCorniceHeight(hSillCornice, u)` | S. 17 | Сплошной подоконный пояс выше ширины наличника `h_sillCornice > u` |
| `N4` | `P2` | `checkWindowRows(winH, rowHeight, hasWallRustication)` | S. 17 | При стеновой рустовке на высоту окна приходится `7–8` рядов камня |
| `N5` | `P2` | `checkCornerRusticationRows(nRows)` | S. 15 | Предпочтительно нечётное число рядов угловой рустовки (`5, 7, 9…`) |
| `N6` | `P2` | `checkCornerOffsetVsUpperHeight(M, N)` | S. 15 | По рис. 7: угловой отступ `M ≤ N`; при `M > N` (`approx`) советует пилястры |
| `N7` | `P2` | `getAxesGroupingHint(axesCount)` | S. 15–16 | Группировка осей: `4` (сдвиг 2 средних), `6` (`2+2+2`), `8` (3 центральных), `≥9` (ризалиты) |
| `N8–N10, N13` | `P2` | `checkWingPierWidth`, `checkSideRisalitWidth`, `checkWingVsSideRisalit`, `checkMiddleVsSideRisalit` | S. 18–20 | `p_wing ≤ p_corner`; `W_side ≤ 2/3·W_central`; `W_wing ≥ 2·W_side`; `W_middle > W_side` |
| `N11–N12` | `P2` | `checkFivePartFacade`, `checkSevenPartFacade` | S. 19–20 | 5-частная схема (рис. 9) и 7-частная симметрия `1.5:3:5:3:1.5`, центр `1:2:1` (рис. 10, `±15 %` UX) |
| `N14–N17` | `P2` | `checkCentralRisalitAxes`, `checkWingAxes`, `checkPilasterBetweenWindowPairs`, `checkMiddleAxesInTwoSideRisalits` | S. 18–19 | Нечётные оси в ризалите/крыле, запрет пилястра между парой окон, запрет `2` окон в середине между 2 бок. ризалитами |
| `N18–N19` | `P2` | `checkPilasterRepetition`, `checkPilastersOnlyUpper` | S. 13 | Смежные пилястры требуют разницы высот этажей (`≥ 15 %` UX); ордер только в верхнем этаже — `approx` |
| `N20–N22` | `P3` | `checkPilasterNarrowerThanWallPier`, `checkPairedPilastersGap`, `checkColumnProfileType` | S. 12–13 | Пилястр уже простенка стены; просвет пары `(0.2·W_p, W_p)`; предпочтение `2/3` и `3/4` колонн перед полуколонной |
| `N23, N25` | `P2` | `checkAttic`, `checkRisalitRichness` | S. 14, 19 | Аттик только над ризалитом без крыльев запрещён; богатство ризалита ≥ крыла (искл. 2 бок. ризалита) |
| `N24, N26` | `P3` | `checkPedimentChoice`, `checkEqualWidthRisalitWingPediment` | S. 18–19 | Пологий фронтон в классике; выделение фронтоном ризалита, равного по ширине крылу |
| `N27–N28` | `P1` | `checkFiveStoryScheme` | S. 23 | 5 этажей: `standard` (`1 / 2–4 / 5+K`) vs `rich_1_2_unified` (`1+2 объед.`, невысокий карниз с усиленным выносом) |
| `N29` | `P1` | `checkBeltSpecialCases` (`onlySillUnderSecond`) | S. 22 | Только подоконный пояс под 2-м этажом — `approx` («редко и проблематично»), `violation` при вырождении `> 0.55·H_total` |

---

## 13. Ограничения области применения

1. **Историческая привязка:** математические нормы строго соответствуют первой части «Книги строительных форм» (*Das Bauformenbuch*, Bd. 1, 1895, S. 1–23) и отражают классицистическую / историцистскую каменную и штукатурную фасадную композицию конца XIX века; они не заменяют современные строительные нормы (СНиП/СП, DIN, Eurocode) по несущей способности, теплотехнике и инсоляции.
2. **Геометрический масштаб:** модель охватывает плоскую ортогональную проекцию главного фасада в пределах 1–5 этажей и 2–10 оконных осей; 3D-перспектива, эркеры, балконы, мансардные кровли и угловые башни за рамками S. 1–23 не моделируются.
3. **Экспертные и качественные нормы:** правила с пометкой `heuristic` и `gap` служат ориентирами UX-валидации, а не догматическими числовыми предписаниями оригинала.

---

## 14. Версионирование и changelog

- **v2.0 (Аудит S. 1–23 и поэтажная модель):**
  - Внедрена поэтажная модель `BuildingLevelsInput` + `DerivedGeometry` (удалена эвристика `H * 0.96`).
  - Реализованы аудит-фиксы `P0-1 … P0-7`: согласованы `allowedAxisRatio` (`rich_columnar`, `palace 5:6..1:1`, `monumental`), допуск диагонали `7 %` + `KNOWN_GOOD_RATIOS`, отмена `p >= w` для `rich_columnar`, `onlySillUnderSecond` (`approx`), унификация `checkBeltHeight` и синхронизация числа правил.
  - Внедрены метки происхождения `sourceStatus`, приоритеты `P0–P3`, 29 правил `N1–N29` (`41` запись в `rulesData.json`), переключаемый `expertMode` и `entrancePosition`.
  - Удалены редакционные обозначения «Схема A/B» и вымышленные коды `B-1…B-37`; закрыты 2 пробела ленты (оставлено `4` в `BELT_TEXT_GAPS` и `6` в `VARIANT_TEXT_GAPS`).
  - Тестовое покрытие расширено с 29 до **50 unit-тестов**.
- **v1.x:** базовое ядро S. 1–12, модули цоколя, вариантов этажности и межэтажных лент (`Gurtgesims`).

