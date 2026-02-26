# CLAUDE.md - AI Context for toilanguoisaigon

This file provides context for AI assistants working on this codebase. Read this before making changes.

## Project Overview

**Tôi là người Sài Gòn** is a Vietnamese food and culture discovery platform for Ho Chi Minh City. It's a Next.js 16 App Router project with Supabase backend, deployed on Vercel.

**All user-facing text must be in Vietnamese with proper diacritics** (e.g., "Không thể tải", not "Khong the tai").

## Tech Stack

- **Next.js 16** (App Router, NOT Pages Router)
- **TypeScript** (strict: false in tsconfig.json)
- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- **TanStack React Query v5** for data fetching
- **shadcn/ui** (49 components in `src/components/ui/`)
- **Tailwind CSS 3** with custom `vietnam-*` color palette
- **React Hook Form + Zod** for forms
- **TipTap** rich text editor for blog posts (`@tiptap/react` + extensions)
- **next-themes** for dark mode
- **ESLint 9** flat config (`eslint.config.mjs`)

## Architecture Decisions

### Client-heavy rendering
Almost all pages are `"use client"` (25/29). This is intentional - the app relies on Supabase client-side queries via React Query. Server components are only used for layouts and metadata.

### Two Supabase client files
- `src/lib/supabase/client.ts` - **Canonical** browser client using `createBrowserClient` from `@supabase/ssr`
- `src/integrations/supabase/client.ts` - **Lazy singleton proxy** for backward compatibility. Most hooks import from here: `import { supabase } from '@/integrations/supabase/client'`
- `src/lib/supabase/server.ts` - Server client for server components/API routes
- `src/lib/supabase/middleware.ts` - Session update logic used by `middleware.ts`

**Do NOT create a third client file.** Use the integration proxy for client components and the server client for server-side code.

### Path alias
`@/*` maps to `./src/*` (configured in `tsconfig.json`). Always use `@/` imports, never relative paths like `../../`.

### State management
- **React Query** for all server state (60+ hooks in `src/hooks/data/`)
- **AuthContext** (`src/contexts/AuthContext.tsx`) for auth state (session, user, profile, role)
- No Redux, Zustand, or other state libraries

### Constants
All hardcoded values are centralized in `src/utils/constants.ts`:
- `FALLBACK_IMAGES` - Fallback images for locations, collections, hero, OG
- `SITE_CONFIG` - Site name, email, URL
- `FEATURED_COLLECTIONS` - Pinned collections on homepage with optional override images

**When adding new fallback URLs or site-wide config, add them here.**

## Key Files to Know

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout, global metadata, `<Providers>`, `<WebsiteJsonLd>` |
| `app/(public)/layout.tsx` | Public layout: Header + Footer + CookieConsent |
| `app/(public)/page.tsx` | Homepage (hero, mystery cards, collections, locations, blog) |
| `src/components/providers.tsx` | QueryClientProvider + ThemeProvider + Toaster |
| `src/contexts/AuthContext.tsx` | Auth state with race condition guards |
| `src/types/database.ts` | All TypeScript interfaces for DB tables |
| `src/utils/constants.ts` | Centralized constants (images, config, featured) |
| `src/utils/sanitize.ts` | HTML sanitizer for blog content (XSS prevention) |
| `src/utils/image.ts` | Supabase image transform helpers |
| `middleware.ts` | Route protection (protected + admin paths) |
| `next.config.ts` | Image remotePatterns (Supabase, Unsplash, dyad.ai) |

## Route Structure

```
(public)/           - No auth required
(protected)/        - Requires login (redirects to /login)
admin/              - Requires login (admin role checked in UI)
auth/callback       - Supabase auth callback
```

Middleware handles redirect to `/login?redirectTo=...` for protected/admin routes when no user session exists.

## Data Flow Pattern

All data hooks follow this pattern:
```typescript
// src/hooks/data/useLocations.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLocations = (options) => {
  return useQuery({
    queryKey: ['locations', options],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*')...
      if (error) throw error;
      return data;
    },
  });
};
```

Mutations use `useMutation` + `queryClient.invalidateQueries()` + toast notifications.

## Admin Hooks Typing

