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
> - Автотесты (29 unit-тестов): `src/calc/rules.test.ts`

---

## 1. Общие принципы расчёта и система статусов

1. **Охват первоисточника:** страницы **S. 1–12, 14–17, 21–23** (*Bd. 1, 1895*, источник сканов: `https://gateway-bayern.de/BV014442283`).
2. **Точность вычислений:**
   - Все промежуточные вычисления выполняются в числах с плавающей точкой (`number`, IEEE-754) **без округления** (включая точные дроби вроде `2/3`, `4/5`, `5/6`, `7/8`, `φ = (1 + √5) / 2 ≈ 1.618033988749895`).
   - Округление до `3` знаков (или `2` знаков для долей/соотношений) применяется **только при форматировании вывода** (`formatMeters`, `formatPercent`).
   - Для граничных сравнений используется допуск машинной точности `EPS = 1e-9` (для равенств вида `p === w` в пояснениях — `1e-4`).
3. **Статусы валидации (`ValidationStatus`):**
   - `ok` — правило / ограничение источника выполнено строго;
   - `approx` — приближение в пределах допуска, условное допущение по исключению текста, качественное предупреждение или эвристика/экстраполяция (например, для 1-этажного дома);
   - `violation` — прямое нарушение ограничения источника или математически вырожденные входные данные (`<= 0`);
   - `'n/a'` (только для `beltWithColumns`) — условие не применяется (нет колоннады/пилястр в 1-м этаже).
4. **Разграничение «из текста» и «эвристика / экстраполяция»:**
   - В реестре правил помечено полем `confidence: "explicit" | "heuristic"`.
   - Всё, что введено для удобства UX поверх качественного описания текста, явно сведено в **Раздел 8** (включая 6 пробелов по этажности и 6 пробелов по межэтажным лентам).

---

## 2. Полная модель входных параметров (`FacadeParameters`)

