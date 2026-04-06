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
          <span className="title-accent">{t("title.accent")}</span>
          <span className="title-main">{t("title.main")}</span>
          <span className="title-sub">{t("title.sub")}</span>
        </h1>

        <div className="menu-buttons">
          <button className="btn-primary btn-play" onClick={onPlay}>
            <span className="btn-icon">▶</span>
            {t("ui.play")}
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
    </div>
  );
}
