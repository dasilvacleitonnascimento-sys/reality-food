// Creates (or resets) a platform admin who can sign in at /admin.
// Prints a one-time temporary password; the admin must replace it at first sign-in.
//
//   npm run create-admin -- <email>
//
// Running it again for the same email resets the password to a new temporary one
// (use it if the password is lost). Needs SUPABASE_SECRET_KEY in .env.local.

import { randomBytes } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: npm run create-admin -- <email>");
  process.exit(1);
}
const root = path.resolve(import.meta.dirname, "..");
process.loadEnvFile(path.join(root, ".env.local"));
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}
const db = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

// 20 random characters in groups of 5, with no 0/O/1/l mix-ups when typed on a phone.
const alphabet = "abcdefghijkmnpqrstuvwxyzACDEFGHJKLMNPQRTUVWXY346789";
const password = Array.from(randomBytes(20), (b) => alphabet[b % alphabet.length]).join("").replace(/(.{5})(?!$)/g, "$1-");
const metadata = { must_change_password: true };

async function findUser() {
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`List users: ${error.message}`);
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found || data.users.length < 200) return found;
  }
}

let user = await findUser();
if (user) {
  const { data, error } = await db.auth.admin.updateUserById(user.id, { password, email_confirm: true, user_metadata: { ...user.user_metadata, ...metadata } });
  if (error) throw new Error(`Reset password: ${error.message}`);
  user = data.user;
  console.log(`Existing account: password reset.`);
} else {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata });
  if (error) throw new Error(`Create account: ${error.message}`);
  user = data.user;
  console.log(`Account created.`);
}

const { error } = await db.from("platform_admins").upsert({ user_id: user.id }, { onConflict: "user_id" });
if (error) throw new Error(`Make admin: ${error.message}`);

console.log(`\n  Email:              ${email}\n  Temporary password: ${password}\n\nSign in at /admin/login. You'll be asked to choose your own password.`);