| Поле | Тип | Назначение / смысл | Ед. | Диапазон в UI (ползунок) | Источник / примечание |
|---|---|---|---|---|---|
| `buildingType` | `BuildingTypeId` | Типология здания (7 вариантов) | — | select | S. 2–6, 11–12 |
| `buildingVariant` | `'one-story' \| 'two-story' \| 'multi-story'` | Вариант этажности | — | 3 кнопки / пресеты | S. 5–6, 14–16, 21–23 |
| `multiSub` | `'three' \| 'four-five' \| 'general'` | Подтип многоэтажного дома | — | 3 кнопки | S. 16, 22–23 |
| `axesCount` | `number` | Число оконных осей на главном фасаде | ос. | `2 … 10` (шаг `1`, кнопки `3..8`) | S. 14–16 |
| `corniceVariantMode` | `'full_entablature' \| 'crowning_only'` | Режим оценки главного карниза (полный антаблемент или только `Kranz`) | — | 2 кнопки | S. 16 |
| `fourFiveScheme` | `'A' \| 'B'` | Схема членения 4–5-этажного дома | — | 2 кнопки | S. 23 |
| `threeStoryGurtMode` | `'both_gurt' \| 'third_sohlbank' \| 'unified_upper'` | Вариант поясных тяг для 3-этажного дома (Схемы 1, 2, 3) | — | 3 кнопки | S. 22 |
| `isEmbeddedInRow` | `boolean` | Встроенный в уличный ряд дом (разрешает чётные оси при боковом входе) | — | checkbox | S. 14 |
| `H` | `number` | Высота комнаты `H_max` / высота нижнего этажа | м | `2.2 … 6.5` | S. 5–6, 16 |
| `A` | `number` | Шаг осей `Axenweite` | м | `1.4 … 6.0` | S. 4–6 |
| `w` | `number` | Ширина окна в свету `lichte Fensterbreite` | м | `0.5 … 2.4` | S. 5–7 |
| `h` | `number` | Высота окна в свету | м | `0.8 … 4.0` | S. 6–7 |
| `withFraming` | `boolean` | Наличие профилированного обрамления (наличника) и сандрика | — | toggle | S. 5, 7–8 |
| `u` | `number` | Ширина бокового обрамления с одной стороны `Rahmen` | м | `0.05 … 0.45` | S. 5 |
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
| `diagTolerance` | `number` | Допуск правила половины диагонали окна (по умолчанию `0.05` = 5 %) | % | `1 … 10 %` | Эвристика UX для 3:5 (S. 7) |
| `floors` | `number` | Число этажей здания (в UI `1..5`) | эт. | `1 … 5` | S. 16, 21–23 |
| `totalHeight` | `number` | Общая высота здания `H_total` (используется в проверках карнизов и прямоугольника) | м | `4.0 … 24.0` | S. 14–16 |
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
| `rustRowHeight` | `number` | Целевая высота ряда квадровой рустики цоколя | м | `0.22 … 0.48` | S. 17 |
| `useFullFloorAsSocle` | `boolean` | Трактовка всего 1-го этажа как цоколя (`effectiveSocleH = H`) | — | checkbox | S. 16, 22 |
| `beltMode` | `'binding' \| 'crowning'` | Функция ленты: связующая vs венчающая нижний этаж | — | 2 кнопки | S. 10–11 |
| `beltType` | `1 \| 2 \| 3 \| 4` | Класс состава ленты | — | 4 карточки | S. 10–11 |
| `beltUpperFloorHeight` | `number` | Высота верхнего этажа над лентой | м | `2.2 … 6.0` | S. 16, 22 |
| `beltCrowningRatio` | `number` | Отношение `h_верх : h_низ` в венчающей части ленты | `:1` | `0.35 … 2.40` | S. 10–11 |
| `beltEffect` | `'neutral' \| 'heavy' \| 'light'` | Эффект венца ленты (`1:1`, тяжёлый `1.35`, лёгкий `0.8`) | — | 3 кнопки | S. 11 |
| `beltConsoleMode` | `'none' \| 'lying_lower' \| 'standing_frieze'` | Позиция консолей в ленте | — | 3 кнопки | S. 11 |
| `beltHasColumnsBelow` | `boolean` | Колоннада или пилястры в нижнем этаже под лентой | — | checkbox | S. 16 |
| `beltAsRusticationMode` | `boolean` | Замена карнизной ленты рустовкой (`Fugenteilung`) | — | checkbox | S. 15–16 |
| `beltRusticationHasBaseProfile` | `boolean` | Наличие базового профиля (`Fußprofil`) под рустовкой | — | checkbox | S. 16 |
| `beltIsAbsent` | `boolean` | Отсутствие межэтажной ленты (объединение смежных этажей) | — | checkbox | S. 22–23 |
| `beltIsSillCornice` | `boolean` | Лента выполнена как сплошной подоконный карниз (`Sohlbankgesimse`) | — | checkbox | S. 16–17, 22 |
| `beltOnlySillUnderSecond` | `boolean` | Сценарий «только подоконный пояс под 2-м этажом без поясного» | — | checkbox | S. 22 |
| `beltAlignsWithRecesses` | `boolean` | Согласование ленты с западающими частями и ризалитами (`Rücklagen`) | — | checkbox | S. 17–18 |

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
| `monumental` | Монументальное здание (`Monumentalbau`) | S. 4, 11 | `0.750 … 1.000` (рек. `4:5…1:1`) | Строго `p_corner > p_intermediate` | `p ≥ w`, `p_c ≥ w_v` | `two-story` (`2` эт.), `H=4.8`, `A=4.2 (7:8)`, `w=1.3`, `h=2.25`, `u=0.25`, `k_D=0.8333`, `T=1.47`, `Wp=0.8`, `v=0.18`, `Tc=0.7`, `H_total=11.4`, `massive`, `plateShare=0.78`, `beltEffect='heavy'` |
| `palace` | Дворец (`Palastarchitektur`) | S. 5 | `0.850 … 1.050` (`A:H → 1:1`) | Строго `p_corner > p_intermediate` | `p ≥ w`, `p_c ≥ w_v` | `multi-story:general` (`4` эт.), `H=5.0`, `A=5.0 (1:1)`, `w=1.4`, `h=2.45`, `u=0.28`, `k_D=0.8333`, `T=1.68`, `Wp=0.9`, `v=0.2`, `Tc=0.8`, `H_total=18.0`, `massive`, `plateShare=0.78`, `beltMode='crowning'`, `beltType=4`, `beltHasColumnsBelow=true` |
| `rich_columnar` | Богатая колонно-пилястровая архитектура | S. 5, 12 | `0.450 … 0.600` (`A:H → 1:2`) | Как у городского дома (`p_inter ≥ p_corner` или `p_corner > w`) | Проём может быть шире простенка (`p < w` → `approx`) | `multi-story:general` (`4` эт.), `H=5.2`, `A=2.6 (1:2)`, `w=1.45`, `h=2.5`, `u=0.22`, `k_D=0.75`, `T=1.4`, `Wp=0.72`, `v=0.16`, `Tc=0.72`, `H_total=13.5`, `beltMode='crowning'`, `beltType=4`, `beltHasColumnsBelow=true` |

---

## 4. Пресеты этажности (`VARIANT_PRESETS` и `applyBuildingVariantPreset`)

### 4.1. Нормативная матрица (`VariantRules`)

| Пресет (`id`) | Стр. | `defaultFloors` | Цоколь (`H_total`) | Главный карниз (`full_entablature`) | Один венец (`crowning_only`) | Поясной карниз (`gurt`, от `h_эт`) | Прямоугольник фасада | Членение | `A / H_max` | Оси | Колонны необязат. | Спецфлаги |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `one-story` | S. 5, 14, 16, 21 | `1` | `0.10 … 1/6` (опт. `1/6`) | `'extrapolated'` (проверка `≥ 1/12` как 2-эт.) | `'extrapolated'` (проверка `≥ 1/16`) | `null` (не требуется) | `lying` (`W > H_total`) | `horizontal` | `2/3 … 1.0` | `odd` | `true` | — |
| `two-story` | S. 5, 12, 14, 16, 21 | `2` | `0.10 … 1/6` (опт. `1/6`) | `1/12 … 1/8` (`0.0833..0.125`) | `1/16 … 1/15` (`0.0625..0.0667`) | `1/12 … 1/6` | `lying` (`W > H_total`) | `horizontal` | `2/3 … 1.0` | `odd` | `false` | — |
| `multi-story:three` | S. 6, 15–16, 22 | `3` | `0.10 … 1/6` (опт. `1/6`) | `1/15 … 1/12` (`0.0667..0.0833`) | `1/20 … 1/16` (`0.0500..0.0625`) | `1/12 … 1/6` | `standing` (`H_total > W`) | `vertical` | `2/3 … 7/8` (`0.875`) | `odd` | `false` | `mainTierFloor=2`, `upperFloorSmallest=true` |
| `multi-story:four-five` | S. 6, 15–16, 22–23 | `5` | `0.10 … 1/6` (опт. `1/6`) | `1/15 … 1/12` | `1/20 … 1/16` | `1/12 … 1/6` | `standing` | `vertical` | `2/3 … 7/8` | `odd` | `false` | Схемы `A`/`B`; `mainTierFloor=2`, `upperFloorSmallest=true` |
| `multi-story:general` | S. 5–6, 15–16, 22 | `4` | `0.10 … 1/6` (опт. `1/6`) | `1/15 … 1/12` | `1/20 … 1/16` | `1/12 … 1/6` | `standing` | `vertical` | `2/3 … 7/8` | `odd` | `false` | `mainTierFloor=2`, `upperFloorSmallest=true` |

