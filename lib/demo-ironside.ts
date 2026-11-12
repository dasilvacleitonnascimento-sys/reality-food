// Ironside Cafe (Miami) — demo menu for a sales simulation.
// Names, descriptions and prices come from the restaurant's public online menu.
// 3D models use industry-standard serving sizes (see scripts/demo/ironside.mjs);
// the restaurant's own plate/cup sizes and photos replace them after signup.

import type { Dish, Restaurant } from "./demo-data";

const IMG = "/images/ironside";
const MODELS = "/models/ironside";

type Item = Omit<Dish, "photo" | "glbUrl" | "isAvailable" | "tags"> & { tags?: string[]; model?: boolean };

/** Items with model: true get /models/ironside/<id>.glb and a rendered photo. */
function dish(item: Item): Dish {
  const { model = true, tags = [], ...rest } = item;
  return {
    ...rest,
    tags,
    photo: model ? `${IMG}/${item.id}.jpg` : `${IMG}/coming-soon.jpg`,
    glbUrl: model ? `${MODELS}/${item.id}.glb` : undefined,
    isAvailable: true,
  };
}

const PAO =
  "Enjoy our gluten-free cheese bread, crafted with real Parmesan cheese for an authentic flavor. Made without seed oils, this deliciously fluffy bread is a wholesome and satisfying option for cheese lovers seeking a guilt-free treat.";

const HOT = (id: string, name: string, description: string, price: number, oz: number, saucer: number): Dish =>
  dish({ id, name, description, price, category: "hot-coffee", plateDiameterCm: saucer, servedIn: { kind: "cup", oz } });
const GLASS = (id: string, name: string, description: string, price: number, category: string, oz: number, widthCm: number): Dish =>
  dish({ id, name, description, price, category, plateDiameterCm: widthCm, servedIn: { kind: "glass", oz } });
const CUP16 = (id: string, name: string, description: string, price: number, category: string): Dish =>
  GLASS(id, name, description, price, category, 16, 9.8);

