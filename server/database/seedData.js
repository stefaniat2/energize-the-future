// Starter data for the facts and game_scenarios tables, plus the logic to insert it.
// Shared by the manual `npm run seed` script and the automatic startup check in db.js
// (the latter matters on hosts like Render's free tier, where the filesystem can be
// wiped on every cold restart, which would otherwise leave the live site with no data).

const facts = [
  // Solar energy
  {
    category: "solar",
    en: "Sunlight reaches Earth with enough energy in one hour to power the entire world for a year.",
    ro: "Lumina soarelui ajunge pe Pământ cu suficientă energie într-o oră pentru a alimenta întreaga lume timp de un an.",
    ru: "Солнечный свет достигает Земли с энергией, которой за один час хватило бы, чтобы обеспечить электричеством весь мир на целый год.",
  },
  {
    category: "solar",
    en: "Solar panels can still generate electricity on cloudy days, just at a reduced output.",
    ro: "Panourile solare pot genera electricitate și în zilele înnorate, doar că produc mai puțin.",
    ru: "Солнечные панели могут вырабатывать электричество даже в пасмурные дни, хотя и в меньшем объёме.",
  },
  {
    category: "solar",
    en: "The cost of solar photovoltaic panels has dropped by more than 80% since 2010.",
    ro: "Costul panourilor fotovoltaice a scăzut cu peste 80% din 2010.",
    ru: "Стоимость солнечных фотоэлектрических панелей снизилась более чем на 80% с 2010 года.",
  },
  {
    category: "solar",
    en: "Solar energy is now one of the cheapest sources of new electricity generation in most parts of the world.",
    ro: "Energia solară este acum una dintre cele mai ieftine surse de generare a energiei electrice noi în majoritatea regiunilor lumii.",
    ru: "Солнечная энергия сегодня — один из самых дешёвых источников новой электрогенерации в большинстве регионов мира.",
  },
  {
    category: "solar",
    en: "Solar panels typically last 25 to 30 years and continue producing power even after that, just at lower efficiency.",
    ro: "Panourile solare durează de obicei între 25 și 30 de ani și continuă să producă energie și după aceea, dar cu o eficiență mai scăzută.",
    ru: "Солнечные панели обычно служат от 25 до 30 лет и продолжают вырабатывать энергию даже после этого срока, хотя и с меньшей эффективностью.",
  },
  {
    category: "solar",
    en: "Floating solar farms are being built on lakes and reservoirs to save land space and reduce water evaporation.",
    ro: "Fermele solare plutitoare sunt construite pe lacuri și rezervoare pentru a economisi spațiu de teren și a reduce evaporarea apei.",
    ru: "Плавучие солнечные электростанции строят на озёрах и водохранилищах, чтобы экономить землю и снижать испарение воды.",
  },
  // Wind energy
  {
    category: "wind",
    en: "A single modern wind turbine can generate enough electricity to power thousands of homes.",
    ro: "O singură turbină eoliană modernă poate genera suficientă electricitate pentru a alimenta mii de locuințe.",
    ru: "Одна современная ветряная турбина способна вырабатывать достаточно электроэнергии для тысяч домов.",
  },
  {
    category: "wind",
    en: "Offshore wind farms can capture stronger and more consistent winds than turbines on land.",
    ro: "Parcurile eoliene offshore pot capta vânturi mai puternice și mai constante decât turbinele de pe uscat.",
    ru: "Морские ветропарки способны улавливать более сильный и стабильный ветер, чем наземные турбины.",
  },
  {
    category: "wind",
    en: "Wind power is one of the fastest-growing renewable energy sources in the world.",
    ro: "Energia eoliană este una dintre cele mai rapid crescânde surse de energie regenerabilă din lume.",
    ru: "Ветроэнергетика — один из самых быстрорастущих видов возобновляемой энергии в мире.",
  },
  {
    category: "wind",
    en: "Wind turbine blades are designed using the same aerodynamic principles as airplane wings.",
    ro: "Palele turbinelor eoliene sunt proiectate folosind aceleași principii aerodinamice ca aripile avioanelor.",
    ru: "Лопасти ветряных турбин проектируются по тем же аэродинамическим принципам, что и крылья самолётов.",
  },
  {
    category: "wind",
    en: "Denmark generates a large share of its electricity from wind power, more than almost any other country.",
    ro: "Danemarca generează o mare parte din electricitatea sa din energie eoliană, mai mult decât aproape orice altă țară.",
    ru: "Дания вырабатывает значительную долю своего электричества за счёт ветра — больше, чем почти любая другая страна.",
  },
  {
    category: "wind",
    en: "Small wind turbines can be used by individual homes and farms to generate their own electricity.",
    ro: "Turbinele eoliene mici pot fi folosite de gospodării și ferme individuale pentru a-și genera propria electricitate.",
    ru: "Небольшие ветряные турбины могут использоваться отдельными домами и фермами для выработки собственного электричества.",
  },
  // Climate
  {
    category: "climate",
    en: "Burning fossil fuels for energy is the largest single source of greenhouse gas emissions worldwide.",
    ro: "Arderea combustibililor fosili pentru energie este cea mai mare sursă individuală de emisii de gaze cu efect de seră la nivel mondial.",
    ru: "Сжигание ископаемого топлива для получения энергии — крупнейший источник выбросов парниковых газов в мире.",
  },
  {
    category: "climate",
    en: "Switching to renewable energy is one of the most effective ways to slow down climate change.",
    ro: "Trecerea la energie regenerabilă este una dintre cele mai eficiente modalități de a încetini schimbările climatice.",
    ru: "Переход на возобновляемую энергию — один из самых эффективных способов замедлить изменение климата.",
  },
  {
    category: "climate",
    en: "Air pollution from fossil fuel power plants contributes to millions of premature deaths every year.",
    ro: "Poluarea aerului provenită de la centralele pe combustibili fosili contribuie la milioane de decese premature în fiecare an.",
    ru: "Загрязнение воздуха от электростанций на ископаемом топливе ежегодно способствует миллионам преждевременных смертей.",
  },
  {
    category: "climate",
    en: "Clean energy and reforestation together can remove more carbon dioxide from the atmosphere than either alone.",
    ro: "Energia curată și reîmpădurirea, împreună, pot elimina mai mult dioxid de carbon din atmosferă decât fiecare separat.",
    ru: "Чистая энергия и восстановление лесов вместе способны удалить из атмосферы больше углекислого газа, чем каждая мера по отдельности.",
  },
  {
    category: "climate",
    en: "The Paris Agreement aims to limit global warming to well below 2 degrees Celsius above pre-industrial levels.",
    ro: "Acordul de la Paris își propune să limiteze încălzirea globală la mult sub 2 grade Celsius peste nivelurile preindustriale.",
    ru: "Парижское соглашение направлено на ограничение глобального потепления значительно ниже 2 градусов Цельсия по сравнению с доиндустриальным уровнем.",
  },
  {
    category: "climate",
    en: "Melting polar ice caused by climate change threatens habitats and can raise sea levels around the world.",
    ro: "Topirea calotelor polare cauzată de schimbările climatice amenință habitatele și poate ridica nivelul mării la nivel mondial.",
    ru: "Таяние полярных льдов из-за изменения климата угрожает местам обитания и может повысить уровень моря во всём мире.",
  },
  // Energy efficiency
  {
    category: "efficiency",
    en: "LED light bulbs use up to 90% less energy than traditional incandescent bulbs.",
    ro: "Becurile LED folosesc cu până la 90% mai puțină energie decât becurile incandescente tradiționale.",
    ru: "Светодиодные лампы потребляют до 90% меньше энергии, чем традиционные лампы накаливания.",
  },
  {
    category: "efficiency",
    en: "Simply unplugging electronics when not in use can reduce a household's electricity waste from standby power.",
    ro: "Simpla deconectare a aparatelor electronice atunci când nu sunt folosite poate reduce risipa de electricitate cauzată de consumul în standby.",
    ru: "Простое отключение электроники от розетки, когда она не используется, снижает потери электроэнергии в режиме ожидания.",
  },
  {
    category: "efficiency",
    en: "Proper home insulation can significantly cut the energy needed for heating and cooling.",
    ro: "O izolație corespunzătoare a locuinței poate reduce semnificativ energia necesară pentru încălzire și răcire.",
    ru: "Хорошая теплоизоляция дома значительно снижает потребность в энергии для отопления и охлаждения.",
  },
  {
    category: "efficiency",
    en: "Energy-efficient appliances often carry a label rating their consumption, helping buyers choose greener options.",
    ro: "Aparatele electrocasnice eficiente energetic poartă adesea o etichetă care indică nivelul de consum, ajutând cumpărătorii să aleagă opțiuni mai ecologice.",
    ru: "Энергоэффективная бытовая техника часто имеет маркировку с классом потребления, что помогает покупателям выбирать более экологичные варианты.",
  },
  {
    category: "efficiency",
    en: "Smart thermostats can learn a household's habits and automatically reduce unnecessary heating or cooling.",
    ro: "Termostatele inteligente pot învăța obiceiurile unei gospodării și pot reduce automat încălzirea sau răcirea inutilă.",
    ru: "Умные термостаты способны изучать привычки семьи и автоматически снижать ненужное отопление или охлаждение.",
  },
  {
    category: "efficiency",
    en: "Improving energy efficiency is often called the 'first fuel' because it reduces demand before any energy is even generated.",
    ro: "Îmbunătățirea eficienței energetice este numită adesea 'primul combustibil', deoarece reduce cererea chiar înainte ca energia să fie generată.",
    ru: "Повышение энергоэффективности часто называют «первым топливом», поскольку оно снижает спрос ещё до выработки самой энергии.",
  },
  // Hydropower
  {
    category: "hydropower",
    en: "Hydropower is the largest source of renewable electricity generation in the world today.",
    ro: "Hidroenergia este cea mai mare sursă de generare a electricității regenerabile din lume în prezent.",
    ru: "Гидроэнергетика сегодня — крупнейший источник возобновляемой электроэнергии в мире.",
  },
  {
    category: "hydropower",
    en: "Pumped-storage hydropower plants act like giant batteries, storing energy by pumping water uphill when demand is low.",
    ro: "Centralele hidroelectrice cu acumulare prin pompare funcționează ca niște baterii uriașe, stocând energie prin pomparea apei în amonte atunci când cererea este scăzută.",
    ru: "Гидроаккумулирующие электростанции работают как гигантские батареи, накапливая энергию за счёт перекачки воды наверх при низком спросе.",
  },
  {
    category: "hydropower",
    en: "Small-scale, run-of-river hydro systems can generate power with minimal disruption to local ecosystems.",
    ro: "Sistemele hidroelectrice mici, de tip 'run-of-river', pot genera energie cu perturbări minime ale ecosistemelor locale.",
    ru: "Малые деривационные ГЭС могут вырабатывать энергию с минимальным воздействием на местные экосистемы.",
  },
  {
    category: "hydropower",
    en: "Hydropower dams can also help control flooding and provide reliable water supplies for irrigation.",
    ro: "Barajele hidroelectrice pot ajuta, de asemenea, la controlul inundațiilor și pot oferi surse fiabile de apă pentru irigații.",
    ru: "Гидроэлектрические плотины также помогают контролировать наводнения и обеспечивают надёжное водоснабжение для орошения.",
  },
  {
    category: "hydropower",
    en: "Unlike solar and wind, hydropower can provide a steady, predictable supply of electricity around the clock.",
    ro: "Spre deosebire de energia solară și eoliană, hidroenergia poate oferi o alimentare constantă și previzibilă cu electricitate non-stop.",
    ru: "В отличие от солнечной и ветровой энергии, гидроэнергетика способна обеспечивать стабильное и предсказуемое электроснабжение круглосуточно.",
  },
  // Sustainable technology
  {
    category: "technology",
    en: "Battery storage technology is improving rapidly, making it easier to use solar and wind power even when the sun isn't shining or the wind isn't blowing.",
    ro: "Tehnologia de stocare a bateriilor se îmbunătățește rapid, facilitând utilizarea energiei solare și eoliene chiar și atunci când soarele nu strălucește sau vântul nu bate.",
    ru: "Технологии хранения энергии в батареях быстро совершенствуются, что упрощает использование солнечной и ветровой энергии даже тогда, когда солнце не светит или ветер не дует.",
  },
  {
    category: "technology",
    en: "Green hydrogen, produced using renewable electricity, can help decarbonize industries that are hard to electrify, like steelmaking.",
    ro: "Hidrogenul verde, produs cu ajutorul electricității regenerabile, poate ajuta la decarbonizarea industriilor greu de electrificat, precum producția de oțel.",
    ru: "Зелёный водород, полученный с помощью возобновляемой электроэнергии, помогает декарбонизировать отрасли, которые трудно электрифицировать, например производство стали.",
  },
  {
    category: "technology",
    en: "Smart grids use digital technology to balance electricity supply and demand in real time, reducing waste.",
    ro: "Rețelele inteligente folosesc tehnologie digitală pentru a echilibra oferta și cererea de electricitate în timp real, reducând risipa.",
    ru: "Умные сети используют цифровые технологии для балансировки спроса и предложения электроэнергии в реальном времени, снижая потери.",
  },
  {
    category: "technology",
    en: "Electric vehicles powered by renewable electricity produce far fewer lifetime emissions than gasoline-powered cars.",
    ro: "Vehiculele electrice alimentate cu electricitate regenerabilă produc, pe durata lor de viață, mult mai puține emisii decât mașinile pe benzină.",
    ru: "Электромобили, работающие на возобновляемой электроэнергии, за весь срок службы производят гораздо меньше выбросов, чем автомобили на бензине.",
  },
  {
    category: "technology",
    en: "Recycling old solar panels and wind turbine blades is becoming an important part of making renewable energy fully sustainable.",
    ro: "Reciclarea panourilor solare vechi și a palelor turbinelor eoliene devine o parte importantă a transformării energiei regenerabile într-una complet sustenabilă.",
    ru: "Переработка старых солнечных панелей и лопастей ветряных турбин становится важной частью обеспечения полной устойчивости возобновляемой энергетики.",
  },
  {
    category: "technology",
    en: "Around 700 million people worldwide still lack access to electricity, and clean, decentralized technologies like solar mini-grids can help reach them faster.",
    ro: "Aproximativ 700 de milioane de oameni din întreaga lume nu au încă acces la electricitate, iar tehnologiile curate și descentralizate, precum micro-rețelele solare, îi pot ajuta să obțină acces mai rapid.",
    ru: "Около 700 миллионов человек в мире всё ещё не имеют доступа к электричеству, и чистые децентрализованные технологии, такие как солнечные мини-сети, могут быстрее обеспечить им доступ.",
  },
];

