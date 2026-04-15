// src/App.tsx
import { useState, useEffect, useCallback } from "react";
import { MainMenu } from "./components/MainMenu/MainMenu";
import { Settings } from "./components/Settings/Settings";
import { Game } from "./components/Game/Game";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import type { Lang } from "./locales/locales";
import { getLang, setLang } from "./locales/i18n";
import { audioManager } from "./audio/AudioManager";
import { useAutoSave } from "./hooks/useSave";
import { useGameStore } from "./store/gameStore";
import { adService } from "./services/AdService";

export type TScreen = "menu" | "game";

function AppContent() {
  const [screen, setScreen] = useState<TScreen>("menu");
  const [isSettings, setIsSettings] = useState<boolean>(false);
  const [_, setCurrentLang] = useState<Lang>(getLang());
  const [isPaused, setIsPaused] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { loadGame, migrateSaveToCloud } = useAutoSave();
  const hasRehydrated = useGameStore.persist.hasHydrated();

  const initAudio = useCallback(async () => {
    // Инициализация SDK и аудио
    await adService.init();
    if (!audioInitialized) {
      await audioManager.init();
      audioManager.setMusicVolume(0);
      audioManager.setSFXVolume(0);
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  const handleLanguageChange = useCallback((lang: Lang) => {
    setLang(lang);
    setCurrentLang(lang);
  }, []);

  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  // Загрузка игры при старте
  useEffect(() => {
    const init = async () => {
      try {
        // Ждем инициализации аудио и SDK
        await initAudio();

        // Пробуем загрузить сохранение (из облака или LS)
        const hasSave = await loadGame();
        if (hasSave) {
          console.log("[App] Save loaded successfully");
        }
      } catch (error) {
        console.error("[App] Failed to load save:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loadGame, initAudio]);

  // Обработка видимости страницы
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        audioManager.pauseMusic();
        adService.stopGameplay();
      } else {
        setIsPaused(false);
        audioManager.playMusic();
        adService.startGameplay();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Обработка событий Яндекс.Игр (пауза при сворачивании)
  useEffect(() => {
    const isYaGamesAvailable = () => {
      try {
        return window.YaGames && window.self !== window.top;
      } catch {
        return false;
      }
    };

    if (!isYaGamesAvailable()) return;

    try {
      //@ts-ignore
      const ysdk = window.YaGames.ysdk;
      const handlePause = () => {
        setIsPaused(true);
        audioManager.setMuted(true);
      };
      const handleResume = () => {
        setIsPaused(false);
        audioManager.setMuted(false);
      };

      if (ysdk?.on) {
        ysdk.on("game_api_pause", handlePause);
        ysdk.on("game_api_resume", handleResume);
      }
      return () => {
        if (ysdk?.off) {
          ysdk.off("game_api_pause", handlePause);
          ysdk.off("game_api_resume", handleResume);
        }
      };
    } catch (e) {
      console.log("YaGames SDK not available in this environment:", e);
    }
  }, []);

  if (isLoading || !hasRehydrated) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {screen === "menu" ? (
        <MainMenu
          onPlay={() => {
            setScreen("game");
            audioManager.playMusic();
          }}
          onSettings={() => {
            setIsSettings(true);
            audioManager.playSFX("panel_click");
          }}
          onLanguageChange={handleLanguageChange}
          // Передаем функцию для миграции и обновления UI
          onAuthorize={async () => {
            const success = await adService.authorize();
            if (success) {
              // Если авторизация прошла успешно, мигрируем сейв
              await migrateSaveToCloud();
              // Можно показать уведомление "Прогресс сохранен в облако"
              alert("Вы вошли! Ваш прогресс теперь синхронизируется с облаком.");
            }
          }}
          isAuthorized={adService.getIsAuthorized()}
        />
      ) : (
        <Game onBack={() => setScreen("menu")} isPaused={isPaused} />
      )}
      {isSettings && (
        <Settings
          setCurrentLang={handleLanguageChange}
          setIsSettings={() => setIsSettings(false)}
          isPaused={isPaused}
          onPauseToggle={screen === "game" ? handlePauseToggle : undefined}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
