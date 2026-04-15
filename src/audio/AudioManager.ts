type SFXType = "click" | "enemy_defeat" | "panel_click";

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
  audioContext: AudioContext | null = null;

  private readonly MUSIC_PATH = "/assets/audio/background.ogg";
  private readonly SFX_PATHS: Record<SFXType, string> = {
    click: "/assets/audio/click.mp3",
    enemy_defeat: "/assets/audio/enemy_defeat.mp3",
    panel_click: "/assets/audio/panel_click.mp3",
  };

  private constructor() {
    if (typeof window !== "undefined") {
      const resumeAudio = () => {
        if (this.audioContext && this.audioContext.state === "suspended") {
          this.audioContext.resume().then(() => {
            console.log("[AudioManager] AudioContext resumed");
          });
        }
      };

      const events = ["touchstart", "touchend", "mousedown", "keydown"];
      const handler = () => {
        resumeAudio();
        events.forEach((e) => document.removeEventListener(e, handler));
      };
      events.forEach((e) => document.addEventListener(e, handler, { once: true }));
    }
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      // Создаем AudioContext с учетом префиксов для Safari
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      this.music = new Audio(this.MUSIC_PATH);
      this.music.loop = true;
      this.music.volume = this.config.musicVolume;
      this.music.preload = "auto";

      this.music.setAttribute("playsinline", "true");
      this.music.setAttribute("webkit-playsinline", "true");

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
        audio.setAttribute("playsinline", "true");
        audio.setAttribute("webkit-playsinline", "true");

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
          resolve();
        });
      });
    });

    await Promise.all(loadPromises);
  }

  playMusic(): void {
    if (!this.isInitialized || !this.music) return;
    if (this.config.isMuted || !this.config.isMusicEnabled) return;

    // Резюмируем AudioContext если нужно (iOS требование)
    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }

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

  playSFX(type: SFXType): void {
    if (!this.isInitialized || this.config.isMuted) return;

    const originalAudio = this.sfxCache.get(type);
    if (!originalAudio) {
      console.warn(`[AudioManager] SFX not found: ${type}`);
      return;
    }

    const sfx = originalAudio.cloneNode() as HTMLAudioElement;
    sfx.volume = this.config.sfxVolume;

    const playPromise = sfx.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn(`[AudioManager] SFX play prevented:`, err);
      });
    }

    sfx.addEventListener(
      "ended",
      () => {
        sfx.remove();
      },
      { once: true },
    );
  }

  playClick(): void {
    this.playSFX("click");
  }

  playEnemyDefeat(): void {
    this.playSFX("enemy_defeat");
  }

  setMusicVolume(volume: number): void {
    this.config.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume = this.config.musicVolume;
    }
  }

  setSFXVolume(volume: number): void {
    this.config.sfxVolume = Math.max(0, Math.min(1, volume));
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
