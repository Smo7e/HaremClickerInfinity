import "./Background.css";

interface BackgroundProps {
  locationId?: string;
}

export function Background({ locationId = "forest" }: BackgroundProps) {
  return (
    <div
      className="game-background"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}assets/images/backgrounds/${locationId}.png)`,
      }}
    />
  );
}
