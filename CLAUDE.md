# Reality Food — AR Menu Platform

## Product
Reality Food is a multi-tenant SaaS for restaurants. Each restaurant gets a public menu at /[restaurant-slug]. Diners scan a QR code on the table, the menu opens in the phone browser (no app download, no login), and they can tap "View on table" to see a dish as a true-to-scale 3D model in augmented reality on their table.

## Users
1. Diner: anonymous, on a phone, often on weak restaurant Wi-Fi. Must go from QR scan to menu in under 3 seconds.
2. Restaurant owner/staff: logs in to edit dishes, prices, descriptions, photos and availability, and to see analytics.
3. Super admin (me, the platform owner): creates restaurants, invites owners, uploads 3D models, generates QR codes, sees all data.

## Language
- Diner menus: English and Spanish (lib/i18n). The language follows the saved EN/ES choice, then the phone's language, then English. Restaurant content is translated in the restaurant's data.
- Owner dashboard, admin, emails and errors: US English.

## Tech stack
- Next.js (latest stable, App Router) + TypeScript (strict mode)
- Tailwind CSS + shadcn/ui for components
- Supabase: Postgres, Auth, Storage, Row Level Security
- Google <model-viewer> web component for 3D + AR (Scene Viewer / WebXR on Android, AR Quick Look on iOS)
- Deployed on Vercel
- Stripe for billing (added later)

## 3D / AR rules
- Every dish model is a .glb file. A .usdz file for iOS is optional; if missing, rely on model-viewer's automatic USDZ generation.
- AR must always show the dish at real-world size: use ar-scale="fixed". Never let users resize the dish in AR.
- Each dish stores plate_diameter_cm, used to calibrate the model's scale.
- Always show a poster image while the model loads. Lazy-load models; never load all models on page load.
- Target model size: under 5 MB per .glb.

## Code conventions
- Mobile-first. Design for a 375px-wide screen first.
- Server Components by default; Client Components only where interaction is needed.
- All database access goes through typed helpers. Generate Supabase types.
- Never expose the Supabase service role key to the browser.
- Every table has RLS enabled. A restaurant owner can only ever read/write their own restaurant's data.
- Validate all inputs with Zod.
- Keep components small and in /components; feature logic in /lib.
- Accessibility: semantic HTML, alt text, visible focus states, 4.5:1 contrast minimum.

## Working rules for Claude Code
- Before big changes, propose a plan and wait for approval.
- After each feature, run the type check and linter and fix all errors.
- Explain to me in simple terms what you built and how to test it on my phone.
- Never commit secrets. Keep secrets in .env.local and list required variables in .env.example.

## Brand
- Reality Food's own brand (landing page, owner dashboard, admin, sales material) follows docs/brand/BRAND.md: colors, fonts (Fraunces + Manrope), logo files and voice.
- Diner menus use each restaurant's own brand color, not Reality Food's.
