export const STORAGE_KEYS = {
  SAVE: "harem-clicker-save-v2",
  BACKUP: "harem-clicker-backup-v2",
  META: "harem-clicker-meta-v1",
  TIMESTAMP: "harem-clicker-last-save-ts",

  LANGUAGE: "harem-clicker-lang",
  ADS_STATE: "harem-clicker-ads-v1",
  ERROR_LOG: "harem-clicker-error",
  LEADERBOARD_LAST_SENT: "harem-leaderboard-last-sent",

  CLOUD_SAVE: "cloud_save_v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
