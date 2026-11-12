import Link from "next/link";
import { getDictionary } from "@/lib/i18n/dictionaries";

// not-found has no params, so it shows both languages.
export default function NotFound() {
  const en = getDictionary("en").notFound;
  const es = getDictionary("es").notFound;

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-3 px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{en.title}</h1>
      <p className="text-muted-foreground">{en.body}</p>
      <p lang="es" className="text-sm text-muted-foreground">
        {es.title}. {es.body}
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex h-11 items-center rounded-full px-4 text-sm font-medium underline-offset-4 hover:underline"
      >
        {en.home}
      </Link>
    </main>
  );
}
