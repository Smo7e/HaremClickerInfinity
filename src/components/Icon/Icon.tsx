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
};

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const px = sizeMap[size];

  // Если иконка отсутствует, используем эмодзи
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
  console.log(name);
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
