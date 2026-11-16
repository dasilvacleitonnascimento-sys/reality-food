import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Box, MapPin, Phone, Ruler } from "lucide-react";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { PoweredBy } from "@/components/menu/powered-by";
import { DishShowcase, type ShowcaseDish } from "@/components/site/dish-showcase";
import { StickyMenuButton } from "@/components/site/sticky-menu-button";
import { formatPlateSize, formatPrice } from "@/lib/format";
import { getMenu } from "@/lib/menu";
import { getRestaurantSite } from "@/lib/restaurant-site";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

const button =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold outline-none transition-[color,background-color,border-color,filter] focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50";
const primary = `${button} bg-(--rf-accent) text-(--rf-ink) hover:brightness-105 active:brightness-95`;
const sectionTitle = "rf-serif text-4xl leading-[1.08] sm:text-5xl";

export async function generateMetadata(props: PageProps<"/[lang]/[slug]/site">): Promise<Metadata> {
  const { lang, slug } = await props.params;
  if (!isLocale(lang)) return {};
  const [restaurant, site] = [await getMenu(slug, lang), getRestaurantSite(slug)];
  if (!restaurant || !site) return {};
  return { title: { absolute: restaurant.name }, description: site.text[lang].heroBody };
}

// A restaurant's own website, with its 3D menu built in. Colors: app/globals.css.
export default function RestaurantSitePage(props: PageProps<"/[lang]/[slug]/site">) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <RestaurantSite params={props.params} />
    </Suspense>
  );
}

