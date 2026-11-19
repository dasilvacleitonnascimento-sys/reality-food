import type { Metadata } from "next";
import { Suspense } from "react";
import { PasswordForm } from "@/components/admin/password-form";
import { requireAdmin } from "@/lib/admin/auth";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <>
      <h1 className="rf-serif text-3xl">Account</h1>
      <Suspense fallback={<p className="mt-4 text-muted-foreground">Loading…</p>}>
        <Account />
      </Suspense>
    </>
  );
}

async function Account() {
  const admin = await requireAdmin();
  return (
    <div className="mt-4 grid gap-6">
      {admin.mustChangePassword && (
        <p className="max-w-md rounded-xl border border-(--rf-accent-text) bg-(--rf-card) p-4 text-sm">
          <strong>Welcome.</strong> You signed in with a temporary password. Choose your own to continue.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Signed in as <span className="font-bold text-foreground">{admin.email}</span>
      </p>
      <PasswordForm />
    </div>
  );
}
