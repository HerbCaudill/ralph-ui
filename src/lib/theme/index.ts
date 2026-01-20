// Re-export all theme types and constants
export type {
  VSCodeTheme,
  VSCodeTokenColor,
  VSCodeTokenSettings,
  VSCodeEditorColors,
  StatusColors,
  ThemeMeta,
  AppTheme,
} from "./types"

export {
  DEFAULT_STATUS_COLORS,
  DEFAULT_DARK_STATUS_COLORS,
  DEFAULT_LIGHT_STATUS_COLORS,
} from "./types"

// Re-export highlighter functions
export {
  getHighlighter,
  loadTheme,
  getCurrentCustomThemeName,
  getDefaultThemeName,
  highlight,
  isLanguageSupported,
  getSupportedLanguages,
  normalizeLanguage,
} from "./highlighter"