async function RestaurantSite({ params }: { params: PageProps<"/[lang]/[slug]/site">["params"] }) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const [restaurant, site] = [await getMenu(slug, lang), getRestaurantSite(slug)];
  if (!restaurant || !site) notFound();

  const t = site.text[lang];
  const dict = getDictionary(lang);
  const menuHref = `/${lang}/${restaurant.slug}`;
  const dishHref = (id: string) => `${menuHref}/dish/${id}`;
  const plate = (cm: number) => formatPlateSize(cm).split(" (")[0];
  const byId = (id: string) => restaurant.dishes.find((d) => d.id === id);
  const featured = site.featuredDishIds.map(byId).filter((d) => d !== undefined);
  const storyDish = byId(site.storyPhotoDishId);
  const showcase: ShowcaseDish[] = [site.heroDishId, ...site.featuredDishIds]
    .map(byId)
    .filter((d) => d !== undefined && Boolean(d.glbUrl))
    .map((d) => ({ id: d!.id, name: d!.name, glbUrl: d!.glbUrl!, sizeLabel: t.trueSize(plate(d!.plateDiameterCm)), plateCm: d!.plateDiameterCm }));
  const onTheMenu = restaurant.dishes.filter((d) => d.isAvailable && d.photo);
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`;

  return (
    <div className="min-h-screen overflow-x-clip bg-background pb-24 text-foreground md:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <a href="#main" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Image src={restaurant.logo} alt="" width={36} height={36} unoptimized className="size-9 rounded-full" />
            <span className="rf-serif truncate text-xl">{restaurant.name}</span>
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
                className="rounded-lg px-3 py-2 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
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

      <main id="main">
        {/* --- Hero: the restaurant's own dishes in 3D, at true size ------------------ */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-10 pb-12 sm:px-6 md:grid-cols-[1fr_1.1fr] md:pt-16 md:pb-20">
          <div className="text-center md:text-left">
            <h1 className="rf-serif text-[2.6rem] leading-[1.04] sm:text-6xl">
              {t.heroTitle.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-muted-foreground md:mx-0">{t.heroBody}</p>
            <div className="mt-7 hidden flex-wrap gap-3 md:flex">
              <Link href={menuHref} className={primary}>
                <Box className="size-5" aria-hidden />
                {t.menuCta}
              </Link>
              <a href={`tel:${site.phone.tel}`} className={`${button} border border-border hover:border-(--rf-accent)`}>
                <Phone className="size-4" aria-hidden />
                {t.callCta}
              </a>
            </div>
          </div>

          {showcase.length > 0 && (
            <DishShowcase dishes={showcase} text={{ pick: t.pickDish, dragHint: t.dragHint, loading: dict.viewer.loading3d }} />
          )}

          <Link href={menuHref} className={`${primary} mx-auto w-full max-w-sm md:hidden`}>
            <Box className="size-5" aria-hidden />
            {t.menuCta}
          </Link>
        </section>

        {/* --- Today's dishes: a row the guest can swipe, each one opens in 3D -------- */}
        <section aria-labelledby="today-heading" className="border-y border-border py-6">
          <h2 id="today-heading" className="mx-auto max-w-6xl px-4 text-lg font-bold sm:px-6">
            {t.onTheMenu}
          </h2>
          <ul className="mx-auto mt-4 flex max-w-6xl snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:thin] sm:scroll-px-6 sm:px-6">
            {onTheMenu.map((dish) => (
              <li key={dish.id} className="shrink-0 snap-start">
                <Link
                  href={dishHref(dish.id)}
                  className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5 outline-none transition-colors hover:border-(--rf-accent) focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="relative size-9 shrink-0 overflow-hidden rounded-full">
                    <Image src={dish.photo} alt="" fill sizes="36px" className="object-cover" />
                  </span>
                  <span className="text-sm font-bold whitespace-nowrap">{dish.name}</span>
                  <span className="text-sm whitespace-nowrap text-(--brand-text) tabular-nums">{formatPrice(dish.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* --- Featured dishes ---------------------------------------------------------- */}
        <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 id="featured-heading" className={sectionTitle}>{t.featuredTitle}</h2>
          <p className="mt-3 max-w-lg text-muted-foreground">{t.featuredBody}</p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((dish) => (
              <li key={dish.id}>
                <Link
                  href={dishHref(dish.id)}
                  className="group block h-full overflow-hidden rounded-2xl border border-border bg-card outline-none transition-colors hover:border-(--rf-accent)/70 focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Image src={dish.photo} alt={dish.name} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                    {dish.glbUrl && (
                      <span className="absolute top-3 left-3 rounded-md bg-(--rf-accent) px-2 py-0.5 text-xs font-bold text-(--rf-ink)">3D</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="rf-serif min-w-0 text-xl leading-snug break-words">{dish.name}</h3>
                      <span className="shrink-0 font-bold text-(--brand-text) tabular-nums">{formatPrice(dish.price)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{dish.description}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm font-bold">
                      <span className="inline-flex items-center gap-1 text-(--brand-text)">
                        <Ruler className="size-4" aria-hidden />
                        {dict.dish.sizeShort(dish.servedIn?.kind ?? "plate", plate(dish.plateDiameterCm), dish.servedIn?.oz)}
                      </span>
                      {dish.glbUrl && <span className="underline-offset-4 group-hover:underline">{t.view3d}</span>}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* --- How AR works: a real sequence, so the steps are numbered ---------------- */}
        <section aria-labelledby="ar-heading" className="bg-(--rf-deep) py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 id="ar-heading" className={`${sectionTitle} max-w-xl`}>{t.arTitle}</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-3 sm:gap-8">
              {t.arSteps.map(([title, body], i) => (
                <li key={title} className="border-t border-border pt-5">
                  <span className="rf-serif block text-5xl leading-none text-(--rf-accent) tabular-nums" aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{title}</h3>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* --- Story ------------------------------------------------------------------- */}
        <section id="story" aria-labelledby="story-heading" className="mx-auto grid max-w-6xl scroll-mt-20 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
          {storyDish && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
              <Image src={storyDish.photo} alt={storyDish.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
          )}
          <div className="max-w-prose">
            <h2 id="story-heading" className={sectionTitle}>{t.storyTitle}</h2>
            {t.story.map((p) => (
              <p key={p} className="mt-4 text-lg leading-relaxed text-muted-foreground">{p}</p>
            ))}
          </div>
        </section>

        {/* --- Visit -------------------------------------------------------------------- */}
        <section id="visit" aria-labelledby="visit-heading" className="scroll-mt-20 pb-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-10">
              <h2 id="visit-heading" className="rf-serif text-4xl">{t.visitTitle}</h2>
              <div className="mt-8 grid gap-8 sm:grid-cols-3">
                <div>
                  <h3 className="text-sm font-bold text-(--brand-text)">{t.hoursTitle}</h3>
                  <dl className="mt-2 space-y-1">
                    {t.hours.map(([days, time]) => (
                      <div key={days} className="flex justify-between gap-4">
                        <dt className="font-medium">{days}</dt>
                        <dd className="text-muted-foreground tabular-nums">{time}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-(--brand-text)">{t.addressTitle}</h3>
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex gap-2 rounded font-medium underline underline-offset-4 outline-none hover:text-(--brand-text) focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <MapPin className="mt-1 size-4 shrink-0" aria-hidden />
                    {site.address}
                  </a>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-(--brand-text)">{t.phoneTitle}</h3>
                  <a
                    href={`tel:${site.phone.tel}`}
                    className="mt-2 inline-flex items-center gap-2 rounded font-medium underline underline-offset-4 outline-none hover:text-(--brand-text) focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Phone className="size-4" aria-hidden />
                    <span className="tabular-nums">{site.phone.display}</span>
                  </a>
                </div>
              </div>
            </div>
            <p className="mt-6 text-center text-xs text-muted-foreground">{t.demoNotice}</p>
          </div>
        </section>
      </main>

      <PoweredBy label={dict.menu.poweredBy} />
      <StickyMenuButton href={menuHref} label={t.menuCta} />
    </div>
  );
}
