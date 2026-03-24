// i18n.ts
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

export function t(key: keyof typeof locales.ru): string {
  return locales[currentLang][key] ?? locales.ru[key] ?? key;
}

export function setLang(lang: Lang) {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}
