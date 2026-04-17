// src/App.tsx
import { useState, useEffect, useCallback } from "react";
import { MainMenu } from "./components/MainMenu/MainMenu";
import { Settings } from "./components/Settings/Settings";
import { Game } from "./components/Game/Game";
import { ErrorBoundary } from "./components/ErrorBoundary/ErrorBoundary";
import { type Lang } from "./locales/locales";
import { getLang, initI18n, setLang, t } from "./locales/i18n";
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
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  const { loadGame, migrateSaveToCloud } = useAutoSave();
  const hasRehydrated = useGameStore.persist.hasHydrated();

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setIsMobile(width < 768 || "ontouchstart" in window);
      setIsLandscape(width > height);
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    window.addEventListener("orientationchange", checkDevice);

    return () => {
      window.removeEventListener("resize", checkDevice);
      window.removeEventListener("orientationchange", checkDevice);
    };
  }, []);

  const handleLanguageChange = useCallback((lang: Lang) => {
    setLang(lang);
    setCurrentLang(lang);
  }, []);

  const handlePauseToggle = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await adService.init();
        await initI18n();

        if (!audioInitialized) {
          await audioManager.init();
          audioManager.setMuted(true);
          audioManager.setMusicVolume(0.2);
          audioManager.setSFXVolume(0.2);
          setAudioInitialized(true);
        }

        const hasSave = await loadGame();
        if (hasSave) {
          console.log("[App] Save loaded successfully");
        }
      } catch (error) {
        console.error("[App] Failed to initialize:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [loadGame, audioInitialized]);

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

  if (isLoading || !hasRehydrated) {
    return (
      <div className="app-loading">
        <div className="loading-spinner" />
        <p>{t("ui.loading")}</p>
      </div>
    );
  }
  window.oncontextmenu = () => false;

  return (
    <div
      className={`app-container ${
        screen === "game" ? "app-container--game" : "app-container--menu"
      } ${isMobile ? "app-container--mobile" : ""} ${
        isLandscape ? "app-container--landscape" : "app-container--portrait"
      }`}
    >
      {screen === "menu" ? (
        <MainMenu
          onPlay={() => {
            setScreen("game");
            audioManager.playMusic();
            audioManager.setMuted(false);
          }}
          onSettings={() => {
            setIsSettings(true);
            audioManager.playSFX("panel_click");
          }}
          onLanguageChange={handleLanguageChange}
          onAuthorize={async () => {
            const success = await adService.authorize();
            if (success) {
              await migrateSaveToCloud();
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
