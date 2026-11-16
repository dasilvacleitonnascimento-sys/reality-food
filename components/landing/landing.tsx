import Image from "next/image";
import Link from "next/link";
import {
  Camera,
  Check,
  ChefHat,
  Languages,
  Ruler,
  TrendingUp,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { formatPrice } from "@/lib/format";
import { SITE } from "@/lib/site";
import { getRestaurant } from "@/lib/demo-data";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { HeroStage, type StageDish } from "./hero-stage";
import { SizeCompare } from "./size-compare";

const COPY = {
  en: {
    nav: {
      how: "How it works",
      size: "Size check",
      pricing: "Pricing",
    },
    hero: {
      title: ["See it on your table", "before you order."],
      body: "Reality Food menus put every dish on the guest’s table at its real size. They scan the QR code, tap a dish and see it in 3D right where it will be served. No app. No guessing.",
      primary: "Try the live menu",
      secondary: "Book a demo",
      note: "Works on iPhone and Android, in English and Spanish.",
      stage: {
        trueSize: "True size",
        plate: "plate",
        loading: "Loading 3D dish",
      },
    },
    how: {
      title: "Live in a day",
      steps: [
        {
          title: "We scan your dishes",
          body: "Your own plates, exactly as you serve them. Every model is checked to the millimeter against the plate.",
        },
        {
          title: "QR codes on the tables",
          body: "Your menu opens in the phone’s browser in seconds. Nothing to download.",
        },
        {
          title: "Guests see it on the table",
          body: "One tap and the dish appears in front of them, at its real size, next to their hand.",
        },
      ],
    },
    size: {
      title: "“Is it big enough to share?”",
      body: "Pick a dish. Its plate and a phone are drawn at the same scale, just like in AR on the table.",
      pick: "Pick a dish",
      phone: "Phone, 14.7 cm",
      plate: "plate",
    },
    why: {
      title: "A menu that sells with its eyes",
      items: [
        {
          icon: TrendingUp,
          title: "Bigger checks",
          body: "Guests who can see dessert order dessert. Premium plates stop looking like a risk.",
        },
        {
          icon: Ruler,
          title: "No surprises on size",
          body: "“Is it big enough to share?” Answered before they order, with a ruler if they want one.",
        },
        {
          icon: Languages,
          title: "English and Spanish",
          body: "The menu follows the guest’s phone language. One QR code for everyone.",
        },
        {
          icon: ChefHat,
          title: "Your team stays in control",
          body: "Change prices, mark a dish sold out or add a special from your phone.",
        },
      ],
    },
    demos: {
      title: "Try it now",
      body: "Open a live menu on your phone and tap “View on your table”.",
      open: "Open menu",
    },
    pricing: {
      title: "Simple pricing",
      setup: "Setup, once",
      monthlyLabel: "Monthly",
      setupBody: (n: number) =>
        `We scan up to ${n} dishes in 3D, design your menu and print QR cards for your tables.`,
      monthly: "per month",
      monthlyBody:
        "Hosting, menu edits from your phone, monthly view reports and support.",
      includesTitle: "Included",
      includes: [
        "English and Spanish menu",
        "Unlimited menu edits",
        "True-size check on every dish",
        "Works on iPhone and Android",
      ],
      cta: "Get started",
    },
    faq: {
      title: "Questions",
      items: [
        [
          "Do guests need an app?",
          "No. They scan the QR code and the menu opens in the browser. On iPhone the 3D view uses Apple’s built-in AR; on Android it runs right in Chrome.",
        ],
        [
          "How accurate is the size?",
          "Each model is calibrated to the plate you serve it on and rejected if it’s off by more than 0.5%. On the table, accuracy depends on the phone’s camera; recent phones are within a few percent.",
        ],
        [
          "What if my menu changes?",
          "Prices, descriptions and availability change from your phone in seconds. New dishes are scanned in a short visit.",
        ],
        [
          "Do I need special equipment?",
          "No. We scan with a phone, and your guests use their own.",
        ],
      ],
    },
    final: {
      title: "Real food. Real size.",
      body: "Give every guest a look at the plate before it reaches the table.",
      cta: "See a live menu",
    },
    footer: "Real food. Real size.",
  },
  es: {
    nav: {
      how: "Cómo funciona",
      size: "Tamaño",
      pricing: "Precios",
    },
    hero: {
      title: ["Míralo en tu mesa", "antes de pedir."],
      body: "Los menús de Reality Food ponen cada plato sobre la mesa del cliente, en su tamaño real. Escanean el QR, tocan un plato y lo ven en 3D justo donde lo van a servir. Sin app. Sin adivinar.",
      primary: "Prueba el menú en vivo",
      secondary: "Agenda una demo",
      note: "Funciona en iPhone y Android, en inglés y español.",
      stage: {
        trueSize: "Tamaño real",
        plate: "de plato",
        loading: "Cargando plato en 3D",
      },
    },
    how: {
      title: "Listo en un día",
      steps: [
        {
          title: "Escaneamos tus platos",
          body: "Tus propios platos, tal como los sirves. Cada modelo se verifica al milímetro con el plato.",
        },
        {
          title: "QR en las mesas",
          body: "Tu menú abre en el navegador del teléfono en segundos. Nada que descargar.",
        },
        {
          title: "Lo ven en su mesa",
          body: "Un toque y el plato aparece frente a ellos, en tamaño real, junto a su mano.",
        },
      ],
    },
    size: {
      title: "“¿Alcanza para compartir?”",
      body: "Elige un plato. El plato y un teléfono están dibujados a la misma escala, igual que en la mesa con realidad aumentada.",
      pick: "Elige un plato",
      phone: "Teléfono, 14,7 cm",
      plate: "de plato",
    },
    why: {
      title: "Un menú que vende por los ojos",
      items: [
        {
          icon: TrendingUp,
          title: "Cuentas más altas",
          body: "Quien ve el postre, pide el postre. Los platos premium dejan de parecer un riesgo.",
        },
        {
          icon: Ruler,
          title: "Sin sorpresas de tamaño",
          body: "“¿Alcanza para compartir?” Respondido antes de pedir, con regla si la quieren.",
        },
        {
          icon: Languages,
          title: "Inglés y español",
          body: "El menú sigue el idioma del teléfono. Un solo QR para todos.",
        },
        {
          icon: ChefHat,
          title: "Tu equipo tiene el control",
          body: "Cambia precios, marca un plato agotado o agrega un especial desde tu teléfono.",
        },
      ],
    },
    demos: {
      title: "Pruébalo ahora",
      body: "Abre un menú en vivo en tu teléfono y toca “Ver en tu mesa”.",
      open: "Abrir menú",
    },
    pricing: {
      title: "Precios simples",
      setup: "Instalación, una vez",
      monthlyLabel: "Mensual",
      setupBody: (n: number) =>
        `Escaneamos hasta ${n} platos en 3D, diseñamos tu menú e imprimimos tarjetas QR para tus mesas.`,
      monthly: "al mes",
      monthlyBody:
        "Hosting, cambios del menú desde tu teléfono, reportes mensuales de vistas y soporte.",
      includesTitle: "Incluye",
      includes: [
        "Menú en inglés y español",
        "Cambios ilimitados",
        "Verificación de tamaño real en cada plato",
        "Funciona en iPhone y Android",
      ],
      cta: "Empezar",
    },
    faq: {
      title: "Preguntas",
      items: [
        [
          "¿Mis clientes necesitan una app?",
          "No. Escanean el QR y el menú abre en el navegador. En iPhone el 3D usa la realidad aumentada de Apple; en Android funciona directo en Chrome.",
        ],
        [
          "¿Qué tan exacto es el tamaño?",
          "Cada modelo se calibra con el plato en que lo sirves y se rechaza si se desvía más de 0,5%. En la mesa, la precisión depende de la cámara del teléfono; los teléfonos recientes están dentro de unos pocos por ciento.",
        ],
        [
          "¿Y si cambia mi menú?",
          "Precios, descripciones y disponibilidad se cambian desde tu teléfono en segundos. Los platos nuevos se escanean en una visita corta.",
        ],
        [
          "¿Necesito equipo especial?",
          "No. Escaneamos con un teléfono, y tus clientes usan el suyo.",
        ],
      ],
    },
    final: {
      title: "Comida real. Tamaño real.",
      body: "Deja que cada cliente vea el plato antes de que llegue a la mesa.",
      cta: "Ver un menú en vivo",
    },
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
      <circle
        cx="32"
        cy="32"
        r="23.6"
        fill="none"
        stroke="var(--rf-ink)"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <g
        fill="none"
        stroke="var(--rf-ink)"
        strokeWidth="4.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(-0.6 0)"
      >
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

export function Landing({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const dict = getDictionary(locale);
  const demoHref = `/${SITE.demos[0].slug}`;
  const contactHref = SITE.salesEmail
    ? `mailto:${SITE.salesEmail}?subject=Reality%20Food%20demo`
    : demoHref;

  // Real dishes from the demo menus (same 3D files the menus use).
  const bistro = getRestaurant("demo-bistro", locale)!;
  const ironside = getRestaurant("ironside-cafe", locale)!;
  const plated = bistro.dishes.filter((d) => d.glbUrl);
  const stageDishes: StageDish[] = [
    "double-burger",
    "chocolate-cake",
    "schnitzel-plate",
    "pudim-slice",
  ]
    .map((id) => plated.find((d) => d.id === id))
    .filter((d) => d !== undefined)
    .map((d) => ({
      name: d.name,
      glbUrl: d.glbUrl!,
      plateCm: d.plateDiameterCm,
    }));
  const compareDishes = [...plated]
    .sort((a, b) => a.plateDiameterCm - b.plateDiameterCm)
    .map((d) => ({ id: d.id, name: d.name, plateCm: d.plateDiameterCm }));
  const demoPhotos: Record<string, string[]> = {
    "ironside-cafe": ironside.dishes
      .filter((d) => d.glbUrl)
      .slice(0, 3)
      .map((d) => d.photo),
    "demo-bistro": [
      "/images/schnitzel-plate.jpg",
      "/images/burger.jpg",
      "/images/chocolate-cake.jpg",
    ],
  };

  return (
    <div className="overflow-x-clip bg-(--rf-paper) text-(--rf-ink)">
      {/* --- Nav ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-(--rf-dark-line) bg-(--rf-ink)/90 backdrop-blur-md">
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
          </div>
        </nav>
      </header>

      <main id="main">
        {/* --- Hero: one moment, the ruler measuring a real dish --------------------- */}
        <section className="bg-(--rf-ink) text-(--rf-paper)">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-28">
            <div>
              <h1 className="rf-serif text-[2.7rem] leading-[1.03] sm:text-6xl">
                {/* Two lines on wide screens; one flowing sentence on phones. */}
                {t.hero.title.map((line) => (
                  <span key={line} className="sm:block">
                    {line}{" "}
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-(--rf-dark-muted)">
                {t.hero.body}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={demoHref} className={btnPrimary}>
                  {t.hero.primary}
                </Link>
                <a
                  href={contactHref}
                  className={`${btn} border border-(--rf-dark-line) hover:border-(--rf-accent)`}
                >
                  {t.hero.secondary}
                </a>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm text-(--rf-dark-muted)">
                <Camera className="size-4 shrink-0 text-(--rf-accent)" aria-hidden />
                {t.hero.note}
              </p>
            </div>
            <HeroStage dishes={stageDishes} text={t.hero.stage} />
          </div>

        </section>

        {/* --- How it works: a real sequence, so the steps are numbered ------------- */}
        <section
          id="how"
          aria-labelledby="how-heading"
          className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 sm:px-6"
        >
          <h2 id="how-heading" className={sectionTitle}>
            {t.how.title}
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {t.how.steps.map(({ title, body }, i) => (
              <li key={title} className="border-t-2 border-(--rf-ink) pt-5">
                <span
                  className="rf-serif block text-5xl leading-none text-(--rf-accent-text) tabular-nums"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="mt-4 text-xl font-bold">{title}</h3>
                <p className="mt-2 leading-relaxed text-(--rf-muted)">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Size check (interactive) ------------------------------------------ */}
        <section
          id="size"
          aria-labelledby="size-heading"
          className="scroll-mt-20 bg-(--rf-ink) text-(--rf-paper)"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 id="size-heading" className={sectionTitle}>
                {t.size.title}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-(--rf-dark-muted)">
                {t.size.body}
              </p>
            </div>
            <SizeCompare
              dishes={compareDishes}
              text={{
                pick: t.size.pick,
                phone: t.size.phone,
                plate: t.size.plate,
              }}
            />
          </div>
        </section>

        {/* --- Why it sells ------------------------------------------------------ */}
        <section
          aria-labelledby="why-heading"
          className="mx-auto max-w-6xl px-4 py-24 sm:px-6"
        >
          <h2 id="why-heading" className={sectionTitle}>
            {t.why.title}
          </h2>
          <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {t.why.items.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4 border-t border-(--rf-line) pt-6">
                <Icon className="mt-1 size-6 shrink-0 text-(--rf-accent-text)" aria-hidden />
                <div>
                  <h3 className="text-xl font-bold">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-(--rf-muted)">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Live demos -------------------------------------------------------- */}
        <section
          id="demo"
          aria-labelledby="demo-heading"
          className="scroll-mt-20 border-y border-(--rf-line) bg-(--rf-card)"
        >
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
                          className="absolute top-1/2 left-1/2 h-32 w-40 overflow-hidden rounded-2xl border-4 border-(--rf-ink)"
                          style={{
                            transform: `translate(-50%, -50%) translateX(${(p - 1) * 70}px) rotate(${(p - 1) * 8}deg)`,
                            zIndex: p === 1 ? 2 : 1,
                          }}
                        >
                          <Image
                            src={src}
                            alt=""
                            fill
                            sizes="160px"
                            className="object-cover"
                          />
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
                      <span className="inline-flex shrink-0 items-center rounded-xl bg-(--rf-ink) px-4 py-2.5 text-sm font-bold text-(--rf-accent)">
                        {t.demos.open}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* --- Pricing --------------------------------------------------------- */}
        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          className="scroll-mt-20 bg-(--rf-ink) text-(--rf-paper)"
        >
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <h2 id="pricing-heading" className={sectionTitle}>
              {t.pricing.title}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-[1fr_1fr_1.1fr]">
              <div className="rounded-2xl border border-(--rf-dark-line) bg-(--rf-panel) p-7">
                <h3 className="text-sm font-bold text-(--rf-accent)">{t.pricing.setup}</h3>
                <p className="rf-serif mt-3 text-6xl tabular-nums">
                  {formatPrice(SITE.pricing.setupUsd)}
                </p>
                <p className="mt-4 leading-relaxed text-(--rf-dark-muted)">
                  {t.pricing.setupBody(SITE.pricing.dishesIncluded)}
                </p>
              </div>
              <div className="rounded-2xl border border-(--rf-dark-line) bg-(--rf-panel) p-7">
                <h3 className="text-sm font-bold text-(--rf-accent)">{t.pricing.monthlyLabel}</h3>
                <p className="mt-3">
                  <span className="rf-serif text-6xl tabular-nums">
                    {formatPrice(SITE.pricing.monthlyUsd)}
                  </span>
                  <span className="ml-1.5 text-base font-medium text-(--rf-dark-muted)">
                    {t.pricing.monthly}
                  </span>
                </p>
                <p className="mt-4 leading-relaxed text-(--rf-dark-muted)">
                  {t.pricing.monthlyBody}
                </p>
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
        <section
          aria-labelledby="faq-heading"
          className="mx-auto max-w-3xl px-4 py-24 sm:px-6"
        >
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
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
            <h2 className="rf-serif text-5xl leading-[1.02] sm:text-7xl">
              {t.final.title}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-(--rf-dark-muted)">
              {t.final.body}
            </p>
            <Link href={demoHref} className={`${btnPrimary} mt-8`}>
              {t.final.cta}
            </Link>
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
