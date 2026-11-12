// Day-1 prototype data. Replaced by Supabase in Prompt 2.

export type CategoryId = "starters" | "mains" | "desserts";

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
  tags: string[];
  isAvailable: boolean;
};

export type Restaurant = {
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  /** Brand color for buttons and accents. Must pass 4.5:1 contrast with white text. */
  primaryColor: string;
  categories: Category[];
  dishes: Dish[];
};

export const demoBistro: Restaurant = {
  name: "Demo Bistro",
  slug: "demo-bistro",
  logo: "/images/demo-bistro-logo.svg",
  tagline: "Seasonal plates, made from scratch.",
  primaryColor: "#9a3412",
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
      plateDiameterCm: 31,
      tags: ["Vegetarian", "Gluten-free", "To share"],
      isAvailable: true,
    },
  ],
};

const restaurants: Restaurant[] = [demoBistro];

export function getRestaurants(): Restaurant[] {
  return restaurants;
}

export function getRestaurant(slug: string): Restaurant | undefined {
  return restaurants.find((r) => r.slug === slug);
}

export function getDish(
  restaurant: Restaurant,
  dishId: string,
): Dish | undefined {
  return restaurant.dishes.find((d) => d.id === dishId);
}