All admin CRUD hooks are properly typed using database interfaces:
- Create hooks: `Omit<Entity, 'id' | 'created_at' | ...>` (exported as `Create*Data` types)
- Update hooks: `{ id: string } & Partial<Omit<Entity, 'id' | 'created_at' | ...>>`
- All form handlers are typed with exported Zod-inferred types (e.g., `BadgeFormValues`, `PostFormValues`)
- **0 `any` usages remaining** — all 30 `no-explicit-any` warnings have been resolved

## Image Handling

- All public-facing images use `next/image` (`<Image>`) for optimization
- Only exception: `src/components/admin/locations/LocationForm.tsx` uses `<img>` for file upload preview (acceptable)
- Supabase storage images are transformed via `getTransformedImageUrl()` from `src/utils/image.ts`
- Fallback images use constants from `src/utils/constants.ts`
- Remote patterns configured in `next.config.ts`: Supabase, Unsplash, dyad.ai

## SEO

- Root layout has full metadata (title template, OG, Twitter, icons, alternates)
- Dynamic routes have `generateMetadata` in layout files:
  - `app/(public)/place/[slug]/layout.tsx`
  - `app/(public)/blog/[slug]/layout.tsx`
  - `app/(public)/collection/[slug]/layout.tsx`
- Static pages have metadata exports (about, privacy, terms)
- `app/sitemap.ts` generates dynamic sitemap from DB
- `src/components/seo/JsonLd.tsx` provides WebSite + SearchAction structured data

## Security

- **NEVER hardcode secrets, API keys, or tokens in source code.** All credentials must use environment variables (`process.env` in TS, `os.environ` in Python). This includes Supabase keys, Gemini API keys, and personal access tokens.
- Blog HTML content is sanitized via `sanitizeHtml()` before rendering with `dangerouslySetInnerHTML`
- Duplicate review prevention (checks existing review before insert)
- Environment variables validated at runtime in all 3 Supabase client files
- Route protection via middleware (session check) + UI-level role check for admin

## Auth Race Condition Fix

`AuthContext.tsx` uses a `requestIdRef` + `isStale()` callback pattern to prevent stale async callbacks from overwriting fresh state when auth state changes rapidly. The `fetchProfileAndRole` function accepts an `isStale` parameter and bails out between async operations if superseded.

## Supabase Edge Function

`supabase/functions/gemini-assistant/index.ts` is a **Deno Edge Function** that calls Google Gemini AI. It has persistent TypeScript errors in the IDE because:
- It uses Deno imports (`https://deno.land/std@...`)
- It accesses `Deno.env`
- The project tsconfig excludes `supabase/` directory

**These errors are expected. Do not try to fix them.**

## Known Limitations / Deferred Items

1. **`strict: false` in tsconfig.json** - Enabling strict mode would require significant refactoring. Deferred.
2. **Supabase Edge Function TS errors** - Deno runtime, not fixable in project tsconfig.
3. **Custom SMTP not configured** - Supabase default SMTP is rate-limited. Must configure Resend/SendGrid via Supabase Dashboard → Auth → Email before launch.

## Python Scripts

One-time data scripts in `scripts/` use environment variables for all credentials:

```bash
# Required env vars for scripts:
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
export SUPABASE_ACCESS_TOKEN="your-personal-access-token"
export SUPABASE_PROJECT_REF="your-project-ref"
export GEMINI_API_KEY="your-gemini-api-key"
```

| Script | Purpose |
|--------|---------|
| `seed-categories-tags.py` | Seed 20 categories + 33 tags + auto-assign locations via keyword matching |
| `patch-unmatched-categories.py` | Expanded keywords to catch remaining unmatched locations |
| `generate-category-artwork.py` | Generate 12 watercolor category artwork via Gemini AI → Supabase Storage |
| `generate-collection-covers.py` | Generate 18 collection covers via Gemini AI → Supabase Storage + update DB |

**When writing new scripts, always read credentials from `os.environ`, never hardcode them.**

## Development Commands

```bash
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build (includes typecheck)
npm run start      # Production server
npm run lint       # ESLint (app/ + src/)
npx tsc --noEmit   # TypeScript check only
```

## CI Pipeline

