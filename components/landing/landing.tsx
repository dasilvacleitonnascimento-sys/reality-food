import Image from "next/image";
import Link from "next/link";
import { Fraunces, Manrope } from "next/font/google";
import {
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
import { LanguageSwitch } from "@/components/menu/language-switch";

const fraunces = Fraunces({ subsets: ["latin"], weight: ["600"], variable: "--font-fraunces" });
const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-manrope" });

const COPY = {
  en: {
    nav: { how: "How it works", pricing: "Pricing", demo: "Live demo" },
    hero: {
      eyebrow: "AR menus for restaurants",
      title: ["See it on your table", "before you order."],
      body: "Guests scan the QR code, tap a dish and see it in 3D at its real size, right where it will be served. No app. No guessing.",
      primary: "Try the live menu",
      secondary: "Book a demo",
      note: "Works on iPhone and Android, in English and Spanish.",
      size: "True size · 18 cm plate",
    },
    how: {
      title: "Live in a day",
      steps: [
        { icon: ScanLine, title: "We scan your dishes", body: "Your own plates, exactly as you serve them. Every model is checked to the millimeter against the plate." },
        { icon: QrCode, title: "QR codes on the tables", body: "Your menu opens in the phone's browser in seconds. Nothing to download." },
        { icon: Smartphone, title: "Guests see it on the table", body: "One tap and the dish appears in front of them, at its real size, next to their hand." },
      ],
    },
    why: {
      title: "A menu that sells with its eyes",
      items: [
        { icon: TrendingUp, title: "Bigger checks", body: "Guests who can see dessert order dessert. Premium plates stop looking like a risk." },
        { icon: Ruler, title: "No surprises on size", body: "“Is it big enough to share?” Answered before they order, with a ruler if they want one." },
        { icon: Languages, title: "English and Spanish", body: "The menu follows the guest's phone language. One QR code for everyone." },
        { icon: ChefHat, title: "Your team stays in control", body: "Change prices, mark a dish sold out or add a special from your phone." },
      ],
    },
    demos: { title: "Try it now", body: "Open a live menu on your phone and tap “View on your table”.", open: "Open menu" },
    pricing: {
      title: "Simple pricing",
      setup: "Setup",
      monthlyLabel: "Monthly",
      setupBody: (n: number) => `We scan up to ${n} dishes in 3D, design your menu and print QR cards for your tables.`,
      monthly: "per month",
      monthlyBody: "Hosting, menu edits from your phone, monthly view reports and support.",
      includes: ["English and Spanish menu", "Unlimited menu edits", "True-size check on every dish", "Works on iPhone and Android"],
      cta: "Get started",
    },
    faq: {
      title: "Questions",
      items: [
        ["Do guests need an app?", "No. They scan the QR code and the menu opens in the browser. On iPhone the 3D view uses Apple's built-in AR; on Android it runs right in Chrome."],
        ["How accurate is the size?", "Each model is calibrated to the plate you serve it on and rejected if it's off by more than 0.5%. On the table, accuracy depends on the phone's camera; recent phones are within a few percent."],
        ["What if my menu changes?", "Prices, descriptions and availability change from your phone in seconds. New dishes are scanned in a short visit."],
        ["Do I need special equipment?", "No. We scan with a phone, and your guests use their own."],
      ],
    },
    footer: "Real food. Real size.",
  },
  es: {
    nav: { how: "Cómo funciona", pricing: "Precios", demo: "Demo en vivo" },
    hero: {
      eyebrow: "Menús en realidad aumentada para restaurantes",
      title: ["Míralo en tu mesa", "antes de pedir."],
      body: "Tus clientes escanean el QR, tocan un plato y lo ven en 3D en su tamaño real, justo donde lo van a servir. Sin app. Sin adivinar.",
      primary: "Prueba el menú en vivo",
      secondary: "Agenda una demo",
      note: "Funciona en iPhone y Android, en inglés y español.",
      size: "Tamaño real · plato de 18 cm",
    },
    how: {
      title: "Listo en un día",
      steps: [
        { icon: ScanLine, title: "Escaneamos tus platos", body: "Tus propios platos, tal como los sirves. Cada modelo se verifica al milímetro con el plato." },
        { icon: QrCode, title: "QR en las mesas", body: "Tu menú abre en el navegador del teléfono en segundos. Nada que descargar." },
        { icon: Smartphone, title: "Lo ven en su mesa", body: "Un toque y el plato aparece frente a ellos, en tamaño real, junto a su mano." },
      ],
    },
    why: {
      title: "Un menú que vende por los ojos",
      items: [
        { icon: TrendingUp, title: "Cuentas más altas", body: "Quien ve el postre, pide el postre. Los platos premium dejan de parecer un riesgo." },
        { icon: Ruler, title: "Sin sorpresas de tamaño", body: "“¿Alcanza para compartir?” Respondido antes de pedir, con regla si la quieren." },
        { icon: Languages, title: "Inglés y español", body: "El menú sigue el idioma del teléfono. Un solo QR para todos." },
        { icon: ChefHat, title: "Tu equipo tiene el control", body: "Cambia precios, marca un plato agotado o agrega un especial desde tu teléfono." },
      ],
    },
    demos: { title: "Pruébalo ahora", body: "Abre un menú en vivo en tu teléfono y toca “Ver en tu mesa”.", open: "Abrir menú" },
    pricing: {
      title: "Precios simples",
      setup: "Instalación",
      monthlyLabel: "Mensual",
      setupBody: (n: number) => `Escaneamos hasta ${n} platos en 3D, diseñamos tu menú e imprimimos tarjetas QR para tus mesas.`,
      monthly: "al mes",
      monthlyBody: "Hosting, cambios del menú desde tu teléfono, reportes mensuales de vistas y soporte.",
      includes: ["Menú en inglés y español", "Cambios ilimitados", "Verificación de tamaño real en cada plato", "Funciona en iPhone y Android"],
      cta: "Empezar",
    },
    faq: {
      title: "Preguntas",
      items: [
        ["¿Mis clientes necesitan una app?", "No. Escanean el QR y el menú abre en el navegador. En iPhone el 3D usa la realidad aumentada de Apple; en Android funciona directo en Chrome."],
        ["¿Qué tan exacto es el tamaño?", "Cada modelo se calibra con el plato en que lo sirves y se rechaza si se desvía más de 0,5%. En la mesa, la precisión depende de la cámara del teléfono; los teléfonos recientes están dentro de unos pocos por ciento."],
        ["¿Y si cambia mi menú?", "Precios, descripciones y disponibilidad se cambian desde tu teléfono en segundos. Los platos nuevos se escanean en una visita corta."],
        ["¿Necesito equipo especial?", "No. Escaneamos con un teléfono, y tus clientes usan el suyo."],
      ],
    },
    footer: "Comida real. Tamaño real.",
  },
} as const;

// Reality Food palette: Charcoal, Ivory, Golden Yellow (+ a dark gold for text on light).
const C = {
  ink: "#191A1F", // charcoal
  cream: "#E7E7E7", // ivory
  linen: "#D9D9DB",
  stone: "#55565C", // secondary text (5.9:1 on ivory)
  tomato: "#FBB71A", // gold accent on dark
  tomatoDeep: "#8A5A00", // gold for text/icons on light (4.8:1 on ivory)
  lens: "#8A5A00",
  lensLight: "#FBB71A",
  saffron: "#FBB71A",
};

const serif = "[font-family:var(--font-fraunces),Georgia,serif] font-semibold tracking-tight";
const btn =
  "inline-flex h-12 items-center justify-center rounded-xl px-5 text-base font-bold outline-none transition-colors focus-visible:ring-4";

/** RF monogram on a Tomato plate. */
function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <circle cx="32" cy="32" r="29" fill={C.tomato} />
      <circle cx="32" cy="32" r="23.6" fill="none" stroke={C.ink} strokeWidth="1.5" opacity="0.35" />
      <g fill="none" stroke={C.ink} strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round" transform="translate(-0.6 0)">
        <path d="M17.6 44.5V19.5h8.9a6.45 6.45 0 0 1 0 12.9h-8.9M25.9 32.4l5.4 12.1" />
        <path d="M37.4 44.5V19.5h10.2M37.4 31.6h8.4" />
      </g>
    </svg>
  );
}

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark className="size-9" />
      <span className={`${serif} text-xl`} style={{ color: dark ? C.cream : C.ink }}>
        Reality <span style={{ color: dark ? C.tomato : C.tomatoDeep }}>Food</span>
      </span>
    </span>
  );
}

