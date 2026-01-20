import { memo } from "react";
import styles from "./FileWhiteboard.module.css";
import { CardPosition, Connection } from "./useWhiteboardState";

interface ConnectionLineProps {
  connection: Connection;
  fromPosition: CardPosition;
  toPosition: CardPosition;
  isHovered: boolean;
  isRelated: boolean;
  connectionCount: number;
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

// Arrow dimensions
const CARD_WIDTH = 200;
const CARD_HEIGHT = 100;
const CARD_CENTER_X = CARD_WIDTH / 2;
const CARD_CENTER_Y = CARD_HEIGHT / 2;

function ConnectionLine({
  connection,
  fromPosition,
  toPosition,
  isHovered,
  isRelated,
  connectionCount,
  onHover,
  onClick,
}: ConnectionLineProps) {
  // Calculate center points of cards
  const x1 = fromPosition.x + CARD_CENTER_X;
  const y1 = fromPosition.y + CARD_CENTER_Y;
  const x2 = toPosition.x + CARD_CENTER_X;
  const y2 = toPosition.y + CARD_CENTER_Y;

  // Calculate arrow head
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowSize = 12;
  const arrowX = x2 - arrowSize * Math.cos(angle);
  const arrowY = y2 - arrowSize * Math.sin(angle);

  // Determine line color and thickness based on connection strength
  const getLineColor = () => {
    if (isHovered || isRelated) return "#667eea";
    if (connectionCount >= 3) return "#f39c12";
    if (connectionCount >= 1) return "#667eea";
    return "#ddd";
  };

  const getLineWidth = () => {
    if (isHovered || isRelated) return 3;
    if (connectionCount >= 3) return 2.5;
    if (connectionCount >= 1) return 2;
    return 1.5;
  };

  return (
    <g
      key={`connection-${connection.from}-${connection.to}`}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* Main line */}
      <line
        x1={x1}
        y1={y1}
        x2={arrowX}
        y2={arrowY}
        stroke={getLineColor()}
        strokeWidth={getLineWidth()}
        opacity={isHovered || isRelated ? 0.9 : 0.6}
        className={styles.connectionLine}
      />

      {/* Arrow head */}
      <polygon
        points={`${x2},${y2} ${x2 - arrowSize * Math.cos(angle - 0.3)},${
          y2 - arrowSize * Math.sin(angle - 0.3)
        } ${x2 - arrowSize * Math.cos(angle + 0.3)},${
          y2 - arrowSize * Math.sin(angle + 0.3)
        }`}
        fill={getLineColor()}
        opacity={isHovered || isRelated ? 0.9 : 0.6}
        className={styles.arrowHead}
      />

      {/* Hover zone (invisible but clickable) */}
      <line
        x1={x1}
        y1={y1}
        x2={arrowX}
        y2={arrowY}
        stroke="transparent"
        strokeWidth={8}
        opacity={0}
        style={{ pointerEvents: "auto" }}
      />
    </g>
  );
}

export default memo(ConnectionLine);
