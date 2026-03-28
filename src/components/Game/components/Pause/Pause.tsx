import { t } from "../../../../locales/i18n";
import { Icon } from "../../../Icon/Icon";
import "./Pause.css";

interface PauseProps {
  isOpen: boolean;
  onClose: () => void;
  onSettings: () => void;
  onMenu: () => void;
}

export function Pause({ isOpen, onClose, onSettings, onMenu }: PauseProps) {
  if (!isOpen) return null;

  return (
    <div className="pause-overlay" onClick={onClose}>
      <div className="pause-modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="pause-title">
          <Icon name="pause" size="lg" /> {t("ui.pause")}
        </h2>

        <div className="pause-buttons">
          <button className="btn-pause btn-resume" onClick={onClose}>
            <Icon name="play" size="md" />
            {t("ui.resume")}
          </button>

          <button className="btn-pause btn-pause-settings" onClick={onSettings}>
            <Icon name="settings" size="md" />
            {t("ui.settings")}
          </button>

          <button className="btn-pause btn-exit" onClick={onMenu}>
            <Icon name="home" size="md" />
            {t("ui.exitToMenu")}
          </button>
        </div>
      </div>
    </div>
  );
}
