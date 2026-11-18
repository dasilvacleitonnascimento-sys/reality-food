import Image from "next/image";
import Link from "next/link";
import { Camera, Check } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/format";
import { qrSvg } from "@/lib/qr";
import { SITE } from "@/lib/site";
import { getRestaurant } from "@/lib/demo-data";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { ArHero, type StageDish } from "./ar-hero";
import { LiveBento } from "./live-bento";
import { ScrollStory, type StoryDish } from "./scroll-story";
import { SizeCompare } from "./size-compare";

const COPY = {
  en: {
    nav: { how: "How it works", size: "Size check", pricing: "Pricing", try: "Try it" },
    hero: {
      title: ["See it on your table", "before you order."],
      body: "Reality Food menus put every dish on the guest’s table at its real size. They scan the QR code, tap a dish and see it in 3D right where it will be served. No app. No guessing.",
      primary: "See it on your table",
      secondary: "Book a demo",
      qrTitle: "Try it on your table now",
      qrBody: "Point your phone’s camera here. A real dessert lands on your table, at its real size.",
      note: "Works on iPhone and Android, in English and Spanish.",
      stage: {
        scanning: "Looking for the table…",
        found: "Table found",
        placed: "True size on the table",
        loading: "Loading 3D dish",
        dragHint: "Drag to turn the dish",
      },
    },
    story: {
      title: "From the QR code to the table in three taps",
      steps: [
        { title: "Scan the table", body: "Guests point their phone at the QR code on the table. No app, no sign-up." },
        { title: "Open the menu", body: "It opens in the browser, in English or Spanish. Dishes marked 3D can be seen on the table." },
        { title: "See it on the table", body: "One tap and the dish lands next to their hand, at its real size, measured to the centimeter." },
      ],
      text: { scanHint: "Point at the QR code", tableCard: "Scan for the 3D menu", trueSize: "True size on your table", tabs: ["Desserts", "Mains"] },
    },
    bento: {
      title: "Everything a guest needs to say yes",
      bilingual: { title: "English and Spanish, one QR code", body: "The menu follows each guest’s phone. Tap to switch." },
      trueSize: { title: "Measured, not guessed", body: "Every model is checked against its plate, to within 0.5%." },
      fast: { title: "Opens in seconds", body: "In the phone’s browser. Nothing to download.", loading: "Opening the menu…", ready: "Menu ready" },
    },
    size: {
      title: "“Is it big enough to share?”",
      body: "Pick a dish. Its plate and a phone are drawn at the same scale, just like in AR on the table.",
      pick: "Pick a dish",
      phone: "Phone, 14.7 cm",
      plate: "plate",
    },
    demos: { title: "Open a live menu", body: "On your phone, tap a dish and then “View on your table”.", open: "Open menu" },
    pricing: {
      title: "Simple pricing",
      setup: "Setup, once",
      monthlyLabel: "Monthly",
      setupBody: (n: number) => `We scan up to ${n} dishes in 3D, design your menu and print QR cards for your tables.`,
      monthly: "per month",
      monthlyBody: "Hosting for your 3D menu and support.",
      includesTitle: "Included",
      includes: ["English and Spanish menu", "True-size check on every dish", "Works on iPhone and Android"],
      cta: "Get started",
    },
    faq: {
      title: "Questions",
      items: [
        ["Do guests need an app?", "No. They scan the QR code and the menu opens in the browser. On iPhone the 3D view uses Apple’s built-in AR; on Android it runs right in Chrome."],
        ["How accurate is the size?", "Each model is calibrated to the plate you serve it on and rejected if it’s off by more than 0.5%. On the table, accuracy depends on the phone’s camera; recent phones are within a few percent."],
        ["Do I need special equipment?", "No. We scan with a phone, and your guests use their own."],
      ],
    },
    final: { title: "Real food. Real size.", body: "Give every guest a look at the plate before it reaches the table.", cta: "See a live menu", qr: "Or scan to try it on your table" },
    footer: "Real food. Real size.",
  },
  es: {
    nav: { how: "Cómo funciona", size: "Tamaño", pricing: "Precios", try: "Pruébalo" },
    hero: {
      title: ["Míralo en tu mesa", "antes de pedir."],
      body: "Los menús de Reality Food ponen cada plato sobre la mesa del cliente, en su tamaño real. Escanean el QR, tocan un plato y lo ven en 3D justo donde lo van a servir. Sin app. Sin adivinar.",
      primary: "Míralo en tu mesa",
      secondary: "Agenda una demo",
      qrTitle: "Pruébalo ahora en tu mesa",
      qrBody: "Apunta la cámara de tu teléfono aquí. Un postre real aparece en tu mesa, en su tamaño real.",
      note: "Funciona en iPhone y Android, en inglés y español.",
      stage: {
        scanning: "Buscando la mesa…",
        found: "Mesa encontrada",
        placed: "Tamaño real en la mesa",
        loading: "Cargando plato en 3D",
        dragHint: "Arrastra para girar el plato",
      },
    },
    story: {
      title: "Del QR a la mesa en tres toques",
      steps: [
        { title: "Escanean la mesa", body: "Tus clientes apuntan el teléfono al QR de la mesa. Sin app, sin registro." },
        { title: "Abren el menú", body: "Se abre en el navegador, en inglés o español. Los platos con 3D se pueden ver en la mesa." },
        { title: "Lo ven en la mesa", body: "Un toque y el plato aparece junto a su mano, en tamaño real, medido al centímetro." },
      ],
      text: { scanHint: "Apunta al código QR", tableCard: "Escanea para ver el menú 3D", trueSize: "Tamaño real en tu mesa", tabs: ["Postres", "Platos fuertes"] },
    },
    bento: {
      title: "Todo lo que un cliente necesita para decir que sí",
      bilingual: { title: "Inglés y español, un solo QR", body: "El menú sigue el teléfono de cada cliente. Toca para cambiar." },
      trueSize: { title: "Medido, no adivinado", body: "Cada modelo se verifica con su plato, con un margen de 0,5%." },
      fast: { title: "Abre en segundos", body: "En el navegador del teléfono. Nada que descargar.", loading: "Abriendo el menú…", ready: "Menú listo" },
    },
    size: {
      title: "“¿Alcanza para compartir?”",
      body: "Elige un plato. El plato y un teléfono están dibujados a la misma escala, igual que en la mesa con realidad aumentada.",
      pick: "Elige un plato",
      phone: "Teléfono, 14,7 cm",
      plate: "de plato",
    },
    demos: { title: "Abre un menú en vivo", body: "En tu teléfono, toca un plato y luego “Ver en tu mesa”.", open: "Abrir menú" },
    pricing: {
      title: "Precios simples",
      setup: "Instalación, una vez",
      monthlyLabel: "Mensual",
      setupBody: (n: number) => `Escaneamos hasta ${n} platos en 3D, diseñamos tu menú e imprimimos tarjetas QR para tus mesas.`,
      monthly: "al mes",
      monthlyBody: "Hosting de tu menú 3D y soporte.",
      includesTitle: "Incluye",
      includes: ["Menú en inglés y español", "Verificación de tamaño real en cada plato", "Funciona en iPhone y Android"],
      cta: "Empezar",
    },
    faq: {
      title: "Preguntas",
      items: [
        ["¿Mis clientes necesitan una app?", "No. Escanean el QR y el menú abre en el navegador. En iPhone el 3D usa la realidad aumentada de Apple; en Android funciona directo en Chrome."],
        ["¿Qué tan exacto es el tamaño?", "Cada modelo se calibra con el plato en que lo sirves y se rechaza si se desvía más de 0,5%. En la mesa, la precisión depende de la cámara del teléfono; los teléfonos recientes están dentro de unos pocos por ciento."],
        ["¿Necesito equipo especial?", "No. Escaneamos con un teléfono, y tus clientes usan el suyo."],
      ],
    },
    final: { title: "Comida real. Tamaño real.", body: "Deja que cada cliente vea el plato antes de que llegue a la mesa.", cta: "Ver un menú en vivo", qr: "O escanea para probarlo en tu mesa" },
    footer: "Comida real. Tamaño real.",
  },
} as const;

