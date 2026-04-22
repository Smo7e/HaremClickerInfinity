// src/audio/AudioManager.ts

type SFXType = "click" | "enemy_defeat" | "panel_click";

interface AudioConfig {
  musicVolume: number;
  sfxVolume: number;
  isMuted: boolean;
  isMusicEnabled: boolean;
}

// Интерфейс для кэшированных буферов звуков
interface SFXBuffers {
  click: AudioBuffer | null;
  enemy_defeat: AudioBuffer | null;
  panel_click: AudioBuffer | null;
}

class AudioManager {
  private static instance: AudioManager;

  // Храним буферы вместо HTMLAudioElement
  private sfxBuffers: SFXBuffers = {
    click: null,
    enemy_defeat: null,
    panel_click: null,
  };

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

  // Gain node для SFX, чтобы управлять общей громкостью эффектов
  private sfxGainNode: GainNode | null = null;

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

      // Важно: возобновляем контекст при любом взаимодействии
      const events = ["touchstart", "touchend", "mousedown", "keydown", "pointerdown"];
      const handler = () => {
        resumeAudio();
        // Не удаляем слушатели сразу, так как контекст может снова заснуть
      };

      events.forEach((e) => document.addEventListener(e, handler, { passive: true }));
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

      // Создаем мастер-гейн для SFX
      this.sfxGainNode = this.audioContext.createGain();
      this.sfxGainNode.connect(this.audioContext.destination);
      this.sfxGainNode.gain.value = this.config.sfxVolume;

      // Загружаем музыку
      const response = await fetch(this.MUSIC_PATH);
      const arrayBuffer = await response.arrayBuffer();
      this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      this.musicGainNode = this.audioContext.createGain();
      this.musicGainNode.connect(this.audioContext.destination);
      this.musicGainNode.gain.value = this.config.musicVolume;

      // Загружаем SFX в буферы
      await this.preloadSFXBuffers();

      this.isInitialized = true;
      console.log("[AudioManager] Initialized successfully with Web Audio API");
    } catch (error) {
      console.error("[AudioManager] Initialization failed:", error);
    }
  }

  private async preloadSFXBuffers(): Promise<void> {
    const loadPromises = Object.entries(this.SFX_PATHS).map(async ([key, path]) => {
      try {
        const response = await fetch(path);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.sfxBuffers[key as SFXType] = audioBuffer;
      } catch (err) {
        console.warn(`[AudioManager] Failed to load SFX buffer: ${path}`, err);
      }
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

  // Новый метод воспроизведения SFX через Web Audio API
  playSFX(type: SFXType): void {
    if (!this.isInitialized || this.config.isMuted) return;

    const buffer = this.sfxBuffers[type];
    if (!buffer || !this.audioContext) {
      console.warn(`[AudioManager] SFX buffer not found or context missing: ${type}`);
      return;
    }

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    // Подключаем к гейну SFX
    source.connect(this.sfxGainNode!);

    source.start(0);

    // Очистка после воспроизведения не требуется для BufferSource,
    // но можно добавить onended для отладки
    source.onended = () => {
      source.disconnect();
    };
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
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.config.sfxVolume;
    }
  }

  setMuted(muted: boolean): void {
    this.config.isMuted = muted;
    if (muted) {
      this.pauseMusic();
      // Для Web Audio API можно просто установить gain в 0, но паузы музыки достаточно
      if (this.sfxGainNode) {
        this.sfxGainNode.gain.value = 0;
      }
    } else {
      if (this.sfxGainNode) {
        this.sfxGainNode.gain.value = this.config.sfxVolume;
      }
      if (this.config.isMusicEnabled) {
        this.playMusic();
      }
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