### 4.2. Что пересчитывает `applyBuildingVariantPreset(prev, variant, multiSub)`
1. Устанавливает `floors = preset.defaultFloors`, `axesCount = (variant === 'one-story' || variant === 'two-story') ? 5 : 3`.
2. Корректирует `A`, если текущее `A / H` вышло за `[axisRatio.min, axisRatio.max]`: сверху ограничивает до `H * min(max, 0.8)`, снизу — поднимает до `H * min`.
3. Оценивает `estFloorsHeight` (`one-story`: `H + 0.65`, `two-story`: `2 * H * 0.96`, `multi-story`: `floors * min(H, 3.6) * 0.96`), затем вычисляет `totalHeight = max(4.6, estFloorsHeight / (1 - 1/6 - activeMainShare))`.
4. Вычисляет `hSocle = totalHeight / 6`, `hMain = totalHeight * activeMainShare` (середина диапазона варианта, для `one-story` `0.1` или `0.065`), `hGurt = gurt === null ? 0 : min(H / 9, hMain * 0.65)`.
5. Пересчитывает `rustRowHeight = clamp(hSocle / 5, 0.30, 0.40)`.
6. Включает `useFullFloorAsSocle = true` для `miethaus` + `four-five`, и `isEmbeddedInRow = (variant === 'multi-story')`.
7. Сбрасывает `beltIsAbsent = (variant === 'one-story')`, `beltIsSillCornice = false`, `beltOnlySillUnderSecond = false`, обновляет `beltUpperFloorHeight = max(2.6, H * 0.92)`.

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
  - `p < w` при `buildingType === 'rich_columnar'` → `approx` (исключение S. 5).
  - Иначе → `violation`.
- `pc_from_Awu(A, w, u, buildingType)`: `w_v = w + 2u`, `p_c = A - w_v`.
  - `p_c <= 0` → `violation`.
  - `p_c >= w_v - EPS` → `ok`.
  - `p_c < w_v` при `rich_columnar` → `approx`.
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
- `check_window(w, h, tolerance = 0.05)`:
  - **Проверка 1 (`rangeCheck`):** `1.5w <= h <= 2w` → `ok` или `violation`.
  - **Проверка 2 (`diagCheck`):** `d = hypot(w, h)`, `halfD = d / 2`.
    - `w <= d/2 + EPS` (т.е. `h >= √3·w ≈ 1.732w`) → `ok`.
    - Иначе `deviationPct = (w - d/2) / (d/2)`: если `deviationPct <= tolerance + EPS` → `approx` (для `3:5` `deviationPct ≈ 2.9 %`); иначе → `violation`.
  - **Итог окна:** `violation`, если хотя бы одна из двух проверок `violation`; иначе `approx`, если `diagCheck === 'approx'`; иначе `ok`.

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
  - *Важно:* если в параметрах включён флаг `useFullFloorAsSocle`, в сводке и расчётах подставляется `effectiveSocleH = params.H`.
- `checkMainCornice(hSocle, hMain, totalHeight, floors)` *(базовая без пресетов)*:
  - `floors <= 2` → `[totalHeight / 12, totalHeight / 8]`; `floors > 2` → `[totalHeight / 15, totalHeight / 12]`.
  - Требует строго `hMain < hSocle - EPS` И попадание в диапазон → `ok`, иначе `violation`.
- `checkGurt(hGurt, floorHeight, hSocle, hMain)`:
  - Диапазон `[floorHeight / 12, floorHeight / 6]`.
  - `!belowMain || !belowSocle` (`hGurt >= min(hMain, hSocle)`) → `violation`.
  - `inRange` → `ok`.
  - `hGurt < floorHeight / 12` → `approx` (S. 16: при скромном первом этаже допустимы меньшие высоты).
  - `hGurt > floorHeight / 6` → `violation`.
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
- `fullFloorAsSocle(firstFloorHeight, requiredSocleHeight)`:
  - `applicable = firstFloorHeight >= requiredSocleHeight - EPS && firstFloorHeight > 0` (`ok` / `violation`; в `evaluateFacadeSummary` передаётся `requiredSocleHeight = totalHeight / 10`).

