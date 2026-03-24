// src/audio/AudioManager.ts

type SFXType = "click" | "enemy_defeat" | "gacha_summon" | "gacha_rare" | "gacha_mythic" | "panel_click";

interface AudioConfig {
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  isMusicEnabled: boolean;
}

class AudioManager {
  private static instance: AudioManager;
  private music: HTMLAudioElement | null = null;
  private sfxCache: Map<SFXType, HTMLAudioElement> = new Map();
  private config: AudioConfig = {
    musicVolume: 1,
    sfxVolume: 1,
    isMuted: false,
    isMusicEnabled: true,
  };
  private isInitialized = false;
  private audioContext: AudioContext | null = null;

  private readonly MUSIC_PATH = "/assets/audio/background.ogg";
  private readonly SFX_PATHS: Record<SFXType, string> = {
    click: "/assets/audio/click.mp3",
    enemy_defeat: "/assets/audio/enemy_defeat.mp3",
    panel_click: "/assets/audio/panel_click.mp3",

    gacha_summon: "/assets/audio/gacha_summon.wav",
    gacha_rare: "/assets/audio/gacha_rare.wav",
    gacha_mythic: "/assets/audio/gacha_mythic.wav",
  };

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  // Инициализация (должна вызываться после первого взаимодействия пользователя)
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Создаем AudioContext для продвинутой обработки (опционально)
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Загружаем фоновую музыку
      this.music = new Audio(this.MUSIC_PATH);
      this.music.loop = true;
      this.music.volume = this.config.musicVolume;
      this.music.preload = "auto";

      // Предзагрузка SFX
      await this.preloadSFX();

      this.isInitialized = true;
      console.log("[AudioManager] Initialized successfully");
    } catch (error) {
      console.error("[AudioManager] Initialization failed:", error);
    }
  }

  private async preloadSFX(): Promise<void> {
    const loadPromises = Object.entries(this.SFX_PATHS).map(([key, path]) => {
      return new Promise<void>((resolve) => {
        const audio = new Audio(path);
        audio.preload = "auto";
        audio.volume = this.config.sfxVolume;

        audio.addEventListener(
          "canplaythrough",
          () => {
            this.sfxCache.set(key as SFXType, audio);
            resolve();
          },
          { once: true },
        );

        audio.addEventListener("error", () => {
          console.warn(`[AudioManager] Failed to load SFX: ${path}`);
          resolve(); // Продолжаем даже если один файл не загрузился
        });
      });
    });

    await Promise.all(loadPromises);
  }

  // Управление фоновой музыкой
  playMusic(): void {
    if (!this.isInitialized || !this.music) return;
    if (this.config.isMuted || !this.config.isMusicEnabled) return;

    // Важно: проверяем состояние перед воспроизведением
    if (this.music.paused) {
      const playPromise = this.music.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("[AudioManager] Music play prevented:", err);
        });
      }
    }
  }

  pauseMusic(): void {
    if (this.music && !this.music.paused) {
      this.music.pause();
    }
  }

  stopMusic(): void {
    if (this.music) {
      this.music.pause();
      this.music.currentTime = 0;
    }
  }

  // Воспроизведение эффектов
  playSFX(type: SFXType): void {
    if (!this.isInitialized || this.config.isMuted) return;

    const originalAudio = this.sfxCache.get(type);
    if (!originalAudio) {
      console.warn(`[AudioManager] SFX not found: ${type}`);
      return;
    }

    // Клонируем аудио чтобы можно было воспроизводить несколько раз подряд
    const sfx = originalAudio.cloneNode() as HTMLAudioElement;
    sfx.volume = this.config.sfxVolume;

    const playPromise = sfx.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[AudioManager] SFX play prevented:`, err);
      });
    }

    // Автоочистка после воспроизведения
    sfx.addEventListener(
      "ended",
      () => {
        sfx.remove();
      },
      { once: true },
    );
  }

  // Утилиты для быстрого доступа к частым звукам
  playClick(): void {
    this.playSFX("click");
  }

  playEnemyDefeat(): void {
    this.playSFX("enemy_defeat");
  }

  playGacha(rarity: "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic"): void {
    if (rarity === "mythic") {
      this.playSFX("gacha_mythic");
    } else if (rarity === "legendary" || rarity === "epic") {
      this.playSFX("gacha_rare");
    } else {
      this.playSFX("gacha_summon");
    }
  }

  // Глобальное управление громкостью
  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume = this.config.musicVolume;
    }
  }

  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
    // Обновляем громкость в кэше для следующих воспроизведений
    this.sfxCache.forEach((audio) => {
      audio.volume = this.config.sfxVolume;
    });
  }

  setMuted(muted: boolean): void {
    this.config.isMuted = muted;
    if (muted) {
      this.pauseMusic();
    } else if (this.config.isMusicEnabled) {
      this.playMusic();
    }
  }

  getState(): AudioConfig {
    return { ...this.config };
  }

  get isReady(): boolean {
    return this.isInitialized;
  }
}

export const audioManager = AudioManager.getInstance();
export type { SFXType };
