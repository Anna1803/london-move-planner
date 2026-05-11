export type FurnitureItem = {
  id: string;
  label: string;
  volume: number; // cubic meters
  price: number; // £ for handling/move
  // Isometric placement on the room canvas (relative to room cell)
  x: number; // 0..100
  y: number; // 0..100
  w: number; // 0..100
  d: number; // 0..100 (depth on the iso plane)
  h: number; // visual height factor 0..1
  shape?: "box" | "sofa" | "bed" | "round" | "tall";
};

export type RoomBlueprint = {
  id: string;
  name: string;
  // Grid placement on the floorplan (row/col span)
  gridArea: string; // CSS grid-area
  accent?: string;
  items: FurnitureItem[];
};

export type PropertyBlueprint = {
  type: "house" | "apartment" | "office";
  title: string;
  tagline: string;
  defaultSqm: number;
  minSqm: number;
  maxSqm: number;
  rooms: RoomBlueprint[];
  // CSS grid template (rows / cols) for the floorplan
  gridCols: string;
  gridRows: string;
};

// Helper to build an item quickly
const item = (
  id: string,
  label: string,
  volume: number,
  price: number,
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  shape: FurnitureItem["shape"] = "box",
): FurnitureItem => ({ id, label, volume, price, x, y, w, d, h, shape });

const livingRoom: RoomBlueprint = {
  id: "living",
  name: "Living Room",
  gridArea: "living",
  items: [
    item("sofa-3", "3-Seat Sofa", 1.8, 45, 10, 60, 50, 25, 0.45, "sofa"),
    item("armchair", "Armchair", 0.7, 20, 70, 60, 22, 22, 0.5, "sofa"),
    item("coffee-table", "Coffee Table", 0.3, 12, 25, 35, 30, 18, 0.18),
    item("tv-unit", "TV Unit", 0.6, 22, 35, 8, 35, 14, 0.3),
    item("bookshelf", "Bookshelf", 0.9, 30, 78, 10, 18, 12, 0.85, "tall"),
  ],
};

const bedroom: RoomBlueprint = {
  id: "bedroom",
  name: "Bedroom",
  gridArea: "bedroom",
  items: [
    item("bed-double", "Double Bed", 2.0, 55, 12, 30, 50, 50, 0.35, "bed"),
    item("wardrobe", "Wardrobe", 1.6, 50, 70, 12, 22, 18, 0.85, "tall"),
    item("nightstand-1", "Nightstand", 0.15, 8, 10, 18, 12, 10, 0.3),
    item("dresser", "Dresser", 0.7, 25, 65, 14, 28, 14, 0.45),
  ],
};

const kitchen: RoomBlueprint = {
  id: "kitchen",
  name: "Kitchen",
  gridArea: "kitchen",
  items: [
    item("fridge", "Fridge / Freezer", 0.9, 35, 12, 18, 18, 16, 0.95, "tall"),
    item("oven", "Oven", 0.5, 22, 35, 22, 18, 16, 0.75, "tall"),
    item("dining-table", "Dining Table", 0.6, 22, 55, 50, 32, 26, 0.22),
    item("dishwasher", "Dishwasher", 0.4, 18, 12, 50, 16, 16, 0.7, "tall"),
  ],
};

const bathroom: RoomBlueprint = {
  id: "bathroom",
  name: "Bathroom",
  gridArea: "bathroom",
  items: [
    item("washer", "Washing Machine", 0.4, 20, 18, 25, 22, 22, 0.7, "tall"),
    item("dryer", "Tumble Dryer", 0.4, 20, 18, 65, 22, 22, 0.7, "tall"),
  ],
};

const hallway: RoomBlueprint = {
  id: "hallway",
  name: "Hallway",
  gridArea: "hallway",
  items: [
    item("boxes-sm", "Storage Boxes (×5)", 0.5, 15, 30, 35, 35, 25, 0.3),
    item("shoe-rack", "Shoe Rack", 0.2, 10, 70, 35, 22, 18, 0.3),
  ],
};

const office: RoomBlueprint = {
  id: "office",
  name: "Home Office",
  gridArea: "office",
  items: [
    item("desk", "Desk", 0.5, 20, 25, 25, 45, 22, 0.3),
    item("office-chair", "Office Chair", 0.3, 12, 55, 35, 18, 18, 0.4, "round"),
    item("filing", "Filing Cabinet", 0.4, 18, 75, 60, 16, 14, 0.5),
  ],
};