### 5.9. Вариантные проверки этажности — S. 5–6, 14–16, 21–23
- `checkMainCorniceWithVariant(hSocle, hMain, totalHeight, variant, multiSub, corniceMode)`:
  - Для `two-story` и `multi-story` берёт точные доли (`1/12..1/8` или `1/16..1/15`; `1/15..1/12` или `1/20..1/16`).
  - Для `one-story` (`'extrapolated'`): применяет **экстраполяцию ≥ нижнего предела 2-этажного** (`hMain >= totalHeight / 12` для `full_entablature` или `>= totalHeight / 16` для `crowning_only`). При соблюдении `hMain < hSocle` и нижнего предела возвращает **`approx`** (явная пометка экстраполяции); иначе `violation`.
- `checkGurtWithVariant(...)`: для `one-story` (`gurt === null`) возвращает `notRequired: true, status: 'ok'`, для остальных вызывает `checkGurt`.
- `checkVariantAxisRatio(A, H_max, variant, multiSub, tolerance = 0.03)`:
  - Сравнивает `A / H_max` с `[2/3, 1.0]` (для 1–2 эт.) или `[2/3, 7/8]` (для многоэтажных).
  - Внутри интервала → `ok`; в допуске `±3%` → `approx`; иначе → `violation`. Для 1–2 эт. помечен флаг `isWideBayHeuristic = true` (порог «широкого шага» в книге качественный).
- `checkFacadeRectangle(facadeWidth, totalHeight, variant, multiSub)`:
  - В `evaluateFacadeSummary` ширина фасада считается как `facadeWidth = 2 * D + (axesCount - 1) * A`.
  - `aspect = facadeWidth / totalHeight`.
  - Если `|aspect - 1| <= 0.05` (`nearSquare`) → **`violation`** (S. 14: «квадрат — самая безжизненная форма»).
  - Если `actualOrientation === expectedOrientation` (`'lying'` при `aspect > 1`, `'standing'` при `aspect < 1`) → `ok`; иначе → `approx` (S. 14–15: исключения при малом/большом числе осей).
- `checkAxesCount(axesCount, variant, multiSub, isEmbeddedInRow)`:
  - Нечётное `axesCount % 2 === 1` → `ok` (отдельно хвалит `5` осей как идеал, S. 14, 16).
  - Чётное при `isEmbeddedInRow && variant === 'multi-story'` → `ok` (боковой вход во встроенном доме, S. 14).
  - Чётное в прочих случаях → `approx` с подсказками по группировке для `4`, `6`, `8` осей (S. 15–16).

### 5.10. Межэтажные карнизы / ленты (`Gurtgesims`, B-1…B-37) — S. 10–11, 15–17, 22–23
- **4 класса состава (`BELT_CLASSES`):**
  1. `1` — Одна венчающая часть (`Kranz`), рек. режим `'binding'`, визуальная доля венца `crownShareOfBelt = 1.0` *(эвристика разреза)*.
  2. `2` — Архитравные полосы под венцом (`Architravplatten`), рек. `'binding'`, `crownShareOfBelt = 0.65`.
  3. `3` — Шейка (`Hals`) и поясок (`Halsband`) под венцом, рек. `'binding'`, `crownShareOfBelt = 0.60`.
  4. `4` — Полный антаблемент (`Architrav + Fries + Kranz`), рек. `'crowning'`, `crownShareOfBelt = 0.42`.
- `beltHeight(inp, customHeight?)`:
  - `range = [hLowerFloor / 12, hLowerFloor / 6]`, дефолт `h = (min + max) / 2`.
  - Проверки: `h >= min`, `h <= max`, `h < H_socle`, `h < H_mainCornice`. Нарушение любого условия → `violation` (в сводке `evaluateFacadeSummary` при `one-story || floors <= 1 || beltIsAbsent` возвращается `notRequired: true, status: 'ok'`).
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
  2. `onlySillUnderSecond === true` → **`violation`** (S. 22: запрещено «только подоконник под 2-м этажом»).
  3. `hasRustication && !hasBaseProfile` → **`violation`** (S. 16: нет `Fußprofil`).
  4. `isAbsent === true` → `ok`, если `3-эт.` / `4–5-эт.` / `threeStoryGurtMode === 'unified_upper'`; иначе для 2-этажного дома → `approx`.
  5. `isSillCornice && (variant === 'two-story' || floorHeight < 3.3)` → `approx` (S. 16–17: риск беспокойства подоконной ленты; порог `3.3 м` — UX).
  6. `!alignsWithRecesses` → `approx` (B-27 / S. 17–18: лента не должна разрываться на ризалитах/западающих частях).
  7. Иначе → `ok`.

---

## 6. Сводная оценка фасада (`evaluateFacadeSummary`)

Функция `evaluateFacadeSummary(params)` формирует массив `checks: SummaryCheckItem[]` (18 проверок без обрамления, до **20 проверок** с обрамлением и консолями):

