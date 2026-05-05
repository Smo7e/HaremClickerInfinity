export const STORAGE_KEYS = {
  SAVE: "harem-clicker-save-v3",
  BACKUP: "harem-clicker-backup-v3",
  META: "harem-clicker-meta-v3",
  TIMESTAMP: "harem-clicker-last-save-ts-v3",
  ADS_STATE: "harem-clicker-ads-v3",

  LANGUAGE: "harem-clicker-lang",
  ERROR_LOG: "harem-clicker-error",
  LEADERBOARD_LAST_SENT: "harem-leaderboard-last-sent",

  CLOUD_SAVE: "cloud_save_v1",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
