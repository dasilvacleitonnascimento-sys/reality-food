import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/login-form";
import { Wordmark } from "@/components/admin/wordmark";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-16">
      <Wordmark />
      <div>
        <h1 className="rf-serif text-3xl">Sign in to the admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Restaurants, menus and QR cards for Reality Food.</p>
      </div>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
