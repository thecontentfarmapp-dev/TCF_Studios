# TCF Studios — Build Progress

## Phase 1 — Foundation ✅ COMPLETE

**Supabase schema** — all tables created and migrated to `dxxoguvlwsggpodufvpc`:
- `brands`, `creators`, `profiles`, `brand_briefs`, `seasons`, `episodes`, `scripts`, `shoot_days`, `invoices`, `publish_records`
- All enums defined: `brand_status`, `creator_status`, `season_status`, `episode_phase`, `script_status`, `shoot_status`, `invoice_type`, `invoice_status`, `brief_status`, `publish_platform`, `user_role`
- Row Level Security enabled on all tables with admin/brand/creator policies
- Auto-updated_at triggers on all tables
- Auto-create profile trigger on auth.users insert
- Seed data: Acme Co. (brand), Alice Bleathman (creator), The Ebook (30-episode season), shoot day, invoice

**Auth** — Supabase Auth with three roles via `profiles` table:
- Magic link + email/password login
- Role-based routing: admin → `/admin`, brand → `/brand`, creator → `/creator`
- `proxy.ts` guards all authenticated routes (Next.js 16 pattern)

**Admin dashboard shell** — dark cinematic theme (#0A0A0A → deep navy):
- Sidebar navigation with all 9 sections
- Home dashboard with alerts, stats, active seasons, upcoming shoots, recent invoices

## Phase 2 — Production Pipeline ✅ COMPLETE

**Admin portal pages:**
- `/admin` — dashboard with today's alerts, stats, active seasons, shoots, invoices
- `/admin/brands` — kanban pipeline (Lead → Alumni) with card view
- `/admin/brands/[id]` — brand detail with seasons and invoices
- `/admin/brands/new` — create brand form
- `/admin/creators` — roster table with all fields
- `/admin/creators/[id]` — creator detail with seasons
- `/admin/creators/new` — create creator form
- `/admin/seasons` — grid view, active vs complete
- `/admin/seasons/[id]` — season detail with episodes grouped by phase + shoot days
- `/admin/seasons/new` — create season form (auto-creates episodes)
- `/admin/episodes` — master episode tracker table
- `/admin/episodes/[id]` — episode detail with script versions
- `/admin/scripts` — all scripts, pending approval highlighted
- `/admin/shoots` — shoot day calendar with upcoming/past
- `/admin/invoices` — invoice table with overdue alerts + stats
- `/admin/invoices/new` — create invoice form
- `/admin/analytics` — performance aggregates (ready for data)

**Brand portal** — clean light professional theme:
- `/brand` — campaign overview with season hero, quick stats
- `/brand/episodes` — episode status table per season
- `/brand/approvals` — script approval with approve/request changes buttons
- `/brand/invoices` — invoice history with outstanding highlighting
- `/brand/content` — live content with performance stats

**Creator portal** — dark cinematic with gradient hero:
- `/creator` — season overview with gradient hero card
- `/creator/scripts` — scripts with inline approval actions
- `/creator/schedule` — shoot days with full detail cards
- `/creator/episodes` — episode progress with phase progress bars
- `/creator/content` — published content with performance stats

## Phase 3 — Client Portals ✅ COMPLETE (part of Phase 2)

Portal access, nav, and onboarding structure built. Email invites pending Resend integration (Phase 4).

## Phase 4 — Automation 🔜 NEXT

- Website form webhook → new brand/creator row
- Resend email integration
- Supabase Edge Functions for:
  - Script submitted → notify creator/brand
  - Script approved → advance episode phase
  - Episode picture lock → notify brand/creator
  - Episode published → schedule stats sync
  - Final episode → auto-generate final invoice
  - Overdue invoice → reminder emails
  - Overdue approval → reminder emails

## Phase 5 — Invoicing 🔜

- Stripe Invoicing integration
- Auto-generate deposit invoice on season greenlight
- Auto-generate final invoice on last episode publish
- Pay Now button in brand portal
- Webhook to update invoice status on payment

## Phase 6 — Analytics & Performance 🔜

- TikTok API integration
- Instagram Graph API integration
- Scheduled stats sync (24h, 48h, 7d, 30d post publish)
- Analytics views in admin and portals

---

## Setup Notes

**To create your admin account:**
1. Go to the app and sign in with your email
2. In Supabase dashboard → Authentication → Users, confirm the user
3. The profile will auto-create with role `admin` (default)
4. Alternatively: run the SQL below in Supabase SQL editor

```sql
-- After signing up, if role defaulted wrong:
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

**To create a brand portal user:**
```sql
-- After the brand user signs up:
UPDATE profiles 
SET role = 'brand', brand_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'jane@acmeco.com';
```

**To create a creator portal user:**
```sql
-- After the creator user signs up:
UPDATE profiles 
SET role = 'creator', creator_id = '22222222-2222-2222-2222-222222222222'
WHERE email = 'alice@example.com';
```

**Vercel deployment:**
- Repo: https://github.com/thecontentfarmapp-dev/tcf-studios-app
- Add these env vars in Vercel project settings:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_PROJECT_REF`

**Supabase Auth settings:**
- Add your Vercel deployment URL to: Authentication → URL Configuration → Site URL
- Add to Redirect URLs: `https://your-app.vercel.app/auth/callback`
