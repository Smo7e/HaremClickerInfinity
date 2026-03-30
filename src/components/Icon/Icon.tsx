interface IconProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: 24,
  md: 32,
  lg: 48,
};

// Эмодзи для отсутствующих иконок
const EMOJI_FALLBACK: Record<string, string> = {
  affection: "💕",
  auto: "⚙️",
  click: "👆",
  crit: "⚡",
  critPower: "💥",
  damage: "⚔️",
  duplicate: "📋",
  level: "⭐",
  max: "👑",
  shield: "🛡️",
  summoning: "✨",
  weak: "💫",
  gel: "💧",
  slime_core: "🔵",
  coin: "🪙",
  goblin_dagger: "🗡️",
  goblin_ear: "👂",
  bone: "🦴",
  skull: "💀",
  ancient_coin: "🪙",
  ectoplasm: "👻",
  soul_shard: "💎",
  magic_scroll: "📜",
  dark_orb: "🔮",
  mage_staff: "🪄",
  demon_horn: "🦄",
  hellfire_essence: "🔥",
  demon_wing: "🦇",
  scroll: "📜",
  potion: "🧪",
  potion_red: "🧪",
  dagger: "🗡️",
  ear: "👂",
  coin_old: "🪙",
  orb_dark: "🔮",
  staff: "🪄",
  horn: "🦄",
  essence_fire: "🔥",
  wing: "🦇",
  back: "🎒",
};
export function Icon({ name, size = "md", className = "" }: IconProps) {
  const px = sizeMap[size];

  if (EMOJI_FALLBACK[name]) {
    return (
      <span
        className={`icon icon-emoji ${className}`}
        style={{
          fontSize: px,
          width: px,
          height: px,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
        }}
        title={`Missing icon: ${name}`}
      >
        {EMOJI_FALLBACK[name]}
      </span>
    );
  }
  return (
    <img
      src={`/assets/images/icons/${name}.png`}
      alt=""
      width={px}
      height={px}
      className={`icon ${className}`}
      draggable={false}
      style={{
        width: px,
        height: px,
        objectFit: "contain",
        flexShrink: 0,
        border: 0,
      }}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = "❓";
          parent.style.fontSize = `${px}px`;
          parent.style.display = "inline-flex";
          parent.style.alignItems = "center";
          parent.style.justifyContent = "center";
        }
      }}
    />
  );
}
