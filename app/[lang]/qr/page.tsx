import type { Metadata } from "next";
import os from "node:os";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import QRCode from "qrcode";
import { getRestaurants } from "@/lib/demo-data";

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
  const slug = getRestaurants()[0].slug;

  const codes = await Promise.all(
    bases.flatMap((base) =>
      [`${base}/${slug}`, `${base}/${slug}?table=5`].map(async (url) => ({
        url,
        svg: await QRCode.toString(url, {
          type: "svg",
          margin: 1,
          errorCorrectionLevel: "H",
        }),
      })),
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
        {codes.map(({ url, svg }) => (
          <li key={url} className="rounded-xl border p-4">
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
