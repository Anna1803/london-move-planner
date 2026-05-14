// Clean, non-overlapping isometric "statement" scene per room.
// Each room renders a small set of signature pieces laid out on a fixed grid,
// so nothing ever overlaps regardless of viewport.

type Props = { roomId: string };

const VIEW_W = 520;
const VIEW_H = 220;

export function RoomScene({ roomId }: Props) {
  const piece = SCENES[roomId];
  if (!piece) return null;
  return (
    <div className="relative w-full overflow-hidden border border-border bg-gradient-to-b from-background to-card">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-40 sm:h-48"
        role="img"
        aria-label={`Statement furniture for ${roomId}`}
      >
        {/* floor */}
        <defs>
          <linearGradient id="floor" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--muted) / 0.0)" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.08)" />
          </linearGradient>
          <pattern id="grid" width="26" height="13" patternUnits="userSpaceOnUse" patternTransform="skewX(-30)">
            <path d="M0 13 H26 M26 0 V13" stroke="hsl(var(--border))" strokeWidth="0.5" fill="none" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={VIEW_W} height={VIEW_H} fill="url(#floor)" />
        <rect x="0" y={VIEW_H * 0.55} width={VIEW_W} height={VIEW_H * 0.45} fill="url(#grid)" opacity="0.5" />
        {piece}
      </svg>
    </div>
  );
}

// ---------- Isometric primitives ----------
// Iso projection helpers (30° classic): screen.x = (x - y) * cos30, screen.y = (x + y) * sin30 - z
const COS = Math.cos(Math.PI / 6);
const SIN = Math.sin(Math.PI / 6);
const iso = (x: number, y: number, z = 0) => ({
  x: (x - y) * COS,
  y: (x + y) * SIN - z,
});

type Box = {
  x: number; // grid x
  y: number; // grid y (depth)
  w: number;
  d: number;
  h: number;
  fill: string;
  top?: string;
  side?: string;
};

function IsoBox({ box, originX, originY }: { box: Box; originX: number; originY: number }) {
  const { x, y, w, d, h, fill } = box;
  const top = box.top ?? lighten(fill, 12);
  const side = box.side ?? darken(fill, 12);

  const a = iso(x, y, h);          // top front-left
  const b = iso(x + w, y, h);      // top front-right
  const c = iso(x + w, y + d, h);  // top back-right
  const e = iso(x, y + d, h);      // top back-left
  const a0 = iso(x, y, 0);
  const b0 = iso(x + w, y, 0);
  const c0 = iso(x + w, y + d, 0);

  const tx = (p: { x: number; y: number }) => p.x + originX;
  const ty = (p: { x: number; y: number }) => p.y + originY;

  return (
    <g>
      {/* right face */}
      <polygon
        points={`${tx(b)},${ty(b)} ${tx(c)},${ty(c)} ${tx(c0)},${ty(c0)} ${tx(b0)},${ty(b0)}`}
        fill={side}
        stroke="hsl(var(--background))"
        strokeWidth="0.6"
      />
      {/* left face */}
      <polygon
        points={`${tx(a)},${ty(a)} ${tx(b)},${ty(b)} ${tx(b0)},${ty(b0)} ${tx(a0)},${ty(a0)}`}
        fill={fill}
        stroke="hsl(var(--background))"
        strokeWidth="0.6"
      />
      {/* top */}
      <polygon
        points={`${tx(a)},${ty(a)} ${tx(b)},${ty(b)} ${tx(c)},${ty(c)} ${tx(e)},${ty(e)}`}
        fill={top}
        stroke="hsl(var(--background))"
        strokeWidth="0.6"
      />
    </g>
  );
}

function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize="9"
      fontFamily="ui-monospace, monospace"
      fill="hsl(var(--muted-foreground))"
      letterSpacing="2"
    >
      {children.toUpperCase()}
    </text>
  );
}

