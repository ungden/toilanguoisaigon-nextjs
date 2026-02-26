# Tôi là người Sài Gòn

Nền tảng khám phá ẩm thực và văn hóa Sài Gòn (TP.HCM). Tìm kiếm nhà hàng, quán ăn, quán cà phê, đọc review từ cộng đồng và khám phá các bộ sưu tập được tuyển chọn.

**Live:** [https://www.toilanguoisaigon.com](https://www.toilanguoisaigon.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database / Auth / Storage | Supabase (PostgreSQL + GoTrue Auth + S3 Storage + Edge Functions) |
| State Management | TanStack React Query v5 |
| UI Components | shadcn/ui (49 components) + Radix UI primitives |
| Styling | Tailwind CSS 3 + tailwindcss-animate |
| Forms | React Hook Form + Zod validation |
| Rich Text Editor | TipTap (blog post authoring) |
| AI | Google Gemini (via Supabase Edge Function + image generation) |
| Charts | Recharts |
| Deployment | Vercel |
| CI | GitHub Actions (lint + typecheck + build) |

## Cấu trúc dự án

```
toilanguoisaigon/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (metadata, providers, JsonLd)
│   ├── not-found.tsx             # 404 page (Vietnamese)
│   ├── sitemap.ts                # Dynamic sitemap from DB
│   ├── globals.css               # Tailwind + custom CSS
│   ├── (public)/                 # Route group: trang công khai
│   │   ├── page.tsx              # Homepage (hero, collections, locations, blog)
│   │   ├── layout.tsx            # Public layout (Header + Footer + CookieConsent)
│   │   ├── error.tsx             # Error boundary
│   │   ├── search/               # Tìm kiếm (pagination, category filter)
│   │   ├── place/[slug]/         # Chi tiết địa điểm (reviews, gallery, map)
│   │   ├── collection/[slug]/    # Chi tiết bộ sưu tập
│   │   ├── collections/          # Danh sách bộ sưu tập
│   │   ├── blog/                 # Danh sách + chi tiết bài viết
│   │   ├── about/                # Về chúng tôi
│   │   ├── contact/              # Form liên hệ (Supabase backend)
│   │   ├── faq/                  # 14 câu hỏi thường gặp
│   │   ├── privacy/              # Chính sách bảo mật (9 mục)
│   │   ├── terms/                # Điều khoản sử dụng (12 mục)
│   │   ├── login/                # Đăng nhập (Supabase Auth UI)
│   │   └── leaderboard/          # Bảng xếp hạng XP
│   ├── (protected)/              # Route group: cần đăng nhập
│   │   ├── layout.tsx            # Protected layout
│   │   ├── error.tsx             # Error boundary
│   │   ├── profile/              # Hồ sơ cá nhân
│   │   ├── my-notebook/          # Sổ tay (saved locations)
│   │   └── submit-location/      # Gợi ý địa điểm mới
│   ├── admin/                    # Admin dashboard
│   │   ├── layout.tsx            # Admin layout (sidebar)
│   │   ├── error.tsx             # Error boundary
│   │   ├── page.tsx              # Dashboard stats + activity feed + top locations
│   │   ├── locations/            # CRUD địa điểm (with category/tag pickers)
│   │   ├── posts/                # CRUD bài viết (TipTap rich text editor)
│   │   ├── collections/          # CRUD bộ sưu tập + playlist editing
│   │   ├── reviews/              # Quản lý đánh giá (edit + photo view)
│   │   ├── submissions/          # Duyệt gợi ý từ user
│   │   ├── users/                # Quản lý người dùng + role change
│   │   ├── categories/           # CRUD danh mục (20 food categories)
│   │   ├── tags/                 # CRUD thẻ tag (33 tags)
│   │   ├── collection-categories/# CRUD phân loại bộ sưu tập
│   │   ├── badges/               # CRUD huy hiệu
│   │   ├── levels/               # CRUD cấp độ XP
│   │   ├── xp-actions/           # Cấu hình điểm XP
│   │   ├── activity/             # XP logs, check-ins, user badges
│   │   ├── analytics/            # District distribution, monthly stats
│   │   ├── saved-locations/      # Most-saved locations ranking
│   │   └── import-maps/          # Google Maps import via Gemini
│   └── auth/
│       └── callback/             # Supabase auth callback
├── middleware.ts                  # Supabase session + route protection
├── src/
│   ├── components/
│   │   ├── ui/                   # 49 shadcn/ui components
│   │   ├── layout/               # Header, Footer, ThemeToggle, CookieConsent, AdminSidebar
│   │   ├── seo/                  # JsonLd (structured data)
│   │   ├── search/               # SearchResultCard
│   │   ├── collections/          # MysteryCard, MysteryLocationCards
│   │   ├── admin/                # AdminSidebar, DataTablePagination, entity CRUD components
│   │   ├── auth/                 # (empty - dead code removed)
│   │   ├── profile/              # Profile components
│   │   ├── leaderboard/          # Leaderboard components
│   │   ├── submission/           # Submission components
│   │   └── providers.tsx         # QueryClient + ThemeProvider + Toaster
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state (session, profile, role) + race condition guard
│   ├── hooks/data/               # 60+ React Query hooks (CRUD cho mọi entity)
│   ├── integrations/supabase/
│   │   └── client.ts             # Lazy singleton proxy (backward compat)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Canonical browser client (createBrowserClient)
│   │   │   ├── server.ts         # Server client (createServerClient)
│   │   │   └── middleware.ts     # Session update + route protection logic
│   │   └── utils.ts              # cn(), slugify() (Vietnamese-safe)
│   ├── types/
│   │   └── database.ts           # TypeScript types cho DB tables
│   └── utils/
│       ├── constants.ts          # FALLBACK_IMAGES, SITE_CONFIG, FEATURED_COLLECTIONS
│       ├── formatters.ts         # formatPriceRange(), formatOpeningHours()
│       ├── image.ts              # Supabase image transforms (getTransformedImageUrl)
│       ├── sanitize.ts           # HTML sanitizer cho blog content (chống XSS)
│       └── toast.ts              # showSuccess(), showError()
├── supabase/
│   └── functions/
│       └── gemini-assistant/     # Edge Function gọi Google Gemini AI
│           └── index.ts          # (Deno runtime - TypeScript errors expected)
├── public/
│   └── robots.txt                # Sitemap directive
├── .github/workflows/
│   └── ci.yml                    # GitHub Actions: lint + typecheck + build
├── next.config.ts                # Image remotePatterns (Supabase, Unsplash, dyad.ai)
├── eslint.config.mjs             # ESLint 9 flat config (TypeScript + React Hooks)
├── tailwind.config.ts            # Custom vietnam-* color palette
├── tsconfig.json                 # strict: false, paths: @/* -> src/*
└── package.json                  # Scripts: dev, build, start, lint
```

## Setup & Development

### Yêu cầu
- Node.js >= 18
- Supabase project (với các tables đã setup)

### Cài đặt

```bash
git clone https://github.com/ungden/toilanguoisaigon-nextjs.git
cd toilanguoisaigon-nextjs
npm install
```

### Environment Variables

Tạo file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Cho các Python scripts (`scripts/`), cần thêm:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ACCESS_TOKEN=your-personal-access-token
SUPABASE_PROJECT_REF=your-project-ref
GEMINI_API_KEY=your-gemini-api-key
```

> **QUAN TRONG:** KHONG BAO GIO hardcode secret/key/token vao source code. Luon dung environment variables.

### Chạy development

```bash
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint check
```

## Supabase Database Tables

| Table | Mô tả |
|-------|--------|
| `profiles` | User profiles (synced from auth.users) |
| `user_roles` | Role-based access (admin, moderator, user) |
| `locations` | Địa điểm (restaurants, cafés, etc.) |
| `reviews` | Đánh giá từ users |
| `collections` | Bộ sưu tập (curated lists) |
| `collection_categories` | Phân loại bộ sưu tập |
| `collection_locations` | Many-to-many: collections <-> locations |
| `categories` | 20 danh mục ẩm thực (Phở, Bún, Cơm, Cà phê, etc.) |
| `tags` | 33 thẻ tag (ăn sáng, bình dân, Michelin, pet-friendly, etc.) |
| `location_categories` | Many-to-many: locations <-> categories (890/890 = 100%) |
| `location_tags` | Many-to-many: locations <-> tags |
| `posts` | Blog posts |
| `saved_locations` | User bookmarks |
| `location_submissions` | User-submitted locations (pending review) |
| `levels` | XP level thresholds |
| `xp_actions` | XP reward config per action |
| `badges` | Achievement badges |

## Tính năng chính

- **Khám phá**: Homepage với hero, mystery cards, collections, trending locations, blog
- **Tìm kiếm**: Full-text search, category filter, pagination
- **Chi tiết địa điểm**: Gallery, map (OpenStreetMap), reviews, similar places, save/share
- **Bộ sưu tập**: Curated lists grouped by category, featured collections pinned
- **Blog**: Rich content with sanitized HTML, author info, cover images
- **Gamification**: XP system, levels, badges, leaderboard
- **Admin**: Full CRUD dashboard cho locations, posts, collections, reviews, users, badges, levels, xp-actions, submissions
- **AI**: Gemini-powered auto-generate descriptions/excerpts via Edge Function
- **Auth**: Supabase Auth (email + social), role-based route protection
- **Dark mode**: next-themes toggle
- **SEO**: Dynamic metadata, sitemap.xml, JSON-LD structured data, next/image optimization
- **PWA-ready**: Cookie consent, responsive design, mobile-first

## Scripts

### Development

```bash
npm run dev       # Next.js dev server
npm run build     # Production build (typecheck included)
npm run start     # Start production server
npm run lint      # ESLint (app/ + src/)
npx vitest run    # Chay test (50 tests, 3 files)
```

### Python Scripts (one-time data tasks)

Cac script nay can environment variables (xem phan Environment Variables). Chay bang `python3 scripts/<file>.py`.

| Script | Mo ta |
|--------|-------|
| `seed-categories-tags.py` | Seed 20 categories + 33 tags, auto-assign 711 locations |
| `patch-unmatched-categories.py` | Mo rong keyword matching, gan them 144 locations (tong 855) |
| `generate-category-artwork.py` | Tao 12 watercolor artwork qua Gemini AI, upload len Supabase Storage |
| `generate-collection-covers.py` | Tao 18 watercolor cover cho collections, upload + update DB |