export const HOUSE: PropertyBlueprint = {
  type: "house",
  title: "House",
  tagline: "Townhouse, terrace or detached.",
  defaultSqm: 90,
  minSqm: 40,
  maxSqm: 250,
  gridCols: "1.2fr 1fr 0.8fr",
  gridRows: "1.2fr 1fr 0.6fr",
  rooms: [
    { ...livingRoom, gridArea: "1 / 1 / 2 / 3" },
    { ...kitchen, gridArea: "1 / 3 / 2 / 4" },
    { ...bedroom, gridArea: "2 / 1 / 3 / 2" },
    { ...bathroom, gridArea: "2 / 2 / 3 / 3" },
    { ...office, gridArea: "2 / 3 / 3 / 4" },
    { ...hallway, gridArea: "3 / 1 / 4 / 4" },
  ],
};

export const APARTMENT: PropertyBlueprint = {
  type: "apartment",
  title: "Apartment / Flat",
  tagline: "Studio, 1-bed, 2-bed, or larger.",
  defaultSqm: 55,
  minSqm: 20,
  maxSqm: 150,
  gridCols: "1.3fr 1fr",
  gridRows: "1fr 1fr 0.5fr",
  rooms: [
    { ...livingRoom, gridArea: "1 / 1 / 2 / 2" },
    { ...kitchen, gridArea: "1 / 2 / 2 / 3" },
    { ...bedroom, gridArea: "2 / 1 / 3 / 2" },
    { ...bathroom, gridArea: "2 / 2 / 3 / 3" },
    { ...hallway, gridArea: "3 / 1 / 4 / 3" },
  ],
};

const meetingRoom: RoomBlueprint = {
  id: "meeting",
  name: "Meeting Room",
  gridArea: "meeting",
  items: [
    item("meeting-table", "Conference Table", 1.2, 50, 20, 25, 55, 40, 0.22),
    item("chair-1", "Chairs (×6)", 1.0, 38, 18, 12, 12, 12, 0.4, "round"),
    item("chair-2", "Chairs (×6)", 0, 0, 70, 12, 12, 12, 0.4, "round"),
    item("screen", "Display Screen", 0.3, 20, 45, 4, 22, 6, 0.6, "tall"),
  ],
};

const workspace: RoomBlueprint = {
  id: "workspace",
  name: "Open Workspace",
  gridArea: "workspace",
  items: [
    item("desk-1", "Desks (×4)", 1.2, 60, 15, 25, 30, 20, 0.3),
    item("desk-2", "Desks (×4)", 0, 0, 60, 25, 30, 20, 0.3),
    item("chair-w-1", "Office Chairs (×8)", 1.6, 64, 18, 12, 12, 12, 0.4, "round"),
    item("chair-w-2", "Office Chairs (×8)", 0, 0, 70, 12, 12, 12, 0.4, "round"),
    item("cabinet", "Storage Cabinets", 0.9, 35, 75, 20, 20, 16, 0.75, "tall"),
  ],
};

const reception: RoomBlueprint = {
  id: "reception",
  name: "Reception",
  gridArea: "reception",
  items: [
    item("desk-r", "Reception Desk", 0.7, 28, 30, 35, 40, 18, 0.35),
    item("sofa-r", "Waiting Sofa", 1.2, 35, 25, 70, 40, 20, 0.4, "sofa"),
  ],
};

const kitchenette: RoomBlueprint = {
  id: "kitchenette",
  name: "Kitchenette",
  gridArea: "kitchenette",
  items: [
    item("fridge-o", "Office Fridge", 0.6, 25, 15, 20, 22, 20, 0.85, "tall"),
    item("micro", "Microwave", 0.1, 8, 50, 18, 18, 14, 0.3),
  ],
};

export const OFFICE: PropertyBlueprint = {
  type: "office",
  title: "Office",
  tagline: "Studios, suites & commercial floors.",
  defaultSqm: 120,
  minSqm: 30,
  maxSqm: 600,
  gridCols: "1fr 1.4fr",
  gridRows: "1fr 1fr 0.6fr",
  rooms: [
    { ...meetingRoom, gridArea: "1 / 1 / 2 / 2" },
    { ...workspace, gridArea: "1 / 2 / 3 / 3" },
    { ...reception, gridArea: "2 / 1 / 3 / 2" },
    { ...kitchenette, gridArea: "3 / 1 / 4 / 3" },
  ],
};

export const BLUEPRINTS: Record<string, PropertyBlueprint> = {
  house: HOUSE,
  apartment: APARTMENT,
  office: OFFICE,
};