// Lighten/darken a CSS color by mixing with white/black via color-mix (works in browsers).
const lighten = (c: string, p: number) => `color-mix(in oklab, ${c} ${100 - p}%, white)`;
const darken = (c: string, p: number) => `color-mix(in oklab, ${c} ${100 - p}%, black)`;

// Brand-ish palette
const RED = "hsl(var(--primary))";
const BONE = "hsl(var(--bone, 40 30% 92%))";
const STEEL = "hsl(220 8% 35%)";
const WOOD = "hsl(28 35% 42%)";
const DARK = "hsl(220 12% 18%)";
const GLASS = "hsl(200 30% 70%)";

// ---------- Scenes ----------
// Origin centers each scene around (260, 60); pieces are placed on a grid where
// 1 unit ≈ 10px isometric. No two pieces share footprint, so nothing overlaps.

function Scene(boxes: Box[], labels: { x: number; y: number; t: string }[] = []) {
  // Sort painter's algorithm: back-to-front (by y, then x)
  const sorted = [...boxes].sort((a, b) => a.y + a.d - (b.y + b.d) || a.x - b.x);
  return (
    <g transform={`translate(${VIEW_W / 2}, 70)`}>
      {sorted.map((box, i) => (
        <IsoBox key={i} box={box} originX={0} originY={0} />
      ))}
      {labels.map((l, i) => (
        <Label key={`l${i}`} x={l.x + VIEW_W / 2} y={l.y + 70}>
          {l.t}
        </Label>
      ))}
    </g>
  );
}

