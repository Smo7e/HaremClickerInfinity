const v = "-v0.1";
export const STORAGE_KEYS = {
  SAVE: "harem-clicker-save" + v,
  BACKUP: "harem-clicker-backup" + v,
  META: "harem-clicker-meta" + v,
  TIMESTAMP: "harem-clicker-last-save-ts" + v,
  ADS_STATE: "harem-clicker-ads" + v,
  CLOUD_SAVE: "cloud_save" + v,
  LEADERBOARD_LAST_SENT: "harem-leaderboard-last-sent" + v,

  LANGUAGE: "harem-clicker-lang",
  ERROR_LOG: "harem-clicker-error",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
