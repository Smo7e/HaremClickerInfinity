// src/services/AdService.ts
import { SDK, Player } from "ysdk"; // Убрали Leaderboards из импорта, так как он теперь часть SDK
import { audioManager } from "../audio/AudioManager";

type AdCallback = (success: boolean) => void;

class AdService {
  private ysdk: SDK | null = null;
  private initPromise: Promise<SDK | null> | null = null;
  private player: Player | null = null;
  private initialized = false;
  private isAuthorized = false;

  private lastScoreSubmitTime: number = 0;
  private readonly MIN_SCORE_SUBMIT_INTERVAL = 1000;

  private lastFullscreenAdTime: number = 0;
  private readonly MIN_AD_INTERVAL = 30000;

  async getSDK(): Promise<SDK | null> {
    if (this.ysdk) return this.ysdk;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const yaGames = (window as any).YaGames;
        if (!yaGames || window.self === window.top) {
          console.log("[AdService] Dev mode or not in iframe");
          this.initialized = true;
          this.isAuthorized = false;
          return null;
        }

        const sdk = await yaGames.init();
        this.ysdk = sdk;
        this.initialized = true;

        if (sdk.features?.LoadingAPI?.ready) {
          sdk.features.LoadingAPI.ready();
        }

        try {
          const player = await sdk.getPlayer();
          const name = player.getName();

          if (name && name.length > 0) {
            this.player = player;
            this.isAuthorized = true;
            console.log("[AdService] User authorized:", name);
          } else {
            this.isAuthorized = false;
            this.player = null;
            console.log("[AdService] User guest (empty name)");
          }
        } catch (err) {
          this.isAuthorized = false;
          this.player = null;
          console.log("[AdService] User not authorized on init:", err);
        }

        return sdk;
      } catch (error) {
        console.error("[AdService] Init failed:", error);
        this.initialized = true;
        this.isAuthorized = false;
        return null;
      }
    })();
    return this.initPromise;
  }

  async init(): Promise<void> {
    await this.getSDK();
  }
  getPlayerName(): string | null {
    if (!this.player) return null;
    return this.player.getName();
  }

  /**
   * Отправка результата в лидерборд
   * @param score Число очков
   * @param leaderboardName Техническое имя лидерборда в консоли Яндекса
   */
  async submitScore(score: number, leaderboardName: string = "totalMaxLevels"): Promise<boolean> {
    // Проверка авторизации и наличия SDK
    if (!this.ysdk || !this.isAuthorized) {
      console.warn("[AdService] Cannot submit score: SDK not ready or user not authorized");
      return false;
    }

    // Проверка лимита запросов (1 раз в секунду)
    const now = Date.now();
    if (now - this.lastScoreSubmitTime < this.MIN_SCORE_SUBMIT_INTERVAL) {
      console.log("[AdService] Score submit skipped: too frequent");
      return false;
    }

    // Проверка доступности метода (согласно доке)
    // Примечание: isAvailableMethod может отсутствовать в старых версиях типизации, но есть в runtime
    if ((this.ysdk as any).isAvailableMethod) {
      try {
        const isAvailable = await (this.ysdk as any).isAvailableMethod("leaderboards.setScore");
        if (!isAvailable) {
          console.warn("[AdService] leaderboards.setScore is not available");
          return false;
        }
      } catch (e) {
        console.warn("[AdService] Error checking method availability", e);
      }
    }

    try {
      // ВАЖНО: Используем ysdk.leaderboards.setScore напрямую
      await this.ysdk.leaderboards.setScore(leaderboardName, score);

      this.lastScoreSubmitTime = Date.now();
      console.log("[AdService] Score submitted successfully:", score);
      return true;
    } catch (err: any) {
      console.error("[AdService] Failed to submit score:", err);
      // Ошибка LEADERBOARD_PLAYER_NOT_PRESENT обычно не возникает при setScore,
      // но если лидерборд не создан в консоли, будет ошибка.
      return false;
    }
  }

  /**
     * Получение позиции игрока в топе
5     * @param leaderboardName Техническое имя лидерборда
     * @returns позиция (rank) или null
     */
  async getPlayerRank(leaderboardName: string = "totalMaxLevels"): Promise<number | null> {
    if (!this.ysdk || !this.isAuthorized) {
      return null;
    }

    // Проверка доступности метода
    if ((this.ysdk as any).isAvailableMethod) {
      try {
        const isAvailable = await (this.ysdk as any).isAvailableMethod("leaderboards.getPlayerEntry");
        if (!isAvailable) {
          return null;
        }
      } catch (e) {
        // Игнорируем ошибку проверки
      }
    }

    try {
      // ВАЖНО: Используем ysdk.leaderboards.getPlayerEntry напрямую
      const entry = await this.ysdk.leaderboards.getPlayerEntry(leaderboardName);
      if (entry && entry.rank) {
        return entry.rank;
      }
      return null;
    } catch (err: any) {
      // Если игрока нет в таблице, Яндекс вернет ошибку LEADERBOARD_PLAYER_NOT_PRESENT
      if (err.code === "LEADERBOARD_PLAYER_NOT_PRESENT") {
        console.log("[AdService] Player not present in leaderboard yet");
      } else {
        console.error("[AdService] Failed to get player rank:", err);
      }
      return null;
    }
  }

  /**
   * Получение топа игроков
   */
  async getTopScores(
    quantity: number = 10,
    leaderboardName: string = "totalMaxLevels",
  ): Promise<Array<{ rank: number; score: number; name: string }> | null> {
    if (!this.ysdk) {
      return null;
    }

    try {
      // ВАЖНО: Используем ysdk.leaderboards.getEntries
      const result = await this.ysdk.leaderboards.getEntries(leaderboardName, {
        quantityTop: quantity,
        includeUser: false, // Нам нужен только топ, пользователя получим отдельно если надо
      });

      return result.entries.map((entry) => ({
        rank: entry.rank,
        score: entry.score,
        name: entry.player?.publicName || "Anonymous",
      }));
    } catch (err) {
      console.error("[AdService] Failed to get top scores:", err);
      return null;
    }
  }

  getIsAuthorized(): boolean {
    return this.isAuthorized;
  }

  async authorize(): Promise<boolean> {
    if (!this.ysdk) return false;
    try {
      if (this.isAuthorized) return true;

      // Показываем окно авторизации
      const result: any = await this.ysdk.auth.openAuthDialog();

      // После успешной авторизации обновляем объект player
      if (result) {
        // Иногда openAuthDialog просто резолвится, если уже авторизован,
        // или возвращает данные. Лучше перезапросить getPlayer, если нужно гарантировать свежесть,
        // но для простоты считаем, что если диалог прошел без ошибки - мы авторизованы.
        try {
          this.player = await this.ysdk.getPlayer();
          this.isAuthorized = true;
          console.log("[AdService] User authorized via dialog");
          return true;
        } catch (e) {
          // Если getPlayer упал, значит что-то пошло не так
          this.isAuthorized = false;
          return false;
        }
      }
      return false;
    } catch (err) {
      console.error("[AdService] Auth failed", err);
      return false;
    }
  }

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
    if (now - this.lastFullscreenAdTime < this.MIN_AD_INTERVAL) {
      console.log("[AdService] Fullscreen ad skipped: too soon");
      onClose?.(false);
      return;
    }

    audioManager.setMuted(true);

    if (!this.ysdk?.adv) {
      setTimeout(() => {
        audioManager.setMuted(false);
        onClose?.(true);
      }, 1000);
      return;
    }

    this.lastFullscreenAdTime = now;

    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: (wasShown: boolean) => {
          audioManager.setMuted(false);
          onClose?.(wasShown);
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
      callback(true);
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
