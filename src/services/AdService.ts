// src/services/AdService.ts
import { SDK, Player } from "ysdk";
import { audioManager } from "../audio/AudioManager";

type AdCallback = (success: boolean) => void;

class AdService {
  private ysdk: SDK | null = null;
  private player: Player | null = null;
  private initialized = false;
  private isAuthorized = false;
  private lastFullscreenAdTime: number = 0;
  private readonly MIN_AD_INTERVAL = 30000;

  async init(): Promise<void> {
    if (this.initialized) return;
    try {
      const yaGames = (window as any).YaGames;
      if (!yaGames || window.self === window.top) {
        console.log("[AdService] Dev mode or not in iframe");
        this.initialized = true;
        return;
      }

      this.ysdk = await yaGames.init();

      if (!this.ysdk) {
        console.log("[AdService] yaGames.init() error");
        return;
      }

      if (this.ysdk.features?.LoadingAPI?.ready) {
        this.ysdk.features.LoadingAPI.ready();
        console.log("[AdService] LoadingAPI.ready() called");
      }

      try {
        this.player = await this.ysdk.getPlayer();
        this.isAuthorized = true;
        console.log("[AdService] Player authorized:", this.player.getName());
      } catch (err) {
        console.log("[AdService] Player not authorized yet");
        this.isAuthorized = false;
      }

      this.initialized = true;
    } catch (error) {
      console.error("[AdService] Init failed:", error);
    }
  }

  // Метод для проверки авторизации
  getIsAuthorized(): boolean {
    return this.isAuthorized;
  }

  // Метод для показа окна авторизации
  async authorize(): Promise<boolean> {
    if (!this.ysdk) return false;
    try {
      // Если уже авторизован, возвращаем true
      if (this.isAuthorized) return true;

      // Показываем окно авторизации
      // ✅ ИСПРАВЛЕНИЕ: openAuthDialog может возвращать void или Player.
      // Обрабатываем оба случая.
      const result: any = await this.ysdk.auth.openAuthDialog();

      if (result && typeof result === "object") {
        this.player = result as Player;
        this.isAuthorized = true;
        console.log("[AdService] User authorized successfully");
        return true;
      }

      return false;
    } catch (err) {
      console.error("[AdService] Auth failed", err);
      return false;
    }
  }

  // Получение данных из облака Яндекса
  async getData(keys: string[]): Promise<any> {
    if (!this.player || !this.isAuthorized) return null;
    try {
      const data = await this.player.getData(keys);
      return data;
    } catch (err) {
      console.error("[AdService] Get data failed", err);
      return null;
    }
  }

  // Сохранение данных в облако Яндекса
  async setData(data: any): Promise<void> {
    if (!this.player || !this.isAuthorized) {
      console.warn("[AdService] Cannot save to cloud: not authorized");
      return;
    }
    try {
      await this.player.setData(data);
      console.log("[AdService] Data saved to cloud");
    } catch (err) {
      console.error("[AdService] Set data failed", err);
    }
  }

  startGameplay(): void {
    if (this.ysdk?.features?.GameplayAPI?.start) {
      this.ysdk.features.GameplayAPI.start();
    }
  }

  stopGameplay(): void {
    if (this.ysdk?.features?.GameplayAPI?.stop) {
      this.ysdk.features.GameplayAPI.stop();
    }
  }

  showFullscreenAd(onClose?: (wasShown: boolean) => void): void {
    const now = Date.now();

    // Проверяем, прошло ли 30 секунд с последнего показа
    if (now - this.lastFullscreenAdTime < this.MIN_AD_INTERVAL) {
      console.log("[AdService] Fullscreen ad skipped: too soon");
      onClose?.(false); // Вызываем callback с false (реклама не показана)
      return;
    }

    audioManager.setMuted(true);

    if (!this.ysdk?.adv) {
      // Dev режим - показываем фейковую рекламу с задержкой
      setTimeout(() => {
        audioManager.setMuted(false);
        onClose?.(true);
      }, 1000);
      return;
    }

    // Обновляем время последнего показа
    this.lastFullscreenAdTime = now;

    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: (wasShown: boolean) => {
          audioManager.setMuted(false);
          onClose?.(wasShown);
          // Сбрасываем таймер при успешном показе
          this.lastFullscreenAdTime = Date.now();
        },
        onError: () => {
          audioManager.setMuted(false);
          onClose?.(false);
        },
      },
    });
  }

  showRewardedAd(callback: AdCallback): void {
    audioManager.setMuted(true);
    if (!this.ysdk?.adv) {
      audioManager.setMuted(false);
      callback(true); // В дев режиме всегда успех
      return;
    }
    let rewarded = false;
    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          rewarded = true;
        },
        onClose: () => {
          audioManager.setMuted(false);
          callback(rewarded);
        },
        onError: () => {
          audioManager.setMuted(false);
          callback(false);
        },
      },
    });
  }

  get isAvailable(): boolean {
    return this.initialized && !!this.ysdk?.adv;
  }
}

export const adService = new AdService();
