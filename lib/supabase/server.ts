// Supabase client for the admin panel on the server, acting as the signed-in
// user (session in cookies). Row Level Security decides what it can touch:
// platform admins manage everything, nobody else gets anything private.
// Never uses the secret key.

import { cookies } from "next/headers";
import { connection } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";

export async function createSupabaseServer() {
  // Admin pages are always live: mark the request dynamic before Supabase Auth
  // reads the clock (token expiry), which Next.js forbids in prerenderable work.
  await connection();
  const cookieStore = await cookies();
  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        // Server Components can't set cookies; the proxy refreshes the session instead.
        try {
          for (const { name, value, options } of toSet) cookieStore.set(name, value, options);
        } catch {}
      },
    },
  });
}
