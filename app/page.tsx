import Link from "next/link";

// Placeholder home. The marketing landing page comes in Prompt 8.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Plate3D</h1>
      <p className="text-muted-foreground">
        Let your guests see every dish on their table in 3D before they order.
      </p>
      <Link
        href="/demo-bistro"
        className="inline-flex h-12 items-center rounded-full bg-foreground px-6 font-medium text-background outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        Try the live demo
      </Link>
    </main>
  );
}
