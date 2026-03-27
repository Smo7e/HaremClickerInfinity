import { locales, type Lang } from "./locales";

declare global {
    interface Window {
        YaGames?: {
            init(): Promise<{
                environment: { i18n: { lang: string } };
            }>;
        };
    }
}

let currentLang: Lang = "ru";

export async function initI18n() {
    if (window.YaGames) {
        const ysdk = await window.YaGames.init();
        const lang = ysdk.environment.i18n.lang as Lang;
        if (locales[lang]) currentLang = lang;
    }
}

export function t(key: string): string {
    const keys = key.split(".");
    let value: any = locales[currentLang];

    for (const k of keys) {
        if (value === undefined) break;
        value = value[k];
    }

    if (value === undefined) {
        value = locales.ru;
        for (const k of keys) {
            if (value === undefined) return key;
            value = value[k];
        }
    }

    return value ?? key;
}

export function setLang(lang: Lang) {
    currentLang = lang;
}

export function getLang(): Lang {
    return currentLang;
}
