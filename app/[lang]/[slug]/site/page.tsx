import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { Phone, Ruler } from "lucide-react";
import { HeroDish } from "@/components/site/hero-dish";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { PoweredBy } from "@/components/menu/powered-by";
import { formatPlateSize, formatPrice } from "@/lib/format";
import { getMenu } from "@/lib/menu";
import { getRestaurantSite } from "@/lib/restaurant-site";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

const serifFont = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-site-serif",
});
const sansFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-site-sans",
});
const serif =
  "[font-family:var(--font-site-serif),Georgia,serif] font-normal tracking-tight";
const button =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold outline-none transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-offset-2";

export async function generateMetadata(
  props: PageProps<"/[lang]/[slug]/site">,
): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!isLocale(lang)) return {};
  const [restaurant, site] = [
    await getMenu(slug, lang),
    getRestaurantSite(slug),
  ];
  if (!restaurant || !site) return {};
  return {
    title: { absolute: restaurant.name },
    description: site.text[lang].heroBody,
  };
}

// A restaurant's own website, with its 3D menu built in.
export default function RestaurantSitePage(
  props: PageProps<"/[lang]/[slug]/site">,
) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF6EF]" />}>
      <RestaurantSite params={props.params} />
    </Suspense>
  );
}

async function RestaurantSite({
  params,
}: {
  params: PageProps<"/[lang]/[slug]/site">["params"];
}) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const [restaurant, site] = [
    await getMenu(slug, lang),
    getRestaurantSite(slug),
  ];
  if (!restaurant || !site) notFound();

  const t = site.text[lang];
  const dict = getDictionary(lang);
  const { ink, paper, accent, soft } = site.colors;
  const byId = (id: string) => restaurant.dishes.find((d) => d.id === id);
  const hero = byId(site.heroDishId);
  const featured = site.featuredDishIds
    .map(byId)
    .filter((d) => d !== undefined);
  const storyDish = byId(site.storyPhotoDishId);
  const menuHref = `/${lang}/${restaurant.slug}`;
  const plate = (cm: number) => formatPlateSize(cm).split(" (")[0];

  return (
    <div
      className={`${serifFont.variable} ${sansFont.variable} min-h-screen [font-family:var(--font-site-sans),system-ui,sans-serif]`}
      style={{ background: paper, color: ink }}
    >
      <header
        className="sticky top-0 z-20 border-b backdrop-blur"
        style={{ background: `${paper}e6`, borderColor: `${ink}14` }}
      >
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <a
            href="#top"
            className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3"
          >
            <Image
              src={restaurant.logo}
              alt=""
              width={36}
              height={36}
              unoptimized
              className="size-9 rounded-full"
            />
            <span className={`${serif} truncate text-xl`}>
              {restaurant.name}
            </span>
          </a>
          <div className="ml-auto hidden items-center gap-1 text-sm font-medium md:flex">
            {[
              [menuHref, t.nav.menu],
              ["#story", t.nav.story],
              ["#visit", t.nav.visit],
            ].map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2 opacity-80 outline-none hover:opacity-100 focus-visible:ring-3"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="ml-auto md:ml-2">
            <LanguageSwitch current={lang} label={dict.menu.language} />
          </div>
        </nav>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-16">
          <div>
            <h1
              className={`${serif} text-[2.75rem] leading-[1.02] sm:text-6xl`}
            >
              {t.heroTitle}
            </h1>
            <p className="mt-5 max-w-md text-lg opacity-80">{t.heroBody}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={menuHref}
                className={button}
                style={{ background: accent, color: "#fff" }}
              >
                {t.menuCta}
              </Link>
              <a
                href={`tel:${site.phone.tel}`}
                className={`${button} border-2`}
                style={{ borderColor: `${ink}26` }}
              >
                <Phone className="size-4" aria-hidden />
                {t.callCta}
              </a>
            </div>
          </div>

          {hero?.glbUrl && (
            <figure>
              <div className="relative">
                <div
                  className="absolute inset-[8%] rounded-full"
                  style={{ background: soft, opacity: 0.55 }}
                  aria-hidden
                />
                <HeroDish
                  glbUrl={hero.glbUrl}
                  poster={hero.photo}
                  alt={dict.dish.model3d(hero.name)}
                />
              </div>
              <figcaption className="mt-1 flex flex-col items-center gap-2 text-center">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold"
                  style={{ background: ink, color: soft }}
                >
                  <Ruler className="size-4" aria-hidden />
                  {t.trueSize(plate(hero.plateDiameterCm))}
                </span>
                <span className="text-sm opacity-70">
                  {hero.name} · {t.dragHint}
                </span>
              </figcaption>
            </figure>
          )}
        </section>

        {/* Featured dishes */}
        <section
          aria-labelledby="featured-heading"
          className="py-14"
          style={{ background: "#fff" }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="featured-heading" className={`${serif} text-4xl`}>
              {t.featuredTitle}
            </h2>
            <p className="mt-2 max-w-lg opacity-75">{t.featuredBody}</p>
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((dish) => (
                <li key={dish.id}>
                  <Link
                    href={`${menuHref}/dish/${dish.id}`}
                    className="group block overflow-hidden rounded-2xl border outline-none focus-visible:ring-4"
                    style={{ borderColor: `${ink}14`, background: paper }}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={dish.photo}
                        alt={dish.name}
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-lg font-bold leading-snug">
                          {dish.name}
                        </h3>
                        <span className="font-bold">
                          {formatPrice(dish.price)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm opacity-75">
                        {dish.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between text-sm font-bold">
                        <span
                          className="inline-flex items-center gap-1"
                          style={{ color: accent }}
                        >
                          <Ruler className="size-4" aria-hidden />
                          {dict.dish.sizeShort(
                            dish.servedIn?.kind ?? "plate",
                            plate(dish.plateDiameterCm),
                            dish.servedIn?.oz,
                          )}
                        </span>
                        {dish.glbUrl && (
                          <span className="underline underline-offset-4">
                            {t.view3d} →
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href={menuHref}
              className={`${button} mt-8`}
              style={{ background: ink, color: paper }}
            >
              {t.menuCta}
            </Link>
          </div>
        </section>

        {/* How AR works */}
        <section
          aria-labelledby="ar-heading"
          className="py-14"
          style={{ background: ink, color: paper }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="ar-heading" className={`${serif} max-w-xl text-4xl`}>
              {t.arTitle}
            </h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {t.arSteps.map(([title, body], i) => (
                <li
                  key={title}
                  className="rounded-2xl p-5"
                  style={{ background: "#ffffff0f" }}
                >
                  <span
                    className="flex size-9 items-center justify-center rounded-full font-bold"
                    style={{ background: soft, color: ink }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-1 opacity-80">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Story */}
        <section
          id="story"
          aria-labelledby="story-heading"
          className="mx-auto grid max-w-6xl scroll-mt-16 items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-2"
        >
          {storyDish && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image
                src={storyDish.photo}
                alt={storyDish.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
          <div>
            <h2 id="story-heading" className={`${serif} text-4xl`}>
              {t.storyTitle}
            </h2>
            {t.story.map((p) => (
              <p key={p} className="mt-4 text-lg opacity-80">
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* Visit */}
        <section
          id="visit"
          aria-labelledby="visit-heading"
          className="scroll-mt-16 pb-6"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div
              className="rounded-3xl p-6 sm:p-10"
              style={{ background: soft }}
            >
              <h2 id="visit-heading" className={`${serif} text-4xl`}>
                {t.visitTitle}
              </h2>
              <div className="mt-6 grid gap-8 sm:grid-cols-3">
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase opacity-70">
                    {t.hoursTitle}
                  </h3>
                  <dl className="mt-2 space-y-1">
                    {t.hours.map(([days, time]) => (
                      <div key={days} className="flex justify-between gap-4">
                        <dt className="font-medium">{days}</dt>
                        <dd>{time}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase opacity-70">
                    {t.addressTitle}
                  </h3>
                  <p className="mt-2 font-medium">{site.address}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-wide uppercase opacity-70">
                    {t.phoneTitle}
                  </h3>
                  <a
                    href={`tel:${site.phone.tel}`}
                    className="mt-2 inline-block font-medium underline underline-offset-4"
                  >
                    {site.phone.display}
                  </a>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-xs opacity-60">
              {t.demoNotice}
            </p>
          </div>
        </section>
      </main>

      <PoweredBy label={dict.menu.poweredBy} />
    </div>
  );
}
