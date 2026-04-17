// Экспорт типов и констант для использования в JS/TS
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
  ultra: 1920,
} as const;

export const SAFE_AREAS = {
  top: "var(--safe-top)",
  bottom: "var(--safe-bottom)",
  left: "var(--safe-area-left)",
  right: "var(--safe-area-right)",
} as const;

export const mediaQuery = {
  mobile: `(min-width: ${BREAKPOINTS.mobile}px)`,
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wide: `(min-width: ${BREAKPOINTS.wide}px)`,
  ultra: `(min-width: ${BREAKPOINTS.ultra}px)`,
  portrait: "(orientation: portrait)",
  landscape: "(orientation: landscape)",
  hover: "(hover: hover)",
  coarse: "(pointer: coarse)",
} as const;
