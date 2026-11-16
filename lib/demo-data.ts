// Day-1 prototype data. Replaced by Supabase in Prompt 2.

import { ironsideCafe } from "./demo-ironside.ts";

/** Category ids are per restaurant (e.g. "starters", "hot-coffee"). */
export type CategoryId = string;

export type Category = {
  id: CategoryId;
  name: string;
};

export type Dish = {
  id: string;
  name: string;
  description: string;
  /** Price in US dollars. */
  price: number;
  category: CategoryId;
  /** Path under /public, 4:3 aspect ratio. */
  photo: string;
  /** Path under /public. Only some dishes have a 3D model. */
  glbUrl?: string;
  /** Optional iOS model. If missing, model-viewer generates USDZ on the fly. */
  usdzUrl?: string;
  plateDiameterCm: number;
  /**
   * Size of the food itself (not the plate), in cm: width (side to side as
   * served), depth (front to back) and height. Checked against the 3D model
   * by `npm run check-models` and shown to diners so they can compare.
   */
  portionCm?: { width: number; depth: number; height: number };
  /** Drinks and bowls: what it's served in. Plates are the default. */
  servedIn?: { kind: "cup" | "glass" | "bowl" | "pan"; oz?: number };
  tags: string[];
  isAvailable: boolean;
};

/** Translated restaurant content. Anything missing falls back to English. */
export type RestaurantTranslation = {
  tagline?: string;
  categories?: Partial<Record<CategoryId, string>>;
  dishes?: Record<string, { name?: string; description?: string }>;
  tags?: Record<string, string>;
};

export type Restaurant = {
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  /** Stored per restaurant. Menus currently use the shared Reality Food palette (app/globals.css). */
  primaryColor: string;
  categories: Category[];
  dishes: Dish[];
  /** Base content is English; other languages are listed here. */
  translations?: { es?: RestaurantTranslation };
};

