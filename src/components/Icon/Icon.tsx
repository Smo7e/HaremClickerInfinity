interface IconProps {
  name: string;
  size?: "vsm" | "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  vsm: 16,
  sm: 24,
  md: 32,
  lg: 48,
};

export function Icon({ name, size = "md", className = "" }: IconProps) {
  const px = sizeMap[size];

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
