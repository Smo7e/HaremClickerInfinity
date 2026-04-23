import { KEY } from "../hooks/useSave";
import { adService } from "../services/AdService";
import { LANGUAGE_CONFIG, locales, type Lang } from "./locales";

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<{
        environment: { i18n: { lang: string } };
        adv: {
          showFullscreenAdv(params: {
            callbacks: {
              onClose?: () => void;
              onError?: (error: any) => void;
            };
          }): void;
          showRewardedVideo(params: {
            callbacks: {
              onRewarded?: () => void;
              onClose?: () => void;
              onError?: (error: any) => void;
            };
          }): void;
        };
      }>;
    };
  }
}

let currentLang: Lang = (() => {
  const saved = localStorage.getItem(KEY.LANGUAGE) as Lang;
  if (saved && LANGUAGE_CONFIG[saved]) {
    return saved;
  }
  return "en";
})();

export async function initI18n() {
  // 1. Пробуем язык из Яндекс SDK (приоритет)
  if (window.YaGames) {
    try {
      const ysdk = await adService.getSDK();
      const yaLang = (ysdk!.environment?.i18n?.lang as Lang) ?? "en";

      if (yaLang && LANGUAGE_CONFIG[yaLang]) {
        setLang(yaLang);
        return;
      }
    } catch (e) {
      console.warn("[i18n] Failed to get YaGames lang:", e);
    }
  }

  const savedLang = localStorage.getItem(KEY.LANGUAGE) as Lang;

  if (savedLang && LANGUAGE_CONFIG[savedLang]) {
    setLang(savedLang);
  } else {
    setLang("en"); // Дефолт
  }
}

export function t(key: string): string {
  const keys = key.split(".");
  let value: any = locales[currentLang];

  for (const k of keys) {
    if (!value) break;
    value = value[k];
  }

  if (value === undefined) {
    value = locales.en;
    for (const k of keys) {
      if (value === undefined) return key;
      value = value[k];
    }
  }

  return value ?? key;
}

export function setLang(lang: Lang) {
  currentLang = lang;
  localStorage.setItem(KEY.LANGUAGE, lang);
}

export function getLang(): Lang {
  return currentLang;
}
