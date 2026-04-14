// src/services/AdService.ts - полный исправленный файл

import { SDK } from "ysdk";
import { audioManager } from "../audio/AudioManager";

type AdCallback = (success: boolean) => void;

class AdService {
  private ysdk: SDK | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (this.initialized) return;

    try {
      const yaGames = (window as any).YaGames;
      if (!yaGames || window.self === window.top) {
        console.log("[AdService] Dev mode");
        this.initialized = true;
        return;
      }

      this.ysdk = await yaGames.init();
      this.initialized = true;

      // ✅ ДОБАВИТЬ: Сообщаем SDK что игра загружена
      if (this.ysdk && this.ysdk.features?.LoadingAPI?.ready) {
        this.ysdk.features.LoadingAPI.ready();
        console.log("[AdService] LoadingAPI.ready() called");
      }
    } catch (error) {
      console.error("[AdService] Init failed:", error);
    }
  }
  startGameplay(): void {
    if (this.ysdk?.features?.GameplayAPI?.start) {
      this.ysdk.features.GameplayAPI.start();
      console.log("[AdService] Gameplay started");
    }
  }

  stopGameplay(): void {
    if (this.ysdk?.features?.GameplayAPI?.stop) {
      this.ysdk.features.GameplayAPI.stop();
      console.log("[AdService] Gameplay stopped");
    }
  }
  showFullscreenAd(onClose?: () => void): void {
    // Обязательно ставим звук на паузу (требование п. 4.7)
    audioManager.setMuted(true);

    if (!this.ysdk?.adv) {
      // Для локальной разработки
      console.log("[AdService] Dev mode");
      setTimeout(() => {
        audioManager.setMuted(false);
        onClose?.();
      }, 1000);
      return;
    }

    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: () => {
          audioManager.setMuted(false); // Возвращаем звук
          onClose?.();
        },
        onError: (error: any) => {
          audioManager.setMuted(false);
          console.error("Ad error:", error);
          onClose?.();
        },
      },
    });
  }

  showRewardedAd(callback: AdCallback): void {
    audioManager.setMuted(true);
    if (!this.ysdk?.adv) {
      console.log("[AdService] Rewarded ad (dev mode)");
      audioManager.setMuted(true);
      callback(true);
      return;
    }

    let rewarded = false;

    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          console.log("[AdService] User rewarded");
          audioManager.setMuted(false);
          rewarded = true;
        },
        onClose: () => {
          console.log("[AdService] Rewarded video closed, rewarded:", rewarded);
          audioManager.setMuted(false);
          callback(rewarded);
        },
        onError: (error: any) => {
          console.error("[AdService] Rewarded video error:", error);
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
