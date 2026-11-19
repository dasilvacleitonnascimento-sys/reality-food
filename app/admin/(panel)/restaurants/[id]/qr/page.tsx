import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PrintButton } from "@/components/admin/print-button";
import { Wordmark } from "@/components/admin/wordmark";
import { inputClass } from "@/components/admin/styles";
import { getRestaurant } from "@/lib/admin/data";
import { qrSvg } from "@/lib/qr";
import { SITE } from "@/lib/site";

export const metadata: Metadata = { title: "QR cards" };

const MAX_CARDS = 100;

type Props = PageProps<"/admin/restaurants/[id]/qr">;

export default function QrCardsPage(props: Props) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Making the QR cards…</p>}>
      <QrCards params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

function tableNumber(value: string | string[] | undefined, fallback: number) {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : fallback;
}

async function QrCards({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const { id } = await params;
  const query = await searchParams;
  const restaurant = await getRestaurant(id);
  const from = tableNumber(query.from, 1);
  const to = Math.min(Math.max(tableNumber(query.to, 12), from), from + MAX_CARDS - 1);
  const tables = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const cards = await Promise.all(
    tables.map(async (table) => {
      const url = `${SITE.url}/${restaurant.slug}?table=${table}`;
      return { table, url, svg: await qrSvg(url) };
    }),
  );
  const local = SITE.url.includes("localhost");

  return (
    <>
      {/* Letter paper, 4 cards per sheet. */}
      <style>{`@page { size: letter; margin: 0.4in; }`}</style>
      <div className="print:hidden">
        <Link href={`/admin/restaurants/${id}`} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">
          {restaurant.name}
        </Link>
        <h1 className="rf-serif mt-1 text-3xl">QR cards</h1>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          One card per table. Each code opens the menu with the table number on top. Print on card stock, cut on the dashed lines.
        </p>

        {!restaurant.is_published && (
          <p className="mt-4 max-w-xl rounded-xl border border-(--rf-alert) bg-(--rf-card) p-3 text-sm font-medium text-(--rf-alert)">
            This menu is hidden. The codes won&apos;t open until you mark it Live on the restaurant page.
          </p>
        )}
        {local && (
          <p className="mt-4 max-w-xl rounded-xl border border-(--rf-alert) bg-(--rf-card) p-3 text-sm font-medium text-(--rf-alert)">
            These codes point to {SITE.url} (this computer). Print from the live site so they open on any phone.
          </p>
        )}

        <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-sm font-bold">
            From table
            <input name="from" type="number" min={1} max={999} defaultValue={from} className={`${inputClass} w-28 tabular-nums`} />
          </label>
          <label className="grid gap-1.5 text-sm font-bold">
            To table
            <input name="to" type="number" min={1} max={999} defaultValue={to} className={`${inputClass} w-28 tabular-nums`} />
          </label>
          <button type="submit" className="inline-flex h-11 items-center rounded-xl bg-muted px-5 text-sm font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            Update
          </button>
          <PrintButton>Print {cards.length} cards</PrintButton>
          <a href={cards[0].url} target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center px-2 text-sm font-bold underline underline-offset-4">
            Test table {from}
          </a>
        </form>
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 print:mt-0 print:grid-cols-2 print:gap-0">
        {cards.map((card) => (
          <li
            key={card.table}
            className="flex break-inside-avoid flex-col items-center rounded-2xl border border-dashed border-(--rf-line) bg-(--rf-card) px-6 py-7 text-center text-(--rf-ink) print:h-[5.1in] print:rounded-none print:bg-transparent print:py-6"
          >
            <p className="rf-serif text-2xl leading-tight">{restaurant.name}</p>
            <p className="mt-1 text-sm font-bold tracking-widest text-(--rf-accent-text) uppercase">Table {card.table}</p>
            <div className="my-5 size-44 print:size-[2.3in] [&_svg]:size-full" role="img" aria-label={`QR code for table ${card.table}`} dangerouslySetInnerHTML={{ __html: card.svg }} />
            <p className="font-bold">Scan to see the menu in 3D</p>
            <p className="text-sm text-(--rf-muted)" lang="es">
              Escanea para ver el menú en 3D
            </p>
            <div className="mt-auto flex items-center gap-1.5 pt-5 text-xs text-(--rf-muted) [&_.rf-serif]:text-sm [&_svg]:size-5">
              <Wordmark />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
