import type { locales } from "../locales/locales";

export type TRarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
export type TElementType = "water" | "fire" | "earth" | "ice" | "light" | "dark" | "physical";
export type TWaifu = {
  id: string;
  name: string;
  rarity: TRarity;
  element: TElementType;
  image: string;
  description: keyof typeof locales.ru;
  clickPower: number;
  autoClick: number;
  multiplier: number;
};