const sectionTitle = "rf-serif text-3xl leading-[1.08] sm:text-5xl";
const btn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold outline-none transition-[color,border-color,filter] focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50";
const btnPrimary = `${btn} bg-(--rf-accent) text-(--rf-ink) hover:brightness-105 active:brightness-95`;

/** RF monogram on a gold plate. */
function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="29" fill="var(--rf-accent)" />
      <circle cx="32" cy="32" r="23.6" fill="none" stroke="var(--rf-ink)" strokeWidth="1.5" opacity="0.35" />
      <g fill="none" stroke="var(--rf-ink)" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.6 0)">
        <path d="M17.6 44.5V19.5h8.9a6.45 6.45 0 0 1 0 12.9h-8.9M25.9 32.4l5.4 12.1" />
        <path d="M37.4 44.5V19.5h10.2M37.4 31.6h8.4" />
      </g>
    </svg>
  );
}

function Wordmark() {
  return (
    <span className="flex items-center gap-2.5" translate="no">
      <Mark className="size-9" />
      <span className="rf-serif text-xl text-(--rf-paper)">
        Reality <span className="text-(--rf-accent)">Food</span>
      </span>
    </span>
  );
}

/** Scan-to-try card: shown on larger screens, where the visitor isn't holding the phone yet. */
function TryQr({ svg, title, body }: { svg: string; title: string; body?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-(--rf-dark-line) bg-(--rf-panel) p-3 pr-5">
      <div className="size-24 shrink-0 rounded-xl bg-(--rf-card) p-2 text-(--rf-ink) [&_svg]:h-full [&_svg]:w-full" role="img" aria-label={title} dangerouslySetInnerHTML={{ __html: svg }} />
      <div>
        <p className="font-bold text-(--rf-paper)">{title}</p>
        {body && <p className="mt-1 max-w-xs text-sm leading-relaxed text-(--rf-dark-muted)">{body}</p>}
      </div>
    </div>
  );
}