const SCENES: Record<string, JSX.Element> = {
  // Living room: 3-seat sofa + coffee table + armchair
  living: Scene([
    { x: -7, y: -2, w: 10, d: 4, h: 3.5, fill: DARK }, // sofa base
    { x: -7, y: -4, w: 10, d: 2, h: 5.5, fill: DARK, top: lighten(DARK, 18) }, // sofa back
    { x: -7, y: -2, w: 1.2, d: 4, h: 5, fill: DARK }, // arm L
    { x: 1.8, y: -2, w: 1.2, d: 4, h: 5, fill: DARK }, // arm R
    { x: -2, y: 4, w: 5, d: 2.5, h: 1.8, fill: WOOD }, // coffee table
    { x: 6, y: 1, w: 4, d: 4, h: 3, fill: RED }, // armchair base
    { x: 6, y: -1, w: 4, d: 2, h: 5, fill: RED }, // armchair back
  ]),

  // Bedroom: double bed + chest of drawers + nightstand
  bedroom: Scene([
    { x: -6, y: -3, w: 9, d: 7, h: 2.5, fill: BONE, top: lighten(BONE, 6) }, // mattress
    { x: -6, y: -5, w: 9, d: 2, h: 5, fill: WOOD }, // headboard
    { x: 4, y: -2, w: 2.5, d: 2.5, h: 4, fill: WOOD }, // nightstand
    { x: -10, y: 5, w: 6, d: 3, h: 5, fill: DARK, top: lighten(DARK, 14) }, // chest of drawers
  ]),

  // Kitchen: dining table + chairs + fridge
  kitchen: Scene([
    { x: -3, y: -1, w: 7, d: 4, h: 3.5, fill: WOOD }, // table
    { x: -3, y: -3, w: 1.6, d: 1.6, h: 4, fill: DARK }, // chair 1
    { x: 2.4, y: -3, w: 1.6, d: 1.6, h: 4, fill: DARK }, // chair 2
    { x: -3, y: 3.4, w: 1.6, d: 1.6, h: 4, fill: DARK }, // chair 3
    { x: 2.4, y: 3.4, w: 1.6, d: 1.6, h: 4, fill: DARK }, // chair 4
    { x: -11, y: -2, w: 4, d: 4, h: 8, fill: STEEL, top: lighten(STEEL, 14) }, // fridge
  ]),

  // Bathroom: bathtub + cabinet
  bathroom: Scene([
    { x: -5, y: -2, w: 10, d: 4.5, h: 3, fill: BONE, top: lighten(BONE, 10) }, // bathtub
    { x: 7, y: -1, w: 3, d: 3, h: 5, fill: WOOD }, // cabinet
  ]),

  // Hallway: boxes + bicycle (boxes only for clarity)
  hallway: Scene([
    { x: -4, y: -2, w: 4, d: 4, h: 4, fill: WOOD }, // box big
    { x: 1, y: -1, w: 3, d: 3, h: 3, fill: lighten(WOOD, 10) }, // box med
    { x: -4, y: 3, w: 3, d: 3, h: 3, fill: WOOD }, // box med 2
    { x: 5, y: 2, w: 2, d: 2, h: 2, fill: RED }, // small accent box
  ]),

  // Home office: desk + chair + monitor
  "home-office": Scene([
    { x: -5, y: -2, w: 9, d: 4, h: 3.5, fill: WOOD }, // desk top (resting)
    { x: -2, y: -1.5, w: 3, d: 0.4, h: 3.5, fill: DARK }, // monitor stand
    { x: -2.5, y: -2, w: 4, d: 0.4, h: 3, fill: GLASS, top: lighten(GLASS, 10) }, // screen
    { x: -1, y: 4, w: 3, d: 3, h: 4, fill: RED }, // chair
  ]),

  // Office reception: reception desk + waiting sofa
  reception: Scene([
    { x: -8, y: -2, w: 12, d: 3, h: 5, fill: DARK, top: lighten(DARK, 18) }, // counter
    { x: 6, y: 2, w: 6, d: 3, h: 3, fill: RED }, // waiting sofa
    { x: 6, y: 0, w: 6, d: 2, h: 5, fill: RED }, // sofa back
  ]),

  // Open workspace: rows of desks
  workspace: Scene([
    { x: -10, y: -3, w: 6, d: 3, h: 3.5, fill: BONE, top: lighten(BONE, 6) },
    { x: -2, y: -3, w: 6, d: 3, h: 3.5, fill: BONE, top: lighten(BONE, 6) },
    { x: -10, y: 3, w: 6, d: 3, h: 3.5, fill: BONE, top: lighten(BONE, 6) },
    { x: -2, y: 3, w: 6, d: 3, h: 3.5, fill: BONE, top: lighten(BONE, 6) },
    { x: -8, y: -1, w: 2, d: 2, h: 3, fill: RED },
    { x: 0, y: -1, w: 2, d: 2, h: 3, fill: RED },
    { x: -8, y: 5, w: 2, d: 2, h: 3, fill: RED },
    { x: 0, y: 5, w: 2, d: 2, h: 3, fill: RED },
  ]),

  // Meeting room: long conference table + chairs
  meeting: Scene([
    { x: -7, y: -1.5, w: 14, d: 4, h: 3, fill: WOOD, top: lighten(WOOD, 12) },
    { x: -7, y: -3.5, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: -3, y: -3.5, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: 1, y: -3.5, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: 5, y: -3.5, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: -7, y: 3, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: -3, y: 3, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: 1, y: 3, w: 2, d: 1.6, h: 3.5, fill: DARK },
    { x: 5, y: 3, w: 2, d: 1.6, h: 3.5, fill: DARK },
  ]),

  // Kitchenette: fridge + break table
  kitchenette: Scene([
    { x: -8, y: -2, w: 4, d: 4, h: 8, fill: STEEL, top: lighten(STEEL, 14) },
    { x: 0, y: -1, w: 6, d: 4, h: 3.5, fill: WOOD },
    { x: 0, y: -3, w: 1.6, d: 1.6, h: 4, fill: DARK },
    { x: 4.4, y: -3, w: 1.6, d: 1.6, h: 4, fill: DARK },
    { x: 0, y: 3.4, w: 1.6, d: 1.6, h: 4, fill: DARK },
    { x: 4.4, y: 3.4, w: 1.6, d: 1.6, h: 4, fill: DARK },
  ]),
};
