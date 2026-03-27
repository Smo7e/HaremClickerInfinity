import { useState, useEffect, useCallback } from "react";
import { MainMenu } from "./components/MainMenu/MainMenu";
import { Settings } from "./components/Settings/Settings";
import { Game } from "./components/Game/Game";
import type { Lang } from "./locales/locales";
import { getLang, setLang } from "./locales/i18n";
import { audioManager } from "./audio/AudioManager";

export type TScreen = "menu" | "game";

function App() {
    const [screen, setScreen] = useState<TScreen>("menu");
    const [isSettings, setIsSettings] = useState<boolean>(false);
    const [_, setCurrentLang] = useState<Lang>(getLang());

    const [isPaused, setIsPaused] = useState(false);
    const [audioInitialized, setAudioInitialized] = useState(false);

    const initAudio = useCallback(async () => {
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
        return () =>
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            );
    }, []);
    useEffect(() => {
        initAudio();
        // @ts-ignore
        if (window.YaGames && window.YaGames.ysdk) {
            // @ts-ignore
            const ysdk = window.YaGames.ysdk;

            const handlePause = () => {
                setIsPaused(true);
                audioManager.setMuted(true);
            };

            const handleResume = () => {
                setIsPaused(false);
                audioManager.setMuted(false);
            };

            ysdk.on("game_api_pause", handlePause);
            ysdk.on("game_api_resume", handleResume);

            return () => {
                ysdk.off("game_api_pause", handlePause);
                ysdk.off("game_api_resume", handleResume);
            };
        }
    }, []);

    return (
        <div className="app">
            {screen === "menu" ? (
                <MainMenu
                    onPlay={() => {
                        setScreen("game");
                        audioManager.playMusic();
                    }}
                    onSettings={() => setIsSettings(true)}
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
                    onPauseToggle={
                        screen === "game" ? handlePauseToggle : undefined
                    }
                />
            )}
        </div>
    );
}

export default App;
