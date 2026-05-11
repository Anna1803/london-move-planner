import { useEffect, useRef, useState } from "react";
import type { PropertyBlueprint } from "@/lib/furniture";
import { IsoFurniture } from "./IsoFurniture";

type Props = {
  blueprint: PropertyBlueprint;
  selected: Set<string>;
  onToggle: (id: string) => void;
};

export function FloorPlan({ blueprint, selected, onToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState({ w: 200, h: 160 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      // Approximate cell size based on grid template
      const cols = blueprint.gridCols.split(" ").length;
      const rows = blueprint.gridRows.split(" ").length;
      setCellSize({
        w: el.clientWidth / cols,
        h: el.clientHeight / rows,
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [blueprint]);

  return (
    <div
      ref={ref}
      className="relative w-full h-full grid gap-1 p-1 rounded-md halftone-bone bg-card/40 border border-border/70"
      style={{
        gridTemplateColumns: blueprint.gridCols,
        gridTemplateRows: blueprint.gridRows,
      }}
    >
      {blueprint.rooms.map((room) => (
        <div
          key={room.id}
          className="relative rounded-sm bg-background/70 border border-dashed border-border overflow-hidden"
          style={{ gridArea: room.gridArea }}
        >
          {/* Room label */}
          <div className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 bg-background/80 backdrop-blur-sm rounded-sm">
            <div className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
              {room.name}
            </div>
          </div>

          {/* Grid texture */}
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.94 0.02 85 / 0.04) 1px, transparent 1px), linear-gradient(90deg, oklch(0.94 0.02 85 / 0.04) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />

          {/* Furniture */}
          {room.items.map((it) => (
            <IsoFurniture
              key={it.id}
              item={it}
              selected={selected.has(it.id)}
              onClick={() => onToggle(it.id)}
              cellWidth={cellSize.w}
              cellHeight={cellSize.h}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
