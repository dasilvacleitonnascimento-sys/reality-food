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
      dishes: {
        "pao-de-queijo": { name: "Pão de Queijo (pan de queso)", description: "Pan de queso sin gluten, hecho con queso parmesano de verdad para un sabor auténtico. Sin aceites de semillas: un pan esponjoso y saludable para los amantes del queso." },
        "pao-de-queijo-3": { name: "Combo 3 - Pão de Queijo", description: "Pan de queso sin gluten, hecho con queso parmesano de verdad para un sabor auténtico. Sin aceites de semillas: un pan esponjoso y saludable para los amantes del queso." },
        "pao-de-queijo-5": { name: "Combo 5 - Pão de Queijo", description: "Pan de queso sin gluten, hecho con queso parmesano de verdad para un sabor auténtico. Sin aceites de semillas: un pan esponjoso y saludable para los amantes del queso." },
        "boureka": { name: "Boureka", description: "Hojaldre mediterráneo horneado, crujiente y hojaldrado. Elige tu sabor: feta, ricotta y kashkaval; espinaca y feta; o puré de papa." },
        "classic-croissant": { name: "Croissant clásico", description: "Croissant de mantequilla, hojaldrado y dorado, con mermelada orgánica de fresa o Nutella casera." },
        "avocado-toast": { name: "Tostada de aguacate", description: "Dos tostadas de pan multigrano con aguacate machacado y toppings orgánicos. Sabores: burrata y tomates; champiñones baby Bella orgánicos y cebolla; o huevos orgánicos revueltos y tomates uva." },
        "omelette": { name: "Omelette", description: "Tres huevos orgánicos Happy Egg®, ligeros y esponjosos, con los rellenos que elijas: vegetales, quesos y más. Hasta 3 rellenos; más por un costo adicional." },
        "scrambled-eggs": { name: "Huevos revueltos", description: "Tres huevos orgánicos Happy Egg® revueltos, con los rellenos que elijas: vegetales, quesos y más. Hasta 3 rellenos; más por un costo adicional." },
        "tapioca-crepe": { name: "Crepe de tapioca", description: "Crepe de tapioca sin gluten hecho con harina de yuca, relleno a tu gusto. Hasta 3 rellenos; más por un costo adicional." },
        "shakshuka": { name: "Shakshuka", description: "Dos huevos orgánicos en una salsa de tomate especiada con pimientos y cebolla, con hierbas frescas. Se sirve con pan bagel de Jerusalén." },
        "halloumi-sandwich": { name: "Sándwich de halloumi a la plancha, rúcula y tomate", description: "Queso halloumi auténtico de Chipre, rúcula fresca y tomate en el pan que elijas, a la plancha." },
        "egg-parmesan-sandwich": { name: "Sándwich de huevos revueltos, parmesano y tomate", description: "Huevos orgánicos de campo revueltos, queso y tomates uva en el pan que prefieras." },
        "sabich": { name: "Sándwich de berenjena (Sabich)", description: "Berenjena asada, huevo duro, lechuga, tomate, limón encurtido y tahini cremoso." },
        "chicken-shawarma": { name: "Shawarma de pollo", description: "Pollo orgánico mediterráneo con lechuga, tomate, pepino y tahini cremoso, en pan pita." },
        "beef-shawarma": { name: "Shawarma de res", description: "Pita caliente con entraña de res de pastoreo picante, lechuga, tomate, pepino y tahini cremoso." },
        "pita-burger": { name: "Hamburguesa en pita", description: "Mezcla de res y cordero en pita caliente con lechuga, tomate, pepino, tahini y una pasta picante casera." },
        "tunisian-sandwich": { name: "Sándwich tunecino", description: "Atún aleta amarilla en aceite de oliva con huevos orgánicos, aceitunas Kalamata, papas, limón encurtido y pasta picante casera, en baguette." },
        "chicken-schnitzel": { name: "Schnitzel de pollo", description: "Schnitzel de pollo orgánico al horno con tomate, pepino y pepinillos en pita con tahini, y papas al horno." },
        "greek-salad": { name: "Ensalada griega", description: "Tomates orgánicos, cebolla, pepino, aceitunas Kalamata y queso feta, con aceite de oliva y limón." },
        "nicoise-salad": { name: "Ensalada Nicoise", description: "Atún aleta amarilla en aceite de oliva, lechuga romana, rábano, papas, ejotes, cebolla morada, huevo duro, aceitunas Kalamata y tomate, con aderezo de mostaza." },
        "fit-protein-bowl": { name: "Bowl de proteína Fit", description: "Pollo a la parrilla con especias mediterráneas, huevo tibio, rúcula y quinoa, tomates cherry, aguacate y germinados, con aderezo ligero de yogur." },
        "rice-bowl": { name: "Bowl de arroz", description: "Arroz orgánico con garbanzos, aguacate machacado y ensalada de pepino, cebolla y tomate. Elige pollo, atún o entraña." },
        "kebab-plate": { name: "Plato de kebab de res y cordero", description: "Kebab de res y cordero al horno con especias mediterráneas, ensalada picada, tzatziki casero y pita caliente." },
        "classic-acai-bowl": { name: "Bowl de açaí clásico", description: "Açaí auténtico licuado con plátano y cubierto de frutas frescas. Con granola crujiente o nueces." },
        "mango-passion-bowl": { name: "Bowl de mango y maracuyá", description: "Mango y maracuyá licuados, cubiertos de frutas frescas, con granola crujiente o nueces." },
        "lemonade": { name: "Limonada", description: "Limón y miel." },
        "super-greens": { name: "Super Greens", description: "Espinaca, lima, manzana verde, jengibre y agua de coco." },
        "detox": { name: "Detox", description: "Piña, menta, jengibre y agua de coco." },
        "ironside-sunset": { name: "Ironside Sunset", description: "Zanahoria, mango, jengibre y jugo de naranja." },
        "tropicooler": { name: "Tropicooler", description: "Mango, piña, pepino, lima y miel." },
        "orange-juice": { name: "Jugo de naranja natural", description: "Jugo de naranja recién exprimido." },
        "antioxidant-acai": { name: "Açaí antioxidante", description: "Açaí, plátano, miel y agua de coco." },
        "banana-cacao": { name: "Plátano y cacao", description: "Plátano, cacao tostado premium, dátiles, marañón y la leche de tu elección." },
        "banana-strawberry": { name: "Plátano y fresa", description: "Plátano, fresa y la leche de tu elección." },
        "green-tropical-detox": { name: "Green Tropical Detox", description: "Espinaca, piña, mango, plátano y agua de coco." },
        "energy-booster": { name: "Energy Booster", description: "Plátano, mango, jugo de naranja y agua de coco. Naturalmente dulce y lleno de potasio." },
        "longevity-breeze": { name: "Longevity Breeze", description: "Mango, arándano azul, frambuesa, fresa, mora y agua de coco." },
        "espresso": { name: "Espresso", description: "Un shot de espresso de nuestra mezcla de tueste medio." },
        "macchiato": { name: "Macchiato", description: "Un shot de espresso con un toque de leche espumada." },
        "overturned-coffee": { name: "Café invertido", description: "Espresso vertido sobre leche vaporizada." },
        "cortado": { name: "Cortado", description: "Un shot de espresso con la misma cantidad de leche vaporizada." },
        "americano": { name: "Americano", description: "Espresso intenso diluido con agua caliente." },
        "cappuccino": { name: "Cappuccino", description: "Un shot de espresso con partes iguales de leche vaporizada y espuma." },
        "hot-chocolate": { name: "Chocolate caliente", description: "Cacao premium con leche cremosa." },
        "latte": { name: "Latte", description: "Espresso y leche vaporizada, con una capa ligera de espuma." },
        "mochaccino": { name: "Mochaccino", description: "Espresso, leche vaporizada y cacao premium." },
        "chai-latte": { name: "Chai latte", description: "Té negro especiado con leche vaporizada, canela, cardamomo y jengibre." },
        "matcha-latte": { name: "Matcha latte", description: "Té verde matcha con leche vaporizada, suave y terroso." },
        "hot-tea": { name: "Té caliente", description: "Té de hojas de alta calidad: negro, verde o de hierbas. Elige tu sabor." },
        "iced-cortado": { name: "Cortado helado", description: "Un shot de espresso con la misma cantidad de leche fría." },
        "iced-americano": { name: "Americano helado", description: "Espresso intenso diluido con agua, servido frío." },
        "iced-cappuccino": { name: "Cappuccino helado", description: "Espresso con leche fría y espuma." },
        "iced-latte": { name: "Latte helado", description: "Espresso y leche, servido frío." },
        "iced-mochaccino": { name: "Mochaccino helado", description: "Espresso, leche y cacao premium, servido frío." },
        "iced-chai": { name: "Chai helado", description: "Té negro especiado con leche, canela, cardamomo y jengibre." },
        "iced-matcha": { name: "Matcha helado", description: "Té verde matcha con leche fría." },
        "vanilla-affogato": { name: "Affogato de vainilla", description: "Una bola de helado de vainilla bañada con un shot de espresso caliente." },
        "shakerato": { name: "Shakerato", description: "Espresso y leche agitados con hielo, servido sin el hielo." },
        "iced-tea": { name: "Té helado", description: "Té de hojas de alta calidad: negro, verde o de hierbas, servido frío." },
      },
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
        "Chef's pick": "Recomendación del chef",
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
