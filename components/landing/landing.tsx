import Image from "next/image";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";
import {
  ArrowRight,
  Camera,
  Check,
  ChefHat,
  Languages,
  QrCode,
  Ruler,
  ScanLine,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { SITE } from "@/lib/site";
import { getRestaurant } from "@/lib/demo-data";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { CountUp } from "./count-up";
import { HeroStage, type StageDish } from "./hero-stage";
import { Reveal } from "./reveal";
import { SizeCompare } from "./size-compare";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-fraunces",
});
const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-manrope",
});

const COPY = {
  en: {
    nav: {
      how: "How it works",
      size: "Size check",
      pricing: "Pricing",
      cta: "Try it",
    },
    hero: {
      eyebrow: "AR menus for restaurants",
      title: ["See it on your table", "before you order."],
      body: "Guests scan the QR code, tap a dish and see it in 3D at its real size, right where it will be served. No app. No guessing.",
      primary: "Try the live menu",
      secondary: "Book a demo",
      note: "Works on iPhone and Android, in English and Spanish.",
      stage: {
        trueSize: "True size",
        plate: "plate",
        loading: "Loading 3D dish",
        chips: [
          "No app to download",
          "iPhone + Android",
          "English · Español",
        ] as [string, string, string],
      },
    },
    marquee: "Dishes already in 3D",
    how: {
      eyebrow: "How it works",
      title: "Live in a day",
      steps: [
        {
          icon: ScanLine,
          title: "We scan your dishes",
          body: "Your own plates, exactly as you serve them. Every model is checked to the millimeter against the plate.",
        },
        {
          icon: QrCode,
          title: "QR codes on the tables",
          body: "Your menu opens in the phone's browser in seconds. Nothing to download.",
        },
        {
          icon: Smartphone,
          title: "Guests see it on the table",
          body: "One tap and the dish appears in front of them, at its real size, next to their hand.",
        },
      ],
    },
    size: {
      eyebrow: "Size check",
      title: "“Is it big enough to share?”",
      body: "Pick a dish. Its plate and a phone are drawn at the same scale, just like in AR on the table.",
      pick: "Pick a dish",
      phone: "Phone, 14.7 cm",
      plate: "plate",
    },
    why: {
      eyebrow: "Why it sells",
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
          body: "The menu follows the guest's phone language. One QR code for everyone.",
        },
        {
          icon: ChefHat,
          title: "Your team stays in control",
          body: "Change prices, mark a dish sold out or add a special from your phone.",
        },
      ],
    },
    demos: {
      eyebrow: "Live demos",
      title: "Try it now",
      body: "Open a live menu on your phone and tap “View on your table”.",
      open: "Open menu",
    },
    pricing: {
      eyebrow: "Pricing",
      title: "Simple pricing",
      setup: "Setup",
      monthlyLabel: "Monthly",
      setupBody: (n: number) =>
        `We scan up to ${n} dishes in 3D, design your menu and print QR cards for your tables.`,
      monthly: "per month",
      monthlyBody:
        "Hosting, menu edits from your phone, monthly view reports and support.",
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
          "No. They scan the QR code and the menu opens in the browser. On iPhone the 3D view uses Apple's built-in AR; on Android it runs right in Chrome.",
        ],
        [
          "How accurate is the size?",
          "Each model is calibrated to the plate you serve it on and rejected if it's off by more than 0.5%. On the table, accuracy depends on the phone's camera; recent phones are within a few percent.",
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
      title: ["Real food.", "Real size."],
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
      cta: "Pruébalo",
    },
    hero: {
      eyebrow: "Menús en realidad aumentada para restaurantes",
      title: ["Míralo en tu mesa", "antes de pedir."],
      body: "Tus clientes escanean el QR, tocan un plato y lo ven en 3D en su tamaño real, justo donde lo van a servir. Sin app. Sin adivinar.",
      primary: "Prueba el menú en vivo",
      secondary: "Agenda una demo",
      note: "Funciona en iPhone y Android, en inglés y español.",
      stage: {
        trueSize: "Tamaño real",
        plate: "de plato",
        loading: "Cargando plato en 3D",
        chips: [
          "Sin descargar apps",
          "iPhone + Android",
          "English · Español",
        ] as [string, string, string],
      },
    },
    marquee: "Platos que ya están en 3D",
    how: {
      eyebrow: "Cómo funciona",
      title: "Listo en un día",
      steps: [
        {
          icon: ScanLine,
          title: "Escaneamos tus platos",
          body: "Tus propios platos, tal como los sirves. Cada modelo se verifica al milímetro con el plato.",
        },
        {
          icon: QrCode,
          title: "QR en las mesas",
          body: "Tu menú abre en el navegador del teléfono en segundos. Nada que descargar.",
        },
        {
          icon: Smartphone,
          title: "Lo ven en su mesa",
          body: "Un toque y el plato aparece frente a ellos, en tamaño real, junto a su mano.",
        },
      ],
    },
    size: {
      eyebrow: "Tamaño",
      title: "“¿Alcanza para compartir?”",
      body: "Elige un plato. El plato y un teléfono están dibujados a la misma escala, igual que en la mesa con realidad aumentada.",
      pick: "Elige un plato",
      phone: "Teléfono, 14,7 cm",
      plate: "de plato",
    },
    why: {
      eyebrow: "Por qué vende",
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
      eyebrow: "Demos en vivo",
      title: "Pruébalo ahora",
      body: "Abre un menú en vivo en tu teléfono y toca “Ver en tu mesa”.",
      open: "Abrir menú",
    },
    pricing: {
      eyebrow: "Precios",
      title: "Precios simples",
      setup: "Instalación",
      monthlyLabel: "Mensual",
      setupBody: (n: number) =>
        `Escaneamos hasta ${n} platos en 3D, diseñamos tu menú e imprimimos tarjetas QR para tus mesas.`,
      monthly: "al mes",
      monthlyBody:
        "Hosting, cambios del menú desde tu teléfono, reportes mensuales de vistas y soporte.",
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
      title: ["Comida real.", "Tamaño real."],
      body: "Deja que cada cliente vea el plato antes de que llegue a la mesa.",
      cta: "Ver un menú en vivo",
    },
    footer: "Comida real. Tamaño real.",
  },
} as const;

