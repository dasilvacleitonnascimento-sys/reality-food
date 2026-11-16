// Content for a restaurant's own website (home page with the 3D menu built in).
// The menu itself (dishes, prices, 3D models) still comes from lib/menu.ts, so
// the website and the QR menu always show the same dishes.

import type { Locale } from "./i18n/config";

type SiteText = {
  heroTitle: [string, string];
  pickDish: string;
  onTheMenu: string;
  heroBody: string;
  menuCta: string;
  callCta: string;
  dragHint: string;
  trueSize: (size: string) => string;
  featuredTitle: string;
  featuredBody: string;
  view3d: string;
  arTitle: string;
  arSteps: [string, string][];
  storyTitle: string;
  story: string[];
  visitTitle: string;
  hoursTitle: string;
  hours: [string, string][];
  addressTitle: string;
  phoneTitle: string;
  nav: { menu: string; story: string; visit: string };
  demoNotice: string;
};

export type RestaurantSite = {
  /** Dish shown spinning in 3D at the top of the page. */
  heroDishId: string;
  featuredDishIds: string[];
  storyPhotoDishId: string;
  address: string;
  /** Display format and tel: format. */
  phone: { display: string; tel: string };
  text: Record<Locale, SiteText>;
};

const demoBistro: RestaurantSite = {
  heroDishId: "burrata",
  featuredDishIds: ["schnitzel-plate", "shrimp-risotto", "chocolate-cake"],
  storyPhotoDishId: "pudim",
  // Fictional restaurant: example street and a 555-01xx number reserved for fiction.
  address: "1200 Example Ave, Miami, FL",
  phone: { display: "(305) 555-0142", tel: "+13055550142" },
  text: {
    en: {
      heroTitle: ["Seasonal plates,", "made from scratch."],
      pickDish: "Pick a dish",
      onTheMenu: "On the menu today",
      heroBody:
        "A neighborhood bistro with a menu you can see before you order: every dish in 3D, at its real size, right on your table.",
      menuCta: "See the menu in 3D",
      callCta: "Call to book",
      dragHint: "Drag to turn the dish",
      trueSize: (size) => `Real size · ${size} plate`,
      featuredTitle: "From our kitchen",
      featuredBody:
        "Tap any dish to turn it around, or put it on your table with your phone's camera.",
      view3d: "View in 3D",
      arTitle: "See it on your table before you order",
      arSteps: [
        [
          "Open the menu",
          "Scan the QR code on your table or tap “See the menu in 3D”.",
        ],
        [
          "Pick a dish",
          "Tap “View on your table” and point your phone at the table.",
        ],
        [
          "Compare",
          "The dish appears at its real size. Put your hand next to it.",
        ],
      ],
      storyTitle: "Our story",
      story: [
        "Demo Bistro started with a simple idea: cook what's in season and serve it the way we'd serve our family.",
        "We make our breads, sauces and desserts in house every morning, and our pudim is a recipe from home.",
      ],
      visitTitle: "Visit us",
      hoursTitle: "Hours",
      hours: [
        ["Mon – Thu", "11:30 am – 10 pm"],
        ["Fri – Sat", "11:30 am – 11 pm"],
        ["Sun", "10 am – 9 pm"],
      ],
      addressTitle: "Address",
      phoneTitle: "Phone",
      nav: { menu: "Menu", story: "Our story", visit: "Visit" },
      demoNotice:
        "Demo restaurant made by Reality Food. Address and phone are examples.",
    },
    es: {
      heroTitle: ["Platos de temporada,", "hechos en casa."],
      pickDish: "Elige un plato",
      onTheMenu: "Hoy en el menú",
      heroBody:
        "Un bistró de barrio con un menú que puedes ver antes de pedir: cada plato en 3D, en tamaño real, sobre tu mesa.",
      menuCta: "Ver el menú en 3D",
      callCta: "Llamar para reservar",
      dragHint: "Arrastra para girar el plato",
      trueSize: (size) => `Tamaño real · plato de ${size}`,
      featuredTitle: "De nuestra cocina",
      featuredBody:
        "Toca un plato para girarlo o ponlo sobre tu mesa con la cámara del teléfono.",
      view3d: "Ver en 3D",
      arTitle: "Míralo en tu mesa antes de pedir",
      arSteps: [
        [
          "Abre el menú",
          "Escanea el código QR de tu mesa o toca “Ver el menú en 3D”.",
        ],
        [
          "Elige un plato",
          "Toca “Ver en tu mesa” y apunta el teléfono a la mesa.",
        ],
        ["Compara", "El plato aparece en tamaño real. Pon tu mano al lado."],
      ],
      storyTitle: "Nuestra historia",
      story: [
        "Demo Bistro nació de una idea simple: cocinar lo que está de temporada y servirlo como lo serviríamos a nuestra familia.",
        "Hacemos nuestros panes, salsas y postres en casa cada mañana, y nuestro pudim es una receta de familia.",
      ],
      visitTitle: "Visítanos",
      hoursTitle: "Horario",
      hours: [
        ["Lun – Jue", "11:30 am – 10 pm"],
        ["Vie – Sáb", "11:30 am – 11 pm"],
        ["Dom", "10 am – 9 pm"],
      ],
      addressTitle: "Dirección",
      phoneTitle: "Teléfono",
      nav: { menu: "Menú", story: "Historia", visit: "Visítanos" },
      demoNotice:
        "Restaurante de demostración hecho por Reality Food. La dirección y el teléfono son ejemplos.",
    },
  },
};

const SITES: Record<string, RestaurantSite> = {
  "demo-bistro": demoBistro,
};

/** The restaurant's website content, or undefined if it only has a menu. */
export function getRestaurantSite(slug: string): RestaurantSite | undefined {
  return SITES[slug];
}
