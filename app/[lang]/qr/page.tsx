import type { Metadata } from "next";
import os from "node:os";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import QRCode from "qrcode";
import { getRestaurants } from "@/lib/demo-data";
import { getRestaurantSite } from "@/lib/restaurant-site";

/** Every page worth opening on a phone: landing, each menu (with and without a table), websites, a 3D dish. */
function testPages(): { label: string; path: string }[] {
  const pages = [{ label: "Reality Food home page", path: "/" }];
  for (const r of getRestaurants()) {
    pages.push({ label: `${r.name} menu`, path: `/${r.slug}` });
    pages.push({ label: `${r.name} menu, table 5`, path: `/${r.slug}?table=5` });
    if (getRestaurantSite(r.slug)) pages.push({ label: `${r.name} website`, path: `/${r.slug}/site` });
    // First dish with 3D (so the AR button can be tested right away), plus the chocolate cake showcase.
    const in3d = r.dishes.filter((d) => d.glbUrl && d.isAvailable);
    const picks = [in3d[0], in3d.find((d) => d.id === "chocolate-cake")].filter((d, i, all) => d && all.indexOf(d) === i);
    for (const dish of picks) pages.push({ label: `${dish!.name} (3D + AR)`, path: `/${r.slug}/dish/${dish!.id}` });
  }
  return pages;
}

export const metadata: Metadata = {
  title: "Dev QR codes",
  robots: { index: false },
};

// Dev-only helper: scan these from a phone on the same Wi-Fi.
export default function QrPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Dev QR codes</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your phone must be on the same Wi-Fi as this computer.
      </p>
      <Suspense fallback={<p className="mt-6">Generating QR codes…</p>}>
        <QrCodes />
      </Suspense>
    </main>
  );
}

function getLanAddresses(): string[] {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((net) => net && net.family === "IPv4" && !net.internal)
    .map((net) => net!.address);
  // Home/office Wi-Fi is usually 192.168.x.x; list it first.
  return addresses.sort(
    (a, b) => Number(b.startsWith("192.168.")) - Number(a.startsWith("192.168.")),
  );
}

async function QrCodes() {
  const host = (await headers()).get("host") ?? "localhost:3000";
  const port = host.split(":")[1] ?? "3000";
  const lanAddresses = getLanAddresses();
  const bases = lanAddresses.length
    ? lanAddresses.map((ip) => `http://${ip}:${port}`)
    : [`http://${host}`];
  const pages = testPages();

  const codes = await Promise.all(
    bases.flatMap((base) =>
      pages.map(async ({ label, path }) => {
        const url = `${base}${path}`;
        const svg = await QRCode.toString(url, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "H",
        });
        return { label, url, svg };
      }),
    ),
  );

  return (
    <>
      {lanAddresses.length > 1 && (
        <p className="mt-4 text-sm text-muted-foreground">
          This computer has several network addresses. If the first QR does
          not open on your phone, try the next ones.
        </p>
      )}
      <ul className="mt-6 grid gap-6 sm:grid-cols-2">
        {codes.map(({ label, url, svg }) => (
          <li key={url} className="rounded-xl border p-4">
            <h2 className="mb-3 text-center font-semibold">{label}</h2>
            <div
              className="mx-auto w-56 bg-(--rf-card)"
              role="img"
              aria-label={`QR code for ${url}`}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-3 text-center font-mono text-xs break-all">{url}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
