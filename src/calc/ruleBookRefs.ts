export interface RuleBookExcerpt {
  id: string;
  pageNumber: number;
  ruleTitle: string;
  ruleSummaryHighlight: string;
  bookQuoteRu: string;
  bookQuoteDe: string;
}

/**
 * Точные привязки правил и проверок калькулятора к тексту Brausewetter (1895),
 * с дословными цитатами из корпуса страниц S. 1–23 для подсветки в поповере
 * и в «Читальном зале».
 */
export const RULE_BOOK_EXCERPTS: Record<string, RuleBookExcerpt> = {
  axen_ratio: {
    id: 'axen_ratio',
    pageNumber: 5,
    ruleTitle: 'Отношение шага осей к высоте комнаты (A : H_max)',
    ruleSummaryHighlight:
      'Для жилого дома A:H = 2:3…8:9; крайний предел дворцовой архитектуры 1:1; исходной величиной принимается наибольшая высота комнаты H_max.',
    bookQuoteRu:
      'отправной точкой расчёта должна служить наибольшая высота комнаты. Крайним пределом всегда остаётся отношение 1 : 1.',
    bookQuoteDe:
      'so hat die grösste Zimmerhöhe den Ausgangspunkt der Berechnung zu bilden. Als äusserste Grenze gilt stets das Verhältnis 1 : 1.',
  },
  variant_axis_ratio: {
    id: 'variant_axis_ratio',
    pageNumber: 5,
    ruleTitle: 'Допустимый диапазон A / H_max по типологии и этажности',
    ruleSummaryHighlight:
      'В простом и городском доме A:H лежит в пределах 2:3…7:8 (до 1:1 в вилле/дворце), а в богатой колонной архитектуре — около 1:2.',
    bookQuoteRu:
      'Эти отношения — 2 : 3, 3 : 4, 4 : 5 — в простом жилом доме чаще всего определяют значения шага осей и высоты комнаты.',
    bookQuoteDe:
      'Diese Verhältnisse 2 : 3, 3 : 4, 4 : 5 bezeichnen beim einfachen Wohnhause meist die Werte von Axenweite und Zimmerhöhe.',
  },
  facade_rectangle: {
    id: 'facade_rectangle',
    pageNumber: 14,
    ruleTitle: 'Пропорция прямоугольника фасада (лежачий / стоячий)',
    ruleSummaryHighlight:
      'Одинаковых главных размеров длины и высоты (квадрата) следует избегать; малоэтажному дому свойственен лежачий прямоугольник, многоэтажному встроенному — стоячий.',
    bookQuoteRu:
      'одинаковых главных размеров длины и высоты следует избегать.',
    bookQuoteDe: 'gleiche Hauptmaße von Länge und Höhe sind zu vermeiden.',
  },
  axes_count: {
    id: 'axes_count',
    pageNumber: 14,
    ruleTitle: 'Число оконных осей и положение главного входа',
    ruleSummaryHighlight:
      'При центральном входе симметрия предписывает нечётное число осей (идеал — 5); при боковом входе во встроенном доме допустимы и чётные, и нечётные оси.',
    bookQuoteRu:
      'Симметрия требует размещения входной двери по центру здания — тем самым предписывается нечётное число осей',
    bookQuoteDe:
      'Die Symmetrie verlangt die Hausthüre im Mittel des Gebäudes; — damit ist eine ungerade Anzahl der Axen vorgeschrieben',
  },
  pier_width: {
    id: 'pier_width',
    pageNumber: 5,
    ruleTitle: 'Правило красоты простенка (p ≥ w / p_c ≥ w_v)',
    ruleSummaryHighlight:
      'Стена между двумя окнами за вычетом обрамлений должна быть не меньше ширины окна (с обрамлением p_c ≥ w_v), кроме богатой колонной архитектуры.',
    bookQuoteRu:
      'поверхность стены между двумя окнами за вычетом их наличников (обрамлений) должна быть равна ширине одного окна вместе с его обрамлением или превосходить её.',
    bookQuoteDe:
      'die Wandfläche zwischen zwei Fenstern, deren Umrahmung abgerechnet, soll gleich der Breite eines Fensters mit dessen Umrahmung oder grösser als diese sein.',
  },
  corner_pier: {
    id: 'corner_pier',
    pageNumber: 5,
    ruleTitle: 'Расстояние от угла дома до первой оси (D и p_corner)',
    ruleSummaryHighlight:
      'Расстояние от угла до первой оси составляет 2/3…5/6 от шага осей A (по умолчанию 4/5 · A).',
    bookQuoteRu:
      'это расстояние составляет от 2/3 до 4/5 и 5/6 шага осей.',
    bookQuoteDe:
      'beträgt dieser Abstand 2/3 bis 4/5 bis 5/6 der Axenweite.',
  },
  window_range: {
    id: 'window_range',
    pageNumber: 6,
    ruleTitle: 'Пропорции окна (1.5w ≤ h ≤ 2w)',
    ruleSummaryHighlight:
      'Для красивой пропорции высота окна в свету не должна превышать удвоенную ширину и не должна быть меньше полуторной ширины.',
    bookQuoteRu:
      'его высота не должна превышать удвоенную ширину и не должна быть меньше полуторной ширины.',
    bookQuoteDe:
      'so wird seine Höhe nicht mehr als das Doppelte und nicht weniger als das 1½fache der Breite betragen dürfen.',
  },
  window_diag: {
    id: 'window_diag',
    pageNumber: 7,
    ruleTitle: 'Правило половины диагонали окна (w ≤ d / 2)',
    ruleSummaryHighlight:
      'Ширина окна не должна превышать половину диагонали прямоугольного проёма (практические приближения золотого сечения 3:5, 5:8 и др.).',
    bookQuoteRu:
      'ширина окна не должна превышать половину диагонали прямоугольного поля проёма.',
    bookQuoteDe:
      'die Breite eines Fensters soll nicht mehr betragen als die Hälfte der Diagonale in dem rechteckigen Felde der Oeffnung.',
  },
  n1_framing_width: {
    id: 'n1_framing_width',
    pageNumber: 17,
    ruleTitle: 'N1: Ширина наличника окна (u ∈ [w/6, w/5])',
    ruleSummaryHighlight:
      'Обрамление (наличник) окна назначается шириной от 1/6 до 1/5 его ширины в свету w.',
    bookQuoteRu:
      'Обрамление (наличник) окна назначается шириной от ⅙ до ⅕ его ширины в свету.',
    bookQuoteDe:
      'Die Umrahmung eines Fensters wird mit ⅙ bis ⅕ der lichten Breite bemessen.',
  },
  n2_sill_plate: {
    id: 'n2_sill_plate',
    pageNumber: 17,
    ruleTitle: 'N2: Высота подоконной плиты (h_sill ∈ [w/8, w/7])',
    ruleSummaryHighlight:
      'Высота подоконной плиты обычно принимается меньше наличника — от 1/8 до 1/7 ширины окна в свету, но может получать меру наличника вплоть до 1/5 (w/7 < h_sill ≤ w/5 — approx).',
    bookQuoteRu:
      'обычно принимается меньше, а именно от 1/7 до 1/8 ширины окна в свету.',
    bookQuoteDe:
      'wird aber meist geringer und zwar zu 1/7 bis 1/8 der lichten Fensterbreite angenommen.',
  },
  n3_sill_cornice_over_u: {
    id: 'n3_sill_cornice_over_u',
    pageNumber: 17,
    ruleTitle: 'N3: Сплошной подоконный пояс превышает ширину наличника (> u)',
    ruleSummaryHighlight:
      'Если подоконник превращается в сплошной подоконный карниз, его высота обычно превышает ширину наличника.',
    bookQuoteRu:
      'Если подоконник превращается в сплошной подоконный карниз, то его высота согласуется с лежащей под ним частью стены и обычно превышает ширину наличника.',
    bookQuoteDe:
      'Wird die Sohlbank zum durchlaufenden Sohlbankgesimse, so ist ihre Höhe nach dem darunter liegenden Teile abzustimmen und wird die Rahmenbreite meist übersteigen.',
  },
  framing_rfk: {
    id: 'framing_rfk',
    pageNumber: 8,
    ruleTitle: 'Сандрик окна (R : F : K) и правило выноса 45°',
    ruleSummaryHighlight:
      'Обычные отношения Наличник:Фриз:Карниз — 1:1:1, 6:7:8, 4:5:6, 3:4:4, 2:3:3; фриз обычно не выше карниза (3:5:4 требует большего выноса).',
    bookQuoteRu:
      'фриз неохотно делают выше венчающего карниза. Тем не менее и при отношении 3 : 5 : 4 можно достичь весьма хорошего эффекта, если придать карнизу больший вынос.',
    bookQuoteDe:
      'Im allgemeinen wird der Fries nicht gern höher angenommen als der Kranz. Trotzdem kann mit dem Verhältnisse von 3 : 5 : 4 auch eine sehr gute Wirkung erzielt werden',
  },
  console_offset: {
    id: 'console_offset',
    pageNumber: 8,
    ruleTitle: 'Отступ консоли до слезника (a_front = a_side)',
    ruleSummaryHighlight:
      'Расстояние a от верхней полочки консоли до слезника слёзной плиты должно всегда оставаться одинаковым как вперёд, так и в стороны.',
    bookQuoteRu:
      'Расстояние a от верхней полочки (венчающего члена) консоли до слезника слёзной плиты должно всегда оставаться одинаковым как вперёд, так и в стороны',
    bookQuoteDe:
      'Der Abstand a des Deckgliedes der Konsole von der Wassernase der Hängeplatte soll nach vorn und nach den Seiten stets der gleiche bleiben',
  },
  pilaster_check: {
    id: 'pilaster_check',
    pageNumber: 12,
    ruleTitle: 'Выступ пилястра (v ≤ W_p / 4; лёгкий 1/6…1/5)',
    ruleSummaryHighlight:
      'Максимум выступа пилястра составляет 1/4 его ширины; величины 1/6…1/5 применяются для лёгкого, изящного выражения.',
    bookQuoteRu:
      'Максимум выступа составляет ¼ ширины пилястра; величины от ⅕ до ⅙ применяются там, где требуется лёгкое, изящное выражение',
    bookQuoteDe:
      'Der Vorsprung des Pilasters ist an gewisse Grenzen gebunden, die nicht überschritten werden sollen. Das Maximum des Vorsprungs ist ¼ der Pilasterbreite; die Maße von ⅕—⅙ finden da Anwendung',
  },
  cornice_split: {
    id: 'cornice_split',
    pageNumber: 11,
    ruleTitle: 'Венчающая часть карниза (верх : низ от 1:1 до 1:2 / 2:1)',
    ruleSummaryHighlight:
      'Верхним и нижним обломам придают равные высоты (1:1) с допустимыми отклонениями от 1:2 до 2:1.',
    bookQuoteRu:
      'верхним и нижним обломам следует придавать равные высотные размеры, причём допустимы небольшие отклонения от этого соотношения (1 : 1).',
    bookQuoteDe:
      'Nach dieser Regel sind den Ober- und Untergliedern die gleichen Höhenmaße zu geben, wobei kleine Aenderungen dieses Verhältnisses (1 : 1) zulässig sind.',
  },
  socle_height: {
    id: 'socle_height',
    pageNumber: 16,
    ruleTitle: 'Высота цоколя (1/10 … 1/6 общей высоты здания)',
    ruleSummaryHighlight:
      'Оптимальная высота цоколя — 1/6 общей высоты здания, практически применяется 1/7…1/10; делать цоколь меньше 1/10 — ошибка.',
    bookQuoteRu:
      'Наилучшим размером для цоколя — будь он цельным или трёхчастным — будет ⅙ общей высоты здания, однако чаще всего находят применение высоты от 1/7 до 1/10; делать его ещё меньше было бы ошибкой',
    bookQuoteDe:
      'Die beste Dimension für einen Sockel, sei derselbe einteilig oder dreiteilig gegliedert, wird ⅙ der Gesammthöhe sein, doch finden die Höhen von 1/7 bis 1/10 am häufigsten Anwendung; ihn noch kleiner zu bilden, würde ein Fehler sein',
  },
  main_cornice_subordination: {
    id: 'main_cornice_subordination',
    pageNumber: 16,
    ruleTitle: 'Главный карниз: 1/8–1/12 (2 эт.) или 1/12–1/15 (многоэт.) и меньше цоколя',
    ruleSummaryHighlight:
      'Главный карниз должен быть меньше цоколя: в 2-этажном доме 1/8–1/12, в многоэтажном 1/12–1/15 общей высоты (только венец: 1/15–1/16 или 1/16–1/20).',
    bookQuoteRu:
      'должен быть меньше цоколя: в жилом доме с двумя этажами 1/8–1/12, в жилом доме с несколькими этажами 1/12–1/15 общей высоты.',
    bookQuoteDe:
      'muss kleiner werden, als der Sockel; beim Wohnhause mit zwei Geschossen, ⅛ bis 1/12, beim Wohnhause mit mehreren Geschossen 1/12 bis 1/15 der Gesammthöhe.',
  },
  gurt_cornice: {
    id: 'gurt_cornice',
    pageNumber: 16,
    ruleTitle: 'Междуэтажный (поясной) карниз (1/6…1/12 этажа, < главного и < цоколя)',
    ruleSummaryHighlight:
      'Поясной карниз принимается от 1/12 до 1/6 высоты этажа и обязательно меньше главного карниза и цоколя; меньшие высоты (< 1/12) допустимы при скромном первом этаже (approx).',
    bookQuoteRu:
      'Для него можно принимать от 1/6 до 1/12 высоты этажа. При этом следует твёрдо держаться правила, что он должен выглядеть меньше главного карниза и меньше цоколя',
    bookQuoteDe:
      'Man kann dafür ⅙ bis 1/12 der Geschosshöhe annehmen. Doch ist als Regel festzuhalten, dass es kleiner als das Hauptgesimse, ferner kleiner als der Sockel erscheinen',
  },
  socle_plate_dominant: {
    id: 'socle_plate_dominant',
    pageNumber: 10,
    ruleTitle: 'Плита цоколя главная по высоте',
    ruleSummaryHighlight:
      'В цокольном карнизе плита благодаря большей высоте всегда должна оставаться главной частью.',
    bookQuoteRu:
      'плита благодаря большей высоте всегда должна оставаться главной частью',
    bookQuoteDe:
      'die Platte muss aber stets durch grössere Höhe zum Hauptteile werden',
  },
  socle_decreasing_upward: {
    id: 'socle_decreasing_upward',
    pageNumber: 10,
    ruleTitle: 'Убывание рустики и профилировки снизу вверх',
    ruleSummaryHighlight:
      'Грубые формы цоколя вверх не повторяются: рустика и профилировка 1-го этажа и верхних ярусов легче и ниже, чем в цоколе.',
    bookQuoteRu:
      'Рустика первого этажа требует, помимо более лёгкой профилировки, меньшей высоты рядов, чем в цоколе. То же правило убывания мощи снизу вверх следует соблюдать и в карнизах последующих этажей.',
    bookQuoteDe:
      'Die Rustiken im Erdgeschosse verlangen ausser der leichtern Profilierung eine geringere Höhe, als die im Sockel. Dieselbe Regel der Kraftabnahme nach oben ist auch in den Gesimsen der folgenden Geschosse zu beachten.',
  },
  socle_rustication_rows: {
    id: 'socle_rustication_rows',
    pageNumber: 17,
    ruleTitle: 'Рустика: 0.30–0.40 м и нечётное число рядов',
    ruleSummaryHighlight:
      'Высота ряда квадровой кладки около 30–40 см; нечётное число слоёв в тексте дано для кладки стен и переносится на цоколь как ориентир (UX-эвристика).',
    bookQuoteRu:
      'следует соблюдать принцип, что нечётное число слоёв кладки предпочтительнее чётного',
    bookQuoteDe:
      'Zu beachten ist ferner der Grundsatz, dass eine ungerade Anzahl der Schichten einer geraden vorzuziehen ist',
  },
  socle_abkroepfung: {
    id: 'socle_abkroepfung',
    pageNumber: 10,
    ruleTitle: 'Раскреповки цоколя (сплошной прогон предпочтительнее)',
    ruleSummaryHighlight:
      'Цоколь лучше сохраняет характер спокойной мощной массы, если тянется вдоль всего фасада без раскреповок.',
    bookQuoteRu:
      'цоколь гораздо лучше сохраняет характер спокойной, мощной массы, если тянется вдоль всего фасада без раскреповок.',
    bookQuoteDe:
      'Der Sockel erhält aber den Charakter einer ruhigen, kräftigen Masse weitaus besser, wenn er ohne Abkröpfung die ganze Front entlang läuft.',
  },
  belt_crowning_and_special: {
    id: 'belt_crowning_and_special',
    pageNumber: 16,
    ruleTitle: 'Межэтажная лента: рустовка с базой, опоры и подоконный пояс',
    ruleSummaryHighlight:
      'Лента меньше цоколя и главного карниза; при замене рустовкой нужен базовый профиль; «только подоконник под 2-м эт.» крайне редок и нарушает разбивку высот (S. 22).',
    bookQuoteRu:
      'достигается простой разрезкой швами (рустовкой), однако и она всегда должна опираться на базовый профиль, хотя бы в виде узкого пояска.',
    bookQuoteDe:
      'Der Zweck, die horizontale Bindung zu betonen, kann ebenso gut durch schlichte Fugenteilung erzielt werden, doch soll sie sich immer auf ein Fussprofil, wenn dieses auch nur bandartig ausgebildet ist, aufstützen.',
  },
  n27_five_story_scheme: {
    id: 'n27_five_story_scheme',
    pageNumber: 23,
    ruleTitle: 'N27–N28: 5-этажные схемы (богатый особняк: 1+2 объед. и усиленный вынос)',
    ruleSummaryHighlight:
      'При объединении 1+2 этажей в богатом 5-этажном доме 3–5 образуют ствол, а главный карниз скромной высоты получает мощный вынос.',
    bookQuoteRu:
      'Первый этаж объединяется со вторым в одно целое. Третий, четвёртый и пятый этажи принадлежат средней части, а венчание образует главный карниз скромной высоты, но с мощным выносом.',
    bookQuoteDe:
      'Das Erdgeschoss wird mit dem zweiten Geschoss zu einer Einheit ausgebildet. Das dritte, vierte und fünfte Geschoss gehören dem Aufbau, ein Hauptgesimse von bescheidener Höhe, aber kräftiger Ausladung bildet die Krönung.',
  },
  n4_window_rust_rows: {
    id: 'n4_window_rust_rows',
    pageNumber: 17,
    ruleTitle: 'N4: Кратность окна 7–8 рядам руста (30–40 см)',
    ruleSummaryHighlight:
      'При высоте ряда квадров 30–40 см на высоту окна приходится от 7 до 8 рядов.',
    bookQuoteRu:
      'Высота одного ряда квадровой кладки в простых постройках составляет не намного меньше 30 и не намного больше 40 см, вследствие чего на высоту окна будет приходиться от 7 до 8 рядов.',
    bookQuoteDe:
      'Die Höhe einer Quaderschicht beträgt nicht viel unter 30 und nicht viel über 40 cm bei einfachen Bauausführungen wonach 7 bis 8 Schichten auf die Fensterhöhe treffen werden.',
  },
  n5_corner_rust_rows: {
    id: 'n5_corner_rust_rows',
    pageNumber: 15,
    ruleTitle: 'N5: Нечётное число рядов угловой рустовки',
    ruleSummaryHighlight:
      'Угловую перевязку из коротких и длинных квадров лучше выполнять в нечётном числе рядов (начиная и заканчивая длинными).',
    bookQuoteRu:
      'Угловую перевязку из коротких и длинных квадров лучше всего выполнять в нечётном числе рядов, а именно так, чтобы начинать и заканчивать длинными квадрами.',
    bookQuoteDe:
      'Die Eckarmierung mit kurzen und langen Quadern geschieht am besten in ungerader Anzahl, und zwar so, dass mit langen Quadern begonnen und geschlossen wird.',
  },
  n6_corner_offset_m_n: {
    id: 'n6_corner_offset_m_n',
    pageNumber: 15,
    ruleTitle: 'N6: Отступ крайнего окна от угла M ≤ N (Fig. 7)',
    ruleSummaryHighlight:
      'При M = N или M < N угол уравновешен; при M > N сбоку возникает немотивированный широкий глухой массив стены.',
    bookQuoteRu:
      'Возможны три случая (Fig. 7): 1. M = N, 2. M меньше N, 3. M больше N',
    bookQuoteDe: 'Entweder wird (Fig. 7) 1. M = N, 2. M kleiner als N, 3. M grösser als N',
  },
  n8_wing_pier: {
    id: 'n8_wing_pier',
    pageNumber: 18,
    ruleTitle: 'N8: Промежуточный простенок крыла ≤ углового столба',
    ruleSummaryHighlight:
      'Промежуточный простенок в западающем крыле не должен делаться шире углового столба.',
    bookQuoteRu:
      'промежуточный простенок в западающем крыле не должен делаться шире углового столба.',
    bookQuoteDe:
      'Dass ein Zwischenpfeiler in der Rücklage nicht breiter gemacht werden darf, als der Eckpfeiler, ist selbstverständlich.',
  },
  n9_side_risalit: {
    id: 'n9_side_risalit',
    pageNumber: 20,
    ruleTitle: 'N9: Боковой ризалит ≤ 2/3 центрального ризалита',
    ruleSummaryHighlight:
      'Ширина боковых ризалитов не должна превышать 2/3 ширины центрального ризалита (допустимо уменьшение до 1/2…1/3).',
    bookQuoteRu:
      'Ширина боковых ризалитов не должна превышать ⅔ ширины центрального ризалита.',
    bookQuoteDe:
      'Die Breite der Seitenrisalite darf nicht mehr als ⅔ des Mittelrisalites betragen.',
  },
  n10_wing_vs_side: {
    id: 'n10_wing_vs_side',
    pageNumber: 18,
    ruleTitle: 'N10/N13: Пропорции крыльев и ризалитов',
    ruleSummaryHighlight:
      'При двух боковых ризалитах западающая средняя часть — главная (> ризалита); в 5-частной схеме крыло ≥ 2× бокового ризалита.',
    bookQuoteRu:
      'западающую часть, поскольку она образует центральное звено и должна восприниматься как главное, следует всегда принимать большей, чем отдельный ризалит',
    bookQuoteDe:
      'ist die Rücklage, da sie das Mittelstück bildet und als die Hauptsache erscheinen muss, stets grösser als ein Risalit zu nehmen',
  },
  n11_five_part: {
    id: 'n11_five_part',
    pageNumber: 19,
    ruleTitle: 'N11: 5-частная композиция (Fig. 9)',
    ruleSummaryHighlight:
      'Центральный ризалит > бокового; боковой < западающего крыла (крыло ≥ 2× бокового).',
    bookQuoteRu:
      '1. Центральный ризалит должен быть больше бокового ризалита. 2. Боковой ризалит должен быть меньше западающего крыла.',
    bookQuoteDe:
      '1. Der Mittelrisalit muss grösser sein, als ein Seitenrisalit. 2. Ein Seitenrisalit muss kleiner sein, als eine Rücklage.',
  },
  n12_seven_part: {
    id: 'n12_seven_part',
    pageNumber: 20,
    ruleTitle: 'N12: 7-частная композиция (Fig. 10)',
    ruleSummaryHighlight:
      'В 7-частном фасаде центральный блок выступает как замкнутая 3-частная группа (2 бок. ризалита + середина или центр. ризалит + 2 крыла).',
    bookQuoteRu:
      'центральный ризалит выступает как замкнутая внутри себя единица с трёхчастной группировкой',
    bookQuoteDe:
      'Der Mittelrisalit erscheint dabei als eine in sich geschlossene Einheit in dreiteiliger Gruppierung',
  },
  n14_n15_comp_axes: {
    id: 'n14_n15_comp_axes',
    pageNumber: 19,
    ruleTitle: 'N14–N15: Нечётное число осей в центральном ризалите',
    ruleSummaryHighlight:
      'В центральном ризалите число окон всегда должно быть нечётным; в крыле предпочтительно нечётное, допустимо чётное.',
    bookQuoteRu: 'В центральном ризалите число окон всегда должно быть нечётным.',
    bookQuoteDe: 'Im Mittelrisalite muss die Fensteranzahl stets eine ungerade sein.',
  },
  n16_pilaster_pairs: {
    id: 'n16_pilaster_pairs',
    pageNumber: 18,
    ruleTitle: 'N16: Запрет пилястра между двумя парами окон в ризалите',
    ruleSummaryHighlight:
      'Постановка одинокого пилястра на оси симметрии между двумя парами окон — «явный промах, от которого нельзя не предостеречь».',
    bookQuoteRu:
      'порой прибегают к постановке пилястра между двумя парами окон. Однако это явный промах, от которого нельзя не предостеречь со всей решительностью.',
    bookQuoteDe:
      'hilft man sich wohl durch Anordnung eines Pilasters zwischen den beiden Fensterpaaren. Das ist aber ein entschiedener Missgriff, vor dem nicht genug gewarnt werden kann.',
  },
  n17_middle_axes: {
    id: 'n17_middle_axes',
    pageNumber: 18,
    ruleTitle: 'N17: Оси в западающей середине между двумя ризалитами',
    ruleSummaryHighlight:
      'Расположение всего двух окон в западающей середине следует полностью отвергнуть (4 — сносно, 6 — приемлемо, нечётное — лучше).',
    bookQuoteRu:
      'Расположение всего двух окон следует полностью отвергнуть; четыре окна дают уже сносную картину',
    bookQuoteDe:
      'Die Anordnung von nur zwei Fenstern ist ganz zu verwerfen; vier Fenster geben schon ein erträgliches Bild',
  },
  n18_pilaster_repetition: {
    id: 'n18_pilaster_repetition',
    pageNumber: 13,
    ruleTitle: 'N18: Повторение пилястр в смежных этажах одинаковой высоты',
    ruleSummaryHighlight:
      'Одинаковая система пилястр в двух смежных этажах без заметной разницы в высотах и формах утомительна.',
    bookQuoteRu:
      'Утомительное впечатление производит система опор, если она равномерно повторяется в двух смежных этажах без существенных различий в высотах',
    bookQuoteDe:
      'Ermüdend wirkt ein Stützensystem, wenn es gleichmäßig in zwei aufeinander folgenden Geschossen ohne wesentliche Unterschiede in den Höhen wiederkehrt',
  },
  n19_pilaster_only_upper: {
    id: 'n19_pilaster_only_upper',
    pageNumber: 13,
    ruleTitle: 'N19: Пилястры только в одном верхнем этаже',
    ruleSummaryHighlight:
      'Устройство ряда пилястр только в верхнем этаже без опор в нижележащих ярусах неудачно.',
    bookQuoteRu:
      'устройство ряда пилястр в одном лишь верхнем этаже, без опор в нижележащих этажах, не является удачным средством',
    bookQuoteDe:
      'Auch die Anordnung einer Pilasterreihe im obersten Geschosse allein, ohne Stützen in den darunterliegenden Geschossen, ist kein glückliches Mittel',
  },
  n20_pilaster_vs_wall: {
    id: 'n20_pilaster_vs_wall',
    pageNumber: 12,
    ruleTitle: 'N20 (Эксперт): Пилястр всегда у́же стенного пилона (W_p < W_стены)',
    ruleSummaryHighlight:
      'Пилястр всегда уже стенного пилона (лопатки), так как ордер регулирует его ширину и он действует декоративнее.',
    bookQuoteRu:
      'Пилястр всегда уже стенного пилона (лопатки), поскольку ордера регулируют его ширину сообразно заданной высоте',
    bookQuoteDe:
      'Der Pilaster ist immer weniger breit, als der Mauerpfeiler, da die Säulenordnungen seine Breite nach der gegebenen Höhe regeln',
  },
  n21_paired_pilasters_gap: {
    id: 'n21_paired_pilasters_gap',
    pageNumber: 13,
    ruleTitle: 'N21 (Эксперт): Просвет спаренных пилястр (< W_p, но без столкновения капителей)',
    ruleSummaryHighlight:
      'Промежуток между спаренными пилястрами обычно меньше ширины пилястра (< W_p, S. 13), но не слишком мал (нижний порог 0.2·W_p — UX-эвристика во избежание столкновения капителей).',
    bookQuoteRu:
      'промежуток между ними обычно делается меньше ширины пилястра, но он не должен быть и слишком малым, иначе капители столкнулись бы друг с другом.',
    bookQuoteDe:
      'dass der Zwischenraum meist kleiner genommen wird, als die Pilasterbreite, doch darf er auch nicht zu gering sein, da sonst die Kapitäle zusammenstossen würden.',
  },
  n22_column_profile: {
    id: 'n22_column_profile',
    pageNumber: 13,
    ruleTitle: 'N22 (Эксперт): Трёхчетвертная (⅔–¾) колонна предпочтительнее полуколонны',
    ruleSummaryHighlight:
      'Колонна с выступом 3/4 или 2/3 диаметра предпочтительнее полуколонны, остающейся вялой в светотени.',
    bookQuoteRu:
      'Колонна, выступающая из стены на ¾ или ⅔ своего диаметра, предпочтительнее полуколонны, так как последняя обладает слишком малым рельефом',
    bookQuoteDe:
      'Die um ¾ oder ⅔ des Durchmessers vorspringende Säule ist der Halbsäule vorzuziehen, da diese zu wenig Relief hat',
  },
  n23_attic: {
    id: 'n23_attic',
    pageNumber: 19,
    ruleTitle: 'N23: Иерархия аттика над ризалитом и крыльями',
    ruleSummaryHighlight:
      'Аттик только над ризалитом менее пригоден (approx, S. 19); проходя по всему зданию, над ризалитами он тяжелее, над крыльями легче.',
    bookQuoteRu:
      'менее пригодны для этого аттиковые венчания, если они появляются только над ризалитом. Если же аттик тянется по всему зданию, он должен быть решён более тяжело над ризалитами и более легко, изящно — над западающей частью.',
    bookQuoteDe:
      'weniger geeignet sind hierzu die Attikakrönungen, wenn sie beim Risalit allein auftreten. Läuft die Attika über den ganzen Bau hin, so muss sie schwerer bei den Risaliten, leichter, gefälliger bei der Rücklage gehalten sein.',
  },
  n24_n26_pediment: {
    id: 'n24_n26_pediment',
    pageNumber: 19,
    ruleTitle: 'N24/N26 (Эксперт): Фронтон (Giebel) на ризалите',
    ruleSummaryHighlight:
      'На S. 19 как пологий, так и крутой фронтон названы превосходным средством выделения ризалита (N26, S. 18); предпочтение пологого фронтона в классике — опциональное редакционное допущение.',
    bookQuoteRu:
      'Как пологий, так и крутой фронтон служат превосходным средством подчеркнуть самостоятельность выдвинутой вперёд массы',
    bookQuoteDe:
      'Der flache wie der steile Giebel sind vorzügliche Mittel, um die Selbständigkeit der vorgeschobenen Masse zu betonen',
  },
  n25_risalit_richness: {
    id: 'n25_risalit_richness',
    pageNumber: 19,
    ruleTitle: 'N25: Центральный ризалит богаче крыльев',
    ruleSummaryHighlight:
      'Центральный ризалит должен получать наиболее выразительные и богатые архитектурные формы относительно крыльев.',
    bookQuoteRu: 'Центральный ризалит должен получать наиболее выразительные архитектурные формы.',
    bookQuoteDe: 'Der Mittelrisalit muss die wirksamsten Bauformen erhalten.',
  },
};

export function getExcerptForCheckId(checkId: string, fallbackPageStr?: string): RuleBookExcerpt {
  if (RULE_BOOK_EXCERPTS[checkId]) {
    return RULE_BOOK_EXCERPTS[checkId];
  }
  const match = fallbackPageStr?.match(/\d+/);
  const pageNumber = match ? parseInt(match[0], 10) : 5;
  return {
    id: checkId,
    pageNumber,
    ruleTitle: `Правило Brausewetter (S. ${pageNumber})`,
    ruleSummaryHighlight: 'Проверьте соответствие пропорций указанной странице трактата.',
    bookQuoteRu: '',
    bookQuoteDe: '',
  };
}