`.github/workflows/ci.yml` runs on push/PR to main:
1. `npm run lint` - ESLint
2. `npx tsc --noEmit` - TypeScript check
3. `npm run build` - Production build

## File Naming Conventions

- Pages: `page.tsx` (Next.js convention)
- Layouts: `layout.tsx`
- Error boundaries: `error.tsx`
- Hooks: `use[Action][Entity].ts` (e.g., `useCreateLocation.ts`, `useAdminPosts.ts`)
- Components: PascalCase (e.g., `SearchResultCard.tsx`, `MysteryCard.tsx`)
- Utils: camelCase (e.g., `formatters.ts`, `sanitize.ts`)

## Color Palette

Custom Tailwind colors defined in `tailwind.config.ts`:
- `vietnam-red-*` - Primary brand color (CTAs, highlights)
- `vietnam-blue-*` - Secondary (text, backgrounds)
- `vietnam-gold-*` - Accent (badges, ratings, special)

## What Was Done (Changelog)

### Phase 1: SEO
- Root layout metadata with Vietnamese diacritics, locale, siteName, alternates
- `generateMetadata` for dynamic routes (place, blog, collection)
- Static metadata for about, privacy, terms
- `app/sitemap.ts` - dynamic sitemap from DB
- `robots.txt` with Sitemap directive
- `JsonLd.tsx` with WebSite + SearchAction structured data

### Phase 2: Content
- Full rewrite: privacy (9 sections), terms (12 sections), FAQ (14 items)
- Contact form with Supabase backend + mailto fallback + validation

### Phase 3: Security
- HTML sanitizer for blog content (`sanitize.ts`)
- Duplicate review prevention
- Error boundaries for all 3 route groups

### Phase 4: Features
- Search: pagination, category filter, Suspense boundary
- Homepage: dynamic stats from DB (useStats hook)
- Place detail: "Write Review" scrolls to review section

### Phase 5-6: Architecture & Features
- Dark mode (next-themes ThemeProvider + ThemeToggle)
- Cookie consent banner (localStorage)
- Responsive admin sidebar (Sheet/hamburger on mobile)

### Phase 7: DevOps & Cleanup
- CI pipeline (`.github/workflows/ci.yml`)
- Deleted dead code: AI_RULES.md, dist/, PageMeta.tsx, AdminRoute, ProtectedRoute, AdminLayout

### Playlist → Bộ sưu tập Merge
- Removed separate "Playlist" nav, listing page, and admin page
- Unified `/collections` page shows both manual collections and AI playlists
- Restyled `/playlist/[slug]` detail page to match collection detail style
- Merged AI generate UI into `/admin/collections`
- Deleted: PlaylistCard component, usePlaylists hook, /playlists page, /admin/playlists page
- Updated sitemap to remove /playlists listing entry

### Production Readiness
- **Admin middleware role check**: Middleware now queries `user_roles` table to verify admin role before allowing `/admin` access (not just auth check)
- **RLS policies**: SQL migration ready (`supabase/migrations/20260226_rls_policies.sql`) with `is_admin()` helper function and policies for all 14 tables. **Must be applied via Supabase Dashboard SQL Editor before launch.**
- **Vercel Analytics + Speed Insights**: Integrated in root layout for traffic and Web Vitals monitoring
- **Console logs cleanup**: Removed all 62 `console.error/log` from app/src (hooks, contexts, pages, utils). Errors are surfaced via toast notifications or React Query error states.
- **Automated tests**: Vitest configured with tests for `sanitize.ts`, `formatters.ts`, and `constants.ts`
- **Email SMTP**: Supabase default SMTP is rate-limited and unsuitable for production. Configure custom SMTP (Resend, SendGrid, etc.) via Supabase Dashboard → Auth → Email before launch.

### Code Audit Fixes
- JSON.parse try/catch in admin pages
- Division by zero fix in admin dashboard
- Clipboard.writeText promise handling
- Vietnamese-safe slugify (NFD normalization)
- Centralized constants (FALLBACK_IMAGES, SITE_CONFIG, FEATURED_COLLECTIONS)
- Applied constants to all 8+ consumer files
- next/image migration (16 public `<img>` -> `<Image>`)
- AuthContext race condition fix (requestIdRef + isStale guard)
- Middleware env var validation (removed non-null assertions)
- Typed 14 `any` usages in admin hooks with proper Omit/Partial types
- Removed unused imports/exports across codebase
- Memory leak fix (URL.revokeObjectURL in LocationForm)
- Aria-labels for accessibility (social links, buttons)
- ESLint flat config (TypeScript + React Hooks rules)
- signOut error handling in AuthContext