1. `axen_ratio` — шаг осей `A : H` по типологии (`ratio_from_AH`).
2. `variant_axis_ratio` — предел `A / H_max` по варианту этажности (`checkVariantAxisRatio`).
3. `facade_rectangle` — ориентация прямоугольника фасада `W / H_total` (`checkFacadeRectangle`).
4. `axes_count` — чётность/нечётность числа осей (`checkAxesCount`).
5. `pier_width` — `p_c ≥ w_v` (если `withFraming`) или `p ≥ w` (если без обрамления).
6. `corner_pier` — `D` и `p_corner` (`check_corner`).
7. `window_range` — `1.5w ≤ h ≤ 2w`.
8. `window_diag` — правило половины диагонали `w ≤ d/2`.
9. *(если `withFraming`)* `framing_rfk` — сандрик `R : F : K` и вынос.
10. *(если `withFraming && withConsoles`)* `console_offset` — равенство отступов `a_front = a_side`.
11. `pilaster_check` — выступ пилястра/лопатки `v ≤ W_p/4`.
12. `cornice_split` — деление венчающего карниза `h_u : h_l`.
13. `socle_height` — высота цоколя `1/10 … 1/6 H_total` (с учётом `useFullFloorAsSocle`).
14. `main_cornice_subordination` — `h_main < h_socle` и диапазон по этажности/режиму (`checkMainCorniceWithVariant`).
15. `gurt_cornice` — поясной карниз (`checkGurtWithVariant`).
16. `socle_plate_dominant` — доминирование плиты цоколя (`plateDominant`, порог `1.2×`).
17. `socle_decreasing_upward` — убывание высоты руста и профиля от цоколя к 1-му этажу (`decreasingUpward`).
18. `socle_rustication_rows` — число рядов рустики цоколя (нечётное, шаг `0.30–0.40 м`).
19. `socle_abkroepfung` — раскреповки цокольного карниза (`abkroepfungPreference`).
20. `belt_crowning_and_special` — агрегированная проверка межэтажной ленты:
    - `violation`, если любой из `beltHeightCheck`, `beltCrowningCheck`, `beltColumnsCheck`, `beltSpecialCheck` равен `'violation'`;
    - иначе `approx`, если `beltCrowningCheck === 'approx'` или `beltSpecialCheck === 'approx'`;
    - иначе `ok`.

> **Общий итог `overallStatus`:** `'violation'` при `violationCount > 0`; иначе `'approx'` при `approxCount > 0`; иначе `'ok'`.

---

## 7. Единый реестр правил (`src/calc/rulesData.json` — 22 правила)

| # | `id` | Страница | Тип | Достоверность | `targetElement` | Формула / суть |
|---|---|---|---|---|---|---|
| 1 | `axenweite_zimmerhoehe` | S. 5–6 | `formula` | `explicit` | `axenweite` | `A = H × (n / m)`, жилой дом `2:3…8:9`, пределы `1:1`, `1:2` |
| 2 | `pfeiler_ohne_umrahmung` | S. 5 | `constraint` | `explicit` | `pier` | `p = A − w; p ≥ w (A ≥ 2w)` |
| 3 | `pfeiler_mit_umrahmung` | S. 5 | `constraint` | `explicit` | `framing_pier` | `w_v = w + 2u; p_c = A − (w + 2u); p_c ≥ w_v` |
| 4 | `eckpfeiler_abstand` | S. 4–5 | `constraint` | `explicit` | `corner` | `D = k_D × A (k_D ∈ [2/3, 5/6]); p_corner = D − w/2 − u` |
| 5 | `fenster_hoehen_grenzen` | S. 6 | `constraint` | `explicit` | `window` | `1.5w ≤ h ≤ 2w` |
| 6 | `fenster_goldener_schnitt` | S. 6–7 | `formula` | `explicit` | `window` | `h = φ × w`, ряды `3:5 … 89:144`, близкие `5:9, 4:7` |
| 7 | `fenster_halbe_diagonale` | S. 7 | `heuristic` | `heuristic` | `window` | `d = √(w² + h²); w ≤ d / 2` (допуск `5 %` для `3:5`) |
| 8 | `fenster_verdachung_rfk` | S. 7–8 | `formula` | `explicit` | `entablature` | `R:F:K ∈ {1:1:1, 6:7:8, 4:5:6, 3:4:4, 2:3:3, 3:5:4}; s = T / (r+f+k)` |
| 9 | `ausladung_45_und_konsolen` | S. 8 | `formula` | `explicit` | `entablature` | `v_proj = K (45°); с консолями v_console = (5/6)×K; a_front = a_side` |
| 10 | `pilaster_vorsprung` | S. 11–12 | `constraint` | `explicit` | `pilaster` | `v_max = W_p / 4; лёгкий v ∈ [W_p/6, W_p/5]` |
| 11 | `kranz_gliederung` | S. 10–11 | `profile_rule` | `explicit` | `cornice` | `h_u : h_l = 1:1` (допустимо `1:2 … 2:1`), `h_u + h_l = T_c` |
| 12 | `kranz_charakter_preset` | S. 10–11 | `heuristic` | `heuristic` | `cornice` | Тяжёлый: доля плиты `≥ 75 %`; лёгкий: `≤ 50 %` (UX-пороги) |
| 13 | `typologie_auswahl` | S. 2–6 | `typology` | `explicit` | `axenweite` | Горизонталь vs вертикаль, соответствие плану и назначению |
| 14 | `sockel_gesammthoehe` | S. 16 | `constraint` | `explicit` | `socle` | Оптимум `H_total/6`, типично `1/10…1/7`, `< 1/10` — ошибка |
| 15 | `hauptgesims_unterordnung` | S. 16 | `constraint` | `explicit` | `socle` | `≤2 эт.: [1/12, 1/8]`, `>2 эт.: [1/15, 1/12]`; строго `h_main < h_socle` |
| 16 | `gurtgesims_abmessung` | S. 16 | `constraint` | `explicit` | `socle` | `h_gurt ∈ [H_floor/12, H_floor/6]; h_gurt < h_main; h_gurt < h_socle` |
| 17 | `sockel_dreiteilig` | S. 10 | `heuristic` | `heuristic` | `socle` | `h_socle = fuss + rumpf + deck`; доминирование плиты |
| 18 | `sockel_abnahme_nach_oben` | S. 10 | `constraint` | `explicit` | `socle` | `h_rust(EG) < h_rust(Sockel); v_profile(EG) < v_profile(Sockel)` |
| 19 | `sockel_abkroepfung` | S. 10, 12 | `profile_rule` | `explicit` | `socle` | Сплошной прогон лучше раскреповки при подвальных окнах/лопатках |
| 20 | `sockel_quader_schichten` | S. 17 | `constraint` | `explicit` | `socle` | `rowHeight ∈ [0.30, 0.40]` м; предпочтительно нечётное `n` |
| 21 | `erdgeschoss_als_sockel` | S. 16, 22 | `typology` | `explicit` | `socle` | Включение всего 1-го этажа в цоколь при `H_floor1 ≥ h_socle_required` |
| 22 | `varianty_etazhnosti_i_pryamougolnik` | S. 5–6, 14–16, 21 | `typology` | `heuristic` | `axenweite` | 5 пресетов этажности, лежачий/стоячий прямоугольник, запрет квадрата |
| 23 | `chetyrekh_pyatietazhnye_skhemy` | S. 22–23 | `typology` | `heuristic` | `socle` | 2-й эт. главный ярус, верхний наименьший, схемы A и B |
| 24 | `gurtgesims_lenta_pravila` | S. 10–11, 16–17, 22 | `profile_rule` | `heuristic` | `belt` | Ленты: `h_нижн/12…1/6`, `< min(H_ц, H_гл)`, 4 класса, венец `1:2…2:1`, спецслучаи |