const serif =
  "[font-family:var(--font-fraunces),Georgia,serif] font-semibold tracking-tight";
const btn =
  "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-base font-bold outline-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50";
const btnPrimary = `${btn} bg-(--rf-accent) text-(--rf-ink) hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-8px_var(--rf-accent)]`;
const eyebrow = "text-xs font-bold tracking-[0.16em] uppercase";

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
    <span className="flex items-center gap-2.5">
      <Mark className="size-9" />
      <span className={`${serif} text-xl text-(--rf-paper)`}>
        Reality <span className="text-(--rf-accent)">Food</span>
      </span>
    </span>
  );
}

/** Headline that rises in word by word. */
function AnimatedTitle({ lines }: { lines: readonly [string, string] }) {
  let i = 0;
  return (
    <h1
      className={`${serif} text-[2.7rem] leading-[1.03] sm:text-6xl`}
    >
      {lines.map((line, l) => (
        <span key={line} className="block">
          {line.split(" ").map((word) => {
            const delay = i++ * 90;
            return (
              <span
                key={`${word}-${delay}`}
                className={`rf-rise inline-block ${l === 1 ? "rf-shimmer" : ""}`}
                style={{ animationDelay: `${delay}ms` }}
              >
                {word}&nbsp;
              </span>
            );
          })}
        </span>
      ))}
    </h1>
  );
}

function SectionTitle({
  kicker,
  title,
  dark = false,
}: {
  kicker: string;
  title: string;
  dark?: boolean;
}) {
  return (
    <Reveal>
      <p
        className={`${eyebrow} ${dark ? "text-(--rf-accent)" : "text-(--rf-accent-text)"}`}
      >
        {kicker}
      </p>
      <h2 className={`${serif} mt-3 text-3xl sm:text-5xl`}>{title}</h2>
    </Reveal>
  );
}

