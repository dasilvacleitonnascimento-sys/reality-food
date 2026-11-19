import Link from "next/link";
import { Wordmark } from "@/components/admin/wordmark";
import { signOut } from "@/lib/admin/session-actions";

// Static chrome of the admin. Each page checks the session itself (requireAdmin)
// inside a Suspense boundary, so this shell renders instantly.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur print:hidden">
        <nav aria-label="Admin" className="mx-auto flex max-w-5xl items-center gap-1 px-4 py-3">
          <Link href="/admin" className="mr-auto rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <Wordmark textClassName="max-sm:sr-only" />
          </Link>
          <Link href="/admin" className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Restaurants
          </Link>
          <Link href="/admin/account" className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
            Account
          </Link>
          <form action={signOut}>
            <button type="submit" className="rounded-lg px-2.5 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-16 print:max-w-none print:p-0">
        {children}
      </main>
    </>
  );
}