*(Примечание: фактически в массиве `rulesDataJson.rules` на текущий момент **24 записи**, хотя в шапках вкладок отображается динамически `RULES_DATA.rules.length`.)*

---

## 8. Полный перечень допущений, эвристик, пробелов источника и технических нюансов для аудита

Этот раздел — ключевой для сверки с оригиналом, так как фиксирует все места, где код дополняет текст числами или модельными упрощениями.

### 8.1. Числовые UX-эвристики (введены поверх качественных указаний)
1. **Допуск `tolerance = 0.03` (3 %)** и порог точного совпадения **`0.005` (0.5 %)** в `ratio_from_AH` и `checkVariantAxisRatio` — в книге не заданы, введены чтобы отличать точные дроби от небольшого отклонения слайдера.
2. **Допуск `diagTolerance = 0.05` (5 %)** в `check_window` — введён для того, чтобы классическое приближение `3:5` (`deviation ≈ 2.9 %` от `d/2`) получало статус `'approx'`, а не `'violation'`.
3. **Пороги `plateShare` (`≥ 75 %` тяжёлый, `≤ 50 %` лёгкий)** в `cornice_character` — числовая формализация качественного описания S. 10–11.
4. **Доли 3-частного цоколя (`0.25 / 0.55 / 0.20`)** и **порог доминирования плиты (`1.2×`)** в `threePartSocle` / `plateDominant` — числовое представление тезиса S. 10 (в тексте только требование трёхчастности и преобладания плиты).
5. **Порог квадрата фасада (`|W / H_total - 1| <= 0.05`)** в `checkFacadeRectangle` — формализация запрета квадрата на S. 14 (`±5 %` не из книги).
6. **Отступ консолей `check_offset`: `tolerance = 0.005 м`** (допуск `5 мм` на статус `approx`, `1e-4 м` на точное `ok`) — UX-допуск поверх `a_front = a_side` (S. 8).
7. **Близкие границы для `check_corner` (`p_corner >= 0.9 * w`)** у отдельно стоящего дома и **точность оптимума цоколя (`±0.02 м` от `H_total/6`)** — UX-границы для `approx` / пометки оптимума.
8. **Доли венца по 4 классам ленты (`crownShareOfBelt`: `1.0 / 0.65 / 0.60 / 0.42`)** — оценочные пропорции для построения разреза `BeltProfilePlate`, чтобы вычислять `hCrown = hGurt * crownShareOfBelt`.
9. **Пороги малой высоты этажа для ленты:** `< 3.0 м` в `beltAsRustication` и `< 3.3 м` в `checkBeltSpecialCases` (`isSillCornice`) — числовые эвристики для предупреждения о «беспокойстве» сплошной подоконной ленты (S. 16–17).