### Gamification System
- **DB tables**: `user_xp_logs`, `user_badges`, `daily_checkins` with RLS policies
- **DB functions**: `award_xp(user_id, action_name, metadata)` — atomic XP award + auto level-up; `daily_checkin(user_id)` — check-in + streak + XP
- **XP actions**: `CREATE_REVIEW` (25), `SAVE_LOCATION` (3), `SUBMIT_LOCATION` (10), `DAILY_CHECKIN` (10), `CHECKIN_STREAK_BONUS` (5/day)
- **10 badges** seeded with criteria: review count, saved count, submission count, streak milestones, level milestones
- **Hooks**: `useAwardXp`, `useDailyCheckin`, `useCheckinStatus`, `useCheckinHistory`, `useUserBadges`, `useXpHistory`, `useBadgeEvaluator`
- **XP wired into actions**: Review submission (+25 XP), save location (+3 XP), submit location (+10 XP)
- **Daily check-in UI**: Homepage banner + profile page, streak tracking, streak bonus XP
- **Profile page**: Badges display, XP history tab, daily check-in widget
- **AuthContext**: Added `refreshProfile()` to update XP/level in real-time after actions

### UI/Image Optimization
- **Avatar fix**: Fixed `src=""` → `undefined` in 4 files to prevent broken image flash
- **Dark mode hidden**: Removed ThemeToggle from Header, forced light theme via `forcedTheme="light"`
- **Collection hero**: Uses own `cover_image_url` instead of always fallback; replaced CSS `backgroundImage` with `next/Image fill`
- **Playlist hero**: Same CSS bg → `next/Image` optimization
- **Gallery layout**: Single image gets full-width hero instead of awkward grid; "Xem tất cả ảnh" only shown when >2 images
- **Blog detail fallback**: Shows fallback image when `cover_image_url` is null (was hiding cover entirely)
- **Category artwork**: 12 AI-generated watercolor illustrations (phở, bún, cơm, bánh mì, cà phê, ốc, lẩu, chè, hủ tiếu, chay, nhậu, default) stored in Supabase Storage `location-images/category-artwork/`
- **Smart fallback**: `getCategoryArtwork(locationName)` matches location names to food categories via keywords; falls back to default Saigon scene
- **Artwork message**: Places without real photos show overlay: "Chúng tôi muốn giữ sự bất ngờ để trải nghiệm của bạn được trọn vẹn"
- **Review photo upload**: `image_urls` column on reviews, `review-images` storage bucket, upload UI (up to 5 photos, 5MB each), photo display in review cards with lightbox

### Comprehensive Admin Panel
- **New CRUD pages**: Categories (`/admin/categories`), Tags (`/admin/tags`), Collection Categories (`/admin/collection-categories`) — full create/read/update/delete with forms, data tables, delete confirmation
- **Enhanced Dashboard**: Additional stat cards (total XP, daily check-ins, saved locations), recent activity feed (reviews + submissions timeline), quick action buttons, top 5 locations by reviews
- **Activity page** (`/admin/activity`): 3-tab view — XP logs, daily check-ins, user badges earned — with user avatars and formatted dates
- **Analytics page** (`/admin/analytics`): Location distribution by district, reviews/registrations by month, top 10 reviewers
- **Saved Locations page** (`/admin/saved-locations`): Ranked table of most-saved locations
- **Review moderation**: Edit reviews (rating + comment), view review photos with lightbox navigation
- **Playlist editing**: Edit title, description, cover image, mood, emoji for AI playlists
- **Grouped sidebar**: Navigation organized into 5 groups (Tổng quan, Nội dung, Phân loại, Gamification, Quản trị) with section headers
- **Bug fix**: `useUpdateUserRole` changed from `.update()` to `.upsert()` to handle new users without existing role rows
- **Admin pages**: 20 total (was 11) — `/admin`, `/admin/locations`, `/admin/import-maps`, `/admin/users`, `/admin/posts`, `/admin/collections`, `/admin/reviews`, `/admin/submissions`, `/admin/levels`, `/admin/xp-actions`, `/admin/badges`, `/admin/categories`, `/admin/tags`, `/admin/collection-categories`, `/admin/activity`, `/admin/analytics`, `/admin/saved-locations`

