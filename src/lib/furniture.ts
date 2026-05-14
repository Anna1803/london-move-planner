export type Difficulty = 1 | 2 | 3; // 1 easy, 2 medium, 3 hard/heavy/awkward

export type FurnitureItem = {
  id: string;
  label: string;
  difficulty: Difficulty;
  required?: boolean; // included by default for that room
};

export type RoomBlueprint = {
  id: string;
  name: string;
  catalog: FurnitureItem[];
};

export type PropertyBlueprint = {
  type: "house" | "apartment" | "office";
  title: string;
  tagline: string;
  defaultSqm: number;
  minSqm: number;
  maxSqm: number;
  rooms: RoomBlueprint[];
};

const f = (
  id: string,
  label: string,
  difficulty: Difficulty,
  required = false,
): FurnitureItem => ({ id, label, difficulty, required });

// ---- Reusable room catalogs ----
const livingRoom: RoomBlueprint = {
  id: "living",
  name: "Living Room",
  catalog: [
    f("sofa-3", "3-Seat Sofa", 3, true),
    f("sofa-2", "2-Seat Sofa", 2),
    f("armchair", "Armchair", 2),
    f("coffee-table", "Coffee Table", 1, true),
    f("tv-unit", "TV Unit / Stand", 2),
    f("tv", "TV (mounted or on stand)", 2),
    f("bookshelf", "Bookshelf", 3),
    f("rug-large", "Large Rug", 1),
    f("side-table", "Side Table", 1),
    f("floor-lamp", "Floor Lamp", 1),
    f("piano-upright", "Upright Piano", 3),
    f("display-cabinet", "Display Cabinet", 3),
  ],
};

const bedroom: RoomBlueprint = {
  id: "bedroom",
  name: "Bedroom",
  catalog: [
    f("bed-double", "Double Bed (frame + mattress)", 3, true),
    f("bed-single", "Single Bed", 2),
    f("bed-king", "King Size Bed", 3),
    f("chest-drawers", "Chest of Drawers", 2, true),
    f("wardrobe", "Wardrobe", 3),
    f("nightstand", "Nightstand / Bedside Table", 1),
    f("dressing-table", "Dressing Table", 2),
    f("mirror-large", "Large Mirror", 2),
    f("ottoman", "Ottoman / Storage Bench", 1),
    f("tv-bedroom", "Bedroom TV", 1),
  ],
};

const kitchen: RoomBlueprint = {
  id: "kitchen",
  name: "Kitchen",
  catalog: [
    f("fridge", "Fridge / Freezer", 3, true),
    f("oven-free", "Free-standing Oven", 3),
    f("microwave", "Microwave", 1),
    f("dishwasher", "Dishwasher", 2),
    f("washer", "Washing Machine", 3),
    f("dryer", "Tumble Dryer", 2),
    f("dining-table", "Dining Table", 2, true),
    f("dining-chairs", "Dining Chairs (set)", 1),
    f("kitchen-island", "Kitchen Island / Trolley", 2),
    f("boxes-kitchen", "Boxes of Kitchenware", 1, true),
  ],
};

const bathroom: RoomBlueprint = {
  id: "bathroom",
  name: "Bathroom",
  catalog: [
    f("bathtub", "Bathtub (free-standing)", 3, true),
    f("shower-cabin", "Shower Cabin", 3),
    f("bath-cabinet", "Bathroom Cabinet", 1),
    f("laundry-basket", "Laundry Basket", 1),
    f("mirror-bath", "Bathroom Mirror", 1),
    f("boxes-toiletries", "Boxes of Toiletries", 1, true),
  ],
};

const hallway: RoomBlueprint = {
  id: "hallway",
  name: "Hallway / Storage",
  catalog: [
    f("boxes-misc", "Storage Boxes", 1, true),
    f("shoe-rack", "Shoe Rack", 1),
    f("coat-rack", "Coat Rack", 1),
    f("vacuum", "Vacuum Cleaner", 1),
    f("bicycle", "Bicycle", 2),
    f("suitcases", "Suitcases", 1),
  ],
};