### 8.2. 6 явных пробелов по этажности (`VARIANT_TEXT_GAPS`)
1. `gap_one_story_cornice`: числовые пределы главного карниза и венчающей части для **1-этажного дома** отсутствуют на S. 16 — применена экстраполяция `≥` нижних норм 2-этажного дома (со статусом `'approx'`).
2. `gap_wide_bay_threshold`: порог «широкого шага осей» для 1–2-этажного дома на S. 5 не задан числом (взят предел `A/H → 1.0`).
3. `gap_main_tier_floor2`: требование S. 22 выделять **2-й этаж** многоэтажного дома как «главный ярус» описано качественно без числового коэффициента высоты/обрамления.
4. `gap_four_five_schemes`: схемы **A** и **B** для 4–5 этажей (S. 23) даны описательно без долей высот каждого этажа.
5. `gap_multi_vs_three_boundary`: формальная граница между «многоэтажный» (S. 16) и «3-этажный» / «4–5-этажный» (S. 22–23) в тексте не формализована.
6. `gap_one_story_socle`: специальные нормы цоколя для 1-этажного дома в тексте не приведены (применяются общие `1/10 … 1/6`).

### 8.3. 6 явных пробелов по межэтажным лентам (`BELT_TEXT_GAPS`)
1. `belt_gap_ausladung`: числовой **вынос (`Ausladung`)** межэтажной ленты в книге не указан (на S. 16 сказано лишь «умеренный», `mäßige Ausladung`; правила `45°` и `5/6` приведены только для сандриков/венчающих карнизов).
2. `belt_gap_floor_ref`: база отсчёта `h_нижн.эт` («высота этажа» от пола до пола vs проём/в свету) на S. 16 не уточнена — принята высота этажа от пола до пола (`экстраполяция`).
3. `belt_gap_fuss_rumpf_deck`: трёхчастность `Fuß : Rumpf : Deckglied` дана в источнике только для цоколя (S. 10), но не для поясных лент.
4. `belt_gap_modest_lower`: числовой порог «скромного» 1-го этажа для допустимого `H_ленты < h/12` (S. 16) отсутствует.
5. `belt_gap_colonnade_ratio`: пропорциональная связь ленты с колоннадой/пилястрами нижнего этажа на S. 16 дана только качественно («разработать в согласии, не превосходя главный карниз»).
6. `belt_gap_sill_plate_height`: высота подоконной плиты, превращённой в сплошной карниз (`Sohlbankgesimse`, S. 17), задана лишь качественно («больше ширины наличника», без числа).

### 8.4. Важные технические детали реализации для проверки логики ИИ-аудитором
1. **Две независимые высоты здания в UI vs SVG:**
   - В расчётах (`checkSocleHeight`, `checkMainCorniceWithVariant`, `checkFacadeRectangle`, `fullFloorAsSocle`) используется ручной параметр `params.totalHeight` (`H_total`).
   - В отрисовке `FacadeSvg` визуальная высота этажей берётся из `H` (плюс зазор под окно и сандрик: `max(H, h + T + 0.52)`), а для `≥3` этажей 2-й этаж чуть увеличен (`×1.04`) и верхний уменьшен (`×0.84`), поэтому суммарная визуальная высота SVG не всегда тождественна `params.totalHeight`.
2. **Дублирование проверки поясного карниза в сводке (`Summary`):**
   - `gurt_cornice` использует `checkGurtWithVariant` (где при `< h/12` возвращается `approx`, а при `one-story` — `ok`).
   - `belt_crowning_and_special` объединяет `beltHeight` (где `< h/12` строго даёт `violation`), `beltCrowningSplit`, `beltWithColumns` и `checkBeltSpecialCases`. При `beltIsAbsent = true` `beltHeightCheck` в сводке ставится в `notRequired: true, ok`, а допустимость отсутствия ленты оценивает `checkBeltSpecialCases`.
3. **База проёма в `check_window` и `A_from_H`:**
   - В `FacadeParameters` параметр `H` используется одновременно как `H_max` комнаты для расчёта шага осей (`A = H * n/m`, S. 5–6), как высота 1-го этажа при `useFullFloorAsSocle`, и как `hLowerFloor` (высота нижнего этажа) в модуле ленты. Стоит сверить с источником, насколько допустимо отождествлять высоту комнаты в свету и этажную отметку (см. пробел `belt_gap_floor_ref`).
4. **Несимметричное поведение `rich_columnar` и `monumental` с пресетами этажности:**
   - Типологии (`BuildingTypeId`) управляют `ratio_from_AH`, `p_from_Aw`, `pc_from_Awu`, `check_corner`.
   - Этажность (`BuildingVariant` + `MultiSub`) управляет `checkVariantAxisRatio`, `checkFacadeRectangle`, `checkAxesCount`, `checkMainCorniceWithVariant`, `checkGurtWithVariant`, `checkBeltSpecialCases`.
   - При выборе типологии `rich_columnar` (где `A:H → 1:2 = 0.50`) проверка `ratio_from_AH` будет `ok`, но параллельная проверка `variant_axis_ratio` (`checkVariantAxisRatio`) проверяет `[2/3, 7/8]` (`0.667..0.875`) и может выдать `violation` для `A:H = 1:2`, так как `checkVariantAxisRatio` не делает исключения для `rich_columnar` / `palace`! *(Потенциальное расхождение в коде, которое стоит отметить при аудите!)*

---

## 9. Возможности интерфейса и графической визуализации

1. **Три подстраницы раздела «Калькулятор»:**
   - *Фасад и калькуляторы* (2-колоночный макет: панель параметров + живой SVG-чертёж и аналитические пластины).
   - *Правила и нормы* (фильтрация по 5 типам правил, ссылки на страницы книги, кнопка «Показать на фасаде»).
   - *Тесты (11 кейсов)* (живое вычисление 11 примеров из текста S. 4–12 с допуском `1e-3` и кнопкой загрузки параметров каждого кейса на фасад).
