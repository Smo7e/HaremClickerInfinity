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
import { SDK } from "ysdk";

export type TScreen = "menu" | "game";

function AppContent() {
  const [screen, setScreen] = useState<TScreen>("menu");
  const [isSettings, setIsSettings] = useState<boolean>(false);
  const [_, setCurrentLang] = useState<Lang>(getLang());
  const [isPaused, setIsPaused] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { loadGame } = useAutoSave();
  const hasRehydrated = useGameStore.persist.hasHydrated();

  const initAudio = useCallback(async () => {
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

  useEffect(() => {
    const init = async () => {
      try {
        await useGameStore.persist.rehydrate();
        const hasSave = loadGame();
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
    initAudio().catch(console.error);
  }, [loadGame, initAudio]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
        audioManager.pauseMusic();
      } else {
        setIsPaused(false);
        audioManager.playMusic();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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
      const ysdk: SDK = window.YaGames.ysdk;

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