/** A phone showing a dish on the table, framed by AR corners and a ruler. */
function PhoneMock({ size }: { size: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="rounded-[44px] p-3 shadow-2xl" style={{ background: "#0d0f12" }}>
        <div className="relative aspect-[9/17] overflow-hidden rounded-[34px]">
          <Image src="/images/pudim-slice.jpg" alt="" fill sizes="300px" className="scale-[1.15] object-cover" preload />
          {(["left-4 top-14 border-l-4 border-t-4 rounded-tl-xl", "right-4 top-14 border-r-4 border-t-4 rounded-tr-xl", "left-4 bottom-20 border-l-4 border-b-4 rounded-bl-xl", "right-4 bottom-20 border-r-4 border-b-4 rounded-br-xl"] as const).map((pos) => (
            <span key={pos} className={`absolute size-9 ${pos}`} style={{ borderColor: C.lensLight }} />
          ))}
          <div className="absolute inset-x-10 bottom-[7.5rem] h-3 border-x-[3px]" style={{ borderColor: C.lensLight }}>
            <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2" style={{ background: C.lensLight }} />
          </div>
          <span className="absolute inset-x-0 bottom-7 mx-auto w-fit rounded-full px-3 py-1.5 text-xs font-bold" style={{ background: C.saffron, color: C.ink }}>
            {size}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Landing({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const demoHref = `/${SITE.demos[0].slug}`;
  const contactHref = SITE.salesEmail ? `mailto:${SITE.salesEmail}?subject=Reality%20Food%20demo` : demoHref;

  return (
    <div className={`${fraunces.variable} ${manrope.variable} [font-family:var(--font-manrope),system-ui,sans-serif]`} style={{ background: C.cream, color: C.ink }}>
      {/* --- Hero ------------------------------------------------------------ */}
      <header style={{ background: C.ink, color: C.cream }}>
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Wordmark dark />
          <div className="flex items-center gap-1 sm:gap-4">
            <a href="#how" className="hidden rounded-lg px-2 py-2 text-sm font-medium opacity-85 hover:opacity-100 sm:block">{t.nav.how}</a>
            <a href="#pricing" className="hidden rounded-lg px-2 py-2 text-sm font-medium opacity-85 hover:opacity-100 sm:block">{t.nav.pricing}</a>
            <LanguageSwitch current={locale} label="Language" />
          </div>
        </nav>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-8 pb-16 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-14 md:pb-24">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] uppercase" style={{ color: C.lensLight }}>{t.hero.eyebrow}</p>
            <h1 className={`${serif} mt-4 text-[2.6rem] leading-[1.04] sm:text-6xl`}>
              {t.hero.title[0]} <span style={{ color: C.tomato }}>{t.hero.title[1]}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed opacity-85">{t.hero.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={demoHref} className={btn} style={{ background: C.saffron, color: C.ink }}>{t.hero.primary}</Link>
              <a href={contactHref} className={`${btn} border`} style={{ borderColor: "#3a3f46", color: C.cream }}>{t.hero.secondary}</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm opacity-75">
              <Camera className="size-4" aria-hidden /> {t.hero.note}
            </p>
          </div>
          <PhoneMock size={t.hero.size} />
        </div>
      </header>

      <main>
        {/* --- How it works ------------------------------------------------- */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
          <h2 className={`${serif} text-3xl sm:text-4xl`}>{t.how.title}</h2>
          <ol className="mt-10 grid gap-5 md:grid-cols-3">
            {t.how.steps.map(({ icon: Icon, title, body }, i) => (
              <li key={title} className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: C.linen }}>
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-xl" style={{ background: C.ink, color: C.saffron }}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-bold" style={{ color: C.stone }}>0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 leading-relaxed" style={{ color: C.stone }}>{body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* --- Why it sells ------------------------------------------------- */}
        <section style={{ background: C.linen }}>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className={`${serif} text-3xl sm:text-4xl`}>{t.why.title}</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {t.why.items.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4 rounded-2xl p-6" style={{ background: C.cream }}>
                  <Icon className="mt-0.5 size-6 shrink-0" style={{ color: C.tomatoDeep }} aria-hidden />
                  <div>
                    <h3 className="text-lg font-bold">{title}</h3>
                    <p className="mt-1 leading-relaxed" style={{ color: C.stone }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Live demos ---------------------------------------------------- */}
        <section id="demo" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
          <h2 className={`${serif} text-3xl sm:text-4xl`}>{t.demos.title}</h2>
          <p className="mt-2 text-lg" style={{ color: C.stone }}>{t.demos.body}</p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {SITE.demos.map((demo) => (
              <Link
                key={demo.slug}
                href={`/${demo.slug}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border p-6 outline-none transition-shadow hover:shadow-lg focus-visible:ring-4"
                style={{ background: "#fff", borderColor: C.linen }}
              >
                <div>
                  <p className="text-lg font-bold">{demo.name}</p>
                  <p className="mt-1 text-sm" style={{ color: C.stone }}>{demo.note}</p>
                </div>
                <span className="shrink-0 rounded-lg px-3 py-2 text-sm font-bold" style={{ background: C.ink, color: C.saffron }}>
                  {t.demos.open} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* --- Pricing --------------------------------------------------------- */}
        <section id="pricing" className="scroll-mt-8" style={{ background: C.ink, color: C.cream }}>
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <h2 className={`${serif} text-3xl sm:text-4xl`}>{t.pricing.title}</h2>
            <div className="mt-10 grid gap-5 md:grid-cols-[1fr_1fr_1.1fr]">
              <div className="rounded-2xl p-6" style={{ background: "#26272E" }}>
                <p className="text-sm font-bold tracking-wide uppercase" style={{ color: C.lensLight }}>{t.pricing.setup}</p>
                <p className={`${serif} mt-2 text-5xl`}>${SITE.pricing.setupUsd}</p>
                <p className="mt-3 leading-relaxed opacity-80">{t.pricing.setupBody(SITE.pricing.dishesIncluded)}</p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: "#26272E" }}>
                <p className="text-sm font-bold tracking-wide uppercase" style={{ color: C.lensLight }}>{t.pricing.monthlyLabel}</p>
                <p className={`${serif} mt-2 text-5xl`}>
                  ${SITE.pricing.monthlyUsd}
                  <span className="ml-1 [font-family:var(--font-manrope)] text-base font-medium opacity-75">{t.pricing.monthly}</span>
                </p>
                <p className="mt-3 leading-relaxed opacity-80">{t.pricing.monthlyBody}</p>
              </div>
              <div className="flex flex-col justify-between rounded-2xl p-6" style={{ background: C.cream, color: C.ink }}>
                <ul className="space-y-3">
                  {t.pricing.includes.map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-5 shrink-0" style={{ color: C.lens }} aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
                <a href={contactHref} className={`${btn} mt-6 w-full`} style={{ background: C.saffron, color: C.ink }}>
                  {t.pricing.cta}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* --- FAQ ---------------------------------------------------------------- */}
        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <h2 className={`${serif} text-3xl sm:text-4xl`}>{t.faq.title}</h2>
          <div className="mt-8 divide-y rounded-2xl border" style={{ borderColor: C.linen, background: "#fff" }}>
            {t.faq.items.map(([q, a]) => (
              <details key={q} className="group p-5 [&_summary::-webkit-details-marker]:hidden" style={{ borderColor: C.linen }}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold">
                  {q}
                  <span className="text-2xl leading-none transition-transform group-open:rotate-45" style={{ color: C.lens }} aria-hidden>+</span>
                </summary>
                <p className="mt-3 leading-relaxed" style={{ color: C.stone }}>{a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer style={{ background: C.ink, color: C.cream }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-10 sm:px-6">
          <Wordmark dark />
          <p className="opacity-75">{t.footer}</p>
        </div>
      </footer>
    </div>
  );
}
