import "./Background.css";

interface BackgroundProps {
  locationId?: string;
}

export function Background({ locationId = "forest" }: BackgroundProps) {
  return (
    <div className="game-background" style={{ backgroundImage: `url(assets/images/backgrounds/${locationId}.png)` }} />
  );
}