const homeOffice: RoomBlueprint = {
  id: "home-office",
  name: "Home Office",
  catalog: [
    f("desk", "Desk", 2, true),
    f("office-chair", "Office Chair", 1, true),
    f("filing", "Filing Cabinet", 2),
    f("monitor", "Monitor / Computer", 1),
    f("printer", "Printer", 1),
    f("bookshelf-o", "Bookshelf", 2),
  ],
};

// ---- Office property rooms ----
const meetingRoom: RoomBlueprint = {
  id: "meeting",
  name: "Meeting Room",
  catalog: [
    f("meeting-table", "Conference Table", 3, true),
    f("meeting-chairs", "Conference Chairs (set)", 2, true),
    f("display-screen", "Wall Display Screen", 2),
    f("whiteboard", "Whiteboard", 1),
  ],
};

const workspace: RoomBlueprint = {
  id: "workspace",
  name: "Open Workspace",
  catalog: [
    f("desks", "Desks (per 4)", 2, true),
    f("office-chairs", "Office Chairs (per 8)", 2, true),
    f("storage-cabinet", "Storage Cabinet", 2),
    f("monitors", "Monitors / Computers", 1, true),
    f("partitions", "Desk Partitions", 2),
    f("safes", "Safe", 3),
  ],
};

const reception: RoomBlueprint = {
  id: "reception",
  name: "Reception",
  catalog: [
    f("reception-desk", "Reception Desk", 3, true),
    f("waiting-sofa", "Waiting Sofa", 2),
    f("coffee-tab", "Coffee Table", 1),
    f("plants", "Office Plants", 1),
  ],
};

const kitchenette: RoomBlueprint = {
  id: "kitchenette",
  name: "Kitchenette",
  catalog: [
    f("office-fridge", "Office Fridge", 2, true),
    f("micro-o", "Microwave", 1),
    f("coffee-machine", "Coffee Machine", 1),
    f("kitchenette-table", "Break Table & Chairs", 2),
  ],
};

export const HOUSE: PropertyBlueprint = {
  type: "house",
  title: "House",
  tagline: "Townhouse, terrace or detached.",
  defaultSqm: 90,
  minSqm: 40,
  maxSqm: 250,
  rooms: [livingRoom, kitchen, bedroom, bathroom, homeOffice, hallway],
};

export const APARTMENT: PropertyBlueprint = {
  type: "apartment",
  title: "Apartment / Flat",
  tagline: "Studio, 1-bed, 2-bed, or larger.",
  defaultSqm: 55,
  minSqm: 20,
  maxSqm: 150,
  rooms: [livingRoom, kitchen, bedroom, bathroom, hallway],
};

export const OFFICE: PropertyBlueprint = {
  type: "office",
  title: "Office",
  tagline: "Studios, suites & commercial floors.",
  defaultSqm: 120,
  minSqm: 30,
  maxSqm: 600,
  rooms: [reception, workspace, meetingRoom, kitchenette],
};

export const BLUEPRINTS: Record<string, PropertyBlueprint> = {
  house: HOUSE,
  apartment: APARTMENT,
  office: OFFICE,
};

// ---- Pricing model: time + difficulty, NOT per-item ----
// Crew of 2 movers; price is hourly. Hours estimated from sqm + total difficulty score.
export const HOURLY_RATE = 65; // £ per crew-hour
export const MIN_HOURS = 2;

export function estimateHours(sqm: number, totalDifficulty: number): number {
  // Base time from property size, plus extra time per difficulty point.
  const sizeHours = sqm / 28;       // ~28 m² per crew-hour to clear
  const handlingHours = totalDifficulty * 0.18; // ~11 min per difficulty point
  return Math.max(MIN_HOURS, Math.round((sizeHours + handlingHours) * 2) / 2); // round to 0.5h
}

export function difficultyLabel(score: number): string {
  if (score <= 8) return "Light";
  if (score <= 18) return "Standard";
  if (score <= 30) return "Heavy";
  return "Complex";
}