export function Landing({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const demoHref = `/${SITE.demos[0].slug}`;
  const contactHref = SITE.salesEmail
    ? `mailto:${SITE.salesEmail}?subject=Reality%20Food%20demo`
    : demoHref;

  // Real dishes from the demo menus (same 3D files the menus use).
  const bistro = getRestaurant("demo-bistro", locale)!;
  const ironside = getRestaurant("ironside-cafe", locale)!;
  const plated = bistro.dishes.filter((d) => d.glbUrl);
  const stageDishes: StageDish[] = [
    "burrata",
    "chocolate-cake",
    "shrimp-risotto",
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
  const showcase = [
    ...plated,
    ...ironside.dishes
      .filter((d) => d.glbUrl && !d.photo.includes("coming-soon"))
      .slice(0, 14),
  ];
  const rows = [
    showcase.filter((_, i) => i % 2 === 0),
    showcase.filter((_, i) => i % 2 === 1),
  ];
  const demoPhotos: Record<string, string[]> = {
    "ironside-cafe": ironside.dishes
      .filter((d) => d.glbUrl)
      .slice(0, 3)
      .map((d) => d.photo),
    "demo-bistro": [
      "/images/burrata.jpg",
      "/images/shrimp-risotto.jpg",
      "/images/chocolate-cake.jpg",
    ],
  };

  return (
    <div
      className={`${fraunces.variable} ${manrope.variable} overflow-x-clip bg-(--rf-paper) text-(--rf-ink) [font-family:var(--font-manrope),system-ui,sans-serif]`}
    >
      {/* Scroll progress */}
      <div
        className="rf-progress fixed inset-x-0 top-0 z-50 h-1 bg-(--rf-accent)"
        aria-hidden
      />

      {/* --- Nav ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-(--rf-ink)/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="flex items-center gap-1 text-(--rf-paper) sm:gap-2">
            {[
              ["#how", t.nav.how],
              ["#size", t.nav.size],
              ["#pricing", t.nav.pricing],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="hidden rounded-lg px-3 py-2 text-sm font-medium opacity-80 transition-opacity outline-none hover:opacity-100 focus-visible:ring-3 focus-visible:ring-(--rf-accent)/50 md:block"
              >
                {label}
              </a>
            ))}
            <LanguageSwitch current={locale} label="Language" />
          </div>
        </nav>
      </header>

      {/* --- Hero ------------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-(--rf-ink) text-(--rf-paper)">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="rf-blob absolute -top-32 -left-24 size-[480px] rounded-full bg-(--rf-accent) opacity-20 blur-3xl" />
          <div
            className="rf-blob absolute top-1/3 -right-32 size-[520px] rounded-full bg-(--rf-accent-text) opacity-30 blur-3xl"
            style={{ animationDelay: "-6s", animationDuration: "20s" }}
          />
          <div
            className="rf-blob absolute -bottom-40 left-1/3 size-[380px] rounded-full bg-(--rf-accent-soft) opacity-10 blur-3xl"
            style={{ animationDelay: "-11s" }}
          />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(var(--rf-paper) 1px, transparent 1px), linear-gradient(90deg, var(--rf-paper) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse at 50% 40%, black, transparent 75%)",
            }}
          />
        </div>

        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20 md:pb-28">
          <div>
            <p
              className={`${eyebrow} rf-rise inline-flex items-center gap-2 rounded-full border border-(--rf-accent)/40 px-3 py-1.5 text-(--rf-accent)`}
            >
              <span
                className="rf-pulse size-2 rounded-full bg-(--rf-accent)"
                aria-hidden
              />
              {t.hero.eyebrow}
            </p>
            <div className="mt-5">
              <AnimatedTitle lines={t.hero.title} />
            </div>
            <p
              className="rf-rise mt-6 max-w-lg text-lg leading-relaxed opacity-85"
              style={{ animationDelay: "700ms" }}
            >
              {t.hero.body}
            </p>
            <div
              className="rf-rise mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: "850ms" }}
            >
              <Link href={demoHref} className={`${btnPrimary} group`}>
                {t.hero.primary}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
              <a
                href={contactHref}
                className={`${btn} border border-white/20 hover:border-(--rf-accent) hover:text-(--rf-accent)`}
              >
                {t.hero.secondary}
              </a>
            </div>
            <p
              className="rf-rise mt-6 flex items-center gap-2 text-sm opacity-75"
              style={{ animationDelay: "1000ms" }}
            >
              <Camera className="size-4 text-(--rf-accent)" aria-hidden />{" "}
              {t.hero.note}
            </p>
          </div>
          <HeroStage dishes={stageDishes} text={t.hero.stage} />
        </div>

        {/* --- Dish marquee ------------------------------------------------------ */}
        <div className="border-t border-white/10 pt-8 pb-12">
          <p className={`${eyebrow} px-4 text-center text-(--rf-accent)`}>
            {t.marquee}
          </p>
          <div className="mt-6 space-y-4 [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
            {rows.map((row, r) => (
              <div key={r} className="flex overflow-hidden">
                <ul
                  className="rf-marquee flex w-max shrink-0 gap-4 pr-4"
                  style={{
                    animationDirection: r ? "reverse" : "normal",
                    animationDuration: r ? "48s" : "40s",
                  }}
                >
                  {[...row, ...row].map((dish, i) => (
                    <li
                      key={`${dish.id}-${i}`}
                      aria-hidden={i >= row.length}
                      className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-(--rf-panel) p-2 pr-4"
                    >
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={dish.photo}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">
                          {dish.name}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-(--rf-accent)">
                          <Ruler className="size-3" aria-hidden />{" "}
                          {dish.plateDiameterCm} cm
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main>
        {/* --- How it works ------------------------------------------------- */}
        <section
          id="how"
          className="mx-auto max-w-6xl scroll-mt-16 px-4 py-24 sm:px-6"
        >
          <SectionTitle kicker={t.how.eyebrow} title={t.how.title} />
          <div className="relative mt-12">
            <div
              aria-hidden
              className="absolute top-14 right-[16%] left-[16%] hidden h-0.5 bg-[repeating-linear-gradient(90deg,var(--rf-accent-text)_0_10px,transparent_10px_18px)] md:block"
            />
            <ol className="grid gap-6 md:grid-cols-3">
              {t.how.steps.map(({ icon: Icon, title, body }, i) => (
                <Reveal
                  as="li"
                  key={title}
                  delay={i * 150}
                  className="relative"
                >
                  <div className="rf-lift h-full rounded-3xl border border-(--rf-line) bg-(--rf-card) p-7">
                    <div className="flex items-center gap-3">
                      <span className="relative grid size-16 place-items-center rounded-2xl bg-(--rf-ink) text-(--rf-accent)">
                        <Icon className="size-7" aria-hidden />
                        <span className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-(--rf-accent) text-xs font-bold text-(--rf-ink)">
                          {i + 1}
                        </span>
                      </span>
                    </div>
                    <h3 className="mt-5 text-xl font-bold">{title}</h3>
                    <p className="mt-2 leading-relaxed text-(--rf-muted)">
                      {body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* --- Size check (interactive) ------------------------------------- */}
        <section
          id="size"
          className="scroll-mt-16 bg-(--rf-ink) text-(--rf-paper)"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionTitle kicker={t.size.eyebrow} title={t.size.title} dark />
              <Reveal delay={100}>
                <p className="mt-4 text-lg leading-relaxed opacity-80">
                  {t.size.body}
                </p>
              </Reveal>
            </div>
            <Reveal delay={200}>
              <SizeCompare
                dishes={compareDishes}
                text={{
                  pick: t.size.pick,
                  phone: t.size.phone,
                  plate: t.size.plate,
                }}
              />
            </Reveal>
          </div>
        </section>

        {/* --- Why it sells ------------------------------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <SectionTitle kicker={t.why.eyebrow} title={t.why.title} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {t.why.items.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 2) * 120}>
                <div className="rf-lift group flex h-full gap-5 rounded-3xl border border-(--rf-line) bg-(--rf-card) p-7">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-(--rf-accent) text-(--rf-ink) transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-xl font-bold">{title}</h3>
                    <p className="mt-1.5 leading-relaxed text-(--rf-muted)">
                      {body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --- Live demos ---------------------------------------------------- */}
        <section
          id="demo"
          className="scroll-mt-16 border-y border-(--rf-line) bg-(--rf-card)"
        >
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <SectionTitle kicker={t.demos.eyebrow} title={t.demos.title} />
            <Reveal delay={100}>
              <p className="mt-3 text-lg text-(--rf-muted)">{t.demos.body}</p>
            </Reveal>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {SITE.demos.map((demo, i) => (
                <Reveal key={demo.slug} delay={i * 150}>
                  <Link
                    href={`/${demo.slug}`}
                    className="rf-lift group flex h-full flex-col overflow-hidden rounded-3xl border border-(--rf-line) bg-(--rf-paper) outline-none focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50"
                  >
                    <div className="relative h-44 overflow-hidden bg-(--rf-ink)">
                      {demoPhotos[demo.slug]?.map((src, p) => (
                        <div
                          key={src}
                          className="absolute top-1/2 left-1/2 h-32 w-40 overflow-hidden rounded-2xl border-4 border-(--rf-ink) shadow-xl transition-transform duration-500"
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
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-1 items-center justify-between gap-4 p-6">
                      <div>
                        <p className="text-xl font-bold">{demo.name}</p>
                        <p className="mt-1 text-sm text-(--rf-muted)">
                          {demo.note}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-(--rf-ink) px-4 py-2.5 text-sm font-bold text-(--rf-accent)">
                        {t.demos.open}
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* --- Pricing --------------------------------------------------------- */}
        <section
          id="pricing"
          className="relative isolate scroll-mt-16 overflow-hidden bg-(--rf-ink) text-(--rf-paper)"
        >
          <div
            aria-hidden
            className="rf-blob absolute -top-40 right-0 -z-10 size-[460px] rounded-full bg-(--rf-accent) opacity-10 blur-3xl"
          />
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
            <SectionTitle
              kicker={t.pricing.eyebrow}
              title={t.pricing.title}
              dark
            />
            <div className="mt-12 grid gap-6 md:grid-cols-[1fr_1fr_1.1fr]">
              <Reveal>
                <div className="h-full rounded-3xl border border-white/10 bg-(--rf-panel) p-7">
                  <p className={`${eyebrow} text-(--rf-accent)`}>
                    {t.pricing.setup}
                  </p>
                  <p className={`${serif} mt-3 text-6xl`}>
                    <CountUp to={SITE.pricing.setupUsd} prefix="$" />
                  </p>
                  <p className="mt-4 leading-relaxed opacity-80">
                    {t.pricing.setupBody(SITE.pricing.dishesIncluded)}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={120}>
                <div className="h-full rounded-3xl border border-white/10 bg-(--rf-panel) p-7">
                  <p className={`${eyebrow} text-(--rf-accent)`}>
                    {t.pricing.monthlyLabel}
                  </p>
                  <p className={`${serif} mt-3 text-6xl`}>
                    <CountUp to={SITE.pricing.monthlyUsd} prefix="$" />
                    <span className="ml-1 [font-family:var(--font-manrope)] text-base font-medium opacity-75">
                      {t.pricing.monthly}
                    </span>
                  </p>
                  <p className="mt-4 leading-relaxed opacity-80">
                    {t.pricing.monthlyBody}
                  </p>
                </div>
              </Reveal>
              <Reveal delay={240}>
                <div className="rf-glow-border h-full rounded-3xl">
                  <div className="flex h-full flex-col justify-between rounded-3xl bg-(--rf-paper) p-7 text-(--rf-ink)">
                    <ul className="space-y-3.5">
                      {t.pricing.includes.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-(--rf-accent)">
                            <Check className="size-4" aria-hidden />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <a
                      href={contactHref}
                      className={`${btnPrimary} mt-7 w-full`}
                    >
                      {t.pricing.cta}
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* --- FAQ ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6">
          <h2 className={`${serif} text-3xl sm:text-5xl`}>{t.faq.title}</h2>
          <div className="mt-10 space-y-3">
            {t.faq.items.map(([q, a], i) => (
              <Reveal key={q} delay={i * 80}>
                <details className="group rounded-2xl border border-(--rf-line) bg-(--rf-card) p-5 transition-colors open:border-(--rf-accent) [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-lg font-bold outline-none focus-visible:ring-3 focus-visible:ring-(--rf-accent)/50">
                    {q}
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-full bg-(--rf-ink) text-xl leading-none text-(--rf-accent) transition-transform duration-300 group-open:rotate-45"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 leading-relaxed text-(--rf-muted)">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </section>

        {/* --- Final call to action --------------------------------------------- */}
        <section className="relative isolate overflow-hidden bg-(--rf-ink) text-(--rf-paper)">
          <div
            aria-hidden
            className="rf-blob absolute -bottom-40 left-1/4 -z-10 size-[520px] rounded-full bg-(--rf-accent) opacity-15 blur-3xl"
          />
          <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
            <Reveal>
              <h2 className={`${serif} text-5xl leading-[1.02] sm:text-7xl`}>
                {t.final.title[0]}{" "}
                <span className="rf-shimmer">{t.final.title[1]}</span>
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-lg opacity-80">
                {t.final.body}
              </p>
              <Link href={demoHref} className={`${btnPrimary} group mt-8`}>
                {t.final.cta}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-(--rf-ink) text-(--rf-paper)">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <Wordmark />
          <p className="opacity-75">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
