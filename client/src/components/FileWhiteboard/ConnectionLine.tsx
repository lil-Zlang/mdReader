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
  connectionIndex?: number; // Index to alternate curve direction
  onHover?: (hovered: boolean) => void;
  onClick?: () => void;
}

// Card dimensions (updated for larger cards)
const CARD_WIDTH = 280;
const CARD_HEIGHT = 160;
const CARD_CENTER_X = CARD_WIDTH / 2;
const CARD_CENTER_Y = CARD_HEIGHT / 2;

// Bezier curve offset
const CURVE_OFFSET = 40;

function ConnectionLine({
  connection,
  fromPosition,
  toPosition,
  isHovered,
  isRelated,
  connectionCount,
  connectionIndex = 0,
  onHover,
  onClick,
}: ConnectionLineProps) {
  // Calculate center points of cards
  const x1 = fromPosition.x + CARD_CENTER_X;
  const y1 = fromPosition.y + CARD_CENTER_Y;
  const x2 = toPosition.x + CARD_CENTER_X;
  const y2 = toPosition.y + CARD_CENTER_Y;

  // Calculate midpoint
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  // Calculate perpendicular offset for control point
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;

  // Normalize and get perpendicular vector
  const perpX = -dy / length;
  const perpY = dx / length;

  // Alternate direction based on connection index to avoid overlaps
  const direction = connectionIndex % 2 === 0 ? 1 : -1;
  const offset = CURVE_OFFSET * direction;

  // Control point for quadratic bezier
  const cx = midX + perpX * offset;
  const cy = midY + perpY * offset;

  // Calculate arrow head position and angle at the end of the curve
  // For a quadratic bezier, the tangent at t=1 is (P2 - P1) where P1 is control point
  const arrowAngle = Math.atan2(y2 - cy, x2 - cx);
  const arrowSize = 12;

  // Offset the end point to leave room for arrow
  const arrowX = x2 - arrowSize * Math.cos(arrowAngle);
  const arrowY = y2 - arrowSize * Math.sin(arrowAngle);

  // Create bezier path
  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${arrowX} ${arrowY}`;

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
      {/* Main bezier curve */}
      <path
        d={pathD}
        stroke={getLineColor()}
        strokeWidth={getLineWidth()}
        fill="none"
        opacity={isHovered || isRelated ? 0.9 : 0.6}
        className={styles.connectionLine}
      />

      {/* Arrow head */}
      <polygon
        points={`${x2},${y2} ${x2 - arrowSize * Math.cos(arrowAngle - 0.3)},${
          y2 - arrowSize * Math.sin(arrowAngle - 0.3)
        } ${x2 - arrowSize * Math.cos(arrowAngle + 0.3)},${
          y2 - arrowSize * Math.sin(arrowAngle + 0.3)
        }`}
        fill={getLineColor()}
        opacity={isHovered || isRelated ? 0.9 : 0.6}
        className={styles.arrowHead}
      />

      {/* Hover zone (invisible but clickable) - follows the curve */}
      <path
        d={pathD}
        stroke="transparent"
        strokeWidth={12}
        fill="none"
        opacity={0}
        style={{ pointerEvents: "auto" }}
      />
    </g>
  );
}

export default memo(ConnectionLine);
