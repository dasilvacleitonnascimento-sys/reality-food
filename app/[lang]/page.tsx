import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Landing } from "@/components/landing/landing";
import { isLocale } from "@/lib/i18n/config";

export async function generateMetadata(props: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  return {
    title: { absolute: "Reality Food — See it on your table before you order" },
    description:
      lang === "es"
        ? "Menús en realidad aumentada: tus clientes ven cada plato en su mesa, en tamaño real, antes de pedir."
        : "AR menus for restaurants: guests see every dish on their table, at its real size, before they order.",
  };
}

// Marketing home for restaurant owners. Diner menus live at /[restaurant-slug].
export default async function Home(props: PageProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!isLocale(lang)) notFound();
  return <Landing locale={lang} />;
}
