type DeepKeys<T, Prefix extends string = ""> = T extends string
    ? Prefix extends ""
        ? never
        : Prefix
    : T extends object
      ? {
            [K in keyof T]: K extends string
                ? DeepKeys<T[K], Prefix extends "" ? K : `${Prefix}.${K}`>
                : never;
        }[keyof T]
      : never;

export type LocaleKeys = DeepKeys<typeof locales.ru>;

export const locales = {
    ru: {
        ui: {
            play: "Играть",
            settings: "Настройки",
            back: "Назад",
            cancel: "Отмена",
            continue: "Продолжить",
            level: "Уровень",
            language: "Язык",
            changeLanguage: "Сменить язык",
            audio: "Звук",
            music: "Музыка",
            sfx: "Эффекты",
            muteAll: "Выключить все",
            resetVolume: "Сбросить",
            gameplay: "Игровой процесс",
            pauseGame: "Поставить на паузу",
            resumeGame: "Продолжить",
            support: "Поддержка",
            about: "О игре",
            showCredits: "Показать авторов",
            hideCredits: "Скрыть авторов",
            thanksForPlaying: "Спасибо за игру!",
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
            all: "Все",
            noItems: "Коллекция пуста",
            noWaifus: "Нет вайфу",
            summonFirst: "Сначала призовите вайфу",
            summon: "Призвать",
            summoning: "Призыв",
            dropRates: "Шансы выпадения",
            youHave: "У вас",
            dropPool: "Пул призыва",
            dropPoolHint:
                "При повторном выпадении вайфу: +30% к базовым статам",
            duplicate: "Дубликат!",
            stats: "статов",
            viewFullPool: "Открыть полный пул",
            poolPreviewHint:
                "Нажмите кнопку ниже чтобы увидеть всех доступных вайфу",
            collectionProgress: "Прогресс коллекции",
            maxedWaifus: "Максимум",
            poolEmpty: "Все вайфу достигли максимума!",
            poolEmptyWarning: "Все вайфу достигли лимита!",
            available: "дост.",
            affection: "Привязанность",
            critChance: "Шанс крита",
            critPower: "Сила крита",
            outfits: "Наряды",
            totalStats: "Всего нанесено урона",
            clicks: "кликов",
            damage: "урона",
            pause: "Пауза",
            resume: "Продолжить",
            exitToMenu: "Выйти в меню",
            rarity: "Редкость",
            common: "Обычная",
            uncommon: "Необычная",
            rare: "Редкая",
            epic: "Эпическая",
            legendary: "Легендарная",
            mythic: "Мифическая",
            water: "Вода",
            fire: "Огонь",
            earth: "Земля",
            ice: "Лед",
            light: "Свет",
            dark: "Тьма",
            physical: "Физический",
            boss: "БОСС",
            enemy: "Враг",
            hp: "ХП",
            weak: "Уязвим",
            resist: "Сопротивление",
            normal: "Нормально",
            obtained: "Получено",
            locked: "Заблокировано",
            weapon: "Оружие",
            accessory: "Аксессуар",
            memoria: "Мемория",
            outfit: "Наряд",
            close: "Закрыть",
            select: "Выбрать",
            active: "Активна",
            max: "МАКС",
            availableCount: "доступно",
        },

        title: {
            accent: "Гарем",
            main: "Кликер",
            sub: "Бесконечность",
        },

        languages: {
            ru: "Русский",
            en: "English",
            tr: "Türkçe",
        },

        upgrades: {
            globalHint: "Улучшения применяются ко всем вайфу",
            click: {
                name: "Сила клика",
                desc: "Увеличивает урон от клика",
            },
            auto: {
                name: "Автоклик",
                desc: "Автоматический урон в секунду",
            },
            crit: {
                name: "Критический удар",
                desc: "Шанс нанести двойной урон",
            },
            luck: {
                name: "Удача призыва",
                desc: "Увеличивает шанс редких вайфу",
            },
        },

        gacha: {
            desc: "Призовите новую вайфу за эссенцию",
            luckBonus: "Бонус удачи",
        },

        collection: {
            weapons: "Оружие",
            accessories: "Аксессуары",
            memoria: "Мемории",
            outfits: "Наряды",
        },

        waifus: {
            names: {
                Tiamat: "Тиамат",
                Cerberus: "Цербер",
                Phoenix: "Феникс",
                Leviathan: "Левиафан",
                Terra: "Терра",
                YukiOnna: "Юки-онна",
                Ignis: "Игнис",
                Aqua: "Аква",
                Gaia: "Гайя",
                Umbra: "Умбра",
                Ruby: "Руби",
                Sapphire: "Сапфир",
                Emerald: "Изумруд",
                Frost: "Фрост",
                Lux: "Люкс",
                Sakura: "Сакура",
                Yui: "Юи",
                Hana: "Хана",
                Momo: "Момо",
                Rin: "Рин",
                Sora: "Сора",
            },
            mythic: {
                tiamat: "Мать первозданного хаоса, из чьих вод родились боги. Когда её дети предали её, она породила чудовищ, чтобы уничтожить мир.",
            },
            legendary: {
                cerberus:
                    "Страж врат преисподней с тремя головами. Ни один дух не проходит мимо незамеченным.",
                phoenix:
                    "Бессмертная птица, возрождающаяся из пепла. Её крик разносится по всем мирам.",
            },
            epic: {
                leviathan:
                    "Древний змей бездонных глубин. Корабли дрожат при её появлении.",
                terra: "Мать-земля, дарующая жизнь и защищающая природу.",
                yukionna:
                    "Дух зимних метелей и снежных вершин. Холодна как лёд, прекрасна как иней.",
            },
            rare: {
                ignis: "Рыцарь пламени, чей меч горит вечным огнём.",
                aqua: "Маг приливов, управляющая водой как продолжение своего тела.",
                gaia: "Охотница за сокровищами древних руин, защищённая силой земли.",
                umbra: "Теневой клинок, убивающий молча и исчезающий во тьме.",
            },
            uncommon: {
                ruby: "Наёмница с горячим темпераментом и ещё более горячими клинками.",
                sapphire: "Мудрая учёная, хранящая знания тысячелетий.",
                emerald: "Лесная следопытка, чьи стрелы не промахиваются.",
                frost: "Маг льда, способный заморозить само время.",
                lux: "Жрица света, исцеляющая раны и души.",
            },
            common: {
                sakura: "Начинающая воительница, мечтающая о великих подвигах.",
                yui: "Простая деревенская девушка с добрым сердцем.",
                hana: "Рыбачка, знающая все секреты моря.",
                momo: "Повариха, способная накормить целую армию.",
                rin: "Фермерша, выращивающая золотистый рис.",
                sora: "Быстрая посыльная, доставляющая письма в любую точку мира.",
            },
        },
    },
} as const;

export type Lang = keyof typeof locales;
