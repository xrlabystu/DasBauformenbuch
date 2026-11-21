export interface BookParagraph {
  index: number;
  subheadingDe?: string;
  subheadingRu?: string;
  subsubheadingDe?: string;
  subsubheadingRu?: string;
  de: string;
  ru: string;
  continuesOnNextPage?: boolean;
  continuesFromPrevPage?: boolean;
}

export interface ArchitecturalTerm {
  de: string;
  ru: string;
  context: string;
}

export interface BookFigure {
  label: string;
  captionDe: string;
  captionRu: string;
}

export interface BookPage {
  id: string;
  scanNr: number;
  pageNumber: string;
  sectionTitleDe: string;
  sectionTitleRu: string;
  imagePath: string;
  urn: string;
  institution: string;
  paragraphs: BookParagraph[];
  figures?: BookFigure[];
  terms: ArchitecturalTerm[];
  editorialNote?: string;
}

export interface BookMetadata {
  sourceSlug: string;
  author: string;
  title: string;
  volume: string;
  year: number;
  language: string;
  languageCode: string;
  holdingInstitution: string;
  sourceUrl: string;
}

export const BOOK_METADATA: BookMetadata = {
  sourceSlug: 'brausewetter_1895',
  author: 'Brausewetter',
  title: 'Das Bauformenbuch',
  volume: 'Bd. 1',
  year: 1895,
  language: 'Немецкий',
  languageCode: 'de',
  holdingInstitution: 'Deutsches Museum',
  sourceUrl: 'https://gateway-bayern.de/BV014442283',
};