export async function Landing({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const dict = getDictionary(locale);
  const demoHref = `/${SITE.demos[0].slug}`;
  const tryHref = `/${SITE.tryDish.slug}/dish/${SITE.tryDish.id}`;
  const contactHref = SITE.salesEmail ? `mailto:${SITE.salesEmail}?subject=Reality%20Food%20demo` : demoHref;

  // Real dishes from the demo menus (same 3D files the menus use).
  const bistro = getRestaurant("demo-bistro", locale)!;
  const bistroEn = getRestaurant("demo-bistro", "en")!;
  const bistroEs = getRestaurant("demo-bistro", "es")!;
  const ironside = getRestaurant("ironside-cafe", locale)!;
  const plated = bistro.dishes.filter((d) => d.glbUrl);
  const byId = (id: string) => bistro.dishes.find((d) => d.id === id);
  const stageDishes: StageDish[] = ["chocolate-cake", "double-burger", "schnitzel-plate", "pudim-slice"]
    .map(byId)
    .filter((d) => d !== undefined && Boolean(d.glbUrl))
    .map((d) => ({ name: d!.name, glbUrl: d!.glbUrl!, plateCm: d!.plateDiameterCm }));
  const compareDishes = [...plated].sort((a, b) => a.plateDiameterCm - b.plateDiameterCm).map((d) => ({ id: d.id, name: d.name, plateCm: d.plateDiameterCm }));
  const cake = byId(SITE.tryDish.id)!;
  const storyDishes: StoryDish[] = ["schnitzel-plate", "double-burger", "chocolate-cake"]
    .map(byId)
    .filter((d) => d !== undefined)
    .map((d) => ({
      name: d!.name,
      price: formatPrice(d!.price),
      photo: d!.photo,
      size: dict.dish.sizeShort("plate", `${d!.plateDiameterCm} cm`),
      has3d: Boolean(d!.glbUrl),
    }));
  const pickBoth = (id: string) => ({
    en: { name: bistroEn.dishes.find((d) => d.id === id)!.name, description: bistroEn.dishes.find((d) => d.id === id)!.description },
    es: { name: bistroEs.dishes.find((d) => d.id === id)!.name, description: bistroEs.dishes.find((d) => d.id === id)!.description },
  });
  const demoPhotos: Record<string, string[]> = {
    "ironside-cafe": ironside.dishes.filter((d) => d.glbUrl).slice(0, 3).map((d) => d.photo),
    "demo-bistro": ["/images/schnitzel-plate.jpg", "/images/burger.jpg", "/images/chocolate-cake.jpg"],
  };

  // QR codes: "try it on your table" opens the cake; the table card opens the menu.
  const [tryQr, menuQr] = await Promise.all([qrSvg(`${SITE.url}${tryHref}`), qrSvg(`${SITE.url}/${SITE.tryDish.slug}`)]);

  return (
    <div className="overflow-x-clip bg-(--rf-paper) text-(--rf-ink)">
      {/* --- Nav ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-(--rf-dark-line) bg-(--rf-ink)/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              ["#how", t.nav.how],
              ["#size", t.nav.size],
              ["#pricing", t.nav.pricing],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium text-(--rf-dark-muted) transition-colors outline-none hover:text-(--rf-paper) focus-visible:ring-3 focus-visible:ring-(--rf-accent)/50 md:block"
              >
                {label}
              </a>
            ))}
            <LanguageSwitch current={locale} label={dict.menu.language} />
            <Link href={tryHref} className="ml-1 hidden h-10 items-center rounded-lg bg-(--rf-accent) px-4 text-sm font-bold text-(--rf-ink) outline-none transition-[filter] hover:brightness-105 focus-visible:ring-3 focus-visible:ring-(--rf-accent)/50 sm:inline-flex">
              {t.nav.try}
            </Link>
          </div>
        </nav>
      </header>

      <main id="main">
        {/* --- Hero: the camera's view of a table, a real dish landing on it --------- */}
        <section className="bg-(--rf-ink) text-(--rf-paper)">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-10 pb-20 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-20 md:pb-28">
            <div>
              <h1 className="rf-serif text-[2.7rem] leading-[1.03] sm:text-6xl">
                {/* Two lines on wide screens; one flowing sentence on phones. */}
                {t.hero.title.map((line) => (
                  <span key={line} className="sm:block">
                    {line}{" "}
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-(--rf-dark-muted)">{t.hero.body}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={tryHref} className={btnPrimary}>
                  {t.hero.primary}
                </Link>
                <a href={contactHref} className={`${btn} border border-(--rf-dark-line) hover:border-(--rf-accent)`}>
                  {t.hero.secondary}
                </a>
              </div>
              <div className="mt-8 hidden md:block">
                <TryQr svg={tryQr} title={t.hero.qrTitle} body={t.hero.qrBody} />
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-(--rf-dark-muted)">
                <Camera className="size-4 shrink-0 text-(--rf-accent)" aria-hidden />
                {t.hero.note}
              </p>
            </div>
            <ArHero dishes={stageDishes} text={t.hero.stage} />
          </div>
        </section>

        {/* --- How it works: one pinned scene, driven by scroll --------------------- */}
        <ScrollStory
          title={t.story.title}
          steps={t.story.steps}
          restaurant={bistro.name}
          dishes={storyDishes}
          qrSvg={menuQr}
          ar={{ photo: cake.photo, plateCm: cake.plateDiameterCm, label: `Ø ${cake.plateDiameterCm} cm` }}
          text={t.story.text}
        />

        {/* --- Live demos of what the menu does ------------------------------------ */}
        <LiveBento
          text={t.bento}
          bilingual={pickBoth(SITE.tryDish.id)}
          dish={{ photo: cake.photo, name: cake.name, price: cake.price, plateCm: cake.plateDiameterCm }}
        />



        {/* --- Size check (interactive) ------------------------------------------ */}
        <section id="size" aria-labelledby="size-heading" className="scroll-mt-20 bg-(--rf-ink) text-(--rf-paper)">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="size-heading" className={sectionTitle}>
                {t.size.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-(--rf-dark-muted)">{t.size.body}</p>
            </div>
            <SizeCompare dishes={compareDishes} text={{ pick: t.size.pick, phone: t.size.phone, plate: t.size.plate }} />
          </div>
        </section>

        {/* --- Live demos -------------------------------------------------------- */}
        <section id="demo" aria-labelledby="demo-heading" className="scroll-mt-20 border-b border-(--rf-line) bg-(--rf-card)">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <h2 id="demo-heading" className={sectionTitle}>
              {t.demos.title}
            </h2>
            <p className="mt-3 text-lg text-(--rf-muted)">{t.demos.body}</p>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2">
              {SITE.demos.map((demo) => (
                <li key={demo.slug}>
                  <Link
                    href={`/${demo.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-(--rf-line) bg-(--rf-paper) outline-none transition-colors hover:border-(--rf-accent-text) focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50"
                  >
                    <div className="relative h-44 overflow-hidden bg-(--rf-ink)">
                      {demoPhotos[demo.slug]?.map((src, p) => (
                        <div
                          key={src}
                          className="absolute top-1/2 left-1/2 h-32 w-40 overflow-hidden rounded-2xl border-4 border-(--rf-ink) transition-transform duration-500 motion-reduce:transition-none"
                          style={{ transform: `translate(-50%, -50%) translateX(${(p - 1) * 70}px) rotate(${(p - 1) * 8}deg)`, zIndex: p === 1 ? 2 : 1 }}
                        >
                          <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-4 p-6">
                      <div className="min-w-0">
                        <h3 className="rf-serif text-2xl" translate="no">
                          {demo.name}
                        </h3>
                        <p className="mt-1 text-sm text-(--rf-muted)">{demo.note}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center rounded-xl bg-(--rf-ink) px-4 py-2.5 text-sm font-bold text-(--rf-accent)">{t.demos.open}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --- Pricing --------------------------------------------------------- */}
        <section id="pricing" aria-labelledby="pricing-heading" className="scroll-mt-20 bg-(--rf-ink) text-(--rf-paper)">
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <h2 id="pricing-heading" className={sectionTitle}>
              {t.pricing.title}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-[1fr_1fr_1.1fr]">
              <div className="rounded-2xl border border-(--rf-dark-line) bg-(--rf-panel) p-7">
                <h3 className="text-sm font-bold text-(--rf-accent)">{t.pricing.setup}</h3>
                <p className="rf-serif mt-3 text-6xl tabular-nums">{formatPrice(SITE.pricing.setupUsd)}</p>
                <p className="mt-4 leading-relaxed text-(--rf-dark-muted)">{t.pricing.setupBody(SITE.pricing.dishesIncluded)}</p>
              </div>
              <div className="rounded-2xl border border-(--rf-dark-line) bg-(--rf-panel) p-7">
                <h3 className="text-sm font-bold text-(--rf-accent)">{t.pricing.monthlyLabel}</h3>
                <p className="mt-3">
                  <span className="rf-serif text-6xl tabular-nums">{formatPrice(SITE.pricing.monthlyUsd)}</span>
                  <span className="ml-1.5 text-base font-medium text-(--rf-dark-muted)">{t.pricing.monthly}</span>
                </p>
                <p className="mt-4 leading-relaxed text-(--rf-dark-muted)">{t.pricing.monthlyBody}</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl bg-(--rf-paper) p-7 text-(--rf-ink)">
                <div>
                  <h3 className="text-sm font-bold text-(--rf-accent-text)">{t.pricing.includesTitle}</h3>
                  <ul className="mt-4 space-y-3.5">
                    {t.pricing.includes.map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--rf-accent)">
                          <Check className="size-4" aria-hidden />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href={contactHref} className={`${btnPrimary} mt-7 w-full`}>
                  {t.pricing.cta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* --- FAQ ---------------------------------------------------------------- */}
        <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <h2 id="faq-heading" className={sectionTitle}>
            {t.faq.title}
          </h2>
          <div className="mt-10 space-y-3">
            {t.faq.items.map(([q, a]) => (
              <details
                key={q}
                className="group rounded-2xl border border-(--rf-line) bg-(--rf-card) p-5 transition-colors open:border-(--rf-accent-text) [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-bold outline-none focus-visible:ring-3 focus-visible:ring-(--rf-accent)/50">
                  {q}
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-(--rf-ink) text-xl leading-none text-(--rf-accent) transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 leading-relaxed text-(--rf-muted)">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* --- Final call to action ------------------------------------------------ */}
        <section className="bg-(--rf-ink) text-(--rf-paper)">
          <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
            <h2 className="rf-serif text-5xl leading-[1.02] sm:text-7xl">{t.final.title}</h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-(--rf-dark-muted)">{t.final.body}</p>
            <Link href={demoHref} className={`${btnPrimary} mt-8`}>
              {t.final.cta}
            </Link>
            <div className="mt-10 hidden text-left md:block">
              <TryQr svg={tryQr} title={t.final.qr} />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-(--rf-dark-line) bg-(--rf-ink) text-(--rf-paper)">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <Wordmark />
          <p className="text-(--rf-dark-muted)">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
