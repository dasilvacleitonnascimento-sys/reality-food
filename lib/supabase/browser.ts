"use client";

// Supabase client in the browser for the admin panel (photo uploads go straight
// to Storage with the signed-in admin's session). Publishable key only.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function supabaseBrowser() {
  client ??= createBrowserClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  return client;
}
