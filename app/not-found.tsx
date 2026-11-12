import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Menu not found</h1>
      <p className="text-muted-foreground">
        This menu doesn&apos;t exist or is no longer available. Please ask your
        server for help.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-full px-4 text-sm font-medium underline-offset-4 hover:underline"
      >
        Go to homepage
      </Link>
    </main>
  );
}
