import { useEffect } from "react";
import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import "./Pause.css"; // Оставим локальные стили для специфичных кнопок, если нужно, или удалим их позже

interface PauseProps {
  isOpen: boolean;
  onClose: () => void;
  onSettings: () => void;
  onMenu: () => void;
}

export function Pause({ isOpen, onClose, onSettings, onMenu }: PauseProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div className="panel pause-panel" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header">
          <h2>
            <Icon name="pause" size="md" /> {t("ui.pause")}
          </h2>
          <button className="btn-close" onClick={onClose}>
            <Icon name="close" size="md" />
          </button>
        </div>

        <div className="panel-content pause-content">
          <div className="pause-buttons-grid">
            <button className="btn-pause btn-resume" onClick={onClose}>
              <Icon name="play" size="md" />
              <span>{t("ui.resume")}</span>
            </button>

            <button className="btn-pause btn-settings" onClick={onSettings}>
              <Icon name="settings" size="md" />
              <span>{t("ui.settings")}</span>
            </button>

            <button className="btn-pause btn-exit" onClick={onMenu}>
              <Icon name="home" size="md" />
              <span>{t("ui.exitToMenu")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