export const demoBistro: Restaurant = {
  name: "Demo Bistro",
  slug: "demo-bistro",
  logo: "/images/demo-bistro-logo.svg",
  tagline: "Seasonal plates, made from scratch.",
  primaryColor: "#191A1F",
  categories: [
    { id: "starters", name: "Starters" },
    { id: "mains", name: "Mains" },
    { id: "desserts", name: "Desserts" },
  ],
  dishes: [
    {
      id: "burrata",
      name: "Burrata & Heirloom Tomatoes",
      description:
        "Creamy burrata, heirloom and cherry tomatoes, fresh basil, olive oil and flaky sea salt.",
      price: 17,
      category: "starters",
      photo: "/images/burrata.jpg",
      glbUrl: "/models/burrata.glb",
      plateDiameterCm: 23,
      tags: ["Vegetarian", "Gluten-free"],
      isAvailable: true,
    },
    {
      id: "shrimp-risotto",
      name: "Shrimp Risotto",
      description:
        "Creamy arborio rice with jumbo shrimp, parmesan, parsley and a touch of olive oil.",
      price: 29,
      category: "mains",
      photo: "/images/shrimp-risotto.jpg",
      glbUrl: "/models/shrimp-risotto.glb",
      plateDiameterCm: 27,
      tags: ["Chef's pick", "Gluten-free"],
      isAvailable: true,
    },
    {
      id: "schnitzel-plate",
      name: "Chicken Schnitzel Plate",
      description:
        "Crispy breaded chicken with pickled beets, cucumber, slaw and lemon. Scanned from the real dish with a phone.",
      price: 18,
      category: "mains",
      photo: "/images/schnitzel-plate.jpg",
      glbUrl: "/models/demo-bistro/schnitzel-plate.glb",
      plateDiameterCm: 26.5,
      tags: ["Real scan"],
      isAvailable: true,
    },
    {
      id: "double-burger",
      name: "Double Beef Burger",
      description:
        "Two juicy beef patties, crisp lettuce and a toasted brioche bun. Scanned from the real dish with a phone.",
      price: 16,
      category: "mains",
      photo: "/images/burger.jpg",
      glbUrl: "/models/demo-bistro/burger.glb",
      plateDiameterCm: 23,
      tags: ["Real scan"],
      isAvailable: true,
    },
    {
      id: "chocolate-cake",
      name: "Triple Chocolate Cake",
      description:
        "Layers of dark chocolate sponge and milk chocolate ganache, with whipped cream and fresh raspberries.",
      price: 12,
      category: "desserts",
      photo: "/images/chocolate-cake.jpg",
      glbUrl: "/models/chocolate-cake.glb",
      plateDiameterCm: 20,
      tags: ["Vegetarian"],
      isAvailable: true,
    },
    {
      id: "pudim",
      name: "Pudim (Brazilian Flan)",
      description:
        "Silky condensed-milk flan bathed in golden caramel. Whole flan, serves 8.",
      price: 36,
      category: "desserts",
      photo: "/images/pudim.jpg",
      glbUrl: "/models/pudim.glb",
      plateDiameterCm: 30,
      tags: ["Vegetarian", "Gluten-free", "To share"],
      isAvailable: true,
    },
    {
      id: "pudim-slice",
      name: "Pudim Slice",
      description:
        "One generous slice of our silky condensed-milk flan, with golden caramel sauce.",
      price: 9,
      category: "desserts",
      photo: "/images/pudim-slice.jpg",
      glbUrl: "/models/pudim-slice.glb",
      plateDiameterCm: 18,
      portionCm: { width: 8.0, depth: 8.2, height: 8.5 },
      tags: ["Vegetarian", "Gluten-free"],
      isAvailable: true,
    },
  ],
  translations: {
    es: {
      tagline: "Platos de temporada, hechos en casa.",
      categories: { starters: "Entradas", mains: "Platos fuertes", desserts: "Postres" },
      dishes: {
        burrata: {
          name: "Burrata con tomates heirloom",
          description:
            "Burrata cremosa, tomates heirloom y cherry, albahaca fresca, aceite de oliva y sal en escamas.",
        },
        "double-burger": {
          name: "Hamburguesa doble de res",
          description:
            "Dos jugosas carnes de res, lechuga crujiente y pan brioche tostado. Escaneada del plato real con un teléfono.",
        },
        "schnitzel-plate": {
          name: "Plato de schnitzel de pollo",
          description:
            "Pollo empanizado crujiente con betabel encurtido, pepino, ensalada de col y limón. Escaneado del plato real con un teléfono.",
        },
        "shrimp-risotto": {
          name: "Risotto de camarones",
          description:
            "Arroz arborio cremoso con camarones jumbo, parmesano, perejil y un toque de aceite de oliva.",
        },
        "chocolate-cake": {
          name: "Pastel triple chocolate",
          description:
            "Capas de bizcocho de chocolate oscuro y ganache de chocolate con leche, con crema batida y frambuesas frescas.",
        },
        "pudim-slice": {
          name: "Rebanada de pudim",
          description: "Una rebanada generosa de nuestro flan sedoso de leche condensada, con salsa de caramelo dorado.",
        },
        pudim: {
          name: "Pudim (flan brasileño)",
          description:
            "Flan sedoso de leche condensada bañado en caramelo dorado. Flan entero, para 8 personas.",
        },
      },
      tags: {
        Vegetarian: "Vegetariano",
        "Gluten-free": "Sin gluten",
        "Chef's pick": "Recomendación del chef",
        "To share": "Para compartir",
      },
    },
  },
};

const restaurants: Restaurant[] = [demoBistro, ironsideCafe];

export function getRestaurants(): Restaurant[] {
  return restaurants;
}

/** Returns the restaurant with its content in the requested language ("en" or "es"). */
export function getRestaurant(slug: string, locale: string = "en"): Restaurant | undefined {
  const restaurant = restaurants.find((r) => r.slug === slug);
  if (!restaurant) return undefined;
  const t = locale === "es" ? restaurant.translations?.es : undefined;
  if (!t) return restaurant;
  return {
    ...restaurant,
    tagline: t.tagline ?? restaurant.tagline,
    categories: restaurant.categories.map((c) => ({ ...c, name: t.categories?.[c.id] ?? c.name })),
    dishes: restaurant.dishes.map((d) => ({
      ...d,
      name: t.dishes?.[d.id]?.name ?? d.name,
      description: t.dishes?.[d.id]?.description ?? d.description,
      tags: d.tags.map((tag) => t.tags?.[tag] ?? tag),
    })),
  };
}

export function getDish(
  restaurant: Restaurant,
  dishId: string,
): Dish | undefined {
  return restaurant.dishes.find((d) => d.id === dishId);
}
