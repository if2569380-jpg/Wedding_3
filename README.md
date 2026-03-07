# Wedding Gallery App

Private wedding website built with Next.js and Supabase.

## Overview

This project includes:

- A public landing page at `/`
- Protected gallery at `/gallery` (login required)
- Protected admin panel at `/admin`
- Photo upload, edit, and delete workflows
- Gallery settings management
- Music management (local files and YouTube links)
- Global floating music player powered by `/api/music`

Authentication and data/storage are handled with Supabase.

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (Auth, Postgres, Storage)
- `motion` for animations

## Project Structure

- `app/` - routes, pages, API handlers
- `components/` - reusable UI components (including background music)
- `lib/` - Supabase client helpers
- `supabase/migrations/` - SQL schema and policies
- `public/music/` - local audio files for playlist

## Prerequisites

- Node.js 20+
- npm
- A Supabase project

## Environment Variables

Create `.env.local` in the project root.

Required by current code:

- `SUPABASE_URL` - Supabase project URL (server-side)
- `SUPABASE_SERVICE_ROLE_KEY` - service role key (server-side only)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (browser + middleware)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon key (browser + middleware)

Optional:

- `SUPABASE_GALLERY_BUCKET` - defaults to `gallery`
- `SUPABASE_LANDING_BUCKET` - defaults to `landing-public`
- `NEXT_PUBLIC_SUPABASE_LANDING_BUCKET` - defaults to `landing-public` (client-side fallback URL building)

Currently not used by this codebase:

- `GEMINI_API_KEY`
- `APP_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `FAMILY_EMAIL_ALLOWLIST`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Supabase Setup

1. Create a storage bucket named `gallery` (recommended: **private**).
2. Run SQL migrations in this order:
   - `supabase/migrations/001_create_gallery_images.sql`
   - `supabase/migrations/002_create_gallery_settings.sql`
   - `supabase/migrations/003_create_songs.sql`
   - `supabase/migrations/004_add_source_type_to_songs.sql`
   - `supabase/migrations/005_allow_custom_gallery_categories.sql`
   - `supabase/migrations/006_create_family_members.sql`
   - `supabase/migrations/007_public_thumbnails_private_full.sql`
   - `supabase/migrations/008_create_gallery_analytics_events.sql`
   - `supabase/migrations/009_public_landing_full_images.sql`
   - `supabase/migrations/010_create_landing_content_schema.sql`
3. In Supabase Auth, create users manually (email/password), since there is no sign-up page in this app.

## Run Locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`

## Routes

- `/` - landing page
- `/login` - Supabase email/password sign-in
- `/gallery` - private gallery (auth required)
- `/admin` - private admin dashboard (auth required)
- `/admin/upload` - upload photos
- `/admin/photos` - manage photos
- `/admin/landing` - manage landing story + polaroid collage
- `/admin/music` - manage playlist
- `/admin/settings` - gallery feature/settings controls

## API Endpoints

- `GET /api/gallery` - list gallery images (thumbnail-first, cursor pagination, supports filters)
- `GET /api/gallery/full-url?id=<id>` - get signed full-resolution URL for a single image
- `GET /api/gallery/settings` - fetch gallery settings
- `POST /api/gallery/settings` - update settings (auth required)
- `GET /api/landing-content` - fetch public landing story + collage content
- `GET /api/landing-images` - compatibility endpoint for signed legacy landing images / new public landing content
- `GET /api/admin/gallery-stats` - lightweight dashboard stats (auth required)
- `GET /api/admin/landing-content` - fetch editable landing story + collage content (auth required)
- `PUT /api/admin/landing-content` - upsert full landing story + collage snapshot (auth required)
- `POST /api/admin/landing-content/upload` - upload landing/collage image to public landing bucket (auth required)
- `POST /api/admin/landing-content/bootstrap` - one-time bootstrap from existing gallery images (auth required)
- `POST /api/admin/upload` - upload image + insert metadata (auth required)
- `PATCH /api/admin/photos` - edit photo metadata (auth required)
- `DELETE /api/admin/photos?id=<id>` - delete photo + storage files (auth required)
- `GET /api/music` - active playlist for frontend player
- `GET /api/admin/music` - list all songs for admin (auth required)
- `POST /api/admin/music` - add song (auth required)
- `PUT /api/admin/music/:id` - update song (auth required)
- `DELETE /api/admin/music/:id` - delete song (auth required)

## NPM Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - lint codebase
- `npm run clean` - clean Next.js artifacts

## Deployment Notes

- `netlify.toml` is included (Node 20, build command: `npm run build`).
- For Vercel/Netlify, set all required environment variables in dashboard settings.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it in client code.
- If you switch to a different Supabase project, ensure image host settings in `next.config.ts` still match the new storage domain.
- Keep `gallery` bucket private for protected gallery flow.
- Use `landing-public` bucket for landing page/public collage assets managed from admin.

## Security Notes

- `.env.local` is gitignored, but leaked keys should still be rotated immediately.
- Keep gallery storage private and serve photos via signed URLs (already implemented).