export const ironsideCafe: Restaurant = {
  name: "Ironside Cafe",
  slug: "ironside-cafe",
  logo: `${IMG}/logo.svg`,
  tagline: "Mediterranean café at Miami Ironside.",
  primaryColor: "#1f3a33",
  categories: [
    { id: "all-day", name: "All Day" },
    { id: "sandwiches", name: "Sandwiches" },
    { id: "salads", name: "Salads" },
    { id: "lunch-bowls", name: "Lunch Bowls" },
    { id: "bowls", name: "Bowls" },
    { id: "juices", name: "Fresh Juices" },
    { id: "smoothies", name: "Smoothies" },
    { id: "hot-coffee", name: "Hot Coffee & Tea" },
    { id: "iced-coffee", name: "Iced Coffee & Tea" },
  ],
  dishes: [
    // --- All day -------------------------------------------------------------
    dish({ id: "pao-de-queijo", name: "Pao de Queijo (Cheese Bread)", description: PAO, price: 3.25, category: "all-day", plateDiameterCm: 14, portionCm: { width: 5, depth: 5, height: 3.3 }, tags: ["Gluten-free"] }),
    dish({ id: "pao-de-queijo-3", name: "Combo 3 - Pao de Queijo", description: PAO, price: 9, category: "all-day", plateDiameterCm: 18, tags: ["Popular", "Gluten-free"] }),
    dish({ id: "pao-de-queijo-5", name: "Combo 5 - Pao de Queijo", description: PAO, price: 13, category: "all-day", plateDiameterCm: 20, tags: ["Gluten-free"] }),
    dish({
      id: "boureka",
      name: "Boureka",
      description:
        "Mediterranean baked puffy pastry with a flaky & crispy texture. Choose your flavor: Feta, Ricotta & Kashkaval Cheese, Spinach & Feta OR Mashed Potato.",
      price: 5.25,
      category: "all-day",
      plateDiameterCm: 20, portionCm: { width: 8.8, depth: 9, height: 3.8 },
      tags: ["Popular"],
    }),
    dish({
      id: "classic-croissant",
      name: "Classic Croissant",
      description: "Enjoy a buttery classic croissant, flaky and golden, served with a side of organic strawberry jam or rich homemade Nutella.",
      price: 6.75,
      category: "all-day",
      plateDiameterCm: 24, portionCm: { width: 15.8, depth: 9.7, height: 5.4 },
    }),
    dish({
      id: "avocado-toast",
      name: "Avocado Toast",
      description:
        "Two toasts with fresh mashed avocado spread over hearty multigrain bread, topped with organic ingredients. Flavors: Burrata & Tomatoes; Organic baby Bella mushrooms & onions; or Organic free-range eggs scrambled & grape tomatoes.",
      price: 15,
      category: "all-day",
      plateDiameterCm: 28,
    }),
    dish({
      id: "omelette",
      name: "Omelette",
      description:
        "Three Happy Egg® organic eggs, light and fluffy, with your choice of fresh fillings: colorful vegetables, creamy cheeses and more. Choose up to 3 fillings; add more for an extra price.",
      price: 16.75,
      category: "all-day",
      plateDiameterCm: 28, portionCm: { width: 20, depth: 11.5, height: 3.4 },
    }),
    dish({
      id: "scrambled-eggs",
      name: "Scrambled Eggs",
      description:
        "Three Happy Egg® organic eggs scrambled, with your choice of fresh fillings: colorful vegetables, creamy cheeses and more. Choose up to 3 fillings; add more for an extra price.",
      price: 16.75,
      category: "all-day",
      plateDiameterCm: 26,
    }),
    dish({
      id: "tapioca-crepe",
      name: "Tapioca Crepe",
      description:
        "Gluten-free tapioca crepe made from smooth yuca flour, filled with your choice of ingredients. Choose up to 3 fillings; add more for an extra price.",
      price: 18.75,
      category: "all-day",
      plateDiameterCm: 28, portionCm: { width: 22, depth: 12.2, height: 2.6 },
      tags: ["Gluten-free"],
    }),
    dish({
      id: "shakshuka",
      name: "Shakshuka",
      description:
        "Two organic eggs nestled in a rich, spiced tomato sauce with bell peppers and onions, topped with fresh herbs. Served with Jerusalem bagel.",
      price: 18.75,
      category: "all-day",
      plateDiameterCm: 18,
      servedIn: { kind: "pan" },
    }),

    // --- Sandwiches (3D coming soon) ----------------------------------------------
    dish({ model: false, id: "halloumi-sandwich", name: "Grilled Halloumi, Arugula & Tomatoes Sandwich", description: "Authentic Cyprus halloumi cheese, fresh arugula, ripe tomato and your choice of bread, grilled to perfection.", price: 15.5, category: "sandwiches", plateDiameterCm: 28, tags: ["30g protein"] }),
    dish({ model: false, id: "egg-parmesan-sandwich", name: "Scrambled Eggs, Parmesan & Tomatoes Sandwich", description: "Organic free-range scrambled eggs, cheese and juicy grape tomatoes on the bread of your choice.", price: 16.5, category: "sandwiches", plateDiameterCm: 28, tags: ["28g protein"] }),
    dish({ model: false, id: "sabich", name: "Eggplant Sandwich (Sabich)", description: "Smoky roasted eggplant with sliced boiled egg, crisp lettuce, ripe tomatoes, pickled lemon and creamy tahini.", price: 16.5, category: "sandwiches", plateDiameterCm: 28, tags: ["20g protein"] }),
    dish({ model: false, id: "chicken-shawarma", name: "Chicken Shawarma", description: "Organic Mediterranean chicken, crisp lettuce, tomatoes and cucumber with creamy tahini, served on pita bread.", price: 19.5, category: "sandwiches", plateDiameterCm: 28, tags: ["37g protein"] }),
    dish({ model: false, id: "beef-shawarma", name: "Beef Shawarma", description: "Warm pita with tender grass-fed spicy skirt steak, crisp lettuce, tomatoes, cucumber and creamy tahini.", price: 21.5, category: "sandwiches", plateDiameterCm: 28, tags: ["39g protein"] }),
    dish({ model: false, id: "pita-burger", name: "Pita Burger", description: "Ground beef and lamb in warm pita with lettuce, tomato, cucumber, creamy tahini and a homemade spicy paste.", price: 19.5, category: "sandwiches", plateDiameterCm: 28, tags: ["46g protein"] }),
    dish({ model: false, id: "tunisian-sandwich", name: "Tunisian Sandwich", description: "Yellowfin tuna in olive oil with organic eggs, Kalamata olives, potatoes, pickled lemon and a homemade spicy paste, on baguette.", price: 19.5, category: "sandwiches", plateDiameterCm: 28, tags: ["28g protein"] }),
    dish({ model: false, id: "chicken-schnitzel", name: "Chicken Schnitzel", description: "Oven-baked organic chicken schnitzel with tomatoes, cucumber and pickles in pita with tahini, plus a side of baked potatoes.", price: 19.5, category: "sandwiches", plateDiameterCm: 28 }),

    // --- Salads & lunch bowls (3D coming soon) -------------------------------------
    dish({ model: false, id: "greek-salad", name: "Greek Salad", description: "Organic tomatoes, onions, cucumbers, Kalamata olives & feta cheese with olive oil & lime dressing.", price: 17.5, category: "salads", plateDiameterCm: 25, servedIn: { kind: "bowl" } }),
    dish({ model: false, id: "nicoise-salad", name: "Nicoise Salad", description: "Wild-caught yellowfin tuna in olive oil, romaine, radish, fingerling potatoes, green beans, red onion, hard-boiled eggs, Kalamata olives & tomatoes with mustard dressing.", price: 24, category: "salads", plateDiameterCm: 25, servedIn: { kind: "bowl" }, tags: ["34g protein"] }),
    dish({ model: false, id: "fit-protein-bowl", name: "Fit Protein Bowl", description: "Mediterranean-spiced grilled chicken, soft-boiled egg, arugula and quinoa, cherry tomatoes, avocado and sprouts with a light yogurt dressing.", price: 25, category: "salads", plateDiameterCm: 25, servedIn: { kind: "bowl" }, tags: ["47g protein"] }),
    dish({ model: false, id: "rice-bowl", name: "Rice Bowl", description: "Organic rice with chickpeas, mashed avocado and a chopped salad of cucumbers, onions and tomatoes. Choose grilled chicken, wild-caught tuna or skirt steak.", price: 25, category: "lunch-bowls", plateDiameterCm: 25, servedIn: { kind: "bowl" }, tags: ["47g protein"] }),
    dish({ model: false, id: "kebab-plate", name: "Beef & Lamb Kebab Plate", description: "Oven-roasted beef and lamb kebab with Mediterranean spices, chopped salad, house-made tzatziki and warm pita.", price: 25, category: "lunch-bowls", plateDiameterCm: 28, tags: ["53g protein"] }),

    // --- Bowls -----------------------------------------------------------------------
    dish({ id: "classic-acai-bowl", name: "Classic Acai Bowl", description: "Authentic acai blended with banana and topped with fresh fruits. Finished with crunchy granola or walnuts.", price: 19.25, category: "bowls", plateDiameterCm: 16, servedIn: { kind: "bowl" } }),
    dish({ id: "mango-passion-bowl", name: "Mango Passion Bowl", description: "Mango and passion fruit blended to creamy perfection, topped with fresh fruits and crunchy granola or walnuts.", price: 19.75, category: "bowls", plateDiameterCm: 16, servedIn: { kind: "bowl" } }),

    // --- Juices & smoothies (16 oz) ----------------------------------------------------
    CUP16("lemonade", "Lemonade", "Lemon & honey.", 7.5, "juices"),
    CUP16("super-greens", "Super Greens", "Spinach, lime, green apple, ginger & coconut water.", 9.75, "juices"),
    CUP16("detox", "Detox", "Pineapple, mint, ginger & coconut water.", 9.75, "juices"),
    CUP16("ironside-sunset", "Ironside Sunset", "Thick carrot, mango, ginger & orange juice.", 9.75, "juices"),
    CUP16("tropicooler", "Tropicooler", "Mango, pineapple, cucumber, lime & honey.", 9.75, "juices"),
    CUP16("orange-juice", "Fresh Squeezed Orange Juice", "Freshly squeezed orange juice.", 9.75, "juices"),
    CUP16("antioxidant-acai", "Antioxidant Açaí", "Açaí, banana, honey & coconut water.", 12.25, "smoothies"),
    CUP16("banana-cacao", "Banana & Cacao", "Banana, premium roasted cacao, dates, cashew & milk of your choice.", 12.25, "smoothies"),
    CUP16("banana-strawberry", "Banana & Strawberry", "Banana, strawberry & milk of your choice.", 11.75, "smoothies"),
    CUP16("green-tropical-detox", "Green Tropical Detox", "Spinach, pineapple, mango, banana & coconut water.", 11.75, "smoothies"),
    CUP16("energy-booster", "Energy Booster", "Banana, mango, orange juice and coconut water. Naturally sweet and packed with potassium.", 11.75, "smoothies"),
    CUP16("longevity-breeze", "Longevity Breeze", "Mango, blueberry, raspberry, strawberry, blackberry & coconut water.", 11.75, "smoothies"),

    // --- Hot coffee & tea ----------------------------------------------------------------
    HOT("espresso", "Espresso", "Single shot espresso of medium roasted custom blend of coffee beans.", 3.7, 3, 12),
    HOT("macchiato", "Macchiato", "A classic single shot espresso served with just a dash of frothy milk.", 4.5, 3, 12),
    GLASS("overturned-coffee", "Overturned Coffee", "Espresso poured over steamed milk.", 4.5, "hot-coffee", 4.5, 7.3),
    GLASS("cortado", "Cortado", "A balanced single shot espresso with equal parts rich espresso and smooth steamed milk.", 4.5, "hot-coffee", 4.5, 7.3),
    HOT("americano", "Americano", "A simple yet bold coffee made by diluting rich espresso with hot water.", 5.5, 12, 16),
    HOT("cappuccino", "Cappuccino", "A rich shot of espresso topped with equal parts velvety steamed milk and frothy milk foam.", 6.25, 6, 15),
    HOT("hot-chocolate", "Hot Chocolate", "Rich hot chocolate crafted from premium cocoa and blended with creamy milk.", 6.25, 12, 16),
    { ...HOT("latte", "Latte", "A harmonious blend of rich espresso and steamed milk, finished with a light layer of froth.", 6.25, 12, 16), tags: ["Popular"] },
    HOT("mochaccino", "Mochaccino", "Bold espresso, smooth steamed milk and premium cocoa.", 7.4, 12, 16),
    HOT("chai-latte", "Chai Latte", "Spiced black tea and creamy steamed milk with cinnamon, cardamom and ginger.", 7.4, 12, 16),
    HOT("matcha-latte", "Matcha Latte", "Finely ground green tea and creamy steamed milk, smooth and earthy.", 7.4, 12, 16),
    HOT("hot-tea", "Hot Tea", "High-quality tea leaves: classic black, fragrant green or herbal blends. Choose your flavor.", 6, 12, 16),

    // --- Iced coffee & tea -----------------------------------------------------------------
    GLASS("iced-cortado", "Iced Cortado", "A balanced single shot espresso with equal parts rich espresso and smooth milk.", 4.5, "iced-coffee", 8, 8.5),
    CUP16("iced-americano", "Iced Americano", "A simple yet bold coffee made by diluting rich espresso with water.", 5.5, "iced-coffee"),
    CUP16("iced-cappuccino", "Iced Cappuccino", "A rich shot of espresso topped with equal parts velvety milk and frothy milk foam.", 6.5, "iced-coffee"),
    CUP16("iced-latte", "Iced Latte", "A harmonious blend of rich espresso and milk.", 6.5, "iced-coffee"),
    CUP16("iced-mochaccino", "Iced Mochaccino", "Bold espresso, smooth milk and premium cocoa.", 7.5, "iced-coffee"),
    CUP16("iced-chai", "Iced Chai", "Spiced black tea and creamy milk with cinnamon, cardamom and ginger.", 7.5, "iced-coffee"),
    CUP16("iced-matcha", "Iced Matcha", "Finely ground green tea and creamy milk.", 7.5, "iced-coffee"),
    GLASS("vanilla-affogato", "Vanilla Affogato", "A scoop of creamy vanilla ice cream topped with a hot shot of rich espresso.", 7.5, "iced-coffee", 8, 8.5),
    GLASS("shakerato", "Shakerato", "Freshly brewed espresso and milk shaken with ice, served without the ice.", 8, "iced-coffee", 8, 8.5),
    CUP16("iced-tea", "Iced Tea", "High-quality tea leaves: classic black, fragrant green or herbal blends.", 6, "iced-coffee"),
  ],
  translations: {
    es: {
      tagline: "Café mediterráneo en Miami Ironside.",
      categories: {
        "all-day": "Todo el día",
        sandwiches: "Sándwiches",
        salads: "Ensaladas",
        "lunch-bowls": "Bowls de almuerzo",
        bowls: "Bowls",
        juices: "Jugos naturales",
        smoothies: "Batidos",
        "hot-coffee": "Café y té calientes",
        "iced-coffee": "Café y té helados",
      },
      tags: {
        Popular: "Popular",
        "Gluten-free": "Sin gluten",
        "20g protein": "20 g de proteína",
        "28g protein": "28 g de proteína",
        "30g protein": "30 g de proteína",
        "34g protein": "34 g de proteína",
        "37g protein": "37 g de proteína",
        "39g protein": "39 g de proteína",
        "46g protein": "46 g de proteína",
        "47g protein": "47 g de proteína",
        "53g protein": "53 g de proteína",
      },
    },
  },
};
