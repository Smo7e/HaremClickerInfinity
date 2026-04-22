import { testWaifus, MONSTER_TEMPLATES, LOCATIONS, INVENTORY_ITEMS } from "../game/constant";
import { audioManager } from "../audio/AudioManager";

// Типы для отслеживания прогресса
export interface PreloadProgress {
  total: number;
  loaded: number;
  percentage: number;
}

// Функция для загрузки одного изображения
const loadImage = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve();
    img.onerror = () => {
      console.warn(`[Preload] Failed to load image: ${src}`);
      resolve(); // Resolve even on error to not block the game, but log it
    };
  });
};

// Функция для загрузки одного аудиофайла (через fetch для точного контроля байтов/факта загрузки)
const loadAudio = (src: string): Promise<void> => {
  return new Promise((resolve) => {
    fetch(src)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.blob();
      })
      .then(() => resolve())
      .catch((err) => {
        console.warn(`[Preload] Failed to load audio: ${src}`, err);
        resolve();
      });
  });
};

export const preloadAllAssets = async (onProgress?: (progress: PreloadProgress) => void): Promise<void> => {
  const urls: string[] = [];

  // 1. Собираем изображения Вайфу
  testWaifus.forEach((waifu) => {
    if (waifu.image) urls.push(waifu.image);
  });

  // 2. Собираем изображения Врагов
  MONSTER_TEMPLATES.forEach((enemy) => {
    if (enemy.sprite) urls.push(enemy.sprite);
  });

  // 3. Собираем фоны локаций
  LOCATIONS.forEach((loc) => {
    // Путь к фону формируется динамически в компоненте Background, но мы знаем структуру
    urls.push(`assets/images/backgrounds/${loc.id}.png`);
  });

  // 4. Собираем иконки предметов (уникальные)
  const iconSet = new Set<string>();
  Object.values(INVENTORY_ITEMS).forEach((item) => {
    if (item.icon) iconSet.add(`assets/images/icons/${item.icon}.png`);
  });
  // Добавляем иконки стихий и редкостей, если они используются как отдельные файлы
  ["water", "fire", "earth", "ice", "light", "dark", "physical"].forEach((el) =>
    iconSet.add(`assets/images/icons/${el}.png`),
  );
  ["common", "uncommon", "rare", "epic", "legendary", "mythic"].forEach((r) =>
    iconSet.add(`assets/images/icons/${r}.png`),
  );

  urls.push(...Array.from(iconSet));

  // 5. Аудио файлы (берем из AudioManager или жестко, если они статичны)
  // В AudioManager они загружаются асинхронно, но мы можем форсировать их предзагрузку здесь
  // или просто учесть их в общем счетчике, если хотим "честный" прогресс.
  // Для простоты добавим основные звуки, которые точно есть в public/assets/audio
  const audioFiles = [
    "assets/audio/background.ogg",
    "assets/audio/click.mp3",
    "assets/audio/enemy_defeat.mp3",
    "assets/audio/panel_click.mp3",
  ];

  // Создаем массив промисов для загрузки
  // Мы разделяем картинки и аудио, так как аудио может грузиться дольше или иначе
  const imagePromises = urls.map((url) => loadImage(url));
  const audioPromises = audioFiles.map((url) => loadAudio(url));

  const allPromises = [...imagePromises, ...audioPromises];
  const total = allPromises.length;
  let loaded = 0;

  // Функция обновления прогресса
  const updateProgress = () => {
    loaded++;
    if (onProgress) {
      onProgress({
        total,
        loaded,
        percentage: Math.min(100, Math.round((loaded / total) * 100)),
      });
    }
  };

  // Запускаем все промисы параллельно
  await Promise.all(allPromises.map((promise) => promise.then(updateProgress).catch(updateProgress)));

  // Инициализируем AudioContext заранее, чтобы браузер не блокировал его потом
  try {
    await audioManager.init();
  } catch (e) {
    console.error("[Preload] Audio init failed", e);
  }
};