const scenarios = [
  {
    level: 1,
    title: { en: "A City in Trouble", ro: "Un oraș în dificultate", ru: "Город в беде" },
    description: {
      en: "Greenville relies almost entirely on coal power. Pollution is high and residents are worried. What is your first move?",
      ro: "Greenville depinde aproape în întregime de energia pe cărbune. Poluarea este ridicată, iar locuitorii sunt îngrijorați. Care este prima ta mișcare?",
      ru: "Гринвилл почти полностью зависит от угольной энергетики. Загрязнение высокое, жители обеспокоены. Каков твой первый шаг?",
    },
    options: [
      { text: { en: "Build a small solar farm on the edge of town", ro: "Construiește o fermă solară mică la marginea orașului", ru: "Построить небольшую солнечную электростанцию на окраине города" }, effects: { clean: 15, pollution: -10, affordability: -5, happiness: 5, sustainability: 10, budget: -30 } },
      { text: { en: "Do nothing and save the budget", ro: "Nu face nimic și economisește bugetul", ru: "Ничего не делать и сэкономить бюджет" }, effects: { clean: 0, pollution: 5, affordability: 5, happiness: -10, sustainability: -5, budget: 0 } },
    ],
  },
  {
    level: 2,
    title: { en: "Lighting the Streets", ro: "Iluminarea străzilor", ru: "Освещение улиц" },
    description: {
      en: "The old streetlights consume huge amounts of electricity every night. The council asks for your decision.",
      ro: "Vechile lămpi stradale consumă cantități uriașe de electricitate în fiecare noapte. Consiliul îți cere decizia.",
      ru: "Старые уличные фонари каждую ночь потребляют огромное количество электроэнергии. Совет просит твоего решения.",
    },
    options: [
      { text: { en: "Upgrade all streetlights to LED", ro: "Modernizează toate lămpile stradale la LED", ru: "Заменить все фонари на светодиодные" }, effects: { clean: 5, pollution: -8, affordability: 10, happiness: 8, sustainability: 10, budget: -20 } },
      { text: { en: "Keep the old, cheaper lights", ro: "Păstrează lămpile vechi, mai ieftine", ru: "Оставить старые, более дешёвые фонари" }, effects: { clean: 0, pollution: 5, affordability: 2, happiness: -5, sustainability: -8, budget: 0 } },
    ],
  },
  {
    level: 3,
    title: { en: "Wind on the Horizon", ro: "Vânt la orizont", ru: "Ветер на горизонте" },
    description: {
      en: "A nearby hill has ideal wind conditions. Investors propose a wind farm, but some residents worry about the view.",
      ro: "Un deal din apropiere are condiții ideale de vânt. Investitorii propun un parc eolian, dar unii locuitori sunt îngrijorați de peisaj.",
      ru: "На соседнем холме идеальные условия для ветра. Инвесторы предлагают построить ветропарк, но некоторые жители переживают за вид.",
    },
    options: [
      { text: { en: "Invest in the wind farm", ro: "Investește în parcul eolian", ru: "Инвестировать в ветропарк" }, effects: { clean: 20, pollution: -12, affordability: -5, happiness: 0, sustainability: 15, budget: -40 } },
      { text: { en: "Reject the project to avoid complaints", ro: "Respinge proiectul pentru a evita plângerile", ru: "Отклонить проект, чтобы избежать жалоб" }, effects: { clean: 0, pollution: 3, affordability: 3, happiness: 3, sustainability: -10, budget: 0 } },
    ],
  },
  {
    level: 4,
    title: { en: "The River's Potential", ro: "Potențialul râului", ru: "Потенциал реки" },
    description: {
      en: "A river runs through Greenville with strong, steady flow. Engineers suggest a small hydropower plant.",
      ro: "Un râu traversează Greenville cu un debit puternic și constant. Inginerii sugerează o mică centrală hidroelectrică.",
      ru: "Через Гринвилл протекает река с сильным и стабильным течением. Инженеры предлагают построить небольшую ГЭС.",
    },
    options: [
      { text: { en: "Build a small, low-impact hydropower plant", ro: "Construiește o mică centrală hidroelectrică cu impact redus", ru: "Построить небольшую ГЭС с минимальным воздействием" }, effects: { clean: 15, pollution: -8, affordability: 5, happiness: 5, sustainability: 12, budget: -35 } },
      { text: { en: "Skip it and rely on the existing grid", ro: "Renunță și bazează-te pe rețeaua existentă", ru: "Отказаться и полагаться на существующую сеть" }, effects: { clean: 0, pollution: 4, affordability: 0, happiness: -3, sustainability: -5, budget: 0 } },
    ],
  },
  {
    level: 5,
    title: { en: "Energy for Everyone", ro: "Energie pentru toți", ru: "Энергия для всех" },
    description: {
      en: "A low-income neighborhood struggles to afford electricity. What will you do?",
      ro: "Un cartier cu venituri mici se luptă să-și permită electricitatea. Ce vei face?",
      ru: "Малообеспеченный район с трудом оплачивает электроэнергию. Что ты предпримешь?",
    },
    options: [
      { text: { en: "Subsidize clean energy access for the neighborhood", ro: "Subvenționează accesul la energie curată pentru cartier", ru: "Субсидировать доступ к чистой энергии для района" }, effects: { clean: 8, pollution: -4, affordability: 15, happiness: 15, sustainability: 8, budget: -25 } },
      { text: { en: "Leave prices as they are", ro: "Lasă prețurile așa cum sunt", ru: "Оставить цены без изменений" }, effects: { clean: 0, pollution: 0, affordability: -10, happiness: -12, sustainability: -3, budget: 0 } },
    ],
  },
  {
    level: 6,
    title: { en: "Buildings that Waste Energy", ro: "Clădiri care irosesc energie", ru: "Здания, теряющие энергию" },
    description: {
      en: "Many older buildings leak heat and waste electricity. A retrofit program is proposed.",
      ro: "Multe clădiri vechi pierd căldură și irosesc electricitate. Este propus un program de modernizare.",
      ru: "Многие старые здания теряют тепло и впустую расходуют электричество. Предлагается программа модернизации.",
    },
    options: [
      { text: { en: "Fund energy-efficient building retrofits", ro: "Finanțează modernizarea clădirilor pentru eficiență energetică", ru: "Профинансировать энергоэффективную модернизацию зданий" }, effects: { clean: 5, pollution: -10, affordability: 10, happiness: 6, sustainability: 12, budget: -30 } },
      { text: { en: "Postpone the program to save money", ro: "Amână programul pentru a economisi bani", ru: "Отложить программу ради экономии" }, effects: { clean: 0, pollution: 6, affordability: 0, happiness: -4, sustainability: -6, budget: 0 } },
    ],
  },
  {
    level: 7,
    title: { en: "Getting Around Town", ro: "Deplasarea prin oraș", ru: "Передвижение по городу" },
    description: {
      en: "Traffic congestion and vehicle emissions are rising. The city debates transportation upgrades.",
      ro: "Congestia traficului și emisiile vehiculelor cresc. Orașul dezbate modernizarea transportului.",
      ru: "Заторы на дорогах и выбросы транспорта растут. Город обсуждает модернизацию транспорта.",
    },
    options: [
      { text: { en: "Improve public transportation with electric buses", ro: "Îmbunătățește transportul public cu autobuze electrice", ru: "Улучшить общественный транспорт с помощью электробусов" }, effects: { clean: 10, pollution: -12, affordability: 5, happiness: 10, sustainability: 12, budget: -35 } },
      { text: { en: "Build more roads for cars instead", ro: "Construiește în schimb mai multe drumuri pentru mașini", ru: "Построить вместо этого больше дорог для машин" }, effects: { clean: -5, pollution: 10, affordability: -2, happiness: -2, sustainability: -12, budget: -15 } },
    ],
  },
  {
    level: 8,
    title: { en: "An Old Power Plant", ro: "O centrală electrică veche", ru: "Старая электростанция" },
    description: {
      en: "The city's aging fossil fuel plant is expensive to run and heavily polluting. Do you retire it?",
      ro: "Vechea centrală pe combustibili fosili a orașului este costisitoare de exploatat și puternic poluantă. O închizi?",
      ru: "Устаревшая электростанция на ископаемом топливе дорога в эксплуатации и сильно загрязняет воздух. Закроешь её?",
    },
    options: [
      { text: { en: "Retire the plant and replace it with renewables", ro: "Închide centrala și înlocuiește-o cu energie regenerabilă", ru: "Закрыть станцию и заменить её возобновляемой энергией" }, effects: { clean: 25, pollution: -20, affordability: -8, happiness: 8, sustainability: 20, budget: -50 } },
      { text: { en: "Keep the plant running to save costs now", ro: "Menține centrala în funcțiune pentru a economisi costuri acum", ru: "Оставить станцию работать ради экономии сейчас" }, effects: { clean: -5, pollution: 15, affordability: 5, happiness: -8, sustainability: -15, budget: 0 } },
    ],
  },
  {
    level: 9,
    title: { en: "Community Solar Program", ro: "Program comunitar de energie solară", ru: "Общественная солнечная программа" },
    description: {
      en: "Not everyone can afford their own solar panels. A shared community solar program is proposed.",
      ro: "Nu toată lumea își permite propriile panouri solare. Este propus un program comunitar comun de energie solară.",
      ru: "Не все могут позволить себе собственные солнечные панели. Предлагается общая программа солнечной энергии для сообщества.",
    },
    options: [
      { text: { en: "Launch a shared community solar program", ro: "Lansează un program comunitar de energie solară", ru: "Запустить общую программу солнечной энергии" }, effects: { clean: 12, pollution: -6, affordability: 12, happiness: 12, sustainability: 10, budget: -30 } },
      { text: { en: "Let only wealthier residents install panels", ro: "Permite doar rezidenților mai înstăriți să instaleze panouri", ru: "Разрешить установку панелей только состоятельным жителям" }, effects: { clean: 5, pollution: -2, affordability: -8, happiness: -6, sustainability: -2, budget: -10 } },
    ],
  },
  {
    level: 10,
    title: { en: "Greenville's Future", ro: "Viitorul orașului Greenville", ru: "Будущее Гринвилла" },
    description: {
      en: "The final decision: how should Greenville plan its long-term energy future?",
      ro: "Decizia finală: cum ar trebui Greenville să-și planifice viitorul energetic pe termen lung?",
      ru: "Финальное решение: как Гринвиллу спланировать своё энергетическое будущее на долгий срок?",
    },
    options: [
      { text: { en: "Commit to 100% renewable energy by policy", ro: "Angajează-te printr-o politică la 100% energie regenerabilă", ru: "Официально закрепить курс на 100% возобновляемую энергию" }, effects: { clean: 20, pollution: -15, affordability: 5, happiness: 15, sustainability: 25, budget: -40 } },
      { text: { en: "Keep a mixed energy approach for now", ro: "Păstrează deocamdată o abordare energetică mixtă", ru: "Пока сохранить смешанный подход к энергетике" }, effects: { clean: 5, pollution: 0, affordability: 3, happiness: 2, sustainability: 0, budget: -10 } },
    ],
  },
];

