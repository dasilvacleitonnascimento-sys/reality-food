# Supabase setup (Prompt 2)

1. Create a free account at supabase.com (sign in with GitHub or Google).
2. New organization **Reality Food** (Free plan) → New project **reality-food**,
   region **East US (North Virginia)**. Generate the database password and keep it
   in a password manager. Nobody else needs it.
3. **SQL Editor** → New query → paste `supabase/migrations/0001_init.sql` → Run.
   This creates the tables, the security rules (RLS) and the `dish-media` storage bucket.
4. **Project Settings → Data API**: copy the Project URL.
   **Project Settings → API Keys**: copy the publishable key and the secret key.
5. In the project folder, copy `.env.example` to `.env.local` and paste the three values.
   The secret key stays only in `.env.local` (it is git-ignored).
6. Make yourself a platform admin: Authentication → Users → invite or sign up your
   e-mail, copy your user id, then in SQL Editor:

   ```sql
   insert into public.platform_admins (user_id) values ('<your-user-id>');
   ```

What happens next (Claude Code): seed the two demo restaurants from `lib/demo-data.ts`,
upload their models to Storage, and switch the menu pages to read from Supabase.
