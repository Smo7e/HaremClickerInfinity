// src/locales/locales.ts

export const locales = {
  ru: {
    upgradesGlobalHint: "Улучшения применяются ко всем вайфу",
    affection: "Привязанность",
    critChance: "Шанс крита",
    critPower: "Сила крита",
    outfits: "Наряды",
    totalStats: "Всего нанесено урона",
    clicks: "кликов",
    damage: "урона",
    // Основное
    play: "Играть",
    settings: "Настройки",
    back: "Назад",
    cancel: "Отмена",
    continue: "Продолжить",
    level: "Уровень",

    // Язык
    language: "Язык",
    changeLanguage: "Сменить язык",
    ru: "Русский",
    en: "English",
    tr: "Türkçe",

    // Заголовки
    titleAccent: "Гарем",
    titleMain: "Кликер",
    titleSub: "Бесконечность",

    // Аудио
    audio: "Звук",
    sound: "Звук",
    music: "Музыка",
    sfx: "Эффекты",
    muteAll: "Выключить все",
    resetVolume: "Сбросить",

    // Геймплей
    gameplay: "Игровой процесс",
    pauseGame: "Поставить на паузу",
    resumeGame: "Продолжить",

    // Поддержка
    support: "Поддержка",
    contactUs: "Связаться с нами",

    // О игре
    about: "О игре",
    showCredits: "Показать авторов",
    hideCredits: "Скрыть авторов",
    thanksForPlaying: "Спасибо за игру!",

    // Игровые термины
    gems: "Кристаллы",
    tokens: "Токены",
    essence: "Эссенция",
    click: "Клик",
    auto: "Авто",
    upgrades: "Улучшения",
    waifus: "Вайфу",
    gacha: "Призыв",
    prestige: "Престиж",
    collection: "Коллекция",
    selectWaifu: "Выбрать вайфу",

    // Прокачка
    upgradeClick: "Сила клика",
    upgradeClickDesc: "Увеличивает урон от клика",
    upgradeAuto: "Автоклик",
    upgradeAutoDesc: "Автоматический урон в секунду",
    upgradeCrit: "Критический удар",
    upgradeCritDesc: "Шанс нанести двойной урон",
    upgradeLuck: "Удача призыва",
    upgradeLuckDesc: "Увеличивает шанс редких вайфу",

    // Гача
    gachaDesc: "Призовите новую вайфу за эссенцию",
    summon: "Призвать",
    summoning: "Призыв",
    dropRates: "Шансы выпадения",
    luckBonus: "Бонус удачи",
    youHave: "У вас",

    // Коллекция
    all: "Все",
    weapons: "Оружие",
    accessories: "Аксессуары",
    memoria: "Мемории",
    noItems: "Коллекция пуста",

    // Вайфу
    noWaifus: "Нет вайфу",
    summonFirst: "Сначала призовите вайфу",
    mythic_sun_goddess_desc: "Богиня солнца, излучающая божественное сияние. Все живое преклоняется перед её светом.",

    // LEGENDARY
    legendary_hell_guardian_desc: "Страж врат преисподней с тремя головами. Ни один дух не проходит мимо незамеченным.",
    legendary_immortal_bird_desc: "Бессмертная птица, возрождающаяся из пепла. Её крик разносится по всем мирам.",

    // EPIC
    epic_sea_serpent_desc: "Древний змей бездонных глубин. Корабли дрожат при её появлении.",
    epic_earth_mother_desc: "Мать-земля, дарующая жизнь и защищающая природу.",
    epic_snow_spirit_desc: "Дух зимних метелей и снежных вершин. Холодна как лёд, прекрасна как иней.",

    // RARE
    rare_flame_knight_desc: "Рыцарь пламени, чей меч горит вечным огнём.",
    rare_tide_mage_desc: "Маг приливов, управляющая водой как продолжение своего тела.",
    rare_nature_hunter_desc: "Охотница за сокровищами древних руин, защищенная силой земли.",
    rare_shadow_blade_desc: "Теневой клинок, убивающий молча и исчезающий во тьме.",

    // UNCOMMON
    uncommon_mercenary_desc: "Наемница с горячим темпераментом и ещё более горячими клинками.",
    uncommon_scholar_desc: "Мудрая учёная, хранящая знания тысячелетий.",
    uncommon_ranger_desc: "Лесная следопытка, чьи стрелы не промахиваются.",
    uncommon_ice_mage_desc: "Маг льда, способный заморозить само время.",
    uncommon_cleric_desc: "Жрица света, исцеляющая раны и души.",

    // COMMON
    common_trainee_desc: "Начинающая воительница, мечтающая о великих подвигах.",
    common_villager_desc: "Простая деревенская девушка с добрым сердцем.",
    common_fisher_desc: "Рыбачка, знающая все секреты моря.",
    common_cook_desc: "Повариха, способная накормить целую армию.",
    common_farmer_desc: "Фермерша, выращивающая золотистый рис.",
    common_messenger_desc: "Быстрая посыльная, доставляющая письма в любую точку мира.",
    dropPool: "Пул призыва",
    dropPoolHint: "При повторном выпадении вайфу: +30% к базовым статам",
    duplicate: "Дубликат!",
    stats: "статов",
    viewFullPool: "Открыть полный пул",
    poolPreviewHint: "Нажмите кнопку ниже чтобы увидеть всех доступных вайфу",
    collectionProgress: "Прогресс коллекции",
    maxedWaifus: "Максимум",
    poolEmpty: "Все вайфу достигли максимума!",
    poolEmptyWarning: "Все вайфу достигли лимита!",
    available: "дост.",
  },
} as const;

export type Lang = keyof typeof locales;
