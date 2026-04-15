// src/components/MainMenu/MainMenu.tsx
import { useState } from "react";
import { t } from "../../locales/i18n";
import { LanguageSelector } from "../LanguageSelector/LanguageSelector";
import type { Lang } from "../../locales/locales";
import "./MainMenu.css";
import { TutorialPanel } from "../TutorialPanel/TutorialPanel";
import { audioManager } from "../../audio/AudioManager";
import { Icon } from "../Icon/Icon";

interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onLanguageChange?: (lang: Lang) => void;
  onAuthorize?: () => void;
  isAuthorized?: boolean;
}

export function MainMenu({ onPlay, onSettings, onLanguageChange, onAuthorize, isAuthorized }: Props) {
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <LanguageSelector variant="icon" onLanguageChange={onLanguageChange} className="main-menu-lang" />
      </div>
      <div className="main-menu-content">
        <h1 className="game-title">
          <span className="title-accent">{t("title.accent")}</span>
          <span className="title-main">{t("title.main")}</span>
          <span className="title-sub">{t("title.sub")}</span>
        </h1>

        {/* ВСЕ кнопки теперь внутри одного контейнера */}
        <div className="menu-buttons">
          {/* Кнопка авторизации - теперь внутри menu-buttons для центрирования */}
          {!isAuthorized && onAuthorize && (
            <div className="auth-section">
              <button
                className="btn-secondary btn-auth"
                onClick={() => {
                  onAuthorize();
                  audioManager.playSFX("panel_click");
                }}
              >
                <Icon name="settings" size="sm" />
                {t("ui.login")}
              </button>
              <p className="auth-hint">{t("ui.loginHint")}</p>
            </div>
          )}

          {isAuthorized && (
            <div className="auth-section">
              <span className="status-badge">✅ {t("ui.loggedin")}</span>
            </div>
          )}

          <button className="btn-primary btn-play" onClick={onPlay}>
            <span className="btn-icon">▶</span>
            {t("ui.play")}
          </button>

          <button
            className="btn-secondary btn-tutorial"
            onClick={() => {
              setIsTutorialOpen(true);
              audioManager.playSFX("panel_click");
            }}
          >
            <span className="btn-icon">📖</span>
            {t("tutorial.title")}
          </button>

          <button className="btn-secondary btn-settings" onClick={onSettings}>
            <span className="btn-icon">⚙</span>
            {t("ui.settings")}
          </button>
        </div>
      </div>

      <div className="main-menu-footer">
        <span className="version">v0.1</span>
      </div>

      <TutorialPanel isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />
    </div>
  );
}
