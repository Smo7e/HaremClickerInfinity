import { useState, useEffect, useRef } from "react";
import { t, setLang, getLang } from "../../locales/i18n";
import { LANGUAGE_CONFIG, type Lang } from "../../locales/locales";

import "./LanguageSelector.css";

interface LanguageSelectorProps {
  variant?: "icon" | "dropdown" | "buttons";
  showLabel?: boolean;
  onLanguageChange?: (lang: Lang) => void;
  className?: string;
}

const languages = Object.entries(LANGUAGE_CONFIG).map(([code, config]) => ({
  code: code as Lang,
  ...config,
}));

export function LanguageSelector({
  variant = "icon",
  showLabel = false,
  onLanguageChange,
  className = "",
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Lang>(getLang());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageSelect = (lang: Lang) => {
    setLang(lang);
    setCurrentLang(lang);
    setIsOpen(false);
    onLanguageChange?.(lang);
  };

  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0]!;

  if (variant === "icon") {
    return (
      <div ref={containerRef} className={`language-selector-icon ${className}`}>
        <button
          className="lang-icon-btn"
          onClick={() => setIsOpen(!isOpen)}
          title={t("ui.changeLanguage")}
          aria-label={t("ui.changeLanguage")}
        >
          <span className="lang-globe">🌐</span>
          <span className="lang-current-flag">{currentLanguage.flag}</span>
        </button>

        {isOpen && (
          <div className="lang-dropdown">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`lang-option ${currentLang === lang.code ? "active" : ""}`}
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <span className="lang-flag">{lang.flag}</span>
                <span className="lang-native-name">{lang.nativeName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === "dropdown") {
    return (
      <div ref={containerRef} className={`language-selector-dropdown ${className}`}>
        {showLabel && <span className="setting-label">{t("ui.language")}</span>}
        <button className="lang-dropdown-toggle" onClick={() => setIsOpen(!isOpen)}>
          <span>{currentLanguage.flag}</span>
          <span>{currentLanguage.nativeName}</span>
          <span className="dropdown-arrow">{isOpen ? "▲" : "▼"}</span>
        </button>

        {isOpen && (
          <div className="lang-dropdown-menu">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`lang-dropdown-option ${currentLang === lang.code ? "active" : ""}`}
                onClick={() => handleLanguageSelect(lang.code)}
              >
                <span>{lang.flag}</span>
                <span>{lang.nativeName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`language-selector-buttons ${className}`}>
      {showLabel && <span className="setting-label">{t("ui.language")}</span>}
      <div className="lang-buttons-row">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`lang-btn ${currentLang === lang.code ? "active" : ""}`}
            onClick={() => handleLanguageSelect(lang.code)}
            title={lang.nativeName}
          >
            <span className="lang-btn-flag">{lang.flag}</span>
            <span className="lang-btn-name">{lang.nativeName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
