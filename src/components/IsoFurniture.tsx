import type { FurnitureItem } from "@/lib/furniture";

type Props = {
  item: FurnitureItem;
  selected: boolean;
  onClick: () => void;
  // Cell pixel size used to scale percentages to pixels
  cellWidth: number;
  cellHeight: number;
};

/**
 * Isometric "2.5D" clickable furniture piece rendered as inline SVG-like
 * stacked divs. Top + side + front faces produce a chunky block look that
 * reads as 3D without WebGL.
 */
export function IsoFurniture({ item, selected, onClick, cellWidth, cellHeight }: Props) {
  const w = (item.w / 100) * cellWidth;
  const d = (item.d / 100) * cellHeight;
  const h = item.h * 36; // pixels of "lift"

  const left = (item.x / 100) * cellWidth;
  const top = (item.y / 100) * cellHeight;

  const isRound = item.shape === "round";
  const isSofa = item.shape === "sofa";
  const isBed = item.shape === "bed";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-pressed={selected}
      aria-label={item.label}
      className="absolute group focus:outline-none"
      style={{
        left,
        top,
        width: w,
        height: d + h,
        transform: `translate(-50%, -50%)`,
      }}
    >
      <div
        className="relative w-full h-full transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0"
      >
        {/* Shadow */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full blur-md transition-opacity"
          style={{
            bottom: -4,
            width: w * 0.9,
            height: 8,
            background: "oklch(0 0 0 / 0.5)",
            opacity: selected ? 0.7 : 0.4,
          }}
        />

        {/* Front face */}
        <div
          className="absolute left-0 right-0 transition-colors"
          style={{
            top: d * 0.55,
            height: h,
            background: selected
              ? "linear-gradient(180deg, oklch(0.50 0.24 27), oklch(0.38 0.20 27))"
              : "linear-gradient(180deg, oklch(0.32 0.02 25), oklch(0.20 0.018 25))",
            border: `1.5px solid ${selected ? "oklch(0.85 0.18 90)" : "oklch(0.4 0.02 25)"}`,
            borderRadius: isRound ? "50%" : isSofa ? "6px 6px 3px 3px" : "3px",
            boxShadow: selected
              ? "0 6px 18px -4px oklch(0.50 0.24 27 / 0.6)"
              : "0 4px 10px -4px oklch(0 0 0 / 0.6)",
          }}
        />

        {/* Top face — the part you "see" from above */}
        <div
          className="absolute left-0 right-0 transition-all flex items-center justify-center"
          style={{
            top: 0,
            height: d,
            background: selected
              ? "linear-gradient(135deg, oklch(0.62 0.22 27), oklch(0.48 0.22 27))"
              : isBed
                ? "linear-gradient(135deg, oklch(0.35 0.02 25), oklch(0.25 0.018 25))"
                : isSofa
                  ? "linear-gradient(135deg, oklch(0.30 0.02 25), oklch(0.22 0.018 25))"
                  : "linear-gradient(135deg, oklch(0.28 0.018 25), oklch(0.20 0.018 25))",
            border: `1.5px solid ${selected ? "oklch(0.85 0.18 90)" : "oklch(0.4 0.02 25)"}`,
            borderRadius: isRound ? "50%" : isSofa ? "8px" : "3px",
            transform: `translateY(-${h * 0.6}px)`,
          }}
        >
          {/* Bed pillows hint */}
          {isBed && (
            <div className="absolute top-1.5 left-1.5 right-1.5 h-2 rounded-sm bg-bone/30" />
          )}
          {/* Sofa cushions hint */}
          {isSofa && !isRound && (
            <div className="absolute inset-1.5 flex gap-1">
              <div className="flex-1 rounded-sm bg-foreground/10" />
              <div className="flex-1 rounded-sm bg-foreground/10" />
              <div className="flex-1 rounded-sm bg-foreground/10" />
            </div>
          )}
        </div>

        {/* Selected pulse ring */}
        {selected && (
          <div
            className="absolute inset-0 rounded-sm pointer-events-none"
            style={{
              boxShadow: "0 0 0 2px oklch(0.85 0.18 90), 0 0 24px oklch(0.85 0.18 90 / 0.4)",
              borderRadius: isRound ? "50%" : "4px",
            }}
          />
        )}

        {/* Label on hover/select */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wider rounded-sm transition-opacity ${
            selected
              ? "bg-accent text-accent-foreground opacity-100"
              : "bg-background/90 text-foreground opacity-0 group-hover:opacity-100"
          }`}
        >
          {item.label}
        </div>
      </div>
    </button>
  );
}