2. **10 модулей калькулятора и обратные решатели:**
   - *Оси и простенки:* 5 режимов (`Найти A из H`, `Найти H из A`, `Макс. w из A`, `Найти A из p и w`, `Проверить`).
   - *Этажность:* 5 пресетов, число осей `2–10`, встроенный/отдельно стоящий дом, режим главного карниза (`полный антаблемент` / `только Kranz`), схемы A/B для 4–5 этажей, схемы тяг 3-этажного дома.
   - *Окно:* 3 режима (`Найти h по w`, `Найти w по h`, `Проверить`), пресеты приближений `φ` и `n:m`, настраиваемый допуск диагонали `1–10 %`.
   - *Угол (D):* пресеты `k_D` (`2/3`, `3/4`, `4/5`, `5/6`) или режим комнаты на всю ширину ризалита.
   - *Обрамление:* 4 режима ввода (`по T`, `по R`, `по F`, `по K`), 6 отношений `R:F:K`, консоли с отступами `a_front / a_side`.
   - *Пилястр:* массивный/лёгкий характер, флаг `Mauerpfeiler`.
   - *Карниз:* `T_c`, отношение `h_u : h_l`, UX-пресет доли плиты.
   - *Цоколь:* этажи `1–5`, `H_total`, пресеты `1/6` и `1/8`, включение 1-го этажа в цоколь, 3-частные доли, доминирование плиты, шаг и нечётность рядов рустики, убывание рустики/профилировки к 1-му этажу, раскреповки (`Kellerfenster` / `Lisenen`).
   - *Лента (пояс):* нижний/верхний этаж, кнопка «Установить середину диапазона», режим `binding / crowning`, 4 класса профиля, `h_верх : h_низ`, эффекты `neutral / heavy / light`, консоли, спецслучаи (колоннада, рустовка + `Fußprofil`, отсутствие ленты, подоконная лента, запрещённый случай «только подоконник под 2-м этажом», совпадение с `Rücklagen`, схемы 1–3 для 3-этажного дома).
   - *Сводка:* табличный отчёт по всем проверкам с кликабельной подсветкой элемента на чертеже.
3. **Интерактивный `FacadeSvg`:** клик по элементу (`axenweite`, `pier`, `framing_pier`, `corner`, `window`, `entablature`, `pilaster`, `cornice`, `socle`, `belt`) переключает активный модуль и аналитическую пластину; отображает этажность `1..5`, оси `2..10`, колоннаду/пилястры, сандрики, рустовку цоколя, 3-частную разметку и поясную ленту с цветовой индикацией статусов.
4. **6 аналитических SVG-пластин (`AnalyticalPlates`):**
   - `Веер A : H` (лучи стандартных и предельных отношений с текущей рабочей точкой);
   - `Циркуль φ` (геометрическое построение золотого сечения по ширине или высоте — Fig. 2 / Fig. 4);
   - `Диагональ d/2` (прямоугольник окна и проверка `w ≤ d/2`);
   - `Профиль карниза` (сечение сандрика `R:F:K`, угол `45°` / консоли `5/6`, отступы `a_front = a_side`, деление `h_u : h_l`);
   - `Иерархия и цоколь` (пропорциональная шкала `h_gurt < h_main < h_socle` от `H_total`, 3-частный разрез цоколя и ряды рустики);
   - `Разрез ленты (Gurt)` (сечение всех 4 классов, зоны `h_верх` и `h_низ`, контуры `heavy/light/neutral`, консоли, рустовка + `Fußprofil`).
5. **Верификация автотестами:** `src/calc/rules.test.ts` содержит **29 unit-тестов** (11 обязательных кейсов по книге, 5 тестов обратных функций и типологии, 5 тестов цоколя/иерархии, 4 теста этажности/пробелов, 4 теста межэтажных лент).

---

## 10. Рекомендуемый порядок сверки с оригиналом (для ИИ-анализа)

При передаче этого файла и текста оригинала (`brausewetter_1895_ru.txt` или немецких страниц S. 1–23) в ИИ удобно задать следующие пункты проверки:
1. **Полнота и точность формул (Раздел 5 vs `brausewetter_1895_ru.txt`):** нет ли перепутанных дробей (`1/6..1/10`, `1/12..1/8`, `1/15..1/12`, `1/16..1/15`, `1/20..1/16`, `2:3..8:9`, `1:2..2:1`), условий неравенств (`<` vs `≤`) или перепутанных типологий.
2. **Конфликты между подмодулями (Раздел 8.4):** в частности, расхождение между `typologies` (`rich_columnar` `1:2`, `palace` `1:1`) и `VARIANT_PRESETS` (`axisRatio`), а также одновременное использование `H` как высоты комнаты и высоты этажа.
3. **Неучтённые правила оригинала (S. 1–23):** какие правила или исключения из текста Браузеветтера ещё не формализованы (например, детали с S. 13, 18–20, ризалиты, балконы, эркеры, фронтоны, кровля, углублённые ниши или группировка окон на разных этажах).
4. **Статус допущений (Раздел 8.1–8.3):** корректно ли отделены авторские числовые нормы 1895 г. от добавленных UX-порогов.