### Categories, Tags & Data Enrichment (Phase 7A)
- **20 food categories** seeded: Phở, Bún, Cơm, Bánh mì, Cà phê, Ốc & Hải sản, Lẩu & Nướng, Chè & Tráng miệng, Hủ tiếu & Mì, Chay, Nhậu & Bia, Bánh canh, Cháo, Bánh cuốn, Xôi, Gỏi cuốn & Nem, Nhà hàng, Kem & Gelato, Nước uống & Sinh tố, Món quốc tế
- **33 tags** seeded: meal times (ăn sáng/trưa/tối/khuya), styles (bình dân, sang trọng, vỉa hè), features (wifi, máy lạnh, giao hàng, đậu xe), dietary (thuần chay, không gluten), cuisines (Huế, Hà Nội, miền Tây, Hoa, Nhật, Hàn, Thái, Ấn Độ, Ý), special (Michelin, view đẹp, pet-friendly)
- **890/890 locations categorized** (100%) via Vietnamese keyword matching against location names
- Junction tables `location_categories` and `location_tags` populated
- Scripts: `scripts/seed-categories-tags.py`, `scripts/patch-unmatched-categories.py`

### Location Form Improvements (Phase 7B)
- **Category multi-select** added to admin LocationForm (Popover + Command + Badge UI)
- **Tag multi-select** added with the same pattern
- Both selectors pre-load existing assignments when editing a location
- New hooks: `useLocationCategories`, `useLocationTags`, `useSaveLocationCategories`, `useSaveLocationTags`
- On create/update, junction table rows are saved automatically

### Rich Text Blog Editor (Phase 7C)
- **TipTap WYSIWYG editor** replaces raw HTML `<Textarea>` in PostForm
- Installed: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`
- Full toolbar: bold, italic, underline, strikethrough, code, H2/H3, bullet/ordered lists, blockquote, code block, horizontal rule, text alignment (left/center/right), link (add/remove), image (URL), undo/redo
- AI "Tạo dàn ý" button still works (injects HTML content into the editor)
- CSS for TipTap added to `app/globals.css`
- Component: `src/components/admin/posts/RichTextEditor.tsx`
- Dialog widened to `sm:max-w-4xl` for editor space

### Admin Table Pagination (Phase 7D)
- **Shared `DataTablePagination` component** (`src/components/admin/DataTablePagination.tsx`) with:
  - Total row count display ("Tổng cộng X bản ghi")
  - Page size selector (10/20/50/100)
  - Page indicator ("Trang X / Y")
  - First/Previous/Next/Last page buttons with icons
- Applied to **all 11 admin data tables**: locations, reviews, users, posts, collections, submissions, badges, levels, categories, tags, collection-categories
- Removed unused Button imports from all data tables

### ESLint Cleanup (Phase 7E)
- Fixed **all 30** `@typescript-eslint/no-explicit-any` warnings → **0 warnings remaining**
- Exported Zod-inferred types (`*FormValues`) from 8 form components
- Exported `Create*Data` types from 6 create hooks
- Properly typed admin form handlers, Supabase query results, icon maps, column helpers
- Fixed 4 `@typescript-eslint/no-unused-vars` warnings (error boundary params, unused imports)

### Collection Cover Images (Phase 7F)
- **18/18 watercolor cover images** generated via Gemini AI
- Each cover is a unique landscape composition matching the collection's theme (e.g., midnight food stalls for "Sài Gòn Không Ngủ", garden cafe for "Xanh Mướt Mắt")
- Uploaded to Supabase Storage at `location-images/collection-covers/{slug}.png`
- `cover_image_url` updated in DB for all 18 collections (replaced generic Unsplash images)
- Script: `scripts/generate-collection-covers.py`
- Local copies in `scripts/collection-covers-output/`
