// UI text for every supported language. Restaurant content (dish names,
// descriptions) is translated in the restaurant's own data instead.

import type { Locale } from "./config";

type Vessel = "cup" | "glass" | "bowl" | "pan";

const en = {
  site: {
    description: "See every dish on your table in 3D before you order.",
  },
  home: {
    tagline: "Let your guests see every dish on their table in 3D before they order.",
    cta: "Try the live demo",
  },
  notFound: {
    title: "Menu not found",
    body: "This menu doesn't exist or is no longer available. Please ask your server for help.",
    home: "Go to homepage",
  },
  menu: {
    title: (restaurant: string) => `${restaurant} menu`,
    categories: "Menu categories",
    table: "Table",
    soldOut: "Sold out",
    language: "Language",
    poweredBy: "Menu by Reality Food",
  },
  dish: {
    back: "Menu",
    sizeHeading: "True size",
    model3d: (dish: string) => `3D model of ${dish}`,
    servedOn: (size: string) => `Plate size: ${size}`,
    servedIn: (kind: Vessel, size: string, oz?: number) =>
      kind === "cup"
        ? `Cup: ${oz} oz, on a ${size} saucer`
        : kind === "glass"
          ? `Glass: ${oz} oz, ${size} wide`
          : kind === "bowl"
            ? `Bowl size: ${size}`
            : `Pan size: ${size}`,
    sizeShort: (kind: Vessel | "plate", size: string, oz?: number) =>
      kind === "cup" || kind === "glass" ? `${oz} oz ${kind}` : `${size} ${kind}`,
    portion: (w: string, d: string, h: string) => `Portion: ${w} wide · ${d} deep · ${h} tall`,
  },
  viewer: {
    viewOnTable: "View on your table",
    loading3d: "Loading 3D model",
    loadFailed: "The 3D model could not be loaded. Please check your connection.",
    arFailed: "AR could not start on this device. You can still rotate the dish above with your finger.",
    notSupported: "Open this page on your phone to see the dish on your table. Here you can drag to rotate it.",
    tapHint: "Tap the button, then point your camera at the table.",
  },
  ar: {
    trueSize: (label: string) => `True size · ${label}`,
    close: "Close AR",
    placeHere: "Place here",
    moveDish: "Move dish",
    ruler: "Ruler",
    hints: {
      loading: "Loading the dish…",
      searching: "Point your camera at the table and move your phone slowly.",
      estimating: "Still looking for the table. Move your phone slowly over it.",
      following: "The dish follows your camera. Tap Place here to set it down.",
      placed: "Set down at true size. Walk around it or hold your hand next to it.",
    },
  },
  guide: {
    title: "See it at true size",
    body: "Your phone needs a second to find the table.",
    tips: [
      "Good light and a table with some texture help",
      "Move your phone slowly from side to side",
      "Hold it about 16 in (40 cm) from the table",
      "Put your hand next to the plate, not over it",
    ],
    open: "Open camera",
    cancel: "Not now",
  },
};

export type Dictionary = typeof en;

const es: Dictionary = {
  site: {
    description: "Mira cada plato en tu mesa en 3D antes de pedir.",
  },
  home: {
    tagline: "Deja que tus clientes vean cada plato en su mesa en 3D antes de pedir.",
    cta: "Prueba la demo en vivo",
  },
  notFound: {
    title: "Menú no encontrado",
    body: "Este menú no existe o ya no está disponible. Pide ayuda a tu mesero.",
    home: "Ir al inicio",
  },
  menu: {
    title: (restaurant) => `Menú de ${restaurant}`,
    categories: "Categorías del menú",
    table: "Mesa",
    soldOut: "Agotado",
    language: "Idioma",
    poweredBy: "Menú por Reality Food",
  },
  dish: {
    back: "Menú",
    sizeHeading: "Tamaño real",
    model3d: (dish) => `Modelo 3D de ${dish}`,
    servedOn: (size) => `Tamaño del plato: ${size}`,
    servedIn: (kind, size, oz) =>
      kind === "cup"
        ? `Taza: ${oz} oz, sobre platillo de ${size}`
        : kind === "glass"
          ? `Vaso: ${oz} oz, ${size} de ancho`
          : kind === "bowl"
            ? `Tamaño del bowl: ${size}`
            : `Tamaño de la sartén: ${size}`,
    sizeShort: (kind, size, oz) =>
      kind === "cup"
        ? `taza de ${oz} oz`
        : kind === "glass"
          ? `vaso de ${oz} oz`
          : kind === "bowl"
            ? `bowl de ${size}`
            : kind === "pan"
              ? `sartén de ${size}`
              : `plato de ${size}`,
    portion: (w, d, h) => `Porción: ${w} de ancho · ${d} de fondo · ${h} de alto`,
  },
  viewer: {
    viewOnTable: "Ver en tu mesa",
    loading3d: "Cargando modelo 3D",
    loadFailed: "No se pudo cargar el modelo 3D. Revisa tu conexión.",
    arFailed: "La realidad aumentada no pudo iniciar en este dispositivo. Aún puedes girar el plato con el dedo.",
    notSupported: "Abre esta página en tu teléfono para ver el plato en tu mesa. Aquí puedes arrastrar para girarlo.",
    tapHint: "Toca el botón y apunta la cámara a la mesa.",
  },
  ar: {
    trueSize: (label) => `Tamaño real · ${label}`,
    close: "Cerrar",
    placeHere: "Colocar aquí",
    moveDish: "Mover plato",
    ruler: "Regla",
    hints: {
      loading: "Cargando el plato…",
      searching: "Apunta la cámara a la mesa y mueve el teléfono despacio.",
      estimating: "Seguimos buscando la mesa. Mueve el teléfono despacio sobre ella.",
      following: "El plato sigue tu cámara. Toca Colocar aquí para dejarlo.",
      placed: "Colocado en tamaño real. Rodéalo o pon tu mano al lado.",
    },
  },
  guide: {
    title: "Míralo en tamaño real",
    body: "Tu teléfono necesita un segundo para encontrar la mesa.",
    tips: [
      "Con buena luz y una mesa con algo de textura funciona mejor",
      "Mueve el teléfono despacio de lado a lado",
      "Sostenlo a unos 40 cm (16 in) de la mesa",
      "Pon la mano al lado del plato, no encima",
    ],
    open: "Abrir cámara",
    cancel: "Ahora no",
  },
};

const dictionaries: Record<Locale, Dictionary> = { en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Plain-string parts of the dictionary that client components need (functions can't cross to the client). */
export function getViewerText(locale: Locale, sizeLabel: string) {
  const d = dictionaries[locale];
  return {
    ...d.viewer,
    trueSize: d.ar.trueSize(sizeLabel),
    close: d.ar.close,
    placeHere: d.ar.placeHere,
    moveDish: d.ar.moveDish,
    ruler: d.ar.ruler,
    hints: d.ar.hints,
    guide: d.guide,
  };
}

export type ViewerText = ReturnType<typeof getViewerText>;