export const BRAUSEWETTER_PAGES: BookPage[] = [
  {
    id: 'scan-0014',
    scanNr: 14,
    pageNumber: '1',
    sectionTitleDe: 'EINLEITUNG.',
    sectionTitleRu: 'ВВЕДЕНИЕ.',
    imagePath: '/assets/aistudio/15-014442283_0014_view_8668a7a4.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0014-3',
    institution: 'Deutsches Museum',
    editorialNote:
      'В оригинальной орфографии 1895 года сохранены формы «giebt», «dass» и лигатура «ß» (Maſse / Maße). Заключительное предложение страницы переносится на страницу 2 словом «Ein-bildungskraft». На левом обрезе скана видны остатки указателя таблиц предшествующего разворота.',
    paragraphs: [
      {
        index: 1,
        de: 'Die Baukunst hat mit ihren Schwesterkünsten, der Plastik und Malerei, ein gemeinsames Merkmal: ihre Schöpfungen wirken auf das menschliche Auge und durch ihr Anschauen wird ein Eindruck auf die Seele hervorgerufen, der je nach dem Maße des Kunstvermögens und der künstlerischen Absicht ein wohlgefälliger, schöner oder erhabener sein wird.',
        ru: 'Зодчество имеет со своими искусствами-сёстрами — пластикой и живописью — общий признак: их творения воздействуют на человеческий глаз, и через их созерцание в душе пробуждается впечатление, которое, сообразно мере художественного дарования и художественного замысла, будет приятным, прекрасным или возвышенным.',
      },
      {
        index: 2,
        de: 'Die Gebilde der Malerei erscheinen auf einer Fläche durch Zeichnung (Konturen) und Farbe dargestellt. Der Bildhauer dagegen giebt seinen Gestalten körperliche Form, sei es, dass sie frei im Raum stehen (Statuen) oder sich an eine Fläche lehnen (Relief).',
        ru: 'Образы живописи предстают изображёнными на плоскости посредством рисунка (контуров) и цвета. Скульптор же придаёт своим фигурам телесную форму — будь то свободно стоящие в пространстве (статуи) или примыкающие к плоскости (рельеф).',
      },
      {
        index: 3,
        de: 'Mit der Kunst des Bildhauers ist die Baukunst am nächsten verwandt. Sie ist nicht wie die Malerei eine Kunst des schönen Scheins, sondern eine greifbare, an den festen Stoff und das Gesetz der Schwere gebundene Kunst.',
        ru: 'С искусством скульптора зодчество состоит в ближайшем родстве. В отличие от живописи, оно не является искусством прекрасной видимости, но представляет собой искусство осязаемое, связанное с твёрдым материалом и законом тяжести.',
      },
      {
        index: 4,
        de: 'Ist die freie Phantasie, die schöpferische Kraft des Künstlers bei den Werken der Plastik schon wesentlich beschränkt durch die handwerkliche Bearbeitung, die das Material erfordert, so ist dies noch viel mehr der Fall bei der Baukunst. Das plastische Bildwerk dient nur idealen Zwecken; es verkörpert vornehmlich menschliche Gestalten in ihrer wirklichen oder gedachten Erscheinung. Im Dienste der Architektur wird es zum Schmuck und zur Zier. Indem es das nackte Gerüst des Baues verziert, wirkt es veredelnd auf den rohen Stoff und leiht ihm Leben und Ausdruck.',
        ru: 'Если свободная фантазия, творческая сила художника в произведениях пластики уже существенно ограничена ремесленной обработкой, которой требует материал, то в зодчестве это проявляется ещё в гораздо большей степени. Пластическое изваяние служит лишь идеальным целям; оно воплощает преимущественно человеческие образы в их действительном или воображаемом облике. На службе у архитектуры оно становится украшением и убранством. Украшая обнажённый остов постройки, оно облагораживает грубый материал и сообщает ему жизнь и выразительность.',
      },
      {
        index: 5,
        de: 'Die Baukunst hingegen hat, von wenigen Ausnahmsfällen abgesehen, wo sie lediglich dekorative Absichten erfüllt, in erster Linie praktische Aufgaben zu lösen. Sie schafft das Obdach, den gedeckten, von Wänden umschlossenen Raum, der dem Menschen zum dauernden Aufenthalt dient oder für Zwecke des öffentlichen Lebens, für religiöse, wissenschaftliche und andere geistige Bedürfnisse erforderlich ist (Tempel, Kirchen, Museen u. s. w.).',
        ru: 'Зодчество же, за немногими исключительными случаями, когда оно преследует исключительно декоративные цели, призвано в первую очередь решать практические задачи. Оно создаёт кров — крытое, замкнутое стенами пространство, служащее человеку для постоянного пребывания или необходимое для нужд общественной жизни, религиозных, научных и иных духовных потребностей (храмы, церкви, музеи и т. д.).',
      },
      {
        index: 6,
        de: 'Die Herstellung des Gebäudes, des rohen Baukörpers, erfordert nicht nur die geschickte Behandlung des Materials, sondern auch die Kenntnis der Gesetze, die die Haltbarkeit verbürgen. Die Behandlung des Materials auf Grund der wissenschaftlichen Gesetze nennen wir Technik. Erst wenn die Technik zu ihrem Rechte gelangt ist, tritt das künstlerische Moment hinzu. Das konstruktiv Notwendige wird durch die Formen, in die es eingekleidet ist, aus der Sphäre gemeiner Zweckdienlichkeit heraus zur klaren, von einem einheitlichen Gedanken beherrschten, anscheinend freien Kunstschöpfung erhoben.',
        ru: 'Возведение здания, его грубого строительного объёма, требует не только искусной обработки материала, но и знания законов, обеспечивающих прочность. Обработку материала на основе научных законов мы называем техникой. Лишь когда техника в полной мере вступает в свои права, присоединяется художественное начало. Конструктивно необходимое посредством форм, в которые оно облекается, возвышается из сферы обыденной утилитарности до ясного, подчинённого единой мысли и кажущегося свободным художественного творения.',
      },
      {
        index: 7,
        de: 'Es ist ohne weiteres klar, dass, je mehr Rücksicht auf bestimmte praktische Bedürfnisse bei einem Gebäude zu nehmen ist, um so beschränkter die Bewegung der freigestaltenden Phantasie sein wird. Je idealer die Aufgabe des Baukünstlers ist, desto höheren Schwung kann seine Ein-',
        ru: 'Само собой разумеется, что чем больше внимания при создании здания приходится уделять определённым практическим потребностям, тем ограниченнее будет движение свободно творящей фантазии. Чем идеальнее задача зодчего, тем более высокий полёт может обрести его воображение…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die Baukunst',
        ru: 'зодчество, архитектура',
        context: 'Определяется как осязаемое искусство, связанное с материалом и законом тяжести.',
      },
      {
        de: 'das Gesetz der Schwere',
        ru: 'закон тяжести',
        context: 'Базовое физическое условие архитектуры наряду с твёрдостью материала.',
      },
      {
        de: 'der Baukörper',
        ru: 'строительный объём / тело здания',
        context: 'Первичная материальная основа сооружения до художественного оформления.',
      },
      {
        de: 'die Technik',
        ru: 'техника (строительная)',
        context: 'Обработка материала на основании научных законов прочности.',
      },
      {
        de: 'das konstruktiv Notwendige',
        ru: 'конструктивно необходимое',
        context: 'Обязательная несущая структура, возвышаемая формой до уровня искусства.',
      },
    ],
  },
  {
    id: 'scan-0015',
    scanNr: 15,
    pageNumber: '2',
    sectionTitleDe: 'EINLEITUNG. · I. Das Wesen der äusseren Bauformen.',
    sectionTitleRu: 'ВВЕДЕНИЕ. · I. Сущность внешних архитектурных форм.',
    imagePath: '/assets/aistudio/15-014442283_0015_view_ab1d3d9d.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0015-9',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает перенесённое со стр. 1 слово «Ein-bildungskraft». В наборе 1895 г. сочетаются формы с «ss» (naturgemäss, grösserer, Abschluss, Zusammenstoss, hässlich, gleichmässige, Aeusseren, Grundriss) и «ß» (planmäßige). С середины страницы начинается глава I «Das Wesen der äusseren Bauformen.»; текст завершается полным предложением без переноса.',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'bildungskraft nehmen. In dem antiken Tempel, der nach griechischer Anschauung die Wohnung des in ihm verehrten Gottes war, in den christlichen Domen der romanischen und gotischen Stilform erkennen wir die denkbar höchste Vergeistigung der rohen Masse — des leblosen Steins. Von diesen idealsten aller Bauwerke hat die bürgerliche Baukunst im wesentlichen ihre Formensprache entlehnt.',
        ru: '…обрести его воображение. В античном храме, который по греческому представлению был жилищем почитаемого в нём бога, в христианских соборах романского и готического стилей мы узнаём мыслимо высшее одухотворение грубой массы — безжизненного камня. От этих наиболее идеальных из всех сооружений гражданское зодчество в существенной степени заимствовало свой язык форм.',
      },
      {
        index: 2,
        de: 'Das erste Erfordernis, das wir an die formale Ausbildung eines Bauwerkes stellen müssen, ist der deutliche Eindruck der Standfestigkeit seines Unterbaues. Somit hat der Sockel als die feste Grundlage zu erscheinen, auf dem der übrige Baukörper lastet und sicher ruht; das Wachstum oder Aufsteigen von unten nach oben vollzieht sich naturgemäss in grösserer Leichtigkeit mit der zunehmenden Höhe. Das Dach ist der getragene, lastende Abschluss des Mauerkörpers und steht im Gegensatz zu der stützenden Wand. Der Zusammenstoss der tragenden Kraft mit der getragenen Last (dem Gebälk) würde bei dessen scharfer Kennzeichnung aber hart ins Auge fallen und hässlich erscheinen. Unser Gefühl verlangt hier eine Vermittelung durch Zwischenglieder, die den Konflikt von Stütze und Last mildern, ohne ihn aufzuheben. Am vollendetsten kommt der Ausgleich dieses Konflikts bekanntlich in der dorischen und ionischen Säulenordnung durch die Kapitälform zum Ausdruck.',
        ru: 'Первое требование, которое мы должны предъявить к формальному решению постройки, — это ясное впечатление устойчивости её основания. Тем самым цоколь должен представать прочным фундаментом, на который опирается и на котором надёжно покоится остальной объём здания; рост или восхождение снизу вверх естественно совершается со всё большей лёгкостью по мере увеличения высоты. Крыша есть несомое, давящее завершение стенового массива и находится в противоположности к поддерживающей стене. Однако столкновение несущей силы с несомой тяжестью (антаблементом) при резком его выявлении бросалось бы в глаза жёсткостью и выглядело бы некрасиво. Наше чувство требует здесь посредничества промежуточных членов, которые смягчают конфликт опоры и тяжести, не упраздняя его. Наиболее совершенное разрешение этого конфликта, как известно, находит своё выражение в дорическом и ионическом ордерах через форму капители.',
      },
      {
        index: 3,
        de: 'Der Eindruck der Festigkeit wird in der horizontalen Richtung durch bandartige Zierformen verstärkt, in der vertikalen noch bedeutender durch stützende Elemente, wie Säulen, Halbsäulen und Pilaster.',
        ru: 'Впечатление прочности усиливается в горизонтальном направлении посредством ленточных декоративных форм, а в вертикальном — ещё значительнее благодаря поддерживающим элементам, таким как колонны, полуколонны и пилястры.',
      },
      {
        index: 4,
        de: 'Neben die Befriedigung, die dem Auge das Gefühl der Standfestigkeit gewährt, tritt dann das ästhetische Gefallen an einer übersichtlichen Gliederung der Masse, die der inneren Raumeinteilung des Hauses zu entsprechen hat und die im Aeusseren gekennzeichnet sein soll. Eine gleichmässige Masse oder eine Aneinanderreihung gleichartiger Formen, die sich immer in derselben Weise wiederholen, befriedigt unsere Empfindung ebensowenig, wie eine regellose, unter keinen einheitlichen Gesichtspunkt zu bringende Masse. Wir verlangen für unser Auge also eine geordnete Einteilung, bei der Mitte und Seitenteile sich deutlich als solche darstellen, in diesen Hauptteilungen wieder die zusammenhängende übersichtliche Gliederung ihrer Einzelformen (Symmetrie in den Hauptmassen, Harmonie in den einzelnen Teilen und in dem Verhältnis dieser Teile zum Ganzen). Die Verhältnisse der Teile in Einklang mit den Verhältnissen des Ganzen zu bringen, ist die Aufgabe, welche die Kunst zu lösen hat. Den Weg zur Lösung dieser Aufgabe zu zeigen (so weit es sich um das bürgerliche Wohnhaus handelt) soll in den Tafeln dieses Werkes versucht werden.',
        ru: 'Наряду с удовлетворением, которое доставляет глазу чувство устойчивости, возникает эстетическое удовольствие от ясного расчленения массы, которое должно соответствовать внутреннему распределению помещений дома и быть обозначенным во внешнем облике. Однородная масса или монотонное чередование одинаковых форм, постоянно повторяющихся одним и тем же образом, удовлетворяют наше чувство столь же мало, как и беспорядочная масса, не поддающаяся сведению к единой точке зрения. Следовательно, для нашего глаза мы требуем упорядоченного деления, при котором середина и боковые части отчётливо выступают как таковые, а внутри этих главных делений — связного, наглядного расчленения их отдельных форм (симметрии в главных массах, гармонии в отдельных частях и в отношении этих частей к целому). Привести пропорции частей в согласие с пропорциями целого — вот задача, которую призвано решить искусство. Попытаться указать путь к решению этой задачи (насколько речь идёт о городском жилом доме) — такова цель таблиц настоящего труда.',
      },
      {
        index: 5,
        subheadingDe: 'I. Das Wesen der äusseren Bauformen.',
        subheadingRu: 'I. Сущность внешних архитектурных форм.',
        de: 'Die Gliederung der Fassade eines Bauwerkes hat der Konstruktion des Innern, dem Grundriss, zu entsprechen und soll den Zweck des Gebäudes zum künstlerischen Ausdruck bringen. Die Hauptmasse ist in Teile aufgelöst, die nicht eine Trennung vom Ganzen bedeuten, vielmehr die planmäßige Organisation der verschiedenen den Bau zusammenhaltenden Kräfte je nach ihren Obliegenheiten anschaulich machen. Die Einheit und Zusammengehörigkeit ist überall zu betonen, die Aneinanderreihung des Gleichartigen wie die Hervorhebung oder Verstärkung der Kontraste bietet das Mittel, um das Minderwichtige zurücktreten, das Wesentliche bedeutender hervortreten zu lassen.',
        ru: 'Расчленение фасада сооружения должно соответствовать конструкции его внутренней структуры — плану — и художественно выражать назначение здания. Главная масса разделена на части, которые означают не отрыв от целого, а напротив, наглядно являют планомерную организацию различных удерживающих постройку сил сообразно их функциям. Повсюду следует подчёркивать единство и соподчинённость; как ритмический ряд однородного, так и выделение или усиление контрастов дают средство отвести второстепенное на задний план и сделать существенное более значительным.',
      },
      {
        index: 6,
        de: 'Wir unterscheiden horizontale und vertikale Gliederungen. In ihrer Gruppierung und in den Verhältnissen ihrer Werte zu den ruhigen Flächen der Vorderseite liegt der höhere oder geringere Reiz, den sie auf das Auge des Beschauers ausüben. Das Vorherrschen der horizontalen Glieder wird den Eindruck des fest und sicher Lagernden hervorrufen; sind dagegen die vertikalen Glieder überwiegend, so gewinnt man den Eindruck der Leichtigkeit und der nach oben strebenden Bewegung.',
        ru: 'Мы различаем горизонтальные и вертикальные членения. В их группировке и в соотношении их значимости со спокойными плоскостями главного фасада заключается большая или меньшая привлекательность, которую они оказывают на глаз зрителя. Преобладание горизонтальных членений вызывает впечатление прочно и надёжно покоящейся массы; если же господствуют вертикальные членения, возникает впечатление лёгкости и устремлённого вверх движения.',
      },
    ],
    terms: [
      {
        de: 'die Standfestigkeit',
        ru: 'устойчивость, прочность основания',
        context: 'Первое формальное требование к постройке, реализуемое через цоколь и тектонику.',
      },
      {
        de: 'Konflikt von Stütze und Last',
        ru: 'конфликт опоры и тяжести',
        context: 'Тектоническое напряжение между стеной/колонной и несомым перекрытием (антаблементом), смягчаемое капителью.',
      },
      {
        de: 'die Kapitälform',
        ru: 'форма капители',
        context: 'Промежуточный член, наиболее полно выражающий равновесие опоры и нагрузки в ордере.',
      },
      {
        de: 'das bürgerliche Wohnhaus',
        ru: 'городской жилой дом (бюргерский дом)',
        context: 'Основной практический предмет рассмотрения в таблицах первого тома.',
      },
      {
        de: 'horizontale und vertikale Gliederungen',
        ru: 'горизонтальные и вертикальные членения',
        context: 'Два базовых направления фасадного расчленения, задающие характер покоя или восходящего движения.',
      },
    ],
  },
  {
    id: 'scan-0016',
    scanNr: 16,
    pageNumber: '3',
    sectionTitleDe: 'I. Das Wesen der äusseren Bauformen. · 2. Die Schmuckformen und die konstruktive Gliederung der Fassade.',
    sectionTitleRu: 'I. Сущность внешних архитектурных форм. · 2. Декоративные формы и конструктивное членение фасада.',
    imagePath: '/assets/aistudio/15-014442283_0016_view_f2e273f0.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0016-5',
    institution: 'Deutsches Museum',
    editorialNote:
      'В абзаце 2 тезисное противопоставление длинного и высокого фасада выделено в оригинале разрядкой (Sperrdruck). Сохранена орфография 1895 г.: «Thür-», «Thatsächlich», «Oeffnungen», «Uebereinstimmung», «Axenweiten», «Miethaus», а также колебание «ß» / «ss» (Maße, Gesetzmäßigkeit при grösster, auszuschliessen). С 9-го абзаца начинается раздел «2.» (арабская цифра, в отличие от «I.» на стр. 2). Последнее предложение обрывается на «…von der» (под строкой стоит сигнатура листа «1*») и продолжается на стр. 4.',
    paragraphs: [
      {
        index: 1,
        de: 'Mit diesem Hinweise ist bereits der Weg vorgezeichnet, den man einzuschlagen hat, je nachdem bestimmte Bedingungen für die Länge und für die Höhe des Bauwerkes gegeben sind.',
        ru: 'Этим указанием уже намечен путь, которому следует следовать в зависимости от того, какие условия заданы для протяжённости и высоты постройки.',
      },
      {
        index: 2,
        de: 'Bei Häusern mit langer Strassenfront und geringer Höhe sind die horizontalen, bei Häusern mit kurzer Front und vielen Stockwerken sind die vertikalen Gliederungen die nächstliegenden.',
        ru: 'Для домов с длинным уличным фасадом и небольшой высотой наиболее естественны горизонтальные членения, для домов с коротким фасадом и большим числом этажей — вертикальные членения.',
      },
      {
        index: 3,
        de: 'Damit soll jedoch keinesfalls gesagt werden, dass in dem einen Falle der andere unbedingt auszuschliessen wäre. Eine zu starke Betonung der Höhengliederung kann ebenso unangenehm wirken wie eine zu scharfe Hervorhebung der Breitengliederung. Fehlerhaft dagegen wird es sein, wenn horizontale und vertikale Gliederungen beim selben Bauwerk in gleichem Maße zur Verwendung kommen, denn dann wirkt die Front unruhig und zerstückelt.',
        ru: 'Однако этим ни в коем случае не утверждается, будто в одном случае другое направление должно быть безусловно исключено. Чрезмерное подчёркивание высотного членения может производить столь же неприятное впечатление, как и слишком резкое выделение членения по ширине. Ошибочно же будет применять в одном и том же здании горизонтальные и вертикальные членения в равной мере, ибо тогда фасад выглядит беспокойным и раздробленным.',
      },
      {
        index: 4,
        de: 'Zu den horizontalen Gliedern zählen wir alle Gesimse, zu den vertikalen die Säulen, Pfeiler und Pilaster.',
        ru: 'К горизонтальным членам мы относим все карнизы, к вертикальным — колонны, столбы (устои) и пилястры.',
      },
      {
        index: 5,
        de: 'Zu den letzteren sind auch die Thür- und Fensteröffnungen, die stets mehr hoch als breit sind, zu rechnen, denn sie sind vertikale Unterbrechungen der Wand, und ihre Bedeutung (als vertikale Teile) ist um so wichtiger, je weniger Pilaster oder Säulen in diesem Sinne wirken.',
        ru: 'К последним следует причислить также дверные и оконные проёмы, которые всегда больше в высоту, чем в ширину, поскольку они представляют собой вертикальные разрывы стены, и их значение (как вертикальных элементов) тем важнее, чем меньше в этом направлении действуют пилястры или колонны.',
      },
      {
        index: 6,
        de: 'Thatsächlich bilden denn auch diese Oeffnungen mit ihren senkrechten Rahmenteilen oft die einzigen vertikalen Gliederungen einer Fassade und tragen durch ihre Formgestaltung beim einfachsten wie dem reichsten Bau wesentlich zum guten Eindruck des Ganzen bei.',
        ru: 'Действительно, именно эти проёмы со своими вертикальными обрамлениями нередко образуют единственные вертикальные членения фасада и благодаря своей формальной проработке как в простейшей, так и в богатейшей постройке существенно способствуют благоприятному впечатлению от целого.',
      },
      {
        index: 7,
        de: 'Wie weit der horizontalen vor der vertikalen Gliederung und umgekehrt der Vorzug zu geben sei, hängt in jedem einzelnen Falle von dem Wesen des betreffenden Bauwerkes, von seiner örtlichen Lage und Umgebung ab. Beim städtischen Wohnhause z. B. ist die Umgebung geradlinig, das Vorherrschen der horizontalen Richtung tritt überall zu Tage; wir verlangen die Uebereinstimmung der äusseren Schmuckform mit der inneren Nutzform und damit eine grössere Strenge der Linienführung. Anders beim Landhaus. In der freien Natur, in einer zwangslosen Umgebung liegend, verträgt es auch die ungezwungenste Behandlung der Bauformen und will mehr vom malerischen als vom konstruktiven Gesichtspunkt aus beurteilt werden. Das streng horizontale Gesimse wird hier nicht immer zur Erzielung des passenden Ausdruckes am Platze sein.',
        ru: 'В какой мере следует отдать предпочтение горизонтальному членению перед вертикальным или наоборот, зависит в каждом отдельном случае от характера данного сооружения, от его расположения на местности и окружения. Например, у городского жилого дома окружение прямолинейно, преобладание горизонтального направления выступает повсюду; мы требуем согласованности внешней декоративной формы с внутренней утилитарной формой и, следовательно, большей строгости линейного рисунка. Иначе обстоит дело с загородным домом (виллой). Расположенный на лоне природы, в непринуждённом окружении, он допускает и самую свободную трактовку архитектурных форм и требует оценки скорее с живописной, нежели с конструктивной точки зрения. Строго горизонтальный карниз здесь не всегда будет уместен для достижения надлежащей выразительности.',
      },
      {
        index: 8,
        de: 'Nehmen wir ein anderes Beispiel. Ein Gebäude mit grossen Innenräumen hat in der Regel grosse Axenweiten; die letzteren drängen von selbst dazu, die horizontale Richtung stärker zu betonen. Handelt es sich dagegen um ein Miethaus mit kleinen Wohnräumen, so ist man genötigt, die Axenweiten geringer anzunehmen; die Vertikalrichtung wird somit bereits in der rohen Masse des Baukörpers vorwiegen. Da die Schmuckformen nun diesem Körper angepasst sein sollen, ist es die natürliche Folge, dass auch die Architektur die Entwicklung nach der Höhe mehr im Auge behalten wird, als diejenige in die Breite.',
        ru: 'Возьмём другой пример. Здание с большими внутренними залами имеет, как правило, широкие межосевые шаги (пролёты); последние сами по себе побуждают сильнее подчёркивать горизонтальное направление. Если же речь идёт о доходном доме с небольшими жилыми комнатами, то приходится принимать меньшие межосевые расстояния; таким образом, вертикальное направление будет преобладать уже в грубой массе строительного объёма. Поскольку декоративные формы должны быть сообразны этому телу здания, естественным следствием становится то, что и архитектура будет в большей мере ориентироваться на развитие в высоту, чем в ширину.',
      },
      {
        index: 9,
        subheadingDe: '2. Die Schmuckformen und die konstruktive Gliederung der Fassade.',
        subheadingRu: '2. Декоративные формы и конструктивное членение фасада.',
        de: 'Die meisten Gliederungen sind nicht konstruktiv notwendige Dinge, sondern haben nur eine symbolische, den Organismus eines Bauwerkes veranschaulichende Bedeutung; sie sollen den Eindruck der Ordnung, Klarheit und Gesetzmäßigkeit des Baues erwecken. Wohl aber schreibt die Konstruktion vor, an welchen Stellen und in welcher Stärke diese Gliederungen aufzutreten haben. Zunächst sind es die Oeffnungen des rohen Mauerkörpers, deren Anordnung und Behandlung von grösster Wichtigkeit für den harmonischen Eindruck der Fassade ist. Sie gehören ganz der Konstruktion an, sprechen aber im Aeusseren ein gewichtiges Wort mit, da sie der Wand das Einteilungssystem geben und Felder von ausgeprägtem Wechsel bilden.',
        ru: 'Большинство членений не являются конструктивно необходимыми элементами, а имеют лишь символическое значение, наглядно раскрывающее организм постройки; они призваны пробуждать впечатление порядка, ясности и закономерности сооружения. Однако конструкция предписывает, в каких местах и с какой силой эти членения должны выступать. Прежде всего это проёмы грубого стенового массива, чьё размещение и обработка имеют величайшую важность для гармонического впечатления от фасада. Они всецело принадлежат конструкции, но во внешнем облике имеют веское слово, поскольку задают стене систему деления и образуют поля с выразительным чередованием.',
      },
      {
        index: 10,
        de: 'Wo sie Platz zu finden haben und wie sie auszustatten sind, hängt in erster Linie von der',
        ru: 'Где они должны находить себе место и как их следует оформлять, зависит в первую очередь от…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die Gesimse',
        ru: 'карнизы',
        context: 'Основные горизонтальные членения фасада, наряду с которыми вертикаль задают колонны, устои и пилястры.',
      },
      {
        de: 'Thür- und Fensteröffnungen',
        ru: 'дверные и оконные проёмы',
        context: 'Конструктивные вертикальные разрывы стены, образующие систему деления фасада и ритм простенков/полей.',
      },
      {
        de: 'Schmuckform und Nutzform',
        ru: 'декоративная форма и утилитарная (функциональная) форма',
        context: 'Соотношение внешней художественной оболочки и внутреннего практического назначения здания.',
      },
      {
        de: 'die Axenweiten',
        ru: 'межосевые расстояния (шаг осей / пролётов)',
        context: 'Широкие оси усиливают горизонталь (крупные залы), узкие — вертикаль (доходный дом).',
      },
      {
        de: 'das Miethaus',
        ru: 'доходный дом',
        context: 'Городской многоквартирный дом с малыми жилыми помещениями и преобладанием вертикального ритма.',
      },
    ],
  },
  {
    id: 'scan-0017',
    scanNr: 17,
    pageNumber: '4',
    sectionTitleDe: '2. Die Schmuckformen… · 3. Die Thür- und Fensteröffnungen. (a.)',
    sectionTitleRu: '2. Декоративные формы… · 3. Дверные и оконные проёмы (а).',
    imagePath: '/assets/aistudio/15-014442283_0017_view_37073344.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0017-1',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 3 («hängt in erster Linie von der / Konstruktion ab…»). Перед 5-м абзацем вводится новый крупный раздел «3. Die Thür- und Fensteröffnungen.» и его первый подраздел «a. Bestimmung der Axenweite, der Höhen- und Breitenverhältnisse.». В орфографии 1895 г. сохранены формы «wohlthuender», «giebt», «ergiebt», «darnach», «im allgemeinen», «Uebermaß», «Maße» при «Grössenverhältnis», «grösser», «allzugrossen», «Aenderungen». Страница завершается законченным предложением.',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'Konstruktion ab; die Höhenrichtung behauptet aber stets den Vorrang. Im Gegensatz zu diesen Unterbrechungen der Wandfläche nach der Tiefe zu stehen die Vorsprünge vor die Fläche in Form von Pfeilern, Lisenen, Pilastern, Säulen und Risaliten, — Gliederungen, die nicht notwendig mit der Konstruktion zusammenhängen und mehr durch den Schönheitssinn bedingt sind.',
        ru: '…от конструкции; однако высотное направление неизменно сохраняет первенство. В противоположность этим заглублениям в стеновую плоскость выступают вперёд перед плоскостью элементы в виде столбов, лопаток (лизен), пилястр, колонн и ризалитов — членения, не связанные с конструкцией по необходимости и обусловленные скорее чувством прекрасного.',
      },
      {
        index: 2,
        de: 'Auch die meisten horizontalen Glieder sind kein Erfordernis der Konstruktion, sondern Schmuckformen, die, ihr angepasst, dem rohen Baukörper Leben, Charakter und Schönheit verleihen sollen.',
        ru: 'И большинство горизонтальных членов не являются требованием конструкции, но представляют собой декоративные формы, которые, будучи к ней приспособлены, призваны придавать грубому телу постройки жизнь, характер и красоту.',
      },
      {
        index: 3,
        de: 'In demselben Maße, wie der Baukörper in seinem Grössenverhältnis wächst, nehmen auch die Verhältnisse seiner Glieder zu, ihr stärkeres oder schwächeres Hervortreten bestimmt wesentlich den Gesamtcharakter des Gebäudes.',
        ru: 'В той же мере, в какой строительный объём возрастает в своих масштабных соотношениях, увеличиваются и пропорции его членений; их более сильное или более слабое выступание существенно определяет общий характер здания.',
      },
      {
        index: 4,
        de: 'Der gute Eindruck einer Fassade ist zunächst bedingt durch die richtige Stellung der senkrechten Axen ihrer Oeffnungen; es ist einleuchtend, dass eine im Aeusseren wahrnehmbare Axe wohlthuender empfunden wird, wenn sie in der Konstruktion begründet ist, als eine, die uns zu dem Schluss nötigt, dass der entsprechende Raum im Inneren ein unbehaglicher sei. Das schmückende Beiwerk, die reichste Säulen- und Pilasterarchitektur ist nicht imstande, den störenden Eindruck einer fehlerhaften Axe zu beseitigen.',
        ru: 'Хорошее впечатление от фасада прежде всего обусловлено правильной расстановкой вертикальных осей его проёмов; очевидно, что ось, воспринимаемая во внешнем облике, производит более отрадное впечатление тогда, когда она обоснована конструктивно, нежели та, которая вынуждает нас заключить, что соответствующее внутреннее помещение неудобно. Декоративное убранство, самая богатая ордерная архитектура колонн и пилястр не в состоянии устранить мешающее впечатление от ошибочной оси.',
      },
      {
        index: 5,
        subheadingDe: '3. Die Thür- und Fensteröffnungen.',
        subheadingRu: '3. Дверные и оконные проёмы.',
        subsubheadingDe: 'a. Bestimmung der Axenweite, der Höhen- und Breitenverhältnisse.',
        subsubheadingRu: 'a. Определение шага осей, а также соотношений высоты и ширины.',
        de: 'Die Bestimmung der Axen erfolgt zwar zunächst nach der Grundrissdisposition, wird jedoch zu Gunsten der Fassade oft kleinen Aenderungen unterworfen, die, wenn sie keinen Nachteil für das Innere mit sich bringen, ohne Bedenken vorgenommen werden können, um dem Aeusseren harmonische Verhältnisse zu gewähren.',
        ru: 'Определение осей первоначально производится по композиции плана, однако в пользу фасада часто подвергается небольшим изменениям, которые, если они не влекут ущерба для интерьера, можно без колебаний вносить ради придания внешнему облику гармоничных пропорций.',
      },
      {
        index: 6,
        de: 'Wichtig ist insbesondere die Beziehung zwischen der Axenweite und dem Abstande der ersten Axe von der Hausecke eines freistehenden Wohnhauses.',
        ru: 'Особенно важно соотношение между шагом осей и расстоянием первой оси от угла отдельно стоящего жилого дома.',
      },
      {
        index: 7,
        de: 'Die Ecke verlangt Kraft — die Aeusserung dieser Kraft wird durch einen starken Mauerkörper kenntlich gemacht, die Anordnung eines allzugrossen, zu der Axenweite in keinem richtigen Verhältnis stehenden Eckpfeilers muss dagegen als Uebermaß unangenehm auffallen. Grosse Fensteröffnungen und Geschosshöhen bedingen Axenweiten, die in ihrer Verbindung mit einem kleinen Eckpfeiler nicht nur unser Schönheitsgefühl verletzen, sondern selbst die unbehagliche Empfindung der mangelnden Festigkeit erwecken.',
        ru: 'Угол требует силы — выражение этой силы делается наглядным посредством мощного стенового массива; напротив, устройство чрезмерно широкого углового простенка, не находящегося в верном соотношении с шагом осей, неизбежно режет глаз как излишество. Крупные оконные проёмы и значительные высоты этажей обусловливают такие межосевые расстояния, которые в сочетании с узким угловым простенком не только оскорбляют наше чувство прекрасного, но и вызывают неприятное ощущение недостаточной прочности.',
      },
      {
        index: 8,
        de: 'Der Grundriss giebt in den meisten Fällen den Ausschlag; eine gesunde und tüchtige Konstruktion macht den zu kleinen Eckpfeiler bei grossen Axenweiten schon für sich allein unmöglich, seine Grösse muss aber auch aus ästhetischen Gründen mit der Axenweite in Harmonie stehen. Beim freistehenden Wohnhause muss die Breite desselben immer mehr als die lichte Fensterbreite betragen.',
        ru: 'Решающее слово в большинстве случаев принадлежит плану; здравая и добротная конструкция уже сама по себе делает невозможным слишком узкий угловой простенок при больших шагах осей, но и по эстетическим соображениям его ширина должна находиться в гармонии с шагом осей. У отдельно стоящего жилого дома ширина углового простенка всегда должна превышать ширину окна в свету.',
      },
      {
        index: 9,
        de: 'Bei einem Monumentalbau sollen die Wandflächen im allgemeinen die Flächen der Oeffnungen weitaus an Grösse übertreffen. Daraus ergiebt sich dann die weitere Regel, dass der Eckpfeiler auch grösser als der Zwischenpfeiler zu bemessen ist. Das bürgerliche Wohnhaus verlangt aber oft den leichten Charakter im Aeusseren, und dieser wird nur dadurch erzielt, dass der Zwischenpfeiler die gleiche oder eine grössere Breite erhält, als der Eckpfeiler. Die angestrebte grössere oder geringere Monumentalität wird darnach ausschlaggebend sein; auch rein praktische Gründe (leichtere Unterbringung der Möbel etc.) können mitbestimmend auftreten.',
        ru: 'В монументальном здании плоскости стен вообще должны значительно превосходить по площади проёмы. Отсюда вытекает дальнейшее правило, что и угловой простенок следует назначать шире межоконного простенка. Однако городской жилой дом нередко требует лёгкого характера внешнего облика, а он достигается лишь тем, что межоконный простенок получает равную или большую ширину по сравнению с угловым. Следовательно, решающим будет стремление к большей или меньшей монументальности; наряду с этим соопределяющими могут выступать и чисто практические соображения (более удобная расстановка мебели и т. п.).',
      },
      {
        index: 10,
        de: 'Die Grösse des Eckpfeilers nimmt zu, sobald ein Zimmer der ganzen Breite des Risalites oder der Rücklage entspricht, da das Fenstermittel sich hier nach dem Mittel des Raumes zu richten hat; der Vergleich mit der Axenweite fällt daher weg.',
        ru: 'Ширина углового простенка возрастает, как только комната соответствует всей ширине ризалита или западающей части фасада, поскольку ось окна здесь должна ориентироваться на середину помещения; сравнение с шагом осей в этом случае отпадает.',
      },
    ],
    terms: [
      {
        de: 'Lisenen und Risalite',
        ru: 'лопатки (лизены) и ризалиты',
        context: 'Выступы перед плоскостью стены наряду со столбами, пилястрами и колоннами, обусловленные чувством формы.',
      },
      {
        de: 'der Eckpfeiler',
        ru: 'угловой простенок / угловой устой',
        context: 'Крайний участок стены от угла здания до первой оконной оси; в жилом доме должен быть шире окна в свету.',
      },
      {
        de: 'der Zwischenpfeiler',
        ru: 'межоконный простенок',
        context: 'Участок стены между соседними окнами; в монументальных зданиях уже углового, в жилых может быть равен ему или шире.',
      },
      {
        de: 'die lichte Fensterbreite',
        ru: 'ширина окна в свету',
        context: 'Чистый размер оконного проёма, служащий минимальным ориентиром для ширины углового простенка.',
      },
      {
        de: 'das Fenstermittel / die Rücklage',
        ru: 'ось (середина) окна / западающая часть фасада',
        context: 'В ризалите или западающей части фасада ось окна привязывается к центру комнаты, а не к общему шагу осей.',
      },
    ],
  },
  {
    id: 'scan-0018',
    scanNr: 18,
    pageNumber: '5',
    sectionTitleDe: '3. Die Thür- und Fensteröffnungen. · a. Bestimmung der Axenweite…',
    sectionTitleRu: '3. Дверные и оконные проёмы. · a. Определение шага осей…',
    imagePath: '/assets/aistudio/15-014442283_0018_view_13d727bc.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0018-7',
    institution: 'Deutsches Museum',
    editorialNote:
      'Страница содержит количественные пропорциональные правила и расчётные примеры соотношения шага осей (Axenweite) и высоты помещений (Zimmerhöhe): от 2:3, 3:4, 4:5 для простых жилых домов до 1:1 в дворцовой архитектуре и 1:2 при богатом ордерном членении. В оригинале в абзаце 6 соседствуют точка и запятая в десятичных дробях («3.20» и «3,20»), а в абзаце 8 приведена последовательность пропорций через знак равенства («5 : 6 = 6 : 7 = 7 : 8 = 8 : 9 etc.»). Последняя строка обрывается на слове «vornehmeren» (продолжение на стр. 6).',
    paragraphs: [
      {
        index: 1,
        de: 'Am klarsten ist wohl die Regel eines bestimmten Verhältnisses, das den Abstand der Hausecke von der ersten Axe mit der Axenweite in Beziehung bringt. Darnach beträgt dieser Abstand 2/3 bis 4/5 bis 5/6 der Axenweite.',
        ru: 'Наиболее ясным представляется правило определённого соотношения, связывающего расстояние от угла дома до первой оси с шагом осей. Согласно ему это расстояние составляет от 2/3 до 4/5 и 5/6 шага осей.',
      },
      {
        index: 2,
        de: 'Das Verhältnis zwischen Axenweite und Geschosshöhe lässt sich nur unvollkommen bestimmen, da die üblichen Deckenkonstruktionen in Deutschland und Oesterreich stark abweichen. Aus diesem Grunde ist in den folgenden Erklärungen der Vergleich zwischen Axenweite und Zimmerhöhe vorgezogen.',
        ru: 'Соотношение между шагом осей и высотой этажа поддаётся определению лишь неполно, поскольку принятые в Германии и Австрии конструкции перекрытий сильно различаются. По этой причине в последующих пояснениях предпочтено сравнение между шагом осей и высотой помещения в свету (высотой комнаты).',
      },
      {
        index: 3,
        de: 'Es wäre z. B. das geringste Maß für die Axenweite eines einfachen Wohnhauses mit 3.00 m Zimmerhöhe zu bestimmen. Die Pfeilerbreite wird mindestens gleich, meist aber grösser als die lichte Fensterbreite angenommen. Wird das Fenster 1.00 m breit, der Pfeiler 1.00 m oder das Fenster 0.90 m, der Pfeiler 1.10 m, so ergiebt sich eine Axenweite von 2.00 m und damit ist das Verhältnis: Axenweite : Zimmerhöhe = 2 : 3 ausgesprochen.',
        ru: 'Допустим, требуется определить наименьшую величину шага осей для простого жилого дома с высотой комнаты 3,00 м. Ширина простенка принимается не менее ширины окна в свету, а чаще больше неё. Если окно делается шириной 1,00 м, а простенок 1,00 м — или окно 0,90 м, а простенок 1,10 м, — то получается шаг осей 2,00 м, и тем самым выражается отношение: шаг осей : высота комнаты = 2 : 3.',
      },
      {
        index: 4,
        de: 'Eine Zimmerhöhe von 4.00 m verlangt breitere Fenster; nach dem vorerwähnten Verhältnisse würde man eine Axenweite von 2.65 m erhalten, die Fensterbreite wäre mit 1.15 m, die Pfeilerbreite mit 1.50 m zu bemessen.',
        ru: 'Высота комнаты 4,00 м требует более широких окон; по вышеупомянутому отношению получился бы шаг осей 2,65 м, причём ширину окна следовало бы назначить в 1,15 м, а ширину простенка — в 1,50 м.',
      },
      {
        index: 5,
        de: 'Nun ist aber noch eine leicht einzuprägende Schönheitsregel zu erwähnen: die Wandfläche zwischen zwei Fenstern, deren Umrahmung abgerechnet, soll gleich der Breite eines Fensters mit dessen Umrahmung oder grösser als diese sein.',
        ru: 'Однако следует упомянуть ещё одно легко запоминающееся правило красоты: поверхность стены между двумя окнами за вычетом их наличников (обрамлений) должна быть равна ширине одного окна вместе с его обрамлением или превосходить её.',
      },
      {
        index: 6,
        de: 'Die kleinste Umrahmung mit 0.20 m verbreitert die Wirkung des Fensters auf 1.55 m; wird die Fläche zwischen zwei Fenstern nun mit 1.65 bestimmt, so erzielt man eine Axenweite von 3.20. Hier verhält sich: Axenweite : Zimmerhöhe = 3,20 : 4 = 2 : 2½ oder 4 : 5.',
        ru: 'Наименьшее обрамление шириной 0,20 м расширяет зрительное поле окна до 1,55 м; если теперь принять поверхность стены между двумя окнами равной 1,65 м, то достигается шаг осей 3,20 м. Здесь имеет место отношение: шаг осей : высота комнаты = 3,20 : 4 = 2 : 2½, или 4 : 5.',
      },
      {
        index: 7,
        de: 'Versucht man beim gleichen Beispiele das Verhältnis 3 : 4, so wird die Axenweite 3.00; ein lichtes Fenster von 1.10, das ohnehin in diesem Falle den Anforderungen besser entspricht, wird durch den Rahmen auf 1.50 verbreitert; für die Wandfläche bleiben ebenfalls 1.50 übrig, somit gilt auch hier die vorgenannte Regel.',
        ru: 'Если применить в том же примере отношение 3 : 4, то шаг осей составит 3,00 м; окно шириной 1,10 м в свету, которое в данном случае и без того лучше отвечает требованиям, за счёт обрамления расширяется до 1,50 м; для стеновой поверхности также остаётся 1,50 м — следовательно, и здесь соблюдается вышеназванное правило.',
      },
      {
        index: 8,
        de: 'Diese Verhältnisse 2 : 3, 3 : 4, 4 : 5 bezeichnen beim einfachen Wohnhause meist die Werte von Axenweite und Zimmerhöhe. Mit der wachsenden Zimmerhöhe verringert sich der Unterschied zwischen dieser und der Axenweite, bis er = 0 wird, dem Verhältnisse beim vornehmen Palastbau. Axenweite : Zimmerhöhe = 5 : 6 = 6 : 7 = 7 : 8 = 8 : 9 etc.',
        ru: 'Эти отношения — 2 : 3, 3 : 4, 4 : 5 — в простом жилом доме чаще всего определяют значения шага осей и высоты комнаты. С ростом высоты комнаты разница между нею и шагом осей уменьшается, пока не станет равной нулю — что соответствует пропорции в представительной дворцовой архитектуре: шаг осей : высота комнаты = 5 : 6 = 6 : 7 = 7 : 8 = 8 : 9 и т. д.',
      },
      {
        index: 9,
        de: 'Ist bei einem Wohnhause mit mehreren Geschossen die richtige Axenweite nach diesen Regeln zu suchen, so hat die grösste Zimmerhöhe den Ausgangspunkt der Berechnung zu bilden. Als äusserste Grenze gilt stets das Verhältnis 1 : 1.',
        ru: 'Если в многоэтажном жилом доме требуется определить верный шаг осей по этим правилам, отправной точкой расчёта должна служить наибольшая высота комнаты. Крайним пределом всегда остаётся отношение 1 : 1.',
      },
      {
        index: 10,
        de: 'Bei reicher Säulen- und Pilasterarchitektur wird die Oeffnung mit Recht oft breiter als die Zwischenpfeiler gemacht, jene Regel daher ganz umgestossen: die Vertikalrichtung gelangt zur Herrschaft.',
        ru: 'При богатой архитектуре с колоннами и пилястрами проём нередко и вполне оправданно делают шире межоконных простенков, вследствие чего названное правило полностью отменяется: господство переходит к вертикальному направлению.',
      },
      {
        index: 11,
        de: 'Es verhält sich hier: Axenweite : Zimmerhöhe = 1 : 2.',
        ru: 'Здесь устанавливается отношение: шаг осей : высота комнаты = 1 : 2.',
      },
      {
        index: 12,
        de: 'Das einfachste ebenerdige oder zweigeschossige Wohnhaus kann auch bei geringer Zimmerhöhe eine grosse Axenweite erhalten und wird in dieser Lösung nur gewinnen und vornehmeren',
        ru: 'Даже самый простой одноэтажный или двухэтажный жилой дом при небольшой высоте комнат может получить широкий шаг осей и при таком решении лишь выиграет, обретя более благородный…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die Deckenkonstruktionen',
        ru: 'конструкции перекрытий',
        context: 'Различие между традициями перекрытий в Германии и Австрии делает привязку шага осей к высоте комнаты точнее, чем к высоте этажа.',
      },
      {
        de: 'die Zimmerhöhe',
        ru: 'высота комнаты (помещения в свету)',
        context: 'Эталонный вертикальный размер для расчёта шага осей в жилом доме.',
      },
      {
        de: 'die Umrahmung (der Rahmen)',
        ru: 'обрамление, наличник окна',
        context: 'При минимальной ширине 0,20 м с каждой стороны добавляет 0,40 м к зрительной ширине проёма.',
      },
      {
        de: 'der Palastbau',
        ru: 'дворцовое строительство',
        context: 'Предельный случай пропорционирования, где шаг осей приближается к высоте помещения (1 : 1).',
      },
    ],
  },
  {
    id: 'scan-0019',
    scanNr: 19,
    pageNumber: '6',
    sectionTitleDe: '3. Die Thür- und Fensteröffnungen. · a. Bestimmung der Axenweite…',
    sectionTitleRu: '3. Дверные и оконные проёмы. · a. Определение шага осей…',
    imagePath: '/assets/aistudio/15-014442283_0019_view_366c8ee0.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0019-5',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает фразу со стр. 5 («…und vornehmeren / Charakter erhalten.»). На странице помещены три геометрические схемы пропорционирования оконных проёмов (Fig. 1, Fig. 2, Fig. 3): отношение 3 : 5, геометрическое построение золотого сечения (a : b = b : (a + b)) и предельное отношение 1 : 2 (½ H : H). В формуле ряда Фибоначчи сохранена оригинальная пунктуация «8 : 13 :: 21 : 34 : 55 : 89 : 144 u. s. w.». Последнее предложение обрывается на «…da man die» и переходит на стр. 7.',
    figures: [
      {
        label: 'Fig. 1.',
        captionDe: 'Fensterverhältnis 3 TH. : 5 TH. (Breite zu Höhe = 3 : 5)',
        captionRu: 'Чертёж 1: пропорция окна 3 части по ширине к 5 частям по высоте (3 : 5)',
      },
      {
        label: 'Fig. 2.',
        captionDe: 'Geometrische Konstruktion nach dem goldenen Schnitt (Basis B., Hilfslinie ½ B.)',
        captionRu: 'Чертёж 2: геометрическое построение золотого сечения от ширины B (с перпендикуляром ½ B)',
      },
      {
        label: 'Fig. 3.',
        captionDe: 'Grenzverhältnis 1 : 2 (Breite ½ H. zu Höhe H.)',
        captionRu: 'Чертёж 3: предельное удвоенное соотношение сторон окна (ширина ½ H к высоте H)',
      },
    ],
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'Charakter erhalten. Die Axenweiten des städtischen Wohnhauses sind aus praktischen Gründen meist kleiner und finden ihre Grenzen zwischen den Verhältnissen 2 : 3, 4 : 5, 7 : 8 etc.',
        ru: '…обретя более благородный характер. Шаги осей городского жилого дома по практическим соображениям обычно меньше и лежат в пределах между отношениями 2 : 3, 4 : 5, 7 : 8 и т. д.',
      },
      {
        index: 2,
        de: 'Sämtliche hier genannten Fälle sind in den Fassadenbeispielen mit geringen Abweichungen bearbeitet; die Verhältnisse lassen sich leicht durch Messungen mit dem Zirkel finden, ohne dass ein spezieller Hinweis nötig ist.',
        ru: 'Все названные здесь случаи с незначительными отклонениями проработаны в примерах фасадов; эти соотношения легко обнаружить промерами с помощью циркуля, без необходимости особого указания.',
      },
      {
        index: 3,
        de: 'Bemerkt sei hierbei, dass die Zimmerhöhen durchgehends absichtlich gering angenommen wurden, um im kleinen Maßstabe ein möglichst umfassendes Bild der ganzen Fassade bieten zu können und die Bildungsregel nicht auf einen Teil zu beschränken.',
        ru: 'Следует при этом заметить, что высоты помещений повсеместно были намеренно приняты небольшими, чтобы в мелком масштабе дать возможно более полное изображение всего фасада и не ограничивать правило построения лишь одной его частью.',
      },
      {
        index: 4,
        de: 'Die lichten Maße der Fensteröffnungen selbst ergeben sich aus der Grösse des Raumes, der durch sie Licht und Luft erhalten soll. Erfahrungsgemäß entsprechen einfachen Räumen des Wohnhauses Breiten von 0.90, 1.00 bis 1.10 m; nur grössere Räume erhalten die Breiten von 1.20 bis 1.40 m. Die Bestimmung der Fensterhöhe richtet sich gewöhnlich nach der angenommenen Breite. Umgekehrt kann der Wunsch vorliegen, dem Fenster die grösstmögliche Höhe, soweit die Zimmerhöhe es erlaubt, zu geben, dann wird die Breite nach der festgestellten Höhe ermittelt.',
        ru: 'Размеры оконных проёмов в свету вытекают из величины помещения, которое должно получать через них свет и воздух. Как показывает опыт, простым комнатам жилого дома соответствуют ширины от 0,90 и 1,00 до 1,10 м; лишь более крупные помещения получают ширину от 1,20 до 1,40 м. Определение высоты окна обычно ориентируется на принятую ширину. Напротив, может возникнуть желание придать окну наибольшую возможную высоту, насколько это позволяет высота комнаты, — тогда ширина вычисляется по установленной высоте.',
      },
      {
        index: 5,
        de: 'Soll das Fenster ein schönes Verhältnis zeigen, so wird seine Höhe nicht mehr als das Doppelte und nicht weniger als das 1½fache der Breite betragen dürfen. Zwischen diesen beiden Grenzwerten liegen nun zahllose andere Verhältnisse; davon ist eines besonders bemerkenswert,',
        ru: 'Если окно должно обладать красивой пропорцией, его высота не должна превышать удвоенную ширину и не должна быть меньше полуторной ширины. Между этими двумя предельными значениями лежит бесчисленное множество иных соотношений; среди них одно особенно примечательно,',
      },
      {
        index: 6,
        de: 'nämlich das, nach welchem sich Höhe und Breite verhalten wie die Teile einer nach dem goldenen Schnitt geteilten Linie. Bei einer nach dem goldenen Schnitt geteilten Linie verhält sich der kleinere Teil zum grösseren wie der grössere zur ganzen Linie, also a : b = b : (a + b). Annähernde Verhältnisse sind z. B. 3 : 5 = 5 : 8⅓ (8) und 5 : 8 = 8 : 12⅘ (13).',
        ru: 'а именно то, при котором высота и ширина соотносятся как части отрезка, разделённого в золотом сечении. При делении отрезка в золотом сечении меньшая часть относится к большей так же, как большая ко всему отрезку, то есть a : b = b : (a + b). Приближёнными отношениями являются, например: 3 : 5 = 5 : 8⅓ (8) и 5 : 8 = 8 : 12⅘ (13).',
      },
      {
        index: 7,
        de: 'Im ersten Falle beträgt der Fehler ⅓ der Einheit, im zweiten Falle ⅕ der Einheit. Die Verhältnisziffern 8 : 13 :: 21 : 34 : 55 : 89 : 144 u. s. w. rücken dem goldenen Schnitt immer näher, ohne ihn je zu erreichen. Die mathematische Teilung ist Sache der Geometrie und für die bauliche Praxis nicht von Erheblichkeit.',
        ru: 'В первом случае погрешность составляет ⅓ единицы, во втором случае — ⅕ единицы. Числа пропорции 8 : 13 :: 21 : 34 : 55 : 89 : 144 и т. д. всё ближе подходят к золотому сечению, никогда его не достигая. Строго математическое деление есть дело геометрии и для строительной практики несущественно.',
      },
      {
        index: 8,
        de: 'Die oben angeführten Verhältnisse 3 : 5 und 5 : 8 können beim Fenster an Stelle der Teilung nach dem goldenen Schnitt unbedenklich als gute angenommen werden, da man die',
        ru: 'Приведённые выше отношения 3 : 5 и 5 : 8 можно без колебаний принимать для окна как удачные вместо деления по золотому сечению, поскольку…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die lichten Maße der Fensteröffnungen',
        ru: 'размеры оконных проёмов в свету',
        context: 'Типовые ширины для жилого дома: 0,90–1,10 м для обычных комнат и 1,20–1,40 м для крупных помещений.',
      },
      {
        de: 'der goldene Schnitt',
        ru: 'золотое сечение',
        context: 'Пропорция a : b = b : (a + b), лежащая между предельными отношениями высоты окна к ширине 1½ : 1 и 2 : 1.',
      },
      {
        de: 'die Verhältnisse 3 : 5 und 5 : 8',
        ru: 'приближённые отношения 3 : 5 и 5 : 8',
        context: 'Практические целочисленные приближения золотого сечения (ряд Фибоначчи) для проектирования оконных проёмов.',
      },
      {
        de: 'Messungen mit dem Zirkel',
        ru: 'промеры циркулем',
        context: 'Метод проверки пропорций по гравированным/литографированным фасадным таблицам издания.',
      },
    ],
  },
  {
    id: 'scan-0020',
    scanNr: 20,
    pageNumber: '7',
    sectionTitleDe: '3. Die Thür- und Fensteröffnungen. · b) Die dekorativen Einfassungen und Krönungen der Fenster.',
    sectionTitleRu: '3. Дверные и оконные проёмы. · b) Декоративные обрамления и завершения окон.',
    imagePath: '/assets/aistudio/15-014442283_0020_view_5197087e.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0020-5',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 6 («…da man die / Differenz kaum wahrnehmen wird.»). Далее следуют практическое правило половины диагонали (для отношения 3 : 5) и чертёж Fig. 4 (построение высоты по заданной ширине B с отложенным на чертеже размером 4/3 B и центром циркульной дуги). В нижней части страницы открывается подраздел «b) Die dekorativen Einfassungen und Krönungen der Fenster.» с классификацией обрамлений (п. 1–4) и сандриков (п. a–b). Последняя строка обрывается на «…von 1/6 der» (продолжение на стр. 8).',
    figures: [
      {
        label: 'Fig. 4.',
        captionDe: 'Konstruktion der Fensterhöhe aus gegebener Breite B. (mit Maßantragung 4/3 B. und Zirkelschlag)',
        captionRu: 'Чертёж 4: построение высоты окна по заданной ширине B (с выносом 4/3 B и дугой циркуля)',
      },
    ],
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'Differenz kaum wahrnehmen wird. Je nach den Umständen und Bedürfnissen wird man auch andere Verhältnisse, die nicht weit abliegen, wie 5 : 9 oder 4 : 7 wählen.',
        ru: '…разница едва ли будет заметна. В зависимости от обстоятельств и потребностей можно выбирать и другие близкие соотношения, такие как 5 : 9 или 4 : 7.',
      },
      {
        index: 2,
        de: 'Gestrecktere Fenster kommen zwar vor und haben da auch vollkommene Berechtigung, wo Wohnräume bei vollster Ausnutzung einer grossen Zimmerhöhe viel Licht erhalten sollen; doch wird dann die äussere Architektur so behandelt werden müssen, dass eine Ausgleichung des ungewöhnlichen Maßes der Oeffnung mit den umrahmenden und schliessenden Teilen erzielt wird. Gekuppelte Fenster werden, was das einzelne Fenster betrifft, naturgemäß immer gestreckter als einfache sein, da sie meist gleiche Höhe mit den einfachen Fenstern desselben Geschosses halten müssen; während die Gesamtbreite nicht allzu gross werden darf, weil sonst ein schlechtes Verhältnis entstehen würde.',
        ru: 'Более вытянутые окна действительно встречаются и вполне оправданны там, где жилые помещения при полнейшем использовании большой высоты комнаты должны получать много света; однако тогда внешнюю архитектуру необходимо трактовать так, чтобы достигалось уравновешивание необычной пропорции проёма с обрамляющими и замыкающими его частями. Сдвоенные (спаренные) окна в отношении каждого отдельного проёма по природе своей всегда вытянутее одиночных, поскольку они большей частью должны выдерживать одну высоту с одиночными окнами того же этажа, тогда как общая ширина не должна становиться чрезмерной, иначе возникла бы неудачная пропорция.',
      },
      {
        index: 3,
        de: 'Bestimmt man Breite und Höhe eines Fensters wie 3 : 5 und zieht die Diagonale, so findet man, dass die halbe Diagonale annähernd der Fensterbreite gleich ist (Fig. 1). Man sagt daher auch: die Breite eines Fensters soll nicht mehr betragen als die Hälfte der Diagonale in dem rechteckigen Felde der Oeffnung. Mit dieser Formel kann man sich in der Praxis am schnellsten Gewissheit darüber verschaffen, ob die Verhältnisse eines Fensters in den richtigen Grenzen bleiben.',
        ru: 'Если задать ширину и высоту окна в отношении 3 : 5 и провести диагональ, то обнаружится, что половина диагонали приближённо равна ширине окна (Fig. 1). Поэтому говорят также: ширина окна не должна превышать половину диагонали прямоугольного поля проёма. С помощью этой формулы на практике быстрее всего можно убедиться, остаются ли пропорции окна в должных пределах.',
      },
      {
        index: 4,
        de: 'Die Konstruktionen auf Grund des goldenen Schnittes richten sich entweder nach einer gegebenen Breite oder Höhe.',
        ru: 'Построения на основе золотого сечения исходят либо из заданной ширины, либо из заданной высоты.',
      },
      {
        index: 5,
        de: 'Nach den Figuren 2 und 4 ist die Breite gegeben und daraus ist die Höhe konstruiert, wie aus den Maßantragungen und Zirkelschlägen ersichtlich ist. Nach Fig. 3 dagegen ist die Höhe gegeben; die Hälfte derselben wird der Breite nach aufgetragen; die schräge Linie wird gezogen und die Zirkelschläge ergeben die Fensterbreite.',
        ru: 'Согласно чертежам 2 и 4 задана ширина, и из неё построена высота, как видно по отложенным отрезкам и засечкам циркуля. Напротив, по чертежу 3 задана высота; половина её откладывается по ширине; проводится наклонная линия, и дуги циркуля дают ширину окна.',
      },
      {
        index: 6,
        subsubheadingDe: 'b) Die dekorativen Einfassungen und Krönungen der Fenster.',
        subsubheadingRu: 'b) Декоративные обрамления и завершения окон.',
        de: 'Bei Betrachtung der Einfassungen und Krönungen sind mehrere Fälle zu unterscheiden.\n1. Das Fenster ist nur durch einen ringsumlaufenden Rahmen mit oder ohne Ohren eingefasst.\n2. Das Fenster erhält den Rahmen an den Seiten und oben; den unteren Abschluss bildet eine frei endigende Sohlbank.\n3. Die Sohlbank wird zum Teile einer selbständigen Brüstung; das Fenster sitzt auf einem Postamente.\n4. Das Fenster wird oben durch eine Verdachung geschlossen.',
        ru: 'При рассмотрении обрамлений и завершений следует различать несколько случаев:\n1. Окно обрамлено лишь обходящим его со всех сторон наличником — с «ушками» или без них.\n2. Окно получает наличник по бокам и сверху; нижнее завершение образует свободно оканчивающаяся подоконная плита (слив).\n3. Подоконная плита становится частью самостоятельного парапета (подоконной стенки); окно покоится на постаменте.\n4. Окно сверху замыкается сандриком (венчающим покрытием).',
      },
      {
        index: 7,
        de: 'Die letztgenannte Lösung hat allein wieder so viele Variationen, dass anstatt der näheren Besprechung im Texte auf die Tafeln der Mappe hingewiesen werden muss, welche das Fenster in seinen verschiedenen Gestaltungen behandeln und auch die Fälle darstellen, wo der seitliche Rahmen zur Stützenform wird.',
        ru: 'Одно только последнее решение имеет столь много разновидностей, что вместо подробного разбора в тексте следует сослаться на таблицы папки (атласа), рассматривающие окно в его различных формах и показывающие также те случаи, где боковой наличник переходит в форму опоры.',
      },
      {
        index: 8,
        de: 'Wichtig dürfte es nur sein, Folgendes zu unterscheiden:\na) Die Verdachung folgt unmittelbar auf den Rahmen.\nb) Zwischen Rahmen und Verdachung ist ein breites Band (Fries) eingeschoben, so dass also der Rahmen einem Architrave gleichzustellen ist, nach dem Fries und Kranz abgestimmt werden.',
        ru: 'Важным представляется лишь различить следующее:\na) Сандрик следует непосредственно над наличником.\nb) Между наличником и сандриком введена широкая лента (фриз), так что наличник следует уподобить архитраву, по которому согласуются фриз и венчающий карниз.',
      },
      {
        index: 9,
        de: 'Die unmittelbar auf dem Rahmen sitzende Verdachung erhält bei einem Rahmen von 1/6 der',
        ru: 'Сандрик, сидящий непосредственно на наличнике, при ширине наличника в 1/6 от…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'gekuppelte Fenster',
        ru: 'сдвоенные (спаренные) окна',
        context: 'Парные оконные проёмы, каждый из которых уже одиночного при той же этажной высоте.',
      },
      {
        de: 'Rahmen mit Ohren',
        ru: 'наличник с «ушками» (раскреповками)',
        context: 'Классический тип замкнутого вокруг проёма барочно-ренессансного обрамления с боковыми выступами по углам.',
      },
      {
        de: 'die Sohlbank',
        ru: 'подоконная плита / внешний подоконник',
        context: 'Нижний горизонтальный элемент окна; бывает свободно выступающей или встроенной в самостоятельный парапет/постамент.',
      },
      {
        de: 'die Verdachung',
        ru: 'сандрик (оконное завершение)',
        context: 'Венчающий элемент над проёмом: опирается прямо на наличник либо отделяется от него фризом (при уподоблении наличника архитраву).',
      },
      {
        de: 'Architrav, Fries und Kranz',
        ru: 'архитрав, фриз и венчающий карниз',
        context: 'Полная ордерная схема антаблемента, применяемая к богатому оконному завершению.',
      },
    ],
  },
  {
    id: 'scan-0021',
    scanNr: 21,
    pageNumber: '8',
    sectionTitleDe: '3. Die Thür- und Fensteröffnungen. · b) Die dekorativen Einfassungen und Krönungen der Fenster.',
    sectionTitleRu: '3. Дверные и оконные проёмы. · b) Декоративные обрамления и завершения окон.',
    imagePath: '/assets/aistudio/15-014442283_0021_view_514ee84c.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0021-1',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 7 («…von 1/6 der / lichten Fensterbreite…»). Приводится таблица пропорций «Rahmen : Fries : Kranz» и два чертежа: Fig. 5 (равное деление 1 : 1 : 1 и вынос под 45°) и Fig. 6 (оконное завершение на консоли с уменьшенным выносом карниза 5/6 высоты 1, планом с обозначением светлого проёма «licht. F.» и равными отступами «a» от капители консоли до слезника слёзной плиты). В последнем абзаце тема переходит к дверям и порталам; текст обрывается на «…mit den» и продолжается на стр. 9.',
    figures: [
      {
        label: 'Fig. 5.',
        captionDe: 'Verhältnis Rahmen : Fries : Kranz = 1 : 1 : 1 mit 45°-Ausladung',
        captionRu: 'Чертёж 5: равное соотношение наличник : фриз : карниз = 1 : 1 : 1 с углом выноса 45°',
      },
      {
        label: 'Fig. 6.',
        captionDe: 'Verdachung mit Konsole (Ausladung 5/6 zur Höhe 1; Grundriss mit «licht. F.» und gleichem Abstand «a»)',
        captionRu: 'Чертёж 6: сандрик на консоли (вынос 5/6 при высоте 1; план-вид снизу с проёмом «licht. F.» и равным отступом «a»)',
      },
    ],
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'lichten Fensterbreite gewöhnlich eine Höhe, die nicht weniger, meist aber mehr als die Rahmenbreite beträgt.',
        ru: '…ширины окна в свету обычно получает высоту, которая не меньше, а большей частью больше ширины самого наличника.',
      },
      {
        index: 2,
        de: 'Die zweite Lösung wendet die für Gesimse üblichen Verhältniszahlen an, also:\nRahmen : Fries : Kranz\n1 : 1 : 1 (Fig. 5.)\n6 : 7 : 8\n4 : 5 : 6\n3 : 4 : 4\n2 : 3 : 3.',
        ru: 'Второе решение применяет обычные для карнизов (антаблементов) числовые отношения, а именно:\nНаличник : Фриз : Карниз\n1 : 1 : 1 (Fig. 5.)\n6 : 7 : 8\n4 : 5 : 6\n3 : 4 : 4\n2 : 3 : 3.',
      },
      {
        index: 3,
        de: 'Selbstverständlich können auch andere, den vorstehenden sich annähernde Verhältnisse angewendet werden, wie das auch bei Gesimsbildungen der Fall ist, wenn die Ausladung des Gesimses Rücksicht auf dessen Höhe nimmt.',
        ru: 'Разумеется, могут применяться и другие, близкие к приведённым соотношения, как это бывает и при профилировке карнизов, когда вынос карниза сообразуется с его высотой.',
      },
      {
        index: 4,
        de: 'Im allgemeinen wird der Fries nicht gern höher angenommen als der Kranz. Trotzdem kann mit dem Verhältnisse von 3 : 5 : 4 auch eine sehr gute Wirkung erzielt werden, wenn man dem Kranze grössere Ausladung giebt. Die wirklichen Maße von Rahmen, Fries und Kranz kommen bei der Veränderung des Sehwinkels viel weniger zum Ausdruck, als das Diagonalmaß einer Ausladung, die dem Winkel von 45° folgt.',
        ru: 'Вообще говоря, фриз неохотно делают выше венчающего карниза. Тем не менее и при отношении 3 : 5 : 4 можно достичь весьма хорошего эффекта, если придать карнизу больший вынос. Истинные размеры наличника, фриза и карниза при изменении угла зрения сказываются гораздо меньше, чем диагональный размер выноса, следующего углу в 45°.',
      },
      {
        index: 5,
        de: 'In den Tafeln der Mappe sind alle wichtigen Verhältniszahlen angemerkt; sie gestatten ein leichtes Ablesen der angewandten Regeln; der Winkel von 45° ist auch da eingezeichnet, wo eine Abweichung von demselben stattfindet. Die Grösse dieser Abweichung ist z. B. nach Fig. 6 nicht unwesentlich, da eine Verdachung mit Konsolen einem zu starken Vorsprung vor den Mauergrund gleichkäme, wenn die Ausladung in der Ansicht nach dem Winkel von 45° bestimmt würde.',
        ru: 'На таблицах атласа отмечены все важные числовые отношения; они позволяют легко считывать применённые правила; угол в 45° прочерчен и там, где имеет место отступление от него. Величина этого отступления, например, по чертежу 6 весьма существенна, поскольку сандрик на консолях давал бы слишком сильный выступ перед плоскостью стены, если бы его вынос на фасаде определялся по углу в 45°.',
      },
      {
        index: 6,
        de: 'Der Abstand a des Deckgliedes der Konsole von der Wassernase der Hängeplatte soll nach vorn und nach den Seiten stets der gleiche bleiben, und es ist ein zweifelhafter Notbehelf, wenn diese Regel zu Gunsten einer geringeren Ausladung nach vorn umgangen wird.',
        ru: 'Расстояние a от верхней полочки (венчающего члена) консоли до слезника слёзной плиты должно всегда оставаться одинаковым как вперёд, так и в стороны, и обход этого правила ради меньшего выноса вперёд представляет собой сомнительную полумеру.',
      },
      {
        index: 7,
        de: 'Die Thüren und Portale werden in ähnlicher Weise wie die Fenster behandelt. Der Unterschied ist nur der, dass bei den Thüren das Höhenverhältnis grösser ist und dass auf den Fuss oder das Postament bei der Gliederung mehr Gewicht zu legen ist. Da die Thür schon durch die Grösse den Vorrang neben den Fenstern behauptet, müssen Rahmen und Verdachungen bedeutender erscheinen. Die Thür mit geschlossener Architektur wird zum Portal umgewandelt. Das Hauptgewicht ist bei der Ausbildung der Thür auf den organischen Zusammenhang mit den',
        ru: 'Двери и порталы трактуются сходным с окнами образом. Разница лишь в том, что у дверей отношение высоты к ширине больше и при членении больший акцент следует делать на цокольную часть или постамент. Поскольку дверь уже своей величиной занимает главенствующее положение рядом с окнами, её наличники и сандрики должны выглядеть значительнее. Дверь с замкнутой архитектурной композицией превращается в портал. Главный упор при разработке двери должен делаться на органическую связь с…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die Ausladung',
        ru: 'вынос (карниза, сандрика)',
        context: 'Горизонтальный выступ профиля перед плоскостью стены; сопоставляется с высотой через угол 45° или уменьшается при консолях (напр., 5/6).',
      },
      {
        de: 'die Hängeplatte / Wassernase',
        ru: 'слёзная плита (корона карниза) / слезник',
        context: 'Свешивающаяся часть венчающего карниза; отступ «a» от неё до верхней плиты консоли должен быть равным спереди и с боков.',
      },
      {
        de: 'das Deckglied der Konsole',
        ru: 'венчающий облом (плитка) консоли',
        context: 'Верхнее завершение кронштейна/консоли, задающее границу отступа «a» под слёзной плитой.',
      },
      {
        de: 'das Portal',
        ru: 'портал',
        context: 'Дверной проём с целостно проработанным архитектурным обрамлением, акцентированным основанием и более значительным сандриком.',
      },
    ],
  },
  {
    id: 'scan-0022',
    scanNr: 22,
    pageNumber: '9',
    sectionTitleDe: '3. Die Thür- und Fensteröffnungen. · 4. Die horizontalen Gliederungen und ihre Profilierung.',
    sectionTitleRu: '3. Дверные и оконные проёмы. · 4. Горизонтальные членения и их профилировка.',
    imagePath: '/assets/aistudio/15-014442283_0022_view_fb368636.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0022-7',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает рассуждение о дверях и порталах со стр. 8 («…mit den / horizontalen Gliederungen des Erdgeschosses…»). Затем открывается новый крупный раздел «4. Die horizontalen Gliederungen und ihre Profilierung.» с трёхуровневой классификацией карнизов (цокольные, поясные/междуэтажные и венчающие/главные) и основным законом профилировки — чередованием «жёстких» (прямоугольных) и «мягких» (криволинейных) обломов. Внизу страницы под текстом отпечатана сигнатура второй тетради «2»; страница заканчивается полным предложением.',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'horizontalen Gliederungen des Erdgeschosses zu legen. Das Portal darf nicht ohne Verbindung mit diesen Gliederungen auftreten, da es sonst aus dem Ganzen herausfällt und das feste Gefüge vermissen lässt. Sind keine Horizontalgliederungen vorhanden, so ist eine selbständige Ausbildung des Portals wohlberechtigt; dieses gewährt dann in der Fassade einen Ruhepunkt von besonderem Reize. Wird die Portalanlage mit Säulen oder Pilastern ausgestattet, so erscheint die Oeffnung unabhängig von der Fensteröffnung und kann rundbogig abgeschlossen werden, auch wenn bei den Fenstern ein gerader Sturz aus praktischen Gründen vorgezogen wird.',
        ru: '…с горизонтальными членениями первого (цокольного) этажа. Портал не должен появляться вне связи с этими членениями, иначе он выпадает из целого и лишает фасад ощущения прочной спаянности. Если же горизонтальные членения отсутствуют, самостоятельная трактовка портала вполне оправданна; тогда он даёт на фасаде точку покоя особой выразительности. Если портальная композиция снабжается колоннами или пилястрами, то проём выглядит независимо от оконных проёмов и может завершаться полуциркульной аркой, даже если у окон по практическим соображениям предпочтена прямая перемычка.',
      },
      {
        index: 2,
        subheadingDe: '4. Die horizontalen Gliederungen und ihre Profilierung.',
        subheadingRu: '4. Горизонтальные членения и их профилировка.',
        de: 'Horizontale Glieder nennen wir alle Gesimse, als\nSockel oder Fussgesimse — fussbildend,\nGurt- oder Brustgesimse — bindend,\nKrönungs- oder Hauptgesimse — abschliessend.',
        ru: 'Горизонтальными членами мы называем все карнизы, а именно:\nцокольные (подножные) карнизы — образующие основание,\nпоясные или подоконные карнизы (тяги) — связующие,\nвенчающие или главные карнизы — завершающие.',
      },
      {
        index: 3,
        de: 'Im engeren Sinne sind auch die Gesimse der Sohlbänke und Verdachungen von Thüren und Fenstern hinzuzurechnen.',
        ru: 'В более узком смысле к ним следует причислить также карнизы подоконных плит и сандриков дверей и окон.',
      },
      {
        index: 4,
        de: 'Das Sockelgesimse wird je nach der Grösse der Last, die es trägt, breiter und stärker zu gestalten sein. Eine vorspringende Platte ist konstruktiv und ästhetisch das beste Mittel, um Standhaftigkeit und Kraft auszudrücken.',
        ru: 'Цокольный карниз должен выполняться тем шире и мощнее, чем больше нагрузка, которую он несёт. Выступающая плита конструктивно и эстетически является лучшим средством для выражения устойчивости и силы.',
      },
      {
        index: 5,
        de: 'Gurt- oder Brustgesimse werden an den Stellen angeordnet, wo ein Geschoss endigt und das nächstfolgende beginnt. Das Band, das beide verbindet, wird am besten durch eine vorspringende Platte ausgedrückt. Das Gurtgesims kann aber auch in krönendem Sinne als Abschluss des unteren Geschosses aufgefasst werden und verträgt daher auch eine Ausbildung, die dieser Funktion gerecht wird.',
        ru: 'Поясные или подоконные карнизы располагаются в тех местах, где один этаж заканчивается и начинается следующий. Лента, связывающая оба этажа, лучше всего выражается выступающей полочкой (плитой). Однако междуэтажный карниз может пониматься и в венчающем смысле — как завершение нижнего этажа, и потому допускает разработку, отвечающую этой функции.',
      },
      {
        index: 6,
        de: 'Krönungs- oder Hauptgesimse bilden den wirksamsten Abschluss eines Mauerkörpers. Dieser Abschluss wird durch eine kräftige Ausladung erreicht, während eine leichte gefällige Gliederung nach unten den Uebergang der geraden Fläche (der tragenden Masse) zum vorspringenden Dache (der getragenen Last) vermittelt.',
        ru: 'Венчающие, или главные, карнизы образуют наиболее действенное завершение стенового массива. Это завершение достигается сильным выносом, тогда как лёгкое, приятное глазу членение книзу опосредует переход от прямой плоскости (несущей массы) к выступающей крыше (несомой тяжести).',
      },
      {
        index: 7,
        de: 'Jedes Gesims erhält den mehr oder minder kräftigen Ausdruck der bezweckten Wirkung durch die Art seiner Profilierung. Auf dem Wechsel und dem Kontrast der Elemente, aus denen es sich zusammensetzt, beruht das Geheimnis seines Eindrucks.',
        ru: 'Каждый карниз получает более или менее сильное выражение требуемого действия благодаря характеру своей профилировки. На чередовании и контрасте элементов, из которых он слагается, покоится секрет его впечатления.',
      },
      {
        index: 8,
        de: 'Bei Fussgesimsen ist die Verbreiterung zu einer kräftigen Masse geboten und die Ueberleitung des Vorsprungs zum Mauerkörper das minder Wichtige. Das Plattensystem wird zur Hauptsache, die Kurve zur Nebensache.',
        ru: 'У цокольных карнизов необходимо расширение в мощную массу, а переход выступа к телу стены играет второстепенную роль. Система плит (прямоугольных полок) становится здесь главным, а кривая линия — второстепенным.',
      },
      {
        index: 9,
        de: 'Das Gurtgesimse verlangt grössere Leichtigkeit. Das Binden und Verknüpfen soll sich bemerkbar machen; die zwischen der Wand und der vorspringenden Platte vermittelnde Kurve muss daher mehr zur Geltung kommen und Hals und Halsband werden oft eingeschoben. Gurtgesimse mit krönendem Abschluss erhalten grössere Ausladungen und dementsprechend eine feinere Gliederung ihres Ablaufes.',
        ru: 'Поясной карниз требует большей лёгкости. Связывание и скрепление должны быть заметны; поэтому кривая, посредствующая между стеной и выступающей плитой, должна выступать отчётливее, и нередко вводятся шейка и поясок (астрагал/ремешок). Междуэтажные карнизы с венчающим завершением получают более значительный вынос и соответственно более тонкое расчленение своего свеса (профиля перехода).',
      },
      {
        index: 10,
        de: 'Das Hauptgesimse muss schon seiner bedeutenderen Höhe wegen lebendiger gegliedert werden, um nicht zu schwer zu wirken. Hals und Halsband bieten hierfür das eine Mittel, auf einander folgende Architravplatten ein zweites, das ausdruckvollste aber ist die Dreiteilung in Architrav, Fries und Kranz. Im Kranze wird immer die Kurve vorherrschen, sie kann aber auch im Friese vorkommen. Zur Belebung des Kranzes werden gern Konsolen angeordnet, die aber auch im Friese verwendet werden können. Setzen sich die Konsolen des Frieses auch noch im Kranze fort, so erzielt man bei einer geschickten Verteilung eine kräftigere Wirkung ohne Störung der Ruhe.',
        ru: 'Главный карниз уже в силу своей большей высоты должен члениться живее, чтобы не казаться слишком тяжёлым. Шейка и поясок дают для этого одно средство, ступенчато следующие друг за другом полосы (фасции) архитрава — второе, но самым выразительным является трёхчастное деление на архитрав, фриз и венчающую часть (карниз в узком смысле). В венчающей части всегда будет преобладать кривая линия, но она может встречаться и во фризе. Для оживления венчающей части охотно помещают консоли (модульоны), которые также могут применяться и во фризе. Если консоли фриза продолжаются ещё и в венчающей части, то при умелом распределении достигается более сильный эффект без нарушения покоя.',
      },
      {
        index: 11,
        de: 'Jede Gesimsgliederung hat zum Grundgesetze den Wechsel zwischen Hartem und Weichem, d. h. zwischen scharfkantigen und rundlichen (geschwungenen) Formelementen. Hart erscheinen die Platte und das Plättchen, weich die Kehle, der Eierstab, die Perlschnur.',
        ru: 'В основе всякого членения карниза лежит закон чередования жёсткого и мягкого, то есть острогранных и округлых (криволинейных) элементов формы. Жёсткими предстают плита и полочка (ремешок), мягкими — выкружка, ионик (овы) и бусы (жемчужник).',
      },
    ],
    terms: [
      {
        de: 'Sockel-, Gurt- und Hauptgesims',
        ru: 'цокольный, поясной (междуэтажный) и главный (венчающий) карнизы',
        context: 'Три функциональных класса горизонтальных тяг: образующие опору, связующие этажи и завершающие стену.',
      },
      {
        de: 'Hals und Halsband',
        ru: 'шейка и поясок (астрагал)',
        context: 'Промежуточные переходные обломы, применяемые для смягчения перехода и оживления поясных и главных карнизов.',
      },
      {
        de: 'Architravplatten',
        ru: 'архитравные полосы (фасции)',
        context: 'Ступенчато нависающие одна над другой плоские ленты, облегчающие высокий главный карниз.',
      },
      {
        de: 'Hartes und Weiches (Platte, Plättchen / Kehle, Eierstab, Perlschnur)',
        ru: 'жёсткое и мягкое (плита, полочка / выкружка, ионик, бусы)',
        context: 'Фундаментальный закон профилировки карнизов — контраст прямолинейных угловатых и криволинейных орнаментированных обломов.',
      },
    ],
  },
  {
    id: 'scan-0023',
    scanNr: 23,
    pageNumber: '10',
    sectionTitleDe: '4. Die horizontalen Gliederungen und ihre Profilierung.',
    sectionTitleRu: '4. Горизонтальные членения и их профилировка.',
    imagePath: '/assets/aistudio/15-014442283_0023_view_9dec04ad.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0023-3',
    institution: 'Deutsches Museum',
    editorialNote:
      'Страница развивает учение о профилях карнизов: сопоставляются четвертная выкружка (Viertelkehle), четвертной вал (Viertelstab), прямой и обратный гусёк/каблучок (Karnies / verkehrter Karnies) и аттическая база (два вала с выкружкой-скоцией между ними), формулируется трёхчастное строение цоколя (Fuss, Rumpf, Deckglied) и закон убывания массивности рустики и карнизов снизу вверх. В орфографии 1895 г. сохранены формы «Maße», «giebt», «leichtern». Последняя строка обрывается на переносе «Es ist ein-» (продолжение на стр. 11).',
    paragraphs: [
      {
        index: 1,
        de: 'Gleiches wird nie an Gleiches gereiht, Platten und Kurven erhalten verschiedene Maße; zu harte Gegensätze werden durch bindende Plättchen und andere kleine Profile ausgeglichen.',
        ru: 'Однородное никогда не приставляется вплотную к однородному, плиты и кривые обломы получают разные размеры; слишком резкие контрасты смягчаются связующими полочками и другими мелкими профилями.',
      },
      {
        index: 2,
        de: 'Die härteste Kurve ist die Viertelkehle, bei welcher der Uebergang von der Platte zur Kurve deutlich wahrgenommen wird, die weichste und elastischste das aus zwei Kontrakurven bestehende Karniesprofil. Nach der Kraftäusserung können wir den Viertelstab der Viertelkehle gegenüberstellen; jener spricht eine Zunahme des Volumens, diese eine Verringerung desselben aus, wenn eine schräge Linie als Grundform der Ausladung angenommen wird.',
        ru: 'Самой жёсткой кривой является четвертная выкружка, в которой отчётливо ощущается переход от прямой плиты к изгибу, а самой мягкой и упругой — профиль гуська/каблучка (карниза-S-кривой), состоящий из двух встречных кривых. По выражению силы мы можем противопоставить четвертной вал четвертной выкружке: первый выражает нарастание объёма, вторая — его убывание, если за исходную форму выноса принять наклонную линию.',
      },
      {
        index: 3,
        de: 'Als Fussprofil passt daher der Viertelstab besser zu einem massigen und schweren Unterbau als die Viertelkehle. Wird die Viertelkehle umgekehrt, so bildet sie für jede Krönung ein leichteres und zarteres Abschlussglied als der Viertelstab. Beiden Funktionen, der starken wie der leichten Kraftäusserung, wird die Vereinigung beider zu einem Profile, dem Karniese, gerecht, der also im Sockel ebenso zweckentsprechend anzuwenden ist, wie in der Krönung. Von den beiden Kurventeilen des Karnieses wird die Viertelkehle dadurch zum Hauptfaktor, dass sie in der äussersten Ausladung zur Geltung kommt.',
        ru: 'В качестве подножного (базового) профиля четвертной вал поэтому лучше подходит к массивному и тяжелому основанию, чем четвертная выкружка. Если же четвертную выкружку перевернуть, она образует для любого венчания более лёгкий и тонкий завершающий член, нежели четвертной вал. Обеим функциям — как сильному, так и лёгкому выражению напряжения — удовлетворяет соединение обоих обломов в один профиль, гусёк (каблучок), который, следовательно, столь же уместно применять в цоколе, как и в венчании. Из двух криволинейных частей этого профиля четвертная выкружка становится главным фактором благодаря тому, что именно она выступает на крайнем выносе.',
      },
      {
        index: 4,
        de: 'Der verkehrte Karnies hat in der grössten Ausladung den Viertelstab, die Kraft erscheint somit hier im Vordergrunde; da aber auch die Viertelkehle in ihm enthalten ist, wird es erklärlich, warum er, dem Viertelstabe allein gegenübergestellt, mehr den Eindruck des Leichten, Zarten bewirkt. Bedeutend schärfer als im Karniesprofile treten die konträren Kurven bei dem Fussgliede auf, das aus zwei Rundstäben mit einer zwischenliegenden Hohlkehle zusammengesetzt ist. Das Aufheften und Einschnüren kann kaum besser ausgedrückt werden, als in diesem Motive, das die höchste Kraft und die grösste Weichheit je nach dem Werte, der den Rundstäben oder der Hohlkehle zugemessen wird, zum Ausdruck bringt. Als Krönungsprofil für den freien Abschluss wird sich dieses Glied naturgemäss nicht eignen, da die Rundstäbe mit ihren Platten und Plättchen immer der Kraftentfaltung den Vorrang gewähren. Der Viertel- und Rundstab in Verbindung mit der Viertelkehle kommt im Sockel ebenso wie im Gurt- und im Hauptgesimse vor; niemals dürfen aber die vermittelnden Plättchen fehlen, und stets ist eine sorgfältige Abstimmung der gegenseitigen Werte vorzunehmen. Je nachdem die Empfindung des Einzelnen die eine Funktion der anderen vorzieht, wechselt der Ausdruck.',
        ru: 'Обратный каблучок (гусёк) имеет на наибольшем выносе четвертной вал, и сила тем самым выступает здесь на первый план; однако поскольку в нём присутствует и четвертная выкружка, становится понятно, почему по сравнению с одним лишь четвертным валом он производит более лёгкое и нежное впечатление. Значительно резче, чем в профиле гуська, противоположные кривые проявляются в подножном элементе, составленном из двух полувалов (торусов) с промежуточной выкружкой (скоцией). Прикрепление и перетяжка едва ли могут быть выражены лучше, чем в этом мотиве, передающем величайшую силу и величайшую мягкость в зависимости от значения, придаваемого валам или выкружке. В качестве венчающего профиля для свободного завершения этот элемент по природе своей не годится, поскольку валы с их плитами и полочками всегда отдают первенство развёртыванию силы. Четвертной вал и полувал в сочетании с четвертной выкружкой встречаются как в цоколе, так и в поясном и главном карнизах; однако при этом никогда не должны отсутствовать посредствующие полочки, и всегда требуется тщательное согласование взаимных пропорций. В зависимости от того, какую из функций индивидуальное чувство ставит выше другой, меняется и выразительность профиля.',
      },
      {
        index: 5,
        de: 'Von den beiden Kurventeilen ist bei krönenden Gliedern die Kehle, bei Sockelgliedern die Ausrundung vorherrschend.',
        ru: 'Из двух криволинейных составляющих у венчающих элементов преобладает выкружка (вогнутая кривая), а у цокольных — скругление (выпуклый вал).',
      },
      {
        index: 6,
        de: 'Im Sockel finden alle Profilelemente Verwendung, die Platte muss aber stets durch grössere Höhe zum Hauptteile werden; sie wird auch wohl abgetreppt in der Weise, dass ein grösserer Absatz einem kleineren folgt oder umgekehrt.',
        ru: 'В цоколе находят применение все элементы профиля, однако плита благодаря большей высоте всегда должна оставаться главной частью; её также нередко уступами расчленяют так, что более крупный уступ следует за меньшим или наоборот.',
      },
      {
        index: 7,
        de: 'Die vollendetste Bildung des Sockelgesimses ist die dreiteilige, weil sie dem Fusse eine grössere Höhe giebt, ohne eine feinere Gliederung auszuschliessen. Der dreiteilige Sockel besteht aus Fuss, Rumpf und Deckglied. Der Rumpf soll ruhig und massig wirken; er kann glatt gehalten sein oder aus Rustikaschichten bestehen. Im letzteren Fall wirkt er gedrungener. Bei den Kellerfenstern pflegt eine Abkröpfung angeordnet zu werden. Der Sockel erhält aber den Charakter einer ruhigen, kräftigen Masse weitaus besser, wenn er ohne Abkröpfung die ganze Front entlang läuft.',
        ru: 'Наиболее совершенным устройством цокольного карниза является трёхчастное, поскольку оно придаёт основанию большую высоту, не исключая более тонкой профилировки. Трёхчастный цоколь состоит из базы (подножия), тулова (тела) и венчающего карнизика. Тулово должно действовать спокойно и массивно; оно может быть выполнено гладким или состоять из рядов рустики. В последнем случае оно выглядит более приземистым. У подвальных окон обычно устраивают раскреповку (обход карнизом). Однако цоколь гораздо лучше сохраняет характер спокойной, мощной массы, если тянется вдоль всего фасада без раскреповок.',
      },
      {
        index: 8,
        de: 'Für die weitere Entwicklung nach oben gilt die Regel, dass die derben Formen des Sockels nicht wiederholt werden. Die Brüstungen und Fensterpostamente sind feiner zu profilieren.',
        ru: 'Для дальнейшего развития фасада вверх действует правило, что грубые формы цоколя не повторяются. Парапеты и подоконные постаменты следует профилировать тоньше.',
      },
      {
        index: 9,
        de: 'Die Rustiken im Erdgeschosse verlangen ausser der leichtern Profilierung eine geringere Höhe, als die im Sockel. Dieselbe Regel der Kraftabnahme nach oben ist auch in den Gesimsen der folgenden Geschosse zu beachten.',
        ru: 'Рустика первого этажа требует, помимо более лёгкой профилировки, меньшей высоты рядов, чем в цоколе. То же правило убывания мощи снизу вверх следует соблюдать и в карнизах последующих этажей.',
      },
      {
        index: 10,
        de: 'Der Kranz eines Gurt- oder Hauptgesimses, für sich betrachtet, besteht aus zwei Teilen, den Unter- und Obergliedern. Der untere Teil ist den tragenden, der obere den getragenen zugewiesen. In den Untergliedern wirkt die Kraft, die Oberglieder bezeichnen die Last. Es ist ein-',
        ru: 'Венчающая часть (карниз в узком смысле) поясного или главного карниза, взятая сама по себе, состоит из двух частей — нижних и верхних обломов. Нижняя часть отведена несущим, верхняя — несомым элементам. В нижних обломах действует сила, верхние обозначают тяжесть (нагрузку). Вполне…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'Viertelkehle und Viertelstab',
        ru: 'четвертная выкружка и четвертной вал (оволо)',
        context: 'Полярные простые криволинейные обломы: выкружка выражает утонение/лёгкость, вал — нарастание объёма и опору.',
      },
      {
        de: 'Karnies / verkehrter Karnies',
        ru: 'гусёк и обратный каблучок (S-образный профиль)',
        context: 'Сложные профили из двух встречных кривых, объединяющие несущую и завершающую функции.',
      },
      {
        de: 'Fuss, Rumpf und Deckglied (dreiteiliger Sockel)',
        ru: 'база, тулово и венчающая плита (трёхчастный цоколь)',
        context: 'Классическая композиция цоколя, аналогичная базе, стволу и карнизу пьедестала.',
      },
      {
        de: 'die Abkröpfung',
        ru: 'раскреповка (излом/обход тяги вокруг проёма)',
        context: 'Перелом цокольного карниза вокруг подвальных окон; автор предпочитает сплошной прогон без раскреповок.',
      },
      {
        de: 'Unter- und Oberglieder des Kranzes',
        ru: 'нижние (поддерживающие) и верхние (венчающие) обломы карниза',
        context: 'Тектоническое деление венчающей части: нижние обломы выражают несущую силу, верхние — несомую тяжесть.',
      },
    ],
  },
  {
    id: 'scan-0024',
    scanNr: 24,
    pageNumber: '11',
    sectionTitleDe: '4. Die horizontalen Gliederungen… · 5. Die vertikalen Gliederungen.',
    sectionTitleRu: '4. Горизонтальные членения… · 5. Вертикальные членения.',
    imagePath: '/assets/aistudio/15-014442283_0024_view_98c20d81.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0024-9',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает слово со стр. 10 («Es ist ein- / leuchtend…»). Далее завершается раздел 4: формулируется базовое соотношение 1 : 1 для верхних и нижних обломов венчающей части (вплоть до пределов 1 : 2 и 2 : 1), приводится четырёхчастная типология поясных и главных карнизов (п. 1–4) и различение лежачих (в карнизе) и стоячих (во фризе) консолей. В нижней части страницы открывается раздел «5. Die vertikalen Gliederungen.»; текст обрывается на предлоге «Im» (под строкой отпечатана сигнатура «2*» и штамп «Deutsches Museum Bibliothek») и продолжается на стр. 12.',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'leuchtend, dass weder die eine noch die andere Funktion gewisse Grenzen überschreiten darf, ohne die zweite in Mitleidenschaft zu ziehen; je nach dem Charakter des Gebäudes wird das Gesimse schwerer und gedrungener oder leichter und zarter zu bilden sein. Der Weg zur Erzielung des einen oder anderen Effektes ist in dem Wechsel der Maßzahlen klar vorgezeichnet.',
        ru: '…очевидно, что ни та ни другая функция не может переступать известные границы, не затрагивая другую; сообразно характеру здания карниз надлежит формировать более тяжёлым и приземистым либо более лёгким и тонким. Путь к достижению того или иного эффекта ясно намечен изменением числовых пропорций.',
      },
      {
        index: 2,
        de: 'Ein monumentales Bauwerk von grossen Dimensionen wird ein Gurtgesims, dessen Oberglieder nur aus einer Platte bestehen, ganz gut vertragen können; geringe Grössenverhältnisse verlangen mehr Leichtigkeit und der bescheidenste krönende Abschluss an der Platte wird ihnen besser entsprechen als die Platte allein. Mit der Absicht, einen leichteren Ausdruck zu erzielen, wächst nun dieser krönende Abschluss (Viertelkehle oder Karnies) in seinem Verhältnis zur Platte. Die grosse Platte mit einem wesentlich kleineren Abschlussglied bezeichnet die schwere Form, der umgekehrte Fall die leichte. Ebenso ist in den Untergliedern das leichte oder schwere Tragen je nach dem Grade der Arbeitsleistung, die ja immer sichtbar ist, zum Ausdruck zu bringen.',
        ru: 'Монументальное сооружение крупных размеров вполне может выдержать междуэтажный карниз, верхние обломы которого состоят из одной лишь плиты; малые масштабные соотношения требуют большей лёгкости, и самое скромное венчающее завершение над плитой будет соответствовать им лучше, чем одна плита. При стремлении достичь более лёгкой выразительности это венчающее завершение (четвертная выкружка или гусёк) возрастает в своём отношении к плите. Крупная плита со значительно меньшим завершающим обломом определяет тяжёлую форму, обратный случай — лёгкую. Равным образом и в нижних обломах следует выражать лёгкое или тяжёлое несение нагрузки сообразно степени затрачиваемой работы, которая всегда зрима.',
      },
      {
        index: 3,
        de: 'Die unendlich vielen verschiedenen Arten der Ausbildung der Gurt- und Hauptgesimse machen die Aufstellung bestimmter Regeln zur Unmöglichkeit. Grobe Fehler und Irrtümer lassen sich aber leicht vermeiden, wenn eine Grundregel beobachtet wird. Nach dieser Regel sind den Ober- und Untergliedern die gleichen Höhenmaße zu geben, wobei kleine Aenderungen dieses Verhältnisses (1 : 1) zulässig sind. Wird aber eine schwere Wirkung beabsichtigt, dann muss die grosse Platte allein das Oberglied bilden, während die Unterglieder an Wert zurückstehen.',
        ru: 'Бесконечно разнообразные способы разработки поясных и главных карнизов делают установление жёстких правил невозможным. Однако грубых ошибок и заблуждений легко избежать, если соблюдать одно основное правило. Согласно этому правилу верхним и нижним обломам следует придавать равные высотные размеры, причём допустимы небольшие отклонения от этого соотношения (1 : 1). Если же требуется тяжёлый эффект, то верхний облом должна образовывать одна крупная плита, тогда как нижние обломы отступают по своей значимости.',
      },
      {
        index: 4,
        de: 'Werden einige Proben, von dem Verhältnis 1 : 1 ausgehend, mit kleinen Bruchteilen so vorgenommen, dass die Zunahme eines Teiles die Abnahme des anderen mit sich bringt, so wird ein augenfälliger Wechsel im Ausdrucke zu bemerken sein. Die Anwendung der üblichen Maßzahlen ist in den Fassaden und Uebersichtsblättern dargestellt.',
        ru: 'Если, исходя из отношения 1 : 1, произвести несколько проб с небольшими долями так, чтобы увеличение одной части влекло за собой уменьшение другой, обнаружится наглядная перемена в выразительности. Применение обычных числовых пропорций показано на фасадах и обзорных листах.',
      },
      {
        index: 5,
        de: 'Die Gurt- und Hauptgesimse werden eingeteilt in:\n1. Gesimse mit einem Kranze allein,\n2. Gesimse mit einer oder mehreren Architravplatten unter dem Kranze,\n3. Gesimse mit Hals und Halsband unter dem Kranze,\n4. Gesimse mit Architrav, Fries und Kranz.',
        ru: 'Поясные и главные карнизы подразделяются на:\n1. карнизы с одной венчающей частью,\n2. карнизы с одной или несколькими архитравными полосами под венчающей частью,\n3. карнизы с шейкой и пояском под венчающей частью,\n4. карнизы с архитравом, фризом и венчающей частью.',
      },
      {
        index: 6,
        de: 'Streng genommen, gehört ein Halsband zum Halse; bei den Uebersichtsblättern für Gesimsformen kommt ein solches auch nur da gesondert vor, wo die leichte Ablesbarkeit der Maßzahlen dies wünschenswert machte.',
        ru: 'Строго говоря, поясок (астрагал) принадлежит к шейке; на обзорных листах карнизных форм он выделен отдельно лишь там, где этого требовала наглядность считывания числовых размеров.',
      },
      {
        index: 7,
        de: 'In den Gliedern des Kranzes kommen unzählige Abwechselungen vor. Es sei nur darauf hingewiesen, dass man von dem Verhältnisse 1 : 1 anfangend bis zu dem Verhältnisse 1 : 2 und umgekehrt gehen kann. Nur liegende Konsolen in den Untergliedern erfordern immer mehr Platz zu ihrer Entfaltung, stehende Konsolen im Fries wieder kleinere Unterglieder im Kranze, da das Deckglied derselben meist gleichlaufend mit den ersteren angeordnet wird und alles Schwerfällige die Konsole selbst in ihrer Wirkung als tragendes Motiv beeinträchtigt.',
        ru: 'В обломах венчающей части встречаются бесчисленные вариации. Укажем лишь, что, начиная от соотношения 1 : 1, можно идти вплоть до отношения 1 : 2 и обратно. Только лежачие консоли в нижних обломах требуют всё больше места для своего развёртывания, тогда как стоячие консоли во фризе требуют, напротив, более мелких нижних обломов в венчающей части, поскольку их верхняя плита большей частью располагается заподлицо (в одном ходе) с первыми и всякая тяжеловесность ослабляет действие самой консоли как несущего мотива.',
      },
      {
        index: 8,
        de: 'Die Fassaden und deren im grossen Maßstabe gezeichnete Einzelheiten auf den Uebersichtsblättern geben näheren Aufschluss über alles, was in Worten immer nur unvollkommen ausgedrückt werden kann.',
        ru: 'Фасады и вычерченные в крупном масштабе детали на обзорных листах дают более подробное разъяснение обо всём том, что словами всегда можно выразить лишь неполно.',
      },
      {
        index: 9,
        de: 'Die eingeschriebenen Verhältniszahlen dürfen freilich nicht als bindende Gesetze aufgefasst werden; sie dienen nur zur Richtschnur für den einzuschlagenden Weg, der bei dem steten Wechsel aller Nebenbedingungen zu Abweichungen führen muss, immer aber ein sicherer bleiben wird, wenn Ueberlegung und Plan ihn vorbereitet haben.',
        ru: 'Вписанные числовые соотношения, разумеется, не следует понимать как непреложные законы; они служат лишь ориентиром для выбора пути, который при постоянной смене сопутствующих условий неизбежно приводит к отступлениям, но всегда останется надёжным, если ему предшествовали обдумывание и расчёт.',
      },
      {
        index: 10,
        subheadingDe: '5. Die vertikalen Gliederungen.',
        subheadingRu: '5. Вертикальные членения.',
        de: 'Im allgemeinen können wir jeden vorspringenden Mauerteil, dessen Höhe die Breite übersteigt, zu diesen Gliederungen rechnen. Die Verstärkung der Mauer, welche im Aeusseren zur Geltung kommt, spricht grösseren Kraftaufwand aus, der mit der Zunahme des Vorsprunges wächst. Im',
        ru: 'Вообще говоря, к этим членениям мы можем отнести всякую выступающую часть стены, высота которой превышает ширину. Усиление стены, проявляющееся во внешнем облике, выражает большую затрату силы, возрастающую по мере увеличения выступа. В…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'Uebersichtsblätter',
        ru: 'обзорные листы (таблицы деталей и профилей)',
        context: 'Листы атласа с деталями карнизов в крупном масштабе и проставленными пропорциональными числами.',
      },
      {
        de: 'liegende Konsolen',
        ru: 'лежачие (горизонтальные) консоли / модульоны',
        context: 'Консоли в поддерживающей зоне венчающего карниза (под слёзной плитой), требующие высоты для развёртывания.',
      },
      {
        de: 'stehende Konsolen',
        ru: 'стоячие (вертикальные) консоли',
        context: 'Консоли, размещённые во фризе; требуют более лёгких нижних обломов карниза над ними.',
      },
      {
        de: 'die vertikalen Gliederungen',
        ru: 'вертикальные членения',
        context: 'Всякие выступающие участки стены, чья высота больше ширины, выражающие усиление несущей силы.',
      },
    ],
  },
  {
    id: 'scan-0025',
    scanNr: 25,
    pageNumber: '12',
    sectionTitleDe: '5. Die vertikalen Gliederungen.',
    sectionTitleRu: '5. Вертикальные членения.',
    imagePath: '/assets/aistudio/15-014442283_0025_view_15224e56.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0025-5',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 11 («Im / engeren Sinne…»). Раздел 5 раскрывает конструктивно-эстетическую роль вертикальных членений (усиление углов, исправление неблагоприятных пропорций фасада), противопоставляет гладкую и рустованную лизену/стенной пилон (Mauerpfeiler) ордерным колоннам и пилястрам, задаёт пределы выступа пилястра (до 1/4, обычно 1/5–1/6 ширины) и отсылает к таблицам издания (Fassadenblatt I, XXXV; Tafel 14, 15). Последнее предложение обрывается на запятой после «…kommen soll,» (продолжение на стр. 13).',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'engeren Sinne sind alle Säulen, Dreiviertelsäulen und Pilaster Gliederungen, die die Wandfläche eines oder zweier Stockwerke in vertikaler Richtung einteilen. Durch sie werden Felder geschaffen, in denen die Fenster stehen. Diese können selbständig entwickelt sein oder aber als Rundbogenfenster in innige Beziehung zu den Stützen treten. In der Vereinigung des Pilasters mit seinem Unterbau sowie dem von ihm getragenen Gebälke des Obergeschosses wirkt das Gerüst der Architektur, die strenge Strukturform auf unser Auge, die zwischenliegenden Felder werden entlastet, wirken als Füllungen und erhalten freieren Ausdruck.',
        ru: '…более узком смысле к ним относятся все колонны, трёхчетвертные колонны и пилястры — членения, которые делят стеновую плоскость одного или двух этажей в вертикальном направлении. Благодаря им образуются поля, в которых располагаются окна. Последние могут разрабатываться самостоятельно или же в виде арочных окон вступать в тесную связь с опорами. В объединении пилястра с его основанием и несомым им антаблементом верхнего этажа на наш глаз воздействует каркас архитектуры — строгая структурная форма; промежуточные же поля разгружаются, воспринимаются как заполнения и обретают более свободное выражение.',
      },
      {
        index: 2,
        de: 'Die vertikale Gliederung eines Baukörpers erfüllt somit zwei Funktionen; sie festigt scheinbar die Masse, indem sie das System der stützenden Teile schafft und verleiht der Wand als dem schwächeren Teile der Masse den Ausdruck der Sicherheit und Ruhe. Oft hat die Vertikalteilung auch die Aufgabe zu lösen, ein ungünstiges Verhältnis von Höhe und Länge, das in der Masse liegt, durch Gliederung aufzuheben oder doch weniger auffallend zu machen.',
        ru: 'Таким образом, вертикальное членение строительного объёма выполняет две функции: оно зримо укрепляет массу, создавая систему несущих частей и сообщая стене — как более слабой части массива — выражение надёжности и покоя. Нередко вертикальное деление призвано также решить задачу устранения или хотя бы смягчения неблагоприятного соотношения высоты и протяжённости, заложенного в самой массе здания.',
      },
      {
        index: 3,
        de: 'Vor allem verlangt die Ecke eines Gebäudes stets eine Betonung der vertikalen Richtung, besonders dann, wenn der Abstand von ihr bis zur ersten Fensteraxe der Axenweite selbst gleichkommt oder grösser ist, als diese. Der breite Mauerpfeiler (Lisene) befindet sich daher gewöhnlich an den Ecken und entspricht hier gewissermaßen der Wandstärke; schmälere Mauerpfeiler werden dagegen in ihrer einfachsten Ausbildung auch oft zur Einteilung der Wandfläche verwendet und bilden ein vorzügliches Mittel, um ein günstiges Verhältnis für die Zwischenfelder zu gewinnen. Die Mauerpfeiler sitzen in diesem Falle mit, besser aber ohne Verkröpfung auf dem Sockel und tragen das Gesimse, das bei freiem Dachvorsprung auch ganz wegfallen kann. Im Fassadenblatt I ist ein Beispiel für diese Lösung gegeben, die folgenden Blätter behandeln den Mauerpfeiler in seinen verschiedenartigen reicheren Ausbildungen.',
        ru: 'Прежде всего угол здания всегда требует подчёркивания вертикального направления, особенно тогда, когда расстояние от него до первой оконной оси равно самому шагу осей или превышает его. Поэтому широкий стенной столб (лопатка, лизена) обычно располагается по углам и здесь до известной степени соответствует толщине стены; напротив, более узкие лопатки в своей простейшей обработке часто применяются и для деления плоскости стены, образуя превосходное средство для получения благоприятных пропорций промежуточных полей. Лопатки в этом случае опираются на цоколь с раскреповкой — но лучше без неё — и несут карниз, который при свободном свесе крыши может и вовсе отсутствовать. На фасадном листе I дан пример такого решения, а последующие листы рассматривают стенной столб (лопатку) в его разнообразных более богатых разработках.',
      },
      {
        index: 4,
        de: 'Der glatte Mauerpfeiler wird da am Platze sein, wo es sich darum handelt, das leichte Emporstreben anzudeuten und wo nur eine bescheidene Wirkung gewünscht wird. Ist dagegen das schwerere Tragen zu versinnbildlichen und soll der Mauerpfeiler mehr in Uebereinstimmung mit der Wand oder einer reicheren Architektur in derselben gebracht werden, so wählt man gerne seine Einteilung in Schichten mit Rustiken. Die auf den Mauergrund aufgesetzte Rustika allein kann schon als Pfeiler aufgefasst werden; mit dem Vorsprunge nimmt die Kraft zu und die Pfeiler werden bei entsprechender Breite im Verein mit den Sockeln und Gesimsen zum starken Rahmen für das Bild der Fassade. Dieser Fall findet besonders im Fassadenblatte XXXV seine Erklärung.',
        ru: 'Гладкая лопатка будет уместна там, где требуется лишь намекнуть на лёгкое стремление вверх и где желателен скромный эффект. Если же необходимо символизировать более тяжёлое несение нагрузки и привести лопатку в большее согласие со стеной или с более богатой её архитектурой, то охотно избирают её членение на ряды с рустикой. Уже сама по себе рустика, наложенная на фон стены, может восприниматься как пилон; с увеличением выступа возрастает сила, и лопатки при достаточной ширине в соединении с цоколями и карнизами становятся мощным обрамлением для картины фасада. Этот случай получает особое разъяснение на фасадном листе XXXV.',
      },
      {
        index: 5,
        de: 'Der Mauerpfeiler braucht keine Fuss- und Kopfgliederung, bei der Säule und dem Pilaster spielen diese Teile aber eine grosse Rolle und von ihrer Formgebung bei fixierten Höhen der Stützen ist der harmonische Eindruck des Bildes wesentlich bedingt. Bei geringen Höhen ist nur die toskanische Säule zulässig, die korinthische ist, auch wenn eine bedeutende Höhe vorhanden ist, mit grösster Vorsicht anzuwenden, sie kommt auch meist nur bei Palastbauten vor. Das ionische Kapitäl ist — wenigstens in seiner klassischen Form — für die Halbsäulenbildung wenig geeignet.',
        ru: 'Лопатка (стенной пилон) не нуждается в базе и капители, тогда как у колонны и пилястра эти части играют огромную роль, и от их формы при заданных высотах опор существенно зависит гармоническое впечатление от всего облика. При малых высотах допустима лишь тосканская колонна; коринфскую же, даже при значительной высоте, следует применять с величайшей осторожностью — она встречается преимущественно лишь в дворцовых постройках. Ионическая капитель — по крайней мере в её классической форме — мало пригодна для полуколонн.',
      },
      {
        index: 6,
        de: 'Der Vorsprung des Pilasters ist an gewisse Grenzen gebunden, die nicht überschritten werden sollen. Das Maximum des Vorsprungs ist ¼ der Pilasterbreite; die Maße von ⅕—⅙ finden da Anwendung, wo ein leichter, gefälliger Ausdruck erzielt werden soll und die dekorative Behandlung vorherrscht.',
        ru: 'Выступ пилястра связан определёнными пределами, переступать которые не следует. Максимум выступа составляет ¼ ширины пилястра; величины от ⅕ до ⅙ применяются там, где требуется лёгкое, изящное выражение и преобладает декоративная трактовка.',
      },
      {
        index: 7,
        de: 'Die Höhen der Fuss- und Kopfgliederung (Basis und Kapitäl) werden je nach der betreffenden Säulenordnung, die angewendet wird, bestimmt. Für die Renaissance gelten andere Regeln als in bezug auf die antiken Ordnungen; daher ist auch ein Blatt mit den Kapitälformen dieser Stilrichtung in Tafel 15 gegeben. Ebenso gestatten die meisten Basenformen auf Tafel 14 auch ihre Benutzung bei Renaissancepilastern und Säulen.',
        ru: 'Высоты подножного и венчающего членений (базы и капители) определяются в зависимости от применяемого ордера. Для эпохи Возрождения действуют иные правила, нежели в отношении античных ордеров; поэтому в таблице 15 дан отдельный лист с формами капителей этого стилевого направления. Равным образом большинство форм баз на таблице 14 допускает их использование также при ренессансных пилястрах и колоннах.',
      },
      {
        index: 8,
        de: 'Der Pilaster ist immer weniger breit, als der Mauerpfeiler, da die Säulenordnungen seine Breite nach der gegebenen Höhe regeln und er mehr dekorativ zu wirken hat, als letzterer. Indess kann auch der Fall eintreten, dass an einer Ecke eine grössere Kraft zum Ausdruck kommen soll,',
        ru: 'Пилястр всегда уже стенного пилона (лопатки), поскольку ордера регулируют его ширину сообразно заданной высоте и ему надлежит действовать более декоративно, нежели последнему. Впрочем, может возникнуть и такой случай, когда на углу требуется выразить большую силу…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'der Mauerpfeiler (die Lisene)',
        ru: 'стенной столб / лопатка (лизена)',
        context: 'Безбазовый и бескапительный вертикальный выступ (гладкий или рустованный), укрепляющий углы и делящий плоскость стены.',
      },
      {
        de: 'die Dreiviertelsäule / Halbsäule',
        ru: 'трёхчетвертная колонна / полуколонна',
        context: 'Пристенные ордерные опоры; для полуколонн ионическая капитель в классическом виде признаётся малопригодной.',
      },
      {
        de: 'der Vorsprung des Pilasters',
        ru: 'вынос (выступ) пилястра из плоскости стены',
        context: 'Нормативный предел: максимум ¼ ширины пилястра; ⅕–⅙ для лёгкой декоративной трактовки.',
      },
      {
        de: 'Fuss- und Kopfgliederung (Basis und Kapitäl)',
        ru: 'база и капитель',
        context: 'Обязательные членения колонны и пилястра, определяемые применяемым ордером (античным или ренессансным, табл. 14–15).',
      },
    ],
  },
  {
    id: 'scan-0026',
    scanNr: 26,
    pageNumber: '13',
    sectionTitleDe: '5. Die vertikalen Gliederungen. · 6. Die Risalite.',
    sectionTitleRu: '5. Вертикальные членения. · 6. Ризалиты.',
    imagePath: '/assets/aistudio/15-014442283_0026_view_052b6e01.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0026-1',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 12 о парных угловых пилястрах («…dass an einer Ecke eine grössere Kraft zum Ausdruck kommen soll, / für die der Mauerpfeiler…»); в 6–7-й строках оригинала присутствует типографская диттография «Fuss- und / und Kopfglied» (в расшифровке исправлено на «Fuss- und Kopfglied»). Далее рассматриваются рустованный пилястр, ордерное обрамление окон, выбор между трёхчетвертной (3/4, 2/3) и полуколонной, каннелирование (Kanellierung) и поэтажное сочетание ордеров. Внизу страницы открывается раздел «6. Die Risalite.»; последнее предложение обрывается на запятой после «…und seine Formen,» (продолжение на стр. 14).',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'für die der Mauerpfeiler in den Obergeschossen zu derb und schwer, der einzelne Pilaster aber zu zart sein würde. Zwei Pilaster, enge zusammengerückt (gekuppelte Pilaster), werden hier den beabsichtigten Zweck in der besten Form erfüllen. Dabei ist zu beachten, dass der Zwischenraum meist kleiner genommen wird, als die Pilasterbreite, doch darf er auch nicht zu gering sein, da sonst die Kapitäle zusammenstossen würden. In den Fassadenblättern XXIV und XXXI kommen solche Ecklösungen vor, die Fassade XIII veranschaulicht den seltenen Fall, dass das letzte Fuss- und Kopfglied bei kleinem Zwischenraume für beide Pilaster gemeinsam durchläuft.',
        ru: '…для которой стенная лопатка в верхних этажах была бы слишком грубой и тяжёлой, а одиночный пилястр — слишком хрупким. Два сдвинутых вплотную пилястра (спаренные пилястры) здесь наилучшим образом исполнят намеченную цель. При этом следует учитывать, что промежуток между ними обычно делается меньше ширины пилястра, но он не должен быть и слишком малым, иначе капители столкнулись бы друг с другом. На фасадных листах XXIV и XXXI встречаются подобные угловые решения, а фасад XIII иллюстрирует редкий случай, когда крайний облом базы и капители при малом просвете проходит общим для обоих пилястров.',
      },
      {
        index: 2,
        de: 'Der rusticierte Pilaster wird im Erdgeschosse angewendet. Schwerer und gedrungener als der glatte Pilaster wird er, wenn die nötige Höhe verfügbar ist, zu einem trefflichen Ausdrucksmittel bei einem massigen Unterbau, der gleichwohl eine starke Höhengliederung erhalten soll.',
        ru: 'Рустованный пилястр применяется в первом этаже. Более тяжёлый и приземистый, чем гладкий пилястр, он — если располагает необходимой высотой — становится превосходным выразительным средством при массивном основании, которое тем не менее должно получить сильное вертикальное членение.',
      },
      {
        index: 3,
        de: 'Ist der durch ein ganzes Stockwerk reichende Pilaster schon weniger konstruktiv, als der Mauerpfeiler, so verliert er den konstruktiven Charakter ganz, sobald die Pilaster als Einfassung des Fensters auftreten. Alsdann ruht der Pilaster auf einem Postamente, der Brüstung, die in diesem Falle meist durchlaufend angeordnet wird, und trägt ein Gebälk (die Verdachung) mit selbständigem Abschluss, der gerade sein kann oder um die Selbständigkeit des Bauteils noch schärfer auszusprechen, mit einem Giebel versehen wird.',
        ru: 'Если пилястр, проходящий через весь этаж, уже менее конструктивен, чем стенная лопатка, то он вовсе утрачивает конструктивный характер, как только пилястры выступают в качестве обрамления окна. Тогда пилястр опирается на постамент — подоконный парапет, который в этом случае обычно устраивается сплошным, — и несёт антаблемент (сандрик) с самостоятельным завершением, которое может быть прямым или, дабы ещё резче подчеркнуть самостоятельность этой части, снабжается фронтоном.',
      },
      {
        index: 4,
        de: 'Die um ¾ oder ⅔ des Durchmessers vorspringende Säule ist der Halbsäule vorzuziehen, da diese zu wenig Relief hat und daher weichlich und ausdruckslos in der Schattenwirkung bleibt. Wird als Stützenform für die Einrahmung eines Fensters eine Dreiviertelsäule angewendet, so ist das Fenster als Rundbogenfenster auszubilden. Ein mit geradem Sturz geschlossenes Fenster erhält meist nur den ¼ seiner Breite vorspringenden Pilaster zur seitlichen Einrahmung, da er seiner scharfen Kanten wegen vorteilhafter als die Halbsäule wirkt. Für Säulen wie Pilaster ist die Kanellierung des Schaftes ein treffliches Mittel, die Höhenrichtung noch mehr hervorzuheben. Der Kern der Stützenform wird freilich dadurch geschwächt, weshalb die Kanellierung nur vorsichtig zu handhaben und nur bei starken Pilastern, die eine Verringerung ihres Volumens gut vertragen können, anzuraten ist.',
        ru: 'Колонна, выступающая из стены на ¾ или ⅔ своего диаметра, предпочтительнее полуколонны, так как последняя обладает слишком малым рельефом и потому остаётся вялой и невыразительной в светотеневой игре. Если в качестве опоры для обрамления окна применяется трёхчетвертная колонна, то окно следует решать как арочное. Окно с прямой перемычкой обычно получает для бокового обрамления лишь пилястр, выступающий на ¼ своей ширины, так как благодаря острым граням он действует выгоднее полуколонны. Как для колонн, так и для пилястров каннелирование ствола служит превосходным средством ещё сильнее подчеркнуть вертикальное направление. Правда, ядро опоры при этом ослабляется, отчего каннелюрами следует пользоваться осторожно и рекомендовать их лишь для мощных пилястров, способных без ущерба выдержать уменьшение своего объёма.',
      },
      {
        index: 5,
        de: 'Die Stütze sichert jedem Bauteile, an dem sie vorkommt, eine lebendigere Wirkung; der Eingang eines Gebäudes wird daher in einer Säulen- oder Pilasterstellung meist den passendsten Schmuck finden.',
        ru: 'Опора обеспечивает каждой части постройки, в которой она встречается, более живое звучание; поэтому вход в здание чаще всего находит наиболее подобающее украшение в колоннаде или пилястровом портике.',
      },
      {
        index: 6,
        de: 'Ermüdend wirkt ein Stützensystem, wenn es gleichmäßig in zwei aufeinander folgenden Geschossen ohne wesentliche Unterschiede in den Höhen wiederkehrt; zwei Pilasterreihen werden nur bei starker Abwechslung von Grösse und Form erträglich. Kann man an Stelle der einen Pilasterreihe nicht eine Säulenreihe wählen, so ist es geratener, auf diese Art der Gliederung ganz zu verzichten.',
        ru: 'Утомительное впечатление производит система опор, если она равномерно повторяется в двух смежных этажах без существенных различий в высотах; два яруса пилястр терпимы лишь при сильном разнообразии масштаба и формы. Если вместо одного из рядов пилястр нельзя избрать ряд колонн, разумнее вовсе отказаться от такого рода членения.',
      },
      {
        index: 7,
        de: 'Auch die Anordnung einer Pilasterreihe im obersten Geschosse allein, ohne Stützen in den darunterliegenden Geschossen, ist kein glückliches Mittel, dieser Partie zu leichterem Ausdruck zu verhelfen, schon aus dem Grunde nicht, weil das unmittelbar darauf lastende Hauptgesimse stets höher sein wird, als die betreffende Säulenordnung vorschreibt.',
        ru: 'Равным образом устройство ряда пилястр в одном лишь верхнем этаже, без опор в нижележащих этажах, не является удачным средством придать этой части более лёгкую выразительность — уже по той причине, что непосредственно опирающийся на них главный карниз всегда будет выше, чем предписывает соответствующий ордер.',
      },
      {
        index: 8,
        subheadingDe: '6. Die Risalite.',
        subheadingRu: '6. Ризалиты.',
        de: 'Risalite sind selbständige, der Hauptmasse eines Gebäudes vorgeschobene Teile oder Partien desselben. Man unterscheidet Mittel- und Seitenrisalite, die für sich allein oder im Verein angeordnet werden können. Die zurückstehenden Bauteile heissen Rücklagen. Durch die Risalite erhält der Bau in erster Linie Abwechslung, gewinnt aber auch an Kraft und bringt die bedeutenderen Innenräume im Aeusseren zur Geltung. Der Risalit steht mit seiner Masse dem Auge näher als die Hauptmasse des Baues. Die Konstruktion erfordert ihn gewöhnlich nicht; ist er aber aus Schönheitsrücksichten angeordnet, so wirkt er auf die Konstruktion zurück und seine Formen,',
        ru: 'Ризалиты суть самостоятельные, выдвинутые вперёд перед главной массой здания его части или участки. Различают центральные (средние) и боковые ризалиты, которые могут располагаться порознь или в сочетании друг с другом. Отступающие назад части здания называются западающими частями (Rücklagen). Благодаря ризалитам постройка прежде всего обретает разнообразие, но также выигрывает в мощи и выявляет во внешнем облике более значительные внутренние помещения. Ризалит своей массой стоит ближе к глазу, чем главная масса здания. Конструкция обычно не требует его; но если он устроен из эстетических соображений, то оказывает обратное воздействие на конструкцию, и его формы…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'gekuppelte Pilaster',
        ru: 'спаренные пилястры',
        context: 'Два сближенных угловых пилястра (табл. XXIV, XXXI, XIII); просвет меньше ширины пилястра, но достаточен, чтобы капители не сталкивались.',
      },
      {
        de: 'der rusticierte Pilaster',
        ru: 'рустованный пилястр',
        context: 'Применяется в массивном первом этаже для сочетания тяжеловесности основания с сильной вертикальной разбивкой.',
      },
      {
        de: 'die Kanellierung',
        ru: 'каннелирование (устройство каннелюр)',
        context: 'Вертикальные желобки на стволе колонны или мощного пилястра, усиливающие стремление вверх, но ослабляющие массив опоры.',
      },
      {
        de: 'Mittel- und Seitenrisalite / Rücklagen',
        ru: 'центральный и боковые ризалиты / западающие участки фасада',
        context: 'Выдвинутые и углублённые объёмы фасада, выявляющие парадные внутренние помещения и обогащающие пластику здания.',
      },
    ],
  },
  {
    id: 'scan-0027',
    scanNr: 27,
    pageNumber: '14',
    sectionTitleDe: '6. Die Risalite. · 7. Die Anordnung der Fassade als Ganzes. (a)',
    sectionTitleRu: '6. Ризалиты. · 7. Композиция фасада как целого (a).',
    imagePath: '/assets/aistudio/15-014442283_0027_view_8eb9894a.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0027-7',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 13 («…und seine Formen, / namentlich die Fenster…»). Формулируются два главных правила соподчинения ризалитов и западающих частей (единство горизонтальных тяг и швов; не меньшая архитектурная насыщенность ризалита, кроме случая флангов у центрального зала) и закон нечётности групп (3, 5, 7). С 5-го абзаца открывается раздел «7. Die Anordnung der Fassade als Ganzes.» с подразделом «a) Allgemeine Grundsätze» (без точки в оригинале). Сохранены формы «Strassenfronte», «Hausthüre», «Maßzahlen». Последнее предложение обрывается на «…beim bürgerlichen» (продолжение на стр. 15).',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'namentlich die Fenster mit ihren Verdachungen, werden vor den zurückliegenden Teilen der Fassade ausgezeichnet.',
        ru: '…в особенности окна с их сандриками, выделяются перед отступающими назад частями фасада.',
      },
      {
        index: 2,
        de: 'Eine Regel ist für den Risalit unter allen Verhältnissen festzuhalten: die wesentlichen Gliederungen, die Gesimse, die Fensterbrüstungen, sowie die Fugen haben mit denen der Rücklagen in Uebereinstimmung zu bleiben, da im gegenteiligen Falle die Wirkung eine unruhige wird und den Eindruck des Losgelöstseins hervorruft. Als zweite Regel gilt, dass die Architektur des Risalites mindestens gleichwertig mit den Bauformen der Rücklagen ist.',
        ru: 'Одно правило следует соблюдать для ризалита при любых условиях: основные членения — карнизы, подоконные пояса и швы кладки — должны оставаться в согласии с таковыми же у западающих частей, ибо в противном случае впечатление становится беспокойным и порождает ощущение оторванности. Вторым правилом является то, что архитектура ризалита должна быть по меньшей мере равноценна формам западающих частей.',
      },
      {
        index: 3,
        de: 'Eine Ausnahme von dieser Regel, also eine reichere Architektur der Rücklage erscheint nur in dem Falle berechtigt, wenn die Mittelpartie eines freistehenden Wohnhauses mit den bedeutenderen Innenräumen von zwei Seitenrisaliten flankiert wird. Da die Fensteröffnungen in einem Risalite bei einer richtigen Anordnung des Grundrisses für sich allein in Betracht kommen, stört es den einheitlichen Charakter einer Fassade nicht, wenn die Fenster rundbogig geschlossen sind, während die Fenster der Rücklagen den geraden Sturz erhalten, und ebenso umgekehrt.',
        ru: 'Исключение из этого правила, то есть более богатая архитектура западающей части, представляется оправданным лишь в том случае, когда центральная часть отдельно стоящего жилого дома с наиболее значительными внутренними помещениями фланкируется двумя боковыми ризалитами. Поскольку оконные проёмы в ризалите при правильном решении плана рассматриваются сами по себе, единства характера фасада не нарушает, если окна ризалита завершены полуциркульной аркой, тогда как окна западающих частей имеют прямую перемычку, — и наоборот.',
      },
      {
        index: 4,
        de: 'Dass bei den Gruppen stets eine ungerade Anzahl festgehalten werden muss, ergiebt sich von selbst, da die Mittelgruppe zur Einheit wird und aus der symmetrischen Anlage die Dreizahl, Fünfzahl oder Siebenzahl folgt.',
        ru: 'То, что в группировках всегда должно соблюдаться нечётное число элементов, вытекает само собой, поскольку центральная группа образует смысловую единицу, а из симметричного построения следуют тройственность, пятичастность или семичастность.',
      },
      {
        index: 5,
        subheadingDe: '7. Die Anordnung der Fassade als Ganzes.',
        subheadingRu: '7. Композиция фасада как целого.',
        subsubheadingDe: 'a) Allgemeine Grundsätze',
        subsubheadingRu: 'a) Общие принципы',
        de: 'Aehnliche Grundsätze, wie sie bei der Gestaltung der Teile maßgebend sind, gelten auch bei ihrer Vereinigung zu einem Ganzen. Das feste Gefüge der Masse soll vor allem wahrnehmbar sein, ebenso muss aber die Harmonie der Verhältnisse, der Einklang der Teile mit dem Ganzen wohlgefällig empfunden werden.',
        ru: 'Сходные принципы, определяющие оформление отдельных частей, действуют и при их объединении в целое. Прежде всего должна ощущаться прочная спаянность массы, но равным образом должна приятно восприниматься гармония пропорций — созвучие частей целому.',
      },
      {
        index: 6,
        de: 'Das Quadrat und der Würfel stellen in ihrer starren Gleichmäßigkeit die leblosesten Formen vor, die wir uns denken können. Ihr Formgesetz ist bei der Wandfläche ebenso unzuträglich, wie bei einem freistehenden Baukörper; auf die Fassade übertragen heisst das: gleiche Hauptmaße von Länge und Höhe sind zu vermeiden.',
        ru: 'Квадрат и куб в своей застылой равномерности являют собой самые безжизненные формы, какие только можно вообразить. Их формообразующий закон столь же непригоден для плоскости стены, сколь и для свободно стоящего строительного объёма; в применении к фасаду это означает: одинаковых главных размеров длины и высоты следует избегать.',
      },
      {
        index: 7,
        de: 'Dass das liegende Rechteck beim freistehenden Wohnhause von geringer Höhe dem stehenden vorgezogen werden muss, liegt ebenso nahe, wie der umgekehrte Fall beim eingebauten Stadthause mit mehreren Geschossen.',
        ru: 'То, что у отдельно стоящего жилого дома небольшой высоты лежачий прямоугольник должен предпочитаться стоячему, столь же очевидно, как и обратный случай у встроенного в ряд застройки многоэтажного городского дома.',
      },
      {
        index: 8,
        de: 'Unter den Fällen, wo in einer Strassenfronte 3, 4, 5, 6, 7 oder 8 Fenster Platz finden, sind immer diejenigen mit ungerader Anzahl vorzuziehen; das am häufigsten vorkommende Beispiel mit fünf Fensteraxen ist wohl auch das Ideal eines einfachen Wohnhauses.',
        ru: 'Среди случаев, когда на уличном фасаде размещаются 3, 4, 5, 6, 7 или 8 окон, всегда предпочтительнее варианты с нечётным числом; наиболее часто встречающийся пример с пятью оконными осями является, пожалуй, и идеалом простого жилого дома.',
      },
      {
        index: 9,
        de: 'Für die Anlage der Thüröffnung bleibt nur die Wahl zwischen der Mittelaxe und (beim eingebauten Wohnhause) einer der beiden Seiten.',
        ru: 'Для размещения дверного проёма остаётся лишь выбор между центральной осью и (у встроенного жилого дома) одной из двух сторон.',
      },
      {
        index: 10,
        de: 'Die Symmetrie verlangt die Hausthüre im Mittel des Gebäudes; — damit ist eine ungerade Anzahl der Axen vorgeschrieben, von der man beim freistehenden Wohnhause selten abweicht. Ist die Hausthüre beim eingebauten Wohnhause an einer der beiden Seiten, so stört eine gerade Anzahl der Axen ebensowenig wie eine ungerade. Im ersten Falle wird das Auge vom Mittel abgelenkt, im zweiten Falle stimmt die Fensteraxe mit der Symmetrieaxe der Fassade überein, und die Ruhe der Mittelpartie kann nur angenehm wirken.',
        ru: 'Симметрия требует размещения входной двери по центру здания — тем самым предписывается нечётное число осей, от которого у отдельно стоящего жилого дома отступают редко. Если же у встроенного городского дома входная дверь находится с одной из двух сторон, то чётное число осей мешает столь же мало, как и нечётное. В первом случае глаз отводится от середины, во втором — оконная ось совпадает с осью симметрии фасада, и покой центральной части может производить лишь благоприятное впечатление.',
      },
      {
        index: 11,
        de: 'Beim freistehenden Wohnhause macht man den Eckpfeiler gleich dem Zwischenpfeiler, oder auch grösser als diesen; beim eingebauten Wohnhause wird der am Ende befindliche Pfeiler gleich der lichten Fensterbreite oder kleiner als diese angeordnet.',
        ru: 'В отдельно стоящем жилом доме угловой простенок делают равным межоконному или шире его; во встроенном городском доме крайний простенок назначают равным ширине окна в свету или меньше её.',
      },
      {
        index: 12,
        de: 'Hinzuweisen ist ferner darauf, dass der Abstand von der Oberkante des lichten Fensters bis zur Oberkante des Hauptgesimses von wesentlichem Einfluss auf die Wirkung einer Fassade ist. Man kann die allgemeine Regel aufstellen: je mehr dieser Abstand innerhalb gewisser Grenzen zunimmt, desto günstiger wird das Verhältnis. Fasst man die kleinen Maßzahlen beim bürgerlichen',
        ru: 'Следует далее указать, что расстояние от верхнего края окна в свету до верхнего обреза главного карниза оказывает существенное влияние на впечатление от фасада. Можно установить общее правило: чем больше это расстояние возрастает в известных пределах, тем благоприятнее становится пропорция. Если взять малые размеры при городском…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'das liegende / stehende Rechteck',
        ru: 'лежачий / стоячий прямоугольник фасада',
        context: 'Предпочитаемая общая пропорция фасада (вместо безжизненного квадрата): горизонтальная для особняка, вертикальная для многоэтажного рядного дома.',
      },
      {
        de: 'die fünf Fensteraxen',
        ru: 'пятиосевой фасад',
        context: 'Считается классическим идеалом простого жилого дома с центральной входной дверью.',
      },
      {
        de: 'eingebautes Wohnhaus (Stadthaus)',
        ru: 'встроенный в рядовую застройку городской дом',
        context: 'В отличие от особняка допускает боковое расположение входа, чётное число осей и узкий крайний простенок (≤ ширины окна).',
      },
      {
        de: 'Abstand Oberkante Fenster bis Oberkante Hauptgesims',
        ru: 'высота надпроёмной зоны от верха окна до верха главного карниза',
        context: 'Чем значительнее эта верхняя зона (в разумных пределах), тем благороднее пропорции фасада.',
      },
    ],
  },
  {
    id: 'scan-0028',
    scanNr: 28,
    pageNumber: '15',
    sectionTitleDe: '7. Die Anordnung der Fassade als Ganzes. · b) Gebäude mit ununterbrochen durchlaufender Strassenflucht.',
    sectionTitleRu: '7. Композиция фасада как целого. · b) Здания с непрерывно тянущейся уличной линией (сплошная застройка).',
    imagePath: '/assets/aistudio/15-014442283_0028_view_f3076a4c.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0028-3',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первый абзац завершает фразу со стр. 14 («…beim bürgerlichen / Wohnhause allein ins Auge…»). Вводится геометрическое соотношение M (расстояние от угла до крайнего окна) и N (расстояние от верха окна до верха главного карниза), проиллюстрированное на чертеже Fig. 7 (M = N и случай M > N с угловым пилоном и выравнивающими размерами a и b), а также правило нечётного числа угловых рустов (Eckarmierung). Во второй половине страницы начинается подраздел «b) Gebäude mit ununterbrochen durchlaufender Strassenflucht.». Последняя строка обрывается на переносе «…auf einen Wohn-» (продолжение на стр. 16).',
    figures: [
      {
        label: 'Fig. 7.',
        captionDe: 'Verhältnis des Eckabstandes M zur oberen Wandhöhe N (links: M = N mit 5-teiliger Eckarmierung; rechts: M > N mit Eckpilaster und Ausgleichsmaßen a, b)',
        captionRu: 'Чертёж 7: соотношение углового отступа M и верхней высоты N (слева: M = N с пятирядной угловой перевязкой квадров; справа: M > N с расчленением угловой пилястрой и сближением размеров a и b)',
      },
    ],
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'Wohnhause allein ins Auge, so lässt sich auch eine Beziehung zwischen diesem Abstande und der Entfernung des letzten Fensters von der Hausecke finden.',
        ru: '…жилом доме взять в расчёт лишь эти малые величины, то можно установить также соотношение между указанным расстоянием и удалением крайнего окна от угла здания.',
      },
      {
        index: 2,
        de: 'Entweder wird (Fig. 7)\n1. M = N,\n2. M kleiner als N,\n3. M grösser als N,',
        ru: 'Возможны три случая (Fig. 7):\n1. M = N,\n2. M меньше N,\n3. M больше N,',
      },
      {
        index: 3,
        de: 'Die beiden ersten Fälle erfüllen unsere Ansprüche vollkommen, erscheinen daher als gute Lösungen. Der dritte Fall dagegen befriedigt nicht in demselben Maße, da wir einen zu grossen Mauerkörper an der Seite erblicken, der uns unmotiviert erscheint. Wird dieser Mauerkörper jedoch gegliedert, sei es durch einen Pfeiler oder durch Doppelpilaster, so wird, je mehr sich das Maß a dem Maße b nähert, die schlechte Wirkung verringert und kann zum Schlusse ganz aufgehoben werden.',
        ru: 'Первые два случая вполне отвечают нашим требованиям и потому предстают удачными решениями. Третий же случай не удовлетворяет в той же мере, поскольку мы видим сбоку слишком широкий стеновой массив, кажущийся нам немотивированным. Однако если этот массив расчленить — столбом или спаренными пилястрами, — то по мере приближения размера a к размеру b дурное впечатление ослабевает и в конечном счёте может быть полностью устранено.',
      },
      {
        index: 4,
        de: 'Die Eckarmierung mit kurzen und langen Quadern geschieht am besten in ungerader Anzahl, und zwar so, dass mit langen Quadern begonnen und geschlossen wird. Alle andern Lösungen sind mehr oder weniger mangelhaft.',
        ru: 'Угловую перевязку из коротких и длинных квадров лучше всего выполнять в нечётном числе рядов, а именно так, чтобы начинать и заканчивать длинными квадрами. Все иные решения более или менее несовершенны.',
      },
      {
        index: 5,
        de: 'Die volle Rustika des Erdgeschosses macht eine Ausnahme; die gleichartige Masse sowie der vorspringende Sockel, der in seiner Dreiteilung auch Rustikaschichten erhalten kann, gewähren in allen Fällen ihrer Geschlossenheit wegen das Gefühl der Stabilität.',
        ru: 'Сплошная рустика первого этажа составляет исключение: однородная масса, равно как и выступающий цоколь, который при своём трёхчастном строении также может получать ряды рустики, во всех случаях благодаря своей замкнутости дают чувство устойчивости.',
      },
      {
        index: 6,
        subsubheadingDe: 'b) Gebäude mit ununterbrochen durchlaufender Strassenflucht.',
        subsubheadingRu: 'b) Здания с непрерывно тянущейся уличной линией (сплошная застройка).',
        de: 'Gebäude mit langen Fronten und vielen Axen erscheinen schon an sich als eine ruhige Masse; der Eindruck der Festigkeit wird durch die horizontale Lagerung verstärkt. Eine Hausfront mit nur drei oder vier Axen ist bei geringen Axenweiten zur Entwicklung einer wirkungsvollen Architektur weit weniger geeignet; sie ist freilich nicht selten durch die Umstände bedingt. Schlichtheit der Schmuckformen ist dann mehr am Platze als eine ausgeprägte Horizontalgliederung. Bei den Ansprüchen, die meist an die Ausnützung des Bauplatzes erhoben werden, kommt das liegende Rechteck selten in Frage, da es nur geringe Höhenentwicklung zulässt; das stehende Rechteck mit grösserer Höhenentwicklung bildet bei dem eingebauten Stadthause die Regel. Das Vorwiegen der Höhe bedingt dann auch die Gliederung der Fläche in gleichem Sinne.',
        ru: 'Здания с протяжёнными фасадами и многими осями уже сами по себе предстают как спокойная масса; впечатление прочности усиливается горизонтальным строем. Фасад же всего с тремя или четырьмя осями при малом шаге осей гораздо менее пригоден для развёртывания выразительной архитектуры, хотя нередко и вынуждается обстоятельствами. Скромность декоративных форм тогда уместнее, чем ярко выраженное горизонтальное членение. При требованиях, обычно предъявляемых к использованию участка застройки, лежачий прямоугольник редко принимается во внимание, так как допускает лишь незначительное развитие в высоту; стоячий прямоугольник с большим высотным развитием составляет у встроенного городского дома правило. Преобладание высоты в свою очередь обусловливает и членение плоскости в том же направлении.',
      },
      {
        index: 7,
        de: 'Um bei einer Strassenfront mit vier Axen den langweiligen Eindruck abzuschwächen, ist es ratsam, die beiden Fenster im Mittel näher zusammenzurücken oder zu einer grossen Fensterpartie zu vereinigen, sodass eine Gruppierung zur Dreizahl bewirkt wird. Bei sechs Axen Strassenfront ist eine Gruppenbildung mit ungeraden Teilen viel leichter zu erreichen, indem man je zwei Fenster eine Gruppe bilden lässt; diese Lösung ist auch konstruktiv die richtigste, wenn auf einen Wohn-',
        ru: 'Чтобы смягчить скучное впечатление при уличном фасаде в четыре оси, целесообразно сдвинуть оба средних окна ближе друг к другу или объединить их в одну крупную оконную группу так, чтобы возникла трёхосевая группировка. При шести осях уличного фасада группировка с нечётным числом частей достигается намного легче, если объединять окна попарно в три группы; такое решение также конструктивно наиболее верно, когда на жилое…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'M und N (Eckabstand vs. obere Wandhöhe)',
        ru: 'M и N (угловой отступ и высота над окнами)',
        context: 'Благоприятные случаи: M = N или M < N; при M > N необходима вертикальная разбивка углового простенка (a ≈ b).',
      },
      {
        de: 'die Eckarmierung',
        ru: 'угловая перевязка (квадровая рустовка угла)',
        context: 'Чередование длинных и коротких квадров в нечётном количестве, начиная и кончая длинным камнем.',
      },
      {
        de: 'durchlaufende Strassenflucht',
        ru: 'непрерывная линия уличной застройки (красная линия)',
        context: 'Условия встроенного городского дома, где преобладает стоячий прямоугольник и группировка 4 или 6 осей в 3 группы.',
      },
    ],
  },
  {
    id: 'scan-0029',
    scanNr: 29,
    pageNumber: '16',
    sectionTitleDe: '7. Die Anordnung der Fassade als Ganzes. · b) Gebäude mit ununterbrochen durchlaufender Strassenflucht.',
    sectionTitleRu: '7. Композиция фасада как целого. · b) Здания с непрерывно тянущейся уличной линией (сплошная застройка).',
    imagePath: '/assets/aistudio/15-014442283_0029_view_54141c85.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0029-1',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает фразу со стр. 15 («…wenn auf einen Wohn- / raum je zwei Fenster fallen.»). Разбираются восьми-, девяти- и десятиосевые фасады без ризалитов, после чего формулируются числовые нормы высот горизонтальных членений фасада в долях общей высоты здания (Gesammthöhe) и высоты этажа (Geschosshöhe): цоколь (1/6, обычно 1/7–1/10), главный карниз (1/8–1/12 для двухэтажного, 1/12–1/15 для многоэтажного; при одном венчающем карнизе 1/15–1/16 и 1/16–1/20 со ссылкой на Fig. 8) и междуэтажный поясной карниз (1/6–1/12 высоты этажа), а также условия пропуска сплошных подоконных тяг. Сохранены формы 1895 г. «Gesammthöhe», «selbstständigen», «mäßige», «gewissermaßen». Последняя строка обрывается на слове «wesentlich» (продолжение на стр. 17).',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'raum je zwei Fenster fallen. Acht Axen geben in der Halbierung die gerade Zahl 4, mit einer Gruppierung ist somit nichts gewonnen, da immer ein Pfeiler ins Mittel zu stehen kommt. Bei dem Umstande aber, dass die Zahl 8 nicht sofort ins Auge fällt, werden gleiche Axenweiten auch die gerade Zahl nicht als eine Härte empfinden lassen. Eine bessere Einteilung erzielt man jedoch, wenn man drei Mittelfenster als Doppelfenster anordnet, links und rechts bleibt dann je ein Fenster nach einem breiteren Zwischenpfeiler, der auch konstruktiv begründet sein kann.',
        ru: '…помещение приходится по два окна. Восемь осей при делении пополам дают чётное число 4, и простым спариванием здесь ничего не достигается, так как в центр всегда попадает простенок. Впрочем, в силу того обстоятельства, что число 8 не сразу бросается в глаза, равные шаги осей не дадут ощутить чётное число как жёсткость. Однако лучшая разбивка достигается в том случае, если три центральных окна устроить как сдвоенные окна, а слева и справа останется по одному окну за более широким межоконным простенком, который может быть обоснован и конструктивно.',
      },
      {
        index: 2,
        de: 'Aehnliche Lösungen sind auch bei Fassaden mit 9 und 10 Fensteraxen zu empfehlen, wenn man auf die Anordnung von Risaliten verzichten muss.',
        ru: 'Сходные решения можно рекомендовать и для фасадов с 9 и 10 оконными осями, если приходится отказываться от устройства ризалитов.',
      },
      {
        index: 3,
        de: 'Bei den vielen Variationen, die die Anordnung einer zweigeschossigen Fronte mit fünf Axen, welche wir als die meist vorkommende bezeichnet haben, zulässt, müssen wir uns auf die Erörterung der die allgemeine Regel bildenden Anordnung beschränken.',
        ru: 'При множестве вариаций, которые допускает композиция двухэтажного фасада с пятью осями — названного нами наиболее распространённым, — мы вынуждены ограничиться рассмотрением расположения, составляющего общее правило.',
      },
      {
        index: 4,
        de: 'Nachdem der Grundriss und der Höhenschnitt bestimmt und damit die Axenweiten sowie die Fussbodenhöhen und der Abschluss des Hauptgesimses festgestellt sind, können die lichten Oeffnungen der Fenster aufgetragen werden, und es bleibt nun zunächst zu überlegen, wie die horizontalen Gesimse anzuordnen sind.',
        ru: 'После того как определены план и высотный разрез и тем самым установлены шаги осей, а также отметки полов и завершение главного карниза, можно наносить светлые проёмы окон, и далее остаётся прежде всего продумать расположение горизонтальных карнизов.',
      },
      {
        index: 5,
        de: 'Die beste Dimension für einen Sockel, sei derselbe einteilig oder dreiteilig gegliedert, wird ⅙ der Gesammthöhe sein, doch finden die Höhen von 1/7 bis 1/10 am häufigsten Anwendung; ihn noch kleiner zu bilden, würde ein Fehler sein, da ein Gebäude mit zu kleinem Sockel die Empfindung der mangelnden Festigkeit erweckt und zu sehr im Boden verschwindet. Wenn dem Sockel die erforderliche Höhe nicht gegeben werden kann, so ist der oft gewählte Ausweg der beste, nämlich das ganze Erdgeschoss zur Sockelbildung herbeizuziehen.',
        ru: 'Наилучшим размером для цоколя — будь он цельным или трёхчастным — будет ⅙ общей высоты здания, однако чаще всего находят применение высоты от 1/7 до 1/10; делать его ещё меньше было бы ошибкой, так как здание со слишком низким цоколем вызывает ощущение недостаточной прочности и чрезмерно «уходит» в землю. Если цоколю нельзя придать требуемую высоту, лучшим является часто избираемый выход — привлечь к образованию цокольного яруса весь первый этаж.',
      },
      {
        index: 6,
        de: 'Das Hauptgesimse, d. h. nicht der Kranz allein, sondern die Höhe desselben mit dem Friese und Architrav oder Hals und Halsband zusammen, muss kleiner werden, als der Sockel; beim Wohnhause mit zwei Geschossen, ⅛ bis 1/12, beim Wohnhause mit mehreren Geschossen 1/12 bis 1/15 der Gesammthöhe. Ist nur eine geringe Höhe erreichbar, so wird das Hauptgesimse lediglich als Kranz ausgebildet. Das Verhältnis des Kranzes zur Höhe ist dann bei einem Wohnhaus mit zwei Geschossen 1/15 bis 1/16, bei einem Stadthaus mit mehreren Geschossen 1/16 bis 1/20 der Höhe, von der Bodenfläche bis zur Oberkante des Hauptgesimses gerechnet (Fig. 8).',
        ru: 'Главный карниз — то есть не одна лишь венчающая часть, а её высота вместе с фризом и архитравом либо с шейкой и пояском — должен быть меньше цоколя: в жилом доме с двумя этажами 1/8–1/12, в жилом доме с несколькими этажами 1/12–1/15 общей высоты. Если достижима лишь небольшая высота, главный карниз выполняется в виде одной венчающей части. Отношение венчающей части к высоте в этом случае составляет в двухэтажном жилом доме 1/15–1/16, а в многоэтажном городском доме 1/16–1/20 высоты, считая от уровня земли до верхнего обреза главного карниза (Fig. 8).',
      },
      {
        index: 7,
        de: 'Das Gurtgesimse wird nach der grösseren oder geringeren Höhe der darunter liegenden Teile der Fassade bemessen; es kann auch zum Sohlbankgesimse werden, wenn es in dem Teile über den Fenstern des Erdgeschosses bis zum Fussboden des zweiten Geschosses keinen Platz zur selbstständigen Entwicklung findet. Man kann dafür ⅙ bis 1/12 der Geschosshöhe annehmen. Doch ist als Regel festzuhalten, dass es kleiner als das Hauptgesimse, ferner kleiner als der Sockel erscheinen, dabei auch nur mäßige Ausladung besitzen soll. In dem Falle, dass im Erdgeschosse eine Säulen- oder Pilasterstellung vorkommt, muss es in dem richtigen Verhältnisse zu dieser ausgebildet sein, darf aber doch nicht das Hauptgesimse an Bedeutung überragen. Geringere Höhen als die angeführten werden je nach Umständen berechtigt sein, so z. B. wenn das Erdgeschoss schlicht und anspruchslos behandelt ist.',
        ru: 'Междуэтажный (поясной) карниз назначается сообразно большей или меньшей высоте лежащих под ним частей фасада; он может также превратиться в подоконный карниз, если в простенке над окнами первого этажа до пола второго этажа не находит места для самостоятельного развития. Для него можно принимать от 1/6 до 1/12 высоты этажа. При этом следует твёрдо держаться правила, что он должен выглядеть меньше главного карниза и меньше цоколя, обладая к тому же лишь умеренным выносом. В том случае, если в первом этаже имеется колоннада или ряд пилястр, поясной карниз должен быть разработан в верном соотношении с ними, но всё же не должен превосходить по значимости главный карниз. Меньшие высоты, чем указанные, будут оправданны по обстоятельствам — например, когда первый этаж решён просто и скромно.',
      },
      {
        index: 8,
        de: 'Die Sohlbank lässt man mitunter durchlaufen; doch ist dies nicht immer wünschenswert, da ein Zuviel von horizontalen Abteilungen eher Unruhe als Klarheit in die Wandfläche bringt, zumal wenn die Geschosse geringe Höhen haben, die Masse also von den Sohlbänken gewissermaßen eingeschnürt werden würde. Der Zweck, die horizontale Bindung zu betonen, kann ebenso gut durch schlichte Fugenteilung erzielt werden, doch soll sie sich immer auf ein Fussprofil, wenn dieses auch nur bandartig ausgebildet ist, aufstützen. Wenn jedes Geschoss der Fassade als ein Ganzes für sich aufgefasst werden soll, muss immer ein Fuss, wenn er auch noch so klein ist, das Lasten eines Stockwerkes auf der darunter liegenden Masse zum Ausdruck bringen.',
        ru: 'Подоконную тягу иногда пропускают сплошной лентой; однако это не всегда желательно, поскольку избыток горизонтальных членений вносит в плоскость стены скорее беспокойство, нежели ясность, особенно при небольшой высоте этажей, когда масса оказалась бы как бы перетянутой подоконными полками. Цель — подчеркнуть горизонтальную связь — столь же успешно достигается простой разрезкой швами (рустовкой), однако и она всегда должна опираться на базовый профиль, хотя бы в виде узкого пояска. Если каждый этаж фасада должен восприниматься как самостоятельное целое, то всякий раз база — сколь бы малой она ни была — должна выражать опирание этажа на лежащую ниже массу.',
      },
      {
        index: 9,
        de: 'Was nun die vertikale Gliederung der Fassade anlangt, so ist schon oben darauf hingewiesen worden, dass die Einfassungen und Umrahmungen der Fenster zur Schönheit wesentlich',
        ru: 'Что же касается вертикального членения фасада, то выше уже было указано, что обрамления и наличники окон существенно способствуют красоте…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die Gesammthöhe (Sockelanteil)',
        ru: 'общая высота здания (доля цоколя)',
        context: 'Идеальная высота цоколя — 1/6 общей высоты, чаще всего применяется 1/7–1/10; при невозможности — весь первый этаж трактуется как цоколь.',
      },
      {
        de: 'Hauptgesims-Verhältnisse',
        ru: 'пропорции главного карниза',
        context: 'Полный антаблемент меньше цоколя: 1/8–1/12 (2 этажа) или 1/12–1/15 (многоэтажный); один венчающий карниз: 1/15–1/16 и 1/16–1/20.',
      },
      {
        de: 'Gurt- / Sohlbankgesimse',
        ru: 'междуэтажный / подоконный карниз',
        context: 'Высота 1/6–1/12 высоты этажа; должен уступать по величине и главному карнизу, и цоколю.',
      },
      {
        de: 'Fugenteilung / Fussprofil',
        ru: 'шовное членение (рустовка) / базовый профиль этажа',
        context: 'Позволяет связать этаж горизонтально без перетягивания стены сплошными подоконниками, сохраняя ощущение опоры.',
      },
    ],
  },
  {
    id: 'scan-0030',
    scanNr: 30,
    pageNumber: '17',
    sectionTitleDe: '7. Die Anordnung der Fassade als Ganzes. · b) Durchlaufende Strassenflucht / c) Mittelrisalit und zwei Rücklagen.',
    sectionTitleRu: '7. Композиция фасада как целого. · b) Сплошная застройка / c) Центральный ризалит и два западающих крыла.',
    imagePath: '/assets/aistudio/15-014442283_0030_view_35c54e43.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0030-1',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает фразу со стр. 16 («…zur Schönheit wesentlich / beitragen.»). Даны точные пропорции ширины оконного наличника (1/6–1/5) и подоконника (1/7–1/8 проёма в свету), а также правила согласования рустовочных швов (Fugenteilung) с горизонтальными тягами и карнизами, нечётного числа слоёв кладки и высоты квадрового ряда (30–40 см, 7–8 рядов на высоту окна). В середину страницы включён двойной чертёж Fig. 8 со шкалой 0–10 м (схема пропорций слева с условием n > m и метрический разбор фасада справа: 1.20 / 3.40 / 4.00 / 1.00 м). Внизу начинается подраздел c) и стоит сигнатура тетради «3»; текст обрывается на словах «Bei der» (переход на стр. 18). Сохранены авторская пунктуация (в т. ч. отсутствие запятой перед «wonach») и формы «Maß», «ergibt», «Aenderungen», «Fussgliedes».',
    figures: [
      {
        label: 'Fig. 8.',
        captionDe: 'Proportionalschema (links: Eckenabstand 4/5, Axen 1., Fenster 3:5 u. 1:2, Geschosszonen 3. u. 4., n > m, Sockel 1/8., Kranz 1/10.) und metrische Fassadenausbildung (rechts: 1.20 / 3.40 / 4.00 / 1.00 m; Maßstab 0–10 MET.)',
        captionRu: 'Чертёж 8: слева — схема пропорций фасада (угловой простенок 4/5, окна 3:5 и 1:2, ярусы 3 и 4, условие n > m, цоколь 1/8, главный карниз 1/10); справа — метрическая разбивка (1,20 / 3,40 / 4,00 / 1,00 м) со шкалой 0–10 м',
      },
    ],
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'beitragen. Im zweiten Geschosse werden deshalb struktive Formen in der Dreiteilung von Postament, Rumpf und Kopf anzuwenden sein.',
        ru: '…способствуют красоте. Во втором этаже поэтому следует применять конструктивно выраженные формы в трёхчастном делении на постамент, тело (ствол) и завершение.',
      },
      {
        index: 2,
        de: 'Die Umrahmung eines Fensters wird mit ⅙ bis ⅕ der lichten Breite bemessen. Die Höhe der Sohlbank kann zwar das gleiche Maß erhalten, wird aber meist geringer und zwar zu 1/7 bis 1/8 der lichten Fensterbreite angenommen. Wird die Sohlbank zum durchlaufenden Sohlbankgesimse, so ist ihre Höhe nach dem darunter liegenden Teile abzustimmen und wird die Rahmenbreite meist übersteigen.',
        ru: 'Обрамление (наличник) окна назначается шириной от ⅙ до ⅕ его ширины в свету. Высота подоконной плиты может хотя и получать тот же размер, но обычно принимается меньше, а именно от 1/7 до 1/8 ширины окна в свету. Если подоконник превращается в сплошной подоконный карниз, то его высота согласуется с лежащей под ним частью стены и обычно превышает ширину наличника.',
      },
      {
        index: 3,
        de: 'Wird die Wandfläche durch Fugenteilung belebt, so gilt als Regel, dass die Fugen mit der Oberkante des Rahmens stimmen oder doch einem Gliede der Verdachung in der horizontalen Richtung folgen. Die Unterbrechung der horizontalen Lagerung würde den konstruktiven Charakter der Fassade beeinträchtigen, weshalb die Fugen unbedingt in Einklang mit einem Gesimselement stehen müssen, am besten mit einem solchen, das einen wichtigen Abschnitt kennzeichnet. Zu beachten ist ferner der Grundsatz, dass eine ungerade Anzahl der Schichten einer geraden vorzuziehen ist; eine gerade Zahl wird man nur dann wählen, wenn eine unvermeidliche Quaderhöhe dies nicht anders zulässt.',
        ru: 'Если плоскость стены оживляется шовным членением (рустовкой), действует правило: швы должны совпадать с верхним обрезом оконного наличника или же следовать в горизонтальном направлении за одним из обломов сандрика. Прерывание горизонтальной порядовки нанесло бы ущерб конструктивному характеру фасада, вследствие чего швы непременно должны быть согласованы с каким-либо элементом карниза — лучше всего с таким, который отмечает важный рубеж членения. Кроме того, следует соблюдать принцип, что нечётное число слоёв кладки предпочтительнее чётного; чётное число выбирают лишь тогда, когда неизбежная высота квадров не допускает иного решения.',
      },
      {
        index: 4,
        de: 'Die Höhe einer Quaderschicht beträgt nicht viel unter 30 und nicht viel über 40 cm bei einfachen Bauausführungen wonach 7 bis 8 Schichten auf die Fensterhöhe treffen werden.',
        ru: 'Высота одного ряда квадровой кладки в простых постройках составляет не намного меньше 30 и не намного больше 40 см, вследствие чего на высоту окна будет приходиться от 7 до 8 рядов.',
      },
      {
        index: 5,
        de: 'Eine geschlossene Fugenteilung erfordert oft kleine Aenderungen in den unwesentlichen Teilen. Meist wird man durch die Einfügung eines grösseren oder kleineren Fussgliedes den Ausgleich finden können und nicht nötig haben, die wesentlichen Teile, Brüstungshöhe und Rahmenbreite, anzutasten. Das Haupt-, Brust- und Sockelgesimse darf ihretwegen nicht angegriffen werden; die Unterkanten und Oberkanten der Gesimse müssen unverrückt bleiben, da das Verwerfen eines Teiles eine Umarbeitung des anderen im Gefolge hat.',
        ru: 'Замкнутое шовное членение часто требует небольших поправок во второстепенных частях. В большинстве случаев удаётся достичь выравнивания введением более крупного или более мелкого базового профиля, не прибегая к изменению существенных величин — высоты подоконной части и ширины наличника. Главный, подоконный и цокольный карнизы не должны из-за этого затрагиваться; нижние и верхние обрезные линии карнизов должны оставаться незыблемыми, так как смещение одной части влечёт за собой переработку другой.',
      },
      {
        index: 6,
        subsubheadingDe: 'c) Gebäude mit einem Mittelrisalit und zwei Rücklagen.',
        subsubheadingRu: 'c) Здания с одним центральным ризалитом и двумя западающими крыльями.',
        de: 'Die Dreiteilung ergibt sich hier von selbst, da Rücklage — Mittelrisalit — Rücklage nebeneinander stehen, die Mitte also ohne weiteres durch eine gegebene Masse betont ist. Bei der',
        ru: 'Трёхчастность возникает здесь сама собой, поскольку западающее крыло — центральный ризалит — западающее крыло располагаются рядом друг с другом, и середина тем самым непосредственно акцентируется заданной массой. При…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'struktive Formen (Postament, Rumpf, Kopf)',
        ru: 'тектонические формы (постамент, тело, завершение)',
        context: 'Трёхчастная тектоническая структура оформления окон и простенков второго этажа.',
      },
      {
        de: 'das Sohlbankgesimse',
        ru: 'сплошной подоконный карниз',
        context: 'В отличие от индивидуального подоконника (1/7–1/8 ширины окна) согласуется по высоте с нижним ярусом и превышает ширину наличника.',
      },
      {
        de: 'die Quaderschicht',
        ru: 'ряд квадровой кладки (руста)',
        context: 'Типовая высота 30–40 см (7–8 рядов на окно); предпочтительно нечётное число рядов, с привязкой швов к верхнему обрезу наличника или сандрику.',
      },
      {
        de: 'Mittelrisalit und Rücklagen',
        ru: 'центральный ризалит и западающие крылья',
        context: 'Естественная трёхчастная композиция фасада, автоматически выделяющая центральную ось объёмом.',
      },
    ],
  },
  {
    id: 'scan-0031',
    scanNr: 31,
    pageNumber: '18',
    sectionTitleDe: '7. Die Anordnung der Fassade als Ganzes. · c) Mittelrisalit und zwei Rücklagen / d) Zwei Seitenrisalite und eine Rücklage.',
    sectionTitleRu: '7. Композиция фасада как целого. · c) Центральный ризалит и два крыла / d) Два боковых ризалита и западающая средняя часть.',
    imagePath: '/assets/aistudio/15-014442283_0031_view_5054e3f5.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0031-7',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает фразу со стр. 17 («Bei der / Gliederung des Risalites…»). Рассматривается чётное и нечётное число осей в центральном ризалите и крыльях, недопустимость постановки одиночного пилястра на центральной оси между парами окон («Missgriff»), альтернатива в виде филёнки (Füllungstafel) или ниши, а также три соотношения ширины центрального ризалита и западающих крыльев (включая оптическое выделение ризалита фронтоном при равной ширине). Далее начинается подраздел d) о фасаде с двумя боковыми ризалитами; последняя строка обрывается на словах «…so ist» (переход на стр. 19). Сохранены формы 1895 г. «Gesammtverhältnis», «Breitenmaß», «giebt», «Thür/Thüre», «schmäler».',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'Gliederung des Risalites ist vor allem darauf zu halten, dass er einen einheitlichen, geschlossenen Eindruck macht. Ein grosses Fenster oder ein gekuppeltes Fenster ist deshalb für ihn passender, als zwei Fenster. Meist werden im Risalite drei Fenster angeordnet; in den Rücklagen wird auch die ungerade Zahl stets besser wirken, als die gerade, obwohl die letztere nicht unbedingt zu verwerfen ist, zumal wenn sie durch den Grundriss bedingt wird. Man lässt dann die Fensteraxen, um die Zweiteilung weniger fühlbar werden zu lassen, näher zusammenrücken. Dass ein Zwischenpfeiler in der Rücklage nicht breiter gemacht werden darf, als der Eckpfeiler, ist selbstverständlich.',
        ru: '…расчленении ризалита прежде всего следует заботиться о том, чтобы он производил цельное, замкнутое впечатление. Поэтому для него одно крупное или сдвоенное окно уместнее, чем два отдельных окна. Чаще всего в ризалите располагают три окна; в западающих крыльях нечётное число также всегда действует лучше чётного, хотя последнее и не следует безоговорочно отвергать, особенно если оно обусловлено планом. В таком случае оконные оси сдвигают ближе друг к другу, чтобы сделать раздвоение менее ощутимым. Само собой разумеется, что промежуточный простенок в западающем крыле не должен делаться шире углового столба.',
      },
      {
        index: 2,
        de: 'Bei einem Mittelrisalit mit drei Fenstern ist die Axe durch das mittlere Fenster scharf betont. Wird statt dessen im Erdgeschosse eine Thür angeordnet, so erhöht sich die Wirkung, da das Auge dadurch noch entschiedener auf die Hauptaxe hingezogen wird. Erhält ein Mittelrisalit zwei oder vier Fenster, einem oder zwei Innenräumen entsprechend, so wird die Anlage einer Thüre im Erdgeschosse oder auf einer Terrasse die Symmetrie stören und praktische Nachteile mit sich bringen. Man wird daher die Thür an anderer Stelle anordnen müssen. Damit die Hauptaxe nicht verloren geht, hilft man sich wohl durch Anordnung eines Pilasters zwischen den beiden Fensterpaaren. Das ist aber ein entschiedener Missgriff, vor dem nicht genug gewarnt werden kann. Breitspurig, hart und vereinsamt steht der Pilaster gerade an der Stelle im Wege, wo das Auge ungehindert fortgleiten möchte, und macht den Beschauer darauf aufmerksam, dass hier etwas nicht in Ordnung ist. Ein anderer Notbehelf ist die Anbringung einer Füllungstafel oder Nischenöffnung, wodurch der Uebelstand zwar gemildert, aber doch nicht beseitigt wird.',
        ru: 'При центральном ризалите с тремя окнами ось резко акцентируется средним окном. Если вместо него в первом этаже устраивается дверь, эффект усиливается, так как взгляд ещё решительнее притягивается к главной оси. Если же центральный ризалит получает два или четыре окна — соответственно одному или двум внутренним помещениям, — то устройство двери в первом этаже или со стороны террасы нарушит симметрию и принесёт практические неудобства. Поэтому дверь придётся разместить в другом месте. Чтобы главная ось не потерялась, порой прибегают к постановке пилястра между двумя парами окон. Однако это явный промах, от которого нельзя не предостеречь со всей решительностью. Размашисто, жёстко и одиноко стоит такой пилястр как раз там, где взгляд хотел бы беспрепятственно скользить дальше, и обращает внимание зрителя на то, что здесь что-то неладно. Другой паллиатив — устройство декоративной филёнки или ниши, что хотя и смягчает изъян, но всё же не устраняет его.',
      },
      {
        index: 3,
        de: 'Bei einem Gebäude mit einem Mittelrisalite sind zwei Fälle in Hinsicht auf das Gesammtverhältnis zu unterscheiden.\n1. Der Risalit ist grösser (breiter) als eine Rücklage.\n2. Der Risalit ist kleiner (schmäler) als eine Rücklage.',
        ru: 'В здании с одним центральным ризалитом по отношению к общей композиции следует различать два случая:\n1. Ризалит больше (шире) западающего крыла.\n2. Ризалит меньше (у́же) западающего крыла.',
      },
      {
        index: 4,
        de: 'Der breite Mittelrisalit wirkt massiger und schwerer, der schmale Mittelrisalit dagegen leichter und gefälliger und kann selbst den Eindruck hervorrufen, dass er nur zum Schmucke, zur Erhöhung des malerischen Reizes der Fassade angebracht ist. Ein breiter Mittelrisalit wird sich auf jeden Fall der Architektur besser anpassen lassen, als ein schmaler, dessen geringe Fläche die volle Entfaltung der architektonischen Mittel nicht zulässt.',
        ru: 'Широкий центральный ризалит действует более массивно и тяжело, узкий же центральный ризалит, напротив, выглядит легче и изящнее и может даже производить впечатление, будто он добавлен лишь ради украшения, для усиления живописной привлекательности фасада. Во всяком случае широкий центральный ризалит лучше поддаётся архитектурной разработке, чем узкий, малая плоскость которого не позволяет в полной мере развернуть архитектурные средства.',
      },
      {
        index: 5,
        de: 'Ausser diesen beiden Möglichkeiten giebt es allerdings noch eine dritte, nämlich die, dass Risalit und Rücklage das gleiche Breitenmaß erhalten. Dieser Fall wird oft durch den Grundriss bedingt. Es wird dann Sorge des Technikers sein müssen, den Risalit vor den Rücklagen besonders auszuzeichnen, z. B. durch einen flachen oder steilen Giebel, so dass er sich als die grössere Masse darstellt, sei es auch nur auf Grund der optischen Täuschung, die in der Architektur überhaupt eine grosse Rolle spielt. Im allgemeinen soll jedoch der Unterschied zwischen Risalit und Rücklage ein auffallender sein.',
        ru: 'Помимо этих двух возможностей существует, правда, и третья, а именно та, при которой ризалит и западающее крыло получают одинаковую ширину. Этот случай часто диктуется планом. Тогда заботой зодчего должно стать особое выделение ризалита перед крыльями — например, с помощью пологого или крутого фронтона, чтобы он представал как более крупная масса, пусть даже за счёт оптической иллюзии, вообще играющей в архитектуре большую роль. В целом же различие между ризалитом и западающим крылом должно быть заметным.',
      },
      {
        index: 6,
        subsubheadingDe: 'd) Gebäude mit zwei Seitenrisaliten und einer Rücklage.',
        subsubheadingRu: 'd) Здания с двумя боковыми ризалитами и одной западающей средней частью.',
        de: 'In diesem Falle ist die Rücklage, da sie das Mittelstück bildet und als die Hauptsache erscheinen muss, stets grösser als ein Risalit zu nehmen; die gegenteilige Anordnung giebt der Rücklage den Charakter des Beengten und macht den Eindruck, als ob der rückspringende Mittelteil durch die schweren Seitenmassen zusammengedrückt wäre.',
        ru: 'В этом случае западающую часть, поскольку она образует центральное звено и должна восприниматься как главное, следует всегда принимать большей, чем отдельный ризалит; противоположное решение придаёт западающей части характер стеснённости и создаёт впечатление, будто отступающая середина сдавлена тяжёлыми боковыми массами.',
      },
      {
        index: 7,
        de: 'Hier gilt wieder für die Rücklage die Regel der ungeraden Fensterzahl, kann aber freilich nicht immer eingehalten werden. Die Anordnung von nur zwei Fenstern ist ganz zu verwerfen; vier Fenster geben schon ein erträgliches Bild, bei sechs Fenstern fällt der Mangel der Gruppierung nicht mehr so stark ins Auge, wie das schon weiter oben bemerkt wurde.',
        ru: 'Здесь для западающей средней части вновь действует правило нечётного числа окон, которое, впрочем, не всегда может быть соблюдено. Расположение всего двух окон следует полностью отвергнуть; четыре окна дают уже сносную картину, а при шести окнах отсутствие группировки уже не столь резко бросается в глаза, как было отмечено выше.',
      },
      {
        index: 8,
        de: 'Die Seitenrisalite als vorspringende Teile, deren Axe gewahrt werden soll, erhalten je ein zweiteiliges oder ein dreiteiliges Fenster; schreibt der Grundriss zwei isolierte Fenster vor, so ist',
        ru: 'Боковые ризалиты как выступающие части, ось которых должна сохраняться, получают по одному двухчастному или трёхчастному окну; если же план предписывает два раздельных окна, то…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'die Füllungstafel / Nischenöffnung',
        ru: 'декоративная филёнка / ниша',
        context: 'Паллиативные способы заполнения центральной оси чётного ризалита (менее ошибочные, чем одиночный пилястр между парами окон).',
      },
      {
        de: 'die optische Täuschung',
        ru: 'оптическая иллюзия (зрительное увеличение массы)',
        context: 'Эффект выделения центрального ризалита пологой или крутой фронтонной верхушкой при равной ширине с крыльями.',
      },
      {
        de: 'der Seitenrisalit (und rückspringender Mittelteil)',
        ru: 'боковой ризалит (и западающая средняя часть)',
        context: 'Схема трёхчастного фасада с двумя фланговыми выступами, требующая преобладания центральной западающей части над каждым из боковых ризалитов.',
      },
    ],
  },
  {
    id: 'scan-0032',
    scanNr: 32,
    pageNumber: '19',
    sectionTitleDe: '7. Die Anordnung der Fassade als Ganzes. · d) Zwei Seitenrisalite und eine Rücklage (Fünfteilung).',
    sectionTitleRu: '7. Композиция фасада как целого. · d) Два боковых ризалита и протяжённые пятичастные фасады.',
    imagePath: '/assets/aistudio/15-014442283_0032_view_93909032.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0032-3',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает фразу со стр. 18 («…schreibt der Grundriss zwei isolierte Fenster vor, so ist / deren Axenweite…»). Рассматривается завершение боковых ризалитов (жёлоб как венчающий облом, фронтон и аттик) и даются правила пятичастного членения протяжённых городских фасадов (два боковых ризалита, две западающие части и центральный ризалит), проиллюстрированные плановой схемой Fig. 9 в трёх пропорциональных вариантах (½–1–1–1–½, 1½–3–4–3–1½ и 2–4–3–4–2). В правом нижнем углу стоит сигнатура «3*». Сохранены оригинальные орфографические варианты «gleichmäßig», «zweckmäßigste», «maßgebend», «Selbständigkeit», «indes». Стр. 19 завершается точкой без переноса фразы.',
    figures: [
      {
        label: 'Fig. 9.',
        captionDe: 'Drei Proportionsschemata der Fünfteilung (Seitenrisalit — Rücklage — Mittelrisalit — Rücklage — Seitenrisalit): 1) ½ : 1 : 1 : 1 : ½; 2) 1½ : 3 : 4 : 3 : 1½; 3) 2 : 4 : 3 : 4 : 2.',
        captionRu: 'Чертёж 9: три схемы пятичастного членения фасада (боковой ризалит — крыло — центральный ризалит — крыло — боковой ризалит): 1) ½ : 1 : 1 : 1 : ½; 2) 1½ : 3 : 4 : 3 : 1½; 3) 2 : 4 : 3 : 4 : 2',
      },
    ],
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'deren Axenweite so zu bestimmen, dass der Zwischenpfeiler kleiner als der Eckpfeiler oder höchstens diesem gleich wird.',
        ru: '…их шаг осей следует определять так, чтобы промежуточный простенок был меньше углового столба или в крайнем случае равен ему.',
      },
      {
        index: 2,
        de: 'Alle Seitenrisalite mit nur geringem Vorsprung und mit gleichmäßig durchgeführtem Hauptgesimse erhalten ihren oberen Abschluss oft lediglich durch eine als krönendes Glied ausgebildete Rinne. Der flache wie der steile Giebel sind vorzügliche Mittel, um die Selbständigkeit der vorgeschobenen Masse zu betonen; weniger geeignet sind hierzu die Attikakrönungen, wenn sie beim Risalit allein auftreten. Läuft die Attika über den ganzen Bau hin, so muss sie schwerer bei den Risaliten, leichter, gefälliger bei der Rücklage gehalten sein. Nebenbei bemerkt ist die Attika, abgesehen von den Uebelständen, die sich bei der Dachkonstruktion ergeben, für das einfache bürgerliche Wohnhaus ein zu kostspieliger Luxus; das grössere Stadthaus mit breit angelegten Massen wird sie indes nicht immer entbehren können, da sie das wirksamste Mittel ist, um die architektonischen Formen eines Bauwerkes nach oben ausklingen zu lassen.',
        ru: 'Все боковые ризалиты с лишь незначительным выносом и равномерно проведённым главным карнизом часто получают своё верхнее завершение просто в виде водосточного жёлоба, оформленного как венчающий облом. Как пологий, так и крутой фронтон служат превосходным средством подчеркнуть самостоятельность выдвинутой вперёд массы; менее пригодны для этого аттиковые венчания, если они появляются только над ризалитом. Если же аттик тянется по всему зданию, он должен быть решён более тяжело над ризалитами и более легко, изящно — над западающей частью. Кстати говоря, аттик — не считая неудобств, возникающих для конструкции крыши, — для простого бюргерского жилого дома является слишком дорогостоящей роскошью; однако крупный городской дом с широко развёрнутыми массами не всегда сможет обойтись без него, так как он представляет собой самое действенное средство для того, чтобы дать архитектурным формам сооружения прозвучать в завершающем верхнем аккорде.',
      },
      {
        index: 3,
        de: 'Bei Stadthäusern mit ungewöhnlich langer Front wird man mit der Gliederung zu drei Gruppen nicht mehr auskommen. Statt ihrer wird die Einteilung in fünf Gruppen, — ein Mittelrisalit, zwei Rücklagen und zwei Seitenrisalite — die zweckmäßigste und gefälligste sein. Für diese Fünfteilung (Fig. 9) sind folgende Regeln maßgebend:\n1. Der Mittelrisalit muss grösser sein, als ein Seitenrisalit.\n2. Ein Seitenrisalit muss kleiner sein, als eine Rücklage.\n3. Der Mittelrisalit muss die wirksamsten Bauformen erhalten.',
        ru: 'У городских домов с необычайно протяжённым фасадом трёхчастной группировки оказывается уже недостаточно. Вместо неё наиболее целесообразным и приятным для глаза будет деление на пять групп — один центральный ризалит, два западающих крыла и два боковых ризалита. Для такого пятичастного деления (Fig. 9) действуют следующие правила:\n1. Центральный ризалит должен быть больше бокового ризалита.\n2. Боковой ризалит должен быть меньше западающего крыла.\n3. Центральный ризалит должен получать наиболее выразительные архитектурные формы.',
      },
      {
        index: 4,
        de: 'Die Rücklage kann ebensogut gleich dem Mittelrisalit wie kleiner oder grösser als dieser angeordnet werden, soll aber mindestens doppelt so gross sein als der Seitenrisalit.',
        ru: 'Западающее крыло может быть устроено как равным центральному ризалиту, так и меньшим или большим его, однако должно быть по меньшей мере вдвое больше бокового ризалита.',
      },
      {
        index: 5,
        de: 'Im Mittelrisalite muss die Fensteranzahl stets eine ungerade sein. Die Rücklage bleibt untergeordnet, kann daher eine gerade Anzahl der Fenster erhalten, eine ungerade erhöht aber immer ihre Wirkung.',
        ru: 'В центральном ризалите число окон всегда должно быть нечётным. Западающее крыло остаётся подчинённой частью и потому может получать чётное число окон, хотя нечётное всегда усиливает его выразительность.',
      },
      {
        index: 6,
        de: 'Die beste Lösung wird die sein, nach welcher der Mittelrisalit grösser als eine Rücklage ist. Gestattet der Grundriss dies nicht, so muss der grössere Wert des Risalites durch die vertikale Gliederung besonders hervorgehoben werden.',
        ru: 'Наилучшим решением будет такое, при котором центральный ризалит больше западающего крыла. Если план этого не позволяет, более высокое значение ризалита должно быть особо подчёркнуто вертикальным членением.',
      },
    ],
    terms: [
      {
        de: 'die Attikakrönung / Attika',
        ru: 'аттиковое венчание / аттик',
        context: 'Дорогостоящее завершение крупного городского дома; при проходе через весь фасад утяжеляется над ризалитами и облегчается над крыльями.',
      },
      {
        de: 'die Rinne (als krönendes Glied)',
        ru: 'водосточный жёлоб (как венчающий облом)',
        context: 'Лаконичное завершение слабо выступающих боковых ризалитов со сплошным главным карнизом.',
      },
      {
        de: 'die Fünfteilung (Fig. 9)',
        ru: 'пятичастная композиция фасада',
        context: 'Схема протяжённого фасада: боковой ризалит < ½ западающего крыла, центральный ризалит > бокового ризалита и с главным акцентом декора.',
      },
    ],
  },
  {
    id: 'scan-0033',
    scanNr: 33,
    pageNumber: '20',
    sectionTitleDe: '7. Die Anordnung der Fassade als Ganzes. · Die siebenteilige Front (Schluss).',
    sectionTitleRu: '7. Композиция фасада как целого. · Семичастный фасад (завершение раздела).',
    imagePath: '/assets/aistudio/15-014442283_0033_view_df6c2427.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0033-9',
    institution: 'Deutsches Museum',
    editorialNote:
      'Заключительная страница подраздела 7 и первой главы («I. Das Wesen der äusseren Bauformen.») с типографской разделительной линейкой под последним абзацем. Завершает правила соотношения ширины боковых ризалитов к центральному (не более 2/3, при уменьшении — до 1/2–1/3) и вводит правила семичастного фасада («siebenteilige Front», Fig. 10) для крупных строительных комплексов, где центральный ризалит сам получает трёхчастную композицию. В тексте 3-го абзаца воспроизведена авторская отсылка без точки «(Fig 10).», в подписи под схемой — «Fig. 10.»; в схеме отмечены доли 1 ½ — 3 — 5 — 3 — 1 ½ (внутреннее подразделение центрального ризалита: 1 — 2 — 1). Сохранена форма «Maßes».',
    figures: [
      {
        label: 'Fig. 10.',
        captionDe: 'Schema der siebenteiligen Front: Hauptgliederung 1 ½ : 3 : 5 : 3 : 1 ½ mit dreiteiliger Untergliederung des Mittelrisalites (1 : 2 : 1).',
        captionRu: 'Чертёж 10: схема семичастного фасада с основной разбивкой 1 ½ : 3 : 5 : 3 : 1 ½ и трёхчастным внутренним членением центрального ризалита (1 : 2 : 1)',
      },
    ],
    paragraphs: [
      {
        index: 1,
        de: 'In den Seitenrisaliten ist die Architektur zwar bedeutender als die der Rücklagen zu halten, doch soll sie im Vergleich mit dem Mittelrisalit zum Schwächeren abgestimmt sein.',
        ru: 'В боковых ризалитах архитектуру следует хотя и выдерживать значительнее, чем в западающих крыльях, однако по сравнению с центральным ризалитом её должно приводить к более сдержанному звучанию.',
      },
      {
        index: 2,
        de: 'Die Breite der Seitenrisalite darf nicht mehr als ⅔ des Mittelrisalites betragen. Eine Verringerung dieses Maßes auf ½ bis ⅓ kann stattfinden, wenn das Innere und Aeussere es verlangt und die Architektur in Harmonie mit den übrigen Teilen der Fassade gebracht wird.',
        ru: 'Ширина боковых ризалитов не должна превышать ⅔ ширины центрального ризалита. Уменьшение этого размера до ½–⅓ допустимо в том случае, если этого требуют внутренняя планировка и внешний облик и если архитектура приведена в гармонию с остальными частями фасада.',
      },
      {
        index: 3,
        de: 'Die siebenteilige Front, wie sie nur bei grossen Gebäudekomplexen vorkommt, wo zwei oder drei gesonderte Häuser als ein einheitliches Ganzes erscheinen sollen, ist nach denselben Grundsätzen zu behandeln (Fig 10). Der Mittelrisalit erscheint dabei als eine in sich geschlossene Einheit in dreiteiliger Gruppierung:\n2 Seitenrisalite und eine Rücklage\noder 1 Mittelrisalit und 2 Rücklagen.',
        ru: 'Семичастный фасад, встречающийся лишь у крупных строительных комплексов, где два или три отдельных дома должны представать как единое целое, надлежит решать по тем же основным принципам (Fig. 10). При этом центральный ризалит выступает как замкнутая внутри себя единица с трёхчастной группировкой:\n2 боковых ризалита и одна западающая средняя часть\nили 1 центральный ризалит и 2 западающих крыла.',
      },
      {
        index: 4,
        de: 'Das erstere ist vorzuziehen, nur muss auf eine ungerade Fensteranzahl Bedacht genommen werden.',
        ru: 'Первому варианту следует отдавать предпочтение, нужно лишь позаботиться о нечётном числе окон.',
      },
      {
        index: 5,
        de: 'Die Gruppierung des Mittelrisalites kann so vorgenommen werden, dass die Seitenrisalite desselben gleich gross wie die Seitenrisalite des ganzen Gebäudes oder auch grösser oder kleiner als diese gemacht werden. Stets aber muss die Architektur der drei Gruppen des Mittelrisalites den einheitlichen Charakter streng festhalten und die Rücklage darf in diesem Falle nicht geringer an Wert erscheinen.',
        ru: 'Группировку центрального ризалита можно осуществить так, что его собственные боковые ризалиты будут сделаны равными по величине боковым ризалитам всего здания либо больше или меньше них. Однако во всех случаях архитектура трёх групп центрального ризалита должна строго сохранять единый характер, и западающая часть при этом не должна казаться менее ценной.',
      },
    ],
    terms: [
      {
        de: 'Breitenverhältnis der Seitenrisalite (≤ ⅔)',
        ru: 'допустимая ширина бокового ризалита (не более ⅔)',
        context: 'Отношение ширины бокового ризалита к центральному при пятичастной композиции; при необходимости может снижаться до ½–⅓.',
      },
      {
        de: 'die siebenteilige Front (Fig. 10)',
        ru: 'семичастный фасад',
        context: 'Композиция крупных ансамблей из 2–3 объединённых корпусов, где сам центральный ризалит получает трёхчастную разбивку (предпочтительно: 2 подризалита и 1 западающий центр).',
      },
    ],
  },
  {
    id: 'scan-0034',
    scanNr: 34,
    pageNumber: '21',
    sectionTitleDe: 'BEMERKUNGEN ZU DEN TAFELN. · Tafel 1–15 / Tafel 17–20 / Taf. 21–62.',
    sectionTitleRu: 'ПРИМЕЧАНИЯ К ТАБЛИЦАМ. · Табл. 1–15 / Табл. 17–20 / Табл. 21–62.',
    imagePath: '/assets/aistudio/15-014442283_0034_view_361a5a55.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0034-5',
    institution: 'Deutsches Museum',
    editorialNote:
      'Шмуцтитульное начало нового раздела «BEMERKUNGEN ZU DEN TAFELN.» — верхний колонтитул с номером страницы [21] опущен. Автор поясняет методический смысл обмеров и пропорций на таблицах (как ориентиров, а не догм) и даёт обзор состава атласа: Табл. 1–15 (отдельные архитектурные детали: цокольные, подоконные и главные карнизы, окна и двери с рустикой и без неё, постаменты, базы и капители пилястр эпохи Возрождения; без отдельного разбора классических ордеров), Табл. 16 (профили ваз), Табл. 17–20 (схемы двухэтажных фасадов, а также Табл. 50 как схема к Табл. 51) и начало обзора Табл. 21–62 (одноэтажные жилые дома на Табл. 21–25 и садовая архитектура на Табл. 24 без колонн и пилястр). Сохранены орфография и пунктуация оригинала: «Gesamtanordnung», «Detailierens», «demgemäß», «Maße», «wie jede Kunst, sich», двойная точка «Pilasterkapitälen..».',
    paragraphs: [
      {
        index: 1,
        subheadingDe: 'BEMERKUNGEN ZU DEN TAFELN.',
        subheadingRu: 'ПРИМЕЧАНИЯ К ТАБЛИЦАМ.',
        de: 'Da die Architektur wie jede Kunst, sich nicht nach einem vorgeschriebenen Schema richten kann, so sind die in den Tafeln vorgeführten Beispiele für die Gesamtanordnung von Fassaden und für die Ausbildung der einzelnen Bauglieder nur in dem Sinne von Beispielen aufzufassen, an denen die Grundprinzipien der architektonischen Formenlehre zur Anschauung kommen sollen.',
        ru: 'Поскольку архитектура, как и всякое искусство, не может подчиняться предписанной схеме, приведённые в таблицах образцы общей композиции фасадов и разработки отдельных строительных элементов следует понимать лишь как примеры, на которых должны наглядно раскрываться основные принципы учения об архитектурных формах.',
      },
      {
        index: 2,
        de: 'Die in den Tafeln eingeschriebenen Abmessungen sind demgemäß nicht als unverbrüchliche Regeln anzusehen. Sie sollen dem angehenden Techniker nur als Anhalt dienen, um ihm die Arbeit des Entwerfens und Detailierens zu erleichtern. Kleine Verschiebungen in den Verhältnissen fallen überhaupt nicht ins Gewicht; selbst das Auge des erfahrenen Fachmannes wird sie kaum bemerken.',
        ru: 'Вписанные в таблицы размеры согласно этому не следует рассматривать как нерушимые правила. Они должны служить начинающему технику лишь ориентиром, облегчающим ему труд проектирования и деталировки. Небольшие сдвиги в пропорциях вовсе не имеют значения; даже глаз опытного специалиста едва ли заметит их.',
      },
      {
        index: 3,
        subsubheadingDe: 'Tafel 1—15. Schematische Darstellung einzelner Bauglieder.',
        subsubheadingRu: 'Таблицы 1—15. Схематическое изображение отдельных архитектурных элементов.',
        de: 'Auf Tafel 1 und 2 sind Fussgesimse, Brüstungs- und Hauptgesimse in vergleichender Weise dargestellt.',
        ru: 'На таблицах 1 и 2 в сравнительном виде представлены цокольные, подоконные (поясные) и главные карнизы.',
      },
      {
        index: 4,
        de: 'Die Tafeln 3—9 bieten in vergleichender Uebersicht Fenster- und Thürformen mit und ohne Anwendung von Rustika.',
        ru: 'Таблицы 3—9 дают в сравнительном обзоре формы окон и дверей с применением рустики и без неё.',
      },
      {
        index: 5,
        de: 'In den Tafeln 10—12 erscheinen die Hauptgesimse dann (Taf. 13 u. 14) Postamente und Basen für Säulen und Pilaster, endlich (Taf. 15) eine Reihe von Pilasterkapitälen.. Es sind dabei nur die in der Renaissance üblichen, für die Praxis nutzbaren Formen in Betracht gezogen. Die Theorie der Säulenordnungen ist absichtlich unberücksichtigt geblieben; dagegen wurden Säulen und Pilaster in Abmessungen, wie sie in der Wirklichkeit an Portalen und Fenstern vorkommen, einer eingehenden Bearbeitung unterzogen.',
        ru: 'На таблицах 10—12 помещены главные карнизы, затем (табл. 13 и 14) пьедесталы и базы колонн и пилястр и, наконец (табл. 15), ряд капителей пилястр. При этом приняты во внимание лишь употребительные в эпоху Возрождения и пригодные для практики формы. Теория ордеров сознательно оставлена без рассмотрения; напротив, колонны и пилястры подвергнуты подробной разработке в тех реальных размерах, в каких они встречаются на порталах и окнах.',
      },
      {
        index: 6,
        de: 'Auf Taf. 16 wird eine vergleichende Uebersicht über verschiedene Vasenprofile geboten.',
        ru: 'На табл. 16 предлагается сравнительный обзор различных профилей ваз.',
      },
      {
        index: 7,
        subsubheadingDe: 'Tafel 17—20. Schematische Darstellung von Fassaden.',
        subsubheadingRu: 'Таблицы 17—20. Схематическое изображение фасадов.',
        de: 'Auf diesen Tafeln ist das zweigeschossige Wohnhaus in verschiedenen Varianten behandelt, um die erste rohe Gliederung der Masse und die weitere Entwicklung der Fassade zu veranschaulichen. Die völlige Ausbildung wird in den folgenden Tafeln 21—25 veranschaulicht.',
        ru: 'На этих таблицах в различных вариантах разобран двухэтажный жилой дом, чтобы наглядно показать первичное грубое членение объёма и дальнейшее развитие фасада. Полная архитектурная проработка показана на последующих таблицах 21—25.',
      },
      {
        index: 8,
        de: 'Auch Taf. 50 gehört ihrem Charakter nach hierher, ist aber als Schema des auf Taf. 51 dargestellten vornehmen Landhauses weiter hinten eingeschoben.',
        ru: 'Сюда же по своему характеру относится и табл. 50, однако она помещена дальше вглубь издания как схема богатого загородного дома, изображённого на табл. 51.',
      },
      {
        index: 9,
        subsubheadingDe: 'Taf. 21—62. Fassaden.',
        subsubheadingRu: 'Табл. 21—62. Фасады.',
        de: 'Die Tafeln 21—25 sind dem ebenerdigen Wohnhause zugewiesen, bei dem sich die Architektur in bescheidenen Grenzen zu halten hat. Ein Blatt mit Gartenarchitekturen (Taf. 24) soll als Beweis dafür dienen, wie gut der Pilaster und die Säule hier entbehrt werden können.',
        ru: 'Таблицы 21—25 отведены одноэтажному жилому дому, в котором архитектура должна держаться в скромных пределах. Один лист с садовой архитектурой (табл. 24) призван служить доказательством того, насколько хорошо здесь можно обойтись без пилястра и колонны.',
      },
      {
        index: 10,
        de: 'Durch die Anordnung ist vor allem eine Erleichterung des Ablesens bezweckt; die wirklichen Maße in Metern sowie die Verhältniszahlen sind gleich auf der linken und rechten Seite der Fassade berücksichtigt.',
        ru: 'Такой композицией чертежей преследуется прежде всего облегчение считывания: действительные размеры в метрах, равно как и числа пропорций, сразу приведены на левой и правой сторонах фасада.',
      },
    ],
    terms: [
      {
        de: 'die architektonische Formenlehre',
        ru: 'учение об архитектурных формах',
        context: 'Система принципов, иллюстрируемых таблицами не в качестве жёсткого шаблона, а как пособие для проектирования и деталировки.',
      },
      {
        de: 'Vasenprofile',
        ru: 'профили декоративных ваз',
        context: 'Сравнительный обзор профилей архитектурных ваз, выделенный в отдельную таблицу (табл. 16).',
      },
      {
        de: 'das ebenerdige Wohnhaus',
        ru: 'одноэтажный жилой дом',
        context: 'Скромный тип постройки на табл. 21–25, где возможно полное обхождение без ордерных колонн и пилястр (вкл. садовую архитектуру табл. 24).',
      },
      {
        de: 'Gartenarchitekturen',
        ru: 'садовая архитектура (малые садовые сооружения)',
        context: 'Образец на табл. 24, показывающий выразительность фасадных форм без применения пилястр и колонн.',
      },
    ],
  },
  {
    id: 'scan-0035',
    scanNr: 35,
    pageNumber: '22',
    sectionTitleDe: 'BEMERKUNGEN ZU DEN TAFELN. · Taf. 26–51 / Taf. 52–62 (Mehrgeschossige Wohnhäuser).',
    sectionTitleRu: 'ПРИМЕЧАНИЯ К ТАБЛИЦАМ. · Табл. 26–51 / Табл. 52–62 (Многоэтажные жилые дома).',
    imagePath: '/assets/aistudio/15-014442283_0035_view_95f6be46.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0035-1',
    institution: 'Deutsches Museum',
    editorialNote:
      'Поясняется принцип простановки числовых пропорций на таблицах (цоколь и главный карниз относятся к общей высоте здания, поясной карниз — к нижележащей части), даётся 5-частная классификация фасадов VI–XXXI (табл. 26–51) и разбор городских жилых и доходных домов в 3–5 этажей (табл. 52–62), включая трактовку торгового первого этажа с витринами как единого цоколя и 3 способа карнизного членения верхних этажей. В 5-м абзаце в печатном тексте 1895 г. допущена опечатка «gösseren» вместо «grösseren» (в расшифровке исправлено). Сохранены формы «Maßzahlen», «Gesammthöhe», «gewissermaßen», «Mietshäuser», «No. 58—60». Последняя строка обрывается на словах «…durch ein» (переход на стр. 23).',
    paragraphs: [
      {
        index: 1,
        de: 'Um Platz zu sparen und nicht durch zu viele Maßzahlen zu verwirren, sind oft mehrere Verhältnisse in einer Linie angegeben. Bei den wichtigsten Abschnitten der Gesimsoberkanten und Unterkanten, die am meisten ins Auge fallen, ist eine Maßzahl so aufzufassen, dass sie nur für eine durch solche Abschnitte gekennzeichnete Hauptpartie gilt, nicht aber in Beziehung zum Ganzen steht. Sockel und Hauptgesimshöhen sind auf die Gesammthöhe bezogen, Gurtgesimshöhen auf die darunter befindliche Partie. Ein flüchtiges Abmessen mit dem Zirkel wird übrigens in zweifelhaften Fällen sofort Klarheit gewähren. Die Fassaden VI bis XXXI auf Tafel 26—51 behandeln folgende Fälle:\n1. Wohnhäuser mit fünf Fensteraxen und durchlaufender Strassenflucht.\n2. Wohnhäuser mit vier Fensteraxen und durchlaufender Strassenflucht.\n3. Wohnhäuser mit Abschrägung, Risalit und Türmchen an der Ecke.\n4. Wohnhäuser mit einem Mittelrisalit und zwei Rücklagen.\n5. Wohnhäuser mit zwei Seitenrisaliten und einer Rücklage.',
        ru: 'Для экономии места и чтобы не сбивать с толку обилием размерных чисел, на одной линии нередко указано сразу несколько соотношений. При важнейших рубежах верхних и нижних обрезов карнизов, наиболее бросающихся в глаза, размерное число следует понимать так, что оно относится лишь к главной части, ограниченной такими рубежами, но не соотносится со всем зданием в целом. Высоты цоколя и главного карниза отнесены к общей высоте, высоты же поясных карнизов — к лежащей под ними части. Впрочем, беглый промер циркулем в сомнительных случаях тотчас внесёт ясность. Фасады VI–XXXI на таблицах 26–51 рассматривают следующие случаи:\n1. Жилые дома с пятью оконными осями и сплошной уличной линией.\n2. Жилые дома с четырьмя оконными осями и сплошной уличной линией.\n3. Жилые дома со скошенным углом, ризалитом и угловой башенкой.\n4. Жилые дома с одним центральным ризалитом и двумя западающими крыльями.\n5. Жилые дома с двумя боковыми ризалитами и одной западающей средней частью.',
      },
      {
        index: 2,
        de: 'Umwandlungen dieser Beispiele vom freistehenden in das eingebaute Wohnhaus und umgekehrt lassen sich mit kleinen Abweichungen leicht vornehmen.',
        ru: 'Преобразования этих примеров из свободно стоящего в встроенный жилой дом и обратно легко осуществимы с небольшими отклонениями.',
      },
      {
        index: 3,
        de: 'Die folgenden Fassadenblätter (Taf. 52—62) befassen sich mit dem städtischen Wohn- und Geschäftshause, das natürlich nur in einigen Beispielen der vielen in der Praxis vorkommenden Arten vorgeführt werden konnte, auch nur in solchen mit geringen Zimmerhöhen, da sonst für die vollständige Ausarbeitung der ganzen Fronte in den gewählten Maßstäben kein Raum gewesen wäre; noch einen dritten kleineren Maßstab anzuwenden, wäre unzweckmäßig gewesen. Städtische Mietshäuser mit drei, vier und fünf Geschossen, bei denen auf möglichste Ausnutzung des Raumes im Innern Bedacht zu nehmen ist, pflegen dafür mehr äusserlichen Prunk zu entfalten; der Aufwand an Zierformen tritt in den Vordergrund, Hauptgesims und Sockel erhalten geringere Höhen oder das ganze Erdgeschoss wird zum Sockel gezogen.',
        ru: 'Последующие листы фасадов (табл. 52–62) посвящены городскому жилому и торгово-доходному дому, который, разумеется, мог быть представлен лишь в отдельных образцах из множества встречающихся на практике типов — притом с небольшой высотой комнат, так как иначе для полной проработки всего фасада в выбранных масштабах не хватило бы места; применять же третий, ещё более мелкий масштаб было бы нецелесообразно. Городские доходные дома в три, четыре и пять этажей, в которых приходится стремиться к предельно полному использованию внутреннего пространства, зато склонны разворачивать больше внешнего великолепия: пышность декоративных форм выступает на первый план, главный карниз и цоколь получают меньшую высоту или же весь первый этаж превращается в цоколь.',
      },
      {
        index: 4,
        de: 'Das städtische Wohnhaus mit drei Geschossen wird in den Tafeln 52—57 behandelt. Mit seinen drei Fensterreihen, die von dem Auge leicht erfasst werden, ist es gewissermaßen das Ideal der ganzen Gattung. Freilich muss dabei vorausgesetzt werden, dass der Sockel als selbständiges Glied ausgebildet erscheint. In vielen Fällen wird man dieser Anforderung aber nicht genügen können, namentlich dann nicht, wenn im Erdgeschoss Kaufläden mit Schaufenstern Platz finden sollen, deren Fussboden nur wenig höher als die Strassensohle zu liegen hat. Die Rücksicht auf den praktischen Zweck nötigt dann zu dem Auswege, das ganze Erdgeschoss im Sinne eines Sockels für den Oberbau auszubilden.',
        ru: 'Городской жилой дом с тремя этажами разобран на таблицах 52–57. Со своими тремя рядами окон, легко охватываемыми взглядом, он является в некотором роде идеалом всего этого типа зданий. Разумеется, при этом предполагается, что цоколь выступает как самостоятельный элемент. Однако во многих случаях этому требованию удовлетворить не удаётся — именно тогда, когда в первом этаже должны разместиться лавки с витринами, пол которых должен лежать лишь немного выше уровня улицы. Соображения практического назначения вынуждают тогда прибегнуть к выходу — трактовать весь первый этаж как цоколь для верхних ярусов.',
      },
      {
        index: 5,
        de: 'Dass das erste Obergeschoss durch seine Grössenverhältnisse sich als die Hauptsache geltend zu machen hat, bedarf wohl kaum der Erwähnung. Auch wenn die Zimmer nur gleiche Höhe mit denen des folgenden Geschosses haben, muss der äussere Eindruck doch der der grösseren Höhe sein.',
        ru: 'Едва ли нуждается в упоминании, что второй (первый верхний) этаж своими пропорциями должен заявлять о себе как о главном ярусе. Даже если комнаты в нём имеют лишь такую же высоту, как и в следующем этаже, внешнее впечатление всё равно должно создавать ощущение большей высоты.',
      },
      {
        index: 6,
        de: 'Von den verschiedenen Fällen, die hier in Betracht kommen, sind namentlich drei hervorzuheben:\n1. Der Fussboden ist im zweiten und dritten Geschosse durch ein Gurtgesimse markiert.\n2. Das Gurtgesimse unter den Fenstern des dritten Geschosses wird zum Sohlbankgesimse.\n3. Das zweite und dritte Geschoss erhalten keine Unterbrechung durch ein Gesimse.',
        ru: 'Из различных возможных здесь случаев следует особо выделить три:\n1. Уровень пола во втором и третьем этажах отмечен поясным карнизом.\n2. Поясной карниз под окнами третьего этажа становится подоконным карнизом.\n3. Второй и третий этажи не получают разделения карнизом.',
      },
      {
        index: 7,
        de: 'Im letzten Falle erhält die Fassade eine ruhige Fläche, indem die beiden oberen Geschosse zu einer Einheit zusammengezogen werden und damit die vorherrschende Bedeutung gewinnen.',
        ru: 'В последнем случае фасад обретает спокойную плоскость, поскольку оба верхних этажа стягиваются в единое целое и тем самым приобретают господствующее значение.',
      },
      {
        index: 8,
        de: 'Der weitere Fall, wonach unter den Fenstern des zweiten Geschosses nur ein Sohlbankgesimse durchläuft, kommt selten vor, weil das Erdgeschoss dadurch auf Kosten der Obergeschosse unnötigerweise vergrössert und die Gesammthöhenteilung ungünstig beeinflusst wird. Man wird also besser zur Anordnung einer Brüstung greifen, um mit ihr einen Fuss für den Aufbau der Obergeschosse zu gewinnen. Bei Wohnhäusern mit vier und fünf Geschossen, wie sie auf den nächsten Tafeln, No. 58—60, dargestellt sind, gilt das gleiche Prinzip in der Einteilung. Das letzte Obergeschoss ist das kleinste und wird in der Fassade scheinbar noch kleiner gemacht durch ein',
        ru: 'Ещё один случай, когда под окнами второго этажа проходит лишь подоконный карниз, встречается редко, поскольку первый этаж при этом излишне увеличивается за счёт верхних этажей и нарушается общая разбивка высот. Поэтому лучше прибегнуть к устройству подоконного пояса-парапета, чтобы обрести в нём опору для построения верхних этажей. Для жилых домов в четыре и пять этажей, изображённых на следующих таблицах, № 58–60, в разбивке действует тот же принцип. Верхний этаж является самым малым и на фасаде зрительно делается ещё меньше посредством…',
        continuesOnNextPage: true,
      },
    ],
    terms: [
      {
        de: 'das städtische Wohn- und Geschäftshaus / Mietshaus',
        ru: 'городской жилой, торгово-доходный дом',
        context: 'Многоэтажный тип застройки (табл. 52–62) с лавками и витринами (Kaufläden mit Schaufenstern) в первом этаже, трактуемом как цоколь.',
      },
      {
        de: 'das erste Obergeschoss (als Hauptsache)',
        ru: 'второй (главный верхний) этаж / бельэтаж',
        context: 'Должен зрительно доминировать над верхними этажами даже при равной высоте комнат.',
      },
      {
        de: 'die Brüstung (als Fuss für den Oberbau)',
        ru: 'подоконная стена-парапет (как опора верхнего яруса)',
        context: 'Предпочтительнее сплошного подоконного карниза в 2-м этаже, чтобы не раздувать визуально первый этаж.',
      },
    ],
  },
  {
    id: 'scan-0036',
    scanNr: 36,
    pageNumber: '23',
    sectionTitleDe: 'BEMERKUNGEN ZU DEN TAFELN. · Tafel 63—150 und die Tafeln der Mappe (Schluss).',
    sectionTitleRu: 'ПРИМЕЧАНИЯ К ТАБЛИЦАМ. · Таблицы 63–150 и листы папки (завершение).',
    imagePath: '/assets/aistudio/15-014442283_0036_view_a0d85bb8.jpg',
    urn: 'http://nbn-resolving.de/urn:nbn:de:bvb:210-15-014442283-0036-7',
    institution: 'Deutsches Museum',
    editorialNote:
      'Первая строка завершает фразу со стр. 22 («…durch ein / Sohlbankgesimse…»). Завершается разбор пятиэтажных городских домов (включая объединение 1-го и 2-го этажей в единый нижний ярус у богатых особняков и преодоление монотонности длинных фасадов разнообразием оконных форм на табл. 61–62), затем даётся описание крупномасштабных чертежей табл. 63–150 и обзорных листов папки (Uebersichtsblätter der Mappe), позволяющих составлять рабочие шаблоны в натуральную величину (naturgrosse Werkzeichnungen). Стр. 23 завершает раздел «BEMERKUNGEN ZU DEN TAFELN.» и всю вводную текстовую часть первого тома. Сохранены формы 1895 г. «Maßstab / Maßstabe», «Entwickelung», «giebt», «Abwechselung», «naturgrosse».',
    paragraphs: [
      {
        index: 1,
        continuesFromPrevPage: true,
        de: 'Sohlbankgesimse; ja es kann sogar mit dem Hauptgesimse zu einer Gliederung vereinigt werden, so dass also hier\ndas Erdgeschoss den Sockel,\ndas zweite, dritte und vierte Geschoss den Aufbau,\ndas fünfte Geschoss mit dem Hauptgesimse die Krönung bildet.',
        ru: '…подоконного карниза; более того, он может быть даже объединён с главным карнизом в единое членение, так что здесь\nпервый этаж образует цоколь,\nвторой, третий и четвёртый этажи — основную массу (ствол),\nпятый этаж вместе с главным карнизом — венчание.',
      },
      {
        index: 2,
        de: 'Bei vornehmen Stadthäusern wird auch noch folgende Anordnung beliebt:\nDas Erdgeschoss wird mit dem zweiten Geschoss zu einer Einheit ausgebildet.\nDas dritte, vierte und fünfte Geschoss gehören dem Aufbau, ein Hauptgesimse von bescheidener Höhe, aber kräftiger Ausladung bildet die Krönung.',
        ru: 'В богатых городских особняках также распространено следующее решение:\nПервый этаж объединяется со вторым в одно целое.\nТретий, четвёртый и пятый этажи принадлежат средней части, а венчание образует главный карниз скромной высоты, но с мощным выносом.',
      },
      {
        index: 3,
        de: 'Die Längenausdehnung der ganzen Fronte ist natürlich auch ein Faktor von grosser Bedeutung, mit dem der Entwerfende zu rechnen hat. Ob die Fassade in einer Flucht liegen soll, ob ein Mittelrisalit oder zwei Seitenrisalite zur Gruppierung herbeizuziehen sind, hängt hauptsächlich von der Länge ab. Das eine kann unter Umständen ebensogut den Zweck erfüllen, wie das andere mit grösserem Aufwand der Mittel.',
        ru: 'Протяжённость всего фасада в длину, естественно, также является фактором большого значения, с которым проектировщик обязан считаться. Должен ли фасад лежать в единой линии или же для группировки следует прибегнуть к центральному ризалиту либо двум боковым ризалитам — зависит главным образом от его длины. Первое при определённых условиях может столь же успешно выполнить задачу, как и второе при большей затрате средств.',
      },
      {
        index: 4,
        de: 'Im allgemeinen sucht man bei Gebäuden mit langen Strassenfronten die Einförmigkeit durch Mannigfaltigkeit der Motive aufzuheben; am besten wird diese durch Abwechselung in den Formen der Fenster bewirkt. (Vergleiche hierzu die letzten Fassaden-Tafeln No. 61 und 62.)',
        ru: 'В целом в зданиях с протяжёнными уличными фасадами однообразие стремятся преодолеть многообразием мотивов; лучше всего это достигается чередованием форм окон. (Ср. с этим последние фасадные таблицы № 61 и 62.)',
      },
      {
        index: 5,
        subsubheadingDe: 'Tafel 63—150 und die Tafeln der Mappe.',
        subsubheadingRu: 'Таблицы 63—150 и листы папки.',
        de: 'Auf diesen Tafeln sind einzelne Partien von Fassaden, Thüren, Portalen und Fenstern in grossem Maßstabe dargestellt und deren einzelne Teile wieder zergliedert. Der Maßstab ist dabei so gross gewählt, dass nach den eingeschriebenen Verhältnissen naturgrosse Werkzeichnungen mit Leichtigkeit angefertigt werden können.',
        ru: 'На этих таблицах в крупном масштабе изображены отдельные фрагменты фасадов, дверей, порталов и окон с последующим расчленением их составных частей. Масштаб при этом выбран столь крупным, что по вписанным соотношениям можно с лёгкостью изготовлять рабочие чертежи в натуральную величину.',
      },
      {
        index: 6,
        de: 'Die Uebersichtsblätter der Mappe beziehen sich mit wenigen Ausnahmen auf die dargestellten Fassaden; ebenso die meisten der gross gezeichneten Einzelformen von Konsolen, Schlusssteinen, Gesimsen, Kapitälen und Balustern. Wie eine Form entsteht und was sie wird — wo sie schliesslich zur Gliederung gebraucht wird — ist nur an der Hand von Beispielen zu erklären; dasselbe Beispiel in der Fassade, dem Uebersichtsblatte und der Werkzeichnung wird in der Reihenfolge seiner Entwickelung wohl am deutlichsten den Gang und das zwingende Gesetz veranschaulichen, dem es sich unterzuordnen hatte.',
        ru: 'Обзорные листы папки за немногими исключениями относятся к изображённым фасадам; точно так же как и большинство крупно вычерченных отдельных форм консолей, замковых камней, карнизов, капителей и балясин. Как форма возникает и чем она становится — где она в конечном счёте служит членению — можно объяснить лишь на примерах; один и тот же образец на фасаде, на обзорном листе и в рабочем чертеже в последовательности своего развития яснее всего продемонстрирует ход и непреложный закон, которому он должен был подчиниться.',
      },
      {
        index: 7,
        de: 'Eine Regel allgemeiner Art für die Detailgliederung giebt es selbstverständlich nicht; jede Aufgabe in ihrer Eigenart bestimmt die Regel, welche daher von Fall zu Fall wechselt. Nur in diesem Sinne sind, wie schon eingangs erwähnt, die Verhältniszahlen der vorkommenden Beispiele aufzufassen; ihr Zweck ist hauptsächlich der, dem wenig Geübten einen Anhaltspunkt dafür zu geben, wie Fehler zu vermeiden sind und wie jede Aufgabe selbst mit geringen Mitteln gut gelöst werden kann.',
        ru: 'Разумеется, единого общего правила для детального членения не существует; каждая задача в своём своеобразии определяет правило, которое потому меняется от случая к случаю. Лишь в этом смысле, как уже упоминалось в начале, следует понимать числовые соотношения приведённых примеров; их цель состоит главным образом в том, чтобы дать малоопытному специалисту опорный ориентир, как избегать ошибок и как любую задачу можно удачно решить даже при скромных средствах.',
      },
    ],
    terms: [
      {
        de: 'Sockel — Aufbau — Krönung (fünfgeschossiges Haus)',
        ru: 'цоколь — тело (средние этажи) — венчание',
        context: 'Трёхчастная вертикальная схема пятиэтажного дома: 1-й этаж (цоколь), 2–4-й этажи (основная часть), 5-й этаж с главным карнизом (венчание).',
      },
      {
        de: 'naturgrosse Werkzeichnungen',
        ru: 'рабочие чертежи (шаблоны) в натуральную величину',
        context: 'Практическое назначение крупномасштабных таблиц 63–150 и деталей консолей, замковых камней, капителей и балясин.',
      },
      {
        de: 'die Uebersichtsblätter der Mappe',
        ru: 'обзорные листы папки (атласа)',
        context: 'Среднее звено триады «фасад — обзорный лист — рабочий чертёж», раскрывающее эволюцию архитектурной детали.',
      },
    ],
  },
];
