import { t } from "../../locales/i18n";
import { LanguageSelector } from "../LanguageSelector/LanguageSelector";
import type { Lang } from "../../locales/locales";
import "./MainMenu.css";

interface Props {
  onPlay: () => void;
  onSettings: () => void;
  onLanguageChange?: (lang: Lang) => void;
}

export function MainMenu({ onPlay, onSettings, onLanguageChange }: Props) {
  return (
    <div className="main-menu">
      <div className="main-menu-header">
        <LanguageSelector variant="icon" onLanguageChange={onLanguageChange} className="main-menu-lang" />
      </div>

      <div className="main-menu-content">
        <h1 className="game-title">
          <span className="title-accent">{t("titleAccent")}</span>
          <span className="title-main">{t("titleMain")}</span>
          <span className="title-sub">{t("titleSub")}</span>
        </h1>

        <div className="menu-buttons">
          <button className="btn-primary btn-play" onClick={onPlay}>
            <span className="btn-icon">▶</span>
            {t("play")}
          </button>

          <button className="btn-secondary btn-settings" onClick={onSettings}>
            <span className="btn-icon">⚙</span>
            {t("settings")}
          </button>
        </div>
      </div>

      {/* Футер с версией */}
      <div className="main-menu-footer">
        <span className="version">v1.0.0</span>
      </div>
    </div>
  );
}