function insertFacts(db, rows) {
  const insertFact = db.prepare(
    "INSERT INTO facts (category, text_en, text_ro, text_ru) VALUES (?, ?, ?, ?)"
  );
  const run = db.transaction((items) => {
    for (const f of items) insertFact.run(f.category, f.en, f.ro, f.ru);
  });
  run(rows);
}

function insertScenarios(db, rows) {
  const insertScenario = db.prepare(
    `INSERT INTO game_scenarios
      (level, title_en, title_ro, title_ru, description_en, description_ro, description_ru, options_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const run = db.transaction((items) => {
    for (const s of items) {
      insertScenario.run(
        s.level,
        s.title.en,
        s.title.ro,
        s.title.ru,
        s.description.en,
        s.description.ro,
        s.description.ru,
        JSON.stringify(s.options)
      );
    }
  });
  run(rows);
}

// force = true: always wipe and reinsert (used by the manual `npm run seed` command).
// force = false (default): only insert into tables that are currently empty — safe to
// call on every server startup, since it never touches tables that already have data.
function seedDatabase(db, { force = false } = {}) {
  if (force) {
    db.exec("DELETE FROM facts; DELETE FROM game_scenarios;");
  }

  let factsInserted = 0;
  const factCount = db.prepare("SELECT COUNT(*) AS count FROM facts").get().count;
  if (force || factCount === 0) {
    insertFacts(db, facts);
    factsInserted = facts.length;
  }

  let scenariosInserted = 0;
  const scenarioCount = db.prepare("SELECT COUNT(*) AS count FROM game_scenarios").get().count;
  if (force || scenarioCount === 0) {
    insertScenarios(db, scenarios);
    scenariosInserted = scenarios.length;
  }

  return { factsInserted, scenariosInserted };
}

module.exports = { facts, scenarios, seedDatabase };
