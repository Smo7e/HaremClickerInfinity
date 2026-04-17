import { useEffect, useState } from "react";
import { t } from "../../locales/i18n";
import { LanguageSelector } from "../LanguageSelector/LanguageSelector";
import type { Lang } from "../../locales/locales";

import "./Settings.css";
import { audioManager } from "../../audio/AudioManager";

interface Props {
  setIsSettings: () => void;
  setCurrentLang: (el: Lang) => void;
  isPaused?: boolean;
  onPauseToggle?: () => void;
}

export function Settings({ setIsSettings, setCurrentLang, isPaused = false, onPauseToggle }: Props) {
  const [globalMusicVol, setGlobalMusicVol] = useState(0.2);
  const [globalSfxVol, setGlobalSfxVol] = useState(0.2);
  const [showCredits, setShowCredits] = useState(false);

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setGlobalMusicVol(value);
    audioManager.setMusicVolume(value);
  };
  useEffect(() => {
    const state = audioManager.getState();
    setGlobalMusicVol(state.musicVolume);
    setGlobalSfxVol(state.sfxVolume);
  }, []);

  const handleSfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setGlobalSfxVol(value);
    audioManager.setSFXVolume(value);
  };

  const handleMuteAll = () => {
    setGlobalMusicVol(0);
    setGlobalSfxVol(0);
    audioManager.setMusicVolume(0);
    audioManager.setSFXVolume(0);
  };

  const handleResetVolume = () => {
    setGlobalMusicVol(0.5);
    setGlobalSfxVol(0.5);
    audioManager.setMusicVolume(0.5);
    audioManager.setSFXVolume(0.5);
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h1>{t("ui.settings")}</h1>
          <button className="btn-close" onClick={setIsSettings}>
            ✕
          </button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <div className="section-icon">🌐</div>
            <div className="section-content">
              <LanguageSelector variant="buttons" showLabel={true} onLanguageChange={setCurrentLang} />
            </div>
          </section>

          <section className="settings-section">
            <div className="section-icon">🔊</div>
            <div className="section-content">
              <h3>{t("ui.audio")}</h3>

              <div className="volume-control">
                <div className="volume-header">
                  <label>{t("ui.music")}</label>
                  <span className="volume-value">{Math.round(globalMusicVol * 100)}%</span>
                </div>
                <div className="slider-container">
                  <span className="slider-icon">🎵</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={globalMusicVol}
                    onChange={handleMusicChange}
                    className="volume-slider"
                  />
                  <button
                    className="mute-btn"
                    onClick={() => {
                      const newVal = globalMusicVol > 0 ? 0 : 0.2;
                      setGlobalMusicVol(newVal);
                      audioManager.setMusicVolume(newVal);
                    }}
                  >
                    {globalMusicVol === 0 ? "🔇" : globalMusicVol < 0.5 ? "🔉" : "🔊"}
                  </button>
                </div>
              </div>

              <div className="volume-control">
                <div className="volume-header">
                  <label>{t("ui.sfx")}</label>
                  <span className="volume-value">{Math.round(globalSfxVol * 100)}%</span>
                </div>
                <div className="slider-container">
                  <span className="slider-icon">🎮</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={globalSfxVol}
                    onChange={handleSfxChange}
                    className="volume-slider"
                  />
                  <button
                    className="mute-btn"
                    onClick={() => {
                      const newVal = globalSfxVol > 0 ? 0 : 0.2;
                      setGlobalSfxVol(newVal);
                      audioManager.setSFXVolume(newVal);
                    }}
                  >
                    {globalSfxVol === 0 ? "🔇" : globalSfxVol < 0.5 ? "🔉" : "🔊"}
                  </button>
                </div>
              </div>

              <div className="volume-quick-actions">
                <button className="btn-text" onClick={handleMuteAll}>
                  {t("ui.muteAll")}
                </button>
                <button className="btn-text" onClick={handleResetVolume}>
                  {t("ui.resetVolume")}
                </button>
              </div>
            </div>
          </section>

          {onPauseToggle && (
            <section className="settings-section">
              <div className="section-icon">⏸</div>
              <div className="section-content">
                <h3>{t("ui.gameplay")}</h3>
                <button className={`btn-toggle ${isPaused ? "active" : ""}`} onClick={onPauseToggle}>
                  <span className="toggle-icon">{isPaused ? "▶" : "⏸"}</span>
                  {isPaused ? t("ui.resumeGame") : t("ui.pauseGame")}
                </button>
              </div>
            </section>
          )}

          <section className="settings-section">
            <div className="section-icon">ℹ</div>
            <div className="section-content">
              <h3>{t("ui.about")}</h3>
              <button className="btn-text" onClick={() => setShowCredits(!showCredits)}>
                {showCredits ? t("ui.hideCredits") : t("ui.showCredits")}
              </button>

              {showCredits && (
                <div className="credits">
                  <p>Harem Clicker Infinity v0.1</p>
                  <p>©Creep Games</p>
                  <p>{t("ui.thanksForPlaying")}</p>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn-primary btn-back" onClick={setIsSettings}>
            {t("ui.back")}
          </button>
        </div>
      </div>
    </div>
  );
}
