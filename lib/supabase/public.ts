import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** True when Supabase is configured (.env.local). Otherwise the app uses the demo data. */
export const hasSupabase = Boolean(url && key);

/**
 * Read-only client with the publishable key. Row Level Security limits it to
 * published menus, so it's safe on the server and in the browser.
 */
export const supabasePublic = hasSupabase
  ? createClient(url!, key!, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

/** Public URL of a file in the dish-media bucket. */
export function mediaUrl(path: string | null | undefined): string | undefined {
  if (!path || !url) return undefined;
  return `${url}/storage/v1/object/public/dish-media/${path}`;
}
