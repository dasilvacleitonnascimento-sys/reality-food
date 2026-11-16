import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { ArrowRight, Phone, Ruler } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import { LanguageSwitch } from "@/components/menu/language-switch";
import { PoweredBy } from "@/components/menu/powered-by";
import { DishShowcase, type ShowcaseDish } from "@/components/site/dish-showcase";
import { StickyMenuButton } from "@/components/site/sticky-menu-button";
import { formatPlateSize, formatPrice } from "@/lib/format";
import { getMenu } from "@/lib/menu";
import { getRestaurantSite } from "@/lib/restaurant-site";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";

const serifFont = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-site-serif" });
const sansFont = Manrope({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-site-sans" });
const serif = "[font-family:var(--font-site-serif),Georgia,serif] font-normal tracking-tight";
const button =
  "inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold outline-none transition-all duration-300 focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50";
const kicker = "text-xs font-bold tracking-[0.16em] uppercase text-(--brand-text)";

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
  const plate = (cm: number) => formatPlateSize(cm).split(" (")[0];
  const byId = (id: string) => restaurant.dishes.find((d) => d.id === id);
  const featured = site.featuredDishIds.map(byId).filter((d) => d !== undefined);
  const storyDish = byId(site.storyPhotoDishId);
  const showcase: ShowcaseDish[] = [site.heroDishId, ...site.featuredDishIds]
    .map(byId)
    .filter((d) => d !== undefined && Boolean(d.glbUrl))
    .map((d) => ({ id: d!.id, name: d!.name, glbUrl: d!.glbUrl!, sizeLabel: t.trueSize(plate(d!.plateDiameterCm)) }));
  const marquee = restaurant.dishes.filter((d) => d.isAvailable);
  let word = 0;

  return (
    <div className={`${serifFont.variable} ${sansFont.variable} min-h-screen overflow-x-clip bg-background pb-24 text-foreground [font-family:var(--font-site-sans),system-ui,sans-serif] md:pb-0`}>
      {/* Scroll progress */}
      <div className="rf-progress fixed inset-x-0 top-0 z-50 h-1 bg-(--rf-accent)" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <a href="#top" className="flex min-w-0 items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3">
            <Image src={restaurant.logo} alt="" width={36} height={36} unoptimized className="size-9 rounded-full" />
            <span className={`${serif} truncate text-xl`}>{restaurant.name}</span>
          </a>
          <div className="ml-auto hidden items-center gap-1 text-sm font-medium md:flex">
            {[
              [menuHref, t.nav.menu],
              ["#story", t.nav.story],
              ["#visit", t.nav.visit],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="rounded-lg px-3 py-2 opacity-75 transition-opacity outline-none hover:opacity-100 focus-visible:ring-3">
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
        {/* --- 3D showcase ------------------------------------------------------ */}
        <section className="relative isolate overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="rf-blob absolute -top-40 -left-32 size-[460px] rounded-full bg-(--rf-accent) opacity-15 blur-3xl" />
            <div className="rf-blob absolute top-1/3 -right-40 size-[520px] rounded-full bg-(--rf-accent-text) opacity-25 blur-3xl" style={{ animationDelay: "-7s", animationDuration: "20s" }} />
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: "linear-gradient(var(--rf-paper) 1px, transparent 1px), linear-gradient(90deg, var(--rf-paper) 1px, transparent 1px)",
                backgroundSize: "56px 56px",
                maskImage: "radial-gradient(ellipse at 50% 40%, black, transparent 75%)",
              }}
            />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pt-10 pb-14 sm:px-6 md:grid-cols-[1fr_1.1fr] md:pt-16 md:pb-20">
            <div className="text-center md:text-left">
              <h1 className={`${serif} text-[2.6rem] leading-[1.02] sm:text-6xl`}>
                {t.heroTitle.map((line, l) => (
                  <span key={line} className="block">
                    {line.split(" ").map((w) => {
                      const delay = word++ * 90;
                      return (
                        <span key={`${w}-${delay}`} className={`rf-rise inline-block ${l === 1 ? "rf-shimmer" : ""}`} style={{ animationDelay: `${delay}ms` }}>
                          {w}&nbsp;
                        </span>
                      );
                    })}
                  </span>
                ))}
              </h1>
              <p className="rf-rise mx-auto mt-5 max-w-md text-lg opacity-80 md:mx-0" style={{ animationDelay: "600ms" }}>
                {t.heroBody}
              </p>
              <div className="rf-rise mt-7 hidden flex-wrap gap-3 md:flex" style={{ animationDelay: "750ms" }}>
                <Link href={menuHref} className={`${button} group bg-(--rf-accent) text-(--rf-ink) hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-8px_var(--rf-accent)]`}>
                  {t.menuCta}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
                <a href={`tel:${site.phone.tel}`} className={`${button} border border-border hover:border-(--rf-accent) hover:text-(--rf-accent)`}>
                  <Phone className="size-4" aria-hidden />
                  {t.callCta}
                </a>
              </div>
            </div>

            {showcase.length > 0 && (
              <div className="rf-rise" style={{ animationDelay: "300ms" }}>
                <DishShowcase dishes={showcase} text={{ pick: t.pickDish, dragHint: t.dragHint, loading: dict.viewer.loading3d }} />
              </div>
            )}

            <Link href={menuHref} className={`${button} group mx-auto mt-2 w-full max-w-sm bg-(--rf-accent) text-(--rf-ink) md:hidden`}>
              {t.menuCta}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>

          {/* Dishes on the menu, scrolling */}
          <div className="border-y border-border py-5">
            <p className={`${kicker} px-4 text-center`}>{t.onTheMenu}</p>
            <div className="mt-4 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
              <ul className="rf-marquee flex w-max shrink-0 gap-3 pr-3" style={{ animationDuration: "35s" }}>
                {[...marquee, ...marquee, ...marquee].map((dish, i) => (
                  <li key={`${dish.id}-${i}`} aria-hidden={i >= marquee.length} className="flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-card py-1.5 pr-4 pl-1.5">
                    <span className="relative size-9 overflow-hidden rounded-full">
                      <Image src={dish.photo} alt="" fill sizes="36px" className="object-cover" />
                    </span>
                    <span className="text-sm font-bold whitespace-nowrap">{dish.name}</span>
                    <span className="text-sm whitespace-nowrap text-(--brand-text)">{formatPrice(dish.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* --- Featured dishes ---------------------------------------------------- */}
        <section aria-labelledby="featured-heading" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <Reveal>
            <h2 id="featured-heading" className={`${serif} text-4xl sm:text-5xl`}>{t.featuredTitle}</h2>
            <p className="mt-3 max-w-lg opacity-75">{t.featuredBody}</p>
          </Reveal>
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((dish, i) => (
              <Reveal as="li" key={dish.id} delay={i * 130}>
                <Link href={`${menuHref}/dish/${dish.id}`} className="rf-lift group block h-full overflow-hidden rounded-3xl border border-border bg-card outline-none focus-visible:ring-4 focus-visible:ring-(--rf-accent)/50">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={dish.photo} alt={dish.name} fill sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-110" />
                    <span className="absolute top-3 left-3 rounded-full bg-(--rf-ink)/80 px-2.5 py-1 text-xs font-bold text-(--rf-accent) backdrop-blur">3D · AR</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg leading-snug font-bold">{dish.name}</h3>
                      <span className="font-bold text-(--brand-text)">{formatPrice(dish.price)}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm opacity-70">{dish.description}</p>
                    <div className="mt-4 flex items-center justify-between text-sm font-bold">
                      <span className="inline-flex items-center gap-1 text-(--brand-text)">
                        <Ruler className="size-4" aria-hidden />
                        {dict.dish.sizeShort(dish.servedIn?.kind ?? "plate", plate(dish.plateDiameterCm), dish.servedIn?.oz)}
                      </span>
                      {dish.glbUrl && (
                        <span className="inline-flex items-center gap-1">
                          {t.view3d}
                          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* --- How AR works ---------------------------------------------------------- */}
        <section aria-labelledby="ar-heading" className="relative isolate overflow-hidden bg-(--rf-deep) py-20">
          <div aria-hidden className="rf-blob absolute -right-32 -bottom-40 -z-10 size-[440px] rounded-full bg-(--rf-accent) opacity-10 blur-3xl" />
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <h2 id="ar-heading" className={`${serif} max-w-xl text-4xl sm:text-5xl`}>{t.arTitle}</h2>
            </Reveal>
            <ol className="mt-10 grid gap-4 sm:grid-cols-3">
              {t.arSteps.map(([title, body], i) => (
                <Reveal as="li" key={title} delay={i * 150}>
                  <div className="rf-lift h-full rounded-3xl border border-border bg-card p-6">
                    <span className="rf-pulse flex size-11 items-center justify-center rounded-full bg-(--rf-accent) text-lg font-bold text-(--rf-ink)" style={{ animationDelay: `${i * 300}ms` }}>
                      {i + 1}
                    </span>
                    <h3 className="mt-5 text-xl font-bold">{title}</h3>
                    <p className="mt-1.5 opacity-75">{body}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        {/* --- Story ------------------------------------------------------------------- */}
        <section id="story" aria-labelledby="story-heading" className="mx-auto grid max-w-6xl scroll-mt-16 items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
          {storyDish && (
            <Reveal>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
                <Image src={storyDish.photo} alt={storyDish.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="rf-zoom-slow object-cover" />
              </div>
            </Reveal>
          )}
          <Reveal delay={150}>
            <p className={kicker}>{restaurant.name}</p>
            <h2 id="story-heading" className={`${serif} mt-3 text-4xl sm:text-5xl`}>{t.storyTitle}</h2>
            {t.story.map((p) => (
              <p key={p} className="mt-4 text-lg opacity-80">{p}</p>
            ))}
          </Reveal>
        </section>

        {/* --- Visit -------------------------------------------------------------------- */}
        <section id="visit" aria-labelledby="visit-heading" className="scroll-mt-16 pb-10">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <Reveal>
              <div className="rf-glow-border rounded-3xl">
                <div className="rounded-3xl bg-card p-6 sm:p-10">
                  <h2 id="visit-heading" className={`${serif} text-4xl`}>{t.visitTitle}</h2>
                  <div className="mt-6 grid gap-8 sm:grid-cols-3">
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-(--brand-text) uppercase">{t.hoursTitle}</h3>
                      <dl className="mt-2 space-y-1">
                        {t.hours.map(([days, time]) => (
                          <div key={days} className="flex justify-between gap-4">
                            <dt className="font-medium">{days}</dt>
                            <dd className="opacity-80">{time}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-(--brand-text) uppercase">{t.addressTitle}</h3>
                      <p className="mt-2 font-medium">{site.address}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-wide text-(--brand-text) uppercase">{t.phoneTitle}</h3>
                      <a href={`tel:${site.phone.tel}`} className="mt-2 inline-flex items-center gap-2 font-medium underline underline-offset-4">
                        <Phone className="size-4" aria-hidden />
                        {site.phone.display}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
            <p className="mt-6 text-center text-xs opacity-55">{t.demoNotice}</p>
          </div>
        </section>
      </main>

      <PoweredBy label={dict.menu.poweredBy} />
      <StickyMenuButton href={menuHref} label={t.menuCta} />
    </div>
  );
}
