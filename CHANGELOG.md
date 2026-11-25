# Changelog

Each change names the files it touches, so a site can diff just those (README, "Taking over fixes").

## 2026-11-25

- Galleries are editable: Bewerken under a gallery opens a Base UI Dialog to change alt texts, reorder, remove and add images; Toepassen updates the block in place (`block.set`). `src/admin/admin.tsx`, `src/admin/admin.css`.
- Galleries and scaled images: a "Galerij" button inserts a `gallery` block (`images`: src, alt, width, height each), shown as a square grid that opens in a lightbox (`public/gallery.js`, the dialog in `src/layout.tsx`). With `IMAGES` (Cloudflare Images) `/media/<id>?w=<width>` serves WebP at 480, 960, 1440, 1920 or 2560 px, cached at the edge, and images get a srcset. Uploads up to 20 MB. `src/media.ts`, `src/blocks.ts`, `src/index.tsx`, `src/layout.tsx`, `src/admin/admin.tsx`, `src/admin/admin.css`, `public/gallery.js` (new), `cloudflare.config.ts`, `README.md`.
- Images in the texts: an "Afbeelding" button uploads to R2 (`MEDIA`) and inserts a Portable Text `image` block (`src`, `alt`, `width`, `height`); public pages render it as `<img>`, served from `/media/<id>`. `src/media.ts` (new), `src/admin/index.tsx`, `src/admin/admin.tsx`, `src/admin/admin.css`, `src/blocks.ts`, `src/index.tsx`, `cloudflare.config.ts`, `README.md`.

## 2026-11-24

- The public pages follow worker-contact-form-example: Tailwind (src/styles/app.css, compiled by `pnpm run css`), the Alpine navbar from the pages in blocks.ts, Home, Over ons, Contact, Verzonden and 404, a placeholder logo, the form at `POST /api/contact`, Node 26. `src/index.tsx`, `src/layout.tsx`, `src/blocks.ts`, `src/contact.ts`, `src/styles/app.css`, `public/` (no `style.css`), `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.node-version`, `cloudflare.config.ts`.
- The starter, from the `hono-site` skill's template. All files.
- The admin is one full-width screen built with Base UI and plain CSS. `/admin/` redirects to the first text; a Select switches texts. The toolbar sticks to the top with Save at its end, and has bold, italic, underline, strike-through, H2, H3, quote, bullet and numbered lists, link, undo and redo. `src/admin/index.tsx`, `src/admin/admin.tsx` (was `src/admin/editor.tsx`), `src/admin/admin.css`, `src/blocks.ts` (exports `PortableTextBlock`), `vite.config.ts` (builds `/admin/admin.js` and `/admin/style.css`), `package.json` (`@base-ui/react`).
