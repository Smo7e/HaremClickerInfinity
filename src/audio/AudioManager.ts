type SFXType = "click" | "enemy_defeat" | "panel_click";

interface AudioConfig {
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  isMusicEnabled: boolean;
}

class AudioManager {
  private static instance: AudioManager;
  private sfxCache: Map<SFXType, HTMLAudioElement> = new Map();
  private config: AudioConfig = {
    musicVolume: 0.2,
    sfxVolume: 0.2,
    isMuted: false,
    isMusicEnabled: true,
  };
  private isInitialized = false;
  audioContext: AudioContext | null = null;

  private musicSource: AudioBufferSourceNode | null = null;
  private musicBuffer: AudioBuffer | null = null;
  private musicGainNode: GainNode | null = null;

  private readonly MUSIC_PATH = "assets/audio/background.ogg";
  private readonly SFX_PATHS: Record<SFXType, string> = {
    click: "assets/audio/click.mp3",
    enemy_defeat: "assets/audio/enemy_defeat.mp3",
    panel_click: "assets/audio/panel_click.mp3",
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
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Загружаем музыку в буфер
      const response = await fetch(this.MUSIC_PATH);
      const arrayBuffer = await response.arrayBuffer();
      this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.audioContext.destination);
      this.musicGainNode.gain.value = this.config.musicVolume;

      await this.preloadSFX();
      this.isInitialized = true;
      console.log("[AudioManager] Initialized successfully with Web Audio API for music");
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
    if (!this.isInitialized || !this.musicBuffer) return;
    if (this.config.isMuted || !this.config.isMusicEnabled) return;

    // Если уже играет, не запускаем повторно
    if (this.musicSource) return;

    if (this.audioContext?.state === "suspended") {
      this.audioContext.resume();
    }

    this.musicSource = this.audioContext!.createBufferSource();
    this.musicSource.buffer = this.musicBuffer;
    this.musicSource.loop = true;
    this.musicSource.connect(this.musicGainNode!);
    this.musicSource.start(0);
  }

  pauseMusic(): void {
    if (this.musicSource) {
      try {
        this.musicSource.stop();
      } catch (e) {
        // Игнорируем ошибку, если уже остановлен
      }
      this.musicSource = null;
    }
  }

  stopMusic(): void {
    this.pauseMusic();
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
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.config.musicVolume;
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
